import { afterAll, beforeAll, expect, test } from 'bun:test';
import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { Database, PasswordRecovery, RecoveryDelivery, AccountCredentials, AuthFences, Tenancy, denyAll } from '@unblok/database';
import { loadVerificationMail, createLogger, createRedis, loadApiConfig } from '@unblok/backend-runtime';
import { createApp } from '../../apps/api/src/app';
import { RedisRateLimiter } from '../../apps/api/src/security';
import { Sessions, connectSessionStore, sessionSettings } from '../../apps/api/src/modules/sessions';
import { startVerificationDispatcher } from '../../apps/worker/src/jobs/email-verification';
import { Authentication, AuthenticationLimits, Passwords } from '../../apps/api/src/modules/auth';

const root = resolve(import.meta.dir, '../..'), config = loadApiConfig(process.env);
const admin = new Database(config.DATABASE_URL), name = `unblok_be00ic_test_${randomUUID().replaceAll('-', '')}`;
const url = new URL(config.DATABASE_URL); url.pathname = `/${name}`;
const database = new Database(url.toString()), fences = new AuthFences(database), cache = createRedis(config.REDIS_URL);
const ownedPrefix = `be00ic:test:${randomUUID()}:`;
cache.on('error', () => {}); // Expected outage diagnostics must not print SDK details.
const verificationKey = { id: 'test-v1', secret: randomBytes(32).toString('hex') };
const recoveryKey={id:'recovery-v1',secret:randomBytes(32).toString('hex')};
const messageIds = new Set<string>();
const mail = loadVerificationMail({ NODE_ENV: 'test', EMAIL_MAIL_ENDPOINT: 'http://127.0.0.1:8025/api/v1/send', EMAIL_MAIL_FROM: 'verify@unblok.local' });
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
  await admin.connect(); await admin.client.$executeRawUnsafe(`CREATE DATABASE "${name}"`); created = true;
  await prisma(['migrate', 'deploy', '--schema', 'packages/database/prisma/schema.prisma']);
  await database.connect(); await cache.connect();
}, 30000);
afterAll(async () => {
  try { for (const stop of stops.reverse()) await stop(); if (messageIds.size) { const result = await fetch('http://127.0.0.1:8025/api/v1/messages', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ IDs: [...messageIds] }) }); if (!result.ok) throw new Error('Owned mail cleanup failed'); } }
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
async function fixture(options: { afterConfirmation?: () => Promise<void>; redisUrl?: string; key?: typeof verificationKey } = {}) {
  const settings = { ...sessionSettings(config, { SESSION_SECRETS: randomBytes(32).toString('hex'), SESSION_NAMESPACE: 'test' }), prefix: ownedPrefix + randomUUID() + ':' };
  const rateCache = options.redisUrl ? createRedis(options.redisUrl) : cache;
  if (options.redisUrl) { rateCache.on('error', () => {}); await rateCache.connect(); }
  const connection = await connectSessionStore(options.redisUrl ?? config.REDIS_URL, settings);
  const credentials = new AccountCredentials(database), limits = new AuthenticationLimits(rateCache, settings.secrets[0]!, settings.prefix);
  const recovery = new PasswordRecovery(database,recoveryKey);
  const authentication = new Authentication({ create: i => credentials.create(i), lookup: e => credentials.lookup(e), confirm: async snapshot => {
    const valid = await credentials.confirm(snapshot); if (valid) await options.afterConfirmation?.(); return valid;
  } }, await Passwords.create(), limits, recovery);
  const sessions = new Sessions(connection.store, settings, { create: i => fences.create(i), rotate: (e, d, idle) => fences.rotate(e, d, idle), revoke: e => fences.revoke(e), revokeAll: id => fences.revokeAll(id) }, a => authentication.resolveIdentity(a));
  const tenancy = new Tenancy(database, { verify: async () => null }, denyAll, sessions, options.key ?? verificationKey);
  sessions.bind(tenancy); authentication.bind(sessions, tenancy);
  const coarse = new RedisRateLimiter(rateCache, 120, 60000, settings.prefix + 'coarse:');
  let logs = '';
  const logger = createLogger('info', { write: chunk => { logs += chunk; } });
  const server = await createApp(config, { databaseReady: () => database.ready(), queueReady: async () => await rateCache.ping() === 'PONG', close: async () => { await connection.close(); if (options.redisUrl) rateCache.disconnect(); } }, coarse, logger, sessions, authentication);
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
  return { recovery, http, bootstrap, signup, login, key, sid, sessions, tenancy, authentication, credentials, connection, limits, settings, logs: () => logs, close: server.close };
}


