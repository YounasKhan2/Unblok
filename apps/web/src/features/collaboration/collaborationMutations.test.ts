/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  executeAddComment,
  executeDeleteComment,
  reconcileSelectedMentions,
  extractMentionedUserIds,
  extractMentionNames,
} from './domain/collaborationMutations';
import { User, Issue, IssueComment } from '../../types';

describe('UX-06 Collaboration Mutation Boundary', () => {
  const adminUser: User = {
    id: 'usr_admin',
    name: 'Sarah Chen',
    email: 'sarah@acme.internal',
    avatar: '',
    role: 'ADMIN',
    teamId: 'team_eng',
  };

  const memberUser: User = {
    id: 'usr_member',
    name: 'Elena Rostova',
    email: 'elena@acme.internal',
    avatar: '',
    role: 'MEMBER',
    teamId: 'team_inf',
  };

  const observerUser: User = {
    id: 'usr_observer',
    name: 'Aisha Patel',
    email: 'aisha@acme.internal',
    avatar: '',
    role: 'OBSERVER',
    teamId: 'team_web',
  };

  const allUsers = [adminUser, memberUser, observerUser];

  const sampleIssue: Issue = {
    id: 'iss_1',
    key: 'ENG-1',
    projectId: 'proj_1',
    teamId: 'team_eng',
    title: 'Test issue',
    description: 'Test description',
    state: 'TODO',
    priority: 'HIGH',
    creatorId: 'usr_admin',
    createdAt: '2026-10-06T09:00:00.000Z',
    updatedAt: '2026-10-06T09:00:00.000Z',
    version: 1,
  };

  const otherIssue: Issue = {
    id: 'iss_2',
    key: 'ENG-2',
    projectId: 'proj_1',
    teamId: 'team_eng',
    title: 'Other issue',
    description: 'Other description',
    state: 'TODO',
    priority: 'MEDIUM',
    creatorId: 'usr_admin',
    createdAt: '2026-10-06T09:00:00.000Z',
    updatedAt: '2026-10-06T09:00:00.000Z',
    version: 1,
  };

  const issues = [sampleIssue, otherIssue];

  const parentComment: IssueComment = {
    id: 'comm_root',
    issueId: 'iss_1',
    authorId: 'usr_member',
    authorName: 'Elena Rostova',
    content: 'Initial technical note',
    createdAt: '2026-10-06T09:15:00.000Z',
  };

  // 1. MEMBER can comment
  it('1. MEMBER role is authorized to author comments', () => {
    const res = executeAddComment({
      issueId: 'iss_1',
      content: 'Member comment content',
      actor: memberUser,
      allUsers,
      issues,
      existingComments: [],
    });

    expect(res.success).toBe(true);
    expect(res.comment).toBeDefined();
    expect(res.comment?.authorId).toBe('usr_member');
  });

  // 2. ADMIN can comment
  it('2. ADMIN role is authorized to author comments', () => {
    const res = executeAddComment({
      issueId: 'iss_1',
      content: 'Admin comment content',
      actor: adminUser,
      allUsers,
      issues,
      existingComments: [],
    });

    expect(res.success).toBe(true);
    expect(res.comment).toBeDefined();
    expect(res.comment?.authorId).toBe('usr_admin');
  });

  // 3. OBSERVER cannot comment
  it('3. OBSERVER role is strictly rejected from authoring comments at mutation boundary', () => {
    const res = executeAddComment({
      issueId: 'iss_1',
      content: 'Observer comment attempt',
      actor: observerUser,
      allUsers,
      issues,
      existingComments: [],
    });

    expect(res.success).toBe(false);
    expect(res.comment).toBeUndefined();
    expect(res.error).toContain('Observers have read-only access');
    expect(res.events).toHaveLength(0);
  });

  // 4. Empty comment rejected
  it('4. empty or whitespace-only comment is rejected', () => {
    const res = executeAddComment({
      issueId: 'iss_1',
      content: '   \n   ',
      actor: memberUser,
      allUsers,
      issues,
      existingComments: [],
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('cannot be empty');
  });

  // 5. Invalid issue rejected
  it('5. comment for non-existent issue is rejected', () => {
    const res = executeAddComment({
      issueId: 'iss_invalid_999',
      content: 'Comment content',
      actor: memberUser,
      allUsers,
      issues,
      existingComments: [],
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('Issue not found');
  });

  // 6. Valid reply accepted
  it('6. valid reply to existing comment on same issue is accepted', () => {
    const res = executeAddComment({
      issueId: 'iss_1',
      content: 'Replying to root note',
      parentId: 'comm_root',
      actor: memberUser,
      allUsers,
      issues,
      existingComments: [parentComment],
    });

    expect(res.success).toBe(true);
    expect(res.comment?.parentId).toBe('comm_root');
  });

  // 7. Reply parent must belong to same issue
  it('7. reply is rejected if parent comment belongs to a different issue', () => {
    const otherIssueParent: IssueComment = {
      id: 'comm_other_parent',
      issueId: 'iss_2',
      authorId: 'usr_member',
      authorName: 'Elena Rostova',
      content: 'Parent on other issue',
      createdAt: '2026-10-06T09:20:00.000Z',
    };

    const res = executeAddComment({
      issueId: 'iss_1',
      content: 'Cross-issue reply attempt',
      parentId: 'comm_other_parent',
      actor: memberUser,
      allUsers,
      issues,
      existingComments: [otherIssueParent],
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('belongs to a different issue');
  });

  // 8. Invalid parent rejected
  it('8. reply with non-existent parent ID is rejected', () => {
    const res = executeAddComment({
      issueId: 'iss_1',
      content: 'Reply with missing parent',
      parentId: 'comm_nonexistent',
      actor: memberUser,
      allUsers,
      issues,
      existingComments: [parentComment],
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('Parent comment not found');
  });

  // 9. Mention IDs deduplicated
  it('9. multiple mentions of the same user in one comment are deduplicated', () => {
    const res = executeAddComment({
      issueId: 'iss_1',
      content: 'Paging @Sarah Chen and again @Sarah Chen please check!',
      actor: memberUser,
      allUsers,
      issues,
      existingComments: [],
    });

    expect(res.success).toBe(true);
    expect(res.comment?.mentions).toEqual(['usr_admin']);
  });

  // 10. Mentioned user must exist
  it('10. mentions of non-existent users are ignored in target resolution', () => {
    const res = executeAddComment({
      issueId: 'iss_1',
      content: 'Paging @NonExistentUser and @Sarah Chen',
      actor: memberUser,
      allUsers,
      issues,
      existingComments: [],
    });

    expect(res.success).toBe(true);
    expect(res.comment?.mentions).toEqual(['usr_admin']);
  });

  // 11. COMMENT_ADDED emitted correctly
  it('11. COMMENT_ADDED activity event is emitted with commentId and reason', () => {
    const res = executeAddComment({
      issueId: 'iss_1',
      content: 'A technical observation about latency',
      actor: memberUser,
      allUsers,
      issues,
      existingComments: [],
    });

    expect(res.success).toBe(true);
    const commentEvent = res.events.find(e => e.eventType === 'COMMENT_ADDED');
    expect(commentEvent).toBeDefined();
    expect(commentEvent?.details.commentId).toBe(res.comment?.id);
    expect(commentEvent?.details.reason).toBe('A technical observation about latency');
  });

  // 12. USER_MENTIONED emitted once per target user
  it('12. USER_MENTIONED emitted exactly once per target user across multiple mentions', () => {
    const res = executeAddComment({
      issueId: 'iss_1',
      content: '@Sarah Chen and @Aisha Patel please check this out @Sarah Chen',
      actor: memberUser,
      allUsers,
      issues,
      existingComments: [],
    });

    expect(res.success).toBe(true);
    const mentionEvents = res.events.filter(e => e.eventType === 'USER_MENTIONED');
    expect(mentionEvents).toHaveLength(2);

    const mentionedUserIds = mentionEvents.map(e => e.details.targetUserId);
    expect(mentionedUserIds).toContain('usr_admin');
    expect(mentionedUserIds).toContain('usr_observer');
  });

  // 13. Mention event contains stable target user ID
  it('13. USER_MENTIONED event contains stable targetUserId', () => {
    const res = executeAddComment({
      issueId: 'iss_1',
      content: 'Attention @Sarah Chen',
      actor: memberUser,
      allUsers,
      issues,
      existingComments: [],
    });

    const mentionEvent = res.events.find(e => e.eventType === 'USER_MENTIONED');
    expect(mentionEvent?.details.targetUserId).toBe('usr_admin');
    expect(mentionEvent?.details.targetUserName).toBe('Sarah Chen');
  });

  // 14. Unauthorized delete rejected
  it("14. user cannot delete another member's comment", () => {
    const otherComment: IssueComment = {
      id: 'comm_other',
      issueId: 'iss_1',
      authorId: 'usr_admin',
      authorName: 'Sarah Chen',
      content: 'Admin note',
      createdAt: '2026-10-06T09:00:00.000Z',
    };

    const res = executeDeleteComment({
      commentId: 'comm_other',
      actor: memberUser, // Elena (member) tries to delete Sarah's comment
      existingComments: [otherComment],
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('Unauthorized');
  });

  // 15. Author delete accepted
  it('15. comment author is authorized to delete their own comment and cascades to replies', () => {
    const childReply: IssueComment = {
      id: 'comm_reply_1',
      issueId: 'iss_1',
      authorId: 'usr_admin',
      authorName: 'Sarah Chen',
      content: 'A reply',
      createdAt: '2026-10-06T09:30:00.000Z',
      parentId: 'comm_root',
    };

    const res = executeDeleteComment({
      commentId: 'comm_root',
      actor: memberUser, // Elena is author of comm_root
      existingComments: [parentComment, childReply],
    });

    expect(res.success).toBe(true);
    expect(res.deletedCommentIds).toContain('comm_root');
    expect(res.deletedCommentIds).toContain('comm_reply_1');
  });

  // 16. Observer delete rejected
  it('16. OBSERVER cannot delete any comment even if author', () => {
    const observerComment: IssueComment = {
      id: 'comm_obs',
      issueId: 'iss_1',
      authorId: 'usr_observer',
      authorName: 'Aisha Patel',
      content: 'Observer note',
      createdAt: '2026-10-06T09:00:00.000Z',
    };

    const res = executeDeleteComment({
      commentId: 'comm_obs',
      actor: observerUser,
      existingComments: [observerComment],
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('Unauthorized');
  });

  describe('UX-06 Collaboration Mention Identity & Fallback Integrity', () => {
    const annUser: User = {
      id: 'usr_ann',
      name: 'Ann',
      email: 'ann@acme.internal',
      avatar: '',
      role: 'MEMBER',
      teamId: 'team_eng',
    };

    const annaUser: User = {
      id: 'usr_anna',
      name: 'Anna',
      email: 'anna@acme.internal',
      avatar: '',
      role: 'MEMBER',
      teamId: 'team_eng',
    };

    const sarahSingleUser: User = {
      id: 'usr_sarah_single',
      name: 'Sarah',
      email: 'sarah.solo@acme.internal',
      avatar: '',
      role: 'MEMBER',
      teamId: 'team_eng',
    };

    const davidUser: User = {
      id: 'usr_david',
      name: 'David Kim',
      email: 'david@acme.internal',
      avatar: '',
      role: 'MEMBER',
      teamId: 'team_eng',
    };

    const collisionUsers = [
      adminUser,
      memberUser,
      observerUser,
      annUser,
      annaUser,
      sarahSingleUser,
      davidUser,
    ];

    // 17. Prefix Collision: Ann vs Anna
    it('17. prefix collision: @Anna mentions only Anna and strictly excludes Ann', () => {
      const res = executeAddComment({
        issueId: 'iss_1',
        content: '@Anna please review the migration',
        actor: memberUser,
        allUsers: collisionUsers,
        issues,
        existingComments: [],
      });

      expect(res.success).toBe(true);
      expect(res.comment?.mentions).toEqual(['usr_anna']);
      const mentionEvents = res.events.filter(e => e.eventType === 'USER_MENTIONED');
      expect(mentionEvents).toHaveLength(1);
      expect(mentionEvents[0].details.targetUserId).toBe('usr_anna');
      expect(mentionEvents[0].details.targetUserName).toBe('Anna');
    });

    // 18. Full-Name Collision: Sarah vs Sarah Chen
    it('18. full-name collision: @Sarah Chen mentions only Sarah Chen and strictly excludes Sarah', () => {
      const res = executeAddComment({
        issueId: 'iss_1',
        content: '@Sarah Chen please review the schema',
        actor: memberUser,
        allUsers: collisionUsers,
        issues,
        existingComments: [],
      });

      expect(res.success).toBe(true);
      expect(res.comment?.mentions).toEqual(['usr_admin']);
      const mentionEvents = res.events.filter(e => e.eventType === 'USER_MENTIONED');
      expect(mentionEvents).toHaveLength(1);
      expect(mentionEvents[0].details.targetUserId).toBe('usr_admin');
      expect(mentionEvents[0].details.targetUserName).toBe('Sarah Chen');
    });

    // 19. Explicit Stable ID from Autocomplete Picker
    it('19. explicit stable ID from picker is authoritative and emits correct targetUserId', () => {
      const res = executeAddComment({
        issueId: 'iss_1',
        content: '@Sarah Chen please look at this query plan',
        actor: memberUser,
        allUsers: collisionUsers,
        issues,
        existingComments: [],
        explicitMentionIds: ['usr_admin'],
      });

      expect(res.success).toBe(true);
      expect(res.comment?.mentions).toEqual(['usr_admin']);
      const mentionEvent = res.events.find(e => e.eventType === 'USER_MENTIONED');
      expect(mentionEvent).toBeDefined();
      expect(mentionEvent?.details.targetUserId).toBe('usr_admin');
      expect(mentionEvent?.details.targetUserName).toBe('Sarah Chen');
    });

    // 20. Removed Mention: Select Sarah, remove text before submission
    it('20. removed mention: removing mention text reconciles out stable ID and emits no mention event', () => {
      // Simulate user having picked Sarah Chen originally
      const selectedUsers = [adminUser];
      // User deleted "@Sarah Chen" before submitting
      const textAfterRemoval = 'Just an update without any mention';
      const reconciledIds = reconcileSelectedMentions(textAfterRemoval, selectedUsers, collisionUsers);

      expect(reconciledIds).toHaveLength(0);

      const res = executeAddComment({
        issueId: 'iss_1',
        content: textAfterRemoval,
        actor: memberUser,
        allUsers: collisionUsers,
        issues,
        existingComments: [],
        explicitMentionIds: reconciledIds,
      });

      expect(res.success).toBe(true);
      expect(res.comment?.mentions).toEqual([]);
      const mentionEvents = res.events.filter(e => e.eventType === 'USER_MENTIONED');
      expect(mentionEvents).toHaveLength(0);
    });

    // 21. Duplicate Mention
    it('21. duplicate mention: selecting or typing same user multiple times produces single ID and single event', () => {
      const res = executeAddComment({
        issueId: 'iss_1',
        content: '@Sarah Chen please verify and @Sarah Chen ping once done',
        actor: memberUser,
        allUsers: collisionUsers,
        issues,
        existingComments: [],
        explicitMentionIds: ['usr_admin', 'usr_admin'],
      });

      expect(res.success).toBe(true);
      expect(res.comment?.mentions).toEqual(['usr_admin']);
      const mentionEvents = res.events.filter(e => e.eventType === 'USER_MENTIONED');
      expect(mentionEvents).toHaveLength(1);
      expect(mentionEvents[0].details.targetUserId).toBe('usr_admin');
    });

    // 22. Multiple Users: Sarah + David
    it('22. multiple users: distinct users receive stable IDs and distinct USER_MENTIONED events', () => {
      const res = executeAddComment({
        issueId: 'iss_1',
        content: '@Sarah Chen and @David Kim please coordinate on this',
        actor: memberUser,
        allUsers: collisionUsers,
        issues,
        existingComments: [],
        explicitMentionIds: ['usr_admin', 'usr_david'],
      });

      expect(res.success).toBe(true);
      expect(res.comment?.mentions).toEqual(expect.arrayContaining(['usr_admin', 'usr_david']));
      expect(res.comment?.mentions).toHaveLength(2);
      const mentionEvents = res.events.filter(e => e.eventType === 'USER_MENTIONED');
      expect(mentionEvents).toHaveLength(2);
      const targetIds = mentionEvents.map(e => e.details.targetUserId);
      expect(targetIds).toContain('usr_admin');
      expect(targetIds).toContain('usr_david');
    });

    // 23. Invalid Explicit ID
    it('23. invalid explicit ID: unknown user ID is ignored and generates no mention event', () => {
      const res = executeAddComment({
        issueId: 'iss_1',
        content: 'Testing invalid explicit mention ID',
        actor: memberUser,
        allUsers: collisionUsers,
        issues,
        existingComments: [],
        explicitMentionIds: ['usr_invalid_999'],
      });

      expect(res.success).toBe(true);
      expect(res.comment?.mentions).toEqual([]);
      const mentionEvents = res.events.filter(e => e.eventType === 'USER_MENTIONED');
      expect(mentionEvents).toHaveLength(0);
    });

    // 24. Observer cannot comment even if explicit mention IDs provided
    it('24. OBSERVER cannot comment regardless of explicit mention IDs supplied directly', () => {
      const res = executeAddComment({
        issueId: 'iss_1',
        content: 'Observer attempt with mentions',
        actor: observerUser,
        allUsers: collisionUsers,
        issues,
        existingComments: [],
        explicitMentionIds: ['usr_admin'],
      });

      expect(res.success).toBe(false);
      expect(res.comment).toBeUndefined();
      expect(res.error).toContain('Observers have read-only access');
      expect(res.events).toHaveLength(0);
    });

    // 25. Extraction and reconciliation helper unit tests
    it('25. reconcileSelectedMentions properly reconciles multiple selected users against text', () => {
      const selected = [adminUser, davidUser];
      const text = 'Hey @David Kim, could you review this?';
      const result = reconcileSelectedMentions(text, selected, collisionUsers);

      expect(result).toEqual(['usr_david']);
      expect(result).not.toContain('usr_admin');
    });

    it('26. extractMentionNames ignores email addresses and nonexistent users', () => {
      const text = 'Contact support@acme.internal or ping @NonExistentUser or @Anna';
      const names = extractMentionNames(text, collisionUsers);

      expect(names).toEqual(['Anna']);
    });
  });
});
