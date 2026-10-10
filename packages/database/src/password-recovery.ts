import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { AuthUnavailableError } from './auth-fences';
import type { VerificationKey } from './email-verification';
type Transactions = { transaction<T>(run: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> };
function validKey(key: VerificationKey) { if (!/^[a-z0-9-]{1,40}$/.test(key.id) || !/^[0-9a-f]{64}$/.test(key.secret)) throw new AuthUnavailableError(); }
function proof(key: VerificationKey, row: {id:string; identityId:string; email:string; authEpoch:bigint}) {
  return `${row.id}.${createHmac('sha256',key.secret).update(`password-recovery-proof:v1:${key.id}:${row.id}:${row.identityId}:${row.email}:${row.authEpoch}`).digest('base64url')}`;
}
function digest(key: VerificationKey, token:string) { return createHmac('sha256',key.secret).update('password-recovery-digest:v1:'+token).digest('hex'); }
const equal = (a:string,b:string) => timingSafeEqual(Buffer.from(a,'hex'),Buffer.from(b,'hex'));
function rolledBack(error:unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && (error.code==='P2034' ||
    (error.code==='P2010' && ['40001','40P01'].includes(String(error.meta?.code))));
}
function requestAborted(error:unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code==='P2010' &&
    ['55P03','57014'].includes(String(error.meta?.code));
}
async function bounded(tx:Prisma.TransactionClient) {
  await tx.$executeRaw`SET LOCAL lock_timeout = '1500ms'`; await tx.$executeRaw`SET LOCAL statement_timeout = '4000ms'`;
}
async function clock(tx:Prisma.TransactionClient) { return (await tx.$queryRaw<{now:Date}[]>`SELECT clock_timestamp() AS now`)[0]!.now; }
// Anonymous proof authority is separate from request-bound session principals.
// Only composition owns this capability; application receives narrow methods.
export class PasswordRecovery {
  constructor(private readonly database:Transactions, private readonly key:VerificationKey) { validKey(key); }
  private async run(email:string, action:'request'|'confirm', token?:string, passwordHash?:string) {
    return this.database.transaction(async tx=>{
      await bounded(tx);
      const found=await tx.passwordCredential.findUnique({where:{email},select:{identityId:true,identity:{select:{userId:true}}}});
      // No contact-email fallback, provider linking or implicit verification.
      if (!found) return;
      const users=await tx.$queryRaw<{auth_epoch:bigint;auth_disabled:boolean}[]>`SELECT auth_epoch,auth_disabled FROM users WHERE id=${found.identity.userId}::uuid FOR UPDATE`;
      await tx.$queryRaw`SELECT identity_id FROM password_credentials WHERE identity_id=${found.identityId}::uuid FOR UPDATE`;
      const credential=await tx.passwordCredential.findUnique({where:{identityId:found.identityId},include:{identity:true}});
      const user=users[0];
      if (!user || user.auth_disabled || !credential?.emailVerifiedAt || credential.email!==email || credential.identity.provider!=='password' || credential.identity.userId!==found.identity.userId) return;
      const now=await clock(tx);
      const current=await tx.passwordRecoveryChallenge.findFirst({where:{identityId:credential.identityId,authEpoch:user.auth_epoch,keyId:this.key.id,
        consumedAt:null,canceledAt:null,attempts:{lt:10},expiresAt:{gt:now}},include:{delivery:true},orderBy:{issuedAt:'desc'}});
      if(action==='request') {
        if(current?.delivery && (current.delivery.deliveredAt!==null || current.delivery.attempts<5 || (current.delivery.leaseUntil!==null && current.delivery.leaseUntil>now))) return;
        await tx.passwordRecoveryChallenge.updateMany({where:{identityId:credential.identityId,consumedAt:null,canceledAt:null},data:{canceledAt:now}});
        const row={id:randomUUID(),identityId:credential.identityId,email,authEpoch:user.auth_epoch};
        await tx.passwordRecoveryChallenge.create({data:{...row,keyId:this.key.id,tokenDigest:digest(this.key,proof(this.key,row)),issuedAt:now,expiresAt:new Date(now.getTime()+900000),delivery:{create:{}}}});
        return;
      }
      if(!current) return;
      const matches=equal(digest(this.key,token??''),current.tokenDigest);
      const updated=await tx.$queryRaw<{consumed_at:Date|null}[]>`UPDATE password_recovery_challenges SET attempts=attempts+1,
        consumed_at=CASE WHEN ${matches} THEN clock_timestamp() ELSE consumed_at END
        WHERE id=${current.id}::uuid AND consumed_at IS NULL AND canceled_at IS NULL AND attempts<10 AND expires_at>clock_timestamp() RETURNING consumed_at`;
      // Invalid proofs commit their attempts despite the generic accepted result.
      if(!matches || !updated[0]?.consumed_at) return;
      if(!passwordHash || !/^\$argon2id\$v=19\$m=19456,t=2,p=1\$[A-Za-z0-9+/]{43}\$[A-Za-z0-9+/]{43}$/.test(passwordHash)) throw new AuthUnavailableError();
      await tx.passwordCredential.update({where:{identityId:credential.identityId},data:{passwordHash}});
      await tx.$executeRaw`UPDATE users SET auth_epoch=auth_epoch+1 WHERE id=${found.identity.userId}::uuid`;
      await tx.$executeRaw`UPDATE auth_session_families SET revoked_at=COALESCE(revoked_at,clock_timestamp()) WHERE user_id=${found.identity.userId}::uuid`;
    });
  }
  async request(email:string) {
    // Only known serialization rollback may be retried. Unknown commit is never
    // interpreted as failure/cancellation; duplicate issuance is retry-safe.
    for(let i=0;i<3;i++) try { await this.run(email,'request'); return; } catch(error) {
      if(rolledBack(error)) { if(i<2) continue; return; }
      // Known lock/statement aborts cannot commit issuance. Avoid an account-
      // specific contention status; generic accepted is not delivery success.
      if(requestAborted(error)) return;
      throw new AuthUnavailableError();
    }
  }
  async confirm(email:string, token:string, passwordHash:string) {
    try { await this.run(email,'confirm',token,passwordHash); } catch(error) {
      // Generic result for a known rolled-back race, never an inferred success.
      if(rolledBack(error)) return;
      throw new AuthUnavailableError();
    }
  }
}

export class RecoveryDelivery {
  constructor(private readonly database:Transactions, private readonly key:VerificationKey) {validKey(key);}
  async once(send:(email:string,token:string,id:string)=>Promise<void>):Promise<boolean> {
    try {
      const lease=randomUUID();
      const row=await this.database.transaction(async tx=>{
        await bounded(tx);
        const rows=await tx.$queryRaw<{challenge_id:string}[]>`SELECT o.challenge_id FROM password_recovery_outbox o
          JOIN password_recovery_challenges c ON c.id=o.challenge_id
          JOIN password_credentials p ON p.identity_id=c.identity_id AND p.email=c.email
          JOIN identities i ON i.id=p.identity_id JOIN users u ON u.id=i.user_id
          WHERE o.delivered_at IS NULL AND o.attempts<5 AND o.next_attempt_at<=clock_timestamp()
          AND (o.lease_until IS NULL OR o.lease_until<=clock_timestamp()) AND c.key_id=${this.key.id}
          AND c.expires_at>clock_timestamp() AND c.consumed_at IS NULL AND c.canceled_at IS NULL AND c.attempts<10
          AND p.email_verified_at IS NOT NULL AND i.provider='password' AND u.auth_disabled=false AND u.auth_epoch=c.auth_epoch
          ORDER BY o.next_attempt_at,o.challenge_id LIMIT 1 FOR UPDATE OF o SKIP LOCKED`;
        if(!rows[0]) return null;
        await tx.passwordRecoveryOutbox.update({where:{challengeId:rows[0].challenge_id},data:{leaseId:lease,leaseUntil:new Date((await clock(tx)).getTime()+30000),attempts:{increment:1}}});
        return tx.passwordRecoveryChallenge.findUniqueOrThrow({where:{id:rows[0].challenge_id}});
      });
      if(!row) return false;
      const token=proof(this.key,row); if(!equal(digest(this.key,token),row.tokenDigest)) throw new AuthUnavailableError();
      let delivered=false;try {await send(row.email,token,row.id);delivered=true;} catch { /* unknown delivery may retry identical proof */ }
      await this.database.transaction(async tx=>{
        await bounded(tx);const now=await clock(tx);
        await tx.passwordRecoveryOutbox.updateMany({where:{challengeId:row.id,leaseId:lease},data:{leaseId:null,leaseUntil:null,...(delivered?{deliveredAt:now}:{nextAttemptAt:new Date(now.getTime()+30000)})}});
      });return true;
    }catch {throw new AuthUnavailableError();}
  }
}
