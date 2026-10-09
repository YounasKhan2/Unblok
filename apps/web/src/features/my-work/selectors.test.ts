/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { selectMyWorkData } from './selectors';
import { Issue, Dependency, Cycle } from '../../types';

describe('selectMyWorkData', () => {
  const currentUserId = 'usr_alice';

  const mockIssues: Issue[] = [
    // 1. Blocked task (IN_PROGRESS, but blocked by ISS-UPSTREAM) -> MUST be in Needs Attention!
    {
      id: 'iss_blocked',
      key: 'ENG-101',
      projectId: 'proj_1',
      teamId: 'team_eng',
      title: 'Blocked Database Task',
      description: 'Waiting on upstream infra',
      state: 'IN_PROGRESS',
      priority: 'MEDIUM',
      assigneeId: currentUserId,
      creatorId: currentUserId,
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
      version: 1,
    },
    // Upstream blocker (assigned to someone else, IN_PROGRESS)
    {
      id: 'iss_upstream',
      key: 'INF-50',
      projectId: 'proj_1',
      teamId: 'team_inf',
      title: 'Infra Prerequisite',
      description: '',
      state: 'IN_PROGRESS',
      priority: 'HIGH',
      assigneeId: 'usr_bob',
      creatorId: 'usr_bob',
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
      version: 1,
    },
    // 2. Active In Progress task (unblocked) -> In Progress
    {
      id: 'iss_in_progress',
      key: 'ENG-102',
      projectId: 'proj_1',
      teamId: 'team_eng',
      title: 'Active Service Migration',
      description: '',
      state: 'IN_PROGRESS',
      priority: 'MEDIUM',
      assigneeId: currentUserId,
      creatorId: currentUserId,
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
      version: 1,
    },
    // 3. In Review task -> In Review
    {
      id: 'iss_in_review',
      key: 'ENG-103',
      projectId: 'proj_1',
      teamId: 'team_eng',
      title: 'API Gateway PR',
      description: '',
      state: 'IN_REVIEW',
      priority: 'MEDIUM',
      assigneeId: currentUserId,
      creatorId: currentUserId,
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
      version: 1,
    },
    // 4. Up Next / Todo (Scheduled in team_eng's active cycle)
    {
      id: 'iss_todo',
      key: 'ENG-104',
      projectId: 'proj_1',
      teamId: 'team_eng',
      cycleId: 'cycle_eng_24',
      title: 'Upcoming Sprint Item',
      description: '',
      state: 'TODO',
      priority: 'LOW',
      assigneeId: currentUserId,
      creatorId: currentUserId,
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
      version: 1,
    },
    // 5. Recently Completed -> Recently Completed
    {
      id: 'iss_done',
      key: 'ENG-105',
      projectId: 'proj_1',
      teamId: 'team_eng',
      title: 'Completed Hotfix',
      description: '',
      state: 'DONE',
      priority: 'HIGH',
      assigneeId: currentUserId,
      creatorId: currentUserId,
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
      version: 1,
    },
    // 6. An issue assigned to Alice that BLOCKS someone else
    {
      id: 'iss_blocking_others',
      key: 'ENG-106',
      projectId: 'proj_1',
      teamId: 'team_eng',
      title: 'Core Schema Migration',
      description: 'Blocks downstream web UI',
      state: 'IN_PROGRESS',
      priority: 'HIGH',
      assigneeId: currentUserId,
      creatorId: currentUserId,
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
      version: 1,
    },
    // Downstream task blocked by ENG-106
    {
      id: 'iss_downstream_web',
      key: 'WEB-201',
      projectId: 'proj_2',
      teamId: 'team_web',
      title: 'Web Profile Form',
      description: '',
      state: 'TODO',
      priority: 'MEDIUM',
      assigneeId: 'usr_charlie',
      creatorId: currentUserId,
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
      version: 1,
    },
    // 7. Urgent unblocked task -> Needs Attention due to Urgent priority
    {
      id: 'iss_urgent',
      key: 'ENG-107',
      projectId: 'proj_1',
      teamId: 'team_eng',
      title: 'Production Incident Hotfix',
      description: '',
      state: 'TODO',
      priority: 'URGENT',
      assigneeId: currentUserId,
      creatorId: currentUserId,
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
      version: 1,
    },
  ];

  const mockDependencies: Dependency[] = [
    // INF-50 BLOCKS ENG-101 (Alice's task)
    {
      id: 'dep_1',
      upstreamIssueId: 'iss_upstream',
      downstreamIssueId: 'iss_blocked',
      createdAt: '2026-10-01',
      createdBy: 'usr_bob',
    },
    // ENG-106 (Alice's task) BLOCKS WEB-201 (Charlie's task)
    {
      id: 'dep_2',
      upstreamIssueId: 'iss_blocking_others',
      downstreamIssueId: 'iss_downstream_web',
      createdAt: '2026-10-01',
      createdBy: currentUserId,
    },
  ];

  const mockCycles: Cycle[] = [
    {
      id: 'cycle_eng_24',
      name: 'Cycle 24 (ENG)',
      startDate: '2026-10-01',
      endDate: '2026-10-14',
      status: 'ACTIVE',
      teamId: 'team_eng',
    },
    {
      id: 'cycle_web_18',
      name: 'Cycle 18 (WEB)',
      startDate: '2026-10-01',
      endDate: '2026-10-14',
      status: 'ACTIVE',
      teamId: 'team_web',
    },
    {
      id: 'cycle_inf_12',
      name: 'Cycle 12 (INF)',
      startDate: '2026-09-01',
      endDate: '2026-09-14',
      status: 'COMPLETED',
      teamId: 'team_inf',
    },
  ];

  it('classifies blocked assigned task in Needs Attention and deduplicates from In Progress', () => {
    const result = selectMyWorkData(mockIssues, mockDependencies, currentUserId);

    // ENG-101 is IN_PROGRESS, but is BLOCKED, so it MUST be in needsAttention
    expect(result.needsAttention.map(i => i.key)).toContain('ENG-101');
    // Deduplication rule: ENG-101 must NOT appear in inProgress!
    expect(result.inProgress.map(i => i.key)).not.toContain('ENG-101');
  });

  it('classifies urgent tasks in Needs Attention', () => {
    const result = selectMyWorkData(mockIssues, mockDependencies, currentUserId);
    expect(result.needsAttention.map(i => i.key)).toContain('ENG-107');
  });

  it('classifies unblocked In Progress, In Review, Up Next, and Completed accurately', () => {
    const result = selectMyWorkData(mockIssues, mockDependencies, currentUserId);

    expect(result.inProgress.map(i => i.key)).toContain('ENG-102');
    expect(result.inReview.map(i => i.key)).toContain('ENG-103');
    expect(result.upNext.map(i => i.key)).toContain('ENG-104');
    expect(result.recentlyCompleted.map(i => i.key)).toContain('ENG-105');
  });

  it('identifies issues blocking other team members with downstream impact', () => {
    const result = selectMyWorkData(mockIssues, mockDependencies, currentUserId);

    expect(result.blockingOthers.length).toBe(1);
    expect(result.blockingOthers[0].issue.key).toBe('ENG-106');
    expect(result.blockingOthers[0].downstreamCount).toBe(1);
    expect(result.blockingOthers[0].activeDownstreamIssues[0].key).toBe('WEB-201');
    expect(result.summary.blockingCount).toBe(1);
  });

  it('filters issues by search query and preserves deduplication', () => {
    const result = selectMyWorkData(mockIssues, mockDependencies, currentUserId, {
      searchQuery: 'Gateway',
    });

    expect(result.inReview.length).toBe(1);
    expect(result.inReview[0].key).toBe('ENG-103');
    expect(result.needsAttention.length).toBe(0);
    expect(result.inProgress.length).toBe(0);
  });

  describe('Canonical Filter Contract', () => {
    it('filters strictly by lifecycle state using state parameter', () => {
      const result = selectMyWorkData(mockIssues, mockDependencies, currentUserId, {
        lifecycleFilter: 'IN_REVIEW',
      });

      expect(result.inReview.length).toBe(1);
      expect(result.inReview[0].key).toBe('ENG-103');
      expect(result.inProgress.length).toBe(0);
      expect(result.upNext.length).toBe(0);
    });

    it('filters strictly by blocker state using BLOCKED_ONLY', () => {
      const result = selectMyWorkData(mockIssues, mockDependencies, currentUserId, {
        blockerFilter: 'BLOCKED_ONLY',
      });

      expect(result.needsAttention.map(i => i.key)).toContain('ENG-101');
      // ENG-107 is Urgent but not blocked -> excluded under BLOCKED_ONLY!
      expect(result.needsAttention.map(i => i.key)).not.toContain('ENG-107');
    });

    it('filters strictly by blocker state using UNBLOCKED_ONLY', () => {
      const result = selectMyWorkData(mockIssues, mockDependencies, currentUserId, {
        blockerFilter: 'UNBLOCKED_ONLY',
      });

      // ENG-101 is blocked -> must be excluded!
      expect(result.needsAttention.map(i => i.key)).not.toContain('ENG-101');
      expect(result.inProgress.map(i => i.key)).toContain('ENG-102');
    });

    it('strictly does not interpret lifecycle values passed into blockerFilter as state filters', () => {
      // Regression guard: Passing 'IN_REVIEW' or 'DONE' to blockerFilter must NOT filter by state
      const result = selectMyWorkData(mockIssues, mockDependencies, currentUserId, {
        blockerFilter: 'IN_REVIEW', // Invalid value for blockerFilter
      });

      // All states still exist because 'IN_REVIEW' is not a valid blocker filter
      expect(result.inReview.map(i => i.key)).toContain('ENG-103');
      expect(result.inProgress.map(i => i.key)).toContain('ENG-102');
    });
  });

  describe('Team-Scoped Active Cycles', () => {
    it('resolves active cycle for the user team', () => {
      const result = selectMyWorkData(
        mockIssues,
        mockDependencies,
        currentUserId,
        {},
        undefined,
        mockCycles,
        'team_eng'
      );

      expect(result.activeCycles.length).toBe(1);
      expect(result.activeCycles[0].id).toBe('cycle_eng_24');
      const upNextGroup = result.groups.find(g => g.id === 'upNext');
      expect(upNextGroup?.title).toContain('Current cycle');
      expect(upNextGroup?.subtitle).toContain('Cycle 24 (ENG)');
    });

    it('qualifies a TODO/BACKLOG issue for Up Next when its cycleId matches the active cycle for its team', () => {
      const matchingIssue: Issue = {
        id: 'iss_match',
        key: 'ENG-301',
        projectId: 'proj_1',
        teamId: 'team_eng',
        cycleId: 'cycle_eng_24',
        title: 'Active Cycle Planned Task',
        description: '',
        state: 'TODO',
        priority: 'MEDIUM',
        assigneeId: currentUserId,
        creatorId: currentUserId,
        createdAt: '2026-10-01',
        updatedAt: '2026-10-01',
        version: 1,
      };

      const result = selectMyWorkData(
        [matchingIssue],
        [],
        currentUserId,
        {},
        undefined,
        mockCycles,
        'team_eng'
      );

      expect(result.upNext.map(i => i.key)).toContain('ENG-301');
    });

    it('does not qualify a mismatched-cycle issue for Up Next when relevant active cycle exists', () => {
      // Create issue belonging to team_eng with cycleId from team_web
      const crossTeamIssue: Issue = {
        id: 'iss_cross',
        key: 'ENG-999',
        projectId: 'proj_1',
        teamId: 'team_eng',
        cycleId: 'cycle_web_18', // Unrelated team's active cycle
        title: 'Mismatched Cycle Issue',
        description: '',
        state: 'TODO',
        priority: 'MEDIUM',
        assigneeId: currentUserId,
        creatorId: currentUserId,
        createdAt: '2026-10-01',
        updatedAt: '2026-10-01',
        version: 1,
      };

      const result = selectMyWorkData(
        [crossTeamIssue],
        [],
        currentUserId,
        {},
        undefined,
        mockCycles,
        'team_eng'
      );

      // Mismatched-cycle issue must NOT qualify for current cycle Up Next!
      expect(result.upNext.map(i => i.key)).not.toContain('ENG-999');
      // And activeCycles strictly belongs to team_eng, not team_web
      expect(result.activeCycles.map(c => c.id)).toContain('cycle_eng_24');
      expect(result.activeCycles.map(c => c.id)).not.toContain('cycle_web_18');
    });

    it('does not qualify an unscheduled issue for Up Next when relevant active cycle exists', () => {
      const unscheduledIssue: Issue = {
        id: 'iss_unscheduled',
        key: 'ENG-302',
        projectId: 'proj_1',
        teamId: 'team_eng',
        title: 'Unscheduled Backlog Task',
        description: '',
        state: 'TODO',
        priority: 'LOW',
        assigneeId: currentUserId,
        creatorId: currentUserId,
        createdAt: '2026-10-01',
        updatedAt: '2026-10-01',
        version: 1,
      };

      const result = selectMyWorkData(
        [unscheduledIssue],
        [],
        currentUserId,
        {},
        undefined,
        mockCycles,
        'team_eng'
      );

      // Unscheduled task must not be presented as current-cycle work!
      expect(result.upNext.map(i => i.key)).not.toContain('ENG-302');
    });

    it('qualifies issues matching active cycles across multiple relevant teams while rejecting mismatched/unscheduled work', () => {
      const issues: Issue[] = [
        // Qualifies for team_eng active cycle
        {
          id: 'iss_eng',
          key: 'ENG-401',
          projectId: 'proj_1',
          teamId: 'team_eng',
          cycleId: 'cycle_eng_24',
          title: 'ENG Cycle Task',
          description: '',
          state: 'TODO',
          priority: 'MEDIUM',
          assigneeId: currentUserId,
          creatorId: currentUserId,
          createdAt: '2026-10-01',
          updatedAt: '2026-10-01',
          version: 1,
        },
        // Qualifies for team_web active cycle
        {
          id: 'iss_web',
          key: 'WEB-402',
          projectId: 'proj_2',
          teamId: 'team_web',
          cycleId: 'cycle_web_18',
          title: 'WEB Cycle Task',
          description: '',
          state: 'TODO',
          priority: 'MEDIUM',
          assigneeId: currentUserId,
          creatorId: currentUserId,
          createdAt: '2026-10-01',
          updatedAt: '2026-10-01',
          version: 1,
        },
        // Mismatched cycle: team_eng issue with team_web cycle -> Rejected!
        {
          id: 'iss_mismatch',
          key: 'ENG-403',
          projectId: 'proj_1',
          teamId: 'team_eng',
          cycleId: 'cycle_web_18',
          title: 'Mismatched ENG Task',
          description: '',
          state: 'TODO',
          priority: 'LOW',
          assigneeId: currentUserId,
          creatorId: currentUserId,
          createdAt: '2026-10-01',
          updatedAt: '2026-10-01',
          version: 1,
        },
        // Unscheduled issue: team_web issue with no cycle -> Rejected!
        {
          id: 'iss_web_unscheduled',
          key: 'WEB-404',
          projectId: 'proj_2',
          teamId: 'team_web',
          title: 'Unscheduled WEB Task',
          description: '',
          state: 'TODO',
          priority: 'LOW',
          assigneeId: currentUserId,
          creatorId: currentUserId,
          createdAt: '2026-10-01',
          updatedAt: '2026-10-01',
          version: 1,
        },
      ];

      const result = selectMyWorkData(
        issues,
        [],
        currentUserId,
        {},
        undefined,
        mockCycles,
        ['team_eng', 'team_web']
      );

      const upNextKeys = result.upNext.map(i => i.key);
      expect(upNextKeys).toContain('ENG-401');
      expect(upNextKeys).toContain('WEB-402');
      expect(upNextKeys).not.toContain('ENG-403');
      expect(upNextKeys).not.toContain('WEB-404');
    });

    it('preserves fallback behavior where all TODO/BACKLOG work enters Up Next when no active cycle exists', () => {
      const issues: Issue[] = [
        {
          id: 'iss_inf_todo',
          key: 'INF-501',
          projectId: 'proj_3',
          teamId: 'team_inf',
          title: 'Unscheduled Infra Task',
          description: '',
          state: 'TODO',
          priority: 'LOW',
          assigneeId: currentUserId,
          creatorId: currentUserId,
          createdAt: '2026-10-01',
          updatedAt: '2026-10-01',
          version: 1,
        },
      ];

      // team_inf has no active cycle
      const result = selectMyWorkData(
        issues,
        [],
        currentUserId,
        {},
        undefined,
        mockCycles,
        'team_inf'
      );

      expect(result.activeCycles.length).toBe(0);
      expect(result.upNext.map(i => i.key)).toContain('INF-501');
      const upNextGroup = result.groups.find(g => g.id === 'upNext');
      expect(upNextGroup?.title).toBe('Up Next');
      expect(upNextGroup?.subtitle).toContain('Planned tasks and backlog');
    });
  });
});
