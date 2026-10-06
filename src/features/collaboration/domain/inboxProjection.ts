/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ActivityEvent, Issue, IssueComment, User } from '../../../types';
import { InboxItem, InboxGroupedItems, InboxReceipt } from '../types';

export interface DeriveInboxItemsParams {
  activities: ActivityEvent[];
  issues: Issue[];
  comments: IssueComment[];
  users: User[];
  currentUser: User;
  receipts: Record<string, InboxReceipt>;
}

/**
 * Checks if two dates fall on the same calendar day in UTC.
 */
export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getUTCFullYear() === d2.getUTCFullYear() &&
    d1.getUTCMonth() === d2.getUTCMonth() &&
    d1.getUTCDate() === d2.getUTCDate()
  );
}

/**
 * Pure collaboration projection deriving personal InboxItem[] from canonical sources.
 *
 * Deterministic rules:
 * 1. Self-noise rule: Actions performed by the current user (activity.userId === currentUser.id)
 *    never produce inbox items for the current user.
 * 2. Mentions: Target user explicitly matches currentUser by stable ID or name fallback.
 *    Referenced canonical comment must still exist (deleted comments suppressed).
 * 3. Assignments: Issue assigned to currentUser by another team member.
 * 4. Blocker boundaries: ISSUE_BLOCKED or ISSUE_UNBLOCKED affecting currentUser's assigned issues.
 * 5. Cycle updates: CYCLE_ASSIGNED, CYCLE_REMOVED, CYCLE_ROLLED_OVER affecting currentUser's assigned issues.
 * 6. Missing issues: Gracefully dropped without crashing.
 * 7. Deduplication: At most one mention item per comment per user.
 */
