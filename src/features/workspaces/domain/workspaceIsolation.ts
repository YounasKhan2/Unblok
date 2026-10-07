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
  upstreamWorkspaceId: string,
  downstreamWorkspaceId: string
): boolean {
  if (!upstreamWorkspaceId || !downstreamWorkspaceId) return false;
  return upstreamWorkspaceId === downstreamWorkspaceId;
}

export function assertSameWorkspaceDependency(
  upstreamWorkspaceId: string,
  downstreamWorkspaceId: string
): void {
  if (!validateSameWorkspaceDependency(upstreamWorkspaceId, downstreamWorkspaceId)) {
    throw new Error(
      `Cross-workspace dependencies are forbidden. Upstream belongs to '${upstreamWorkspaceId}' while downstream belongs to '${downstreamWorkspaceId}'.`
    );
  }
}

/**
 * Section 11: Cross-Workspace Entity Isolation Filter
 * Guarantees zero leakage across workspaces for all product projections.
 */
export function filterEntitiesByWorkspace<T extends { workspaceId?: string }>(
  entities: T[],
  activeWorkspaceId: string | null
): T[] {
  if (!activeWorkspaceId) return [];
  return entities.filter((entity) => entity.workspaceId === activeWorkspaceId);
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
    (p) => p.workspaceId === activeWorkspaceId && p.key.toUpperCase() === normalizedKey
  );
}
