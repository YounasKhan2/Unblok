/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const UNBLOK_STORAGE_PREFIX = 'unblok_execution_state_v1';
export const KITE_STORAGE_PREFIX = 'kite_execution_state_v1';

export const PERSISTED_ENTITIES = [
  'issues',
  'dependencies',
  'projects',
  'activities',
  'saved_views',
  'cycles',
  'milestones',
  'comments',
] as const;

export type PersistedEntity = (typeof PERSISTED_ENTITIES)[number];

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * Safely loads data for a given entity key.
 * If data exists in the canonical Unblok namespace, returns it.
 * If only legacy Kite prototype data exists, migrates it once to Unblok and removes legacy key.
 * Otherwise returns the fallback seed value.
 */
export function loadAndMigrateStorage<T>(
  entity: PersistedEntity | string,
  fallback: T,
  storage?: StorageAdapter
): T {
  const store = storage || (typeof window !== 'undefined' ? window.localStorage : null);
  if (!store) return fallback;

  const canonicalKey = `${UNBLOK_STORAGE_PREFIX}_${entity}`;
  const legacyKey = `${KITE_STORAGE_PREFIX}_${entity}`;

  try {
    // 1. Check canonical Unblok namespace first
    const existing = store.getItem(canonicalKey);
    if (existing !== null) {
      return JSON.parse(existing) as T;
    }

    // 2. Detect legacy Kite prototype values and migrate once
    const legacy = store.getItem(legacyKey);
    if (legacy !== null) {
      store.setItem(canonicalKey, legacy);
      store.removeItem(legacyKey);
      return JSON.parse(legacy) as T;
    }

    return fallback;
  } catch {
    return fallback;
  }
}

/**
 * Saves entity state exclusively to the canonical Unblok namespace.
 */
export function saveStorage<T>(
  entity: PersistedEntity | string,
  data: T,
  storage?: StorageAdapter
): void {
  const store = storage || (typeof window !== 'undefined' ? window.localStorage : null);
  if (!store) return;

  const canonicalKey = `${UNBLOK_STORAGE_PREFIX}_${entity}`;
  try {
    store.setItem(canonicalKey, JSON.stringify(data));
  } catch {
    // Silently handle quota errors in local prototype environment
  }
}

/**
 * Clears all prototype storage across both canonical and legacy namespaces.
 */
export function clearAllExecutionStorage(storage?: StorageAdapter): void {
  const store = storage || (typeof window !== 'undefined' ? window.localStorage : null);
  if (!store) return;

  for (const entity of PERSISTED_ENTITIES) {
    store.removeItem(`${UNBLOK_STORAGE_PREFIX}_${entity}`);
    store.removeItem(`${KITE_STORAGE_PREFIX}_${entity}`);
  }
}
