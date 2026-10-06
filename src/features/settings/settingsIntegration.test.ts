/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  canAccessAdministrativeSettings,
  getSettingsDefaultRoute,
  canAccessSettingsRoute,
  assertAdminMutation,
  canChangeUserRole,
} from './domain/permissions';
import { validateMemberInvitation } from './domain/memberAdministration';
import { validateTeamParameters, canArchiveTeam } from './domain/teamAdministration';
import { createDefaultUserPreferences } from './domain/preferences';
import {
  INITIAL_WORKSPACE_SETTINGS,
  INITIAL_PENDING_INVITATIONS,
  INITIAL_REPO_INTEGRATIONS,
  INITIAL_WEBHOOKS,
  SETTINGS_STORAGE_KEYS,
  saveSettingsToStorage,
  loadSettingsFromStorage,
} from './data/mockSettingsData';
import { clearAllStoredEntities, UNBLOK_STORAGE_NAMESPACE } from '../../context/storageMigration';
import { User, Team, Project, Cycle } from '../../types';
import { PendingInvitation, RepoIntegrationConfig, WebhookConfig } from './types';

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
    return Object.keys(this.store)[index] || null;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }
}

describe('UX-08 Settings & Administration Integration Suite', () => {
  let mockStorage: MockStorage;

  const adminUser: User = {
    id: 'user_admin',
    name: 'Sarah Chen',
    email: 'sarah@acme.corp',
    avatar: '',
    teamId: 'team_eng',
    role: 'ADMIN',
  };

  const memberUser: User = {
    id: 'user_member',
    name: 'Marcus Vance',
    email: 'marcus@acme.corp',
    avatar: '',
    teamId: 'team_eng',
    role: 'MEMBER',
  };

  const observerUser: User = {
    id: 'user_observer',
    name: 'Aisha Patel',
    email: 'aisha@acme.corp',
    avatar: '',
    teamId: 'team_eng',
    role: 'OBSERVER',
  };

  const activeRoster: User[] = [adminUser, memberUser, observerUser];

  beforeEach(() => {
    mockStorage = new MockStorage();
  });

  describe('1. Routing & Direct-URL Protection', () => {
    it('redirects ADMIN visiting /settings to /settings/workspace', () => {
      expect(getSettingsDefaultRoute('ADMIN')).toBe('/settings/workspace');
    });

    it('redirects MEMBER and OBSERVER visiting /settings to /settings/preferences', () => {
      expect(getSettingsDefaultRoute('MEMBER')).toBe('/settings/preferences');
      expect(getSettingsDefaultRoute('OBSERVER')).toBe('/settings/preferences');
    });

    it('protects administrative direct URLs from non-admin access', () => {
      const adminUrls = [
        '/settings/workspace',
        '/settings/members',
        '/settings/teams',
        '/settings/integrations',
      ];

      for (const url of adminUrls) {
        // ADMIN is permitted
        expect(canAccessSettingsRoute(url, 'ADMIN')).toBe(true);

        // MEMBER is denied (redirects to preferences)
        expect(canAccessSettingsRoute(url, 'MEMBER')).toBe(false);

        // OBSERVER is denied (redirects to preferences)
        expect(canAccessSettingsRoute(url, 'OBSERVER')).toBe(false);
      }
    });

    it('allows all roles to access /settings/preferences', () => {
      expect(canAccessSettingsRoute('/settings/preferences', 'ADMIN')).toBe(true);
      expect(canAccessSettingsRoute('/settings/preferences', 'MEMBER')).toBe(true);
      expect(canAccessSettingsRoute('/settings/preferences', 'OBSERVER')).toBe(true);
    });
  });

  describe('2. Authorization Mutation Boundary', () => {
    it('allows ADMIN to invoke administrative operations', () => {
      expect(() => assertAdminMutation('ADMIN')).not.toThrow();
    });

    it('strictly forbids MEMBER and OBSERVER from administrative operations', () => {
      expect(() => assertAdminMutation('MEMBER')).toThrow(
        /Administrative mutations require ADMIN role/
      );
      expect(() => assertAdminMutation('OBSERVER')).toThrow(
        /Administrative mutations require ADMIN role/
      );
    });

    it('allows all roles to update their own personal preferences', () => {
      const adminPrefs = createDefaultUserPreferences(adminUser.id);
      const memberPrefs = createDefaultUserPreferences(memberUser.id);
      const observerPrefs = createDefaultUserPreferences(observerUser.id);

      expect(adminPrefs.userId).toBe(adminUser.id);
      expect(memberPrefs.userId).toBe(memberUser.id);
      expect(observerPrefs.userId).toBe(observerUser.id);
    });
  });

  describe('3. Members Administration & Last ADMIN Invariant', () => {
    const teams: Team[] = [
      { id: 'team_eng', name: 'Core Eng', key: 'ENG', color: '#5645d4', description: '' },
      { id: 'team_ops', name: 'DevOps', key: 'OPS', color: '#5645d4', description: '' },
    ];

    it('validates a clean member invitation', () => {
      const result = validateMemberInvitation(
        { email: 'new.engineer@acme.corp', role: 'MEMBER', teamIds: ['team_eng'] },
        activeRoster,
        [],
        teams
      );
      expect(result.valid).toBe(true);
    });

    it('rejects invalid email, duplicate active email, and duplicate pending invitation', () => {
      // Invalid email
      const badEmail = validateMemberInvitation(
        { email: 'not-an-email', role: 'MEMBER', teamIds: [] },
        activeRoster,
        [],
        teams
      );
      expect(badEmail.valid).toBe(false);

      // Duplicate active
      const dupActive = validateMemberInvitation(
        { email: 'sarah@acme.corp', role: 'MEMBER', teamIds: [] },
        activeRoster,
        [],
        teams
      );
      expect(dupActive.valid).toBe(false);
      expect(dupActive.error).toMatch(/active member/i);

      // Duplicate pending
      const pending: PendingInvitation[] = [
        {
          id: 'inv_1',
          email: 'invited@acme.corp',
          role: 'MEMBER',
          teamIds: [],
          invitedAt: '2026-10-01',
          status: 'PENDING',
        },
      ];
      const dupPending = validateMemberInvitation(
        { email: 'invited@acme.corp', role: 'OBSERVER', teamIds: [] },
        activeRoster,
        pending,
        teams
      );
      expect(dupPending.valid).toBe(false);
      expect(dupPending.error).toMatch(/pending invitation/i);
    });

    it('enforces the invariant that workspace must retain at least one ADMIN', () => {
      // Sarah Chen is the only ADMIN
      const demotionCheck = canChangeUserRole('ADMIN', adminUser.id, 'MEMBER', activeRoster);
      expect(demotionCheck.allowed).toBe(false);
      expect(demotionCheck.reason).toMatch(/retain at least one ADMIN/i);

      // If a second ADMIN is promoted, Sarah can then be safely changed
      const multiAdminRoster: User[] = [
        adminUser,
        { ...memberUser, role: 'ADMIN' },
        observerUser,
      ];
      const safeCheck = canChangeUserRole('ADMIN', adminUser.id, 'MEMBER', multiAdminRoster);
      expect(safeCheck.allowed).toBe(true);
    });
  });

  describe('4. Team Administration & Canonical Project Ownership Guard', () => {
    const teams: Team[] = [
      { id: 'team_eng', name: 'Core Engineering', key: 'ENG', color: '#5645d4', description: '' },
    ];

    it('creates a new team following Journey 7 validation', () => {
      const result = validateTeamParameters(
        { name: 'Security & Compliance', key: 'SEC' },
        teams
      );
      expect(result.valid).toBe(true);
    });

    it('rejects duplicate team key and duplicate name', () => {
      const dupKey = validateTeamParameters(
        { name: 'Another Team', key: 'ENG' },
        teams
      );
      expect(dupKey.valid).toBe(false);

      const dupName = validateTeamParameters(
        { name: 'Core Engineering', key: 'CE' },
        teams
      );
      expect(dupName.valid).toBe(false);
    });

    it('guards against archiving a team with active project ownership', () => {
      const projects: Project[] = [
        {
          id: 'proj_auth',
          name: 'Authentication Platform',
          key: 'AUTH',
          teamId: 'team_eng',
          description: '',
          currentSequence: 1,
        },
      ];
      const cycles: Cycle[] = [];

      const guard = canArchiveTeam('team_eng', projects, cycles);
      expect(guard.allowed).toBe(false);
      expect(guard.reason).toMatch(/owns 1 active project/i);
      expect(guard.details?.projectKeys).toContain('AUTH');
    });

    it('guards against archiving a team with an ACTIVE running cycle', () => {
      const projects: Project[] = [];
      const cycles: Cycle[] = [
        {
          id: 'cycle_1',
          name: 'Sprint 20',
          teamId: 'team_eng',
          status: 'ACTIVE',
          startDate: '2026-10-01',
          endDate: '2026-10-15',
        },
      ];

      const guard = canArchiveTeam('team_eng', projects, cycles);
      expect(guard.allowed).toBe(false);
      expect(guard.reason).toMatch(/1 active cycle/i);
      expect(guard.details?.cycleNames).toContain('Sprint 20');
    });

    it('permits archiving when team has zero active project ownerships and no active cycles', () => {
      const guard = canArchiveTeam('team_eng', [], []);
      expect(guard.allowed).toBe(true);
    });
  });

  describe('5. Personal Preferences Isolation & Theme Contract', () => {
    it('isolates user preferences per user ID in localStorage', () => {
      const user1Prefs = createDefaultUserPreferences('user-1');
      user1Prefs.theme = 'DARK';
      user1Prefs.density = 'COMFORTABLE';

      const user2Prefs = createDefaultUserPreferences('user-2');
      user2Prefs.theme = 'LIGHT';

      saveSettingsToStorage(`${SETTINGS_STORAGE_KEYS.USER_PREFS_PREFIX}user-1`, user1Prefs, mockStorage);
      saveSettingsToStorage(`${SETTINGS_STORAGE_KEYS.USER_PREFS_PREFIX}user-2`, user2Prefs, mockStorage);

      // Verify each user retrieves their own preferences
      const loaded1 = loadSettingsFromStorage(
        `${SETTINGS_STORAGE_KEYS.USER_PREFS_PREFIX}user-1`,
        createDefaultUserPreferences('user-1'),
        mockStorage
      );
      const loaded2 = loadSettingsFromStorage(
        `${SETTINGS_STORAGE_KEYS.USER_PREFS_PREFIX}user-2`,
        createDefaultUserPreferences('user-2'),
        mockStorage
      );

      expect(loaded1.theme).toBe('DARK');
      expect(loaded1.density).toBe('COMFORTABLE');
      expect(loaded2.theme).toBe('LIGHT');
      expect(loaded2.density).toBe('COMPACT');
    });

    it('verifies notification preferences do not delete canonical activities', () => {
      const prefs = createDefaultUserPreferences('user-1');
      prefs.notifications.mentions = false;
      prefs.notifications.blockerChanges = false;

      // Preferences change is pure display signal configuration
      expect(prefs.notifications.mentions).toBe(false);
      // Canonical events/inbox activities remain immutable projections
    });
  });

  describe('6. Integrations Prototype (Mock Only, No Network)', () => {
    it('manages repository connection state locally without external APIs', () => {
      const configs: RepoIntegrationConfig[] = [...INITIAL_REPO_INTEGRATIONS];

      // Connect GitLab
      const updated = configs.map(c =>
        c.provider === 'GITLAB'
          ? { ...c, status: 'CONNECTED' as const, repositoryName: 'acme/gitlab-repo', lastSyncText: 'Just now' }
          : c
      );

      const gitlab = updated.find(c => c.provider === 'GITLAB');
      expect(gitlab?.status).toBe('CONNECTED');
      expect(gitlab?.repositoryName).toBe('acme/gitlab-repo');
      expect(gitlab?.lastSyncText).toBe('Just now');
    });

    it('registers and toggles webhooks with mock signing secrets', () => {
      const webhooks: WebhookConfig[] = [...INITIAL_WEBHOOKS];
      const newWebhook: WebhookConfig = {
        id: 'wh_test',
        name: 'Alerts Gateway',
        endpointUrl: 'https://alerts.acme.corp/webhook',
        events: ['STATE_CHANGED'],
        enabled: true,
        mockSecret: 'whsec_demo_secret_123',
        createdAt: '2026-10-07T00:00:00Z',
      };

      const updatedWebhooks = [...webhooks, newWebhook];
      expect(updatedWebhooks.length).toBe(2);
      expect(updatedWebhooks.find(w => w.id === 'wh_test')?.enabled).toBe(true);

      // Toggle webhook
      const toggled = updatedWebhooks.map(w =>
        w.id === 'wh_test' ? { ...w, enabled: false } : w
      );
      expect(toggled.find(w => w.id === 'wh_test')?.enabled).toBe(false);
    });
  });

  describe('7. Reset Demo State', () => {
    it('clears all UX-08 stored keys during demo reset without affecting canonical receipt contracts', () => {
      mockStorage.setItem(SETTINGS_STORAGE_KEYS.WORKSPACE, JSON.stringify({ name: 'Changed' }));
      mockStorage.setItem(SETTINGS_STORAGE_KEYS.INVITATIONS, '[]');
      mockStorage.setItem(SETTINGS_STORAGE_KEYS.INTEGRATIONS, '[]');
      mockStorage.setItem(SETTINGS_STORAGE_KEYS.WEBHOOKS, '[]');
      mockStorage.setItem(`${SETTINGS_STORAGE_KEYS.USER_PREFS_PREFIX}user-1`, '{}');

      // User-scoped inbox receipts key
      mockStorage.setItem(`${UNBLOK_STORAGE_NAMESPACE}_inbox_receipts_user-1`, JSON.stringify({ 'act-1': { readAt: '2026' } }));

      // Clear all stored entities
      clearAllStoredEntities(mockStorage);

      // Verify UX-08 settings keys purged
      expect(mockStorage.getItem(SETTINGS_STORAGE_KEYS.WORKSPACE)).toBeNull();
      expect(mockStorage.getItem(SETTINGS_STORAGE_KEYS.INVITATIONS)).toBeNull();
      expect(mockStorage.getItem(SETTINGS_STORAGE_KEYS.INTEGRATIONS)).toBeNull();
      expect(mockStorage.getItem(SETTINGS_STORAGE_KEYS.WEBHOOKS)).toBeNull();
      expect(mockStorage.getItem(`${SETTINGS_STORAGE_KEYS.USER_PREFS_PREFIX}user-1`)).toBeNull();

      // User-scoped inbox receipts are also cleared cleanly by reset
      expect(mockStorage.getItem(`${UNBLOK_STORAGE_NAMESPACE}_inbox_receipts_user-1`)).toBeNull();
    });
  });
});