async function message(email: string) {
  const rows = await (await fetch('http://127.0.0.1:8025/api/v1/messages?limit=500')).json();
  const matching = rows.messages.filter((m: { To: { Address: string }[] }) => m.To.some(r => r.Address === email));
  for (const item of matching) messageIds.add(item.ID);
  const row = matching[0]; expect(row).toBeDefined();
  const body = await (await fetch(`http://127.0.0.1:8025/api/v1/message/${row.ID}`)).json();
  const token = /[0-9a-f-]{36}\.[A-Za-z0-9_-]{43}/.exec(body.Text)?.[0]; expect(token).toBeDefined(); return token!;
}
function transport(endpoint = mail.endpoint) {
  const dispatcher = startVerificationDispatcher({ once: async () => false }, { ...mail, endpoint }, createLogger('silent'),'recovery');
  return dispatcher;
}
async function prepared(verified=true) {
 const f=await fixture(), {email,client}=await f.signup(), auth=await f.login(email,client);
 const credential=await database.client.passwordCredential.findUniqueOrThrow({where:{email}});
 // Owned test-only stamp models prior BE-00I-B proof; original suite exercises actual verification.
 if(verified) await database.client.passwordCredential.update({where:{identityId:credential.identityId},data:{emailVerifiedAt:new Date()}});
 const anonymous=await f.bootstrap();
 const issue=await f.http('/api/v1/auth/password-recovery/request','POST',anonymous,{email});expect(issue.status).toBe(202);expect(await issue.json()).toEqual({status:'accepted'});
 return {...f,email,auth,anonymous,credential,delivery:new RecoveryDelivery(database,recoveryKey)};
}
const newPassword='A different secure password 2026';
const wrong=()=>randomUUID()+'.'+randomBytes(32).toString('base64url');
async function confirm(f:Awaited<ReturnType<typeof prepared>>,token:string,client=f.anonymous) {
 return f.http('/api/v1/auth/password-recovery/confirm','POST',client,{email:f.email,token,password:newPassword});
}
async function delivered(f: Awaited<ReturnType<typeof prepared>>) {
  const sender = transport(); try { expect(await f.delivery.once(sender.send)).toBe(true); } finally { await sender.close(); }
  return message(f.email);
}


