/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserRole } from '../../types';

export interface DrawerPermissions {
  isReadOnly: boolean;
  canEditTitle: boolean;
  canEditDescription: boolean;
  canEditProperties: boolean;
  canManageDependencies: boolean;
  canComment: boolean;
}

/**
 * Pure authorization helper for Issue Drawer permissions.
 * Guarantees OBSERVER has strict read-only drawer access matching the full issue page.
 */
export function getDrawerPermissions(role?: UserRole | string): DrawerPermissions {
  const isReadOnly = role === 'OBSERVER';
  return {
    isReadOnly,
    canEditTitle: !isReadOnly,
    canEditDescription: !isReadOnly,
    canEditProperties: !isReadOnly,
    canManageDependencies: !isReadOnly,
    canComment: !isReadOnly,
  };
}

/**
 * Pure mutation guard preventing unauthorized drawer detail mutations.
 */
export function canMutateDrawerField(role?: UserRole | string): boolean {
  return role !== 'OBSERVER';
}
