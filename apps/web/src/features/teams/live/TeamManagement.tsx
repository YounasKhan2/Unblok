import {ArchiveTeamModalFrame} from '../../settings/components/ArchiveTeamModalFrame';
import React,{useState,useEffect} from 'react';
import {useParams,useSearchParams,Link} from 'react-router-dom';
import {Modal} from '../../../components/ui/Modal';
import {Button} from '../../../components/ui/Button';
import {useTeams} from './TeamsContext';
import {useSession} from '../../auth/session/SessionContext';
import {useLiveWorkspace} from '../../workspaces/live/WorkspaceContext';
import type {ManagementAction} from './TeamsApi';

export function TeamManagement(){
 const [search,setSearch]=useSearchParams();
 const t=useTeams(),s=useSession(),w=useLiveWorkspace(),{requestId}=useParams(),[action,setAction]=useState<ManagementAction|null>(null),[target,setTarget]=useState(''),[role,setRole]=useState<'MEMBER'|'OBSERVER'>('MEMBER'),[now,setNow]=useState(Date.now());
 useEffect(()=>{if(t.retryAfter<=Date.now())return;const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[t.retryAfter]);
 useEffect(()=>{setAction(null);setTarget('');},[t.workspace,t.team?.id,s.store.generation(),w.context?.self.membershipId]);
 useEffect(()=>{if(requestId&&t.team)void t.store.loadTransfer(requestId);},[requestId,t.team?.id,t.workspace,s.store.generation(),w.context?.self.membershipId,t.store]);
 useEffect(()=>{const requested=search.get('manage');if((requested==='archive'||requested==='restore')&&t.managementAllowed&&!t.managementAttempt){setAction(requested);const next=new URLSearchParams(search);next.delete('manage');setSearch(next,{replace:true});}},[search,t.managementAllowed,t.team?.id]);
 if(!t.team)return null;
 const pending=t.managementAttempt,busy=t.sending||t.opening||t.blocked||t.retryAfter>now,active=t.team.status==='ACTIVE';
 const open=async(a:ManagementAction,id='')=>{
  if(a==='accept'||a==='reject'){
   if(!await t.store.loadTransfer(id))return;const current=t.store.snapshot().transfer;
   if(current?.state!=='PENDING'||current.successorMembershipId!==w.store.snapshot().context?.self.membershipId)return;
  }else if(!await t.store.checkManagementAccess())return;
  const current=t.store.snapshot();if(!current.team||current.sending||current.managementAttempt)return;
  if((a==='restore')!==(current.team.status==='ARCHIVED'))return;
  setAction(a);setTarget(id);setRole(a==='role'?(current.members?.items.find(m=>m.membershipId===id)?.teamRole??'MEMBER'):'MEMBER');if(a==='add')void t.store.loadCandidates();
 };
 const submit=async()=>{if(!action)return;const body=action==='add'?{membershipId:target,teamRole:role}:action==='role'?{teamRole:role}:action==='request'?{successorMembershipId:target}:{};const result=await t.store.manage(action,body,['role','remove','accept','reject'].includes(action)?target:undefined);if(result)setAction(null);};
 const field='w-full rounded-md border border-border bg-surface-base px-3 py-2 text-xs';
 const candidates=action==='request'?(t.members?.items??[]).filter(m=>!m.isOwner&&m.workspaceStatus==='ACTIVE'&&m.workspaceRole==='ADMIN'&&m.teamRole==='MEMBER').map(m=>({id:m.membershipId,name:m.displayName})):t.candidates?.items??[];
 const owner=t.managementAllowed;
 return <section className="space-y-3 text-xs" aria-label="Team management">
 {t.managementError&&<p role="alert" className="text-danger">{t.managementError}</p>}
 {t.retryAfter>now&&<p role="status">Wait {Math.ceil((t.retryAfter-now)/1000)} seconds before retrying.</p>}
 {pending&&<div className="space-y-2 rounded-md border border-border p-3"><p role="status">{pending.conflict?'This request conflicts with current state. Review it before starting a new operation.':'This request is pending confirmation. Retry preserves its original key, details and version. Closing a dialog does not cancel it.'}</p><pre className="whitespace-pre-wrap break-words">{pending.action}: {JSON.stringify(pending.body)}</pre>{pending.conflict?<Button size="sm" disabled={busy} onClick={()=>t.store.resolveManagementConflict()}>Review current state for a new request</Button>:<Button size="sm" disabled={busy} onClick={()=>void t.store.manage(pending.action,pending.body,pending.target)}>Retry same management request</Button>}</div>}
 {t.sharedRequest&&owner&&<div role="status" className="space-y-2"><p>Ownership request recorded. Recording a request does not itself transfer ownership. Share this link manually with the selected recipient. The request expires after 15 minutes and may be invalidated by session or permission changes.</p><Link className="text-accent break-all" to={'/workspaces/'+t.workspace+'/teams/'+t.team.id+'/ownership-transfer-requests/'+t.sharedRequest}>Open ownership request</Link><Button size="sm" onClick={()=>void navigator.clipboard.writeText(location.origin+'/workspaces/'+t.workspace+'/teams/'+t.team!.id+'/ownership-transfer-requests/'+t.sharedRequest)}>Copy ownership request link</Button></div>}
 {requestId&&<div className="space-y-2 rounded-md border border-border p-3"><h3 className="font-semibold">Ownership request</h3>{t.transfer?<><p role="status">{t.transfer.state} · Expires {t.transfer.expiresAt}</p>{t.transfer.state==='PENDING'&&t.transfer.successorMembershipId===w.context?.self.membershipId&&<><p>Accepting makes you the Team owner. The server rechecks your identity, permissions, session and request expiry.</p><Button size="sm" disabled={busy||!!pending} onClick={()=>open('accept',requestId)}>Accept ownership</Button><Button size="sm" disabled={busy||!!pending} onClick={()=>open('reject',requestId)}>Reject ownership</Button></>}</>:<p>{t.managementError||'Checking ownership request…'}</p>}</div>}
 {t.attempt&&<p role="status">Resolve the pending metadata request before managing this Team.</p>}
 {owner&&!pending&&!t.attempt&&<><div className="flex flex-wrap gap-2">{active&&<><Button size="sm" disabled={busy} onClick={()=>open('add')}>Add member</Button><Button size="sm" disabled={busy} onClick={()=>open('request')}>Transfer ownership</Button></>}<Button size="sm" disabled={busy} onClick={()=>open(active?'archive':'restore')}>{active?'Archive team':'Restore team'}</Button></div>
 {active&&(t.members?.items??[]).map(m=><div key={m.membershipId} className="flex flex-wrap items-center gap-2"><span className="text-text-secondary">{m.displayName} · {m.teamRole}{m.isOwner?' · Owner':''}</span>{!m.isOwner&&<><Button size="sm" disabled={busy||m.workspaceStatus!=='ACTIVE'} onClick={()=>open('role',m.membershipId)}>Change role</Button><Button size="sm" disabled={busy} onClick={()=>open('remove',m.membershipId)}>Remove</Button></>}</div>)}</>}
 {action==='archive'&&<ArchiveTeamModalFrame isOpen onClose={()=>setAction(null)} team={t.team} projects={[]} cycles={[]} archiveTeam={()=>t.store.manage('archive')} canArchiveTeam={()=>({allowed:owner||!!pending,reason:'Team management access is unavailable.'})} live={{busy:busy||!!pending,error:t.managementError}}/>}
 {action&&action!=='archive'&&<Modal isOpen onClose={()=>setAction(null)} title={action==='restore'?'Restore Team: '+t.team.name:action==='request'?'Transfer ownership':action==='add'?'Add Team member':action==='role'?'Change Team role':action==='remove'?'Remove Team member':action==='accept'?'Accept Team ownership':'Reject ownership request'} maxWidth="md"><form className="space-y-4" onSubmit={e=>{e.preventDefault();void submit();}}>
 {(action==='add'||action==='request')&&<><label className="block">{action==='request'?'Eligible successor':'Workspace member'}<select aria-label={action==='request'?'Eligible successor':'Workspace member'} required className={field} value={target} disabled={busy||!!pending} onChange={e=>{setTarget(e.target.value);if(action==='add')setRole(t.candidates?.items.find(m=>m.id===e.target.value)?.role==='OBSERVER'?'OBSERVER':'MEMBER');}}><option value="">Select a member</option>{candidates.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></label>{action==='add'&&t.candidates?.page.hasMore&&<Button size="sm" disabled={busy} onClick={()=>{setTarget('');void t.store.loadCandidates(true);}}>Next Workspace members</Button>}{action==='request'&&<p>Only currently loaded ACTIVE Workspace ADMIN / Team MEMBER candidates are shown. Use Next members on the Team list to load further candidates. The recipient must explicitly accept within 15 minutes; no email is sent.</p>}</>}
 {(action==='add'||action==='role')&&<label className="block">Team role<select aria-label="Team role" className={field} value={role} disabled={busy||!!pending} onChange={e=>setRole(e.target.value as typeof role)}><option value="MEMBER" disabled={action==='add'?t.candidates?.items.find(m=>m.id===target)?.role==='OBSERVER':t.members?.items.find(m=>m.membershipId===target)?.workspaceRole==='OBSERVER'}>MEMBER</option><option value="OBSERVER">OBSERVER</option></select></label>}
 {['remove','role'].includes(action)&&<p>{t.members?.items.find(m=>m.membershipId===target)?.displayName??'Selected membership'}</p>}
 {action==='remove'&&<p>Remove this Team membership immediately? This does not remove Workspace membership. The Team owner cannot be removed. Adding the member again requires a separate authorized operation.</p>}
 {action==='restore'&&<p>Restore only this Team? This does not restore projects, removed memberships or expired ownership requests.</p>}
 {(action==='accept'||action==='reject')&&<p>Confirm your {action==='accept'?'acceptance':'rejection'} of this ownership request. The server checks the original consent and current authority.</p>}
 {t.managementError&&<p role="alert" className="text-danger">{t.managementError}</p>}<div className="flex justify-end gap-2 border-t border-border pt-3"><Button type="button" size="sm" onClick={()=>setAction(null)}>Cancel</Button><Button type="submit" size="sm" disabled={busy||!!pending}>{t.sending?'Confirming…':'Confirm '+action}</Button></div>
 </form></Modal>}
 </section>;
}
