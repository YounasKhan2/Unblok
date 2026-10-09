import { Worker, UnrecoverableError } from 'bullmq';
import { foundationJobSchema } from '@unblok/contracts';
import { closeRedis, createRedis, FOUNDATION_JOB, FOUNDATION_QUEUE, withDeadline, type Logger, type WorkerConfig } from '@unblok/backend-runtime';

export function processFoundationJob(name: string, data: unknown) {
  if (name !== FOUNDATION_JOB || !foundationJobSchema.safeParse(data).success) throw new UnrecoverableError('Unsupported foundation job');
  return { status: 'ok' as const }; // No side effects: safe under at-least-once delivery.
}
export async function startWorker(config: WorkerConfig, logger: Logger) {
  const connection = createRedis(config.REDIS_URL, true);
  connection.on('error', () => logger.warn({ event: 'queue_connection_error' }));
  let worker: Worker | undefined;
  try {
    await withDeadline(connection.connect(), 5000);
    worker = new Worker(FOUNDATION_QUEUE, async job => processFoundationJob(job.name, job.data as unknown), {
      connection, concurrency: config.WORKER_CONCURRENCY,
    });
    worker.on('failed', job => logger.error({ event: 'job_failed', jobId: job?.id, attempts: job?.attemptsMade }));
    worker.on('error', () => logger.error({ event: 'worker_error' }));
    worker.on('completed', job => logger.info({ event: 'job_completed', jobId: job.id }));
    await withDeadline(worker.waitUntilReady(), 5000);
    logger.info({ event: 'worker_ready' });
    let closing: Promise<void> | undefined;
    const activeWorker = worker;
    return { worker, close: () => closing ??= (async () => {
      try { await activeWorker.close(); } finally { await closeRedis(connection); }
    })() };
  } catch (error) {
    if (worker) await worker.close(true);
    await closeRedis(connection); throw error;
  }
}
