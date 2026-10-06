/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { selectWorkspaceInsights, DEFAULT_INSIGHTS_FILTER } from './insightSelectors';
import {
  INITIAL_ISSUES,
  INITIAL_PROJECTS,
  INITIAL_TEAMS,
  INITIAL_MILESTONES,
  INITIAL_CYCLES,
  INITIAL_DEPENDENCIES,
} from '../../../data/mockData';
import { Issue, Dependency } from '../../../types';

describe('UX-07 Workspace Insights Selector & Filter Consistency', () => {
  const referenceTime = new Date('2026-10-10T12:00:00.000Z');

  // 1. Prototype seed data produces rich, realistic insight state
  it('1. default prototype seed data produces non-zero active, blocked, and high-risk work', () => {
    const data = selectWorkspaceInsights({
      issues: INITIAL_ISSUES,
      dependencies: INITIAL_DEPENDENCIES,
      projects: INITIAL_PROJECTS,
      teams: INITIAL_TEAMS,
      milestones: INITIAL_MILESTONES,
      cycles: INITIAL_CYCLES,
      filters: DEFAULT_INSIGHTS_FILTER,
      referenceTime,
    });

    // Summary metrics verification
    expect(data.summary.activeIssuesCount).toBeGreaterThan(0);
    expect(data.summary.blockedIssuesCount).toBeGreaterThan(0);
    expect(data.summary.highRiskIssuesCount).toBeGreaterThan(0);
    expect(data.summary.activeBlockersCount).toBeGreaterThan(0);

    // High risk issues exist
    expect(data.highRiskIssues.length).toBeGreaterThan(0);
    const hasCritical = data.highRiskIssues.some(i => i.risk.level === 'CRITICAL');
    const hasHigh = data.highRiskIssues.some(i => i.risk.level === 'HIGH');
    expect(hasCritical || hasHigh).toBe(true);

    // Bottlenecks exist
    expect(data.bottlenecks.length).toBeGreaterThan(0);
    expect(data.bottlenecks[0].directDownstreamCount).toBeGreaterThan(0);

    // Needs attention signals exist
    expect(data.needsAttention.length).toBeGreaterThan(0);

    // Delivery health exists
    expect(data.projectHealth.length).toBe(INITIAL_PROJECTS.length);
    expect(data.teamHealth.length).toBe(INITIAL_TEAMS.length);
  });

  // 2. Active blockers only: resolved dependencies do not count as active blockers
  it('2. resolved dependencies (upstream DONE) are excluded from active blocker counts', () => {
    const sampleIssues: Issue[] = [
      {
        id: 'iss_up_done',
        key: 'UP-1',
        projectId: 'proj_eng_auth',
        teamId: 'team_eng',
        title: 'Resolved Upstream',
        description: '',
        state: 'DONE', // Upstream is DONE (resolved)
        priority: 'MEDIUM',
        creatorId: 'usr_sarah',
        createdAt: '2026-10-01T00:00:00.000Z',
        updatedAt: '2026-10-02T00:00:00.000Z',
        version: 1,
      },
      {
        id: 'iss_down',
        key: 'DOWN-1',
        projectId: 'proj_eng_auth',
        teamId: 'team_eng',
        title: 'Downstream Issue',
        description: '',
        state: 'TODO',
        priority: 'HIGH',
        creatorId: 'usr_sarah',
        createdAt: '2026-10-01T00:00:00.000Z',
        updatedAt: '2026-10-02T00:00:00.000Z',
        version: 1,
      },
    ];

    const sampleDeps: Dependency[] = [
      {
        id: 'dep_res_1',
        upstreamIssueId: 'iss_up_done',
        downstreamIssueId: 'iss_down',
        createdAt: '2026-10-01T00:00:00.000Z',
        createdBy: 'usr_sarah',
      },
    ];

    const data = selectWorkspaceInsights({
      issues: sampleIssues,
      dependencies: sampleDeps,
      projects: INITIAL_PROJECTS,
      teams: INITIAL_TEAMS,
      milestones: [],
      cycles: [],
      filters: DEFAULT_INSIGHTS_FILTER,
      referenceTime,
    });

    expect(data.summary.blockedIssuesCount).toBe(0);
    expect(data.summary.activeBlockersCount).toBe(0);
  });

  // 3. Team filtering scopes all insight sections consistently
  it('3. filtering by team scopes summary, table, signals, bottlenecks, and health consistently', () => {
    const data = selectWorkspaceInsights({
      issues: INITIAL_ISSUES,
      dependencies: INITIAL_DEPENDENCIES,
      projects: INITIAL_PROJECTS,
      teams: INITIAL_TEAMS,
      milestones: INITIAL_MILESTONES,
      cycles: INITIAL_CYCLES,
      filters: { ...DEFAULT_INSIGHTS_FILTER, team: 'team_eng' },
      referenceTime,
    });

    // High risk issues must belong to team_eng projects
    for (const item of data.highRiskIssues) {
      expect(item.project?.teamId).toBe('team_eng');
    }

    // Project health must only contain team_eng projects
    for (const p of data.projectHealth) {
      expect(p.teamId).toBe('team_eng');
    }

    // Team health must only contain team_eng
    expect(data.teamHealth).toHaveLength(1);
    expect(data.teamHealth[0].teamId).toBe('team_eng');

    // Bottlenecks must belong to team_eng
    for (const b of data.bottlenecks) {
      const bTeamId = b.project?.teamId || b.team?.id;
      expect(bTeamId).toBe('team_eng');
    }

    // Signals must involve team_eng
    for (const sig of data.needsAttention) {
      const matchesTeam =
        (sig.teamIds && sig.teamIds.includes('team_eng')) ||
        (sig.projectIds && sig.projectIds.some(pid => INITIAL_PROJECTS.find(p => p.id === pid)?.teamId === 'team_eng'));
      expect(matchesTeam).toBe(true);
    }

    // Cross-team matrix is scoped to team_eng
    expect(data.matrixScopeLabel).toContain('Core Platform');
  });

  // 4. Project filtering scopes summary and issues consistently without leaking unrelated projects
  it('4. filtering by project scopes issues, signals, bottlenecks, and project health without leak', () => {
    const data = selectWorkspaceInsights({
      issues: INITIAL_ISSUES,
      dependencies: INITIAL_DEPENDENCIES,
      projects: INITIAL_PROJECTS,
      teams: INITIAL_TEAMS,
      milestones: INITIAL_MILESTONES,
      cycles: INITIAL_CYCLES,
      filters: { ...DEFAULT_INSIGHTS_FILTER, project: 'proj_eng_auth' },
      referenceTime,
    });

    for (const item of data.highRiskIssues) {
      expect(item.issue.projectId).toBe('proj_eng_auth');
    }

    expect(data.projectHealth).toHaveLength(1);
    expect(data.projectHealth[0].projectId).toBe('proj_eng_auth');

    for (const b of data.bottlenecks) {
      expect(b.issue.projectId).toBe('proj_eng_auth');
    }

    for (const sig of data.needsAttention) {
      if (sig.projectIds) {
        expect(sig.projectIds).toContain('proj_eng_auth');
      }
    }

    expect(data.matrixScopeLabel).toContain('Authentication');
  });

  // 5. Cycle filtering scopes issue and cycle-derived surfaces
  it('5. filtering by cycle scopes high-risk work, signals, and bottlenecks correctly', () => {
    const activeCycle = INITIAL_CYCLES.find(c => c.status === 'ACTIVE') || INITIAL_CYCLES[0];
    const data = selectWorkspaceInsights({
      issues: INITIAL_ISSUES,
      dependencies: INITIAL_DEPENDENCIES,
      projects: INITIAL_PROJECTS,
      teams: INITIAL_TEAMS,
      milestones: INITIAL_MILESTONES,
      cycles: INITIAL_CYCLES,
      filters: { ...DEFAULT_INSIGHTS_FILTER, cycle: activeCycle.id },
      referenceTime,
    });

    for (const item of data.highRiskIssues) {
      expect(item.issue.cycleId).toBe(activeCycle.id);
    }

    for (const b of data.bottlenecks) {
      expect(b.issue.cycleId).toBe(activeCycle.id);
    }

    for (const sig of data.needsAttention) {
      if (sig.kind === 'CYCLE_PRESSURE') {
        expect(sig.cycleId).toBe(activeCycle.id);
      }
    }

    expect(data.matrixScopeLabel).toBe('Filtered: Selected Cycle');
  });

  // 6. Risk level filtering scopes issue-risk surfaces without leaking unrelated signals
  it('6. filtering by CRITICAL risk displays only CRITICAL risk issues and prevents unrelated leaks', () => {
    const data = selectWorkspaceInsights({
      issues: INITIAL_ISSUES,
      dependencies: INITIAL_DEPENDENCIES,
      projects: INITIAL_PROJECTS,
      teams: INITIAL_TEAMS,
      milestones: INITIAL_MILESTONES,
      cycles: INITIAL_CYCLES,
      filters: { ...DEFAULT_INSIGHTS_FILTER, risk: 'CRITICAL' },
      referenceTime,
    });

    for (const item of data.highRiskIssues) {
      expect(item.risk.level).toBe('CRITICAL');
    }

    for (const b of data.bottlenecks) {
      const risk = data.highRiskIssues.find(h => h.issue.id === b.issue.id)?.risk;
      if (risk) {
        expect(risk.level).toBe('CRITICAL');
      }
    }

    expect(data.matrixScopeLabel).toContain('CRITICAL');
  });

  // 7. Combined multi-dimensional filters
  it('7. combined filters (team + project + risk) strictly enforce unified scope across all surfaces', () => {
    const data = selectWorkspaceInsights({
      issues: INITIAL_ISSUES,
      dependencies: INITIAL_DEPENDENCIES,
      projects: INITIAL_PROJECTS,
      teams: INITIAL_TEAMS,
      milestones: INITIAL_MILESTONES,
      cycles: INITIAL_CYCLES,
      filters: {
        team: 'team_eng',
        project: 'proj_eng_auth',
        risk: 'CRITICAL',
        cycle: 'ALL',
      },
      referenceTime,
    });

    for (const item of data.highRiskIssues) {
      expect(item.issue.projectId).toBe('proj_eng_auth');
      expect(item.project?.teamId).toBe('team_eng');
      expect(item.risk.level).toBe('CRITICAL');
    }

    expect(data.projectHealth).toHaveLength(1);
    expect(data.projectHealth[0].projectId).toBe('proj_eng_auth');
    expect(data.teamHealth).toHaveLength(1);
    expect(data.teamHealth[0].teamId).toBe('team_eng');
  });

  // 8. Safe handling of invalid / orphan dependency references
  it('8. safely handles orphan or missing issue references without crashing', () => {
    const invalidDeps: Dependency[] = [
      {
        id: 'dep_bad_1',
        upstreamIssueId: 'iss_nonexistent_99',
        downstreamIssueId: 'iss_eng_1',
        createdAt: '2026-10-01T00:00:00.000Z',
        createdBy: 'usr_sarah',
      },
    ];

    expect(() => {
      selectWorkspaceInsights({
        issues: INITIAL_ISSUES,
        dependencies: invalidDeps,
        projects: INITIAL_PROJECTS,
        teams: INITIAL_TEAMS,
        milestones: INITIAL_MILESTONES,
        cycles: INITIAL_CYCLES,
        filters: DEFAULT_INSIGHTS_FILTER,
        referenceTime,
      });
    }).not.toThrow();
  });
});
