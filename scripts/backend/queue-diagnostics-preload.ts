// Optional observation of the unchanged infra suite. Never used by normal gates.
import { Job, Worker, QueueEvents } from 'bullmq';
import { afterAll } from 'bun:test';
const observed: Record<string, unknown>[] = [];
const workerEmit = Worker.prototype.emit;
Worker.prototype.emit = function (event, ...args) {
  if (['error', 'failed', 'completed'].includes(event)) observed.push({ source: 'worker', event });
  return Reflect.apply(workerEmit, this, [event, ...args]);
};
const eventsEmit = QueueEvents.prototype.emit;
QueueEvents.prototype.emit = function (event, ...args) {
  if (['failed', 'completed'].includes(event)) observed.push({ source: 'queue-events', event });
  return Reflect.apply(eventsEmit, this, [event, ...args]);
};
const wait = Job.prototype.waitUntilFinished;
Job.prototype.waitUntilFinished = async function (...args) {
  const start = performance.now();
  try { return await wait.apply(this, args); }
  catch (error) {
    const fresh = await Job.fromId(this.queue, this.id!);
    observed.push({ source: 'waiter', durationMs: Math.round(performance.now() - start), state: await this.getState(),
      attemptsMade: fresh?.attemptsMade, failedReasonMatches: fresh?.failedReason === 'Unsupported foundation job',
      timeout: error instanceof Error && /timed out/.test(error.message) });
    throw error;
  }
};
afterAll(() => console.log('SANITIZED_QUEUE_EVIDENCE ' + JSON.stringify(observed)));
