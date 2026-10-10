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
  const key = `be00g:test:${randomUUID()}`; keys.push(key);
  const setLive = async (s: SessionEvidence | null) => {
    if (!s) { await cache.del(key); return; }
    await cache.set(key, JSON.stringify(s, (_key, value) => typeof value === 'bigint' ? value.toString() : value), 'EX', 60);
  };
  await setLive(session);
  let lookups = 0;
  const tenancy = new Tenancy(db, { verify: async () => null }, { allows: () => true }, { verify: async input => {
    if (input !== assertion) return null;
    lookups++;
    const payload = await cache.get(key); if (!payload) return null;
    const s = JSON.parse(payload) as Record<string, string>;
    return { userId: s.userId!, identityId: s.identityId!, familyId: s.familyId!, sidDigest: s.sidDigest!, authEpoch: BigInt(s.authEpoch!), generation: BigInt(s.generation!) };
  } });
  const request = <T>(run: (principal: VerifiedPrincipal) => Promise<T>) => tenancy.authenticateSession(assertion, run);
  // Deliberately return an escaped principal to test that it has no authority.
  const principal = await request(async p => p);
  const read = (p?: VerifiedPrincipal) => p ? tenancy.read(p, workspaceId, q => q.issue(issueId)) : request(p => tenancy.read(p, workspaceId, q => q.issue(issueId)));
  const write = (p?: VerifiedPrincipal) => p ? tenancy.write(p, workspaceId, q => q.compareAndSetIssueTitle(issueId, 1, 'After')) : request(p => tenancy.write(p, workspaceId, q => q.compareAndSetIssueTitle(issueId, 1, 'After')));
  return { userId, identityId, workspaceId, issueId, session, assertion, tenancy, principal, read, write, request, setLive, key, lookups: () => lookups };
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
  await f.request(async principal => {
    await fences.revoke(f.session); await fences.revoke(f.session);
    await expect(f.read(principal)).rejects.toBeInstanceOf(TenantAccessError);
    await expect(f.write(principal)).rejects.toBeInstanceOf(TenantAccessError);
  });
  await expect(fences.validate(f.session)).rejects.toBeInstanceOf(AuthDeniedError);
  await expect(f.request(async () => {})).rejects.toBeInstanceOf(TenantAccessError);
  await expect(f.read()).rejects.toBeInstanceOf(TenantAccessError);
  await expect(f.write()).rejects.toBeInstanceOf(TenantAccessError);
  expect((await db.client.issue.findUniqueOrThrow({ where: { workspaceId_id: { workspaceId: f.workspaceId, id: f.issueId } } })).title).toBe('Before');
});
test('logout-all fences every old family; fresh independently verified identity can start a new epoch', async () => {
  const f = await fixture();
  const second = await fences.create({ userId: f.userId, identityId: f.identityId, sidDigest: digest(), absoluteExpiresAt: new Date(Date.now() + 60000), idleExpiresAt: new Date(Date.now() + 30000) });
  const legacy = new Tenancy(db, { verify: async () => ({ provider: 'test', subject: f.userId }) }, { allows: () => true });
  const old = await legacy.authenticate(Symbol());
  await f.request(async principal => {
    await fences.revokeAll(f.userId);
    await expect(f.write(principal)).rejects.toBeInstanceOf(TenantAccessError);
  });
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
  await f.setLive({ userId: restored.userId!, identityId: restored.identityId!, familyId: restored.familyId!, sidDigest: restored.sidDigest!, authEpoch: BigInt(restored.authEpoch!), generation: BigInt(restored.generation!) });
  await expect(f.request(async () => {})).rejects.toBeInstanceOf(TenantAccessError);
  await expect(f.write()).rejects.toBeInstanceOf(TenantAccessError);
});
test('missing, mismatched, malformed and client-controlled authority fails closed', async () => {
  const f = await fixture();
  for (const patch of [{ familyId: randomUUID() }, { userId: randomUUID() }, { identityId: randomUUID() }, { sidDigest: digest() }, { generation: 99n }, { authEpoch: 99n }, { familyId: 'invalid' }]) await expect(fences.validate({ ...f.session, ...patch })).rejects.toBeInstanceOf(AuthDeniedError);
  await expect(f.tenancy.authenticateSession(f.session, async () => {})).rejects.toBeInstanceOf(TenantAccessError);
  await expect(f.read({} as VerifiedPrincipal)).rejects.toBeInstanceOf(TenantAccessError);
  const other = new Tenancy(db, { verify: async () => null });
  await expect(other.authenticateSession(f.assertion, async () => {})).rejects.toBeInstanceOf(TenantAccessError);
  await expect(other.read(f.principal, f.workspaceId, q => q.issue(f.issueId))).rejects.toBeInstanceOf(TenantAccessError);
  await f.setLive(null); await expect(f.request(async () => {})).rejects.toBeInstanceOf(TenantAccessError);
});
test('rotation cannot refresh stale epochs or extend absolute lifetime; old principals are denied', async () => {
  const f = await fixture();
  const next = await f.request(async principal => {
    const next = await fences.rotate(f.session, digest(), new Date(Date.now() + 30000));
    await expect(f.write(principal)).rejects.toBeInstanceOf(TenantAccessError);
    return next;
  });
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
test('request boundary verifies once, rejects cross-request principals and never rereads cache per query', async () => {
  const f = await fixture(); const before = f.lookups();
  await f.request(async principal => {
    expect((await f.read(principal)).title).toBe('Before');
    expect((await f.read(principal)).title).toBe('Before');
    expect(f.lookups()).toBe(before + 1);
    await f.request(async second => {
      await expect(f.read(principal)).rejects.toBeInstanceOf(TenantAccessError);
      await expect(f.write(principal)).rejects.toBeInstanceOf(TenantAccessError);
      expect((await f.read(second)).title).toBe('Before');
    });
    // Nested boundary completion restores its parent's still-live context.
    expect((await f.read(principal)).title).toBe('Before');
  });
  expect(f.lookups()).toBe(before + 2);
  await expect(f.read(f.principal)).rejects.toBeInstanceOf(TenantAccessError);
  // Runtime callers cannot opt back into the old callback-free API.
  const unbound = f.tenancy.authenticateSession.bind(f.tenancy) as unknown as (assertion: unknown) => Promise<unknown>;
  await expect(unbound(f.assertion)).rejects.toBeInstanceOf(TenantAccessError);
});
test('cache deletion denies a subsequent request and escaped principal while the durable fence remains valid', async () => {
  const f = await fixture(); const entered = gate(), finish = gate(); let active!: VerifiedPrincipal;
  const prior = f.request(async principal => { active = principal; expect((await f.read(principal)).title).toBe('Before'); entered.release(); await finish.wait; });
  await entered.wait;
  try {
    await f.setLive(null); expect(await cache.get(f.key)).toBeNull();
    expect((await fences.validate(f.session)).session?.familyId).toBe(f.session.familyId);
    let called = false;
    await expect(f.request(async () => { called = true; })).rejects.toBeInstanceOf(TenantAccessError);
    expect(called).toBe(false);
    // The prior request is still running; another async context cannot reuse it.
    await expect(f.read(active)).rejects.toBeInstanceOf(TenantAccessError);
    await expect(f.write(active)).rejects.toBeInstanceOf(TenantAccessError);
  } finally { finish.release(); }
  await prior;
  await expect(f.read(active)).rejects.toBeInstanceOf(TenantAccessError);
  await expect(f.write(active)).rejects.toBeInstanceOf(TenantAccessError);
});
test('real Valkey expiry denies fresh requests and reused principals without PostgreSQL revocation', async () => {
  const f = await fixture();
  expect(await cache.pexpire(f.key, 80)).toBe(1); await Bun.sleep(100);
  expect(await cache.get(f.key)).toBeNull();
  expect((await fences.validate(f.session)).authEpoch).toBe(f.session.authEpoch);
  await expect(f.request(async () => {})).rejects.toBeInstanceOf(TenantAccessError);
  await expect(f.read(f.principal)).rejects.toBeInstanceOf(TenantAccessError);
  await expect(f.write(f.principal)).rejects.toBeInstanceOf(TenantAccessError);
});
test('throwing request expires its principal and preserves the application error', async () => {
  const f = await fixture(); let escaped!: VerifiedPrincipal; const failure = new Error('Synthetic application failure');
  await expect(f.request(async principal => {
    escaped = principal; expect((await f.read(principal)).title).toBe('Before'); throw failure;
  })).rejects.toBe(failure);
  await expect(f.read(escaped)).rejects.toBeInstanceOf(TenantAccessError);
  await expect(f.write(escaped)).rejects.toBeInstanceOf(TenantAccessError);
});
test('detached continuation inherits context but cannot reuse a completed request principal', async () => {
  const f = await fixture(); const finish = gate(); let late!: Promise<unknown>;
  await f.request(async principal => {
    late = finish.wait.then(() => f.write(principal)).then(() => 'committed', error => error);
  });
  finish.release(); expect(await late).toBeInstanceOf(TenantAccessError);
  expect((await db.client.issue.findUniqueOrThrow({ where: { workspaceId_id: { workspaceId: f.workspaceId, id: f.issueId } } })).title).toBe('Before');
});
test('already-started detached transaction rolls back if the request completes during its callback', async () => {
  const f = await fixture(); const entered = gate(), finish = gate(); let pending!: Promise<unknown>;
  try {
    await f.request(async principal => {
      pending = f.tenancy.write(principal, f.workspaceId, async q => {
        await q.compareAndSetIssueTitle(f.issueId, 1, 'Must roll back'); entered.release(); await finish.wait;
      }).then(() => 'committed', error => error);
      await entered.wait;
    });
  } finally { finish.release(); }
  expect(await pending).toBeInstanceOf(TenantAccessError);
  expect((await db.client.issue.findUniqueOrThrow({ where: { workspaceId_id: { workspaceId: f.workspaceId, id: f.issueId } } })).title).toBe('Before');
});
test('direct SQL cannot split generation/digest rotation, skip generations or change immutable family fields', async () => {
  const f = await fixture(); const g = await fixture();
  const before = await db.client.authSessionFamily.findUniqueOrThrow({ where: { id: f.session.familyId } });
  const attempts = [
    () => db.client.$executeRaw`UPDATE auth_session_families SET generation = generation + 1 WHERE id = ${f.session.familyId}::uuid`,
    () => db.client.$executeRaw`UPDATE auth_session_families SET sid_digest = ${digest()} WHERE id = ${f.session.familyId}::uuid`,
    () => db.client.$executeRaw`UPDATE auth_session_families SET generation = generation + 2, sid_digest = ${digest()} WHERE id = ${f.session.familyId}::uuid`,
    () => db.client.$executeRaw`UPDATE auth_session_families SET generation = generation + 1, sid_digest = ${digest()}, revoked_at = statement_timestamp() WHERE id = ${f.session.familyId}::uuid`,
    () => db.client.$executeRaw`UPDATE auth_session_families SET idle_expires_at = idle_expires_at + interval '1 second', revoked_at = statement_timestamp() WHERE id = ${f.session.familyId}::uuid`,
    () => db.client.$executeRaw`UPDATE auth_session_families SET id = ${randomUUID()}::uuid WHERE id = ${f.session.familyId}::uuid`,
    () => db.client.$executeRaw`UPDATE auth_session_families SET user_id = ${g.userId}::uuid WHERE id = ${f.session.familyId}::uuid`,
    () => db.client.$executeRaw`UPDATE auth_session_families SET identity_id = ${g.identityId}::uuid WHERE id = ${f.session.familyId}::uuid`,
    () => db.client.$executeRaw`UPDATE auth_session_families SET user_id = ${g.userId}::uuid, identity_id = ${g.identityId}::uuid WHERE id = ${f.session.familyId}::uuid`,
    () => db.client.$executeRaw`UPDATE auth_session_families SET auth_epoch = auth_epoch + 1 WHERE id = ${f.session.familyId}::uuid`,
    () => db.client.$executeRaw`UPDATE auth_session_families SET issued_at = issued_at + interval '1 second' WHERE id = ${f.session.familyId}::uuid`,
    () => db.client.$executeRaw`UPDATE auth_session_families SET absolute_expires_at = absolute_expires_at + interval '1 second' WHERE id = ${f.session.familyId}::uuid`,
  ];
  for (const attempt of attempts) await expect(Promise.resolve(attempt())).rejects.toThrow('Invalid authentication fence transition');
  expect(await db.client.authSessionFamily.findUniqueOrThrow({ where: { id: f.session.familyId } })).toEqual(before);
  expect((await fences.validate(f.session)).session?.generation).toBe(1n);
});
test('revoked SQL rows are frozen while idempotent family logout remains valid', async () => {
  const f = await fixture(); await fences.revoke(f.session);
  const before = await db.client.authSessionFamily.findUniqueOrThrow({ where: { id: f.session.familyId } });
  const attempts = [
    () => db.client.$executeRaw`UPDATE auth_session_families SET generation = generation + 1, sid_digest = ${digest()} WHERE id = ${f.session.familyId}::uuid`,
    () => db.client.$executeRaw`UPDATE auth_session_families SET idle_expires_at = idle_expires_at + interval '1 second' WHERE id = ${f.session.familyId}::uuid`,
    () => db.client.$executeRaw`UPDATE auth_session_families SET revoked_at = NULL WHERE id = ${f.session.familyId}::uuid`,
    () => db.client.$executeRaw`UPDATE auth_session_families SET revoked_at = revoked_at + interval '1 second' WHERE id = ${f.session.familyId}::uuid`,
  ];
  for (const attempt of attempts) await expect(Promise.resolve(attempt())).rejects.toThrow('Invalid authentication fence transition');
  await fences.revoke(f.session);
  expect(await db.client.authSessionFamily.findUniqueOrThrow({ where: { id: f.session.familyId } })).toEqual(before);
  await expect(fences.rotate(f.session, digest(), new Date(Date.now() + 30000))).rejects.toBeInstanceOf(AuthDeniedError);
});
test('valid rotation succeeds but stale and mixed generation/digest evidence never regains authority', async () => {
  const f = await fixture(); const next = await fences.rotate(f.session, digest(), new Date(Date.now() + 30000));
  expect(next.generation).toBe(f.session.generation + 1n); expect(next.sidDigest).not.toBe(f.session.sidDigest);
  for (const stale of [f.session, { ...next, generation: f.session.generation }, { ...next, sidDigest: f.session.sidDigest }]) {
    await expect(fences.validate(stale)).rejects.toBeInstanceOf(AuthDeniedError);
    await f.setLive(stale); await expect(f.read()).rejects.toBeInstanceOf(TenantAccessError);
  }
  await expect(fences.rotate(f.session, digest(), new Date(Date.now() + 30000))).rejects.toBeInstanceOf(AuthDeniedError);
  await f.setLive(next); expect((await f.read()).title).toBe('Before');
});
for (const kind of ['family', 'all'] as const) test(`write-first ordering: ${kind} revocation waits for protected commit`, async () => {
  const f = await fixture(); const entered = gate(), finish = gate(); let revoked = false;
  const write = f.request(principal => f.tenancy.write(principal, f.workspaceId, async q => {
    await q.compareAndSetIssueTitle(f.issueId, 1, 'Committed before revocation'); entered.release(); await finish.wait;
  }));
  await entered.wait;
  const revocation = (kind === 'family' ? fences.revoke(f.session) : fences.revokeAll(f.userId)).then(() => { revoked = true; });
  try { await blocked(); expect(revoked).toBe(false); } finally { finish.release(); }
  await write; await revocation;
  expect((await db.client.issue.findUniqueOrThrow({ where: { workspaceId_id: { workspaceId: f.workspaceId, id: f.issueId } } })).title).toBe('Committed before revocation');
  await expect(f.write()).rejects.toBeInstanceOf(TenantAccessError);
});
for (const kind of ['family', 'all'] as const) test(`revocation-first ordering: ${kind} fence prevents a concurrent stale commit`, async () => {
  const f = await fixture(); const entered = gate(), finish = gate();
  await f.request(async principal => {
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
    const write = f.write(principal).then(() => 'committed', error => error);
    try { await blocked(); } finally { finish.release(); }
    await revocation; const outcome = await write;
    expect(outcome instanceof TenantConflictError || outcome instanceof TenantAccessError).toBe(true);
    await expect(f.write(principal)).rejects.toBeInstanceOf(TenantAccessError);
    expect((await db.client.issue.findUniqueOrThrow({ where: { workspaceId_id: { workspaceId: f.workspaceId, id: f.issueId } } })).title).toBe('Before');
  });
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
  await f.setLive(short);
  await expect(f.request(principal => f.tenancy.write(principal, f.workspaceId, async q => {
    await q.compareAndSetIssueTitle(f.issueId, 1, 'Must roll back');
    await Bun.sleep(1100);
  }))).rejects.toBeInstanceOf(TenantAccessError);
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
  await f.request(async principal => {
    // Only this suite's disposable DB. Disallow reconnects and terminate its
    // connections; do not stop the shared server or another suite's database.
    await admin.client.$executeRawUnsafe(`ALTER DATABASE "${name}" ALLOW_CONNECTIONS false`);
    await admin.client.$queryRaw`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = ${name}`;
    try {
      await expect(fences.validate(f.session)).rejects.toBeInstanceOf(AuthUnavailableError);
      await expect(f.request(async () => {})).rejects.toBeInstanceOf(AuthUnavailableError);
      await expect(f.tenancy.write(principal, f.workspaceId, async () => { called = true; })).rejects.toBeInstanceOf(AuthUnavailableError);
      expect(called).toBe(false);
    } finally {
      await admin.client.$executeRawUnsafe(`ALTER DATABASE "${name}" ALLOW_CONNECTIONS true`);
      await db.close(); await db.connect();
    }
  });
  expect((await f.read()).title).toBe('Before');
}, 15000);
