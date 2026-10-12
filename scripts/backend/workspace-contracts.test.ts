import { expect, test } from 'bun:test';
import { workspaceOpenApi } from './workspace-contracts';
import { createWorkspaceSchema, workspaceRowSchema, workspaceSelfSchema, workspaceDetailSchema, workspaceCreatedSchema, workspacePageSchema } from '@unblok/contracts';
test('generated OpenAPI and approved Workspace field vocabulary stay aligned', async () => {
  expect(JSON.parse(await Bun.file('docs/backend/evidence/BE-WS-01-openapi.json').text())).toEqual(workspaceOpenApi());
  const registry = await Bun.file('docs/backend/contracts/be-api-00/registry.json').json();
  for (const [name, schema] of Object.entries({ CreateWorkspace: createWorkspaceSchema, WorkspaceRow: workspaceRowSchema, WorkspaceSelf: workspaceSelfSchema, WorkspaceDetail: workspaceDetailSchema, WorkspaceCreated: workspaceCreatedSchema, WorkspacePage: workspacePageSchema })) {
    expect(Object.keys(schema.shape).sort()).toEqual(Object.keys(registry.schemas[name].properties).sort());
  }
  expect(createWorkspaceSchema.safeParse({ name: 'Acme', slug: 'acme', creatorId: 'forged' }).success).toBe(false);
});
