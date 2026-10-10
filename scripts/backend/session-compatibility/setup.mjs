// Candidate dependencies live under .git, outside every production workspace.
import { mkdir, copyFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scratch } from './paths.mjs';
const source = dirname(fileURLToPath(import.meta.url));
const destination = resolve(scratch, 'candidates');
await mkdir(destination, { recursive: true });
await copyFile(resolve(source, 'candidates.json'), resolve(destination, 'package.json'));
const frozen = Bun.file(resolve(source, 'candidates.lock'));
if (await frozen.exists()) await copyFile(resolve(source, 'candidates.lock'), resolve(destination, 'bun.lock'));
const child = Bun.spawn([process.execPath, 'install', '--ignore-scripts', ...(await frozen.exists() ? ['--frozen-lockfile'] : [])], {
  cwd: destination, stdout: 'pipe', stderr: 'pipe',
});
const deadline = setTimeout(() => child.kill(), 30000);
// Do not forward arbitrary package-manager output into diagnostic evidence.
let exitCode;
try {
  await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text()]);
  exitCode = await child.exited;
} finally { clearTimeout(deadline); }
if (exitCode !== 0) throw new Error('Isolated candidate installation failed');
if (!await frozen.exists()) await copyFile(resolve(destination, 'bun.lock'), resolve(source, 'candidates.lock'));
console.log('Isolated pinned candidate installation complete; root manifests/lock untouched.');
