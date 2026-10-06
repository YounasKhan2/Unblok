/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UNBLOK_STORAGE_NAMESPACE } from '../../../context/storageMigration';
import { InboxReceipt } from '../types';

export function getReceiptStorageKey(userId: string): string {
  return `${UNBLOK_STORAGE_NAMESPACE}_inbox_receipts_${userId}`;
}

/**
 * Loads receipts for a specific user from localStorage.
 */
export function loadUserReceipts(
  userId: string,
  storageOverride?: Storage
): Record<string, InboxReceipt> {
  const storage = storageOverride ?? (typeof window !== 'undefined' ? window.localStorage : null);
  if (!storage || !userId) return {};

  try {
    const raw = storage.getItem(getReceiptStorageKey(userId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Saves receipts for a specific user to localStorage.
 */
export function saveUserReceipts(
  userId: string,
  receipts: Record<string, InboxReceipt>,
  storageOverride?: Storage
): void {
  const storage = storageOverride ?? (typeof window !== 'undefined' ? window.localStorage : null);
  if (!storage || !userId) return;

  try {
    storage.setItem(getReceiptStorageKey(userId), JSON.stringify(receipts));
  } catch (error) {
    console.warn(`Failed to persist inbox receipts for user ${userId}:`, error);
  }
}

/**
 * Pure state updater: marks a source as read for a given user.
 */
export function markReceiptRead(
  currentReceipts: Record<string, InboxReceipt>,
  userId: string,
  sourceId: string,
  readAt: string = new Date().toISOString()
): Record<string, InboxReceipt> {
  const existing = currentReceipts[sourceId];
  return {
    ...currentReceipts,
    [sourceId]: {
      userId,
      sourceId,
      readAt: existing?.readAt || readAt,
      archivedAt: existing?.archivedAt,
    },
  };
}

/**
 * Pure state updater: marks all specified sources as read.
 */
export function markAllReceiptsRead(
  currentReceipts: Record<string, InboxReceipt>,
  userId: string,
  sourceIds: string[],
  readAt: string = new Date().toISOString()
): Record<string, InboxReceipt> {
  const next = { ...currentReceipts };
  for (const sourceId of sourceIds) {
    const existing = next[sourceId];
    next[sourceId] = {
      userId,
      sourceId,
      readAt: existing?.readAt || readAt,
      archivedAt: existing?.archivedAt,
    };
  }
  return next;
}

/**
 * Pure state updater: marks a source as archived (and read).
 */
export function markReceiptArchived(
  currentReceipts: Record<string, InboxReceipt>,
  userId: string,
  sourceId: string,
  archivedAt: string = new Date().toISOString()
): Record<string, InboxReceipt> {
  const existing = currentReceipts[sourceId];
  return {
    ...currentReceipts,
    [sourceId]: {
      userId,
      sourceId,
      readAt: existing?.readAt || archivedAt,
      archivedAt,
    },
  };
}

/**
 * Pure state updater: unarchives a source receipt.
 */
export function unarchiveReceipt(
  currentReceipts: Record<string, InboxReceipt>,
  userId: string,
  sourceId: string
): Record<string, InboxReceipt> {
  const existing = currentReceipts[sourceId];
  if (!existing) return currentReceipts;

  const next = { ...currentReceipts };
  next[sourceId] = {
    userId,
    sourceId,
    readAt: existing.readAt,
    archivedAt: undefined,
  };
  return next;
}
