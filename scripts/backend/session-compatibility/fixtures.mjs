import { createRequire } from 'node:module';
import { realpathSync } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomBytes, randomUUID } from 'node:crypto';
import { createServer as createHttpsServer, request as httpsRequest } from 'node:https';
import { request as httpRequest, createServer as createHttpServer } from 'node:http';

import { root, scratch } from './paths.mjs';
export { root, scratch } from './paths.mjs';
const apiRequire = createRequire(resolve(root, 'apps/api/package.json'));
apiRequire('reflect-metadata');
const { Module } = apiRequire('@nestjs/common');
const { NestFactory } = apiRequire('@nestjs/core');
const { Redis } = createRequire(resolve(root, 'packages/backend-runtime/package.json'))('ioredis');
const candidateRequire = createRequire(resolve(scratch, 'candidates/package.json'));
export const session = candidateRequire('express-session');
export const Store8 = candidateRequire('store8').RedisStore;
export const Store10 = candidateRequire('store10').RedisStore;
export const createClient = candidateRequire('redis').createClient;
export const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
export async function deadline(operation, milliseconds = 2500) {
  let timer;
  try {
    return await Promise.race([operation, new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Bounded operation deadline')), milliseconds);
    })]);
  } finally { clearTimeout(timer); }
}
export async function command(args, options = {}) {
  const failure = (stage, error, exitCode) => Object.assign(new Error('Fixture command failed'), { evidence: {
    fixtureCommand: args[0].includes('openssl') ? 'openssl' : args[0], fixtureStage: stage,
    ...(Number.isInteger(exitCode) ? { fixtureExitCode: exitCode } : {}),
    errorCategory: ['ENOMEM', 'EAGAIN', 'ENOENT', 'EPERM', 'EACCES'].includes(error?.code) ? error.code : 'unspecified',
  } });
  let child;
  try { child = Bun.spawn(args, { cwd: root, stdout: 'pipe', stderr: 'pipe', ...options }); }
  catch (error) { throw failure('spawn', error); }
  const output = new Response(child.stdout).text();
  const errors = new Response(child.stderr).text();
  try {
    const [code, result] = await deadline(Promise.all([child.exited, output, errors]), 30000);
    if (code !== 0) throw failure('exit', undefined, code);
    return result.trim();
  } catch (error) {
    if (child.exitCode === null) child.kill();
    await child.exited;
    throw error.evidence ? error : failure('await', error, child.exitCode);
  }
}
export async function valkeyFixture() {
  const name = `unblok-be00f-${randomUUID()}`;
  const password = randomBytes(32).toString('hex');
  const image = 'valkey/valkey:8.1.3-alpine@sha256:d827e7f7552cdee40cc7482dbae9da020f42bc47669af6f71182a4ef76a22773';
  const reservation = createHttpServer();
  await new Promise(resolve => reservation.listen(0, '127.0.0.1', resolve));
  const selectedPort = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  await command(['docker', 'run', '-d', '--name', name, '-p', `127.0.0.1:${selectedPort}:6379`,
    '-e', 'BE00F_PASSWORD', '--entrypoint', '/bin/sh', image, '-ec',
    'exec valkey-server --requirepass "$BE00F_PASSWORD" --save "" --appendonly no'],
  { env: { ...process.env, BE00F_PASSWORD: password } });
  let removed = false;
  const close = async () => {
    if (removed) return;
    await command(['docker', 'rm', '-f', name]); removed = true;
  };
  try {
    const port = Number((await command(['docker', 'port', name, '6379/tcp'])).split(':').at(-1));
    if (!port) throw new Error('Fixture port unavailable');
    return { url: `redis://:${password}@127.0.0.1:${port}/0`, close,
      stop: () => command(['docker', 'stop', '-t', '1', name]),
      start: () => command(['docker', 'start', name]),
      // Inspect only our disposable fixture; expose booleans, never credentials.
      credentialExposure: async () => {
        const env = JSON.parse(await command(['docker', 'inspect', '--format', '{{json .Config.Env}}', name]));
        const startup = JSON.parse(await command(['docker', 'inspect', '--format', '{{json .Config.Cmd}}', name]));
        const argv = await command(['docker', 'exec', name, 'cat', '/proc/1/cmdline']);
        return { containerEnvironmentContainsPassword: env.includes(`BE00F_PASSWORD=${password}`),
          startupArgumentExpandsPassword: startup.some(value => value.includes('--requirepass "$BE00F_PASSWORD"')),
          runtimeProcessTitleContainsPassword: argv.includes(password), productionDeliveryCertified: false };
      },
      version: '8.1.3', image };
  } catch { await close(); throw new Error('Valkey fixture setup failed'); }
}
export async function candidate(kind, url) {
  let client;
  if (kind === 'A') {
    client = new Redis(url, { lazyConnect: true, connectTimeout: 750, commandTimeout: 750,
      maxRetriesPerRequest: 1, enableOfflineQueue: false,
      retryStrategy: times => times > 20 ? null : Math.min(times * 100, 500) });
  } else {
    client = createClient({ url, disableOfflineQueue: true, commandOptions: { timeout: 750 },
      socket: { connectTimeout: 750, reconnectStrategy: retries => retries > 20 ? false : Math.min(100 * (retries + 1), 500) } });
  }
  let errors = 0;
  client.on('error', () => { errors++; });
  try { await deadline(client.connect()); }
  catch {
    if (kind === 'A') client.disconnect(); else if (client.isOpen) client.destroy();
    throw new Error('Candidate connection failed');
  }
  const prefix = `be00f:${randomUUID()}:`;
  const Store = kind === 'A' ? Store8 : Store10;
  const store = new Store({ client, prefix, ttl: 2 });
  const call = (method, ...args) => deadline(new Promise((resolve, reject) => {
    store[method](...args, (error, value) => error ? reject(new Error('Store operation failed')) : resolve(value));
  }));
  const close = async () => {
    if (kind === 'A') {
      const stateBefore = client.status;
      const ended = new Promise(resolve => client.status === 'end' ? resolve() : client.once('end', resolve));
      try { if (client.status === 'ready') await deadline(client.quit()); }
      finally {
        client.disconnect();
        try { await deadline(ended); }
        catch { throw Object.assign(new Error('Client cleanup not confirmed'), { evidence: {
          stateBefore, stateAfter: client.status, cleanupConfirmed: false, deadlineMilliseconds: 2500,
          socketDestroyed: client.stream?.destroyed === true, reconnectTimerPresent: !!client.reconnectTimeout } }); }
      }
    }
    else { if (client.isOpen) client.destroy(); }
  };
  return { client, store, call, prefix, close, errors: () => errors,
    ready: () => kind === 'A' ? client.status === 'ready' : client.isReady,
    closed: () => kind === 'A' ? client.status === 'end' : !client.isOpen,
    ttl: sid => kind === 'A' ? client.pttl(prefix + sid) : client.pTTL(prefix + sid) };
}
export function http(port, path, cookie, headers = {}, tls) {
  return deadline(new Promise((resolve, reject) => {
    const transport = tls ? httpsRequest : httpRequest;
    const req = transport({ hostname: '127.0.0.1', port, path, method: 'GET',
      ...(tls ? { ca: tls, rejectUnauthorized: true } : {}),
      headers: { ...headers, ...(cookie ? { Cookie: cookie } : {}) } }, res => {
      let body = ''; res.on('data', chunk => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers,
        body: body ? JSON.parse(body) : {} }));
    });
    req.on('error', () => reject(new Error('HTTP fixture request failed'))); req.end();
  }));
}
export function cookieOf(response) { return response.headers['set-cookie']?.[0]?.split(';')[0]; }

