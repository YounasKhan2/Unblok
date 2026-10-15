import React,{useState} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {useSession} from '../session/SessionContext';
import {AuthApiError} from '../api/authApi';
import {AuthCard} from '../components/AuthCard';
import {Button} from '../../../components/ui/Button';
import {WorkspacePicker} from '../../workspaces/live/WorkspacePicker';
export function AccountPage() {
  const {user,pending,store}=useSession();const navigate=useNavigate();const [error,setError]=useState('');
  const logout=async(all:boolean)=>{setError('');try{await store.logout(all);navigate('/login',{replace:true});}catch(cause){setError(cause instanceof AuthApiError?cause.message:'We couldn’t sign out. Please try again.');}};
  return <AuthCard appearance="application" title="Your account" subtitle={user?.email??'Signed in'}>
    <div className="space-y-4 text-sm"><p className="font-medium break-words">Welcome, {user?.name}.</p>
      <p className="text-text-secondary">{user?.emailVerified?'Your email is verified.':'Your email is not verified yet.'}</p>
      {!user?.emailVerified&&<section aria-label="Email verification" className="rounded-lg border border-border p-4 space-y-3">
        <h2 className="font-semibold">Next step: verify your email</h2>
        <p className="text-text-secondary">Verification enables password recovery and Workspace invitations. Request an email, then paste its code while signed in to this account.</p>
        <Link to="/verify-email" className="inline-block rounded-lg bg-accent px-4 py-2 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">Verify your email</Link>
      </section>}
      <WorkspacePicker/>
      <Link to="/forgot-password" className="block text-accent">Recover your password</Link>
      {error&&<p role="alert" className="text-danger">{error}</p>}
      <div className="flex flex-wrap gap-2"><Button disabled={pending} onClick={()=>void logout(false)}>Sign out</Button><Button disabled={pending} onClick={()=>void logout(true)}>Sign out everywhere</Button></div>
    </div>
  </AuthCard>;
}
