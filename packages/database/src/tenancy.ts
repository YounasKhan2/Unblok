import type { Prisma, WorkspaceRole, RecordStatus } from '@prisma/client';
import { AsyncLocalStorage } from 'node:async_hooks';
import type { Database } from './index';
import { AuthFences, AuthDeniedError, AuthUnavailableError, lockAuthority, type PrincipalAuthority, type SessionVerifier } from './auth-fences';

export interface VerifiedIdentity { readonly provider: string; readonly subject: string }
// The implementation must cryptographically verify its assertion. Never bind a
// verifier that simply returns request.body.userId/provider/subject in production.
export interface IdentityVerifier { verify(assertion: unknown): Promise<VerifiedIdentity | null> }
declare const principalBrand: unique symbol;
export type VerifiedPrincipal = Readonly<{ [principalBrand]: true }>;
export type TenantAction = 'issue:read' | 'issue:update' | 'project:sequence';
export interface WorkspaceContext {
  readonly workspaceId: string;
  readonly membershipId: string;
  readonly userId: string;
  readonly role: WorkspaceRole;
  readonly status: RecordStatus;
}
export interface ResourceScope { readonly projectId: string; readonly teamId: string; readonly issueId?: string }
export interface AuthorizationPolicy {
  // Pure, synchronous, server-owned decision; no external I/O inside transactions.
  allows(context: Readonly<WorkspaceContext>, action: TenantAction, resource: Readonly<ResourceScope>): boolean;
}
export const denyAll: AuthorizationPolicy = Object.freeze({ allows: () => false });
export class TenantAccessError extends Error {
  constructor() { super('Resource unavailable'); this.name = 'TenantAccessError'; }
}
export class TenantConflictError extends Error {
  constructor() { super('Concurrent change; retry the complete operation'); this.name = 'TenantConflictError'; }
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function assertId(value: string) { if (!uuid.test(value)) throw new TenantAccessError(); }
export interface IssueProjection { readonly id: string; readonly projectId: string; readonly sequence: number; readonly title: string; readonly version: number }

// Only Tenancy can create a live scoped handle. Private fields and transaction
// lifetime checks reject forged or escaped handles at runtime as well as in TS.
class ScopedQueries {
  #active = true;
  #tx: Prisma.TransactionClient;
  #context: Readonly<WorkspaceContext>;
  #mode: 'read' | 'write';
  #policy: AuthorizationPolicy;
  constructor(tx: Prisma.TransactionClient, context: Readonly<WorkspaceContext>, mode: 'read' | 'write', policy: AuthorizationPolicy, private readonly assertAuthority: () => void) {
    this.#tx = tx; this.#context = context; this.#mode = mode; this.#policy = policy; Object.freeze(this);
  }
  get context() { return this.#context; }
  expire() { this.#active = false; }
  private assertActive() { if (!this.#active) throw new TenantAccessError(); this.assertAuthority(); }
  private async authorize(projectId: string, action: TenantAction, issueId?: string) {
    this.assertActive(); assertId(projectId);
    if (action !== 'issue:read' && (this.#mode !== 'write' || this.context.status !== 'ACTIVE' || this.context.role === 'OBSERVER')) throw new TenantAccessError();
    const project = await this.#tx.project.findFirst({
      where: { workspaceId: this.context.workspaceId, id: projectId, status: 'ACTIVE', team: {
        status: 'ACTIVE', memberships: { some: { workspaceId: this.context.workspaceId, membershipId: this.context.membershipId } },
      } }, select: { id: true, teamId: true },
    });
    if (!project) throw new TenantAccessError();
    const resource: ResourceScope = Object.freeze({ projectId: project.id, teamId: project.teamId, ...(issueId ? { issueId } : {}) });
    // Only exact true grants authority: undefined, truthy strings, etc. fail closed.
    if (this.#policy.allows(this.context, action, resource) !== true) throw new TenantAccessError();
    return resource;
  }
  async issue(id: string): Promise<IssueProjection> {
    this.assertActive(); assertId(id);
    const row = await this.#tx.issue.findFirst({ where: { workspaceId: this.context.workspaceId, id, status: 'ACTIVE' },
      select: { id: true, projectId: true, sequence: true, title: true, version: true } });
    if (!row) throw new TenantAccessError();
    await this.authorize(row.projectId, 'issue:read', row.id);
    return Object.freeze(row);
  }
  async issues(projectId: string, limit = 50, after?: string): Promise<readonly IssueProjection[]> {
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new TenantAccessError();
    if (after) assertId(after);
    const projectScope = await this.authorize(projectId, 'issue:read');
    const cursor = after ? await this.#tx.issue.findFirst({ where: { workspaceId: this.context.workspaceId, projectId, id: after, status: 'ACTIVE' }, select: { id: true, createdAt: true } }) : null;
    if (after && !cursor) throw new TenantAccessError();
    if (cursor && this.#policy.allows(this.context, 'issue:read', Object.freeze({ ...projectScope, issueId: cursor.id })) !== true) throw new TenantAccessError();
    const rows = await this.#tx.issue.findMany({
      where: { workspaceId: this.context.workspaceId, projectId, status: 'ACTIVE', ...(cursor ? { OR: [{ createdAt: { gt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { gt: cursor.id } }] } : {}) },
      take: limit, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }], select: { id: true, projectId: true, sequence: true, title: true, version: true },
    });
    // A project-level grant is not an implicit grant to every issue.
    const visible: IssueProjection[] = [];
    for (const row of rows) {
      if (this.#policy.allows(this.context, 'issue:read', Object.freeze({ projectId, teamId: projectScope.teamId, issueId: row.id })) === true) visible.push(Object.freeze(row));
    }
    return Object.freeze(visible);
  }
  // Narrow persistence primitive, not a CRUD service or public DTO. Ownership,
  // archival, team membership, and a trusted explicit policy grant all apply.
  async compareAndSetIssueTitle(id: string, expectedVersion: number, title: string): Promise<void> {
    this.assertActive(); assertId(id);
    if (!Number.isInteger(expectedVersion) || expectedVersion < 1 || title.trim().length < 1 || title.length > 300) throw new TenantAccessError();
    const row = await this.#tx.issue.findFirst({ where: { workspaceId: this.context.workspaceId, id, status: 'ACTIVE' }, select: { projectId: true } });
    if (!row) throw new TenantAccessError();
    await this.authorize(row.projectId, 'issue:update', id);
    const result = await this.#tx.issue.updateMany({ where: { workspaceId: this.context.workspaceId, id, version: expectedVersion, status: 'ACTIVE' }, data: { title, version: { increment: 1 } } });
    if (result.count !== 1) throw new TenantConflictError();
  }
  async allocateIssueSequence(projectId: string): Promise<number> {
    await this.authorize(projectId, 'project:sequence');
    const project = await this.#tx.project.update({ where: { workspaceId_id: { workspaceId: this.context.workspaceId, id: projectId } }, data: { currentSequence: { increment: 1 } }, select: { currentSequence: true } });
    return project.currentSequence;
  }
}
export type TenantQueries = Pick<ScopedQueries, 'context' | 'issue' | 'issues' | 'compareAndSetIssueTitle' | 'allocateIssueSequence'>;

export class Tenancy {
  #principals = new WeakMap<VerifiedPrincipal, PrincipalAuthority>();
  #sessionRequest = new AsyncLocalStorage<VerifiedPrincipal>();
  #fences: AuthFences;
  constructor(private readonly database: Database, private readonly verifier: IdentityVerifier, private readonly policy: AuthorizationPolicy = denyAll, private readonly sessions?: SessionVerifier) {
    this.#fences = new AuthFences(database);
  }
  private mint(authority: PrincipalAuthority): VerifiedPrincipal {
    const principal = Object.freeze({}) as VerifiedPrincipal;
    this.#principals.set(principal, authority); return principal;
  }
  // One server-owned request/action boundary, never a reusable session principal.
  // Await the complete request work in run; subsequent requests must verify again.
  async authenticateSession<T>(assertion: unknown, run: (principal: VerifiedPrincipal) => Promise<T>, signal?: AbortSignal): Promise<T> {
    if (typeof run !== 'function' || signal?.aborted) throw new TenantAccessError();
    let principal: VerifiedPrincipal;
    try {
      const session = await this.sessions?.verify(assertion);
      if (!session) throw new TenantAccessError();
      principal = this.mint(await this.#fences.validate(session));
    } catch (error) {
      if (error instanceof AuthUnavailableError) throw error;
      if (error instanceof AuthDeniedError || error instanceof TenantAccessError) throw new TenantAccessError();
      throw new AuthUnavailableError();
    }
    const expire = () => this.#principals.delete(principal);
    signal?.addEventListener('abort', expire, { once: true });
    try {
      if (signal?.aborted) throw new TenantAccessError();
      return await this.#sessionRequest.run(principal, () => run(principal));
    } finally { expire(); signal?.removeEventListener('abort', expire); }
  }
  async authenticate(assertion: unknown): Promise<VerifiedPrincipal> {
    try {
      const identity = await this.verifier.verify(assertion);
      if (!identity || typeof identity.provider !== 'string' || !identity.provider.trim() || typeof identity.subject !== 'string' || !identity.subject.trim()) throw new TenantAccessError();
      return this.mint(await this.#fences.resolveIdentity(identity.provider, identity.subject));
    } catch (error) { if (error instanceof AuthUnavailableError) throw error; throw new TenantAccessError(); }
  }

  read<T>(principal: VerifiedPrincipal, workspaceId: string, run: (queries: TenantQueries) => Promise<T>) { return this.scoped(principal, workspaceId, 'read', run); }
  write<T>(principal: VerifiedPrincipal, workspaceId: string, run: (queries: TenantQueries) => Promise<T>) { return this.scoped(principal, workspaceId, 'write', run); }
  private assertPrincipal(principal: VerifiedPrincipal, authority: PrincipalAuthority) {
    if (this.#principals.get(principal) !== authority || (authority.session && this.#sessionRequest.getStore() !== principal)) throw new TenantAccessError();
  }
  private async scoped<T>(principal: VerifiedPrincipal, workspaceId: string, mode: 'read' | 'write', run: (queries: TenantQueries) => Promise<T>): Promise<T> {
    const authority = this.#principals.get(principal); if (!authority) throw new TenantAccessError(); assertId(workspaceId);
    this.assertPrincipal(principal, authority);
    const userId = authority.userId;
    try {
      return await this.database.transaction(async tx => {
        this.assertPrincipal(principal, authority);
        await tx.$executeRaw`SET LOCAL lock_timeout = '1500ms'`;
        await tx.$executeRaw`SET LOCAL statement_timeout = '4000ms'`;
        // Global order: user → family → workspace → resource. Held through commit.
        await lockAuthority(tx, authority);
        this.assertPrincipal(principal, authority);
        // Lock mode is a closed server enum, not interpolated request text.
        const workspace = mode === 'write'
          ? await tx.$queryRaw<{ status: RecordStatus }[]>`SELECT status FROM workspaces WHERE id = ${workspaceId}::uuid FOR UPDATE`
          : await tx.$queryRaw<{ status: RecordStatus }[]>`SELECT status FROM workspaces WHERE id = ${workspaceId}::uuid FOR SHARE`;
        if (!workspace[0] || (mode === 'write' && workspace[0].status !== 'ACTIVE')) throw new TenantAccessError();
        const membership = await tx.workspaceMembership.findUnique({ where: { workspaceId_userId: { workspaceId, userId } }, select: { id: true, role: true, status: true } });
        if (!membership || membership.status !== 'ACTIVE') throw new TenantAccessError();
        const context = Object.freeze({ workspaceId, membershipId: membership.id, userId, role: membership.role, status: workspace[0].status });
        const queries = new ScopedQueries(tx, context, mode, this.policy, () => this.assertPrincipal(principal, authority));
        try {
          const result = await run(queries);
          this.assertPrincipal(principal, authority);
          // Recheck DB time after callback: expiry during work rolls back writes.
          await lockAuthority(tx, authority);
          this.assertPrincipal(principal, authority);
          return result;
        } finally { queries.expire(); }
      });
    } catch (error) {
      if (error instanceof TenantAccessError || error instanceof TenantConflictError) throw error;
      if (error instanceof AuthDeniedError) throw new TenantAccessError();
      const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
      const meta = error && typeof error === 'object' && 'meta' in error ? error.meta : undefined;
      const sqlCode = meta && typeof meta === 'object' && 'code' in meta ? meta.code : undefined;
      if (code === 'P2034' || code === 'P2028' || (code === 'P2010' && (sqlCode === '40001' || sqlCode === '40P01'))) throw new TenantConflictError();
      // Never expose raw Prisma errors, FK details, values, or foreign existence.
      throw new AuthUnavailableError();
    }
  }
}
