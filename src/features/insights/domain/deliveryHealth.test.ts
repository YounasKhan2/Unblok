/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  calculateProjectDeliveryHealth,
  calculateTeamDeliveryHealth,
  HEALTH_THRESHOLDS,
} from './deliveryHealth';
import { Issue, Project, Team } from '../../../types';
import { MilestoneSummaryData } from '../../planning/types';
import { ExecutionRisk } from '../types';

describe('UX-07 Delivery Health Domain Model', () => {
  const referenceTime = new Date('2026-10-10T12:00:00.000Z');

  const teamEng: Team = {
    id: 'team_eng',
    key: 'ENG',
    name: 'Engineering',
    color: '#3B82F6',
    description: 'Core Engineering',
  };

  const projectAuth: Project = {
    id: 'proj_auth',
    key: 'AUTH',
    name: 'Authentication Platform',
    teamId: 'team_eng',
    description: 'Auth platform services',
    currentSequence: 1,
  };

  const projectApi: Project = {
    id: 'proj_api',
    key: 'API',
    name: 'Public API',
    teamId: 'team_eng',
    description: 'Public REST endpoints',
    currentSequence: 1,
  };

  const createIssue = (id: string, projectId: string, state: any = 'TODO', overrides: Partial<Issue> = {}): Issue => ({
    id,
    key: `TEST-${id}`,
    projectId,
    teamId: 'team_eng',
    title: `Issue ${id}`,
    description: 'Test',
    state,
    priority: 'MEDIUM',
    creatorId: 'usr_sarah',
    createdAt: '2026-10-01T09:00:00.000Z',
    updatedAt: '2026-10-01T09:00:00.000Z',
    version: 1,
    ...overrides,
  });

  const createMilestoneSummary = (
    id: string,
    health: 'ON_TRACK' | 'AT_RISK' | 'BLOCKED',
    isCompleted: boolean = false
  ): MilestoneSummaryData => ({
    milestone: {
      id,
      name: `Milestone ${id}`,
      description: 'Test',
      targetDate: '2026-10-20',
    },
    health,
    isCompleted,
    progress: {
      total: 5,
      completed: isCompleted ? 5 : 2,
      remaining: isCompleted ? 0 : 3,
      blocked: health === 'BLOCKED' ? 2 : 0,
      inProgress: 1,
      percent: isCompleted ? 100 : 40,
      daysRemaining: 10,
      isOverdue: false,
    },
    contributingTeams: [teamEng],
    contributingProjects: [projectAuth],
    issues: [],
    blockedIssues: [],
  });

  const lowRisk: ExecutionRisk = { score: 0, level: 'LOW', reasons: [] };
  const highRisk: ExecutionRisk = { score: 4, level: 'HIGH', reasons: [] };
  const critRisk: ExecutionRisk = { score: 7, level: 'CRITICAL', reasons: [] };

  describe('Project Delivery Health', () => {
    // 1. HEALTHY when all metrics within threshold
    it('1. derives HEALTHY when active issues are unblocked and risk is low', () => {
      const issues = [
        createIssue('i1', 'proj_auth'),
        createIssue('i2', 'proj_auth'),
        createIssue('i3', 'proj_auth'),
      ];

      const health = calculateProjectDeliveryHealth({
        project: projectAuth,
        team: teamEng,
        issues,
        issueRisks: new Map([
          ['i1', lowRisk],
          ['i2', lowRisk],
          ['i3', lowRisk],
        ]),
        activeBlockerCounts: new Map([
          ['i1', 0],
          ['i2', 0],
          ['i3', 0],
        ]),
        milestoneSummaries: [],
        referenceTime,
      });

      expect(health.health).toBe('HEALTHY');
      expect(health.activeIssueCount).toBe(3);
      expect(health.blockedIssueCount).toBe(0);
      expect(health.blockedRatio).toBe(0);
      expect(health.reasons[0]).toContain('healthy thresholds');
    });

    // 2. HEALTHY when no active issues or all work DONE
    it('2. derives HEALTHY when project has no active work or all work is DONE', () => {
      const issues = [
        createIssue('i1', 'proj_auth', 'DONE'),
        createIssue('i2', 'proj_auth', 'DONE'),
      ];

      const health = calculateProjectDeliveryHealth({
        project: projectAuth,
        team: teamEng,
        issues,
        issueRisks: new Map(),
        activeBlockerCounts: new Map(),
        milestoneSummaries: [],
        referenceTime,
      });

      expect(health.health).toBe('HEALTHY');
      expect(health.activeIssueCount).toBe(0);
      expect(health.reasons[0]).toContain('No active work');
    });

    // 3. WATCH when blocked issues exist below 30%
    it('3. derives WATCH when blocked ratio is > 0 but below 30%', () => {
      const issues = [
        createIssue('i1', 'proj_auth'),
        createIssue('i2', 'proj_auth'),
        createIssue('i3', 'proj_auth'),
        createIssue('i4', 'proj_auth'),
      ]; // 1 of 4 blocked = 25% (below 30%)

      const health = calculateProjectDeliveryHealth({
        project: projectAuth,
        team: teamEng,
        issues,
        issueRisks: new Map(),
        activeBlockerCounts: new Map([
          ['i1', 1],
          ['i2', 0],
          ['i3', 0],
          ['i4', 0],
        ]),
        milestoneSummaries: [],
        referenceTime,
      });

      expect(health.health).toBe('WATCH');
      expect(health.blockedIssueCount).toBe(1);
      expect(health.blockedRatio).toBe(0.25);
    });

    // 4. AT_RISK when blocked ratio >= 30%
    it('4. derives AT_RISK when >= 30% of active work is blocked', () => {
      const issues = [
        createIssue('i1', 'proj_auth'),
        createIssue('i2', 'proj_auth'),
        createIssue('i3', 'proj_auth'),
      ]; // 1 of 3 blocked = 33.3% (>= 30%)

      const health = calculateProjectDeliveryHealth({
        project: projectAuth,
        team: teamEng,
        issues,
        issueRisks: new Map(),
        activeBlockerCounts: new Map([
          ['i1', 1],
          ['i2', 0],
          ['i3', 0],
        ]),
        milestoneSummaries: [],
        referenceTime,
      });

      expect(health.health).toBe('AT_RISK');
      expect(health.blockedRatio).toBeCloseTo(0.333, 2);
      expect(health.reasons[0]).toContain('33% of active work is blocked');
    });

    // 5. AT_RISK when critical risk count >= 2
    it('5. derives AT_RISK when 2 or more critical risk issues exist', () => {
      const issues = [
        createIssue('i1', 'proj_auth'),
        createIssue('i2', 'proj_auth'),
        createIssue('i3', 'proj_auth'),
        createIssue('i4', 'proj_auth'),
      ];

      const health = calculateProjectDeliveryHealth({
        project: projectAuth,
        team: teamEng,
        issues,
        issueRisks: new Map([
          ['i1', critRisk],
          ['i2', critRisk],
          ['i3', lowRisk],
          ['i4', lowRisk],
        ]),
        activeBlockerCounts: new Map([
          ['i1', 0],
          ['i2', 0],
          ['i3', 0],
          ['i4', 0],
        ]),
        milestoneSummaries: [],
        referenceTime,
      });

      expect(health.health).toBe('AT_RISK');
      expect(health.criticalRiskCount).toBe(2);
      expect(health.reasons).toEqual(
        expect.arrayContaining([expect.stringContaining('2 critical-risk issues')])
      );
    });

    // 6. AT_RISK when overdue blocked work exists
    it('6. derives AT_RISK when an overdue issue is also actively blocked', () => {
      const issues = [
        createIssue('i1', 'proj_auth', 'IN_PROGRESS', { dueDate: '2026-10-05' }), // overdue
        createIssue('i2', 'proj_auth'),
      ];

      const health = calculateProjectDeliveryHealth({
        project: projectAuth,
        team: teamEng,
        issues,
        issueRisks: new Map([
          ['i1', highRisk],
          ['i2', lowRisk],
        ]),
        activeBlockerCounts: new Map([
          ['i1', 1], // actively blocked
          ['i2', 0],
        ]),
        milestoneSummaries: [],
        referenceTime,
      });

      expect(health.health).toBe('AT_RISK');
      expect(health.reasons).toEqual(
        expect.arrayContaining([expect.stringContaining('overdue issue is actively blocked')])
      );
    });

    // 7. Canonical Milestone Health: BLOCKED causes AT_RISK
    it('7. derives AT_RISK when a linked active milestone has health BLOCKED', () => {
      const issues = [
        createIssue('i1', 'proj_auth', 'IN_PROGRESS', { milestoneId: 'ms_blocked' }),
      ];
      const milestoneSummaries = [
        createMilestoneSummary('ms_blocked', 'BLOCKED', false),
      ];

      const health = calculateProjectDeliveryHealth({
        project: projectAuth,
        team: teamEng,
        issues,
        issueRisks: new Map([['i1', lowRisk]]),
        activeBlockerCounts: new Map([['i1', 0]]),
        milestoneSummaries,
        referenceTime,
      });

      expect(health.health).toBe('AT_RISK');
      expect(health.reasons).toContain('Linked milestone is BLOCKED');
    });

    // 8. Canonical Milestone Health: AT_RISK causes WATCH
    it('8. derives WATCH when a linked active milestone has health AT_RISK', () => {
      const issues = [
        createIssue('i1', 'proj_auth', 'IN_PROGRESS', { milestoneId: 'ms_at_risk' }),
      ];
      const milestoneSummaries = [
        createMilestoneSummary('ms_at_risk', 'AT_RISK', false),
      ];

      const health = calculateProjectDeliveryHealth({
        project: projectAuth,
        team: teamEng,
        issues,
        issueRisks: new Map([['i1', lowRisk]]),
        activeBlockerCounts: new Map([['i1', 0]]),
        milestoneSummaries,
        referenceTime,
      });

      expect(health.health).toBe('WATCH');
      expect(health.reasons).toContain('Linked milestone is AT_RISK');
    });

    // 9. Canonical Milestone Health: ON_TRACK does not worsen health
    it('9. derives HEALTHY when a linked milestone is ON_TRACK and other signals are healthy', () => {
      const issues = [
        createIssue('i1', 'proj_auth', 'IN_PROGRESS', { milestoneId: 'ms_ok' }),
      ];
      const milestoneSummaries = [
        createMilestoneSummary('ms_ok', 'ON_TRACK', false),
      ];

      const health = calculateProjectDeliveryHealth({
        project: projectAuth,
        team: teamEng,
        issues,
        issueRisks: new Map([['i1', lowRisk]]),
        activeBlockerCounts: new Map([['i1', 0]]),
        milestoneSummaries,
        referenceTime,
      });

      expect(health.health).toBe('HEALTHY');
      expect(health.reasons[0]).toContain('healthy thresholds');
    });

    // 10. Canonical Milestone Health: Completed milestones do not cause active risk
    it('10. ignores completed milestones even if marked BLOCKED (follows UX-05 completion contract)', () => {
      const issues = [
        createIssue('i1', 'proj_auth', 'DONE', { milestoneId: 'ms_done' }),
      ];
      const milestoneSummaries = [
        createMilestoneSummary('ms_done', 'BLOCKED', true), // isCompleted = true
      ];

      const health = calculateProjectDeliveryHealth({
        project: projectAuth,
        team: teamEng,
        issues,
        issueRisks: new Map([['i1', lowRisk]]),
        activeBlockerCounts: new Map([['i1', 0]]),
        milestoneSummaries,
        referenceTime,
      });

      expect(health.health).toBe('HEALTHY');
    });

    // 11. Canonical Milestone Health: Unlinked milestone has no effect
    it('11. does not worsen project health for unlinked milestones', () => {
      const issues = [
        createIssue('i1', 'proj_auth', 'IN_PROGRESS'), // No milestoneId
      ];
      const milestoneSummaries = [
        createMilestoneSummary('ms_other', 'BLOCKED', false),
      ];

      const health = calculateProjectDeliveryHealth({
        project: projectAuth,
        team: teamEng,
        issues,
        issueRisks: new Map([['i1', lowRisk]]),
        activeBlockerCounts: new Map([['i1', 0]]),
        milestoneSummaries,
        referenceTime,
      });

      expect(health.health).toBe('HEALTHY');
    });
  });

  describe('Team Delivery Health & Canonical Ownership', () => {
    // 12. Ownership derived through Project.teamId, not denormalized issue fields
    it('12. aggregates issues across projects owned by the team based on Project.teamId', () => {
      const projOther: Project = {
        id: 'proj_other',
        key: 'OTH',
        name: 'Other Team Project',
        teamId: 'team_inf', // Different team!
        description: 'Other description',
        currentSequence: 1,
      };

      // Issue with denormalized teamId='team_eng' but projectId='proj_other'
      const issueSpoofed = createIssue('i_spoofed', 'proj_other', 'TODO', {
        teamId: 'team_eng', // Legacy / spoofed field
      });

      const issueValid1 = createIssue('i_v1', 'proj_auth');
      const issueValid2 = createIssue('i_v2', 'proj_api');

      const allProjects = [projectAuth, projectApi, projOther];
      const allIssues = [issueSpoofed, issueValid1, issueValid2];

      const health = calculateTeamDeliveryHealth({
        team: teamEng,
        projects: allProjects,
        issues: allIssues,
        issueRisks: new Map([
          ['i_spoofed', critRisk],
          ['i_v1', lowRisk],
          ['i_v2', lowRisk],
        ]),
        activeBlockerCounts: new Map([
          ['i_spoofed', 5],
          ['i_v1', 0],
          ['i_v2', 0],
        ]),
        milestoneSummaries: [],
        referenceTime,
      });

      // i_spoofed must NOT be counted towards team_eng because its project belongs to team_inf!
      expect(health.activeIssueCount).toBe(2);
      expect(health.criticalRiskCount).toBe(0);
      expect(health.blockedIssueCount).toBe(0);
      expect(health.health).toBe('HEALTHY');
    });

    // 13. AT_RISK when team blocked ratio >= 30%
    it('13. derives team AT_RISK when combined active work across projects exceeds 30% blocked', () => {
      const issues = [
        createIssue('i1', 'proj_auth'), // blocked
        createIssue('i2', 'proj_api'),  // unblocked
      ]; // 1 of 2 = 50% blocked

      const health = calculateTeamDeliveryHealth({
        team: teamEng,
        projects: [projectAuth, projectApi],
        issues,
        issueRisks: new Map(),
        activeBlockerCounts: new Map([
          ['i1', 1],
          ['i2', 0],
        ]),
        milestoneSummaries: [],
        referenceTime,
      });

      expect(health.health).toBe('AT_RISK');
      expect(health.blockedRatio).toBe(0.5);
      expect(health.reasons[0]).toContain('50% of team\'s active work is blocked');
    });

    // 14. Team milestone association: BLOCKED milestone causes team AT_RISK
    it('14. derives team AT_RISK when a linked milestone through team projects is BLOCKED', () => {
      const issues = [
        createIssue('i1', 'proj_auth', 'IN_PROGRESS', { milestoneId: 'ms_team_blocked' }),
      ];
      const milestoneSummaries = [
        createMilestoneSummary('ms_team_blocked', 'BLOCKED', false),
      ];

      const health = calculateTeamDeliveryHealth({
        team: teamEng,
        projects: [projectAuth, projectApi],
        issues,
        issueRisks: new Map([['i1', lowRisk]]),
        activeBlockerCounts: new Map([['i1', 0]]),
        milestoneSummaries,
        referenceTime,
      });

      expect(health.health).toBe('AT_RISK');
      expect(health.reasons).toContain('Associated milestone is BLOCKED');
    });

    // 15. Team milestone association: AT_RISK milestone causes team WATCH
    it('15. derives team WATCH when a linked milestone through team projects is AT_RISK', () => {
      const issues = [
        createIssue('i1', 'proj_auth', 'IN_PROGRESS', { milestoneId: 'ms_team_watch' }),
      ];
      const milestoneSummaries = [
        createMilestoneSummary('ms_team_watch', 'AT_RISK', false),
      ];

      const health = calculateTeamDeliveryHealth({
        team: teamEng,
        projects: [projectAuth, projectApi],
        issues,
        issueRisks: new Map([['i1', lowRisk]]),
        activeBlockerCounts: new Map([['i1', 0]]),
        milestoneSummaries,
        referenceTime,
      });

      expect(health.health).toBe('WATCH');
      expect(health.reasons).toContain('Associated milestone is AT_RISK');
    });

    // 16. Team milestone association: unowned project milestones do NOT affect team
    it('16. ignores milestones linked to projects not owned by this team', () => {
      const projOther: Project = {
        id: 'proj_other',
        key: 'OTH',
        name: 'Other Team Project',
        teamId: 'team_inf',
        description: 'Other description',
        currentSequence: 1,
      };

      const issues = [
        createIssue('i1', 'proj_other', 'IN_PROGRESS', { milestoneId: 'ms_other_blocked' }),
        createIssue('i2', 'proj_auth', 'IN_PROGRESS'), // team_eng project, no milestone
      ];
      const milestoneSummaries = [
        createMilestoneSummary('ms_other_blocked', 'BLOCKED', false),
      ];

      const health = calculateTeamDeliveryHealth({
        team: teamEng,
        projects: [projectAuth, projOther],
        issues,
        issueRisks: new Map([['i1', lowRisk], ['i2', lowRisk]]),
        activeBlockerCounts: new Map([['i1', 0], ['i2', 0]]),
        milestoneSummaries,
        referenceTime,
      });

      expect(health.health).toBe('HEALTHY');
    });
  });
});
