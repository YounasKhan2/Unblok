import { csrfResponseSchema, meResponseSchema, logoutResponseSchema, signupResponseSchema,
  signupSchema, loginSchema, emailVerificationConfirmSchema, emailVerificationStatusSchema,
  passwordRecoveryRequestSchema, passwordRecoveryConfirmSchema } from '@unblok/contracts';
export type SessionUser = ReturnType<typeof meResponseSchema.parse>['user'];
export class AuthApiError extends Error {
  constructor(readonly status:number, message:string, readonly retryAfter?:number) {super(message);}
}
type Schema<T> = {parse(value:unknown):T};
type Transport = (...args:Parameters<typeof fetch>)=>ReturnType<typeof fetch>;
export function authOrigin(value:string, production:boolean) {
  if(!value) return '';
  const url=new URL(value);
  if(url.origin!==value || url.username || url.password || (url.protocol!=='https:' &&
    (production || url.protocol!=='http:' || !['localhost','127.0.0.1'].includes(url.hostname)))) throw new Error('Invalid authentication API origin');
  return value;
}
export class AuthApi {
  private csrf:string|undefined;
  private busy=false;
  private epoch=0;
  onUnauthorized=()=>{};
  constructor(private readonly origin='',private readonly transport:Transport=(...args)=>fetch(...args)) {}
  clear() {this.csrf=undefined;this.epoch++;}
  invalidateRequests() {this.epoch++;}
  private async request<T>(path:string,schema:Schema<T>,body?:unknown):Promise<T> {
    const epoch=this.epoch;
    let response:Response;
    try {response=await this.transport(this.origin+'/api/v1/auth/'+path,{
      method:body===undefined?'GET':'POST',credentials:'include',cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10000),
      headers:body===undefined?{}:{'Content-Type':'application/json','X-CSRF-Token':this.csrf!},
      ...(body===undefined?{}:{body:JSON.stringify(body)})});}
    catch {throw new AuthApiError(0,'We couldn’t confirm the result. Check your account before trying again.');}
    if(!response.ok) {
      if([401,403].includes(response.status) && epoch===this.epoch) {this.csrf=undefined;if(response.status===401)this.onUnauthorized();}
      const retry=Number(response.headers.get('retry-after'));
      const messages:Record<number,string>={400:'Check the information you entered.',401:'Your session ended or the sign-in details were incorrect.',403:'Refresh this page before trying again.',429:'Too many attempts. Please wait before trying again.',503:'Unblok is temporarily unavailable. Please try again later.'};
      throw new AuthApiError(response.status,messages[response.status]??'We couldn’t complete your request.',Number.isFinite(retry)&&retry>0?retry:undefined);
    }
    try {return schema.parse(await response.json());} catch {throw new AuthApiError(503,'We couldn’t validate the response. Please try again later.');}
  }
  me() {return this.request('me',meResponseSchema);}
  verificationStatus() {return this.request('email-verification/status',emailVerificationStatusSchema);}
  private async mutate<T>(run:()=>Promise<T>) {
    if(this.busy) throw new AuthApiError(409,'Please wait for your current request to finish.');
    this.busy=true;this.epoch++;
    try {
      // Bootstrap on first use or after rejection; login replaces the token.
      // No automatic
      // mutation retry, even on401/403/timeout or unknown server commit outcome.
      if(!this.csrf)this.csrf=(await this.request('csrf',csrfResponseSchema)).csrf;
      return await run();
    }finally{this.busy=false;}
  }
  signup(input:ReturnType<typeof signupSchema.parse>) {return this.mutate(()=>this.request('signup',signupResponseSchema,signupSchema.parse(input)));}
  login(input:ReturnType<typeof loginSchema.parse>) {return this.mutate(async()=>{
    const result=await this.request('login',csrfResponseSchema,loginSchema.parse(input));this.csrf=result.csrf;return result;
  });}
  logout(all=false) {return this.mutate(()=>this.request(all?'logout-all':'logout',logoutResponseSchema,{}));}
  requestVerification() {return this.mutate(()=>this.request('email-verification/request',signupResponseSchema,{}));}
  confirmVerification(token:string) {return this.mutate(()=>this.request('email-verification/confirm',signupResponseSchema,emailVerificationConfirmSchema.parse({token})));}
  requestRecovery(email:string) {return this.mutate(()=>this.request('password-recovery/request',signupResponseSchema,passwordRecoveryRequestSchema.parse({email})));}
  confirmRecovery(input:ReturnType<typeof passwordRecoveryConfirmSchema.parse>) {return this.mutate(()=>this.request('password-recovery/confirm',signupResponseSchema,passwordRecoveryConfirmSchema.parse(input)));}
}
