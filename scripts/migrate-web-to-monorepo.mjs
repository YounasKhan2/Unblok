#!/usr/bin/env node
// BE-01A: run from Unblok repository root. Dry-run by default.
// Run node scripts/migrate-web-to-monorepo.mjs --apply on a clean worktree.
// This does NOT establish frontend parity; run the existing test/visual gates.
import { existsSync, mkdirSync, renameSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
const root=process.cwd(), apply=process.argv.includes('--apply');
const paths=['src','public','index.html','vite.config.ts','tsconfig.json','metadata.json','.env.example'];
if(!existsSync(join(root,'src','App.tsx')) || !existsSync(join(root,'package.json'))) throw Error('Run from Unblok frontend root');
if(existsSync(join(root,'apps','web','package.json'))) throw Error('apps/web already migrated');
if(apply && execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim()) throw Error('Git tree must be clean');
const pkg=JSON.parse(readFileSync(join(root,'package.json'),'utf8'));
const moved=paths.filter(p=>existsSync(join(root,p)));
for(const p of moved) console.log((apply?'MOVE ':'PLAN ')+p+' -> apps/web/'+p);
if(!apply){console.log('Dry run. Verify all scripts/validation/screenshot/asset references before applying.');process.exit(0)}
mkdirSync(join(root,'apps','web'),{recursive:true});
for(const p of moved) renameSync(join(root,p),join(root,'apps','web',p));
writeFileSync(join(root,'apps','web','package.json'),JSON.stringify({...pkg,name:'@unblok/web',private:true},null,2)+'\n');
writeFileSync(join(root,'package.json'),JSON.stringify({
 name:'unblok-monorepo',private:true,version:pkg.version||'0.1.0',
 workspaces:['apps/*','packages/*'],
 scripts:{
  'dev:web':'bun run --cwd apps/web dev',
  'build:web':'bun run --cwd apps/web build',
  'test:web':'bun run --cwd apps/web test',
  'lint:web':'bun run --cwd apps/web lint'
 }
},null,2)+'\n');
console.log('Relocation applied, NOT VERIFIED. Keep bun.lock at repo root.');
console.log('Next: bun install; bun run lint:web; bun run test:web; bun run build:web.');
console.log('Repair scripts/validation, screenshot paths, environment and asset references.');
console.log('Compare against frozen frontend visual and behavior baselines before merge.');
