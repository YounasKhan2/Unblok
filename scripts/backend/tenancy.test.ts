import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { cp, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { Database, Tenancy, TenantAccessError, TenantConflictError, type AuthorizationPolicy, type TenantQueries, type VerifiedPrincipal } from '@unblok/database';

const root = resolve(import.meta.dir, '../..');
const originalUrl = process.env.DATABASE_URL;
if (!originalUrl) throw new Error('DATABASE_URL required for domain integration tests');
const admin = new Database(originalUrl);
const databaseName = `unblok_be00c_test_${randomUUID().replaceAll('-', '')}`;
const url = new URL(originalUrl); url.pathname = `/${databaseName}`;
const database = new Database(url.toString());
let created = false;
async function prisma(args: string[], targetUrl = url.toString()) {
  const child = Bun.spawn([process.execPath, 'packages/database/node_modules/prisma/build/index.js', ...args], { cwd: root, env: { ...process.env, DATABASE_URL: targetUrl }, stdout: 'pipe', stderr: 'pipe' });
  const output = await new Response(child.stdout).text(); const error = await new Response(child.stderr).text();
  if (await child.exited !== 0) throw new Error('Prisma verification command failed (output withheld to protect configuration)');
  return output + error;
}
beforeAll(async () => {
  await admin.connect();
  await admin.client.$executeRawUnsafe(`CREATE DATABASE "${databaseName}"`); created = true;
  await prisma(['migrate', 'deploy', '--schema', 'packages/database/prisma/schema.prisma']);
  await database.connect();
}, 30000);
afterAll(async () => {
  await database.close();
  if (created) {
    // Only this suite's freshly created database is disposed, never the selected DB.
    await admin.client.$executeRawUnsafe(`DROP DATABASE "${databaseName}" WITH (FORCE)`);
  }
  await admin.close();
}, 10000);

const allow: AuthorizationPolicy = { allows: () => true }; // Explicit TEST policy, never application default.
async function fixture(target = database, authenticate = true) {
  const a = randomUUID(), b = randomUUID(), actor = randomUUID(), adminA = randomUUID(), userB = randomUUID();
  const member = randomUUID(), owner = randomUUID(), team = randomUUID(), project = randomUUID(), issue = randomUUID(), foreign = randomUUID();
  await target.transaction(async tx => {
    for (const id of [actor, adminA, userB]) {
      if (authenticate) await tx.user.create({ data: { id, name: 'Test user', email: 'shared-contact@example.test' }, select: { id: true } });
      else await tx.$executeRaw`INSERT INTO users(id, name, email) VALUES (${id}::uuid, 'Test user', 'shared-contact@example.test')`;
    }
    await tx.identity.create({ data: { provider: 'test-verifier', subject: actor, userId: actor } });
    for (const [id, suffix] of [[a, 'a'], [b, 'b']] as const) await tx.workspace.create({ data: { id, slug: `test-${id}-${suffix}`, name: 'Test workspace' } });
    await tx.workspaceMembership.create({ data: { workspaceId: a, id: owner, userId: adminA, role: 'ADMIN', status: 'ACTIVE' } });
    await tx.workspaceMembership.create({ data: { workspaceId: a, id: member, userId: actor, role: 'MEMBER', status: 'ACTIVE' } });
    await tx.workspaceMembership.create({ data: { workspaceId: b, id: member, userId: userB, role: 'ADMIN', status: 'ACTIVE' } });
    for (const workspaceId of [a, b]) {
      await tx.team.create({ data: { workspaceId, id: team, key: 'ENG', name: 'Engineering' } });
      await tx.teamMembership.create({ data: { workspaceId, teamId: team, membershipId: member } });
      await tx.project.create({ data: { workspaceId, id: project, teamId: team, key: 'APP', name: 'Application', currentSequence: 1 } });
      await tx.issue.create({ data: { workspaceId, id: issue, projectId: project, sequence: 1, title: workspaceId === a ? 'Tenant A' : 'Tenant B', creatorMembershipId: member } });
    }
    await tx.issue.create({ data: { workspaceId: b, id: foreign, projectId: project, sequence: 2, title: 'Private foreign issue', creatorMembershipId: member } });
  });
  const assertion = Symbol('test verified assertion');
  const verifier = { verify: async (input: unknown) => input === assertion ? { provider: 'test-verifier', subject: actor } : null };
  const tenancy = new Tenancy(target, verifier, allow);
  const principal = authenticate ? await tenancy.authenticate(assertion) : Object.freeze({}) as VerifiedPrincipal;
  return { a, b, actor, adminA, userB, member, owner, team, project, issue, foreign, assertion, verifier, tenancy, principal };
}

describe('fresh additive migrations and canonical constraints', () => {
  test('replay is a no-op and Prisma schema matches migrated database', async () => {
    expect(await prisma(['migrate', 'deploy', '--schema', 'packages/database/prisma/schema.prisma'])).toContain('No pending migrations');
    const diff = await prisma(['migrate', 'diff', '--from-schema-datasource', 'packages/database/prisma/schema.prisma', '--to-schema-datamodel', 'packages/database/prisma/schema.prisma', '--exit-code']);
    expect(diff).toContain('No difference');
    expect(await database.ready()).toBe(true);
    const applied = await database.client.$queryRaw<{ migration_name: string }[]>`SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL ORDER BY migration_name`;
    expect(applied.map(row => row.migration_name)).toEqual(['20261010000000_foundation', '20261010010000_domain_tenancy', '20261010020000_guard_corrections', '20261010030000_auth_revocation_fences', '20261010040000_password_credentials', '20261010050000_credential_email_ownership']);
  });
  test('identity keys are unique; users have no global role and email is not an authentication key', async () => {
    const f = await fixture();
    await expect(Promise.resolve(database.client.identity.create({ data: { userId: f.userB, provider: 'test-verifier', subject: f.actor } }))).rejects.toThrow();
    const columns = await database.client.$queryRaw<{ column_name: string }[]>`SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND table_schema = 'public'`;
    expect(columns.some(row => row.column_name === 'role')).toBe(false);
    expect(await database.client.user.count({ where: { id: { in: [f.actor, f.userB] }, email: 'shared-contact@example.test' } })).toBe(2);
  });
  test('workspace slugs and scoped keys are canonical and unique, with same keys valid across tenants', async () => {
    const f = await fixture();
    expect(await database.client.project.count({ where: { id: f.project, key: 'APP' } })).toBe(2);
    await expect(Promise.resolve(database.client.workspace.create({ data: { slug: `test-${f.a}-a`, name: 'Duplicate' } }))).rejects.toThrow();
    await expect(Promise.resolve(database.client.workspace.create({ data: { slug: 'Uppercase', name: 'Bad slug' } }))).rejects.toThrow();
    await expect(Promise.resolve(database.client.project.create({ data: { workspaceId: f.a, teamId: f.team, key: 'APP', name: 'Duplicate' } }))).rejects.toThrow();
    await expect(Promise.resolve(database.client.team.create({ data: { workspaceId: f.a, key: 'eng', name: 'Other team' } }))).rejects.toThrow();
    await expect(Promise.resolve(database.client.team.create({ data: { workspaceId: f.a, key: 'OPS', name: 'engineering' } }))).rejects.toThrow();
  });
  test('membership references require real users and are unique per user/workspace', async () => {
    const f = await fixture();
    await expect(Promise.resolve(database.client.workspaceMembership.create({ data: { workspaceId: f.a, userId: randomUUID(), role: 'MEMBER' } }))).rejects.toThrow();
    await expect(Promise.resolve(database.client.workspaceMembership.create({ data: { workspaceId: f.a, userId: f.actor, role: 'ADMIN' } }))).rejects.toThrow();
    await expect(Promise.resolve(database.client.teamMembership.create({ data: { workspaceId: f.a, teamId: f.team, membershipId: randomUUID() } }))).rejects.toThrow();
  });
  test('cross-workspace project/team, issue/project, and issue/membership references fail', async () => {
    const f = await fixture(); const teamB = randomUUID(), projectB = randomUUID();
    await database.client.team.create({ data: { workspaceId: f.b, id: teamB, key: 'OPS', name: 'Operations' } });
    await database.client.project.create({ data: { workspaceId: f.b, id: projectB, teamId: teamB, key: 'OPS', name: 'Operations' } });
    await expect(Promise.resolve(database.client.project.create({ data: { workspaceId: f.a, teamId: teamB, key: 'NEW', name: 'Foreign owner' } }))).rejects.toThrow();
    await expect(Promise.resolve(database.client.teamMembership.create({ data: { workspaceId: f.a, teamId: teamB, membershipId: f.member } }))).rejects.toThrow();
    await expect(Promise.resolve(database.client.issue.create({ data: { workspaceId: f.a, projectId: projectB, sequence: 3, title: 'Foreign project', creatorMembershipId: f.member } }))).rejects.toThrow();
    await expect(Promise.resolve(database.client.issue.create({ data: { workspaceId: f.b, projectId: f.project, sequence: 3, title: 'Foreign creator', creatorMembershipId: f.owner } }))).rejects.toThrow();
    await expect(Promise.resolve(database.client.issue.update({ where: { workspaceId_id: { workspaceId: f.b, id: f.issue } }, data: { assigneeMembershipId: f.owner } }))).rejects.toThrow();
  });
  test('positive issue sequences/versions, immutable origins, and unique project sequences', async () => {
    const f = await fixture();
    for (const sequence of [0, 1]) await expect(Promise.resolve(database.client.issue.create({ data: { workspaceId: f.a, projectId: f.project, sequence, title: 'Invalid sequence', creatorMembershipId: f.member } }))).rejects.toThrow();
    await expect(Promise.resolve(database.client.issue.update({ where: { workspaceId_id: { workspaceId: f.a, id: f.issue } }, data: { version: 0 } }))).rejects.toThrow();
    await expect(Promise.resolve(database.client.issue.update({ where: { workspaceId_id: { workspaceId: f.a, id: f.issue } }, data: { workspaceId: f.b } }))).rejects.toThrow();
    await expect(Promise.resolve(database.client.project.update({ where: { workspaceId_id: { workspaceId: f.a, id: f.project } }, data: { key: 'NEW' } }))).rejects.toThrow();
  });
});

describe('server-owned tenancy and negative authorization', () => {
  test('same local IDs resolve only inside the authorized tenant; foreign reads/writes fail', async () => {
    const f = await fixture();
    const row = await f.tenancy.read(f.principal, f.a, queries => queries.issue(f.issue)); expect(row.title).toBe('Tenant A');
    await expect(f.tenancy.read(f.principal, f.b, queries => queries.issue(f.issue))).rejects.toBeInstanceOf(TenantAccessError);
    await expect(f.tenancy.read(f.principal, f.a, queries => queries.issue(f.foreign))).rejects.toBeInstanceOf(TenantAccessError);
    await expect(f.tenancy.write(f.principal, f.a, queries => queries.compareAndSetIssueTitle(f.foreign, 1, 'Attack'))).rejects.toBeInstanceOf(TenantAccessError);
    expect((await database.client.issue.findUniqueOrThrow({ where: { workspaceId_id: { workspaceId: f.b, id: f.foreign } } })).title).toBe('Private foreign issue');
  });
  test('principal/role forgery and unknown verified identities fail closed', async () => {
    const f = await fixture();
    await expect(f.tenancy.authenticate({ provider: 'test-verifier', subject: f.actor, role: 'ADMIN' })).rejects.toBeInstanceOf(TenantAccessError);
    await expect(f.tenancy.read({ userId: f.actor, role: 'ADMIN' } as unknown as VerifiedPrincipal, f.a, queries => queries.issue(f.issue))).rejects.toBeInstanceOf(TenantAccessError);
    const unknown = new Tenancy(database, { verify: async () => ({ provider: 'test-verifier', subject: randomUUID() }) }, allow);
    await expect(unknown.authenticate('unused')).rejects.toBeInstanceOf(TenantAccessError);
  });
  for (const status of ['INVITED', 'SUSPENDED'] as const) {
    test(`${status} membership rejects an already verified principal`, async () => {
      const f = await fixture(); await database.client.workspaceMembership.update({ where: { workspaceId_id: { workspaceId: f.a, id: f.member } }, data: { status } });
      await expect(f.tenancy.read(f.principal, f.a, queries => queries.issue(f.issue))).rejects.toBeInstanceOf(TenantAccessError);
    });
  }
  test('missing membership and invalid workspace selectors are denied', async () => {
    const f = await fixture();
    await expect(f.tenancy.read(f.principal, randomUUID(), queries => queries.issue(f.issue))).rejects.toBeInstanceOf(TenantAccessError);
    await expect(f.tenancy.read(f.principal, '', queries => queries.issue(f.issue))).rejects.toBeInstanceOf(TenantAccessError);
    await expect(f.tenancy.read(f.principal, "' OR TRUE --", queries => queries.issue(f.issue))).rejects.toBeInstanceOf(TenantAccessError);
  });
  test('policy defaults to denial; ADMIN never implies team access or ownership', async () => {
    const f = await fixture(); const denied = new Tenancy(database, f.verifier); const principal = await denied.authenticate(f.assertion);
    await expect(denied.read(principal, f.a, queries => queries.issue(f.issue))).rejects.toBeInstanceOf(TenantAccessError);
    await database.client.workspaceMembership.update({ where: { workspaceId_id: { workspaceId: f.a, id: f.member } }, data: { role: 'ADMIN' } });
    await database.client.teamMembership.delete({ where: { workspaceId_teamId_membershipId: { workspaceId: f.a, teamId: f.team, membershipId: f.member } } });
    await expect(f.tenancy.read(f.principal, f.a, queries => queries.issue(f.issue))).rejects.toBeInstanceOf(TenantAccessError);
  });
  test('OBSERVER and read-only handles cannot write even with an explicit broad test policy', async () => {
    const f = await fixture();
    await expect(f.tenancy.read(f.principal, f.a, queries => queries.compareAndSetIssueTitle(f.issue, 1, 'Attack'))).rejects.toBeInstanceOf(TenantAccessError);
    await database.client.workspaceMembership.update({ where: { workspaceId_id: { workspaceId: f.a, id: f.member } }, data: { role: 'OBSERVER' } });
    expect((await f.tenancy.read(f.principal, f.a, queries => queries.issue(f.issue))).title).toBe('Tenant A');
    await expect(f.tenancy.write(f.principal, f.a, queries => queries.compareAndSetIssueTitle(f.issue, 1, 'Attack'))).rejects.toBeInstanceOf(TenantAccessError);
  });
  test('bounded lists apply issue-level policy and return only selected internal projections', async () => {
    const f = await fixture();
    expect((await f.tenancy.read(f.principal, f.a, queries => queries.issues(f.project))).map(row => row.title)).toEqual(['Tenant A']);
    await expect(f.tenancy.read(f.principal, f.a, queries => queries.issues(f.project, 10000))).rejects.toBeInstanceOf(TenantAccessError);
    const filtered = new Tenancy(database, f.verifier, { allows: (_context, _action, resource) => !resource.issueId });
    const principal = await filtered.authenticate(f.assertion);
    expect(await filtered.read(principal, f.a, queries => queries.issues(f.project))).toEqual([]);
    await expect(filtered.read(principal, f.a, queries => queries.issues(f.project, 1, f.issue))).rejects.toBeInstanceOf(TenantAccessError);
  });
  test('escaped handles expire and workspace context cannot be replaced', async () => {
    const f = await fixture(); let escaped: TenantQueries | undefined;
    await f.tenancy.read(f.principal, f.a, async queries => {
      escaped = queries; expect(Object.isFrozen(queries.context)).toBe(true);
      expect(() => Object.defineProperty(queries, 'context', { value: { workspaceId: f.b } })).toThrow();
    });
    await expect(escaped!.issue(f.issue)).rejects.toBeInstanceOf(TenantAccessError);
  });
  test('authorized optimistic writes update only the scoped row and reject stale versions', async () => {
    const f = await fixture(); await f.tenancy.write(f.principal, f.a, queries => queries.compareAndSetIssueTitle(f.issue, 1, 'Changed A'));
    await expect(f.tenancy.write(f.principal, f.a, queries => queries.compareAndSetIssueTitle(f.issue, 1, 'Stale'))).rejects.toBeInstanceOf(TenantConflictError);
    expect((await database.client.issue.findUniqueOrThrow({ where: { workspaceId_id: { workspaceId: f.b, id: f.issue } } })).title).toBe('Tenant B');
  });
});

describe('archival, deletion, and concurrent integrity', () => {
  test('restrictive deletes retain workspace, user, team, project, and membership graphs', async () => {
    const f = await fixture();
    await expect(Promise.resolve(database.client.workspace.delete({ where: { id: f.a } }))).rejects.toThrow();
    await expect(Promise.resolve(database.client.user.delete({ where: { id: f.actor } }))).rejects.toThrow();
    await expect(Promise.resolve(database.client.team.delete({ where: { workspaceId_id: { workspaceId: f.a, id: f.team } } }))).rejects.toThrow();
    await expect(Promise.resolve(database.client.project.delete({ where: { workspaceId_id: { workspaceId: f.a, id: f.project } } }))).rejects.toThrow();
    await expect(Promise.resolve(database.client.workspaceMembership.delete({ where: { workspaceId_id: { workspaceId: f.a, id: f.member } } }))).rejects.toThrow();
  });
  test('archived workspace is readable through policy but rejects helper and direct writes', async () => {
    const f = await fixture(); await database.client.workspace.update({ where: { id: f.a }, data: { status: 'ARCHIVED' } });
    expect((await f.tenancy.read(f.principal, f.a, queries => queries.issue(f.issue))).title).toBe('Tenant A');
    await expect(f.tenancy.write(f.principal, f.a, queries => queries.compareAndSetIssueTitle(f.issue, 1, 'Attack'))).rejects.toBeInstanceOf(TenantAccessError);
    await expect(Promise.resolve(database.client.issue.update({ where: { workspaceId_id: { workspaceId: f.a, id: f.issue } }, data: { title: 'Direct attack' } }))).rejects.toThrow();
    await expect(Promise.resolve(database.client.team.create({ data: { workspaceId: f.a, key: 'OPS', name: 'Operations' } }))).rejects.toThrow();
  });
  test('team archival rejects active owned projects; archived project is not visible or writable', async () => {
    const f = await fixture();
    await expect(Promise.resolve(database.client.team.update({ where: { workspaceId_id: { workspaceId: f.a, id: f.team } }, data: { status: 'ARCHIVED' } }))).rejects.toThrow();
    await database.client.project.update({ where: { workspaceId_id: { workspaceId: f.a, id: f.project } }, data: { status: 'ARCHIVED' } });
    await database.client.team.update({ where: { workspaceId_id: { workspaceId: f.a, id: f.team } }, data: { status: 'ARCHIVED' } });
    await expect(f.tenancy.read(f.principal, f.a, queries => queries.issue(f.issue))).rejects.toBeInstanceOf(TenantAccessError);
    await expect(Promise.resolve(database.client.project.update({ where: { workspaceId_id: { workspaceId: f.a, id: f.project } }, data: { status: 'ACTIVE' } }))).rejects.toThrow();
    await expect(Promise.resolve(database.client.issue.update({ where: { workspaceId_id: { workspaceId: f.a, id: f.issue } }, data: { title: 'Direct attack' } }))).rejects.toThrow();
  });
  test('last active administrator cannot be demoted, suspended, or deleted', async () => {
    const f = await fixture();
    for (const data of [{ role: 'MEMBER' as const }, { status: 'SUSPENDED' as const }]) {
      await expect(Promise.resolve(database.client.workspaceMembership.update({ where: { workspaceId_id: { workspaceId: f.a, id: f.owner } }, data }))).rejects.toThrow();
    }
    await expect(Promise.resolve(database.client.workspaceMembership.delete({ where: { workspaceId_id: { workspaceId: f.a, id: f.owner } } }))).rejects.toThrow();
  });
  test('concurrent administrator demotions preserve at least one active admin', async () => {
    const f = await fixture(); await database.client.workspaceMembership.update({ where: { workspaceId_id: { workspaceId: f.a, id: f.member } }, data: { role: 'ADMIN' } });
    const results = await Promise.allSettled([f.member, f.owner].map(id => database.transaction(tx => tx.workspaceMembership.update({ where: { workspaceId_id: { workspaceId: f.a, id } }, data: { role: 'MEMBER' } }))));
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(await database.client.workspaceMembership.count({ where: { workspaceId: f.a, role: 'ADMIN', status: 'ACTIVE' } })).toBe(1);
  });
  test('sequence allocation is atomic; failed writes roll back allocation and retries are explicit', async () => {
    const f = await fixture();
    const allocate = async (): Promise<number> => {
      for (let attempt = 0; attempt < 3; attempt++) {
        try { return await f.tenancy.write(f.principal, f.a, queries => queries.allocateIssueSequence(f.project)); }
        catch (error) { if (!(error instanceof TenantConflictError) || attempt === 2) throw error; }
      }
      throw new Error('Retry budget exhausted');
    };
    const numbers = await Promise.all([allocate(), allocate()]); expect(numbers.sort()).toEqual([2, 3]);
    const before = await database.client.project.findUniqueOrThrow({ where: { workspaceId_id: { workspaceId: f.a, id: f.project } } });
    await expect(f.tenancy.write(f.principal, f.a, async queries => { await queries.allocateIssueSequence(f.project); throw new TenantAccessError(); })).rejects.toBeInstanceOf(TenantAccessError);
    expect((await database.client.project.findUniqueOrThrow({ where: { workspaceId_id: { workspaceId: f.a, id: f.project } } })).currentSequence).toBe(before.currentSequence);
  });
  test('membership revocation serializes with a scoped transaction and later access is denied', async () => {
    const f = await fixture(); let release!: () => void; let started!: () => void;
    const waiting = new Promise<void>(resolve => { release = resolve; }); const locked = new Promise<void>(resolve => { started = resolve; });
    const read = f.tenancy.read(f.principal, f.a, async queries => { started(); await waiting; return queries.issue(f.issue); });
    await locked;
    const revoked = database.client.workspaceMembership.update({ where: { workspaceId_id: { workspaceId: f.a, id: f.member } }, data: { status: 'SUSPENDED' } });
    release(); expect((await read).title).toBe('Tenant A'); await revoked;
    await expect(f.tenancy.read(f.principal, f.a, queries => queries.issue(f.issue))).rejects.toBeInstanceOf(TenantAccessError);
  });
});

describe('dependency DAG foundation is not prematurely writable', () => {
  test('normal valid, invalid, and bulk writes all remain disabled', async () => {
    const f = await fixture(); const next = randomUUID();
    await database.client.issue.create({ data: { workspaceId: f.a, id: next, projectId: f.project, sequence: 2, title: 'Second issue', creatorMembershipId: f.member } });
    const data = { workspaceId: f.a, upstreamIssueId: f.issue, downstreamIssueId: next, creatorMembershipId: f.member };
    await expect(Promise.resolve(database.client.dependencyEdge.create({ data }))).rejects.toThrow();
    await expect(Promise.resolve(database.client.dependencyEdge.createMany({ data: [data] }))).rejects.toThrow();
    expect(await database.client.dependencyEdge.count({ where: { workspaceId: f.a } })).toBe(0);
  });
  test('latent composite FKs, self-link check, and directed uniqueness enforce structure under isolated administrative inspection', async () => {
    const f = await fixture(); const next = randomUUID();
    await database.client.issue.create({ data: { workspaceId: f.a, id: next, projectId: f.project, sequence: 2, title: 'Second issue', creatorMembershipId: f.member } });
    // Administrative test only, in this freshly created disposable database.
    // Transactional DDL restores the gate on every rollback; no runtime bypass
    // flag, setting, or API can disable it. Each failure proves the latent SQL constraint.
    const base = { workspaceId: f.a, upstreamIssueId: f.issue, downstreamIssueId: next, creatorMembershipId: f.member };
    for (const data of [{ ...base, downstreamIssueId: f.issue }, { ...base, downstreamIssueId: f.foreign }, { ...base, creatorMembershipId: randomUUID() }]) {
      await expect(database.transaction(async tx => {
        await tx.$executeRawUnsafe('ALTER TABLE dependency_edges DISABLE TRIGGER dependency_write_gate');
        await tx.dependencyEdge.create({ data });
      })).rejects.toThrow();
    }
    await expect(database.transaction(async tx => {
      await tx.$executeRawUnsafe('ALTER TABLE dependency_edges DISABLE TRIGGER dependency_write_gate');
      await tx.dependencyEdge.create({ data: base });
      await tx.dependencyEdge.create({ data: base });
    })).rejects.toThrow();
    expect(await database.client.dependencyEdge.count({ where: { workspaceId: f.a } })).toBe(0);
    const gate = await database.client.$queryRaw<{ tgenabled: string }[]>`SELECT tgenabled::text FROM pg_trigger WHERE tgname = 'dependency_write_gate'`;
    expect(gate[0]?.tgenabled).toBe('O');
    await expect(Promise.resolve(database.client.dependencyEdge.create({ data: base }))).rejects.toThrow();
  });
});

test('keyset pagination is bounded and foreign or out-of-project cursors cannot alter scope', async () => {
  const f = await fixture(); const next = randomUUID();
  await database.client.issue.create({ data: { workspaceId: f.a, id: next, projectId: f.project, sequence: 2, title: 'Next A', creatorMembershipId: f.member, createdAt: new Date(Date.now() + 1000) } });
  const first = await f.tenancy.read(f.principal, f.a, queries => queries.issues(f.project, 1));
  expect(first[0]?.id).toBe(f.issue);
  const second = await f.tenancy.read(f.principal, f.a, queries => queries.issues(f.project, 1, f.issue)); expect(second[0]?.id).toBe(next);
  expect(await f.tenancy.read(f.principal, f.a, queries => queries.issues(f.project, 1, next))).toHaveLength(0);
  await expect(f.tenancy.read(f.principal, f.a, queries => queries.issues(f.project, 1, f.foreign))).rejects.toBeInstanceOf(TenantAccessError);
});
test('verifier exceptions and non-boolean policy grants remain generic and fail closed', async () => {
  const f = await fixture();
  const broken = new Tenancy(database, { verify: async () => { throw new Error('private credential canary'); } });
  await expect(broken.authenticate('unused')).rejects.toThrow('Resource unavailable');
  const unsafe = new Tenancy(database, f.verifier, { allows: () => 'yes' as unknown as boolean }); const principal = await unsafe.authenticate(f.assertion);
  await expect(unsafe.read(principal, f.a, queries => queries.issue(f.issue))).rejects.toBeInstanceOf(TenantAccessError);
});


test('inactive membership cannot become an assignee or create new issue history', async () => {
  const f = await fixture();
  await database.client.workspaceMembership.update({ where: { workspaceId_id: { workspaceId: f.a, id: f.member } }, data: { status: 'SUSPENDED' } });
  await expect(Promise.resolve(database.client.issue.update({ where: { workspaceId_id: { workspaceId: f.a, id: f.issue } }, data: { assigneeMembershipId: f.member } }))).rejects.toThrow();
  await expect(Promise.resolve(database.client.issue.create({ data: { workspaceId: f.a, projectId: f.project, sequence: 2, title: 'Inactive creator', creatorMembershipId: f.member } }))).rejects.toThrow();
  expect((await database.client.issue.findUniqueOrThrow({ where: { workspaceId_id: { workspaceId: f.a, id: f.issue } } })).creatorMembershipId).toBe(f.member);
});

describe('PR24 PostgreSQL guard regressions', () => {
  test('already-migrated upgrade preserves rows and original history and repairs suspended assignee updates', async () => {
    const name = databaseName + '_upgrade';
    const upgradeUrl = new URL(originalUrl!); upgradeUrl.pathname = '/' + name;
    const upgrade = new Database(upgradeUrl.toString());
    const directory = await mkdtemp(resolve(tmpdir(), 'unblok-upgrade-'));
    let exists = false;
    try {
      await cp(resolve(root, 'packages/database/prisma/schema.prisma'), resolve(directory, 'schema.prisma'));
      for (const migration of ['migration_lock.toml', '20261010000000_foundation', '20261010010000_domain_tenancy']) {
        await cp(resolve(root, 'packages/database/prisma/migrations', migration), resolve(directory, 'migrations', migration), { recursive: true });
      }
      await admin.client.$executeRawUnsafe(`CREATE DATABASE "${name}"`); exists = true;
      await prisma(['migrate', 'deploy', '--schema', resolve(directory, 'schema.prisma')], upgradeUrl.toString());
      await upgrade.connect();
      // The old schema intentionally predates auth epochs; seed without minting
      // a principal until the additive migration has been deployed.
      const f = await fixture(upgrade, false);
      const where = { workspaceId_id: { workspaceId: f.a, id: f.issue } };
      await upgrade.client.issue.update({ where, data: { assigneeMembershipId: f.member } });
      await upgrade.client.workspaceMembership.update({ where: { workspaceId_id: { workspaceId: f.a, id: f.member } }, data: { status: 'SUSPENDED' } });
      await expect(Promise.resolve(upgrade.client.issue.update({ where, data: { title: 'Before repair' } }))).rejects.toThrow('Assignee requires active');
      const history = await upgrade.client.$queryRaw<{ migration_name: string; checksum: string; finished_at: Date }[]>`SELECT migration_name, checksum, finished_at FROM _prisma_migrations ORDER BY migration_name`;
      await prisma(['migrate', 'deploy', '--schema', 'packages/database/prisma/schema.prisma'], upgradeUrl.toString());
      const after = await upgrade.client.$queryRaw<typeof history>`SELECT migration_name, checksum, finished_at FROM _prisma_migrations ORDER BY migration_name`;
      expect(after.slice(0, 2)).toEqual(history);
      expect(after).toHaveLength(6);
      expect(await upgrade.client.passwordCredential.count()).toBe(0); // No implicit credential/contact-email migration.
      expect((await upgrade.client.user.findUniqueOrThrow({ where: { id: f.actor } })).authEpoch).toBe(1n);
      expect(await upgrade.client.authSessionFamily.count()).toBe(0);
      const row = await upgrade.client.issue.update({ where, data: { title: 'After repair' } });
      expect(row.title).toBe('After repair'); expect(row.assigneeMembershipId).toBe(f.member);
      expect(await upgrade.client.issue.count()).toBe(3);
      expect(await prisma(['migrate', 'deploy', '--schema', 'packages/database/prisma/schema.prisma'], upgradeUrl.toString())).toContain('No pending migrations');
      expect(await prisma(['migrate', 'diff', '--from-schema-datasource', 'packages/database/prisma/schema.prisma', '--to-schema-datamodel', 'packages/database/prisma/schema.prisma', '--exit-code'], upgradeUrl.toString())).toContain('No difference');
    } finally {
      await upgrade.close();
      if (exists) await admin.client.$executeRawUnsafe(`DROP DATABASE "${name}" WITH (FORCE)`);
      await rm(directory, { recursive: true, force: true });
    }
  }, 60000);

  for (const archived of [false, true]) {
    test(`all five tenant-guarded DELETE operations ${archived ? 'reject archived workspaces' : 'permit unreferenced records in active workspaces'}`, async () => {
      const f = await fixture();
      const user = await database.client.user.create({ data: { name: 'Deletable member' } });
      const membership = await database.client.workspaceMembership.create({ data: { workspaceId: f.a, userId: user.id, role: 'MEMBER' } });
      const team = await database.client.team.create({ data: { workspaceId: f.a, key: 'OPS', name: 'Operations' } });
      const project = await database.client.project.create({ data: { workspaceId: f.a, teamId: f.team, key: 'OPS', name: 'Empty project' } });
      if (archived) await database.client.workspace.update({ where: { id: f.a }, data: { status: 'ARCHIVED' } });
      const deletes = [
        () => database.client.issue.delete({ where: { workspaceId_id: { workspaceId: f.a, id: f.issue } } }),
        () => database.client.teamMembership.delete({ where: { workspaceId_teamId_membershipId: { workspaceId: f.a, teamId: f.team, membershipId: f.member } } }),
        () => database.client.project.delete({ where: { workspaceId_id: { workspaceId: f.a, id: project.id } } }),
        () => database.client.team.delete({ where: { workspaceId_id: { workspaceId: f.a, id: team.id } } }),
        () => database.client.workspaceMembership.delete({ where: { workspaceId_id: { workspaceId: f.a, id: membership.id } } }),
      ];
      for (const remove of deletes) {
        if (archived) await expect(Promise.resolve(remove())).rejects.toThrow('Workspace unavailable for mutation');
        else expect((await remove()).workspaceId).toBe(f.a);
      }
      expect(await database.client.issue.count({ where: { workspaceId: f.a } })).toBe(archived ? 1 : 0);
      expect(await database.client.workspaceMembership.count({ where: { workspaceId: f.a, id: membership.id } })).toBe(archived ? 1 : 0);
    });
  }

  for (const status of ['SUSPENDED', 'INVITED'] as const) {
    test(`unchanged ${status} assignees retain history; new assignments on INSERT and UPDATE are denied`, async () => {
      const f = await fixture();
      const user = await database.client.user.create({ data: { name: 'Historical assignee' } });
      const assignee = await database.client.workspaceMembership.create({ data: { workspaceId: f.a, userId: user.id, role: 'MEMBER', status: 'ACTIVE' } });
      const where = { workspaceId_id: { workspaceId: f.a, id: f.issue } };
      await database.client.issue.update({ where, data: { assigneeMembershipId: assignee.id } });
      await database.client.workspaceMembership.update({ where: { workspaceId_id: { workspaceId: f.a, id: assignee.id } }, data: { status } });
      await f.tenancy.write(f.principal, f.a, queries => queries.compareAndSetIssueTitle(f.issue, 1, 'Historical assignment retained'));
      expect((await database.client.issue.findUniqueOrThrow({ where })).assigneeMembershipId).toBe(assignee.id);
      await database.client.issue.update({ where, data: { assigneeMembershipId: null } });
      await expect(Promise.resolve(database.client.issue.update({ where, data: { assigneeMembershipId: assignee.id } }))).rejects.toThrow('Assignee requires active');
      await expect(Promise.resolve(database.client.issue.create({ data: { workspaceId: f.a, projectId: f.project, sequence: 2, title: 'Inactive new assignment', creatorMembershipId: f.member, assigneeMembershipId: assignee.id } }))).rejects.toThrow('Assignee requires active');
      expect((await database.client.issue.findUniqueOrThrow({ where })).assigneeMembershipId).toBeNull();
    });
  }

  test('issue restoration requires both active project and active team', async () => {
    const f = await fixture();
    const where = { workspaceId_id: { workspaceId: f.a, id: f.issue } };
    await database.client.issue.update({ where, data: { status: 'ARCHIVED' } });
    expect((await database.client.issue.update({ where, data: { status: 'ACTIVE' } })).status).toBe('ACTIVE');
    await database.client.issue.update({ where, data: { status: 'ARCHIVED' } });
    await database.client.project.update({ where: { workspaceId_id: { workspaceId: f.a, id: f.project } }, data: { status: 'ARCHIVED' } });
    await expect(Promise.resolve(database.client.issue.update({ where, data: { status: 'ACTIVE' } }))).rejects.toThrow('Issue requires active owning project and team');
    await database.client.team.update({ where: { workspaceId_id: { workspaceId: f.a, id: f.team } }, data: { status: 'ARCHIVED' } });
    await expect(Promise.resolve(database.client.issue.update({ where, data: { status: 'ACTIVE' } }))).rejects.toThrow('Issue requires active owning project and team');
    expect((await database.client.issue.findUniqueOrThrow({ where })).status).toBe('ARCHIVED');
  });
});
