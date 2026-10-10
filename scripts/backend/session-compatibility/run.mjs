import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { candidate, valkeyFixture, appFixture, tlsFixture, http, cookieOf, pause,
  deadline, environment, scratch, Store10 } from './fixtures.mjs';

// Never print assertion values, errors/stacks, credentials, cookies or SIDs.
const results = [];
const requested = process.argv[2];
if (requested && !['--candidate=A', '--candidate=B'].includes(requested)) throw new Error('Unsupported candidate selection');
const selected = requested ? [requested.at(-1)] : ['A', 'B'];
async function check(candidate, name, run) {
  const start = performance.now();
  try {
    const evidence = await deadline(run(), 12000);
    results.push({ candidate, name, passed: true, milliseconds: Math.round(performance.now() - start), ...evidence });
  } catch (error) {
    results.push({ candidate, name, passed: false, milliseconds: Math.round(performance.now() - start),
      code: 'ASSERTION_OR_FIXTURE_FAILURE', ...error.evidence });
  }
  console.log(`${results.at(-1).passed ? 'PASS' : 'FAIL'} ${candidate} ${name}`);
}
const secrets = [randomBytes(32).toString('hex')];
const sidOf = cookie => decodeURIComponent(cookie.split('=').slice(1).join('=')).slice(2).split('.').slice(0, -1).join('.');
const state = () => ({ cookie: { expires: new Date(Date.now() + 2000).toISOString() }, synthetic: true });
let fixture;
try {
  fixture = await valkeyFixture();
  for (const kind of selected) {
    let adapter, app;
    try {
      adapter = await candidate(kind, fixture.url);
      app = await appFixture(adapter, { secrets });
      await check(kind, 'actual Valkey version and adapter connection', async () => {
        const info = await adapter.client.info('server'); assert.match(info, /valkey_version:8\.1\.3/);
        assert.equal(adapter.ready(), true);
      });
      await check(kind, 'saveUninitialized false creates neither cookie nor key', async () => {
        const response = await http(app.port, '/uninitialized');
        assert.equal(response.status, 200); assert.equal(cookieOf(response), undefined);
        assert.equal(await adapter.client.dbsize?.() ?? await adapter.client.dbSize(), 0);
      });
      await check(kind, 'anonymous bootstrap, development flags, regeneration, retrieval and old SID invalidation', async () => {
        const anonymous = await http(app.port, '/bootstrap'); const cookie = cookieOf(anonymous);
        assert.ok(cookie); const header = anonymous.headers['set-cookie'][0];
        assert.match(header, /^unblok\.sid\.dev=/); assert.match(header, /HttpOnly/);
        assert.match(header, /SameSite=Lax/); assert.match(header, /Path=\//);
        assert.doesNotMatch(header, /(?:Domain=|; Secure)/);
        const signedIn = await http(app.port, '/simulate', cookie);
        assert.equal(signedIn.status, 200); assert.notEqual(cookieOf(signedIn), cookie);
        const saved = await adapter.call('get', sidOf(cookieOf(signedIn)));
        assert.ok(saved.cookie.originalMaxAge > 0 && saved.cookie.originalMaxAge <= 2000);
        assert.equal((await http(app.port, '/read', cookie)).status, 401);
        assert.equal((await http(app.port, '/read', cookieOf(signedIn))).status, 200);
      });
      await check(kind, 'missing malformed and tampered cookies never grant synthetic authority', async () => {
        const signedIn = await http(app.port, '/simulate'); const cookie = cookieOf(signedIn);
        const tampered = cookie.slice(0, -1) + (cookie.at(-1) === 'A' ? 'B' : 'A');
        for (const value of [undefined, 'unblok.sid.dev=garbage', 'unblok.sid.dev=%ZZ', tampered]) {
          assert.equal((await http(app.port, '/read', value)).status, 401);
        }
      });
      await check(kind, 'resave false leaves unmodified session set count unchanged', async () => {
        const signedIn = await http(app.port, '/simulate'); let writes = 0;
        const original = adapter.store.set; adapter.store.set = function (...args) { writes++; return original.apply(this, args); };
        try { assert.equal((await http(app.port, '/read', cookieOf(signedIn))).status, 200); assert.equal(writes, 0); }
        finally { adapter.store.set = original; }
      });
      await check(kind, 'HTTP success waits for explicit store save acknowledgement', async () => {
        const original = adapter.store.set; let release; let started;
        const entered = new Promise(resolve => { started = resolve; });
        adapter.store.set = function (...args) { release = () => original.apply(this, args); started(); };
        let done = false;
        const request = http(app.port, '/simulate').then(response => { done = true; return response; });
        try { await deadline(entered); assert.equal(done, false); adapter.store.set = original; release(); assert.equal((await request).status, 200); }
        finally { adapter.store.set = original; }
      });
      await check(kind, 'set TTL, touch renewal and concurrent get/set/touch', async () => {
        const sid = randomUUID(); await adapter.call('set', sid, state());
        const ttl = await adapter.ttl(sid); assert.ok(ttl > 0 && ttl <= 2100);
        await pause(250); const beforeTouch = await adapter.ttl(sid);
        await adapter.call('touch', sid, state()); assert.ok(await adapter.ttl(sid) > beforeTouch + 100);
        await Promise.all([adapter.call('get', sid), adapter.call('set', sid, state()), adapter.call('touch', sid, state())]);
        assert.ok(await adapter.call('get', sid)); await adapter.call('destroy', sid);
        return { initialTtlMilliseconds: ttl };
      });
      await check(kind, 'idle expiry during a concurrent delayed save can resurrect stock state', async () => {
        const sid = randomUUID(); await adapter.call('set', sid, state());
        const snapshot = await adapter.call('get', sid);
        await pause(2100); assert.equal(await adapter.call('get', sid), null);
        snapshot.cookie.expires = new Date(Date.now() + 2000).toISOString();
        await adapter.call('set', sid, snapshot); assert.ok(await adapter.call('get', sid));
        await adapter.call('destroy', sid); return { stockResurrectionObserved: true };
      });
      await check(kind, 'destroy then delayed stale set resurrects stock state', async () => {
        const sid = randomUUID(); await adapter.call('set', sid, state());
        const snapshot = await adapter.call('get', sid); await adapter.call('destroy', sid);
        assert.equal(await adapter.call('get', sid), null);
        await adapter.call('set', sid, snapshot); assert.ok(await adapter.call('get', sid));
        await adapter.call('destroy', sid); return { stockResurrectionObserved: true };
      });
      await check(kind, 'HTTP rotation and destruction race with delayed renewal resurrect stock authority', async () => {
        for (const competingPath of ['/simulate', '/destroy']) {
          const cookie = cookieOf(await http(app.port, '/simulate'));
          const sid = sidOf(cookie), original = adapter.store.set;
          let release, entered;
          const held = new Promise(resolve => { entered = resolve; });
          adapter.store.set = function (...args) {
            if (args[0] === sid && !release) { release = () => original.apply(this, args); entered(); return; }
            return original.apply(this, args);
          };
          const renewal = http(app.port, '/renew', cookie);
          try {
            await deadline(held);
            assert.equal((await http(app.port, competingPath, cookie)).status, 200);
            assert.equal(await adapter.call('get', sid), null);
            adapter.store.set = original; release(); assert.equal((await renewal).status, 200);
            assert.equal((await http(app.port, '/read', cookie)).status, 200);
            await adapter.call('destroy', sid);
          } finally { adapter.store.set = original; }
        }
        return { oldCookieAuthorityRestoredByStockStore: true, scenarios: ['rotation', 'destruction'],
          scope: 'synthetic identity only; production revocation needs PostgreSQL fences' };
      });
      await check(kind, 'touch missing key does not recreate it; multiple sessions and destroy isolation', async () => {
        const one = randomUUID(), two = randomUUID();
        await Promise.all([adapter.call('set', one, state()), adapter.call('set', two, state())]);
        await adapter.call('destroy', one); await adapter.call('touch', one, state());
        assert.equal(await adapter.call('get', one), null); assert.ok(await adapter.call('get', two));
        await adapter.call('destroy', two);
      });
      await check(kind, 'absolute deadline rejects still-live session; renewal clamps lifetime', async () => {
        const signedIn = await http(app.port, '/simulate');
        app.advance(1500); const renewed = await http(app.port, '/renew', cookieOf(signedIn));
        assert.equal(renewed.status, 200);
        const saved = await adapter.call('get', sidOf(cookieOf(renewed)));
        assert.ok(saved.cookie.originalMaxAge > 0 && saved.cookie.originalMaxAge <= 1500);
        app.advance(1600); assert.equal((await http(app.port, '/read', cookieOf(renewed))).status, 401);
        return { clock: 'fixture-only injected application clock; stock adapter has no absolute deadline' };
      });
      await check(kind, 'real idle TTL expiry invalidates HTTP cookie', async () => {
        const signedIn = await http(app.port, '/simulate'); await pause(2100);
        assert.equal((await http(app.port, '/read', cookieOf(signedIn))).status, 401);
      });
      await check(kind, 'HTTP destroy invalidates subsequent request', async () => {
        const signedIn = await http(app.port, '/simulate'); const cookie = cookieOf(signedIn);
        assert.equal((await http(app.port, '/destroy', cookie)).status, 200);
        assert.equal((await http(app.port, '/read', cookie)).status, 401);
      });
      await check(kind, 'read write regeneration and save callback errors fail closed', async () => {
        for (const [method, path, needsCookie] of [['get', '/read', true], ['set', '/simulate', false], ['destroy', '/simulate', true]]) {
          const cookie = needsCookie ? cookieOf(await http(app.port, '/simulate')) : undefined;
          const original = adapter.store[method];
          adapter.store[method] = (...args) => args.at(-1)(new Error('Injected fixture failure'));
          try {
            const response = await http(app.port, path, cookie);
            assert.equal(response.status, 503); assert.equal(response.body.code, 'STORE_UNAVAILABLE');
          } finally { adapter.store[method] = original; }
        }
      });
      await check(kind, 'HTTPS trusted proxy emits host cookie; untrusted spoof and disabled trust rejected', async () => {
        const secureApp = await appFixture(adapter, { secrets, secure: true, trust: true });
        let proxy, disabled, disabledProxy;
        try {
          proxy = await tlsFixture(secureApp.port);
          const response = await http(proxy.port, '/simulate', undefined, { 'x-forwarded-proto': 'http' }, proxy.cert);
          assert.equal(response.status, 200); const header = response.headers['set-cookie'][0];
          assert.match(header, /^__Host-unblok\.sid=/); assert.match(header, /; Secure/);
          assert.match(header, /HttpOnly/); assert.match(header, /SameSite=Lax/); assert.match(header, /Path=\//);
          assert.doesNotMatch(header, /Domain=/); assert.match(header, /Expires=/);
          assert.equal((await http(proxy.port, '/read', cookieOf(response), {}, proxy.cert)).status, 200);
          const spoof = await http(secureApp.port, '/simulate', undefined, { 'x-forwarded-proto': 'https' });
          assert.equal(spoof.status, 403); assert.equal(cookieOf(spoof), undefined);
          disabled = await appFixture(adapter, { secrets, secure: true }); disabledProxy = await tlsFixture(disabled.port);
          assert.equal((await http(disabledProxy.port, '/simulate', undefined, {}, disabledProxy.cert)).status, 403);
        } finally {
          await disabledProxy?.close(); await disabled?.close(); await proxy?.close(); await secureApp.close();
        }
      });
      await check(kind, 'signing secret rotation accepts bounded previous key; removal rejects old cookie', async () => {
        const old = randomBytes(32).toString('hex'), fresh = randomBytes(32).toString('hex');
        const before = await appFixture(adapter, { secrets: [old] });
        const rotating = await appFixture(adapter, { secrets: [fresh, old] });
        const after = await appFixture(adapter, { secrets: [fresh] });
        try {
          const cookie = cookieOf(await http(before.port, '/simulate'));
          assert.equal((await http(rotating.port, '/read', cookie)).status, 200);
          assert.equal((await http(after.port, '/read', cookie)).status, 401);
        } finally { await before.close(); await rotating.close(); await after.close(); }
      });
      await check(kind, 'Valkey disconnect during request returns 503; restart reconnects without memory authority', async () => {
        const cookie = cookieOf(await http(app.port, '/simulate'));
        await fixture.stop();
        const response = await http(app.port, '/read', cookie); assert.equal(response.status, 503);
        await fixture.start();
        const until = Date.now() + 5000;
        while (!adapter.ready() && Date.now() < until) await pause(100);
        assert.equal(adapter.ready(), true);
        // Fixture intentionally has no persistence; a restored server cannot invent session identity.
        assert.equal((await http(app.port, '/read', cookie)).status, 401);
        return { clientErrorEvents: adapter.errors() };
      });
      await check(kind, 'blocked store operation reaches harness deadline without success', async () => {
        const start = performance.now();
        await assert.rejects(deadline(new Promise(() => {}), 100));
        return { deadlineMilliseconds: 100, observedMilliseconds: Math.round(performance.now() - start),
          scope: 'deadline primitive only; not cancellation of middleware/store work' };
      });
      await check(kind, 'stock blocked-read deadline behavior is measured', async () => {
        const cookie = cookieOf(await http(app.port, '/simulate'));
        const controller = await candidate('A', fixture.url);
        try {
          await controller.client.call('CLIENT', 'PAUSE', '1200', 'ALL');
          const began = performance.now();
          const response = await http(app.port, '/read', cookie);
          const elapsed = Math.round(performance.now() - began);
          assert.equal(response.status, kind === 'A' ? 503 : 200); await pause(1300);
          return { status: response.status, observedMilliseconds: elapsed, securityDeadlinePassed: kind === 'A',
            commandDeadlineMilliseconds: 750, serverPauseMilliseconds: 1200 };
        } finally { await controller.close(); }
      });
      await check(kind, 'test-only bounded Store returns 503 for real blocked read', async () => {
        const boundedApp = await appFixture(adapter, { secrets, bounded: true });
        const controller = await candidate('A', fixture.url);
        try {
          const cookie = cookieOf(await http(boundedApp.port, '/simulate'));
          await controller.client.call('CLIENT', 'PAUSE', '1200', 'ALL');
          assert.equal((await http(boundedApp.port, '/read', cookie)).status, 503); await pause(1300);
        } finally { await boundedApp.close(); await controller.close(); }
        return { callbackDeadlineMilliseconds: 750, cancellationProven: false };
      });
      await check(kind, 'unavailable startup rejects bounded client connection', async () => {
        await fixture.stop(); let unexpected;
        try { await assert.rejects(candidate(kind, fixture.url).then(value => { unexpected = value; })); }
        finally { await unexpected?.close(); await fixture.start(); }
      });
      if (kind === 'B') await check(kind, 'modern connect-redis rejects actual incompatible ioredis invocation', async () => {
        const incompatible = await candidate('A', fixture.url);
        try {
          const wrong = new Store10({ client: incompatible.client });
          await assert.rejects(new Promise((resolve, reject) => wrong.set(randomUUID(), state(), error => error ? reject(error) : resolve())));
        } finally { await incompatible.close(); }
      });
    } finally {
      await check(kind, 'direct application cleanup closes listener', async () => {
        await app?.close(); assert.equal(app?.listening(), false);
      });
      await check(kind, 'direct client cleanup closes connection', async () => {
        await adapter?.close(); assert.equal(adapter?.closed(), true);
      });
    }
  }
  // Independent infrastructure experiment, deliberately NOT a durable PG fence.
  await check('primitive', 'Valkey atomic generation CAS prevents delayed resurrection and epoch mismatch', async () => {
    const adapter = await candidate('A', fixture.url);
    const fence = `be00f:${randomUUID()}:fence`, payload = `be00f:${randomUUID()}:payload`;
    const cas = 'if redis.call("GET",KEYS[1]) ~= ARGV[1] then return 0 end; redis.call("SET",KEYS[2],ARGV[2],"PX",2000); return 1';
    try {
      await adapter.client.set(fence, 'epoch1:gen1', 'PX', 5000);
      assert.equal(await adapter.client.eval(cas, 2, fence, payload, 'epoch1:gen1', '{}'), 1);
      await adapter.client.set(fence, 'epoch2:gen2', 'PX', 5000); await adapter.client.del(payload);
      const rejected = await Promise.all(Array.from({ length: 8 }, () => adapter.client.eval(cas, 2, fence, payload, 'epoch1:gen1', '{}')));
      assert.deepEqual(rejected, Array(8).fill(0)); assert.equal(await adapter.client.get(payload), null);
      await adapter.client.del(fence);
      assert.equal(await adapter.client.eval(cas, 2, fence, payload, 'epoch1:gen1', '{}'), 0);
      return { rejectedConcurrentStaleSaves: 8, durability: 'Valkey-only; PostgreSQL integration not proven' };
    } finally { await adapter.client.del(fence, payload); await adapter.close(); }
  });
} catch { results.push({ candidate: 'fixture', name: 'setup or suite completion', passed: false, code: 'FIXTURE_FAILED' }); }
finally {
  await check('fixture', 'disposable Valkey container removed', async () => { await fixture?.close(); assert.ok(fixture); });
}
const summary = { environment: environment(), valkey: '8.1.3', candidates: { A: 'connect-redis 8.1.0 + existing ioredis 5.11.1', B: 'connect-redis 10.0.0 + redis 6.3.0' },
  executedCandidates: selected,
  passed: results.filter(result => result.passed).length, failed: results.filter(result => !result.passed).length, results };
await writeFile(resolve(scratch, requested ? `results-${selected[0]}.json` : 'results.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify({ passed: summary.passed, failed: summary.failed, environment: summary.environment }));
process.exitCode = summary.failed ? 1 : 0;
