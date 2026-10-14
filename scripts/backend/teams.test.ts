import { cp, mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { afterAll, beforeAll, expect, test } from 'bun:test';
import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { Database, AccountCredentials, AuthFences, Tenancy, TenantAccessError, denyAll, type WorkspaceKeys, type VerifiedPrincipal } from '@unblok/database';
import { createLogger, createRedis, loadApiConfig, withDeadline } from '@unblok/backend-runtime';
import { createApp } from '../../apps/api/src/app';
import { RedisRateLimiter } from '../../apps/api/src/security';
import { Sessions, connectSessionStore, sessionSettings } from '../../apps/api/src/modules/sessions';
import { Authentication, AuthenticationLimits, Passwords } from '../../apps/api/src/modules/auth';

import { Teams, TeamLimits } from '../../apps/api/src/modules/teams';
import { Workspaces, WorkspaceLimits } from '../../apps/api/src/modules/workspaces';
const workspaceKeys = { active: 'v1', cursors: { v1: randomBytes(32).toString('hex') }, idempotency: randomBytes(32).toString('hex') };
const root = resolve(import.meta.dir, '../..'), config = loadApiConfig(process.env);
const admin = new Database(config.DATABASE_URL), name = `unblok_team01_test_${randomUUID().replaceAll('-', '')}`;
const url = new URL(config.DATABASE_URL); url.pathname = `/${name}`;
const database = new Database(url.toString()), fences = new AuthFences(database), cache = createRedis(config.REDIS_URL);
const ownedPrefix = `team01:test:${randomUUID()}:`;
cache.on('error', () => {}); // Expected outage diagnostics must not print SDK details.
const stops: (() => Promise<void>)[] = [];
let created = false;
async function prisma(args: string[], target=url.toString()) {
  const child = Bun.spawn([process.execPath, 'packages/database/node_modules/prisma/build/index.js', ...args],
    { cwd: root, env: { ...process.env, DATABASE_URL: target }, stdout: 'pipe', stderr: 'pipe' });
  let timedOut = false; const timer = setTimeout(() => { timedOut = true; child.kill('SIGKILL'); }, 6000);
  try {
    const [exit, out] = await Promise.all([child.exited, new Response(child.stdout).text(), new Response(child.stderr).text()]);
    if (timedOut || exit !== 0) throw new Error('Owned migration verification failed; configuration withheld');
    return out;
  } finally { clearTimeout(timer); }
}
beforeAll(async () => {
  await admin.connect(); await admin.client.$executeRawUnsafe(`CREATE DATABASE "${name}"`); created = true;
  await prisma(['migrate', 'deploy', '--schema', 'packages/database/prisma/schema.prisma']);
  await database.connect(); await cache.connect();
}, 30000);
afterAll(async () => {
  try { for (const stop of stops.reverse()) await stop(); }
  finally {
    try { const keys = await cache.keys(`${ownedPrefix}*`); if (keys.length) await cache.del(...keys); }
    finally { cache.disconnect(); await database.close();
      try { if (created) await admin.client.$executeRawUnsafe(`DROP DATABASE "${name}" WITH (FORCE)`); }
      finally { await admin.close(); }
    }
  }
}, 10000);
const password = 'A long private test password 2026';
type Client = { cookie: string; csrf: string };
async function fixture(options: { afterConfirmation?: () => Promise<void>; redisUrl?: string; keys?: WorkspaceKeys; settings?:Parameters<typeof connectSessionStore>[1]; database?:Database } = {}) {
  const settings = options.settings ?? { ...sessionSettings(config, { SESSION_SECRETS: randomBytes(32).toString('hex'), SESSION_NAMESPACE: 'test' }), prefix: ownedPrefix + randomUUID() + ':' };
  const rateCache = options.redisUrl ? createRedis(options.redisUrl) : cache;
  if (options.redisUrl) { rateCache.on('error', () => {}); await rateCache.connect(); }
  const connection = await connectSessionStore(options.redisUrl ?? config.REDIS_URL, settings);
  const credentials = new AccountCredentials(database), limits = new AuthenticationLimits(rateCache, settings.secrets[0]!, settings.prefix);
  const authentication = new Authentication({ create: i => credentials.create(i), lookup: e => credentials.lookup(e), confirm: async snapshot => {
    const valid = await credentials.confirm(snapshot); if (valid) await options.afterConfirmation?.(); return valid;
  } }, await Passwords.create(), limits);
  const sessions = new Sessions(connection.store, settings, { create: i => fences.create(i), rotate: (e, d, idle) => fences.rotate(e, d, idle), revoke: e => fences.revoke(e), retireSid: d => fences.retireSid(d), revokeAll: id => fences.revokeAll(id) }, a => authentication.resolveIdentity(a));
  const tenancy = new Tenancy(options.database ?? database, { verify: async () => null }, denyAll, sessions, undefined, options.keys ?? workspaceKeys);
  sessions.bind(tenancy); authentication.bind(sessions, tenancy);
  const coarse = new RedisRateLimiter(rateCache, 120, 60000, settings.prefix + 'coarse:');
  const server = await createApp(config, { databaseReady: () => database.ready(), queueReady: async () => await rateCache.ping() === 'PONG', close: async () => { await connection.close(); if (options.redisUrl) rateCache.disconnect(); } }, coarse, createLogger('silent'), sessions, authentication, new Workspaces(sessions, tenancy, new WorkspaceLimits(rateCache, settings.secrets[0]!, settings.prefix)),new Teams(sessions,tenancy,new TeamLimits(rateCache,settings.secrets[0]!,settings.prefix)));
  await server.app.listen(0, '127.0.0.1'); stops.push(server.close);
  const address = server.app.getHttpServer().address(); if (!address || typeof address === 'string') throw new Error('Missing test listener');
  const http = (path: string, method = 'GET', client?: Client, body?: unknown, extra: Record<string, string | undefined> = {}) => {
    const headers: Record<string, string> = { origin: config.CORS_ORIGINS[0]!, ...(client ? { cookie: client.cookie, 'x-csrf-token': client.csrf } : {}), ...(['POST','PATCH'].includes(method) ? { 'content-type': 'application/json' } : {}) };
    for (const [key, value] of Object.entries(extra)) { if (value === undefined) delete headers[key]; else headers[key] = value; }
    return fetch(`http://127.0.0.1:${address.port}${path}`, { method, headers, ...(['POST','PATCH'].includes(method) ? { body: JSON.stringify(body ?? {}) } : {}) });
  };
  const bootstrap = async () => {
    const response = await http('/api/v1/auth/csrf'); expect(response.status).toBe(200);
    const client = { cookie: response.headers.get('set-cookie')!.split(';')[0]!, csrf: (await response.json()).csrf as string };
    expect(response.headers.get('cache-control')).toBe('no-store'); return client;
  };
  const signup = async (email = `${randomUUID()}@example.test`, name = 'Account') => {
    const client = await bootstrap(), response = await http('/api/v1/auth/signup', 'POST', client, { email, name, password });
    expect(response.status).toBe(202); expect(await response.json()).toEqual({ status: 'accepted' });
    expect(response.headers.has('set-cookie')).toBe(false); return { email, client };
  };
  const login = async (email: string, client?: Client) => {
    const before = client ?? await bootstrap(), response = await http('/api/v1/auth/login', 'POST', before, { email, password });
    expect(response.status).toBe(200); const auth = { cookie: response.headers.get('set-cookie')!.split(';')[0]!, csrf: (await response.json()).csrf as string };
    expect(auth.cookie).not.toBe(before.cookie); expect(auth.csrf).not.toBe(before.csrf); return auth;
  };
  const sid = (client: Client) => decodeURIComponent(client.cookie.split('=')[1]!).slice(2).split('.')[0]!;
  const key = (client: Client) => settings.prefix + sid(client);
  return { http, url:`http://127.0.0.1:${address.port}`, bootstrap, signup, login, key, sid, sessions, tenancy, authentication, credentials, connection, limits, settings, close: server.close };
}

const input = () => ({ name: 'Workspace', slug: 'ws-' + randomUUID() });
const create = (f: Awaited<ReturnType<typeof fixture>>, client: Client, body = input(), key = randomUUID()) => f.http('/api/v1/workspaces', 'POST', client, body, { 'idempotency-key': key });


async function owned(options:Parameters<typeof fixture>[0]={}) {
 const f=await fixture(options),{email}=await f.signup(),client=await f.login(email);
 const user=await database.client.passwordCredential.findUniqueOrThrow({where:{email},include:{identity:true}});
 const response=await create(f,client);expect(response.status).toBe(201);const ws=(await response.json()).workspace.id as string;
 const membership=await database.client.workspaceMembership.findUniqueOrThrow({where:{workspaceId_userId:{workspaceId:ws,userId:user.identity.userId}}});
 return {f,client,ws,userId:user.identity.userId,member:membership.id};
}
async function budget(scope:string){const rows=await database.client.$queryRaw<{used:number}[]>`SELECT used FROM team_receipt_budgets WHERE scope=${scope}`;return rows[0]?.used??0;}
const teamInput=(suffix='')=>({name:'Team '+randomUUID()+suffix,key:'ENG',description:'Private description',color:'#5645d4'});
const path=(ws:string,id?:string)=>'/api/v1/workspaces/'+ws+'/teams'+(id?'/'+id:'');
async function make(o:Awaited<ReturnType<typeof owned>>,body=teamInput(),key=randomUUID()){
 const response=await o.f.http(path(o.ws),'POST',o.client,body,{'idempotency-key':key});expect(response.status).toBe(201);return {row:await response.json(),key,body};
}

test('fresh migration, replay and schema parity',async()=>{
 expect(await prisma(['migrate','deploy','--schema','packages/database/prisma/schema.prisma'])).toContain('No pending migrations');
 expect(await prisma(['migrate','status','--schema','packages/database/prisma/schema.prisma'])).toContain('Database schema is up to date');
 expect(await prisma(['migrate','diff','--from-schema-datasource','packages/database/prisma/schema.prisma','--to-schema-datamodel','packages/database/prisma/schema.prisma','--exit-code'])).toContain('No difference');
 expect(await database.client.$queryRaw<{count:bigint}[]>`SELECT count(*) FROM _prisma_migrations WHERE finished_at IS NOT NULL`).toEqual([{count:11n}]);
},15000);
test('atomic creation creates one owner, one join, one bounded receipt and no resource grants',async()=>{
 const o=await owned(),t=await make(o);
 const stored=await database.client.team.findUniqueOrThrow({where:{workspaceId_id:{workspaceId:o.ws,id:t.row.id}}});
 expect(stored.ownerMembershipId).toBe(o.member);expect(stored.legacyQuarantined).toBe(false);
 expect(await database.client.teamMembership.count({where:{workspaceId:o.ws,teamId:t.row.id}})).toBe(1);
 expect(await database.client.teamMutationResult.count({where:{workspaceId:o.ws}})).toBe(1);
 expect(t.row.capabilities).toEqual({updateMetadata:true,manageMembers:false,transferOwnership:false,archive:false,restore:false,readProjects:false,writeIssues:false});
 const detail=await o.f.http(path(o.ws,t.row.id),'GET',o.client);expect(detail.status).toBe(200);expect(detail.headers.get('etag')).toBe('"team-1"');expect(detail.headers.get('cache-control')).toBe('private, no-store');expect(await detail.json()).toEqual(t.row);
 const list=await o.f.http(path(o.ws),'GET',o.client);expect((await list.json()).items.map((r:{id:string})=>r.id)).toEqual([t.row.id]);
});
test('durable create retry and changed body conflict do not multiply effects',async()=>{
 const o=await owned(),t=await make(o);
 const retry=await o.f.http(path(o.ws),'POST',o.client,t.body,{'idempotency-key':t.key});expect(retry.status).toBe(201);expect(await retry.json()).toEqual(t.row);
 expect((await o.f.http(path(o.ws),'POST',o.client,{...t.body,name:'Changed'}, {'idempotency-key':t.key})).status).toBe(409);
 expect(await database.client.team.count({where:{workspaceId:o.ws}})).toBe(1);
 expect(await budget('workspace:'+o.ws)).toBe(1);
});
test('PATCH strong preconditions, immutable fields and same-key reconciliation',async()=>{
 const o=await owned(),t=await make(o),headers={'idempotency-key':randomUUID(),'if-match':'"team-1"'},body={name:'Updated private metadata'};
 expect((await o.f.http(path(o.ws,t.row.id),'PATCH',o.client,body,{'idempotency-key':randomUUID()})).status).toBe(428);
 expect((await o.f.http(path(o.ws,t.row.id),'PATCH',o.client,body,{...headers,'if-match':'W/"team-1"'})).status).toBe(400);
 const updated=await o.f.http(path(o.ws,t.row.id),'PATCH',o.client,body,headers);expect(updated.status).toBe(200);expect(updated.headers.get('etag')).toBe('"team-2"');const result=await updated.json();expect(result.version).toBe('2');
 const replay=await o.f.http(path(o.ws,t.row.id),'PATCH',o.client,body,headers);expect(replay.status).toBe(200);expect(await replay.json()).toEqual(result);
 expect((await o.f.http(path(o.ws,t.row.id),'PATCH',o.client,{name:'Stale'},{...headers,'idempotency-key':randomUUID()})).status).toBe(412);
 expect((await o.f.http(path(o.ws,t.row.id),'PATCH',o.client,{key:'NEW'},headers)).status).toBe(400);
 expect((await o.f.http(path(o.ws,t.row.id),'PATCH',o.client,{ownerMembershipId:o.member},headers)).status).toBe(400);
});
async function another(o:Awaited<ReturnType<typeof owned>>,role:'ADMIN'|'MEMBER'|'OBSERVER',join?:string){
 const {email}=await o.f.signup(),client=await o.f.login(email);const credential=await database.client.passwordCredential.findUniqueOrThrow({where:{email},include:{identity:true}});
 const m=await database.client.workspaceMembership.create({data:{workspaceId:o.ws,userId:credential.identity.userId,role,status:'ACTIVE'}});
 if(join)await database.client.teamMembership.create({data:{workspaceId:o.ws,teamId:join,membershipId:m.id}});
 return {client,member:m.id,userId:credential.identity.userId};
}
test('ADMIN nonmember never lists, discovers, reads or mutates another private Team',async()=>{
 const o=await owned(),t=await make(o),other=await another(o,'ADMIN');
 const list=await o.f.http(path(o.ws),'GET',other.client);expect(list.status).toBe(200);expect((await list.json()).items).toEqual([]);
 for(const id of [t.row.id,randomUUID()]){expect((await o.f.http(path(o.ws,id),'GET',other.client)).status).toBe(404);expect((await o.f.http(path(o.ws,id),'PATCH',other.client,{name:'Attack'},{'idempotency-key':randomUUID(),'if-match':'"team-1"'})).status).toBe(404);}
 expect(await database.client.team.findUniqueOrThrow({where:{workspaceId_id:{workspaceId:o.ws,id:t.row.id}},select:{name:true}})).toEqual({name:t.body.name});
});
for(const role of ['MEMBER','OBSERVER','ADMIN'] as const)test(`${role} explicit nonowner can read but cannot manage`,async()=>{
 const o=await owned(),t=await make(o),other=await another(o,role,t.row.id);
 const read=await o.f.http(path(o.ws,t.row.id),'GET',other.client);expect(read.status).toBe(200);expect((await read.json()).capabilities.updateMetadata).toBe(false);
 expect((await o.f.http(path(o.ws,t.row.id),'PATCH',other.client,{name:'Denied'},{'idempotency-key':randomUUID(),'if-match':'"team-1"'})).status).toBe(403);
 if(role!=='ADMIN')expect((await o.f.http(path(o.ws),'POST',other.client,teamInput(),{'idempotency-key':randomUUID()})).status).toBe(403);
});
for(const status of ['SUSPENDED','INVITED'] as const)test(`${status} owner loses read/update; reactivation requires fresh authority`,async()=>{
 const o=await owned(),t=await make(o);await another(o,'ADMIN');
 await database.client.workspaceMembership.update({where:{workspaceId_id:{workspaceId:o.ws,id:o.member}},data:{status}});
 expect((await o.f.http(path(o.ws,t.row.id),'GET',o.client)).status).toBe(404);
 expect((await o.f.http(path(o.ws,t.row.id),'PATCH',o.client,{name:'No'},{'idempotency-key':randomUUID(),'if-match':'"team-1"'})).status).toBe(404);
 await database.client.workspaceMembership.update({where:{workspaceId_id:{workspaceId:o.ws,id:o.member}},data:{status:'ACTIVE'}});
 expect((await o.f.http(path(o.ws,t.row.id),'GET',o.client)).status).toBe(200);
});
test('demotion and durable epoch revocation are not blocked by ownership',async()=>{
 const o=await owned(),t=await make(o);await another(o,'ADMIN');
 await database.client.workspaceMembership.update({where:{workspaceId_id:{workspaceId:o.ws,id:o.member}},data:{role:'MEMBER'}});
 expect((await o.f.http(path(o.ws,t.row.id),'GET',o.client)).status).toBe(200);
 expect((await o.f.http(path(o.ws,t.row.id),'PATCH',o.client,{name:'Denied'},{'idempotency-key':randomUUID(),'if-match':'"team-1"'})).status).toBe(403);
 await fences.revokeAll(o.userId);expect((await o.f.http(path(o.ws,t.row.id),'GET',o.client)).status).toBe(401);
 expect((await database.client.team.findUniqueOrThrow({where:{workspaceId_id:{workspaceId:o.ws,id:t.row.id}}})).ownerMembershipId).toBe(o.member);
});
test('archived Team/Workspace metadata reads remain scoped; all foundation writes reject',async()=>{
 const o=await owned(),t=await make(o);
 await database.client.team.update({where:{workspaceId_id:{workspaceId:o.ws,id:t.row.id}},data:{status:'ARCHIVED'}});
 expect((await o.f.http(path(o.ws,t.row.id),'GET',o.client)).status).toBe(200);
 expect((await o.f.http(path(o.ws)+'?status=ARCHIVED','GET',o.client)).status).toBe(200);
 expect((await o.f.http(path(o.ws,t.row.id),'PATCH',o.client,{name:'No'},{'idempotency-key':randomUUID(),'if-match':'"team-1"'})).status).toBe(403);
 await database.client.workspace.update({where:{id:o.ws},data:{status:'ARCHIVED'}});
 expect((await o.f.http(path(o.ws,t.row.id),'GET',o.client)).status).toBe(200);
 expect((await o.f.http(path(o.ws),'POST',o.client,teamInput(),{'idempotency-key':randomUUID()})).status).toBe(403);
});
test('cross-tenant paths and creator/role/owner forgery fail closed',async()=>{
 const a=await owned(),b=await owned(),t=await make(a);
 expect((await b.f.http(path(a.ws,t.row.id),'GET',b.client)).status).toBe(404);
 expect((await a.f.http(path(b.ws,t.row.id),'GET',a.client)).status).toBe(404);
 expect((await a.f.http(path(a.ws),'POST',a.client,{...teamInput(),ownerMembershipId:a.member},{'idempotency-key':randomUUID()})).status).toBe(400);
 expect((await a.f.http(path(a.ws),'GET')).status).toBe(401);
 expect((await a.f.http(path(a.ws),'POST',undefined,teamInput(),{'idempotency-key':randomUUID()})).status).toBe(403);
 expect((await a.f.http(path(a.ws),'POST',a.client,teamInput(),{'idempotency-key':randomUUID(),'x-csrf-token':'wrong'})).status).toBe(403);
});
test('metadata byte/color bounds and duplicate/unsupported query fields reject',async()=>{
 const o=await owned();
 for(const data of [{name:'',key:'ENG'},{...teamInput(),description:'a'.repeat(2001)},{...teamInput(),color:'url(secret)'},{...teamInput(),key:'lower'}])expect((await o.f.http(path(o.ws),'POST',o.client,data,{'idempotency-key':randomUUID()})).status).toBe(400);
 for(const query of ['limit=0','limit=101','limit=1&limit=2','sort=name','expand=all'])expect((await o.f.http(path(o.ws)+'?'+query,'GET',o.client)).status).toBe(400);
 const t=await make(o,{...teamInput(),name:'🎯'.repeat(120),description:'🎯'.repeat(2000)});expect(t.row.description.length).toBe(4000);
});
test('unimplemented BE-TEAM-02 routes stay denied',async()=>{
 const o=await owned(),t=await make(o);
 for(const suffix of ['/memberships','/ownership-transfer','/archive','/restore']){const response=await o.f.http(path(o.ws,t.row.id)+suffix,'POST',o.client,{}, {'idempotency-key':randomUUID()});expect([403,404]).toContain(response.status);}
});

test('signed bounded paging binds actor/scope/query/revision; retired keys reject',async()=>{
 const o=await owned(),a=await make(o,{...teamInput(),key:'ONE'});await make(o,{...teamInput(),key:'TWO'});await make(o,{...teamInput(),key:'THR'});
 const first=await o.f.http(path(o.ws)+'?limit=1','GET',o.client),page=await first.json();expect(page.items).toHaveLength(1);expect(page.page.hasMore).toBe(true);const token=page.page.nextCursor as string;
 const second=await o.f.http(path(o.ws)+'?limit=1&after='+token,'GET',o.client);expect(second.status).toBe(200);expect((await second.json()).items[0].id).not.toBe(page.items[0].id);
 expect((await o.f.http(path(o.ws,a.row.id),'PATCH',o.client,{name:'Live metadata'},{'idempotency-key':randomUUID(),'if-match':'"team-1"'})).status).toBe(200);
 expect((await o.f.http(path(o.ws)+'?limit=1&after='+token,'GET',o.client)).status).toBe(200);
 for(const tail of ['&status=ALL','&limit=2'])expect((await o.f.http(path(o.ws)+'?limit=1&after='+token+tail,'GET',o.client)).status).toBe(400);
 expect((await o.f.http(path(o.ws)+'?limit=1&after='+token.slice(0,-1)+'!','GET',o.client)).status).toBe(400);
 const other=await another(o,'ADMIN');expect((await o.f.http(path(o.ws)+'?limit=1&after='+token,'GET',other.client)).status).toBe(400);
 // Team insertion and explicit joins invalidate the server policy revision.
 expect((await o.f.http(path(o.ws)+'?limit=1&after='+token,'GET',o.client)).status).toBe(409);
 await database.client.team.update({where:{workspaceId_id:{workspaceId:o.ws,id:a.row.id}},data:{status:'ARCHIVED'}});
 expect((await o.f.http(path(o.ws)+'?status=ARCHIVED','GET',o.client)).status).toBe(200);
 const retired=await fixture({settings:o.f.settings,keys:{active:'v2',cursors:{v2:randomBytes(32).toString('hex')},idempotency:workspaceKeys.idempotency}});
 expect((await retired.http(path(o.ws)+'?limit=1&after='+token,'GET',o.client)).status).toBe(400);
});
test('same-key concurrent POST and competing CAS PATCH have single effects',async()=>{
 const o=await owned(),body=teamInput(),key=randomUUID();
 const posts=await Promise.all([0,1].map(()=>o.f.http(path(o.ws),'POST',o.client,body,{'idempotency-key':key})));
 expect(posts.some(r=>r.status===201)).toBe(true);for(const response of posts)expect([201,409,503]).toContain(response.status);
 const replay=await o.f.http(path(o.ws),'POST',o.client,body,{'idempotency-key':key});expect(replay.status).toBe(201);const team=await replay.json();
 expect(await database.client.team.count({where:{workspaceId:o.ws}})).toBe(1);
 const patch=await Promise.all(['First','Second'].map(name=>o.f.http(path(o.ws,team.id),'PATCH',o.client,{name},{'idempotency-key':randomUUID(),'if-match':'"team-1"'})));
 expect(patch.filter(r=>r.status===200)).toHaveLength(1);expect([409,412,503]).toContain(patch.find(r=>r.status!==200)!.status);
 expect((await database.client.team.findUniqueOrThrow({where:{workspaceId_id:{workspaceId:o.ws,id:team.id}}})).version).toBe(2n);
 expect(await database.client.teamMutationResult.count({where:{workspaceId:o.ws}})).toBe(2);
});
test('SQL enforces deferred owner membership, immutable binding, metadata and receipt retention',async()=>{
 const o=await owned(),t=await make(o),where={workspaceId_id:{workspaceId:o.ws,id:t.row.id}};
 await expect(Promise.resolve(database.client.team.create({data:{workspaceId:o.ws,key:'BAD',name:'No owner'}}))).rejects.toThrow();
 await expect(Promise.resolve(database.client.team.create({data:{workspaceId:o.ws,key:'OLD',name:'Legacy bypass',legacyQuarantined:true}}))).rejects.toThrow();
 await expect(Promise.resolve(database.client.team.create({data:{workspaceId:o.ws,key:'NEW',name:'Missing join',ownerMembershipId:o.member}}))).rejects.toThrow();
 for(const data of [{key:'NEW'},{ownerMembershipId:randomUUID()},{legacyQuarantined:true},{name:'Wrong version'},{color:'#ffffff',version:2n}])await expect(Promise.resolve(database.client.team.update({where,data}))).rejects.toThrow();
 await expect(Promise.resolve(database.client.teamMembership.delete({where:{workspaceId_teamId_membershipId:{workspaceId:o.ws,teamId:t.row.id,membershipId:o.member}}}))).rejects.toThrow();
 const receipt=await database.client.teamMutationResult.findFirstOrThrow({where:{workspaceId:o.ws}});
 await expect(Promise.resolve(database.client.teamMutationResult.delete({where:{id:receipt.id}}))).rejects.toThrow();
 await expect(Promise.resolve(database.client.teamMutationResult.update({where:{id:receipt.id},data:{payloadDigest:'0'.repeat(64)}}))).rejects.toThrow();
 await expect(Promise.resolve(database.client.$executeRaw`UPDATE team_receipt_budgets SET used=0 WHERE scope='deployment'`)).rejects.toThrow();
 const count=await database.client.teamMutationResult.count({where:{workspaceId:o.ws}});
 await expect(database.transaction(async tx=>{await tx.teamMutationResult.create({data:{workspaceId:o.ws,actorId:o.userId,operation:'team:create:v1',requestKey:randomUUID(),payloadDigest:'0'.repeat(64),teamId:t.row.id,retainUntil:new Date(Date.now()+86401000)}});})).rejects.toThrow();
 expect(await database.client.teamMutationResult.count({where:{workspaceId:o.ws}})).toBe(count);
 expect(await budget('workspace:'+o.ws)).toBe(count);
});
test('read and creation admission enforce real Valkey budgets; outages fail closed',async()=>{
 const o=await owned(),limits=new TeamLimits(cache,o.f.settings.secrets[0]!,o.f.settings.prefix+'isolated:');
 for(let i=0;i<5;i++)expect((await limits.consume('create',o.userId,o.ws)).allowed).toBe(true);
 const denied=await limits.consume('create',o.userId,o.ws);expect(denied.allowed).toBe(false);expect(denied.retryAfter).toBeGreaterThan(0);
 const dead=createRedis('redis://:test-only@127.0.0.1:1');dead.on('error',()=>{});const unavailable=new TeamLimits(dead,'test-only',o.f.settings.prefix+'dead:');
 try{await expect(unavailable.consume('read',o.userId,o.ws)).rejects.toThrow('Authentication');}finally{dead.disconnect();}
 for(let i=0;i<60;i++)expect((await limits.consume('read',o.userId,o.ws)).allowed).toBe(true);
 expect((await limits.consume('read',o.userId,o.ws)).allowed).toBe(false);
});
test('original ten-migration upgrade quarantines legacy ownerless Teams with data/history intact',async()=>{
 const upgradeName=name+'_upgrade',upgradeUrl=new URL(config.DATABASE_URL);upgradeUrl.pathname='/'+upgradeName;
 const up=new Database(upgradeUrl.toString()),directory=await mkdtemp(resolve(tmpdir(),'team-upgrade-'));let exists=false;
 try{
  const schema=Bun.spawn(['git','show','d4b958c74d7383cd269e693745738b3534cd44af:packages/database/prisma/schema.prisma'],{cwd:root,stdout:'pipe'});await writeFile(resolve(directory,'schema.prisma'),await new Response(schema.stdout).text());expect(await schema.exited).toBe(0);
  const original=(await admin.client.$queryRaw<{migration_name:string}[]>`SELECT migration_name FROM _prisma_migrations ORDER BY migration_name`).map(r=>r.migration_name).filter(m=>m!=='20261014000000_team_foundation');
  // Selected application DB may have fewer migrations; the checked-in history is authoritative.
  const {readdir}=await import('node:fs/promises');const migrations=(await readdir(resolve(root,'packages/database/prisma/migrations'))).filter(m=>/^2026/.test(m)&&m!=='20261014000000_team_foundation');expect(migrations).toHaveLength(10);void original;
  for(const migration of ['migration_lock.toml',...migrations])await cp(resolve(root,'packages/database/prisma/migrations',migration),resolve(directory,'migrations',migration),{recursive:true});
  await admin.client.$executeRawUnsafe(`CREATE DATABASE "${upgradeName}"`);exists=true;
  await prisma(['migrate','deploy','--schema',resolve(directory,'schema.prisma')],upgradeUrl.toString());await up.connect();
  const user=randomUUID(),identity=randomUUID(),ws=randomUUID(),member=randomUUID(),team=randomUUID();
  await up.transaction(async tx=>{await tx.user.create({data:{id:user,name:'Legacy owner candidate'}});await tx.identity.create({data:{id:identity,userId:user,provider:'test-legacy',subject:user}});await tx.workspace.create({data:{id:ws,name:'Legacy workspace',slug:ws}});await tx.workspaceMembership.create({data:{workspaceId:ws,id:member,userId:user,role:'ADMIN',status:'ACTIVE'}});await tx.$executeRaw`INSERT INTO teams(workspace_id,id,key,name) VALUES(${ws}::uuid,${team}::uuid,'OLD','Legacy retained')`;await tx.teamMembership.create({data:{workspaceId:ws,teamId:team,membershipId:member}});});
  const history=await up.client.$queryRaw<{migration_name:string;checksum:string;finished_at:Date}[]>`SELECT migration_name,checksum,finished_at FROM _prisma_migrations ORDER BY migration_name`;
  await prisma(['migrate','deploy','--schema','packages/database/prisma/schema.prisma'],upgradeUrl.toString());
  const after=await up.client.$queryRaw<typeof history>`SELECT migration_name,checksum,finished_at FROM _prisma_migrations ORDER BY migration_name`;expect(after.slice(0,10)).toEqual(history);expect(after).toHaveLength(11);
  const legacy=await up.client.team.findUniqueOrThrow({where:{workspaceId_id:{workspaceId:ws,id:team}}});expect(legacy.name).toBe('Legacy retained');expect(legacy.legacyQuarantined).toBe(true);expect(legacy.ownerMembershipId).toBeNull();
  const f=new AuthFences(up),session=await f.create({userId:user,identityId:identity,sidDigest:randomBytes(32).toString('hex'),absoluteExpiresAt:new Date(Date.now()+60000),idleExpiresAt:new Date(Date.now()+60000)});
  const tenancy=new Tenancy(up,{verify:async()=>null},denyAll,{verify:async()=>session},undefined,workspaceKeys);
  await tenancy.authenticateSession('test-only',async p=>{expect((await tenancy.listTeams(p,ws,{limit:50,status:'ALL'})).items).toEqual([]);await expect(tenancy.detailTeam(p,ws,team)).rejects.toThrow('NOT_FOUND');await expect(tenancy.updateTeam(p,ws,team,{name:'Guessed owner'},randomUUID(),'"team-1"')).rejects.toThrow('NOT_FOUND');});
  expect(await prisma(['migrate','deploy','--schema','packages/database/prisma/schema.prisma'],upgradeUrl.toString())).toContain('No pending migrations');
  expect(await prisma(['migrate','diff','--from-schema-datasource','packages/database/prisma/schema.prisma','--to-schema-datamodel','packages/database/prisma/schema.prisma','--exit-code'],upgradeUrl.toString())).toContain('No difference');
 }finally{await up.close();if(exists)await admin.client.$executeRawUnsafe(`DROP DATABASE "${upgradeName}" WITH (FORCE)`);await rm(directory,{recursive:true,force:true});}
},30000);

test('forged/non-session principals cannot use closed Team capabilities',async()=>{
 const o=await owned();await expect(o.f.tenancy.listTeams({} as VerifiedPrincipal,o.ws,{status:'ALL',limit:50})).rejects.toBeInstanceOf(TenantAccessError);
 const nonSession=new Tenancy(database,{verify:async()=>({provider:'local-password',subject:o.userId})},denyAll,undefined,undefined,workspaceKeys);
 await expect(nonSession.detailTeam({} as VerifiedPrincipal,o.ws,randomUUID())).rejects.toBeInstanceOf(TenantAccessError);
});
test('properly signed expired and wrong-operation Team cursors are rejected',async()=>{
 const o=await owned();await make(o,{...teamInput(),key:'ONE'});await make(o,{...teamInput(),key:'TWO'});
 const token=(await (await o.f.http(path(o.ws)+'?limit=1','GET',o.client)).json()).page.nextCursor as string;
 const decoded=JSON.parse(Buffer.from(token.split('.')[0]!,'base64url').toString());
 for(const change of [{issued:Date.now()-1000000,expires:Date.now()-1000},{operation:'workspace:members:list:v1'}]){
  const encoded=Buffer.from(JSON.stringify({...decoded,...change})).toString('base64url'),signature=createHmac('sha256',Buffer.from(workspaceKeys.cursors.v1,'hex')).update('unblok-team-cursor-v1\0'+encoded).digest('base64url');
  expect((await o.f.http(path(o.ws)+'?limit=1&after='+encoded+'.'+signature,'GET',o.client)).status).toBe(400);
 }
});
function gate(){let release!:()=>void;const wait=new Promise<void>(r=>{release=r;});return {wait,release};}
function observeDatabase(observer:(sql:string,stage:'before'|'after')=>Promise<void>){
 return new Proxy(database,{get(target,property){if(property==='transaction')return (run:Parameters<Database['transaction']>[0])=>target.transaction(tx=>run(new Proxy(tx,{get(t,prop){const value=Reflect.get(t,prop);if((prop==='$executeRaw'||prop==='$queryRaw')&&typeof value==='function')return async (...args:unknown[])=>{const a=args[0] as {strings?:readonly string[]}|readonly string[],sql=Array.isArray(a)?a.join('?'):(a as {strings?:readonly string[]}).strings?.join('?')??'';await observer(sql,'before');const result=await Reflect.apply(value,t,args);await observer(sql,'after');return result;};if(value&&typeof value==='object'&&typeof prop==='string'&&['workspaceMembership','passwordCredential','teamMutationResult','identity','user','team','teamMembership'].includes(prop))return new Proxy(value,{get(delegate,method){const fn=Reflect.get(delegate,method);if(typeof fn==='function')return async(...args:unknown[])=>{await observer('model:'+prop+'.'+String(method),'before');const result=await Reflect.apply(fn,delegate,args);await observer('model:'+prop+'.'+String(method),'after');return result;};return fn;}});return typeof value==='function'?value.bind(t):value;}})));const value=Reflect.get(target,property);return typeof value==='function'?value.bind(target):value;}});
}
async function waiting(){
 const started=Date.now();while(Date.now()-started<900){const rows=await admin.client.$queryRaw<{n:bigint}[]>`SELECT count(*) AS n FROM pg_stat_activity WHERE datname=${name} AND wait_event_type='Lock'`;if(rows[0]!.n>0n)return;await Bun.sleep(10);}throw new Error('Expected primary lock wait');
}
test('held creation versus same-key HTTP contender proves primary lock wait and authorized reconciliation',async()=>{
 const held=gate(),entered=gate();let paused=false;
 const proxy=observeDatabase(async(sql,stage)=>{if(stage==='after'&&!paused&&sql.includes('UPDATE team_mutation_results SET result=')){paused=true;entered.release();await held.wait;}});
 const o=await owned({database:proxy}),body=teamInput(),key=randomUUID();
 const first=o.f.http(path(o.ws),'POST',o.client,body,{'idempotency-key':key});await withDeadline(entered.wait,2000);
 const contender=o.f.http(path(o.ws),'POST',o.client,body,{'idempotency-key':key});
 try{await waiting();}finally{held.release();}
 const confirmed=await first,other=await contender;expect(confirmed.status).toBe(201);expect([201,409,503]).toContain(other.status);if(other.status===201)expect(await other.json()).toEqual(await confirmed.json());
 const retry=await o.f.http(path(o.ws),'POST',o.client,body,{'idempotency-key':key});expect(retry.status).toBe(201);
 expect(await database.client.team.count({where:{workspaceId:o.ws}})).toBe(1);expect(await database.client.teamMutationResult.count({where:{workspaceId:o.ws}})).toBe(1);
});
test('revocation-first primary wait denies metadata effect after suspension commits',async()=>{
 const o=await owned(),t=await make(o);await another(o,'ADMIN');const held=gate(),entered=gate();
 const revoke=database.transaction(async tx=>{await tx.$queryRaw`SELECT id FROM workspaces WHERE id=${o.ws}::uuid FOR UPDATE`;await tx.workspaceMembership.update({where:{workspaceId_id:{workspaceId:o.ws,id:o.member}},data:{status:'SUSPENDED'}});entered.release();await held.wait;});
 await withDeadline(entered.wait,2000);const update=o.f.http(path(o.ws,t.row.id),'PATCH',o.client,{name:'Must not commit'},{'idempotency-key':randomUUID(),'if-match':'"team-1"'});
 try{await waiting();}finally{held.release();}await revoke;expect([404,409,503]).toContain((await update).status);
 expect((await o.f.http(path(o.ws,t.row.id),'GET',o.client)).status).toBe(404);expect((await database.client.team.findUniqueOrThrow({where:{workspaceId_id:{workspaceId:o.ws,id:t.row.id}}})).version).toBe(1n);
 expect(await database.client.teamMutationResult.count({where:{workspaceId:o.ws}})).toBe(1);
});
test('operation-first metadata can finish before suspension; later reads are denied',async()=>{
 const held=gate(),entered=gate();let paused=false;
 const proxy=observeDatabase(async(sql,stage)=>{if(stage==='after'&&!paused&&sql.includes('UPDATE team_mutation_results SET result=')){paused=true;entered.release();await held.wait;}});
 const o=await owned({database:proxy}); // Pause first creation and release before arranging PATCH.
 const creating=make(o);await withDeadline(entered.wait,2000);held.release();const t=await creating;await another(o,'ADMIN');
 const patchHeld=gate(),patchEntered=gate();let patchPaused=false;
 const patchDb=observeDatabase(async(sql,stage)=>{if(stage==='after'&&!patchPaused&&sql.includes('UPDATE team_mutation_results SET result=')){patchPaused=true;patchEntered.release();await patchHeld.wait;}});
 const app=await fixture({database:patchDb,settings:o.f.settings});
 const updating=app.http(path(o.ws,t.row.id),'PATCH',o.client,{name:'Before suspension'},{'idempotency-key':randomUUID(),'if-match':'"team-1"'});await withDeadline(patchEntered.wait,2000);
 const suspend=database.transaction(async tx=>{await tx.$queryRaw`SELECT id FROM workspaces WHERE id=${o.ws}::uuid FOR UPDATE`;await tx.workspaceMembership.update({where:{workspaceId_id:{workspaceId:o.ws,id:o.member}},data:{status:'SUSPENDED'}});});
 try{await waiting();}finally{patchHeld.release();}
 expect((await updating).status).toBe(200);const result=await Promise.allSettled([suspend]);
 if(result[0]!.status==='rejected')await database.transaction(async tx=>{await tx.$queryRaw`SELECT id FROM workspaces WHERE id=${o.ws}::uuid FOR UPDATE`;await tx.workspaceMembership.update({where:{workspaceId_id:{workspaceId:o.ws,id:o.member}},data:{status:'SUSPENDED'}});});
 expect((await app.http(path(o.ws,t.row.id),'GET',o.client)).status).toBe(404);expect((await database.client.team.findUniqueOrThrow({where:{workspaceId_id:{workspaceId:o.ws,id:t.row.id}}})).version).toBe(2n);
});
test('committed HTTP response loss reconciles with original key without a second Team',async()=>{
 const o=await owned(),body=teamInput(),key=randomUUID();const {createServer}=await import('node:http');let upstreamStatus=0;
 const proxy=createServer(async(req,res)=>{try{let bytes='';for await(const chunk of req)bytes+=chunk;const response=await fetch(o.f.url+req.url,{method:req.method!,headers:{origin:config.CORS_ORIGINS[0]!,cookie:o.client.cookie,'x-csrf-token':o.client.csrf,'idempotency-key':key,'content-type':'application/json'},body:bytes});upstreamStatus=response.status;await response.arrayBuffer();res.socket?.destroy();}catch{res.destroy();}});
 await new Promise<void>(r=>proxy.listen(0,'127.0.0.1',r));const address=proxy.address();if(!address||typeof address==='string')throw new Error('Missing proxy listener');
 try{const received=await fetch(`http://127.0.0.1:${address.port}`+path(o.ws),{method:'POST',body:JSON.stringify(body)}).catch(()=>null);if(received)expect(await received.text()).toBe('');expect(upstreamStatus).toBe(201);}finally{await new Promise<void>(r=>proxy.close(()=>r()));}
 expect(await database.client.team.count({where:{workspaceId:o.ws}})).toBe(1);
 const response=await o.f.http(path(o.ws),'POST',o.client,body,{'idempotency-key':key});expect(response.status).toBe(201);expect(await database.client.teamMutationResult.count({where:{workspaceId:o.ws}})).toBe(1);
});

test('bounded query plans, constant business-query counts and byte-capped pages',async()=>{
 const observed:string[]=[];
 const proxy=observeDatabase(async(sql,stage)=>{if(stage==='before')observed.push(sql.replace(/\s+/g,' ').trim());});
 const o=await owned({database:proxy});
 await database.transaction(async tx=>{
  for(let i=0;i<105;i++){const id=randomUUID();await tx.team.create({data:{workspaceId:o.ws,id,ownerMembershipId:o.member,key:'T'+String(i).padStart(3,'0'),name:'Measured '+i,description:'x'.repeat(2000)}});await tx.teamMembership.create({data:{workspaceId:o.ws,teamId:id,membershipId:o.member}});}
 });
 const measure=async(limit:number)=>{observed.length=0;const start=performance.now(),response=await o.f.http(path(o.ws)+'?limit='+limit,'GET',o.client),payload=await response.text();expect(response.status).toBe(200);const page=JSON.parse(payload);expect(Buffer.byteLength(payload)).toBeLessThanOrEqual(131072);expect(page.items.length).toBeLessThanOrEqual(limit);expect(page.page.hasMore).toBe(true);
  const business=observed.filter(sql=>sql.includes(' FROM teams t JOIN team_memberships tm '));expect(business).toHaveLength(1);expect(business[0]).toContain('LIMIT ?');const selects=observed.filter(sql=>sql.startsWith('SELECT ')||/^model:.*\.(findUnique|findUniqueOrThrow|findFirst|findFirstOrThrow|findMany|count)$/.test(sql)).length;return {totalObservedSelectsIncludingAuth:selects,limit,returned:page.items.length,bytes:Buffer.byteLength(payload),elapsedMs:Math.round((performance.now()-start)*100)/100,teamSelects:business.length,page};};
 const one=await measure(1),hundred=await measure(100);expect(hundred.totalObservedSelectsIncludingAuth).toBe(one.totalObservedSelectsIncludingAuth);expect(hundred.returned).toBeLessThan(100);expect(hundred.returned).toBeGreaterThan(1);
 const next=await o.f.http(path(o.ws)+'?limit=100&after='+hundred.page.page.nextCursor,'GET',o.client);expect(next.status).toBe(200);expect((await next.json()).items[0].id).not.toBe(hundred.page.items.at(-1).id);
 await database.client.$executeRawUnsafe('ANALYZE teams');await database.client.$executeRawUnsafe('ANALYZE team_memberships');
 const plans=await database.client.$queryRaw<unknown[]>`EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) SELECT t.workspace_id,t.id,t.key,t.name,t.description,t.color,t.status,t.created_at,t.version,t.owner_membership_id FROM teams t JOIN team_memberships tm ON tm.workspace_id=t.workspace_id AND tm.team_id=t.id WHERE t.workspace_id=${o.ws}::uuid AND tm.membership_id=${o.member}::uuid AND NOT t.legacy_quarantined AND t.status='ACTIVE' ORDER BY t.created_at,t.id LIMIT 101`;
 const text=JSON.stringify(plans);expect(text).toContain('Actual Rows');expect(text).toContain('Execution Time');
 await mkdir(resolve(root,'docs/backend/evidence'),{recursive:true});
 const strip=(value:Record<string,unknown>)=>Object.fromEntries(Object.entries(value).filter(([key])=>key!=='page'));
 await writeFile(resolve(root,'docs/backend/evidence/BE-TEAM-01-query-plan.json'),JSON.stringify({dataset:{visibleTeams:105},measurements:[strip(one),strip(hundred)],plan:plans,limits:{candidateLimit:101,responseBytes:131072},limitations:'Owned local dataset only; no enterprise capacity, deployment throughput or stable timing claim.'},null,2)+'\n');
},20000);

test('expired receipt compacts to immutable tombstone and never reexecutes',async()=>{
 const o=await owned(),t=await make(o),key=randomUUID();
 const payload=JSON.stringify({operation:'team:create:v1',workspace:o.ws,actor:o.userId,target:null,match:null,body:{name:t.body.name,key:t.body.key,description:t.body.description,color:t.body.color}});
 const digest=createHmac('sha256',Buffer.from(workspaceKeys.idempotency,'hex')).update('unblok-team-receipt-v1\0'+payload).digest('hex');
 const id=randomUUID();await database.transaction(async tx=>{await tx.$queryRaw`SELECT id FROM workspaces WHERE id=${o.ws}::uuid FOR UPDATE`;await tx.$executeRaw`INSERT INTO team_mutation_results(id,workspace_id,actor_id,operation,request_key,payload_digest,team_id,result,completed_at,retain_until) VALUES(${id}::uuid,${o.ws}::uuid,${o.userId}::uuid,'team:create:v1',${key}::uuid,${digest},${t.row.id}::uuid,${JSON.stringify(t.row)}::jsonb,date_trunc('milliseconds',statement_timestamp())-interval '25 hours',date_trunc('milliseconds',statement_timestamp())-interval '1 hour')`;});
 const response=await o.f.http(path(o.ws),'POST',o.client,t.body,{'idempotency-key':key});expect(response.status).toBe(409);expect((await response.json()).error.code).toBe('IDEMPOTENCY_RESULT_EXPIRED');
 expect((await database.client.teamMutationResult.findUniqueOrThrow({where:{id}})).result).toBeNull();
 expect((await o.f.http(path(o.ws),'POST',o.client,t.body,{'idempotency-key':key})).status).toBe(409);
 await expect(Promise.resolve(database.client.teamMutationResult.update({where:{id},data:{result:t.row}}))).rejects.toThrow();
 expect(await database.client.team.count({where:{workspaceId:o.ws}})).toBe(1);
});
test('closed metadata port rejects unexpected mutation fields instead of mass assignment',async()=>{
 const o=await owned(),t=await make(o),family=await database.client.authSessionFamily.findFirstOrThrow({where:{userId:o.userId,revokedAt:null}});
 const evidence={familyId:family.id,userId:family.userId,identityId:family.identityId,authEpoch:family.authEpoch,generation:family.generation,sidDigest:family.sidDigest};
 const tenancy=new Tenancy(database,{verify:async()=>null},denyAll,{verify:async()=>evidence},undefined,workspaceKeys);
 await tenancy.authenticateSession('test-only',async p=>{await expect(tenancy.updateTeam(p,o.ws,t.row.id,{name:'Forbidden status',status:'ARCHIVED'} as {name:string},randomUUID(),'"team-1"')).rejects.toThrow('INVALID_REQUEST');});
 expect((await database.client.team.findUniqueOrThrow({where:{workspaceId_id:{workspaceId:o.ws,id:t.row.id}}})).status).toBe('ACTIVE');
});
test('F1 direct and unrelated nested-trigger writes cannot forge derived budgets or slot changes',async()=>{
 const o=await owned(),t=await make(o),before=await budget('deployment');
 await expect(Promise.resolve(database.client.$executeRawUnsafe('TRUNCATE team_mutation_results'))).rejects.toThrow('Team receipt retained');
 for(const sql of ["UPDATE team_receipt_budgets SET used=0 WHERE scope='deployment'","UPDATE team_receipt_budgets SET used=used+1 WHERE scope='deployment'","INSERT INTO team_receipt_budgets(scope,used) VALUES ('forged',1)","DELETE FROM team_receipt_budgets WHERE scope='deployment'"]){await expect(Promise.resolve(database.client.$executeRawUnsafe(sql))).rejects.toThrow();}
 for(const assignment of ['used=0','used=used+1'])await expect(database.transaction(async tx=>{
  await tx.$executeRawUnsafe('CREATE TEMP TABLE f1_outer(id integer);');
  await tx.$executeRawUnsafe('CREATE TEMP TABLE f1_inner(id integer);');
  await tx.$executeRawUnsafe(`CREATE FUNCTION pg_temp.f1_outer_write() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN INSERT INTO f1_inner VALUES(NEW.id); RETURN NEW; END $$`);
  await tx.$executeRawUnsafe(`CREATE FUNCTION pg_temp.f1_inner_write() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN UPDATE public.team_receipt_budgets SET ${assignment} WHERE scope='deployment'; RETURN NEW; END $$`);
  await tx.$executeRawUnsafe('CREATE TRIGGER outer_write AFTER INSERT ON f1_outer FOR EACH ROW EXECUTE FUNCTION pg_temp.f1_outer_write()');
  await tx.$executeRawUnsafe('CREATE TRIGGER inner_write AFTER INSERT ON f1_inner FOR EACH ROW EXECUTE FUNCTION pg_temp.f1_inner_write()');
  await tx.$executeRawUnsafe('INSERT INTO f1_outer VALUES(1)');
 })).rejects.toThrow('cannot update view "team_receipt_budgets"');
 const receipt=await database.client.teamMutationResult.findFirstOrThrow({where:{workspaceId:o.ws}});
 for(const data of [{deploymentSlot:receipt.deploymentSlot+1},{workspaceSlot:receipt.workspaceSlot+1}])await expect(Promise.resolve(database.client.teamMutationResult.update({where:{id:receipt.id},data}))).rejects.toThrow('Receipt binding immutable');
 expect(await budget('deployment')).toBe(before);expect(await database.client.team.count({where:{workspaceId:o.ws}})).toBe(1);expect(t.row.version).toBe('1');
});
test('F1 caller-supplied slots are overridden and rollback/database errors release admission without gaps',async()=>{
 const o=await owned(),t=await make(o),before=await budget('deployment');
 const insert=async(tx:Parameters<Parameters<Database['transaction']>[0]>[0],id:string)=>tx.$executeRaw`INSERT INTO team_mutation_results(id,workspace_id,actor_id,operation,request_key,payload_digest,team_id,result,completed_at,retain_until,deployment_slot,workspace_slot)
 VALUES(${id}::uuid,${o.ws}::uuid,${o.userId}::uuid,'team:create:v1',${randomUUID()}::uuid,${'0'.repeat(64)},${t.row.id}::uuid,NULL,date_trunc('milliseconds',statement_timestamp())-interval '25 hours',date_trunc('milliseconds',statement_timestamp())-interval '1 hour',20000,2000)`;
 for(const cause of ['rollback','database error'])await expect(database.transaction(async tx=>{
  await tx.$queryRaw`SELECT id FROM workspaces WHERE id=${o.ws}::uuid FOR UPDATE`;const pending=randomUUID();await insert(tx,pending);
  const allocated=await tx.teamMutationResult.findUniqueOrThrow({where:{id:pending}});expect(allocated.deploymentSlot).toBe(before+1);expect(allocated.workspaceSlot).toBe(2);
  if(cause==='rollback')throw new Error('Expected owned rollback');await tx.$queryRawUnsafe('SELECT 1/0');
 })).rejects.toThrow(cause==='rollback'?'Expected owned rollback':'division by zero');
 expect(await budget('deployment')).toBe(before);expect(await budget('workspace:'+o.ws)).toBe(1);
 const id=randomUUID();await database.transaction(async tx=>{await tx.$queryRaw`SELECT id FROM workspaces WHERE id=${o.ws}::uuid FOR UPDATE`;await insert(tx,id);});
 const receipt=await database.client.teamMutationResult.findUniqueOrThrow({where:{id}});expect(receipt.deploymentSlot).toBe(before+1);expect(receipt.workspaceSlot).toBe(2);expect(await budget('deployment')).toBe(before+1);
 const deploymentPlan=await database.client.$queryRaw<unknown[]>`EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) SELECT COALESCE(max(deployment_slot),0)+1 FROM team_mutation_results`;
 const workspacePlan=await database.client.$queryRaw<unknown[]>`EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) SELECT COALESCE(max(workspace_slot),0)+1 FROM team_mutation_results WHERE workspace_id=${o.ws}::uuid`;
 expect(JSON.stringify(deploymentPlan)).toContain('team_receipt_deployment_slot_key');expect(JSON.stringify(workspacePlan)).toContain('team_receipt_workspace_slot_key');
 await writeFile(resolve(root,'docs/backend/evidence/be-team-01/F1-admission-query-plans.json'),JSON.stringify({deploymentPlan,workspacePlan,limits:{deploymentSlots:20000,workspaceSlots:2000},limitations:'Local owned data; advisory-lock contention and deployment capacity are not benchmark-certified.'},null,2)+'\n');

});
test('F1 cross-Workspace creation waits on deployment admission and cannot duplicate a slot',async()=>{
 const held=gate(),entered=gate();let paused=false;
 const proxy=observeDatabase(async(sql,stage)=>{if(stage==='after'&&!paused&&sql.includes('UPDATE team_mutation_results SET result=')){paused=true;entered.release();await held.wait;}});
 const o=await owned({database:proxy}),response=await create(o.f,o.client);expect(response.status).toBe(201);const secondWorkspace=(await response.json()).workspace.id as string;
 const firstKey=randomUUID(),secondKey=randomUUID(),firstBody=teamInput(),secondBody=teamInput();
 const first=o.f.http(path(o.ws),'POST',o.client,firstBody,{'idempotency-key':firstKey});await withDeadline(entered.wait,2000);
 const second=o.f.http(path(secondWorkspace),'POST',o.client,secondBody,{'idempotency-key':secondKey});
 let waitObserved=false;const start=Date.now();
 try{while(Date.now()-start<900){const rows=await admin.client.$queryRaw<{n:bigint}[]>`SELECT count(*) AS n FROM pg_stat_activity WHERE datname=${name} AND wait_event='advisory'`;if(rows[0]!.n>0n){waitObserved=true;break;}await Bun.sleep(10);}expect(waitObserved).toBe(true);}finally{held.release();}
 expect((await first).status).toBe(201);const other=await second;expect([201,409,503]).toContain(other.status);
 const reconcile=await o.f.http(path(secondWorkspace),'POST',o.client,secondBody,{'idempotency-key':secondKey});expect(reconcile.status).toBe(201);
 const receipts=await database.client.teamMutationResult.findMany({where:{workspaceId:{in:[o.ws,secondWorkspace]}},select:{deploymentSlot:true,workspaceSlot:true}});
 expect(receipts).toHaveLength(2);expect(new Set(receipts.map(r=>r.deploymentSlot)).size).toBe(2);expect(receipts.every(r=>r.workspaceSlot===1)).toBe(true);
});
test('receipt caps include tombstones; full Workspace/deployment capacity preserves authorized replay',async()=>{
 const o=await owned(),t=await make(o);
 const seed=async(workspace:string,team:string,number:number)=>{for(let left=number;left>0;left-=Math.min(left,100)){
  const batch=Math.min(left,100);await database.transaction(async tx=>{await tx.$queryRaw`SELECT id FROM workspaces WHERE id=${workspace}::uuid FOR UPDATE`;
   await tx.$executeRaw`INSERT INTO team_mutation_results(id,workspace_id,actor_id,operation,request_key,payload_digest,team_id,result,completed_at,retain_until)
     SELECT gen_random_uuid(),${workspace}::uuid,${o.userId}::uuid,'team:create:v1',gen_random_uuid(),${'0'.repeat(64)},${team}::uuid,NULL,date_trunc('milliseconds',statement_timestamp())-interval '25 hours',date_trunc('milliseconds',statement_timestamp())-interval '1 hour' FROM generate_series(1,${batch})`;
  });
 }};
 await seed(o.ws,t.row.id,1999);
 expect(await budget('workspace:'+o.ws)).toBe(2000);
 const full=await o.f.http(path(o.ws),'POST',o.client,{...teamInput(),key:'NEW'},{'idempotency-key':randomUUID()});expect(full.status).toBe(503);expect(await database.client.team.count({where:{workspaceId:o.ws}})).toBe(1);
 const replay=await o.f.http(path(o.ws),'POST',o.client,t.body,{'idempotency-key':t.key});expect(replay.status).toBe(201);expect(await replay.json()).toEqual(t.row);
 let lastWorkspace='',lastTeam='';
 while(true){const used=await budget('deployment');if(used===20000)break;
  const workspace=randomUUID(),member=randomUUID(),team=randomUUID();
  await database.transaction(async tx=>{await tx.workspace.create({data:{id:workspace,slug:workspace,name:'Capacity-owned'}});await tx.workspaceMembership.create({data:{workspaceId:workspace,id:member,userId:o.userId,role:'ADMIN',status:'ACTIVE'}});await tx.team.create({data:{workspaceId:workspace,id:team,key:'CAP',name:'Capacity-owned',ownerMembershipId:member}});await tx.teamMembership.create({data:{workspaceId:workspace,teamId:team,membershipId:member}});});
  await seed(workspace,team,Math.min(2000,20000-used));lastWorkspace=workspace;lastTeam=team;
 }
 expect(await budget('deployment')).toBe(20000);
 const receiptsBefore=await database.client.teamMutationResult.count();
 expect((await o.f.http(path(lastWorkspace),'POST',o.client,teamInput(),{'idempotency-key':randomUUID()})).status).toBe(503);
 expect(await database.client.teamMutationResult.count()).toBe(receiptsBefore);expect(await database.client.team.count({where:{workspaceId:lastWorkspace}})).toBe(1);
 expect((await o.f.http(path(lastWorkspace,lastTeam),'GET',o.client)).status).toBe(200);
 await expect(Promise.resolve(database.client.$executeRaw`DELETE FROM team_receipt_budgets WHERE scope='deployment'`)).rejects.toThrow();
 expect((await o.f.http(path(o.ws),'POST',o.client,t.body,{'idempotency-key':t.key})).status).toBe(201);
},60000);
