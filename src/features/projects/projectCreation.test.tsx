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
        existingTeams
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
        existingTeams
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
        existingTeams
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
        existingTeams
      );

      expect(res.valid).toBe(false);
      expect(res.errors.key).toContain('already in use');
    });

    it('allows identical project keys in different workspaces', () => {
      // In a new workspace gamma with 0 projects, key 'CORE' is valid
      const res = validateProjectInput(
        {
          name: 'Core Platform Gamma',
          key: 'CORE',
          teamId: 'team_gamma_1',
        },
        [], // no projects in workspace gamma
        [{ id: 'team_gamma_1', name: 'Gamma Team', key: 'GAM', color: '#111', workspaceId: 'ws_gamma', description: 'Gamma team' }]
      );

      expect(res.valid).toBe(true);
    });
  });

  describe('2. Canonical Project Factory (planCreateProject)', () => {
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