// Private synthetic endpoints only. No production AppModule, guards or identity DB.
export function boundedStore(store, milliseconds = 750) {
  const wrapper = new session.Store();
  for (const method of ['get', 'set', 'touch', 'destroy']) {
    wrapper[method] = (...args) => {
      const callback = args.pop(); let settled = false;
      const finish = (error, value) => {
        if (settled) return;
        settled = true; clearTimeout(timer); callback(error, value);
      };
      const timer = setTimeout(() => finish(new Error('Store deadline exceeded')), milliseconds);
      try { store[method](...args, finish); } catch { finish(new Error('Store operation failed')); }
    };
  }
  return wrapper;
}
export async function appFixture(adapter, { secure = false, trust = false, secrets, idle = 2000, absolute = 3000, bounded = false } = {}) {
  class FixtureModule {}
  Module({})(FixtureModule);
  const app = await NestFactory.create(FixtureModule, { logger: false, abortOnError: false });
  app.set('trust proxy', trust ? address => address === '127.0.0.2' : false);
  const api = app.getHttpAdapter().getInstance();
  api.use((req, res, next) => {
    if (secure && !req.secure) return res.status(403).json({ code: 'HTTPS_REQUIRED' });
    next();
  });
  api.use(session({ store: bounded ? boundedStore(adapter.store) : adapter.store, secret: secrets, name: secure ? '__Host-unblok.sid' : 'unblok.sid.dev',
    saveUninitialized: false, resave: false, cookie: { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: idle } }));
  let now = Date.now();
  api.use((req, res, next) => {
    if (req.session?.synthetic && now >= req.session.absoluteDeadline) {
      return req.session.destroy(error => res.status(error ? 503 : 401).json({ code: error ? 'STORE_UNAVAILABLE' : 'EXPIRED' }));
    }
    next();
  });
  const save = (req, res, result) => {
    if (req.session.synthetic) req.session.cookie.maxAge = Math.min(idle, req.session.absoluteDeadline - now);
    req.session.save(error => res.status(error ? 503 : 200).json(error ? { code: 'STORE_UNAVAILABLE' } : result));
  };
  api.get('/uninitialized', (_req, res) => res.json({ ok: true }));
  api.get('/bootstrap', (req, res) => { req.session.csrf = randomBytes(32).toString('hex'); save(req, res, { ok: true }); });
  api.get('/simulate', (req, res) => req.session.regenerate(error => {
    if (error) return res.status(503).json({ code: 'STORE_UNAVAILABLE' });
    req.session.synthetic = true; req.session.absoluteDeadline = now + absolute;
    save(req, res, { ok: true });
  }));
  api.get('/read', (req, res) => {
    if (!req.session.synthetic) return res.status(401).json({ code: 'UNAUTHENTICATED' });
    res.json({ synthetic: true });
  });
  api.get('/renew', (req, res) => {
    if (!req.session.synthetic) return res.status(401).json({ code: 'UNAUTHENTICATED' });
    req.session.counter = (req.session.counter ?? 0) + 1; save(req, res, { ok: true });
  });
  api.get('/destroy', (req, res) => req.session.destroy(error => res.status(error ? 503 : 200).json({ ok: !error })));
  api.use((_error, _req, res, next) => { void next; return res.status(503).json({ code: 'STORE_UNAVAILABLE' }); });
  await app.listen(0, '127.0.0.1');
  const server = app.getHttpServer();
  return { port: server.address().port, advance: ms => { now += ms; }, close: () => deadline(app.close()),
    listening: () => server.listening };
}
export async function tlsFixture(backendPort) {
  await mkdir(resolve(scratch, 'tls'), { recursive: true });
  const keyPath = resolve(scratch, 'tls/key.pem'), certPath = resolve(scratch, 'tls/cert.pem');
  const openssl = process.env.BE00F_OPENSSL ?? (process.platform === 'win32' ? 'C:/Program Files/Git/usr/bin/openssl.exe' : 'openssl');
  await command([openssl, 'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1',
    '-subj', '/CN=localhost', '-addext', 'subjectAltName=IP:127.0.0.1,DNS:localhost',
    '-keyout', keyPath, '-out', certPath]);
  const cert = await readFile(certPath), key = await readFile(keyPath);
  const server = createHttpsServer({ key, cert }, (req, res) => {
    // A separate loopback address is the sole trusted fixture ingress.
    const upstream = httpRequest({ hostname: '127.0.0.1', port: backendPort, localAddress: '127.0.0.2',
      path: req.url, method: req.method, headers: { cookie: req.headers.cookie ?? '',
        host: 'localhost', 'x-forwarded-proto': 'https' } }, response => {
      res.writeHead(response.statusCode, response.headers); response.pipe(res);
    });
    upstream.on('error', () => { res.writeHead(503); res.end('{}'); }); req.pipe(upstream);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return { port: server.address().port, cert,
    close: () => deadline(new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()))),
    listening: () => server.listening };
}
export function environment() {
  const require = apiRequire;
  const adapterEntry = realpathSync(require.resolve('@nestjs/platform-express'));
  const adapterRequire = createRequire(adapterEntry);
  return { bun: Bun.version, nest: require('@nestjs/core/package.json').version,
    platformExpress: require('@nestjs/platform-express/package.json').version,
    adapterExpress: adapterRequire('express/package.json').version,
    directExpress: require('express/package.json').version,
    ioredis: createRequire(resolve(root, 'packages/backend-runtime/package.json'))('ioredis/package.json').version,
    session: candidateRequire('express-session/package.json').version,
    redis: candidateRequire('redis/package.json').version, platform: process.platform };
}
