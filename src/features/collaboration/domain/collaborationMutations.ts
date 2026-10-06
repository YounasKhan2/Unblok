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
 * Escapes characters for use in RegExp.
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extracts mention names from text using token and boundary-aware matching,
 * ordering users from longest name to shortest name to avoid prefix/substring collisions.
 */
export function extractMentionNames(content: string, allUsers: User[]): string[] {
  if (!content || allUsers.length === 0) return [];
  const validUsers = allUsers
    .filter(u => u.name && u.name.trim().length > 0)
    .slice()
    .sort((a, b) => b.name.length - a.name.length);

  if (validUsers.length === 0) return [];

  const namesPattern = validUsers.map(u => escapeRegex(u.name)).join('|');
  const mentionRegex = new RegExp(
    `(?<=^|[\\s(\\[{\"'<])@(${namesPattern})(?=$|[\\s.,!?:;)\\]}\"'>])`,
    'gi'
  );

  const matchedNames: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = mentionRegex.exec(content)) !== null) {
    if (match[1]) {
      matchedNames.push(match[1]);
    }
  }
  return matchedNames;
}

/**
 * Deterministically reconciles selected user IDs against the comment text content.
 * Retains only those selected user IDs whose mention tokens (@Name) are still present
 * in the text (boundary and name-collision aware).
 */
export function reconcileSelectedMentions(
  content: string,
  selectedUsers: User[],
  allUsers: User[]
): string[] {
  if (!content.trim() || selectedUsers.length === 0) return [];
  const namesInText = new Set(
    extractMentionNames(content, allUsers).map(n => n.toLowerCase())
  );
  const reconciledIds = new Set<string>();
  for (const user of selectedUsers) {
    if (namesInText.has(user.name.toLowerCase())) {
      reconciledIds.add(user.id);
    }
  }
  return Array.from(reconciledIds);
}

/**
 * Parses user mentions from content by matching `@UserName` against known users in the workspace.
 * Uses boundary-aware matching, prioritizing longer user names to prevent prefix collisions
 * (e.g., 'Sarah Chen' over 'Sarah', 'Anna' over 'Ann').
 * Deduplicates multiple mentions of the same user.
 * Accepts authoritative explicit mention IDs (e.g. from autocomplete picker) validated against allUsers.
 */
export function extractMentionedUserIds(
  content: string,
  allUsers: User[],
  explicitMentionIds?: string[]
): string[] {
  const matchedUserIds = new Set<string>();

  // 1. Authoritative explicit mention IDs (validated against allUsers)
  if (explicitMentionIds && explicitMentionIds.length > 0) {
    for (const id of explicitMentionIds) {
      if (allUsers.some(u => u.id === id)) {
        matchedUserIds.add(id);
      }
    }
  }

  // 2. Token / boundary-aware fallback parsing for free-typed mentions
  if (content && allUsers.length > 0) {
    const validUsers = allUsers
      .filter(u => u.name && u.name.trim().length > 0)
      .slice()
      .sort((a, b) => b.name.length - a.name.length);

    if (validUsers.length > 0) {
      const namesPattern = validUsers.map(u => escapeRegex(u.name)).join('|');
      const mentionRegex = new RegExp(
        `(?<=^|[\\s(\\[{\"'<])@(${namesPattern})(?=$|[\\s.,!?:;)\\]}\"'>])`,
        'gi'
      );

      let match: RegExpExecArray | null;
      while ((match = mentionRegex.exec(content)) !== null) {
        const matchedName = match[1];
        if (matchedName) {
          const matchedUser = validUsers.find(
            u => u.name.toLowerCase() === matchedName.toLowerCase()
          );
          if (matchedUser) {
            matchedUserIds.add(matchedUser.id);
          }
        }
      }
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
