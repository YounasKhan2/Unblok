import React,{useState} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {useSession} from '../session/SessionContext';
import {AuthApiError} from '../api/authApi';
import {AuthCard} from '../components/AuthCard';
import {Button} from '../../../components/ui/Button';
export function AccountPage() {
  const {user,pending,store}=useSession();const navigate=useNavigate();const [error,setError]=useState('');
  const logout=async(all:boolean)=>{setError('');try{await store.logout(all);navigate('/login',{replace:true});}catch(cause){setError(cause instanceof AuthApiError?cause.message:'We couldn’t sign out. Please try again.');}};
  return <AuthCard appearance="application" title="Your account" subtitle={user?.email??'Signed in'}>
    <div className="space-y-4 text-sm"><p className="font-medium break-words">Welcome, {user?.name}.</p>
      <p className="text-text-secondary">{user?.emailVerified?'Your email is verified.':'Your email is not verified yet.'}</p>
      {!user?.emailVerified&&<Link to="/verify-email" className="text-accent">Verify your email</Link>}
      <section className="rounded-lg border border-border p-4 space-y-2" aria-label="Workspace availability"><h2 className="font-semibold">Workspace access is coming next</h2><p className="text-text-secondary">Workspace setup and invitations are not connected yet. Your account has no workspace access here.</p><a href="/demo/my-work" className="inline-block text-accent">Explore the separate NEXUS demo</a></section>
      <Link to="/forgot-password" className="block text-accent">Recover your password</Link>
      {error&&<p role="alert" className="text-danger">{error}</p>}
      <div className="flex flex-wrap gap-2"><Button disabled={pending} onClick={()=>void logout(false)}>Sign out</Button><Button disabled={pending} onClick={()=>void logout(true)}>Sign out everywhere</Button></div>
    </div>
  </AuthCard>;
}
