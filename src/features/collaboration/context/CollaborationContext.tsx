/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useProject } from '../../../context/ProjectContext';
import { InboxItem, InboxReceipt } from '../types';
import { deriveInboxItems } from '../domain/inboxProjection';
import {
  loadUserReceipts,
  saveUserReceipts,
  markReceiptRead,
  markAllReceiptsRead,
  markReceiptArchived,
  unarchiveReceipt,
} from '../domain/receiptStorage';
import { selectUnreadInboxCount } from '../selectors/inboxSelectors';

interface CollaborationContextType {
  inboxItems: InboxItem[];
  unreadCount: number;
  receipts: Record<string, InboxReceipt>;
  markAsRead: (sourceId: string) => void;
  markAllAsRead: () => void;
  markAsArchived: (sourceId: string) => void;
  unarchive: (sourceId: string) => void;
}

const CollaborationContext = createContext<CollaborationContextType | undefined>(undefined);

export const CollaborationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activities, issues, comments, users, currentUser } = useProject();

  // 1. User-scoped receipt state
  const [receipts, setReceipts] = useState<Record<string, InboxReceipt>>(() => {
    return currentUser ? loadUserReceipts(currentUser.id) : {};
  });

  // Re-sync receipts whenever currentUser switches
  useEffect(() => {
    if (currentUser) {
      setReceipts(loadUserReceipts(currentUser.id));
    }
  }, [currentUser]);

  // Reset user-scoped receipt state when the prototype demo is reset.
  useEffect(() => {
    const handleDemoReset = () => {
      if (currentUser) setReceipts(loadUserReceipts(currentUser.id));
    };
    window.addEventListener('unblok:demo-reset', handleDemoReset);
    return () => window.removeEventListener('unblok:demo-reset', handleDemoReset);
  }, [currentUser]);

  // Persist receipts on changes
  useEffect(() => {
    if (currentUser) {
      saveUserReceipts(currentUser.id, receipts);
    }
  }, [receipts, currentUser]);

  // 2. Pure Inbox Items projection (memoized)
  const inboxItems = useMemo(() => {
    return deriveInboxItems({
      activities,
      issues,
      comments,
      users,
      currentUser,
      receipts,
    });
  }, [activities, issues, comments, users, currentUser, receipts]);

  // 3. Unread count calculation
  const unreadCount = useMemo(() => {
    return selectUnreadInboxCount(inboxItems);
  }, [inboxItems]);

  // 4. Processing callbacks
  const markAsRead = useCallback(
    (sourceId: string) => {
      if (!currentUser) return;
      setReceipts(prev => markReceiptRead(prev, currentUser.id, sourceId));
    },
    [currentUser]
  );

  const markAllAsRead = useCallback(() => {
    if (!currentUser) return;
    const activeUnreadIds = inboxItems
      .filter(i => !i.isArchived && !i.isRead)
      .map(i => i.id);
    if (activeUnreadIds.length === 0) return;
    setReceipts(prev => markAllReceiptsRead(prev, currentUser.id, activeUnreadIds));
  }, [currentUser, inboxItems]);

  const markAsArchived = useCallback(
    (sourceId: string) => {
      if (!currentUser) return;
      setReceipts(prev => markReceiptArchived(prev, currentUser.id, sourceId));
    },
    [currentUser]
  );

  const unarchive = useCallback(
    (sourceId: string) => {
      if (!currentUser) return;
      setReceipts(prev => unarchiveReceipt(prev, currentUser.id, sourceId));
    },
    [currentUser]
  );

  return (
    <CollaborationContext.Provider
      value={{
        inboxItems,
        unreadCount,
        receipts,
        markAsRead,
        markAllAsRead,
        markAsArchived,
        unarchive,
      }}
    >
      {children}
    </CollaborationContext.Provider>
  );
};

export const useCollaboration = (): CollaborationContextType => {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }
  return context;
};
