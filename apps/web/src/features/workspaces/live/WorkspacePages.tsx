import React,{useEffect,useState} from 'react';
import {Link,useNavigate,useParams} from 'react-router-dom';
import {createWorkspaceSchema} from '@unblok/contracts';
import {AuthCard} from '../../auth/components/AuthCard';
import {AuthField} from '../../auth/live/AuthField';
import {Button} from '../../../components/ui/Button';
import {useLiveWorkspace} from './WorkspaceContext';
import {WorkspacePicker} from './WorkspacePicker';
import {useSession} from '../../auth/session/SessionContext';
export function CreateLiveWorkspacePage(){
  const {store,attempt,creating,creationError}=useLiveWorkspace(),navigate=useNavigate();
  const [name,setName]=useState(attempt?.body.name??''),[slug,setSlug]=useState(attempt?.body.slug??''),[invalid,setInvalid]=useState(false);
  const [confirmNew,setConfirmNew]=useState(false);
  const submit=async(e:React.FormEvent)=>{e.preventDefault();const parsed=createWorkspaceSchema.safeParse(attempt?.body??{name,slug});setInvalid(!parsed.success);if(parsed.success){const id=await store.create(parsed.data);if(id)navigate('/workspaces/'+id,{replace:true});}};
  return <AuthCard appearance="application" title="Create workspace" subtitle="Start with a name and a short workspace address."><form className="space-y-4" onSubmit={e=>void submit(e)}>
    <AuthField label="Workspace name" id="workspace-name" value={attempt?.body.name??name} maxLength={120} disabled={creating||!!attempt} onChange={e=>setName(e.target.value)} error={invalid?'Enter a name and a valid address.':undefined}/>
    <AuthField label="Workspace address" id="workspace-slug" value={attempt?.body.slug??slug} maxLength={63} disabled={creating||!!attempt} onChange={e=>setSlug(e.target.value)} error={invalid?'Use lowercase letters, numbers and single hyphens.':undefined}/>
    {creationError&&<p role="alert" className="text-sm text-danger">{creationError}</p>}
    {attempt&&!creating&&<p className="text-sm text-text-secondary">Retry keeps the same request. Check your workspaces before starting another.</p>}
    <Button type="submit" variant="primary" disabled={creating}>{creating?'Confirming…':attempt?'Retry creation':'Create workspace'}</Button>
    {attempt&&!creating&&<div className="space-y-2 text-sm">{confirmNew?<><p>The earlier request may have created a workspace. Check your workspaces before starting a different request.</p><div className="flex flex-wrap gap-2"><Button type="button" size="sm" onClick={()=>setConfirmNew(false)}>Keep retrying</Button><Button type="button" size="sm" onClick={()=>{store.abandonAttempt();setConfirmNew(false);setName('');setSlug('');}}>Use different details</Button></div></>:<Button type="button" size="sm" variant="ghost" onClick={()=>setConfirmNew(true)}>Start another request</Button>}</div>}
    <Link to="/account" className="block text-sm text-accent">Back to your workspaces</Link>
  </form></AuthCard>;
}
export function LiveWorkspacePage(){
  const {workspaceId}=useParams(),{store,context,selected,selecting,contextError}=useLiveWorkspace();
  const {store:session,status,pending}=useSession(),generation=session.generation();
  useEffect(()=>{if(workspaceId&&status==='authenticated'&&!pending)void store.select(workspaceId);},[store,workspaceId,status,pending,generation]);
  const current=selected===workspaceId?context:null;
  return <AuthCard appearance="application" title={current?.workspace.name??'Workspace'} subtitle="Your authenticated workspace">
    <div className="space-y-4 text-sm">{selecting&&<p role="status">Opening workspace…</p>}{contextError&&<p role="alert" className="text-danger">{contextError}</p>}
      {current&&<><p className="text-text-secondary">{current.self.role==='ADMIN'?'Administrator':current.self.role==='MEMBER'?'Member':'Observer'}{current.workspace.status==='ARCHIVED'?' · Archived':''}</p>
        <section aria-label="Empty workspace" className="rounded-lg border border-border p-4 space-y-2"><h2 className="font-semibold">Your workspace is ready</h2><p className="text-text-secondary">Teams, projects and issues are not connected yet. This workspace contains no demo data.</p></section></>}
      {workspaceId&&<Button size="sm" disabled={selecting} onClick={()=>void store.select(workspaceId)}>Check workspace access</Button>}
      <WorkspacePicker/><Link to="/account" className="block text-accent">Your account</Link>
    </div>
  </AuthCard>;
}
