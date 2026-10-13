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
      {!user?.emailVerified&&<Link to="/verify-email" className="text-accent">Verify your email</Link>}
      <WorkspacePicker/>
      <Link to="/forgot-password" className="block text-accent">Recover your password</Link>
      {error&&<p role="alert" className="text-danger">{error}</p>}
      <div className="flex flex-wrap gap-2"><Button disabled={pending} onClick={()=>void logout(false)}>Sign out</Button><Button disabled={pending} onClick={()=>void logout(true)}>Sign out everywhere</Button></div>
    </div>
  </AuthCard>;
}
