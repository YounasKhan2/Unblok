import React,{useState} from 'react';
import {workspaceInvitationSchema} from '@unblok/contracts';
import {Modal} from '../../../components/ui/Modal';
import {Button} from '../../../components/ui/Button';
import {AuthField} from '../../auth/live/AuthField';
import {useMembers} from './MembersContext';
export function InviteDialog({open,close}:{open:boolean;close:()=>void}){
 const {store,attempt,sending,notice,inviteError,blocked,canInvite}=useMembers();const [email,setEmail]=useState(''),[role,setRole]=useState<'MEMBER'|'OBSERVER'>('MEMBER'),[invalid,setInvalid]=useState('');
 const submit=(e:React.FormEvent)=>{e.preventDefault();const body=workspaceInvitationSchema.safeParse(attempt?.body??{email,role});if(!body.success){setInvalid('Enter a valid email address.');return;}setInvalid('');void store.invite(body.data);};
 return <Modal isOpen={open} onClose={close} title="Invite a member" description="Invite a member or observer to this workspace." maxWidth="sm"><form onSubmit={submit} className="space-y-3" aria-busy={sending}>
  <AuthField id="invite-email" label="Email address" type="email" autoComplete="off" maxLength={320} value={attempt?.body.email??email} disabled={sending||!!attempt||!canInvite} onChange={e=>setEmail(e.target.value)} error={invalid||undefined}/>
  <label className="block text-xs font-medium" htmlFor="invite-role">Role</label><select id="invite-role" className="w-full rounded-md border border-border bg-surface-base px-3 py-2 text-sm" value={attempt?.body.role??role} disabled={sending||!!attempt||!canInvite} onChange={e=>setRole(e.target.value as typeof role)}><option value="MEMBER">Member</option><option value="OBSERVER">Observer</option></select>
  <p className="text-xs text-text-secondary">The recipient must sign in with this email address, verify it, then paste the invitation code at /invite. Invitations expire 24 hours after issuance. A request acknowledgment does not confirm email delivery or membership.</p>
  {inviteError&&<p role="alert" className="text-sm text-danger">{inviteError}</p>}{notice&&<p role="status" className="text-sm text-text-secondary">{notice}</p>}
  <div className="flex flex-wrap justify-end gap-2"><Button type="button" size="sm" onClick={close}>Close</Button><Button type="submit" size="sm" variant="primary" disabled={sending||blocked||!canInvite}>{sending?'Sending…':attempt?'Retry invitation':'Send invitation'}</Button></div>
 </form></Modal>;
}
