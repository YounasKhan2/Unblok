/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  UNBLOK_STORAGE_NAMESPACE,
  LEGACY_KITE_STORAGE_NAMESPACE,
  migrateStorageNamespace,
  loadStoredEntity,
  saveStoredEntity,
  clearAllStoredEntities,
} from './storageMigration';

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

describe('Storage Migration Engine (Kite -> Unblok)', () => {
  let mockStorage: MockStorage;

  beforeEach(() => {
    mockStorage = new MockStorage();
  });

  it('migrates legacy Kite prototype values to canonical Unblok namespace', () => {
    const sampleIssues = [{ id: 'iss_1', title: 'Legacy Kite Task' }];
    mockStorage.setItem(`${LEGACY_KITE_STORAGE_NAMESPACE}_issues`, JSON.stringify(sampleIssues));
    mockStorage.setItem(`${LEGACY_KITE_STORAGE_NAMESPACE}_projects`, JSON.stringify([{ id: 'proj_1' }]));

    const result = migrateStorageNamespace(mockStorage);

    expect(result.hasMigrated).toBe(true);
    expect(result.migratedKeys).toContain('issues');
    expect(result.migratedKeys).toContain('projects');

    // Values now exist under Unblok namespace
    const migratedIssues = JSON.parse(mockStorage.getItem(`${UNBLOK_STORAGE_NAMESPACE}_issues`) || '[]');
    expect(migratedIssues).toEqual(sampleIssues);

    // Legacy keys cleaned up to avoid dual source of truth
    expect(mockStorage.getItem(`${LEGACY_KITE_STORAGE_NAMESPACE}_issues`)).toBeNull();
    expect(mockStorage.getItem(`${LEGACY_KITE_STORAGE_NAMESPACE}_projects`)).toBeNull();
  });

  it('does NOT overwrite canonical Unblok data if already present', () => {
    const existingUnblokIssues = [{ id: 'iss_unblok_active', title: 'New Unblok Task' }];
    const legacyKiteIssues = [{ id: 'iss_kite_old', title: 'Old Kite Task' }];

    mockStorage.setItem(`${UNBLOK_STORAGE_NAMESPACE}_issues`, JSON.stringify(existingUnblokIssues));
    mockStorage.setItem(`${LEGACY_KITE_STORAGE_NAMESPACE}_issues`, JSON.stringify(legacyKiteIssues));

    const result = migrateStorageNamespace(mockStorage);

    // Issues was not migrated because Unblok key already existed
    expect(result.migratedKeys).not.toContain('issues');

    const preservedIssues = JSON.parse(mockStorage.getItem(`${UNBLOK_STORAGE_NAMESPACE}_issues`) || '[]');
    expect(preservedIssues).toEqual(existingUnblokIssues);

    // Stale legacy key is pruned to prevent competing writable truth
    expect(mockStorage.getItem(`${LEGACY_KITE_STORAGE_NAMESPACE}_issues`)).toBeNull();
  });

  it('handles empty storage gracefully with zero migrations', () => {
    const result = migrateStorageNamespace(mockStorage);
    expect(result.hasMigrated).toBe(false);
    expect(result.migratedKeys).toHaveLength(0);
  });

  it('loadStoredEntity and saveStoredEntity target only canonical Unblok namespace', () => {
    saveStoredEntity('saved_views', [{ id: 'view_1', name: 'My View' }], mockStorage);

    expect(mockStorage.getItem(`${UNBLOK_STORAGE_NAMESPACE}_saved_views`)).toBeTruthy();
    expect(mockStorage.getItem(`${LEGACY_KITE_STORAGE_NAMESPACE}_saved_views`)).toBeNull();

    const loaded = loadStoredEntity('saved_views', [], mockStorage);
    expect(loaded).toEqual([{ id: 'view_1', name: 'My View' }]);
  });

  it('clearAllStoredEntities clears both canonical and legacy namespaces', () => {
    mockStorage.setItem(`${UNBLOK_STORAGE_NAMESPACE}_issues`, '[]');
    mockStorage.setItem(`${LEGACY_KITE_STORAGE_NAMESPACE}_issues`, '[]');
    mockStorage.setItem(`${UNBLOK_STORAGE_NAMESPACE}_dependencies`, '[]');
    mockStorage.setItem(`${LEGACY_KITE_STORAGE_NAMESPACE}_dependencies`, '[]');

    clearAllStoredEntities(mockStorage);

    expect(mockStorage.getItem(`${UNBLOK_STORAGE_NAMESPACE}_issues`)).toBeNull();
    expect(mockStorage.getItem(`${LEGACY_KITE_STORAGE_NAMESPACE}_issues`)).toBeNull();
    expect(mockStorage.getItem(`${UNBLOK_STORAGE_NAMESPACE}_dependencies`)).toBeNull();
    expect(mockStorage.getItem(`${LEGACY_KITE_STORAGE_NAMESPACE}_dependencies`)).toBeNull();
  });
});
