import { afterEach, describe, expect, test } from 'bun:test';
import { createLogger, loadApiConfig } from '@unblok/backend-runtime';
import { createApp } from '../src/app';
import { Readiness, type Resources } from '../src/health';
import { SchemaPipe, ResponseSchemaInterceptor } from '../src/validation';
import { normalizeError } from '../src/errors';
import { errorSchema, healthSchema } from '@unblok/contracts';
import { lastValueFrom, of } from 'rxjs';
import type { ExecutionContext } from '@nestjs/common';

const env = { NODE_ENV: 'test', DATABASE_URL: 'postgresql://user:private@localhost/unblok', REDIS_URL: 'redis://:private@localhost:6379/0', CORS_ORIGINS: 'http://localhost:3000', BODY_LIMIT_BYTES: '1024' };
let stop: (() => Promise<void>) | undefined;
afterEach(async () => { await stop?.(); stop = undefined; });
async function setup(options: { db?: boolean; queue?: boolean; rate?: boolean; rateError?: boolean } = {}) {
  let closes = 0;
  let logs = '';
  const resources: Resources = { databaseReady: async () => options.db ?? true, queueReady: async () => options.queue ?? true, close: async () => { closes++; } };
  const service = await createApp(loadApiConfig(env), resources, { consume: async () => {
    if (options.rateError) throw new Error('private Redis credentials');
    return { allowed: options.rate ?? true, retryAfter: 10 };
  } }, createLogger('info', { write: chunk => { logs += chunk; } }));
  await service.app.listen(0, '127.0.0.1'); stop = service.close;
  const address = service.app.getHttpServer().address();
  if (!address || typeof address === 'string') throw new Error('Missing TCP address');
  return { ...service, url: `http://127.0.0.1:${address.port}`, closes: () => closes, logs: () => logs };
}
describe('API foundation over HTTP', () => {
  test('root and versioned health return validated responses', async () => {
    const service = await setup();
    for (const route of ['/live', '/api/v1/live', '/ready', '/api/v1/ready']) {
      const response = await fetch(service.url + route);
      expect(response.status).toBe(200); expect(healthSchema.safeParse(await response.json()).success).toBe(true);
      expect(response.headers.get('x-request-id')).toBeTruthy();
    }
  });
  for (const dependency of ['db', 'queue'] as const) {
    test(`${dependency} outage fails readiness while liveness stays independent`, async () => {
      const service = await setup({ [dependency]: false });
      expect((await fetch(service.url + '/live')).status).toBe(200);
      const response = await fetch(service.url + '/ready'); expect(response.status).toBe(503);
      expect((await response.json()).error.code).toBe('NOT_READY');
    });
  }
  test('readiness drains before resource disposal and close is idempotent', async () => {
    const service = await setup();
    const readiness = service.app.get(Readiness); readiness.drain();
    expect((await fetch(service.url + '/ready')).status).toBe(503);
    await Promise.all([service.close(), service.close()]); expect(service.closes()).toBe(1);
  });
  test('unknown endpoints normalize errors without reflected secrets', async () => {
    const service = await setup();
    const response = await fetch(service.url + '/api/v1/unknown?token=canary', { headers: { Authorization: 'Bearer canary', Cookie: 'session=canary', 'x-request-id': 'known-id' } });
    expect(response.status).toBe(404);
    const body = await response.json(); expect(body).toEqual(normalizeError(404, 'known-id')); expect(errorSchema.safeParse(body).success).toBe(true);
    expect(service.logs()).not.toContain('canary'); expect(service.logs()).toContain('known-id');
  });
  test('invalid correlation IDs are replaced and secure headers are present', async () => {
    const service = await setup();
    const response = await fetch(service.url + '/live', { headers: { 'x-request-id': 'invalid<>id' } });
    expect(response.headers.get('x-request-id')).not.toBe('invalid<>id');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('content-security-policy')).toBeTruthy();
    expect(response.headers.has('x-powered-by')).toBe(false);
  });
  test('CORS accepts exact origins and rejects wildcard/subdomain/null attacks', async () => {
    const service = await setup();
    const accepted = await fetch(service.url + '/live', { headers: { origin: 'http://localhost:3000' } });
    expect(accepted.headers.get('access-control-allow-origin')).toBe('http://localhost:3000');
    for (const origin of ['null', 'http://localhost:3000.evil.example', 'https://evil.example']) {
      const response = await fetch(service.url + '/live', { headers: { origin } });
      expect(response.status).toBe(403); expect(response.headers.has('access-control-allow-origin')).toBe(false);
    }
  });
  test('preflight validates methods and header allowlist', async () => {
    const service = await setup();
    const headers = { origin: 'http://localhost:3000', 'access-control-request-method': 'POST', 'access-control-request-headers': 'content-type,x-request-id' };
    expect((await fetch(service.url + '/api/v1/future', { method: 'OPTIONS', headers })).status).toBe(204);
    expect((await fetch(service.url + '/api/v1/future', { method: 'OPTIONS', headers: { ...headers, 'access-control-request-headers': 'x-admin-bypass' } })).status).toBe(403);
    expect((await fetch(service.url + '/api/v1/future', { method: 'OPTIONS', headers: { ...headers, 'access-control-request-method': 'TRACE' } })).status).toBe(403);
  });
  test('oversized bodies and malformed JSON are normalized', async () => {
    const service = await setup();
    for (const [body, status] of [[JSON.stringify({ value: 'x'.repeat(2048) }), 413], ['{invalid', 400]] as const) {
      const response = await fetch(service.url + '/api/v1/future', { method: 'POST', headers: { 'content-type': 'application/json' }, body });
      expect(response.status).toBe(status); expect(errorSchema.safeParse(await response.json()).success).toBe(true);
    }
  });
  test('rate limit exhaustion returns 429 and store failure fails closed', async () => {
    const service = await setup({ rate: false });
    const response = await fetch(service.url + '/api/v1/future'); expect(response.status).toBe(429); expect(response.headers.get('retry-after')).toBe('10');
    expect((await fetch(service.url + '/live')).status).toBe(200);
    await service.close();
    const failed = await setup({ rateError: true }); expect((await fetch(failed.url + '/api/v1/future')).status).toBe(503);
    expect(failed.logs()).not.toContain('private Redis credentials');
  });
});
describe('validation and safe errors', () => {
  test('request validation rejects unknown fields', () => {
    const pipe = new SchemaPipe(healthSchema);
    expect(pipe.transform({ status: 'ok' })).toEqual({ status: 'ok' });
    expect(() => pipe.transform({ status: 'ok', admin: true })).toThrow();
  });
  test('response validation refuses accidental internal fields', async () => {
    const interceptor = new ResponseSchemaInterceptor(healthSchema);
    const result = interceptor.intercept({} as ExecutionContext, { handle: () => of({ status: 'ok', secret: 'canary' }) });
    await expect(lastValueFrom(result)).rejects.toThrow();
  });
  test('unexpected errors expose no stack or internal diagnostic text', () => {
    expect(normalizeError(500, 'id')).toEqual({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error', requestId: 'id' } });
  });
});

describe('future authentication boundary', () => {
  test('new handlers fail closed until authentication is implemented', async () => {
    const { FoundationAccessGuard, PublicHealth } = await import('../src/access');
    const handler = () => {};
    class Controller {}
    const context = { getHandler: () => handler, getClass: () => Controller } as unknown as ExecutionContext;
    expect(() => new FoundationAccessGuard().canActivate(context)).toThrow('Unauthorized');
    PublicHealth()(handler);
    expect(new FoundationAccessGuard().canActivate(context)).toBe(true);
  });
});

test('size and media-type boundaries cover raw and compressed payloads', async () => {
  const service = await setup();
  const large = await fetch(service.url + '/api/v1/future', { method: 'POST', headers: { 'content-type': 'text/plain' }, body: 'x'.repeat(2048) });
  expect(large.status).toBe(413);
  const raw = await fetch(service.url + '/api/v1/future', { method: 'POST', headers: { 'content-type': 'text/plain' }, body: 'small' });
  expect(raw.status).toBe(415);
  const compressed = await fetch(service.url + '/api/v1/future', { method: 'POST', headers: { 'content-type': 'application/json', 'content-encoding': 'gzip' }, body: 'small' });
  expect(compressed.status).toBe(415);
});
test('central filter hides unexpected exception details and stack traces', async () => {
  const { ErrorFilter } = await import('../src/errors');
  let output: unknown; let logs = ''; let status = 0;
  const response = { headersSent: false, status: (code: number) => { status = code; return response; }, json: (value: unknown) => { output = value; } };
  const host = { switchToHttp: () => ({ getResponse: () => response, getRequest: () => ({ requestId: 'test-id' }) }) };
  new ErrorFilter(createLogger('info', { write: chunk => { logs += chunk; } })).catch(new Error('secret-canary'), host as unknown as import('@nestjs/common').ArgumentsHost);
  expect(status).toBe(500); expect(output).toEqual(normalizeError(500, 'test-id'));
  expect(logs).not.toContain('secret-canary'); expect(JSON.stringify(output)).not.toContain('stack');
});
