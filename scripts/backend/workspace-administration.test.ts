import {DisposableMailpit} from '../test-support/mailpit.cjs';
import { afterAll, afterEach, beforeAll, expect, test } from 'bun:test';
import { createHmac,randomBytes, randomUUID } from 'node:crypto';
import {cp,mkdtemp,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import { resolve } from 'node:path';
import { Database, AccountCredentials, AuthFences, Tenancy, denyAll, InvitationDelivery, type WorkspaceKeys } from '@unblok/database';
import { createLogger, createRedis, loadApiConfig,loadVerificationMail } from '@unblok/backend-runtime';
import {startVerificationDispatcher} from '../../apps/worker/src/jobs/email-verification';
import { createApp } from '../../apps/api/src/app';
import { RedisRateLimiter } from '../../apps/api/src/security';
import { Sessions, connectSessionStore, sessionSettings } from '../../apps/api/src/modules/sessions';
import { Authentication, AuthenticationLimits, Passwords } from '../../apps/api/src/modules/auth';

import { Workspaces, WorkspaceLimits, InvitationLimits } from '../../apps/api/src/modules/workspaces';
const mailpit=new DisposableMailpit();
const invitationKey={id:'invitation-v1',secret:randomBytes(32).toString('hex')};
const workspaceKeys = { active: 'v1', cursors: { v1: randomBytes(32).toString('hex') }, idempotency: randomBytes(32).toString('hex') };
const root = resolve(import.meta.dir, '../..'), config = loadApiConfig(process.env);
const admin = new Database(config.DATABASE_URL), name = `unblok_be01b_test_${randomUUID().replaceAll('-', '')}`;
const url = new URL(config.DATABASE_URL); url.pathname = `/${name}`;
const database = new Database(url.toString()), fences = new AuthFences(database), cache = createRedis(config.REDIS_URL);
const ownedPrefix = `be01b:test:${randomUUID()}:`;
cache.on('error', () => {}); // Expected outage diagnostics must not print SDK details.
const stops: (() => Promise<void>)[] = [];
let created = false;
async function prisma(args: string[],target=url.toString()) {
  const child = Bun.spawn([process.execPath, 'packages/database/node_modules/prisma/build/index.js', ...args],
    { cwd: root, env: { ...process.env, DATABASE_URL: target }, stdout: 'pipe', stderr: 'pipe' });
  let timedOut = false; const timer = setTimeout(() => { timedOut = true; child.kill('SIGKILL'); }, 6000);
  try {
    const [exit, out, err] = await Promise.all([child.exited, new Response(child.stdout).text(), new Response(child.stderr).text()]);
    if (timedOut || exit !== 0) throw new Error('Owned migration verification failed; timedOut='+timedOut+' '+err.replaceAll(target,'[owned URL redacted]'));
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
    try { if(cache.status==='ready'){const keys = await cache.keys(`${ownedPrefix}*`); if (keys.length) await cache.del(...keys);} }
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

type Setup=Awaited<ReturnType<typeof setup>>;
const endpoint=(s:Setup,suffix:string)=>`/api/v1/workspaces/${s.workspace.id}/administration/${suffix}`;
const read=(s:Setup,suffix:string,client=s.admin.client)=>s.f.http(endpoint(s,suffix),'GET',client);
const mutate=(s:Setup,suffix:string,body:unknown={},method='POST',match?:string,key=randomUUID(),client=s.admin.client)=>s.f.http(endpoint(s,suffix),method,client,body,{'idempotency-key':key,...(match?{'if-match':`"${match}"`}:{})});
async function adminInvite(s:Setup,email:string,role='MEMBER',teamIds:string[]=[]){const r=await mutate(s,'invitations',{email,role,teamIds});expect(r.status).toBe(202);expect(await r.json()).toEqual({status:'accepted'});return database.client.workspaceInvitation.findFirstOrThrow({where:{workspaceId:s.workspace.id,email},orderBy:{issuedAt:'desc'}});}
async function tokenFor(row:{id:string}){let token='';const worker=new InvitationDelivery(database,invitationKey);expect(await worker.once(async(_email,value,id)=>{expect(id).toBe(row.id);token=value;})).toBe(true);return token;}
async function addMember(s:Setup,role:'ADMIN'|'MEMBER'|'OBSERVER'='MEMBER',verified=true){const account=await actor(s.f,verified),m=await database.client.workspaceMembership.create({data:{workspaceId:s.workspace.id,userId:account.userId,status:'ACTIVE',role,joinedAt:new Date()}});return {...account,m};}
async function ownedTeam(s:Setup,key='ONE'){const owner=await membership(s.workspace.id,s.admin.userId),id=randomUUID();await database.transaction(async tx=>{await tx.$queryRaw`SELECT id FROM workspaces WHERE id=${s.workspace.id}::uuid FOR UPDATE`;await tx.team.create({data:{workspaceId:s.workspace.id,id,key,name:'Team '+key,ownerMembershipId:owner!.id}});await tx.teamMembership.create({data:{workspaceId:s.workspace.id,teamId:id,membershipId:owner!.id}});});return id;}
async function waitForWorkspaceWaiters(count:number){const deadline=Date.now()+1000;while(Date.now()<deadline){const rows=await database.client.$queryRaw<{n:bigint}[]>`SELECT count(*) AS n FROM pg_stat_activity WHERE datname=current_database() AND wait_event_type='Lock' AND query LIKE '%FROM workspaces%'`;if(Number(rows[0]!.n)>=count)return;await Bun.sleep(10);}throw Error('Expected primary Workspace lock wait was not observed');}

test('private directory: role matrix, nullable contact fields, filters, exact counts and signed stale cursors',async()=>{
 const s=await setup(),member=await addMember(s),observer=await addMember(s,'OBSERVER'),unverified=await addMember(s,'ADMIN',false),foreign=await actor(s.f);
 const first=await read(s,'memberships?limit=1');expect(first.status).toBe(200);expect(first.headers.get('cache-control')).toBe('private, no-store');const p=await first.json();expect(p.totals).toEqual({activeMembers:4,matchingMembers:4,pendingInvitations:0});expect(p.items[0]).toHaveProperty('email');expect(p.items[0]).not.toHaveProperty('userId');expect(p.items[0]).not.toHaveProperty('authEpoch');
 for(const account of [member,observer,unverified,foreign])expect((await read(s,'memberships',account.client)).status).toBe(404);
 expect((await s.f.http(endpoint(s,'memberships'))).status).toBe(401);
 const cursor=encodeURIComponent(p.page.nextCursor);expect((await read(s,'memberships?limit=1&after='+cursor)).status).toBe(200);
 expect((await read(s,'memberships?limit=2&after='+cursor)).status).toBe(400);
 expect((await read(s,'memberships?limit=1&after='+encodeURIComponent(p.page.nextCursor+'x'))).status).toBe(400);
 expect((await read(s,'memberships?role=OBSERVER')).status).toBe(200);expect((await (await read(s,'memberships?role=OBSERVER')).json()).totals.matchingMembers).toBe(1);
 expect((await (await read(s,'memberships?search='+encodeURIComponent(member.email))).json()).items[0].id).toBe(member.m.id);
 await database.client.user.update({where:{id:member.userId},data:{name:'Changed'}});expect((await read(s,'memberships?limit=1&after='+cursor)).status).toBe(409);
 const other=await setup();expect((await other.f.http(endpoint(s,'memberships'),'GET',other.admin.client)).status).toBe(404);
},20000);

test('ADMIN invitation, immutable multi-Team plan, owner-only selection and atomic acceptance',async()=>{
 const s=await setup(),one=await ownedTeam(s),two=await ownedTeam(s,'TWO'),recipient=await actor(s.f),outsider=await addMember(s,'ADMIN');
 expect((await (await read(s,'eligible-teams')).json()).items.map((t:{id:string})=>t.id).sort()).toEqual([one,two].sort());
 expect((await (await read(s,'eligible-teams',outsider.client)).json()).items).toEqual([]);
 expect((await mutate(s,'invitations',{email:recipient.email,role:'ADMIN',teamIds:[one]},'POST',undefined,randomUUID(),outsider.client)).status).toBe(404);
 const row=await adminInvite(s,recipient.email,'ADMIN',[two,one]);expect(row.proofVersion).toBe(2);expect(row.expiresAt.getTime()-row.issuedAt.getTime()).toBe(86400000);
 await expect(Promise.resolve(database.client.$executeRaw`DELETE FROM workspace_invitation_teams WHERE invitation_id=${row.id}::uuid`)).rejects.toThrow();
 const token=await tokenFor(row);expect((await s.f.http('/api/v1/workspace-invitations/preview','POST',outsider.client,{token})).status).toBe(200);
 expect(await (await s.f.http('/api/v1/workspace-invitations/preview','POST',outsider.client,{token})).json()).toEqual({status:'accepted'});
 const preview=await (await s.f.http('/api/v1/workspace-invitations/preview','POST',recipient.client,{token})).json();expect(preview.invitation.status).toBe('PENDING');expect(preview.invitation.teams).toHaveLength(2);expect(preview.invitation).not.toHaveProperty('isExistingUser');
 expect((await accept(s.f,recipient.client,token)).status).toBe(202);const m=await membership(s.workspace.id,recipient.userId);expect(m?.role).toBe('ADMIN');expect(await database.client.teamMembership.count({where:{workspaceId:s.workspace.id,membershipId:m!.id}})).toBe(2);
 expect((await accept(s.f,recipient.client,token)).status).toBe(202);expect(await database.client.teamMembership.count({where:{workspaceId:s.workspace.id,membershipId:m!.id}})).toBe(2);
 const detail=await (await read(s,'invitations/'+row.id)).json();expect(detail.status).toBe('ACCEPTED');expect(detail.delivery).toBe('DELIVERED');expect(JSON.stringify(detail)).not.toContain(token);expect(detail).not.toHaveProperty('tokenDigest');
},20000);

test('invalidated Team plan fails closed without consuming or partial membership/joins',async()=>{
 const s=await setup(),one=await ownedTeam(s),two=await ownedTeam(s,'TWO'),r=await actor(s.f),row=await adminInvite(s,r.email,'MEMBER',[one,two]),token=await tokenFor(row);
 await database.client.team.update({where:{workspaceId_id:{workspaceId:s.workspace.id,id:two}},data:{status:'ARCHIVED',version:{increment:1}}});
 expect((await accept(s.f,r.client,token)).status).toBe(202);expect(await membership(s.workspace.id,r.userId)).toBeNull();expect((await database.client.workspaceInvitation.findUniqueOrThrow({where:{id:row.id}})).consumedAt).toBeNull();
 expect((await (await read(s,'invitations/'+row.id)).json()).status).toBe('INVALIDATED');
 await database.client.team.update({where:{workspaceId_id:{workspaceId:s.workspace.id,id:two}},data:{status:'ACTIVE',version:{increment:1}}});
 expect((await accept(s.f,r.client,token)).status).toBe(202);expect(await membership(s.workspace.id,r.userId)).toBeNull();expect((await (await read(s,'invitations/'+row.id)).json()).status).toBe('INVALIDATED');
},20000);

test('resend rotates immutable generations; stale proof cannot grant; revocation and idempotency stay fenced',async()=>{
 const s=await setup(),r=await actor(s.f),row=await adminInvite(s,r.email),token=await tokenFor(row),detail=await (await read(s,'invitations/'+row.id)).json(),key=randomUUID();
 expect((await mutate(s,'invitations/'+row.id+'/resend',{},'POST',detail.revision,key)).status).toBe(202);
 expect((await mutate(s,'invitations/'+row.id+'/resend',{},'POST',detail.revision,key)).status).toBe(202);
 const next=await database.client.workspaceInvitation.findFirstOrThrow({where:{previousId:row.id}});expect(next.id).not.toBe(row.id);
 expect((await accept(s.f,r.client,token)).status).toBe(202);expect(await membership(s.workspace.id,r.userId)).toBeNull();
 expect((await (await read(s,'invitations/'+row.id)).json()).status).toBe('SUPERSEDED');
 const fresh=await tokenFor(next),revision=(await (await read(s,'invitations/'+next.id)).json()).revision;
 expect((await mutate(s,'invitations/'+next.id+'/revoke',{},'POST',revision)).status).toBe(202);
 expect((await accept(s.f,r.client,fresh)).status).toBe(202);expect(await membership(s.workspace.id,r.userId)).toBeNull();
 expect((await (await read(s,'invitations/'+next.id)).json()).status).toBe('REVOKED');
},20000);

test('member mutations require current authority, If-Match and operation-bound keys; removal retains identity and denies readmission',async()=>{
 const s=await setup(),r=await addMember(s),key=randomUUID(),suffix='memberships/'+r.m.id;
 expect((await mutate(s,suffix,{role:'OBSERVER'},'PATCH')).status).toBe(428);
 expect((await mutate(s,suffix,{role:'OBSERVER'},'PATCH','99')).status).toBe(412);
 expect((await mutate(s,suffix,{role:'OBSERVER'},'PATCH','1',key)).status).toBe(202);
 expect((await mutate(s,suffix,{role:'OBSERVER'},'PATCH','1',key)).status).toBe(202);
 expect((await mutate(s,suffix,{role:'ADMIN'},'PATCH','1',key)).status).toBe(409);
 // A second administrator has an independent request budget and removes the retained identity.
 const second=await addMember(s,'ADMIN');expect((await mutate(s,suffix,{},'DELETE','2',randomUUID(),second.client)).status).toBe(202);
 const removed=await membership(s.workspace.id,r.userId);expect(removed!.id).toBe(r.m.id);expect(removed!.status).toBe('SUSPENDED');expect(removed!.removedAt).not.toBeNull();
 expect((await s.f.http('/api/v1/workspaces/'+s.workspace.id,'GET',r.client)).status).toBe(404);
 await expect(Promise.resolve(database.client.workspaceMembership.update({where:{workspaceId_id:{workspaceId:s.workspace.id,id:r.m.id}},data:{status:'ACTIVE'}}))).rejects.toThrow();
 expect((await s.f.http('/api/v1/auth/me','GET',r.client)).status).toBe(200);
},20000);

test('last-admin and Team-owner mutations are rejected without weakening independent security revocation',async()=>{
 const s=await setup(),self=await membership(s.workspace.id,s.admin.userId);
 expect((await mutate(s,'memberships/'+self!.id,{role:'MEMBER'},'PATCH','1')).status).toBe(409);
 await addMember(s,'ADMIN');await ownedTeam(s);
 expect((await mutate(s,'memberships/'+self!.id,{role:'MEMBER'},'PATCH','1')).status).toBe(409);
 expect((await mutate(s,'memberships/'+self!.id,{},'DELETE','1')).status).toBe(409);
 expect((await membership(s.workspace.id,s.admin.userId))!.role).toBe('ADMIN');
},20000);

test('legacy v1 proof still redeems; existing/suspended accounts never gain invitation roles or Teams',async()=>{
 const s=await setup(),r=await actor(s.f),token=await invitation(s,r.email);expect((await accept(s.f,r.client,token)).status).toBe(202);expect((await membership(s.workspace.id,r.userId))!.role).toBe('MEMBER');
 const team=await ownedTeam(s),row=await adminInvite(s,r.email,'ADMIN',[team]),newToken=await tokenFor(row);expect((await accept(s.f,r.client,newToken)).status).toBe(202);const m=await membership(s.workspace.id,r.userId);expect(m!.role).toBe('MEMBER');expect(await database.client.teamMembership.count({where:{workspaceId:s.workspace.id,membershipId:m!.id}})).toBe(0);
 const suspended=await addMember(s);await database.client.workspaceMembership.update({where:{workspaceId_id:{workspaceId:s.workspace.id,id:suspended.m.id}},data:{status:'SUSPENDED'}});const denied=await adminInvite(s,suspended.email),deniedToken=await tokenFor(denied);expect((await accept(s.f,suspended.client,deniedToken)).status).toBe(202);expect((await membership(s.workspace.id,suspended.userId))!.status).toBe('SUSPENDED');
},20000);

test('concurrent acceptance/revocation gives one serial result; no revoked proof or partial assignment',async()=>{
 const s=await setup(),r=await actor(s.f),team=await ownedTeam(s),row=await adminInvite(s,r.email,'MEMBER',[team]),token=await tokenFor(row),rev=(await (await read(s,'invitations/'+row.id)).json()).revision;
 let entered!:()=>void,release!:()=>void;const held=new Promise<void>(r=>entered=r),gate=new Promise<void>(r=>release=r);
 const block=database.transaction(async tx=>{await tx.$queryRaw`SELECT id FROM workspaces WHERE id=${s.workspace.id}::uuid FOR UPDATE`;entered();await gate;});await held;
 const accepted=accept(s.f,r.client,token),revoked=mutate(s,'invitations/'+row.id+'/revoke',{},'POST',rev);try{await waitForWorkspaceWaiters(2);}finally{release();}await block;
 const responses=await Promise.all([accepted,revoked]);expect(responses.every(r=>[202,409,412].includes(r.status))).toBe(true);
 const final=await database.client.workspaceInvitation.findUniqueOrThrow({where:{id:row.id}}),m=await membership(s.workspace.id,r.userId);expect(Boolean(final.consumedAt)&&Boolean(final.canceledAt)).toBe(false);
 if(final.consumedAt){expect(m).not.toBeNull();expect(await database.client.teamMembership.count({where:{workspaceId:s.workspace.id,membershipId:m!.id}})).toBe(1);}else{expect(m).toBeNull();}
},20000);

test('additive upgrade retains 12 checksums, v1 proof/outbox/receipt and membership references; migrated v1 redeems',async()=>{
 const dbName=name+'_upgrade',upUrl=new URL(config.DATABASE_URL);upUrl.pathname='/'+dbName;const up=new Database(upUrl.toString()),directory=await mkdtemp(resolve(tmpdir(),'be01b-upgrade-'));let exists=false;
 try{
  await cp(resolve(root,'packages/database/prisma/schema.prisma'),resolve(directory,'schema.prisma'));
  const migrations=(await readdir(resolve(root,'packages/database/prisma/migrations'))).filter(m=>/^2026/.test(m)&&m<'20261016000000_workspace_administration');expect(migrations).toHaveLength(12);
  for(const m of ['migration_lock.toml',...migrations])await cp(resolve(root,'packages/database/prisma/migrations',m),resolve(directory,'migrations',m),{recursive:true});
  await admin.client.$executeRawUnsafe(`CREATE DATABASE "${dbName}"`);exists=true;await prisma(['migrate','deploy','--schema',resolve(directory,'schema.prisma')],upUrl.toString());await up.connect();
  const credentials=new AccountCredentials(up),passwordHash=await (await Passwords.create()).hash(password),email='issuer-'+randomUUID()+'@example.test',recipientEmail='recipient-'+randomUUID()+'@example.test';
  for(const emailValue of [email,recipientEmail])await credentials.create({email:emailValue,name:'Preserved account',passwordHash});
  const issuer=await credentials.lookup(email),recipient=await credentials.lookup(recipientEmail);expect(issuer).not.toBeNull();expect(recipient).not.toBeNull();
  await up.client.passwordCredential.updateMany({data:{emailVerifiedAt:new Date()}});
  const ws=randomUUID(),member=randomUUID(),id=randomUUID(),receiptKey=randomUUID(),mac=(domain:string,data:string)=>createHmac('sha256',Buffer.from(invitationKey.secret,'hex')).update(domain+'\0'+data).digest('hex');
  const token=id+'.'+createHmac('sha256',Buffer.from(invitationKey.secret,'hex')).update('unblok-invitation-proof-v1\0'+JSON.stringify([invitationKey.id,id,ws,issuer!.userId,'1',recipientEmail,'MEMBER'])).digest('base64url');
  await up.transaction(async tx=>{
   await tx.workspace.create({data:{id:ws,slug:ws,name:'Preserved Workspace'}});
   await tx.$executeRaw`INSERT INTO workspace_memberships(workspace_id,id,user_id,role,status) VALUES(${ws}::uuid,${member}::uuid,${issuer!.userId}::uuid,'ADMIN','ACTIVE')`;
   await tx.$executeRaw`INSERT INTO workspace_invitations(id,workspace_id,inviter_id,inviter_identity_id,inviter_membership_id,inviter_epoch,email,role,key_id,token_digest,issued_at,expires_at) VALUES(${id}::uuid,${ws}::uuid,${issuer!.userId}::uuid,${issuer!.identityId}::uuid,${member}::uuid,1,${recipientEmail},'MEMBER',${invitationKey.id},${mac('unblok-invitation-digest-v1',token)},date_trunc('milliseconds',clock_timestamp()),date_trunc('milliseconds',clock_timestamp())+interval '24 hours'-interval '1 second')`;
   await tx.workspaceInvitationOutbox.create({data:{invitationId:id}});
   await tx.workspaceInvitationResult.create({data:{actorId:issuer!.userId,operation:'workspace:invite:v1',requestKey:receiptKey,payloadDigest:'1'.repeat(64)}});
  });
  const history=await up.client.$queryRaw<unknown[]>`SELECT migration_name,checksum,finished_at FROM _prisma_migrations ORDER BY migration_name`,old=await up.client.$queryRaw<unknown[]>`SELECT id,workspace_id,token_digest,issued_at,expires_at FROM workspace_invitations`,receipts=await up.client.workspaceInvitationResult.findMany();
  await prisma(['migrate','deploy','--schema','packages/database/prisma/schema.prisma'],upUrl.toString());
  expect((await up.client.$queryRaw<unknown[]>`SELECT migration_name,checksum,finished_at FROM _prisma_migrations ORDER BY migration_name`).slice(0,12)).toEqual(history);
  expect(await up.client.$queryRaw<unknown[]>`SELECT id,workspace_id,token_digest,issued_at,expires_at FROM workspace_invitations`).toEqual(old);expect(await up.client.workspaceInvitationResult.findMany()).toEqual(receipts);
  expect((await up.client.workspaceInvitation.findUniqueOrThrow({where:{id}})).proofVersion).toBe(1);
  let delivered='';expect(await new InvitationDelivery(up,invitationKey).once(async(_email,value)=>{delivered=value;})).toBe(true);expect(delivered).toBe(token);
  const localFences=new AuthFences(up),session=await localFences.create({userId:recipient!.userId,identityId:recipient!.identityId,sidDigest:randomBytes(32).toString('hex'),absoluteExpiresAt:new Date(Date.now()+600000),idleExpiresAt:new Date(Date.now()+300000)}),tenancy=new Tenancy(up,{verify:async()=>null},denyAll,{verify:async()=>session},undefined,workspaceKeys,invitationKey);
  await tenancy.authenticateSession('owned-test',p=>tenancy.acceptInvitation(p,token,randomUUID()));expect((await up.client.workspaceMembership.findUniqueOrThrow({where:{workspaceId_userId:{workspaceId:ws,userId:recipient!.userId}}})).role).toBe('MEMBER');
  expect(await prisma(['migrate','diff','--from-schema-datasource','packages/database/prisma/schema.prisma','--to-schema-datamodel','packages/database/prisma/schema.prisma','--exit-code'],upUrl.toString())).toContain('No difference');
 }finally{await up.close();if(exists)await admin.client.$executeRawUnsafe(`DROP DATABASE "${dbName}" WITH (FORCE)`);await rm(directory,{recursive:true,force:true});}
},30000);

test('private mutation role matrix, CSRF, scoped CORS and revoked-session fences',async()=>{
 const s=await setup(),target=await addMember(s),member=await addMember(s),observer=await addMember(s,'OBSERVER'),unverified=await addMember(s,'ADMIN',false),foreign=await actor(s.f);
 for(const caller of [member,observer,unverified,foreign])for(const [suffix,method,body] of [['invitations','POST',{email:'neutral@example.test',role:'ADMIN'}],['memberships/'+target.m.id,'PATCH',{role:'ADMIN'}],['memberships/'+target.m.id,'DELETE',{}],['invitations/'+randomUUID()+'/resend','POST',{}],['invitations/'+randomUUID()+'/revoke','POST',{}]] as const)expect((await mutate(s,suffix,body,method,'1',randomUUID(),caller.client)).status).toBe(404);
 expect((await s.f.http(endpoint(s,'invitations'),'POST',s.admin.client,{email:'neutral@example.test',role:'ADMIN'},{'idempotency-key':randomUUID(),'x-csrf-token':undefined})).status).toBe(403);
 const preflight=await s.f.http(endpoint(s,'memberships/'+target.m.id),'OPTIONS',undefined,undefined,{'access-control-request-method':'PATCH','access-control-request-headers':'content-type,x-csrf-token,idempotency-key,if-match'});expect(preflight.status).toBe(204);
 expect((await s.f.http(endpoint(s,'memberships'),'OPTIONS',undefined,undefined,{'access-control-request-method':'GET','access-control-request-headers':'x-unapproved-header'})).status).toBe(403);
 expect((await s.f.http('/api/v1/auth/logout-all','POST',s.admin.client,{})).status).toBe(200);expect((await read(s,'memberships')).status).toBe(401);
},20000);

test('bounded Team continuation and invitation pagination reject filter/actor/revision changes',async()=>{
 const s=await setup(),self=await membership(s.workspace.id,s.admin.userId);for(let n=0;n<7;n++)await ownedTeam(s,'K'+n);
 const row=(await (await read(s,'memberships')).json()).items.find((r:{id:string})=>r.id===self!.id);expect(row.teams.items).toHaveLength(5);expect(row.teams.page.hasMore).toBe(true);
 const tail=await (await read(s,'memberships/'+self!.id+'/teams?limit=5&after='+encodeURIComponent(row.teams.page.nextCursor))).json();expect(tail.items).toHaveLength(2);expect(tail.page.hasMore).toBe(false);
 await adminInvite(s,'one@example.test');await adminInvite(s,'two@example.test');const first=await (await read(s,'invitations?limit=1')).json();expect(first.total).toBe(2);expect(first.page.hasMore).toBe(true);
 const cursor=encodeURIComponent(first.page.nextCursor);expect((await read(s,'invitations?limit=1&after='+cursor)).status).toBe(200);expect((await read(s,'invitations?limit=1&status=PENDING&after='+cursor)).status).toBe(400);
 // Issuer revocation invalidates private lifecycle traversal without writing revision rows from logout.
 await fences.revokeAll(s.admin.userId);const next=await s.f.login(s.admin.email);expect((await read(s,'invitations?limit=1&after='+cursor,next)).status).toBe(409);
},20000);

test('v2 delivery uses disposable Mailpit and preserves sentinels; recipient ownership and expiry stay neutral',async()=>{
 const s=await setup(),recipient=await actor(s.f),unverified=await actor(s.f,false),row=await adminInvite(s,recipient.email,'ADMIN');
 const mail=loadVerificationMail({NODE_ENV:'test',EMAIL_MAIL_ENDPOINT:mailpit.url('/api/v1/send'),EMAIL_MAIL_FROM:'invite@unblok.local'}),dispatcher=startVerificationDispatcher({once:async()=>false},mail,createLogger('silent'),'invitation');let token='';
 try{expect(await new InvitationDelivery(database,invitationKey).once(async(email,value,id)=>{token=value;await dispatcher.send(email,value,id);})).toBe(true);}finally{await dispatcher.close();}
 const matching=(await mailpit.messages()).messages.filter((m:{To:{Address:string}[]})=>m.To.some(r=>r.Address===recipient.email));expect(matching).toHaveLength(1);const message=await mailpit.message(matching[0]!.ID);expect(message.Text).toContain(token);expect(message.Text).toContain('24 hours');await mailpit.assertSentinels();
 expect(await (await s.f.http('/api/v1/workspace-invitations/preview','POST',unverified.client,{token})).json()).toEqual({status:'accepted'});
 const forged=token.slice(0,-1)+(token.endsWith('a')?'b':'a');expect(await (await s.f.http('/api/v1/workspace-invitations/preview','POST',recipient.client,{token:forged})).json()).toEqual({status:'accepted'});
 expect((await accept(s.f,recipient.client,token)).status).toBe(202);expect((await membership(s.workspace.id,recipient.userId))!.role).toBe('ADMIN');expect(JSON.stringify(await database.client.workspaceInvitation.findUniqueOrThrow({where:{id:row.id}}),(_k,v)=>typeof v==='bigint'?v.toString():v)).not.toContain(token);
 const unverifiedRow=await adminInvite(s,unverified.email),unverifiedToken=await tokenFor(unverifiedRow);expect(await (await s.f.http('/api/v1/workspace-invitations/preview','POST',unverified.client,{token:unverifiedToken})).json()).toEqual({status:'accepted'});expect((await accept(s.f,unverified.client,unverifiedToken)).status).toBe(202);expect(await membership(s.workspace.id,unverified.userId)).toBeNull();
 // Insert an already-expired, authentic v1 proof on this owned DB; never shorten/mutate immutable proofs.
 const id=randomUUID(),recipient2=await actor(s.f),owner=await membership(s.workspace.id,s.admin.userId),expired=id+'.'+createHmac('sha256',Buffer.from(invitationKey.secret,'hex')).update('unblok-invitation-proof-v1\0'+JSON.stringify([invitationKey.id,id,s.workspace.id,s.admin.userId,'1',recipient2.email,'MEMBER'])).digest('base64url'),digest=createHmac('sha256',Buffer.from(invitationKey.secret,'hex')).update('unblok-invitation-digest-v1\0'+expired).digest('hex');
 await database.client.workspaceInvitation.create({data:{id,workspaceId:s.workspace.id,inviterId:s.admin.userId,inviterIdentityId:s.admin.identityId,inviterMembershipId:owner!.id,inviterEpoch:1n,email:recipient2.email,role:'MEMBER',keyId:invitationKey.id,tokenDigest:digest,issuedAt:new Date(Date.now()-90000000),expiresAt:new Date(Date.now()-3601000)}});
 expect((await accept(s.f,recipient2.client,expired)).status).toBe(202);expect(await membership(s.workspace.id,recipient2.userId)).toBeNull();expect((await (await read(s,'invitations/'+id)).json()).status).toBe('EXPIRED');await mailpit.assertSentinels();
},20000);

test('concurrent final-admin demotions serialize and retain one authoritative administrator',async()=>{
 const s=await setup(),second=await addMember(s,'ADMIN'),self=await membership(s.workspace.id,s.admin.userId);
 const responses=await Promise.all([mutate(s,'memberships/'+self!.id,{role:'MEMBER'},'PATCH','1'),mutate(s,'memberships/'+second.m.id,{role:'MEMBER'},'PATCH','1',randomUUID(),second.client)]);expect(responses.every(r=>[202,409].includes(r.status))).toBe(true);expect(responses.filter(r=>r.status===202)).toHaveLength(1);expect(await database.client.workspaceMembership.count({where:{workspaceId:s.workspace.id,role:'ADMIN',status:'ACTIVE'}})).toBe(1);
},20000);

test('failure during multi-Team insertion rolls back membership, proof consumption and receipt; explicit same-key retry commits',async()=>{
 const s=await setup(),recipient=await actor(s.f),one=await ownedTeam(s),two=await ownedTeam(s,'TWO'),row=await adminInvite(s,recipient.email,'MEMBER',[one,two]),token=await tokenFor(row),key=randomUUID();
 // Fault injection is confined to this suite's newly created database, after normal authority checks.
 await database.client.$executeRawUnsafe(`CREATE FUNCTION be01b_injected_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.team_id='${two}'::uuid THEN RAISE EXCEPTION 'Owned injected assignment failure'; END IF; RETURN NEW; END $$`);
 await database.client.$executeRawUnsafe('CREATE TRIGGER be01b_injected_failure BEFORE INSERT ON team_memberships FOR EACH ROW EXECUTE FUNCTION be01b_injected_failure()');
 try{expect((await accept(s.f,recipient.client,token,key)).status).toBe(503);expect(await membership(s.workspace.id,recipient.userId)).toBeNull();expect((await database.client.workspaceInvitation.findUniqueOrThrow({where:{id:row.id}})).consumedAt).toBeNull();expect(await database.client.workspaceInvitationResult.count({where:{actorId:recipient.userId,operation:'invitation:accept:v1',requestKey:key}})).toBe(0);}
 finally{await database.client.$executeRawUnsafe('DROP TRIGGER be01b_injected_failure ON team_memberships');await database.client.$executeRawUnsafe('DROP FUNCTION be01b_injected_failure()');}
 expect((await accept(s.f,recipient.client,token,key)).status).toBe(202);const m=await membership(s.workspace.id,recipient.userId);expect(await database.client.teamMembership.count({where:{workspaceId:s.workspace.id,membershipId:m!.id}})).toBe(2);
},20000);
