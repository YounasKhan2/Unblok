/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const UNBLOK_STORAGE_NAMESPACE = 'unblok_execution_state_v1';
export const LEGACY_KITE_STORAGE_NAMESPACE = 'kite_execution_state_v1';

export const STORAGE_ENTITIES = [
  'issues',
  'dependencies',
  'projects',
  'activities',
  'saved_views',
  'cycles',
  'milestones',
  'comments',
] as const;

export type StorageEntity = (typeof STORAGE_ENTITIES)[number];

export interface StorageMigrationResult {
  migratedKeys: string[];
  hasMigrated: boolean;
}

/**
 * Safely resolves the active web storage instance.
 */
function getStorage(storageOverride?: Storage): Storage | null {
  if (storageOverride) return storageOverride;
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

/**
 * Migrates prototype state from the legacy Kite namespace to the canonical Unblok namespace.
 * Guarantees:
 * - Detects existing legacy Kite prototype values and migrates them once.
 * - Preserves existing compatible user/demo state.
 * - Does not overwrite existing canonical Unblok data if present.
 * - Cleans up legacy keys to avoid two competing writable sources of truth.
 */
export function migrateStorageNamespace(storageOverride?: Storage): StorageMigrationResult {
  const storage = getStorage(storageOverride);
  if (!storage) {
    return { migratedKeys: [], hasMigrated: false };
  }

  const migratedKeys: string[] = [];

  try {
    for (const entity of STORAGE_ENTITIES) {
      const canonicalKey = `${UNBLOK_STORAGE_NAMESPACE}_${entity}`;
      const legacyKey = `${LEGACY_KITE_STORAGE_NAMESPACE}_${entity}`;

      const canonicalValue = storage.getItem(canonicalKey);
      const legacyValue = storage.getItem(legacyKey);

      if (canonicalValue === null && legacyValue !== null) {
        // Safe migration: copy legacy value into canonical namespace
        storage.setItem(canonicalKey, legacyValue);
        // Clean up legacy key to prevent competing dual truth
        storage.removeItem(legacyKey);
        migratedKeys.push(entity);
      } else if (canonicalValue !== null && legacyValue !== null) {
        // Canonical already exists: prune obsolete legacy key
        storage.removeItem(legacyKey);
      }
    }
  } catch (error) {
    console.warn('Storage namespace migration encountered an error:', error);
  }

  return {
    migratedKeys,
    hasMigrated: migratedKeys.length > 0,
  };
}

/**
 * Loads a typed entity from the canonical Unblok storage namespace with fallback.
 */
export function loadStoredEntity<T>(
  entity: StorageEntity,
  fallback: T,
  storageOverride?: Storage
): T {
  const storage = getStorage(storageOverride);
  if (!storage) return fallback;

  try {
    const raw = storage.getItem(`${UNBLOK_STORAGE_NAMESPACE}_${entity}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Persists a typed entity into the canonical Unblok storage namespace.
 */
export function saveStoredEntity<T>(
  entity: StorageEntity,
  data: T,
  storageOverride?: Storage
): void {
  const storage = getStorage(storageOverride);
  if (!storage) return;

  try {
    storage.setItem(`${UNBLOK_STORAGE_NAMESPACE}_${entity}`, JSON.stringify(data));
  } catch (error) {
    console.warn(`Failed to persist entity "${entity}" to Unblok storage:`, error);
  }
}

/**
 * Clears all Unblok and legacy Kite stored entities (used for demo data reset).
 */
export function clearAllStoredEntities(storageOverride?: Storage): void {
  const storage = getStorage(storageOverride);
  if (!storage) return;

  try {
    for (const entity of STORAGE_ENTITIES) {
      storage.removeItem(`${UNBLOK_STORAGE_NAMESPACE}_${entity}`);
      storage.removeItem(`${LEGACY_KITE_STORAGE_NAMESPACE}_${entity}`);
    }

    // Inbox receipts and settings are dynamic/user-scoped keys.
    // A demo reset must clear them as well so stale state cannot hide freshly restored seeds.
    const dynamicPrefixes = [
      `${UNBLOK_STORAGE_NAMESPACE}_inbox_receipts_`,
      `${UNBLOK_STORAGE_NAMESPACE}_settings_`,
      `${UNBLOK_STORAGE_NAMESPACE}_teams`,
      `${UNBLOK_STORAGE_NAMESPACE}_users`,
    ];

    const keysToRemove: string[] = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key && dynamicPrefixes.some(prefix => key.startsWith(prefix))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => storage.removeItem(key));
  } catch (error) {
    console.warn('Failed to clear stored entities:', error);
  }
}
