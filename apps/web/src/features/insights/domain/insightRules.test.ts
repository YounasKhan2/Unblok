/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { deriveInsightSignals } from './insightRules';
import { Issue, Project, Team } from '../../../types';
import { BottleneckRankItem, CrossTeamMatrixData, TeamMatrixCell } from '../../dependencies/types';
import { MilestoneSummaryData, CycleSummaryData } from '../../planning/types';
import { ExecutionRisk } from '../types';

describe('UX-07 Needs Attention Signal Derivation & Prioritization', () => {
  const referenceTime = new Date('2026-10-10T12:00:00.000Z');

  const teamEng: Team = { id: 'team_eng', key: 'ENG', name: 'Engineering', color: '#3B82F6', description: 'Eng' };
  const teamWeb: Team = { id: 'team_web', key: 'WEB', name: 'Web UI', color: '#10B981', description: 'Web' };
  const teams = [teamEng, teamWeb];

  const projectCore: Project = {
    id: 'proj_core',
    key: 'CORE',
    name: 'Core Platform',
    teamId: 'team_eng',
    description: 'Core description',
    currentSequence: 1,
  };
  const projects = [projectCore];

  const createIssue = (id: string, key: string, overrides: Partial<Issue> = {}): Issue => ({
    id,
    key,
    projectId: 'proj_core',
    teamId: 'team_eng',
    title: `Issue ${key}`,
    description: 'Description',
    state: 'TODO',
    priority: 'HIGH',
    creatorId: 'usr_sarah',
    createdAt: '2026-10-01T09:00:00.000Z',
    updatedAt: '2026-10-01T09:00:00.000Z',
    version: 1,
    ...overrides,
  });

  const emptyMatrix: CrossTeamMatrixData = {
    teams,
    matrix: new Map([
      ['team_eng', new Map()],
      ['team_web', new Map()],
    ]),
    totalCrossTeamActiveEdges: 0,
  };

  // 1. CRITICAL_BLOCKER signal generation
  it('1. generates CRITICAL_BLOCKER signal with deterministic ID and impact score', () => {
    const issue = createIssue('iss_b1', 'ENG-142', { title: 'Auth Token API' });
    const bottleneck: BottleneckRankItem = {
      issue,
      project: projectCore,
      team: teamEng,
      directDownstreamCount: 4,
      transitiveBlastRadius: 6,
      affectedTeamCount: 2,
      affectedProjectCount: 2,
      affectedTeams: teams,
      affectedProjects: projects,
    };

    const signals = deriveInsightSignals({
      issues: [issue],
      projects,
      teams,
      issueRisks: new Map(),
      bottlenecks: [bottleneck],
      milestones: [],
      cycles: [],
      crossTeamMatrix: emptyMatrix,
      referenceTime,
    });

    const sig = signals.find(s => s.kind === 'CRITICAL_BLOCKER');
    expect(sig).toBeDefined();
    expect(sig?.id).toBe('sig_crit_blocker_iss_b1');
    expect(sig?.severity).toBe('CRITICAL');
    expect(sig?.title).toContain('ENG-142 is blocking 4 active issues');
    expect(sig?.explanation).toContain('across 2 teams');
    expect(sig?.targetUrl).toContain('/dependencies?issue=ENG-142');
  });

  // 2. DELIVERY_RISK signal generation
  it('2. generates DELIVERY_RISK signal for issues with CRITICAL execution risk', () => {
    const issue = createIssue('iss_r1', 'API-31', { title: 'Checkout Gateway' });
    const critRisk: ExecutionRisk = {
      score: 8,
      level: 'CRITICAL',
      reasons: [
        { code: 'ACTIVE_BLOCKER', weight: 3, description: 'Blocked by 2 active dependencies' },
        { code: 'OVERDUE', weight: 3, description: 'Overdue by 4 days' },
      ],
    };

    const signals = deriveInsightSignals({
      issues: [issue],
      projects,
      teams,
      issueRisks: new Map([['iss_r1', critRisk]]),
      bottlenecks: [],
      milestones: [],
      cycles: [],
      crossTeamMatrix: emptyMatrix,
      referenceTime,
    });

    const sig = signals.find(s => s.kind === 'DELIVERY_RISK');
    expect(sig).toBeDefined();
    expect(sig?.id).toBe('sig_delivery_risk_iss_r1');
    expect(sig?.severity).toBe('CRITICAL');
    expect(sig?.title).toContain('API-31 delivery at critical risk');
    expect(sig?.explanation).toContain('Blocked by 2 active dependencies');
  });

  // 3. OVERDUE_WORK signal generation
  it('3. generates OVERDUE_WORK signal for overdue active work', () => {
    const issue = createIssue('iss_od1', 'WEB-12', {
      dueDate: '2026-10-06', // 4 days overdue
      priority: 'MEDIUM',
    });

    const signals = deriveInsightSignals({
      issues: [issue],
      projects,
      teams,
      issueRisks: new Map([['iss_od1', { score: 3, level: 'MEDIUM', reasons: [] }]]),
      bottlenecks: [],
      milestones: [],
      cycles: [],
      crossTeamMatrix: emptyMatrix,
      referenceTime,
    });

    const sig = signals.find(s => s.kind === 'OVERDUE_WORK');
    expect(sig).toBeDefined();
    expect(sig?.id).toBe('sig_overdue_iss_od1');
    expect(sig?.title).toContain('WEB-12 is 4 days overdue');
  });

  // 4. MILESTONE_RISK signal generation
  it('4. generates MILESTONE_RISK for BLOCKED and AT_RISK milestones', () => {
    const blockedMilestone: MilestoneSummaryData = {
      milestone: {
        id: 'ms_1',
        name: 'Authentication Hardening',
        targetDate: '2026-10-25',
        description: 'Hardening milestone',
        teamId: 'ALL',
      },
      health: 'BLOCKED',
      isCompleted: false,
      progress: {
        total: 10,
        completed: 4,
        remaining: 6,
        blocked: 3,
        inProgress: 2,
        percent: 40,
        daysRemaining: 15,
        isOverdue: false,
      },
      issues: [],
      blockedIssues: [],
      contributingTeams: teams,
      contributingProjects: projects,
    };

    const signals = deriveInsightSignals({
      issues: [],
      projects,
      teams,
      issueRisks: new Map(),
      bottlenecks: [],
      milestones: [blockedMilestone],
      cycles: [],
      crossTeamMatrix: emptyMatrix,
      referenceTime,
    });

    const sig = signals.find(s => s.kind === 'MILESTONE_RISK');
    expect(sig).toBeDefined();
    expect(sig?.id).toBe('sig_milestone_ms_1');
    expect(sig?.severity).toBe('CRITICAL');
    expect(sig?.title).toContain('Authentication Hardening" is Blocked');
    expect(sig?.explanation).toContain('6 unfinished issues (3 blocked)');
  });

  // 5. CYCLE_PRESSURE signal generation
  it('5. generates CYCLE_PRESSURE for active cycles with deadline urgency', () => {
    const urgentCycle: CycleSummaryData = {
      cycle: {
        id: 'cyc_14',
        name: 'Platform Cycle 14',
        startDate: '2026-10-01',
        endDate: '2026-10-12',
        status: 'ACTIVE',
        teamId: 'team_eng',
      },
      progress: {
        total: 12,
        completed: 6,
        remaining: 6,
        blocked: 2,
        inProgress: 3,
        todo: 1,
        percent: 50,
        daysRemaining: 2,
        totalDays: 14,
      },
    };

    const signals = deriveInsightSignals({
      issues: [],
      projects,
      teams,
      issueRisks: new Map(),
      bottlenecks: [],
      milestones: [],
      cycles: [urgentCycle],
      crossTeamMatrix: emptyMatrix,
      referenceTime,
    });

    const sig = signals.find(s => s.kind === 'CYCLE_PRESSURE');
    expect(sig).toBeDefined();
    expect(sig?.id).toBe('sig_cycle_cyc_14');
    expect(sig?.title).toContain('Platform Cycle 14" under delivery pressure');
    expect(sig?.explanation).toContain('6 unfinished tasks with 2 days remaining');
  });

  // 6. CROSS_TEAM_BOTTLENECK signal generation
  it('6. generates CROSS_TEAM_BOTTLENECK when cross-team active edges >= 2', () => {
    const matrix: CrossTeamMatrixData = {
      teams,
      matrix: new Map([
        [
          'team_eng',
          new Map([
            [
              'team_web',
              {
                blockingTeam: teamEng,
                blockedTeam: teamWeb,
                activeEdgeCount: 4,
                resolvedEdgeCount: 0,
                matchingEdges: [],
                blockedIssueCount: 3,
              },
            ],
          ]),
        ],
        ['team_web', new Map()],
      ]),
      totalCrossTeamActiveEdges: 4,
    };

    const signals = deriveInsightSignals({
      issues: [],
      projects,
      teams,
      issueRisks: new Map(),
      bottlenecks: [],
      milestones: [],
      cycles: [],
      crossTeamMatrix: matrix,
      referenceTime,
    });

    const sig = signals.find(s => s.kind === 'CROSS_TEAM_BOTTLENECK');
    expect(sig).toBeDefined();
    expect(sig?.id).toBe('sig_cross_team_team_eng_team_web');
    expect(sig?.severity).toBe('CRITICAL');
    expect(sig?.title).toBe('Engineering → Web UI cross-team bottleneck');
    expect(sig?.explanation).toContain('4 active dependency edges blocking 3 downstream tasks');
  });

  // 7. Prioritization: CRITICAL appears before WARNING, higher impact first
  it('7. ranks signals deterministically: CRITICAL before WARNING, then impact score descending', () => {
    const warningSignalIssue = createIssue('iss_warn', 'ENG-20', { dueDate: '2026-10-08' }); // 2 days overdue, medium priority
    const criticalBottleneckIssue = createIssue('iss_crit', 'ENG-1', { title: 'Core Bottleneck' });

    const bottleneck: BottleneckRankItem = {
      issue: criticalBottleneckIssue,
      project: projectCore,
      team: teamEng,
      directDownstreamCount: 5,
      transitiveBlastRadius: 8,
      affectedTeamCount: 2,
      affectedProjectCount: 2,
      affectedTeams: teams,
      affectedProjects: projects,
    };

    const signals = deriveInsightSignals({
      issues: [warningSignalIssue],
      projects,
      teams,
      issueRisks: new Map(),
      bottlenecks: [bottleneck],
      milestones: [],
      cycles: [],
      crossTeamMatrix: emptyMatrix,
      referenceTime,
    });

    expect(signals.length).toBeGreaterThanOrEqual(2);
    expect(signals[0].severity).toBe('CRITICAL');
    expect(signals[0].id).toBe('sig_crit_blocker_iss_crit');
  });

  // 8. Deduplication: no duplicate signals for same issue
  it('8. deduplicates signals so an issue with both critical blocker and delivery risk emits one primary signal', () => {
    const issue = createIssue('iss_dup', 'ENG-99');
    const bottleneck: BottleneckRankItem = {
      issue,
      project: projectCore,
      team: teamEng,
      directDownstreamCount: 3,
      transitiveBlastRadius: 4,
      affectedTeamCount: 2,
      affectedProjectCount: 1,
      affectedTeams: teams,
      affectedProjects: projects,
    };

    const critRisk: ExecutionRisk = {
      score: 7,
      level: 'CRITICAL',
      reasons: [{ code: 'ACTIVE_BLOCKER', weight: 3, description: 'Blocked' }],
    };

    const signals = deriveInsightSignals({
      issues: [issue],
      projects,
      teams,
      issueRisks: new Map([['iss_dup', critRisk]]),
      bottlenecks: [bottleneck],
      milestones: [],
      cycles: [],
      crossTeamMatrix: emptyMatrix,
      referenceTime,
    });

    const issueSignals = signals.filter(s => s.issueIds?.includes('iss_dup'));
    expect(issueSignals).toHaveLength(1);
    expect(issueSignals[0].kind).toBe('CRITICAL_BLOCKER');
  });
});
