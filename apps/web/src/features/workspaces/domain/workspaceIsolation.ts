/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-13 Cross-Workspace Isolation & Invariants
 * Section 11, 12, 41, 42: Enforcing workspace boundaries on entities, dependencies, and keys.
 */

/**
 * Section 12: Dependency Boundary Invariant
 * Dependencies may cross projects and teams, but ONLY within the same workspace.
 * Cross-workspace dependencies are strictly forbidden.
 */
export function validateSameWorkspaceDependency(
  upstreamWorkspaceId?: string | null,
  downstreamWorkspaceId?: string | null
): boolean {
  if (!upstreamWorkspaceId || !downstreamWorkspaceId) return false;
  return upstreamWorkspaceId === downstreamWorkspaceId;
}

export function assertSameWorkspaceDependency(
  upstreamWorkspaceId?: string | null,
  downstreamWorkspaceId?: string | null
): void {
  if (!validateSameWorkspaceDependency(upstreamWorkspaceId, downstreamWorkspaceId)) {
    throw new Error(
      `Cross-workspace dependencies are forbidden. Upstream belongs to '${upstreamWorkspaceId || 'unknown'}' while downstream belongs to '${downstreamWorkspaceId || 'unknown'}'.`
    );
  }
}

/**
 * Section 11 & 42: Validate entity ownership against active workspace context.
 * Rejects entities that belong to another workspace or lack workspace identity.
 */
export function assertEntityWorkspaceOwnership<T extends { workspaceId?: string }>(
  entity: T | null | undefined,
  activeWorkspaceId: string | null | undefined,
  entityName = 'Entity'
): void {
  if (!activeWorkspaceId) {
    throw new Error(`${entityName} operation rejected: no active workspace context.`);
  }
  if (!entity || !entity.workspaceId || entity.workspaceId !== activeWorkspaceId) {
    throw new Error(
      `${entityName} belongs to '${entity?.workspaceId || 'unknown'}', but active workspace is '${activeWorkspaceId}'. Cross-workspace operations are forbidden.`
    );
  }
}

/**
 * Section 11: Cross-Workspace Entity Isolation Filter
 * Guarantees zero leakage across workspaces for all product projections.
 * Never silently defaults missing workspace IDs.
 */
export function filterEntitiesByWorkspace<T extends { workspaceId?: string }>(
  entities: T[],
  activeWorkspaceId: string | null
): T[] {
  if (!activeWorkspaceId) return [];
  return entities.filter((entity) => Boolean(entity.workspaceId) && entity.workspaceId === activeWorkspaceId);
}

/**
 * Section 41: Project Key Resolution with Active Workspace Context
 * Two workspaces may both legitimately have project key "ENG".
 * Resolution must be active-workspace-scoped.
 */
export function resolveProjectByWorkspaceAndKey<T extends { workspaceId?: string; key: string }>(
  projects: T[],
  activeWorkspaceId: string | null,
  projectKey: string
): T | undefined {
  if (!activeWorkspaceId || !projectKey) return undefined;
  const normalizedKey = projectKey.toUpperCase().trim();
  return projects.find(
    (p) => Boolean(p.workspaceId) && p.workspaceId === activeWorkspaceId && p.key.toUpperCase() === normalizedKey
  );
}
