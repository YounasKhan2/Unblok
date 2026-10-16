import {AuthApi,AuthApiError,type SessionUser} from '../api/authApi';
export interface SessionState {status:'loading'|'anonymous'|'authenticated'|'unavailable';user:SessionUser|null;pending:boolean;sessionExpired?:boolean;error?:string|undefined}
export class SessionStore {
  private state:SessionState={status:'loading',user:null,pending:false};
  private listeners=new Set<()=>void>();
  private version=0;
  private logoutVersion=0;
  private restoring:Promise<void>|undefined;
  constructor(readonly api:AuthApi) {api.onUnauthorized=()=>this.clear(this.state.status==='authenticated'||!!this.state.user||!!this.state.sessionExpired);}
  snapshot=()=>this.state;
  generation=()=>this.version;
  explicitLogoutGeneration=()=>this.logoutVersion;
  subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>{this.listeners.delete(listener);};};
  private publish(state:SessionState) {this.state=state;for(const listener of this.listeners)listener();}
  private advance() {this.version++;this.restoring=undefined;this.api.invalidateRequests();}
  clear(sessionExpired=false) {this.advance();this.api.clear();this.publish({status:'anonymous',user:null,pending:this.state.pending,sessionExpired});}
  refresh=():Promise<void>=>{
    if(this.state.pending)return Promise.resolve();
    return this.restore();
  };
  private restore():Promise<void> {
    if(this.restoring)return this.restoring;
    const version=this.version;
    const restoring=this.api.me().then(({user})=>{
      if(version===this.version)this.publish({...this.state,status:'authenticated',user,error:undefined});
    },error=>{
      if(version===this.version)this.publish({...this.state,status:'unavailable',error:error instanceof Error?error.message:'Unblok is unavailable.'});
    }).finally(()=>{if(this.restoring===restoring)this.restoring=undefined;});
    this.restoring=restoring;return restoring;
  }
  async submit<T>(run:()=>Promise<T>):Promise<T> {
    if(this.state.pending)throw new AuthApiError(409,'Please wait for your current request to finish.');
    this.advance();this.publish({...this.state,pending:true});
    try{return await run();}finally{this.publish({...this.state,pending:false});}
  }
  async login(input:{email:string;password:string}) {return this.submit(async()=>{
    await this.api.login(input);
    const {user}=await this.api.me();this.publish({status:'authenticated',user,pending:true});
  });}
  async logout(all=false) {return this.submit(async()=>{
    // Fence in-flight client work even on an unknown sign-out response. Each consumer
    // owns its journal policy; uncertain administration intents survive for explicit reconciliation.
    this.logoutVersion++;this.publish({...this.state});
    try{const result=await this.api.logout(all);this.clear();return result;}
    catch(error){if(error instanceof AuthApiError&&error.status===401){this.clear();return null;}throw error;}
  });}
  async reset(input:{email:string;token:string;password:string}) {return this.submit(async()=>{
    await this.api.confirmRecovery(input);await this.restore();
  });}
  async verify(token:string) {return this.submit(async()=>{
    await this.api.confirmVerification(token);
    const status=await this.api.verificationStatus();
    if(!status.emailVerified)throw new AuthApiError(400,'We couldn’t confirm that code. Check your email or request a new one.');
    const {user}=await this.api.me();this.publish({status:'authenticated',user,pending:true});
  });}
}
