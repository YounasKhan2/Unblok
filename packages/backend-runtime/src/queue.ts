import { Redis } from 'ioredis';
import { Queue, type JobsOptions } from 'bullmq';
import { createHash } from 'node:crypto';
import type { FoundationJob } from '@unblok/contracts';

export const FOUNDATION_QUEUE = 'foundation';
export const FOUNDATION_JOB = 'foundation.noop';
export const jobDefaults: JobsOptions = {
  attempts: 3, backoff: { type: 'exponential', delay: 1000 },
  removeOnComplete: { age: 86400, count: 1000 },
  removeOnFail: { age: 604800, count: 1000 },
};
export function createRedis(url: string, worker = false) {
  return new Redis(url, {
    lazyConnect: true, maxRetriesPerRequest: worker ? null : 1,
    connectTimeout: 2000, enableOfflineQueue: false,
    ...(worker ? {} : { commandTimeout: 2000 }),
    retryStrategy: times => times > 10 ? null : Math.min(times * 100, 2000),
  });
}
export function createFoundationQueue(connection: Redis) {
  return new Queue<FoundationJob>(FOUNDATION_QUEUE, { connection, defaultJobOptions: jobDefaults });
}
export function diagnosticJobId(key: string) {
  if (!key || key.length > 200) throw new Error('Invalid idempotency key');
  return createHash('sha256').update(`foundation.noop:${key}`).digest('hex');
}
const closeOperations = new WeakMap<Redis, Promise<void>>();
export function closeRedis(connection: Redis): Promise<void> {
  const existing = closeOperations.get(connection);
  if (existing) return existing;
  const operation = (async () => {
    if (connection.status === 'ready') {
      try { await connection.quit(); } finally { connection.disconnect(); }
    } else connection.disconnect();
  })();
  closeOperations.set(connection, operation);
  return operation;
}
