import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { AuthUnavailableError, type PrincipalAuthority } from './auth-fences';
export interface VerificationKey { readonly id: string; readonly secret: string }
type Transactions = { transaction<T>(run: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> };
const hmac = (key: VerificationKey, domain: string, value: string) => createHmac('sha256', key.secret).update(domain + ':' + value).digest('hex');
function proof(key: VerificationKey, row: { id: string; identityId: string; email: string; authEpoch: bigint }) {
  const value = createHmac('sha256', key.secret).update(`email-proof:v1:${key.id}:${row.id}:${row.identityId}:${row.email}:${row.authEpoch}`).digest('base64url');
  return `${row.id}.${value}`;
}
function validKey(key: VerificationKey) { if (!/^[a-z0-9-]{1,40}$/.test(key.id) || !/^[0-9a-f]{64}$/.test(key.secret)) throw new AuthUnavailableError(); }
async function clock(tx: Prisma.TransactionClient) { return (await tx.$queryRaw<{ now: Date }[]>`SELECT clock_timestamp() AS now`)[0]!.now; }
// Called only inside Tenancy's instance-owned request and transaction boundary.
export async function verificationAction(tx: Prisma.TransactionClient, authority: PrincipalAuthority, key: VerificationKey,
  action: 'request' | 'confirm' | 'status', token?: string): Promise<boolean> {
  validKey(key);
  const identityId = authority.identityId;
  await tx.$queryRaw`SELECT identity_id FROM password_credentials WHERE identity_id = ${identityId}::uuid FOR UPDATE`;
  const credential = await tx.passwordCredential.findUnique({ where: { identityId }, include: { identity: true } });
  if (!credential || credential.identity.userId !== authority.userId || credential.identity.provider !== 'password') throw new AuthUnavailableError();
  if (action === 'status' || credential.emailVerifiedAt !== null) return credential.emailVerifiedAt !== null;
  const now = await clock(tx);
  const current = await tx.emailVerificationChallenge.findFirst({ where: { identityId, authEpoch: authority.authEpoch, keyId: key.id,
    consumedAt: null, canceledAt: null, attempts: { lt: 10 }, expiresAt: { gt: now } }, orderBy: { issuedAt: 'desc' } });
  if (action === 'request') {
    if (current) return false; // Retry reuses the same committed challenge/outbox.
    await tx.emailVerificationChallenge.updateMany({ where: { identityId, consumedAt: null, canceledAt: null }, data: { canceledAt: now } });
    const row = { id: randomUUID(), identityId, email: credential.email, authEpoch: authority.authEpoch };
    await tx.emailVerificationChallenge.create({ data: { ...row, keyId: key.id, tokenDigest: hmac(key, 'email-digest:v1', proof(key, row)),
      issuedAt: now, expiresAt: new Date(now.getTime() + 900000), delivery: { create: {} } } });
    return false;
  }
  if (!current) return false;
  const supplied = hmac(key, 'email-digest:v1', token ?? '');
  const matches = timingSafeEqual(Buffer.from(supplied, 'hex'), Buffer.from(current.tokenDigest, 'hex'));
  const updated = await tx.$queryRaw<{ consumed_at: Date | null }[]>`
    UPDATE email_verification_challenges SET attempts=attempts+1,
      consumed_at=CASE WHEN ${matches} THEN clock_timestamp() ELSE consumed_at END
    WHERE id=${current.id}::uuid AND consumed_at IS NULL AND canceled_at IS NULL
      AND attempts < 10 AND expires_at > clock_timestamp() RETURNING consumed_at`;
  if (!matches || !updated[0]?.consumed_at) return false;
  await tx.passwordCredential.update({ where: { identityId }, data: { emailVerifiedAt: updated[0].consumed_at } });
  return true;
}

// Privileged worker composition only. No tokens enter a queue or durable outbox.
export class VerificationDelivery {
  constructor(private readonly database: Transactions, private readonly key: VerificationKey) { validKey(key); }
  async once(send: (email: string, token: string, id: string) => Promise<void>): Promise<boolean> {
    try {
      const lease = randomUUID();
      const row = await this.database.transaction(async tx => {
        await tx.$executeRaw`SET LOCAL lock_timeout = '1500ms'`; await tx.$executeRaw`SET LOCAL statement_timeout = '4000ms'`;
        const rows = await tx.$queryRaw<{ challenge_id: string }[]>`
          SELECT o.challenge_id FROM email_verification_outbox o
          JOIN email_verification_challenges c ON c.id=o.challenge_id
          JOIN password_credentials p ON p.identity_id=c.identity_id AND p.email=c.email
          JOIN identities i ON i.id=p.identity_id JOIN users u ON u.id=i.user_id
          WHERE o.delivered_at IS NULL AND o.attempts < 5 AND o.next_attempt_at <= clock_timestamp()
            AND (o.lease_until IS NULL OR o.lease_until <= clock_timestamp())
            AND c.key_id=${this.key.id} AND c.expires_at > clock_timestamp() AND c.consumed_at IS NULL AND c.canceled_at IS NULL
            AND c.attempts < 10 AND p.email_verified_at IS NULL AND u.auth_disabled=false AND u.auth_epoch=c.auth_epoch
          ORDER BY o.next_attempt_at, o.challenge_id LIMIT 1 FOR UPDATE OF o SKIP LOCKED`;
        if (!rows[0]) return null;
        await tx.emailVerificationOutbox.update({ where: { challengeId: rows[0].challenge_id }, data: {
          leaseId: lease, leaseUntil: new Date((await clock(tx)).getTime() + 30000), attempts: { increment: 1 } } });
        return tx.emailVerificationChallenge.findUniqueOrThrow({ where: { id: rows[0].challenge_id } });
      });
      if (!row) return false;
      const token = proof(this.key, row);
      if (!timingSafeEqual(Buffer.from(hmac(this.key, 'email-digest:v1', token), 'hex'), Buffer.from(row.tokenDigest, 'hex'))) throw new AuthUnavailableError();
      let delivered = false;
      try { await send(row.email, token, row.id); delivered = true; } catch { /* unknown delivery; retry same proof */ }
      await this.database.transaction(async tx => {
        const now = await clock(tx);
        await tx.emailVerificationOutbox.updateMany({ where: { challengeId: row.id, leaseId: lease }, data: {
          leaseId: null, leaseUntil: null, ...(delivered ? { deliveredAt: now } : { nextAttemptAt: new Date(now.getTime() + 30000) }) } });
      });
      return true;
    } catch { throw new AuthUnavailableError(); }
  }
}
