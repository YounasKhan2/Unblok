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
 * Checks if membership role allows administrative workspace operations.
 * Section 14: Permissions resolve strictly from WorkspaceMembership.role.
 */
export function canPerformAdminAction(membership?: WorkspaceMembership | null): boolean {
  if (!membership || membership.status !== 'ACTIVE') return false;
  return membership.role === 'ADMIN';
}

/**
 * Checks if membership role allows normal execution / editing actions.
 * OBSERVER is read-only.
 */
export function canPerformExecutionAction(membership?: WorkspaceMembership | null): boolean {
  if (!membership || membership.status !== 'ACTIVE') return false;
  return membership.role === 'ADMIN' || membership.role === 'MEMBER';
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
