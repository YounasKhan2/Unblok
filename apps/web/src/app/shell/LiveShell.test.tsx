import {workspaceMenuItems} from '../../features/workspaces/live/workspaceMenu';
import React from 'react';
import {describe,it,expect} from 'vitest';
import {renderToString} from 'react-dom/server';
import {MemoryRouter} from 'react-router-dom';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
// The web package's TypeScript 7 executable has no compiler API. Use the existing
// root TypeScript 5 dev dependency for this test-only import audit.
interface Compiler {
 ModuleKind:{ESNext:number};JsxEmit:{ReactJSX:number};ScriptTarget:{Latest:number;ES2022:number};ScriptKind:{JS:number};
 transpileModule(source:string,options:{compilerOptions:{module:number;jsx:number;target:number}}):{outputText:string};
 createSourceFile(file:string,source:string,target:number,parents:boolean,kind:number):{statements:unknown[]};
 isImportDeclaration(node:unknown):node is {moduleSpecifier:unknown};isStringLiteral(node:unknown):node is {text:string};
}
const ts=createRequire(resolve(dirname(fileURLToPath(import.meta.url)),'../../../../../package.json'))('typescript') as Compiler;
import {AuthApi} from '../../features/auth/api/authApi';
import {SessionStore} from '../../features/auth/session/SessionStore';
import {SessionProvider} from '../../features/auth/session/SessionContext';
import {WorkspaceStore} from '../../features/workspaces/live/WorkspaceStore';
import {LiveWorkspaceProvider} from '../../features/workspaces/live/WorkspaceContext';
import {LiveRoutes} from '../../features/auth/live/LiveRouter';
import {MembersStore} from '../../features/workspaces/live/MembersStore';
import {TeamsStore} from '../../features/teams/live/TeamsStore';
import type {WorkspaceState} from '../../features/workspaces/live/WorkspaceStore';
const id='12345678-1234-4234-8234-123456789012',replacement='22345678-1234-4234-8234-123456789012';
const user={id,name:'Server Identity',email:'owned@example.test',emailVerified:true};
const workspace={id,name:'Authorized Organization',slug:'authorized',status:'ACTIVE' as const,membershipRole:'ADMIN' as const};
const self={workspaceId:id,membershipId:id,role:'ADMIN' as const,membershipStatus:'ACTIVE' as const,workspaceStatus:'ACTIVE' as const,capabilities:{readWorkspace:true,listMembers:false,inviteMembers:false,createTeam:false,writeIssues:false,writeDependencies:false,completeDependentIssues:false}};
const json=(body:unknown)=>new Response(JSON.stringify(body));
async function fixture(){const api=new AuthApi('',(async url=>json(String(url).endsWith('/auth/me')?{user}:String(url).includes('?')?{items:[workspace],page:{hasMore:false,nextCursor:null}}:String(url).endsWith('/me')?self:{workspace,self})) as typeof fetch);const session=new SessionStore(api);await session.refresh();const store=new WorkspaceStore(session);const stop=store.start();await store.load();await store.select(id);return {session,store,stop};}
function render(f:Awaited<ReturnType<typeof fixture>>,path:string){return renderToString(<SessionProvider store={f.session}><LiveWorkspaceProvider store={f.store}><MemoryRouter initialEntries={[path]}><LiveRoutes/></MemoryRouter></LiveWorkspaceProvider></SessionProvider>);}
describe('real shell presentation and isolation',()=>{
 it.each(['/my-work','/projects','/cycles','/milestones','/roadmap','/dependencies','/insights','/inbox'])('renders honest unsupported %s without fake business state',async path=>{const f=await fixture();try{const html=render(f,path);expect(html).toContain('Authorized Organization');expect(html).toContain('Server Identity');expect(html).toContain('not connected to live backend data');for(const label of ['My Work','Inbox','Projects','Teams','Cycles','Milestones','Roadmap','Dependencies','Insights','Settings'])expect(html).toContain('>'+label+'<');expect(html).not.toMatch(/NEXUS|Alex Rivera|Reset to|Restore previous state|Switch Active Role|All clear!/);expect(html).toContain('disabled=""');}finally{f.stop();}});
 it('renders no private shell when selection does not match context',async()=>{const f=await fixture();try{const pending=f.store.select(replacement);const html=render(f,'/my-work');expect(html).not.toContain('Authorized Organization');await pending;}finally{f.stop();}});
 it('removes the private shell immediately on logout/expiry',async()=>{const f=await fixture();try{f.session.clear(true);const html=render(f,'/my-work');expect(html).not.toContain('Authorized Organization');expect(html).not.toContain('Server Identity');}finally{f.stop();}});
 it('has no runtime import path from live routes to fixture/mock/business providers',()=>{
  const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..'),seen=new Set<string>();
  function visit(file:string){if(seen.has(file))return;seen.add(file);const source=readFileSync(file,'utf8');const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
   expect(file).not.toMatch(/ProjectContext|mockAuthAdapter|mockWorkspaceAdapter|nexusEnterprise|nexusFixtureReset|DemoShellBindings|AppProviders|SettingsContext|CollaborationContext|KeyboardContext/);
   const parsed=ts.createSourceFile(file,js,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);for(const statement of parsed.statements){if(!ts.isImportDeclaration(statement))continue;if(!ts.isStringLiteral(statement.moduleSpecifier))continue;const spec=statement.moduleSpecifier.text;if(!spec.startsWith('.'))continue;const base=resolve(dirname(file),spec),next=[base+'.ts',base+'.tsx',resolve(base,'index.ts'),resolve(base,'index.tsx')].find(existsSync);if(next)visit(next);}}
  visit(resolve(root,'features/auth/live/LiveRouter.tsx'));visit(resolve(root,'features/auth/session/SessionContext.tsx'));expect(seen.size).toBeGreaterThan(40);
 });
});
// Simulate an observed same-actor/same-role membership replacement without first clearing context.
// Transport deliberately ignores AbortSignal, proving the store's generation fence independently.
async function authorityFixture(kind:'members'|'teams'){
 const deferred:Array<(r:Response)=>void>=[];const api=new AuthApi('',(async url=>String(url).endsWith('/auth/me')?json({user}):new Promise<Response>(r=>deferred.push(r))) as typeof fetch);
 const session=new SessionStore(api);await session.refresh();let state:WorkspaceState={page:null,context:{workspace,self},selected:id,loading:false,selecting:false,creating:false,stale:false};const listeners=new Set<()=>void>();
 const w={snapshot:()=>state,subscribe:(fn:()=>void)=>{listeners.add(fn);return()=>listeners.delete(fn);}} as unknown as WorkspaceStore;
 const store=kind==='members'?new MembersStore(session,w):new TeamsStore(session,w);const stop=store.start();
 return {store,stop,deferred,replace:(change:Partial<WorkspaceState>)=>{state={...state,...change};listeners.forEach(fn=>fn());},state:()=>state};
}
const page=(cursor:string)=>({items:[],page:{hasMore:true,nextCursor:cursor}});
const tick=()=>new Promise(r=>setTimeout(r,0));
it.each(['members','teams'] as const)('%s fences delayed projections across same-role membership replacement',async kind=>{const f=await authorityFixture(kind);try{expect(f.deferred).toHaveLength(1);f.replace({context:{workspace,self:{...self,membershipId:replacement}}});expect(f.deferred).toHaveLength(2);f.deferred[1]!(json(page('new-authority')));await tick();expect(f.store.snapshot().page?.page.nextCursor).toBe('new-authority');f.deferred[0]!(json(page('old-private-projection')));await tick();expect(f.store.snapshot().page?.page.nextCursor).toBe('new-authority');}finally{f.stop();}});
it.each(['members','teams'] as const)('%s clears authority when selected workspace and context diverge',async kind=>{const f=await authorityFixture(kind);try{f.replace({selected:replacement});expect(f.store.snapshot().allowed).toBe(false);f.deferred[0]!(json(page('stale')));await tick();expect(f.store.snapshot().page).toBeNull();}finally{f.stop();}});

it('keeps validated selection visible outside the bounded discovery page',()=>{const items=workspaceMenuItems({items:[],page:{hasMore:true,nextCursor:'signed-next'}},{workspace,self});expect(items.map(row=>row.workspace.id)).toEqual([id]);expect(items[0]!.membership.role).toBe('ADMIN');});
it('uses fresh self authority for a selected row instead of an older discovery role',()=>{const items=workspaceMenuItems({items:[workspace],page:{hasMore:false,nextCursor:null}},{workspace:{...workspace,membershipRole:'MEMBER'},self:{...self,role:'MEMBER'}});expect(items).toHaveLength(1);expect(items[0]!.membership.role).toBe('MEMBER');});
