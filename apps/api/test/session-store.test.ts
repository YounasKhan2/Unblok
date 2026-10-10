import { expect, test } from 'bun:test';
import session from 'express-session';
import { AuthUnavailableError } from '@unblok/database';
import { loadApiConfig } from '@unblok/backend-runtime';
import { BoundedSessionStore, validState } from '../src/modules/sessions/infrastructure/store';
import { sessionSettings } from '../src/modules/sessions/infrastructure/settings';

const config = loadApiConfig({ NODE_ENV: 'test', DATABASE_URL: 'postgresql://user:private@localhost/test', REDIS_URL: 'redis://:private@localhost:6379/0', CORS_ORIGINS: 'http://localhost:3000' });
class FixtureStore extends session.Store {
  get(_sid: string, done: (error: unknown, data?: session.SessionData | null) => void) { done(undefined, null); }
  set(_sid: string, _data: session.SessionData, done?: (error?: unknown) => void) { done?.(); }
  destroy(_sid: string, done?: (error?: unknown) => void) { done?.(); }
}
test('session settings require independent explicit secrets and namespace, reject broad/invalid proxy trust', () => {
  const env = { SESSION_SECRETS: 'a'.repeat(64), SESSION_NAMESPACE: 'test' };
  expect(() => sessionSettings(config, {})).toThrow();
  expect(() => sessionSettings(config, { ...env, SESSION_SECRETS: 'development' })).toThrow();
  expect(() => sessionSettings(config, { ...env, SESSION_NAMESPACE: '../escape' })).toThrow();
  for (const proxy of ['true', '0.0.0.0/0', '999.1.1.1', '127.0.0.1/32']) {
    expect(() => sessionSettings(config, { ...env, SESSION_TRUSTED_PROXIES: proxy })).toThrow();
  }
  expect(sessionSettings(config, env).credentials).toBe(false);
  expect(sessionSettings(config, env).name).toBe('unblok.sid.dev');
});
test('state rejects injected grants, malformed epochs, future issuance and expired deadlines', () => {
  const state = { version: 1, kind: 'anonymous', csrf: 'a'.repeat(43), issuedAt: Date.now() - 100, idleExpiresAt: Date.now() + 10000, absoluteExpiresAt: Date.now() + 10000 };
  expect(validState(state)?.kind).toBe('anonymous');
  expect(validState({ ...state, roles: ['ADMIN'] })).toBeNull();
  expect(validState({ ...state, issuedAt: Date.now() + 10000 })).toBeNull();
  expect(validState({ ...state, idleExpiresAt: Date.now() - 1 })).toBeNull();
  expect(validState({ ...state, idleExpiresAt: state.absoluteExpiresAt + 1 })).toBeNull();
});
test('bounded callbacks fail once; late success is not cancellation and never changes result', async () => {
  const underlying = new FixtureStore();
  let complete!: (error?: unknown) => void, callbacks = 0, persisted = false;
  underlying.set = (_sid, _data, done) => { complete = error => { persisted = true; done?.(error); }; };
  const store = new BoundedSessionStore(underlying, 20);
  const data = { cookie: new session.Cookie(), state: { version: 1 as const, kind: 'anonymous' as const, csrf: 'a'.repeat(43), issuedAt: Date.now(), idleExpiresAt: Date.now() + 10000, absoluteExpiresAt: Date.now() + 10000 } };
  const error = await new Promise<unknown>(resolve => store.set('a'.repeat(43), data, error => { callbacks++; resolve(error); }));
  expect(error).toBeInstanceOf(AuthUnavailableError); expect(persisted).toBe(false);
  complete(); await Bun.sleep(5);
  expect(persisted).toBe(true); expect(callbacks).toBe(1);
});
test('malformed SID and malformed store data never produce usable state; touch cannot renew', async () => {
  const underlying = new FixtureStore(); let touched = false;
  underlying.get = (_sid, done) => done(undefined, { cookie: new session.Cookie(), state: undefined } as unknown as session.SessionData);
  underlying.touch = () => { touched = true; };
  const store = new BoundedSessionStore(underlying, 20);
  const get = (sid: string) => new Promise(resolve => store.get(sid, (_error, data) => resolve(data)));
  expect(await get('../escape')).toBeNull(); expect(await get('a'.repeat(43))).toBeNull();
  store.touch('a'.repeat(43), { cookie: new session.Cookie() }); expect(touched).toBe(false);
});
