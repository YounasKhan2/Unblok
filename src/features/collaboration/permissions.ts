/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserRole } from '../../types';

/**
 * Checks if the user's role permits authoring comments or replies.
 * ADMIN and MEMBER can author; OBSERVER cannot.
 */
export function canComment(role: UserRole): boolean {
  return role === 'ADMIN' || role === 'MEMBER';
}

/**
 * Checks if the user is authorized to delete a specific comment.
 * - ADMIN can delete any comment.
 * - MEMBER can delete their own comment.
 * - OBSERVER cannot delete any comment.
 */
export function canDeleteComment(role: UserRole, isAuthor: boolean): boolean {
  if (role === 'OBSERVER') return false;
  if (role === 'ADMIN') return true;
  if (role === 'MEMBER') return isAuthor;
  return false;
}

/**
 * Personal inbox processing (marking read, archiving receipts) is personal UI state,
 * allowed for all roles including OBSERVER.
 */
export function canProcessInboxReceipt(): boolean {
  return true;
}