test('additive migration replay and Prisma schema equality',async()=>{
 expect(await prisma(['migrate','deploy','--schema','packages/database/prisma/schema.prisma'])).toContain('No pending');
 expect(await prisma(['migrate','diff','--from-schema-datasource','packages/database/prisma/schema.prisma','--to-schema-datamodel','packages/database/prisma/schema.prisma','--exit-code'])).toContain('No difference');
});
test('anonymous verified recovery consumes proof, changes password, advances epoch and revokes every prior session without login',async()=>{
 const f=await prepared(), second=await f.login(f.email), token=await delivered(f);
 const staleBytes=await cache.get(f.key(f.auth));expect(staleBytes).not.toBeNull();
 const before=await database.client.user.findUniqueOrThrow({where:{id:(await f.credentials.lookup(f.email))!.userId}});
 const raw=await database.client.passwordRecoveryChallenge.findFirstOrThrow({where:{identityId:f.credential.identityId}});
 expect(raw.expiresAt.getTime()-raw.issuedAt.getTime()).toBe(900000);
 expect(JSON.stringify(raw,(_,v)=>typeof v==='bigint'?v.toString():v)).not.toContain(token);
 const response=await confirm(f,token);expect(response.status).toBe(200);expect(await response.json()).toEqual({status:'accepted'});
 expect(response.headers.has('set-cookie')).toBe(false);expect(response.headers.get('cache-control')).toBe('no-store');
 expect((await f.http('/api/v1/auth/me','GET',f.anonymous)).status).toBe(401);
 for(const client of [f.auth,second]) expect((await f.http('/api/v1/auth/me','GET',client)).status).toBe(401);
 await cache.set(f.key(f.auth),staleBytes!);
 expect((await f.http('/api/v1/auth/me','GET',f.auth)).status).toBe(401);
 const after=await database.client.user.findUniqueOrThrow({where:{id:before.id}});expect(after.authEpoch).toBe(before.authEpoch+1n);
 expect(await database.client.authSessionFamily.count({where:{userId:before.id,revokedAt:null}})).toBe(0);
 expect((await database.client.passwordRecoveryChallenge.findUniqueOrThrow({where:{id:raw.id}})).consumedAt).not.toBeNull();
 const login=await f.bootstrap();expect((await f.http('/api/v1/auth/login','POST',login,{email:f.email,password})).status).toBe(401);
 const good=await f.http('/api/v1/auth/login','POST',login,{email:f.email,password:newPassword});expect(good.status).toBe(200);
 expect(await database.client.workspaceMembership.count()).toBe(0);expect(f.logs()).not.toContain(token);
 expect((await confirm(f,token)).status).toBe(200);expect((await database.client.user.findUniqueOrThrow({where:{id:before.id}})).authEpoch).toBe(after.authEpoch);
});
test('unknown, unverified and disabled requests have identical accepted responses and no actionable mail',async()=>{
 const f=await prepared(false), missing=randomUUID()+'@example.test';
 for(const email of [f.email,missing]) {
  const response=await f.http('/api/v1/auth/password-recovery/request','POST',f.anonymous,{email});expect(response.status).toBe(202);expect(await response.json()).toEqual({status:'accepted'});expect(response.headers.has('set-cookie')).toBe(false);
 }
 const credential=await f.credentials.lookup(f.email);await database.client.user.update({where:{id:credential!.userId},data:{authDisabled:true}});
 const response=await f.http('/api/v1/auth/password-recovery/request','POST',f.anonymous,{email:f.email});expect(response.status).toBe(202);expect(await response.json()).toEqual({status:'accepted'});
 expect(await database.client.passwordRecoveryChallenge.count({where:{identityId:f.credential.identityId}})).toBe(0);
 expect(await f.delivery.once(async()=>{throw new Error('No ineligible mail');})).toBe(false);
 const invalid=await f.http('/api/v1/auth/password-recovery/confirm','POST',f.anonymous,{email:missing,token:wrong(),password:newPassword});expect(invalid.status).toBe(200);expect(await invalid.json()).toEqual({status:'accepted'});
});
test('overlapping redemption changes password and epoch exactly once; replay is generic',async()=>{
 const f=await prepared(), token=await delivered(f), before=(await f.credentials.lookup(f.email))!;
 const responses=await Promise.all(Array.from({length:3},()=>confirm(f,token)));
 for(const response of responses){expect(response.status).toBe(200);expect(await response.json()).toEqual({status:'accepted'});expect(response.headers.has('set-cookie')).toBe(false);}
 expect((await f.credentials.lookup(f.email))!.authEpoch).toBe(before.authEpoch+1n);
 expect(await database.client.passwordRecoveryChallenge.count({where:{identityId:f.credential.identityId,consumedAt:{not:null}}})).toBe(1);
 expect((await confirm(f,token)).status).toBe(200);
});
test('ten wrong attempts persist; correct token after exhaustion fails even after API/worker reconstruction',async()=>{
 const f=await prepared(), token=await delivered(f), raw=await database.client.passwordRecoveryChallenge.findFirstOrThrow({where:{identityId:f.credential.identityId}});
 for(let i=1;i<=10;i++){const response=await confirm(f,wrong());expect(response.status).toBe(200);expect(await response.json()).toEqual({status:'accepted'});expect((await database.client.passwordRecoveryChallenge.findUniqueOrThrow({where:{id:raw.id}})).attempts).toBe(i);}
 expect((await confirm(f,token)).status).toBe(429);
 const next=await fixture(), anon=await next.bootstrap();const response=await next.http('/api/v1/auth/password-recovery/confirm','POST',anon,{email:f.email,token,password:newPassword});expect(response.status).toBe(200);
 expect((await database.client.passwordRecoveryChallenge.findUniqueOrThrow({where:{id:raw.id}})).consumedAt).toBeNull();
 expect((await database.client.passwordCredential.findUniqueOrThrow({where:{email:f.email}})).passwordHash).toBe(f.credential.passwordHash);
 expect(await new RecoveryDelivery(database,recoveryKey).once(async()=>{throw new Error('Exhausted');})).toBe(false);
});
test('expired or forged proof and altered immutable SQL evidence never change password',async()=>{
 const f=await prepared(), token=await delivered(f), row=await database.client.passwordRecoveryChallenge.findFirstOrThrow({where:{identityId:f.credential.identityId}});
 await expect(Promise.resolve(database.client.$executeRaw`UPDATE password_recovery_challenges SET expires_at=expires_at+interval '1 second' WHERE id=${row.id}::uuid`)).rejects.toThrow();
 await expect(Promise.resolve(database.client.$executeRaw`UPDATE password_recovery_challenges SET email='other@example.test' WHERE id=${row.id}::uuid`)).rejects.toThrow();
 await database.transaction(async tx=>{await tx.$executeRawUnsafe('ALTER TABLE password_recovery_challenges DISABLE TRIGGER password_recovery_challenge_guard');try{await tx.$executeRaw`UPDATE password_recovery_challenges SET issued_at=statement_timestamp()-interval '16 minutes',expires_at=statement_timestamp()-interval '1 minute' WHERE id=${row.id}::uuid`;}finally{await tx.$executeRawUnsafe('ALTER TABLE password_recovery_challenges ENABLE TRIGGER password_recovery_challenge_guard');}});
 expect((await confirm(f,token)).status).toBe(200);expect((await confirm(f,wrong())).status).toBe(200);
 expect((await database.client.passwordCredential.findUniqueOrThrow({where:{email:f.email}})).passwordHash).toBe(f.credential.passwordHash);
});
test('logout-all before proof redemption and delayed mail invalidate old epoch, allowing a fresh request',async()=>{
 const f=await prepared(), token=await delivered(f);expect((await f.http('/api/v1/auth/logout-all','POST',f.auth)).status).toBe(200);
 expect((await confirm(f,token)).status).toBe(200);expect((await database.client.passwordCredential.findUniqueOrThrow({where:{email:f.email}})).passwordHash).toBe(f.credential.passwordHash);
 expect((await f.http('/api/v1/auth/password-recovery/request','POST',f.anonymous,{email:f.email})).status).toBe(202);
 const next=await delivered(f);expect(next).not.toBe(token);expect((await confirm(f,token)).status).toBe(200);expect((await confirm(f,next)).status).toBe(200);
});
test('proof captured before reset remains valid after API and worker restart only for its unchanged credential epoch',async()=>{
 const f=await prepared(), token=await delivered(f);await f.close();
 const next=await fixture(), anon=await next.bootstrap();expect(await new RecoveryDelivery(database,recoveryKey).once(async()=>{throw new Error('Already delivered');})).toBe(false);
 expect((await next.http('/api/v1/auth/password-recovery/confirm','POST',anon,{email:f.email,token,password:newPassword})).status).toBe(200);
 expect((await database.client.passwordRecoveryChallenge.findFirstOrThrow({where:{identityId:f.credential.identityId}})).consumedAt).not.toBeNull();
});
test('anonymous CSRF and origin policy, strict fields, existing session, no automatic authentication',async()=>{
 const f=await prepared(), token=await delivered(f), path='/api/v1/auth/password-recovery/confirm', body={email:f.email,token,password:newPassword};
 for(const origin of [undefined,'null','https://evil.test']) expect((await f.http(path,'POST',f.anonymous,body,{origin})).status).toBe(403);
 expect((await f.http(path,'POST',f.anonymous,body,{'x-csrf-token':undefined})).status).toBe(403);
 expect((await f.http(path,'POST',f.anonymous,{...body,userId:randomUUID()})).status).toBe(400);
 expect((await f.http(path,'POST',f.anonymous,{...body,password:'short'})).status).toBe(400);
 expect((await confirm(f,token,f.auth)).status).toBe(200);expect((await f.http('/api/v1/auth/me','GET',f.auth)).status).toBe(401);
});
test('separate key domains, key mismatch and disabled identity after delivery fail closed',async()=>{
 const f=await prepared();let sent=false;
 await expect(new RecoveryDelivery(database,{id:recoveryKey.id,secret:randomBytes(32).toString('hex')}).once(async()=>{sent=true;})).rejects.toThrow();expect(sent).toBe(false);
 const row=await database.client.passwordRecoveryOutbox.findFirstOrThrow({where:{challenge:{identityId:f.credential.identityId}}});await database.client.passwordRecoveryOutbox.update({where:{challengeId:row.challengeId},data:{leaseUntil:new Date(0)}});
 const token=await delivered(f);const user=(await f.credentials.lookup(f.email))!;await database.client.user.update({where:{id:user.userId},data:{authDisabled:true}});
 expect((await confirm(f,token)).status).toBe(200);expect((await database.client.passwordCredential.findUniqueOrThrow({where:{email:f.email}})).passwordHash).toBe(f.credential.passwordHash);
});

