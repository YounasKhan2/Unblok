#!/usr/bin/env node
// BE-01A: run from Unblok repository root. Dry-run by default.
// Run node scripts/migrate-web-to-monorepo.mjs --apply on a clean worktree.
// This does NOT establish frontend parity; run the existing test/visual gates.
import { existsSync, mkdirSync, renameSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const root = process.cwd();
const apply = process.argv.includes('--apply');
const paths = ['src', 'public', 'index.html', 'vite.config.ts', 'tsconfig.json', 'metadata.json', '.env.example'];

if (!existsSync(join(root, 'src', 'App.tsx')) || !existsSync(join(root, 'package.json'))) {
  throw Error('Run from Unblok frontend root');
}
if (existsSync(join(root, 'apps', 'web', 'package.json'))) {
  throw Error('apps/web already migrated');
}

// Allow modifications to this script itself during migration preparation
const gitStatus = execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' })
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line.length > 0 && !line.endsWith('scripts/migrate-web-to-monorepo.mjs'));

if (apply && gitStatus.length > 0) {
  throw Error('Git tree must be clean (excluding scripts/migrate-web-to-monorepo.mjs)');
}

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const moved = paths.filter((p) => existsSync(join(root, p)));

for (const p of moved) {
  console.log((apply ? 'MOVE ' : 'PLAN ') + p + ' -> apps/web/' + p);
}

if (!apply) {
  console.log('Dry run. Verify all scripts/validation/screenshot/asset references before applying.');
  process.exit(0);
}

mkdirSync(join(root, 'apps', 'web'), { recursive: true });

// Move frontend files into apps/web
for (const p of moved) {
  renameSync(join(root, p), join(root, 'apps', 'web', p));
}

// Preserve root-level .env.example and metadata.json copies for root-level tool & template discovery
if (existsSync(join(root, 'apps', 'web', '.env.example'))) {
  copyFileSync(join(root, 'apps', 'web', '.env.example'), join(root, '.env.example'));
}
if (existsSync(join(root, 'apps', 'web', 'metadata.json'))) {
  copyFileSync(join(root, 'apps', 'web', 'metadata.json'), join(root, 'metadata.json'));
}

// Configure apps/web package.json
writeFileSync(
  join(root, 'apps', 'web', 'package.json'),
  JSON.stringify({ ...pkg, name: '@unblok/web', private: true }, null, 2) + '\n'
);

// Configure root package.json with Bun workspaces
writeFileSync(
  join(root, 'package.json'),
  JSON.stringify(
    {
      name: 'unblok-monorepo',
      private: true,
      version: pkg.version || '0.1.0',
      type: 'module',
      workspaces: ['apps/*', 'packages/*'],
      scripts: {
        'dev:web': 'bun --filter @unblok/web dev',
        'build:web': 'bun --filter @unblok/web build',
        'test:web': 'bun --filter @unblok/web test',
        'lint:web': 'bun --filter @unblok/web lint',
        'preview:web': 'bun --filter @unblok/web preview',
        'clean:web': 'bun --filter @unblok/web clean',
      },
    },
    null,
    2
  ) + '\n'
);

// Update root-relative paths in scripts/ to point to relocated frontend
const scriptUpdates = [
  {
    file: join(root, 'scripts', 'benchmark-nexus-density.ts'),
    from: "../src/",
    to: "../apps/web/src/",
  },
  {
    file: join(root, 'scripts', 'build-nexus-dataset.ts'),
    from: "path.resolve(process.cwd(), 'src/data/nexus')",
    to: "path.resolve(process.cwd(), 'apps/web/src/data/nexus')",
  },
  {
    file: join(root, 'scripts', 'run-generator.ts'),
    from: "path.resolve(process.cwd(), 'src/data/nexus')",
    to: "path.resolve(process.cwd(), 'apps/web/src/data/nexus')",
  },
  {
    file: join(root, 'scripts', 'build-nexus.js'),
    from: "path.resolve(process.cwd(), 'src/data/nexus')",
    to: "path.resolve(process.cwd(), 'apps/web/src/data/nexus')",
  },
  {
    file: join(root, 'scripts', 'generate-nexus-data.ts'),
    from: "path.resolve(__dirname, '../src/data/nexus')",
    to: "path.resolve(__dirname, '../apps/web/src/data/nexus')",
  },
  {
    file: join(root, 'scripts', 'generate_nexus_dataset.py'),
    from: "../src/data/nexus",
    to: "../apps/web/src/data/nexus",
  },
  {
    file: join(root, 'scripts', 'generate_full_nexus.py'),
    from: "../src/data/nexus",
    to: "../apps/web/src/data/nexus",
  },
  {
    file: join(root, 'scripts', 'generate_all.py'),
    from: "../src/data/nexus",
    to: "../apps/web/src/data/nexus",
  },
  {
    file: join(root, 'scripts', 'build_nexus_fixtures.py'),
    from: "../src/data/nexus",
    to: "../apps/web/src/data/nexus",
  },
  {
    file: join(root, 'scripts', 'capture-marketing-screenshots.js'),
    from: "path.join(process.cwd(), 'public', 'marketing')",
    to: "path.join(process.cwd(), 'apps', 'web', 'public', 'marketing')",
  },
  {
    file: join(root, 'scripts', 'capture-proof-library.js'),
    from: "path.join(process.cwd(), 'public', 'marketing')",
    to: "path.join(process.cwd(), 'apps', 'web', 'public', 'marketing')",
  },
];

for (const { file, from, to } of scriptUpdates) {
  if (existsSync(file)) {
    const content = readFileSync(file, 'utf8');
    if (content.includes(from)) {
      writeFileSync(file, content.replaceAll(from, to), 'utf8');
      console.log(`UPDATED path in ${file}`);
    }
  }
}

console.log('Relocation applied, NOT VERIFIED. Keep bun.lock at repo root.');
console.log('Next: bun install; bun run lint:web; bun run test:web; bun run build:web.');
console.log('Repair scripts/validation, screenshot paths, environment and asset references.');
console.log('Compare against frozen frontend visual and behavior baselines before merge.');
