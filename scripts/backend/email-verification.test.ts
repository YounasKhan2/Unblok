import { afterAll, beforeAll, expect, test } from 'bun:test';
import { randomBytes, randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { Database, VerificationDelivery, AccountCredentials, AuthFences, Tenancy, denyAll } from '@unblok/database';
import { loadVerificationMail, createLogger, createRedis, loadApiConfig } from '@unblok/backend-runtime';
import { createApp } from '../../apps/api/src/app';
import { RedisRateLimiter } from '../../apps/api/src/security';
import { Sessions, connectSessionStore, sessionSettings } from '../../apps/api/src/modules/sessions';
import { startVerificationDispatcher } from '../../apps/worker/src/jobs/email-verification';
import { Authentication, AuthenticationLimits, Passwords } from '../../apps/api/src/modules/auth';

const root = resolve(import.meta.dir, '../..'), config = loadApiConfig(process.env);
const admin = new Database(config.DATABASE_URL), name = `unblok_be00ib_test_${randomUUID().replaceAll('-', '')}`;
const url = new URL(config.DATABASE_URL); url.pathname = `/${name}`;
const database = new Database(url.toString()), fences = new AuthFences(database), cache = createRedis(config.REDIS_URL);
const ownedPrefix = `be00ib:test:${randomUUID()}:`;
cache.on('error', () => {}); // Expected outage diagnostics must not print SDK details.
const verificationKey = { id: 'test-v1', secret: randomBytes(32).toString('hex') };
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
  const authentication = new Authentication({ create: i => credentials.create(i), lookup: e => credentials.lookup(e), confirm: async snapshot => {
    const valid = await credentials.confirm(snapshot); if (valid) await options.afterConfirmation?.(); return valid;
  } }, await Passwords.create(), limits);
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
  return { http, bootstrap, signup, login, key, sid, sessions, tenancy, authentication, credentials, connection, limits, settings, logs: () => logs, close: server.close };
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
  const dispatcher = startVerificationDispatcher({ once: async () => false }, { ...mail, endpoint }, createLogger('silent'));
  return dispatcher;
}
async function prepared() {
  const f = await fixture(), { email, client } = await f.signup(), auth = await f.login(email, client);
  const issue = await f.http('/api/v1/auth/email-verification/request', 'POST', auth); expect(issue.status).toBe(202); expect(await issue.json()).toEqual({ status: 'accepted' });
  const credential = await database.client.passwordCredential.findUniqueOrThrow({ where: { email } });
  return { ...f, email, auth, credential, delivery: new VerificationDelivery(database, verificationKey) };
}
async function delivered(f: Awaited<ReturnType<typeof prepared>>) {
  const sender = transport(); try { expect(await f.delivery.once(sender.send)).toBe(true); } finally { await sender.close(); }
  return message(f.email);
}

