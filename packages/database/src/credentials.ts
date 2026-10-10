import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { AuthUnavailableError } from './auth-fences';

export interface CredentialSnapshot {
  readonly userId: string; readonly identityId: string; readonly authEpoch: bigint;
  readonly passwordHash: string; readonly disabled: boolean;
}
type Transactions = { transaction<T>(run: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> };
// Privileged authentication persistence. Only the server composition receives it.
export class AccountCredentials {
  constructor(private readonly database: Transactions) {}
  private async bounded<T>(run: (tx: Prisma.TransactionClient) => Promise<T>) {
    try { return await this.database.transaction(async tx => {
      await tx.$executeRaw`SET LOCAL lock_timeout = '1500ms'`;
      await tx.$executeRaw`SET LOCAL statement_timeout = '4000ms'`;
      return run(tx);
    }); } catch { throw new AuthUnavailableError(); }
  }
  async create(input: { email: string; name: string; passwordHash: string }): Promise<void> {
    // Same outcome for duplicate canonical email; no profile/password overwrite.
    // The existing serializable boundary may abort a contender, so retry only
    // a known serialization rollback (not unknown commit/network errors).
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await this.database.transaction(async tx => {
          await tx.$executeRaw`SET LOCAL lock_timeout = '1500ms'`;
          await tx.$executeRaw`SET LOCAL statement_timeout = '4000ms'`;
          const user = await tx.user.create({ data: { name: input.name, email: input.email } });
          const identity = await tx.identity.create({ data: { userId: user.id, provider: 'password', subject: randomUUID() } });
          await tx.passwordCredential.create({ data: { identityId: identity.id, email: input.email, passwordHash: input.passwordHash } });
        });
        return;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002' &&
          Array.isArray(error.meta?.target) && error.meta.target.includes('email')) return;
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034' && attempt < 2) continue;
        throw new AuthUnavailableError();
      }
    }
  }
  lookup(email: string): Promise<CredentialSnapshot | null> {
    return this.bounded(async tx => {
      const row = await tx.passwordCredential.findUnique({ where: { email }, select: {
        passwordHash: true, identityId: true, identity: { select: { provider: true, userId: true, user: { select: { authEpoch: true, authDisabled: true } } } },
      } });
      if (!row || row.identity.provider !== 'password') return null;
      return Object.freeze({ passwordHash: row.passwordHash, identityId: row.identityId, userId: row.identity.userId,
        authEpoch: row.identity.user.authEpoch, disabled: row.identity.user.authDisabled });
    });
  }
  confirm(snapshot: CredentialSnapshot): Promise<boolean> {
    return this.bounded(async tx => {
      const users = await tx.$queryRaw<{ auth_epoch: bigint; auth_disabled: boolean }[]>`SELECT auth_epoch, auth_disabled FROM users WHERE id = ${snapshot.userId}::uuid FOR SHARE`;
      const row = await tx.passwordCredential.findUnique({ where: { identityId: snapshot.identityId }, select: { passwordHash: true, identity: { select: { userId: true, provider: true } } } });
      return users[0]?.auth_epoch === snapshot.authEpoch && users[0].auth_disabled === false &&
        row?.passwordHash === snapshot.passwordHash && row.identity.userId === snapshot.userId && row.identity.provider === 'password';
    });
  }
}
