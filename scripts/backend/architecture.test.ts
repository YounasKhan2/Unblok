import { afterEach, describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { auditArchitecture } from './architecture';

// Source-only mutation fixtures; never import/execute a fake feature or route.
const roots = new Set<string>();
afterEach(() => {
  for (const root of roots) {
    if (!root.startsWith(resolve(tmpdir(), 'unblok-architecture-'))) throw new Error('Invalid fixture cleanup target');
    rmSync(root, { recursive: true, force: true });
  }
  roots.clear();
});
function fixture() {
  const root = mkdtempSync(resolve(tmpdir(), 'unblok-architecture-')); roots.add(root);
  const put = (file: string, text: string) => { const path = resolve(root, file); mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, text); };
  for (const [folder, name] of Object.entries({ 'apps/web': 'web', 'apps/api': 'api', 'apps/worker': 'worker', 'packages/contracts': 'contracts', 'packages/database': 'database', 'packages/backend-runtime': 'backend-runtime' })) {
    put(`${folder}/package.json`, JSON.stringify({ name: `@unblok/${name}`, ...(folder.startsWith('packages/') ? { exports: './src/index.ts' } : {}), dependencies: name === 'contracts' ? { zod: '4' } : {} }));
  }
  put('tsconfig.backend.json', JSON.stringify({ compilerOptions: { module: 'ESNext', moduleResolution: 'bundler', baseUrl: '.', paths: { '@runtime/*': ['packages/backend-runtime/src/*'] } } }));
  put('apps/web/tsconfig.json', JSON.stringify({ compilerOptions: { module: 'ESNext', moduleResolution: 'bundler', baseUrl: '.', paths: { '@private/*': ['../../packages/database/src/*'] } } }));
  put('packages/contracts/src/index.ts', 'export interface Health { status: string }');
  put('packages/backend-runtime/src/index.ts', 'export { log } from "./logging";');
  put('packages/backend-runtime/src/logging.ts', 'export const log = () => {};');
  put('packages/database/src/index.ts', 'export class Database {} export class Tenancy {} export interface TenantQueries {}');
  put('apps/api/src/access.ts', 'export const PublicHealth = () => () => {};');
  return { root, put, rules: () => auditArchitecture(root).findings.map(f => f.rule) };
}

test('repository follows BE-00D boundaries; BE-00C type-only backlink is explicit', () => {
  const result = auditArchitecture(resolve(import.meta.dir, '../..'));
  expect(result.findings).toEqual([]); expect(result.files).toBeGreaterThan(300);
  expect(result.exceptions).toEqual(['BE-00C type-only Database backlink: tenancy.ts → index.ts (no runtime cycle)']);
});

describe('package and browser boundaries reject real import mutations', () => {
  for (const [label, source] of [
    ['bare database', 'import { Database } from "@unblok/database";'],
    ['relative database', 'export { Database } from "../../../packages/database/src/index";'],
    ['configured alias', 'import type { Database } from "@private/index";'],
    ['dynamic runtime', 'void import("@unblok/backend-runtime");'],
    ['CommonJS runtime', 'const runtime = require("@unblok/backend-runtime");'],
  ]) test(`web cannot load ${label}`, () => {
    const f = fixture(); f.put('apps/web/src/illegal.ts', source!);
    expect(f.rules()).toContain('package-direction');
  });
  test('manifest dev dependency cannot conceal a forbidden workspace', () => {
    const f = fixture(); f.put('apps/web/package.json', JSON.stringify({ name: '@unblok/web', devDependencies: { '@unblok/database': 'workspace:*' } }));
    expect(f.rules()).toContain('manifest-direction');
  });
  for (const source of ['import type { Prisma } from "@prisma/client";', 'export { Injectable } from "@nestjs/common";', 'import { readFile } from "node:fs";']) test(`contracts remain transport-safe: ${source}`, () => {
    const f = fixture(); f.put('packages/contracts/src/illegal.ts', source);
    expect(f.rules()).toContain('transport-safe');
  });
  test('runtime cannot acquire unrelated business ownership', () => {
    const f = fixture(); f.put('packages/backend-runtime/src/issues.ts', 'export const issue = true;');
    expect(f.rules()).toContain('shared-responsibility');
  });
  test('deep workspace import is forbidden even if it cannot resolve', () => {
    const f = fixture(); f.put('apps/api/src/modules/issues/application/read.ts', 'import { Tenancy } from "@unblok/database/src/tenancy";');
    expect(f.rules()).toContain('package-entry');
  });
});