test('fresh migration replay/schema equality and real committed outbox delivery; valid one-use proof stamps only own email', async () => {
  expect(await prisma(['migrate','deploy','--schema','packages/database/prisma/schema.prisma'])).toContain('No pending');
  expect(await prisma(['migrate','diff','--from-schema-datasource','packages/database/prisma/schema.prisma','--to-schema-datamodel','packages/database/prisma/schema.prisma','--exit-code'])).toContain('No difference');
  const f = await prepared();
  expect((await f.http('/api/v1/auth/email-verification/status','GET',f.auth)).status).toBe(200);
  const raw = await database.client.emailVerificationChallenge.findFirstOrThrow({ where: { identityId: f.credential.identityId } });
  const token = await delivered(f);
  expect(JSON.stringify(raw, (_, value) => typeof value === 'bigint' ? value.toString() : value)).not.toContain(token); expect(raw.tokenDigest).toMatch(/^[0-9a-f]{64}$/);
  const outbox = await database.client.emailVerificationOutbox.findUniqueOrThrow({ where:{ challengeId:raw.id } });
  expect(JSON.stringify(outbox)).not.toContain(token);
  expect(raw.expiresAt.getTime() - raw.issuedAt.getTime()).toBe(900000);
  const confirm = await f.http('/api/v1/auth/email-verification/confirm','POST',f.auth,{ token });
  expect(confirm.status).toBe(200); expect(await confirm.json()).toEqual({ status:'accepted' });
  const status = await f.http('/api/v1/auth/email-verification/status','GET',f.auth); expect(await status.json()).toEqual({ emailVerified:true }); expect(status.headers.get('cache-control')).toBe('no-store');
  expect((await (await f.http('/api/v1/auth/me','GET',f.auth)).json()).user.emailVerified).toBe(true);
  expect(await database.client.workspaceMembership.count()).toBe(0);
  expect(f.logs()).not.toContain(token); expect(f.logs()).toContain('request_complete');
  const verified = await database.client.passwordCredential.findUniqueOrThrow({ where:{ email:f.email } });
  const consumed = await database.client.emailVerificationChallenge.findUniqueOrThrow({ where:{ id:raw.id } }); expect(consumed.consumedAt).toEqual(verified.emailVerifiedAt);
  expect((await f.http('/api/v1/auth/email-verification/confirm','POST',f.auth,{token})).status).toBe(200);
  expect((await database.client.emailVerificationChallenge.findUniqueOrThrow({where:{id:raw.id}}))).toEqual(consumed);
  expect((await f.http('/api/v1/auth/email-verification/request','POST',f.auth)).status).toBe(202);
  expect(await database.client.emailVerificationChallenge.count({where:{identityId:raw.identityId}})).toBe(1);
});

test('concurrent issuance produces one committed outbox; concurrent redemption/replay cannot apply proof twice', async () => {
  const f = await prepared();
  const requests = await Promise.all(Array.from({length:3},()=>f.http('/api/v1/auth/email-verification/request','POST',f.auth)));
  expect(requests.every(r=>[202,503].includes(r.status))).toBe(true);
  expect(await database.client.emailVerificationChallenge.count({where:{identityId:f.credential.identityId}})).toBe(1);
  const token = await delivered(f);
  const responses = await Promise.all(Array.from({length:3},()=>f.http('/api/v1/auth/email-verification/confirm','POST',f.auth,{token})));
  expect(responses.some(r=>r.status===200)).toBe(true); expect(responses.every(r=>[200,503].includes(r.status))).toBe(true);
  expect(await database.client.emailVerificationChallenge.count({where:{identityId:f.credential.identityId,consumedAt:{not:null}}})).toBe(1);
  expect((await (await f.http('/api/v1/auth/email-verification/status','GET',f.auth)).json()).emailVerified).toBe(true);
});

test('mail transport outage leaves durable retry; unknown acknowledgement may duplicate identical email but cannot duplicate authority', async () => {
  const f = await prepared(), failed = transport('http://127.0.0.1:1/api/v1/send');
  try { expect(await f.delivery.once(failed.send)).toBe(true); } finally { await failed.close(); }
  let row = await database.client.emailVerificationOutbox.findFirstOrThrow({where:{challenge:{identityId:f.credential.identityId}}});
  expect(row.deliveredAt).toBeNull(); expect(row.attempts).toBe(1); expect(row.leaseId).toBeNull(); expect(row.nextAttemptAt.getTime()).toBeGreaterThan(Date.now());
  expect(await f.delivery.once(async()=>{throw new Error('Must not send before backoff');})).toBe(false);
  // Fixture makes scheduling due without changing production30s retry/lease.
  await database.client.emailVerificationOutbox.update({where:{challengeId:row.challengeId},data:{nextAttemptAt:new Date(0)}});
  const sender=transport(); try { await f.delivery.once(async (...args)=>{await sender.send(...args);throw new Error('Acknowledgement lost after real delivery');}); } finally {await sender.close();}
  const first=await message(f.email); row=await database.client.emailVerificationOutbox.findUniqueOrThrow({where:{challengeId:row.challengeId}}); expect(row.deliveredAt).toBeNull(); expect(row.attempts).toBe(2);
  await database.client.emailVerificationOutbox.update({where:{challengeId:row.challengeId},data:{nextAttemptAt:new Date(0)}});
  const second=await delivered(f); expect(second).toBe(first);
  expect((await f.http('/api/v1/auth/email-verification/confirm','POST',f.auth,{token:second})).status).toBe(200);
});

