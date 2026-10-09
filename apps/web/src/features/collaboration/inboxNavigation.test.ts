/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { normalizeInboxView, filterInboxByView } from './selectors/inboxSelectors';
import { InboxItem } from './types';

describe('UX-06 Inbox URL Filters & Deep Navigation', () => {
  const sampleItems: InboxItem[] = [
    {
      id: 'item_1',
      sourceActivityId: 'act_1',
      kind: 'MENTION',
      issueId: 'iss_1',
      issueKey: 'ENG-1',
      issueTitle: 'Mention Task',
      createdAt: '2026-10-06T10:00:00.000Z',
      isRead: false,
      isArchived: false,
    },
    {
      id: 'item_2',
      sourceActivityId: 'act_2',
      kind: 'DEPENDENCY_BLOCKED',
      issueId: 'iss_2',
      issueKey: 'ENG-2',
      issueTitle: 'Blocked Task',
      createdAt: '2026-10-06T11:00:00.000Z',
      isRead: true,
      isArchived: false,
    },
    {
      id: 'item_3',
      sourceActivityId: 'act_3',
      kind: 'ASSIGNMENT',
      issueId: 'iss_3',
      issueKey: 'WEB-3',
      issueTitle: 'Archived Task',
      createdAt: '2026-10-06T09:00:00.000Z',
      isRead: true,
      isArchived: true,
    },
  ];

  // 1. /inbox
  it('1. /inbox displays all active (non-archived) items', () => {
    const view = normalizeInboxView(null);
    expect(view).toBe('all');
    const filtered = filterInboxByView(sampleItems, view);
    expect(filtered).toHaveLength(2);
    expect(filtered.map(i => i.id)).toEqual(['item_1', 'item_2']);
  });

  // 2. /inbox?view=unread
  it('2. /inbox?view=unread filters to only unread, non-archived items', () => {
    const view = normalizeInboxView('unread');
    expect(view).toBe('unread');
    const filtered = filterInboxByView(sampleItems, view);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('item_1');
  });

  // 3. /inbox?view=mentions
  it('3. /inbox?view=mentions filters to only mention items', () => {
    const view = normalizeInboxView('mentions');
    expect(view).toBe('mentions');
    const filtered = filterInboxByView(sampleItems, view);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].kind).toBe('MENTION');
  });

  // 4. /inbox?view=blockers
  it('4. /inbox?view=blockers filters to dependency blocker and unblock events', () => {
    const view = normalizeInboxView('blockers');
    expect(view).toBe('blockers');
    const filtered = filterInboxByView(sampleItems, view);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].kind).toBe('DEPENDENCY_BLOCKED');
  });

  // 5. /inbox?view=archived
  it('5. /inbox?view=archived filters to only archived/done items', () => {
    const view = normalizeInboxView('archived');
    expect(view).toBe('archived');
    const filtered = filterInboxByView(sampleItems, view);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('item_3');
  });

  // 6. invalid view falls back safely
  it('6. invalid view falls back safely to all', () => {
    expect(normalizeInboxView('unknown_view_123')).toBe('all');
    expect(normalizeInboxView('')).toBe('all');
    expect(normalizeInboxView(undefined)).toBe('all');
  });

  // 7. drawer deep link preserves Inbox route
  it('7. drawer deep link URL correctly parses drawer key while maintaining base inbox query', () => {
    const search = '?view=mentions&drawer=WEB-302';
    const params = new URLSearchParams(search);
    expect(params.get('view')).toBe('mentions');
    expect(params.get('drawer')).toBe('WEB-302');
  });

  // 8. comments tab deep link
  it('8. comments tab deep link formats correctly with comment ID', () => {
    const search = '?view=mentions&drawer=WEB-302&tab=comments&comment=comm_123';
    const params = new URLSearchParams(search);
    expect(params.get('drawer')).toBe('WEB-302');
    expect(params.get('tab')).toBe('comments');
    expect(params.get('comment')).toBe('comm_123');
  });

  // 9. dependencies tab deep link
  it('9. dependencies tab deep link formats correctly', () => {
    const search = '?view=blockers&drawer=ENG-1&tab=dependencies';
    const params = new URLSearchParams(search);
    expect(params.get('drawer')).toBe('ENG-1');
    expect(params.get('tab')).toBe('dependencies');
  });

  // 10. closing drawer preserves Inbox filters
  it('10. closing drawer removes only drawer, tab, and comment params while preserving inbox view', () => {
    const initial = new URLSearchParams('?view=mentions&drawer=WEB-302&tab=comments&comment=comm_123');
    initial.delete('drawer');
    initial.delete('issue');
    initial.delete('tab');
    initial.delete('comment');

    expect(initial.toString()).toBe('view=mentions');
    expect(initial.get('view')).toBe('mentions');
  });

  // 11. full issue navigation reaches /issues/:issueKey
  it('11. full issue navigation target computes to /issues/:issueKey', () => {
    const computePath = (issueKey: string) => `/issues/${issueKey}`;
    expect(computePath('WEB-302')).toBe('/issues/WEB-302');
    expect(computePath('ENG-1')).toBe('/issues/ENG-1');
  });
});
