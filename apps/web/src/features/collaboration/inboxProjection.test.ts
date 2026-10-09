/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { deriveInboxItems, groupInboxItems } from './domain/inboxProjection';
import { filterInboxByView, selectUnreadInboxCount } from './selectors/inboxSelectors';
import { ActivityEvent, Issue, IssueComment, User } from '../../types';
import { InboxReceipt } from './types';

describe('UX-06 Inbox Projection & Deterministic Relevance', () => {
  const sarahUser: User = {
    id: 'usr_sarah',
    name: 'Sarah Chen',
    email: 'sarah@acme.internal',
    avatar: '',
    role: 'ADMIN',
    teamId: 'team_eng',
  };

  const elenaUser: User = {
    id: 'usr_elena',
    name: 'Elena Rostova',
    email: 'elena@acme.internal',
    avatar: '',
    role: 'MEMBER',
    teamId: 'team_inf',
  };

  const davidUser: User = {
    id: 'usr_david',
    name: 'David Kim',
    email: 'david@acme.internal',
    avatar: '',
    role: 'MEMBER',
    teamId: 'team_eng',
  };

  const allUsers = [sarahUser, elenaUser, davidUser];

  const issueEng1: Issue = {
    id: 'iss_eng_1',
    key: 'ENG-1',
    projectId: 'proj_eng',
    teamId: 'team_eng',
    title: 'Token Revocation API',
    description: 'Stateless session tokens',
    state: 'TODO',
    priority: 'HIGH',
    assigneeId: 'usr_sarah',
    creatorId: 'usr_david',
    createdAt: '2026-10-01T09:00:00.000Z',
    updatedAt: '2026-10-01T09:00:00.000Z',
    version: 1,
  };

  const issueEng2: Issue = {
    id: 'iss_eng_2',
    key: 'ENG-2',
    projectId: 'proj_eng',
    teamId: 'team_eng',
    title: 'RBAC Middleware',
    description: 'Fastify middleware guards',
    state: 'IN_PROGRESS',
    priority: 'URGENT',
    assigneeId: 'usr_elena',
    creatorId: 'usr_sarah',
    createdAt: '2026-10-01T09:00:00.000Z',
    updatedAt: '2026-10-01T09:00:00.000Z',
    version: 1,
  };

  const allIssues = [issueEng1, issueEng2];

  const baseComments: IssueComment[] = [
    {
      id: 'comm_1',
      issueId: 'iss_eng_1',
      authorId: 'usr_david',
      authorName: 'David Kim',
      content: 'Hey @Sarah Chen please review the JWT blacklist schema.',
      createdAt: '2026-10-06T10:00:00.000Z',
      mentions: ['usr_sarah'],
    },
    {
      id: 'comm_2',
      issueId: 'iss_eng_2',
      authorId: 'usr_sarah',
      authorName: 'Sarah Chen',
      content: 'Hey @Elena Rostova can you verify postgres replicas?',
      createdAt: '2026-10-06T11:00:00.000Z',
      mentions: ['usr_elena'],
    },
  ];

  // 1. Direct mention creates relevant Inbox projection
  it('1. direct mention creates relevant Inbox projection for the target user', () => {
    const activities: ActivityEvent[] = [
      {
        id: 'act_1',
        issueId: 'iss_eng_1',
        eventType: 'USER_MENTIONED',
        userId: 'usr_david',
        userName: 'David Kim',
        timestamp: '2026-10-06T10:00:00.000Z',
        details: {
          commentId: 'comm_1',
          targetUserId: 'usr_sarah',
          targetUserName: 'Sarah Chen',
        },
      },
    ];

    const items = deriveInboxItems({
      activities,
      issues: allIssues,
      comments: baseComments,
      users: allUsers,
      currentUser: sarahUser,
      receipts: {},
    });

    expect(items).toHaveLength(1);
    expect(items[0].kind).toBe('MENTION');
    expect(items[0].issueKey).toBe('ENG-1');
    expect(items[0].actorName).toBe('David Kim');
    expect(items[0].contentSnippet).toContain('@Sarah Chen');
    expect(items[0].isRead).toBe(false);
    expect(items[0].isArchived).toBe(false);
  });

  // 2. Mention for another user excluded
  it('2. mention for another user excluded from current user inbox', () => {
    const activities: ActivityEvent[] = [
      {
        id: 'act_2',
        issueId: 'iss_eng_2',
        eventType: 'USER_MENTIONED',
        userId: 'usr_sarah',
        userName: 'Sarah Chen',
        timestamp: '2026-10-06T11:00:00.000Z',
        details: {
          commentId: 'comm_2',
          targetUserId: 'usr_elena',
          targetUserName: 'Elena Rostova',
        },
      },
    ];

    const items = deriveInboxItems({
      activities,
      issues: allIssues,
      comments: baseComments,
      users: allUsers,
      currentUser: sarahUser,
      receipts: {},
    });

    expect(items).toHaveLength(0);
  });

  // 3. Duplicate mention does not create duplicate user notification
  it('3. duplicate mention does not create duplicate user notification for same comment', () => {
    const activities: ActivityEvent[] = [
      {
        id: 'act_1a',
        issueId: 'iss_eng_1',
        eventType: 'USER_MENTIONED',
        userId: 'usr_david',
        userName: 'David Kim',
        timestamp: '2026-10-06T10:00:00.000Z',
        details: {
          commentId: 'comm_1',
          targetUserId: 'usr_sarah',
        },
      },
      {
        id: 'act_1b',
        issueId: 'iss_eng_1',
        eventType: 'USER_MENTIONED',
        userId: 'usr_david',
        userName: 'David Kim',
        timestamp: '2026-10-06T10:00:00.000Z',
        details: {
          commentId: 'comm_1',
          targetUserId: 'usr_sarah',
        },
      },
    ];

    const items = deriveInboxItems({
      activities,
      issues: allIssues,
      comments: baseComments,
      users: allUsers,
      currentUser: sarahUser,
      receipts: {},
    });

    expect(items).toHaveLength(1);
  });

  // 4. Assignment to current user included
  it('4. assignment to current user is included in inbox projection', () => {
    const activities: ActivityEvent[] = [
      {
        id: 'act_assign',
        issueId: 'iss_eng_1',
        eventType: 'ASSIGNEE_CHANGED',
        userId: 'usr_david',
        userName: 'David Kim',
        timestamp: '2026-10-06T12:00:00.000Z',
        details: {
          from: 'Unassigned',
          to: 'Sarah Chen',
          toAssigneeId: 'usr_sarah',
        },
      },
    ];

    const items = deriveInboxItems({
      activities,
      issues: allIssues,
      comments: baseComments,
      users: allUsers,
      currentUser: sarahUser,
      receipts: {},
    });

    expect(items).toHaveLength(1);
    expect(items[0].kind).toBe('ASSIGNMENT');
    expect(items[0].actorName).toBe('David Kim');
  });

  // 5. Assignment to someone else excluded
  it('5. assignment to someone else is excluded', () => {
    const activities: ActivityEvent[] = [
      {
        id: 'act_assign_other',
        issueId: 'iss_eng_2',
        eventType: 'ASSIGNEE_CHANGED',
        userId: 'usr_david',
        userName: 'David Kim',
        timestamp: '2026-10-06T12:00:00.000Z',
        details: {
          from: 'Unassigned',
          to: 'Elena Rostova',
          toAssigneeId: 'usr_elena',
        },
      },
    ];

    const items = deriveInboxItems({
      activities,
      issues: allIssues,
      comments: baseComments,
      users: allUsers,
      currentUser: sarahUser,
      receipts: {},
    });

    expect(items).toHaveLength(0);
  });

  // 6. Self-noise rule
  it('6. self-noise rule: actions performed by current user on themselves are suppressed', () => {
    const activities: ActivityEvent[] = [
      {
        id: 'act_self_assign',
        issueId: 'iss_eng_1',
        eventType: 'ASSIGNEE_CHANGED',
        userId: 'usr_sarah',
        userName: 'Sarah Chen',
        timestamp: '2026-10-06T12:00:00.000Z',
        details: {
          from: 'Unassigned',
          to: 'Sarah Chen',
          toAssigneeId: 'usr_sarah',
        },
      },
      {
        id: 'act_self_mention',
        issueId: 'iss_eng_1',
        eventType: 'USER_MENTIONED',
        userId: 'usr_sarah',
        userName: 'Sarah Chen',
        timestamp: '2026-10-06T12:05:00.000Z',
        details: {
          commentId: 'comm_1',
          targetUserId: 'usr_sarah',
        },
      },
    ];

    const items = deriveInboxItems({
      activities,
      issues: allIssues,
      comments: baseComments,
      users: allUsers,
      currentUser: sarahUser,
      receipts: {},
    });

    expect(items).toHaveLength(0);
  });

  // 7. Blocked event relevance
  it('7. blocked event on issue assigned to current user is included', () => {
    const activities: ActivityEvent[] = [
      {
        id: 'act_blocked',
        issueId: 'iss_eng_1', // assigned to sarah
        eventType: 'ISSUE_BLOCKED',
        userId: 'usr_david',
        userName: 'David Kim',
        timestamp: '2026-10-06T13:00:00.000Z',
        details: {
          from: 0,
          to: 1,
          reason: 'Prerequisite task added',
        },
      },
    ];

    const items = deriveInboxItems({
      activities,
      issues: allIssues,
      comments: baseComments,
      users: allUsers,
      currentUser: sarahUser,
      receipts: {},
    });

    expect(items).toHaveLength(1);
    expect(items[0].kind).toBe('DEPENDENCY_BLOCKED');
  });

  // 8. Unblocked event relevance
  it('8. unblocked event on issue assigned to current user is included', () => {
    const activities: ActivityEvent[] = [
      {
        id: 'act_unblocked',
        issueId: 'iss_eng_1', // assigned to sarah
        eventType: 'ISSUE_UNBLOCKED',
        userId: 'usr_david',
        userName: 'David Kim',
        timestamp: '2026-10-06T13:30:00.000Z',
        details: {
          from: 1,
          to: 0,
          reason: 'All blockers resolved',
        },
      },
    ];

    const items = deriveInboxItems({
      activities,
      issues: allIssues,
      comments: baseComments,
      users: allUsers,
      currentUser: sarahUser,
      receipts: {},
    });

    expect(items).toHaveLength(1);
    expect(items[0].kind).toBe('DEPENDENCY_UNBLOCKED');
  });

  // 9. Irrelevant dependency event excluded
  it('9. irrelevant dependency event on issue assigned to another user is excluded', () => {
    const activities: ActivityEvent[] = [
      {
        id: 'act_blocked_other',
        issueId: 'iss_eng_2', // assigned to elena
        eventType: 'ISSUE_BLOCKED',
        userId: 'usr_david',
        userName: 'David Kim',
        timestamp: '2026-10-06T13:00:00.000Z',
        details: { from: 0, to: 1 },
      },
    ];

    const items = deriveInboxItems({
      activities,
      issues: allIssues,
      comments: baseComments,
      users: allUsers,
      currentUser: sarahUser,
      receipts: {},
    });

    expect(items).toHaveLength(0);
  });

  // 10. Relevant cycle update included
  it('10. relevant cycle update for current user issue is included', () => {
    const activities: ActivityEvent[] = [
      {
        id: 'act_cycle',
        issueId: 'iss_eng_1', // assigned to sarah
        eventType: 'CYCLE_ROLLED_OVER',
        userId: 'usr_david',
        userName: 'David Kim',
        timestamp: '2026-10-06T14:00:00.000Z',
        details: {
          sourceCycleId: 'cycle_23',
          targetCycleId: 'cycle_24',
          reason: 'Rolled over into active sprint',
        },
      },
    ];

    const items = deriveInboxItems({
      activities,
      issues: allIssues,
      comments: baseComments,
      users: allUsers,
      currentUser: sarahUser,
      receipts: {},
    });

    expect(items).toHaveLength(1);
    expect(items[0].kind).toBe('CYCLE_UPDATE');
  });

  // 11. Irrelevant cycle update excluded
  it('11. cycle update on issue assigned to someone else is excluded', () => {
    const activities: ActivityEvent[] = [
      {
        id: 'act_cycle_other',
        issueId: 'iss_eng_2', // assigned to elena
        eventType: 'CYCLE_ROLLED_OVER',
        userId: 'usr_david',
        userName: 'David Kim',
        timestamp: '2026-10-06T14:00:00.000Z',
        details: { targetCycleId: 'cycle_24' },
      },
    ];

    const items = deriveInboxItems({
      activities,
      issues: allIssues,
      comments: baseComments,
      users: allUsers,
      currentUser: sarahUser,
      receipts: {},
    });

    expect(items).toHaveLength(0);
  });

  // 12. Newest-first ordering
  it('12. derived items are sorted newest-first', () => {
    const activities: ActivityEvent[] = [
      {
        id: 'act_old',
        issueId: 'iss_eng_1',
        eventType: 'ISSUE_BLOCKED',
        userId: 'usr_david',
        userName: 'David Kim',
        timestamp: '2026-10-01T10:00:00.000Z',
        details: { from: 0, to: 1 },
      },
      {
        id: 'act_new',
        issueId: 'iss_eng_1',
        eventType: 'ISSUE_UNBLOCKED',
        userId: 'usr_david',
        userName: 'David Kim',
        timestamp: '2026-10-06T10:00:00.000Z',
        details: { from: 1, to: 0 },
      },
    ];

    const items = deriveInboxItems({
      activities,
      issues: allIssues,
      comments: baseComments,
      users: allUsers,
      currentUser: sarahUser,
      receipts: {},
    });

    expect(items).toHaveLength(2);
    expect(items[0].id).toBe('act_new');
    expect(items[1].id).toBe('act_old');
  });

  // 13. Today classification
  it('13. groupInboxItems partitions items from reference date into Today', () => {
    const items = [
      {
        id: 'act_today',
        sourceActivityId: 'act_today',
        kind: 'MENTION' as const,
        issueId: 'iss_eng_1',
        issueKey: 'ENG-1',
        issueTitle: 'Title',
        createdAt: '2026-10-06T12:00:00.000Z',
        isRead: false,
        isArchived: false,
      },
    ];

    const grouped = groupInboxItems(items, new Date('2026-10-06T15:00:00.000Z'));
    expect(grouped.today).toHaveLength(1);
    expect(grouped.earlier).toHaveLength(0);
    expect(grouped.archived).toHaveLength(0);
  });

  // 14. Earlier classification
  it('14. groupInboxItems partitions older items into Earlier', () => {
    const items = [
      {
        id: 'act_older',
        sourceActivityId: 'act_older',
        kind: 'MENTION' as const,
        issueId: 'iss_eng_1',
        issueKey: 'ENG-1',
        issueTitle: 'Title',
        createdAt: '2026-10-02T12:00:00.000Z',
        isRead: false,
        isArchived: false,
      },
    ];

    const grouped = groupInboxItems(items, new Date('2026-10-06T15:00:00.000Z'));
    expect(grouped.today).toHaveLength(0);
    expect(grouped.earlier).toHaveLength(1);
    expect(grouped.archived).toHaveLength(0);
  });

  // 15. Archived classification
  it('15. groupInboxItems partitions processed items into Archived', () => {
    const items = [
      {
        id: 'act_arch',
        sourceActivityId: 'act_arch',
        kind: 'MENTION' as const,
        issueId: 'iss_eng_1',
        issueKey: 'ENG-1',
        issueTitle: 'Title',
        createdAt: '2026-10-06T12:00:00.000Z',
        isRead: true,
        isArchived: true,
      },
    ];

    const grouped = groupInboxItems(items, new Date('2026-10-06T15:00:00.000Z'));
    expect(grouped.today).toHaveLength(0);
    expect(grouped.earlier).toHaveLength(0);
    expect(grouped.archived).toHaveLength(1);
  });

  // 16. Read state applied from receipt
  it('16. read state is applied from receipt correctly', () => {
    const activities: ActivityEvent[] = [
      {
        id: 'act_read_test',
        issueId: 'iss_eng_1',
        eventType: 'USER_MENTIONED',
        userId: 'usr_david',
        userName: 'David Kim',
        timestamp: '2026-10-06T10:00:00.000Z',
        details: {
          commentId: 'comm_1',
          targetUserId: 'usr_sarah',
        },
      },
    ];

    const receipts: Record<string, InboxReceipt> = {
      act_read_test: {
        userId: 'usr_sarah',
        sourceId: 'act_read_test',
        readAt: '2026-10-06T10:05:00.000Z',
      },
    };

    const items = deriveInboxItems({
      activities,
      issues: allIssues,
      comments: baseComments,
      users: allUsers,
      currentUser: sarahUser,
      receipts,
    });

    expect(items[0].isRead).toBe(true);
    expect(items[0].isArchived).toBe(false);
  });

  // 17. Archived state applied from receipt
  it('17. archived state is applied from receipt correctly', () => {
    const activities: ActivityEvent[] = [
      {
        id: 'act_arch_test',
        issueId: 'iss_eng_1',
        eventType: 'USER_MENTIONED',
        userId: 'usr_david',
        userName: 'David Kim',
        timestamp: '2026-10-06T10:00:00.000Z',
        details: {
          commentId: 'comm_1',
          targetUserId: 'usr_sarah',
        },
      },
    ];

    const receipts: Record<string, InboxReceipt> = {
      act_arch_test: {
        userId: 'usr_sarah',
        sourceId: 'act_arch_test',
        readAt: '2026-10-06T10:05:00.000Z',
        archivedAt: '2026-10-06T10:10:00.000Z',
      },
    };

    const items = deriveInboxItems({
      activities,
      issues: allIssues,
      comments: baseComments,
      users: allUsers,
      currentUser: sarahUser,
      receipts,
    });

    expect(items[0].isArchived).toBe(true);
    expect(items[0].isRead).toBe(true);
  });

  // 18. Deleted/missing referenced comment handled safely
  it('18. deleted/missing referenced comment is suppressed safely', () => {
    const activities: ActivityEvent[] = [
      {
        id: 'act_del_comment',
        issueId: 'iss_eng_1',
        eventType: 'USER_MENTIONED',
        userId: 'usr_david',
        userName: 'David Kim',
        timestamp: '2026-10-06T10:00:00.000Z',
        details: {
          commentId: 'comm_deleted_999',
          targetUserId: 'usr_sarah',
        },
      },
    ];

    const items = deriveInboxItems({
      activities,
      issues: allIssues,
      comments: baseComments, // does not have comm_deleted_999
      users: allUsers,
      currentUser: sarahUser,
      receipts: {},
    });

    expect(items).toHaveLength(0);
  });

  // 19. Missing issue handled safely
  it('19. missing issue in activity is handled safely and excluded', () => {
    const activities: ActivityEvent[] = [
      {
        id: 'act_missing_issue',
        issueId: 'iss_nonexistent',
        eventType: 'USER_MENTIONED',
        userId: 'usr_david',
        userName: 'David Kim',
        timestamp: '2026-10-06T10:00:00.000Z',
        details: {
          commentId: 'comm_1',
          targetUserId: 'usr_sarah',
        },
      },
    ];

    const items = deriveInboxItems({
      activities,
      issues: allIssues,
      comments: baseComments,
      users: allUsers,
      currentUser: sarahUser,
      receipts: {},
    });

    expect(items).toHaveLength(0);
  });

  // 20. Legacy activity metadata handled safely
  it('20. legacy activity metadata falling back to mentionedUserName is supported', () => {
    const activities: ActivityEvent[] = [
      {
        id: 'act_legacy',
        issueId: 'iss_eng_1',
        eventType: 'USER_MENTIONED',
        userId: 'usr_david',
        userName: 'David Kim',
        timestamp: '2026-10-06T10:00:00.000Z',
        details: {
          commentId: 'comm_1',
          mentionedUserName: 'Sarah Chen', // no targetUserId in legacy event
        },
      },
    ];

    const items = deriveInboxItems({
      activities,
      issues: allIssues,
      comments: baseComments,
      users: allUsers,
      currentUser: sarahUser,
      receipts: {},
    });

    expect(items).toHaveLength(1);
    expect(items[0].kind).toBe('MENTION');
  });

  // 21. Stable targetUserId is authoritative over display name differences
  it('21. stable targetUserId is authoritative even if display name differs or was updated', () => {
    const activities: ActivityEvent[] = [
      {
        id: 'act_stable_auth',
        issueId: 'iss_eng_1',
        eventType: 'USER_MENTIONED',
        userId: 'usr_david',
        userName: 'David Kim',
        timestamp: '2026-10-06T10:00:00.000Z',
        details: {
          commentId: 'comm_1',
          targetUserId: 'usr_sarah',
          targetUserName: 'Sarah C. (Old Name)',
        },
      },
    ];

    const items = deriveInboxItems({
      activities,
      issues: allIssues,
      comments: baseComments,
      users: allUsers,
      currentUser: sarahUser,
      receipts: {},
    });

    expect(items).toHaveLength(1);
    expect(items[0].kind).toBe('MENTION');
    expect(items[0].issueKey).toBe('ENG-1');
  });

  // 22. Stable targetUserId mismatch strictly excludes item even if display name is identical
  it('22. stable targetUserId mismatch strictly excludes notification even if name is identical', () => {
    const activities: ActivityEvent[] = [
      {
        id: 'act_mismatch',
        issueId: 'iss_eng_1',
        eventType: 'USER_MENTIONED',
        userId: 'usr_david',
        userName: 'David Kim',
        timestamp: '2026-10-06T10:00:00.000Z',
        details: {
          commentId: 'comm_1',
          targetUserId: 'usr_other_sarah', // Different Sarah
          targetUserName: 'Sarah Chen',
        },
      },
    ];

    const items = deriveInboxItems({
      activities,
      issues: allIssues,
      comments: baseComments,
      users: allUsers,
      currentUser: sarahUser, // usr_sarah
      receipts: {},
    });

    expect(items).toHaveLength(0);
  });
});
