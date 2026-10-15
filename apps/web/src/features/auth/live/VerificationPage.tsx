import React,{useRef,useState} from 'react';
import {Link,useNavigate,useSearchParams} from 'react-router-dom';
import {emailVerificationConfirmSchema} from '@unblok/contracts';
import {useSession} from '../session/SessionContext';
import {AuthApiError} from '../api/authApi';
import {AuthCard} from '../components/AuthCard';
import {Button} from '../../../components/ui/Button';
import {AuthField} from './AuthField';
import {AuthFeedback} from './AuthFeedback';
export function VerificationPage() {
  const [params]=useSearchParams();const {store,pending,user}=useSession();const navigate=useNavigate();
  const [code,setCode]=useState(''),[notice,setNotice]=useState(''),[error,setError]=useState(''),[requested,setRequested]=useState(false),[action,setAction]=useState<'request'|'confirm'|null>(null);
  const submitting=useRef(false),form=useRef<HTMLFormElement>(null);
  const perform=async(confirm:boolean)=>{
    if(submitting.current)return;setNotice('');setError('');
    if(confirm&&!emailVerificationConfirmSchema.safeParse({token:code}).success){setError('Paste the complete code from your email.');form.current?.querySelector('input')?.focus();return;}
    submitting.current=true;setAction(confirm?'confirm':'request');
    try{
      if(confirm){await store.verify(code);setCode('');navigate(params.get('returnTo')==='/invite'?'/invite':'/account',{replace:true});}
      else{await store.submit(()=>store.api.requestVerification());setRequested(true);setNotice('Request received. If an email is available, we’ll attempt delivery. Check your inbox and spam folder. This acknowledgment does not confirm delivery.');}
    }catch(cause){setError(cause instanceof AuthApiError?cause.message:'We couldn’t complete your request.');}
    finally{submitting.current=false;setAction(null);}
  };
  return <AuthCard appearance="application" title="Verify your email" subtitle={user?.email??''} footer={<Link to="/account">Back to account</Link>}>
    {user?.emailVerified?<p role="status">Your email is already verified.</p>:<div className="space-y-4">
      <p className="text-sm text-text-secondary">Request a verification email, then paste its complete code below. Stay signed in to this account. Verification enables password recovery and Workspace invitations.</p>
      <p id="verification-guidance" className="text-sm text-text-secondary">Codes expire 15 minutes after issuance. Asking again while a code is current may reuse the same request without sending another email. If it has expired, request a new email. Delivery can take a moment.</p>
      <Button variant="primary" disabled={pending} aria-describedby="verification-guidance" onClick={()=>void perform(false)}>{action==='request'?'Requesting email…':requested?'Request verification email again':'Send verification email'}</Button>
      {notice&&<AuthFeedback message={notice}/>} {error&&<AuthFeedback message={error} error/>}
      <form ref={form} onSubmit={e=>{e.preventDefault();void perform(true);}} noValidate className="space-y-4" aria-busy={pending}>
        <AuthField id="verification-code" name="token" label="Code from your email" value={code} onChange={e=>setCode(e.target.value.trim())} autoComplete="off" spellCheck={false} maxLength={80} required disabled={pending}/>
        <Button variant="primary" type="submit" disabled={pending}>{action==='confirm'?'Checking code…':'Confirm email'}</Button>
      </form>
      {params.get('returnTo')==='/invite'&&<p className="text-sm text-text-secondary">After verification, return to your invitation and accept it. Keep its original code; verification does not join the Workspace.</p>}
    </div>}
  </AuthCard>;
}
