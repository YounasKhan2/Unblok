/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadAndMigrateStorage,
  saveStorage,
  clearAllExecutionStorage,
  UNBLOK_STORAGE_PREFIX,
  KITE_STORAGE_PREFIX,
  StorageAdapter,
} from './storageMigration';

class MockStorage implements StorageAdapter {
  private data = new Map<string, string>();

  getItem(key: string): string | null {
    return this.data.has(key) ? this.data.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  clear(): void {
    this.data.clear();
  }
}

describe('Storage Migration: Kite to Unblok Namespace', () => {
  let mockStorage: MockStorage;

  beforeEach(() => {
    mockStorage = new MockStorage();
  });

  it('loads canonical Unblok data when already present', () => {
    const unblokData = [{ id: 'iss_1', title: 'Unblok Issue' }];
    mockStorage.setItem(`${UNBLOK_STORAGE_PREFIX}_issues`, JSON.stringify(unblokData));

    const result = loadAndMigrateStorage('issues', [], mockStorage);
    expect(result).toEqual(unblokData);
  });

  it('detects legacy Kite data, migrates to Unblok namespace, and removes legacy key', () => {
    const kiteData = [{ id: 'iss_legacy_1', title: 'Legacy Kite Issue' }];
    mockStorage.setItem(`${KITE_STORAGE_PREFIX}_issues`, JSON.stringify(kiteData));

    // Initially Unblok namespace is empty
    expect(mockStorage.getItem(`${UNBLOK_STORAGE_PREFIX}_issues`)).toBeNull();

    // Call loadAndMigrate
    const result = loadAndMigrateStorage('issues', [], mockStorage);

    // 1. Result should be the migrated legacy data
    expect(result).toEqual(kiteData);

    // 2. Data should now be written to canonical Unblok namespace
    expect(mockStorage.getItem(`${UNBLOK_STORAGE_PREFIX}_issues`)).toBe(JSON.stringify(kiteData));

    // 3. Legacy key must be purged to avoid maintaining two sources of truth
    expect(mockStorage.getItem(`${KITE_STORAGE_PREFIX}_issues`)).toBeNull();
  });

  it('prefers canonical Unblok data over legacy Kite data if both exist', () => {
    const canonicalData = [{ id: 'iss_canonical', title: 'Canonical' }];
    const legacyData = [{ id: 'iss_legacy', title: 'Stale Legacy' }];

    mockStorage.setItem(`${UNBLOK_STORAGE_PREFIX}_issues`, JSON.stringify(canonicalData));
    mockStorage.setItem(`${KITE_STORAGE_PREFIX}_issues`, JSON.stringify(legacyData));

    const result = loadAndMigrateStorage('issues', [], mockStorage);
    expect(result).toEqual(canonicalData);
  });

  it('returns fallback seed data when neither exists', () => {
    const fallback = [{ id: 'iss_fallback', title: 'Default' }];
    const result = loadAndMigrateStorage('issues', fallback, mockStorage);
    expect(result).toEqual(fallback);
  });

  it('saves new writes exclusively to the canonical Unblok namespace', () => {
    const newData = [{ id: 'iss_new', title: 'New Issue' }];
    saveStorage('issues', newData, mockStorage);

    expect(mockStorage.getItem(`${UNBLOK_STORAGE_PREFIX}_issues`)).toBe(JSON.stringify(newData));
    expect(mockStorage.getItem(`${KITE_STORAGE_PREFIX}_issues`)).toBeNull();
  });

  it('clears both canonical and legacy namespaces on reset', () => {
    mockStorage.setItem(`${UNBLOK_STORAGE_PREFIX}_issues`, '{"test": 1}');
    mockStorage.setItem(`${KITE_STORAGE_PREFIX}_issues`, '{"test": 2}');
    mockStorage.setItem(`${UNBLOK_STORAGE_PREFIX}_saved_views`, '[]');

    clearAllExecutionStorage(mockStorage);

    expect(mockStorage.getItem(`${UNBLOK_STORAGE_PREFIX}_issues`)).toBeNull();
    expect(mockStorage.getItem(`${KITE_STORAGE_PREFIX}_issues`)).toBeNull();
    expect(mockStorage.getItem(`${UNBLOK_STORAGE_PREFIX}_saved_views`)).toBeNull();
  });
});