describe('application, controller and worker persistence boundaries', () => {
  for (const source of ['import { AccountCredentials } from "@unblok/database";', 'import { Tenancy } from "@unblok/database"; const grants = new Tenancy();']) test(`password persistence remains privileged: ${source}`, () => {
    const f = fixture();
    f.put('packages/database/src/credentials.ts', 'export class AccountCredentials {}');
    f.put('packages/database/src/index.ts', 'export { AccountCredentials as Tenancy, AccountCredentials } from "./credentials";');
    f.put('apps/api/src/modules/issues/application/read.ts', source);
    expect(f.rules()).toContain('raw-persistence');
  });
  test('auth lifecycle capability is privileged and cannot be disguised as Tenancy', () => {
    const f = fixture();
    f.put('packages/database/src/auth-fences.ts', 'export class AuthFences {}');
    f.put('packages/database/src/index.ts', 'export { AuthFences as Tenancy } from "./auth-fences";');
    f.put('apps/api/src/modules/issues/application/read.ts', 'import { Tenancy } from "@unblok/database"; const grant = new Tenancy();');
    expect(f.rules()).toContain('raw-persistence');
  });
  test('business handlers cannot import auth lifecycle capability directly', () => {
    const f = fixture();
    f.put('packages/database/src/auth-fences.ts', 'export class AuthFences {}');
    f.put('packages/database/src/index.ts', 'export { AuthFences } from "./auth-fences";');
    f.put('apps/api/src/modules/issues/application/read.ts', 'import { AuthFences as Grants } from "@unblok/database";');
    expect(f.rules()).toContain('raw-persistence');
  });
  for (const source of ['import { Database as Store } from "@unblok/database";', 'import * as db from "@unblok/database";', 'const db = require("@unblok/database");', 'import type { PrismaClient } from "@prisma/client";']) test(`business service rejects raw capability: ${source}`, () => {
    const f = fixture(); f.put('apps/api/src/modules/issues/application/read.ts', source);
    expect(f.rules()).toContain('raw-persistence');
  });
  test('raw SQL cannot be concealed behind a property receiver', () => {
    const f = fixture(); f.put('apps/api/src/modules/issues/application/read.ts', 'store["$executeRawUnsafe"]("sql");');
    expect(f.rules()).toContain('raw-persistence');
  });
  test('controller cannot directly consume even scoped persistence', () => {
    const f = fixture(); f.put('apps/api/src/modules/issues/transport/issues.controller.ts', 'import { Tenancy } from "@unblok/database";');
    expect(f.rules()).toContain('controller-persistence');
  });
  test('a controller cannot hide in application or worker organization', () => {
    const f = fixture(); f.put('apps/api/src/modules/issues/application/read.ts', 'import { Controller as Http } from "@nestjs/common"; @Http() class Issues {}');
    f.put('apps/worker/src/jobs/issues/transport/controller.ts', '@Controller() class Jobs {}');
    expect(f.rules().filter(rule => rule === 'controller-layer')).toHaveLength(2);
  });
  test('absolute module path cannot bypass ownership', () => {
    const f = fixture(); f.put('apps/api/src/modules/issues/application/read.ts', 'import { PrismaClient } from "D:/private/client.ts";');
    expect(f.rules()).toContain('external-load');
  });
  test('worker cannot bypass scoped persistence with Database', () => {
    const f = fixture(); f.put('apps/worker/src/jobs/issues/application/run.ts', 'import { Database } from "@unblok/database";');
    expect(f.rules()).toContain('raw-persistence');
  });
  test('worker cannot reuse API private implementation', () => {
    const f = fixture(); f.put('apps/api/src/modules/issues/application/read.ts', 'export const read = true;');
    f.put('apps/worker/src/jobs/issues/application/run.ts', 'import { read } from "../../../../../api/src/modules/issues/application/read";');
    expect(f.rules()).toContain('package-direction');
  });
  test('existing bootstrap/raw database infrastructure and named application scope are legal', () => {
    const f = fixture(); f.put('apps/api/src/main.ts', 'import { Database } from "@unblok/database";');
    f.put('packages/database/src/tenancy.ts', 'store.$queryRaw`SELECT 1`;');
    f.put('apps/api/src/modules/issues/application/read.ts', 'import { Tenancy, type TenantQueries } from "@unblok/database";');
    f.put('apps/worker/src/jobs/issues/application/run.ts', 'import type { TenantQueries } from "@unblok/database";');
    expect(f.rules()).toEqual([]);
  });
});

