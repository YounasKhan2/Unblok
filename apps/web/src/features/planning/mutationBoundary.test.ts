/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  executeCompleteCycle,
  executeCreateCycle,
  executeUpdateCycle,
  executeUpdateIssueCycle,
  executeUpdateIssueMilestone,
  executeCreateMilestone,
  executeUpdateMilestone,
  executeUpdateIssueDates,
  PlanningState,
} from './domain/planningMutations';
import { Cycle, Issue, Project, Team, User, Milestone } from '../../types';

function createInitialState(userRole: 'ADMIN' | 'MEMBER' | 'OBSERVER' = 'ADMIN'): {
  state: PlanningState;
  milestones: Milestone[];
} {
  const teams: Team[] = [
    { id: 'team_eng', name: 'Engineering', key: 'ENG', color: '#0075de', description: 'Core Platform Engineering' },
    { id: 'team_web', name: 'Web', key: 'WEB', color: '#1aae39', description: 'Frontend Web Engineering' },
  ];

  const projects: Project[] = [
    {
      id: 'proj_eng',
      teamId: 'team_eng',
      name: 'Core Platform',
      key: 'ENG',
      description: 'Core backend and API',
      currentSequence: 10,
    },
    {
      id: 'proj_web',
      teamId: 'team_web',
      name: 'Web Frontend',
      key: 'WEB',
      description: 'Web dashboard',
      currentSequence: 5,
    },
  ];

  const cycles: Cycle[] = [
    {
      id: 'cycle_eng_active',
      name: 'Cycle 24',
      startDate: '2026-10-01',
      endDate: '2026-10-14',
      status: 'ACTIVE',
      teamId: 'team_eng',
    },
    {
      id: 'cycle_eng_upcoming',
      name: 'Cycle 25',
      startDate: '2026-10-15',
      endDate: '2026-10-28',
      status: 'UPCOMING',
      teamId: 'team_eng',
    },
    {
      id: 'cycle_web_upcoming',
      name: 'Cycle Web 19',
      startDate: '2026-10-15',
      endDate: '2026-10-28',
      status: 'UPCOMING',
      teamId: 'team_web',
    },
  ];

  const issues: Issue[] = [
    {
      id: 'iss_eng_1',
      key: 'ENG-1',
      projectId: 'proj_eng',
      teamId: 'team_eng',
      cycleId: 'cycle_eng_active',
      title: 'OAuth Token Invalidation',
      description: 'Invalidate tokens',
      state: 'IN_PROGRESS',
      priority: 'HIGH',
      creatorId: 'usr_admin',
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
      version: 1,
    },
    {
      id: 'iss_eng_2',
      key: 'ENG-2',
      projectId: 'proj_eng',
      teamId: 'team_eng',
      cycleId: 'cycle_eng_active',
      title: 'Database connection retry',
      description: 'Handle DB reconnection',
      state: 'TODO',
      priority: 'MEDIUM',
      creatorId: 'usr_admin',
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
      version: 1,
    },
    {
      id: 'iss_eng_done',
      key: 'ENG-3',
      projectId: 'proj_eng',
      teamId: 'team_eng',
      cycleId: 'cycle_eng_active',
      title: 'Schema migration baseline',
      description: 'Migrate DB tables',
      state: 'DONE',
      priority: 'URGENT',
      creatorId: 'usr_admin',
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
      version: 1,
    },
    {
      id: 'iss_web_1',
      key: 'WEB-1',
      projectId: 'proj_web',
      teamId: 'team_web',
      title: 'Frontend navigation polish',
      description: 'Update icons',
      state: 'TODO',
      priority: 'LOW',
      creatorId: 'usr_admin',
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
      version: 1,
    },
  ];

  const currentUser: User = {
    id: `usr_${userRole.toLowerCase()}`,
    name: `${userRole} User`,
    email: `${userRole.toLowerCase()}@acme.internal`,
    role: userRole,
    teamId: 'team_eng',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  };

  const milestones: Milestone[] = [
    {
      id: 'ms_auth',
      name: 'M1: Multi-tenant Auth',
      targetDate: '2026-10-31',
      description: 'Multi-tenant authentication milestone',
    },
  ];

  return {
    state: {
      cycles,
      issues,
      projects,
      teams,
      currentUser,
      activities: [],
    },
    milestones,
  };
}