test('forged proof attempts are generic and durable-capped; another account cannot consume exact credential-bound token', async () => {
  const f=await prepared(), token=await delivered(f), other=await fixture(), {email}=await other.signup(), auth=await other.login(email);
  expect((await other.http('/api/v1/auth/email-verification/confirm','POST',auth,{token})).status).toBe(200);
  expect((await (await other.http('/api/v1/auth/email-verification/status','GET',auth)).json()).emailVerified).toBe(false);
  for(let i=0;i<10;i++) expect((await f.http('/api/v1/auth/email-verification/confirm','POST',f.auth,{token:`${randomUUID()}.${randomBytes(32).toString('base64url')}`})).status).toBe(200);
  expect((await f.http('/api/v1/auth/email-verification/confirm','POST',f.auth,{token})).status).toBe(429);
  const next=await fixture(), fresh=await next.login(f.email);
  expect((await next.http('/api/v1/auth/email-verification/confirm','POST',fresh,{token})).status).toBe(200);
  expect((await (await next.http('/api/v1/auth/email-verification/status','GET',fresh)).json()).emailVerified).toBe(false);
  expect((await database.client.emailVerificationChallenge.findFirstOrThrow({where:{identityId:f.credential.identityId}})).attempts).toBe(10);
});

test('delayed epoch-stale or disabled messages cannot verify; new independently authenticated epoch can request a new proof', async()=>{
  const f=await prepared(), old=await delivered(f);
  expect((await f.http('/api/v1/auth/logout-all','POST',f.auth)).status).toBe(200);
  const next=await f.login(f.email);
  expect((await f.http('/api/v1/auth/email-verification/confirm','POST',next,{token:old})).status).toBe(200);
  expect((await (await f.http('/api/v1/auth/email-verification/status','GET',next)).json()).emailVerified).toBe(false);
  expect((await f.http('/api/v1/auth/email-verification/request','POST',next)).status).toBe(202);
  await database.client.user.update({where:{id:(await f.credentials.lookup(f.email))!.userId},data:{authDisabled:true}});
  expect((await f.http('/api/v1/auth/email-verification/confirm','POST',next,{token:old})).status).toBe(401);
  expect(await f.delivery.once(async()=>{throw new Error('Disabled must not send');})).toBe(false);
});

test('expired proof and SQL tampering cannot verify or be dispatched',async()=>{
  const f=await prepared(), token=await delivered(f);
  const row=await database.client.emailVerificationChallenge.findFirstOrThrow({where:{identityId:f.credential.identityId}});
  await expect(Promise.resolve(database.client.$executeRaw`UPDATE email_verification_challenges SET expires_at=expires_at+interval '1 second' WHERE id=${row.id}::uuid`)).rejects.toThrow();
  // Owned database administrative time fixture; production trigger unchanged.
  await database.transaction(async tx=>{await tx.$executeRawUnsafe('ALTER TABLE email_verification_challenges DISABLE TRIGGER email_verification_challenge_guard');try{
    await tx.$executeRaw`UPDATE email_verification_challenges SET issued_at=statement_timestamp()-interval '16 minutes', expires_at=statement_timestamp()-interval '1 minute' WHERE id=${row.id}::uuid`;
  }finally{await tx.$executeRawUnsafe('ALTER TABLE email_verification_challenges ENABLE TRIGGER email_verification_challenge_guard');}});
  expect((await f.http('/api/v1/auth/email-verification/confirm','POST',f.auth,{token})).status).toBe(200);
  expect((await (await f.http('/api/v1/auth/email-verification/status','GET',f.auth)).json()).emailVerified).toBe(false);
  expect(await f.delivery.once(async()=>{throw new Error('Expired must not send');})).toBe(false);
});

