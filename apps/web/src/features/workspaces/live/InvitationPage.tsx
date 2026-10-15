import React,{useState} from 'react';
import {Link} from 'react-router-dom';
import {AuthCard} from '../../auth/components/AuthCard';
import {AuthField} from '../../auth/live/AuthField';
import {AuthFeedback} from '../../auth/live/AuthFeedback';
import {useSession} from '../../auth/session/SessionContext';
import {Button} from '../../../components/ui/Button';
import {WorkspacePicker} from './WorkspacePicker';
import {useInvitation} from './MembersContext';
export function InvitationPage(){
 const {store,status,user,pending}=useSession(),invitation=useInvitation(),[code,setCode]=useState('');
 return <AuthCard appearance="application" title="Workspace invitation" subtitle="Sign in with the email address that received the invitation, verify that address, then accept."><div className="space-y-4 text-sm">
  {!invitation.hasProof&&<form className="space-y-3" onSubmit={e=>{e.preventDefault();if(invitation.store.capture(code.trim()))setCode('');}}><p className="text-text-secondary">Paste the complete invitation code from your email. If you received a link, you can reopen it instead. Invitations expire 24 hours after issuance. For privacy, refreshing this page clears the code; keep the original email.</p><AuthField id="invitation-code" label="Invitation code" type="password" autoComplete="off" spellCheck={false} maxLength={80} value={code} onChange={e=>setCode(e.target.value)}/><Button size="sm" type="submit">Use invitation code</Button></form>}
  {status==='loading'&&<p role="status">Checking your session…</p>}{status==='unavailable'&&<Button onClick={()=>void store.refresh()}>Check session again</Button>}
  {status==='anonymous'&&<div className="flex flex-wrap gap-4 text-accent"><Link to="/login?returnTo=%2Finvite">Sign in to continue</Link><Link to="/signup?returnTo=%2Finvite">Create an account</Link></div>}
  {status==='authenticated'&&<><p className="break-words">Signed in as {user?.email??user?.name}</p>{!user?.emailVerified?<Link to="/verify-email?returnTo=%2Finvite" className="text-accent">Verify your email to continue</Link>:invitation.hasProof&&!invitation.acknowledged&&<Button variant="primary" disabled={pending||invitation.busy} onClick={()=>void invitation.store.accept()}>{invitation.busy?'Checking invitation…':invitation.error?'Retry acceptance':'Accept invitation'}</Button>}
  {invitation.acknowledged&&<><WorkspacePicker/><Button size="sm" disabled={invitation.busy} onClick={()=>void invitation.store.reconcile()}>Check workspace access</Button></>}</>}
  {invitation.error&&<AuthFeedback message={invitation.error} error/>}{invitation.notice&&<AuthFeedback message={invitation.notice}/>}
  {invitation.hasProof&&<Button size="sm" variant="ghost" disabled={invitation.busy} onClick={()=>invitation.store.clear()}>Discard invitation</Button>}
  <Link to="/account" className="block text-accent">Your account</Link>
 </div></AuthCard>;
}
