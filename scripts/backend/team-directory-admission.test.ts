import { afterAll, beforeAll, expect, test } from 'bun:test';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
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
const admin = new Database(config.DATABASE_URL), name = `unblok_team_admission_test_${randomUUID().replaceAll('-', '')}`;
const url = new URL(config.DATABASE_URL); url.pathname = `/${name}`;
const database = new Database(url.toString()), fences = new AuthFences(database), cache = createRedis(config.REDIS_URL);
const ownedPrefix = `team02:test:${randomUUID()}:`;
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
async function fixture(options: { afterConfirmation?: () => Promise<void>; redisUrl?: string; keys?: WorkspaceKeys; settings?:Parameters<typeof connectSessionStore>[1]; database?:Database; afterDirectoryAdmission?:()=>Promise<void>; teamRedis?:ReturnType<typeof createRedis>; admissionSample?:(action:string,ms:number,allowed:boolean)=>void } = {}) {
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
  const teamLimits=new TeamLimits(options.teamRedis??rateCache,settings.secrets[0]!,settings.prefix), measuredLimits={consume:async(...args:Parameters<TeamLimits['consume']>)=>{const start=performance.now();const result=await teamLimits.consume(...args);options.admissionSample?.(args[0],performance.now()-start,result.allowed);if(args[0]==='read')await options.afterDirectoryAdmission?.();return result;}};
  const server = await createApp(config, { databaseReady: () => database.ready(), queueReady: async () => await rateCache.ping() === 'PONG', close: async () => { await connection.close(); if (options.redisUrl) rateCache.disconnect(); } }, coarse, createLogger('silent'), sessions, authentication, new Workspaces(sessions, tenancy, new WorkspaceLimits(rateCache, settings.secrets[0]!, settings.prefix)),new Teams(sessions,tenancy,measuredLimits));
  await server.app.listen(0, '127.0.0.1'); stops.push(server.close);
  const address = server.app.getHttpServer().address(); if (!address || typeof address === 'string') throw new Error('Missing test listener');
  const http = (path: string, method = 'GET', client?: Client, body?: unknown, extra: Record<string, string | undefined> = {}) => {
    const headers: Record<string, string> = { origin: config.CORS_ORIGINS[0]!, ...(client ? { cookie: client.cookie, 'x-csrf-token': client.csrf } : {}), ...(['POST','PATCH','DELETE'].includes(method) ? { 'content-type': 'application/json' } : {}) };
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
const teamInput=(suffix='')=>({name:'Team '+randomUUID()+suffix,key:'ENG',description:'Private description',color:'#5645d4'});
const path=(ws:string,id?:string)=>'/api/v1/workspaces/'+ws+'/teams'+(id?'/'+id:'');
async function make(o:Awaited<ReturnType<typeof owned>>,body=teamInput(),key=randomUUID()){
 const response=await o.f.http(path(o.ws),'POST',o.client,body,{'idempotency-key':key});expect(response.status).toBe(201);return {row:await response.json(),key,body};
}

type Owner=Awaited<ReturnType<typeof owned>>&{team:string;version:bigint};
async function setup():Promise<Owner>{const o=await owned(),t=await make(o),result={...o,team:t.row.id as string,version:1n};await target(result,'ADMIN');return result;}
async function target(o:Awaited<ReturnType<typeof setup>>,role:'ADMIN'|'MEMBER'|'OBSERVER'='ADMIN',join=false){const {email}=await o.f.signup(),client=await o.f.login(email),u=await database.client.passwordCredential.findUniqueOrThrow({where:{email},include:{identity:true}}),m=await database.client.workspaceMembership.create({data:{workspaceId:o.ws,userId:u.identity.userId,role,status:'ACTIVE'}});if(join)await database.client.teamMembership.create({data:{workspaceId:o.ws,teamId:o.team,membershipId:m.id}});return {email,client,user:u.identity.userId,member:m.id};}
const endpoint=(o:Awaited<ReturnType<typeof setup>>,suffix:string)=>path(o.ws,o.team)+'/'+suffix;

function gate(){let release!:()=>void;const wait=new Promise<void>(r=>{release=r;});return {wait,release};}
function observeDatabase(observer:(sql:string,stage:'before'|'after')=>Promise<void>){
 return new Proxy(database,{get(target,property){if(property==='transaction')return (run:Parameters<Database['transaction']>[0])=>target.transaction(tx=>run(new Proxy(tx,{get(t,prop){const value=Reflect.get(t,prop);if((prop==='$executeRaw'||prop==='$queryRaw')&&typeof value==='function')return async (...args:unknown[])=>{const a=args[0] as {strings?:readonly string[]}|readonly string[],sql=Array.isArray(a)?a.join('?'):(a as {strings?:readonly string[]}).strings?.join('?')??'';await observer(sql,'before');const result=await Reflect.apply(value,t,args);await observer(sql,'after');return result;};if(value&&typeof value==='object'&&typeof prop==='string'&&['workspaceMembership','passwordCredential','teamMutationResult','identity','user','team','teamMembership','teamTransferIntent'].includes(prop))return new Proxy(value,{get(delegate,method){const fn=Reflect.get(delegate,method);if(typeof fn==='function')return async(...args:unknown[])=>{await observer('model:'+prop+'.'+String(method),'before');const result=await Reflect.apply(fn,delegate,args);await observer('model:'+prop+'.'+String(method),'after');return result;};return fn;}});return typeof value==='function'?value.bind(t):value;}})));const value=Reflect.get(target,property);return typeof value==='function'?value.bind(target):value;}});
}
async function waiting(){
 const started=Date.now();while(Date.now()-started<900){const rows=await admin.client.$queryRaw<{n:bigint}[]>`SELECT count(*) AS n FROM pg_stat_activity WHERE datname=${name} AND wait_event_type='Lock'`;if(rows[0]!.n>0n)return;await Bun.sleep(10);}throw new Error('Expected primary lock wait');
}

test('closed admission is request-bound, returns only actor/Workspace, and directory uses exactly three transactions',async()=>{
 let acquisitions=0;const profileSelections:string[]=[];const db=new Proxy(database,{get(target,key){if(key==='transaction')return async(run:Parameters<Database['transaction']>[0])=>{acquisitions++;return target.transaction(tx=>{
 const user=new Proxy(tx.user,{get(delegate,method){const value=Reflect.get(delegate,method);if(typeof value!=='function')return value;return(...args:unknown[])=>{const input=args[0];if(input&&typeof input==='object'&&'select' in input&&input.select&&typeof input.select==='object')profileSelections.push(...Object.keys(input.select).filter(k=>['name','email','emailVerified'].includes(k)));return Reflect.apply(value,delegate,args);};}});
 return run(new Proxy(tx,{get(client,property){return property==='user'?user:Reflect.get(client,property);}}));
 });};const value=Reflect.get(target,key);return typeof value==='function'?value.bind(target):value;}});
 const o=await setup(),app=await fixture({database:db,settings:o.f.settings});acquisitions=0;
 const response=await app.http(endpoint(o,'memberships'),'GET',o.client);expect(response.status).toBe(200);expect(acquisitions).toBe(3);expect(profileSelections).toEqual([]);expect((await response.json()).items).toHaveLength(1);
 const f=await database.client.authSessionFamily.findFirstOrThrow({where:{userId:o.userId,revokedAt:null}}),evidence={userId:f.userId,identityId:f.identityId,familyId:f.id,authEpoch:f.authEpoch,generation:f.generation,sidDigest:f.sidDigest};
 const tenancy=new Tenancy(database,{verify:async()=>null},denyAll,{verify:async()=>evidence});let retained:VerifiedPrincipal|undefined;
 await tenancy.authenticateSession({},async p=>{retained=p;const admission=await tenancy.teamDirectoryAdmission(p,o.ws);expect(Object.keys(admission).sort()).toEqual(['actorId','workspace']);expect(admission.actorId).toBe(o.userId);expect(admission.workspace.self.workspaceId).toBe(o.ws);expect(JSON.stringify(admission)).not.toContain('email');expect(Object.isFrozen(admission)).toBe(true);});
 await expect(tenancy.teamDirectoryAdmission(retained!,o.ws)).rejects.toBeInstanceOf(TenantAccessError);
 await expect(tenancy.teamDirectoryAdmission({actorId:o.userId,role:'ADMIN'} as unknown as VerifiedPrincipal,o.ws)).rejects.toBeInstanceOf(TenantAccessError);
});

for(const kind of ['membership-suspension','demotion','Workspace-archive','logout','rotation','epoch-revocation','user-disabled'] as const)test('fresh final directory fence after admission: '+kind,async()=>{
 let action:(()=>Promise<void>)|undefined;const o=await setup();const app=await fixture({settings:o.f.settings,afterDirectoryAdmission:async()=>{const run=action;action=undefined;await run?.();}});
 action=async()=>{if(kind==='membership-suspension')await database.client.workspaceMembership.update({where:{workspaceId_id:{workspaceId:o.ws,id:o.member}},data:{status:'SUSPENDED'}});
 else if(kind==='demotion')await database.client.workspaceMembership.update({where:{workspaceId_id:{workspaceId:o.ws,id:o.member}},data:{role:'MEMBER'}});
 else if(kind==='Workspace-archive')await database.client.workspace.update({where:{id:o.ws},data:{status:'ARCHIVED'}});
 else if(kind==='epoch-revocation')await fences.revokeAll(o.userId);
 else if(kind==='user-disabled')await database.client.user.update({where:{id:o.userId},data:{authDisabled:true}});
 else if(kind==='logout')expect((await o.f.http('/api/v1/auth/logout','POST',o.client,{})).status).toBe(200);
 else {const f=await database.client.authSessionFamily.findFirstOrThrow({where:{userId:o.userId,revokedAt:null}});await fences.rotate({userId:f.userId,identityId:f.identityId,familyId:f.id,authEpoch:f.authEpoch,generation:f.generation,sidDigest:f.sidDigest},createHash('sha256').update(randomUUID()).digest('hex'),new Date(Date.now()+60000));}};
 const r=await app.http(endpoint(o,'memberships'),'GET',o.client);expect(r.status).toBe(kind==='membership-suspension'?404:kind==='demotion'||kind==='Workspace-archive'?403:401);expect(JSON.stringify(await r.json())).not.toContain('Private description');
});

test('revocation-first primary Workspace wait cannot disclose directory rows',async()=>{
 const o=await setup(),held=gate(),entered=gate();const revoke=database.transaction(async tx=>{await tx.$queryRaw`SELECT id FROM workspaces WHERE id=${o.ws}::uuid FOR UPDATE`;await tx.workspaceMembership.update({where:{workspaceId_id:{workspaceId:o.ws,id:o.member}},data:{status:'SUSPENDED'}});entered.release();await held.wait;});
 await withDeadline(entered.wait,2000);const read=o.f.http(endpoint(o,'memberships'),'GET',o.client);try{await waiting();}finally{held.release();}await revoke;const r=await read;expect([404,409,503]).toContain(r.status);expect(JSON.stringify(await r.json())).not.toContain('Private description');
});
test('directory-first holds revocation until authorized read commits; next request is denied',async()=>{
 const o=await setup(),held=gate(),entered=gate();let armed=true;const db=observeDatabase(async(sql,stage)=>{if(armed&&stage==='after'&&sql.includes('FROM team_memberships tm JOIN')){armed=false;entered.release();await held.wait;}}),app=await fixture({database:db,settings:o.f.settings});
 const read=app.http(endpoint(o,'memberships'),'GET',o.client);await withDeadline(entered.wait,2000);const revoke=database.transaction(async tx=>{await tx.$queryRaw`SELECT id FROM workspaces WHERE id=${o.ws}::uuid FOR UPDATE`;await tx.workspaceMembership.update({where:{workspaceId_id:{workspaceId:o.ws,id:o.member}},data:{status:'SUSPENDED'}});});try{await waiting();}finally{held.release();}expect((await read).status).toBe(200);await revoke;expect((await app.http(endpoint(o,'memberships'),'GET',o.client)).status).toBe(404);
});
test('account switches and Workspace ADMIN status never inherit private Team directory access',async()=>{
 const o=await setup(),t=await target(o,'ADMIN');expect((await o.f.http(endpoint(o,'memberships'),'GET',o.client)).status).toBe(200);expect((await o.f.http(endpoint(o,'memberships'),'GET',t.client)).status).toBe(404);expect((await o.f.http(endpoint(o,'memberships'),'GET',o.client)).status).toBe(200);
 const other=await create(o.f,t.client);expect(other.status).toBe(201);const ws=(await other.json()).workspace.id as string;expect((await o.f.http(path(ws,o.team)+'/memberships','GET',t.client)).status).toBe(404);expect((await o.f.http(endpoint(o,'memberships')+'?role=ADMIN','GET',t.client)).status).toBe(400);
});
test('membership/role changes invalidate signed directory cursor; fresh reactivation does not cache authority',async()=>{
 const o=await setup(),t=await target(o,'MEMBER',true);const r=await o.f.http(endpoint(o,'memberships')+'?limit=1','GET',o.client);expect(r.status).toBe(200);const cursor=(await r.json()).page.nextCursor as string;expect(cursor).toBeTruthy();await database.client.workspaceMembership.update({where:{workspaceId_id:{workspaceId:o.ws,id:t.member}},data:{status:'SUSPENDED'}});expect((await o.f.http(endpoint(o,'memberships')+'?limit=1&after='+cursor,'GET',o.client)).status).toBe(409);
 await database.client.workspaceMembership.update({where:{workspaceId_id:{workspaceId:o.ws,id:o.member}},data:{status:'SUSPENDED'}});expect((await o.f.http(endpoint(o,'memberships'),'GET',o.client)).status).toBe(404);await database.client.workspaceMembership.update({where:{workspaceId_id:{workspaceId:o.ws,id:o.member}},data:{status:'ACTIVE'}});expect((await o.f.http(endpoint(o,'memberships'),'GET',o.client)).status).toBe(200);
});
test('real database and Valkey admission outages fail closed with generic HTTP503',async()=>{
 const o=await setup(),pgUrl=new URL(url);pgUrl.port='1';const deadDb=new Database(pgUrl.toString()),deadRedis=createRedis('redis://:owned-test@127.0.0.1:1');deadRedis.on('error',()=>{});
 try{const pg=await fixture({settings:o.f.settings,database:deadDb}),redis=await fixture({settings:o.f.settings,teamRedis:deadRedis});for(const app of [pg,redis]){const r=await app.http(endpoint(o,'memberships'),'GET',o.client);expect(r.status).toBe(503);const body=JSON.stringify(await r.json());expect(body).not.toContain('Private description');expect(body).not.toContain('database');}}finally{deadRedis.disconnect();await deadDb.close();}
});