test('delivery outage, exhaustion and replacement retain binding; late successful old mail cannot restore authority',async()=>{
 const f=await prepared(), old=await database.client.passwordRecoveryChallenge.findFirstOrThrow({where:{identityId:f.credential.identityId}}), failed=transport('http://127.0.0.1:1/api/v1/send');
 try{for(let i=1;i<=4;i++){await database.client.passwordRecoveryOutbox.update({where:{challengeId:old.id},data:{nextAttemptAt:new Date(0)}});expect(await f.delivery.once(failed.send)).toBe(true);expect((await database.client.passwordRecoveryOutbox.findUniqueOrThrow({where:{challengeId:old.id}})).attempts).toBe(i);}}finally{await failed.close();}
 await database.client.passwordRecoveryOutbox.update({where:{challengeId:old.id},data:{nextAttemptAt:new Date(0)}});
 let enter!:()=>void,release!:()=>void;const ready=new Promise<void>(ok=>{enter=ok;}),hold=new Promise<void>(ok=>{release=ok;});const sender=transport();let stale='';
 const pending=f.delivery.once(async(...args)=>{stale=args[1];enter();await hold;await sender.send(...args);});
 try{
  await ready;expect((await f.http('/api/v1/auth/password-recovery/request','POST',f.anonymous,{email:f.email})).status).toBe(202);
  expect(await database.client.passwordRecoveryChallenge.count({where:{identityId:old.identityId}})).toBe(1);
  await database.client.passwordRecoveryOutbox.update({where:{challengeId:old.id},data:{leaseUntil:new Date(0)}});
  const requests=await Promise.all(Array.from({length:3},()=>f.http('/api/v1/auth/password-recovery/request','POST',f.anonymous,{email:f.email})));
  for(const r of requests) expect(r.status).toBe(202);
  expect(await database.client.passwordRecoveryChallenge.count({where:{identityId:old.identityId}})).toBe(2);
  expect((await database.client.passwordRecoveryChallenge.findUniqueOrThrow({where:{id:old.id}})).canceledAt).not.toBeNull();
  expect((await f.http('/api/v1/auth/password-recovery/request','POST',f.anonymous,{email:f.email})).status).toBe(429);
  release();expect(await pending).toBe(true);await message(f.email);
  expect((await confirm(f,stale)).status).toBe(200);expect((await database.client.passwordCredential.findUniqueOrThrow({where:{email:f.email}})).passwordHash).toBe(f.credential.passwordHash);
  expect(await new RecoveryDelivery(database,recoveryKey).once(sender.send)).toBe(true);const token=await message(f.email);expect(token).not.toBe(stale);expect((await confirm(f,token)).status).toBe(200);
 }finally{release();await pending;await sender.close();}
});
test('lost delivery acknowledgement and worker lease recovery retry identical proof, stale acknowledgement cannot override successor',async()=>{
 const f=await prepared(), sender=transport();let enter!:()=>void,release!:()=>void;const ready=new Promise<void>(ok=>{enter=ok;}),hold=new Promise<void>(ok=>{release=ok;});let original='';
 const pending=f.delivery.once(async(...args)=>{original=args[1];enter();await hold;await sender.send(...args);throw new Error('Lost acknowledgement');});
 try{
  await ready;expect(await new RecoveryDelivery(database,recoveryKey).once(sender.send)).toBe(false);
  const row=await database.client.passwordRecoveryOutbox.findFirstOrThrow({where:{challenge:{identityId:f.credential.identityId}}});
  await database.client.passwordRecoveryOutbox.update({where:{challengeId:row.challengeId},data:{leaseUntil:new Date(0)}});
  expect(await new RecoveryDelivery(database,recoveryKey).once(sender.send)).toBe(true);const done=await database.client.passwordRecoveryOutbox.findUniqueOrThrow({where:{challengeId:row.challengeId}});
  release();await pending;expect(await database.client.passwordRecoveryOutbox.findUniqueOrThrow({where:{challengeId:row.challengeId}})).toEqual(done);
  expect(await message(f.email)).toBe(original);expect((await confirm(f,original)).status).toBe(200);
 }finally{release();await pending;await sender.close();}
});
test('primary and Valkey dependency outages fail closed; recovery cannot mutate password through an unknown primary outcome',async()=>{
 const f=await prepared(), token=await delivered(f);
 await database.close();await admin.client.$executeRawUnsafe(`ALTER DATABASE "${name}" ALLOW_CONNECTIONS false`);await admin.client.$executeRaw`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname=${name} AND pid<>pg_backend_pid()`;
 try{expect((await confirm(f,token)).status).toBe(503);expect((await f.http('/api/v1/auth/password-recovery/request','POST',f.anonymous,{email:f.email})).status).toBe(503);await expect(f.delivery.once(async()=>{throw new Error('No mail without primary');})).rejects.toThrow();}
 finally{await admin.client.$executeRawUnsafe(`ALTER DATABASE "${name}" ALLOW_CONNECTIONS true`);await database.connect();}
 await f.connection.close();expect((await confirm(f,token)).status).toBe(503);expect((await database.client.passwordCredential.findUniqueOrThrow({where:{email:f.email}})).passwordHash).toBe(f.credential.passwordHash);
},15000);
test('logout-all between new hash admission and final transaction rejects the captured old proof',async()=>{
 const f=await prepared(), token=await delivered(f), original=f.recovery.confirm.bind(f.recovery);
 let enter!:()=>void,release!:()=>void;const ready=new Promise<void>(ok=>{enter=ok;}),hold=new Promise<void>(ok=>{release=ok;});
 f.recovery.confirm=async(...args)=>{enter();await hold;return original(...args);};const pending=confirm(f,token);
 try{await ready;expect((await f.http('/api/v1/auth/logout-all','POST',f.auth)).status).toBe(200);}finally{release();}
 expect((await pending).status).toBe(200);expect((await database.client.passwordCredential.findUniqueOrThrow({where:{email:f.email}})).passwordHash).toBe(f.credential.passwordHash);
});
test('unknown and known account/IP request budgets have the same fixed limits, including concurrent Valkey operations',async()=>{
 const f=await fixture(), anon=await f.bootstrap(), email=randomUUID()+'@example.test';
 for(let i=0;i<5;i++){const response=await f.http('/api/v1/auth/password-recovery/request','POST',anon,{email});expect(response.status).toBe(202);expect(await response.json()).toEqual({status:'accepted'});}
 expect((await f.http('/api/v1/auth/password-recovery/request','POST',anon,{email})).status).toBe(429);
 const ip=randomUUID();const budgets=await Promise.all(Array.from({length:14},()=>f.limits.consume('recovery-request',ip,randomUUID()+'@example.test')));expect(budgets.filter(x=>x.allowed)).toHaveLength(10);
});

