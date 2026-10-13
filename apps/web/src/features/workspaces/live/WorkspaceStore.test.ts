import {describe,it,expect} from 'vitest';
import {AuthApi} from '../../auth/api/authApi';
import {SessionStore} from '../../auth/session/SessionStore';
import {WorkspaceStore} from './WorkspaceStore';
import {TabAttemptJournal,type AttemptJournal} from './AttemptJournal';
const id='12345678-1234-4234-8234-123456789012',other='12345678-1234-4234-8234-123456789013';
const row={id,name:'Real workspace',slug:'real-workspace',status:'ACTIVE',membershipRole:'ADMIN'};
const self={workspaceId:id,membershipId:other,role:'ADMIN',membershipStatus:'ACTIVE',workspaceStatus:'ACTIVE',capabilities:{readWorkspace:true,listMembers:false,inviteMembers:false,createTeam:false,writeIssues:false,writeDependencies:false,completeDependentIssues:false}};
const page={items:[row],page:{hasMore:false,nextCursor:null}};
const response=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status});
function deferred<T>(){let resolve!:(value:T)=>void;const promise=new Promise<T>(r=>resolve=r);return {promise,resolve};}
const tick=()=>new Promise(r=>setTimeout(r,0));
async function setup(handler?:(url:string,options:RequestInit)=>Promise<Response>|Response,journal?:AttemptJournal){
  let actor=id;const calls:{url:string;options:RequestInit}[]=[];
  const auth=new AuthApi('',(async(url,options={})=>{const path=String(url);calls.push({url:path,options});
    if(path.endsWith('/auth/me'))return response({user:{id:actor,name:'Server user',email:'user@example.test',emailVerified:false}});
    if(path.endsWith('/auth/csrf')||path.endsWith('/auth/login'))return response({csrf:'a'.repeat(43)});
    if(path.includes('/workspaces'))return handler?handler(path,options):response(page);
    return response({revocation:'confirmed',cleanup:'confirmed'});
  }) as typeof fetch);
  const session=new SessionStore(auth);await session.refresh();const store=new WorkspaceStore(session,undefined,()=>id,journal),stop=store.start();await tick();
  return {store,session,calls,stop,actor:(value:string)=>actor=value};
}
describe('server-owned live workspace state',()=>{
  it('discovers one bounded page with cookies and no cache',async()=>{const s=await setup();expect(s.store.snapshot().page).toEqual(page);const call=s.calls.find(c=>c.url.includes('/workspaces'))!;expect(call.url).toContain('limit=20');expect(call.options.credentials).toBe('include');expect(call.options.cache).toBe('no-store');s.stop();});
  it('replaces pages and recovers stale cursors without accumulating the collection',async()=>{let count=0;const s=await setup((url)=>{count++;return url.includes('after=')?response({error:{code:'CURSOR_STALE'}},409):response({...page,page:{hasMore:true,nextCursor:'opaque cursor'}});});
    await s.store.load(true);expect(s.calls.at(-1)?.url).toContain('after=opaque%20cursor');expect(s.store.snapshot().page).toBeNull();expect(s.store.snapshot().stale).toBe(true);await s.store.load();expect(s.store.snapshot().page?.items).toHaveLength(1);expect(count).toBe(3);s.stop();});
  it('retains the exact key and canonical body across an uncertain creation retry',async()=>{let attempts=0;const s=await setup((_url,options)=>options.method==='POST'?(++attempts===1?Promise.reject(new Error('Lost acknowledgement')):response({workspace:row,initialAdministrator:self},201)):response(page));
    expect(await s.store.create({name:' Real workspace ',slug:row.slug})).toBeNull();expect(s.store.snapshot().attempt?.key).toBe(id);expect(s.store.snapshot().context).toBeNull();expect(await s.store.create({name:row.name,slug:row.slug})).toBe(id);
    const posts=s.calls.filter(c=>c.options.method==='POST'&&c.url.endsWith('/workspaces'));expect(posts).toHaveLength(2);expect(posts[0]!.options.body).toBe(posts[1]!.options.body);for(const call of posts){expect(new Headers(call.options.headers).get('idempotency-key')).toBe(id);expect(new Headers(call.options.headers).get('x-csrf-token')).toHaveLength(43);}expect(s.store.snapshot().attempt).toBeUndefined();s.stop();});
  it('blocks duplicate submissions and refuses a changed body for an unresolved key',async()=>{const wait=deferred<Response>();const s=await setup((_url,o)=>o.method==='POST'?wait.promise:response(page));const first=s.store.create({name:row.name,slug:row.slug});await tick();expect(await s.store.create({name:row.name,slug:row.slug})).toBeNull();wait.resolve(response({},503));await first;await expect(s.store.create({name:'Different',slug:row.slug})).rejects.toThrow('original request');expect(s.calls.filter(c=>c.url.endsWith('/workspaces')).length).toBe(1);s.stop();});
  it.each([409,403,429,503])('does not report success or discard the attempt after %s',async status=>{const s=await setup((_u,o)=>o.method==='POST'?response({},status):response(page));expect(await s.store.create({name:row.name,slug:row.slug})).toBeNull();expect(s.store.snapshot().attempt?.key).toBe(id);expect(s.store.snapshot().context).toBeNull();s.stop();});
  it('permits correction after a definite validation rejection',async()=>{const s=await setup((_u,o)=>o.method==='POST'?response({},400):response(page));await s.store.create({name:row.name,slug:row.slug});expect(s.store.snapshot().attempt).toBeUndefined();s.stop();});
  it('reads detail and current membership without inventing capabilities',async()=>{const s=await setup(url=>url.endsWith('/me')?response(self):url.endsWith('/'+id)?response({workspace:row,self}):response(page));await s.store.select(id);expect(s.store.snapshot().context?.self.capabilities.writeIssues).toBe(false);expect(s.calls.some(c=>c.url.endsWith('/'+id+'/me'))).toBe(true);s.stop();});
  it('clears revoked selection and page on404',async()=>{let revoked=false;const s=await setup(url=>url.includes('/'+id)?revoked?response({},404):response(url.endsWith('/me')?self:{workspace:row,self}):response(page));await s.store.select(id);revoked=true;await s.store.select(id);expect(s.store.snapshot().selected).toBeNull();expect(s.store.snapshot().context).toBeNull();expect(s.store.snapshot().page).toBeNull();s.stop();});
  it('clears cross-account cache and ignores old restoration even if transport ignores abort',async()=>{const old=deferred<Response>();let count=0;const s=await setup(()=>++count===1?old.promise:response({items:[],page:{hasMore:false,nextCursor:null}}));s.actor(other);await s.session.login({email:'other@example.test',password:'A valid private password 2026'});await tick();old.resolve(response(page));await tick();expect(s.store.snapshot().page?.items).toEqual([]);expect((s.calls.find(c=>c.url.includes('/workspaces'))!.options.signal as AbortSignal).aborted).toBe(true);s.stop();});
  it('ignores obsolete selection responses and stale401 after switching',async()=>{const old=deferred<Response>();const s=await setup(url=>url.includes('/'+id)?old.promise:url.includes('/'+other)?response(url.endsWith('/me')?{...self,workspaceId:other}:{workspace:{...row,id:other},self:{...self,workspaceId:other}}):response(page));const first=s.store.select(id);await tick();await s.store.select(other);old.resolve(response({},401));await first;expect(s.session.snapshot().status).toBe('authenticated');expect(s.store.snapshot().context?.workspace.id).toBe(other);s.stop();});
  it('clears all authority on a current401 and restores only through server checks',async()=>{let expired=true;const s=await setup(()=>expired?response({},401):response(page));expect(s.session.snapshot().status).toBe('anonymous');expect(s.store.snapshot().page).toBeNull();expired=false;await s.session.refresh();await tick();expect(s.store.snapshot().page).toEqual(page);s.stop();});
  it('cancels an obsolete creation and suppresses navigation after logout',async()=>{const late=deferred<Response>();const s=await setup((_u,o)=>o.method==='POST'?late.promise:response(page));const result=s.store.create({name:row.name,slug:row.slug});await tick();await expect(s.session.logout()).rejects.toThrow('Please wait');late.resolve(response({workspace:row,initialAdministrator:self},201));expect(await result).toBeNull();expect(s.store.snapshot().selected).toBeNull();expect(s.store.snapshot().attempt).toBeUndefined();s.stop();});
  it('rejects inconsistent and oversized server projections',async()=>{const s=await setup(()=>response({items:Array.from({length:21},()=>row),page:{hasMore:false,nextCursor:null}}));expect(s.store.snapshot().page).toBeNull();expect(s.store.snapshot().error).toBeTruthy();s.stop();});
  it('can start again after effect cleanup without reusing prior data',async()=>{const s=await setup();s.stop();expect(s.store.snapshot().page).toBeNull();const stop=s.store.start();await tick();expect(s.store.snapshot().page).toEqual(page);stop();});
  it('restores an uncertain attempt after store reconstruction and preserves it across interruption and removes it on explicit logout',async()=>{let value:string|null=null;const journal=new TabAttemptJournal({getItem:()=>value,setItem:(_k,v)=>{value=v;},removeItem:()=>{value=null;}});
    const s=await setup((_u,o)=>o.method==='POST'?response({},503):response(page),journal);await s.store.create({name:row.name,slug:row.slug});s.stop();
    const restored=new WorkspaceStore(s.session,undefined,()=>other,journal),stop=restored.start();expect(restored.snapshot().attempt?.key).toBe(id);await restored.create({name:row.name,slug:row.slug});
    const posts=s.calls.filter(c=>c.options.method==='POST'&&c.url.endsWith('/workspaces'));expect(posts).toHaveLength(2);expect(new Headers(posts[1]!.options.headers).get('idempotency-key')).toBe(id);s.session.clear();expect(value).not.toBeNull();await s.session.login({email:"user@example.test",password:"A valid private password 2026"});expect(restored.snapshot().attempt?.key).toBe(id);await s.session.logout();expect(value).toBeNull();stop();});
  it('does not send a mutation when pending-request persistence is unavailable',async()=>{const s=await setup(undefined,{read:()=>undefined,write:()=>{throw new Error('Blocked');}});expect(await s.store.create({name:row.name,slug:row.slug})).toBeNull();expect(s.calls.some(c=>c.url.endsWith('/workspaces')&&c.options.method==='POST')).toBe(false);expect(s.store.snapshot().creationError).toContain('safe retry');s.stop();});
  it('reconciles one committed effect after interruption and fresh same-account login',async()=>{
    let value:string|null=null,effects=0,posts=0;const journal=new TabAttemptJournal({getItem:()=>value,setItem:(_k,v)=>{value=v;},removeItem:()=>{value=null;}});
    const s=await setup((_u,o)=>{if(o.method!=='POST')return response(page);posts++;if(posts===1){effects++;return Promise.reject(new Error('Committed response lost'));}return response({workspace:row,initialAdministrator:self},201);},journal);
    await s.store.create({name:row.name,slug:row.slug});s.session.clear();expect(s.store.snapshot().attempt).toBeUndefined();expect(value).not.toBeNull();
    await s.session.login({email:'user@example.test',password:'A valid private password 2026'});expect(s.store.snapshot().attempt?.key).toBe(id);
    expect(await s.store.create({name:row.name,slug:row.slug})).toBe(id);expect(effects).toBe(1);expect(value).toBeNull();s.stop();
  });
  it('discards an interrupted attempt only after a different server actor authenticates',async()=>{
    let value:string|null=null;const journal=new TabAttemptJournal({getItem:()=>value,setItem:(_k,v)=>{value=v;},removeItem:()=>{value=null;}});
    const s=await setup((_u,o)=>o.method==='POST'?response({},503):response(page),journal);await s.store.create({name:row.name,slug:row.slug});s.session.clear();expect(value).not.toBeNull();s.actor(other);
    await s.session.login({email:'other@example.test',password:'A valid private password 2026'});expect(s.store.snapshot().attempt).toBeUndefined();expect(value).toBeNull();s.stop();
  });
  it('ignores a delayed401 after a fresh authentication generation without losing its journal',async()=>{
    let value:string|null=null;const old=deferred<Response>();const journal=new TabAttemptJournal({getItem:()=>value,setItem:(_k,v)=>{value=v;},removeItem:()=>{value=null;}});
    let delay=false;const s=await setup((_u,o)=>o.method==='POST'?response({},503):delay?old.promise:response(page),journal);await s.store.create({name:row.name,slug:row.slug});delay=true;const pending=s.store.load();await tick();s.session.clear();delay=false;
    await s.session.login({email:'user@example.test',password:'A valid private password 2026'});old.resolve(response({},401));await pending;
    expect(s.session.snapshot().status).toBe('authenticated');expect(s.store.snapshot().attempt?.key).toBe(id);expect(value).not.toBeNull();s.stop();
  });
  it('abandons unresolved metadata immediately on explicit logout even when the response is unknown',async()=>{
    let value:string|null=null;const journal=new TabAttemptJournal({getItem:()=>value,setItem:(_k,v)=>{value=v;},removeItem:()=>{value=null;}});
    const s=await setup((_u,o)=>o.method==='POST'?response({},503):response(page),journal);await s.store.create({name:row.name,slug:row.slug});
    const original=s.session.api.logout.bind(s.session.api);s.session.api.logout=()=>Promise.reject(new Error('Unknown logout outcome'));
    await expect(s.session.logout()).rejects.toThrow('Unknown logout outcome');expect(value).toBeNull();expect(s.store.snapshot().attempt).toBeUndefined();s.session.api.logout=original;s.stop();
  });
  it('shows expired-result guidance while retaining the unresolved key',async()=>{
    const s=await setup((_u,o)=>o.method==='POST'?response({error:{code:'IDEMPOTENCY_RESULT_EXPIRED'}},409):response(page));
    expect(await s.store.create({name:row.name,slug:row.slug})).toBeNull();expect(s.store.snapshot().attempt?.key).toBe(id);expect(s.store.snapshot().creationError).toBe('This request is no longer available. Check your workspaces before creating another.');expect(s.store.snapshot().selected).toBeNull();s.stop();
  });
  it.each(['corrupt','unavailable'])('blocks silent rekeying when journal restoration is %s',async mode=>{
    let data:string|null=mode==='corrupt'?'{':null;let blocked=mode==='unavailable';const journal=new TabAttemptJournal({getItem:()=>{if(blocked)throw new Error('Blocked');return data;},setItem:(_k,v)=>{data=v;},removeItem:()=>{data=null;}});
    const s=await setup(undefined,journal);expect(s.store.snapshot().reconciliationBlocked).toBe(true);expect(await s.store.create({name:row.name,slug:row.slug})).toBeNull();expect(s.calls.some(c=>c.url.endsWith('/workspaces')&&c.options.method==='POST')).toBe(false);
    blocked=false;s.store.abandonAttempt();expect(s.store.snapshot().reconciliationBlocked).toBe(false);expect(data).toBeNull();s.stop();
  });
  it.each(['status','body','grant'])('retains the key rather than trusting an inconsistent201 projection: %s',async mode=>{const s=await setup((_u,o)=>o.method==='POST'?response({workspace:mode==='body'?{...row,name:'Another result'}:row,initialAdministrator:mode==='grant'?{...self,role:'MEMBER'}:self},mode==='status'?200:201):response(page));expect(await s.store.create({name:row.name,slug:row.slug})).toBeNull();expect(s.store.snapshot().attempt?.key).toBe(id);expect(s.store.snapshot().selected).toBeNull();s.stop();});
});
