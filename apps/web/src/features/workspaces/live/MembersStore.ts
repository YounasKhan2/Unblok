import {AuthApiError} from '../../auth/api/authApi';
import {SessionStore} from '../../auth/session/SessionStore';
import {WorkspaceStore} from './WorkspaceStore';
import {MembersApi,type MembersPage,type MemberFilter,type MemberSort,type InviteInput} from './MembersApi';
import type {InviteJournal,InviteAttempt} from './InviteJournal';
export interface MembersState {page:MembersPage|null;loading:boolean;status:MemberFilter;sort:MemberSort;error:string;stale:boolean;allowed:boolean;canInvite:boolean;sending:boolean;attempt:InviteAttempt|undefined;notice:string;inviteError:string;blocked:boolean}
const empty=():MembersState=>({page:null,loading:false,status:'ALL',sort:'joined_asc',error:'',stale:false,allowed:false,canInvite:false,sending:false,attempt:undefined,notice:'',inviteError:'',blocked:false});
export class MembersStore {
 private state=empty();private listeners=new Set<()=>void>();private identity='';private actor='';private logout=0;private version=0;private read?:AbortController;private mutation?:AbortController;
 constructor(private readonly session:SessionStore,private readonly workspaces:WorkspaceStore,private readonly api=new MembersApi(session.api),private readonly journal?:InviteJournal,private readonly key=()=>crypto.randomUUID()){this.logout=session.explicitLogoutGeneration();}
 snapshot=()=>this.state;subscribe=(fn:()=>void)=>{this.listeners.add(fn);return()=>{this.listeners.delete(fn);};};
 private publish(change:Partial<MembersState>){this.state={...this.state,...change};for(const fn of this.listeners)fn();}
 start(){this.sync();const off=[this.session.subscribe(()=>this.sync()),this.workspaces.subscribe(()=>this.sync())];return()=>{off.forEach(f=>f());this.read?.abort();this.mutation?.abort();};}
 private sync(){const s=this.session.snapshot(),w=this.workspaces.snapshot(),actor=s.status==='authenticated'?s.user!.id:'';
  if(this.logout!==this.session.explicitLogoutGeneration()||(actor&&this.actor&&actor!==this.actor)){try{this.journal?.clear();}catch{}this.actor='';}
  this.logout=this.session.explicitLogoutGeneration();if(actor)this.actor=actor;
  const c=w.context,allowed=!!actor&&!s.pending&&!!c&&w.selected===c.workspace.id&&c.self.role==='ADMIN'&&c.self.membershipStatus==='ACTIVE',canInvite=allowed&&c!.workspace.status==='ACTIVE'&&!!s.user?.emailVerified;
  const identity=allowed?`${actor}:${this.session.generation()}:${c!.workspace.id}:${c!.self.membershipId}:${c!.self.role}:${c!.self.membershipStatus}:${c!.workspace.status}:${canInvite}`:'';
  if(identity===this.identity)return;this.identity=identity;this.version++;this.read?.abort();this.mutation?.abort();this.state=empty();this.publish({allowed,canInvite});
  if(allowed){try{this.publish({attempt:this.journal?.read(actor,c!.workspace.id)});}catch{this.publish({blocked:true,inviteError:'We couldn’t restore the previous request. Reopen this tab after checking your invitation before starting another.'});}void this.load();}
 }
 private current(version:number,c:AbortController){return !!this.identity&&version===this.version&&!c.signal.aborted;}
 async load(next=false){if(!this.state.allowed)return;const after=next?this.state.page?.page.nextCursor:undefined;if(next&&!after)return;
  this.read?.abort();const c=this.read=new AbortController(),v=this.version,id=this.workspaces.snapshot().context!.workspace.id;this.publish({loading:true,page:null,error:'',stale:false});
  try{const page=await this.api.list(id,this.state.status,this.state.sort,c.signal,after??undefined);if(this.current(v,c))this.publish({page});}
  catch(e){if(this.current(v,c)){const a=e instanceof AuthApiError?e:undefined;this.publish({error:a?.status===404?'Member access is no longer available.':a?.code==='CURSOR_STALE'?'The member list changed. Reload it to continue.':a?.message??'We couldn’t load members. Please try again.',stale:a?.code==='CURSOR_STALE',allowed:a?.status===404?false:this.state.allowed,canInvite:a?.status===404?false:this.state.canInvite});if(a?.status===404)this.workspaces.invalidateSelection(id);}}
  finally{if(this.current(v,c))this.publish({loading:false});}
 }
 filter(status:MemberFilter,sort:MemberSort){this.publish({status,sort});void this.load();}
 async invite(input:InviteInput){if(!this.state.canInvite||this.state.sending||this.state.blocked)return;
  const s=this.session.snapshot(),id=this.workspaces.snapshot().context!.workspace.id,attempt=this.state.attempt??{actor:s.user!.id,workspace:id,key:this.key(),body:input};
  if(JSON.stringify(attempt.body)!==JSON.stringify(input))return;
  try{this.journal?.write(attempt);}catch{this.publish({blocked:true,inviteError:'We couldn’t save this request for a safe retry. Please try again later.'});return;}
  const c=this.mutation=new AbortController(),v=this.version;this.publish({attempt,sending:true,inviteError:'',notice:''});
  try{await this.api.invite(id,attempt.body,attempt.key,c.signal);if(!this.current(v,c))return;this.journal?.remove(attempt.actor,id);this.publish({attempt:undefined,notice:'Request received. Email delivery is not guaranteed. Ask the recipient to check their inbox and spam folder.'});}
  catch(e){if(this.current(v,c)){const a=e instanceof AuthApiError?e:undefined;this.publish({inviteError:a?.status===409?'We couldn’t confirm this request. Retry keeps the same invitation request.':a?.message??'We couldn’t confirm delivery. Retry keeps the same request.'});if(a?.status===404){this.publish({canInvite:false});this.workspaces.invalidateSelection(id);}if(a?.status===400){try{this.journal?.remove(attempt.actor,id);this.publish({attempt:undefined});}catch{this.publish({blocked:true});}}}}
  finally{if(this.current(v,c))this.publish({sending:false});}
 }
}
