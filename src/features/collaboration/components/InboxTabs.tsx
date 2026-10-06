/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { InboxViewFilter } from '../types';
import { normalizeInboxView } from '../selectors/inboxSelectors';
import { useCollaboration } from '../context/CollaborationContext';
import {
  Inbox,
  MailCheck,
  AtSign,
  ShieldAlert,
  Archive,
} from 'lucide-react';

interface TabItem {
  id: InboxViewFilter;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabItem[] = [
  { id: 'all', label: 'All', icon: Inbox },
  { id: 'unread', label: 'Unread', icon: MailCheck },
  { id: 'mentions', label: 'Mentions', icon: AtSign },
  { id: 'blockers', label: 'Blockers & Dependencies', icon: ShieldAlert },
  { id: 'archived', label: 'Archived', icon: Archive },
];

export const InboxTabs: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentView = normalizeInboxView(searchParams.get('view'));
  const { unreadCount } = useCollaboration();

  const handleSelectTab = (tabId: InboxViewFilter) => {
    const nextParams = new URLSearchParams(searchParams);
    if (tabId === 'all') {
      nextParams.delete('view');
    } else {
      nextParams.set('view', tabId);
    }
    setSearchParams(nextParams);
  };

  return (
    <div
      role="tablist"
      aria-label="Inbox navigation views"
      className="flex items-center gap-1 border-b border-border px-4 bg-surface-base shrink-0 overflow-x-auto"
    >
      {TABS.map(tab => {
        const isActive = currentView === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            role="tab"
            id={`inbox-tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`inbox-view-${tab.id}`}
            onClick={() => handleSelectTab(tab.id)}
            className={`group flex items-center gap-2 px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer select-none whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              isActive
                ? 'border-accent text-accent'
                : 'border-transparent text-text-muted hover:text-text-primary hover:border-border-strong'
            }`}
          >
            <Icon
              className={`w-3.5 h-3.5 transition-colors ${
                isActive ? 'text-accent' : 'text-text-muted group-hover:text-text-primary'
              }`}
            />
            <span>{tab.label}</span>
            {tab.id === 'unread' && unreadCount > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive
                    ? 'bg-accent/15 text-accent'
                    : 'bg-surface-subtle text-text-secondary group-hover:bg-surface-muted'
                }`}
                aria-label={`${unreadCount} unread notifications`}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