describe('feature privacy, layer direction and cycles', () => {
  test('private cross-feature type imports fail; explicit public facade passes', () => {
    const f = fixture(); f.put('apps/api/src/modules/projects/domain/project.ts', 'export interface Project { id: string }');
    f.put('apps/api/src/modules/projects/index.ts', 'export type { Project } from "./domain/project";');
    f.put('apps/api/src/modules/issues/application/read.ts', 'import type { Project } from "../../projects/domain/project";');
    expect(f.rules()).toContain('feature-private');
    f.put('apps/api/src/modules/issues/application/read.ts', 'import type { Project } from "../../projects/index";');
    expect(f.rules()).toEqual([]);
  });
  test('wildcard feature facade fails', () => {
    const f = fixture(); f.put('apps/api/src/modules/issues/domain/issue.ts', 'export interface Issue {}');
    f.put('apps/api/src/modules/issues/index.ts', 'export * from "./domain/issue";');
    expect(f.rules()).toContain('feature-facade');
  });
  test('domain rule cannot couple to framework or transport', () => {
    const f = fixture(); f.put('apps/api/src/modules/issues/domain/rule.ts', 'import { Injectable } from "@nestjs/common";');
    expect(f.rules()).toContain('domain-purity');
  });
  test('application does not depend on controller', () => {
    const f = fixture(); f.put('apps/api/src/modules/issues/transport/controller.ts', 'export const controller = true;');
    f.put('apps/api/src/modules/issues/application/read.ts', 'import { controller } from "../transport/controller";');
    expect(f.rules()).toContain('layer-direction');
  });
  test('type-only cross-feature cycle fails', () => {
    const f = fixture(); f.put('apps/api/src/modules/issues/index.ts', 'export type { Project } from "../projects/index";');
    f.put('apps/api/src/modules/projects/index.ts', 'export type { Issue } from "../issues/index";');
    expect(f.rules()).toContain('cycle');
  });
  test('BE-00C backlink exception never accepts a value cycle', () => {
    const f = fixture(); f.put('packages/database/src/index.ts', 'export { Tenancy } from "./tenancy";');
    f.put('packages/database/src/tenancy.ts', 'import { Database } from "./index"; export class Tenancy {}');
    expect(f.rules()).toContain('cycle');
    f.put('packages/database/src/tenancy.ts', 'import type { Database } from "./index"; export class Tenancy {}');
    expect(f.rules()).toEqual([]);
  });
  test('new loose backend service is rejected rather than creating a second organization', () => {
    const f = fixture(); f.put('apps/api/src/issues.service.ts', 'export const issues = true;');
    expect(f.rules()).toContain('feature-layout');
  });
  test('API modules and worker jobs use their own feature containers', () => {
    const f = fixture();
    f.put('apps/api/src/jobs/issues/application/read.ts', 'export const read = true;');
    f.put('apps/worker/src/modules/issues/application/run.ts', 'export const run = true;');
    expect(f.rules().filter(rule => rule === 'feature-layout')).toHaveLength(2);
  });
});

