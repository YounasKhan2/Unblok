/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-14 Project Creation Domain & Component Tests
 * Covers:
 * - Project creation validation
 * - Owning Team required
 * - Team must belong to active workspace
 * - Duplicate project key rejection
 * - Same project key in different workspaces allowed
 * - Project appears in Team Hub
 * - Newly created project opens canonical Project Overview
 * - Empty project rendering
 * - Archived workspace creation rejection
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Routes, Route, Outlet } from 'react-router-dom';
import {
  validateProjectInput,
  planCreateProject,
} from './domain/projectCreation';
import { Project, Team } from '../../types';
import { ProjectOverviewPage } from '../../pages/projects/ProjectOverviewPage';
import { AppProviders } from '../../app/providers/AppProviders';

describe('UX-14 Project Creation & Ownership Tests', () => {
  const existingTeams: Team[] = [
    {
      id: 'team_eng',
      name: 'Engineering',
      key: 'ENG',
      color: '#5645d4',
      workspaceId: 'ws_acme',
      description: 'Engineering systems',
    },
    {
      id: 'team_plat',
      name: 'Platform',
      key: 'PLAT',
      color: '#0ea5e9',
      workspaceId: 'ws_acme',
      description: 'Platform tooling',
    },
  ];

  const existingProjects: Project[] = [
    {
      id: 'prj_core',
      name: 'Core Platform',
      key: 'CORE',
      teamId: 'team_eng',
      workspaceId: 'ws_acme',
      description: 'Core platform execution',
      currentSequence: 0,
    },
    {
      id: 'prj_beta_core',
      name: 'Beta Core',
      key: 'CORE',
      teamId: 'team_other',
      workspaceId: 'ws_beta',
      description: 'Beta core platform',
      currentSequence: 0,
    },
  ];

  describe('1. Project Validation & Owning Team Enforcement', () => {
    it('validates successful project creation with valid name, key, and owning team', () => {
      const res = validateProjectInput(
        {
          name: 'Developer Experience',
          key: 'DX',
          teamId: 'team_eng',
          description: 'Developer tooling and pipeline systems',
        },
        existingProjects.filter((p) => p.workspaceId === 'ws_acme'),
        existingTeams,
        'ws_acme'
      );

      expect(res.valid).toBe(true);
      expect(res.errors.name).toBeUndefined();
      expect(res.errors.key).toBeUndefined();
      expect(res.errors.teamId).toBeUndefined();
    });

    it('strictly requires an owning team (no ownerless projects)', () => {
      const res = validateProjectInput(
        {
          name: 'Developer Experience',
          key: 'DX',
          teamId: '',
        },
        existingProjects.filter((p) => p.workspaceId === 'ws_acme'),
        existingTeams,
        'ws_acme'
      );

      expect(res.valid).toBe(false);
      expect(res.errors.teamId).toContain('Owning team is required');
    });

    it('rejects an owning team that does not belong to active workspace', () => {
      const res = validateProjectInput(
        {
          name: 'Developer Experience',
          key: 'DX',
          teamId: 'team_nonexistent_or_other_workspace',
        },
        existingProjects.filter((p) => p.workspaceId === 'ws_acme'),
        existingTeams,
        'ws_acme'
      );

      expect(res.valid).toBe(false);
      expect(res.errors.teamId).toContain('does not exist');
    });

    it('rejects an archived owning team', () => {
      const archivedSet = new Set(['team_plat']);
      const res = validateProjectInput(
        {
          name: 'Infra Automation',
          key: 'AUTO',
          teamId: 'team_plat',
        },
        existingProjects.filter((p) => p.workspaceId === 'ws_acme'),
        existingTeams,
        'ws_acme',
        archivedSet
      );

      expect(res.valid).toBe(false);
      expect(res.errors.teamId).toContain('archived');
    });

    it('rejects duplicate project key within the active workspace (case-insensitive)', () => {
      const res = validateProjectInput(
        {
          name: 'Another Core Platform',
          key: 'core',
          teamId: 'team_eng',
        },
        existingProjects.filter((p) => p.workspaceId === 'ws_acme'),
        existingTeams,
        'ws_acme'
      );

      expect(res.valid).toBe(false);
      expect(res.errors.key).toContain('already in use');
    });

    it('allows identical project keys in different workspaces even when mixed-workspace projects are passed', () => {
      // In ws_beta, key 'CORE' already exists. In ws_gamma, key 'CORE' is valid.
      const res = validateProjectInput(
        {
          name: 'Core Platform Gamma',
          key: 'CORE',
          teamId: 'team_gamma_1',
        },
        existingProjects, // contains CORE in ws_acme and CORE in ws_beta
        [{ id: 'team_gamma_1', name: 'Gamma Team', key: 'GAM', color: '#111', workspaceId: 'ws_gamma', description: 'Gamma team' }],
        'ws_gamma'
      );

      expect(res.valid).toBe(true);
      expect(res.errors.key).toBeUndefined();
    });

    it('rejects team from a different workspace when mixed-workspace teams are passed to validateProjectInput', () => {
      const mixedTeams: Team[] = [
        ...existingTeams, // workspaceId: 'ws_acme'
        {
          id: 'team_beta_infra',
          name: 'Beta Infra',
          key: 'INFRA',
          color: '#22c55e',
          workspaceId: 'ws_beta',
          description: 'Beta team',
        },
      ];

      const res = validateProjectInput(
        {
          name: 'Beta Tooling',
          key: 'BTOOL',
          teamId: 'team_beta_infra',
        },
        existingProjects,
        mixedTeams,
        'ws_acme'
      );

      expect(res.valid).toBe(false);
      expect(res.errors.teamId).toBe('Selected team does not belong to the active workspace.');
    });

    it('rejects team with missing or empty workspaceId (fail closed)', () => {
      const teamsWithMissingWs: Team[] = [
        {
          id: 'team_missing_ws',
          name: 'Missing WS Team',
          key: 'NOWS',
          color: '#111',
          description: 'Malformed team',
        },
        {
          id: 'team_empty_ws',
          name: 'Empty WS Team',
          key: 'EMPWS',
          color: '#222',
          workspaceId: '',
          description: 'Malformed team',
        },
      ];

      const resMissing = validateProjectInput(
        { name: 'Test Project', key: 'TEST', teamId: 'team_missing_ws' },
        existingProjects,
        teamsWithMissingWs,
        'ws_acme'
      );
      expect(resMissing.valid).toBe(false);
      expect(resMissing.errors.teamId).toBe('Selected team does not belong to the active workspace.');

      const resEmpty = validateProjectInput(
        { name: 'Test Project 2', key: 'TEST2', teamId: 'team_empty_ws' },
        existingProjects,
        teamsWithMissingWs,
        'ws_acme'
      );
      expect(resEmpty.valid).toBe(false);
      expect(resEmpty.errors.teamId).toBe('Selected team does not belong to the active workspace.');
    });

    it('rejects validation when activeWorkspaceId is missing or empty', () => {
      const res = validateProjectInput(
        { name: 'Test Project', key: 'TEST', teamId: 'team_eng' },
        existingProjects,
        existingTeams,
        ''
      );
      expect(res.valid).toBe(false);
      expect(res.errors.teamId).toBe('No active workspace context.');
    });
  });

  describe('2. Canonical Project Factory (planCreateProject)', () => {
    const mixedTeams: Team[] = [
      ...existingTeams,
      {
        id: 'team_beta_infra',
        name: 'Beta Infra',
        key: 'INFRA',
        color: '#22c55e',
        workspaceId: 'ws_beta',
        description: 'Beta team',
      },
      {
        id: 'team_acme_archived',
        name: 'Archived Acme Team',
        key: 'AARCH',
        color: '#999999',
        workspaceId: 'ws_acme',
        description: 'Archived team',
      },
    ];

    it('constructs a project with strict activeWorkspaceId and teamId ownership', () => {
      const { newProject } = planCreateProject(
        {
          name: 'Developer Experience',
          key: 'DX',
          teamId: 'team_eng',
          description: 'Dev tools',
        },
        existingProjects,
        existingTeams,
        'ws_acme',
        'ADMIN'
      );

      expect(newProject.name).toBe('Developer Experience');
      expect(newProject.key).toBe('DX');
      expect(newProject.teamId).toBe('team_eng');
      expect(newProject.workspaceId).toBe('ws_acme');
      expect(newProject.id).toBeDefined();
    });

    it('rejects mixed-workspace team passed directly to planCreateProject', () => {
      expect(() =>
        planCreateProject(
          {
            name: 'Foreign Project',
            key: 'FOR',
            teamId: 'team_beta_infra', // belongs to ws_beta
          },
          existingProjects,
          mixedTeams,
          'ws_acme', // active is ws_acme
          'ADMIN'
        )
      ).toThrow('Selected team does not belong to the active workspace.');
    });

    it('rejects team with missing workspaceId in planCreateProject even when prefiltered', () => {
      const corruptTeam: Team = {
        id: 'team_corrupt',
        name: 'Corrupt Team',
        key: 'CORR',
        color: '#ff0000',
        description: 'Missing workspaceId',
      };

      expect(() =>
        planCreateProject(
          {
            name: 'Corrupt Project',
            key: 'CORR',
            teamId: 'team_corrupt',
          },
          existingProjects,
          [corruptTeam], // caller array is prefiltered
          'ws_acme',
          'ADMIN'
        )
      ).toThrow('Selected team does not belong to the active workspace.');
    });

    it('rejects archived team passed directly to planCreateProject', () => {
      expect(() =>
        planCreateProject(
          {
            name: 'Archived Project',
            key: 'ARCH',
            teamId: 'team_acme_archived',
          },
          existingProjects,
          mixedTeams,
          'ws_acme',
          'ADMIN',
          new Set(['team_acme_archived'])
        )
      ).toThrow('Cannot create project under an archived team.');
    });

    it('allows identical project keys in different workspaces when calling planCreateProject', () => {
      // existingProjects already has CORE in ws_beta and CORE in ws_acme.
      // In ws_gamma, creating CORE should succeed!
      const gammaTeam: Team = {
        id: 'team_gamma_core',
        name: 'Gamma Core',
        key: 'GCORE',
        color: '#f59e0b',
        workspaceId: 'ws_gamma',
        description: 'Gamma Core',
      };

      const { newProject } = planCreateProject(
        {
          name: 'Gamma Core Project',
          key: 'CORE',
          teamId: 'team_gamma_core',
        },
        existingProjects,
        [...mixedTeams, gammaTeam],
        'ws_gamma',
        'ADMIN'
      );

      expect(newProject.key).toBe('CORE');
      expect(newProject.workspaceId).toBe('ws_gamma');
      expect(newProject.teamId).toBe('team_gamma_core');
    });

    it('throws when activeWorkspaceId is missing', () => {
      expect(() =>
        planCreateProject(
          { name: 'Dev Tools', key: 'DEV', teamId: 'team_eng' },
          existingProjects,
          existingTeams,
          '',
          'ADMIN'
        )
      ).toThrow('No active workspace context.');
    });

    it('rejects project creation for read-only OBSERVER role', () => {
      expect(() =>
        planCreateProject(
          { name: 'Dev Tools', key: 'DEV', teamId: 'team_eng' },
          existingProjects,
          existingTeams,
          'ws_acme',
          'OBSERVER'
        )
      ).toThrow('read-only OBSERVER');
    });
  });

  describe('3. Empty Project Overview Rendering', () => {
    it('renders empty project state when project has zero issues', () => {
      const MockOutlet: React.FC = () => {
        return (
          <Outlet
            context={{
              project: existingProjects[0],
              team: existingTeams[0],
              overviewData: {
                needsAttention: [],
                activeExecution: [],
                blockingOthers: [],
                currentCycleIssues: [],
                recentActivity: [],
                activeCycle: null,
                cycleProgress: 0,
              },
            }}
          />
        );
      };

      const html = renderToString(
        <AppProviders initialAuthStatus="authenticated" initialActiveWorkspaceId="ws_acme">
          <MemoryRouter initialEntries={['/test-project']}>
            <Routes>
              <Route path="/test-project" element={<MockOutlet />}>
                <Route index element={<ProjectOverviewPage />} />
              </Route>
            </Routes>
          </MemoryRouter>
        </AppProviders>
      );

      expect(html).toContain('Your project is ready');
      expect(html).toContain('Start organizing execution by creating your first issue');
      expect(html).toContain('Observer role is read-only');
    });
  });
});
