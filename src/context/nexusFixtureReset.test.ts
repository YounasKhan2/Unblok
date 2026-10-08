import { describe, expect, it } from 'vitest';
import {
  getLatestNexusFixtureBackup,
  listNexusFixtureBackups,
  resetPrototypeToNexus,
  restorePrototypeBackup,
} from './nexusFixtureReset';

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(String(key), String(value));
  }
}

describe('NEXUS fixture reset and recovery', () => {
  it('requires confirmation before changing browser storage', () => {
    const storage = new MemoryStorage();
    storage.setItem('unblok_execution_state_v1_issues', 'changed data');

    expect(() => resetPrototypeToNexus(storage, false)).toThrow(/Explicit confirmation/);
    expect(storage.getItem('unblok_execution_state_v1_issues')).toBe('changed data');
  });

  it('backs up prototype state, clears app keys, and preserves unrelated origin data', () => {
    const storage = new MemoryStorage();
    storage.setItem('unblok_execution_state_v1_issues', '[{"id":"changed"}]');
    storage.setItem('kite_execution_state_v1_projects', '[{"id":"legacy"}]');
    storage.setItem('unrelated-preference', 'keep');

    const result = resetPrototypeToNexus(storage, true);

    expect(result.removedKeys).toEqual([
      'unblok_execution_state_v1_issues',
      'kite_execution_state_v1_projects',
    ]);
    expect(storage.getItem('unblok_execution_state_v1_issues')).toBeNull();
    expect(storage.getItem('kite_execution_state_v1_projects')).toBeNull();
    expect(storage.getItem('unrelated-preference')).toBe('keep');
    expect(getLatestNexusFixtureBackup(storage)).toBe(result.backedUpKey);
    expect(JSON.parse(storage.getItem(result.backedUpKey) || '{}')).toEqual({
      unblok_execution_state_v1_issues: '[{"id":"changed"}]',
      kite_execution_state_v1_projects: '[{"id":"legacy"}]',
    });
  });

  it('restores the selected snapshot and preserves a separate undo snapshot', () => {
    const storage = new MemoryStorage();
    storage.setItem('unblok_execution_state_v1_issues', 'old issues');
    const { backedUpKey } = resetPrototypeToNexus(storage, true);
    storage.setItem('unblok_execution_state_v1_issues', 'new NEXUS changes');

    const undoBackupKey = restorePrototypeBackup(storage, backedUpKey, true);

    expect(storage.getItem('unblok_execution_state_v1_issues')).toBe('old issues');
    expect(getLatestNexusFixtureBackup(storage)).toBe(undoBackupKey);
    expect(JSON.parse(storage.getItem(undoBackupKey) || '{}')).toEqual({
      unblok_execution_state_v1_issues: 'new NEXUS changes',
    });
    expect(listNexusFixtureBackups(storage)).toContain(backedUpKey);
  });

  it('rejects invalid backup identifiers and malformed backup contents', () => {
    const storage = new MemoryStorage();
    storage.setItem('unblok_nexus_backup_broken', '[]');

    expect(() => restorePrototypeBackup(storage, 'unblok_other_backup', true)).toThrow(/Invalid backup key/);
    expect(() => restorePrototypeBackup(storage, 'unblok_nexus_backup_missing', true)).toThrow(/does not exist/);
    expect(() => restorePrototypeBackup(storage, 'unblok_nexus_backup_broken', true)).toThrow(/contents are invalid/);
  });
});
