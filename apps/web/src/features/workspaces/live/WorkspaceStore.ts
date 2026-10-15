import {createWorkspaceSchema} from '@unblok/contracts';
import {AuthApiError} from '../../auth/api/authApi';
import {SessionStore} from '../../auth/session/SessionStore';
import {WorkspaceApi,type WorkspacePage,type WorkspaceDetail,type WorkspaceInput} from './WorkspaceApi';
import type {AttemptJournal,CreationAttempt as Attempt} from './AttemptJournal';
export interface WorkspaceState {page:WorkspacePage|null;context:WorkspaceDetail|null;selected:string|null;loading:boolean;selecting:boolean;creating:boolean;error?:string;contextError?:string;creationError?:string;attempt?:Attempt;stale:boolean;reconciliationBlocked?:boolean}
const empty=():WorkspaceState=>({page:null,context:null,selected:null,loading:false,selecting:false,creating:false,stale:false});
export class WorkspaceStore {
  private state=empty();private listeners=new Set<()=>void>();private version=0;private identity='';private logoutVersion=0;
  private listing?:AbortController;private selecting?:AbortController;private creating?:AbortController;private unsubscribe?:()=>void;
  constructor(private readonly session:SessionStore,private readonly api=new WorkspaceApi(session.api),private readonly newKey=()=>crypto.randomUUID(),private readonly journal?:AttemptJournal){this.logoutVersion=session.explicitLogoutGeneration();}
  snapshot=()=>this.state;
  subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>{this.listeners.delete(listener);};};
  private publish(change:Partial<WorkspaceState>){this.state={...this.state,...change};for(const listener of this.listeners)listener();}
  start(){this.sync();this.unsubscribe=this.session.subscribe(()=>this.sync());return()=>{this.unsubscribe?.();this.identity='';this.reset();};}
  private reset(){this.version++;this.listing?.abort();this.selecting?.abort();this.creating?.abort();this.state=empty();for(const listener of this.listeners)listener();}
  private sync(){const logoutVersion=this.session.explicitLogoutGeneration();
    if(logoutVersion!==this.logoutVersion){this.logoutVersion=logoutVersion;try{this.journal?.write('');}catch{}this.identity='';this.reset();}
    const s=this.session.snapshot(),identity=s.status==='authenticated'&&!s.pending?`${s.user!.id}:${this.session.generation()}`:'';
    if(identity!==this.identity){this.identity=identity;this.reset();
      if(identity){try{this.publish({attempt:this.journal?.read(s.user!.id)});}catch{this.publish({reconciliationBlocked:true,creationError:'We couldn’t restore your previous request. Check your workspaces before creating another.'});}void this.load();}}}
  private current(version:number,controller:AbortController){return !!this.identity&&version===this.version&&!controller.signal.aborted;}
  abandonAttempt(){if(!this.identity||this.state.creating)return;try{this.journal?.write(this.session.snapshot().user!.id);}catch{return;}this.publish({attempt:undefined,creationError:undefined,reconciliationBlocked:false});}
  async load(next=false){
    if(!this.identity||this.state.creating)return;
    const cursor=next?this.state.page?.page.nextCursor:undefined;if(next&&!cursor)return;
    this.listing?.abort();const controller=this.listing=new AbortController(),version=this.version;
    this.publish({loading:true,error:undefined,stale:false,...(!next?{page:null}:{})});
    try{const page=await this.api.list(controller.signal,cursor??undefined);if(this.current(version,controller))this.publish({page});}
    catch(error){if(this.current(version,controller))this.publish({page:null,error:error instanceof AuthApiError?error.message:'We couldn’t load your workspaces. Please try again.',stale:error instanceof AuthApiError&&error.code==='CURSOR_STALE'});}
    finally{if(this.current(version,controller))this.publish({loading:false});}
  }
  invalidateSelection(id:string){if(this.state.selected!==id)return;this.selecting?.abort();this.publish({selected:null,context:null,page:null,selecting:false,contextError:'This workspace is no longer available.'});}
  async select(id:string){
    this.sync();if(!this.identity)return;this.listing?.abort();this.selecting?.abort();const controller=this.selecting=new AbortController(),version=this.version;
    this.publish({selected:id,context:null,selecting:true,loading:false,contextError:undefined});
    try{const context=await this.api.context(id,controller.signal);if(this.current(version,controller))this.publish({context});}
    catch(error){if(this.current(version,controller))this.publish({selected:null,context:null,contextError:error instanceof AuthApiError?error.message:'We couldn’t open this workspace. Try selecting it again.',page:error instanceof AuthApiError&&error.status===404?null:this.state.page});}
    finally{if(this.current(version,controller)){this.publish({selecting:false});if(this.state.context&&!this.state.page&&!this.state.error)void this.load();}}
  }
  async create(input:WorkspaceInput):Promise<string|null>{
    if(!this.identity||this.state.creating||this.state.reconciliationBlocked)return null;
    const body=createWorkspaceSchema.parse(input),attempt=this.state.attempt??{key:this.newKey(),body};
    if(JSON.stringify(body)!==JSON.stringify(attempt.body))throw new Error('Retry the original request before changing its details.');
    try{this.journal?.write(this.session.snapshot().user!.id,attempt);}catch{this.publish({reconciliationBlocked:true,creationError:'We couldn’t save this request for a safe retry. Please try again.'});return null;}
    this.listing?.abort();this.selecting?.abort();const controller=this.creating=new AbortController(),version=this.version;
    this.publish({attempt,creating:true,loading:false,selecting:false,creationError:undefined});
    let created=false;
    try{const result=await this.api.create(attempt.body,attempt.key,controller.signal);if(!this.current(version,controller))return null;
      try{this.journal?.write(this.session.snapshot().user!.id);}catch{}created=true;this.publish({attempt:undefined,selected:result.workspace.id,context:null,page:null});return result.workspace.id;
    }catch(error){if(this.current(version,controller)){if(error instanceof AuthApiError&&error.status===400){try{this.journal?.write(this.session.snapshot().user!.id);}catch{}}
      this.publish({creationError:error instanceof AuthApiError?error.message:'We couldn’t confirm creation. Retry this request to check its result.',...(error instanceof AuthApiError&&error.status===400?{attempt:undefined}:{})});}return null;
    }finally{if(this.current(version,controller)){this.publish({creating:false});if(created)void this.load();}}
  }
}
