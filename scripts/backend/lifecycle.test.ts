import { expect, test } from 'bun:test';
import { createServer } from 'node:net';
import { withDeadline } from '@unblok/backend-runtime';

async function unusedPort() {
  const server = createServer();
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('Missing address');
  const port = address.port; await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); return port;
}
async function waitForEvent(stream: ReadableStream<Uint8Array>, event: string) {
  const reader = stream.getReader(); const decoder = new TextDecoder(); let text = '';
  try {
    await withDeadline((async () => {
      while (true) {
        const result = await reader.read(); if (result.done) throw new Error('Process exited before readiness');
        text += decoder.decode(result.value, { stream: true });
        if (text.includes(`"event":"${event}"`)) return;
      }
    })(), 10000);
  } finally { reader.releaseLock(); }
}
test('built API handles SIGTERM, releases listener, and exits successfully', async () => {
  const port = await unusedPort();
  const child = Bun.spawn([process.execPath, 'apps/api/dist/main.js'], { env: { ...process.env, API_PORT: String(port) }, stdout: 'pipe', stderr: 'pipe' });
  try {
    await waitForEvent(child.stdout, 'api_started');
    expect((await fetch(`http://127.0.0.1:${port}/ready`)).status).toBe(200);
    child.kill('SIGTERM'); expect(await withDeadline(child.exited, 10000)).toBe(0);
    await expect(fetch(`http://127.0.0.1:${port}/live`)).rejects.toThrow();
  } finally { if (child.exitCode === null) { child.kill('SIGKILL'); await child.exited; } }
}, 15000);
test('built worker handles SIGTERM after real queue readiness', async () => {
  const child = Bun.spawn([process.execPath, 'apps/worker/dist/main.js'], { env: process.env, stdout: 'pipe', stderr: 'pipe' });
  try {
    await waitForEvent(child.stdout, 'worker_ready');
    child.kill('SIGTERM'); expect(await withDeadline(child.exited, 10000)).toBe(0);
  } finally { if (child.exitCode === null) { child.kill('SIGKILL'); await child.exited; } }
}, 15000);

test('built API exits nonzero without credentials and emits no secret or stack', async () => {
  const child = Bun.spawn([process.execPath, 'apps/api/dist/main.js'], {
    env: { ...process.env, DATABASE_URL: '', REDIS_URL: 'https://secret-canary@example.invalid' }, stdout: 'pipe', stderr: 'pipe',
  });
  const code = await withDeadline(child.exited, 5000);
  const output = await new Response(child.stdout).text() + await new Response(child.stderr).text();
  expect(code).toBe(1); expect(output).toContain('api_startup_failed'); expect(output).not.toContain('secret-canary'); expect(output).not.toContain(' at ');
});
