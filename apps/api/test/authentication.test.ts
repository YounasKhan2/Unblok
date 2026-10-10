import 'reflect-metadata';
import { expect, test } from 'bun:test';
import { randomUUID } from 'node:crypto';
import type { ExecutionContext } from '@nestjs/common';
import { credentialEmailSchema, signupSchema, loginSchema } from '@unblok/contracts';
import { Authentication, Passwords, isAuthenticationHandler } from '../src/modules/auth';
import { AuthController } from '../src/modules/auth/transport/auth.controller';
import { FoundationAccessGuard } from '../src/access';

test('strict auth contracts canonicalize ASCII email, bound password/name and reject authority fields', () => {
  expect(credentialEmailSchema.parse('  Test@Example.COM ')).toBe('test@example.com');
  const input = { email: 'a@example.com', name: 'Person', password: 'long unique password' };
  for (const change of [{ userId: randomUUID() }, { role: 'ADMIN' }, { familyId: randomUUID() }, { password: 'short' }, { password: 'x'.repeat(129) }, { email: 'ü@example.com' }, { name: '' }]) {
    expect(signupSchema.safeParse({ ...input, ...change }).success).toBe(false);
  }
  expect(loginSchema.safeParse({ email: input.email, password: input.password, membership: 'ADMIN' }).success).toBe(false);
  expect(loginSchema.safeParse({ email: input.email, password: '😀'.repeat(15) }).success).toBe(false);
  expect(loginSchema.safeParse({ email: input.email, password: '😀'.repeat(16) }).success).toBe(true);
  expect(loginSchema.safeParse({ email: input.email, password: 'x'.repeat(16) + '\ud800' }).success).toBe(false);
  expect(loginSchema.safeParse({ email: input.email, password: 'x'.repeat(16) + '\u0000' }).success).toBe(false);
});
test('native Bun Argon2id uses bounded profile, unique salts and dummy verification; corrupt profiles do not run', async () => {
  const passwords = await Passwords.create(), value = 'unique password including spaces';
  const first = await passwords.hash(value), second = await passwords.hash(value);
  expect(first).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/); expect(first).not.toBe(second);
  expect(await passwords.verify(value, first)).toBe(true); expect(await passwords.verify('wrong password long', first)).toBe(false);
  expect(await passwords.verify(value, null)).toBe(false);
  expect(await passwords.verify(value, first.replace('m=19456', 'm=999999999'))).toBe(false);
  const work = Array.from({ length: 4 }, () => passwords.hash(value));
  await expect(passwords.hash(value)).rejects.toThrow('Authentication dependency unavailable'); await Promise.all(work);
});
test('public auth exemption is exact server-owned handler reference; arbitrary routes and health metadata cannot grant business access', () => {
  expect(isAuthenticationHandler(AuthController.prototype.login)).toBe(true);
  const fake = () => {};
  expect(isAuthenticationHandler(fake)).toBe(false);
  const context = { getHandler: () => fake, getClass: () => class Business {} } as unknown as ExecutionContext;
  expect(() => new FoundationAccessGuard().canActivate(context)).toThrow();
});
test('credential resolver never trusts structural assertions or client identity fields', async () => {
  let confirmations = 0;
  const authentication = new Authentication({ create: async () => {}, lookup: async () => null, confirm: async () => { confirmations++; return true; } }, await Passwords.create(), { consume: async () => ({ allowed: true, retryAfter: 1 }) });
  expect(await authentication.resolveIdentity({ userId: randomUUID(), identityId: randomUUID(), authEpoch: 1n })).toBeNull();
  expect(await authentication.resolveIdentity(null)).toBeNull(); expect(confirmations).toBe(0);
});
