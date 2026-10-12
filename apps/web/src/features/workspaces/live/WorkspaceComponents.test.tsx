import React from 'react';
import {it,expect} from 'vitest';
import {renderToString} from 'react-dom/server';
import {MemoryRouter,Routes,Route} from 'react-router-dom';
import {AuthApi} from '../../auth/api/authApi';
import {SessionStore} from '../../auth/session/SessionStore';
import {SessionProvider} from '../../auth/session/SessionContext';
import {WorkspaceStore} from './WorkspaceStore';
import {LiveWorkspaceProvider} from './WorkspaceContext';
import {LiveWorkspacePage,CreateLiveWorkspacePage} from './WorkspacePages';
const id='12345678-1234-4234-8234-123456789012';
const self={workspaceId:id,membershipId:id,role:'OBSERVER',membershipStatus:'ACTIVE',workspaceStatus:'ACTIVE',capabilities:{readWorkspace:true,listMembers:false,inviteMembers:false,createTeam:false,writeIssues:false,writeDependencies:false,completeDependentIssues:false}};
const workspace={id,name:'Authorized workspace',slug:'authorized-workspace',status:'ACTIVE',membershipRole:'OBSERVER'};
async function fixture(){const api=new AuthApi('',(async(url,options)=>{
  const path=String(url);const body=path.endsWith('/auth/me')?{user:{id,name:'Real User',email:'user@example.test',emailVerified:false}}:path.endsWith('/auth/csrf')?{csrf:'a'.repeat(43)}:path.endsWith('/'+id+'/me')?self:path.endsWith('/'+id)?{workspace,self}:{items:[],page:{hasMore:false,nextCursor:null}};
  return new Response(JSON.stringify(body),{status:options?.method==='POST'?503:200});}) as typeof fetch);
  const session=new SessionStore(api);await session.refresh();const store=new WorkspaceStore(session);const stop=store.start();await store.load();return {store,session,stop};}
function render(f:Awaited<ReturnType<typeof fixture>>,create=false){return renderToString(<SessionProvider store={f.session}><LiveWorkspaceProvider store={f.store}><MemoryRouter initialEntries={[create?'/onboarding/workspace':'/workspaces/'+id]}><Routes><Route path="/workspaces/:workspaceId" element={<LiveWorkspacePage/>}/><Route path="/onboarding/workspace" element={<CreateLiveWorkspacePage/>}/></Routes></MemoryRouter></LiveWorkspaceProvider></SessionProvider>);}
it('renders an honest empty live workspace using server membership, without project fixtures',async()=>{const f=await fixture();await f.store.select(id);const html=render(f);expect(html).toContain('Authorized workspace');expect(html).toContain('Observer');expect(html).toContain('contains no demo data');expect(html).not.toContain('NEXUS Commerce');expect(html).not.toContain('Create issue');f.stop();});
it('renders accessible creation fields and current empty discovery',async()=>{const f=await fixture();const html=render(f,true);expect(html).toContain('for="workspace-name"');expect(html).toContain('for="workspace-slug"');expect(html).toContain('type="submit"');expect(render(f)).toContain('Create your first workspace');f.stop();});
it('renders uncertain creation as a retained retry, never a success',async()=>{const f=await fixture();await f.store.create({name:'Pending workspace',slug:'pending-workspace'});const html=render(f,true);expect(html).toContain('Retry creation');expect(html).toContain('Pending workspace');expect(html).toContain('disabled=""');expect(html).toContain('role="alert"');expect(html).not.toContain('Your workspace is ready');f.stop();});
