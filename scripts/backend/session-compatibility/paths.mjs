import { existsSync, lstatSync, realpathSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Deliberately support ordinary checkouts only. Fail before installs/containers.
export function checkedScratch(checkout) {
  const root = realpathSync(checkout), gitDirectory = resolve(root, '.git');
  if (!existsSync(gitDirectory) || !lstatSync(gitDirectory).isDirectory() || lstatSync(gitDirectory).isSymbolicLink()) {
    throw new Error('BE-00F requires an ordinary Git checkout with a real .git directory; worktree gitfiles are unsupported');
  }
  const probe = args => {
    const result = Bun.spawnSync(['git', '-C', root, 'rev-parse', ...args], { stdout: 'pipe', stderr: 'pipe' });
    if (result.exitCode !== 0) throw new Error('BE-00F checkout validation failed');
    return realpathSync(result.stdout.toString().trim());
  };
  if (probe(['--show-toplevel']) !== root || probe(['--absolute-git-dir']) !== realpathSync(gitDirectory)) {
    throw new Error('BE-00F requires the checkout root and its own Git directory');
  }
  const scratch = resolve(gitDirectory, 'be-00f');
  // Never follow a pre-existing junction/symlink for any top-level write target.
  const directories = ['', 'candidates', 'candidates/node_modules', 'tls'];
  const files = ['candidates/package.json', 'candidates/bun.lock', 'tls/key.pem', 'tls/cert.pem',
    'results.json', 'results-A.json', 'results-B.json', 'cleanup-diagnostics.json'];
  for (const [entries, directory] of [[directories, true], [files, false]]) {
    for (const entry of entries) {
      const target = resolve(scratch, entry);
      // lstat also sees dangling links; existsSync alone would miss those.
      let stat;
      try { stat = lstatSync(target); } catch (error) { if (error.code === 'ENOENT') continue; throw error; }
      if (stat.isSymbolicLink() || (directory ? !stat.isDirectory() : !stat.isFile())) {
        throw new Error('BE-00F scratch target must be an ordinary owned file or directory');
      }
    }
  }
  return scratch;
}
export const root = realpathSync(resolve(dirname(fileURLToPath(import.meta.url)), '../../..'));
export const scratch = checkedScratch(root);
