/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-13 Active Workspace Selection Domain Logic
 * Section 6, 19, 23: Deterministic resolution and fallback rules for active workspace.
 */

import { Workspace, WorkspaceMembership } from '../types';

export interface WorkspaceResolutionResult {
  activeWorkspaceId: string | null;
  resolutionSource: 'persisted' | 'fallback_admin' | 'fallback_first' | 'zero_memberships' | 'unavailable';
  reason?: string;
}

/**
 * Deterministically resolves the active workspace for an authenticated identity.
 * Rule hierarchy:
 * 1. Inspect persisted activeWorkspaceId:
 *    - Verify membership exists and is status === 'ACTIVE'.
 *    - Verify workspace entity exists and is known.
 *    - If valid, restore immediately.
 * 2. If persisted is invalid/missing/suspended/removed:
 *    - Filter user memberships to status === 'ACTIVE'.
 *    - Prioritize ADMIN memberships first, then MEMBER, then OBSERVER.
 *    - Tie-break alphabetically by workspaceId.
 * 3. If user has zero active memberships:
 *    - Return null with 'zero_memberships' to route into workspace onboarding.
 */
export function resolveActiveWorkspace(
  userMemberships: WorkspaceMembership[],
  persistedWorkspaceId: string | null,
  workspaces: Workspace[]
): WorkspaceResolutionResult {
  const activeMemberships = userMemberships.filter(
    (m) => m.status === 'ACTIVE'
  );

  if (activeMemberships.length === 0) {
    return {
      activeWorkspaceId: null,
      resolutionSource: 'zero_memberships',
      reason: 'User has no active workspace memberships.',
    };
  }

  const workspaceMap = new Map<string, Workspace>(workspaces.map((w) => [w.id, w]));

  // 1. Check persisted workspace ID
  if (persistedWorkspaceId) {
    const persistedMembership = activeMemberships.find(
      (m) => m.workspaceId === persistedWorkspaceId
    );
    const persistedWorkspace = workspaceMap.get(persistedWorkspaceId);

    if (persistedMembership && persistedWorkspace) {
      return {
        activeWorkspaceId: persistedWorkspaceId,
        resolutionSource: 'persisted',
      };
    }
  }

  // 2. Deterministic fallback selection
  // Sort: ADMIN (0) -> MEMBER (1) -> OBSERVER (2), then by workspaceId
  const rolePriority: Record<string, number> = {
    ADMIN: 0,
    MEMBER: 1,
    OBSERVER: 2,
  };

  const sortedMemberships = [...activeMemberships].sort((a, b) => {
    const priorityA = rolePriority[a.role] ?? 99;
    const priorityB = rolePriority[b.role] ?? 99;
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    return a.workspaceId.localeCompare(b.workspaceId);
  });

  const bestMatch = sortedMemberships[0];
  const isBestAdmin = bestMatch.role === 'ADMIN';

  return {
    activeWorkspaceId: bestMatch.workspaceId,
    resolutionSource: isBestAdmin ? 'fallback_admin' : 'fallback_first',
    reason: persistedWorkspaceId
      ? `Persisted workspace '${persistedWorkspaceId}' is unavailable or revoked; fell back to '${bestMatch.workspaceId}'.`
      : `Defaulted to highest-privilege active workspace '${bestMatch.workspaceId}'.`,
  };
}

/**
 * Validates whether a given workspace slug is syntactically valid and clean.
 */
export function slugifyWorkspaceName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
