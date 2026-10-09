/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  markReceiptRead,
  markReceiptArchived,
  unarchiveReceipt,
  loadUserReceipts,
  saveUserReceipts,
} from './domain/receiptStorage';
import { selectUnreadInboxCount } from './selectors/inboxSelectors';
import { InboxItem, InboxReceipt } from './types';
import { ActivityEvent, Issue, IssueComment, Dependency } from '../../types';

class MockStorage implements Storage {
  private store: Record<string, string> = {};

  get length(): number {
    return Object.keys(this.store).length;
  }

  clear(): void {
    this.store = {};
  }

  getItem(key: string): string | null {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }
}

describe('UX-06 Receipt State & Isolation', () => {
  let mockStorage: MockStorage;

  beforeEach(() => {
    mockStorage = new MockStorage();
  });

  const sourceActivity: ActivityEvent = {
    id: 'act_100',
    issueId: 'iss_1',
    eventType: 'USER_MENTIONED',
    userId: 'usr_david',
    userName: 'David Kim',
    timestamp: '2026-10-06T10:00:00.000Z',
    details: { commentId: 'comm_1', targetUserId: 'usr_sarah' },
  };

  const sampleComment: IssueComment = {
    id: 'comm_1',
    issueId: 'iss_1',
    authorId: 'usr_david',
    authorName: 'David Kim',
    content: 'Review request',
    createdAt: '2026-10-06T10:00:00.000Z',
  };

  const sampleIssue: Issue = {
    id: 'iss_1',
    key: 'ENG-1',
    projectId: 'proj_1',
    teamId: 'team_1',
    title: 'Test Issue',
    description: 'Test description',
    state: 'TODO',
    priority: 'HIGH',
    creatorId: 'usr_david',
    createdAt: '2026-10-06T09:00:00.000Z',
    updatedAt: '2026-10-06T09:00:00.000Z',
    version: 1,
  };

  const sampleDependency: Dependency = {
    id: 'dep_1',
    upstreamIssueId: 'iss_2',
    downstreamIssueId: 'iss_1',
    createdAt: '2026-10-06T09:30:00.000Z',
    createdBy: 'usr_david',
  };

  // 1. Mark read only changes current user's receipt
  it("1. mark read only changes current user's receipt", () => {
    let receipts: Record<string, InboxReceipt> = {};
    receipts = markReceiptRead(receipts, 'usr_sarah', 'act_100', '2026-10-06T12:00:00.000Z');

    expect(receipts['act_100']).toBeDefined();
    expect(receipts['act_100'].userId).toBe('usr_sarah');
    expect(receipts['act_100'].readAt).toBe('2026-10-06T12:00:00.000Z');
    expect(receipts['act_100'].archivedAt).toBeUndefined();
  });

  // 2. Archive only changes current user's receipt
  it("2. archive only changes current user's receipt", () => {
    let receipts: Record<string, InboxReceipt> = {};
    receipts = markReceiptArchived(receipts, 'usr_sarah', 'act_100', '2026-10-06T12:30:00.000Z');

    expect(receipts['act_100']).toBeDefined();
    expect(receipts['act_100'].userId).toBe('usr_sarah');
    expect(receipts['act_100'].archivedAt).toBe('2026-10-06T12:30:00.000Z');
    expect(receipts['act_100'].readAt).toBe('2026-10-06T12:30:00.000Z');
  });

  // 3. Another user's receipt unaffected
  it("3. another user's receipt remains unaffected by current user receipt mutation", () => {
    const userAReceipts: Record<string, InboxReceipt> = {
      act_100: {
        userId: 'usr_elena',
        sourceId: 'act_100',
        readAt: '2026-10-06T08:00:00.000Z',
      },
    };

    saveUserReceipts('usr_elena', userAReceipts, mockStorage);

    let userBReceipts: Record<string, InboxReceipt> = {};
    userBReceipts = markReceiptRead(userBReceipts, 'usr_sarah', 'act_100');
    saveUserReceipts('usr_sarah', userBReceipts, mockStorage);

    const reloadedElenaReceipts = loadUserReceipts('usr_elena', mockStorage);
    expect(reloadedElenaReceipts['act_100'].userId).toBe('usr_elena');
    expect(reloadedElenaReceipts['act_100'].readAt).toBe('2026-10-06T08:00:00.000Z');
  });

  // 4. Source activity remains unchanged
  it('4. source activity remains strictly unchanged after receipt mutations', () => {
    const activitySnapshot = JSON.stringify(sourceActivity);
    markReceiptRead({}, 'usr_sarah', sourceActivity.id);
    markReceiptArchived({}, 'usr_sarah', sourceActivity.id);

    expect(JSON.stringify(sourceActivity)).toBe(activitySnapshot);
  });

  // 5. Comment remains unchanged
  it('5. comment remains unchanged after receipt mutations', () => {
    const commentSnapshot = JSON.stringify(sampleComment);
    markReceiptRead({}, 'usr_sarah', 'comm_1');

    expect(JSON.stringify(sampleComment)).toBe(commentSnapshot);
  });

  // 6. Issue remains unchanged
  it('6. issue remains unchanged after receipt mutations', () => {
    const issueSnapshot = JSON.stringify(sampleIssue);
    markReceiptArchived({}, 'usr_sarah', sampleIssue.id);

    expect(JSON.stringify(sampleIssue)).toBe(issueSnapshot);
  });

  // 7. Dependency remains unchanged
  it('7. dependency remains unchanged after receipt mutations', () => {
    const depSnapshot = JSON.stringify(sampleDependency);
    markReceiptRead({}, 'usr_sarah', sampleDependency.id);

    expect(JSON.stringify(sampleDependency)).toBe(depSnapshot);
  });

  // 8. Receipt persistence round-trip
  it('8. receipt persistence round-trips correctly through localStorage', () => {
    const initialReceipts: Record<string, InboxReceipt> = {
      act_roundtrip: {
        userId: 'usr_test_roundtrip',
        sourceId: 'act_roundtrip',
        readAt: '2026-10-06T11:00:00.000Z',
        archivedAt: '2026-10-06T11:30:00.000Z',
      },
    };

    saveUserReceipts('usr_test_roundtrip', initialReceipts, mockStorage);
    const loaded = loadUserReceipts('usr_test_roundtrip', mockStorage);

    expect(loaded).toEqual(initialReceipts);
  });

  // 9. Unread count excludes archived
  it('9. unread count excludes archived items even if they were marked unread previously', () => {
    const items: InboxItem[] = [
      {
        id: '1',
        sourceActivityId: '1',
        kind: 'MENTION',
        issueId: 'iss_1',
        issueKey: 'ENG-1',
        issueTitle: 'Title',
        createdAt: '2026-10-06T10:00:00.000Z',
        isRead: false,
        isArchived: true, // Archived
      },
      {
        id: '2',
        sourceActivityId: '2',
        kind: 'MENTION',
        issueId: 'iss_1',
        issueKey: 'ENG-1',
        issueTitle: 'Title',
        createdAt: '2026-10-06T10:00:00.000Z',
        isRead: false,
        isArchived: false, // Active unread
      },
    ];

    expect(selectUnreadInboxCount(items)).toBe(1);
  });

  // 10. Unread count excludes read
  it('10. unread count excludes read items', () => {
    const items: InboxItem[] = [
      {
        id: '1',
        sourceActivityId: '1',
        kind: 'MENTION',
        issueId: 'iss_1',
        issueKey: 'ENG-1',
        issueTitle: 'Title',
        createdAt: '2026-10-06T10:00:00.000Z',
        isRead: true, // Read
        isArchived: false,
      },
      {
        id: '2',
        sourceActivityId: '2',
        kind: 'MENTION',
        issueId: 'iss_1',
        issueKey: 'ENG-1',
        issueTitle: 'Title',
        createdAt: '2026-10-06T10:00:00.000Z',
        isRead: false, // Unread
        isArchived: false,
      },
    ];

    expect(selectUnreadInboxCount(items)).toBe(1);
  });
});
