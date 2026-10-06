/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { canComment, canDeleteComment, canProcessInboxReceipt } from './permissions';
import { executeAddComment, executeDeleteComment } from './domain/collaborationMutations';
import { markReceiptRead, markReceiptArchived } from './domain/receiptStorage';
import { User, Issue, IssueComment } from '../../types';

describe('UX-06 Collaboration Permissions & Role Boundaries', () => {
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

  const sampleComment: IssueComment = {
    id: 'comm_1',
    issueId: 'iss_1',
    authorId: 'usr_member',
    authorName: 'Elena Rostova',
    content: 'Member comment',
    createdAt: '2026-10-06T09:00:00.000Z',
  };

  describe('OBSERVER Role Constraints', () => {
    it('Observer cannot author comments via canComment check', () => {
      expect(canComment('OBSERVER')).toBe(false);
    });

    it('Observer cannot author comments at mutation boundary', () => {
      const res = executeAddComment({
        issueId: 'iss_1',
        content: 'Observer attempt',
        actor: observerUser,
        allUsers: [adminUser, memberUser, observerUser],
        issues: [sampleIssue],
        existingComments: [],
      });
      expect(res.success).toBe(false);
      expect(res.error).toContain('Observers have read-only access');
    });

    it('Observer cannot author replies at mutation boundary', () => {
      const res = executeAddComment({
        issueId: 'iss_1',
        content: 'Observer reply attempt',
        parentId: 'comm_1',
        actor: observerUser,
        allUsers: [adminUser, memberUser, observerUser],
        issues: [sampleIssue],
        existingComments: [sampleComment],
      });
      expect(res.success).toBe(false);
      expect(res.error).toContain('Observers have read-only access');
    });

    it('Observer cannot delete any comments', () => {
      expect(canDeleteComment('OBSERVER', true)).toBe(false);
      expect(canDeleteComment('OBSERVER', false)).toBe(false);

      const res = executeDeleteComment({
        commentId: 'comm_1',
        actor: observerUser,
        existingComments: [sampleComment],
      });
      expect(res.success).toBe(false);
    });

    it('Observer CAN process personal receipts (mark read and archive)', () => {
      expect(canProcessInboxReceipt()).toBe(true);

      const receipts1 = markReceiptRead({}, observerUser.id, 'act_1');
      expect(receipts1['act_1'].userId).toBe(observerUser.id);
      expect(receipts1['act_1'].readAt).toBeDefined();

      const receipts2 = markReceiptArchived(receipts1, observerUser.id, 'act_1');
      expect(receipts2['act_1'].archivedAt).toBeDefined();
    });
  });

  describe('MEMBER and ADMIN Permissions', () => {
    it('Member and Admin can author comments and replies', () => {
      expect(canComment('MEMBER')).toBe(true);
      expect(canComment('ADMIN')).toBe(true);
    });

    it('Member can delete their own comment but not others', () => {
      expect(canDeleteComment('MEMBER', true)).toBe(true);
      expect(canDeleteComment('MEMBER', false)).toBe(false);
    });

    it('Admin can delete any comment', () => {
      expect(canDeleteComment('ADMIN', true)).toBe(true);
      expect(canDeleteComment('ADMIN', false)).toBe(true);
    });

    it('Member and Admin can process personal receipts', () => {
      expect(canProcessInboxReceipt()).toBe(true);
    });
  });
});
