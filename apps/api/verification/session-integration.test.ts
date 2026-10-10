import 'reflect-metadata';
import { afterAll, beforeAll, expect, test } from 'bun:test';
import { createHash, createHmac, randomBytes, randomUUID } from 'node:crypto';
import { basename, dirname, resolve } from 'node:path';
import { request as httpRequest } from 'node:http';
import { createServer as createTlsServer, request as tlsRequest } from 'node:https';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import express, { type Request, type Response } from 'express';
import { AuthFences, AuthUnavailableError, Database, Tenancy, TenantAccessError, denyAll, type VerifiedPrincipal } from '@unblok/database';
import { createLogger, createRedis, loadApiConfig } from '@unblok/backend-runtime';
import { createApp } from '../src/app';
import { cors } from '../src/security';
import { connectSessionStore, Sessions, sessionSettings } from '../src/modules/sessions';
import type { SessionSettings } from '../src/modules/sessions/infrastructure/settings';
import { BoundedSessionStore } from '../src/modules/sessions/infrastructure/store';

const root = resolve(import.meta.dir, '../../..'), config = loadApiConfig(process.env);
const admin = new Database(config.DATABASE_URL), name = `unblok_be00h_test_${randomUUID().replaceAll('-', '')}`;
const dbUrl = new URL(config.DATABASE_URL); dbUrl.pathname = `/${name}`;
const db = new Database(dbUrl.toString()), fences = new AuthFences(db), cache = createRedis(config.REDIS_URL);
const prefix = `be00h:test:${randomUUID()}:`;
const settings: SessionSettings = { ...sessionSettings(config, { SESSION_SECRETS: randomBytes(32).toString('hex'), SESSION_NAMESPACE: 'test' }), prefix };
let created = false;
const stops: (() => Promise<void>)[] = [];
beforeAll(async () => {
  await admin.connect(); await admin.client.$executeRawUnsafe(`CREATE DATABASE "${name}"`); created = true;
  const child = Bun.spawn([process.execPath, 'packages/database/node_modules/prisma/build/index.js', 'migrate', 'deploy', '--schema', 'packages/database/prisma/schema.prisma'],
    { cwd: root, env: { ...process.env, DATABASE_URL: dbUrl.toString() }, stdout: 'pipe', stderr: 'pipe' });
  let timeout = false; const timer = setTimeout(() => { timeout = true; child.kill('SIGKILL'); }, 6000);
  try {
    const [code] = await Promise.all([child.exited, new Response(child.stdout).text(), new Response(child.stderr).text()]);
    if (timeout || code !== 0) throw new Error('Owned migration failed; credentials withheld');
  } finally { clearTimeout(timer); }
  await db.connect(); await cache.connect();
}, 30000);
afterAll(async () => {
  try { for (const stop of stops.reverse()) await stop(); }
  finally {
    try { const keys = await cache.keys(`${prefix}*`); if (keys.length) await cache.del(...keys); }
    finally {
      cache.disconnect(); await db.close();
      try { if (created) await admin.client.$executeRawUnsafe(`DROP DATABASE "${name}" WITH (FORCE)`); }
      finally { await admin.close(); }
    }
  }
}, 10000);
function gate() { let release!: () => void; const wait = new Promise<void>(r => { release = r; }); return { wait, release }; }
async function fixture(options: { settings?: SessionSettings; database?: Database; deny?: boolean; wrap?: (store: BoundedSessionStore) => BoundedSessionStore } = {}) {
  const userId = randomUUID(), identityId = randomUUID(), workspaceId = randomUUID(), membershipId = randomUUID(), teamId = randomUUID(), projectId = randomUUID(), issueId = randomUUID();
  await db.transaction(async tx => {
    await tx.user.create({ data: { id: userId, name: 'Session test' } });
    await tx.identity.create({ data: { id: identityId, userId, provider: 'session-test', subject: userId } });
    await tx.workspace.create({ data: { id: workspaceId, name: 'Session test', slug: workspaceId } });
    await tx.workspaceMembership.create({ data: { workspaceId, id: membershipId, userId, role: 'ADMIN', status: 'ACTIVE' } });
    await tx.team.create({ data: { workspaceId, id: teamId, name: 'Test', key: 'ENG' } });
    await tx.teamMembership.create({ data: { workspaceId, teamId, membershipId } });
    await tx.project.create({ data: { workspaceId, id: projectId, teamId, name: 'Test', key: 'APP', currentSequence: 1 } });
    await tx.issue.create({ data: { workspaceId, id: issueId, projectId, sequence: 1, title: 'Before', creatorMembershipId: membershipId } });
  });
  const s = options.settings ?? settings;
  const connection = await connectSessionStore(config.REDIS_URL, s), proof = Symbol('server-verified synthetic credentials');
  let lookups = 0;
  const get = connection.store.get.bind(connection.store);
  connection.store.get = (sid, done) => { lookups++; get(sid, done); };
  const sessions = new Sessions(options.wrap?.(connection.store) ?? connection.store, s, {
    create: input => fences.create(input), rotate: (e, sid, idle) => fences.rotate(e, sid, idle), revoke: e => fences.revoke(e), revokeAll: id => fences.revokeAll(id),
  }, async assertion => assertion === proof ? { userId, identityId } : null);
  const tenancy = new Tenancy(options.database ?? db, { verify: async () => null }, options.deny ? denyAll : { allows: () => true }, sessions); sessions.bind(tenancy);
  class FixtureModule {} Module({})(FixtureModule);
  const app = await NestFactory.create<NestExpressApplication>(FixtureModule, { logger: false, bodyParser: false, abortOnError: false });
  app.set('trust proxy', s.trustedProxies.length ? s.trustedProxies : false);
  app.use(cors(config, s.credentials, true)); app.use(express.json()); app.use(sessions.middleware());
  const router = app.getHttpAdapter().getInstance() as express.Express;
  let escaped: VerifiedPrincipal | undefined, entered = gate(), hold: ReturnType<typeof gate> | undefined;
  let heldDenied = false;
  const route = (path: string, method: 'get' | 'post', run: (req: Request, res: Response) => Promise<void>) => router[method](path, (req, res) => {
    void run(req, res).catch(error => { if (!res.destroyed) res.status(error instanceof AuthUnavailableError ? 503 : error instanceof TenantAccessError ? 401 : 500).json({ error: 'Unavailable' }); });
  });
  route('/bootstrap', 'get', async (req, res) => { res.json({ csrf: await sessions.bootstrap(req) }); });
  route('/establish', 'post', async (req, res) => { await sessions.establish(req, proof); res.json({ csrf: req.session.state!.csrf }); });
  route('/forged-identity', 'post', async (req, res) => { await sessions.establish(req, req.body); res.json({ unexpected: true }); });
  route('/read', 'get', async (req, res) => { const data = await sessions.withRequest(req, p => tenancy.read(p, workspaceId, q => q.issue(issueId))); res.json(data); });
  route('/twice', 'get', async (req, res) => { await sessions.withRequest(req, async p => {
    await tenancy.read(p, workspaceId, q => q.issue(issueId)); await tenancy.read(p, workspaceId, q => q.issue(issueId));
  }); res.json({ ok: true }); });
  route('/cache-disappear', 'get', async (req, res) => {
    await cache.del(s.prefix + req.sessionID);
    await sessions.withRequest(req, p => tenancy.read(p, workspaceId, q => q.issue(issueId))); res.json({ unexpected: true });
  });
  route('/capture', 'get', async (req, res) => { await sessions.withRequest(req, async p => { escaped = p; }); res.json({ ok: true }); });
  route('/reuse', 'get', async (_req, res) => { if (!escaped) throw new TenantAccessError(); res.json(await tenancy.read(escaped, workspaceId, q => q.issue(issueId))); });
  route('/held', 'get', async (req, res) => {
    await sessions.withRequest(req, async p => {
      entered.release(); await hold?.wait;
      try { await tenancy.read(p, workspaceId, q => q.issue(issueId)); }
      catch (error) { heldDenied = error instanceof TenantAccessError; throw error; }
    }); res.json({ ok: true });
  });
  route('/write', 'post', async (req, res) => { await sessions.withRequest(req, p => tenancy.write(p, workspaceId, async q => {
    await q.compareAndSetIssueTitle(issueId, 1, 'After'); entered.release(); await hold?.wait;
  })); res.json({ ok: true }); });
  route('/rotate', 'post', async (req, res) => { await sessions.rotate(req); res.json({ csrf: req.session.state!.csrf }); });
  route('/logout', 'post', async (req, res) => { res.json(await sessions.logout(req)); });
  route('/logout-all', 'post', async (req, res) => { res.json(await sessions.logout(req, true)); });
  await app.init(); await app.listen(0, '127.0.0.1');
  const address = app.getHttpServer().address(); if (!address || typeof address === 'string') throw new Error('Missing listener');
  let closed = false; const close = async () => { if (closed) return; closed = true; await app.close(); await connection.close(); }; stops.push(close);
  const http = (path: string, auth?: { cookie: string; csrf: string }, method = 'GET', extra: Record<string, string> = {}) => fetch(`http://127.0.0.1:${address.port}${path}`, {
    method, headers: { origin: config.CORS_ORIGINS[0]!, ...(auth ? { cookie: auth.cookie, 'x-csrf-token': auth.csrf } : {}),
      ...(method === 'POST' ? { 'content-type': 'application/json' } : {}), ...extra }, ...(method === 'POST' ? { body: '{}' } : {}) });
  const cookieOf = (res: globalThis.Response) => res.headers.get('set-cookie')?.split(';')[0] ?? '';
  const login = async () => {
    const bootstrap = await http('/bootstrap'); expect(bootstrap.status).toBe(200);
    const anonymous = { cookie: cookieOf(bootstrap), csrf: (await bootstrap.json()).csrf as string };
    const response = await http('/establish', anonymous, 'POST'); expect(response.status).toBe(200);
    const auth = { cookie: cookieOf(response), csrf: (await response.json()).csrf as string };
    expect(auth.cookie).not.toBe(anonymous.cookie); expect(auth.csrf).not.toBe(anonymous.csrf); return auth;
  };
  const sid = (auth: { cookie: string }) => decodeURIComponent(auth.cookie.split('=')[1]!).slice(2).split('.')[0]!;
  const key = (auth: { cookie: string }) => s.prefix + sid(auth);
  return { sessions, tenancy, http, login, cookieOf, sid, key, connection, close, userId, issueId, workspaceId, port: address.port,
    heldDenied: () => heldDenied, lookups: () => lookups,
    hold: () => { entered = gate(); hold = gate(); return { entered: entered.wait, release: hold.release }; } };
}
test('real Nest middleware regenerates signed SID/CSRF, bounds TTL and leaves health/business guard unchanged', async () => {
  const f = await fixture();
  expect((await f.http('/read')).status).toBe(401);
  const auth = await f.login(), read = await f.http('/read', auth); expect(read.status).toBe(200);
  expect((await read.json()).title).toBe('Before');
  expect(await cache.pttl(f.key(auth))).toBeGreaterThan(0);
  expect(await cache.pttl(f.key(auth))).toBeLessThanOrEqual(settings.idleMs);
  expect(read.headers.has('set-cookie')).toBe(false); // ordinary reads do not renew
  const prod = new Sessions(f.connection.store, settings, { create: i => fences.create(i), rotate: (e, s, d) => fences.rotate(e, s, d), revoke: e => fences.revoke(e), revokeAll: id => fences.revokeAll(id) }, async () => null);
  prod.bind(new Tenancy(db, { verify: async () => null }, denyAll, prod));
  const app = await createApp(config, { databaseReady: async () => true, queueReady: async () => true, close: async () => {} }, { consume: async () => ({ allowed: true, retryAfter: 1 }) }, createLogger('silent'), prod);
  await app.app.listen(0, '127.0.0.1'); stops.push(app.close);
  const a = app.app.getHttpServer().address(); if (!a || typeof a === 'string') throw new Error('No address');
  expect((await fetch(`http://127.0.0.1:${a.port}/live`, { headers: { cookie: `${settings.name}=malformed` } })).status).toBe(200);
  expect((await fetch(`http://127.0.0.1:${a.port}/api/v1/issues`, { headers: { cookie: auth.cookie } })).status).toBe(404);
  const denied = await fixture({ deny: true }); expect((await denied.http('/read', await denied.login())).status).toBe(401);
});
test('fresh boundary lookup rejects deletion after middleware hydration; multiple scopes do not reread Valkey', async () => {
  const f = await fixture(), auth = await f.login();
  const before = f.lookups(); expect((await f.http('/twice', auth)).status).toBe(200);
  expect(f.lookups() - before).toBe(2); // library hydration + one fresh verifier lookup
  const raw = JSON.parse((await cache.get(f.key(auth)))!);
  expect((await f.http('/cache-disappear', auth)).status).toBe(401);
  const state = raw.state;
  expect((await fences.validate({ userId: state.userId, identityId: state.identityId, familyId: state.familyId,
    authEpoch: BigInt(state.authEpoch), generation: BigInt(state.generation), sidDigest: createHash('sha256').update(f.sid(auth)).digest('hex') })).userId).toBe(f.userId);
});
test('HTTP disconnect expires the active principal; inherited async work cannot authorize after close', async () => {
  const f = await fixture(), auth = await f.login(), held = f.hold();
  const req = httpRequest({ host: '127.0.0.1', port: f.port, path: '/held', headers: { cookie: auth.cookie } });
  req.on('error', () => {}); req.end(); await held.entered; req.destroy();
  // Observe the transport close before allowing the already-active callback to
  // try a scoped query; no instantaneous commit cancellation is claimed.
  await Bun.sleep(30); held.release();
  const until = Date.now() + 1000; while (!f.heldDenied() && Date.now() < until) await Bun.sleep(10);
  expect(f.heldDenied()).toBe(true);
});
test('timed-out rotation save never returns success; actual late cache persistence is fenced', async () => {
  let pause = false, release: (() => Promise<void>) | undefined;
  const f = await fixture({ wrap: original => {
    const delayed = new BoundedSessionStore(original, 50);
    const set = delayed.set.bind(delayed);
    delayed.set = (sid, data, done) => {
      if (!pause) { set(sid, data, done); return; }
      release = () => new Promise<void>((resolve, reject) => original.set(sid, data, error => {
        done?.(error); if (error) reject(error); else resolve();
      }));
    };
    return new BoundedSessionStore(delayed, 50);
  } });
  const auth = await f.login(); pause = true;
  const response = await f.http('/rotate', auth, 'POST'); expect(response.status).toBe(503);
  expect(response.headers.get('set-cookie')).toContain('Expires=Thu, 01 Jan 1970');
  expect(release).toBeDefined(); await release!();
  const rows = await db.client.authSessionFamily.findMany({ where: { userId: f.userId } });
  expect(rows).toHaveLength(1); expect(rows[0]!.generation).toBe(2n); expect(rows[0]!.revokedAt).not.toBeNull();
  // Every late-written record still fails fresh PG authentication. Build the
  // signed cookie using the server test's own signing secret, never client IDs.
  const keys = await cache.keys(`${settings.prefix}*`);
  const familyKeys: string[] = [];
  for (const key of keys) {
    const payload = JSON.parse((await cache.get(key))!);
    if (payload.state?.familyId === rows[0]!.id) familyKeys.push(key);
  }
  expect(familyKeys.length).toBeGreaterThan(0);
  for (const key of familyKeys) {
    const sid = key.slice(settings.prefix.length), signature = createHmac('sha256', settings.secrets[0]!).update(sid).digest('base64').replace(/=+$/, '');
    const cookie = `${settings.name}=${encodeURIComponent(`s:${sid}.${signature}`)}`;
    expect((await f.http('/read', undefined, 'GET', { cookie })).status).toBe(401);
  }
  expect((await f.http('/read', auth)).status).toBe(401);
});
test('timed-out establishment delivers no new SID, revokes its family, and late save remains unusable', async () => {
  let release: (() => Promise<void>) | undefined;
  const f = await fixture({ wrap: original => {
    const adapter = new BoundedSessionStore(original, 50), set = adapter.set.bind(adapter);
    adapter.set = (sid, data, done) => {
      if (data.state?.kind !== 'authenticated') { set(sid, data, done); return; }
      release = () => new Promise<void>((resolve, reject) => original.set(sid, data, error => {
        done?.(error); if (error) reject(error); else resolve();
      }));
    };
    return new BoundedSessionStore(adapter, 50);
  } });
  const bootstrap = await f.http('/bootstrap'), anonymous = { cookie: f.cookieOf(bootstrap), csrf: (await bootstrap.json()).csrf as string };
  const response = await f.http('/establish', anonymous, 'POST'); expect(response.status).toBe(503);
  expect(response.headers.get('set-cookie')).toContain('Expires=Thu, 01 Jan 1970');
  await release!();
  const family = await db.client.authSessionFamily.findFirstOrThrow({ where: { userId: f.userId } }); expect(family.revokedAt).not.toBeNull();
  expect((await f.http('/read', anonymous)).status).toBe(401);
});
test('primary fences reject forged cache identities/generations and mixed SID evidence; cookie flags are clamped', async () => {
  const f = await fixture(), auth = await f.login(), raw = await cache.get(f.key(auth)), payload = JSON.parse(raw!);
  for (const state of [{ ...payload.state, userId: randomUUID() }, { ...payload.state, generation: '999' }, { ...payload.state, authEpoch: '999' }, { ...payload.state, grants: ['ADMIN'] }]) {
    await cache.set(f.key(auth), JSON.stringify({ ...payload, state }), 'EX', 60);
    expect((await f.http('/read', auth)).status).toBe(401);
  }
  payload.cookie = { ...payload.cookie, httpOnly: false, secure: false, sameSite: 'none', domain: '.evil.example', path: '/evil' };
  await cache.set(f.key(auth), JSON.stringify(payload), 'EX', 60);
  const response = await f.http('/rotate', auth, 'POST'); expect(response.status).toBe(200);
  const cookie = response.headers.get('set-cookie')!;
  expect(cookie).toContain('HttpOnly'); expect(cookie).toContain('SameSite=Lax'); expect(cookie).toContain('Path=/'); expect(cookie).not.toContain('Domain=');
});
test('production privilege rejection forbids owner credentials; restricted runtime role passes without DDL', async () => {
  await expect(db.assertRuntimePrivileges()).rejects.toThrow('Unsafe database runtime privileges');
  const role = `be00h_${randomUUID().replaceAll('-', '')}`, password = randomBytes(32).toString('hex');
  const runtimeUrl = new URL(dbUrl); runtimeUrl.username = role; runtimeUrl.password = password;
  const runtime = new Database(runtimeUrl.toString());
  await admin.client.$executeRawUnsafe(`CREATE ROLE "${role}" LOGIN PASSWORD '${password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS`);
  try {
    await db.client.$executeRawUnsafe(`GRANT USAGE ON SCHEMA public TO "${role}"`);
    await runtime.connect(); await runtime.assertRuntimePrivileges();
    await expect(Promise.resolve(runtime.client.$executeRawUnsafe('CREATE TABLE public.forbidden_runtime_ddl (id integer)'))).rejects.toThrow();
    await db.client.$executeRawUnsafe(`GRANT CREATE ON SCHEMA public TO "${role}"`);
    await expect(runtime.assertRuntimePrivileges()).rejects.toThrow('Unsafe database runtime privileges');
  } finally {
    await runtime.close(); await db.client.$executeRawUnsafe(`DROP OWNED BY "${role}"`); await admin.client.$executeRawUnsafe(`DROP ROLE "${role}"`);
  }
});

