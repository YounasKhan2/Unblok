import {AuthApi,AuthApiError,type SessionUser} from '../api/authApi';
export interface SessionState {status:'loading'|'anonymous'|'authenticated'|'unavailable';user:SessionUser|null;pending:boolean;error?:string|undefined}
export class SessionStore {
  private state:SessionState={status:'loading',user:null,pending:false};
  private listeners=new Set<()=>void>();
  private version=0;
  private restoring:Promise<void>|undefined;
  constructor(readonly api:AuthApi) {api.onUnauthorized=()=>this.clear();}
  snapshot=()=>this.state;
  subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>{this.listeners.delete(listener);};};
  private publish(state:SessionState) {this.state=state;for(const listener of this.listeners)listener();}
  clear() {this.version++;this.api.clear();this.publish({status:'anonymous',user:null,pending:this.state.pending});}
  refresh=():Promise<void>=>{
    if(this.restoring)return this.restoring;
    const version=this.version;
    this.restoring=this.api.me().then(({user})=>{
      if(version===this.version)this.publish({...this.state,status:'authenticated',user,error:undefined});
    },error=>{
      if(version===this.version)this.publish({...this.state,status:error instanceof AuthApiError&&error.status===401?'anonymous':'unavailable',user:null,error:error instanceof Error?error.message:'Unblok is unavailable.'});
    }).finally(()=>{this.restoring=undefined;});return this.restoring;
  };
  async submit<T>(run:()=>Promise<T>):Promise<T> {
    if(this.state.pending)throw new AuthApiError(409,'Please wait for your current request to finish.');
    this.version++;this.publish({...this.state,pending:true});
    try{return await run();}finally{this.publish({...this.state,pending:false});}
  }
  async login(input:{email:string;password:string}) {return this.submit(async()=>{
    await this.api.login(input);
    const {user}=await this.api.me();this.publish({status:'authenticated',user,pending:true});
  });}
  async logout(all=false) {return this.submit(async()=>{
    try{const result=await this.api.logout(all);this.clear();return result;}
    catch(error){if(error instanceof AuthApiError&&error.status===401){this.clear();return null;}throw error;}
  });}
  async reset(input:{email:string;token:string;password:string}) {return this.submit(async()=>{
    await this.api.confirmRecovery(input);this.clear();
  });}
  async verify(token:string) {return this.submit(async()=>{
    await this.api.confirmVerification(token);
    const status=await this.api.verificationStatus();
    if(!status.emailVerified)throw new AuthApiError(400,'We couldn’t confirm that code. Check your email or request a new one.');
    const {user}=await this.api.me();this.publish({status:'authenticated',user,pending:true});
  });}
}
