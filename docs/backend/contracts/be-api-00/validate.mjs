// Research-only validator for the explicitly used schema subset and design invariants.
// This is not a general JSON Schema/OpenAPI validator or runtime authorization test.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { strict as assert } from 'node:assert';

const folder = dirname(fileURLToPath(import.meta.url));
const registry = JSON.parse(readFileSync(resolve(folder, 'registry.json'), 'utf8'));
const fail = message => { throw new Error(message); };
const check = (condition, message) => { if (!condition) fail(message); };
const deref = (schema, data) => {
  if (!schema.$ref) return schema;
  check(/^#\/schemas\/[^/]+$/.test(schema.$ref), 'Unsupported reference');
  const result = data.schemas[schema.$ref.slice(10)];
  check(result, `Dangling reference: ${schema.$ref}`);
  return result;
};

function inspect(schema, data, seen = new Set()) {
  if (schema.$ref) {
    check(!seen.has(schema.$ref), 'Recursive schema is outside bounded subset');
    inspect(deref(schema, data), data, new Set([...seen, schema.$ref]));
    return;
  }
  if (schema.anyOf) { schema.anyOf.forEach(s => inspect(s, data, seen)); return; }
  check(['object', 'array', 'string', 'integer', 'boolean', 'null'].includes(schema.type), 'Unsupported type');
  if (schema.type === 'object') {
    check(schema.additionalProperties === false, 'Object must reject unknown fields');
    check(Array.isArray(schema.required), 'Required list missing');
    schema.required.forEach(k => check(k in schema.properties, 'Unknown required field'));
    Object.values(schema.properties).forEach(s => inspect(s, data, seen));
  }
  if (schema.type === 'array') {
    check(Number.isInteger(schema.maxItems) && schema.maxItems > 0 && schema.maxItems <= 400, 'Unbounded array');
    check(schema.minItems >= 0 && schema.minItems <= schema.maxItems, 'Invalid array bounds');
    inspect(schema.items, data, seen);
  }
  if (schema.type === 'string') {
    if (!schema.enum) check(Number.isInteger(schema.maxLength) && schema.maxLength <= 8000 && schema.minLength >= 1, 'Unbounded string');
    if (schema.pattern) new RegExp(schema.pattern);
  }
  if (schema.type === 'integer') check(Number.isFinite(schema.minimum) && Number.isFinite(schema.maximum) && schema.minimum <= schema.maximum, 'Unbounded integer');
}

function accepts(schema, value, data) {
  schema = deref(schema, data);
  if (schema.anyOf) return schema.anyOf.some(s => accepts(s, value, data));
  if (schema.enum && !schema.enum.includes(value)) return false;
  switch (schema.type) {
    case 'null': return value === null;
    case 'boolean': return typeof value === 'boolean';
    case 'integer': return Number.isSafeInteger(value) && value >= schema.minimum && value <= schema.maximum;
    case 'string': return typeof value === 'string' && (!schema.minLength || [...value].length >= schema.minLength) && (!schema.maxLength || [...value].length <= schema.maxLength) && (!schema.pattern || new RegExp(schema.pattern).test(value));
    case 'array': return Array.isArray(value) && value.length >= schema.minItems && value.length <= schema.maxItems && value.every(v => accepts(schema.items, v, data));
    case 'object': return value !== null && typeof value === 'object' && !Array.isArray(value) && (!schema.minProperties || Object.keys(value).length >= schema.minProperties) && schema.required.every(k => Object.hasOwn(value, k)) && Object.entries(value).every(([k, v]) => k in schema.properties && accepts(schema.properties[k], v, data));
    default: return false;
  }
}

function validate(data) {
  check(data.status === 'proposed-human-review' && data.benchmarksExecuted === false && data.productionEndpointsImplemented === false, 'Proposal status must remain explicit');
  check(/^[0-9a-f]{40}$/.test(data.base), 'Exact base missing');
  Object.values(data.schemas).forEach(s => inspect(s, data));
  const ids = new Set(), routes = new Set();
  for (const op of data.operations) {
    check(!ids.has(op.id), 'Duplicate operation ID'); ids.add(op.id);
    const route = `${op.method} ${op.path}`;
    check(!routes.has(route), 'Duplicate route'); routes.add(route);
    check(op.path.startsWith('/api/v1/') && !op.path.includes('expand'), 'Invalid route');
    check(op.status === 'proposed-not-implemented', 'Runtime claim');
    check(op.authentication === 'fresh-cookie-valkey-primary-request-bound' && op.cache === 'private,no-store', 'Authority/cache invariant');
    check(op.dependencies.length > 0, 'Missing implementation prerequisites');
    const params = [...op.path.matchAll(/\{([^}]+)\}/g)].map(m => m[1]).sort();
    assert.deepEqual(params, Object.keys(op.pathSchema.properties).sort(), 'Path/schema mismatch');
    if (op.scope === 'workspace') check(params.includes('workspaceId'), 'Missing tenant selector');
    const query = deref(op.querySchema, data);
    if (query.properties.limit) check(query.properties.limit.maximum === 100 && query.properties.limit.minimum === 1, 'Page limit changed');
    check(!Object.keys(query.properties).some(k => ['offset', 'expand', 'userId', 'roles'].includes(k)), 'Forbidden query control');
    const unsafe = op.method !== 'GET';
    check(op.csrf === unsafe, 'CSRF invariant');
    if (unsafe) check('X-CSRF-Token' in op.headerSchema.properties, 'Missing CSRF header');
    if (op.idempotencyRequired) check('Idempotency-Key' in op.headerSchema.properties, 'Missing idempotency');
    if (op.casRequired) check('If-Match' in op.headerSchema.properties, 'Missing CAS');
    check(op.responseMaxBytes > 0 && op.responseMaxBytes <= 307200 && op.requestMaxBytes <= 65536 && op.businessSelectMax <= 12, 'Budget invariant');
    ['pathSchema', 'querySchema', 'headerSchema', 'bodySchema', 'responseSchema'].forEach(k => inspect(op[k], data));
    Object.values(op.responseVariants ?? {}).forEach(s => inspect(s, data));
  }
  check(data.schemas.GraphInput.properties.depth.maximum === data.graphBudget.depth && data.schemas.GraphPage.properties.nodes.maxItems === data.graphBudget.nodes && data.schemas.GraphPage.properties.edges.maxItems === data.graphBudget.edges, 'Graph budget drift');
  check(data.schemas.BatchInput.properties.items.maxItems === 25, 'Batch cap drift');
  check(data.proposedTiers.every(t => t.readLatencyMs.p50 <= t.readLatencyMs.p95 && t.readLatencyMs.p95 <= t.readLatencyMs.p99), 'Invalid latency proposal');
  const rules = data.contractRules;
  check(rules?.revisionOwner === 'database-owned-atomic' && rules.authorizationRevisionRequired && rules.cursorIndependentSigningKey && !rules.retiredKeyAccepted, 'Revision/key contract');
  check(rules.replayRequiresCurrentAuthority && rules.idempotencyScopeNonnull && rules.effectResultAtomic && !rules.expiredKeyMayReexecute && rules.fullResultRetentionSeconds >= 86400, 'Durable replay contract');
  check(!rules.runtimeInfrastructureImplemented && rules.benchmarkAcceptanceRequired && data.benchmarkGate === 'not-executed-not-accepted', 'Unimplemented infrastructure/benchmark gate');
  assert.deepEqual(rules.lockOrder, ['user', 'family', 'workspace', 'idempotency', 'graph', 'sorted-resources']);
  assert.deepEqual(rules.scopeBinding, ['actor', 'operation', 'workspace', 'root', 'filter', 'projection', 'sort']);
  check(rules.isolation === 'SERIALIZABLE' && rules.listCursorMaxSeconds === 900 && rules.graphCursorMaxSeconds === 120, 'Isolation/cursor limits');
  for (const id of ['getWorkspace', 'listWorkspaceMembers', 'workspaceSelf', 'createWorkspace', 'requestWorkspaceInvitation', 'acceptWorkspaceInvitation']) {
    const op = data.operations.find(o => o.id === id);
    check(op?.policyStatus === 'proposed-not-granted' && op.responseMaxBytes <= 131072, 'Workspace dependency/status');
  }
}

