// Opt-in BE-00D investigation; no test assertions, timeout changes or production hooks.
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:net';
import { QueueEvents } from 'bullmq';
import { closeRedis, createFoundationQueue, createLogger, createRedis, diagnosticJobId, FOUNDATION_JOB, FOUNDATION_QUEUE, loadWorkerConfig, withDeadline } from '@unblok/backend-runtime';
import { startWorker } from '../../apps/worker/src/worker';

const config = loadWorkerConfig(process.env);
const evidence: Record<string, unknown> = { platform: process.platform, bun: Bun.version };
// Only allowlisted events/counters/codes enter evidence. No payloads, IDs, URLs or stacks.
async function queueProbe() {
  const redis = createRedis(config.REDIS_URL), eventRedis = createRedis(config.REDIS_URL, true);
  const queue = createFoundationQueue(redis), events = new QueueEvents(FOUNDATION_QUEUE, { connection: eventRedis });
  const logEvents: string[] = [], errors: Record<string, unknown>[] = [];
  let service: Awaited<ReturnType<typeof startWorker>> | undefined;
  let job: Awaited<ReturnType<typeof queue.add>> | undefined;
  const started = performance.now();
  try {
    if (redis.status === 'wait') await redis.connect(); await events.waitUntilReady();
    service = await startWorker(config, createLogger('info', { write: chunk => {
      const event = JSON.parse(chunk).event;
      if (['worker_ready', 'job_failed', 'worker_error'].includes(event)) logEvents.push(event);
    } }));
    service.worker.on('error', error => {
      // Error classification is sanitized without publishing arbitrary exception text.
      errors.push({ name: error.name, code: 'code' in error ? error.code : null,
        lua: /lua|script/i.test(error.message), lock: /lock/i.test(error.message),
        serialization: /serializ|pack|argument|integer|number/i.test(error.message),
        unsupported: /Unsupported foundation job/.test(error.message) });
    });
    const completed = await queue.add(FOUNDATION_JOB, { version: 1 }, { jobId: diagnosticJobId(randomUUID()) });
    await completed.waitUntilFinished(events, 5000);
    const duplicate = await queue.add(FOUNDATION_JOB, { version: 1 }, { jobId: completed.id! });
    evidence.deduplication = { retainedIdMatches: duplicate.id === completed.id, state: await duplicate.getState() };
    await completed.remove();
    let notified = false; events.on('failed', () => { notified = true; });
    job = await queue.add('not-supported', { version: 1 }, { jobId: diagnosticJobId(randomUUID()) });
    try { await job.waitUntilFinished(events, 5000); }
    catch (error) { evidence.queueWait = error instanceof Error && /timed out/.test(error.message) ? 'timeout' : 'rejected'; }
    const stored = await queue.getJob(job.id!);
    evidence.queue = { durationMs: Math.round(performance.now() - started), state: await job.getState(),
      attemptsMade: stored?.attemptsMade, failedReasonMatches: stored?.failedReason === 'Unsupported foundation job',
      notified, logEvents, errors };
  } finally {
    await service?.close();
    if (job && await job.getState() !== 'active') await job.remove();
    await events.close(); await queue.close(); await closeRedis(redis); await closeRedis(eventRedis);
    // quit() can resolve before ioredis publishes its final end event.
    await new Promise<void>(resolve => setTimeout(resolve, 25));
    evidence.queueCleanup = { workerCloseCompleted: !!service, redis: redis.status, eventRedis: eventRedis.status,
      ownedJobRemoved: job ? !await queueJobExists(job.id!) : true };
  }
  async function queueJobExists(id: string) {
    const connection = createRedis(config.REDIS_URL);
    try { await connection.connect(); return (await connection.exists(`bull:${FOUNDATION_QUEUE}:${id}`)) === 1; }
    finally { await closeRedis(connection); }
  }
}
async function signals() {
  const server = createServer(); await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('Missing port');
  const port = address.port; await new Promise<void>(resolve => server.close(() => resolve()));
  const results: Record<string, unknown>[] = [];
  for (const app of ['api', 'worker']) {
    const child = Bun.spawn([process.execPath, `apps/${app}/dist/main.js`], { env: { ...process.env, API_PORT: String(port) }, stdout: 'pipe', stderr: 'pipe' });
    const names: string[] = []; let ready!: () => void;
    const readiness = new Promise<void>(resolve => { ready = resolve; });
    const drain = (async () => {
      const reader = child.stdout.getReader(), decoder = new TextDecoder(); let pending = '';
      while (true) {
        const value = await reader.read(); if (value.done) break;
        pending += decoder.decode(value.value, { stream: true }); const lines = pending.split('\n'); pending = lines.pop()!;
        for (const line of lines) {
          try { const event = JSON.parse(line).event; if (['api_started', 'worker_ready', 'shutdown_started', 'shutdown_complete', 'shutdown_failed'].includes(event)) names.push(event); } catch { /* non-JSON output omitted */ }
          if (names.includes(app === 'api' ? 'api_started' : 'worker_ready')) ready();
        }
      }
    })();
    const stderr = new Response(child.stderr).text();
    try {
      await withDeadline(readiness, 10000); const start = performance.now(); child.kill('SIGTERM');
      const exitCode = await withDeadline(child.exited, 10000); await drain; await stderr;
      results.push({ app, requestedSignal: 'SIGTERM', exitCode, signalCode: child.signalCode,
        shutdownMs: Math.round(performance.now() - start), events: names,
        listenerClosed: app === 'api' ? await fetch(`http://127.0.0.1:${port}/live`).then(() => false, () => true) : null });
    } finally { if (child.exitCode === null) { child.kill('SIGKILL'); await child.exited; } }
  }
  // Minimal runtime control: distinguishes OS delivery from application cleanup logic.
  const control = Bun.spawn([process.execPath, '-e', 'process.on("SIGTERM",()=>{console.log("handled");process.exit(0)});console.log("ready");setInterval(()=>{},1000)'], { stdout: 'pipe', stderr: 'pipe' });
  const reader = control.stdout.getReader(); await reader.read(); control.kill('SIGTERM');
  const exitCode = await control.exited; const rest = await reader.read();
  results.push({ app: 'minimal-runtime-control', requestedSignal: 'SIGTERM', exitCode, signalCode: control.signalCode, handlerObserved: rest.value ? new TextDecoder().decode(rest.value).includes('handled') : false });
  evidence.signals = results;
}
await queueProbe(); await signals();
console.log(JSON.stringify(evidence, null, 2));
