/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UNBLOK_STORAGE_NAMESPACE } from '../../../context/storageMigration';
import {
  PendingInvitation,
  RepoIntegrationConfig,
  UserPreferences,
  WebhookConfig,
  WorkspaceSettings,
} from '../types';
import { DEFAULT_WORKSPACE_SETTINGS } from '../domain/workspaceSettings';
import { createDefaultUserPreferences } from '../domain/preferences';

export const INITIAL_WORKSPACE_SETTINGS: WorkspaceSettings = {
  ...DEFAULT_WORKSPACE_SETTINGS,
};

export const INITIAL_PENDING_INVITATIONS: PendingInvitation[] = [
  {
    id: 'inv_1',
    email: 'jordan.lee@acme.internal',
    role: 'MEMBER',
    teamIds: ['team_eng'],
    invitedAt: '2026-10-04T10:15:00.000Z',
    status: 'PENDING',
  },
  {
    id: 'inv_2',
    email: 'alex.morgan@acme.internal',
    role: 'OBSERVER',
    teamIds: ['team_web'],
    invitedAt: '2026-10-05T14:30:00.000Z',
    status: 'PENDING',
  },
  {
    id: 'inv_3',
    email: 'sam.security@partner-audit.org',
    role: 'OBSERVER',
    teamIds: [],
    invitedAt: '2026-10-06T09:00:00.000Z',
    status: 'PENDING',
  },
];

export const INITIAL_REPO_INTEGRATIONS: RepoIntegrationConfig[] = [
  {
    provider: 'GITHUB',
    repositoryName: 'acme-corp/unblok-platform',
    status: 'CONNECTED',
    lastSyncText: 'Synced 14 minutes ago',
    commitLinkingEnabled: true,
    issueKeyPattern: '[A-Z]+-[0-9]+',
  },
  {
    provider: 'GITLAB',
    repositoryName: '',
    status: 'NOT_CONNECTED',
    commitLinkingEnabled: false,
    issueKeyPattern: '[A-Z]+-[0-9]+',
  },
];

export const INITIAL_WEBHOOKS: WebhookConfig[] = [
  {
    id: 'wh_deploy_sync',
    name: 'CI/CD Pipeline Dispatcher',
    endpointUrl: 'https://ci-gateway.acme.internal/hooks/unblok-events',
    events: ['STATE_CHANGED', 'DEPENDENCY_ADDED', 'CYCLE_ASSIGNED'],
    enabled: true,
    mockSecret: 'whsec_demo_98f12a34b56c78d',
    createdAt: '2026-10-01T08:00:00.000Z',
  },
];

export const SETTINGS_STORAGE_KEYS = {
  WORKSPACE: `${UNBLOK_STORAGE_NAMESPACE}_settings_workspace`,
  INVITATIONS: `${UNBLOK_STORAGE_NAMESPACE}_settings_invitations`,
  INTEGRATIONS: `${UNBLOK_STORAGE_NAMESPACE}_settings_integrations`,
  WEBHOOKS: `${UNBLOK_STORAGE_NAMESPACE}_settings_webhooks`,
  ARCHIVED_TEAMS: `${UNBLOK_STORAGE_NAMESPACE}_settings_archived_teams`,
  USER_PREFS_PREFIX: `${UNBLOK_STORAGE_NAMESPACE}_settings_user_prefs_`,
} as const;

export function loadSettingsFromStorage<T>(key: string, fallback: T, storageOverride?: Storage): T {
  const storage = storageOverride || (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (!storage) {
    return fallback;
  }
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveSettingsToStorage<T>(key: string, data: T, storageOverride?: Storage): void {
  const storage = storageOverride || (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn(`Failed to save settings for key "${key}":`, error);
  }
}

export function getUserPreferencesStorageKey(userId: string): string {
  return `${SETTINGS_STORAGE_KEYS.USER_PREFS_PREFIX}${userId}`;
}

export function loadUserPreferences(userId: string): UserPreferences {
  const fallback = createDefaultUserPreferences(userId);
  return loadSettingsFromStorage(getUserPreferencesStorageKey(userId), fallback);
}