test('strict body/CSRF/origin and live session boundary protect verification; no client ownership/grants or token return',async()=>{
  const f=await prepared(), token=await delivered(f);
  for(const path of ['request','confirm']){
    const body=path==='confirm'?{token}:{};
    expect((await f.http(`/api/v1/auth/email-verification/${path}`,'POST',f.auth,body,{origin:'null'})).status).toBe(403);
    expect((await f.http(`/api/v1/auth/email-verification/${path}`,'POST',f.auth,body,{'x-csrf-token':undefined})).status).toBe(403);
    expect((await f.http(`/api/v1/auth/email-verification/${path}`,'POST',f.auth,{...body,userId:randomUUID()})).status).toBe(400);
    expect((await f.http(`/api/v1/auth/email-verification/${path}`,'POST',await f.bootstrap(),body)).status).toBe(401);
  }
  expect((await f.http('/api/v1/auth/email-verification/status','GET',await f.bootstrap())).status).toBe(401);
  await cache.del(f.key(f.auth));expect((await f.http('/api/v1/auth/email-verification/confirm','POST',f.auth,{token})).status).toBe(401);
  expect((await database.client.passwordCredential.findUniqueOrThrow({where:{email:f.email}})).emailVerifiedAt).toBeNull();
});

test('real PostgreSQL and Valkey outages fail closed before verification writes or mail work',async()=>{
  const f=await prepared(), token=await delivered(f);
  await database.close(); await admin.client.$executeRawUnsafe(`ALTER DATABASE "${name}" ALLOW_CONNECTIONS false`); await admin.client.$executeRaw`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname=${name} AND pid<>pg_backend_pid()`;
  try{
    expect((await f.http('/api/v1/auth/email-verification/confirm','POST',f.auth,{token})).status).toBe(503);
    expect((await f.http('/api/v1/auth/email-verification/status','GET',f.auth)).status).toBe(503);
    await expect(f.delivery.once(async()=>{throw new Error('Must not send without database');})).rejects.toThrow();
  }finally{await admin.client.$executeRawUnsafe(`ALTER DATABASE "${name}" ALLOW_CONNECTIONS true`);await database.connect();}
  await f.connection.close();expect((await f.http('/api/v1/auth/email-verification/confirm','POST',f.auth,{token})).status).toBe(503);
  expect((await database.client.passwordCredential.findUniqueOrThrow({where:{email:f.email}})).emailVerifiedAt).toBeNull();
},15000);


test('leased outbox survives worker crash and stale acknowledgements cannot overwrite a newer lease completion',async()=>{
  const f=await prepared(), sender=transport(); let ready!:()=>void, release!:()=>void;
  const entered=new Promise<void>(ok=>{ready=ok;}), hold=new Promise<void>(ok=>{release=ok;});
  let originalToken=''; const first=f.delivery.once(async(...args)=>{originalToken=args[1];ready();await hold;await sender.send(...args);});
  try{
    await entered; expect(await new VerificationDelivery(database,verificationKey).once(async()=>{throw new Error('Cannot claim active lease');})).toBe(false);
    const row=await database.client.emailVerificationOutbox.findFirstOrThrow({where:{challenge:{identityId:f.credential.identityId}}}); expect(row.leaseId).not.toBeNull();
    // Owned fixture simulates elapsed30s lease after worker loss, not a production timeout change.
    await database.client.emailVerificationOutbox.update({where:{challengeId:row.challengeId},data:{leaseUntil:new Date(0)}});
    expect(await new VerificationDelivery(database,verificationKey).once(sender.send)).toBe(true);
    const acknowledged=await database.client.emailVerificationOutbox.findUniqueOrThrow({where:{challengeId:row.challengeId}});
    expect(acknowledged.attempts).toBe(2); expect(acknowledged.deliveredAt).not.toBeNull();
    release();expect(await first).toBe(true);
    expect(await database.client.emailVerificationOutbox.findUniqueOrThrow({where:{challengeId:row.challengeId}})).toEqual(acknowledged);
    const token=await message(f.email);expect(token).toBe(originalToken);
    expect((await f.http('/api/v1/auth/email-verification/confirm','POST',f.auth,{token})).status).toBe(200);
  }finally{release();await first;await sender.close();}
});

