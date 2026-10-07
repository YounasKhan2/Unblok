/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-13 Workspace Lifecycle & Multi-Workspace Architecture Test Suite
 * Section 51 Acceptance Test Coverage:
 * 1. Workspace model & Identity Decoupling
 * 2. Active workspace resolution & fallback
 * 3. Workspace switching & safe navigation
 * 4. Cross-workspace scoping & zero data leakage
 * 5. Permissions based on active membership role
 * 6. Cross-workspace dependency isolation & invariants
 * 7. Invitation acceptance & workspace activation
 * 8. Workspace lifecycle states (archived, suspended, unavailable, last-admin protection)
 * 9. Workspace creation & onboarding progression
 * 10. Multi-tenant project key resolution
 */

import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AppProviders } from '../../../app/providers/AppProviders';
import { AppRoutes } from '../../../app/router/AppRouter';

import {
  Workspace,
  WorkspaceMembership,
  WorkspaceRole,
  MembershipStatus,
} from '../types';

import {
  resolveActiveWorkspace,
  slugifyWorkspaceName,
} from '../domain/workspaceSelection';

import {
  assertNotLastAdminRemoval,
  assertMutableWorkspace,
  canPerformAdminAction,
  canPerformExecutionAction,
  isWorkspaceMutable,
  resolveOnboardingProgress,
} from '../domain/workspaceLifecycle';

import {
  validateSameWorkspaceDependency,
  assertSameWorkspaceDependency,
  filterEntitiesByWorkspace,
  resolveProjectByWorkspaceAndKey,
} from '../domain/workspaceIsolation';

import {
  SEED_WORKSPACES,
  SEED_MEMBERSHIPS,
  SEED_USERS,
  getMembershipsForUser,
} from '../data/mockWorkspaces';

import {
  MULTI_WORKSPACE_INITIAL_PROJECTS,
  MULTI_WORKSPACE_INITIAL_TEAMS,
  MULTI_WORKSPACE_INITIAL_ISSUES,
  MULTI_WORKSPACE_INITIAL_DEPENDENCIES,
} from '../data/multiWorkspaceMockData';

import { MockWorkspaceAdapter } from '../adapters/mockWorkspaceAdapter';
import { WorkspaceUnavailable } from '../components/WorkspaceUnavailable';
import { ArchivedWorkspaceBanner } from '../components/ArchivedWorkspaceBanner';
import { CreateWorkspacePage } from '../../../pages/onboarding/CreateWorkspacePage';
import { TeamOnboardingPlaceholderPage } from '../../../pages/onboarding/TeamOnboardingPlaceholderPage';

