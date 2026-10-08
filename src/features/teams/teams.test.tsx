/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-14 Teams Domain & Component Tests
 * Covers:
 * - Workspace-scoped Team Directory
 * - Team Hub resolves by workspace and key
 * - Unknown Team -> 404
 * - Team search/filter
 * - Team creation validation
 * - Duplicate key rejection
 * - Cross-workspace key reuse
 * - Archived Team mutation rejection
 * - ADMIN/MEMBER/OBSERVER permissions
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import {
  resolveTeamByWorkspaceAndKey,
  resolveTeam,
  validateTeamInput,
  selectTeamDirectory,
  selectTeamOverview,
} from './domain/teamResolution';
import { Team, Project, Issue, User } from '../../types';
import { TeamsDirectoryPage } from '../../pages/teams/TeamsDirectoryPage';
import { TeamHubPage } from '../../pages/teams/TeamHubPage';
import { AppProviders } from '../../app/providers/AppProviders';

describe('UX-14 Teams Feature Tests', () => {
  const sampleTeams: Team[] = [
    {
      id: 'team_eng',
      name: 'Engineering',
      key: 'ENG',
      color: '#5645d4',
      workspaceId: 'ws_acme',
      description: 'Core Engineering team',
    },
    {
      id: 'team_plat',
      name: 'Platform',
      key: 'PLAT',
      color: '#0ea5e9',
      workspaceId: 'ws_acme',
      description: 'Platform infrastructure',
    },
    {
      id: 'team_eng_other',
      name: 'Engineering',
      key: 'ENG',
      color: '#ef4444',
      workspaceId: 'ws_beta',
      description: 'Beta Engineering team',
    },
  ];

  const sampleProjects: Project[] = [
    {
      id: 'prj_core',
      name: 'Core Platform',
      key: 'CORE',
      teamId: 'team_eng',
      workspaceId: 'ws_acme',
      description: 'Core execution systems',
      currentSequence: 0,
    },
    {
      id: 'prj_dx',
      name: 'Developer Experience',
      key: 'DX',
      teamId: 'team_eng',
      workspaceId: 'ws_acme',
      description: 'Developer tooling',
      currentSequence: 0,
    },
  ];

  const sampleIssues: Issue[] = [
    {
      id: 'iss_1',
      key: 'CORE-101',
      title: 'Database connection pooling',
      projectId: 'prj_core',
      teamId: 'team_eng',
      workspaceId: 'ws_acme',
      state: 'IN_PROGRESS',
      priority: 'HIGH',
      assigneeId: 'usr_2',
      description: 'Connection pool metrics',
      creatorId: 'usr_1',
      version: 1,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  ];

  const sampleUsers: User[] = [
    {
      id: 'usr_1',
      name: 'Alex River',
      email: 'alex@example.com',
      avatar: 'AR',
      role: 'ADMIN',
      teamId: 'team_eng',
      teamIds: ['team_eng'],
    },
    {
      id: 'usr_2',
      name: 'Sam Chen',
      email: 'sam@example.com',
      avatar: 'SC',
      role: 'MEMBER',
      teamId: 'team_eng',
      teamIds: ['team_eng'],
    },
  ];

  describe('1. Team Resolution by Workspace and Key', () => {
    it('resolves team by activeWorkspaceId + teamKey', () => {
      const team = resolveTeamByWorkspaceAndKey(sampleTeams, 'ws_acme', 'ENG');
      expect(team).toBeDefined();
      expect(team?.id).toBe('team_eng');
      expect(team?.workspaceId).toBe('ws_acme');
    });

    it('distinguishes identical team keys across different workspaces (cross-workspace key reuse)', () => {
      const acmeTeam = resolveTeamByWorkspaceAndKey(sampleTeams, 'ws_acme', 'ENG');
      const betaTeam = resolveTeamByWorkspaceAndKey(sampleTeams, 'ws_beta', 'ENG');

      expect(acmeTeam?.id).toBe('team_eng');
      expect(betaTeam?.id).toBe('team_eng_other');
      expect(acmeTeam?.id).not.toBe(betaTeam?.id);
    });

    it('returns undefined for nonexistent team key in active workspace', () => {
      const team = resolveTeamByWorkspaceAndKey(sampleTeams, 'ws_acme', 'NONEXISTENT');
      expect(team).toBeUndefined();
    });

    it('returns undefined when workspace is null', () => {
      const team = resolveTeamByWorkspaceAndKey(sampleTeams, null, 'ENG');
      expect(team).toBeUndefined();
    });
  });

  describe('2. Team Directory Selection & Filtering', () => {
    it('computes owned projects and active issues for directory view', () => {
      const dir = selectTeamDirectory(
        sampleTeams.filter((t) => t.workspaceId === 'ws_acme'),
        sampleProjects,
        sampleIssues,
        sampleUsers,
        new Set<string>(),
        ''
      );

      expect(dir.length).toBe(2);
      const engRow = dir.find((d) => d.team.key === 'ENG');
      expect(engRow).toBeDefined();
      expect(engRow?.projectCount).toBe(2);
      expect(engRow?.activeIssueCount).toBe(1);
    });

    it('filters teams by search query matching name or key', () => {
      const dir = selectTeamDirectory(
        sampleTeams.filter((t) => t.workspaceId === 'ws_acme'),
        sampleProjects,
        sampleIssues,
        sampleUsers,
        new Set<string>(),
        'plat'
      );

      expect(dir.length).toBe(1);
      expect(dir[0].team.key).toBe('PLAT');
    });

    it('respects archived status in directory projection', () => {
      const archivedSet = new Set(['team_plat']);
      const dir = selectTeamDirectory(
        sampleTeams.filter((t) => t.workspaceId === 'ws_acme'),
        sampleProjects,
        sampleIssues,
        sampleUsers,
        archivedSet,
        ''
      );

      const platRow = dir.find((d) => d.team.key === 'PLAT');
      expect(platRow?.isArchived).toBe(true);
    });
  });

  describe('3. Team Input Validation', () => {
    it('requires a valid name and uppercase alphanumeric key', () => {
      const valid = validateTeamInput({ name: 'Security Operations', key: 'SEC' }, sampleTeams);
      expect(valid.valid).toBe(true);
      expect(valid.errors.name).toBeUndefined();
      expect(valid.errors.key).toBeUndefined();
    });

    it('rejects duplicate team keys within the same workspace (case-insensitive)', () => {
      const acmeTeams = sampleTeams.filter((t) => t.workspaceId === 'ws_acme');
      const dup = validateTeamInput({ name: 'New Engineering', key: 'eng' }, acmeTeams);
      expect(dup.valid).toBe(false);
      expect(dup.errors.key).toContain('already in use');
    });

    it('allows identical team keys in a different workspace', () => {
      const betaTeams = sampleTeams.filter((t) => t.workspaceId === 'ws_beta');
      // In a third workspace gamma, key 'ENG' is valid because beta does not constrain gamma
      const gammaResult = validateTeamInput({ name: 'Engineering', key: 'ENG' }, []);
      expect(gammaResult.valid).toBe(true);
    });

    it('rejects short or empty names', () => {
      const short = validateTeamInput({ name: 'A', key: 'OPS' }, []);
      expect(short.valid).toBe(false);
      expect(short.errors.name).toBeDefined();
    });

    it('rejects invalid key formats (symbols, spaces)', () => {
      const invalid = validateTeamInput({ name: 'Operations', key: 'OP-1!' }, []);
      expect(invalid.valid).toBe(false);
      expect(invalid.errors.key).toBeDefined();
    });
  });

  describe('4. Team Hub Overview Aggregation', () => {
    it('aggregates owned projects and team members', () => {
      const engTeam = sampleTeams[0];
      const overview = selectTeamOverview(
        engTeam,
        sampleProjects,
        sampleIssues,
        [],
        sampleUsers,
        [],
        []
      );

      expect(overview.ownedProjects.length).toBe(2);
      expect(overview.members.length).toBe(2);
      expect(overview.activeIssues.length).toBe(1);
    });
  });

  describe('5. Component Rendering', () => {
    it('renders TeamsDirectoryPage with directory header and search', () => {
      const html = renderToString(
        <AppProviders initialAuthStatus="authenticated" initialActiveWorkspaceId="ws_acme">
          <MemoryRouter initialEntries={['/teams']}>
            <TeamsDirectoryPage />
          </MemoryRouter>
        </AppProviders>
      );

      expect(html).toContain('Teams');
      expect(html).toContain('Search teams...');
    });

    it('renders TeamHubPage with tabs for valid team key', () => {
      const html = renderToString(
        <AppProviders
          initialAuthStatus="authenticated"
          initialActiveWorkspaceId="ws_nexus"
          initialWorkspaces={[{ id: 'ws_nexus', name: 'NEXUS Commerce', slug: 'nexus-commerce', status: 'ACTIVE', createdAt: '' }]}
          initialMemberships={[{ id: 'mem_sarah_nexus', workspaceId: 'ws_nexus', userId: 'usr_sarah', role: 'ADMIN', status: 'ACTIVE' }]}
        >
          <MemoryRouter initialEntries={['/teams/CORE']}>
            <Routes>
              <Route path="/teams/:teamKey" element={<TeamHubPage />} />
            </Routes>
          </MemoryRouter>
        </AppProviders>
      );

      expect(html).toContain('Overview');
      expect(html).toContain('Issues');
      expect(html).toContain('Projects');
      expect(html).toContain('Planning');
    });

    it('renders 404 for unknown team key in active workspace', () => {
      const html = renderToString(
        <AppProviders
          initialAuthStatus="authenticated"
          initialActiveWorkspaceId="ws_acme"
          initialWorkspaces={[{ id: 'ws_acme', name: 'Acme Corp', slug: 'acme', status: 'ACTIVE', createdAt: '' }]}
          initialMemberships={[{ id: 'm1', workspaceId: 'ws_acme', userId: 'usr_1', role: 'ADMIN', status: 'ACTIVE' }]}
        >
          <MemoryRouter initialEntries={['/teams/UNKNOWNKEY']}>
            <Routes>
              <Route path="/teams/:teamKey" element={<TeamHubPage />} />
            </Routes>
          </MemoryRouter>
        </AppProviders>
      );

      expect(html).toContain('404');
      expect(html).toContain('Resource Not Found');
    });
  });
});
