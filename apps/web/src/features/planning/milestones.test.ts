/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { Milestone, Issue, Project, Dependency, Team } from '../../types';
import {
  deriveMilestoneHealth,
  calculateMilestoneRollup,
} from './domain/milestoneInvariants';
import {
  selectMilestonesOverview,
  selectMilestoneDetail,
  selectLinkableMilestoneCandidates,
} from './selectors/milestoneSelectors';

describe('UX-05 Strategic Milestone Domain & Selectors', () => {
  const mockTeams: Team[] = [
    { id: 'team_eng', name: 'Core Engine', key: 'ENG', color: '#5645d4', description: '' },
    { id: 'team_web', name: 'Web App', key: 'WEB', color: '#0f7b6c', description: '' },
    { id: 'team_inf', name: 'Infra', key: 'INF', color: '#dd5b00', description: '' },
  ];

  const mockProjects: Project[] = [
    { id: 'proj_api', teamId: 'team_eng', name: 'API Platform', key: 'API', description: '', currentSequence: 10 },
    { id: 'proj_ui', teamId: 'team_web', name: 'Frontend Client', key: 'UI', description: '', currentSequence: 10 },
    { id: 'proj_ops', teamId: 'team_inf', name: 'Ops Cluster', key: 'OPS', description: '', currentSequence: 10 },
  ];

  const mockMilestones: Milestone[] = [
    {
      id: 'ms_1',
      name: 'M1: Enterprise Launch',
      targetDate: '2026-10-20',
      description: 'Q4 Enterprise launch with SSO and audit logs',
    },
    {
      id: 'ms_2',
      name: 'M2: SOC2 Compliance',
      targetDate: '2026-10-01', // Overdue relative to Oct 5
      description: 'Audit compliance checklists',
    },
  ];

  const mockIssues: Issue[] = [
    {
      id: 'iss_1',
      key: 'API-1',
      title: 'SSO provider support',
      description: '',
      projectId: 'proj_api',
      teamId: 'team_eng',
      milestoneId: 'ms_1',
      state: 'DONE',
      priority: 'HIGH',
      creatorId: 'usr_1',
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
      version: 1,
    },
    {
      id: 'iss_2',
      key: 'UI-1',
      title: 'SSO login interface',
      description: '',
      projectId: 'proj_ui',
      teamId: 'team_web',
      milestoneId: 'ms_1',
      state: 'IN_PROGRESS',
      priority: 'HIGH',
      creatorId: 'usr_1',
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
      version: 1,
    },
    {
      id: 'iss_3',
      key: 'OPS-1',
      title: 'WARP tunnel gateway',
      description: '',
      projectId: 'proj_ops',
      teamId: 'team_inf',
      milestoneId: 'ms_1',
      state: 'TODO',
      priority: 'URGENT',
      creatorId: 'usr_1',
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
      version: 1,
    },
    // Another issue for ms_2
    {
      id: 'iss_4',
      key: 'API-2',
      title: 'SOC2 retention policy',
      description: '',
      projectId: 'proj_api',
      teamId: 'team_eng',
      milestoneId: 'ms_2',
      state: 'TODO',
      priority: 'HIGH',
      creatorId: 'usr_1',
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
      version: 1,
    },
  ];

  const mockDependencies: Dependency[] = [
    {
      id: 'dep_1',
      upstreamIssueId: 'iss_2', // UI-1 blocks OPS-1
      downstreamIssueId: 'iss_3',
      createdAt: '2026-10-01',
      createdBy: 'usr_1',
    },
  ];

  it('1. Workspace cross-Team linking: milestone aggregates tasks across projects and teams', () => {
    const linked = mockIssues.filter(i => i.milestoneId === 'ms_1');
    expect(linked.length).toBe(3);
    const teamsInMs = new Set(linked.map(i => i.teamId));
    expect(teamsInMs.size).toBe(3); // team_eng, team_web, team_inf
  });

  it('2. Issue aggregation rollups: calculates total, completed, remaining', () => {
    const rollup = calculateMilestoneRollup(
      mockMilestones[0],
      mockIssues,
      mockDependencies,
      mockProjects,
      mockTeams,
      new Date('2026-10-05T00:00:00.000Z')
    );

    expect(rollup.progress.total).toBe(3);
    expect(rollup.progress.completed).toBe(1); // iss_1 (DONE)
    expect(rollup.progress.remaining).toBe(2); // iss_2, iss_3
    expect(rollup.progress.percent).toBe(33); // 1/3 = 33%
  });

  it('3. Team contributor dedupe: deduplicates contributing teams', () => {
    const rollup = calculateMilestoneRollup(
      mockMilestones[0],
      mockIssues,
      mockDependencies,
      mockProjects,
      mockTeams
    );

    expect(rollup.contributingTeams.length).toBe(3);
    const teamIds = rollup.contributingTeams.map(t => t.id);
    expect(new Set(teamIds).size).toBe(3);
  });

  it('4. Project contributor dedupe: deduplicates contributing projects', () => {
    const rollup = calculateMilestoneRollup(
      mockMilestones[0],
      mockIssues,
      mockDependencies,
      mockProjects,
      mockTeams
    );

    expect(rollup.contributingProjects.length).toBe(3);
    const projectIds = rollup.contributingProjects.map(p => p.id);
    expect(new Set(projectIds).size).toBe(3);
  });

  it('5. DONE/CANCELLED completion: completed when all issues reach terminal states', () => {
    const allCompletedIssues: Issue[] = [
      { ...mockIssues[0], state: 'DONE' },
      { ...mockIssues[1], state: 'CANCELLED' },
    ];

    const health = deriveMilestoneHealth(
      mockMilestones[0],
      allCompletedIssues,
      mockDependencies
    );

    expect(health.isCompleted).toBe(true);
    expect(health.health).toBe('ON_TRACK');
  });

  it('6. BLOCKED health: triggers when unfinished work is actively blocked by dependencies', () => {
    // iss_3 (TODO) is blocked by iss_2 (IN_PROGRESS)
    const health = deriveMilestoneHealth(
      mockMilestones[0],
      mockIssues,
      mockDependencies,
      new Date('2026-10-05T00:00:00.000Z')
    );

    expect(health.health).toBe('BLOCKED');
    expect(health.reason).toContain('actively blocked');
  });

  it('7. AT RISK health: triggers when unfinished work is overdue or approaching deadline with low progress', () => {
    // ms_2 targetDate was 2026-10-01, reference is 2026-10-05, iss_4 is unfinished
    const health = deriveMilestoneHealth(
      mockMilestones[1],
      mockIssues,
      [], // no blockers
      new Date('2026-10-05T00:00:00.000Z')
    );

    expect(health.health).toBe('AT_RISK');
    expect(health.reason).toContain('overdue');
  });

  it('8. ON TRACK health: triggers when on schedule without active blockers', () => {
    // Future target date with no active blockers
    const futureMilestone: Milestone = {
      id: 'ms_future',
      name: 'Future Launch',
      targetDate: '2026-12-01',
      description: '',
    };
    const issueFuture: Issue = {
      ...mockIssues[0],
      milestoneId: 'ms_future',
      state: 'IN_PROGRESS',
    };

    const health = deriveMilestoneHealth(
      futureMilestone,
      [issueFuture],
      [],
      new Date('2026-10-05T00:00:00.000Z')
    );

    expect(health.health).toBe('ON_TRACK');
  });

  it('9. Deterministic fixed-time health: accepts referenceDate injection', () => {
    const fixedDate1 = new Date('2026-09-01T00:00:00.000Z');
    const fixedDate2 = new Date('2026-11-01T00:00:00.000Z');

    // On Sep 1, ms_2 (target Oct 1) with no blockers is ON TRACK (30 days left)
    const res1 = deriveMilestoneHealth(mockMilestones[1], mockIssues, [], fixedDate1);
    expect(res1.health).toBe('ON_TRACK');

    // On Nov 1, ms_2 with unfinished work is overdue -> AT RISK
    const res2 = deriveMilestoneHealth(mockMilestones[1], mockIssues, [], fixedDate2);
    expect(res2.health).toBe('AT_RISK');
  });

  it('10. Dependency intelligence reuse: selects milestone detail with graph layout', () => {
    const detail = selectMilestoneDetail(
      'ms_1',
      mockMilestones,
      mockIssues,
      mockDependencies,
      mockProjects,
      mockTeams
    );

    expect(detail).not.toBeNull();
    expect(detail?.summary.milestone.id).toBe('ms_1');
    expect(detail?.graphLayout.nodes.length).toBeGreaterThan(0);
    expect(detail?.graphLayout.edges.length).toBeGreaterThan(0);
  });

  it('11. Unlink isolation: candidate selection does not include already linked issues', () => {
    const candidates = selectLinkableMilestoneCandidates(
      'ms_1',
      mockIssues,
      mockProjects,
      mockTeams
    );

    // Only iss_4 is NOT assigned to ms_1
    expect(candidates.length).toBe(1);
    expect(candidates[0].id).toBe('iss_4');
  });
});
