import { expect, test } from 'bun:test';
import { randomBytes, randomUUID } from 'node:crypto';
import { passwordRecoveryConfirmSchema, passwordRecoveryRequestSchema } from '@unblok/contracts';
import { loadRecoveryKey } from '@unblok/backend-runtime';
test('recovery strict anonymous contracts and independent required key',()=>{
  const token=randomUUID()+'.'+randomBytes(32).toString('base64url');
  expect(passwordRecoveryRequestSchema.parse({email:' Person@Example.test '})).toEqual({email:'person@example.test'});
  expect(passwordRecoveryConfirmSchema.safeParse({email:'person@example.test',token,password:'A secure new password 2026'}).success).toBe(true);
  for(const extra of ['userId','role','emailVerifiedAt','authEpoch']) expect(passwordRecoveryConfirmSchema.safeParse({email:'person@example.test',token,password:'A secure new password 2026',[extra]:'forged'}).success).toBe(false);
  expect(passwordRecoveryConfirmSchema.safeParse({email:'person@example.test',token,password:'short'}).success).toBe(false);
  expect(()=>loadRecoveryKey({})).toThrow();
  const secret=randomBytes(32).toString('hex');
  expect(()=>loadRecoveryKey({PASSWORD_RECOVERY_KEY_ID:'v1',PASSWORD_RECOVERY_KEY:secret,EMAIL_VERIFICATION_KEY:secret})).toThrow();
  expect(()=>loadRecoveryKey({PASSWORD_RECOVERY_KEY_ID:'v1',PASSWORD_RECOVERY_KEY:secret,SESSION_SECRETS:secret})).toThrow();
  expect(loadRecoveryKey({PASSWORD_RECOVERY_KEY_ID:'v1',PASSWORD_RECOVERY_KEY:secret}).id).toBe('v1');
});
