/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-13 Workspace Lifecycle & Invariant Protection
 * Section 16, 25, 26, 28, 31: Lifecycle states, permissions, last-admin protection.
 */

import {
  Workspace,
  WorkspaceMembership,
  WorkspaceRole,
  OnboardingProgress,
} from '../types';

/**
 * Section 28: Last Admin Protection Invariant
 * A workspace must not accidentally lose its final ACTIVE ADMIN through
 * membership removal or role demotion.
 */
export function assertNotLastAdminRemoval(
  allWorkspaceMemberships: WorkspaceMembership[],
  targetUserId: string,
  workspaceId: string
): void {
  const activeAdmins = allWorkspaceMemberships.filter(
    (m) =>
      m.workspaceId === workspaceId &&
      m.status === 'ACTIVE' &&
      m.role === 'ADMIN'
  );

  const isTargetActiveAdmin = activeAdmins.some((m) => m.userId === targetUserId);

  if (isTargetActiveAdmin && activeAdmins.length <= 1) {
    throw new Error(
      `Cannot remove or demote the last active Administrator in workspace '${workspaceId}'. Promote another member to Admin first.`
    );
  }
}

/**
 * Checks if workspace is mutable.
 * Section 26: Archived workspaces are read-only.
 */
export function isWorkspaceMutable(workspace?: Workspace | null): boolean {
  if (!workspace) return false;
  return workspace.status === 'ACTIVE';
}

/**
 * Section 26: Enforces that active workspace is not archived.
 * Throws explicit error on attempted writes to an archived workspace.
 */
export function assertMutableWorkspace(workspace?: Workspace | null): void {
  if (workspace && !isWorkspaceMutable(workspace)) {
    throw new Error(
      `Workspace '${workspace.name || workspace.id}' is archived and read-only. Mutations are forbidden.`
    );
  }
}

/**
 * Checks if membership role allows administrative workspace operations.
 * Section 14: Permissions resolve strictly from WorkspaceMembership.role.
 * In an archived workspace, administrative mutations are rejected.
 */
export function canPerformAdminAction(
  membership?: WorkspaceMembership | null,
  workspace?: Workspace | null
): boolean {
  if (workspace && !isWorkspaceMutable(workspace)) return false;
  if (!membership || membership.status !== 'ACTIVE') return false;
  return membership.role === 'ADMIN';
}

/**
 * Checks if membership role allows normal execution / editing actions.
 * OBSERVER is read-only.
 * In an archived workspace, execution mutations are rejected.
 */
export function canPerformExecutionAction(
  membership?: WorkspaceMembership | null,
  workspace?: Workspace | null
): boolean {
  if (workspace && !isWorkspaceMutable(workspace)) return false;
  if (!membership || membership.status !== 'ACTIVE') return false;
  return membership.role === 'ADMIN' || membership.role === 'MEMBER';
}

/**
 * Section 16 & 26: Asserts execution permission for a given mutation.
 */
export function assertExecutionPermission(
  membership?: WorkspaceMembership | null,
  workspace?: Workspace | null,
  actionName = 'Mutation'
): void {
  assertMutableWorkspace(workspace);
  if (!membership || membership.status !== 'ACTIVE') {
    throw new Error(`${actionName} forbidden: active workspace membership required.`);
  }
  if (!canPerformExecutionAction(membership, workspace)) {
    throw new Error(`${actionName} forbidden: ${membership.role} role is read-only.`);
  }
}

/**
 * Section 31: Domain-based Onboarding Progress Resolution
 */
export function resolveOnboardingProgress(
  userMemberships: WorkspaceMembership[],
  hasTeamsCreated: boolean = false
): OnboardingProgress {
  const activeMemberships = userMemberships.filter((m) => m.status === 'ACTIVE');

  if (activeMemberships.length === 0) {
    return 'ACCOUNT_CREATED';
  }

  if (!hasTeamsCreated) {
    return 'WORKSPACE_CREATED';
  }

  return 'COMPLETE';
}
