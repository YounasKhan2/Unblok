/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, UserRole } from '../../../types';

export const VALID_ROLES: readonly UserRole[] = ['ADMIN', 'MEMBER', 'OBSERVER'] as const;

/**
 * Checks if the given role is allowed to access administrative settings pages.
 * Only ADMIN is allowed.
 */
export function canAccessAdministrativeSettings(role: UserRole): boolean {
  return role === 'ADMIN';
}

/**
 * Returns the canonical default route for a user visiting /settings based on role.
 * ADMIN -> /settings/workspace
 * MEMBER / OBSERVER -> /settings/preferences
 */
export function getSettingsDefaultRoute(role: UserRole): string {
  if (role === 'ADMIN') {
    return '/settings/workspace';
  }
  return '/settings/preferences';
}

/**
 * Validates whether a specific route pathname can be accessed by the role.
 */
export function canAccessSettingsRoute(arg1: string, arg2: string): boolean {
  const isArg1Role = arg1 === 'ADMIN' || arg1 === 'MEMBER' || arg1 === 'OBSERVER';
  const role = (isArg1Role ? arg1 : arg2) as UserRole;
  const pathname = (isArg1Role ? arg2 : arg1).toLowerCase();

  const isAdminOnly =
    pathname.startsWith('/settings/workspace') ||
    pathname.startsWith('/settings/members') ||
    pathname.startsWith('/settings/teams') ||
    pathname.startsWith('/settings/integrations');

  if (isAdminOnly) {
    return role === 'ADMIN';
  }

  // Preferences are open to all roles
  return true;
}

/**
 * Guard enforcing that the actor has ADMIN role for administrative mutations.
 * Throws an explicit error if actor is not an ADMIN.
 */
export function assertAdminMutation(actorRole: UserRole): void {
  if (actorRole !== 'ADMIN') {
    throw new Error('Administrative mutations require ADMIN role.');
  }
}

/**
 * Validates whether a user's role can be changed.
 * Invariant: The workspace must retain at least one ADMIN.
 */
export function canChangeUserRole(
  actorRole: UserRole,
  targetUserId: string,
  newRole: UserRole,
  allUsers: User[]
): { allowed: boolean; reason?: string } {
  if (actorRole !== 'ADMIN') {
    return {
      allowed: false,
      reason: 'Only administrators can modify member roles.',
    };
  }

  if (!VALID_ROLES.includes(newRole)) {
    return {
      allowed: false,
      reason: `Invalid role "${newRole}". Allowed roles are: ${VALID_ROLES.join(', ')}.`,
    };
  }

  const targetUser = allUsers.find(u => u.id === targetUserId);
  if (!targetUser) {
    return {
      allowed: false,
      reason: `User with ID "${targetUserId}" not found.`,
    };
  }

  // If demoting an ADMIN to MEMBER or OBSERVER
  if (targetUser.role === 'ADMIN' && newRole !== 'ADMIN') {
    const adminCount = allUsers.filter(u => u.role === 'ADMIN').length;
    if (adminCount <= 1) {
      return {
        allowed: false,
        reason: 'Workspace must retain at least one ADMIN.',
      };
    }
  }

  return { allowed: true };
}
