import { randomBytes } from 'node:crypto';
import { writeFile, readFile, chmod } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dir, '../..');
const infra = resolve(root, 'infra/docker/.env');
const api = resolve(root, 'apps/api/.env');
const worker = resolve(root, 'apps/worker/.env');
const secret = () => randomBytes(24).toString('hex');
// Exclusive creation prevents overwriting user configuration or rotating secrets
// underneath persistent volumes. Partial reruns reuse existing infrastructure keys.
try {
  await writeFile(infra, `POSTGRES_PASSWORD=${secret()}\nVALKEY_PASSWORD=${secret()}\nRUSTFS_ACCESS_KEY=${secret()}\nRUSTFS_SECRET_KEY=${secret()}\n`, { flag: 'wx', mode: 0o600 });
} catch (error) { if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error; }
const values = Object.fromEntries((await readFile(infra, 'utf8')).split('\n').filter(Boolean).map(line => {
  const index = line.indexOf('='); return [line.slice(0, index), line.slice(index + 1)];
}));
for (const key of ['POSTGRES_PASSWORD', 'VALKEY_PASSWORD', 'RUSTFS_ACCESS_KEY', 'RUSTFS_SECRET_KEY']) {
  if (!values[key] || !/^[a-zA-Z0-9_-]{16,}$/.test(values[key])) throw new Error(`Local ${key} must contain at least 16 safe characters; existing files were preserved`);
}
let verificationKey = randomBytes(32).toString('hex'), verificationId = 'v1';
let foundVerification = false;
for (const file of [api, worker]) {
  try {
    const existing = await readFile(file, 'utf8'), key = /^EMAIL_VERIFICATION_KEY=(.*)$/m.exec(existing)?.[1]?.trim();
    const id = /^EMAIL_VERIFICATION_KEY_ID=(.*)$/m.exec(existing)?.[1]?.trim();
    if (key !== undefined) {
      if (!/^[0-9a-f]{64}$/.test(key) || !id || !/^[a-z0-9-]{1,40}$/.test(id) || (foundVerification && (key !== verificationKey || id !== verificationId))) throw new Error('Existing verification keys require explicit reconciliation; files preserved');
      verificationKey = key; verificationId = id; foundVerification = true;
    }
  } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
}
const verification = `EMAIL_VERIFICATION_KEY_ID=${verificationId}\nEMAIL_VERIFICATION_KEY=${verificationKey}\nEMAIL_MAIL_ENDPOINT=http://127.0.0.1:8025/api/v1/send\nEMAIL_MAIL_FROM=verification@unblok.local\n`;
const common = `NODE_ENV=development\nDATABASE_URL=postgresql://unblok:${values.POSTGRES_PASSWORD}@127.0.0.1:5432/unblok?connect_timeout=3&pool_timeout=3&connection_limit=5\nREDIS_URL=redis://:${values.VALKEY_PASSWORD}@127.0.0.1:6379/0\nLOG_LEVEL=info\nSHUTDOWN_TIMEOUT_MS=10000\n`;
for (const [file, extra] of [[api, `API_HOST=127.0.0.1\nAPI_PORT=4000\nCORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000\nBODY_LIMIT_BYTES=65536\nRATE_LIMIT_MAX=120\nRATE_LIMIT_WINDOW_MS=60000\nSESSION_SECRETS=${randomBytes(32).toString('hex')}\nSESSION_NAMESPACE=v1\nSESSION_CROSS_ORIGIN=false\n`], [worker, 'WORKER_CONCURRENCY=2\n']] as const) {
  try { await writeFile(file, common + verification + extra, { flag: 'wx', mode: 0o600 }); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error; }
}
await chmod(infra, 0o600);
console.log('Local environment files prepared; existing files preserved. No credential values printed.');
