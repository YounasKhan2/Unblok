// Opt-in candidate A investigation. No production lifecycle or timeout changes.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { candidate, deadline, valkeyFixture, scratch } from './fixtures.mjs';

if (process.argv[2] === '--child') {
  const scenario = process.env.BE00F_DIAGNOSTIC_SCENARIO;
  const url = process.env.BE00F_DIAGNOSTIC_URL;
  const target = await candidate('A', url);
  const events = [];
  for (const event of ['connect', 'ready', 'close', 'reconnecting', 'end']) target.client.on(event, () => events.push(event));
  const marker = randomUUID();
  // Use a synthetic connection name to detect reconnection with a different ID.
  target.client.options.connectionName = marker;
  await target.client.client('SETNAME', marker);
  const observer = await candidate('A', url);
  try {
    if (scenario === 'reconnecting') {
      const id = await target.client.client('ID');
      const gap = new Promise(resolve => target.client.once('reconnecting', resolve));
      await observer.client.client('KILL', 'ID', id);
      await deadline(gap);
      assert.equal(target.client.status, 'reconnecting');
    } else if (scenario === 'already-ended') {
      await target.close(); assert.equal(target.client.status, 'end');
    } else assert.equal(scenario, 'ready');
    const stateBefore = target.client.status, eventsBefore = events.length;
    let acknowledged = true;
    const began = performance.now();
    try { await target.close(); } catch { acknowledged = false; }
    const rows = (await observer.client.client('LIST')).split('\n');
    const serverConnectionPresent = rows.some(row => row.split(' ').includes(`name=${marker}`));
    const result = { scenario, stateBefore, stateAfter: target.client.status,
      acknowledgementPassed: acknowledged, closeMilliseconds: Math.round(performance.now() - began), deadlineMilliseconds: 2500,
      socketDestroyed: target.client.stream?.destroyed === true,
      reconnectTimerPresent: !!target.client.reconnectTimeout,
      serverConnectionPresent, eventsAfterCloseAttempt: events.slice(eventsBefore),
      futureConnectEventObserved: events.slice(eventsBefore).includes('connect') };
    assert.equal(serverConnectionPresent, false);
    assert.equal(result.socketDestroyed, true); assert.equal(result.reconnectTimerPresent, false);
    assert.equal(acknowledged, scenario !== 'reconnecting');
    if (scenario === 'reconnecting') {
      assert.equal(result.stateAfter, 'reconnecting'); assert.equal(result.eventsAfterCloseAttempt.includes('end'), false);
      assert.equal(result.futureConnectEventObserved, false);
    }
    console.log(JSON.stringify(result));
  } finally { await observer.close(); }
  // Deliberately no process.exit: the parent verifies natural process termination.
} else {
  const fixture = await valkeyFixture(); const observations = [];
  try {
    for (const scenario of ['ready', 'already-ended', 'reconnecting', 'reconnecting', 'reconnecting']) {
      const child = Bun.spawn([process.execPath, import.meta.filename, '--child'], {
        stdout: 'pipe', stderr: 'pipe',
        env: { ...process.env, BE00F_DIAGNOSTIC_URL: fixture.url, BE00F_DIAGNOSTIC_SCENARIO: scenario },
      });
      const start = performance.now();
      try {
        const [exitCode, output] = await deadline(Promise.all([
          child.exited, new Response(child.stdout).text(), new Response(child.stderr).text(),
        ]), 12000);
        assert.equal(exitCode, 0);
        const result = JSON.parse(output.trim());
        observations.push({ ...result, naturalExit: true, exitCode,
          childMilliseconds: Math.round(performance.now() - start) });
      } catch {
        child.kill(); await child.exited;
        observations.push({ scenario, diagnosticPassed: false, naturalExit: false });
      }
    }
  } finally { await fixture.close(); }
  const summary = { observations, failedDiagnostics: observations.filter(row => row.diagnosticPassed === false).length,
    acknowledgementFailures: observations.filter(row => row.acknowledgementPassed === false).length,
    scope: 'event/state, socket, retry timer, server connection and natural child exit; not production signal shutdown' };
  await writeFile(resolve(scratch, 'cleanup-diagnostics.json'), JSON.stringify(summary, null, 2) + '\n');
  console.log(JSON.stringify(summary));
  process.exitCode = summary.failedDiagnostics ? 1 : 0;
}
