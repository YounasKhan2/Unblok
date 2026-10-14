import React,{useRef,useState} from 'react';
import {Link,useNavigate,useSearchParams} from 'react-router-dom';
import {emailVerificationConfirmSchema} from '@unblok/contracts';
import {useSession} from '../session/SessionContext';
import {AuthApiError} from '../api/authApi';
import {AuthCard} from '../components/AuthCard';
import {Button} from '../../../components/ui/Button';
import {AuthField} from './AuthField';
export function VerificationPage() {
  const [params]=useSearchParams();const {store,pending,user}=useSession();const navigate=useNavigate();const [code,setCode]=useState(''),[notice,setNotice]=useState(''),[error,setError]=useState('');const submitting=useRef(false);
  const perform=async(confirm:boolean)=>{
    if(submitting.current)return;setNotice('');setError('');
    if(confirm&&!emailVerificationConfirmSchema.safeParse({token:code}).success){setError('Paste the complete code from your email.');return;}
    submitting.current=true;
    try{if(confirm){await store.verify(code);setCode('');navigate(params.get('returnTo')==='/invite'?'/invite':'/account',{replace:true});}else{await store.submit(()=>store.api.requestVerification());setNotice('Request received. Check your inbox and spam folder for the code.');}}
    catch(cause){setError(cause instanceof AuthApiError?cause.message:'We couldn’t complete your request.');}
    finally{submitting.current=false;}
  };
  return <AuthCard appearance="application" title="Verify your email" subtitle={user?.email??''} footer={<Link to="/account">Back to account</Link>}>
    {user?.emailVerified?<p role="status">Your email is already verified.</p>:<div className="space-y-4">
      <p className="text-sm text-text-secondary">Request an email, then paste its code here. Stay signed in to this account.</p>
      <Button disabled={pending} onClick={()=>void perform(false)}>Send verification email</Button>
      {notice&&<p role="status" className="text-sm text-text-secondary">{notice}</p>}{error&&<p role="alert" className="text-sm text-danger">{error}</p>}
      <form onSubmit={e=>{e.preventDefault();void perform(true);}} className="space-y-4" aria-busy={pending}>
        <AuthField id="verification-code" name="token" label="Code from your email" value={code} onChange={e=>setCode(e.target.value.trim())} autoComplete="off" spellCheck={false} maxLength={80} required disabled={pending}/>
        <Button variant="primary" type="submit" disabled={pending}>{pending?'Please wait…':'Confirm email'}</Button>
      </form>
    </div>}
  </AuthCard>;
}
