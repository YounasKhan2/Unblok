/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Issue, IssueState, Project } from '../../../types';
import { ExecutionRisk, ExecutionRiskLevel, ExecutionRiskReason } from '../types';

export const RISK_THRESHOLDS = {
  MEDIUM: 2,
  HIGH: 4,
  CRITICAL: 6,
} as const;

/**
 * Canonical check for active work.
 * Completed/non-active states are strictly DONE and CANCELLED.
 */
export function isActiveIssue(state: IssueState): boolean {
  return state !== 'DONE' && state !== 'CANCELLED';
}

export interface RiskEvaluationContext {
  activeBlockerCount: number;
  hasCrossTeamBlocker: boolean;
  activeDownstreamCount: number;
  project?: Project;
}

/**
 * Normalizes a date or date-string into UTC midnight for deterministic day comparisons.
 */
export function normalizeDateToMidnight(dateInput: string | Date): Date {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : new Date(dateInput.getTime());
  // If parsing a date-only string like "2026-10-06", avoid timezone shifts
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    const [year, month, day] = dateInput.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  }
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

/**
 * Calculates calendar day difference (targetDate - referenceDate).
 * Negative means targetDate is before referenceDate (overdue).
 */
export function getCalendarDaysDiff(targetDateInput: string | Date, referenceDate: Date): number {
  const target = normalizeDateToMidnight(targetDateInput);
  const ref = normalizeDateToMidnight(referenceDate);
  const diffMs = target.getTime() - ref.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Derives deterministic execution risk for an issue based on explicit, explainable rules.
 * All factors, weights, and thresholds are centralized and transparent.
 */
export function calculateExecutionRisk(
  issue: Issue,
  context: RiskEvaluationContext,
  referenceTime: Date = new Date()
): ExecutionRisk {
  // Non-active issues have zero execution risk
  if (!isActiveIssue(issue.state)) {
    return {
      score: 0,
      level: 'LOW',
      reasons: [],
    };
  }

  let score = 0;
  const reasons: ExecutionRiskReason[] = [];

  // 1. Active Blocker (+3 for first, +1 for each additional)
  if (context.activeBlockerCount > 0) {
    score += 3;
    reasons.push({
      code: 'ACTIVE_BLOCKER',
      weight: 3,
      description: 'Blocked by active upstream dependency (+3)',
    });

    if (context.activeBlockerCount > 1) {
      const additionalCount = context.activeBlockerCount - 1;
      score += additionalCount;
      reasons.push({
        code: 'MULTIPLE_BLOCKERS',
        weight: additionalCount,
        description: `Blocked by ${additionalCount} additional active blocker${additionalCount > 1 ? 's' : ''} (+${additionalCount})`,
      });
    }
  }

  // 2. Overdue (+3) or Due Soon (+2)
  if (issue.dueDate) {
    const daysDiff = getCalendarDaysDiff(issue.dueDate, referenceTime);
    if (daysDiff < 0) {
      // Overdue
      const daysOverdue = Math.abs(daysDiff);
      score += 3;
      reasons.push({
        code: 'OVERDUE',
        weight: 3,
        description: `Overdue by ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} (+3)`,
      });
    } else if (daysDiff <= 3) {
      // Due soon (within 3 calendar days)
      score += 2;
      reasons.push({
        code: 'DUE_SOON',
        weight: 2,
        description: daysDiff === 0 ? 'Due today (+2)' : `Due in ${daysDiff} day${daysDiff > 1 ? 's' : ''} (+2)`,
      });
    }
  }

  // 3. Cross-Team Dependency (+1)
  if (context.hasCrossTeamBlocker) {
    score += 1;
    reasons.push({
      code: 'CROSS_TEAM_DEPENDENCY',
      weight: 1,
      description: 'Blocked by cross-team dependency (+1)',
    });
  }

  // 4. High Downstream Impact (+2 for 2-3, +3 for 4+)
  if (context.activeDownstreamCount >= 4) {
    score += 3;
    reasons.push({
      code: 'HIGH_DOWNSTREAM_IMPACT',
      weight: 3,
      description: `Actively blocks ${context.activeDownstreamCount} downstream issues (+3)`,
    });
  } else if (context.activeDownstreamCount >= 2) {
    score += 2;
    reasons.push({
      code: 'HIGH_DOWNSTREAM_IMPACT',
      weight: 2,
      description: `Actively blocks ${context.activeDownstreamCount} downstream issues (+2)`,
    });
  }

  // 5. Stale Execution (+1 if in progress / in review with >= 5 days since update)
  if (issue.state === 'IN_PROGRESS' || issue.state === 'IN_REVIEW') {
    if (issue.updatedAt) {
      const daysSinceUpdate = Math.abs(getCalendarDaysDiff(issue.updatedAt, referenceTime));
      if (daysSinceUpdate >= 5) {
        score += 1;
        reasons.push({
          code: 'STALE_EXECUTION',
          weight: 1,
          description: `No activity for ${daysSinceUpdate} days while ${issue.state === 'IN_PROGRESS' ? 'in progress' : 'in review'} (+1)`,
        });
      }
    }
  }

  // Determine Level from Centralized Thresholds
  let level: ExecutionRiskLevel = 'LOW';
  if (score >= RISK_THRESHOLDS.CRITICAL) {
    level = 'CRITICAL';
  } else if (score >= RISK_THRESHOLDS.HIGH) {
    level = 'HIGH';
  } else if (score >= RISK_THRESHOLDS.MEDIUM) {
    level = 'MEDIUM';
  }

  return {
    score,
    level,
    reasons,
  };
}
