import { afterAll, beforeAll, expect, test } from 'bun:test';
import { SQL } from 'bun';
import { randomUUID } from 'node:crypto';
import { closeRedis, createFoundationQueue, createLogger, createRedis, diagnosticJobId, FOUNDATION_JOB, FOUNDATION_QUEUE, loadWorkerConfig, withDeadline } from '@unblok/backend-runtime';
import { QueueEvents } from 'bullmq';
import { startWorker } from '../../apps/worker/src/worker';
import { RedisRateLimiter } from '../../apps/api/src/security';

const config = loadWorkerConfig(process.env);
const redis = createRedis(config.REDIS_URL);
const eventsRedis = createRedis(config.REDIS_URL, true);
const sqlUrl = new URL(config.DATABASE_URL);
// Prisma-specific pool options are not PostgreSQL server parameters.
for (const key of ['connect_timeout', 'pool_timeout', 'connection_limit']) sqlUrl.searchParams.delete(key);
const sql = new SQL(sqlUrl.toString());
const queue = createFoundationQueue(redis);
const events = new QueueEvents(FOUNDATION_QUEUE, { connection: eventsRedis });
let service: Awaited<ReturnType<typeof startWorker>>;
let workerLogs = '';
beforeAll(async () => {
  // QueueEvents may have initiated its lazy connection itself.
  if (redis.status === 'wait') await redis.connect();
  await withDeadline(events.waitUntilReady(), 5000);
  service = await startWorker(config, createLogger('info', { write: chunk => { workerLogs += chunk; } }));
});
afterAll(async () => {
  await service?.close(); await events.close(); await queue.close();
  await Promise.all([closeRedis(redis), closeRedis(eventsRedis), sql.close()]);
});
test('real PostgreSQL SQL migration enforces singleton constraint and rolls back safely', async () => {
  const migration = await Bun.file(new URL('../../packages/database/prisma/migrations/20261010000000_foundation/migration.sql', import.meta.url)).text();
  const schema = `test_${randomUUID().replaceAll('-', '')}`;
  await expect(sql.begin(async tx => {
    await tx.unsafe(`CREATE SCHEMA "${schema}"; SET LOCAL search_path TO "${schema}";`);
    await tx.unsafe(migration);
    const rows = await tx`SELECT id FROM backend_foundation`; expect(rows).toHaveLength(1); expect(rows[0].id).toBe(1);
    await tx`SAVEPOINT check_constraint`;
    let rejected = false;
    try { await tx`INSERT INTO backend_foundation (id) VALUES (2)`; } catch { rejected = true; }
    expect(rejected).toBe(true);
    await tx`ROLLBACK TO SAVEPOINT check_constraint`;
    throw new Error('intentional transaction rollback');
  })).rejects.toThrow('intentional transaction rollback');
  const rows = await sql`SELECT schema_name FROM information_schema.schemata WHERE schema_name = ${schema}`;
  expect(rows).toHaveLength(0);
});
test('real Valkey authenticates and atomic throttling works across limiter instances', async () => {
  expect(await redis.ping()).toBe('PONG');
  const key = randomUUID(); const one = new RedisRateLimiter(redis, 2, 1000); const two = new RedisRateLimiter(redis, 2, 1000);
  const results = await Promise.all([one.consume(key), two.consume(key), one.consume(key)]);
  expect(results.filter(result => result.allowed)).toHaveLength(2); expect(results[2]?.retryAfter).toBeGreaterThan(0);
});
test('BullMQ executes diagnostic job and deduplicates retained idempotency IDs', async () => {
  const id = diagnosticJobId(randomUUID());
  const job = await queue.add(FOUNDATION_JOB, { version: 1 }, { jobId: id });
  expect(await job.waitUntilFinished(events, 5000)).toEqual({ status: 'ok' });
  const duplicate = await queue.add(FOUNDATION_JOB, { version: 1 }, { jobId: id });
  expect(duplicate.id).toBe(job.id); expect(await duplicate.getState()).toBe('completed'); await job.remove();
});
test('unsupported job fails without leaking payloads or exhausting retry budget', async () => {
  const payload = { version: 1 as const, token: 'secret-canary' };
  const job = await queue.add('not-supported', payload, { jobId: diagnosticJobId(randomUUID()) });
  await expect(job.waitUntilFinished(events, 5000)).rejects.toThrow('Unsupported foundation job');
  expect(workerLogs).toContain('job_failed'); expect(workerLogs).not.toContain('secret-canary');
  expect(await job.getState()).toBe('failed'); expect((await queue.getJob(job.id!))?.attemptsMade).toBe(1); await job.remove();
});
test('RustFS and Mailpit respond to their readiness protocols', async () => {
  expect((await fetch('http://127.0.0.1:9000/health')).status).toBe(200);
  expect((await fetch('http://127.0.0.1:8025/readyz')).status).toBe(200);
});