describe('deny-default foundation cannot become a public business fixture', () => {
  for (const expression of ['N.Controller', 'C']) test(`namespace/local Nest decorator ${expression} cannot hide in application`, () => {
    const f = fixture();
    f.put('node_modules/@nestjs/common/index.d.ts', 'export declare function Controller(): ClassDecorator;');
    f.put('node_modules/@nestjs/common/package.json', '{"name":"@nestjs/common","types":"index.d.ts"}');
    f.put('apps/api/src/modules/issues/application/read.ts', `import * as N from "@nestjs/common"; const C = N.Controller; @${expression}() class Issues {}`);
    expect(f.rules()).toContain('controller-layer');
  });
  test('named re-exported Nest decorator cannot hide its origin', () => {
    const f = fixture();
    f.put('node_modules/@nestjs/common/index.d.ts', 'export declare function Controller(): ClassDecorator;');
    f.put('node_modules/@nestjs/common/package.json', '{"name":"@nestjs/common","types":"index.d.ts"}');
    f.put('apps/api/src/modules/issues/application/decorators.ts', 'export { Controller as Route } from "@nestjs/common";');
    f.put('apps/api/src/modules/issues/application/read.ts', 'import { Route as R } from "./decorators"; @R() class Issues {}');
    expect(f.rules()).toContain('controller-layer');
  });
  for (const expression of ['A.PublicHealth', 'Open']) test(`namespace/local public health capability ${expression} is rejected`, () => {
    const f = fixture();
    f.put('apps/api/src/modules/issues/transport/controller.ts', `import * as A from "../../../access"; const Open = A.PublicHealth; class Issues { @${expression}() list() {} }`);
    expect(f.rules()).toContain('health-public');
  });
  test('renamed public health re-export and imported metadata cannot launder access', () => {
    const f = fixture();
    f.put('apps/api/src/access.ts', 'export const HEALTH_PUBLIC = "foundation:public-health"; export const PublicHealth = () => () => {};');
    f.put('apps/api/src/modules/issues/transport/public.ts', 'export { PublicHealth as Open, HEALTH_PUBLIC as KEY } from "../../../access";');
    f.put('apps/api/src/modules/issues/transport/controller.ts', 'import { Open as O, KEY } from "./public"; const K = KEY; @O() class Issues {} SetMetadata(K, true);');
    expect(f.rules()).toContain('health-public');
  });
  test('renamed raw Database from exempt composition root remains forbidden', () => {
    const f = fixture();
    f.put('apps/api/src/main.ts', 'export { Database as Tenancy } from "@unblok/database";');
    f.put('apps/api/src/modules/issues/application/read.ts', 'import { Tenancy as Scope } from "../../../main"; const Store = Scope;');
    expect(f.rules()).toContain('raw-persistence');
  });
  test('an allowed scoped export name cannot disguise the raw Database class', () => {
    const f = fixture();
    f.put('packages/database/src/index.ts', 'class Database {} export { Database as Tenancy };');
    f.put('apps/api/src/modules/issues/application/read.ts', 'import { Tenancy } from "@unblok/database"; const raw = new Tenancy();');
    expect(f.rules()).toContain('raw-persistence');
  });
  test('destructured namespace decorator alias remains a transport controller', () => {
    const f = fixture();
    f.put('node_modules/@nestjs/common/index.d.ts', 'export declare function Controller(): ClassDecorator;');
    f.put('node_modules/@nestjs/common/package.json', '{"name":"@nestjs/common","types":"index.d.ts"}');
    f.put('apps/api/src/modules/issues/application/read.ts', 'import * as N from "@nestjs/common"; const { Controller: C } = N; @C() class Issues {}');
    expect(f.rules()).toContain('controller-layer');
  });
  test('aliased PublicHealth cannot grant a business route', () => {
    const f = fixture(); f.put('apps/api/src/modules/issues/transport/issues.controller.ts', 'import { PublicHealth as Open } from "../../../access"; class Issues { @Open() @Get("issues") list() {} }');
    expect(f.rules()).toContain('health-public');
  });
  test('class-wide health decorator and new health route both fail', () => {
    const f = fixture(); f.put('apps/api/src/health.ts', '@PublicHealth() class Health { @PublicHealth() @Get("issues") list() {} }');
    expect(f.rules().filter(rule => rule === 'health-public')).toHaveLength(2);
  });
  test('existing live/ready method decorators are accepted', () => {
    const f = fixture(); f.put('apps/api/src/health.ts', 'class Health { @PublicHealth() @Get("live") live() {} @PublicHealth() @Get("ready") ready() {} }');
    expect(f.rules()).toEqual([]);
  });
  test('raw public metadata is rejected outside the access foundation', () => {
    const f = fixture(); f.put('apps/api/src/modules/issues/transport/issues.controller.ts', 'SetMetadata("foundation:public-health", true);');
    expect(f.rules()).toContain('health-public');
  });
  test('production cannot import test fixtures, process bootstrap or computed loaders', () => {
    const f = fixture(); f.put('apps/api/test/fake.ts', 'export const actor = true;');
    f.put('apps/api/src/main.ts', 'export const main = true;');
    f.put('apps/api/src/modules/issues/application/read.ts', 'import { actor } from "../../../../test/fake"; import { main } from "../../../main"; require(name);');
    const rules = f.rules(); expect(rules).toContain('test-leak'); expect(rules).toContain('bootstrap-import'); expect(rules).toContain('computed-load');
  });
});


test('outbox delivery is private to worker bootstrap; direct and disguised business imports are rejected', () => {
  for (const source of ['import { VerificationDelivery } from "@unblok/database";', 'import { Tenancy } from "@unblok/database"; const delivery = new Tenancy();']) {
    const f = fixture(); f.put('packages/database/src/email-verification.ts', 'export class VerificationDelivery {}');
    f.put('packages/database/src/index.ts', 'export { VerificationDelivery, VerificationDelivery as Tenancy } from "./email-verification";');
    f.put('apps/worker/src/jobs/other/application/send.ts', source); expect(f.rules()).toContain('raw-persistence');
  }
});

test('recovery capabilities cannot escape composition through direct or aliased imports',()=>{
 for(const name of ['PasswordRecovery','RecoveryDelivery']) {const f=fixture();f.put('packages/database/src/password-recovery.ts', 'export class '+name+' {}');f.put('packages/database/src/index.ts','export { '+name+', '+name+' as Tenancy } from "./password-recovery";');f.put('apps/api/src/modules/issues/application/read.ts','import { Tenancy } from "@unblok/database"; const x=new Tenancy();');expect(f.rules()).toContain('raw-persistence');}
});