test('request account/IP quotas and key rotation are fail-closed; no prior-key or canceled message can stamp ownership',async()=>{
  const f=await prepared(), token=await delivered(f);
  for(let i=1;i<5;i++) expect((await f.http('/api/v1/auth/email-verification/request','POST',f.auth)).status).toBe(202);
  expect((await f.http('/api/v1/auth/email-verification/request','POST',f.auth)).status).toBe(429);
  const row=await database.client.emailVerificationChallenge.findFirstOrThrow({where:{identityId:f.credential.identityId}});
  await expect(Promise.resolve(database.client.emailVerificationChallenge.update({where:{id:row.id},data:{tokenDigest:'f'.repeat(64)}}))).rejects.toThrow();
  await database.client.emailVerificationChallenge.update({where:{id:row.id},data:{canceledAt:new Date()}});
  expect((await f.http('/api/v1/auth/email-verification/confirm','POST',f.auth,{token})).status).toBe(200);
  expect((await (await f.http('/api/v1/auth/email-verification/status','GET',f.auth)).json()).emailVerified).toBe(false);
  const pending = await prepared(), rotatedKey = {id:'rotated-v2',secret:randomBytes(32).toString('hex')};
  expect(await new VerificationDelivery(database,rotatedKey).once(async()=>{throw new Error('Old key must not dispatch');})).toBe(false);
  const oldProof = await delivered(pending), rotated = await fixture({key:rotatedKey}), auth = await rotated.login(pending.email);
  expect((await rotated.http('/api/v1/auth/email-verification/confirm','POST',auth,{token:oldProof})).status).toBe(200);
  expect((await (await rotated.http('/api/v1/auth/email-verification/status','GET',auth)).json()).emailVerified).toBe(false);
  const ip = `verification-${randomUUID()}`;
  const budgets = await Promise.all(Array.from({length:14},()=>f.limits.consume('email-request',ip,randomUUID())));
  expect(budgets.filter(r=>r.allowed)).toHaveLength(10);
});


test('confirmation cannot reuse a minted principal after concurrent logout-all commits',async()=>{
  const f=await prepared(), token=await delivered(f), original=f.tenancy.emailVerification.bind(f.tenancy);
  let entered!:()=>void, release!:()=>void;const ready=new Promise<void>(ok=>{entered=ok;}), hold=new Promise<void>(ok=>{release=ok;});
  f.tenancy.emailVerification=async(...args)=>{entered();await hold;return original(...args);};
  const pending=f.http('/api/v1/auth/email-verification/confirm','POST',f.auth,{token});
  try{await ready;expect((await f.http('/api/v1/auth/logout-all','POST',f.auth)).status).toBe(200);}finally{release();}
  expect((await pending).status).toBe(401);
  expect((await database.client.passwordCredential.findUniqueOrThrow({where:{email:f.email}})).emailVerifiedAt).toBeNull();
  expect((await database.client.emailVerificationChallenge.findFirstOrThrow({where:{identityId:f.credential.identityId}})).consumedAt).toBeNull();
});


test('misconfigured same-version worker key cannot send an inconsistent proof',async()=>{
  await prepared();let sent=false;
  await expect(new VerificationDelivery(database,{id:verificationKey.id,secret:randomBytes(32).toString('hex')}).once(async()=>{sent=true;})).rejects.toThrow('Authentication dependency unavailable');
  expect(sent).toBe(false);
});

