import { NEXUS_FIXTURE_VERSION } from '../data/nexusEnterprise';

export const NEXUS_RESET_BACKUP_PREFIX = 'unblok_nexus_backup_';
const LATEST_BACKUP_KEY = `${NEXUS_RESET_BACKUP_PREFIX}latest`;
let backupSequence = 0;

function isPrototypeStorageKey(key: string): boolean {
  return key.startsWith('unblok_') || key.startsWith('kite_');
}

function readPrototypeState(storage: Storage): Record<string, string> {
  const entries: Record<string, string> = {};
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key || !isPrototypeStorageKey(key) || key.startsWith(NEXUS_RESET_BACKUP_PREFIX)) continue;
    const value = storage.getItem(key);
    if (value !== null) entries[key] = value;
  }
  return entries;
}

function saveBackup(storage: Storage, entries: Record<string, string>): string {
  let backupKey: string;
  do {
    backupKey = `${NEXUS_RESET_BACKUP_PREFIX}${NEXUS_FIXTURE_VERSION}_${Date.now()}_${backupSequence++}`;
  } while (storage.getItem(backupKey) !== null);
  storage.setItem(backupKey, JSON.stringify(entries));
  return backupKey;
}

function clearPrototypeState(storage: Storage): string[] {
  const keys: string[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key && isPrototypeStorageKey(key) && !key.startsWith(NEXUS_RESET_BACKUP_PREFIX)) {
      keys.push(key);
    }
  }
  keys.forEach(key => storage.removeItem(key));
  return keys;
}

export function listNexusFixtureBackups(storage: Storage): string[] {
  const backupKeys: string[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key?.startsWith(NEXUS_RESET_BACKUP_PREFIX) && key !== LATEST_BACKUP_KEY) {
      backupKeys.push(key);
    }
  }
  return backupKeys.sort().reverse();
}

export function getLatestNexusFixtureBackup(storage: Storage): string | null {
  const latest = storage.getItem(LATEST_BACKUP_KEY);
  if (latest?.startsWith(NEXUS_RESET_BACKUP_PREFIX) && storage.getItem(latest) !== null) {
    return latest;
  }
  return listNexusFixtureBackups(storage)[0] || null;
}

export function resetPrototypeToNexus(
  storage: Storage,
  confirmed: boolean
): { backedUpKey: string; removedKeys: string[] } {
  if (!confirmed) throw new Error('Explicit confirmation is required to replace demo data.');
  const backedUpKey = saveBackup(storage, readPrototypeState(storage));
  const removedKeys = clearPrototypeState(storage);
  storage.setItem(LATEST_BACKUP_KEY, backedUpKey);
  return { backedUpKey, removedKeys };
}

export function restorePrototypeBackup(storage: Storage, backupKey: string, confirmed: boolean): string {
  if (!confirmed) throw new Error('Confirmation required to restore prior demo state.');
  if (!backupKey.startsWith(NEXUS_RESET_BACKUP_PREFIX) || backupKey === LATEST_BACKUP_KEY) {
    throw new Error('Invalid backup key');
  }

  const raw = storage.getItem(backupKey);
  if (raw === null) throw new Error('Backup does not exist');

  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Backup contents are invalid');
  }

  const entries: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (!isPrototypeStorageKey(key) || key.startsWith(NEXUS_RESET_BACKUP_PREFIX) || typeof value !== 'string') {
      throw new Error('Backup contains an invalid record');
    }
    entries[key] = value;
  }

  const undoBackupKey = saveBackup(storage, readPrototypeState(storage));
  clearPrototypeState(storage);
  for (const [key, value] of Object.entries(entries)) {
    storage.setItem(key, value);
  }
  storage.setItem(LATEST_BACKUP_KEY, undoBackupKey);
  return undoBackupKey;
}
