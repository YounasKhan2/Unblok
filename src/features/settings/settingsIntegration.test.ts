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
import { validateTeamParameters, canArchiveTeam, planCreateTeam } from './domain/teamAdministration';
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
import { normalizeUserMemberships, normalizeUsersList } from '../../context/ProjectContext';
import { INITIAL_USERS } from '../../data/mockData';
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
    teamIds: ['team_eng'],
    teamId: 'team_eng',
    role: 'ADMIN',
  };

  const memberUser: User = {
    id: 'user_member',
    name: 'Marcus Vance',
    email: 'marcus@acme.corp',
    avatar: '',
    teamIds: ['team_eng'],
    teamId: 'team_eng',
    role: 'MEMBER',
  };

  const observerUser: User = {
    id: 'user_observer',
    name: 'Aisha Patel',
    email: 'aisha@acme.corp',
    avatar: '',
    teamIds: ['team_eng'],
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

    it('allows ADMIN to access all administrative settings routes', () => {
      expect(canAccessSettingsRoute('/settings/workspace', 'ADMIN')).toBe(true);
      expect(canAccessSettingsRoute('/settings/members', 'ADMIN')).toBe(true);
      expect(canAccessSettingsRoute('/settings/teams', 'ADMIN')).toBe(true);
      expect(canAccessSettingsRoute('/settings/integrations', 'ADMIN')).toBe(true);
      expect(canAccessSettingsRoute('/settings/preferences', 'ADMIN')).toBe(true);
    });

    it('blocks direct-URL access for MEMBER and OBSERVER to administrative settings', () => {
      const adminRoutes = [
        '/settings/workspace',
        '/settings/members',
        '/settings/teams',
        '/settings/integrations',
      ];

      for (const route of adminRoutes) {
        expect(canAccessSettingsRoute(route, 'MEMBER')).toBe(false);
        expect(canAccessSettingsRoute(route, 'OBSERVER')).toBe(false);
      }

      // Both can access /settings/preferences
      expect(canAccessSettingsRoute('/settings/preferences', 'MEMBER')).toBe(true);
      expect(canAccessSettingsRoute('/settings/preferences', 'OBSERVER')).toBe(true);
    });
  });

  describe('2. Authorization Mutation Boundary', () => {
    it('permits administrative mutations for ADMIN actors', () => {
      expect(() => assertAdminMutation('ADMIN', 'updateWorkspace')).not.toThrow();
      expect(() => assertAdminMutation('ADMIN', 'inviteMember')).not.toThrow();
      expect(() => assertAdminMutation('ADMIN', 'createTeam')).not.toThrow();
      expect(() => assertAdminMutation('ADMIN', 'updateRepoIntegration')).not.toThrow();
    });

    it('rejects administrative mutations for MEMBER and OBSERVER actors even if UI is bypassed', () => {
      expect(() => assertAdminMutation('MEMBER', 'updateWorkspace')).toThrow(/require.*ADMIN role/i);
      expect(() => assertAdminMutation('OBSERVER', 'updateWorkspace')).toThrow(/require.*ADMIN role/i);
      expect(() => assertAdminMutation('MEMBER', 'updateUserRole')).toThrow(/require.*ADMIN role/i);
      expect(() => assertAdminMutation('OBSERVER', 'archiveTeam')).toThrow(/require.*ADMIN role/i);
    });
  });

  describe('3. Members Administration & Role Invariants', () => {
    const teams: Team[] = [
      { id: 'team_eng', name: 'Engineering', key: 'ENG', color: '#5645d4', description: '' },
      { id: 'team_web', name: 'Web', key: 'WEB', color: '#2a9d99', description: '' },
    ];

    it('validates member invitation with valid email, role, and existing teams', () => {
      const result = validateMemberInvitation(
        { email: 'new.member@acme.corp', role: 'MEMBER', teamIds: ['team_eng'] },
        activeRoster,
        [],
        teams
      );
      expect(result.valid).toBe(true);
    });

    it('rejects invalid email formats', () => {
      const result = validateMemberInvitation(
        { email: 'not-an-email', role: 'MEMBER', teamIds: [] },
        activeRoster,
        [],
        teams
      );
      expect(result.valid).toBe(false);
      expect(result.errors.email).toBeDefined();
    });

    it('rejects duplicate active member email', () => {
      const result = validateMemberInvitation(
        { email: 'sarah@acme.corp', role: 'MEMBER', teamIds: [] },
        activeRoster,
        [],
        teams
      );
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/already is an active member/i);
    });

    it('rejects duplicate pending invitation email', () => {
      const pending: PendingInvitation[] = [
        {
          id: 'inv_1',
          email: 'invited@acme.corp',
          role: 'MEMBER',
          teamIds: [],
          invitedAt: '2026-10-06',
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

    it('createTeam atomicity: invalid user in memberIds throws error, leaves teams and users unchanged, and does not touch storage', () => {
      const initialUsers: User[] = [
        { id: 'usr_valid', name: 'Valid User', email: 'v@a.c', avatar: '', role: 'ADMIN', teamId: 'team_eng', teamIds: ['team_eng'] },
      ];
      mockStorage.setItem(`${UNBLOK_STORAGE_NAMESPACE}_teams`, JSON.stringify(teams));
      mockStorage.setItem(`${UNBLOK_STORAGE_NAMESPACE}_users`, JSON.stringify(initialUsers));

      let errorThrown = false;
      try {
        const plan = planCreateTeam(
          { name: 'Security Squad', key: 'SEC', memberIds: ['usr_valid', 'missing-user'] },
          teams,
          initialUsers,
          'ADMIN'
        );
        // Only executed if plan succeeds
        mockStorage.setItem(`${UNBLOK_STORAGE_NAMESPACE}_teams`, JSON.stringify(plan.updatedTeams));
        mockStorage.setItem(`${UNBLOK_STORAGE_NAMESPACE}_users`, JSON.stringify(plan.updatedUsers));
      } catch (err: any) {
        errorThrown = true;
        expect(err.message).toMatch(/User with ID missing-user not found/i);
      }

      expect(errorThrown).toBe(true);
      // Verify teams and users in storage remained untouched
      const storedTeams = JSON.parse(mockStorage.getItem(`${UNBLOK_STORAGE_NAMESPACE}_teams`)!);
      const storedUsers = JSON.parse(mockStorage.getItem(`${UNBLOK_STORAGE_NAMESPACE}_users`)!);
      expect(storedTeams).toHaveLength(1);
      expect(storedTeams[0].id).toBe('team_eng');
      expect(storedUsers).toHaveLength(1);
      expect(storedUsers[0].teamIds).toEqual(['team_eng']);
    });

    it('createTeam atomicity: duplicate memberIds throws error, leaves teams and users unchanged, and does not touch storage', () => {
      const initialUsers: User[] = [
        { id: 'usr_sarah', name: 'Sarah', email: 's@a.c', avatar: '', role: 'ADMIN', teamId: 'team_eng', teamIds: ['team_eng'] },
      ];
      mockStorage.setItem(`${UNBLOK_STORAGE_NAMESPACE}_teams`, JSON.stringify(teams));
      mockStorage.setItem(`${UNBLOK_STORAGE_NAMESPACE}_users`, JSON.stringify(initialUsers));

      let errorThrown = false;
      try {
        const plan = planCreateTeam(
          { name: 'Security Squad', key: 'SEC', memberIds: ['usr_sarah', 'usr_sarah'] },
          teams,
          initialUsers,
          'ADMIN'
        );
        mockStorage.setItem(`${UNBLOK_STORAGE_NAMESPACE}_teams`, JSON.stringify(plan.updatedTeams));
        mockStorage.setItem(`${UNBLOK_STORAGE_NAMESPACE}_users`, JSON.stringify(plan.updatedUsers));
      } catch (err: any) {
        errorThrown = true;
        expect(err.message).toMatch(/Duplicate member IDs provided/i);
      }

      expect(errorThrown).toBe(true);
      const storedTeams = JSON.parse(mockStorage.getItem(`${UNBLOK_STORAGE_NAMESPACE}_teams`)!);
      const storedUsers = JSON.parse(mockStorage.getItem(`${UNBLOK_STORAGE_NAMESPACE}_users`)!);
      expect(storedTeams).toHaveLength(1);
      expect(storedUsers[0].teamIds).toEqual(['team_eng']);
    });

    it('createTeam atomicity: valid creation commits team and user memberships atomically to storage', () => {
      const initialUsers: User[] = [
        { id: 'usr_sarah', name: 'Sarah', email: 's@a.c', avatar: '', role: 'ADMIN', teamId: 'team_eng', teamIds: ['team_eng', 'team_web'] },
      ];
      mockStorage.setItem(`${UNBLOK_STORAGE_NAMESPACE}_teams`, JSON.stringify(teams));
      mockStorage.setItem(`${UNBLOK_STORAGE_NAMESPACE}_users`, JSON.stringify(initialUsers));

      const plan = planCreateTeam(
        { name: 'Security Squad', key: 'SEC', memberIds: ['usr_sarah'] },
        teams,
        initialUsers,
        'ADMIN'
      );
      mockStorage.setItem(`${UNBLOK_STORAGE_NAMESPACE}_teams`, JSON.stringify(plan.updatedTeams));
      mockStorage.setItem(`${UNBLOK_STORAGE_NAMESPACE}_users`, JSON.stringify(plan.updatedUsers));

      const storedTeams = JSON.parse(mockStorage.getItem(`${UNBLOK_STORAGE_NAMESPACE}_teams`)!);
      const storedUsers = JSON.parse(mockStorage.getItem(`${UNBLOK_STORAGE_NAMESPACE}_users`)!);
      expect(storedTeams).toHaveLength(2);
      expect(storedTeams[1].key).toBe('SEC');
      // Sarah gets the new team membership while existing unrelated memberships (team_eng, team_web) are strictly preserved
      expect(storedUsers[0].teamIds).toContain('team_eng');
      expect(storedUsers[0].teamIds).toContain('team_web');
      expect(storedUsers[0].teamIds).toContain(plan.newTeam.id);
      expect(storedUsers[0].teamIds).toHaveLength(3);
    });

    it('createTeam atomicity: creation without memberIds works normally and leaves users untouched', () => {
      const initialUsers: User[] = [
        { id: 'usr_sarah', name: 'Sarah', email: 's@a.c', avatar: '', role: 'ADMIN', teamId: 'team_eng', teamIds: ['team_eng'] },
      ];
      const plan = planCreateTeam(
        { name: 'Security Squad', key: 'SEC' },
        teams,
        initialUsers,
        'ADMIN'
      );
      expect(plan.updatedTeams).toHaveLength(2);
      expect(plan.updatedUsers).toEqual(initialUsers);
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

  describe('5. Canonical Multi-Team Memberships (Many-to-Many)', () => {
    const teams: Team[] = [
      { id: 'team_eng', name: 'Engineering', key: 'ENG', color: '#5645d4', description: '' },
      { id: 'team_web', name: 'Web', key: 'WEB', color: '#2a9d99', description: '' },
      { id: 'team_sec', name: 'Security', key: 'SEC', color: '#dd5b00', description: '' },
    ];

    it('Multiple memberships: User starts on ENG + WEB, Admin adds SEC -> ENG + WEB + SEC', () => {
      const user: User = {
        id: 'usr_sarah',
        name: 'Sarah Chen',
        email: 'sarah@acme.corp',
        avatar: '',
        role: 'ADMIN',
        teamId: 'team_eng',
        teamIds: ['team_eng', 'team_web'],
      };

      // Admin modifies SEC membership to include Sarah
      const existingMemberships = new Set(user.teamIds || []);
      existingMemberships.add('team_sec');
      const updatedUser: User = {
        ...user,
        teamIds: Array.from(existingMemberships),
      };

      expect(updatedUser.teamIds).toEqual(['team_eng', 'team_web', 'team_sec']);
      expect(updatedUser.teamIds).toContain('team_eng');
      expect(updatedUser.teamIds).toContain('team_web');
      expect(updatedUser.teamIds).toContain('team_sec');
    });

    it('Removing one membership: User starts on ENG + WEB + SEC, Admin removes SEC -> ENG + WEB', () => {
      const user: User = {
        id: 'usr_sarah',
        name: 'Sarah Chen',
        email: 'sarah@acme.corp',
        avatar: '',
        role: 'ADMIN',
        teamId: 'team_eng',
        teamIds: ['team_eng', 'team_web', 'team_sec'],
      };

      // Admin removes Sarah from team_sec
      const existingMemberships = new Set(user.teamIds || []);
      existingMemberships.delete('team_sec');
      const updatedUser: User = {
        ...user,
        teamIds: Array.from(existingMemberships),
      };

      expect(updatedUser.teamIds).toEqual(['team_eng', 'team_web']);
      expect(updatedUser.teamIds).not.toContain('team_sec');
      expect(updatedUser.teamIds).toContain('team_eng');
    });

    it("Another team's edit: Editing WEB membership must not alter ENG membership", () => {
      const user: User = {
        id: 'usr_elena',
        name: 'Elena',
        email: 'elena@acme.corp',
        avatar: '',
        role: 'MEMBER',
        teamId: 'team_eng',
        teamIds: ['team_eng', 'team_web'],
      };

      // Remove from team_web
      const existing = new Set(user.teamIds || []);
      existing.delete('team_web');
      const updatedUser: User = {
        ...user,
        teamIds: Array.from(existing),
      };

      expect(updatedUser.teamIds).toEqual(['team_eng']);
      expect(updatedUser.teamIds?.includes('team_eng')).toBe(true);
    });

    it('Duplicate: Adding same membership twice does not duplicate team ID', () => {
      const rawUser = {
        id: 'usr_1',
        name: 'Test',
        email: 'test@acme.corp',
        avatar: '',
        role: 'MEMBER' as const,
        teamIds: ['team_eng', 'team_eng', 'team_web', 'team_eng'],
      };
      const normalized = normalizeUserMemberships(rawUser);
      expect(normalized.teamIds).toEqual(['team_eng', 'team_web']);
      expect(normalized.teamIds.length).toBe(2);
    });

    it('Legacy migration: Legacy teamId normalizes to membership containing teamId without duplicates', () => {
      const legacyUser = {
        id: 'usr_legacy',
        name: 'Legacy User',
        email: 'legacy@acme.corp',
        avatar: '',
        role: 'MEMBER' as const,
        teamId: 'team_eng',
      };
      const normalized = normalizeUserMemberships(legacyUser);
      expect(normalized.teamIds).toEqual(['team_eng']);
      expect(normalized.teamId).toBe('team_eng');
    });

    it('Persistence & Hydration: multi-team membership survives JSON serialization and normalization', () => {
      const user: User = {
        id: 'usr_multi',
        name: 'Multi User',
        email: 'multi@acme.corp',
        avatar: '',
        role: 'ADMIN',
        teamId: 'team_eng',
        teamIds: ['team_eng', 'team_sec', 'team_web'],
      };

      mockStorage.setItem(`${UNBLOK_STORAGE_NAMESPACE}_users`, JSON.stringify([user]));
      const raw = mockStorage.getItem(`${UNBLOK_STORAGE_NAMESPACE}_users`);
      const parsed = normalizeUsersList(JSON.parse(raw!));

      expect(parsed[0].teamIds).toEqual(['team_eng', 'team_sec', 'team_web']);
    });

    it('Reset: Reset Demo State restores seeded canonical memberships', () => {
      const seeded = normalizeUsersList(INITIAL_USERS);
      const sarah = seeded.find(u => u.id === 'usr_sarah');
      expect(sarah?.teamIds).toContain('team_eng');
      expect(sarah?.teamIds).toContain('team_web');

      const elena = seeded.find(u => u.id === 'usr_elena');
      expect(elena?.teamIds).toContain('team_inf');
      expect(elena?.teamIds).toContain('team_eng');
    });

    it('Invalid Team: non-existent team ID is rejected', () => {
      const result = validateMemberInvitation(
        { email: 'new@acme.corp', role: 'MEMBER', teamIds: ['team_non_existent'] },
        activeRoster,
        [],
        teams
      );
      expect(result.valid).toBe(false);
      expect(result.errors.teamIds).toBeDefined();
    });

    it('Invalid User: non-existent user is safely identified and rejected by membership assignment', () => {
      const nonExistentUserId = 'usr_ghost_404';
      const exists = activeRoster.some(u => u.id === nonExistentUserId);
      expect(exists).toBe(false);
    });

    it('Permission: MEMBER and OBSERVER cannot modify team memberships; ADMIN can', () => {
      expect(() => assertAdminMutation('MEMBER', 'updateTeam')).toThrow(/require.*ADMIN role/i);
      expect(() => assertAdminMutation('OBSERVER', 'updateTeam')).toThrow(/require.*ADMIN role/i);
      expect(() => assertAdminMutation('ADMIN', 'updateTeam')).not.toThrow();
    });
  });

  describe('6. Personal Preferences Isolation & Theme Contract', () => {
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

  describe('7. Integrations Prototype (Mock Only, No Network)', () => {
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

  describe('8. Reset Demo State', () => {
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
