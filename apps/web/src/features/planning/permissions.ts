/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserRole } from '../../types';

export function canMutatePlanning(role?: UserRole): boolean {
  return role === 'ADMIN' || role === 'MEMBER';
}

export function assertPlanningPermission(
  role: UserRole | undefined,
  actionDescription: string
): { allowed: boolean; error?: string } {
  if (!canMutatePlanning(role)) {
    return {
      allowed: false,
      error: `Permission denied: ${role || 'OBSERVER'} users cannot ${actionDescription}.`,
    };
  }
  return { allowed: true };
}
