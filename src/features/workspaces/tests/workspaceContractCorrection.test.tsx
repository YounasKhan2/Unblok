/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-13 Multi-Workspace Contract Correction Regression Suite
 * Covers all requirements in Section 6:
 * - null active workspace exposes zero scoped records
 * - invalid active workspace exposes zero records
 * - revoked/suspended membership transitions
 * - deterministic fallback after removal
 * - archived workspace mutation rejection
 * - switching ADMIN -> MEMBER -> OBSERVER
 * - immediate permission correctness
 * - malformed entity without workspaceId
 * - cross-workspace issue/dependency mutation rejection
 * - same project key in two workspaces
 * - invitation membership remains correctly scoped
 */

import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';

import {
  Workspace,
  WorkspaceMembership,
} from '../types';

import {
  resolveActiveWorkspace,
} from '../domain/workspaceSelection';

import {
  assertMutableWorkspace,
  assertExecutionPermission,
  canPerformExecutionAction,
  isWorkspaceMutable,
} from '../domain/workspaceLifecycle';

import {
  assertEntityWorkspaceOwnership,
  assertSameWorkspaceDependency,
  validateSameWorkspaceDependency,
  filterEntitiesByWorkspace,
  resolveProjectByWorkspaceAndKey,
} from '../domain/workspaceIsolation';

import {
  WorkspaceProvider,
  useWorkspace,
} from '../context/WorkspaceContext';

import {
  ProjectProvider,
  useProject,
} from '../../../context/ProjectContext';

import { AuthProvider } from '../../auth/context/AuthContext';
import { Issue, Project } from '../../../types';

const TEST_WORKSPACES: Workspace[] = [
  {
    id: 'ws_alpha',
    name: 'Alpha Corp',
    slug: 'alpha-corp',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'ws_beta',
    name: 'Beta Labs',
    slug: 'beta-labs',
    status: 'ACTIVE',
    createdAt: '2026-01-02T00:00:00.000Z',
  },
  {
    id: 'ws_archived',
    name: 'Archived Vault',
    slug: 'archived-vault',
    status: 'ARCHIVED',
    createdAt: '2025-01-01T00:00:00.000Z',
  },
];

const TEST_MEMBERSHIPS: WorkspaceMembership[] = [
  {
    id: 'mem_user_alpha',
    workspaceId: 'ws_alpha',
    userId: 'usr_test',
    role: 'ADMIN',
    status: 'ACTIVE',
    joinedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'mem_user_beta',
    workspaceId: 'ws_beta',
    userId: 'usr_test',
    role: 'MEMBER',
    status: 'ACTIVE',
    joinedAt: '2026-01-02T00:00:00.000Z',
  },
  {
    id: 'mem_user_archived',
    workspaceId: 'ws_archived',
    userId: 'usr_test',
    role: 'OBSERVER',
    status: 'ACTIVE',
    joinedAt: '2025-01-01T00:00:00.000Z',
  },
];

