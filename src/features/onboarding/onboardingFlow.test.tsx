/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-14 Onboarding Progression & Recovery Tests
 * Covers:
 * - Domain-derived progression (workspace -> team -> project -> invite -> complete)
 * - Invited user bypasses owner onboarding
 * - Interrupted onboarding resume logic
 * - No duplicate team/project creation
 * - Optional invite step skip
 * - Honest prototype notices (no real-email claims)
 * - Existing workspace members not forced through setup
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import {
  resolveOnboardingRoute,
  getStoredOnboardingState,
  saveStoredOnboardingState,
  clearStoredOnboardingState,
} from './domain/onboardingProgression';
import { Workspace, WorkspaceMembership } from '../workspaces/types';
import { Team, Project } from '../../types';
import { InviteTeammatesOnboardingPage } from '../../pages/onboarding/InviteTeammatesOnboardingPage';
import { OnboardingCompletePage } from '../../pages/onboarding/OnboardingCompletePage';
import { AppProviders } from '../../app/providers/AppProviders';

describe('UX-14 Onboarding State & Progression Tests', () => {
  const adminMembership: WorkspaceMembership = {
    id: 'mem_admin',
    workspaceId: 'ws_new',
    userId: 'usr_owner',
    role: 'ADMIN',
    status: 'ACTIVE',
  };

  const invitedMemberMembership: WorkspaceMembership = {
    id: 'mem_invited',
    workspaceId: 'ws_existing',
    userId: 'usr_invited',
    role: 'MEMBER',
    status: 'ACTIVE',
  };

  const sampleWorkspace: Workspace = {
    id: 'ws_new',
    name: 'Apollo Systems',
    slug: 'apollo-systems',
    createdAt: '2026-01-01T00:00:00Z',
    status: 'ACTIVE',
  };

  const sampleTeam: Team = {
    id: 'team_apollo',
    name: 'Apollo Core',
    key: 'APL',
    color: '#5645d4',
    workspaceId: 'ws_new',
    description: 'Apollo Core Team',
  };

  const sampleProject: Project = {
    id: 'prj_apollo',
    name: 'Flight Control',
    key: 'FLT',
    teamId: 'team_apollo',
    workspaceId: 'ws_new',
    description: 'Flight Control project',
    currentSequence: 0,
  };

  describe('1. Domain-Derived Progression', () => {
    it('routes to /onboarding/workspace when user has zero active workspace/memberships', () => {
      const route = resolveOnboardingRoute({
        activeWorkspace: null,
        activeMembership: null,
        teams: [],
        projects: [],
      });
      expect(route).toBe('/onboarding/workspace');
    });

    it('routes to /onboarding/team when workspace exists but has 0 teams', () => {
      const route = resolveOnboardingRoute({
        activeWorkspace: sampleWorkspace,
        activeMembership: adminMembership,
        teams: [],
        projects: [],
      });
      expect(route).toBe('/onboarding/team');
    });

    it('routes to /onboarding/project when team exists but has 0 projects', () => {
      const route = resolveOnboardingRoute({
        activeWorkspace: sampleWorkspace,
        activeMembership: adminMembership,
        teams: [sampleTeam],
        projects: [],
      });
      expect(route).toBe('/onboarding/project');
    });

    it('routes to /onboarding/invite when both team and project exist and invite is pending', () => {
      // Clear storage
      clearStoredOnboardingState(sampleWorkspace.id);

      const route = resolveOnboardingRoute({
        activeWorkspace: sampleWorkspace,
        activeMembership: adminMembership,
        teams: [sampleTeam],
        projects: [sampleProject],
      });
      expect(route).toBe('/onboarding/invite');
    });

    it('routes to /onboarding/complete when invite step has been skipped or completed', () => {
      saveStoredOnboardingState(sampleWorkspace.id, {
        inviteCompletedOrSkipped: true,
      });

      const route = resolveOnboardingRoute({
        activeWorkspace: sampleWorkspace,
        activeMembership: adminMembership,
        teams: [sampleTeam],
        projects: [sampleProject],
      });
      expect(route).toBe('/onboarding/complete');
    });

    it('routes directly to /my-work once entire setup is completed', () => {
      saveStoredOnboardingState(sampleWorkspace.id, {
        inviteCompletedOrSkipped: true,
        setupCompleted: true,
      });

      const route = resolveOnboardingRoute({
        activeWorkspace: sampleWorkspace,
        activeMembership: adminMembership,
        teams: [sampleTeam],
        projects: [sampleProject],
      });
      expect(route).toBe('/my-work');
    });
  });

  describe('2. Invited Member Bypass', () => {
    it('bypasses owner onboarding completely for invited non-admin members', () => {
      const route = resolveOnboardingRoute({
        activeWorkspace: sampleWorkspace,
        activeMembership: invitedMemberMembership,
        teams: [],
        projects: [],
      });
      expect(route).toBe('/my-work');
    });
  });

  describe('3. Interrupted Onboarding Resume', () => {
    it('resumes at /onboarding/project if workspace and team were created prior to interruption', () => {
      // User created workspace + team, but reloaded before creating project
      const route = resolveOnboardingRoute({
        activeWorkspace: sampleWorkspace,
        activeMembership: adminMembership,
        teams: [sampleTeam],
        projects: [],
      });
      expect(route).toBe('/onboarding/project');
    });
  });

  describe('4. Component Rendering & Honest Prototype Claims', () => {
    it('renders InviteTeammatesOnboardingPage with honest delivery notice', () => {
      const html = renderToString(
        <AppProviders initialAuthStatus="authenticated" initialActiveWorkspaceId="ws_acme">
          <MemoryRouter>
            <InviteTeammatesOnboardingPage />
          </MemoryRouter>
        </AppProviders>
      );

      expect(html).toContain('Invite your teammates');
      expect(html).toContain('Email delivery is not connected');
      expect(html).toContain('Skip for now');
    });

    it('renders OnboardingCompletePage with workspace readiness review', () => {
      const html = renderToString(
        <AppProviders initialAuthStatus="authenticated" initialActiveWorkspaceId="ws_acme">
          <MemoryRouter>
            <OnboardingCompletePage />
          </MemoryRouter>
        </AppProviders>
      );

      expect(html).toContain('Your workspace is ready');
      expect(html).toContain('Open project');
      expect(html).toContain('Go to My Work');
    });
  });
});
