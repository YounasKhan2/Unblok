import React,{useCallback,useEffect,useState} from 'react';
import {Link,useParams} from 'react-router-dom';
import {Button} from '../../../components/ui/Button';
import {useSession} from '../../auth/session/SessionContext';
import {useLiveWorkspace} from './WorkspaceContext';
import {useMembers} from './MembersContext';
import type {MemberFilter,MemberSort} from './MembersApi';
import {InviteDialog} from './InviteDialog';
export function MembersPage(){
 const {workspaceId}=useParams(),{store:workspace,context,selected,selecting,contextError}=useLiveWorkspace(),{store:session,user,status,pending}=useSession(),members=useMembers();const [open,setOpen]=useState(false),close=useCallback(()=>setOpen(false),[]),generation=session.generation();
 useEffect(()=>{if(workspaceId&&status==='authenticated'&&!pending)void workspace.select(workspaceId);},[workspaceId,workspace,status,pending,generation]);
 useEffect(()=>{setOpen(false);},[workspaceId,generation,members.canInvite]);
 const current=selected===workspaceId?context:null;
 return <section className="w-full rounded-lg border border-border bg-surface-base p-4 sm:p-5 space-y-4" aria-label="Workspace members">
  <header className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-lg font-semibold">Members</h1><p className="text-xs text-text-secondary break-words">{current?.workspace.name??'Workspace'}{current?.workspace.status==='ARCHIVED'?' · Archived · Read only':''}</p></div>{members.canInvite&&<Button size="sm" variant="primary" onClick={()=>setOpen(true)}>Invite member</Button>}</header>
  {selecting&&<p role="status" className="text-sm">Checking workspace access…</p>}{contextError&&<p role="alert" className="text-sm text-danger">{contextError}</p>}
  {current&&!members.allowed&&!members.error&&<p className="text-sm text-text-secondary">Only active workspace administrators can view members.</p>}
  {members.allowed&&<><div className="flex flex-wrap gap-3"><div className="text-xs space-y-1"><label htmlFor="member-status" className="block">Status</label><select id="member-status" className="rounded-md border border-border bg-surface-base px-2 py-1.5" value={members.status} onChange={e=>members.store.filter(e.target.value as MemberFilter,members.sort)}>{['ALL','ACTIVE','INVITED','SUSPENDED'].map(s=><option key={s} value={s}>{s==='ALL'?'All statuses':s[0]+s.slice(1).toLowerCase()}</option>)}</select></div>
  <div className="text-xs space-y-1"><label htmlFor="member-sort" className="block">Joined</label><select id="member-sort" className="rounded-md border border-border bg-surface-base px-2 py-1.5" value={members.sort} onChange={e=>members.store.filter(members.status,e.target.value as MemberSort)}><option value="joined_asc">Oldest first</option><option value="joined_desc">Newest first</option></select></div></div>
  {current?.workspace.status==='ACTIVE'&&!user?.emailVerified&&<p className="text-xs text-text-secondary">Verify your email to send invitations. <Link className="text-accent" to="/verify-email">Verify email</Link></p>}
  {members.loading&&<p role="status" className="text-sm">Loading members…</p>}
  {members.page&&<><p id="member-scroll-hint" className="text-xs text-text-secondary sm:sr-only">Scroll to see every column.</p><div className="overflow-x-auto" role="region" aria-label="Member table" aria-describedby="member-scroll-hint" tabIndex={0}><table className="w-full min-w-md text-left text-xs"><caption className="sr-only">Authorized workspace members</caption><thead className="border-b border-border text-text-secondary"><tr>{['Name','Role','Status','Joined'].map(h=><th key={h} scope="col" className="py-2 pr-3 font-medium whitespace-nowrap">{h}</th>)}</tr></thead><tbody className="divide-y divide-border">{members.page.items.map(m=><tr key={m.id}><td className="py-2 pr-3 break-words">{m.displayName}</td><td className="py-2 pr-3">{m.role==='ADMIN'?'Admin':m.role==='MEMBER'?'Member':'Observer'}</td><td className="py-2 pr-3">{m.status[0]+m.status.slice(1).toLowerCase()}</td><td className="py-2 whitespace-nowrap">{m.joinedAt?<time dateTime={m.joinedAt}>{new Date(m.joinedAt).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric',timeZone:'UTC'})}</time>:'—'}</td></tr>)}</tbody></table></div>{!members.page.items.length&&<p role="status" className="text-sm text-text-secondary">No members match this status.</p>}
  <div className="flex gap-2"><Button size="sm" onClick={()=>void members.store.load()} disabled={members.loading}>Reload members</Button>{members.page.page.hasMore&&<Button size="sm" onClick={()=>void members.store.load(true)} disabled={members.loading}>Next members</Button>}</div></>}
  {!members.page&&!members.loading&&<Button size="sm" onClick={()=>void members.store.load()}>Reload members</Button>}</>}
  {members.error&&<p role="alert" className="text-sm text-danger">{members.error}</p>}
  <Link to={'/workspaces/'+workspaceId} className="inline-block text-sm text-accent">Back to workspace</Link>
  <InviteDialog open={open&&members.canInvite} close={close}/>
 </section>;
}