describe('UX-13 Multi-Workspace Contract Correction', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  /* ======================================================================== */
  /* 1. NULL & INVALID ACTIVE WORKSPACE ZERO-PROJECTION CONTRACT               */
  /* ======================================================================== */
  describe('1. Null & Invalid Workspace Isolation', () => {
    it('null active workspace exposes zero scoped records and no Acme leakage', () => {
      let capturedWs: any = null;
      let capturedProj: any = null;

      const Harness: React.FC = () => {
        capturedWs = useWorkspace();
        capturedProj = useProject();
        return <div data-testid="harness">Harness</div>;
      };

      renderToString(
        <AuthProvider initialStatus="authenticated">
          <WorkspaceProvider initialMemberships={[]} initialWorkspaces={TEST_WORKSPACES}>
            <ProjectProvider>
              <Harness />
            </ProjectProvider>
          </WorkspaceProvider>
        </AuthProvider>
      );

      expect(capturedWs.activeWorkspaceId).toBeNull();
      expect(capturedProj.issues).toEqual([]);
      expect(capturedProj.projects).toEqual([]);
      expect(capturedProj.teams).toEqual([]);
      expect(capturedProj.dependencies).toEqual([]);
      expect(capturedProj.cycles).toEqual([]);
      expect(capturedProj.milestones).toEqual([]);
      expect(capturedProj.activities).toEqual([]);
    });

    it('invalid active workspace exposes zero records', () => {
      const records = [
        { id: 'iss-1', workspaceId: 'ws_alpha' },
        { id: 'iss-2', workspaceId: 'ws_beta' },
        { id: 'iss-3', workspaceId: 'ws_acme' },
      ];

      const filtered = filterEntitiesByWorkspace(records, 'ws_nonexistent_404');
      expect(filtered).toHaveLength(0);
      expect(filtered).toEqual([]);
    });

    it('filterEntitiesByWorkspace strictly excludes entities with missing or invalid workspaceId', () => {
      const mixed: { id: string; workspaceId?: string | null }[] = [
        { id: '1', workspaceId: 'ws_alpha' },
        { id: '2', workspaceId: undefined },
        { id: '3', workspaceId: null },
        { id: '4', workspaceId: '' },
        { id: '5' },
      ];

      const alphaOnly = filterEntitiesByWorkspace(mixed as any, 'ws_alpha');
      expect(alphaOnly).toHaveLength(1);
      expect((alphaOnly[0] as any).id).toBe('1');

      const nullOnly = filterEntitiesByWorkspace(mixed as any, null);
      expect(nullOnly).toHaveLength(0);
    });
  });

  /* ======================================================================== */
  /* 2. MEMBERSHIP LIFECYCLE TRANSITIONS & DETERMINISTIC RESOLUTION            */
  /* ======================================================================== */
  describe('2. Membership Transitions & Deterministic Resolution', () => {
    it('revoked/suspended active membership deterministically falls back to next valid workspace', () => {
      // Test deterministic fallback domain logic when alpha membership is SUSPENDED
      const memberships: WorkspaceMembership[] = [
        { ...TEST_MEMBERSHIPS[0], status: 'SUSPENDED' },
        { ...TEST_MEMBERSHIPS[1], status: 'ACTIVE' },
        { ...TEST_MEMBERSHIPS[2], status: 'ACTIVE' },
      ];

      const resolved = resolveActiveWorkspace(memberships, 'ws_alpha', TEST_WORKSPACES);
      // Because ws_alpha membership is SUSPENDED, it must fall back to ws_beta
      expect(resolved.activeWorkspaceId).toBe('ws_beta');

      // When both Alpha and Beta are SUSPENDED (revoked from active access)
      const suspendedBoth: WorkspaceMembership[] = [
        { ...TEST_MEMBERSHIPS[0], status: 'SUSPENDED' },
        { ...TEST_MEMBERSHIPS[1], status: 'SUSPENDED' },
        { ...TEST_MEMBERSHIPS[2], status: 'ACTIVE' },
      ];

      const resolvedBoth = resolveActiveWorkspace(suspendedBoth, 'ws_alpha', TEST_WORKSPACES);
      // Both Alpha and Beta suspended -> falls back to ws_archived
      expect(resolvedBoth.activeWorkspaceId).toBe('ws_archived');
    });

    it('deterministic fallback after removal of active membership', () => {
      // Remove alpha membership
      const remainingMemberships: WorkspaceMembership[] = [
        TEST_MEMBERSHIPS[1], // Beta
        TEST_MEMBERSHIPS[2], // Archived
      ];

      const resolved = resolveActiveWorkspace(remainingMemberships, 'ws_alpha', TEST_WORKSPACES);
      expect(resolved.activeWorkspaceId).toBe('ws_beta');

      // Remove all memberships
      const noneResolved = resolveActiveWorkspace([], 'ws_alpha', TEST_WORKSPACES);
      expect(noneResolved.activeWorkspaceId).toBeNull();
      expect(noneResolved.resolutionSource).toBe('zero_memberships');
    });

    it('invitation membership (INVITED) is not selected as active workspace', () => {
      const invitedMembership: WorkspaceMembership = {
        id: 'mem_invited',
        workspaceId: 'ws_alpha',
        userId: 'usr_test',
        role: 'MEMBER',
        status: 'INVITED',
        joinedAt: '2026-01-01T00:00:00.000Z',
      };

      const resolved = resolveActiveWorkspace(
        [invitedMembership],
        null,
        TEST_WORKSPACES
      );

      // Status INVITED must not be selected as active workspace
      expect(resolved.activeWorkspaceId).toBeNull();
    });
  });

  /* ======================================================================== */
  /* 3. ARCHIVED WORKSPACE MUTATION REJECTION (AUTHORITATIVE)                  */
  /* ======================================================================== */
  describe('3. Archived Workspace Mutation Rejection', () => {
    it('assertMutableWorkspace throws ARCHIVED_WORKSPACE_READ_ONLY for archived workspaces', () => {
      const archivedWs = TEST_WORKSPACES.find(w => w.id === 'ws_archived')!;
      expect(isWorkspaceMutable(archivedWs)).toBe(false);

      expect(() => {
        assertMutableWorkspace(archivedWs);
      }).toThrowError(/archived and read-only/i);
    });

    it('ProjectContext rejects issue creation and updates in archived workspace', () => {
      let capturedProj: any = null;
      let capturedWs: any = null;

      const Harness: React.FC = () => {
        capturedProj = useProject();
        capturedWs = useWorkspace();
        return <div>Harness</div>;
      };

      renderToString(
        <AuthProvider initialStatus="authenticated">
          <WorkspaceProvider
            initialMemberships={[TEST_MEMBERSHIPS[2]]} // ws_archived
            initialWorkspaces={TEST_WORKSPACES}
          >
            <ProjectProvider>
              <Harness />
            </ProjectProvider>
          </WorkspaceProvider>
        </AuthProvider>
      );

      expect(capturedWs.activeWorkspace?.status).toBe('ARCHIVED');

      // Attempt createIssue should throw
      expect(() => {
        capturedProj.createIssue({
          title: 'Forbidden Issue in Archived Workspace',
          projectId: 'p_1',
          teamId: 't_1',
          state: 'TODO',
          priority: 'MEDIUM',
        });
      }).toThrow(/archived/i);

      // Attempt updateIssueState should return false
      const updateResult = capturedProj.updateIssueState('any_issue', 'DONE');
      expect(updateResult).toBe(false);

      // Attempt addDependency should return false
      const depResult = capturedProj.addDependency('iss-1', 'iss-2', 'BLOCKS');
      expect(depResult).toBe(false);
    });
  });

  /* ======================================================================== */
  /* 4. PERMISSION AUTHORITY & IMMEDIATE CORRECTNESS                           */
  /* ======================================================================== */
  describe('4. Permission Authority & Role Synchronization', () => {
    it('effective role is strictly derived from active membership role', () => {
      let capturedAlphaProj: any = null;
      let capturedBetaProj: any = null;
      let capturedArchivedProj: any = null;

      const HarnessAlpha: React.FC = () => {
        capturedAlphaProj = useProject();
        return <div>Alpha</div>;
      };

      const HarnessBeta: React.FC = () => {
        capturedBetaProj = useProject();
        return <div>Beta</div>;
      };

      const HarnessArchived: React.FC = () => {
        capturedArchivedProj = useProject();
        return <div>Archived</div>;
      };

      // In Alpha: ADMIN
      renderToString(
        <AuthProvider initialStatus="authenticated">
          <WorkspaceProvider
            initialMemberships={[TEST_MEMBERSHIPS[0]]}
            initialWorkspaces={TEST_WORKSPACES}
          >
            <ProjectProvider>
              <HarnessAlpha />
            </ProjectProvider>
          </WorkspaceProvider>
        </AuthProvider>
      );
      expect(capturedAlphaProj.currentUser.role).toBe('ADMIN');

      // In Beta: MEMBER
      renderToString(
        <AuthProvider initialStatus="authenticated">
          <WorkspaceProvider
            initialMemberships={[TEST_MEMBERSHIPS[1]]}
            initialWorkspaces={TEST_WORKSPACES}
          >
            <ProjectProvider>
              <HarnessBeta />
            </ProjectProvider>
          </WorkspaceProvider>
        </AuthProvider>
      );
      expect(capturedBetaProj.currentUser.role).toBe('MEMBER');

      // In Archived: OBSERVER
      renderToString(
        <AuthProvider initialStatus="authenticated">
          <WorkspaceProvider
            initialMemberships={[TEST_MEMBERSHIPS[2]]}
            initialWorkspaces={TEST_WORKSPACES}
          >
            <ProjectProvider>
              <HarnessArchived />
            </ProjectProvider>
          </WorkspaceProvider>
        </AuthProvider>
      );
      expect(capturedArchivedProj.currentUser.role).toBe('OBSERVER');
    });

    it('OBSERVER role rejects execution mutations', () => {
      let capturedProj: any = null;

      const observerMembership: WorkspaceMembership = {
        id: 'mem_beta_obs',
        workspaceId: 'ws_beta',
        userId: 'usr_test',
        role: 'OBSERVER',
        status: 'ACTIVE',
        joinedAt: '2026-01-01T00:00:00.000Z',
      };

      const Harness: React.FC = () => {
        capturedProj = useProject();
        return <div>Harness</div>;
      };

      renderToString(
        <AuthProvider initialStatus="authenticated">
          <WorkspaceProvider
            initialMemberships={[observerMembership]}
            initialWorkspaces={TEST_WORKSPACES}
          >
            <ProjectProvider>
              <Harness />
            </ProjectProvider>
          </WorkspaceProvider>
        </AuthProvider>
      );

      expect(capturedProj.currentUser.role).toBe('OBSERVER');

      expect(() => {
        capturedProj.createIssue({
          title: 'Forbidden for Observer',
          projectId: 'p_1',
          teamId: 't_1',
          state: 'TODO',
          priority: 'MEDIUM',
        });
      }).toThrow(/read-only/i);
    });

    it('assertExecutionPermission rejects OBSERVER role', () => {
      const activeWs = TEST_WORKSPACES[0];
      const observerMembership: WorkspaceMembership = {
        id: 'mem_obs',
        workspaceId: activeWs.id,
        userId: 'usr_test',
        role: 'OBSERVER',
        status: 'ACTIVE',
        joinedAt: '2026-01-01T00:00:00.000Z',
      };

      expect(canPerformExecutionAction(observerMembership, activeWs)).toBe(false);
      expect(() => {
        assertExecutionPermission(observerMembership, activeWs);
      }).toThrowError(/read-only/i);
    });
  });

  /* ======================================================================== */
  /* 5. ENTITY ISOLATION, CROSS-WORKSPACE REJECTION & SAME PROJECT KEY         */
  /* ======================================================================== */
  describe('5. Entity Isolation & Cross-Workspace Boundaries', () => {
    it('assertEntityWorkspaceOwnership rejects entities from other workspaces or missing workspaceId', () => {
      const validAlpha = { id: 'iss_1', workspaceId: 'ws_alpha' };
      expect(() => {
        assertEntityWorkspaceOwnership(validAlpha, 'ws_alpha');
      }).not.toThrow();

      const foreignBeta = { id: 'iss_2', workspaceId: 'ws_beta' };
      expect(() => {
        assertEntityWorkspaceOwnership(foreignBeta, 'ws_alpha');
      }).toThrowError(/Cross-workspace/i);

      const malformedNoWs = { id: 'iss_3' };
      expect(() => {
        assertEntityWorkspaceOwnership(malformedNoWs as any, 'ws_alpha');
      }).toThrowError(/Cross-workspace/i);
    });

    it('validateSameWorkspaceDependency and assertSameWorkspaceDependency reject cross-workspace dependencies', () => {
      const alphaWsId = 'ws_alpha';
      const betaWsId = 'ws_beta';

      expect(validateSameWorkspaceDependency(alphaWsId, alphaWsId)).toBe(true);
      expect(validateSameWorkspaceDependency(alphaWsId, betaWsId)).toBe(false);

      expect(() => {
        assertSameWorkspaceDependency(alphaWsId, betaWsId);
      }).toThrowError('Cross-workspace dependencies are forbidden');
    });

    it('malformed issue without workspaceId is rejected by dependency validation', () => {
      const alphaWsId = 'ws_alpha';
      const noWsId = undefined;

      expect(validateSameWorkspaceDependency(alphaWsId, noWsId)).toBe(false);
      expect(validateSameWorkspaceDependency(noWsId, alphaWsId)).toBe(false);
    });

    it('resolves the same project key in two workspaces to distinct workspace-scoped projects', () => {
      const projects: Partial<Project>[] = [
        { id: 'proj_alpha_core', workspaceId: 'ws_alpha', key: 'CORE', name: 'Alpha Core' },
        { id: 'proj_beta_core', workspaceId: 'ws_beta', key: 'CORE', name: 'Beta Core' },
      ];

      const resolvedAlpha = resolveProjectByWorkspaceAndKey(projects as Project[], 'ws_alpha', 'CORE');
      const resolvedBeta = resolveProjectByWorkspaceAndKey(projects as Project[], 'ws_beta', 'CORE');

      expect(resolvedAlpha).toBeDefined();
      expect(resolvedAlpha?.id).toBe('proj_alpha_core');
      expect(resolvedAlpha?.name).toBe('Alpha Core');

      expect(resolvedBeta).toBeDefined();
      expect(resolvedBeta?.id).toBe('proj_beta_core');
      expect(resolvedBeta?.name).toBe('Beta Core');

      // Searching nonexistent workspace or invalid key returns undefined
      expect(resolveProjectByWorkspaceAndKey(projects as Project[], 'ws_gamma', 'CORE')).toBeUndefined();
    });
  });
});
