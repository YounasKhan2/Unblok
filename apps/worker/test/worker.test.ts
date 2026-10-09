import { expect, test } from 'bun:test';
import { UnrecoverableError } from 'bullmq';
import { processFoundationJob } from '../src/worker';

test('diagnostic jobs have no side effects and repeated delivery is safe', () => {
  expect(processFoundationJob('foundation.noop', { version: 1 })).toEqual({ status: 'ok' });
  expect(processFoundationJob('foundation.noop', { version: 1 })).toEqual({ status: 'ok' });
});
test('unknown jobs and unvalidated payloads are rejected without futile retries', () => {
  for (const [name, data] of [['product.write', { version: 1 }], ['foundation.noop', { version: 2 }], ['foundation.noop', { version: 1, tenantId: 'forged' }]]) {
    expect(() => processFoundationJob(name as string, data)).toThrow(UnrecoverableError);
  }
});
