import {MembersApi} from './MembersApi';
import type {InviteJournal,InviteAttempt} from './InviteJournal';
import {administrationInviteSchema,administrationRoleSchema} from '@unblok/contracts';
import {AuthApiError} from '../../auth/api/authApi';
import {SessionStore} from '../../auth/session/SessionStore';
import {WorkspaceStore} from './WorkspaceStore';
import {AdministrationApi,type MemberPage,type InvitationPage,type TeamPage,type Filters,type Operation} from './AdministrationApi';
type Attempt=Operation&{membership:string};
const slot='unblok:pending-administration:v1';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
function parseAttempt(value:unknown):Attempt{
 if(!value||typeof value!=='object')throw Error('Invalid request');const r=value as Attempt;
 if(Object.keys(r).some(k=>!['action','target','body','match','key','actor','workspace','membership'].includes(k))||![r.key,r.actor,r.workspace,r.membership].every(x=>typeof x==='string'&&uuid.test(x)))throw Error('Invalid request');
 if(r.action==='invite'){if(r.target||r.match)throw Error('Invalid request');return {...r,body:administrationInviteSchema.parse(r.body)};}
 if(!r.target||!uuid.test(r.target)||!['resend','revoke','role','remove'].includes(r.action))throw Error('Invalid request');
 const pattern=r.action==='role'||r.action==='remove'?/^"[1-9][0-9]{0,18}"$/:/^"inv2-[0-9a-f-]{36}-[0-9a-f]{64}"$/;if(!r.match||!pattern.test(r.match))throw Error('Invalid request');
 if(r.action==='role')return {...r,body:administrationRoleSchema.parse(r.body)};if(r.body!==undefined)throw Error('Invalid request');return r;
}
export class AdministrationJournal {
 constructor(private readonly storage:Pick<Storage,'getItem'|'setItem'|'removeItem'>){}
 private rows(){const raw=this.storage.getItem(slot);if(!raw)return [];if(raw.length>40000)throw Error('Invalid journal');const rows:unknown=JSON.parse(raw);if(!Array.isArray(rows)||rows.length>8)throw Error('Invalid journal');return rows.map(parseAttempt);}
 read(actor:string,workspace:string,membership:string){return this.rows().find(r=>r.actor===actor&&r.workspace===workspace&&r.membership===membership);}
 write(op:Attempt){const rows=this.rows().filter(r=>r.actor===op.actor&&r.workspace!==op.workspace);if(rows.length>=8)throw Error('Pending request limit');this.storage.setItem(slot,JSON.stringify([...rows,parseAttempt(op)]));}
 remove(op:Attempt){this.storage.setItem(slot,JSON.stringify(this.rows().filter(r=>r.actor===op.actor&&r.workspace!==op.workspace)));}
 clear(){this.storage.removeItem(slot);}
}
const initial=()=>({allowed:false,canMutate:false,loading:false,busy:false,error:'',notice:'',members:null as MemberPage|null,invitations:null as InvitationPage|null,teams:null as TeamPage|null,filters:{status:'ACTIVE',search:'',role:'ALL',teamId:'ALL'} as Filters,attempt:undefined as Attempt|undefined,legacyAttempt:undefined as InviteAttempt|undefined,blocked:false});
export class AdministrationStore {
 private state=initial();private listeners=new Set<()=>void>();private identity='';private actor='';private logout=0;private version=0;private reads=new Set<AbortController>();private mutation?:AbortController;
 constructor(private readonly session:SessionStore,private readonly workspace:WorkspaceStore,private readonly api=new AdministrationApi(session.api),private readonly journal?:AdministrationJournal,private readonly key=()=>crypto.randomUUID(),private readonly legacyJournal?:InviteJournal){this.logout=session.explicitLogoutGeneration();}
 snapshot=()=>this.state;subscribe=(fn:()=>void)=>{this.listeners.add(fn);return()=>{this.listeners.delete(fn);};};
 private publish(change:Partial<ReturnType<typeof initial>>){this.state={...this.state,...change};this.listeners.forEach(f=>f());}
 start(){this.sync();const stops=[this.session.subscribe(()=>this.sync()),this.workspace.subscribe(()=>this.sync())];return()=>{stops.forEach(f=>f());this.identity='';this.invalidate();this.state=initial();};}
 private invalidate(){this.version++;this.reads.forEach(c=>c.abort());this.reads.clear();this.mutation?.abort();}
 private sync(){const s=this.session.snapshot(),w=this.workspace.snapshot(),c=w.context,actor=s.status==='authenticated'?s.user!.id:'';
  if(this.logout!==this.session.explicitLogoutGeneration()||(actor&&this.actor&&actor!==this.actor)){try{this.journal?.clear();this.legacyJournal?.clear();}catch{}this.actor='';}
  this.logout=this.session.explicitLogoutGeneration();if(actor)this.actor=actor;
  const allowed=!!actor&&!s.pending&&!!s.user?.emailVerified&&!!c&&!w.selecting&&w.selected===c.workspace.id&&c.self.role==='ADMIN'&&c.self.membershipStatus==='ACTIVE';
  const identity=allowed?JSON.stringify([actor,this.session.generation(),c!.workspace.id,c!.workspace.status,c!.self.membershipId,c!.self.role,c!.self.membershipStatus,s.user?.emailVerified]):'';
  if(identity===this.identity)return;this.identity=identity;this.invalidate();this.state=initial();const canMutate=allowed&&c!.workspace.status==='ACTIVE'&&!!s.user?.emailVerified;this.publish({allowed,canMutate});
  if(allowed){try{this.publish({attempt:this.journal?.read(actor,c!.workspace.id,c!.self.membershipId),legacyAttempt:this.legacyJournal?.read(actor,c!.workspace.id)});}catch{this.publish({blocked:true,error:'The previous request could not be restored safely. Do not submit another change until it is reconciled.'});}void this.load();}
 }
 private current(v:number,c:AbortController){return !!this.identity&&v===this.version&&!c.signal.aborted;}
 private failure(e:unknown){const a=e instanceof AuthApiError?e:undefined;this.publish({error:a?.message??'Could not load Workspace administration. Try again.'});if(a?.status===404){const id=this.workspace.snapshot().context?.workspace.id;if(id)this.workspace.invalidateSelection(id);}}
 async load(){if(!this.state.allowed)return;this.reads.forEach(c=>c.abort());this.reads.clear();const c=new AbortController(),v=this.version,id=this.workspace.snapshot().context!.workspace.id;this.reads.add(c);this.publish({loading:true,error:'',members:null,invitations:null,teams:null});
  try{const [members,invitations,teams]=await Promise.all([this.api.members(id,this.state.filters,c.signal),this.api.invitations(id,c.signal),this.api.teams(id,c.signal)]);if(this.current(v,c))this.publish({members,invitations,teams});}catch(e){if(this.current(v,c))this.failure(e);}finally{this.reads.delete(c);if(this.current(v,c))this.publish({loading:false});}
 }
 filter(filters:Filters){this.publish({filters});void this.load();}
 async more(kind:'members'|'invitations'|'teams',memberId?:string){if(!this.state.allowed||this.state.loading)return;const member=memberId?this.state.members?.items.find(m=>m.id===memberId):undefined,page=member?member.teams:this.state[kind],after=page?.page.nextCursor;if(!after)return;const c=new AbortController(),v=this.version,id=this.workspace.snapshot().context!.workspace.id;this.reads.add(c);this.publish({loading:true,error:''});
  try{if(member){const result=await this.api.teams(id,c.signal,after,member.id);if(this.current(v,c)&&this.state.members)this.publish({members:{...this.state.members,items:this.state.members.items.map(m=>m.id===member.id?{...m,teams:{...result,items:[...m.teams.items,...result.items]}}:m)}});}
   else if(kind==='members'){const result=await this.api.members(id,this.state.filters,c.signal,after);if(this.current(v,c)&&this.state.members)this.publish({members:{...result,items:[...this.state.members.items,...result.items]}});}
   else if(kind==='invitations'){const result=await this.api.invitations(id,c.signal,after);if(this.current(v,c)&&this.state.invitations)this.publish({invitations:{...result,items:[...this.state.invitations.items,...result.items]}});}
   else {const result=await this.api.teams(id,c.signal,after);if(this.current(v,c)&&this.state.teams)this.publish({teams:{...result,items:[...this.state.teams.items,...result.items]}});}
  }catch(e){if(this.current(v,c))this.failure(e);}finally{this.reads.delete(c);if(this.current(v,c))this.publish({loading:false});}
 }
 async change(input:Omit<Operation,'key'|'actor'|'workspace'>){if(!this.state.canMutate||this.state.busy||this.state.blocked||this.state.attempt||this.state.legacyAttempt)return false;const c=this.workspace.snapshot().context!,op:Attempt={...input,key:this.key(),actor:this.session.snapshot().user!.id,workspace:c.workspace.id,membership:c.self.membershipId};return this.execute(op);}
 async retryLegacy(){const op=this.state.legacyAttempt;if(!op||!this.state.canMutate||this.state.busy||this.state.blocked)return false;const c=this.mutation=new AbortController(),v=this.version;this.publish({busy:true,error:''});try{await new MembersApi(this.session.api).invite(op.workspace,op.body,op.key,c.signal);if(!this.current(v,c))return false;this.legacyJournal?.remove(op.actor,op.workspace);this.publish({legacyAttempt:undefined,notice:'Previous invitation request received. Review the refreshed records; this does not confirm delivery or membership.'});await this.load();return true;}catch(e){if(this.current(v,c))this.failure(e);return false;}finally{if(this.current(v,c))this.publish({busy:false});}}
 abandonAttempt(){const legacy=this.state.legacyAttempt;if(legacy&&!this.state.busy&&this.state.canMutate){try{this.legacyJournal?.remove(legacy.actor,legacy.workspace);this.publish({legacyAttempt:undefined,notice:'Previous retry canceled. Review current records before another request.'});}catch{this.publish({blocked:true});}return;}const op=this.state.attempt;if(!op||this.state.busy||!this.state.canMutate)return;try{this.journal?.remove(op);this.publish({attempt:undefined,error:'',notice:'Retry canceled. Review the current records before submitting a different request.'});}catch{this.publish({blocked:true,error:'Could not clear the saved request safely.'});}}
 retry(){return this.state.attempt?this.execute(this.state.attempt):Promise.resolve(false);}
 private async execute(op:Attempt){if(!this.state.canMutate||this.state.busy||this.state.blocked)return false;
  try{op=parseAttempt(op);this.journal?.write(op);}catch{this.publish({blocked:true,error:'Could not save this request for safe reconciliation. No change was sent.'});return false;}
  const c=this.mutation=new AbortController(),v=this.version;this.publish({busy:true,attempt:op,error:'',notice:''});
  try{await this.api.mutate(op,c.signal);if(!this.current(v,c))return false;this.journal?.remove(op);this.publish({attempt:undefined,notice:'Request received. The refreshed records show the current state; this acknowledgment does not confirm email delivery or membership access.'});
   // Revalidate self authority before restoring private projections after a role/removal mutation.
   if(op.target===op.membership&&(op.action==='role'||op.action==='remove'))await this.workspace.select(op.workspace);else await this.load();return true;
  }catch(e){if(this.current(v,c)){this.failure(e);const status=e instanceof AuthApiError?e.status:0;
    // These responses definitively reject before commit. Unknown outcomes retain the exact original request.
    if([400,412,428,429].includes(status)){try{this.journal?.remove(op);this.publish({attempt:undefined});}catch{this.publish({blocked:true});}}
   }return false;
  }finally{if(this.current(v,c))this.publish({busy:false});}
 }
}
