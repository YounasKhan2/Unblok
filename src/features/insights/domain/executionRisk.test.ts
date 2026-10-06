/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { calculateExecutionRisk, isActiveIssue, RISK_THRESHOLDS } from './executionRisk';
import { Issue } from '../../../types';

describe('UX-07 Issue Execution Risk Model', () => {
  const referenceTime = new Date('2026-10-10T12:00:00.000Z');

  const createSampleIssue = (overrides: Partial<Issue> = {}): Issue => ({
    id: 'iss_test_1',
    key: 'ENG-101',
    projectId: 'proj_core',
    teamId: 'team_eng',
    title: 'Implement OAuth refresh token rotation',
    description: 'Ensure secure session expiration',
    state: 'TODO',
    priority: 'MEDIUM',
    creatorId: 'usr_sarah',
    createdAt: '2026-10-01T09:00:00.000Z',
    updatedAt: '2026-10-08T10:00:00.000Z',
    version: 1,
    ...overrides,
  });

  // 1. Clean active issue -> LOW
  it('1. clean active issue without blockers or deadlines has score 0 and LOW risk', () => {
    const issue = createSampleIssue();
    const risk = calculateExecutionRisk(
      issue,
      {
        activeBlockerCount: 0,
        hasCrossTeamBlocker: false,
        activeDownstreamCount: 0,
      },
      referenceTime
    );

    expect(risk.score).toBe(0);
    expect(risk.level).toBe('LOW');
    expect(risk.reasons).toHaveLength(0);
  });

  // 2. Blocked issue increases risk (+3)
  it('2. blocked issue increases risk score by +3 with explicit reason', () => {
    const issue = createSampleIssue();
    const risk = calculateExecutionRisk(
      issue,
      {
        activeBlockerCount: 1,
        hasCrossTeamBlocker: false,
        activeDownstreamCount: 0,
      },
      referenceTime
    );

    expect(risk.score).toBe(3);
    expect(risk.level).toBe('MEDIUM');
    expect(risk.reasons).toHaveLength(1);
    expect(risk.reasons[0].code).toBe('ACTIVE_BLOCKER');
    expect(risk.reasons[0].weight).toBe(3);
  });

  // 3. Multiple blockers increase risk (+1 per additional blocker)
  it('3. multiple blockers increase risk: +3 for first, +1 for each additional', () => {
    const issue = createSampleIssue();
    const risk = calculateExecutionRisk(
      issue,
      {
        activeBlockerCount: 3, // 3 + 2 = 5
        hasCrossTeamBlocker: false,
        activeDownstreamCount: 0,
      },
      referenceTime
    );

    expect(risk.score).toBe(5);
    expect(risk.level).toBe('HIGH');
    expect(risk.reasons).toHaveLength(2);
    expect(risk.reasons[0].code).toBe('ACTIVE_BLOCKER');
    expect(risk.reasons[1].code).toBe('MULTIPLE_BLOCKERS');
    expect(risk.reasons[1].weight).toBe(2);
  });

  // 4. Overdue increases risk (+3)
  it('4. overdue unfinished issue increases risk score by +3', () => {
    const issue = createSampleIssue({ dueDate: '2026-10-07' }); // 3 days before referenceTime
    const risk = calculateExecutionRisk(
      issue,
      {
        activeBlockerCount: 0,
        hasCrossTeamBlocker: false,
        activeDownstreamCount: 0,
      },
      referenceTime
    );

    expect(risk.score).toBe(3);
    expect(risk.level).toBe('MEDIUM');
    const overdueReason = risk.reasons.find(r => r.code === 'OVERDUE');
    expect(overdueReason).toBeDefined();
    expect(overdueReason?.weight).toBe(3);
  });

  // 5. Due soon increases risk (+2)
  it('5. unfinished issue due within 3 days increases risk score by +2', () => {
    const issue = createSampleIssue({ dueDate: '2026-10-12' }); // 2 days after referenceTime
    const risk = calculateExecutionRisk(
      issue,
      {
        activeBlockerCount: 0,
        hasCrossTeamBlocker: false,
        activeDownstreamCount: 0,
      },
      referenceTime
    );

    expect(risk.score).toBe(2);
    expect(risk.level).toBe('MEDIUM');
    const dueSoonReason = risk.reasons.find(r => r.code === 'DUE_SOON');
    expect(dueSoonReason).toBeDefined();
    expect(dueSoonReason?.weight).toBe(2);
  });

  // 6. Cross-team dependency increases risk (+1)
  it('6. cross-team active blocker increases risk score by +1', () => {
    const issue = createSampleIssue();
    const risk = calculateExecutionRisk(
      issue,
      {
        activeBlockerCount: 1, // +3
        hasCrossTeamBlocker: true, // +1
        activeDownstreamCount: 0,
      },
      referenceTime
    );

    expect(risk.score).toBe(4);
    expect(risk.level).toBe('HIGH');
    const crossReason = risk.reasons.find(r => r.code === 'CROSS_TEAM_DEPENDENCY');
    expect(crossReason).toBeDefined();
    expect(crossReason?.weight).toBe(1);
  });

  // 7. Downstream impact increases risk (+2 for 2-3, +3 for 4+)
  it('7. high downstream impact increases risk (+2 for 2-3 downstream, +3 for 4+ downstream)', () => {
    const issue = createSampleIssue();
    // 2 downstream issues
    const risk2 = calculateExecutionRisk(
      issue,
      {
        activeBlockerCount: 0,
        hasCrossTeamBlocker: false,
        activeDownstreamCount: 2,
      },
      referenceTime
    );
    expect(risk2.score).toBe(2);
    expect(risk2.reasons[0].code).toBe('HIGH_DOWNSTREAM_IMPACT');
    expect(risk2.reasons[0].weight).toBe(2);

    // 4 downstream issues
    const risk4 = calculateExecutionRisk(
      issue,
      {
        activeBlockerCount: 0,
        hasCrossTeamBlocker: false,
        activeDownstreamCount: 4,
      },
      referenceTime
    );
    expect(risk4.score).toBe(3);
    expect(risk4.reasons[0].code).toBe('HIGH_DOWNSTREAM_IMPACT');
    expect(risk4.reasons[0].weight).toBe(3);
  });

  // 8. Stale execution increases risk (+1)
  it('8. stale execution in progress for >= 5 days increases risk by +1', () => {
    const issue = createSampleIssue({
      state: 'IN_PROGRESS',
      updatedAt: '2026-10-04T09:00:00.000Z', // 6 days before referenceTime
    });
    const risk = calculateExecutionRisk(
      issue,
      {
        activeBlockerCount: 0,
        hasCrossTeamBlocker: false,
        activeDownstreamCount: 0,
      },
      referenceTime
    );

    expect(risk.score).toBe(1);
    const staleReason = risk.reasons.find(r => r.code === 'STALE_EXECUTION');
    expect(staleReason).toBeDefined();
    expect(staleReason?.weight).toBe(1);
  });

  // 9. DONE ignored appropriately
  it('9. DONE issues are strictly ignored and receive score 0 and LOW risk', () => {
    const issue = createSampleIssue({
      state: 'DONE',
      dueDate: '2026-10-01', // Past due date
    });
    const risk = calculateExecutionRisk(
      issue,
      {
        activeBlockerCount: 2,
        hasCrossTeamBlocker: true,
        activeDownstreamCount: 5,
      },
      referenceTime
    );

    expect(risk.score).toBe(0);
    expect(risk.level).toBe('LOW');
    expect(risk.reasons).toHaveLength(0);
  });

  // 10. CANCELLED ignored appropriately
  it('10. CANCELLED issues are strictly ignored and receive score 0 and LOW risk', () => {
    const issue = createSampleIssue({
      state: 'CANCELLED',
      dueDate: '2026-10-01',
    });
    const risk = calculateExecutionRisk(
      issue,
      {
        activeBlockerCount: 3,
        hasCrossTeamBlocker: true,
        activeDownstreamCount: 2,
      },
      referenceTime
    );

    expect(risk.score).toBe(0);
    expect(risk.level).toBe('LOW');
    expect(risk.reasons).toHaveLength(0);
  });

  // 11. Score thresholds: LOW (0-1), MEDIUM (2-3), HIGH (4-5), CRITICAL (6+)
  it('11. strictly respects centralized risk score thresholds', () => {
    expect(RISK_THRESHOLDS.MEDIUM).toBe(2);
    expect(RISK_THRESHOLDS.HIGH).toBe(4);
    expect(RISK_THRESHOLDS.CRITICAL).toBe(6);

    const issue = createSampleIssue();

    // Score 1 -> LOW
    const lowRisk = calculateExecutionRisk(
      createSampleIssue({ state: 'IN_PROGRESS', updatedAt: '2026-10-03T00:00:00.000Z' }),
      { activeBlockerCount: 0, hasCrossTeamBlocker: false, activeDownstreamCount: 0 },
      referenceTime
    );
    expect(lowRisk.score).toBe(1);
    expect(lowRisk.level).toBe('LOW');

    // Score 3 -> MEDIUM
    const medRisk = calculateExecutionRisk(
      issue,
      { activeBlockerCount: 1, hasCrossTeamBlocker: false, activeDownstreamCount: 0 }, // +3
      referenceTime
    );
    expect(medRisk.score).toBe(3);
    expect(medRisk.level).toBe('MEDIUM');

    // Score 5 -> HIGH (1 blocker (+3) + due soon (+2))
    const highRisk = calculateExecutionRisk(
      createSampleIssue({ dueDate: '2026-10-12' }), // +2
      { activeBlockerCount: 1, hasCrossTeamBlocker: false, activeDownstreamCount: 0 }, // +3
      referenceTime
    );
    expect(highRisk.score).toBe(5);
    expect(highRisk.level).toBe('HIGH');

    // Score 7 -> CRITICAL (1 blocker (+3) + overdue (+3) + cross-team (+1))
    const critRisk = calculateExecutionRisk(
      createSampleIssue({ dueDate: '2026-10-05' }), // +3
      { activeBlockerCount: 1, hasCrossTeamBlocker: true, activeDownstreamCount: 0 }, // +3 + 1
      referenceTime
    );
    expect(critRisk.score).toBe(7);
    expect(critRisk.level).toBe('CRITICAL');
  });

  // 12. Reasons breakdown strictly matches final score
  it('12. sum of individual reason weights strictly matches total score', () => {
    const issue = createSampleIssue({
      state: 'IN_PROGRESS',
      dueDate: '2026-10-06', // Overdue: +3
      updatedAt: '2026-10-02T10:00:00.000Z', // Stale: +1
    });

    const risk = calculateExecutionRisk(
      issue,
      {
        activeBlockerCount: 2, // 3 + 1 = +4
        hasCrossTeamBlocker: true, // +1
        activeDownstreamCount: 3, // +2
      },
      referenceTime
    );

    // Expected: 3 (overdue) + 1 (stale) + 3 (1st blocker) + 1 (2nd blocker) + 1 (cross-team) + 2 (downstream) = 11
    expect(risk.score).toBe(11);
    expect(risk.level).toBe('CRITICAL');

    const totalFromReasons = risk.reasons.reduce((acc, r) => acc + r.weight, 0);
    expect(totalFromReasons).toBe(risk.score);
  });

  // 13. Deterministic reference time prevents environment drift
  it('13. deterministic reference time produces stable, reproducible risk values', () => {
    const issue = createSampleIssue({ dueDate: '2026-10-08' });
    const fixedClockA = new Date('2026-10-09T00:00:00.000Z'); // Overdue by 1 day
    const fixedClockB = new Date('2026-10-06T00:00:00.000Z'); // Due in 2 days (due soon)

    const riskA = calculateExecutionRisk(
      issue,
      { activeBlockerCount: 0, hasCrossTeamBlocker: false, activeDownstreamCount: 0 },
      fixedClockA
    );
    expect(riskA.score).toBe(3); // overdue
    expect(riskA.reasons[0].code).toBe('OVERDUE');

    const riskB = calculateExecutionRisk(
      issue,
      { activeBlockerCount: 0, hasCrossTeamBlocker: false, activeDownstreamCount: 0 },
      fixedClockB
    );
    expect(riskB.score).toBe(2); // due soon
    expect(riskB.reasons[0].code).toBe('DUE_SOON');
  });
});
