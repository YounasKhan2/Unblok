/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { Project, Issue, Cycle, Milestone, Dependency } from '../../types';
import {
  selectProjectCycleAllocation,
  selectProjectMilestoneMapping,
} from './selectors/projectPlanningSelectors';
import { canAssignIssueToCycle } from './domain/cycleInvariants';
import { canMutatePlanning } from './permissions';

describe('UX-05 Project Planning Domain & Selectors', () => {
  const mockProject: Project = {
    id: 'proj_api',
    teamId: 'team_eng',
    name: 'API Platform',
    key: 'API',
    description: '',
    currentSequence: 10,
  };

  const otherProject: Project = {
    id: 'proj_web',
    teamId: 'team_web',
    name: 'Web Client',
    key: 'WEB',
    description: '',
    currentSequence: 10,
  };

  const mockCycles: Cycle[] = [
    {
      id: 'cycle_eng_1',
      name: 'ENG Cycle 1',
      startDate: '2026-10-01',
      endDate: '2026-10-14',
      status: 'ACTIVE',
      teamId: 'team_eng',
    },
    {
      id: 'cycle_eng_2',
      name: 'ENG Cycle 2',
      startDate: '2026-10-15',
      endDate: '2026-10-28',
      status: 'UPCOMING',
      teamId: 'team_eng',
    },
    {
      id: 'cycle_web_1',
      name: 'WEB Cycle 1',
      startDate: '2026-10-01',
      endDate: '2026-10-14',
      status: 'ACTIVE',
      teamId: 'team_web',
    },
  ];

  const mockMilestones: Milestone[] = [
    {
      id: 'ms_1',
      name: 'M1: Enterprise Launch',
      targetDate: '2026-10-31',
      description: '',
    },
    {
      id: 'ms_2',
      name: 'M2: Audit Compliance',
      targetDate: '2026-11-30',
      description: '',
    },
  ];

  const mockIssues: Issue[] = [
    {
      id: 'iss_1',
      key: 'API-1',
      title: 'Auth middleware',
      description: '',
      projectId: 'proj_api',
      teamId: 'team_eng',
      cycleId: 'cycle_eng_1',
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
      key: 'API-2',
      title: 'Token refresh endpoint',
      description: '',
      projectId: 'proj_api',
      teamId: 'team_eng',
      // No cycle -> backlog
      state: 'TODO',
      priority: 'URGENT',
      creatorId: 'usr_1',
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
      version: 1,
    },
    {
      id: 'iss_3',
      key: 'API-3',
      title: 'Connection pool metrics',
      description: '',
      projectId: 'proj_api',
      teamId: 'team_eng',
      // No cycle -> backlog
      state: 'IN_PROGRESS',
      priority: 'MEDIUM',
      creatorId: 'usr_1',
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
      version: 1,
    },
    // Issue from another project
    {
      id: 'iss_web_1',
      key: 'WEB-1',
      title: 'Login modal',
      description: '',
      projectId: 'proj_web',
      teamId: 'team_web',
      state: 'TODO',
      priority: 'LOW',
      creatorId: 'usr_1',
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
      version: 1,
    },
  ];

  const filterBase = {
    view: 'cycles' as const,
    searchQuery: '',
    priorityFilter: 'ALL',
    stateFilter: 'ALL',
  };

  it('1. Project scope: filters strictly by current project', () => {
    const allocation = selectProjectCycleAllocation(
      mockProject,
      mockIssues,
      mockCycles,
      [],
      filterBase
    );

    expect(allocation.totalProjectIssuesCount).toBe(3); // only API-1, API-2, API-3
    const allIssueIds = [
      ...allocation.backlogIssues.map(i => i.id),
      ...allocation.cycleGroups.flatMap(g => g.issues.map(i => i.id)),
    ];
    expect(allIssueIds).not.toContain('iss_web_1');
  });

  it('2. Owning-Team Cycle eligibility: selects cycles owned by project team', () => {
    const allocation = selectProjectCycleAllocation(
      mockProject,
      mockIssues,
      mockCycles,
      [],
      filterBase
    );

    expect(allocation.eligibleCycles.length).toBe(2); // cycle_eng_1, cycle_eng_2
    expect(allocation.eligibleCycles.map(c => c.id)).not.toContain('cycle_web_1');
    expect(allocation.activeCycle?.id).toBe('cycle_eng_1');
  });

  it('3. Cross-Team Cycle rejection: enforces project.teamId === cycle.teamId', () => {
    // Attempting to assign API-2 (owned by team_eng) to cycle_web_1 (owned by team_web)
    const check = canAssignIssueToCycle(mockIssues[1], mockCycles[2], [mockProject, otherProject]);
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain('Cross-team cycle assignment rejected');
  });

  it('4. Unscheduled/scheduled split: separates backlog tasks from scheduled cycle tasks', () => {
    const allocation = selectProjectCycleAllocation(
      mockProject,
      mockIssues,
      mockCycles,
      [],
      filterBase
    );

    // iss_2 and iss_3 have no cycleId -> backlog
    expect(allocation.backlogIssues.length).toBe(2);
    expect(allocation.backlogIssues.map(i => i.id)).toEqual(['iss_2', 'iss_3']);

    // iss_1 is in cycle_eng_1
    const activeGroup = allocation.cycleGroups.find(g => g.cycle.id === 'cycle_eng_1');
    expect(activeGroup?.issues.length).toBe(1);
    expect(activeGroup?.issues[0].id).toBe('iss_1');
  });

  it('5. Assignment to cycle: valid same-team assignment allowed', () => {
    const check = canAssignIssueToCycle(mockIssues[1], mockCycles[0], [mockProject]);
    expect(check.allowed).toBe(true);
  });

  it('6. Unscheduling from cycle: cycle=undefined is always allowed', () => {
    const check = canAssignIssueToCycle(mockIssues[0], undefined, [mockProject]);
    expect(check.allowed).toBe(true);
  });

  it('7. Milestone mapping: groups project issues by linked milestone vs unlinked', () => {
    const mapping = selectProjectMilestoneMapping(
      mockProject,
      mockIssues,
      mockMilestones,
      filterBase
    );

    // iss_1 is in ms_1
    const ms1Group = mapping.groups.find(g => g.milestone?.id === 'ms_1');
    expect(ms1Group?.issues.length).toBe(1);
    expect(ms1Group?.issues[0].id).toBe('iss_1');

    // iss_2 and iss_3 are unlinked
    expect(mapping.unlinkedGroup.issues.length).toBe(2);
    expect(mapping.unlinkedGroup.issues.map(i => i.id)).toEqual(['iss_2', 'iss_3']);
  });

  it('8. Observer rejection: observer cannot mutate planning', () => {
    expect(canMutatePlanning('ADMIN')).toBe(true);
    expect(canMutatePlanning('MEMBER')).toBe(true);
    expect(canMutatePlanning('OBSERVER')).toBe(false);
  });
});