test('anonymous request uniform timing floor applies to both eligible and absent credential paths',async()=>{
 const f=await prepared(), missing=randomUUID()+'@example.test';
 for(const email of [f.email,missing]) {
  const started=performance.now();const response=await f.http('/api/v1/auth/password-recovery/request','POST',f.anonymous,{email});
  expect(response.status).toBe(202);expect(await response.json()).toEqual({status:'accepted'});expect(performance.now()-started).toBeGreaterThanOrEqual(145);
 }
 await database.client.passwordRecoveryChallenge.updateMany({where:{identityId:f.credential.identityId,consumedAt:null,canceledAt:null},data:{canceledAt:new Date()}});
});

test('verification-domain MAC cannot redeem recovery even with identical metadata and key; other email cannot consume proof',async()=>{
 const f=await prepared(), token=await delivered(f), row=await database.client.passwordRecoveryChallenge.findFirstOrThrow({where:{identityId:f.credential.identityId}});
 const otherDomain=row.id+'.'+createHmac('sha256',recoveryKey.secret).update(`email-proof:v1:${recoveryKey.id}:${row.id}:${row.identityId}:${row.email}:${row.authEpoch}`).digest('base64url');
 expect((await confirm(f,otherDomain)).status).toBe(200);
 expect((await database.client.passwordRecoveryChallenge.findUniqueOrThrow({where:{id:row.id}})).attempts).toBe(1);
 expect((await database.client.passwordCredential.findUniqueOrThrow({where:{email:f.email}})).passwordHash).toBe(f.credential.passwordHash);
 const other=await fixture(), anon=await other.bootstrap();expect((await other.http('/api/v1/auth/password-recovery/confirm','POST',anon,{email:randomUUID()+'@example.test',token,password:newPassword})).status).toBe(200);
 expect((await database.client.passwordRecoveryChallenge.findUniqueOrThrow({where:{id:row.id}})).attempts).toBe(1);
 expect((await confirm(f,token)).status).toBe(200);
});

test('an already-minted session principal loses authority when password reset commits before its protected read',async()=>{
 const f=await prepared(), token=await delivered(f), original=f.tenancy.currentUser.bind(f.tenancy);
 let enter!:()=>void,release!:()=>void;const ready=new Promise<void>(ok=>{enter=ok;}),hold=new Promise<void>(ok=>{release=ok;});
 f.tenancy.currentUser=async(...args)=>{enter();await hold;return original(...args);};
 const pending=f.http('/api/v1/auth/me','GET',f.auth);
 try{await ready;expect((await confirm(f,token)).status).toBe(200);}finally{release();}
 expect((await pending).status).toBe(401);
});
