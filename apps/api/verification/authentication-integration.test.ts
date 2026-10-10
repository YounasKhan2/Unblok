import 'reflect-metadata';
import { afterAll, beforeAll, expect, test } from 'bun:test';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { Database, AccountCredentials, AuthFences, AuthDeniedError, Tenancy, TenantAccessError, denyAll, type VerifiedPrincipal } from '@unblok/database';
import { createLogger, createRedis, loadApiConfig } from '@unblok/backend-runtime';
import { createApp } from '../src/app';
import { RedisRateLimiter } from '../src/security';
import { Sessions, connectSessionStore, sessionSettings } from '../src/modules/sessions';
import { Authentication, AuthenticationLimits, Passwords } from '../src/modules/auth';

const root = resolve(import.meta.dir, '../../..'), config = loadApiConfig(process.env);
const admin = new Database(config.DATABASE_URL), name = `unblok_be00i_test_${randomUUID().replaceAll('-', '')}`;
const url = new URL(config.DATABASE_URL); url.pathname = `/${name}`;
const database = new Database(url.toString()), fences = new AuthFences(database), cache = createRedis(config.REDIS_URL);
const ownedPrefix = `be00i:test:${randomUUID()}:`;
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
async function fixture(options: { afterConfirmation?: () => Promise<void>; redisUrl?: string } = {}) {
  const settings = { ...sessionSettings(config, { SESSION_SECRETS: randomBytes(32).toString('hex'), SESSION_NAMESPACE: 'test' }), prefix: ownedPrefix + randomUUID() + ':' };
  const rateCache = options.redisUrl ? createRedis(options.redisUrl) : cache;
  if (options.redisUrl) { rateCache.on('error', () => {}); await rateCache.connect(); }
  const connection = await connectSessionStore(options.redisUrl ?? config.REDIS_URL, settings);
  const credentials = new AccountCredentials(database), limits = new AuthenticationLimits(rateCache, settings.secrets[0]!, settings.prefix);
  const authentication = new Authentication({ create: i => credentials.create(i), lookup: e => credentials.lookup(e), confirm: async snapshot => {
    const valid = await credentials.confirm(snapshot); if (valid) await options.afterConfirmation?.(); return valid;
  } }, await Passwords.create(), limits);
  const sessions = new Sessions(connection.store, settings, { create: i => fences.create(i), rotate: (e, d, idle) => fences.rotate(e, d, idle), revoke: e => fences.revoke(e), revokeAll: id => fences.revokeAll(id) }, a => authentication.resolveIdentity(a));
  const tenancy = new Tenancy(database, { verify: async () => null }, denyAll, sessions);
  sessions.bind(tenancy); authentication.bind(sessions, tenancy);
  const coarse = new RedisRateLimiter(rateCache, 120, 60000, settings.prefix + 'coarse:');
  const server = await createApp(config, { databaseReady: () => database.ready(), queueReady: async () => await rateCache.ping() === 'PONG', close: async () => { await connection.close(); if (options.redisUrl) rateCache.disconnect(); } }, coarse, createLogger('silent'), sessions, authentication);
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

test('additive migration replay and Prisma schema equality; credential SQL constraints enforce canonical email and bounded hash', async () => {
  expect(await prisma(['migrate', 'deploy', '--schema', 'packages/database/prisma/schema.prisma'])).toContain('No pending migrations');
  expect(await prisma(['migrate', 'diff', '--from-schema-datasource', 'packages/database/prisma/schema.prisma', '--to-schema-datamodel', 'packages/database/prisma/schema.prisma', '--exit-code'])).toContain('No difference');
  const f = await fixture(), { email } = await f.signup(), row = await database.client.passwordCredential.findUniqueOrThrow({ where: { email } });
  for (const change of [{ email: 'UPPER@example.test' }, { email: ' invalid@example.test' }, { passwordHash: row.passwordHash.replace('m=19456', 'm=999999999') }]) {
    await expect(Promise.resolve(database.client.passwordCredential.update({ where: { identityId: row.identityId }, data: change }))).rejects.toThrow();
  }
}, 15000);
test('registration/login/me use real production controllers and no grants; registration remains anonymous and identity is server-generated', async () => {
  const f = await fixture(), { email, client } = await f.signup();
  expect((await f.http('/api/v1/auth/me', 'GET', client)).status).toBe(401);
  const row = await database.client.passwordCredential.findUniqueOrThrow({ where: { email }, include: { identity: true } });
  expect(row.passwordHash).toStartWith('$argon2id$v=19$m=19456,t=2,p=1$'); expect(row.passwordHash).not.toContain(password);
  expect(row.identity.subject).not.toBe(email); expect(row.identity.provider).toBe('password');
  expect(await database.client.workspaceMembership.count({ where: { userId: row.identity.userId } })).toBe(0);
  const auth = await f.login(email, client), response = await f.http('/api/v1/auth/me', 'GET', auth);
  expect(response.status).toBe(200); expect(await response.json()).toEqual({ user: { id: row.identity.userId, name: 'Account', email, emailVerified: false } });
  expect(response.headers.get('cache-control')).toBe('no-store'); expect(response.headers.has('set-cookie')).toBe(false);
  expect((await f.http('/api/v1/issues', 'GET', auth)).status).toBe(404);
  expect(await f.authentication.resolveIdentity({ userId: row.identity.userId, identityId: row.identityId })).toBeNull();
});
test('duplicate and case/space normalized signup return identical accepted responses, keep original hash/profile and never link contact email', async () => {
  const f = await fixture(), { email, client } = await f.signup();
  const old = await database.client.passwordCredential.findUniqueOrThrow({ where: { email } });
  const response = await f.http('/api/v1/auth/signup', 'POST', client, { email: ` ${email.toUpperCase()} `, name: 'Changed', password: 'A different long password 2026' });
  expect(response.status).toBe(202); expect(await response.json()).toEqual({ status: 'accepted' }); expect(response.headers.has('set-cookie')).toBe(false);
  expect(await database.client.passwordCredential.findUniqueOrThrow({ where: { email } })).toEqual(old);
  const contact = await database.client.user.create({ data: { email: `contact-${email}`, name: 'Contact only' } });
  await database.client.identity.create({ data: { provider: 'old-provider', subject: randomUUID(), userId: contact.id } });
  const login = await f.http('/api/v1/auth/login', 'POST', client, { email: contact.email, password }); expect(login.status).toBe(401);
});
test('invalid, nonexistent and disabled credentials have generic identical login responses and no authenticated cookie', async () => {
  const f = await fixture(), { email, client } = await f.signup();
  const bodies: unknown[] = [];
  for (const input of [{ email, password: 'A wrong long password 2026' }, { email: `${randomUUID()}@example.test`, password }]) {
    const response = await f.http('/api/v1/auth/login', 'POST', client, input);
    expect(response.status).toBe(401); expect(response.headers.has('set-cookie')).toBe(false);
    const body = await response.json(); bodies.push({ ...body.error, requestId: 'ignored' });
  }
  const row = await database.client.passwordCredential.findUniqueOrThrow({ where: { email }, include: { identity: true } });
  await database.client.user.update({ where: { id: row.identity.userId }, data: { authDisabled: true } });
  const disabled = await f.http('/api/v1/auth/login', 'POST', client, { email, password }); expect(disabled.status).toBe(401);
  const body = await disabled.json(); bodies.push({ ...body.error, requestId: 'ignored' });
  expect(bodies[0]).toEqual(bodies[1]); expect(bodies[0]).toEqual(bodies[2]);
});
test('first-use CSRF bootstrap and cookie mutations reject origin/token/form attacks and client authority fields', async () => {
  const f = await fixture();
  for (const origin of [undefined, 'null', 'https://evil.example']) expect((await f.http('/api/v1/auth/csrf', 'GET', undefined, undefined, { origin })).status).toBeOneOf([401, 403]);
  const allowed = new URL(config.CORS_ORIGINS[0]!);
  const browser = await f.http('/api/v1/auth/csrf', 'GET', undefined, undefined, { origin: undefined, host: allowed.host, 'sec-fetch-site': 'same-origin', 'sec-fetch-mode': 'cors' });
  expect(browser.status).toBe(200); expect(browser.headers.get('cache-control')).toBe('no-store');
  expect((await f.http('/api/v1/auth/csrf', 'GET', undefined, undefined, { origin: undefined, host: allowed.host, 'sec-fetch-site': 'cross-site', 'sec-fetch-mode': 'cors' })).status).toBe(401);
  const client = await f.bootstrap(), email = `${randomUUID()}@example.test`, body = { email, name: 'Account', password };
  for (const extra of [{ origin: undefined }, { origin: 'null' }, { 'x-csrf-token': undefined }, { 'x-csrf-token': 'x'.repeat(43) }, { 'content-type': 'application/x-www-form-urlencoded' }]) {
    expect((await f.http('/api/v1/auth/signup', 'POST', client, body, extra)).status).toBe(403);
  }
  expect((await f.http('/api/v1/auth/signup', 'POST', undefined, body)).status).toBe(403);
  for (const field of ['userId', 'role', 'membership', 'familyId']) expect((await f.http('/api/v1/auth/signup', 'POST', client, { ...body, [field]: randomUUID() })).status).toBe(400);
  expect(await database.client.passwordCredential.count({ where: { email } })).toBe(0);
});
test('concurrent canonical signup creates one atomic account without orphan users, identities, workspace grants or overwrite', async () => {
  const f = await fixture(), clients = await Promise.all([f.bootstrap(), f.bootstrap(), f.bootstrap()]);
  const email = `${randomUUID()}@example.test`, beforeUsers = await database.client.user.count(), beforeIdentities = await database.client.identity.count();
  const responses = await Promise.all(clients.map((client, index) => f.http('/api/v1/auth/signup', 'POST', client, { email: index === 1 ? email.toUpperCase() : email, name: `Contender ${index}`, password })));
  for (const response of responses) { expect(response.status).toBe(202); expect(await response.json()).toEqual({ status: 'accepted' }); }
  expect(await database.client.passwordCredential.count({ where: { email } })).toBe(1);
  expect(await database.client.user.count()).toBe(beforeUsers + 1); expect(await database.client.identity.count()).toBe(beforeIdentities + 1);
  await f.login(email);
});
test('logout clears exactly one cookie; stale saved state and escaped principals cannot authorize; other sessions survive', async () => {
  const f = await fixture(), { email } = await f.signup(), first = await f.login(email), second = await f.login(email);
  const stale = (await cache.get(f.key(first)))!;
  // Principal lifetime and transactional authority remain covered by dedicated
  // fence suites; me is the actual fresh HTTP boundary here.
  expect((await f.http('/api/v1/auth/me', 'GET', first)).status).toBe(200);
  const response = await f.http('/api/v1/auth/logout', 'POST', first);
  expect(response.status).toBe(200); expect(await response.json()).toEqual({ revocation: 'confirmed', cleanup: 'confirmed' });
  expect(response.headers.getSetCookie()).toHaveLength(1); expect(response.headers.get('set-cookie')).toStartWith(`${f.settings.name}=;`);
  await cache.set(f.key(first), stale, 'EX', 60);
  expect((await f.http('/api/v1/auth/me', 'GET', first)).status).toBe(401); expect((await f.http('/api/v1/auth/me', 'GET', second)).status).toBe(200);
  await expect(f.tenancy.currentUser(Object.freeze({}) as VerifiedPrincipal)).rejects.toBeInstanceOf(TenantAccessError);
});
test('successful login from authenticated state durably retires its predecessor against late cache resurrection', async () => {
  const f = await fixture(), { email } = await f.signup(), before = await f.login(email), raw = (await cache.get(f.key(before)))!;
  const after = await f.login(email, before);
  await cache.set(f.key(before), raw, 'EX', 60);
  expect((await f.http('/api/v1/auth/me', 'GET', before)).status).toBe(401);
  expect((await f.http('/api/v1/auth/me', 'GET', after)).status).toBe(200);
  const family = await database.client.authSessionFamily.findUniqueOrThrow({ where: { id: JSON.parse(raw).state.familyId } });
  expect(family.revokedAt).not.toBeNull();
});
test('me revalidates already-minted authority after concurrent revocation and rejects actual escaped principals', async () => {
  const f = await fixture(), { email } = await f.signup(), auth = await f.login(email);
  const current = f.tenancy.currentUser.bind(f.tenancy);
  let captured: VerifiedPrincipal | undefined, entered!: () => void, release!: () => void;
  const ready = new Promise<void>(resolve => { entered = resolve; }), hold = new Promise<void>(resolve => { release = resolve; });
  f.tenancy.currentUser = async principal => { captured = principal; entered(); await hold; return current(principal); };
  const pending = f.http('/api/v1/auth/me', 'GET', auth);
  try { await ready; expect((await f.http('/api/v1/auth/logout', 'POST', auth)).status).toBe(200); }
  finally { release(); }
  expect((await pending).status).toBe(401); expect(captured).toBeDefined();
  await expect(current(captured!)).rejects.toBeInstanceOf(TenantAccessError);
});
test('logout-all rejects every old SID including resurrected bytes; independently verified new login succeeds', async () => {
  const f = await fixture(), { email } = await f.signup(), first = await f.login(email), second = await f.login(email), raw = (await cache.get(f.key(second)))!;
  expect((await f.http('/api/v1/auth/logout-all', 'POST', first)).status).toBe(200);
  await cache.set(f.key(second), raw, 'EX', 60);
  expect((await f.http('/api/v1/auth/me', 'GET', first)).status).toBe(401); expect((await f.http('/api/v1/auth/me', 'GET', second)).status).toBe(401);
  expect((await f.http('/api/v1/auth/me', 'GET', await f.login(email))).status).toBe(200);
});
test('credential proof cannot cross a logout-all epoch or resurrect a disabled identity', async () => {
  const f = await fixture(), { email } = await f.signup(), snapshot = (await f.credentials.lookup(email))!;
  expect(await f.credentials.confirm(snapshot)).toBe(true); await fences.revokeAll(snapshot.userId);
  expect(await f.credentials.confirm(snapshot)).toBe(false);
  await expect(fences.create({ userId: snapshot.userId, identityId: snapshot.identityId, authEpoch: snapshot.authEpoch,
    sidDigest: createHash('sha256').update(randomUUID()).digest('hex'), absoluteExpiresAt: new Date(Date.now() + 60000), idleExpiresAt: new Date(Date.now() + 60000) })).rejects.toBeInstanceOf(AuthDeniedError);
  expect(await database.client.authSessionFamily.count({ where: { userId: snapshot.userId } })).toBe(0);
});
test('HTTP login cannot upgrade a credential proof after concurrent logout-all commits', async () => {
  let admitted!: () => void, release!: () => void;
  const ready = new Promise<void>(resolve => { admitted = resolve; }), hold = new Promise<void>(resolve => { release = resolve; });
  const f = await fixture({ afterConfirmation: async () => { admitted(); await hold; } }), { email, client } = await f.signup();
  const snapshot = (await f.credentials.lookup(email))!;
  const pending = f.http('/api/v1/auth/login', 'POST', client, { email, password });
  try { await ready; await fences.revokeAll(snapshot.userId); }
  finally { release(); }
  const response = await pending; expect(response.status).toBe(401);
  expect(response.headers.getSetCookie()).toHaveLength(1); expect(response.headers.get('set-cookie')).toStartWith(`${f.settings.name}=;`);
  expect(await database.client.authSessionFamily.count({ where: { userId: snapshot.userId } })).toBe(0);
});
test('fresh sessions fail me after cache disappearance/expiry and forged cookies; primary revoked generation remains enforced', async () => {
  const f = await fixture(), { email } = await f.signup(), auth = await f.login(email);
  await cache.pexpire(f.key(auth), 1); await Bun.sleep(10);
  expect((await f.http('/api/v1/auth/me', 'GET', auth)).status).toBe(401);
  const live = await f.login(email); await cache.del(f.key(live)); expect((await f.http('/api/v1/auth/me', 'GET', live)).status).toBe(401);
  expect((await f.http('/api/v1/auth/me', 'GET', undefined, undefined, { cookie: `${f.settings.name}=forged` })).status).toBe(401);
});
test('real endpoint account limit rejects subsequent login guesses equally for nonexistent accounts', async () => {
  const f = await fixture(), client = await f.bootstrap(), email = `${randomUUID()}@example.test`;
  for (let attempt = 0; attempt < 10; attempt++) expect((await f.http('/api/v1/auth/login', 'POST', client, { email, password })).status).toBe(401);
  const response = await f.http('/api/v1/auth/login', 'POST', client, { email: email.toUpperCase(), password });
  expect(response.status).toBe(429); expect(Number(response.headers.get('retry-after'))).toBeGreaterThan(0);
  expect(response.headers.has('set-cookie')).toBe(false);
});
test('registration account and anonymous bootstrap IP budgets operate independently and fail before extra work', async () => {
  const f = await fixture(), client = await f.bootstrap(), email = `${randomUUID()}@example.test`;
  for (let i = 0; i < 5; i++) expect((await f.http('/api/v1/auth/signup', 'POST', client, { email, name: 'Bounded', password })).status).toBe(202);
  expect((await f.http('/api/v1/auth/signup', 'POST', client, { email, name: 'Bounded', password })).status).toBe(429);
  expect(await database.client.passwordCredential.count({ where: { email } })).toBe(1);
  for (let i = 1; i < 30; i++) expect((await f.http('/api/v1/auth/csrf')).status).toBe(200);
  const response = await f.http('/api/v1/auth/csrf'); expect(response.status).toBe(429); expect(response.headers.has('set-cookie')).toBe(false);
});
test('PostgreSQL outage denies login/signup/me and reports unconfirmed logout without clearing durable authority', async () => {
  const f = await fixture(), { email, client } = await f.signup(), auth = await f.login(email);
  await database.close(); await admin.client.$executeRawUnsafe(`ALTER DATABASE "${name}" ALLOW_CONNECTIONS false`);
  await admin.client.$executeRaw`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = ${name} AND pid <> pg_backend_pid()`;
  try {
    for (const [path, body] of [['login', { email, password }], ['signup', { email: `${randomUUID()}@example.test`, name: 'Fail', password }], ['logout', {}], ['logout-all', {}]] as const) {
      const response = await f.http(`/api/v1/auth/${path}`, 'POST', path.startsWith('logout') ? auth : client, body);
      expect(response.status).toBe(503); expect(response.headers.has('set-cookie')).toBe(false);
    }
    expect((await f.http('/api/v1/auth/me', 'GET', auth)).status).toBe(503);
  } finally { await admin.client.$executeRawUnsafe(`ALTER DATABASE "${name}" ALLOW_CONNECTIONS true`); await database.connect(); }
  expect((await f.http('/api/v1/auth/me', 'GET', auth)).status).toBe(200);
}, 15000);
test('session-store and rate-store outages fail closed; no MemoryStore/identity fallback or authenticated response', async () => {
  const f = await fixture(), { email, client } = await f.signup(), auth = await f.login(email);
  await f.connection.close();
  expect((await f.http('/api/v1/auth/login', 'POST', client, { email, password })).status).toBe(503);
  expect((await f.http('/api/v1/auth/me', 'GET', auth)).status).toBe(503);
  const response = await f.http('/api/v1/auth/csrf'); expect(response.status).toBe(503);
  expect(response.headers.getSetCookie()).toHaveLength(1); expect(response.headers.get('set-cookie')).toStartWith(`${f.settings.name}=;`);
  const brokenRedis = createRedis(config.REDIS_URL); brokenRedis.disconnect();
  const broken = new AuthenticationLimits(brokenRedis, f.settings.secrets[0]!, f.settings.prefix);
  await expect(broken.consume('login', '127.0.0.1', email)).rejects.toThrow('Authentication dependency unavailable');
});

async function docker(args: string[], env = process.env) {
  const child = Bun.spawn(['docker', ...args], { env, stdout: 'pipe', stderr: 'pipe' });
  let timeout = false; const timer = setTimeout(() => { timeout = true; child.kill('SIGKILL'); }, 10000);
  try {
    const [code, out] = await Promise.all([child.exited, new Response(child.stdout).text(), new Response(child.stderr).text()]);
    if (timeout || code !== 0) throw new Error('Owned Valkey command failed; credentials withheld'); return out.trim();
  } finally { clearTimeout(timer); }
}
test('actual isolated Valkey server outage rejects core HTTP APIs while liveness remains independent', async () => {
  const container = `unblok-be00i-${randomUUID()}`, secret = randomBytes(32).toString('hex');
  let f: Awaited<ReturnType<typeof fixture>> | undefined;
  try {
    await docker(['run', '-d', '--name', container, '-p', '127.0.0.1::6379', '-e', 'BE00I_PASSWORD', '--entrypoint', '/bin/sh',
      'valkey/valkey:8.1.3-alpine@sha256:d827e7f7552cdee40cc7482dbae9da020f42bc47669af6f71182a4ef76a22773', '-ec',
      'exec valkey-server --requirepass "$BE00I_PASSWORD" --save "" --appendonly no'], { ...process.env, BE00I_PASSWORD: secret });
    const port = (await docker(['port', container, '6379/tcp'])).split(':').at(-1)!;
    f = await fixture({ redisUrl: `redis://:${secret}@127.0.0.1:${port}/0` });
    const { email, client } = await f.signup(), auth = await f.login(email);
    await docker(['stop', '-t', '1', container]);
    for (const path of ['login', 'signup', 'logout', 'logout-all']) {
      const response = await f.http(`/api/v1/auth/${path}`, 'POST', auth, { email, password, name: 'Unavailable' });
      expect(response.status).toBe(503); expect(response.headers.has('set-cookie')).toBe(false);
    }
    expect((await f.http('/api/v1/auth/me', 'GET', auth)).status).toBe(503);
    expect((await f.http('/api/v1/auth/csrf', 'GET', client)).status).toBe(503);
    expect((await f.http('/live')).status).toBe(200); expect((await f.http('/ready')).status).toBe(503);
  } finally { await f?.close(); await docker(['rm', '-f', container]); }
}, 20000);


test('unverified ownership stays separate from unrelated contact identities, grants and disabled duplicate accounts', async () => {
  const f = await fixture(), email = `${randomUUID()}@example.test`;
  const contact = await database.client.user.create({ data: { email, name: 'Unrelated existing contact' } });
  const oldIdentity = await database.client.identity.create({ data: { provider: 'existing-provider', subject: randomUUID(), userId: contact.id } });
  const workspace = await database.client.workspace.create({ data: { slug: `contact-${randomUUID()}`, name: 'Existing contact workspace' } });
  const membership = await database.client.workspaceMembership.create({ data: { workspaceId: workspace.id, userId: contact.id, role: 'ADMIN', status: 'ACTIVE' } });
  const { client } = await f.signup(email);
  const credential = await database.client.passwordCredential.findUniqueOrThrow({ where: { email }, include: { identity: true } });
  expect(credential.emailVerifiedAt).toBeNull(); expect(credential.identityId).not.toBe(oldIdentity.id);
  expect(credential.identity.userId).not.toBe(contact.id);
  expect(await database.client.identity.findUniqueOrThrow({ where: { id: oldIdentity.id } })).toEqual(oldIdentity);
  expect(await database.client.user.findUniqueOrThrow({ where: { id: contact.id } })).toEqual(contact);
  expect(await database.client.workspaceMembership.count({ where: { userId: credential.identity.userId } })).toBe(0);
  const auth = await f.login(email, client), response = await f.http('/api/v1/auth/me', 'GET', auth);
  expect(response.status).toBe(200); expect((await response.json()).user).toEqual({ id: credential.identity.userId, name: 'Account', email, emailVerified: false });
  expect(await database.client.workspaceMembership.findUniqueOrThrow({ where: { workspaceId_id: { workspaceId: workspace.id, id: membership.id } } })).toEqual(membership);
  const anonymous = await f.bootstrap();
  for (const field of ['emailVerified', 'emailVerifiedAt', 'identityId']) {
    expect((await f.http('/api/v1/auth/signup', 'POST', anonymous, { email, name: 'Forged', password, [field]: true })).status).toBe(400);
  }
  await database.client.user.update({ where: { id: credential.identity.userId }, data: { authDisabled: true } });
  expect((await f.http('/api/v1/auth/signup', 'POST', anonymous, { email: email.toUpperCase(), name: 'Replacement', password: 'Changed long private password' })).status).toBe(202);
  const { identity: ignoredIdentity, ...originalCredential } = credential; void ignoredIdentity;
  expect(await database.client.passwordCredential.findUniqueOrThrow({ where: { email } })).toEqual(originalCredential);
  expect((await f.http('/api/v1/auth/login', 'POST', anonymous, { email, password })).status).toBe(401);
  expect((await f.http('/api/v1/auth/me', 'GET', auth)).status).toBe(401);
  expect((await f.http('/api/v1/auth/csrf', 'GET', auth)).status).toBe(401);
});

test('durable email ownership has immutable binding and ordered nullable verification without an email-verification API', async () => {
  const f = await fixture(), { email } = await f.signup();
  const row = await database.client.passwordCredential.findUniqueOrThrow({ where: { email } });
  expect(row.emailVerifiedAt).toBeNull();
  const owner = await database.client.identity.findUniqueOrThrow({ where: { id: row.identityId } });
  const other = await database.client.identity.create({ data: { userId: owner.userId, provider: 'unrelated-provider', subject: randomUUID() } });
  for (const data of [{ identityId: other.id }, { email: `${randomUUID()}@example.test` }, { createdAt: new Date(row.createdAt.getTime() - 1) }, { emailVerifiedAt: new Date(row.createdAt.getTime() - 1) }]) {
    await expect(Promise.resolve(database.client.passwordCredential.update({ where: { identityId: row.identityId }, data }))).rejects.toThrow();
  }
  // Test-only privileged SQL is not a verification endpoint. A future workflow
  // must prove ownership and authorize this transition; this slice grants none.
  await database.client.passwordCredential.update({ where: { identityId: row.identityId }, data: { emailVerifiedAt: row.createdAt } });
  expect((await database.client.passwordCredential.findUniqueOrThrow({ where: { email } })).emailVerifiedAt).toEqual(row.createdAt);
  const auth = await f.login(email), response = await f.http('/api/v1/auth/me', 'GET', auth);
  expect((await response.json()).user.emailVerified).toBe(false);
  const identity = await database.client.identity.findUniqueOrThrow({ where: { id: row.identityId } });
  expect(await database.client.workspaceMembership.count({ where: { userId: identity.userId } })).toBe(0);
});

test('anonymous and authenticated bootstrap rejects navigation and inconsistent browser metadata; legitimate same-origin fetch remains no-store', async () => {
  const f = await fixture(), { email, client } = await f.signup(), auth = await f.login(email, client);
  const allowed = new URL(config.CORS_ORIGINS[0]!), anonymous = await f.bootstrap();
  for (const current of [anonymous, auth]) {
    const legitimate = { origin: undefined, host: allowed.host, 'sec-fetch-site': 'same-origin', 'sec-fetch-mode': 'cors', 'sec-fetch-dest': 'empty' };
    const response = await f.http('/api/v1/auth/csrf', 'GET', current, undefined, legitimate);
    expect(response.status).toBe(200); expect(await response.json()).toEqual({ csrf: current.csrf });
    expect(response.headers.get('cache-control')).toBe('no-store'); expect(response.headers.get('pragma')).toBe('no-cache');
    expect(response.headers.has('set-cookie')).toBe(false);
    const attacks: Record<string, string | undefined>[] = [
      { ...legitimate, 'sec-fetch-site': 'cross-site', 'sec-fetch-mode': 'navigate', 'sec-fetch-dest': 'document' },
      { ...legitimate, 'sec-fetch-mode': 'navigate' },
      { ...legitimate, 'sec-fetch-dest': 'iframe' },
      { ...legitimate, 'sec-fetch-site': 'cross-site' },
      { ...legitimate, 'sec-fetch-site': 'same-site' },
      { ...legitimate, host: 'evil.example' },
      { ...legitimate, origin: 'null' },
      { ...legitimate, origin: 'https://evil.example' },
      { ...legitimate, origin: allowed.origin, host: 'evil.example' },
      { ...legitimate, 'x-forwarded-proto': 'https' },
    ];
    for (const extra of attacks) {
      const denied = await f.http('/api/v1/auth/csrf', 'GET', current, undefined, extra);
      // Untrusted X-Forwarded-Proto cannot change protocol: this one remains a
      // legitimate loopback same-origin request, not an HTTPS trust assertion.
      const ignoredForward = extra['x-forwarded-proto'] === 'https';
      expect(denied.status).toBeOneOf(ignoredForward ? [200] : [401, 403]);
      const body = await denied.json(); if (!ignoredForward) { expect(body.csrf).toBeUndefined(); expect(JSON.stringify(body)).not.toContain(current.csrf); }
      expect(denied.headers.get('cache-control')).toBe('no-store'); expect(denied.headers.get('pragma')).toBe('no-cache');
      if (extra.origin === 'https://evil.example') expect(denied.headers.has('access-control-allow-origin')).toBe(false);
    }
  }
});

test('bootstrap cannot disclose tokens from restored revoked, epoch-stale, disabled, malformed or missing session data', async () => {
  const f = await fixture(), { email } = await f.signup(), auth = await f.login(email), raw = (await cache.get(f.key(auth)))!;
  const before = await f.http('/api/v1/auth/csrf', 'GET', auth); expect(before.status).toBe(200); expect(await before.json()).toEqual({ csrf: auth.csrf });
  expect((await f.http('/api/v1/auth/logout', 'POST', auth)).status).toBe(200);
  await cache.set(f.key(auth), raw, 'EX', 60);
  const revoked = await f.http('/api/v1/auth/csrf', 'GET', auth); expect(revoked.status).toBe(401); expect((await revoked.json()).csrf).toBeUndefined();
  const next = await f.login(email), saved = (await cache.get(f.key(next)))!;
  expect((await f.http('/api/v1/auth/logout-all', 'POST', next)).status).toBe(200); await cache.set(f.key(next), saved, 'EX', 60);
  expect((await f.http('/api/v1/auth/csrf', 'GET', next)).status).toBe(401);
  const live = await f.login(email); await cache.del(f.key(live));
  const missing = await f.http('/api/v1/auth/csrf', 'GET', live); expect(missing.status).toBe(401); expect((await missing.json()).csrf).toBeUndefined();
  expect(missing.headers.get('cache-control')).toBe('no-store');
  const malformed = JSON.parse(saved); malformed.state.absoluteExpiresAt += 86400000;
  await cache.set(f.key(next), JSON.stringify(malformed), 'EX', 60);
  expect((await f.http('/api/v1/auth/csrf', 'GET', next)).status).toBe(401);
});

test('real Valkey concurrent account/IP budgets are atomic and survive limiter reconstruction and rejected attempts', async () => {
  const f = await fixture();
  for (const action of ['login', 'signup'] as const) {
    const accountMax = action === 'login' ? 10 : 5, ipMax = action === 'login' ? 30 : 10;
    const email = `${randomUUID()}@example.test`, ip = `owned-ip-${randomUUID()}`;
    const accounts = await Promise.all(Array.from({ length: accountMax + 7 }, (_, i) => f.limits.consume(action, `owned-${randomUUID()}-${i}`, email)));
    expect(accounts.filter(r => r.allowed)).toHaveLength(accountMax);
    const ips = await Promise.all(Array.from({ length: ipMax + 7 }, () => f.limits.consume(action, ip, `${randomUUID()}@example.test`)));
    expect(ips.filter(r => r.allowed)).toHaveLength(ipMax);
    const restarted = new AuthenticationLimits(cache, f.settings.secrets[0]!, f.settings.prefix);
    expect((await restarted.consume(action, `other-${randomUUID()}`, email)).allowed).toBe(false);
    expect((await restarted.consume(action, ip, `${randomUUID()}@example.test`)).allowed).toBe(false);
  }
  const keys = await cache.keys(`${f.settings.prefix}rate:*`), before = await Promise.all(keys.map(async key => ({ key, count: Number(await cache.get(key)), ttl: await cache.pttl(key) })));
  expect(before.every(row => row.count >= 1 && row.ttl > 0)).toBe(true);
  await Bun.sleep(15);
  for (const row of before) { expect(Number(await cache.get(row.key))).toBe(row.count); expect(await cache.pttl(row.key)).toBeLessThanOrEqual(row.ttl); }
});

test('overlapping real HTTP signup/login consumes account budgets even on bounded password admission failures', async () => {
  const f = await fixture(), client = await f.bootstrap();
  const email = `${randomUUID()}@example.test`;
  const signups = await Promise.all(Array.from({ length: 8 }, () => f.http('/api/v1/auth/signup', 'POST', client, { email, name: 'Concurrent', password })));
  expect(signups.filter(r => r.status === 429)).toHaveLength(3);
  expect(signups.every(r => [202, 429, 503].includes(r.status))).toBe(true);
  expect(signups.some(r => r.status === 202)).toBe(true); expect(await database.client.passwordCredential.count({ where: { email } })).toBe(1);
  expect((await f.http('/api/v1/auth/signup', 'POST', client, { email, name: 'Retry', password })).status).toBe(429);
  const guesses = await Promise.all(Array.from({ length: 12 }, () => f.http('/api/v1/auth/login', 'POST', client, { email, password: 'A wrong private password 2026' })));
  expect(guesses.filter(r => r.status === 429)).toHaveLength(2);
  expect(guesses.every(r => [401, 429, 503].includes(r.status))).toBe(true);
  expect((await f.http('/api/v1/auth/login', 'POST', client, { email, password })).status).toBe(429);
  for (const response of [...signups, ...guesses]) expect(response.headers.has('set-cookie')).toBe(false);
});


test('late Valkey rate operation after acknowledgement timeout still consumes its original atomic budget', async () => {
  const f = await fixture(), delayed = createRedis(config.REDIS_URL); delayed.on('error', () => {}); await delayed.connect();
  const original = delayed.eval.bind(delayed);
  let release!: () => void, done!: () => void, completed = 0;
  const hold = new Promise<void>(ok => { release = ok; }), finished = new Promise<void>(ok => { done = ok; });
  delayed.eval = (async (...args: Parameters<typeof delayed.eval>) => { await hold; const result = await Reflect.apply(original, delayed, args); if (++completed === 2) done(); return result; }) as typeof delayed.eval;
  const email = `${randomUUID()}@example.test`, ip = `timeout-${randomUUID()}`, limits = new AuthenticationLimits(delayed, f.settings.secrets[0]!, f.settings.prefix);
  try {
    await expect(limits.consume('login', ip, email)).rejects.toThrow('Authentication dependency unavailable');
    expect(completed).toBe(0); release(); await finished;
    const keys = await cache.keys(`${f.settings.prefix}rate:*`); expect(keys).toHaveLength(2);
    for (const key of keys) { expect(await cache.get(key)).toBe('1'); expect(await cache.pttl(key)).toBeGreaterThan(0); }
    for (let i = 0; i < 9; i++) expect((await f.limits.consume('login', ip, email)).allowed).toBe(true);
    expect((await f.limits.consume('login', ip, email)).allowed).toBe(false);
    expect((await new AuthenticationLimits(cache, f.settings.secrets[0]!, f.settings.prefix).consume('login', ip, email)).allowed).toBe(false);
  } finally { release(); delayed.disconnect(); }
});

test('overlapping HTTP requests cannot evade IP budgets with different accounts or untrusted forwarded addresses', async () => {
  for (const action of ['signup', 'login'] as const) {
    const f = await fixture(), client = await f.bootstrap(), maximum = action === 'login' ? 30 : 10;
    const responses = await Promise.all(Array.from({ length: maximum + 6 }, (_, i) => f.http(`/api/v1/auth/${action}`, 'POST', client,
      { email: `${randomUUID()}@example.test`, password, ...(action === 'signup' ? { name: 'Concurrent IP' } : {}) }, { 'x-forwarded-for': `198.51.100.${i + 1}` })));
    expect(responses.filter(r => r.status === 429)).toHaveLength(6);
    expect(responses.every(r => (action === 'signup' ? [202, 429, 503] : [401, 429, 503]).includes(r.status))).toBe(true);
    expect((await f.http(`/api/v1/auth/${action}`, 'POST', client, { email: `${randomUUID()}@example.test`, password, ...(action === 'signup' ? { name: 'Retry' } : {}) })).status).toBe(429);
    for (const response of responses) expect(response.headers.get('cache-control')).toBe('no-store');
  }
});
