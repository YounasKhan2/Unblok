import 'reflect-metadata';
import { expect, spyOn, test } from 'bun:test';
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


test('overlapping password failures and timeout retain admission until actual native completion, then recover', async () => {
  const passwords = await Passwords.create(), value = 'Overlapping private native password';
  const hash = Bun.password.hash.bind(Bun.password), verify = Bun.password.verify.bind(Bun.password);
  const gates: { release: () => void; reject: (error: Error) => void; promise: Promise<void> }[] = [];
  const gate = () => { let release!: () => void, reject!: (error: Error) => void; const promise = new Promise<void>((ok, fail) => { release = ok; reject = fail; }); const item = { release, reject, promise }; gates.push(item); return item; };
  let nativeCompleted = 0;
  const hashSpy = spyOn(Bun.password, 'hash').mockImplementation(async (input, options) => { const g = gate(); await g.promise; const result = await hash(input, options); nativeCompleted++; return result; });
  const verifySpy = spyOn(Bun.password, 'verify').mockImplementation(async (input, stored, algorithm) => { const g = gate(); await g.promise; const result = await verify(input, stored, algorithm); nativeCompleted++; return result; });
  const observe = (promise: Promise<unknown>) => promise.then(() => 'success', () => 'unavailable');
  try {
    const first = [observe(passwords.hash(value)), observe(passwords.hash(value)), observe(passwords.verify(value, null)), observe(passwords.hash(value))];
    await Promise.resolve(); expect(gates).toHaveLength(4);
    await expect(passwords.hash(value)).rejects.toThrow('Authentication dependency unavailable');
    gates[1]!.reject(new Error('Controlled native failure'));
    expect(await first[1]).toBe('unavailable');
    const replacement = observe(passwords.hash(value)); await Promise.resolve(); expect(gates).toHaveLength(5);
    await expect(passwords.verify(value, null)).rejects.toThrow('Authentication dependency unavailable');
    expect(await Promise.all([first[0], first[2], first[3], replacement])).toEqual(['unavailable', 'unavailable', 'unavailable', 'unavailable']);
    expect(nativeCompleted).toBe(0); // Nothing was canceled or treated as completion.
    await expect(passwords.hash(value)).rejects.toThrow('Authentication dependency unavailable');
    gates[0]!.release();
    // Wait for actual native completion without modifying the production deadline.
    for (let i = 0; i < 200 && nativeCompleted === 0; i++) await Bun.sleep(5);
    expect(nativeCompleted).toBe(1);
    const admitted = observe(passwords.hash(value)); await Promise.resolve(); expect(gates).toHaveLength(6);
    await expect(passwords.hash(value)).rejects.toThrow('Authentication dependency unavailable');
    gates[5]!.release(); expect(await admitted).toBe('success');
    for (const g of gates) g.release();
    for (let i = 0; i < 200 && nativeCompleted < 5; i++) await Bun.sleep(5);
    expect(nativeCompleted).toBe(5); hashSpy.mockRestore(); verifySpy.mockRestore();
    expect(await passwords.hash(value)).toMatch(/^\$argon2id\$/); // released by finally after real completion
  } finally {
    for (const g of gates) g.release(); hashSpy.mockRestore(); verifySpy.mockRestore();
  }
}, 5000);
