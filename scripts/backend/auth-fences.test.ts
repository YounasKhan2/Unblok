import { afterAll, beforeAll, expect, test } from 'bun:test';
import { createHash, randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { createRedis } from '@unblok/backend-runtime';
import { AuthFences, AuthDeniedError, AuthUnavailableError, Database, Tenancy, TenantAccessError, TenantConflictError, type SessionEvidence, type VerifiedPrincipal } from '@unblok/database';

const root = resolve(import.meta.dir, '../..');
const originalUrl = process.env.DATABASE_URL;
if (!originalUrl || !process.env.REDIS_URL) throw new Error('Real PostgreSQL and Valkey configuration required');
const admin = new Database(originalUrl);
const name = `unblok_be00g_test_${randomUUID().replaceAll('-', '')}`;
const url = new URL(originalUrl); url.pathname = `/${name}`;
const db = new Database(url.toString());
const fences = new AuthFences(db);
const cache = createRedis(process.env.REDIS_URL);
let created = false;
const keys: string[] = [];
const digest = () => createHash('sha256').update(randomUUID()).digest('hex');
async function prisma(args: string[]) {
  const child = Bun.spawn([process.execPath, 'packages/database/node_modules/prisma/build/index.js', ...args], { cwd: root, env: { ...process.env, DATABASE_URL: url.toString() }, stdout: 'pipe', stderr: 'pipe' });
  // Bound each owned CLI below the existing 15s two-command test deadline.
  // Await termination on timeout; never leave a rejected waiter across tests.
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; child.kill('SIGKILL'); }, 6000);
  try {
    const [output, , exit] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
    if (timedOut || exit !== 0) throw new Error(timedOut ? 'Prisma verification command exceeded 6000ms' : 'Prisma verification failed; configuration withheld');
    return output;
  } finally { clearTimeout(timer); }
}
beforeAll(async () => {
  await admin.connect(); await admin.client.$executeRawUnsafe(`CREATE DATABASE "${name}"`); created = true;
  await prisma(['migrate', 'deploy', '--schema', 'packages/database/prisma/schema.prisma']);
  await db.connect(); await cache.connect();
}, 30000);
afterAll(async () => {
  let cacheCleanupFailed = false;
  try { if (keys.length) await cache.del(...keys); }
  catch { cacheCleanupFailed = true; }
  finally {
    cache.disconnect();
    try { await db.close(); }
    finally {
      try { if (created) await admin.client.$executeRawUnsafe(`DROP DATABASE "${name}" WITH (FORCE)`); }
      finally { await admin.close(); }
    }
  }
  if (cacheCleanupFailed) throw new Error('Owned cache-key cleanup failed');
}, 10000);

async function fixture() {
  const userId = randomUUID(), identityId = randomUUID(), workspaceId = randomUUID(), membershipId = randomUUID(), teamId = randomUUID(), projectId = randomUUID(), issueId = randomUUID();
  await db.transaction(async tx => {
    await tx.user.create({ data: { id: userId, name: 'Security test' } });
    await tx.identity.create({ data: { id: identityId, userId, provider: 'test', subject: userId } });
    await tx.workspace.create({ data: { id: workspaceId, name: 'Security test', slug: `test-${workspaceId}` } });
    await tx.workspaceMembership.create({ data: { workspaceId, id: membershipId, userId, role: 'ADMIN', status: 'ACTIVE' } });
    await tx.team.create({ data: { workspaceId, id: teamId, key: 'ENG', name: 'Security test' } });
    await tx.teamMembership.create({ data: { workspaceId, teamId, membershipId } });
    await tx.project.create({ data: { workspaceId, id: projectId, teamId, key: 'APP', name: 'Security test', currentSequence: 1 } });
    await tx.issue.create({ data: { workspaceId, id: issueId, projectId, sequence: 1, title: 'Before', creatorMembershipId: membershipId } });
  });
  const session = await fences.create({ userId, identityId, sidDigest: digest(), absoluteExpiresAt: new Date(Date.now() + 60000), idleExpiresAt: new Date(Date.now() + 30000) });
  const assertion = Symbol('private verified live session');
  let live: SessionEvidence | null = session;
  const tenancy = new Tenancy(db, { verify: async () => null }, { allows: () => true }, { verify: async input => input === assertion ? live : null });
  const principal = await tenancy.authenticateSession(assertion);
  const read = (p = principal) => tenancy.read(p, workspaceId, q => q.issue(issueId));
  const write = (p = principal) => tenancy.write(p, workspaceId, q => q.compareAndSetIssueTitle(issueId, 1, 'After'));
  return { userId, identityId, workspaceId, issueId, session, assertion, tenancy, principal, read, write, setLive: (s: SessionEvidence | null) => { live = s; } };
}
function gate() {
  let release!: () => void;
  const wait = new Promise<void>(resolve => { release = resolve; });
  return { wait, release };
}
async function blocked() {
  const deadline = Date.now() + 1000;
  while (Date.now() < deadline) {
    const rows = await admin.client.$queryRaw<{ blocked: boolean }[]>`SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE datname = ${name} AND cardinality(pg_blocking_pids(pid)) > 0) AS blocked`;
    if (rows[0]?.blocked) return;
    await Bun.sleep(10);
  }
  throw new Error('Expected PostgreSQL lock waiter was not observed');
}

