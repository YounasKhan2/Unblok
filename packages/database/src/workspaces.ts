import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { Prisma, type WorkspaceRole, type RecordStatus } from '@prisma/client';
import type { PrincipalAuthority } from './auth-fences';

export interface WorkspaceKeys { readonly active: string; readonly cursors: Readonly<Record<string, string>>; readonly idempotency: string }
export class WorkspaceFault extends Error {
  constructor(readonly reason: 'NOT_FOUND' | 'CURSOR_STALE' | 'INVALID_REQUEST' | 'CONFLICT' | 'IDEMPOTENCY_RESULT_EXPIRED' | 'PRECONDITION_REQUIRED' | 'PRECONDITION_FAILED') { super(reason); this.name = 'WorkspaceFault'; }
}
type Row = { id: string; slug: string; name: string; status: RecordStatus; membershipRole: WorkspaceRole };
const id = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const fault = () => new WorkspaceFault('INVALID_REQUEST');
function mac(key: string, domain: string, data: string) { return createHmac('sha256', Buffer.from(key, 'hex')).update(domain + '\0' + data).digest('base64url'); }
export function validWorkspaceKeys(keys: WorkspaceKeys) {
  const values = Object.values(keys.cursors);
  return /^[A-Za-z0-9_-]{1,40}$/.test(keys.active) && Object.hasOwn(keys.cursors, keys.active) && values.length >= 1 && values.length <= 2 &&
    Object.keys(keys.cursors).every(k => /^[A-Za-z0-9_-]{1,40}$/.test(k)) && [...values, keys.idempotency].every(k => /^[0-9a-f]{64}$/.test(k)) &&
    new Set([...values, keys.idempotency]).size === values.length + 1;
}
type Cursor = { v: 1; kid: string; actor: string; operation: 'workspaces:list:v1'; sort: string; limit: number; revision: string; last: string; issued: number; expires: number };
function decode(token: string, keys: WorkspaceKeys): Cursor {
  if (token.length > 2048 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/.test(token)) throw fault();
  const [encoded, signature] = token.split('.');
  let c: Cursor;
  try { c = JSON.parse(Buffer.from(encoded!, 'base64url').toString('utf8')); } catch { throw fault(); }
  if (!c || Object.keys(c).sort().join(',') !== 'actor,expires,issued,kid,last,limit,operation,revision,sort,v' ||
    c.v !== 1 || c.operation !== 'workspaces:list:v1' || typeof c.kid !== 'string' || !Object.hasOwn(keys.cursors, c.kid) ||
    !id.test(c.actor) || !id.test(c.last) || !/^[1-9][0-9]{0,18}$/.test(c.revision) || !Number.isSafeInteger(c.issued) || !Number.isSafeInteger(c.expires) ||
    c.issued > Date.now() || c.expires <= Date.now() || c.expires <= c.issued || c.expires - c.issued > 900000 ||
    !Number.isInteger(c.limit) || c.limit < 1 || c.limit > 100 || !['workspace_asc', 'workspace_desc'].includes(c.sort)) throw fault();
  const expected = mac(keys.cursors[c.kid]!, 'unblok-api-cursor-v1', encoded!);
  if (!timingSafeEqual(Buffer.from(signature!), Buffer.from(expected))) throw fault();
  return c;
}
function encode(c: Cursor, keys: WorkspaceKeys) { const payload = Buffer.from(JSON.stringify(c)).toString('base64url'); return payload + '.' + mac(keys.cursors[keys.active]!, 'unblok-api-cursor-v1', payload); }
function self(row: Row, membershipId: string) {
  return { workspaceId: row.id, membershipId, role: row.membershipRole, membershipStatus: 'ACTIVE' as const, workspaceStatus: row.status,
    capabilities: { readWorkspace: true, listMembers: false, inviteMembers: false, createTeam: false, writeIssues: false, writeDependencies: false, completeDependentIssues: false } };
}
export async function workspaceContext(tx: Prisma.TransactionClient, actor: string, workspaceId: string) {
  if (!id.test(workspaceId)) throw fault();
  const rows = await tx.$queryRaw<Row[]>`SELECT w.id, w.slug, w.name, w.status, m.role AS "membershipRole"
    FROM workspaces w JOIN workspace_memberships m ON m.workspace_id = w.id AND m.user_id = ${actor}::uuid
    WHERE w.id = ${workspaceId}::uuid AND m.status = 'ACTIVE' FOR SHARE OF w`;
  // Lock the revision only after workspace locks. A membership transition that
  // committed after this SERIALIZABLE snapshot forces40001 rather than a stale
  // authorization result, even when the workspace tuple itself did not change.
  await tx.$queryRaw`SELECT revision FROM workspace_discovery_revisions WHERE user_id = ${actor}::uuid FOR SHARE`;
  if (!rows[0]) throw new WorkspaceFault('NOT_FOUND');
  const membership = await tx.workspaceMembership.findUniqueOrThrow({ where: { workspaceId_userId: { workspaceId, userId: actor } }, select: { id: true } });
  return { workspace: rows[0], self: self(rows[0], membership.id) };
}
export async function discoverWorkspaces(tx: Prisma.TransactionClient, authority: PrincipalAuthority, query: { limit: number; sort: string; after?: string }, keys: WorkspaceKeys) {
  const revisions = await tx.$queryRaw<{ revision: bigint }[]>`SELECT revision FROM workspace_discovery_revisions WHERE user_id = ${authority.userId}::uuid`;
  if (!revisions[0]) throw new WorkspaceFault('NOT_FOUND');
  const revision = revisions[0].revision.toString();
  const cursor = query.after ? decode(query.after, keys) : undefined;
  if (cursor && (cursor.actor !== authority.userId || cursor.sort !== query.sort || cursor.limit !== query.limit)) throw fault();
  if (cursor && cursor.revision !== revision) throw new WorkspaceFault('CURSOR_STALE');
  const direction = query.sort === 'workspace_asc' ? Prisma.sql`ASC` : Prisma.sql`DESC`;
  const range = cursor ? (query.sort === 'workspace_asc' ? Prisma.sql`AND w.id > ${cursor.last}::uuid` : Prisma.sql`AND w.id < ${cursor.last}::uuid`) : Prisma.empty;
  // At most 101 rows and workspace locks; the existing membership mutation
  // trigger takes an exclusive workspace lock. SERIALIZABLE rejects snapshots
  // whose membership/revision changed before this ordered read can complete.
  const rows = await tx.$queryRaw<Row[]>(Prisma.sql`SELECT w.id, w.slug, w.name, w.status, m.role AS "membershipRole"
    FROM workspace_memberships m JOIN workspaces w ON w.id = m.workspace_id
    WHERE m.user_id = ${authority.userId}::uuid AND m.status = 'ACTIVE' ${range}
    ORDER BY w.id ${direction} LIMIT ${query.limit + 1} FOR SHARE OF w`);
  await tx.$queryRaw`SELECT revision FROM workspace_discovery_revisions WHERE user_id = ${authority.userId}::uuid FOR SHARE`;
  const items: Row[] = []; let bytes = 0;
  for (const row of rows.slice(0, query.limit)) {
    const size = Buffer.byteLength(JSON.stringify(row), 'utf8') + 1;
    // Reserve4KiB for envelope and the bounded cursor; never truncate JSON.
    if (bytes + size > 61440) break;
    bytes += size; items.push(row);
  }
  if (rows.length && !items.length) throw new WorkspaceFault('CONFLICT');
  const hasMore = rows.length > items.length, issued = Date.now();
  const nextCursor = hasMore ? encode({ v: 1, kid: keys.active, actor: authority.userId, operation: 'workspaces:list:v1', sort: query.sort,
    limit: query.limit, revision, last: items.at(-1)!.id, issued, expires: issued + 900000 }, keys) : null;
  return { items, page: { hasMore, nextCursor } };
}
export async function createWorkspace(tx: Prisma.TransactionClient, authority: PrincipalAuthority, input: { name: string; slug: string; key: string }, keys: WorkspaceKeys) {
  if (!id.test(input.key) || input.name !== input.name.trim() || input.name.length < 1 || input.name.length > 120 ||
    input.slug.length > 63 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)) throw fault();
  const actor = authority.userId, scope = 'account:' + actor;
  const digest = Buffer.from(mac(keys.idempotency, 'unblok-workspace-create-v1', JSON.stringify({ name: input.name, slug: input.slug })), 'base64url').toString('hex');
  // Discover immutable result pointer without a lock, then order an existing
  // workspace before the ledger reservation. Re-read under the reservation.
  const pointers = await tx.$queryRaw<{ workspace_id: string }[]>`SELECT workspace_id FROM workspace_creation_results
    WHERE actor_id = ${actor}::uuid AND scope_key = ${scope} AND operation = 'workspace:create:v1' AND request_key = ${input.key}::uuid`;
  // Finish scope authorization before taking any ledger lock. The workspace
  // and revision SHARE locks retain that decision through transaction commit;
  // a stale SERIALIZABLE membership snapshot is rejected here, before inspecting
  // stored payload/result/expiry. Never discover or lock another workspace later.
  if (pointers[0]) await workspaceContext(tx, actor, pointers[0].workspace_id);
  const reservation = randomUUID();
  const inserted = await tx.$queryRaw<{id:string}[]>`INSERT INTO workspace_creation_results(id,actor_id,scope_key,request_key,payload_digest,retain_until)
    VALUES (${reservation}::uuid,${actor}::uuid,${scope},${input.key}::uuid,${digest},statement_timestamp()+interval '24 hours')
    ON CONFLICT(actor_id,scope_key,operation,request_key) DO NOTHING RETURNING id`;
  const records = await tx.$queryRaw<{ payload_digest: string; workspace_id: string; result: unknown; expired: boolean }[]>`
    SELECT payload_digest, workspace_id, result, (retain_until <= statement_timestamp()) AS expired
    FROM workspace_creation_results WHERE actor_id = ${actor}::uuid AND scope_key = ${scope}
      AND operation = 'workspace:create:v1' AND request_key = ${input.key}::uuid FOR UPDATE`;
  const old = records[0];
  if (!inserted.length && old) {
    // Fresh membership is mandatory before returning an earlier result.
    if (!pointers[0] || pointers[0].workspace_id !== old.workspace_id) throw new WorkspaceFault('CONFLICT');
    if (old.payload_digest !== digest) throw new WorkspaceFault('CONFLICT');
    if (old.expired || old.result === null) {
      await tx.$executeRaw`UPDATE workspace_creation_results SET result = NULL WHERE actor_id = ${actor}::uuid AND request_key = ${input.key}::uuid`;
      // Return the decision so tombstone cleanup commits; throw only outside tx.
      return new WorkspaceFault('IDEMPOTENCY_RESULT_EXPIRED');
    }
    return old.result;
  }
  // A newly visible conflicting result without the pre-authorized pointer is
  // unresolved, not permission to acquire its workspace after the ledger.
  if (!inserted.length) throw new WorkspaceFault('CONFLICT');
  const workspace = await tx.workspace.create({ data: { name: input.name, slug: input.slug }, select: { id: true, name: true, slug: true, status: true } });
  const member = await tx.workspaceMembership.create({ data: { workspaceId: workspace.id, userId: actor, role: 'ADMIN', status: 'ACTIVE', joinedAt: new Date() }, select: { id: true } });
  const result = { workspace: { ...workspace, membershipRole: 'ADMIN' as const }, initialAdministrator: self({ ...workspace, membershipRole: 'ADMIN' }, member.id) };
  await tx.$executeRaw`UPDATE workspace_creation_results SET workspace_id=${workspace.id}::uuid,result=${JSON.stringify(result)}::jsonb WHERE id=${reservation}::uuid`;
  return result;
}