describe('UX-05 Mutation Boundary Integrity Tests', () => {
  describe('Cycle Completion Atomicity', () => {
    it('1. invalid rollover target does NOT complete source Cycle', () => {
      const { state } = createInitialState('ADMIN');
      const res = executeCompleteCycle(state, {
        cycleId: 'cycle_eng_active',
        rolloverData: { targetCycleId: 'nonexistent_cycle' },
      });

      expect(res.success).toBe(false);
      expect(res.rolledCount).toBe(0);
      expect(res.nextState).toBeUndefined();
      // Source cycle remains ACTIVE in state
      expect(state.cycles.find(c => c.id === 'cycle_eng_active')?.status).toBe('ACTIVE');
    });

    it('2. invalid rollover target does NOT mutate Issues', () => {
      const { state } = createInitialState('ADMIN');
      // Cross-team rollover target attempt
      const res = executeCompleteCycle(state, {
        cycleId: 'cycle_eng_active',
        rolloverData: { targetCycleId: 'cycle_web_upcoming' },
      });

      expect(res.success).toBe(false);
      expect(res.nextState).toBeUndefined();
      // Issues remain in original source cycle
      expect(state.issues.find(i => i.id === 'iss_eng_1')?.cycleId).toBe('cycle_eng_active');
      expect(state.issues.find(i => i.id === 'iss_eng_2')?.cycleId).toBe('cycle_eng_active');
    });

    it('3. invalid rollover target creates no planning activity', () => {
      const { state } = createInitialState('ADMIN');
      const res = executeCompleteCycle(state, {
        cycleId: 'cycle_eng_active',
        rolloverData: { targetCycleId: 'cycle_web_upcoming' },
      });

      expect(res.success).toBe(false);
      expect(res.nextState).toBeUndefined();
      expect(state.activities.length).toBe(0);
    });

    it('4. valid rollover completes source and moves selected unfinished Issues', () => {
      const { state } = createInitialState('ADMIN');
      const res = executeCompleteCycle(state, {
        cycleId: 'cycle_eng_active',
        rolloverData: {
          targetCycleId: 'cycle_eng_upcoming',
          issueIdsToRollover: ['iss_eng_1'],
        },
      });

      expect(res.success).toBe(true);
      expect(res.rolledCount).toBe(1);
      expect(res.nextState).toBeDefined();

      const next = res.nextState!;
      // Source cycle is completed
      expect(next.cycles.find(c => c.id === 'cycle_eng_active')?.status).toBe('COMPLETED');
      // Selected unfinished issue is moved to upcoming cycle
      expect(next.issues.find(i => i.id === 'iss_eng_1')?.cycleId).toBe('cycle_eng_upcoming');
      // Emitted CYCLE_ROLLED_OVER event
      expect(next.activities.some(a => a.eventType === 'CYCLE_ROLLED_OVER')).toBe(true);
    });

    it('5. unselected unfinished Issues become unscheduled', () => {
      const { state } = createInitialState('ADMIN');
      const res = executeCompleteCycle(state, {
        cycleId: 'cycle_eng_active',
        rolloverData: {
          targetCycleId: 'cycle_eng_upcoming',
          issueIdsToRollover: ['iss_eng_1'], // iss_eng_2 is omitted
        },
      });

      expect(res.success).toBe(true);
      const next = res.nextState!;
      // iss_eng_2 was unfinished and not rolled over -> becomes unscheduled
      expect(next.issues.find(i => i.id === 'iss_eng_2')?.cycleId).toBeUndefined();
      // Emitted CYCLE_REMOVED for unscheduled issue
      expect(
        next.activities.some(a => a.eventType === 'CYCLE_REMOVED' && a.issueId === 'iss_eng_2')
      ).toBe(true);
    });

    it('6. completed Issues remain untouched', () => {
      const { state } = createInitialState('ADMIN');
      const res = executeCompleteCycle(state, {
        cycleId: 'cycle_eng_active',
        rolloverData: {
          targetCycleId: 'cycle_eng_upcoming',
        },
      });

      expect(res.success).toBe(true);
      const next = res.nextState!;
      // iss_eng_done was DONE -> remains associated with completed cycle
      expect(next.issues.find(i => i.id === 'iss_eng_done')?.cycleId).toBe('cycle_eng_active');
      expect(next.issues.find(i => i.id === 'iss_eng_done')?.state).toBe('DONE');
    });
  });

  describe('Cycle Creation', () => {
    it('7. missing Team rejected', () => {
      const { state } = createInitialState('ADMIN');
      const res = executeCreateCycle(state, {
        name: 'New Cycle',
        startDate: '2026-11-01',
        endDate: '2026-11-14',
        teamId: '',
      });

      expect(res.success).toBe(false);
      expect(res.newCycle).toBeUndefined();
      expect(state.cycles.length).toBe(3);
    });

    it('8. ALL Team rejected for new canonical Cycle', () => {
      const { state } = createInitialState('ADMIN');
      const res = executeCreateCycle(state, {
        name: 'Workspace Cycle',
        startDate: '2026-11-01',
        endDate: '2026-11-14',
        teamId: 'ALL',
      });

      expect(res.success).toBe(false);
      expect(res.newCycle).toBeUndefined();
      expect(state.cycles.length).toBe(3);
    });

    it('9. invalid dates rejected', () => {
      const { state } = createInitialState('ADMIN');
      // End date before start date
      const res = executeCreateCycle(state, {
        name: 'Backwards Cycle',
        startDate: '2026-11-14',
        endDate: '2026-11-01',
        teamId: 'team_eng',
      });

      expect(res.success).toBe(false);
      expect(res.newCycle).toBeUndefined();
      expect(state.cycles.length).toBe(3);
    });

    it('10. second active Cycle for Team rejected', () => {
      const { state } = createInitialState('ADMIN');
      // team_eng already has cycle_eng_active in ACTIVE status
      const res = executeCreateCycle(state, {
        name: 'Conflicting Active Cycle',
        startDate: '2026-10-05',
        endDate: '2026-10-18',
        teamId: 'team_eng',
        status: 'ACTIVE',
      });

      expect(res.success).toBe(false);
      expect(res.newCycle).toBeUndefined();
      expect(res.error).toContain('already has an active cycle');
    });
  });

  describe('Cycle Update', () => {
    it('11. invalid date update rejected', () => {
      const { state } = createInitialState('ADMIN');
      const res = executeUpdateCycle(state, 'cycle_eng_upcoming', {
        startDate: '2026-10-28',
        endDate: '2026-10-15', // start > end
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('Start date must be before end date');
    });

    it('12. invalid Team update rejected', () => {
      const { state } = createInitialState('ADMIN');
      const res = executeUpdateCycle(state, 'cycle_eng_upcoming', {
        teamId: 'ALL',
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('Cycle must belong to exactly one real team');
    });

    it('13. activation conflict rejected', () => {
      const { state } = createInitialState('ADMIN');
      // Activating cycle_eng_upcoming while cycle_eng_active is already ACTIVE for team_eng
      const res = executeUpdateCycle(state, 'cycle_eng_upcoming', {
        status: 'ACTIVE',
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('already has an active cycle');
    });
  });

  describe('Milestone', () => {
    it('14. nonexistent Issue link rejected', () => {
      const { state, milestones } = createInitialState('ADMIN');
      const res = executeUpdateIssueMilestone(state, milestones, 'nonexistent_issue', 'ms_auth');

      expect(res.success).toBe(false);
      expect(res.error).toContain('not found');
    });

    it('15. nonexistent Milestone link rejected', () => {
      const { state, milestones } = createInitialState('ADMIN');
      const res = executeUpdateIssueMilestone(state, milestones, 'iss_eng_1', 'nonexistent_ms');

      expect(res.success).toBe(false);
      expect(res.error).toContain('not found');
    });

    it('16. unlink nonexistent Issue rejected', () => {
      const { state, milestones } = createInitialState('ADMIN');
      const res = executeUpdateIssueMilestone(state, milestones, 'nonexistent_issue', undefined);

      expect(res.success).toBe(false);
      expect(res.error).toContain('not found');
    });

    it('17. blank Milestone name rejected', () => {
      const { state, milestones } = createInitialState('ADMIN');
      const res = executeCreateMilestone(state, milestones, {
        name: '   ',
        targetDate: '2026-11-30',
      });

      expect(res.success).toBe(false);
      expect(res.newMilestone).toBeUndefined();
    });

    it('18. invalid target date rejected', () => {
      const { state, milestones } = createInitialState('ADMIN');
      const res = executeCreateMilestone(state, milestones, {
        name: 'M2: Valid Name',
        targetDate: 'invalid-date',
      });

      expect(res.success).toBe(false);
      expect(res.newMilestone).toBeUndefined();
    });
  });

  describe('Scheduling', () => {
    it('19. nonexistent Issue rejected', () => {
      const { state } = createInitialState('ADMIN');
      const res = executeUpdateIssueDates(state, 'nonexistent_issue', '2026-10-01', '2026-10-07');

      expect(res.success).toBe(false);
      expect(res.error).toContain('not found');
    });

    it('20. start > due rejected', () => {
      const { state } = createInitialState('ADMIN');
      const res = executeUpdateIssueDates(state, 'iss_eng_1', '2026-10-14', '2026-10-01');

      expect(res.success).toBe(false);
      expect(res.error).toContain('Start date cannot be after due date');
    });

    it('21. Observer scheduling rejected', () => {
      const { state } = createInitialState('OBSERVER');
      const res = executeUpdateIssueDates(state, 'iss_eng_1', '2026-10-01', '2026-10-07');

      expect(res.success).toBe(false);
      expect(res.error).toContain('Observer cannot schedule');
    });

    it('22. invalid request causes no mutation', () => {
      const { state } = createInitialState('ADMIN');
      const originalIssue = { ...state.issues[0] };
      const res = executeUpdateIssueDates(state, 'iss_eng_1', '2026-10-20', '2026-10-10');

      expect(res.success).toBe(false);
      expect(res.nextState).toBeUndefined();
      expect(state.issues[0]).toEqual(originalIssue);
    });
  });

  describe('Permissions', () => {
    it('23. Observer direct Cycle mutation rejected', () => {
      const { state } = createInitialState('OBSERVER');

      const createRes = executeCreateCycle(state, {
        name: 'Observer Cycle',
        startDate: '2026-10-01',
        endDate: '2026-10-14',
        teamId: 'team_eng',
      });
      expect(createRes.success).toBe(false);
      expect(createRes.error).toContain('Observer cannot create cycles');

      const updateRes = executeUpdateCycle(state, 'cycle_eng_upcoming', {
        name: 'Hacked Name',
      });
      expect(updateRes.success).toBe(false);
      expect(updateRes.error).toContain('Observer cannot update cycles');

      const completeRes = executeCompleteCycle(state, {
        cycleId: 'cycle_eng_active',
      });
      expect(completeRes.success).toBe(false);
      expect(completeRes.error).toContain('Observer cannot complete cycles');

      const assignRes = executeUpdateIssueCycle(state, 'iss_web_1', 'cycle_web_upcoming');
      expect(assignRes.success).toBe(false);
      expect(assignRes.error).toContain('Observer cannot assign cycles');
    });

    it('24. Observer direct Milestone mutation rejected', () => {
      const { state, milestones } = createInitialState('OBSERVER');

      const createRes = executeCreateMilestone(state, milestones, {
        name: 'Observer Milestone',
        targetDate: '2026-11-30',
      });
      expect(createRes.success).toBe(false);
      expect(createRes.error).toContain('Observer cannot create milestones');

      const updateRes = executeUpdateMilestone(state, milestones, 'ms_auth', {
        name: 'Hacked Milestone',
      });
      expect(updateRes.success).toBe(false);
      expect(updateRes.error).toContain('Observer cannot update milestones');

      const linkRes = executeUpdateIssueMilestone(state, milestones, 'iss_eng_1', 'ms_auth');
      expect(linkRes.success).toBe(false);
      expect(linkRes.error).toContain('Observer cannot link milestones');
    });
  });
});