test('wrong HTTP proofs commit ten sequential attempts and remain exhausted after worker and API restart', async()=>{
  const f=await prepared(), token=await delivered(f);
  const row=await database.client.emailVerificationChallenge.findFirstOrThrow({where:{identityId:f.credential.identityId}});
  for(let i=1;i<=10;i++){
    const response=await f.http('/api/v1/auth/email-verification/confirm','POST',f.auth,{token:`${randomUUID()}.${randomBytes(32).toString('base64url')}`});
    expect(response.status).toBe(200);expect(await response.json()).toEqual({status:'accepted'});
    expect((await database.client.emailVerificationChallenge.findUniqueOrThrow({where:{id:row.id}})).attempts).toBe(i);
  }
  expect((await f.http('/api/v1/auth/email-verification/confirm','POST',f.auth,{token})).status).toBe(429);
  await f.close();
  expect(await new VerificationDelivery(database,verificationKey).once(async()=>{throw new Error('Exhausted proof must not dispatch');})).toBe(false);
  const restarted=await fixture(), auth=await restarted.login(f.email);
  for(let i=0;i<2;i++){
    const response=await restarted.http('/api/v1/auth/email-verification/confirm','POST',auth,{token});
    expect(response.status).toBe(200);expect(await response.json()).toEqual({status:'accepted'});
  }
  const exhausted=await database.client.emailVerificationChallenge.findUniqueOrThrow({where:{id:row.id}});
  expect(exhausted.attempts).toBe(10);expect(exhausted.consumedAt).toBeNull();
  expect((await database.client.passwordCredential.findUniqueOrThrow({where:{email:f.email}})).emailVerifiedAt).toBeNull();
});

test('overlapping wrong HTTP attempts persist exactly the committed accepted attempts, then exhaust durably', async()=>{
  const f=await prepared(), token=await delivered(f);
  const row=await database.client.emailVerificationChallenge.findFirstOrThrow({where:{identityId:f.credential.identityId}});
  const responses=await Promise.all(Array.from({length:10},()=>f.http('/api/v1/auth/email-verification/confirm','POST',f.auth,{token:`${randomUUID()}.${randomBytes(32).toString('base64url')}`})));
  expect(responses.every(r=>[200,503].includes(r.status))).toBe(true);
  const committed=responses.filter(r=>r.status===200).length;expect(committed).toBeGreaterThan(0);
  for(const response of responses.filter(r=>r.status===200)) expect(await response.json()).toEqual({status:'accepted'});
  expect((await database.client.emailVerificationChallenge.findUniqueOrThrow({where:{id:row.id}})).attempts).toBe(committed);
  // Fresh isolated limiter models cache namespace loss; PostgreSQL evidence survives.
  const next=await fixture(), auth=await next.login(f.email);
  for(let i=committed;i<10;i++) expect((await next.http('/api/v1/auth/email-verification/confirm','POST',auth,{token:`${randomUUID()}.${randomBytes(32).toString('base64url')}`})).status).toBe(200);
  const correct=await next.http('/api/v1/auth/email-verification/confirm','POST',auth,{token});
  expect(correct.status).toBe(200);expect(await correct.json()).toEqual({status:'accepted'});
  expect((await database.client.emailVerificationChallenge.findUniqueOrThrow({where:{id:row.id}})).attempts).toBe(10);
  expect((await database.client.passwordCredential.findUniqueOrThrow({where:{email:f.email}})).emailVerifiedAt).toBeNull();
});

