import { workspaceJsonSchemas } from '@unblok/contracts';
export function workspaceOpenApi() {
  const response = (name: string, status = '200') => ({ [status]: { description: 'Bounded server-authorized response', content: { 'application/json': { schema: { $ref: '#/components/schemas/' + name } } } } });
  const operation = (name: string, status = '200') => ({ security: [{ cookieSession: [] }], responses: response(name, status) });
  return { openapi: '3.1.0', info: { title: 'Unblok Workspace foundation', version: '1' },
    paths: { '/api/v1/workspaces': {
      post: { ...operation('WorkspaceCreated', '201'), parameters: [{ in: 'header', name: 'Idempotency-Key', required: true, schema: { type: 'string', format: 'uuid' } }, { in: 'header', name: 'X-CSRF-Token', required: true, schema: { type: 'string', pattern: '^[A-Za-z0-9_-]{43}$' } }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateWorkspace' } } } } },
      get: { ...operation('WorkspacePage'), parameters: [{ in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1, maximum: 100, default: 50 } }, { in: 'query', name: 'sort', schema: { type: 'string', enum: ['workspace_asc', 'workspace_desc'], default: 'workspace_asc' } }, { in: 'query', name: 'after', schema: { type: 'string', minLength: 1, maxLength: 2048 } }] } },
      '/api/v1/workspaces/{workspaceId}': { parameters: [{ in: 'path', name: 'workspaceId', required: true, schema: { type: 'string', format: 'uuid' } }], get: operation('WorkspaceDetail') },
      '/api/v1/workspaces/{workspaceId}/me': { parameters: [{ in: 'path', name: 'workspaceId', required: true, schema: { type: 'string', format: 'uuid' } }], get: operation('WorkspaceSelf') } },
    components: { securitySchemes: { cookieSession: { type: 'apiKey', in: 'cookie', name: '__Host-unblok.sid', description: 'Production cookie; localhost name unblok.sid.dev. Fresh server verification mandatory.' } }, schemas: workspaceJsonSchemas() } };
}
if (import.meta.main) await Bun.write('docs/backend/evidence/BE-WS-01-openapi.json', JSON.stringify(workspaceOpenApi(), null, 2) + '\n');
