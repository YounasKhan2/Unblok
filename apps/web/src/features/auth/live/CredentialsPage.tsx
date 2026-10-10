import React,{useRef,useState} from 'react';
import {Link,useNavigate,useSearchParams} from 'react-router-dom';
import {signupSchema,loginSchema,passwordRecoveryRequestSchema,passwordRecoveryConfirmSchema} from '@unblok/contracts';
import {AuthApiError} from '../api/authApi';
import {useSession} from '../session/SessionContext';
import {AuthCard} from '../components/AuthCard';
import {PasswordInput} from '../components/PasswordInput';
import {Button} from '../../../components/ui/Button';
import {AuthField} from './AuthField';
type Mode='login'|'signup'|'forgot'|'reset';
const titles:Record<Mode,string>={login:'Welcome back',signup:'Create your account',forgot:'Forgot your password?',reset:'Choose a new password'};
export function CredentialsPage({mode}:{mode:Mode}) {
  const {store,pending}=useSession();const navigate=useNavigate();const [params]=useSearchParams();
  const [name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirmation,setConfirmation]=useState(''),[token,setToken]=useState('');
  const [errors,setErrors]=useState<Record<string,string>>({}),[error,setError]=useState(''),[accepted,setAccepted]=useState(false);
  const submitting=useRef(false),form=useRef<HTMLFormElement>(null);
  const submit=async(event:React.FormEvent)=>{
    event.preventDefault();if(submitting.current)return;setError('');setErrors({});
    const input=mode==='signup'?{name,email,password}:mode==='login'?{email,password}:mode==='forgot'?{email}:{email,password,token};
    const schema=mode==='signup'?signupSchema:mode==='login'?loginSchema:mode==='forgot'?passwordRecoveryRequestSchema:passwordRecoveryConfirmSchema;
    const parsed=schema.safeParse(input);
    const invalid:Record<string,string>={};
    if(!parsed.success) for(const issue of parsed.error.issues){const field=String(issue.path[0]);invalid[field]=field==='password'?'Use 16–128 characters. Avoid unsupported characters.':field==='token'?'Paste the complete code from your email.':field==='name'?'Enter your name (up to 120 characters).':'Enter a valid email address.';}
    if(mode==='reset'&&confirmation!==password)invalid.confirmation='Passwords must match.';
    if(Object.keys(invalid).length){setErrors(invalid);form.current?.querySelector<HTMLInputElement>(`[name="${Object.keys(invalid)[0]}"]`)?.focus();return;}
    submitting.current=true;
    try{
      if(mode==='login'){await store.login({email,password});setPassword('');navigate('/account',{replace:true});}
      else if(mode==='signup'){await store.submit(()=>store.api.signup({name,email,password}));setPassword('');setAccepted(true);}
      else if(mode==='forgot'){await store.submit(()=>store.api.requestRecovery(email));setAccepted(true);}
      else{await store.reset({email,token,password});setToken('');setPassword('');setConfirmation('');navigate('/login?recovery=received',{replace:true});}
    }catch(cause){setError(cause instanceof AuthApiError?cause.message:'Check your information before trying again.');}
    finally{submitting.current=false;}
  };
  const footer=<div className="flex flex-wrap justify-center gap-x-4 gap-y-2"><Link to="/login">Sign in</Link><Link to="/signup">Create account</Link>{mode==='login'&&<Link to="/forgot-password">Forgot password?</Link>}</div>;
  if(accepted)return <AuthCard appearance="application" title={mode==='signup'?'Request received':'Check your email'} footer={footer}>
    <p role="status" className="text-sm text-text-secondary">{mode==='signup'?'Your registration request was received. Sign in to continue. An existing account is left unchanged.':'If this email belongs to an account with verified email ownership, you’ll receive a code. Check your inbox and spam folder.'}</p>
    {mode==='forgot'&&<Link className="inline-block mt-4 text-sm text-accent" to="/reset-password">Enter email code</Link>}
  </AuthCard>;
  return <AuthCard appearance="application" title={titles[mode]} subtitle={mode==='reset'?'Paste the email code and set a password. Then sign in again.':mode==='forgot'?'Recovery is available for accounts with verified email ownership.':'Your account does not create or join a workspace automatically.'} footer={footer}>
    {params.get('sessionExpired')&&<p role="status" className="mb-4 text-sm text-text-secondary">Please sign in to continue.</p>}
    {params.get('recovery')==='received'&&<p role="status" className="mb-4 text-sm text-text-secondary">Your reset request was received. Try signing in with the new password. If it doesn’t work, request a new email.</p>}
    {error&&<p role="alert" className="mb-4 text-sm text-danger">{error}</p>}
    <form ref={form} onSubmit={submit} noValidate className="space-y-4" aria-busy={pending}>
      {mode==='signup'&&<AuthField id="real-name" name="name" label="Full name" value={name} onChange={e=>setName(e.target.value)} autoComplete="name" maxLength={120} disabled={pending} required error={errors.name}/>}
      <AuthField id="real-email" name="email" label="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" maxLength={320} disabled={pending} required error={errors.email}/>
      {mode==='reset'&&<AuthField id="recovery-code" name="token" label="Code from your email" value={token} onChange={e=>setToken(e.target.value.trim())} autoComplete="off" spellCheck={false} maxLength={80} disabled={pending} required error={errors.token}/>}
      {mode!=='forgot'&&<PasswordInput appearance="application" id="real-password" name="password" label={mode==='reset'?'New password':'Password'} value={password} onChange={e=>setPassword(e.target.value)} autoComplete={mode==='login'?'current-password':'new-password'} disabled={pending} maxLength={256} error={errors.password}/>}
      {mode==='reset'&&<PasswordInput appearance="application" id="confirm-password" name="confirmation" label="Confirm new password" value={confirmation} onChange={e=>setConfirmation(e.target.value)} autoComplete="new-password" disabled={pending} maxLength={256} error={errors.confirmation}/>}
      {(mode==='signup'||mode==='reset')&&<p className="text-xs text-text-secondary">Use 16–128 characters. Spaces are allowed; no special character mix is required.</p>}
      <Button type="submit" variant="primary" size="lg" disabled={pending} className="w-full">{pending?'Please wait…':mode==='login'?'Sign in':mode==='signup'?'Create account':mode==='forgot'?'Send recovery email':'Submit new password'}</Button>
    </form>
  </AuthCard>;
}