function coherent(schema, value) {
  const self = schema === 'WorkspaceSelf' ? value : schema === 'WorkspaceDetail' ? value.self : schema === 'WorkspaceCreated' ? value.initialAdministrator : null;
  if (self) {
    const caps = self.capabilities;
    if (caps.writeDependencies || caps.completeDependentIssues) return false;
    if ((self.role === 'OBSERVER' || self.workspaceStatus === 'ARCHIVED') && (caps.inviteMembers || caps.createTeam || caps.writeIssues)) return false;
    if (self.role !== 'ADMIN' && (caps.listMembers || caps.inviteMembers)) return false;
  }
  if (schema === 'WorkspaceCreated') return self.role === 'ADMIN' && self.membershipStatus === 'ACTIVE' && self.workspaceStatus === 'ACTIVE' && value.workspace.id === self.workspaceId && value.workspace.membershipRole === 'ADMIN';
  if (schema === 'WorkspaceDetail') return value.workspace.id === self.workspaceId && value.workspace.status === self.workspaceStatus && value.workspace.membershipRole === self.role;
  return true;
}

validate(registry);
const samples = JSON.parse(readFileSync(resolve(folder, 'examples.json'), 'utf8'));
for (const sample of samples) {
  check(accepts({ $ref: `#/schemas/${sample.schema}` }, sample.value, registry), `Invalid example ${sample.name}`);
  check(coherent(sample.schema, sample.value), `Contradictory example ${sample.name}`);
  if (sample.operation) {
    const op = registry.operations.find(o => o.id === sample.operation);
    check(op && Buffer.byteLength(JSON.stringify(sample.value)) <= op.responseMaxBytes, 'Example exceeds response cap');
  }
}

