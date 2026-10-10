import { expect, test } from 'bun:test';
import { loadVerificationKey, loadVerificationMail } from '@unblok/backend-runtime';
import { emailVerificationConfirmSchema, emailVerificationStatusSchema } from '@unblok/contracts';

test('verification contracts are bounded and strict; trusted transport/key settings reject unsafe defaults', () => {
  expect(emailVerificationStatusSchema.parse({ emailVerified: true })).toEqual({ emailVerified: true });
  expect(emailVerificationConfirmSchema.safeParse({ token: 'forged', userId: 'injected' }).success).toBe(false);
  expect(() => loadVerificationKey({})).toThrow();
  expect(loadVerificationKey({ EMAIL_VERIFICATION_KEY_ID: 'v1', EMAIL_VERIFICATION_KEY: 'a'.repeat(64) }).id).toBe('v1');
  const env = { NODE_ENV: 'production', EMAIL_MAIL_ENDPOINT: 'https://mail.example/api/v1/send', EMAIL_MAIL_FROM: 'verify@example.test', EMAIL_MAIL_USERNAME: 'sender', EMAIL_MAIL_PASSWORD: 'independent mail credential' };
  expect(loadVerificationMail(env).endpoint).toBe(env.EMAIL_MAIL_ENDPOINT);
  for (const change of [{ EMAIL_MAIL_ENDPOINT: 'http://mail.example/api/v1/send' }, { EMAIL_MAIL_USERNAME: undefined }, { EMAIL_MAIL_PASSWORD: undefined }, { EMAIL_MAIL_ENDPOINT: 'https://sender:secret@mail.example/api/v1/send' }, { EMAIL_MAIL_ENDPOINT: 'https://mail.example/api/v1/send?token=secret' }, { EMAIL_MAIL_USERNAME: 'header:injection' }]) expect(() => loadVerificationMail({ ...env, ...change })).toThrow();
  expect(() => loadVerificationMail({ ...env, NODE_ENV: 'development', EMAIL_MAIL_ENDPOINT: 'http://mail.example/api/v1/send' })).toThrow();
});
