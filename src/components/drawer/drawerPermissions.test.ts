/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { getDrawerPermissions, canMutateDrawerField } from './drawerPermissions';

describe('IssueDrawer Permission Contracts', () => {
  describe('OBSERVER role restrictions', () => {
    it('enforces read-only state for Observer in drawer', () => {
      const perms = getDrawerPermissions('OBSERVER');
      expect(perms.isReadOnly).toBe(true);
    });

    it('ensures Observer drawer title is read-only', () => {
      const perms = getDrawerPermissions('OBSERVER');
      expect(perms.canEditTitle).toBe(false);
    });

    it('ensures Observer drawer description is read-only', () => {
      const perms = getDrawerPermissions('OBSERVER');
      expect(perms.canEditDescription).toBe(false);
    });

    it('ensures Observer cannot trigger title mutation', () => {
      expect(canMutateDrawerField('OBSERVER')).toBe(false);
    });

    it('ensures Observer cannot trigger description mutation', () => {
      expect(canMutateDrawerField('OBSERVER')).toBe(false);
    });

    it('ensures Observer child property, dependency, and comment controls remain read-only', () => {
      const perms = getDrawerPermissions('OBSERVER');
      expect(perms.canEditProperties).toBe(false);
      expect(perms.canManageDependencies).toBe(false);
      expect(perms.canComment).toBe(false);
    });
  });

  describe('MEMBER role permissions', () => {
    it('retains drawer editing capabilities for Member', () => {
      const perms = getDrawerPermissions('MEMBER');
      expect(perms.isReadOnly).toBe(false);
      expect(perms.canEditTitle).toBe(true);
      expect(perms.canEditDescription).toBe(true);
      expect(perms.canEditProperties).toBe(true);
      expect(perms.canManageDependencies).toBe(true);
      expect(perms.canComment).toBe(true);
      expect(canMutateDrawerField('MEMBER')).toBe(true);
    });
  });

  describe('ADMIN role permissions', () => {
    it('retains drawer editing capabilities for Admin', () => {
      const perms = getDrawerPermissions('ADMIN');
      expect(perms.isReadOnly).toBe(false);
      expect(perms.canEditTitle).toBe(true);
      expect(perms.canEditDescription).toBe(true);
      expect(perms.canEditProperties).toBe(true);
      expect(perms.canManageDependencies).toBe(true);
      expect(perms.canComment).toBe(true);
      expect(canMutateDrawerField('ADMIN')).toBe(true);
    });
  });
});
