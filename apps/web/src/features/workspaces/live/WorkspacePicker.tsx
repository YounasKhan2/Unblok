import React from 'react';
import {Link} from 'react-router-dom';
import {Button} from '../../../components/ui/Button';
import {useLiveWorkspace} from './WorkspaceContext';
export function WorkspacePicker({showContextError=true}:{showContextError?:boolean}={}){
  const {store,page,loading,error,creating,contextError}=useLiveWorkspace();
  return <section aria-label="Your workspaces" className="space-y-3 rounded-lg border border-border p-4">
    <div className="flex items-center justify-between gap-2"><h2 className="font-semibold">Your workspaces</h2><Link className="text-accent text-sm" to="/onboarding/workspace">Create workspace</Link></div>
    {loading&&<p role="status">Loading workspaces…</p>}
    {(error||(showContextError&&contextError))&&<p role="alert">{error||contextError}</p>}
    {!loading&&page?.items.length===0&&<p className="text-text-secondary">You don’t have a workspace yet. Create your first workspace to get started.</p>}
    <ul className="space-y-2 max-h-56 overflow-y-auto">{page?.items.map(w=><li key={w.id}><Link to={'/workspaces/'+w.id} className="block rounded-md border border-border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"><span className="block font-medium break-words">{w.name}</span><span className="text-text-secondary">{w.membershipRole==='ADMIN'?'Administrator':w.membershipRole==='MEMBER'?'Member':'Observer'}{w.status==='ARCHIVED'?' · Archived':''}</span></Link></li>)}</ul>
    <div className="flex flex-wrap gap-2"><Button size="sm" disabled={loading||creating} onClick={()=>void store.load()}>Refresh workspaces</Button>{page?.page.hasMore&&<Button size="sm" disabled={loading||creating} onClick={()=>void store.load(true)}>Next page</Button>}</div>
    <a href="/demo/my-work" className="block text-xs text-accent">Explore the separate NEXUS demo</a>
  </section>;
}
