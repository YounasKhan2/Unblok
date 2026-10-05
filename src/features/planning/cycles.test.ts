/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { Cycle, Issue, Project, Dependency, Team } from '../../types';
import {
  canAssignIssueToCycle,
  validateActiveCycleInvariant,
  validateCycleCreation,
  validateRollover,
  calculateCycleProgress,
  classifyCycles,
  isIssueCompletedForPlanning,
} from './domain/cycleInvariants';
import {
  selectCyclesOverview,
  selectCycleDetail,
  selectRolloverOptions,
  selectAddIssueCandidates,
} from './selectors/cycleSelectors';
import { canMutatePlanning } from './permissions';

describe('UX-05 Cycle Domain & Selectors', () => {
  const mockTeams: Team[] = [
    { id: 'team_eng', name: 'Core Engine', key: 'ENG', color: '#5645d4', description: '' },
    { id: 'team_web', name: 'Web App', key: 'WEB', color: '#0f7b6c', description: '' },
  ];

  const mockProjects: Project[] = [
    { id: 'proj_api', teamId: 'team_eng', name: 'API Platform', key: 'API', description: '', currentSequence: 10 },
    { id: 'proj_ui', teamId: 'team_web', name: 'Frontend Client', key: 'UI', description: '', currentSequence: 10 },
  ];

  const mockCycles: Cycle[] = [
    {
      id: 'cycle_active_eng',
      name: 'ENG Cycle 1',
      startDate: '2026-10-01',
      endDate: '2026-10-14',
      status: 'ACTIVE',
      teamId: 'team_eng',
    },
    {
      id: 'cycle_upcoming_eng',
      name: 'ENG Cycle 2',
      startDate: '2026-10-15',
      endDate: '2026-10-28',
      status: 'UPCOMING',
      teamId: 'team_eng',
    },
    {
      id: 'cycle_completed_eng',
      name: 'ENG Cycle 0',
      startDate: '2026-09-15',
      endDate: '2026-09-30',
      status: 'COMPLETED',
      teamId: 'team_eng',
    },
    {
      id: 'cycle_active_web',
      name: 'WEB Cycle 1',
      startDate: '2026-10-01',
      endDate: '2026-10-14',
      status: 'ACTIVE',
      teamId: 'team_web',
    },
  ];

  const mockIssues: Issue[] = [
    {
      id: 'iss_1',
      key: 'API-1',
      title: 'Database indexing',
      description: '',
      projectId: 'proj_api',
      teamId: 'team_eng',
      cycleId: 'cycle_active_eng',
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
      title: 'Auth token revoke',
      description: '',
      projectId: 'proj_api',
      teamId: 'team_eng',
      cycleId: 'cycle_active_eng',
      state: 'CANCELLED',
      priority: 'MEDIUM',
      creatorId: 'usr_1',
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
      version: 1,
    },
    {
      id: 'iss_3',
      key: 'API-3',
      title: 'Rate limiter',
      description: '',
      projectId: 'proj_api',
      teamId: 'team_eng',
      cycleId: 'cycle_active_eng',
      state: 'IN_PROGRESS',
      priority: 'URGENT',
      creatorId: 'usr_1',
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
      version: 1,
    },
    {
      id: 'iss_4',
      key: 'API-4',
      title: 'Audit log endpoint',
      description: '',
      projectId: 'proj_api',
      teamId: 'team_eng',
      cycleId: 'cycle_active_eng',
      state: 'TODO',
      priority: 'LOW',
      creatorId: 'usr_1',
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
      version: 1,
    },
    {
      id: 'iss_web_1',
      key: 'UI-1',
      title: 'Login modal',
      description: '',
      projectId: 'proj_ui',
      teamId: 'team_web',
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
      upstreamIssueId: 'iss_3', // iss_3 blocks iss_4
      downstreamIssueId: 'iss_4',
      createdAt: '2026-10-01',
      createdBy: 'usr_1',
    },
  ];

  it('1. Cycle Team ownership: enforces cycle belongs to a team', () => {
    expect(mockCycles[0].teamId).toBe('team_eng');
    expect(mockCycles[3].teamId).toBe('team_web');
  });

  it('2. Same-team issue eligibility: allows issue from owning team project', () => {
    const result = canAssignIssueToCycle(mockIssues[0], mockCycles[0], mockProjects);
    expect(result.allowed).toBe(true);
  });

  it('3. Cross-team issue rejection: rejects issue when project team differs from cycle team', () => {
    // iss_web_1 belongs to team_web, cycle_active_eng belongs to team_eng
    const result = canAssignIssueToCycle(mockIssues[4], mockCycles[0], mockProjects);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Cross-team cycle assignment rejected');
  });

  it('4. Active/Upcoming/Completed classification', () => {
    const classified = classifyCycles(mockCycles);
    expect(classified.active.length).toBe(2);
    expect(classified.upcoming.length).toBe(1);
    expect(classified.completed.length).toBe(1);

    const teamFiltered = classifyCycles(mockCycles, 'team_eng');
    expect(teamFiltered.active.length).toBe(1);
    expect(teamFiltered.active[0].id).toBe('cycle_active_eng');
  });

  it('5. One active cycle per team invariant', () => {
    // Attempting to add another active cycle to team_eng must be rejected
    const check = validateActiveCycleInvariant('team_eng', mockCycles);
    expect(check.allowed).toBe(false);
    expect(check.activeCycle?.id).toBe('cycle_active_eng');

    // But excluding cycle_active_eng (e.g. updating itself) is allowed
    const updateCheck = validateActiveCycleInvariant('team_eng', mockCycles, 'cycle_active_eng');
    expect(updateCheck.allowed).toBe(true);
  });

  it('6. Cycle progress calculation with total, completed, remaining, percent', () => {
    const refDate = new Date('2026-10-05T00:00:00.000Z');
    const progress = calculateCycleProgress(mockCycles[0], mockIssues, mockDependencies, refDate);

    expect(progress.total).toBe(4);
    expect(progress.completed).toBe(2); // iss_1 (DONE), iss_2 (CANCELLED)
    expect(progress.remaining).toBe(2); // iss_3 (IN_PROGRESS), iss_4 (TODO)
    expect(progress.percent).toBe(50); // 2/4 = 50%
    expect(progress.daysRemaining).toBe(9); // Oct 5 to Oct 14
  });

  it('7. DONE/CANCELLED completion semantics (IN_REVIEW is not completed)', () => {
    expect(isIssueCompletedForPlanning('DONE')).toBe(true);
    expect(isIssueCompletedForPlanning('CANCELLED')).toBe(true);
    expect(isIssueCompletedForPlanning('IN_REVIEW')).toBe(false);
    expect(isIssueCompletedForPlanning('IN_PROGRESS')).toBe(false);
    expect(isIssueCompletedForPlanning('TODO')).toBe(false);
    expect(isIssueCompletedForPlanning('BACKLOG')).toBe(false);
  });

  it('8. Blocker count uses canonical dependency truth', () => {
    // iss_4 is blocked by iss_3 (IN_PROGRESS)
    const progress = calculateCycleProgress(mockCycles[0], mockIssues, mockDependencies);
    expect(progress.blocked).toBe(1);
  });

  it('9. Rollover candidates selection', () => {
    const rollover = selectRolloverOptions('cycle_active_eng', mockCycles, mockIssues);
    expect(rollover.unfinishedIssues.length).toBe(2);
    expect(rollover.unfinishedIssues.map(i => i.id)).toEqual(['iss_3', 'iss_4']);
    expect(rollover.eligibleTargetCycles.length).toBe(1);
    expect(rollover.eligibleTargetCycles[0].id).toBe('cycle_upcoming_eng');
  });

  it('10. Same-team rollover target validation (rejects cross-team target)', () => {
    // team_eng to team_eng is valid
    const valid = validateRollover(mockCycles[0], mockCycles[1]);
    expect(valid.allowed).toBe(true);

    // team_eng to team_web is rejected
    const invalid = validateRollover(mockCycles[0], mockCycles[3]);
    expect(invalid.allowed).toBe(false);
    expect(invalid.reason).toContain('Cross-team rollover forbidden');
  });

  it('11. Observer permission rejection', () => {
    expect(canMutatePlanning('ADMIN')).toBe(true);
    expect(canMutatePlanning('MEMBER')).toBe(true);
    expect(canMutatePlanning('OBSERVER')).toBe(false);
  });
});
