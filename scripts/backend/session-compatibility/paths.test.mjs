import { test, expect, afterAll } from 'bun:test';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join, relative } from 'node:path';
import { checkedScratch } from './paths.mjs';
const parent = mkdtempSync(join(tmpdir(), 'unblok-be00f-layout-'));
function checkout(name) {
  const directory = join(parent, name); mkdirSync(directory);
  const result = Bun.spawnSync(['git', 'init', '--quiet', directory], { stdout: 'pipe', stderr: 'pipe' });
  if (result.exitCode) throw new Error('Layout fixture initialization failed');
  return directory;
}
afterAll(() => {
  const absolute = resolve(parent);
  if (!relative(resolve(tmpdir()), absolute).startsWith('unblok-be00f-layout-')) throw new Error('Unsafe layout fixture cleanup');
  rmSync(absolute, { recursive: true });
});
test('normal checkout has deterministic scratch under its own Git directory', () => {
  const directory = checkout('normal');
  expect(checkedScratch(directory)).toBe(join(directory, '.git', 'be-00f'));
  expect(checkedScratch(directory)).toBe(checkedScratch(directory));
});
test('worktree gitfile is rejected before creating scratch or installing', () => {
  const directory = join(parent, 'worktree'); mkdirSync(directory);
  writeFileSync(join(directory, '.git'), 'gitdir: ../normal/.git/worktrees/test\n');
  expect(() => checkedScratch(directory)).toThrow('worktree gitfiles are unsupported');
});
test('non-Git directory is rejected early', () => {
  const directory = join(parent, 'missing'); mkdirSync(directory);
  expect(() => checkedScratch(directory)).toThrow('real .git directory');
});
test('scratch junction cannot redirect installation outside the Git directory', () => {
  const directory = checkout('redirect'), external = join(parent, 'external'); mkdirSync(external);
  symlinkSync(external, join(directory, '.git', 'be-00f'), process.platform === 'win32' ? 'junction' : 'dir');
  expect(() => checkedScratch(directory)).toThrow('ordinary owned');
});
test('candidate directory junction is rejected', () => {
  const directory = checkout('nested'), target = join(parent, 'nested-target'); mkdirSync(target);
  mkdirSync(join(directory, '.git', 'be-00f'));
  symlinkSync(target, join(directory, '.git', 'be-00f', 'candidates'), process.platform === 'win32' ? 'junction' : 'dir');
  expect(() => checkedScratch(directory)).toThrow('ordinary owned');
});
test('existing output with directory type cannot replace a file target', () => {
  const directory = checkout('type'); mkdirSync(join(directory, '.git', 'be-00f', 'results.json'), { recursive: true });
  expect(() => checkedScratch(directory)).toThrow('ordinary owned');
});
