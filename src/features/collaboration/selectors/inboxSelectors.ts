/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { InboxItem, InboxViewFilter } from '../types';

/**
 * Filters items according to the active Inbox view.
 */
export function filterInboxByView(items: InboxItem[], view: InboxViewFilter): InboxItem[] {
  switch (view) {
    case 'unread':
      return items.filter(item => !item.isArchived && !item.isRead);

    case 'mentions':
      return items.filter(item => !item.isArchived && item.kind === 'MENTION');

    case 'blockers':
      return items.filter(
        item =>
          !item.isArchived &&
          (item.kind === 'DEPENDENCY_BLOCKED' || item.kind === 'DEPENDENCY_UNBLOCKED')
      );

    case 'archived':
      return items.filter(item => item.isArchived);

    case 'all':
    default:
      return items.filter(item => !item.isArchived);
  }
}

/**
 * Selects the count of unread, non-archived inbox items for the user badge.
 */
export function selectUnreadInboxCount(items: InboxItem[]): number {
  return items.filter(item => !item.isArchived && !item.isRead).length;
}

/**
 * Normalizes an arbitrary query param string into a valid InboxViewFilter.
 */
export function normalizeInboxView(viewParam: string | null | undefined): InboxViewFilter {
  if (!viewParam) return 'all';
  const lower = viewParam.toLowerCase();
  if (lower === 'unread') return 'unread';
  if (lower === 'mentions') return 'mentions';
  if (lower === 'blockers') return 'blockers';
  if (lower === 'archived' || lower === 'done') return 'archived';
  return 'all';
}