async function command(args: string[], env = process.env) {
  const child = Bun.spawn(args, { env, stdout: 'pipe', stderr: 'pipe' });
  let timeout = false; const timer = setTimeout(() => { timeout = true; child.kill('SIGKILL'); }, 10000);
  try {
    const [exit, out] = await Promise.all([child.exited, new Response(child.stdout).text(), new Response(child.stderr).text()]);
    if (timeout || exit !== 0) throw new Error('Owned verification command failed; configuration withheld');
    return out.trim();
  } finally { clearTimeout(timer); }
}
test('real isolated blocked Valkey read returns unavailable; late SET still executes after deadline', async () => {
  const container = `unblok-be00h-${randomUUID()}`, password = randomBytes(32).toString('hex');
  await command(['docker', 'run', '-d', '--name', container, '-p', '127.0.0.1::6379', '-e', 'BE00H_PASSWORD', '--entrypoint', '/bin/sh',
    'valkey/valkey:8.1.3-alpine@sha256:d827e7f7552cdee40cc7482dbae9da020f42bc47669af6f71182a4ef76a22773', '-ec',
    'exec valkey-server --requirepass "$BE00H_PASSWORD" --save "" --appendonly no'], { ...process.env, BE00H_PASSWORD: password });
  let conn: Awaited<ReturnType<typeof connectSessionStore>> | undefined;
  let controller: ReturnType<typeof createRedis> | undefined;
  try {
    const port = (await command(['docker', 'port', container, '6379/tcp'])).split(':').at(-1)!;
    const url = `redis://:${password}@127.0.0.1:${port}/0`;
    controller = createRedis(url); await controller.connect();
    conn = await connectSessionStore(url, settings);
    const sid = randomBytes(32).toString('base64url'), now = Date.now();
    const data = { cookie: new (await import('express-session')).default.Cookie(), state: {
      version: 1 as const, kind: 'anonymous' as const, csrf: randomBytes(32).toString('base64url'), issuedAt: now, idleExpiresAt: now + 10000, absoluteExpiresAt: now + 10000,
    } };
    await controller.call('CLIENT', 'PAUSE', '1200', 'ALL');
    let callbacks = 0;
    const error = await new Promise(resolve => conn!.store.set(sid, data, e => { callbacks++; resolve(e); }));
    expect(error).toBeInstanceOf(AuthUnavailableError);
    await Bun.sleep(650); expect(await controller.get(settings.prefix + sid)).not.toBeNull(); expect(callbacks).toBe(1);
    await controller.call('CLIENT', 'PAUSE', '1200', 'ALL');
    const readError = await new Promise(resolve => conn!.store.get(sid, e => resolve(e)));
    expect(readError).toBeInstanceOf(AuthUnavailableError); await Bun.sleep(650);
  } finally { controller?.disconnect(); await conn?.close(); await command(['docker', 'rm', '-f', container]); }
}, 15000);
test('real HTTPS ingress emits __Host cookie; untrusted forwarded spoof is rejected', async () => {
  const folder = await mkdtemp(resolve(tmpdir(), 'unblok-be00h-tls-'));
  let proxy: ReturnType<typeof createTlsServer> | undefined;
  const secure = { ...settings, secure: true, name: '__Host-unblok.sid', trustedProxies: ['127.0.0.2/32'] };
  try {
    await command([process.env.BE00H_OPENSSL ?? 'C:/Program Files/Git/usr/bin/openssl.exe', 'req', '-x509', '-newkey', 'rsa:2048', '-nodes',
      '-keyout', resolve(folder, 'key.pem'), '-out', resolve(folder, 'cert.pem'), '-days', '1', '-subj', '/CN=127.0.0.1', '-addext', 'subjectAltName=IP:127.0.0.1']);
    const cert = await readFile(resolve(folder, 'cert.pem')), key = await readFile(resolve(folder, 'key.pem'));
    const f = await fixture({ settings: secure });
    proxy = createTlsServer({ cert, key }, (incoming, outgoing) => {
      const request = httpRequest({ host: '127.0.0.1', localAddress: '127.0.0.2', port: f.port, path: incoming.url, method: incoming.method,
        headers: { ...incoming.headers, 'x-forwarded-proto': 'https' } }, response => {
        outgoing.writeHead(response.statusCode!, response.headers); response.pipe(outgoing);
      }); request.on('error', () => { outgoing.statusCode = 502; outgoing.end(); }); incoming.pipe(request);
    });
    await new Promise<void>(resolve => proxy!.listen(0, '127.0.0.1', resolve));
    const address = proxy.address(); if (!address || typeof address === 'string') throw new Error('No TLS address');
    const response = await new Promise<{ status: number; cookie: string }>((resolve, reject) => {
      const request = tlsRequest({ host: '127.0.0.1', port: address.port, path: '/bootstrap', ca: cert, rejectUnauthorized: true,
        headers: { origin: config.CORS_ORIGINS[0]!, 'x-forwarded-proto': 'http' } }, response => {
        response.resume(); response.on('end', () => resolve({ status: response.statusCode!, cookie: response.headers['set-cookie']?.[0] ?? '' }));
      }); request.on('error', reject); request.end();
    });
    expect(response.status).toBe(200); expect(response.cookie).toStartWith('__Host-unblok.sid=');
    for (const flag of ['HttpOnly', 'Secure', 'SameSite=Lax', 'Path=/']) expect(response.cookie).toContain(flag);
    expect(response.cookie).not.toContain('Domain=');
    expect((await f.http('/bootstrap', undefined, 'GET', { 'x-forwarded-proto': 'https' })).status).toBe(403);
    const disabled = await fixture({ settings: { ...secure, trustedProxies: [] } });
    expect((await disabled.http('/bootstrap', undefined, 'GET', { 'x-forwarded-proto': 'https' })).status).toBe(403);
  } finally {
    if (proxy) await new Promise<void>((resolve, reject) => proxy!.close(e => e ? reject(e) : resolve()));
    if (dirname(folder) !== resolve(tmpdir()) || !basename(folder).startsWith('unblok-be00h-tls-')) throw new Error('Unsafe TLS cleanup path');
    await rm(folder, { recursive: true, force: true });
  }
}, 15000);
test('strict origin and synchronizer token reject missing/null/suffix/origin/token/form requests independently of SameSite', async () => {
  const f = await fixture(), auth = await f.login();
  for (const origin of ['', 'null', 'https://evil.example', `${config.CORS_ORIGINS[0]}.evil`]) {
    expect((await f.http('/write', auth, 'POST', { origin })).status).toBe(403);
  }
  for (const token of ['', 'a'.repeat(43), `${auth.csrf},${auth.csrf}`]) expect((await f.http('/write', auth, 'POST', { 'x-csrf-token': token })).status).toBe(403);
  expect((await f.http('/write', auth, 'POST', { 'content-type': 'text/plain' })).status).toBe(403);
  expect((await f.http('/bootstrap', undefined, 'GET', { origin: '' })).status).toBe(401);
  expect((await f.http('/bootstrap')).headers.get('cache-control')).toBe('no-store');
});
test('CORS explicitly permits CSRF header, credentials only on opted-in origins; wildcard/null denied', async () => {
  const f = await fixture({ settings: { ...settings, credentials: true } });
  const response = await f.http('/read', undefined, 'OPTIONS', { 'access-control-request-method': 'POST', 'access-control-request-headers': 'content-type,x-csrf-token' });
  expect(response.status).toBe(204); expect(response.headers.get('access-control-allow-credentials')).toBe('true');
  expect(response.headers.get('access-control-allow-origin')).toBe(config.CORS_ORIGINS[0]!);
  const normal = await fixture(); expect((await normal.http('/bootstrap')).headers.has('access-control-allow-credentials')).toBe(false);
  expect((await f.http('/read', undefined, 'OPTIONS', { origin: '*', 'access-control-request-method': 'POST' })).status).toBe(403);
});
test('malformed/forged/duplicate cookies and client identity claims never authenticate', async () => {
  const f = await fixture(), auth = await f.login();
  for (const cookie of [`${settings.name}=s:forged.signature`, `${settings.name}=%XX`, auth.cookie.slice(0, -4) + 'AAAA', `${auth.cookie}; ${auth.cookie}`, `${settings.name}=${'x'.repeat(8200)}`]) {
    expect([400, 401]).toContain((await f.http('/read', undefined, 'GET', { cookie })).status);
  }
  expect((await f.http('/forged-identity', auth, 'POST')).status).toBe(401);
  expect(await f.sessions.verify({ userId: f.userId })).toBeNull();
});
test('cache deletion/TTL/expiry reject subsequent requests and reused principals while PG authority remains', async () => {
  const f = await fixture(), auth = await f.login(); expect((await f.http('/capture', auth)).status).toBe(200);
  const raw = await cache.get(f.key(auth)); expect(raw).toBeTruthy(); await cache.del(f.key(auth));
  expect((await f.http('/read', auth)).status).toBe(401); expect((await f.http('/reuse')).status).toBe(401);
  await cache.set(f.key(auth), raw!, 'PX', 60); await Bun.sleep(90); expect((await f.http('/read', auth)).status).toBe(401);
  const payload = JSON.parse(raw!) as { state: { idleExpiresAt: number } }; payload.state.idleExpiresAt = Date.now() - 1;
  await cache.set(f.key(auth), JSON.stringify(payload), 'EX', 60); expect((await f.http('/read', auth)).status).toBe(401);
});
test('idle and absolute expiration cannot be revived by extending cache state; ordinary reads do not renew', async () => {
  for (const profile of [{ idleMs: 500, absoluteMs: 10000 }, { idleMs: 10000, absoluteMs: 500 }]) {
    const f = await fixture({ settings: { ...settings, ...profile } }), auth = await f.login();
    const key = f.key(auth), raw = await cache.get(key), original = JSON.parse(raw!);
    expect((await f.http('/read', auth)).status).toBe(200);
    const after = JSON.parse((await cache.get(key))!);
    expect(after.state.idleExpiresAt).toBe(original.state.idleExpiresAt); expect(after.state.absoluteExpiresAt).toBe(original.state.absoluteExpiresAt);
    await Bun.sleep(550); expect((await f.http('/read', auth)).status).toBe(401);
    original.state.idleExpiresAt = Date.now() + 10000; original.state.absoluteExpiresAt = Date.now() + 10000;
    await cache.set(key, JSON.stringify(original), 'EX', 60);
    expect((await f.http('/read', auth)).status).toBe(401);
  }
});
test('rotation preserves absolute expiry, invalidates predecessor/mixed evidence and refreshes CSRF', async () => {
  const f = await fixture(), auth = await f.login(), old = JSON.parse((await cache.get(f.key(auth)))!);
  const response = await f.http('/rotate', auth, 'POST'); expect(response.status).toBe(200);
  const rotated = { cookie: f.cookieOf(response), csrf: (await response.json()).csrf as string };
  expect(rotated.cookie).not.toBe(auth.cookie); expect(rotated.csrf).not.toBe(auth.csrf);
  const current = JSON.parse((await cache.get(f.key(rotated)))!); expect(current.state.absoluteExpiresAt).toBe(old.state.absoluteExpiresAt);
  expect(BigInt(current.state.generation)).toBe(BigInt(old.state.generation) + 1n);
  await cache.set(f.key(auth), JSON.stringify(old), 'EX', 60); expect((await f.http('/read', auth)).status).toBe(401);
  expect((await f.http('/read', rotated)).status).toBe(200);
  expect((await f.http('/write', rotated, 'POST', { 'x-csrf-token': auth.csrf })).status).toBe(403);
});
test('logout and logout-all durably deny late cache resurrection and clear host-only cookie', async () => {
  for (const path of ['/logout', '/logout-all']) {
    const f = await fixture(), auth = await f.login(), raw = await cache.get(f.key(auth));
    const response = await f.http(path, auth, 'POST'); expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ revocation: 'confirmed', cleanup: 'confirmed' });
    expect(response.headers.get('set-cookie')).toContain('HttpOnly'); expect(response.headers.get('set-cookie')).not.toContain('Domain=');
    await cache.set(f.key(auth), raw!, 'EX', 60); expect((await f.http('/read', auth)).status).toBe(401);
  }
});
test('confirmed logout remains revoked when bounded deletion times out and later SET resurrects cache', async () => {
  let deleteHeld = false, lateDelete: (() => void) | undefined;
  const f = await fixture({ wrap: original => {
    const adapter = new BoundedSessionStore(original, 50);
    const destroy = adapter.destroy.bind(adapter);
    adapter.destroy = (sid, done) => {
      if (!deleteHeld) { destroy(sid, done); return; }
      const underlying = new BoundedSessionStore(original, 50);
      underlying.destroy = (id, callback) => { lateDelete = () => original.destroy(id, callback); };
      new BoundedSessionStore(underlying, 50).destroy(sid, done);
    };
    return adapter;
  } });
  const auth = await f.login(), raw = await cache.get(f.key(auth)); deleteHeld = true;
  const response = await f.http('/logout', auth, 'POST'); expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ revocation: 'confirmed', cleanup: 'unconfirmed' }); lateDelete?.();
  await cache.set(f.key(auth), raw!, 'EX', 60); expect((await f.http('/read', auth)).status).toBe(401);
});
test('PostgreSQL outage denies live cached authority and prevents protected HTTP callbacks', async () => {
  const f = await fixture(), auth = await f.login();
  await admin.client.$executeRawUnsafe(`ALTER DATABASE "${name}" ALLOW_CONNECTIONS false`);
  await admin.client.$queryRaw`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = ${name}`;
  try { expect((await f.http('/read', auth)).status).toBe(503); expect((await f.http('/write', auth, 'POST')).status).toBe(503); }
  finally { await admin.client.$executeRawUnsafe(`ALTER DATABASE "${name}" ALLOW_CONNECTIONS true`); await db.close(); await db.connect(); }
  expect((await db.client.issue.findUniqueOrThrow({ where: { workspaceId_id: { workspaceId: f.workspaceId, id: f.issueId } } })).title).toBe('Before');
}, 15000);
test('Valkey outage fails closed while independent liveness remains available', async () => {
  const f = await fixture(), auth = await f.login(); await f.connection.close();
  expect((await f.http('/read', auth)).status).toBe(503); expect((await f.http('/write', auth, 'POST')).status).toBe(503);
});
test('HTTP protected write holds PG fences until commit; concurrent logout acknowledges afterwards', async () => {
  const f = await fixture(), auth = await f.login(), held = f.hold();
  const write = f.http('/write', auth, 'POST'); await held.entered;
  let finished = false; const revoke = f.http('/logout', auth, 'POST').then(r => { finished = true; return r; });
  const deadline = Date.now() + 1000; let blocked = false;
  while (Date.now() < deadline) {
    const rows = await admin.client.$queryRaw<{ blocked: boolean }[]>`SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE datname = ${name} AND cardinality(pg_blocking_pids(pid)) > 0) AS blocked`;
    if (rows[0]?.blocked) { blocked = true; break; } await Bun.sleep(10);
  }
  held.release(); expect(blocked).toBe(true); expect(finished).toBe(false);
  expect((await write).status).toBe(200); expect((await revoke).status).toBe(200);
  expect((await f.http('/write', auth, 'POST')).status).toBe(401);
  expect((await db.client.issue.findUniqueOrThrow({ where: { workspaceId_id: { workspaceId: f.workspaceId, id: f.issueId } } })).title).toBe('After');
});
