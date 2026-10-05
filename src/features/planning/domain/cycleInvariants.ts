/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Cycle, Issue, Project, Dependency, IssueState } from '../../../types';
import { getBlockerStatus } from '../../../domain/dependency';
import { CycleProgress, ClassifiedCycles } from '../types';

/**
 * Section 14: Planning Completion Semantics
 * Completed: DONE, CANCELLED
 * Unfinished: BACKLOG, TODO, IN_PROGRESS, IN_REVIEW
 * (IN_REVIEW does NOT count as completed)
 */
export function isIssueCompletedForPlanning(state: IssueState): boolean {
  return state === 'DONE' || state === 'CANCELLED';
}

/**
 * Section 10: Cycle Team Invariant
 * A Cycle belongs to exactly one Team.
 * Issue -> Project -> Team.
 * An Issue may enter a Cycle only when: issueProject.teamId === cycle.teamId
 */
export function canAssignIssueToCycle(
  issue: Issue,
  cycle: Cycle | undefined,
  projects: Project[]
): { allowed: boolean; reason?: string } {
  // If cycle is undefined, unscheduling is always allowed
  if (!cycle) {
    return { allowed: true };
  }

  const project = projects.find(p => p.id === issue.projectId);
  if (!project) {
    return {
      allowed: false,
      reason: `Issue ${issue.key} does not belong to a valid project.`,
    };
  }

  // Cross-team cycle assignment is strictly forbidden
  if (cycle.teamId && cycle.teamId !== 'ALL' && project.teamId !== cycle.teamId) {
    return {
      allowed: false,
      reason: `Cross-team cycle assignment rejected: Issue ${issue.key} belongs to team "${project.teamId}", but cycle "${cycle.name}" belongs to team "${cycle.teamId}".`,
    };
  }

  return { allowed: true };
}

/**
 * Section 11: Active Cycle Invariant
 * A Team may have at most one active Cycle.
 */
export function validateActiveCycleInvariant(
  teamId: string,
  cycles: Cycle[],
  excludeCycleId?: string
): { allowed: boolean; activeCycle?: Cycle; reason?: string } {
  if (teamId === 'ALL') {
    return { allowed: true };
  }

  const existingActive = cycles.find(
    c => c.teamId === teamId && c.status === 'ACTIVE' && c.id !== excludeCycleId
  );

  if (existingActive) {
    return {
      allowed: false,
      activeCycle: existingActive,
      reason: `Team "${teamId}" already has an active cycle ("${existingActive.name}"). Only one active cycle is permitted per team.`,
    };
  }

  return { allowed: true };
}

/**
 * Section 16: Validate Cycle Creation
 */
export function validateCycleCreation(
  data: {
    name: string;
    startDate: string;
    endDate: string;
    teamId: string;
    status?: 'ACTIVE' | 'UPCOMING' | 'COMPLETED';
  },
  existingCycles: Cycle[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.name || !data.name.trim()) {
    errors.push('Cycle name is required.');
  }

  if (!data.startDate) {
    errors.push('Start date is required.');
  }

  if (!data.endDate) {
    errors.push('End date is required.');
  }

  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate).getTime();
    const end = new Date(data.endDate).getTime();
    if (isNaN(start) || isNaN(end)) {
      errors.push('Invalid date format.');
    } else if (start >= end) {
      errors.push('Start date must be before end date.');
    }
  }

  if (!data.teamId || !data.teamId.trim()) {
    errors.push('Owning team is required.');
  }

  if (data.status === 'ACTIVE') {
    const activeCheck = validateActiveCycleInvariant(data.teamId, existingCycles);
    if (!activeCheck.allowed) {
      errors.push(activeCheck.reason || 'Team already has an active cycle.');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Section 23: Rollover Validation
 * Target must:
 * - be an eligible upcoming Cycle
 * - belong to the same Team
 * Cross-team rollover is forbidden.
 */
export function validateRollover(
  fromCycle: Cycle,
  targetCycle: Cycle
): { allowed: boolean; reason?: string } {
  if (fromCycle.id === targetCycle.id) {
    return {
      allowed: false,
      reason: 'Target cycle cannot be the same as the originating cycle.',
    };
  }

  if (
    fromCycle.teamId &&
    targetCycle.teamId &&
    fromCycle.teamId !== 'ALL' &&
    targetCycle.teamId !== 'ALL' &&
    fromCycle.teamId !== targetCycle.teamId
  ) {
    return {
      allowed: false,
      reason: `Cross-team rollover forbidden: Source cycle belongs to team "${fromCycle.teamId}", but target cycle belongs to team "${targetCycle.teamId}".`,
    };
  }

  if (targetCycle.status !== 'UPCOMING') {
    return {
      allowed: false,
      reason: `Target cycle must be in UPCOMING status (currently ${targetCycle.status}).`,
    };
  }

  return { allowed: true };
}

/**
 * Section 13 & 18: Compact Cycle Progress Calculation
 * Reuses canonical UX-04 blocker truth via getBlockerStatus.
 */
export function calculateCycleProgress(
  cycle: Cycle,
  issues: Issue[],
  dependencies: Dependency[],
  referenceDate: Date = new Date()
): CycleProgress {
  const cycleIssues = issues.filter(i => i.cycleId === cycle.id);
  const total = cycleIssues.length;

  let completed = 0;
  let remaining = 0;
  let blocked = 0;
  let inProgress = 0;
  let todo = 0;

  for (const issue of cycleIssues) {
    const isCompleted = isIssueCompletedForPlanning(issue.state);
    if (isCompleted) {
      completed++;
    } else {
      remaining++;
      const blockerStatus = getBlockerStatus(issue.id, issues, dependencies);
      if (blockerStatus.activeCount > 0) {
        blocked++;
      }

      if (issue.state === 'IN_PROGRESS' || issue.state === 'IN_REVIEW') {
        inProgress++;
      } else {
        todo++;
      }
    }
  }

  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Days calculation
  const start = new Date(cycle.startDate).getTime();
  const end = new Date(cycle.endDate).getTime();
  const now = referenceDate.getTime();
  const totalDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
  const daysRemaining = Math.max(0, Math.round((end - now) / (1000 * 60 * 60 * 24)));

  return {
    total,
    completed,
    remaining,
    blocked,
    inProgress,
    todo,
    percent,
    daysRemaining,
    totalDays,
  };
}

/**
 * Section 12: Classify Cycles into Active, Upcoming, Completed
 */
export function classifyCycles(cycles: Cycle[], teamFilter?: string): ClassifiedCycles {
  let filtered = cycles;
  if (teamFilter && teamFilter !== 'ALL') {
    filtered = cycles.filter(c => c.teamId === teamFilter || c.teamId === 'ALL');
  }

  const active = filtered
    .filter(c => c.status === 'ACTIVE')
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const upcoming = filtered
    .filter(c => c.status === 'UPCOMING')
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const completed = filtered
    .filter(c => c.status === 'COMPLETED')
    .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());

  return { active, upcoming, completed };
}
