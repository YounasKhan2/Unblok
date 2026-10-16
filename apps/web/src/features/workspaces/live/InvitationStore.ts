import {AdministrationApi,type RecipientPreview} from './AdministrationApi';
import {workspaceInvitationAcceptSchema} from '@unblok/contracts';
import {AuthApiError} from '../../auth/api/authApi';
import {SessionStore} from '../../auth/session/SessionStore';
import {WorkspaceStore} from './WorkspaceStore';
import {MembersApi} from './MembersApi';
import type {AcceptanceJournal} from './InviteJournal';
export function takeInvitationLink(location:Pick<Location,'pathname'|'hash'|'search'>,replace:(path:string)=>void){
 if(location.pathname!=='/invite')return '';const token=new URLSearchParams(location.hash.slice(1)).get('token')??'';
 if(location.hash||location.search)replace('/invite');return workspaceInvitationAcceptSchema.safeParse({token}).success?token:'';
}
export class InvitationStore {
 private token='';private key='';private actor='';private version=0;private generation=-1;private logout=0;private controller?:AbortController;private listeners=new Set<()=>void>();
 private previewIdentity='';
 private previewController?:AbortController;
 private state={hasProof:false,busy:false,acknowledged:false,error:'',notice:'',preview:null as RecipientPreview|null};
 constructor(private readonly session:SessionStore,private readonly workspaces:WorkspaceStore,private readonly api=new MembersApi(session.api),private readonly newKey=()=>crypto.randomUUID(),private readonly journal?:AcceptanceJournal){this.logout=session.explicitLogoutGeneration();}
 snapshot=()=>this.state;subscribe=(fn:()=>void)=>{this.listeners.add(fn);return()=>{this.listeners.delete(fn);};};
 private publish(change:Partial<typeof this.state>){this.state={...this.state,...change};for(const fn of this.listeners)fn();}
 start(){this.sync();return this.session.subscribe(()=>this.sync());}
 private sync(){const s=this.session.snapshot(),actor=s.status==='authenticated'?s.user!.id:'';
  if(this.logout!==this.session.explicitLogoutGeneration()||(actor&&this.actor&&actor!==this.actor)){try{this.journal?.clear();}catch{}this.clear();}
  this.logout=this.session.explicitLogoutGeneration();if(actor&&this.token&&!this.actor)this.actor=actor;
  const previewIdentity=JSON.stringify([actor,this.session.generation(),s.pending,s.user?.emailVerified]);
  if(this.generation!==this.session.generation()||s.status!=='authenticated'||this.previewIdentity!==previewIdentity){this.previewIdentity=previewIdentity;this.generation=this.session.generation();this.version++;this.controller?.abort();this.previewController?.abort();this.publish({busy:false,preview:null});if(actor&&!s.pending&&s.user?.emailVerified&&this.token)void this.preview();}
 }
 clear(){this.previewController?.abort();this.version++;this.controller?.abort();this.token='';this.key='';this.actor='';this.publish({hasProof:false,busy:false,acknowledged:false,error:'',notice:'',preview:null});}
 capture(token:string){if(this.state.busy)return false;if(!workspaceInvitationAcceptSchema.safeParse({token}).success){this.publish({error:'Paste the complete invitation code from your email.'});return false;}this.clear();this.token=token;this.key=this.newKey();this.actor=this.session.snapshot().status==='authenticated'?this.session.snapshot().user!.id:'';this.publish({hasProof:true});if(this.session.snapshot().user?.emailVerified)void this.preview();return true;}
 async preview(){const s=this.session.snapshot();if(s.status!=='authenticated'||s.pending||!s.user?.emailVerified||!this.token)return;this.previewController?.abort();const v=this.version,c=this.previewController=new AbortController();try{const preview=await new AdministrationApi(this.session.api).preview(this.token,c.signal);if(v===this.version&&!c.signal.aborted)this.publish({preview});}catch{if(v===this.version&&!c.signal.aborted)this.publish({preview:null});}}
 async accept(){const s=this.session.snapshot();if(!this.token||this.state.busy||this.state.acknowledged||s.status!=='authenticated'||s.pending||!s.user?.emailVerified)return;
  this.previewController?.abort();this.sync();if(this.actor!==s.user.id||!this.token)return;const v=this.version,c=this.controller=new AbortController();this.publish({busy:true,error:'',notice:''});
  try{
   const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(this.token)))).map(v=>v.toString(16).padStart(2,'0')).join('');
   if(v!==this.version||c.signal.aborted)return;
   try{this.key=this.journal?.read(this.actor,hash)??this.key;this.journal?.write(this.actor,hash,this.key);}catch{this.publish({error:'We couldn’t restore a safe retry. Keep your original invitation and try again when browser storage is available.'});return;}
   await this.api.accept(this.token,this.key,c.signal);if(v!==this.version||c.signal.aborted)return;this.publish({acknowledged:true,notice:'Request received. Check your workspaces below. If the expected workspace is missing, the invitation may be invalid, expired, revoked or for a different account. Ask the sender for a new invitation.'});await this.reconcile();}
  catch(e){if(v===this.version&&!c.signal.aborted)this.publish({error:e instanceof AuthApiError?e.status===409?'We couldn’t confirm this request. Retry keeps the same request.':e.message:'We couldn’t confirm the result. Retry keeps the same request.'});}
  finally{if(v===this.version&&!c.signal.aborted){this.publish({busy:false});void this.preview();}}
 }
 async reconcile(){const s=this.session.snapshot();if(s.status!=='authenticated'||s.user!.id!==this.actor)return;const generation=this.session.generation();await this.workspaces.load();if(generation!==this.session.generation())return;const selected=this.workspaces.snapshot().selected;if(selected)await this.workspaces.select(selected);}
}
