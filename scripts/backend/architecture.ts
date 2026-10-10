import { existsSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import { builtinModules } from 'node:module';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import ts from 'typescript';

export interface Finding { rule: string; file: string; line: number; message: string }
interface Manifest { name: string; exports?: string; dependencies?: Record<string, string>; devDependencies?: Record<string, string>; optionalDependencies?: Record<string, string> }
interface Edge { target: string; specifier: string; names: string[]; typeOnly: boolean; line: number }
const owners = ['apps/web', 'apps/api', 'apps/worker', 'packages/contracts', 'packages/backend-runtime', 'packages/database'] as const;
const allowed: Record<string, readonly string[]> = {
  'apps/web': ['packages/contracts'],
  'apps/api': ['packages/contracts', 'packages/backend-runtime', 'packages/database'],
  'apps/worker': ['packages/contracts', 'packages/backend-runtime', 'packages/database'],
  'packages/contracts': [], 'packages/backend-runtime': ['packages/contracts'], 'packages/database': [],
};
const foundationFiles: Record<string, readonly string[]> = {
  'apps/api': ['access.ts', 'app.ts', 'errors.ts', 'health.ts', 'main.ts', 'security.ts', 'validation.ts'],
  'apps/worker': ['main.ts', 'worker.ts'],
};
const databaseNames = new Set(['Tenancy', 'TenantAccessError', 'TenantConflictError', 'AuthUnavailableError', 'SessionEvidence', 'SessionVerifier', 'denyAll', 'VerifiedIdentity', 'VerifiedPrincipal', 'IdentityVerifier', 'AuthorizationPolicy', 'WorkspaceContext', 'ResourceScope', 'TenantAction', 'TenantQueries', 'IssueProjection']);
const code = /\.[cm]?[jt]sx?$/;
const testFile = (file: string) => /(?:^|\/)(?:test|tests|__tests__|fixtures)\/|\.(?:test|spec)\.[cm]?[jt]sx?$/.test(file);
const ownerOf = (file: string) => owners.find(owner => file.startsWith(owner + '/'));
const featureOf = (file: string) => /^(apps\/(?:api|worker)\/src\/(?:modules|jobs)\/[^/]+)\/(.*)$/.exec(file);
const slash = (file: string) => file.replaceAll('\\', '/');
const packageName = (specifier: string) => specifier.startsWith('@') ? specifier.split('/').slice(0, 2).join('/') : specifier.split('/')[0]!;

// Read-only repository analysis. No application, credentials, migrations or jobs load.
export function auditArchitecture(directory: string) {
  const root = resolve(directory), findings: Finding[] = [], exceptions: string[] = [];
  const files: string[] = [], manifests = new Map<string, Manifest>();
  const note = (rule: string, file: string, line: number, message: string) => findings.push({ rule, file, line, message });
  function collect(folder: string) {
    if (!existsSync(folder)) return;
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      if (['node_modules', 'dist', '.git', 'public', 'coverage'].includes(entry.name) || entry.isSymbolicLink()) continue;
      const path = resolve(folder, entry.name);
      if (entry.isDirectory()) collect(path); else if (code.test(path) && !path.endsWith('.d.ts')) files.push(path);
    }
  }
  for (const parent of ['apps', 'packages']) {
    const folder = resolve(root, parent); if (!existsSync(folder)) continue;
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
      const owner = `${parent}/${entry.name}`, manifest = resolve(root, owner, 'package.json');
      if (!existsSync(manifest)) { note('owner', owner, 1, 'Workspace requires an explicit package responsibility/manifest'); continue; }
      const value = JSON.parse(readFileSync(manifest, 'utf8')) as Manifest;
      manifests.set(owner, value); collect(resolve(root, owner));
      if (!owners.includes(owner as typeof owners[number])) note('owner', owner, 1, 'New workspace requires reviewed responsibility and dependency rules');
    }
  }
  collect(resolve(root, 'scripts/backend'));
  const workspaceNames = new Map([...manifests].map(([owner, manifest]) => [manifest.name, owner]));
  const config = (file: string) => {
    const path = resolve(root, file.startsWith('apps/web/') ? 'apps/web/tsconfig.json' : 'tsconfig.backend.json');
    if (!existsSync(path)) throw new Error(`Missing architecture resolution config: ${slash(relative(root, path))}`);
    const parsed = ts.readConfigFile(path, ts.sys.readFile);
    if (parsed.error) throw new Error('Invalid TypeScript resolution configuration');
    return ts.parseJsonConfigFileContent(parsed.config, ts.sys, dirname(path)).options;
  };
  const configs = new Map<string, ts.CompilerOptions>();
  const canonical = (path: string) => slash(relative(root, realpathSync(path)));
  // Resolve source symbols as well as spelling: namespace/member aliases and
  // named re-export chains must not launder privileged foundation capabilities.
  const options = config('scripts/backend/check-architecture.ts'), webOptions = config('apps/web/src/index.ts');
  const resolutionCache = ts.createModuleResolutionCache(root, path => path, options);
  const host = ts.createCompilerHost(options);
  host.resolveModuleNames = (names, containingFile) => names.map(name => {
    const workspace = workspaceNames.get(name), entry = workspace ? manifests.get(workspace)?.exports : undefined;
    if (workspace && typeof entry === 'string') {
      const path = resolve(root, workspace, entry);
      if (existsSync(path)) return { resolvedFileName: path, extension: ts.Extension.Ts };
    }
    const result = ts.resolveModuleName(name, containingFile, slash(relative(root, containingFile)).startsWith('apps/web/') ? webOptions : options, ts.sys, resolutionCache).resolvedModule;
    // Dependency internals are outside the repository graph. Nest declarations
    // remain available for decorator provenance; ORM/SDK/type libraries aren't
    // needed to establish source symbol ownership and would dominate this audit.
    if (result?.isExternalLibraryImport && !name.startsWith('@nestjs/')) return undefined;
    return result;
  });
  const provenanceFiles = files.filter(path => {
    const file = slash(relative(root, path));
    return !file.startsWith('apps/web/') && !file.startsWith('scripts/') && !testFile(file);
  });
  const program = ts.createProgram(provenanceFiles, { ...options, noLib: true, types: [] }, host), checker = program.getTypeChecker();
  function origin(node: ts.Node, seen = new Set<ts.Symbol>()): ts.Symbol | undefined {
    if (program.getSourceFile(node.getSourceFile().fileName) !== node.getSourceFile()) return undefined;
    let symbol = checker.getSymbolAtLocation(node);
    if (!symbol && ts.isParenthesizedExpression(node)) return origin(node.expression, seen);
    if (!symbol || seen.has(symbol)) return undefined;
    seen.add(symbol);
    if (symbol.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol);
    const declaration = symbol.valueDeclaration;
    if (declaration && ts.isVariableDeclaration(declaration) && declaration.initializer) return origin(declaration.initializer, seen) ?? symbol;
    if (declaration && ts.isBindingElement(declaration) && ts.isObjectBindingPattern(declaration.parent)) {
      const variable = declaration.parent.parent;
      if (ts.isVariableDeclaration(variable) && variable.initializer) {
        const type = checker.getTypeAtLocation(variable.initializer);
        const member = checker.getPropertyOfType(type, (declaration.propertyName ?? declaration.name).getText());
        if (member) return member.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(member) : member;
      }
    }
    return symbol;
  }
  function capability(node: ts.Node) {
    const symbol = origin(node);
    const declaration = symbol?.declarations?.[0];
    const file = declaration ? slash(relative(root, declaration.getSourceFile().fileName)) : '';
    if (file === 'apps/api/src/access.ts') {
      if (symbol?.name === 'PublicHealth') return 'PublicHealth';
      if (declaration && ts.isVariableDeclaration(declaration) && declaration.initializer && ts.isStringLiteralLike(declaration.initializer) && declaration.initializer.text === 'foundation:public-health') return 'HEALTH_PUBLIC';
    }
    if (file === 'packages/database/src/index.ts' && symbol?.name === 'Database') return 'Database';
    if (file === 'packages/database/src/auth-fences.ts' && symbol?.name === 'AuthFences') return 'AuthFences';
    if (file === 'packages/database/src/credentials.ts' && symbol?.name === 'AccountCredentials') return 'AccountCredentials';
    return undefined;
  }
  const graph = new Map<string, Edge[]>();
  for (const [owner, manifest] of manifests) {
    for (const dependency of Object.keys({ ...manifest.dependencies, ...manifest.devDependencies, ...manifest.optionalDependencies })) {
      const target = workspaceNames.get(dependency);
      if (target && target !== owner && !allowed[owner]?.includes(target)) note('manifest-direction', `${owner}/package.json`, 1, `${owner} must not depend on ${target}`);
    }
    if (owner === 'packages/contracts') for (const dependency of Object.keys({ ...manifest.dependencies, ...manifest.optionalDependencies })) {
      if (dependency !== 'zod') note('transport-safe', `${owner}/package.json`, 1, `Unreviewed transport dependency: ${dependency}`);
    }
  }
  for (const absolute of files.sort()) {
    const file = slash(relative(root, absolute)), owner = ownerOf(file), production = !!owner && !testFile(file);
    const source = program.getSourceFile(absolute) ?? ts.createSourceFile(absolute, readFileSync(absolute, 'utf8'), ts.ScriptTarget.Latest, true);
    graph.set(file, []);
    const feature = featureOf(file), layer = feature?.[2]?.split('/')[0];
    if (production && foundationFiles[owner!] && !foundationFiles[owner!]!.includes(file.slice(`${owner}/src/`.length)) && file.startsWith(owner + '/src/')) {
      const container = owner === 'apps/api' ? 'modules' : 'jobs';
      if (!feature || !file.startsWith(`${owner}/src/${container}/`) || !['index.ts', 'transport', 'application', 'domain', 'persistence', 'infrastructure'].includes(layer ?? '') && !feature[2]!.endsWith('.module.ts')) {
        note('feature-layout', file, 1, 'New backend implementation belongs to modules/<feature> (API) or jobs/<feature> (worker) and a documented layer');
      }
    }
    if (production && owner === 'packages/backend-runtime' && file.startsWith(owner + '/src/') && !/^(?:index\.ts|(?:config|logging|queue|lifecycle)(?:\.ts|\/))$/.test(file.slice(`${owner}/src/`.length))) {
      // Subfolders are allowed only inside these established infrastructure responsibilities.
      if (!/^(?:config|logging|queue|lifecycle)\//.test(file.slice(`${owner}/src/`.length))) note('shared-responsibility', file, 1, 'Business modules do not belong in backend-runtime');
    }
    const localNames = new Map<string, string>();
    function record(specifier: string, node: ts.Node, names: string[] = [], typeOnly = false) {
      const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
      if (isAbsolute(specifier) || /^(?:https?|file):/.test(specifier)) note('external-load', file, line, 'Absolute/URL module paths bypass repository package boundaries');
      const workspace = workspaceNames.get(packageName(specifier));
      if (workspace && specifier !== manifests.get(workspace)?.name) note('package-entry', file, line, 'Workspace packages expose only their declared public root entry');
      const configKey = file.startsWith('apps/web/') ? 'web' : 'backend';
      if (!configs.has(configKey)) configs.set(configKey, config(file));
      const options = configs.get(configKey)!;
      let target: string | undefined;
      // Bun workspace exports are authoritative even before node_modules installation.
      if (workspace && specifier === manifests.get(workspace)?.name) {
        const entry = manifests.get(workspace)?.exports;
        if (typeof entry !== 'string') note('package-entry', file, line, 'Workspace import has no approved string root export');
        else { const path = resolve(root, workspace, entry); if (existsSync(path)) target = canonical(path); }
      } else {
        const result = ts.resolveModuleName(specifier, absolute, options, ts.sys).resolvedModule;
        if (result && existsSync(result.resolvedFileName)) { const path = canonical(result.resolvedFileName); if (!path.startsWith('../') && !path.includes('node_modules/')) target = path; }
      }
      const destination = target ? ownerOf(target) : workspace;
      if (destination && owner && destination !== owner && !allowed[owner]?.includes(destination)) note('package-direction', file, line, `${owner} must not import ${destination}`);
      if (target && owner && destination !== owner && !workspace) note('package-entry', file, line, 'Cross-workspace relative/alias import bypasses the public package entry');
      if (!target && (specifier.startsWith('.') || specifier.startsWith('@/') || workspace) && !/\.(?:css|scss|svg|png|jpe?g|webp|json)(?:\?.*)?$/.test(specifier)) note('resolution', file, line, `Unresolved internal dependency: ${specifier}`);
      const builtin = builtinModules.includes(specifier.replace(/^node:/, '')) || /^(?:node:|bun(?:$|:))/.test(specifier);
      if (production && (owner === 'packages/contracts' || file.startsWith('apps/web/src/')) && (builtin || /^(?:@nestjs\/|@prisma\/|prisma$|bullmq$|ioredis$|pino$)/.test(specifier))) note('transport-safe', file, line, 'Browser/contracts cannot import server infrastructure, including types');
      if (production && owner === 'packages/contracts' && !target && !builtin && packageName(specifier) !== 'zod') note('transport-safe', file, line, 'Contracts depend only on themselves and approved neutral Zod schemas');
      if (production && /^(?:@prisma\/|\.prisma\/)/.test(specifier) && owner !== 'packages/database') note('raw-persistence', file, line, 'Prisma stays inside packages/database');
      if (production && destination === 'packages/database' && owner !== destination && file !== 'apps/api/src/main.ts') {
        if (!names.length || names.some(name => !databaseNames.has(name))) note('raw-persistence', file, line, 'Use named scoped Tenancy exports; raw Database/namespace/dynamic imports are infrastructure-only');
        if (layer === 'transport') note('controller-persistence', file, line, 'Controllers use application services, not persistence');
      }
      if (target && production && testFile(target)) note('test-leak', file, line, 'Production cannot load tests or fixtures');
      if (target && production && /apps\/(?:api|worker)\/src\/main\.ts$/.test(target)) note('bootstrap-import', file, line, 'Process entrypoints must not become reusable service libraries');
      const other = target ? featureOf(target) : null;
      if (production && feature && other && feature[1] !== other[1] && target !== other[1] + '/index.ts') note('feature-private', file, line, 'Cross-feature imports must use the explicitly named public facade');
      if (production && feature && other && feature[1] === other[1]) {
        const toLayer = other[2]?.split('/')[0];
        if (layer === 'domain' && toLayer !== 'domain') note('domain-purity', file, line, 'Domain rules depend only on their own domain');
        if (layer === 'application' && toLayer === 'transport') note('layer-direction', file, line, 'Application must not depend on transport');
        if (layer === 'persistence' && ['transport', 'application'].includes(toLayer ?? '')) note('layer-direction', file, line, 'Persistence must not depend on transport/application');
        if (layer === 'transport' && ['persistence', 'infrastructure'].includes(toLayer ?? '')) note('controller-persistence', file, line, 'Controllers delegate to application services');
      }
      if (production && feature && layer === 'domain' && (!other || feature[1] !== other[1])) note('domain-purity', file, line, 'Domain rules have no framework, transport, external-feature or infrastructure dependency');
      if (production && target && graph.has(file)) graph.get(file)!.push({ target, specifier, names, typeOnly, line });
    }
    function visit(node: ts.Node) {
      if (production && (ts.isIdentifier(node) || ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node))) {
        const privileged = capability(node);
        const line = source.getLineAndCharacterOfPosition(node.getStart()).line + 1;
        if ((privileged === 'HEALTH_PUBLIC' || privileged === 'PublicHealth') && file !== 'apps/api/src/access.ts' && file !== 'apps/api/src/health.ts') note('health-public', file, line, 'Public health capability/metadata cannot be imported, aliased or re-exported into business code');
        if ((privileged === 'Database' || privileged === 'AuthFences' || privileged === 'AccountCredentials') && owner !== 'packages/database' && file !== 'apps/api/src/main.ts') note('raw-persistence', file, line, 'Indirect privileged persistence capability remains infrastructure-only');
      }
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        const clause = node.importClause, bindings = clause?.namedBindings;
        const named = bindings && ts.isNamedImports(bindings) ? bindings.elements : [];
        for (const name of named) localNames.set(name.name.text, (name.propertyName ?? name.name).text);
        record(node.moduleSpecifier.text, node, named.map(n => (n.propertyName ?? n.name).text), !!clause?.isTypeOnly || !clause?.name && named.length > 0 && named.every(n => n.isTypeOnly));
      } else if (ts.isExportDeclaration(node)) {
        if (production && feature?.[2] === 'index.ts' && !node.exportClause) note('feature-facade', file, source.getLineAndCharacterOfPosition(node.getStart()).line + 1, 'Feature facades require explicit named exports');
        if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
          const names = node.exportClause && ts.isNamedExports(node.exportClause) ? node.exportClause.elements : [];
          record(node.moduleSpecifier.text, node, names.map(n => (n.propertyName ?? n.name).text), node.isTypeOnly || names.length > 0 && names.every(n => n.isTypeOnly));
        }
      } else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) && ts.isStringLiteral(node.argument.literal)) record(node.argument.literal.text, node, [], true);
      else if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference) && node.moduleReference.expression && ts.isStringLiteral(node.moduleReference.expression)) record(node.moduleReference.expression.text, node, [], node.isTypeOnly);
      else if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || ts.isIdentifier(node.expression) && node.expression.text === 'require')) {
        const argument = node.arguments[0];
        if (argument && ts.isStringLiteralLike(argument)) record(argument.text, node);
        else note('computed-load', file, source.getLineAndCharacterOfPosition(node.getStart()).line + 1, 'Computed module loading cannot be statically authorized');
      }
      if (production && owner !== 'packages/database' && (ts.isPropertyAccessExpression(node) && /^\$(?:queryRaw|executeRaw|transaction)/.test(node.name.text) || ts.isElementAccessExpression(node) && node.argumentExpression && ts.isStringLiteralLike(node.argumentExpression) && /^\$(?:queryRaw|executeRaw|transaction)/.test(node.argumentExpression.text))) note('raw-persistence', file, source.getLineAndCharacterOfPosition(node.getStart()).line + 1, 'Raw SQL/transactions stay inside the database infrastructure');
      if (production && ts.isDecorator(node)) {
        const call = node.expression, expression = ts.isCallExpression(call) ? call.expression : call;
        const resolved = origin(expression)?.name;
        const name = capability(expression) ?? (resolved && resolved !== 'unknown' ? resolved : ts.isIdentifier(expression) ? localNames.get(expression.text) ?? expression.text : ts.isPropertyAccessExpression(expression) ? expression.name.text : '');
        if (name === 'Controller' && feature && layer !== 'transport') note('controller-layer', file, source.getLineAndCharacterOfPosition(node.getStart()).line + 1, 'HTTP controllers belong to API feature transport, never application/domain/job layers');
        if (name === 'Controller' && owner === 'apps/worker') note('controller-layer', file, source.getLineAndCharacterOfPosition(node.getStart()).line + 1, 'Worker is an independent job process, not an HTTP application');
        if (name === 'PublicHealth') {
          const method = ts.isMethodDeclaration(node.parent) ? node.parent : null;
          const decorators = method ? ts.getDecorators(method) ?? [] : [];
          const healthRoute = decorators.some(d => ts.isCallExpression(d.expression) && (origin(d.expression.expression)?.name === 'Get' || ts.isIdentifier(d.expression.expression) && (localNames.get(d.expression.expression.text) ?? d.expression.expression.text) === 'Get') && d.expression.arguments.length === 1 && ts.isStringLiteral(d.expression.arguments[0]!) && ['live', 'ready'].includes((d.expression.arguments[0] as ts.StringLiteral).text));
          if (file !== 'apps/api/src/health.ts' || !healthRoute) note('health-public', file, source.getLineAndCharacterOfPosition(node.getStart()).line + 1, 'PublicHealth is reserved for the existing live/ready foundation methods');
        }
      }
      if (production && ts.isStringLiteralLike(node) && node.text === 'foundation:public-health' && file !== 'apps/api/src/access.ts') note('health-public', file, source.getLineAndCharacterOfPosition(node.getStart()).line + 1, 'Public health metadata must not be fabricated outside the access foundation');
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  // Include type edges: new type-only feature cycles are still architectural coupling.
  // Preserve one implemented BE-00C type-only backlink, never a value import.
  const state = new Map<string, number>(), stack: string[] = [];
  function walk(file: string) {
    state.set(file, 1); stack.push(file);
    for (const edge of graph.get(file) ?? []) {
      if (testFile(edge.target) || !graph.has(edge.target) || edge.target.startsWith('apps/web/')) continue;
      if (file === 'packages/database/src/tenancy.ts' && edge.target === 'packages/database/src/index.ts' && edge.typeOnly) { exceptions.push('BE-00C type-only Database backlink: tenancy.ts → index.ts (no runtime cycle)'); continue; }
      if (state.get(edge.target) === 1) note('cycle', file, edge.line, [...stack.slice(stack.indexOf(edge.target)), edge.target].join(' → '));
      else if (!state.has(edge.target)) walk(edge.target);
    }
    stack.pop(); state.set(file, 2);
  }
  for (const file of graph.keys()) if (!testFile(file) && !file.startsWith('apps/web/') && !file.startsWith('scripts/') && !state.has(file)) walk(file);
  return { findings, exceptions, files: files.length, edges: [...graph.values()].reduce((sum, edges) => sum + edges.length, 0) };
}
