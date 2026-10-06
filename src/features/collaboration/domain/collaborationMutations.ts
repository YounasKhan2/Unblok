/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Issue, IssueComment, ActivityEvent, User } from '../../../types';
import { createActivityEvent } from '../../../domain/audit';
import { canComment, canDeleteComment } from '../permissions';

export interface ExecuteAddCommentParams {
  issueId: string;
  content: string;
  parentId?: string;
  actor: User;
  allUsers: User[];
  issues: Issue[];
  existingComments: IssueComment[];
  explicitMentionIds?: string[];
}

export interface ExecuteAddCommentResult {
  success: boolean;
  error?: string;
  comment?: IssueComment;
  events: ActivityEvent[];
}

export interface ExecuteDeleteCommentParams {
  commentId: string;
  actor: User;
  existingComments: IssueComment[];
}

export interface ExecuteDeleteCommentResult {
  success: boolean;
  error?: string;
  deletedCommentIds: string[];
}

/**
 * Parses user mentions from content by matching `@UserName` against known users in the workspace.
 * Deduplicates multiple mentions of the same user.
 */
export function extractMentionedUserIds(
  content: string,
  allUsers: User[],
  explicitMentionIds?: string[]
): string[] {
  const matchedUserIds = new Set<string>();

  // If explicit IDs were passed (e.g. from an autocomplete picker)
  if (explicitMentionIds && explicitMentionIds.length > 0) {
    for (const id of explicitMentionIds) {
      if (allUsers.some(u => u.id === id)) {
        matchedUserIds.add(id);
      }
    }
  }

  // Parse @Name mentions from content text
  const lowerContent = content.toLowerCase();
  for (const user of allUsers) {
    const mentionPattern = `@${user.name.toLowerCase()}`;
    if (lowerContent.includes(mentionPattern)) {
      matchedUserIds.add(user.id);
    }
  }

  return Array.from(matchedUserIds);
}

/**
 * Pure collaboration mutation boundary for adding comments.
 * Enforces permissions, non-empty content, valid issues, thread integrity, and emits audit events.
 */
export function executeAddComment(params: ExecuteAddCommentParams): ExecuteAddCommentResult {
  const {
    issueId,
    content,
    parentId,
    actor,
    allUsers,
    issues,
    existingComments,
    explicitMentionIds,
  } = params;

  // 1. Role / Permission Check
  if (!canComment(actor.role)) {
    return {
      success: false,
      error: 'Observers have read-only access and cannot author comments or replies.',
      events: [],
    };
  }

  // 2. Non-empty content validation
  const trimmed = content.trim();
  if (trimmed.length === 0) {
    return {
      success: false,
      error: 'Comment content cannot be empty.',
      events: [],
    };
  }

  // 3. Issue existence validation
  const targetIssue = issues.find(i => i.id === issueId);
  if (!targetIssue) {
    return {
      success: false,
      error: `Issue not found: "${issueId}".`,
      events: [],
    };
  }

  // 4. Thread parent validation (if reply)
  if (parentId) {
    const parentComment = existingComments.find(c => c.id === parentId);
    if (!parentComment) {
      return {
        success: false,
        error: `Parent comment not found: "${parentId}".`,
        events: [],
      };
    }
    if (parentComment.issueId !== issueId) {
      return {
        success: false,
        error: 'Reply parent comment belongs to a different issue.',
        events: [],
      };
    }
  }

  // 5. Parse and deduplicate mentioned users
  const mentionIds = extractMentionedUserIds(trimmed, allUsers, explicitMentionIds);

  const now = new Date().toISOString();
  const commentId = `comm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const newComment: IssueComment = {
    id: commentId,
    issueId,
    authorId: actor.id,
    authorName: actor.name,
    authorAvatar: actor.avatar,
    content: trimmed,
    createdAt: now,
    parentId,
    mentions: mentionIds,
  };

  // 6. Generate canonical ActivityEvents
  const commentEvent = createActivityEvent(issueId, 'COMMENT_ADDED', actor, {
    commentId: newComment.id,
    reason: trimmed.length > 60 ? `${trimmed.substring(0, 60)}...` : trimmed,
  });

  const mentionEvents = mentionIds.map(userId => {
    const targetUser = allUsers.find(u => u.id === userId);
    return createActivityEvent(issueId, 'USER_MENTIONED', actor, {
      commentId: newComment.id,
      targetUserId: userId,
      targetUserName: targetUser?.name || 'Teammate',
      mentionedUserName: targetUser?.name || 'Teammate',
    });
  });

  return {
    success: true,
    comment: newComment,
    events: [commentEvent, ...mentionEvents],
  };
}

/**
 * Pure collaboration mutation boundary for deleting comments.
 * Enforces permissions (author or admin) and cascades to nested replies.
 */
export function executeDeleteComment(params: ExecuteDeleteCommentParams): ExecuteDeleteCommentResult {
  const { commentId, actor, existingComments } = params;

  // 1. Locate comment
  const targetComment = existingComments.find(c => c.id === commentId);
  if (!targetComment) {
    return {
      success: false,
      error: `Comment not found: "${commentId}".`,
      deletedCommentIds: [],
    };
  }

  // 2. Authorization Check
  const isAuthor = targetComment.authorId === actor.id;
  if (!canDeleteComment(actor.role, isAuthor)) {
    return {
      success: false,
      error: 'Unauthorized: You do not have permission to delete this comment.',
      deletedCommentIds: [],
    };
  }

  // 3. Collect comment ID and any child replies
  const replies = existingComments.filter(c => c.parentId === commentId);
  const deletedCommentIds = [commentId, ...replies.map(r => r.id)];

  return {
    success: true,
    deletedCommentIds,
  };
}
