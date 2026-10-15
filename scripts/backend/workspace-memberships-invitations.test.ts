import {DisposableMailpit} from '../test-support/mailpit.cjs';
import {startVerificationDispatcher} from '../../apps/worker/src/jobs/email-verification';
import { afterAll, afterEach, beforeAll, expect, test } from 'bun:test';
import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { Database, AccountCredentials, AuthFences, Tenancy, denyAll, InvitationDelivery, type WorkspaceKeys } from '@unblok/database';
import { loadVerificationMail, createLogger, createRedis, loadApiConfig } from '@unblok/backend-runtime';
import { createApp } from '../../apps/api/src/app';
import { RedisRateLimiter } from '../../apps/api/src/security';
import { Sessions, connectSessionStore, sessionSettings } from '../../apps/api/src/modules/sessions';
import { Authentication, AuthenticationLimits, Passwords } from '../../apps/api/src/modules/auth';

import { Workspaces, WorkspaceLimits, InvitationLimits } from '../../apps/api/src/modules/workspaces';
const mailpit=new DisposableMailpit();
const invitationKey={id:'invitation-v1',secret:randomBytes(32).toString('hex')};
const observations:unknown[]=[];
const workspaceKeys = { active: 'v1', cursors: { v1: randomBytes(32).toString('hex') }, idempotency: randomBytes(32).toString('hex') };
const root = resolve(import.meta.dir, '../..'), config = loadApiConfig(process.env);
const admin = new Database(config.DATABASE_URL), name = `unblok_ws02_test_${randomUUID().replaceAll('-', '')}`;
const url = new URL(config.DATABASE_URL); url.pathname = `/${name}`;
const database = new Database(url.toString()), fences = new AuthFences(database), cache = createRedis(config.REDIS_URL);
const ownedPrefix = `ws02:test:${randomUUID()}:`;
cache.on('error', () => {}); // Expected outage diagnostics must not print SDK details.
const stops: (() => Promise<void>)[] = [];
let created = false;
async function prisma(args: string[]) {
  const child = Bun.spawn([process.execPath, 'packages/database/node_modules/prisma/build/index.js', ...args],
    { cwd: root, env: { ...process.env, DATABASE_URL: url.toString() }, stdout: 'pipe', stderr: 'pipe' });
  let timedOut = false; const timer = setTimeout(() => { timedOut = true; child.kill('SIGKILL'); }, 6000);
  try {
    const [exit, out] = await Promise.all([child.exited, new Response(child.stdout).text(), new Response(child.stderr).text()]);
    if (timedOut || exit !== 0) throw new Error('Owned migration verification failed; configuration withheld');
    return out;
  } finally { clearTimeout(timer); }
}
beforeAll(async () => {
  await mailpit.start();
  await admin.connect(); await admin.client.$executeRawUnsafe(`CREATE DATABASE "${name}"`); created = true;
  await prisma(['migrate', 'deploy', '--schema', 'packages/database/prisma/schema.prisma']);
  await database.connect(); await cache.connect();
}, 30000);
afterAll(async () => {
 try {
  try { for (const stop of stops.reverse()) await stop(); }
  finally {
    try { if(cache.status==='ready'){const keys = await cache.keys(`${ownedPrefix}*`); if (keys.length) await cache.del(...keys);}await Bun.write(resolve(root,'docs/backend/evidence/BE-WS-02-concurrency.json'),JSON.stringify(observations,null,2)); }
    finally { cache.disconnect(); await database.close();
      try { if (created) await admin.client.$executeRawUnsafe(`DROP DATABASE "${name}" WITH (FORCE)`); }
      finally { await admin.close(); }
    }
  }
 } finally { await mailpit.close(); }
}, 10000);
afterEach(async()=>{await database.client.workspaceInvitation.updateMany({where:{consumedAt:null,canceledAt:null},data:{canceledAt:new Date()}});});
const password = 'A long private test password 2026';
type Client = { cookie: string; csrf: string };
async function fixture(options: { afterConfirmation?: () => Promise<void>; redisUrl?: string; keys?: WorkspaceKeys; invKey?: typeof invitationKey; invitationCache?: typeof cache } = {}) {
  const settings = { ...sessionSettings(config, { SESSION_SECRETS: randomBytes(32).toString('hex'), SESSION_NAMESPACE: 'test' }), prefix: ownedPrefix + randomUUID() + ':' };
  const rateCache = options.redisUrl ? createRedis(options.redisUrl) : cache;
  if (options.redisUrl) { rateCache.on('error', () => {}); await rateCache.connect(); }
  const connection = await connectSessionStore(options.redisUrl ?? config.REDIS_URL, settings);
  const credentials = new AccountCredentials(database), limits = new AuthenticationLimits(rateCache, settings.secrets[0]!, settings.prefix);
  const authentication = new Authentication({ create: i => credentials.create(i), lookup: e => credentials.lookup(e), confirm: async snapshot => {
    const valid = await credentials.confirm(snapshot); if (valid) await options.afterConfirmation?.(); return valid;
  } }, await Passwords.create(), limits);
  const sessions = new Sessions(connection.store, settings, { create: i => fences.create(i), rotate: (e, d, idle) => fences.rotate(e, d, idle), revoke: e => fences.revoke(e), retireSid: d => fences.retireSid(d), revokeAll: id => fences.revokeAll(id) }, a => authentication.resolveIdentity(a));
  const tenancy = new Tenancy(database, { verify: async () => null }, denyAll, sessions, undefined, options.keys ?? workspaceKeys, options.invKey ?? invitationKey);
  sessions.bind(tenancy); authentication.bind(sessions, tenancy);
  const coarse = new RedisRateLimiter(rateCache, 120, 60000, settings.prefix + 'coarse:');
  const server = await createApp(config, { databaseReady: () => database.ready(), queueReady: async () => await rateCache.ping() === 'PONG', close: async () => { await connection.close(); if (options.redisUrl) rateCache.disconnect(); } }, coarse, createLogger('silent'), sessions, authentication, new Workspaces(sessions, tenancy, new WorkspaceLimits(rateCache, settings.secrets[0]!, settings.prefix),new InvitationLimits(options.invitationCache??rateCache,settings.secrets[0]!,settings.prefix)));
  await server.app.listen(0, '127.0.0.1'); stops.push(server.close);
  const address = server.app.getHttpServer().address(); if (!address || typeof address === 'string') throw new Error('Missing test listener');
  const http = (path: string, method = 'GET', client?: Client, body?: unknown, extra: Record<string, string | undefined> = {}) => {
    const headers: Record<string, string> = { origin: config.CORS_ORIGINS[0]!, ...(client ? { cookie: client.cookie, 'x-csrf-token': client.csrf } : {}), ...(method === 'POST' ? { 'content-type': 'application/json' } : {}) };
    for (const [key, value] of Object.entries(extra)) { if (value === undefined) delete headers[key]; else headers[key] = value; }
    return fetch(`http://127.0.0.1:${address.port}${path}`, { method, headers, ...(method === 'POST' ? { body: JSON.stringify(body ?? {}) } : {}) });
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
  return { http, bootstrap, signup, login, key, sid, sessions, tenancy, authentication, credentials, connection, limits, settings, close: server.close };
}

const input = () => ({ name: 'Workspace', slug: 'ws-' + randomUUID() });
const create = (f: Awaited<ReturnType<typeof fixture>>, client: Client, body = input(), key = randomUUID()) => f.http('/api/v1/workspaces', 'POST', client, body, { 'idempotency-key': key });


async function actor(f:Awaited<ReturnType<typeof fixture>>,verified=true){const {email}=await f.signup(),client=await f.login(email),credential=await database.client.passwordCredential.findUniqueOrThrow({where:{email},include:{identity:true}});if(verified)await database.client.passwordCredential.update({where:{identityId:credential.identityId},data:{emailVerifiedAt:new Date()}});return {email,client,userId:credential.identity.userId,identityId:credential.identityId};}
async function setup(){const f=await fixture(),admin=await actor(f),response=await create(f,admin.client),workspace=(await response.json()).workspace;expect(response.status).toBe(201);return {f,admin,workspace};}
const issue=(s:Awaited<ReturnType<typeof setup>>,email:string,role:'MEMBER'|'OBSERVER'='MEMBER',key=randomUUID())=>s.f.http('/api/v1/workspaces/'+s.workspace.id+'/invitations','POST',s.admin.client,{email,role},{'idempotency-key':key});
const accept=(f:Awaited<ReturnType<typeof fixture>>,client:Client,token:string,key=randomUUID())=>f.http('/api/v1/workspace-invitations/accept','POST',client,{token},{'idempotency-key':key});
async function invitation(s:Awaited<ReturnType<typeof setup>>,email:string,role:'MEMBER'|'OBSERVER'='MEMBER'){expect((await issue(s,email,role)).status).toBe(202);let token='',address='';const worker=new InvitationDelivery(database,invitationKey);expect(await worker.once(async(to,value)=>{address=to;token=value;})).toBe(true);expect(address).toBe(email);expect(token).toMatch(/^[0-9a-f-]{36}\.[A-Za-z0-9_-]{43}$/);return token;}
async function membership(workspaceId:string,userId:string){return database.client.workspaceMembership.findUnique({where:{workspaceId_userId:{workspaceId,userId}}});}

test('membership listing is admin-only, bounded, contact-private and actor/workspace/filter/revision bound',async()=>{
 const s=await setup(),recipient=await actor(s.f),outsider=await actor(s.f);await database.client.workspaceMembership.create({data:{workspaceId:s.workspace.id,userId:recipient.userId,status:'ACTIVE',role:'OBSERVER',joinedAt:new Date()}});
 const path='/api/v1/workspaces/'+s.workspace.id+'/memberships';let r=await s.f.http(path+'?limit=1', 'GET',s.admin.client);expect(r.status).toBe(200);const first=await r.json();expect(first.items).toHaveLength(1);expect(first.page.hasMore).toBe(true);expect(JSON.stringify(first)).not.toContain('@');expect(first).not.toHaveProperty('total');expect(r.headers.get('cache-control')).toBe('private, no-store');
 const cursor=encodeURIComponent(first.page.nextCursor);r=await s.f.http(path+'?limit=1&after='+cursor,'GET',s.admin.client);expect(r.status).toBe(200);expect((await r.json()).items).toHaveLength(1);
 for(const client of [recipient.client,outsider.client]){r=await s.f.http(path+'?limit=1&after='+cursor,'GET',client);expect(r.status).toBe(404);expect(JSON.stringify(await r.json())).not.toContain(s.workspace.id);}
 expect((await s.f.http(path+'?limit=1&sort=joined_desc&after='+cursor,'GET',s.admin.client)).status).toBe(400);
 expect((await s.f.http(path+'?limit=1&status=SUSPENDED&after='+cursor,'GET',s.admin.client)).status).toBe(400);
 for(const query of ['limit=101','status=ACTIVE&status=SUSPENDED','role=ADMIN','limit=1&after=forged'])expect((await s.f.http(path+'?'+query,'GET',s.admin.client)).status).toBe(400);
 await database.client.workspaceMembership.update({where:{workspaceId_userId:{workspaceId:s.workspace.id,userId:recipient.userId}},data:{status:'SUSPENDED'}});
 expect((await s.f.http(path+'?limit=1&after='+cursor,'GET',s.admin.client)).status).toBe(409);
 const second=await setup();expect((await second.f.http('/api/v1/workspaces/'+second.workspace.id+'/memberships?limit=1&after='+cursor,'GET',second.admin.client)).status).toBe(400);
},15000);

test('issuance generic202, normalized emails, independent digests, durable retry, roles and CSRF boundaries',async()=>{
 const s=await setup(),recipient=await actor(s.f),key=randomUUID();const response=await issue(s,' '+recipient.email.toUpperCase()+' ','OBSERVER',key);expect(response.status).toBe(202);expect(await response.json()).toEqual({status:'accepted'});expect(response.headers.has('set-cookie')).toBe(false);
 expect((await issue(s,recipient.email,'OBSERVER',key)).status).toBe(202);expect(await database.client.workspaceInvitation.count({where:{workspaceId:s.workspace.id}})).toBe(1);
 expect((await issue(s,recipient.email,'MEMBER',key)).status).toBe(409);
 const invalid=await s.f.http('/api/v1/workspaces/'+s.workspace.id+'/invitations','POST',s.admin.client,{email:recipient.email,role:'ADMIN'},{'idempotency-key':randomUUID()});expect(invalid.status).toBe(400);
 expect((await s.f.http('/api/v1/workspaces/'+s.workspace.id+'/invitations','POST',s.admin.client,{email:recipient.email,role:'MEMBER'},{'idempotency-key':randomUUID(),'x-csrf-token':undefined})).status).toBe(403);
 const row=await database.client.workspaceInvitation.findFirstOrThrow({where:{workspaceId:s.workspace.id}});expect(row.email).toBe(recipient.email);expect(row.tokenDigest).toMatch(/^[0-9a-f]{64}$/);expect(row.expiresAt.getTime()-row.issuedAt.getTime()).toBe(86400000);expect(await membership(s.workspace.id,recipient.userId)).toBeNull();
},15000);

test('one-use acceptance, replay and lost commit acknowledgement never duplicate or elevate membership',async()=>{
 const s=await setup(),recipient=await actor(s.f),token=await invitation(s,recipient.email,'OBSERVER'),key=randomUUID();
 const original=database.transaction.bind(database);let lost=true;database.transaction=async run=>{const result=await original(run);if(lost&&(await database.client.workspaceInvitation.findUnique({where:{id:token.split('.')[0]!}}))?.consumedAt){lost=false;throw new Error('Commit acknowledgement lost');}return result;};
 let first:Response;try{first=await accept(s.f,recipient.client,token,key);}finally{database.transaction=original;}expect(first!.status).toBe(503);
 expect((await membership(s.workspace.id,recipient.userId))?.role).toBe('OBSERVER');const replay=await accept(s.f,recipient.client,token,key);expect(replay.status).toBe(202);expect(await replay.json()).toEqual({status:'accepted'});expect((await accept(s.f,recipient.client,token)).status).toBe(202);expect(await database.client.workspaceMembership.count({where:{workspaceId:s.workspace.id,userId:recipient.userId}})).toBe(1);
 observations.push({case:'lost commit acknowledgement',firstHttp:503,reconciliationHttp:202,membershipEffects:1,role:'OBSERVER'});
},15000);

test('concurrent redemption has one effect and fresh same-key reconciliation after confirmed serialization conflict',async()=>{
 const s=await setup(),recipient=await actor(s.f),token=await invitation(s,recipient.email),keys=[randomUUID(),randomUUID()];const results=await Promise.all(keys.map(k=>accept(s.f,recipient.client,token,k)));const statuses=results.map(r=>r.status);expect(statuses.every(code=>[202,409].includes(code))).toBe(true);expect(statuses).toContain(202);
 for(let i=0;i<results.length;i++)if(results[i]!.status===409)expect((await accept(s.f,recipient.client,token,keys[i])).status).toBe(202);
 expect(await database.client.workspaceMembership.count({where:{workspaceId:s.workspace.id,userId:recipient.userId}})).toBe(1);observations.push({case:'overlapping redemption',http:statuses,membershipEffects:1});
},15000);

test.each(['mismatch','unverified','suspended','existing','invited'])('recipient eligibility and no privilege elevation: %s',async mode=>{
 const s=await setup(),recipient=await actor(s.f,mode!=='unverified'),wrong=mode==='mismatch'?await actor(s.f):recipient;
 if(['suspended','existing','invited'].includes(mode))await database.client.workspaceMembership.create({data:{workspaceId:s.workspace.id,userId:recipient.userId,status:mode==='suspended'?'SUSPENDED':mode==='existing'?'ACTIVE':'INVITED',role:mode==='existing'?'OBSERVER':'MEMBER'}});
 const token=await invitation(s,recipient.email,'MEMBER');expect((await accept(s.f,wrong.client,token)).status).toBe(202);const row=await membership(s.workspace.id,recipient.userId);
 if(['mismatch','unverified'].includes(mode))expect(row).toBeNull();else if(mode==='suspended')expect(row?.status).toBe('SUSPENDED');else if(mode==='existing')expect(row?.role).toBe('OBSERVER');else{expect(row?.status).toBe('ACTIVE');expect(row?.role).toBe('MEMBER');}
},15000);

test.each(['cancel','archive','demote','epoch','expired'])('fresh inviter and proof revocation: %s',async mode=>{
 const s=await setup(),recipient=await actor(s.f);let token=await invitation(s,recipient.email);const id=token.split('.')[0]!;
 if(mode==='cancel')await database.client.workspaceInvitation.update({where:{id},data:{canceledAt:new Date()}});
 if(mode==='archive')await database.client.workspace.update({where:{id:s.workspace.id},data:{status:'ARCHIVED'}});
 if(mode==='demote'){const keeper=await actor(s.f);await database.client.workspaceMembership.create({data:{workspaceId:s.workspace.id,userId:keeper.userId,role:'ADMIN',status:'ACTIVE'}});await database.client.workspaceMembership.update({where:{workspaceId_userId:{workspaceId:s.workspace.id,userId:s.admin.userId}},data:{role:'MEMBER'}});}
 if(mode==='epoch')await fences.revokeAll(s.admin.userId);
 if(mode==='expired'){
   const old=await database.client.workspaceInvitation.findUniqueOrThrow({where:{id}});await database.client.workspaceInvitation.update({where:{id},data:{canceledAt:new Date()}});
   const fixtureNow=Date.now();
  const row={...old,id:randomUUID(),issuedAt:new Date(fixtureNow-90000000),expiresAt:new Date(fixtureNow-3600000),canceledAt:null,consumedAt:null};
   token=row.id+'.'+createHmac('sha256',Buffer.from(invitationKey.secret,'hex')).update('unblok-invitation-proof-v1\0'+JSON.stringify([invitationKey.id,row.id,row.workspaceId,row.inviterId,row.inviterEpoch.toString(),row.email,row.role])).digest('base64url');
   row.tokenDigest=createHmac('sha256',Buffer.from(invitationKey.secret,'hex')).update('unblok-invitation-digest-v1\0'+token).digest('hex');await database.client.workspaceInvitation.create({data:row});
 }
 expect((await accept(s.f,recipient.client,token)).status).toBe(202);expect(await membership(s.workspace.id,recipient.userId)).toBeNull();
},15000);

test('durable wrong attempts exhaust proof across requests and worker reconstruction',async()=>{
 const s=await setup(),recipient=await actor(s.f),token=await invitation(s,recipient.email),wrong=token.split('.')[0]+'.'+'A'.repeat(43);
 for(let i=0;i<10;i++)expect((await accept(s.f,recipient.client,wrong)).status).toBe(202);
 expect((await database.client.workspaceInvitation.findUniqueOrThrow({where:{id:token.split('.')[0]!}})).attempts).toBe(10);
 // Simulate the end of this test-owned Valkey admission window; DB attempts persist.
 const keys=await cache.keys(s.f.settings.prefix+'invitation-accept*');for(const key of keys)await cache.pexpire(key,1);await new Promise(r=>setTimeout(r,5));
 expect((await accept(s.f,recipient.client,token)).status).toBe(202);expect(await membership(s.workspace.id,recipient.userId)).toBeNull();expect(await new InvitationDelivery(database,invitationKey).once(async()=>{throw new Error('Exhausted proof must never deliver');})).toBe(false);
},15000);

test('delivery to real Mailpit carries a proof only after commit; no proof in persistence or queue',async()=>{
 const s=await setup(),recipient=await actor(s.f);expect((await issue(s,recipient.email)).status).toBe(202);
 const mail=loadVerificationMail({NODE_ENV:'test',EMAIL_MAIL_ENDPOINT:mailpit.url('/api/v1/send'),EMAIL_MAIL_FROM:'invite@unblok.local'}),dispatcher=startVerificationDispatcher({once:async()=>false},mail,createLogger('silent'),'invitation');let token='';
 try{expect(await new InvitationDelivery(database,invitationKey).once(async(email,value,id)=>{token=value;await dispatcher.send(email,value,id);})).toBe(true);}finally{await dispatcher.close();}
 const response=await fetch(mailpit.url('/api/v1/messages?limit=500')),messages=await response.json(),matching=messages.messages.filter((m:{To:{Address:string}[]})=>m.To.some(r=>r.Address===recipient.email));expect(matching.length).toBe(1);
 try{const message=await (await fetch(mailpit.url('/api/v1/message/')+matching[0].ID)).json();expect(message.Subject).toBe('Join an Unblok workspace');expect(message.Text).toContain(token);expect(message.Text).toContain('24 hours');const row=await database.client.workspaceInvitation.findUniqueOrThrow({where:{id:token.split('.')[0]!},include:{delivery:true}});expect(JSON.stringify(row,(_k,v)=>typeof v==='bigint'?v.toString():v)).not.toContain(token);expect(row.delivery?.deliveredAt).not.toBeNull();expect((await accept(s.f,recipient.client,token)).status).toBe(202);}finally{await mailpit.deleteOwned(matching.map((m:{ID:string})=>m.ID));}
},15000);

test('five transport failures, concurrent replacement and late old acknowledgement cannot restore canceled proof',async()=>{
 const s=await setup(),recipient=await actor(s.f);expect((await issue(s,recipient.email)).status).toBe(202);let oldToken='';const worker=new InvitationDelivery(database,invitationKey);
 for(let i=0;i<5;i++){expect(await worker.once(async(_email,value)=>{oldToken=value;throw new Error('Transport failed');})).toBe(true);const id=oldToken.split('.')[0]!;await database.client.workspaceInvitationOutbox.update({where:{invitationId:id},data:{nextAttemptAt:new Date(0)}});}
 expect(await worker.once(async()=>{throw new Error('Must not make sixth delivery');})).toBe(false);
 const responses=await Promise.all([issue(s,recipient.email),issue(s,recipient.email)]);expect(responses.every(r=>[202,409].includes(r.status))).toBe(true);expect(responses.some(r=>r.status===202)).toBe(true);
 const old=await database.client.workspaceInvitation.findUniqueOrThrow({where:{id:oldToken.split('.')[0]!}});expect(old.canceledAt).not.toBeNull();expect(await database.client.workspaceInvitation.count({where:{workspaceId:s.workspace.id,consumedAt:null,canceledAt:null}})).toBe(1);
 await database.client.workspaceInvitationOutbox.update({where:{invitationId:old.id},data:{deliveredAt:new Date()}});expect((await accept(s.f,recipient.client,oldToken)).status).toBe(202);expect(await membership(s.workspace.id,recipient.userId)).toBeNull();let replacement='';expect(await new InvitationDelivery(database,invitationKey).once(async(_email,value)=>{replacement=value;})).toBe(true);expect(replacement).not.toBe(oldToken);expect((await accept(s.f,recipient.client,replacement)).status).toBe(202);expect((await membership(s.workspace.id,recipient.userId))?.role).toBe('MEMBER');
 observations.push({case:'delivery exhaustion replacement',failedDeliveries:5,concurrentRequestHttp:responses.map(r=>r.status),pendingProofs:1,lateOldAcknowledgementGranted:false});
},15000);

test('retired invitation key rejects old proofs; cursor previous key verifies only within original lifetime',async()=>{
 const s=await setup(),recipient=await actor(s.f),token=await invitation(s,recipient.email);const next={id:'invitation-v2',secret:randomBytes(32).toString('hex')},f=await fixture({invKey:next}),client=await f.login(recipient.email);
 expect((await accept(f,client,token)).status).toBe(202);expect(await membership(s.workspace.id,recipient.userId)).toBeNull();expect(await new InvitationDelivery(database,next).once(async()=>{throw new Error('Old key must not deliver');})).toBe(false);
 await database.client.workspaceMembership.create({data:{workspaceId:s.workspace.id,userId:recipient.userId,role:'MEMBER',status:'ACTIVE'}});
 const path='/api/v1/workspaces/'+s.workspace.id+'/memberships?limit=1';const first=await (await s.f.http(path,'GET',s.admin.client)).json();const cursor=encodeURIComponent(first.page.nextCursor),newKeys={active:'v2',cursors:{...workspaceKeys.cursors,v2:randomBytes(32).toString('hex')},idempotency:workspaceKeys.idempotency},rotate=await fixture({keys:newKeys}),admin=await rotate.login(s.admin.email);
 expect((await rotate.http(path+'&after='+cursor,'GET',admin)).status).toBe(200);const retired=await fixture({keys:{...newKeys,cursors:{v2:newKeys.cursors.v2}}}),again=await retired.login(s.admin.email);expect((await retired.http(path+'&after='+cursor,'GET',again)).status).toBe(400);
},15000);

test('verified sender and active workspace required; sensitive admission budgets remain fail-closed',async()=>{
 const s=await setup(),unverified=await actor(s.f,false);await database.client.workspaceMembership.create({data:{workspaceId:s.workspace.id,userId:unverified.userId,role:'ADMIN',status:'ACTIVE'}});
 expect((await s.f.http('/api/v1/workspaces/'+s.workspace.id+'/invitations','POST',unverified.client,{email:'unknown@example.test',role:'MEMBER'},{'idempotency-key':randomUUID()})).status).toBe(404);
 for(let i=0;i<5;i++)expect((await issue(s,randomUUID()+'@example.test')).status).toBe(202);const exceeded=await issue(s,'limited@example.test');expect(exceeded.status).toBe(429);expect(Number(exceeded.headers.get('retry-after'))).toBeGreaterThan(0);
 const closed=createRedis(config.REDIS_URL);closed.on('error',()=>{});await closed.connect();const limiter=new InvitationLimits(closed,invitationKey.secret,ownedPrefix+'outage:');closed.disconnect();await expect(limiter.consume('accept',s.admin.userId,'127.0.0.1')).rejects.toMatchObject({name:'AuthUnavailableError'});
},15000);

function latch(){let release!:()=>void;const promise=new Promise<void>(r=>release=r);return {promise,release};}
test('controlled PostgreSQL redemption locks users before family/workspace and serializes the contender',async()=>{
 const s=await setup(),recipient=await actor(s.f),token=await invitation(s,recipient.email),pause=latch(),entered=latch(),original=database.transaction.bind(database),trace:{events:string[];sqlState?:string}[]=[];let held=false;
 database.transaction=async run=>{const events:string[]=[];let relevant=false;try{return await original(tx=>run(new Proxy(tx,{get(target,property){if(property!=='$queryRaw')return Reflect.get(target,property);return async(...args:unknown[])=>{
  const first=args[0],sql=Array.isArray(first)?first.join(' '):String(first&&typeof first==='object'&&'sql' in first?first.sql:'');
  const phase=/FROM users WHERE id IN/.test(sql)?'sorted-users':/FROM auth_session_families/.test(sql)&&/FOR SHARE/.test(sql)?'recipient-family':/FROM workspaces WHERE/.test(sql)&&/FOR UPDATE/.test(sql)?'workspace':/workspace_invitation_results/.test(sql)&&/INSERT/.test(sql)?'ledger':/UPDATE workspace_invitations SET consumed_at/.test(sql)?'consume':undefined;
  if(phase==='sorted-users')relevant=true;if(relevant&&phase)events.push(phase);const result=await Reflect.apply(target.$queryRaw,target,args);if(relevant&&phase==='consume'&&!held){held=true;entered.release();await pause.promise;}return result;
 };}})));}catch(error){const meta=error&&typeof error==='object'&&'meta' in error?error.meta:undefined;const code=meta&&typeof meta==='object'&&'code' in meta?String(meta.code):undefined;if(relevant)trace.push({events,...(code?{sqlState:code}:{})});throw error;}finally{if(relevant&&!trace.some(t=>t.events===events))trace.push({events});}};
 const keys=[randomUUID(),randomUUID()];let responses:Response[]=[];let waited=false;
 try{const first=accept(s.f,recipient.client,token,keys[0]);await entered.promise;const second=accept(s.f,recipient.client,token,keys[1]);for(let i=0;i<60;i++){const rows=await admin.client.$queryRaw<{waiting:boolean}[]>`SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE datname=${name} AND wait_event_type='Lock' AND query LIKE '%FROM workspaces WHERE%') AS waiting`;if(rows[0]?.waiting){waited=true;break;}await new Promise(r=>setTimeout(r,10));}pause.release();responses=await Promise.all([first,second]);}finally{pause.release();database.transaction=original;}
 expect(waited).toBe(true);expect(responses.map(r=>r.status).sort()).toEqual([202,409]);expect(trace.some(t=>t.sqlState==='40001')).toBe(true);
 for(const t of trace.filter(t=>t.events.includes('workspace'))){expect(t.events.filter(e=>e==='sorted-users')).toHaveLength(1);expect(t.events.filter(e=>e==='recipient-family')).toHaveLength(1);expect(t.events[0]).toBe('sorted-users');expect(t.events.indexOf('recipient-family')).toBeGreaterThan(0);expect(t.events.indexOf('workspace')).toBeGreaterThan(t.events.indexOf('recipient-family'));if(t.events.includes('ledger'))expect(t.events.indexOf('ledger')).toBeGreaterThan(t.events.indexOf('workspace'));}
 expect((await accept(s.f,recipient.client,token,keys[responses[0]!.status===409?0:1])).status).toBe(202);expect(await database.client.workspaceMembership.count({where:{workspaceId:s.workspace.id,userId:recipient.userId}})).toBe(1);observations.push({case:'controlled redemption boundary',contenderWaitObserved:waited,http:responses.map(r=>r.status),transactions:trace,membershipEffects:1});
},15000);

function holdQuery(pattern:RegExp){const original=database.transaction.bind(database),entered=latch(),pause=latch(),errors:string[]=[];let held=false;
 database.transaction=async run=>{try{return await original(tx=>run(new Proxy(tx,{get(target,property){if(property!=='$queryRaw')return Reflect.get(target,property);return async(...args:unknown[])=>{const first=args[0],sql=Array.isArray(first)?first.join(' '):String(first&&typeof first==='object'&&'sql' in first?first.sql:'');const result=await Reflect.apply(target.$queryRaw,target,args);if(!held&&pattern.test(sql)){held=true;entered.release();await pause.promise;}return result;};}})));}catch(error){const meta=error&&typeof error==='object'&&'meta' in error?error.meta:undefined;const sql=meta&&typeof meta==='object'&&'code' in meta?String(meta.code):error&&typeof error==='object'&&'code' in error?String(error.code):'unknown';const embedded=error instanceof Error?error.message.match(/\b(40P01|40001|55P03)\b/)?.[1]:undefined;errors.push(sql==='unknown'?(embedded??'unknown'):sql);throw error;}};
 return {errors,entered:entered.promise,release:pause.release,restore:()=>{pause.release();database.transaction=original;}};
}
async function lockWait(pattern:string){for(let i=0;i<60;i++){const rows=await admin.client.$queryRaw<{waiting:boolean}[]>`SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE datname=${name} AND wait_event_type='Lock' AND query LIKE ${pattern}) AS waiting`;if(rows[0]?.waiting)return true;await new Promise(r=>setTimeout(r,10));}return false;}
test('issuance ordered before archival commits first; archival cancels the proof and prevents redemption',async()=>{
 const s=await setup(),recipient=await actor(s.f),hold=holdQuery(/SELECT status FROM workspaces.*FOR UPDATE/s);let request:Response|undefined,waited=false;
 try{const first=issue(s,recipient.email);await hold.entered;const archive=database.client.workspace.update({where:{id:s.workspace.id},data:{status:'ARCHIVED'}});const completion=Promise.resolve(archive);waited=await lockWait('%UPDATE%workspaces%');hold.release();[request]=await Promise.all([first,completion]);}finally{hold.restore();}
 expect(waited).toBe(true);expect(request?.status).toBe(202);const proof=await database.client.workspaceInvitation.findFirstOrThrow({where:{workspaceId:s.workspace.id}});expect(proof.canceledAt).not.toBeNull();expect(await new InvitationDelivery(database,invitationKey).once(async()=>{throw new Error('Archived proof must not deliver');})).toBe(false);observations.push({case:'issuance before archival',revocationWaitObserved:waited,issueHttp:request?.status,proofCanceled:true});
},15000);

test('archival ordered before acceptance forces fresh generic denial after serialization rollback',async()=>{
 const s=await setup(),recipient=await actor(s.f),token=await invitation(s,recipient.email),entered=latch(),pause=latch();
 const archive=database.transaction(async tx=>{await tx.workspace.update({where:{id:s.workspace.id},data:{status:'ARCHIVED'}});entered.release();await pause.promise;});await entered.promise;
 const request=accept(s.f,recipient.client,token),waited=await lockWait('%FROM workspaces WHERE%');pause.release();await archive;const response=await request;expect(waited).toBe(true);expect(response.status).toBe(409);expect((await accept(s.f,recipient.client,token)).status).toBe(202);expect(await membership(s.workspace.id,recipient.userId)).toBeNull();observations.push({case:'archival before acceptance',acceptWaitObserved:waited,firstHttp:409,freshHttp:202,membershipEffects:0});
},15000);

test('acceptance ordered before recipient logout-all completes first; subsequent cookie requests deny authority',async()=>{
 const s=await setup(),recipient=await actor(s.f),token=await invitation(s,recipient.email),hold=holdQuery(/UPDATE workspace_invitations SET consumed_at/);let response:Response|undefined,waited=false;
 try{const request=accept(s.f,recipient.client,token);await hold.entered;const revoke=fences.revokeAll(recipient.userId);waited=await lockWait('%FROM users%FOR UPDATE%');hold.release();[response]=await Promise.all([request,revoke]);}finally{hold.restore();}
 expect(waited).toBe(true);expect(response?.status).toBe(202);expect((await s.f.http('/api/v1/auth/me','GET',recipient.client)).status).toBe(401);expect(await database.client.workspaceMembership.count({where:{workspaceId:s.workspace.id,userId:recipient.userId}})).toBe(1);observations.push({case:'acceptance before logout-all',revocationWaitObserved:waited,acceptHttp:202,subsequentMe:401,membershipEffects:1});
},15000);

test('listing ordered before demotion completes; the next fresh cursor read hides all directory facts',async()=>{
 const s=await setup(),keeper=await actor(s.f);await database.client.workspaceMembership.create({data:{workspaceId:s.workspace.id,userId:keeper.userId,role:'ADMIN',status:'ACTIVE'}});const path='/api/v1/workspaces/'+s.workspace.id+'/memberships?limit=1',hold=holdQuery(/SELECT status FROM workspaces.*FOR SHARE/s);let response:Response|undefined,waited=false;
 try{const list=s.f.http(path,'GET',s.admin.client);await hold.entered;const demote=Promise.resolve(database.client.workspaceMembership.update({where:{workspaceId_userId:{workspaceId:s.workspace.id,userId:s.admin.userId}},data:{role:'MEMBER'}}));waited=await lockWait('%UPDATE%workspace_memberships%');hold.release();[response]=await Promise.all([list,demote]);}finally{hold.restore();}
 expect(waited).toBe(true);expect(response?.status).toBe(200);const page=await response!.json();expect((await s.f.http(path+'&after='+encodeURIComponent(page.page.nextCursor),'GET',s.admin.client)).status).toBe(404);observations.push({case:'listing before admin demotion',revocationWaitObserved:waited,readHttp:200,freshCursorHttp:404});
},15000);

test('membership page caps100, exposes no counts, and indexed primary plan is recorded on owned data',async()=>{
 const s=await setup(),ids=Array.from({length:104},()=>randomUUID());await database.client.user.createMany({data:ids.map(id=>({id,name:'Bounded directory fixture'}))});await database.client.workspaceMembership.createMany({data:ids.map(userId=>({workspaceId:s.workspace.id,userId,role:'MEMBER',status:'ACTIVE',joinedAt:new Date()}))});
 const response=await s.f.http('/api/v1/workspaces/'+s.workspace.id+'/memberships?limit=100','GET',s.admin.client);expect(response.status).toBe(200);const page=await response.json();expect(page.items).toHaveLength(100);expect(page.page.hasMore).toBe(true);expect(Buffer.byteLength(JSON.stringify(page))).toBeLessThan(131072);expect(page).not.toHaveProperty('total');
 const plans=await database.client.$queryRaw`EXPLAIN(ANALYZE,BUFFERS,FORMAT JSON) SELECT m.id,u.name,m.role,m.status,m.joined_at FROM workspace_memberships m JOIN users u ON u.id=m.user_id WHERE m.workspace_id=${s.workspace.id}::uuid ORDER BY COALESCE(m.joined_at,'1970-01-01'::timestamptz),m.id LIMIT 101`;
 await Bun.write(resolve(root,'docs/backend/evidence/BE-WS-02-query-plan.json'),JSON.stringify({visibleFixtureMemberships:105,maxCandidates:101,responseRows:100,bytes:Buffer.byteLength(JSON.stringify(page)),plan:plans,enterpriseBenchmark:false},null,2));
},15000);

test('concurrent wrong proofs commit only acknowledged attempts and remain bounded after retries',async()=>{
 const s=await setup(),recipient=await actor(s.f),token=await invitation(s,recipient.email),wrong=token.split('.')[0]+'.'+'B'.repeat(43),keys=Array.from({length:5},()=>randomUUID());
 const responses=await Promise.all(keys.map(k=>accept(s.f,recipient.client,wrong,k)));expect(responses.every(r=>[202,409].includes(r.status))).toBe(true);
 for(let i=0;i<responses.length;i++)if(responses[i]!.status===409)expect((await accept(s.f,recipient.client,wrong,keys[i])).status).toBe(202);
 expect((await database.client.workspaceInvitation.findUniqueOrThrow({where:{id:token.split('.')[0]!}})).attempts).toBe(5);expect(await membership(s.workspace.id,recipient.userId)).toBeNull();observations.push({case:'concurrent invalid proofs',http:responses.map(r=>r.status),durableAttemptsAfterSameKeyRetries:5});
},15000);

test('database authority unavailability cannot redeem; additive SQL rejects role and binding tampering',async()=>{
 const s=await setup(),recipient=await actor(s.f),token=await invitation(s,recipient.email),row=await database.client.workspaceInvitation.findUniqueOrThrow({where:{id:token.split('.')[0]!}});
 await expect(Promise.resolve(database.client.workspaceInvitation.update({where:{id:row.id},data:{role:'ADMIN'}}))).rejects.toBeDefined();
 await expect(Promise.resolve(database.client.workspaceInvitation.update({where:{id:row.id},data:{inviterId:recipient.userId}}))).rejects.toBeDefined();
 const badUrl=new URL(url.toString());badUrl.port='1';badUrl.searchParams.set('connect_timeout','1');const unavailable=new Database(badUrl.toString());
 const original=database.transaction.bind(database);database.transaction=unavailable.transaction.bind(unavailable);try{expect((await accept(s.f,recipient.client,token)).status).toBe(503);}finally{database.transaction=original;await unavailable.close();}
 expect(await membership(s.workspace.id,recipient.userId)).toBeNull();expect((await database.client.workspaceInvitation.findUniqueOrThrow({where:{id:row.id}})).consumedAt).toBeNull();
},15000);

test('disabled recipient/issuer and sensitive HTTP rate-store outage remain fail-closed',async()=>{
 const s=await setup(),recipient=await actor(s.f),token=await invitation(s,recipient.email);await database.client.user.update({where:{id:recipient.userId},data:{authDisabled:true}});
 expect((await accept(s.f,recipient.client,token)).status).toBe(401);expect(await membership(s.workspace.id,recipient.userId)).toBeNull();await database.client.user.update({where:{id:recipient.userId},data:{authDisabled:false}});const fresh=await s.f.login(recipient.email);
 await database.client.user.update({where:{id:s.admin.userId},data:{authDisabled:true}});expect((await accept(s.f,fresh,token)).status).toBe(202);expect(await membership(s.workspace.id,recipient.userId)).toBeNull();
 const valid=await setup(),target=await actor(valid.f),proof=await invitation(valid,target.email),closed=createRedis(config.REDIS_URL);closed.on('error',()=>{});await closed.connect();const f=await fixture({invitationCache:closed}),client=await f.login(target.email);closed.disconnect();
 expect((await accept(f,client,proof)).status).toBe(503);expect(await membership(valid.workspace.id,target.userId)).toBeNull();expect((await database.client.workspaceInvitation.findUniqueOrThrow({where:{id:proof.split('.')[0]!}})).consumedAt).toBeNull();
},15000);

async function orderedActors(order:'before'|'after') {
 const f=await fixture(),pair=[await actor(f),await actor(f)].sort((a,b)=>a.userId.localeCompare(b.userId));
 const sender=pair[order==='before'?0:1]!,recipient=pair[order==='before'?1:0]!;
 const response=await create(f,sender.client);expect(response.status).toBe(201);
 return {s:{f,admin:sender,workspace:(await response.json()).workspace},recipient};
}
test.each(['before','after'] as const)('sorted inviter %s: acceptance versus family revocation and ordered membership lifecycle',async order=>{
 const {s,recipient}=await orderedActors(order),keeper=await actor(s.f);await database.client.workspaceMembership.create({data:{workspaceId:s.workspace.id,userId:keeper.userId,role:'ADMIN',status:'ACTIVE'}});
 const token=await invitation(s,recipient.email),hold=holdQuery(/UPDATE workspace_invitations SET consumed_at/),started=performance.now();let response:Response|undefined,waited=false;
 try{
  const request=accept(s.f,recipient.client,token);await hold.entered;
  const family=await database.client.authSessionFamily.findFirstOrThrow({where:{userId:recipient.userId,revokedAt:null}});
  const revoke=fences.revoke({userId:family.userId,identityId:family.identityId,familyId:family.id,authEpoch:family.authEpoch,generation:family.generation,sidDigest:family.sidDigest});
  const changeMembership=()=>database.transaction(async tx=>{
   await tx.$executeRaw`SET LOCAL lock_timeout='1500ms'`;await tx.$executeRaw`SET LOCAL statement_timeout='4000ms'`;
   await tx.$queryRaw`SELECT id FROM users WHERE id=${s.admin.userId}::uuid FOR SHARE`;
   await tx.$queryRaw`SELECT id FROM workspaces WHERE id=${s.workspace.id}::uuid FOR UPDATE`;
   await tx.$queryRaw`SELECT id FROM workspace_invitations WHERE workspace_id=${s.workspace.id}::uuid ORDER BY id FOR UPDATE`;
   await tx.workspaceMembership.update({where:{workspaceId_userId:{workspaceId:s.workspace.id,userId:s.admin.userId}},data:{role:'MEMBER'}});
  });
  const demote=changeMembership();waited=await lockWait('%FROM auth_session_families%FOR UPDATE%');hold.release();
  const outcomes=await Promise.allSettled([request,revoke,demote]);expect(outcomes[0]!.status).toBe('fulfilled');
  if(outcomes[0]!.status==='fulfilled')response=outcomes[0]!.value;
  for(const failure of hold.errors)expect(['40001','P2034']).toContain(failure);
  // A SERIALIZABLE waiter can roll back on the changed membership snapshot.
  // Retry lifecycle work only after its failure and the earlier transaction settle.
  if(outcomes[1]!.status==='rejected'){expect(outcomes[1]!.reason).toMatchObject({name:'AuthUnavailableError'});await fences.revoke({userId:family.userId,identityId:family.identityId,familyId:family.id,authEpoch:family.authEpoch,generation:family.generation,sidDigest:family.sidDigest});}
  if(outcomes[2]!.status==='rejected')await changeMembership();
  observations.push({case:'F1 lifecycle waiter outcomes',inviterSort:order,outcomes:outcomes.map(o=>o.status),sqlStates:hold.errors});
 }finally{hold.restore();}
 expect(waited).toBe(true);expect(response?.status).toBe(202);expect((await s.f.http('/api/v1/auth/me','GET',recipient.client)).status).toBe(401);
 expect((await membership(s.workspace.id,recipient.userId))?.role).toBe('MEMBER');
 observations.push({case:'F1 sorted users with family revoke and membership change',inviterSort:order,familyWaitObserved:waited,http:response!.status,durationMs:Math.round(performance.now()-started),effects:1});
},15000);

test.each(['before','after'] as const)('sorted inviter %s: issuer epoch revocation first rejects stale proof',async order=>{
 const {s,recipient}=await orderedActors(order),token=await invitation(s,recipient.email),entered=latch(),pause=latch(),started=performance.now();
 const revoke=database.transaction(async tx=>{
  await tx.$executeRaw`SET LOCAL lock_timeout='1500ms'`;await tx.$queryRaw`SELECT id FROM users WHERE id=${s.admin.userId}::uuid FOR UPDATE`;
  await tx.$executeRaw`UPDATE users SET auth_epoch=auth_epoch+1 WHERE id=${s.admin.userId}::uuid`;entered.release();await pause.promise;
 });await entered.promise;
 let response:Response;
 try{const request=accept(s.f,recipient.client,token);expect(await lockWait('%FROM users WHERE id IN%')).toBe(true);pause.release();await revoke;response=await request;}finally{pause.release();}
 expect([202,409]).toContain(response.status);expect((await accept(s.f,recipient.client,token)).status).toBe(202);expect(await membership(s.workspace.id,recipient.userId)).toBeNull();
 observations.push({case:'F1 issuer epoch revocation first',inviterSort:order,http:response.status,freshHttp:202,effects:0,durationMs:Math.round(performance.now()-started)});
},15000);

test.each(['demote','archive'] as const)('F2 leased delivery after %s may send but cannot grant authority',async mode=>{
 const s=await setup(),recipient=await actor(s.f),keeper=await actor(s.f);await database.client.workspaceMembership.create({data:{workspaceId:s.workspace.id,userId:keeper.userId,role:'ADMIN',status:'ACTIVE'}});
 expect((await issue(s,recipient.email)).status).toBe(202);
 const entered=latch(),pause=latch();let token='',sent=false;
 const worker=new InvitationDelivery(database,invitationKey);
 const mail=loadVerificationMail({NODE_ENV:'test',EMAIL_MAIL_ENDPOINT:mailpit.url('/api/v1/send'),EMAIL_MAIL_FROM:'invite@unblok.local'}),dispatcher=startVerificationDispatcher({once:async()=>false},mail,createLogger('silent'),'invitation');
 const delivery=worker.once(async(email,value,id)=>{token=value;entered.release();await pause.promise;await dispatcher.send(email,value,id);sent=true;});
 await entered.promise;
 try{
  const id=token.split('.')[0]!;expect((await database.client.workspaceInvitationOutbox.findUniqueOrThrow({where:{invitationId:id}})).leaseId).not.toBeNull();
  await database.transaction(async tx=>{
   await tx.$queryRaw`SELECT id FROM workspaces WHERE id=${s.workspace.id}::uuid FOR UPDATE`;
   await tx.$queryRaw`SELECT id FROM workspace_invitations WHERE workspace_id=${s.workspace.id}::uuid ORDER BY id FOR UPDATE`;
   if(mode==='archive')await tx.workspace.update({where:{id:s.workspace.id},data:{status:'ARCHIVED'}});
   else await tx.workspaceMembership.update({where:{workspaceId_userId:{workspaceId:s.workspace.id,userId:s.admin.userId}},data:{role:'MEMBER'}});
  });
  expect((await database.client.workspaceInvitation.findUniqueOrThrow({where:{id}})).canceledAt).not.toBeNull();pause.release();expect(await delivery).toBe(true);expect(sent).toBe(true);
  const messages=await (await fetch(mailpit.url('/api/v1/messages?limit=500'))).json(),matching=messages.messages.filter((m:{To:{Address:string}[]})=>m.To.some(r=>r.Address===recipient.email));expect(matching).toHaveLength(1);
  const message=await (await fetch(mailpit.url('/api/v1/message/')+matching[0].ID)).json();expect(message.Text).toContain(token);
  expect((await accept(s.f,recipient.client,token)).status).toBe(202);expect(await membership(s.workspace.id,recipient.userId)).toBeNull();
  expect(await worker.once(async()=>{throw new Error('Canceled proof must not lease again');})).toBe(false);
  observations.push({case:'F2 revocation between lease and external send',revocation:mode,leaseCommittedBeforeRevocation:true,mailSentAfterRevocation:sent,acceptHttp:202,effects:0});
 }finally{pause.release();await delivery;await dispatcher.close();
  const messages=await (await fetch(mailpit.url('/api/v1/messages?limit=500'))).json(),matching=messages.messages.filter((m:{To:{Address:string}[]})=>m.To.some(r=>r.Address===recipient.email));
  await mailpit.deleteOwned(matching.map((m:{ID:string})=>m.ID));
 }
},15000);

test('SID retirement locks every user before sorted families even when a digest matches multiple users',async()=>{
 const f=await fixture(),actors=[await actor(f),await actor(f)],sidDigest=randomBytes(32).toString('hex'),expires=new Date(Date.now()+60000);
 const families=await Promise.all(actors.map(a=>fences.create({userId:a.userId,identityId:a.identityId,sidDigest,absoluteExpiresAt:expires,idleExpiresAt:expires})));
 const original=database.transaction.bind(database),phases:string[]=[];const familyIds:string[]=[];
 database.transaction=run=>original(tx=>run(new Proxy(tx,{get(target,property){if(property!=='$queryRaw')return Reflect.get(target,property);return async(...args:unknown[])=>{
  const first=args[0],sql=Array.isArray(first)?first.join(' '):String(first&&typeof first==='object'&&'sql' in first?first.sql:'');
  if(/FROM users.*FOR SHARE/s.test(sql)){expect(sql).toContain('ORDER BY id');phases.push('all-users');}
  if(/FROM auth_session_families.*FOR UPDATE/s.test(sql)){phases.push('family');familyIds.push(String(args[1]));}
  return Reflect.apply(target.$queryRaw,target,args);
 };}})));
 try{await fences.retireSid(sidDigest);}finally{database.transaction=original;}
 expect(phases).toEqual(['all-users','family','family']);expect(familyIds).toEqual(families.map(f=>f.familyId).sort());
 expect(await database.client.authSessionFamily.count({where:{sidDigest,revokedAt:{not:null}}})).toBe(2);
 observations.push({case:'F1 nonunique SID digest retirement',userLocksBeforeAllFamilies:true,familiesSorted:true,revokedFamilies:2});
},15000);

test('legacy raw membership lock inversion rolls back within existing bounds and never bypasses authority',async()=>{
 const s=await setup(),recipient=await actor(s.f);await database.client.workspaceMembership.create({data:{workspaceId:s.workspace.id,userId:recipient.userId,role:'OBSERVER',status:'INVITED'}});
 const token=await invitation(s,recipient.email),hold=holdQuery(/SELECT id FROM workspaces.*FOR UPDATE/s),started=performance.now();let status=0;const outcomes:string[]=[];
 try{
  const request=accept(s.f,recipient.client,token);await hold.entered;
  const legacy=database.transaction(async tx=>{
   await tx.$executeRaw`SET LOCAL lock_timeout='1500ms'`;await tx.$executeRaw`SET LOCAL statement_timeout='4000ms'`;
   // Deliberately emulate unsafe maintenance: target tuple before trigger Workspace.
   await tx.workspaceMembership.update({where:{workspaceId_userId:{workspaceId:s.workspace.id,userId:recipient.userId}},data:{status:'SUSPENDED'}});
  });
  expect(await lockWait('%UPDATE%workspace_memberships%')).toBe(true);hold.release();
  const settled=await Promise.allSettled([request,legacy]);outcomes.push(...settled.map(o=>o.status));expect(settled[0]!.status).toBe('fulfilled');
  if(settled[0]!.status==='fulfilled')status=settled[0]!.value.status;
  expect([202,409,503]).toContain(status);if(status!==202){expect((await database.client.workspaceInvitation.findUniqueOrThrow({where:{id:token.split('.')[0]!}})).consumedAt).toBeNull();expect((await membership(s.workspace.id,recipient.userId))?.status).not.toBe('ACTIVE');}expect(hold.errors.length).toBeGreaterThan(0);
  for(const code of hold.errors)expect(['40001','40P01','55P03','P2034']).toContain(code);
  if(settled[1]!.status==='rejected')await database.transaction(async tx=>{
   await tx.$queryRaw`SELECT id FROM workspaces WHERE id=${s.workspace.id}::uuid FOR UPDATE`;
   await tx.$queryRaw`SELECT id FROM workspace_invitations WHERE workspace_id=${s.workspace.id}::uuid ORDER BY id FOR UPDATE`;
   await tx.workspaceMembership.update({where:{workspaceId_userId:{workspaceId:s.workspace.id,userId:recipient.userId}},data:{status:'SUSPENDED'}});
  });
  expect((await accept(s.f,recipient.client,token)).status).toBe(202);expect((await membership(s.workspace.id,recipient.userId))?.status).toBe('SUSPENDED');
  expect((await s.f.http('/api/v1/workspaces/'+s.workspace.id,'GET',recipient.client)).status).toBe(404);
  observations.push({case:'F1 unsafe raw membership inversion',http:status,lifecycleOutcomes:outcomes,sqlStates:hold.errors,durationMs:Math.round(performance.now()-started),finalSuspended:true,freshDetailHttp:404});
 }finally{hold.restore();}
},15000);
