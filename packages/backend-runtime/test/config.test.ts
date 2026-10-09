import { describe, expect, test } from 'bun:test';
import { loadApiConfig, loadWorkerConfig } from '../src/config';
import { redact, createLogger } from '../src/logging';
import { diagnosticJobId, jobDefaults } from '../src/queue';
import { withDeadline } from '../src/lifecycle';

const env = {
  NODE_ENV: 'test', DATABASE_URL: 'postgresql://tester:private@127.0.0.1:5432/unblok',
  REDIS_URL: 'redis://:private@127.0.0.1:6379/0', CORS_ORIGINS: 'http://localhost:3000',
};
describe('fail-closed environment', () => {
  test('accepts explicit configuration with bounded defaults', () => {
    expect(loadApiConfig(env).API_HOST).toBe('127.0.0.1');
    expect(loadWorkerConfig(env).WORKER_CONCURRENCY).toBe(2);
  });
  for (const field of ['NODE_ENV', 'DATABASE_URL', 'REDIS_URL', 'CORS_ORIGINS']) {
    test(`rejects missing ${field}`, () => { expect(() => loadApiConfig({ ...env, [field]: undefined })).toThrow(); });
  }
  for (const value of ['*', 'null', 'https://example.org/path', 'https://user:password@example.org', '', 'http://example.org/']) {
    test(`rejects unsafe CORS origin ${value}`, () => { expect(() => loadApiConfig({ ...env, CORS_ORIGINS: value })).toThrow(); });
  }
  test('rejects credentials-free URLs and unbounded numeric controls', () => {
    expect(() => loadApiConfig({ ...env, REDIS_URL: 'redis://localhost:6379' })).toThrow();
    expect(() => loadApiConfig({ ...env, DATABASE_URL: 'postgresql://localhost/unblok' })).toThrow();
    expect(() => loadApiConfig({ ...env, BODY_LIMIT_BYTES: '999999999' })).toThrow();
    expect(() => loadApiConfig({ ...env, API_PORT: '0' })).toThrow();
    expect(() => loadWorkerConfig({ ...env, WORKER_CONCURRENCY: '1000' })).toThrow();
  });
  test('production never silently enables insecure development connections', () => {
    expect(() => loadApiConfig({ ...env, NODE_ENV: 'production' })).toThrow();
    const production = { ...env, NODE_ENV: 'production', REDIS_URL: 'rediss://:private@redis.example/0', DATABASE_URL: 'postgresql://tester:private@db.example/unblok?sslmode=verify-full', CORS_ORIGINS: 'https://app.example' };
    expect(loadApiConfig(production).NODE_ENV).toBe('production');
    expect(() => loadApiConfig({ ...production, CORS_ORIGINS: env.CORS_ORIGINS })).toThrow();
    expect(() => loadApiConfig({ ...production, DATABASE_URL: production.DATABASE_URL.replace('verify-full', 'disable') })).toThrow();
  });
  test('configuration diagnostics contain field names without values', () => {
    try { loadApiConfig({ ...env, REDIS_URL: 'https://super-secret@example.org' }); throw new Error('should reject'); }
    catch (error) { expect(String(error)).toContain('REDIS_URL'); expect(String(error)).not.toContain('super-secret'); }
  });
});
describe('logging and lifecycle', () => {
  test('redacts nested keys and exception messages case-insensitively', () => {
    const input = { PASSWORD: 'canary', nested: { access_key: 'canary', Authorization: 'canary', signedUrl: 'canary', databaseUrl: 'canary', error: new Error('canary') }, rows: [{ cookie: 'canary' }], count: 2 };
    const safe = JSON.stringify(redact(input)); expect(safe).not.toContain('canary'); expect(safe).toContain('Redacted'); expect(safe).toContain('"count":2');
  });
  test('logger applies redaction before serialization', () => {
    let output = '';
    createLogger('info', { write: chunk => { output += chunk; } }).info({ event: 'test', data: { token: 'canary', error: new Error('canary') } });
    expect(output).not.toContain('canary'); expect(JSON.parse(output).event).toBe('test');
  });
  test('deadlines reject hanging work and preserve completed results', async () => {
    expect(await withDeadline(Promise.resolve(42), 100)).toBe(42);
    await expect(withDeadline(new Promise(() => {}), 10)).rejects.toThrow('deadline');
  });
  test('bounded retries and deterministic idempotency keys', () => {
    expect(jobDefaults.attempts).toBe(3); expect(jobDefaults.backoff).toEqual({ type: 'exponential', delay: 1000 });
    expect(diagnosticJobId('key')).toBe(diagnosticJobId('key')); expect(diagnosticJobId('key')).not.toBe(diagnosticJobId('other'));
    expect(() => diagnosticJobId('')).toThrow();
  });
});