// Independent malformed contracts and adversarial boundary payloads.
let negatives = 0;
for (const change of [
  r => { r.schemas.IssueRow.properties.leak = { $ref: '#/schemas/Absent' }; },
  r => { delete r.schemas.IssuePage.properties.items.maxItems; },
  r => { r.operations.find(o => o.id === 'listTeams').path = '/api/v1/teams'; r.operations.find(o => o.id === 'listTeams').pathSchema = { type: 'object', properties: {}, required: [], additionalProperties: false }; },
  r => { r.operations.find(o => o.id === 'patchIssue').headerSchema.properties = {}; },
  r => { r.operations[0].cache = 'public'; },
  r => { r.schemas.WorkspaceQuery.properties.offset = { type: 'integer', minimum: 0, maximum: 1000000 }; },
  r => { r.graphBudget.nodes = 100000; },
  r => { r.benchmarksExecuted = true; },
  r => { r.contractRules.replayRequiresCurrentAuthority = false; },
  r => { r.contractRules.effectResultAtomic = false; },
  r => { r.contractRules.expiredKeyMayReexecute = true; },
  r => { r.contractRules.scopeBinding = ['workspace']; },
  r => { r.contractRules.retiredKeyAccepted = true; },
]) { const copy = structuredClone(registry); change(copy); assert.throws(() => validate(copy)); negatives++; }
for (const [schema, value] of [
  ['PageQuery', { limit: 101 }], ['PageQuery', { limit: 1.5 }],
  ['GraphInput', { direction: 'both', depth: 4, nodeLimit: 200, edgeLimit: 400 }],
  ['PatchIssue', {}], ['PatchIssue', { title: 'ok', role: 'ADMIN' }],
  ['InvitationRequest', { email: 'test@example.invalid', role: 'ADMIN' }],
  ['InvitationAccept', { token: 'forged', userId: '12345678-1234-1234-1234-123456789012' }],
  ['CreateWorkspace', { name: 'ok', slug: 'ok', role: 'ADMIN' }],
  ['MembershipQuery', { limit: 101 }],
  ['CreateWorkspace', { name: 'ok', slug: 'bad/slash' }],
  ['BatchInput', { items: Array(26).fill({ id: '12345678-1234-1234-1234-123456789012', expectedVersion: 1, patch: { title: 'ok' } }) }],
]) { check(!accepts({ $ref: `#/schemas/${schema}` }, value, registry), 'Negative payload unexpectedly accepted'); negatives++; }

