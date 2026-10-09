/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type InboxItemKind =
  | 'MENTION'
  | 'ASSIGNMENT'
  | 'DEPENDENCY_UNBLOCKED'
  | 'DEPENDENCY_BLOCKED'
  | 'CYCLE_UPDATE';

export interface InboxReceipt {
  userId: string;
  sourceId: string;
  readAt?: string;
  archivedAt?: string;
}

export interface InboxItem {
  id: string; // Deterministic ID, equal to sourceActivityId
  sourceActivityId: string;
  kind: InboxItemKind;
  issueId: string;
  issueKey: string;
  issueTitle: string;
  actorId?: string;
  actorName?: string;
  actorAvatar?: string;
  commentId?: string;
  contentSnippet?: string;
  reason?: string;
  createdAt: string;
  isRead: boolean;
  isArchived: boolean;
}

export type InboxViewFilter = 'all' | 'unread' | 'mentions' | 'blockers' | 'archived';

export interface InboxGroupedItems {
  today: InboxItem[];
  earlier: InboxItem[];
  archived: InboxItem[];
}