export function deriveInboxItems(params: DeriveInboxItemsParams): InboxItem[] {
  const {
    activities,
    issues,
    comments,
    users,
    currentUser,
    receipts,
  } = params;

  if (!currentUser) return [];

  // Indexed O(1) lookups
  const issuesById = new Map<string, Issue>(issues.map(i => [i.id, i]));
  const commentsById = new Map<string, IssueComment>(comments.map(c => [c.id, c]));
  const usersById = new Map<string, User>(users.map(u => [u.id, u]));

  const derivedItems: InboxItem[] = [];
  const seenMentionComments = new Set<string>();

  for (const act of activities) {
    // Deterministic Rule 1: Self-noise suppression
    if (act.userId === currentUser.id) {
      continue;
    }

    // Deterministic Rule 6: Missing issue check
    const issue = issuesById.get(act.issueId);
    if (!issue) {
      continue;
    }

    const actor = usersById.get(act.userId);
    const receipt = receipts[act.id];
    const isRead = Boolean(receipt?.readAt);
    const isArchived = Boolean(receipt?.archivedAt);

    switch (act.eventType) {
      // 1. Mentions
      case 'USER_MENTIONED': {
        const targetUserId = act.details?.targetUserId;
        const targetUserName = act.details?.targetUserName || act.details?.mentionedUserName;

        const isTarget = targetUserId
          ? targetUserId === currentUser.id
          : targetUserName?.toLowerCase() === currentUser.name.toLowerCase();

        if (!isTarget) continue;

        const commentId = act.details?.commentId;
        if (commentId) {
          // Rule 2: Suppress if canonical comment was deleted
          const canonicalComment = commentsById.get(commentId);
          if (!canonicalComment) {
            continue;
          }

          // Deduplicate multiple mentions of same user in same comment
          if (seenMentionComments.has(commentId)) {
            continue;
          }
          seenMentionComments.add(commentId);

          derivedItems.push({
            id: act.id,
            sourceActivityId: act.id,
            kind: 'MENTION',
            issueId: issue.id,
            issueKey: issue.key,
            issueTitle: issue.title,
            actorId: act.userId,
            actorName: actor?.name || act.userName,
            actorAvatar: actor?.avatar,
            commentId,
            contentSnippet: canonicalComment.content,
            reason: act.details?.reason,
            createdAt: act.timestamp,
            isRead,
            isArchived,
          });
        }
        break;
      }

      // 2. Assignments
      case 'ASSIGNEE_CHANGED': {
        const toAssigneeId = act.details?.toAssigneeId;
        const toName = act.details?.to;

        const isAssignedToCurrent = toAssigneeId
          ? toAssigneeId === currentUser.id
          : (toName && toName.toLowerCase() === currentUser.name.toLowerCase()) ||
            (issue.assigneeId === currentUser.id && toName !== 'Unassigned');

        // Must be an assignment TO the user, not unassignment from the user
        const fromAssigneeId = act.details?.fromAssigneeId;
        if (fromAssigneeId === currentUser.id && toAssigneeId !== currentUser.id) {
          continue;
        }

        if (!isAssignedToCurrent) continue;

        derivedItems.push({
          id: act.id,
          sourceActivityId: act.id,
          kind: 'ASSIGNMENT',
          issueId: issue.id,
          issueKey: issue.key,
          issueTitle: issue.title,
          actorId: act.userId,
          actorName: actor?.name || act.userName,
          actorAvatar: actor?.avatar,
          reason: act.details?.reason || `Assigned you to ${issue.key}`,
          contentSnippet: issue.description,
          createdAt: act.timestamp,
          isRead,
          isArchived,
        });
        break;
      }

      // 3. Dependency Blocked
      case 'ISSUE_BLOCKED': {
        // Relevant only if assigned to currentUser
        if (issue.assigneeId !== currentUser.id) continue;

        derivedItems.push({
          id: act.id,
          sourceActivityId: act.id,
          kind: 'DEPENDENCY_BLOCKED',
          issueId: issue.id,
          issueKey: issue.key,
          issueTitle: issue.title,
          actorId: act.userId,
          actorName: actor?.name || act.userName,
          actorAvatar: actor?.avatar,
          reason: act.details?.reason || `Issue ${issue.key} became blocked by prerequisite tasks`,
          createdAt: act.timestamp,
          isRead,
          isArchived,
        });
        break;
      }

      // 4. Dependency Unblocked
      case 'ISSUE_UNBLOCKED': {
        // Relevant only if assigned to currentUser
        if (issue.assigneeId !== currentUser.id) continue;

        derivedItems.push({
          id: act.id,
          sourceActivityId: act.id,
          kind: 'DEPENDENCY_UNBLOCKED',
          issueId: issue.id,
          issueKey: issue.key,
          issueTitle: issue.title,
          actorId: act.userId,
          actorName: actor?.name || act.userName,
          actorAvatar: actor?.avatar,
          reason: act.details?.reason || `All active blockers resolved on ${issue.key}`,
          createdAt: act.timestamp,
          isRead,
          isArchived,
        });
        break;
      }

      // 5. Cycle Updates
      case 'CYCLE_ROLLED_OVER':
      case 'CYCLE_ASSIGNED':
      case 'CYCLE_REMOVED': {
        // Relevant only if assigned to currentUser
        if (issue.assigneeId !== currentUser.id) continue;

        let cycleReason = act.details?.reason;
        if (!cycleReason) {
          if (act.eventType === 'CYCLE_ROLLED_OVER') {
            cycleReason = `Work rolled over to ${act.details?.targetCycleId ? 'next cycle' : 'backlog'}`;
          } else if (act.eventType === 'CYCLE_ASSIGNED') {
            cycleReason = `Assigned to ${act.details?.cycleName || 'cycle'}`;
          } else {
            cycleReason = `Removed from ${act.details?.cycleName || 'cycle'}`;
          }
        }

        derivedItems.push({
          id: act.id,
          sourceActivityId: act.id,
          kind: 'CYCLE_UPDATE',
          issueId: issue.id,
          issueKey: issue.key,
          issueTitle: issue.title,
          actorId: act.userId,
          actorName: actor?.name || act.userName,
          actorAvatar: actor?.avatar,
          reason: cycleReason,
          createdAt: act.timestamp,
          isRead,
          isArchived,
        });
        break;
      }

      default:
        // Ignore un-notifiable workspace domain activity
        break;
    }
  }

  // Sort newest first
  return derivedItems.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Pure partitioner grouping inbox items into Today, Earlier, and Archived sections.
 * Accepts an optional referenceDate for deterministic testing.
 */
export function groupInboxItems(
  items: InboxItem[],
  referenceDate: Date = new Date()
): InboxGroupedItems {
  const today: InboxItem[] = [];
  const earlier: InboxItem[] = [];
  const archived: InboxItem[] = [];

  for (const item of items) {
    if (item.isArchived) {
      archived.push(item);
      continue;
    }

    const itemDate = new Date(item.createdAt);
    if (isSameDay(itemDate, referenceDate)) {
      today.push(item);
    } else {
      earlier.push(item);
    }
  }

  return { today, earlier, archived };
}
