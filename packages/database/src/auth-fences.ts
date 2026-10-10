import type { Prisma } from '@prisma/client';

// Server-private evidence from a live session lookup, never a browser DTO.
export interface SessionEvidence {
  readonly userId: string;
  readonly identityId: string;
  readonly familyId: string;
  readonly authEpoch: bigint;
  readonly generation: bigint;
  readonly sidDigest: string;
}
// Called once for each authenticateSession request callback. Must perform a
// fresh bounded cache lookup, reject missing/expired state and bind the actual
// presented SID; never return a previously cached positive result.
export interface SessionVerifier { verify(assertion: unknown): Promise<SessionEvidence | null> }
export class AuthDeniedError extends Error {
  constructor() { super('Authentication unavailable'); this.name = 'AuthDeniedError'; }
}
export class AuthUnavailableError extends Error {
  constructor() { super('Authentication dependency unavailable'); this.name = 'AuthUnavailableError'; }
}
type Transactions = { transaction<T>(run: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> };
export interface PrincipalAuthority {
  readonly userId: string;
  readonly identityId: string;
  readonly authEpoch: bigint;
  readonly session?: SessionEvidence;
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function id(value: string) { if (typeof value !== 'string' || !uuid.test(value)) throw new AuthDeniedError(); }
function evidence(value: SessionEvidence) {
  id(value.userId); id(value.identityId); id(value.familyId);
  if (typeof value.authEpoch !== 'bigint' || value.authEpoch < 1n || typeof value.generation !== 'bigint' || value.generation < 1n || !/^[0-9a-f]{64}$/.test(value.sidDigest)) throw new AuthDeniedError();
}
async function bounded(tx: Prisma.TransactionClient) {
  await tx.$executeRaw`SET LOCAL lock_timeout = '1500ms'`;
  await tx.$executeRaw`SET LOCAL statement_timeout = '4000ms'`;
}
async function user(tx: Prisma.TransactionClient, userId: string, exclusive = false, requireEnabled = true) {
  id(userId);
  const rows = exclusive
    ? await tx.$queryRaw<{ auth_epoch: bigint; auth_disabled: boolean }[]>`SELECT auth_epoch, auth_disabled FROM users WHERE id = ${userId}::uuid FOR UPDATE`
    : await tx.$queryRaw<{ auth_epoch: bigint; auth_disabled: boolean }[]>`SELECT auth_epoch, auth_disabled FROM users WHERE id = ${userId}::uuid FOR SHARE`;
  if (!rows[0] || (requireEnabled && rows[0].auth_disabled)) throw new AuthDeniedError();
  return rows[0];
}

// Internal to the database package: never expose raw transactions to handlers.
// Locks survive until transaction commit; SERIALIZABLE conflicts fail closed.
export async function lockAuthority(tx: Prisma.TransactionClient, authority: PrincipalAuthority) {
  const current = await user(tx, authority.userId);
  if (current.auth_epoch !== authority.authEpoch) throw new AuthDeniedError();
  const identity = await tx.identity.findUnique({ where: { id_userId: { id: authority.identityId, userId: authority.userId } }, select: { id: true } });
  if (!identity) throw new AuthDeniedError();
  if (authority.session) {
    const s = authority.session; evidence(s);
    if (s.userId !== authority.userId || s.identityId !== authority.identityId || s.authEpoch !== authority.authEpoch) throw new AuthDeniedError();
    const rows = await tx.$queryRaw<{ valid: boolean }[]>`
      SELECT (user_id = ${s.userId}::uuid AND identity_id = ${s.identityId}::uuid
        AND auth_epoch = ${s.authEpoch} AND generation = ${s.generation}
        AND sid_digest = ${s.sidDigest} AND revoked_at IS NULL
        AND absolute_expires_at > statement_timestamp() AND idle_expires_at > statement_timestamp()) AS valid
      FROM auth_session_families WHERE id = ${s.familyId}::uuid FOR SHARE`;
    if (rows[0]?.valid !== true) throw new AuthDeniedError();
  }
}

// Privileged lifecycle capability for future reviewed authentication services.
// Not an authentication endpoint and not an approved business-handler export.
export class AuthFences {
  constructor(private readonly database: Transactions) {}
  private async transaction<T>(run: (tx: Prisma.TransactionClient) => Promise<T>) {
    try { return await this.database.transaction(async tx => { await bounded(tx); return run(tx); }); }
    catch (error) { if (error instanceof AuthDeniedError) throw error; throw new AuthUnavailableError(); }
  }
  validate(session: SessionEvidence): Promise<PrincipalAuthority> {
    // Copy before the first await, so a verifier cannot mutate admitted evidence.
    const snapshot = Object.freeze({ ...session });
    return this.transaction(async tx => {
      evidence(snapshot);
      const authority = Object.freeze({ userId: snapshot.userId, identityId: snapshot.identityId, authEpoch: snapshot.authEpoch, session: snapshot });
      await lockAuthority(tx, authority); return authority;
    });
  }
  resolveIdentity(provider: string, subject: string): Promise<PrincipalAuthority> {
    return this.transaction(async tx => {
      const identity = await tx.identity.findUnique({ where: { provider_subject: { provider, subject } }, select: { id: true, userId: true } });
      if (!identity) throw new AuthDeniedError();
      const current = await user(tx, identity.userId);
      return Object.freeze({ userId: identity.userId, identityId: identity.id, authEpoch: current.auth_epoch });
    });
  }
  create(input: { userId: string; identityId: string; sidDigest: string; absoluteExpiresAt: Date; idleExpiresAt: Date }): Promise<SessionEvidence> {
    const snapshot = { ...input };
    return this.transaction(async tx => {
      const current = await user(tx, snapshot.userId);
      id(snapshot.identityId);
      if (!/^[0-9a-f]{64}$/.test(snapshot.sidDigest)) throw new AuthDeniedError();
      const dates = await tx.$queryRaw<{ valid: boolean }[]>`SELECT (${snapshot.idleExpiresAt}::timestamptz > statement_timestamp() AND ${snapshot.absoluteExpiresAt}::timestamptz >= ${snapshot.idleExpiresAt}::timestamptz) AS valid`;
      if (dates[0]?.valid !== true) throw new AuthDeniedError();
      const family = await tx.authSessionFamily.create({ data: { ...snapshot, authEpoch: current.auth_epoch } });
      return Object.freeze({ userId: family.userId, identityId: family.identityId, familyId: family.id, authEpoch: family.authEpoch, generation: family.generation, sidDigest: family.sidDigest });
    });
  }
  revoke(session: SessionEvidence): Promise<void> {
    const s = Object.freeze({ ...session });
    return this.transaction(async tx => {
      evidence(s); await user(tx, s.userId, false, false);
      const rows = await tx.$queryRaw<{ identity_id: string }[]>`SELECT identity_id FROM auth_session_families WHERE id = ${s.familyId}::uuid AND user_id = ${s.userId}::uuid FOR UPDATE`;
      if (rows[0]?.identity_id !== s.identityId) throw new AuthDeniedError();
      // Family logout is idempotent and deliberately revokes rotated descendants.
      await tx.$executeRaw`UPDATE auth_session_families SET revoked_at = COALESCE(revoked_at, statement_timestamp()) WHERE id = ${s.familyId}::uuid`;
    });
  }
  revokeAll(userId: string): Promise<void> {
    return this.transaction(async tx => {
      await user(tx, userId, true, false);
      await tx.$executeRaw`UPDATE users SET auth_epoch = auth_epoch + 1 WHERE id = ${userId}::uuid`;
    });
  }
  rotate(session: SessionEvidence, sidDigest: string, idleExpiresAt: Date): Promise<SessionEvidence> {
    const s = Object.freeze({ ...session });
    return this.transaction(async tx => {
      evidence(s); await user(tx, s.userId);
      // Acquire exclusive family lock before validation (no SHARE→UPDATE upgrade).
      await tx.$queryRaw`SELECT id FROM auth_session_families WHERE id = ${s.familyId}::uuid FOR UPDATE`;
      await lockAuthority(tx, { userId: s.userId, identityId: s.identityId, authEpoch: s.authEpoch, session: s });
      if (!/^[0-9a-f]{64}$/.test(sidDigest) || sidDigest === s.sidDigest) throw new AuthDeniedError();
      const dates = await tx.$queryRaw<{ valid: boolean }[]>`SELECT (${idleExpiresAt}::timestamptz > statement_timestamp() AND ${idleExpiresAt}::timestamptz <= absolute_expires_at) AS valid FROM auth_session_families WHERE id = ${s.familyId}::uuid`;
      if (dates[0]?.valid !== true) throw new AuthDeniedError();
      await tx.authSessionFamily.update({ where: { id: s.familyId }, data: { generation: { increment: 1 }, sidDigest, idleExpiresAt } });
      return Object.freeze({ ...s, generation: s.generation + 1n, sidDigest });
    });
  }
}
