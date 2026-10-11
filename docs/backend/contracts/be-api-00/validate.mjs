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
}

validate(registry);
const samples = JSON.parse(readFileSync(resolve(folder, 'examples.json'), 'utf8'));
for (const sample of samples) {
  check(accepts({ $ref: `#/schemas/${sample.schema}` }, sample.value, registry), `Invalid example ${sample.name}`);
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
]) { const copy = structuredClone(registry); change(copy); assert.throws(() => validate(copy)); negatives++; }
for (const [schema, value] of [
  ['PageQuery', { limit: 101 }], ['PageQuery', { limit: 1.5 }],
  ['GraphInput', { direction: 'both', depth: 4, nodeLimit: 200, edgeLimit: 400 }],
  ['PatchIssue', {}], ['PatchIssue', { title: 'ok', role: 'ADMIN' }],
  ['CreateWorkspace', { name: 'ok', slug: 'bad/slash' }],
  ['BatchInput', { items: Array(26).fill({ id: '12345678-1234-1234-1234-123456789012', expectedVersion: 1, patch: { title: 'ok' } }) }],
]) { check(!accepts({ $ref: `#/schemas/${schema}` }, value, registry), 'Negative payload unexpectedly accepted'); negatives++; }

let links = 0;
for (const name of ['../../24-BE-API-00-ENTERPRISE-CONTRACTS.md', 'protocol.md', 'screens.md', 'graph.md', 'queries.md', 'performance.md']) {
  const file = resolve(folder, name);
  for (const match of readFileSync(file, 'utf8').matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1].split('#')[0];
    if (!target || /^[a-z]+:/i.test(target)) continue;
    check(existsSync(resolve(dirname(file), target)), `Missing local link: ${target}`); links++;
  }
}
console.log(JSON.stringify({ operations: registry.operations.length, schemas: Object.keys(registry.schemas).length, examples: samples.length, negativeChecks: negatives, localLinks: links, status: 'passed', limitations: 'Scoped schema/invariant validation only; no OpenAPI/runtime/SQL/load certification' }));
