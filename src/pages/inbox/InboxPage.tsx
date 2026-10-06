/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCollaboration } from '../../features/collaboration/context/CollaborationContext';
import { useKeyboard } from '../../context/KeyboardContext';
import { useProject } from '../../context/ProjectContext';
import { InboxTabs } from '../../features/collaboration/components/InboxTabs';
import { NotificationItemRow } from '../../features/collaboration/components/NotificationItemRow';
import { InboxZeroState } from '../../features/collaboration/components/InboxZeroState';
import {
  filterInboxByView,
  normalizeInboxView,
} from '../../features/collaboration/selectors/inboxSelectors';
import { groupInboxItems } from '../../features/collaboration/domain/inboxProjection';
import { CheckCheck } from 'lucide-react';

export const InboxPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentView = normalizeInboxView(searchParams.get('view'));

  const { inboxItems, unreadCount, markAllAsRead, markAsArchived, markAsRead } = useCollaboration();
  const { registerInboxHandlers } = useKeyboard();
  const { currentUser } = useProject();

  // 1. Filter items by active view
  const filteredItems = useMemo(() => {
    return filterInboxByView(inboxItems, currentView);
  }, [inboxItems, currentView]);

  // 2. Group items into Today, Earlier, and Archived sections
  const grouped = useMemo(() => {
    return groupInboxItems(filteredItems);
  }, [filteredItems]);

  // 3. Focused item index for keyboard triage
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  // Keep focusedIndex clamped
  useEffect(() => {
    if (filteredItems.length === 0) {
      setFocusedIndex(0);
    } else if (focusedIndex >= filteredItems.length) {
      setFocusedIndex(filteredItems.length - 1);
    }
  }, [filteredItems.length, focusedIndex]);

  // 4. Keyboard triage handlers registered centrally with KeyboardContext
  const handleNext = useCallback(() => {
    if (filteredItems.length === 0) return;
    setFocusedIndex(idx => Math.min(filteredItems.length - 1, idx + 1));
  }, [filteredItems.length]);

  const handlePrev = useCallback(() => {
    if (filteredItems.length === 0) return;
    setFocusedIndex(idx => Math.max(0, idx - 1));
  }, [filteredItems.length]);

  const handleOpen = useCallback(() => {
    if (filteredItems.length === 0) return;
    const item = filteredItems[focusedIndex];
    if (!item) return;

    markAsRead(item.id);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('drawer', item.issueKey);
    if (item.kind === 'MENTION') {
      nextParams.set('tab', 'comments');
      if (item.commentId) nextParams.set('comment', item.commentId);
    } else if (item.kind === 'DEPENDENCY_BLOCKED' || item.kind === 'DEPENDENCY_UNBLOCKED') {
      nextParams.set('tab', 'dependencies');
      nextParams.delete('comment');
    } else {
      nextParams.set('tab', 'properties');
      nextParams.delete('comment');
    }
    navigate({ search: nextParams.toString() });
  }, [filteredItems, focusedIndex, markAsRead, searchParams, navigate]);

  const handleArchive = useCallback(() => {
    if (filteredItems.length === 0) return;
    const item = filteredItems[focusedIndex];
    if (!item) return;
    markAsArchived(item.id);
  }, [filteredItems, focusedIndex, markAsArchived]);

  useEffect(() => {
    registerInboxHandlers({
      onNext: handleNext,
      onPrev: handlePrev,
      onOpen: handleOpen,
      onArchive: handleArchive,
    });
    return () => {
      registerInboxHandlers(null);
    };
  }, [registerInboxHandlers, handleNext, handlePrev, handleOpen, handleArchive]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-surface-base">
      {/* 1. Header (Compact, no giant dashboard header) */}
      <header className="px-4 py-3 border-b border-border bg-surface-base shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h1 className="text-sm font-bold text-text-primary tracking-tight">
            Inbox
          </h1>
          {unreadCount > 0 && (
            <span
              className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-accent/15 text-accent"
              aria-label={`${unreadCount} unread items`}
            >
              {unreadCount} unread
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-text-muted hover:text-text-primary hover:bg-surface-subtle rounded transition-colors cursor-pointer"
            title="Mark all active notifications as read"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </header>

      {/* 2. Primary Tabs */}
      <InboxTabs />

      {/* 3. Notification Stream Canvas */}
      <div
        className="flex-1 overflow-y-auto"
        role="tabpanel"
        id={`inbox-view-${currentView}`}
        aria-labelledby={`inbox-tab-${currentView}`}
      >
        {filteredItems.length === 0 ? (
          <InboxZeroState
            message={
              currentView === 'archived'
                ? 'No processed or archived items in this workspace queue.'
                : currentView === 'unread'
                ? "You're completely up to date with unread mentions and blockers."
                : currentView === 'mentions'
                ? 'No mentions requiring your attention.'
                : currentView === 'blockers'
                ? 'No dependency blocker events on your assigned work.'
                : "Inbox Zero — You're completely up to date with mentions and blockers."
            }
          />
        ) : currentView === 'archived' ? (
          /* Archived Section */
          <div className="divide-y divide-border">
            {grouped.archived.map((item, idx) => (
              <NotificationItemRow
                key={item.id}
                item={item}
                isFocused={idx === focusedIndex}
              />
            ))}
          </div>
        ) : (
          /* Active Sections: Today & Earlier */
          <div className="divide-y divide-border">
            {grouped.today.length > 0 && (
              <section aria-labelledby="section-today" className="bg-surface-base">
                <div
                  id="section-today"
                  className="px-4 py-2 bg-surface-subtle/60 border-b border-border text-[11px] font-bold text-text-muted uppercase tracking-wider sticky top-0 z-10 backdrop-blur-xs flex items-center justify-between"
                >
                  <span>Today</span>
                  <span className="text-[10px] font-normal lowercase">
                    {grouped.today.length} {grouped.today.length === 1 ? 'event' : 'events'}
                  </span>
                </div>
                {grouped.today.map((item, idx) => (
                  <NotificationItemRow
                    key={item.id}
                    item={item}
                    isFocused={idx === focusedIndex}
                  />
                ))}
              </section>
            )}

            {grouped.earlier.length > 0 && (
              <section aria-labelledby="section-earlier" className="bg-surface-base">
                <div
                  id="section-earlier"
                  className="px-4 py-2 bg-surface-subtle/60 border-b border-border text-[11px] font-bold text-text-muted uppercase tracking-wider sticky top-0 z-10 backdrop-blur-xs flex items-center justify-between"
                >
                  <span>Earlier</span>
                  <span className="text-[10px] font-normal lowercase">
                    {grouped.earlier.length} {grouped.earlier.length === 1 ? 'event' : 'events'}
                  </span>
                </div>
                {grouped.earlier.map((item, idx) => {
                  const globalIdx = grouped.today.length + idx;
                  return (
                    <NotificationItemRow
                      key={item.id}
                      item={item}
                      isFocused={globalIdx === focusedIndex}
                    />
                  );
                })}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
