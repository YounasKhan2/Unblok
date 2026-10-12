import 'reflect-metadata';
import { afterAll, beforeAll, expect, test } from 'bun:test';
import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { Database, AccountCredentials, AuthFences, Tenancy, TenantAccessError, denyAll, type VerifiedPrincipal } from '@unblok/database';
import { createLogger, createRedis, loadApiConfig, withDeadline } from '@unblok/backend-runtime';
import { createApp } from '../src/app';
import { RedisRateLimiter } from '../src/security';
import { Sessions, connectSessionStore, sessionSettings } from '../src/modules/sessions';
import { Authentication, AuthenticationLimits, Passwords } from '../src/modules/auth';

import { Workspaces, WorkspaceLimits } from '../src/modules/workspaces';
const workspaceKeys = { active: 'v1', cursors: { v1: randomBytes(32).toString('hex') }, idempotency: randomBytes(32).toString('hex') };
const root = resolve(import.meta.dir, '../../..'), config = loadApiConfig(process.env);
const admin = new Database(config.DATABASE_URL), name = `unblok_ws01_test_${randomUUID().replaceAll('-', '')}`;
const url = new URL(config.DATABASE_URL); url.pathname = `/${name}`;
const database = new Database(url.toString()), fences = new AuthFences(database), cache = createRedis(config.REDIS_URL);
const ownedPrefix = `ws01:test:${randomUUID()}:`;
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
async function fixture(options: { afterConfirmation?: () => Promise<void>; redisUrl?: string; keys?: typeof workspaceKeys } = {}) {
  const settings = { ...sessionSettings(config, { SESSION_SECRETS: randomBytes(32).toString('hex'), SESSION_NAMESPACE: 'test' }), prefix: ownedPrefix + randomUUID() + ':' };
  const rateCache = options.redisUrl ? createRedis(options.redisUrl) : cache;
  if (options.redisUrl) { rateCache.on('error', () => {}); await rateCache.connect(); }
  const connection = await connectSessionStore(options.redisUrl ?? config.REDIS_URL, settings);
  const credentials = new AccountCredentials(database), limits = new AuthenticationLimits(rateCache, settings.secrets[0]!, settings.prefix);
  const authentication = new Authentication({ create: i => credentials.create(i), lookup: e => credentials.lookup(e), confirm: async snapshot => {
    const valid = await credentials.confirm(snapshot); if (valid) await options.afterConfirmation?.(); return valid;
  } }, await Passwords.create(), limits);
  const sessions = new Sessions(connection.store, settings, { create: i => fences.create(i), rotate: (e, d, idle) => fences.rotate(e, d, idle), revoke: e => fences.revoke(e), retireSid: d => fences.retireSid(d), revokeAll: id => fences.revokeAll(id) }, a => authentication.resolveIdentity(a));
  const tenancy = new Tenancy(database, { verify: async () => null }, denyAll, sessions, undefined, options.keys ?? workspaceKeys);
  sessions.bind(tenancy); authentication.bind(sessions, tenancy);
  const coarse = new RedisRateLimiter(rateCache, 120, 60000, settings.prefix + 'coarse:');
  const server = await createApp(config, { databaseReady: () => database.ready(), queueReady: async () => await rateCache.ping() === 'PONG', close: async () => { await connection.close(); if (options.redisUrl) rateCache.disconnect(); } }, coarse, createLogger('silent'), sessions, authentication, new Workspaces(sessions, tenancy, new WorkspaceLimits(rateCache, settings.secrets[0]!, settings.prefix)));
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

async function account() { const f = await fixture(), { email } = await f.signup(), client = await f.login(email);
  const user = await database.client.passwordCredential.findUniqueOrThrow({ where: { email }, include: { identity: true } });
  return { f, client, userId: user.identity.userId };
}
const input = () => ({ name: 'Workspace', slug: 'ws-' + randomUUID() });
const create = (f: Awaited<ReturnType<typeof fixture>>, client: Client, body = input(), key = randomUUID()) => f.http('/api/v1/workspaces', 'POST', client, body, { 'idempotency-key': key });

// Test-owned transaction proxies observe real PostgreSQL calls; no production
// hook, mock SQL result, isolation change or deadline change is installed.
type Phase = 'pointer' | 'workspace' | 'revision' | 'reserve' | 'ledger';
type Trace = { transaction: number; events: { phase: Phase; stage: 'start' | 'return'; rows?: number }[]; outcome?: string; prismaCode?: string; sqlState?: string };
const correctionObservations: unknown[] = [];
function latch() { let release!: () => void; const promise = new Promise<void>(ok => release = ok); return { promise, release }; }
function interceptTransactions(hook: (phase: Phase, trace: Trace, rows: number) => Promise<void>, loseAcknowledgement = false) {
  const original = database.transaction.bind(database), traces: Trace[] = []; let sequence = 0;
  database.transaction = async run => {
    let trace: Trace | undefined;
    try {
      const result = await original(tx => run(new Proxy(tx, { get(target, property) {
        if (property === '$queryRaw') return async (...args: unknown[]) => {
          const first = args[0], sql = Array.isArray(first) ? first.join(' ') : String(first && typeof first === 'object' && 'sql' in first ? first.sql : '');
          const phase: Phase | undefined = /SELECT workspace_id FROM workspace_creation_results/.test(sql) ? 'pointer'
            : /INSERT INTO workspace_creation_results/.test(sql) ? 'reserve'
              : /FROM workspace_creation_results/.test(sql) && /FOR UPDATE/.test(sql) ? 'ledger'
                : /FROM workspaces w JOIN workspace_memberships/.test(sql) ? 'workspace'
                  : /FROM workspace_discovery_revisions/.test(sql) ? 'revision' : undefined;
          if (phase === 'pointer') { trace = { transaction: ++sequence, events: [] }; traces.push(trace); }
          if (phase && trace) trace.events.push({ phase, stage: 'start' });
          const result = await Reflect.apply(target.$queryRaw, target, args);
          if (phase && trace) { const rows = Array.isArray(result) ? result.length : 0; trace.events.push({ phase, stage: 'return', rows }); await hook(phase, trace, rows); }
          return result;
        };
        const value = Reflect.get(target, property); return typeof value === 'function' ? value.bind(target) : value;
      } })));
      if (trace) {
        trace.outcome = 'COMMIT confirmed';
        if (loseAcknowledgement && trace.transaction === 1) { trace.outcome = 'COMMIT confirmed by test; acknowledgement lost to application'; throw new Error('Owned lost acknowledgement'); }
      }
      return result;
    } catch (error) {
      if (trace && !trace.outcome) {
        trace.outcome = 'transaction rejected / rolled back';
        const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
        const meta = error && typeof error === 'object' && 'meta' in error ? error.meta : undefined;
        const sql = meta && typeof meta === 'object' && 'code' in meta ? meta.code : undefined;
        if (typeof code === 'string') trace.prismaCode = code;
        if (typeof sql === 'string') trace.sqlState = sql;
      }
      throw error;
    }
  };
  return { traces, restore: () => { database.transaction = original; } };
}
async function waitForLock(fragment: string) {
  for (let i = 0; i < 100; i++) {
    const rows = await admin.client.$queryRaw<{ wait: string | null }[]>`SELECT wait_event AS wait FROM pg_stat_activity
      WHERE datname=${name} AND wait_event_type='Lock' AND query LIKE ${'%' + fragment + '%'} LIMIT 1`;
    if (rows[0]?.wait) return rows[0].wait;
    await Bun.sleep(5);
  }
  throw new Error('Expected real PostgreSQL lock waiter not observed');
}
afterAll(async () => { if (process.env.WS_CORRECTION_EVIDENCE_PATH) await Bun.write(process.env.WS_CORRECTION_EVIDENCE_PATH,
  JSON.stringify({ reviewedHead: 'bfdd844e60af598ecec26146399e0cf15aa08c93', observations: correctionObservations }, null, 2)); });

test('migration replay and complete Prisma schema parity', async () => {
  expect(await prisma(['migrate', 'deploy', '--schema', 'packages/database/prisma/schema.prisma'])).toContain('No pending migrations');
  expect(await prisma(['migrate', 'diff', '--from-schema-datasource', 'packages/database/prisma/schema.prisma', '--to-schema-datamodel', 'packages/database/prisma/schema.prisma', '--exit-code'])).toContain('No difference');
});
test('atomic first workspace, strict self projection, durable replay and payload mismatch', async () => {
  const { f, client, userId } = await account(), body = input(), key = randomUUID();
  const first = await create(f, client, body, key); expect(first.status).toBe(201); const result = await first.json();
  expect(result.initialAdministrator.role).toBe('ADMIN'); expect(result.initialAdministrator.membershipStatus).toBe('ACTIVE');
  expect(result.initialAdministrator.capabilities).toEqual({ readWorkspace: true, listMembers: false, inviteMembers: false, createTeam: false, writeIssues: false, writeDependencies: false, completeDependentIssues: false });
  expect(await database.client.workspaceMembership.count({ where: { userId, workspaceId: result.workspace.id, role: 'ADMIN', status: 'ACTIVE' } })).toBe(1);
  const replay = await create(f, client, body, key); expect(replay.status).toBe(201); expect(await replay.json()).toEqual(result);
  expect((await create(f, client, { ...body, name: 'Changed' }, key)).status).toBe(409);
  const detail = await f.http('/api/v1/workspaces/' + result.workspace.id, 'GET', client); expect(detail.status).toBe(200);
  expect(detail.headers.get('cache-control')).toBe('private, no-store'); expect(JSON.stringify(await detail.json()).length).toBeLessThan(65536);
  expect(await (await f.http('/api/v1/workspaces/' + result.workspace.id + '/me', 'GET', client)).json()).toEqual(result.initialAdministrator);
});
test('overlapping same key and duplicate slugs cannot create duplicate effects', async () => {
  const { f, client } = await account(), body = input(), key = randomUUID();
  const responses = await Promise.all([create(f, client, body, key), create(f, client, body, key)]);
  expect(responses.some(r => r.status === 201)).toBe(true); for (const r of responses) expect(r.status).toBeOneOf([201, 409]);
  expect((await create(f, client, body, key)).status).toBe(201);
  expect(await database.client.workspace.count({ where: { slug: body.slug } })).toBe(1);
  expect(await database.client.workspaceCreationResult.count({ where: { requestKey: key } })).toBe(1);
  const collision = await Promise.all([create(f, client, body), create(f, client, body)]); for (const r of collision) expect(r.status).toBe(409);
});
test('different keys racing a new slug yield one workspace and one administrator', async () => {
  const a=await account(),body=input(); const responses=await Promise.all([create(a.f,a.client,body),create(a.f,a.client,body)]);
  expect(responses.map(r=>r.status).sort()).toEqual([201,409]);
  const workspace=await database.client.workspace.findUniqueOrThrow({where:{slug:body.slug}});
  expect(await database.client.workspaceMembership.count({where:{workspaceId:workspace.id}})).toBe(1);
});
test('PostgreSQL refuses committed incomplete reservations and immutable ledger tampering', async () => {
  const a=await account(),key=randomUUID(),body=input();
  await expect(Promise.resolve(database.client.$executeRaw`INSERT INTO workspace_creation_results(id,actor_id,scope_key,request_key,payload_digest,retain_until)
    VALUES (${randomUUID()}::uuid,${a.userId}::uuid,${'account:'+a.userId},${key}::uuid,${'a'.repeat(64)},statement_timestamp()+interval '24 hours')`)).rejects.toThrow();
  expect(await database.client.workspaceCreationResult.count({where:{requestKey:key}})).toBe(0);
  expect((await create(a.f,a.client,body,key)).status).toBe(201);
  await expect(Promise.resolve(database.client.$executeRaw`UPDATE workspace_creation_results SET payload_digest=${'b'.repeat(64)} WHERE request_key=${key}::uuid`)).rejects.toThrow();
});
test('failed administrator insertion rolls back workspace and ledger', async () => {
  const { f, client, userId } = await account(), body = input();
  // Owned database only: induce a real membership persistence failure.
  await database.client.$executeRawUnsafe(`CREATE FUNCTION ws_test_reject() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.user_id = '${userId}'::uuid THEN RAISE EXCEPTION 'owned test'; END IF; RETURN NEW; END $$`);
  await database.client.$executeRawUnsafe('CREATE TRIGGER z_ws_test_reject BEFORE INSERT ON workspace_memberships FOR EACH ROW EXECUTE FUNCTION ws_test_reject()');
  try { expect((await create(f, client, body)).status).toBe(503); expect(await database.client.workspace.count({ where: { slug: body.slug } })).toBe(0); }
  finally { await database.client.$executeRawUnsafe('DROP TRIGGER z_ws_test_reject ON workspace_memberships'); await database.client.$executeRawUnsafe('DROP FUNCTION ws_test_reject()'); }
});
test('lost acknowledgement after COMMIT reconciles only the original key', async () => {
  const { f, client } = await account(), body = input(), key = randomUUID(), original = database.transaction.bind(database);
  let lost = false;
  database.transaction = async run => { const result = await original(run); if (!lost && result && typeof result === 'object' && 'initialAdministrator' in result) { lost = true; throw new Error('lost acknowledgement'); } return result; };
  try { expect((await create(f, client, body, key)).status).toBe(503); expect(lost).toBe(true); expect((await create(f, client, body, key)).status).toBe(201);
    expect(await database.client.workspace.count({ where: { slug: body.slug } })).toBe(1); }
  finally { database.transaction = original; }
});
test('anonymous, CSRF-invalid, malformed key/body and duplicate query denial', async () => {
  const { f, client } = await account(); expect((await f.http('/api/v1/workspaces')).status).toBe(401);
  const anonymous = await f.bootstrap(); expect((await create(f, anonymous)).status).toBe(401);
  expect((await f.http('/api/v1/workspaces', 'POST', client, input(), { 'x-csrf-token': undefined, 'idempotency-key': randomUUID() })).status).toBe(403);
  expect((await f.http('/api/v1/workspaces', 'POST', client, input())).status).toBe(400);
  expect((await create(f, client, { ...input(), name: '' })).status).toBe(400);
  expect((await f.http('/api/v1/workspaces', 'POST', client, { ...input(), userId: randomUUID() }, { 'idempotency-key': randomUUID() })).status).toBe(400);
  expect((await f.http('/api/v1/workspaces?role=ADMIN', 'POST', client, input(), { 'idempotency-key': randomUUID() })).status).toBe(400);
  expect((await f.http('/api/v1/workspaces', 'POST', client, { ...input(), name: 'x'.repeat(3000) }, { 'idempotency-key': randomUUID() })).status).toBe(413);
  for (const query of ['limit=101', 'limit=1&limit=2', 'sort=created_asc', 'userId=' + randomUUID(), 'after=forged']) expect((await f.http('/api/v1/workspaces?' + query, 'GET', client)).status).toBe(400);
});
test('foreign, suspended and revoked memberships deny; archived approved reads and observer hints', async () => {
  const a = await account(), b = await account(), result = await (await create(a.f, a.client)).json(), ws = result.workspace.id;
  for (const suffix of ['', '/me']) expect((await b.f.http('/api/v1/workspaces/' + ws + suffix, 'GET', b.client)).status).toBe(404);
  const member = await database.client.workspaceMembership.create({ data: { workspaceId: ws, userId: b.userId, role: 'OBSERVER', status: 'ACTIVE' } });
  expect((await b.f.http('/api/v1/workspaces/' + ws, 'GET', b.client)).status).toBe(200);
  await database.client.workspaceMembership.update({ where: { workspaceId_id: { workspaceId: ws, id: member.id } }, data: { status: 'SUSPENDED' } });
  expect((await b.f.http('/api/v1/workspaces/' + ws, 'GET', b.client)).status).toBe(404);
  expect((await b.f.http('/api/v1/workspaces', 'GET', b.client).then(r => r.json())).items).toHaveLength(0);
  await database.client.workspace.update({ where: { id: ws }, data: { status: 'ARCHIVED' } });
  expect((await a.f.http('/api/v1/workspaces/' + ws, 'GET', a.client)).status).toBe(200);
  await fences.revokeAll(a.userId); expect((await a.f.http('/api/v1/workspaces/' + ws, 'GET', a.client)).status).toBe(401);
});
test('pagination comparator, query and actor binding, signature and stale revision', async () => {
  const a = await account(), b = await account(); for (let i = 0; i < 3; i++) expect((await create(a.f, a.client)).status).toBe(201);
  const page = await a.f.http('/api/v1/workspaces?limit=1', 'GET', a.client).then(r => r.json()); expect(page.items).toHaveLength(1); expect(page.page.hasMore).toBe(true);
  const after = encodeURIComponent(page.page.nextCursor);
  const next = await a.f.http('/api/v1/workspaces?limit=1&after=' + after, 'GET', a.client).then(r => r.json()); expect(next.items[0].id > page.items[0].id).toBe(true);
  for (const query of ['limit=2', 'limit=1&sort=workspace_desc']) expect((await a.f.http('/api/v1/workspaces?' + query + '&after=' + after, 'GET', a.client)).status).toBe(400);
  expect((await b.f.http('/api/v1/workspaces?limit=1&after=' + after, 'GET', b.client)).status).toBe(400);
  const token = page.page.nextCursor as string, tampered = token.slice(0, -1) + (token.endsWith('A') ? 'B' : 'A');
  expect((await a.f.http('/api/v1/workspaces?limit=1&after=' + tampered, 'GET', a.client)).status).toBe(400);
  expect((await create(a.f, a.client)).status).toBe(201);
  const stale = await a.f.http('/api/v1/workspaces?limit=1&after=' + after, 'GET', a.client); expect(stale.status).toBe(409); expect((await stale.json()).error.code).toBe('CURSOR_STALE');
});
test('escaped principals and unavailable primary deny', async () => {
  const { f, client } = await account(); await expect(f.tenancy.createWorkspace(Object.freeze({}) as VerifiedPrincipal, { ...input(), key: randomUUID() })).rejects.toBeInstanceOf(TenantAccessError);
  const original = database.transaction.bind(database); database.transaction = async () => { throw new Error('primary unavailable'); };
  try { expect((await create(f, client)).status).toBe(503); expect((await f.http('/api/v1/workspaces', 'GET', client)).status).toBe(503); }
  finally { database.transaction = original; }
});

test('expired result becomes a durable tombstone and never reexecutes', async () => {
  const { f, client } = await account(), body = input(), key = randomUUID(); expect((await create(f, client, body, key)).status).toBe(201);
  // Owned test clock preparation; never used by production code.
  await database.client.$executeRawUnsafe('ALTER TABLE workspace_creation_results DISABLE TRIGGER workspace_creation_immutable');
  try { await database.client.$executeRaw`UPDATE workspace_creation_results SET completed_at=statement_timestamp()-interval '25 hours',retain_until=statement_timestamp()-interval '1 hour' WHERE request_key=${key}::uuid`; }
  finally { await database.client.$executeRawUnsafe('ALTER TABLE workspace_creation_results ENABLE TRIGGER workspace_creation_immutable'); }
  for (let i = 0; i < 2; i++) { const response = await create(f, client, body, key); expect(response.status).toBe(409); expect((await response.json()).error.code).toBe('IDEMPOTENCY_RESULT_EXPIRED'); }
  expect((await database.client.workspaceCreationResult.findFirstOrThrow({ where: { requestKey: key } })).result).toBeNull();
  expect(await database.client.workspace.count({ where: { slug: body.slug } })).toBe(1);
});
test('cursor rotation retains previous verification key, retirement and expiry reject', async () => {
  const a = await account(); for (let i = 0; i < 2; i++) expect((await create(a.f, a.client)).status).toBe(201);
  const email = (await database.client.user.findUniqueOrThrow({ where: { id: a.userId } })).email!;
  const page = await a.f.http('/api/v1/workspaces?limit=1', 'GET', a.client).then(r => r.json());
  const path = '/api/v1/workspaces?limit=1&after=' + page.page.nextCursor;
  const nextKey = randomBytes(32).toString('hex');
  const rotated = await fixture({ keys: { active: 'v2', cursors: { v1: workspaceKeys.cursors.v1, v2: nextKey } as typeof workspaceKeys.cursors, idempotency: workspaceKeys.idempotency } });
  expect((await rotated.http(path, 'GET', await rotated.login(email))).status).toBe(200);
  const retired = await fixture({ keys: { active: 'v2', cursors: { v2: nextKey } as unknown as typeof workspaceKeys.cursors, idempotency: workspaceKeys.idempotency } });
  expect((await retired.http(path, 'GET', await retired.login(email))).status).toBe(400);
  const payload = JSON.parse(Buffer.from(page.page.nextCursor.split('.')[0], 'base64url').toString()); payload.issued = Date.now()-900001; payload.expires = Date.now()-1;
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const expired = encoded+'.'+createHmac('sha256',Buffer.from(workspaceKeys.cursors.v1,'hex')).update('unblok-api-cursor-v1\0'+encoded).digest('base64url');
  expect((await a.f.http('/api/v1/workspaces?limit=1&after='+expired,'GET',a.client)).status).toBe(400);
});
test('maximum page is bounded to100, UUID ordering and query plans use owned data', async () => {
  const a = await account(), ids = Array.from({ length: 105 }, () => randomUUID()).sort();
  await database.client.workspace.createMany({ data: ids.map(id => ({ id, name: 'Plan', slug: 'plan-'+id })) });
  await database.client.workspaceMembership.createMany({ data: ids.map(workspaceId => ({ workspaceId, userId: a.userId, role: 'ADMIN' as const, status: 'ACTIVE' as const })) });
  const page = await a.f.http('/api/v1/workspaces?limit=100','GET',a.client).then(r=>r.json()); expect(page.items).toHaveLength(100); expect(page.items.map((r:{id:string})=>r.id)).toEqual(ids.slice(0,100));
  const end = await a.f.http('/api/v1/workspaces?limit=100&after='+page.page.nextCursor,'GET',a.client).then(r=>r.json()); expect(end.items).toHaveLength(5); expect(end.page).toEqual({hasMore:false,nextCursor:null});
  const reverse = await a.f.http('/api/v1/workspaces?limit=100&sort=workspace_desc','GET',a.client).then(r=>r.json()); expect(reverse.items.map((r:{id:string})=>r.id)).toEqual([...ids].reverse().slice(0,100));
  const plan = await database.client.$queryRaw`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) SELECT w.id,w.slug,w.name,w.status,m.role FROM workspace_memberships m JOIN workspaces w ON w.id=m.workspace_id WHERE m.user_id=${a.userId}::uuid AND m.status='ACTIVE' ORDER BY w.id LIMIT 101 FOR SHARE OF w`;
  const detailPlan = await database.client.$queryRaw`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) SELECT w.id,w.slug,w.name,w.status,m.role FROM workspaces w JOIN workspace_memberships m ON m.workspace_id=w.id AND m.user_id=${a.userId}::uuid WHERE w.id=${ids[0]}::uuid AND m.status='ACTIVE' FOR SHARE OF w`;
  expect(JSON.stringify(plan)).toContain('Limit'); expect(JSON.stringify(detailPlan)).toContain('Index');
  if(process.env.WS_EVIDENCE_PATH) await Bun.write(process.env.WS_EVIDENCE_PATH,JSON.stringify({dataset:{visibleMemberships:105},list:plan,detail:detailPlan},null,2));
});
test('discovery and detail business SELECT counts remain constant across page sizes', async () => {
  const a=await account(),ws=(await (await create(a.f,a.client)).json()).workspace.id;
  const original=database.transaction.bind(database); let selects=0;
  database.transaction=run=>original(tx=>run(new Proxy(tx,{get(target,property){
    if(property==='$queryRaw') return (...args:unknown[])=>{
      const first=args[0]; const sql=Array.isArray(first)?first.join(' '):String(first&&typeof first==='object'&&'sql' in first?first.sql:'');
      if(/FROM (?:workspace_discovery_revisions|workspaces|workspace_memberships)\b/.test(sql)) selects++;
      return Reflect.apply(target.$queryRaw,target,args);
    };
    if(property==='workspaceMembership')return new Proxy(target.workspaceMembership,{get(model,key){const value=Reflect.get(model,key); if(key==='findUniqueOrThrow')return (...args:unknown[])=>{selects++;return Reflect.apply(value,model,args);};return typeof value==='function'?value.bind(model):value;}});
    const value=Reflect.get(target,property);return typeof value==='function'?value.bind(target):value;
  }})));
  try {for(const limit of [1,100]){selects=0;expect((await a.f.http('/api/v1/workspaces?limit='+limit,'GET',a.client)).status).toBe(200);expect(selects).toBe(3);}
    selects=0;expect((await a.f.http('/api/v1/workspaces/'+ws,'GET',a.client)).status).toBe(200);expect(selects).toBe(3);
  } finally {database.transaction=original;}
});
test('real Valkey session connection loss fails closed', async () => {
  const a = await account(); await a.f.connection.close();
  expect((await a.f.http('/api/v1/workspaces','GET',a.client)).status).toBe(503);
  expect((await create(a.f,a.client)).status).toBe(503);
});
test('creation admission is account/IP bounded without granting or refunding attempts', async () => {
  const a=await account(); for(let i=0;i<5;i++) expect((await create(a.f,a.client)).status).toBe(201);
  const limited=await create(a.f,a.client); expect(limited.status).toBe(429); expect(Number(limited.headers.get('retry-after'))).toBeGreaterThan(0);
  expect(await database.client.workspaceMembership.count({where:{userId:a.userId}})).toBe(5);
});
test('worst escaped names respect UTF8 response budget with item-boundary continuation', async () => {
  const a=await account(), ids=Array.from({length:100},()=>randomUUID());
  await database.client.workspace.createMany({data:ids.map(id=>({id,name:'\u0001'.repeat(120),slug:'bytes-'+id}))});
  await database.client.workspaceMembership.createMany({data:ids.map(workspaceId=>({workspaceId,userId:a.userId,role:'ADMIN' as const,status:'ACTIVE' as const}))});
  const response=await a.f.http('/api/v1/workspaces?limit=100','GET',a.client); expect(response.status).toBe(200); const raw=await response.text(); expect(Buffer.byteLength(raw)).toBeLessThanOrEqual(65536);
  const body=JSON.parse(raw); expect(body.items.length).toBeLessThan(100); expect(body.page.hasMore).toBe(true);
});
test('real PostgreSQL new-connection outage fails closed without fallback', async () => {
  const a = await account();
  await admin.client.$executeRawUnsafe(`ALTER DATABASE "${name}" ALLOW_CONNECTIONS false`); await database.close();
  try { expect((await a.f.http('/api/v1/workspaces','GET',a.client)).status).toBe(503); }
  finally { await admin.client.$executeRawUnsafe(`ALTER DATABASE "${name}" ALLOW_CONNECTIONS true`); await database.connect(); }
});
test('concurrent revocation first rejects stale reads; earlier shared read orders before revocation', async () => {
  const a=await account(),b=await account(), ws=(await (await create(a.f,a.client)).json()).workspace.id;
  const member=await database.client.workspaceMembership.create({data:{workspaceId:ws,userId:b.userId,role:'MEMBER',status:'ACTIVE'}});
  let release!:()=>void, locked!:()=>void; const barrier=new Promise<void>(ok=>release=ok), ready=new Promise<void>(ok=>locked=ok);
  const revoke=database.transaction(async tx=>{ await tx.$queryRaw`SELECT id FROM workspaces WHERE id=${ws}::uuid FOR UPDATE`; await tx.workspaceMembership.update({where:{workspaceId_id:{workspaceId:ws,id:member.id}},data:{status:'SUSPENDED'}}); locked(); await barrier; });
  await ready; const response=b.f.http('/api/v1/workspaces/'+ws,'GET',b.client);
  // Observe the actual waiter in PostgreSQL rather than assuming a sleep orders it.
  let waiting=false; for(let i=0;i<100&&!waiting;i++){const rows=await admin.client.$queryRaw<{waiting:boolean}[]>`SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE datname=${name} AND wait_event_type='Lock' AND query LIKE '%FOR SHARE OF w%') AS waiting`; waiting=rows[0]!.waiting; if(!waiting) await Bun.sleep(5);}
  expect(waiting).toBe(true); release(); await revoke; expect((await response).status).toBeOneOf([404,409]);
  expect((await b.f.http('/api/v1/workspaces/'+ws,'GET',b.client)).status).toBe(404);
  await database.client.workspaceMembership.update({where:{workspaceId_id:{workspaceId:ws,id:member.id}},data:{status:'ACTIVE'}});
  let unlock!:()=>void, admitted!:()=>void; const hold=new Promise<void>(ok=>unlock=ok), entered=new Promise<void>(ok=>admitted=ok);
  const read=database.transaction(async tx=>{await tx.$queryRaw`SELECT id FROM workspaces WHERE id=${ws}::uuid FOR SHARE`; const membership=await tx.workspaceMembership.findUniqueOrThrow({where:{workspaceId_userId:{workspaceId:ws,userId:b.userId}}}); expect(membership.status).toBe('ACTIVE'); admitted(); await hold;});
  await entered; let revoked=false; const later=database.client.workspaceMembership.update({where:{workspaceId_id:{workspaceId:ws,id:member.id}},data:{status:'SUSPENDED'}}).then(()=>{revoked=true;});
  await Bun.sleep(20); expect(revoked).toBe(false); unlock(); await read; await later;
  expect((await b.f.http('/api/v1/workspaces/'+ws,'GET',b.client)).status).toBe(404);
});

for (const mode of ['commit', 'rollback', 'lock-deadline', 'lost-acknowledgement'] as const) {
  test(`controlled same-key pre-commit pointer race: ${mode}`, async () => {
    const a = await account(), body = input(), key = randomUUID(), reserved = latch(), release = latch(), secondPointer = latch();
    const control = interceptTransactions(async (phase, trace) => {
      if (phase === 'pointer' && trace.transaction === 2) secondPointer.release();
      if (phase === 'reserve' && trace.transaction === 1) {
        reserved.release(); await release.promise;
        if (mode === 'rollback') throw new Error('Owned confirmed rollback');
      }
    }, mode === 'lost-acknowledgement');
    const first = create(a.f, a.client, body, key); let second: Promise<Response> | undefined;
    try {
      await withDeadline(reserved.promise, 1200);
      second = create(a.f, a.client, body, key); await withDeadline(secondPointer.promise, 1200);
      const wait = await waitForLock('INSERT INTO workspace_creation_results');
      // The second pointer really read absence while the first reservation was
      // uncommitted; PostgreSQL unique arbitration, not a mocked barrier, waits.
      expect(control.traces[1]!.events.find(e => e.phase === 'pointer' && e.stage === 'return')?.rows).toBe(0);
      let timed: Response | undefined;
      if (mode === 'lock-deadline') { timed = await second; expect(timed.status).toBe(409); expect(control.traces[0]!.outcome).toBeUndefined(); }
      release.release();
      const [one, two] = await Promise.all([first, second]);
      expect(one.status).toBe(mode === 'rollback' || mode === 'lost-acknowledgement' ? 503 : 201);
      expect(two.status).toBe(mode === 'rollback' ? 201 : 409);
      const contender = control.traces[1]!;
      if (mode === 'lock-deadline') expect(contender.sqlState).toBe('55P03');
      else if (mode !== 'rollback') expect(contender.sqlState ?? contender.prismaCode).toBeOneOf(['40001', 'P2034']);
      else expect(contender.outcome).toBe('COMMIT confirmed');
      const fresh = await create(a.f, a.client, body, key); expect(fresh.status).toBe(201);
      const result = await fresh.json(); expect(result.workspace.slug).toBe(body.slug);
      expect((await create(a.f, a.client, { ...body, name: 'Different canonical body' }, key)).status).toBe(409);
      expect(await database.client.workspace.count({ where: { slug: body.slug } })).toBe(1);
      expect(await database.client.workspaceCreationResult.count({ where: { actorId: a.userId, requestKey: key } })).toBe(1);
      const replay = control.traces[2]!;
      const workspace = replay.events.findIndex(e => e.phase === 'workspace' && e.stage === 'start');
      const ledger = replay.events.findIndex(e => e.phase === 'reserve' && e.stage === 'start');
      expect(workspace).toBeGreaterThan(-1); expect(workspace).toBeLessThan(ledger);
      expect(replay.events.slice(ledger).some(e => e.phase === 'workspace')).toBe(false);
      correctionObservations.push({ scenario: 'same-key pre-commit pointer / ' + mode, wait, firstHttp: one.status, contenderHttp: two.status,
        freshSameKeyHttp: fresh.status, effects: 1, transactions: control.traces });
    } finally { release.release(); await Promise.allSettled([first, ...(second ? [second] : [])]); control.restore(); }
  });
}

async function expireResult(key: string) {
  await database.client.$executeRawUnsafe('ALTER TABLE workspace_creation_results DISABLE TRIGGER workspace_creation_immutable');
  try { await database.client.$executeRaw`UPDATE workspace_creation_results SET completed_at=statement_timestamp()-interval '25 hours',retain_until=statement_timestamp()-interval '1 hour' WHERE request_key=${key}::uuid`; }
  finally { await database.client.$executeRawUnsafe('ALTER TABLE workspace_creation_results ENABLE TRIGGER workspace_creation_immutable'); }
}

for (const order of ['replay-first', 'revocation-first'] as const) {
  test(`controlled replay membership revocation: ${order}`, async () => {
    const a = await account(), body = input(), key = randomUUID();
    const first = await create(a.f, a.client, body, key); expect(first.status).toBe(201);
    const result = await first.json(), ws = result.workspace.id as string; await keeper(ws);
    const ready = latch(), release = latch();
    const control = interceptTransactions(async (phase, trace) => {
      if (order === 'replay-first' && phase === 'ledger' && trace.transaction === 1) { ready.release(); await release.promise; }
    });
    let replay: Promise<Response> | undefined, revoke: Promise<unknown> | undefined;
    try {
      if (order === 'replay-first') {
        replay = create(a.f, a.client, body, key); await withDeadline(ready.promise, 1200);
        revoke = Promise.resolve(database.client.workspaceMembership.update({ where: { workspaceId_userId: { workspaceId: ws, userId: a.userId } }, data: { status: 'SUSPENDED' } }));
      } else {
        revoke = database.transaction(async tx => {
          await tx.$queryRaw`SELECT id FROM workspaces WHERE id=${ws}::uuid FOR UPDATE`;
          await tx.workspaceMembership.update({ where: { workspaceId_userId: { workspaceId: ws, userId: a.userId } }, data: { status: 'SUSPENDED' } });
          ready.release(); await release.promise;
        });
        await withDeadline(ready.promise, 1200); replay = create(a.f, a.client, body, key);
      }
      const wait = await waitForLock(order === 'replay-first' ? 'workspace_memberships' : 'FOR SHARE OF w');
      release.release(); const response = await replay; await revoke;
      if (order === 'replay-first') { expect(response.status).toBe(201); expect(await response.json()).toEqual(result); }
      else {
        expect(response.status).toBeOneOf([404, 409]); const raw = await response.text();
        for (const value of Object.values(result.workspace) as string[]) expect(raw).not.toContain(value);
        expect(control.traces[0]!.events.some(e => e.phase === 'ledger' || e.phase === 'reserve')).toBe(false);
      }
      await undisclosed(await create(a.f, a.client, body, key), result.workspace);
      correctionObservations.push({ scenario: order, wait, concurrentHttp: response.status, afterRevocationHttp: 404, transactions: control.traces });
    } finally { release.release(); await Promise.allSettled([...(replay ? [replay] : []), ...(revoke ? [revoke] : [])]); control.restore(); }
  });
}
async function keeper(workspaceId: string) {
  const user = await database.client.user.create({ data: { name: 'Owned alternate administrator' } });
  await database.client.workspaceMembership.create({ data: { workspaceId, userId: user.id, role: 'ADMIN', status: 'ACTIVE' } });
}
async function undisclosed(response: Response, sensitive: { id: string; name: string; slug: string }) {
  expect(response.status).toBe(404); const raw = await response.text(), data = JSON.parse(raw);
  expect(Object.keys(data)).toEqual(['error']); expect(Object.keys(data.error).sort()).toEqual(['code', 'message', 'requestId']);
  expect({ ...data.error, requestId: 'redacted' }).toEqual({ code: 'NOT_FOUND', message: 'Resource not found', requestId: 'redacted' });
  for (const secret of Object.values(sensitive)) expect(raw).not.toContain(secret);
  expect(response.headers.has('set-cookie')).toBe(false); expect(response.headers.get('cache-control')).toBe('private, no-store');
}
for (const mode of ['membership-deleted', 'membership-suspended', 'inaccessible-ledger-pointer'] as const) {
  test(`replay cannot disclose body/result/expiry after ${mode}`, async () => {
    const a = await account(), body = { ...input(), name: 'Private-' + randomUUID() }, key = randomUUID();
    let result: { workspace: { id: string; name: string; slug: string } };
    if (mode === 'inaccessible-ledger-pointer') {
      const b = await account(); result = await (await create(b.f, b.client, body)).json();
      // Adversarial durable pointer in the owned test DB, not a frontend grant.
      await database.client.workspaceCreationResult.create({ data: { id: randomUUID(), actorId: a.userId, scopeKey: 'account:' + a.userId,
        requestKey: key, payloadDigest: 'a'.repeat(64), workspaceId: result.workspace.id, result, retainUntil: new Date(Date.now() + 86401000) } });
    } else {
      const first = await create(a.f, a.client, body, key); expect(first.status).toBe(201); result = await first.json(); await keeper(result.workspace.id);
      if (mode === 'membership-deleted') await database.client.workspaceMembership.delete({ where: { workspaceId_userId: { workspaceId: result.workspace.id, userId: a.userId } } });
      else await database.client.workspaceMembership.update({ where: { workspaceId_userId: { workspaceId: result.workspace.id, userId: a.userId } }, data: { status: 'SUSPENDED' } });
    }
    expect((await a.f.http('/api/v1/auth/me', 'GET', a.client)).status).toBe(200);
    await undisclosed(await create(a.f, a.client, body, key), result.workspace);
    await undisclosed(await create(a.f, a.client, { ...body, name: 'Different body' }, key), result.workspace);
    await expireResult(key); await undisclosed(await create(a.f, a.client, body, key), result.workspace);
    // Expiry was not exposed or used to purge a result by an unauthorized caller.
    expect((await database.client.workspaceCreationResult.findFirstOrThrow({ where: { actorId: a.userId, requestKey: key } })).result).not.toBeNull();
    await database.client.$executeRaw`UPDATE workspace_creation_results SET result=NULL WHERE actor_id=${a.userId}::uuid AND request_key=${key}::uuid`;
    await undisclosed(await create(a.f, a.client, body, key), result.workspace);
    correctionObservations.push({ scenario: mode, authenticatedMe: 200, matchingPayload: 404, differentPayload: 404, expired: 404, tombstone: 404, disclosedProductFields: false });
  });
}