const observer = structuredClone(samples.find(s => s.name === 'archived-observer-self').value);
observer.capabilities.writeIssues = true;
check(!coherent('WorkspaceSelf', observer), 'Observer/archived mutation capability'); negatives++;
const creator = structuredClone(samples.find(s => s.name === 'atomic-creator-admin').value);
creator.initialAdministrator.role = 'MEMBER';
check(!coherent('WorkspaceCreated', creator), 'Creation must atomically identify creator ADMIN'); negatives++;

// Pure design model using synthetic trusted facts; no real crypto/DB/lock proof.
function lifecycleDecision(facts) {
  if (facts.authority === 'unavailable') return 'unavailable';
  if (facts.authority !== 'active') return 'resource-unavailable';
  if (facts.kind === 'cursor') {
    const max = facts.graph ? registry.contractRules.graphCursorMaxSeconds : registry.contractRules.listCursorMaxSeconds;
    if (!facts.signatureValid || !['active', 'verify-only'].includes(facts.keyState) || facts.issued > facts.now || facts.now >= facts.expires || facts.expires - facts.issued > max || !facts.bindingMatch) return 'invalid-cursor';
    if (!facts.policyRevisionMatch || (facts.requiresDataRevision && !facts.dataRevisionMatch)) return 'cursor-stale';
    return 'continue';
  }
  if (facts.kind === 'idempotency') {
    if (!facts.effectResultAtomic) return 'invalid-contract';
    if (!facts.sameDigest) return 'idempotency-conflict';
    if (facts.resultExpired) return 'result-expired';
    if (facts.record === 'committed') return 'replay';
    if (facts.record === 'in-flight') return 'in-progress';
    return facts.originalResolved ? 'execute' : 'unavailable';
  }
  if (facts.kind === 'read-order') return facts.order === 'read-first' ? 'earlier-read-may-finish' : 'resource-unavailable';
  fail('Unsupported lifecycle example');
}
const lifecycle = JSON.parse(readFileSync(resolve(folder, 'lifecycle-examples.json'), 'utf8'));
check(lifecycle.status === 'synthetic-design-decision-model-not-runtime-proof', 'Scenario status');
for (const scenario of lifecycle.cases) assert.equal(lifecycleDecision(scenario.facts), scenario.expected, scenario.name);

let links = 0;
for (const name of ['../../24-BE-API-00-ENTERPRISE-CONTRACTS.md', 'protocol.md', 'screens.md', 'graph.md', 'queries.md', 'performance.md', 'workspaces.md', 'authorization.md', 'lifecycle.md']) {
  const file = resolve(folder, name);
  for (const match of readFileSync(file, 'utf8').matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1].split('#')[0];
    if (!target || /^[a-z]+:/i.test(target)) continue;
    check(existsSync(resolve(dirname(file), target)), `Missing local link: ${target}`); links++;
  }
}
console.log(JSON.stringify({ operations: registry.operations.length, schemas: Object.keys(registry.schemas).length, examples: samples.length, negativeChecks: negatives, lifecycleScenarios: lifecycle.cases.length, localLinks: links, status: 'passed', limitations: 'Scoped schema/design-model validation only; no OpenAPI/runtime/crypto/SQL/load certification' }));
