import { describe, it, expect } from 'vitest';
import {
  canAccessAdministrativeSettings,
  getSettingsDefaultRoute,
  canAccessSettingsRoute,
  assertAdminMutation,
  canChangeUserRole,
} from './permissions';
import { User } from '../../../types';

describe('UX-08 Settings Permissions Domain', () => {
  const adminUser: User = {
    id: 'u-admin',
    name: 'Admin User',
    email: 'admin@unblok.dev',
    avatar: '',
    teamId: 'team-1',
    role: 'ADMIN',
  };

  const memberUser: User = {
    id: 'u-member',
    name: 'Member User',
    email: 'member@unblok.dev',
    avatar: '',
    teamId: 'team-1',
    role: 'MEMBER',
  };

  const observerUser: User = {
    id: 'u-observer',
    name: 'Observer User',
    email: 'observer@unblok.dev',
    avatar: '',
    teamId: 'team-1',
    role: 'OBSERVER',
  };

  describe('Route and Role Mappings', () => {
    it('determines administrative capability strictly for ADMIN', () => {
      expect(canAccessAdministrativeSettings('ADMIN')).toBe(true);
      expect(canAccessAdministrativeSettings('MEMBER')).toBe(false);
      expect(canAccessAdministrativeSettings('OBSERVER')).toBe(false);
    });

    it('derives canonical /settings redirect for each role', () => {
      expect(getSettingsDefaultRoute('ADMIN')).toBe('/settings/workspace');
      expect(getSettingsDefaultRoute('MEMBER')).toBe('/settings/preferences');
      expect(getSettingsDefaultRoute('OBSERVER')).toBe('/settings/preferences');
    });

    it('permits route access correctly', () => {
      // Preferences accessible to everyone
      expect(canAccessSettingsRoute('/settings/preferences', 'ADMIN')).toBe(true);
      expect(canAccessSettingsRoute('/settings/preferences', 'MEMBER')).toBe(true);
      expect(canAccessSettingsRoute('/settings/preferences', 'OBSERVER')).toBe(true);

      // Admin routes protected
      expect(canAccessSettingsRoute('/settings/workspace', 'ADMIN')).toBe(true);
      expect(canAccessSettingsRoute('/settings/workspace', 'MEMBER')).toBe(false);
      expect(canAccessSettingsRoute('/settings/workspace', 'OBSERVER')).toBe(false);

      expect(canAccessSettingsRoute('/settings/members', 'ADMIN')).toBe(true);
      expect(canAccessSettingsRoute('/settings/members', 'MEMBER')).toBe(false);

      expect(canAccessSettingsRoute('/settings/teams', 'ADMIN')).toBe(true);
      expect(canAccessSettingsRoute('/settings/teams', 'OBSERVER')).toBe(false);

      expect(canAccessSettingsRoute('/settings/integrations', 'ADMIN')).toBe(true);
      expect(canAccessSettingsRoute('/settings/integrations', 'MEMBER')).toBe(false);
    });
  });

  describe('Mutation Authorization Boundary', () => {
    it('permits ADMIN to invoke admin mutations', () => {
      expect(() => assertAdminMutation('ADMIN')).not.toThrow();
    });

    it('rejects MEMBER and OBSERVER with unauthorized error', () => {
      expect(() => assertAdminMutation('MEMBER')).toThrow(
        /Administrative mutations require ADMIN role/
      );
      expect(() => assertAdminMutation('OBSERVER')).toThrow(
        /Administrative mutations require ADMIN role/
      );
    });
  });

  describe('Last ADMIN Invariant Protection', () => {
    it('allows demoting an ADMIN if other ADMINs exist', () => {
      const roster: User[] = [
        adminUser,
        { id: 'u-admin-2', name: 'Second Admin', email: 'admin2@unblok.dev', avatar: '', teamId: 'team-1', role: 'ADMIN' },
        memberUser,
      ];
      expect(canChangeUserRole('ADMIN', 'u-admin', 'MEMBER', roster).allowed).toBe(true);
    });

    it('prevents demoting the last remaining ADMIN in the workspace', () => {
      const roster: User[] = [adminUser, memberUser, observerUser];
      expect(canChangeUserRole('ADMIN', 'u-admin', 'MEMBER', roster).allowed).toBe(false);
      expect(canChangeUserRole('ADMIN', 'u-admin', 'OBSERVER', roster).allowed).toBe(false);
    });

    it('allows changing roles of non-admin users freely', () => {
      const roster: User[] = [adminUser, memberUser, observerUser];
      expect(canChangeUserRole('ADMIN', 'u-member', 'ADMIN', roster).allowed).toBe(true);
      expect(canChangeUserRole('ADMIN', 'u-observer', 'MEMBER', roster).allowed).toBe(true);
    });
  });
});