test('fresh migration replay and Prisma-visible schema equality', async () => {
  expect(await prisma(['migrate', 'deploy', '--schema', 'packages/database/prisma/schema.prisma'])).toContain('No pending migrations');
  expect(await prisma(['migrate', 'diff', '--from-schema-datasource', 'packages/database/prisma/schema.prisma', '--to-schema-datamodel', 'packages/database/prisma/schema.prisma', '--exit-code'])).toContain('No difference');
  expect(await db.ready()).toBe(true);
}, 15000);
test('logout is durable/idempotent and denies already-minted principals', async () => {
  const f = await fixture(); expect((await f.read()).title).toBe('Before');
  await fences.revoke(f.session); await fences.revoke(f.session);
  await expect(fences.validate(f.session)).rejects.toBeInstanceOf(AuthDeniedError);
  await expect(f.tenancy.authenticateSession(f.assertion)).rejects.toBeInstanceOf(TenantAccessError);
  await expect(f.read()).rejects.toBeInstanceOf(TenantAccessError);
  await expect(f.write()).rejects.toBeInstanceOf(TenantAccessError);
  expect((await db.client.issue.findUniqueOrThrow({ where: { workspaceId_id: { workspaceId: f.workspaceId, id: f.issueId } } })).title).toBe('Before');
});
test('logout-all fences every old family; fresh independently verified identity can start a new epoch', async () => {
  const f = await fixture();
  const second = await fences.create({ userId: f.userId, identityId: f.identityId, sidDigest: digest(), absoluteExpiresAt: new Date(Date.now() + 60000), idleExpiresAt: new Date(Date.now() + 30000) });
  const legacy = new Tenancy(db, { verify: async () => ({ provider: 'test', subject: f.userId }) }, { allows: () => true });
  const old = await legacy.authenticate(Symbol());
  await fences.revokeAll(f.userId);
  for (const session of [f.session, second]) await expect(fences.validate(session)).rejects.toBeInstanceOf(AuthDeniedError);
  await expect(f.write()).rejects.toBeInstanceOf(TenantAccessError);
  await expect(legacy.write(old, f.workspaceId, q => q.compareAndSetIssueTitle(f.issueId, 1, 'Attack'))).rejects.toBeInstanceOf(TenantAccessError);
  const fresh = await fences.create({ userId: f.userId, identityId: f.identityId, sidDigest: digest(), absoluteExpiresAt: new Date(Date.now() + 60000), idleExpiresAt: new Date(Date.now() + 30000) });
  expect(fresh.authEpoch).toBe(f.session.authEpoch + 1n); expect((await fences.validate(fresh)).authEpoch).toBe(fresh.authEpoch);
});
test('late real Valkey save recreates stale data but cannot restore PostgreSQL authority', async () => {
  const f = await fixture(); const key = `be00g:test:${randomUUID()}`; keys.push(key);
  const payload = JSON.stringify(f.session, (_key, value) => typeof value === 'bigint' ? value.toString() : value);
  await cache.set(key, payload, 'EX', 60);
  const held = gate(); const lateSave = held.wait.then(() => cache.set(key, payload, 'EX', 60));
  await fences.revoke(f.session); await cache.del(key);
  held.release(); await lateSave;
  expect(await cache.get(key)).toBe(payload);
  const restored = JSON.parse((await cache.get(key))!) as Record<string, string>;
  f.setLive({ userId: restored.userId!, identityId: restored.identityId!, familyId: restored.familyId!, sidDigest: restored.sidDigest!, authEpoch: BigInt(restored.authEpoch!), generation: BigInt(restored.generation!) });
  await expect(f.tenancy.authenticateSession(f.assertion)).rejects.toBeInstanceOf(TenantAccessError);
  await expect(f.write()).rejects.toBeInstanceOf(TenantAccessError);
});
test('missing, mismatched, malformed and client-controlled authority fails closed', async () => {
  const f = await fixture();
  for (const patch of [{ familyId: randomUUID() }, { userId: randomUUID() }, { identityId: randomUUID() }, { sidDigest: digest() }, { generation: 99n }, { authEpoch: 99n }, { familyId: 'invalid' }]) await expect(fences.validate({ ...f.session, ...patch })).rejects.toBeInstanceOf(AuthDeniedError);
  await expect(f.tenancy.authenticateSession(f.session)).rejects.toBeInstanceOf(TenantAccessError);
  await expect(f.read({} as VerifiedPrincipal)).rejects.toBeInstanceOf(TenantAccessError);
  const other = new Tenancy(db, { verify: async () => null });
  await expect(other.authenticateSession(f.assertion)).rejects.toBeInstanceOf(TenantAccessError);
  await expect(other.read(f.principal, f.workspaceId, q => q.issue(f.issueId))).rejects.toBeInstanceOf(TenantAccessError);
  f.setLive(null); await expect(f.tenancy.authenticateSession(f.assertion)).rejects.toBeInstanceOf(TenantAccessError);
});
test('rotation cannot refresh stale epochs or extend absolute lifetime; old principals are denied', async () => {
  const f = await fixture();
  const next = await fences.rotate(f.session, digest(), new Date(Date.now() + 30000));
  await expect(fences.validate(f.session)).rejects.toBeInstanceOf(AuthDeniedError);
  await expect(f.write()).rejects.toBeInstanceOf(TenantAccessError);
  expect((await fences.validate(next)).session?.generation).toBe(2n);
  await expect(fences.rotate(next, digest(), new Date(Date.now() + 120000))).rejects.toBeInstanceOf(AuthDeniedError);
  await fences.revokeAll(f.userId);
  await expect(fences.rotate(next, digest(), new Date(Date.now() + 30000))).rejects.toBeInstanceOf(AuthDeniedError);
});
test('concurrent rotations allow one current generation only', async () => {
  const f = await fixture();
  const results = await Promise.allSettled([fences.rotate(f.session, digest(), new Date(Date.now() + 30000)), fences.rotate(f.session, digest(), new Date(Date.now() + 30000))]);
  expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
  expect(results.filter(r => r.status === 'rejected')).toHaveLength(1);
  await expect(fences.validate(f.session)).rejects.toBeInstanceOf(AuthDeniedError);
});
for (const kind of ['family', 'all'] as const) test(`write-first ordering: ${kind} revocation waits for protected commit`, async () => {
  const f = await fixture(); const entered = gate(), finish = gate(); let revoked = false;
  const write = f.tenancy.write(f.principal, f.workspaceId, async q => {
    await q.compareAndSetIssueTitle(f.issueId, 1, 'Committed before revocation'); entered.release(); await finish.wait;
  });
  await entered.wait;
  const revocation = (kind === 'family' ? fences.revoke(f.session) : fences.revokeAll(f.userId)).then(() => { revoked = true; });
  try { await blocked(); expect(revoked).toBe(false); } finally { finish.release(); }
  await write; await revocation;
  expect((await db.client.issue.findUniqueOrThrow({ where: { workspaceId_id: { workspaceId: f.workspaceId, id: f.issueId } } })).title).toBe('Committed before revocation');
  await expect(f.write()).rejects.toBeInstanceOf(TenantAccessError);
});
for (const kind of ['family', 'all'] as const) test(`revocation-first ordering: ${kind} fence prevents a concurrent stale commit`, async () => {
  const f = await fixture(); const entered = gate(), finish = gate();
  // Hold the same ordered locks/update used by production revocation until the
  // test observes the protected transaction waiting in PostgreSQL itself.
  const revocation = db.transaction(async tx => {
    if (kind === 'all') {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${f.userId}::uuid FOR UPDATE`;
      await tx.$executeRaw`UPDATE users SET auth_epoch = auth_epoch + 1 WHERE id = ${f.userId}::uuid`;
    } else {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${f.userId}::uuid FOR SHARE`;
      await tx.$queryRaw`SELECT id FROM auth_session_families WHERE id = ${f.session.familyId}::uuid FOR UPDATE`;
      await tx.$executeRaw`UPDATE auth_session_families SET revoked_at = statement_timestamp() WHERE id = ${f.session.familyId}::uuid`;
    }
    entered.release(); await finish.wait;
  });
  await entered.wait;
  const write = f.write().then(() => 'committed', error => error);
  try { await blocked(); } finally { finish.release(); }
  await revocation; const outcome = await write;
  expect(outcome instanceof TenantConflictError || outcome instanceof TenantAccessError).toBe(true);
  await expect(f.write()).rejects.toBeInstanceOf(TenantAccessError);
  expect((await db.client.issue.findUniqueOrThrow({ where: { workspaceId_id: { workspaceId: f.workspaceId, id: f.issueId } } })).title).toBe('Before');
});
test('disabled account and expired idle/absolute authority deny existing principals', async () => {
  const f = await fixture(); await db.client.user.update({ where: { id: f.userId }, data: { authDisabled: true } });
  await expect(fences.validate(f.session)).rejects.toBeInstanceOf(AuthDeniedError);
  await expect(f.write()).rejects.toBeInstanceOf(TenantAccessError);
  await db.client.user.update({ where: { id: f.userId }, data: { authDisabled: false } });
  await expect(fences.validate(f.session)).rejects.toBeInstanceOf(AuthDeniedError);
  await db.client.user.update({ where: { id: f.userId }, data: { authDisabled: true } });
  await fences.revokeAll(f.userId); await fences.revoke(f.session);
  const g = await fixture();
  const expired = await fences.create({ userId: g.userId, identityId: g.identityId, sidDigest: digest(), absoluteExpiresAt: new Date(Date.now() + 100), idleExpiresAt: new Date(Date.now() + 100) });
  await Bun.sleep(120); await expect(fences.validate(expired)).rejects.toBeInstanceOf(AuthDeniedError);
  const idle = await fences.create({ userId: g.userId, identityId: g.identityId, sidDigest: digest(), absoluteExpiresAt: new Date(Date.now() + 60000), idleExpiresAt: new Date(Date.now() + 100) });
  await Bun.sleep(120); await expect(fences.validate(idle)).rejects.toBeInstanceOf(AuthDeniedError);
  await expect(fences.rotate(idle, digest(), new Date(Date.now() + 30000))).rejects.toBeInstanceOf(AuthDeniedError);
});
test('expiry during protected work rolls the mutation back before completion', async () => {
  const f = await fixture();
  const short = await fences.create({ userId: f.userId, identityId: f.identityId, sidDigest: digest(), absoluteExpiresAt: new Date(Date.now() + 60000), idleExpiresAt: new Date(Date.now() + 1000) });
  f.setLive(short); const principal = await f.tenancy.authenticateSession(f.assertion);
  await expect(f.tenancy.write(principal, f.workspaceId, async q => {
    await q.compareAndSetIssueTitle(f.issueId, 1, 'Must roll back');
    await Bun.sleep(1100);
  })).rejects.toBeInstanceOf(TenantAccessError);
  expect((await db.client.issue.findUniqueOrThrow({ where: { workspaceId_id: { workspaceId: f.workspaceId, id: f.issueId } } })).title).toBe('Before');
});
test('SQL guards retain fences, bind identities and prevent epoch/revocation rollback', async () => {
  const f = await fixture(), g = await fixture();
  await expect(Promise.resolve(db.client.authSessionFamily.create({ data: { userId: f.userId, identityId: g.identityId, authEpoch: 1n, sidDigest: digest(), absoluteExpiresAt: new Date(Date.now() + 60000), idleExpiresAt: new Date(Date.now() + 30000) } }))).rejects.toThrow();
  await fences.revokeAll(f.userId);
  await expect(Promise.resolve(db.client.user.update({ where: { id: f.userId }, data: { authEpoch: 1n } }))).rejects.toThrow();
  await fences.revoke(f.session);
  await expect(Promise.resolve(db.client.authSessionFamily.update({ where: { id: f.session.familyId }, data: { revokedAt: null } }))).rejects.toThrow();
  await expect(Promise.resolve(db.client.authSessionFamily.delete({ where: { id: f.session.familyId } }))).rejects.toThrow();
});
test('real PostgreSQL outage denies authentication and prevents protected callback execution', async () => {
  const f = await fixture(); let called = false;
  // Only this suite's disposable DB. Disallow reconnects and terminate its
  // connections; do not stop the shared server or another suite's database.
  await admin.client.$executeRawUnsafe(`ALTER DATABASE "${name}" ALLOW_CONNECTIONS false`);
  await admin.client.$queryRaw`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = ${name}`;
  try {
    await expect(fences.validate(f.session)).rejects.toBeInstanceOf(AuthUnavailableError);
    await expect(f.tenancy.authenticateSession(f.assertion)).rejects.toBeInstanceOf(AuthUnavailableError);
    await expect(f.tenancy.write(f.principal, f.workspaceId, async () => { called = true; })).rejects.toBeInstanceOf(AuthUnavailableError);
    expect(called).toBe(false);
  } finally {
    await admin.client.$executeRawUnsafe(`ALTER DATABASE "${name}" ALLOW_CONNECTIONS true`);
    await db.close(); await db.connect();
  }
  expect((await f.read()).title).toBe('Before');
}, 15000);