test('five failed delivery claims recover transactionally; final live lease and late acknowledgement cannot revive old proof', async()=>{
  const f=await prepared(), failed=transport('http://127.0.0.1:1/api/v1/send');
  const old=await database.client.emailVerificationChallenge.findFirstOrThrow({where:{identityId:f.credential.identityId}});
  try{
    for(let i=1;i<=4;i++){
      await database.client.emailVerificationOutbox.update({where:{challengeId:old.id},data:{nextAttemptAt:new Date(0)}});
      expect(await f.delivery.once(failed.send)).toBe(true);
      const outbox=await database.client.emailVerificationOutbox.findUniqueOrThrow({where:{challengeId:old.id}});
      expect(outbox.attempts).toBe(i);expect(outbox.deliveredAt).toBeNull();
    }
  }finally{await failed.close();}
  await database.client.emailVerificationOutbox.update({where:{challengeId:old.id},data:{nextAttemptAt:new Date(0)}});
  let entered!:()=>void, release!:()=>void;const ready=new Promise<void>(ok=>{entered=ok;}), hold=new Promise<void>(ok=>{release=ok;});
  let staleToken=''; const sender=transport();
  const pending=f.delivery.once(async(...args)=>{staleToken=args[1];entered();await hold;await sender.send(...args);});
  try{
    await ready;
    expect((await f.http('/api/v1/auth/email-verification/request','POST',f.auth)).status).toBe(202);
    expect(await database.client.emailVerificationChallenge.count({where:{identityId:old.identityId}})).toBe(1);
    // Owned scheduling fixture models expiry of the unchanged production30s lease.
    await database.client.emailVerificationOutbox.update({where:{challengeId:old.id},data:{leaseUntil:new Date(0)}});
    const responses=await Promise.all(Array.from({length:3},()=>f.http('/api/v1/auth/email-verification/request','POST',f.auth)));
    expect(responses.some(r=>r.status===202)).toBe(true);expect(responses.every(r=>[202,503].includes(r.status))).toBe(true);
    const rows=await database.client.emailVerificationChallenge.findMany({where:{identityId:old.identityId}});
    expect(rows).toHaveLength(2);expect(rows.find(r=>r.id===old.id)!.canceledAt).not.toBeNull();
    const replacement=rows.find(r=>r.id!==old.id)!;
    expect(replacement.email).toBe(old.email);expect(replacement.authEpoch).toBe(old.authEpoch);
    expect(replacement.expiresAt.getTime()-replacement.issuedAt.getTime()).toBe(900000);
    expect((await f.http('/api/v1/auth/email-verification/request','POST',f.auth)).status).toBe(429);
    release();expect(await pending).toBe(true);
    expect((await database.client.emailVerificationOutbox.findUniqueOrThrow({where:{challengeId:old.id}})).deliveredAt).not.toBeNull();
    await message(f.email);
    expect((await f.http('/api/v1/auth/email-verification/confirm','POST',f.auth,{token:staleToken})).status).toBe(200);
    expect((await database.client.passwordCredential.findUniqueOrThrow({where:{email:f.email}})).emailVerifiedAt).toBeNull();
    expect(await new VerificationDelivery(database,verificationKey).once(sender.send)).toBe(true);
    const token=await message(f.email);expect(token).not.toBe(staleToken);
    expect((await f.http('/api/v1/auth/email-verification/confirm','POST',f.auth,{token})).status).toBe(200);
    expect((await database.client.passwordCredential.findUniqueOrThrow({where:{email:f.email}})).emailVerifiedAt).not.toBeNull();
    expect((await database.client.emailVerificationChallenge.findUniqueOrThrow({where:{id:old.id}})).consumedAt).toBeNull();
    expect(await database.client.workspaceMembership.count()).toBe(0);
  }finally{release();await pending;await sender.close();}
});

test('acknowledged five transport failures permit a bounded replacement without waiting for proof expiry', async()=>{
  const f=await prepared(), failed=transport('http://127.0.0.1:1/api/v1/send');
  const old=await database.client.emailVerificationChallenge.findFirstOrThrow({where:{identityId:f.credential.identityId}});
  try{for(let i=0;i<5;i++){
    await database.client.emailVerificationOutbox.update({where:{challengeId:old.id},data:{nextAttemptAt:new Date(0)}});
    expect(await f.delivery.once(failed.send)).toBe(true);
  }}finally{await failed.close();}
  const outbox=await database.client.emailVerificationOutbox.findUniqueOrThrow({where:{challengeId:old.id}});
  expect(outbox.attempts).toBe(5);expect(outbox.leaseId).toBeNull();expect(outbox.deliveredAt).toBeNull();
  expect(await f.delivery.once(async()=>{throw new Error('Exhausted cannot dispatch');})).toBe(false);
  expect((await f.http('/api/v1/auth/email-verification/request','POST',f.auth)).status).toBe(202);
  const rows=await database.client.emailVerificationChallenge.findMany({where:{identityId:old.identityId}});
  expect(rows).toHaveLength(2);expect(rows.find(r=>r.id===old.id)!.canceledAt).not.toBeNull();
  const token=await delivered(f);
  expect((await f.http('/api/v1/auth/email-verification/confirm','POST',f.auth,{token})).status).toBe(200);
  expect((await database.client.passwordCredential.findUniqueOrThrow({where:{email:f.email}})).emailVerifiedAt).not.toBeNull();
});