describe('UX-13: Workspace Lifecycle & Multi-Workspace Architecture', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  /* ======================================================================== */
  /* 1. WORKSPACE MODEL & IDENTITY DECOUPLING                                 */
  /* ======================================================================== */
  describe('1. Workspace Model & Identity Decoupling', () => {
    it('User identity contains no authoritative global role', () => {
      // Identity model has id, name, email, avatar
      const user = SEED_USERS['usr_alex'];
      expect(user).toBeDefined();
      expect(user.id).toBe('usr_alex');
      expect(user.email).toBe('alex@acme.com');
      // No authoritative global role on User
      expect((user as any).role).toBeUndefined();
    });

    it('WorkspaceMembership carries the role and status', () => {
      const alexMemberships = getMembershipsForUser('usr_alex');
      expect(alexMemberships.length).toBeGreaterThanOrEqual(2);

      const acmeMembership = alexMemberships.find(m => m.workspaceId === 'ws_acme');
      const apexMembership = alexMemberships.find(m => m.workspaceId === 'ws_apex');

      expect(acmeMembership).toBeDefined();
      expect(acmeMembership?.role).toBe('MEMBER');
      expect(acmeMembership?.status).toBe('ACTIVE');

      expect(apexMembership).toBeDefined();
      expect(apexMembership?.role).toBe('ADMIN');
      expect(apexMembership?.status).toBe('ACTIVE');
    });

    it('Same user holds genuinely different roles across different workspaces', () => {
      // Alex is MEMBER in Acme, but ADMIN in Apex Robotics
      const alexMemberships = getMembershipsForUser('usr_alex');
      const alexAcme = alexMemberships.find(m => m.workspaceId === 'ws_acme');
      const alexApex = alexMemberships.find(m => m.workspaceId === 'ws_apex');
      expect(alexAcme?.role).toBe('MEMBER');
      expect(alexApex?.role).toBe('ADMIN');

      // Sarah is ADMIN in Acme, but OBSERVER in Northstar Labs
      const sarahMemberships = getMembershipsForUser('usr_sarah');
      const sarahAcme = sarahMemberships.find(m => m.workspaceId === 'ws_acme');
      const sarahNorthstar = sarahMemberships.find(m => m.workspaceId === 'ws_northstar');
      expect(sarahAcme?.role).toBe('ADMIN');
      expect(sarahNorthstar?.role).toBe('OBSERVER');
    });
  });

  /* ======================================================================== */
  /* 2. ACTIVE WORKSPACE RESOLUTION & FALLBACK                                 */
  /* ======================================================================== */
  describe('2. Active Workspace Resolution & Fallback', () => {
    const workspaces: Workspace[] = [
      { id: 'ws_acme', name: 'Acme', slug: 'acme', status: 'ACTIVE', createdAt: '2026-01-01' },
      { id: 'ws_apex', name: 'Apex', slug: 'apex', status: 'ACTIVE', createdAt: '2026-02-01' },
      { id: 'ws_northstar', name: 'Northstar', slug: 'northstar', status: 'ACTIVE', createdAt: '2026-03-01' },
    ];

    it('restores valid persisted workspace when membership is ACTIVE', () => {
      const memberships: WorkspaceMembership[] = [
        { id: 'm1', workspaceId: 'ws_acme', userId: 'usr_alex', role: 'MEMBER', status: 'ACTIVE' },
        { id: 'm2', workspaceId: 'ws_apex', userId: 'usr_alex', role: 'ADMIN', status: 'ACTIVE' },
      ];

      const resolved = resolveActiveWorkspace(memberships, 'ws_acme', workspaces);
      expect(resolved.activeWorkspaceId).toBe('ws_acme');
    });

    it('rejects stale/invalid persisted workspace and falls back deterministically', () => {
      const memberships: WorkspaceMembership[] = [
        { id: 'm1', workspaceId: 'ws_acme', userId: 'usr_alex', role: 'MEMBER', status: 'ACTIVE' },
        { id: 'm2', workspaceId: 'ws_apex', userId: 'usr_alex', role: 'ADMIN', status: 'ACTIVE' },
      ];

      // Requesting an unknown or revoked workspace 'ws_deleted'
      const resolved = resolveActiveWorkspace(memberships, 'ws_deleted', workspaces);
      // Fallback prioritizes ADMIN role over MEMBER role
      expect(resolved.activeWorkspaceId).toBe('ws_apex');
    });

    it('deterministic fallback prioritizes ADMIN > MEMBER > OBSERVER', () => {
      const memberships: WorkspaceMembership[] = [
        { id: 'm1', workspaceId: 'ws_northstar', userId: 'user_test', role: 'OBSERVER', status: 'ACTIVE' },
        { id: 'm2', workspaceId: 'ws_apex', userId: 'user_test', role: 'MEMBER', status: 'ACTIVE' },
        { id: 'm3', workspaceId: 'ws_acme', userId: 'user_test', role: 'ADMIN', status: 'ACTIVE' },
      ];

      const resolved = resolveActiveWorkspace(memberships, null, workspaces);
      expect(resolved.activeWorkspaceId).toBe('ws_acme'); // ADMIN wins
    });

    it('returns null when user has zero memberships', () => {
      const resolved = resolveActiveWorkspace([], null, workspaces);
      expect(resolved.activeWorkspaceId).toBeNull();
    });

    it('ignores SUSPENDED or INVITED memberships during active workspace resolution', () => {
      const memberships: WorkspaceMembership[] = [
        { id: 'm1', workspaceId: 'ws_apex', userId: 'user_test', role: 'ADMIN', status: 'SUSPENDED' },
        { id: 'm2', workspaceId: 'ws_acme', userId: 'user_test', role: 'MEMBER', status: 'ACTIVE' },
      ];

      // Even though ws_apex has ADMIN, it is SUSPENDED, so fallback must choose ws_acme
      const resolved = resolveActiveWorkspace(memberships, 'ws_apex', workspaces);
      expect(resolved.activeWorkspaceId).toBe('ws_acme');
    });
  });

  /* ======================================================================== */
  /* 3. WORKSPACE ISOLATION & SCOPING                                         */
  /* ======================================================================== */
  describe('3. Workspace Scoping & Isolation Invariants', () => {
    it('filters projects strictly by workspaceId', () => {
      const acmeProjects = filterEntitiesByWorkspace(MULTI_WORKSPACE_INITIAL_PROJECTS, 'ws_acme');
      const apexProjects = filterEntitiesByWorkspace(MULTI_WORKSPACE_INITIAL_PROJECTS, 'ws_apex');
      const northstarProjects = filterEntitiesByWorkspace(MULTI_WORKSPACE_INITIAL_PROJECTS, 'ws_northstar');

      expect(acmeProjects.some(p => p.id === 'proj_apex_nav')).toBe(false);
      expect(apexProjects.every(p => p.id === 'proj_apex_nav' || p.id === 'proj_apex_lidar')).toBe(true);
      expect(northstarProjects.length).toBe(1);
      expect(northstarProjects[0].id).toBe('proj_ns_sim');
    });

    it('filters teams strictly by workspaceId', () => {
      const acmeTeams = filterEntitiesByWorkspace(MULTI_WORKSPACE_INITIAL_TEAMS, 'ws_acme');
      const apexTeams = filterEntitiesByWorkspace(MULTI_WORKSPACE_INITIAL_TEAMS, 'ws_apex');

      expect(acmeTeams.some(t => t.id === 'team_apex_auto')).toBe(false);
      expect(apexTeams.length).toBe(2);
      expect(apexTeams[0].id).toBe('team_apex_auto');
    });

    it('filters issues strictly by workspaceId (no cross-workspace issue leakage)', () => {
      const acmeIssues = filterEntitiesByWorkspace(MULTI_WORKSPACE_INITIAL_ISSUES, 'ws_acme');
      const apexIssues = filterEntitiesByWorkspace(MULTI_WORKSPACE_INITIAL_ISSUES, 'ws_apex');

      expect(acmeIssues.some(i => i.key === 'NAV-1' || i.key === 'LIDAR-1')).toBe(false);
      expect(apexIssues.some(i => i.key === 'ENG-142')).toBe(false);
      expect(apexIssues.find(i => i.key === 'NAV-1')?.title).toBe('Implement EKF localization node with RTK GPS correction');
    });

    it('resolves project keys scoped to active workspace without cross-tenant conflict', () => {
      const multiProjects = [
        { id: 'proj_1', key: 'ENG', name: 'Acme Eng', workspaceId: 'ws_acme', teamIds: [] },
        { id: 'proj_2', key: 'ENG', name: 'Apex Eng', workspaceId: 'ws_apex', teamIds: [] },
      ];

      const acmeEng = resolveProjectByWorkspaceAndKey(multiProjects, 'ws_acme', 'ENG');
      const apexEng = resolveProjectByWorkspaceAndKey(multiProjects, 'ws_apex', 'ENG');

      expect(acmeEng?.id).toBe('proj_1');
      expect(acmeEng?.name).toBe('Acme Eng');
      expect(apexEng?.id).toBe('proj_2');
      expect(apexEng?.name).toBe('Apex Eng');
    });
  });

  /* ======================================================================== */
  /* 4. CROSS-WORKSPACE DEPENDENCY INVARIANTS                                 */
  /* ======================================================================== */
  describe('4. Cross-Workspace Dependency Invariants', () => {
    it('permits cross-project dependencies within the SAME workspace', () => {
      const isValid = validateSameWorkspaceDependency('ws_acme', 'ws_acme');
      expect(isValid).toBe(true);
      expect(() => {
        assertSameWorkspaceDependency('ws_acme', 'ws_acme');
      }).not.toThrow();
    });

    it('strictly rejects cross-workspace dependency attempts', () => {
      // ws_acme vs ws_apex
      const isValid = validateSameWorkspaceDependency('ws_acme', 'ws_apex');
      expect(isValid).toBe(false);

      expect(() => {
        assertSameWorkspaceDependency('ws_acme', 'ws_apex');
      }).toThrow(/Cross-workspace dependencies are forbidden/);
    });
  });

  /* ======================================================================== */
  /* 5. ROLE RESOLUTION & PERMISSIONS                                         */
  /* ======================================================================== */
  describe('5. Role Resolution & Permissions', () => {
    it('evaluates admin actions based on active membership role', () => {
      const adminMembership: WorkspaceMembership = {
        id: 'm1',
        workspaceId: 'ws_apex',
        userId: 'usr_alex',
        role: 'ADMIN',
        status: 'ACTIVE',
      };
      const memberMembership: WorkspaceMembership = {
        id: 'm2',
        workspaceId: 'ws_acme',
        userId: 'usr_alex',
        role: 'MEMBER',
        status: 'ACTIVE',
      };
      const observerMembership: WorkspaceMembership = {
        id: 'm3',
        workspaceId: 'ws_northstar',
        userId: 'usr_alex',
        role: 'OBSERVER',
        status: 'ACTIVE',
      };

      // Alex as ADMIN in ws_apex
      expect(canPerformAdminAction(adminMembership)).toBe(true);
      expect(canPerformExecutionAction(adminMembership)).toBe(true);

      // Alex as MEMBER in ws_acme
      expect(canPerformAdminAction(memberMembership)).toBe(false);
      expect(canPerformExecutionAction(memberMembership)).toBe(true);

      // Alex as OBSERVER in ws_northstar
      expect(canPerformAdminAction(observerMembership)).toBe(false);
      expect(canPerformExecutionAction(observerMembership)).toBe(false);
    });
  });

  /* ======================================================================== */
  /* 6. WORKSPACE LIFECYCLE & INVARIANTS                                      */
  /* ======================================================================== */
  describe('6. Workspace Lifecycle & Invariants', () => {
    it('enforces last-admin protection invariant', () => {
      const memberships: WorkspaceMembership[] = [
        { id: 'm1', workspaceId: 'ws_test', userId: 'u1', role: 'ADMIN', status: 'ACTIVE' },
        { id: 'm2', workspaceId: 'ws_test', userId: 'u2', role: 'MEMBER', status: 'ACTIVE' },
      ];

      // Demoting or removing the only active admin 'u1' must throw
      expect(() => {
        assertNotLastAdminRemoval(memberships, 'u1', 'ws_test');
      }).toThrow(/Cannot remove or demote the last active Administrator/);

      // Removing a regular member 'u2' is permitted
      expect(() => {
        assertNotLastAdminRemoval(memberships, 'u2', 'ws_test');
      }).not.toThrow();

      // If there are two admins, removing one is permitted
      const twoAdminMemberships: WorkspaceMembership[] = [
        { id: 'm1', workspaceId: 'ws_test', userId: 'u1', role: 'ADMIN', status: 'ACTIVE' },
        { id: 'm2', workspaceId: 'ws_test', userId: 'u2', role: 'ADMIN', status: 'ACTIVE' },
      ];
      expect(() => {
        assertNotLastAdminRemoval(twoAdminMemberships, 'u1', 'ws_test');
      }).not.toThrow();
    });

    it('marks archived workspace as immutable', () => {
      const activeWs: Workspace = { id: 'w1', name: 'Active', slug: 'active', status: 'ACTIVE', createdAt: '2026-01-01' };
      const archivedWs: Workspace = { id: 'w2', name: 'Archived', slug: 'archived', status: 'ARCHIVED', createdAt: '2026-01-01' };

      expect(isWorkspaceMutable(activeWs)).toBe(true);
      expect(isWorkspaceMutable(archivedWs)).toBe(false);
      expect(isWorkspaceMutable(null)).toBe(false);
    });

    it('assertMutableWorkspace fails closed on null and undefined, allows ACTIVE, rejects ARCHIVED', () => {
      const activeWs: Workspace = { id: 'w1', name: 'Active', slug: 'active', status: 'ACTIVE', createdAt: '2026-01-01' };
      const archivedWs: Workspace = { id: 'w2', name: 'Archived', slug: 'archived', status: 'ARCHIVED', createdAt: '2026-01-01' };

      // null throws explicit unavailable error
      expect(() => assertMutableWorkspace(null)).toThrow(/unavailable or unresolved/i);

      // undefined throws explicit unavailable error
      expect(() => assertMutableWorkspace(undefined)).toThrow(/unavailable or unresolved/i);

      // ARCHIVED throws read-only error
      expect(() => assertMutableWorkspace(archivedWs)).toThrow(/archived and read-only/i);

      // ACTIVE is permitted
      expect(() => assertMutableWorkspace(activeWs)).not.toThrow();
    });
  });

  /* ======================================================================== */
  /* 7. ADAPTER PERSISTENCE & CREATION                                        */
  /* ======================================================================== */
  describe('7. MockWorkspaceAdapter Operations', () => {
    it('creates new workspace and gives creator ADMIN role', async () => {
      const adapter = new MockWorkspaceAdapter();
      const res = await adapter.createWorkspace('usr_david', { name: 'Vanguard Systems' });
      const newWs = res.workspace;

      expect(newWs.id).toBeDefined();
      expect(newWs.name).toBe('Vanguard Systems');
      expect(newWs.slug).toBe('vanguard-systems');
      expect(newWs.status).toBe('ACTIVE');

      const memberships = await adapter.getUserMemberships('usr_david');
      const vanguardMembership = memberships.find(m => m.workspaceId === newWs.id);

      expect(vanguardMembership).toBeDefined();
      expect(vanguardMembership?.role).toBe('ADMIN');
      expect(vanguardMembership?.status).toBe('ACTIVE');
    });

    it('persists and retrieves active workspace id for user', async () => {
      const adapter = new MockWorkspaceAdapter();
      await adapter.setActiveWorkspaceId('usr_alex', 'ws_apex');

      const saved = await adapter.getActiveWorkspaceId('usr_alex');
      expect(saved).toBe('ws_apex');
    });

    it('accepts invitation and activates membership without workspace creation', async () => {
      const adapter = new MockWorkspaceAdapter();
      const membership = await adapter.acceptInvitation('ws_apex', 'user_new', 'MEMBER');

      expect(membership.workspaceId).toBe('ws_apex');
      expect(membership.userId).toBe('user_new');
      expect(membership.role).toBe('MEMBER');
      expect(membership.status).toBe('ACTIVE');

      const userMemberships = await adapter.getUserMemberships('user_new');
      expect(userMemberships.some(m => m.workspaceId === 'ws_apex')).toBe(true);
    });

    it('prevents transitioning the final ACTIVE ADMIN to non-ACTIVE status while allowing non-final admin', async () => {
      const adapter = new MockWorkspaceAdapter();
      // Sarah is the sole active admin on ws_acme
      await expect(
        adapter.updateMembershipStatus('mem_sarah_acme', 'SUSPENDED')
      ).rejects.toThrow(/Cannot remove or demote the last active Administrator/);

      // Alex is a member on ws_acme and can be suspended
      const updatedAlex = await adapter.updateMembershipStatus('mem_alex_acme', 'SUSPENDED');
      expect(updatedAlex?.status).toBe('SUSPENDED');

      // Now add a second admin to ws_acme
      await adapter.acceptInvitation('ws_acme', 'usr_second_admin', 'ADMIN');

      // Now Sarah is no longer the final active admin, so suspending Sarah is permitted
      const updatedSarah = await adapter.updateMembershipStatus('mem_sarah_acme', 'SUSPENDED');
      expect(updatedSarah?.status).toBe('SUSPENDED');
    });

    it('preserves existing last-admin removal protection', async () => {
      const adapter = new MockWorkspaceAdapter();
      // Sole admin on apex cannot be removed
      await expect(
        adapter.removeMembership('mem_alex_apex')
      ).rejects.toThrow(/Cannot remove or demote the last active Administrator/);
    });
  });

  /* ======================================================================== */
  /* 8. ONBOARDING PROGRESSION                                                */
  /* ======================================================================== */
  describe('8. Onboarding Progression Model', () => {
    it('resolves ACCOUNT_CREATED when user has zero memberships', () => {
      const progress = resolveOnboardingProgress([]);
      expect(progress).toBe('ACCOUNT_CREATED');
    });

    it('resolves WORKSPACE_CREATED or COMPLETE when memberships exist', () => {
      const progress = resolveOnboardingProgress([
        { id: 'm1', workspaceId: 'ws_1', userId: 'u1', role: 'ADMIN', status: 'ACTIVE' },
      ]);
      expect(progress).toBe('WORKSPACE_CREATED');
    });
  });

  /* ======================================================================== */
  /* 9. UI COMPONENTS & ACCESSIBILITY CONTRACTS                              */
  /* ======================================================================== */
  describe('9. UI Components & Visual States', () => {
    it('renders WorkspaceUnavailable view with accessible recovery actions', () => {
      const html = renderToString(
        <AppProviders initialAuthStatus="authenticated">
          <MemoryRouter>
            <WorkspaceUnavailable />
          </MemoryRouter>
        </AppProviders>
      );
      expect(html).toContain('Workspace unavailable');
      expect(html).toContain('You no longer have active access to this workspace');
      expect(html).toContain('Create new workspace');
    });

    it('renders ArchivedWorkspaceBanner in read-only state', () => {
      const html = renderToString(
        <AppProviders initialAuthStatus="authenticated">
          <MemoryRouter>
            <ArchivedWorkspaceBanner forceShow={true} workspaceName="Legacy Archive" />
          </MemoryRouter>
        </AppProviders>
      );
      expect(html).toContain('Legacy Archive');
      expect(html).toContain('is archived');
      expect(html).toContain('Read-Only Mode');
    });

    it('renders CreateWorkspacePage with minimal required fields', () => {
      const html = renderToString(
        <AppProviders initialAuthStatus="authenticated">
          <MemoryRouter>
            <CreateWorkspacePage />
          </MemoryRouter>
        </AppProviders>
      );
      expect(html).toContain('Create your workspace');
      expect(html).toContain('Workspace name');
      expect(html).toContain('Workspace URL preview');
      expect(html).toContain('Create workspace');
      expect(html).not.toContain('Company size');
      expect(html).not.toContain('Credit card');
    });

    it('renders TeamOnboardingPlaceholderPage as UX-14 clean boundary', () => {
      const html = renderToString(
        <AppProviders initialAuthStatus="authenticated">
          <MemoryRouter>
            <TeamOnboardingPlaceholderPage />
          </MemoryRouter>
        </AppProviders>
      );
      expect(html).toContain('Workspace Created');
      expect(html).toContain('Team Setup Boundary');
      expect(html).toContain('Enter workspace');
    });
  });

  /* ======================================================================== */
  /* 10. APP ROUTING & INTEGRATION                                            */
  /* ======================================================================== */
  describe('10. Integrated App Routing & Shell', () => {
    it('renders workspace switcher button in authenticated shell', () => {
      const html = renderToString(
        <AppProviders initialAuthStatus="authenticated">
          <MemoryRouter initialEntries={['/my-work']}>
            <AppRoutes />
          </MemoryRouter>
        </AppProviders>
      );
      expect(html).toContain('data-testid="workspace-switcher-trigger"');
      expect(html).toContain('aria-haspopup="menu"');
    });

    it('renders onboarding workspace route at /onboarding/workspace', () => {
      const html = renderToString(
        <AppProviders initialAuthStatus="authenticated">
          <MemoryRouter initialEntries={['/onboarding/workspace']}>
            <AppRoutes />
          </MemoryRouter>
        </AppProviders>
      );
      expect(html).toContain('Create your workspace');
    });

    it('renders onboarding team boundary at /onboarding/team', () => {
      const html = renderToString(
        <AppProviders initialAuthStatus="authenticated">
          <MemoryRouter initialEntries={['/onboarding/team']}>
            <AppRoutes />
          </MemoryRouter>
        </AppProviders>
      );
      expect(html).toContain('Workspace Created');
      expect(html).toContain('Team Setup Boundary');
    });
  });
});
