/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Cycle, Milestone, Issue, Project, Team, User, ActivityEvent } from '../../../types';
import { canMutatePlanning } from '../permissions';
import {
  canAssignIssueToCycle,
  validateActiveCycleInvariant,
  validateCycleCreation,
  validateRollover,
  isIssueCompletedForPlanning,
} from './cycleInvariants';
import { validateMilestoneData } from './milestoneInvariants';
import { validateScheduleDates } from './scheduleInvariants';
import { createActivityEvent } from '../../../domain/audit';

export interface PlanningState {
  cycles: Cycle[];
  issues: Issue[];
  projects: Project[];
  teams: Team[];
  currentUser: User;
  activities: ActivityEvent[];
}

/**
 * Executes cycle completion and rollover atomically:
 * Performs ALL validations before ANY state changes.
 * On failure, returns success: false and ZERO state changes.
 */
export function executeCompleteCycle(
  state: PlanningState,
  params: {
    cycleId: string;
    rolloverData?: { targetCycleId?: string; issueIdsToRollover?: string[] };
  }
): {
  success: boolean;
  rolledCount: number;
  error?: string;
  nextState?: PlanningState;
} {
  // 1. Permission check
  if (!canMutatePlanning(state.currentUser.role)) {
    return { success: false, rolledCount: 0, error: 'Permission denied: Observer cannot complete cycles.' };
  }

  // 2. Source cycle exists
  const cycle = state.cycles.find(c => c.id === params.cycleId);
  if (!cycle) {
    return { success: false, rolledCount: 0, error: `Cycle "${params.cycleId}" not found.` };
  }

  // 3. Derive unfinished in source cycle
  const unfinishedInCycle = state.issues.filter(
    i => i.cycleId === params.cycleId && !isIssueCompletedForPlanning(i.state)
  );

  let targetCycle: Cycle | undefined;
  let validRolloverIds: string[] = [];

  // 4. Validate rollover if requested
  if (params.rolloverData?.targetCycleId) {
    targetCycle = state.cycles.find(c => c.id === params.rolloverData!.targetCycleId);
    if (!targetCycle) {
      return { success: false, rolledCount: 0, error: `Target cycle "${params.rolloverData.targetCycleId}" not found.` };
    }

    const rolloverCheck = validateRollover(cycle, targetCycle);
    if (!rolloverCheck.allowed) {
      return { success: false, rolledCount: 0, error: rolloverCheck.reason };
    }

    if (params.rolloverData.issueIdsToRollover) {
      for (const reqId of params.rolloverData.issueIdsToRollover) {
        const issue = state.issues.find(i => i.id === reqId);
        if (!issue) {
          return {
            success: false,
            rolledCount: 0,
            error: `Requested rollover issue "${reqId}" does not exist.`,
          };
        }
        if (issue.cycleId !== params.cycleId) {
          return {
            success: false,
            rolledCount: 0,
            error: `Requested rollover issue ${issue.key} does not belong to source cycle "${cycle.name}".`,
          };
        }
        if (isIssueCompletedForPlanning(issue.state)) {
          return {
            success: false,
            rolledCount: 0,
            error: `Completed issue ${issue.key} cannot be rolled over.`,
          };
        }
        const project = state.projects.find(p => p.id === issue.projectId);
        if (!project || project.teamId !== targetCycle.teamId) {
          return {
            success: false,
            rolledCount: 0,
            error: `Issue ${issue.key} belongs to team "${project?.teamId || 'unknown'}", which does not match target cycle team "${targetCycle.teamId}".`,
          };
        }
      }
      validRolloverIds = params.rolloverData.issueIdsToRollover;
    } else {
      validRolloverIds = unfinishedInCycle.map(i => i.id);
    }
  }

  // --- ALL VALIDATIONS PASSED: ATOMIC COMMIT ---
  const now = new Date().toISOString();
  const rolloverSet = new Set(validRolloverIds);

  const nextCycles = state.cycles.map(c =>
    c.id === params.cycleId ? { ...c, status: 'COMPLETED' as const } : c
  );

  let nextIssues: Issue[];
  const newEvents: ActivityEvent[] = [];

  if (targetCycle) {
    nextIssues = state.issues.map(i => {
      if (i.cycleId === params.cycleId && !isIssueCompletedForPlanning(i.state)) {
        if (rolloverSet.has(i.id)) {
          return { ...i, cycleId: targetCycle!.id, updatedAt: now, version: i.version + 1 };
        } else {
          return { ...i, cycleId: undefined, updatedAt: now, version: i.version + 1 };
        }
      }
      return i;
    });

    for (const id of validRolloverIds) {
      newEvents.push(
        createActivityEvent(id, 'CYCLE_ROLLED_OVER', state.currentUser, {
          from: cycle.name,
          to: targetCycle.name,
          sourceCycleId: cycle.id,
          targetCycleId: targetCycle.id,
          reason: `Rolled over into ${targetCycle.name}`,
        })
      );
    }

    const unscheduledUnfinished = unfinishedInCycle.filter(i => !rolloverSet.has(i.id));
    for (const u of unscheduledUnfinished) {
      newEvents.push(
        createActivityEvent(u.id, 'CYCLE_REMOVED', state.currentUser, {
          from: cycle.name,
          to: undefined,
          cycleId: cycle.id,
          reason: `Unscheduled on completion of ${cycle.name}`,
        })
      );
    }
  } else {
    nextIssues = state.issues.map(i =>
      i.cycleId === params.cycleId && !isIssueCompletedForPlanning(i.state)
        ? { ...i, cycleId: undefined, updatedAt: now, version: i.version + 1 }
        : i
    );

    for (const u of unfinishedInCycle) {
      newEvents.push(
        createActivityEvent(u.id, 'CYCLE_REMOVED', state.currentUser, {
          from: cycle.name,
          to: undefined,
          cycleId: cycle.id,
          reason: `Unscheduled on completion of ${cycle.name}`,
        })
      );
    }
  }

  return {
    success: true,
    rolledCount: validRolloverIds.length,
    nextState: {
      ...state,
      cycles: nextCycles,
      issues: nextIssues,
      activities: [...newEvents, ...state.activities],
    },
  };
}

/**
 * Validates and executes cycle creation.
 */
export function executeCreateCycle(
  state: PlanningState,
  data: {
    name: string;
    startDate: string;
    endDate: string;
    teamId?: string;
    status?: 'ACTIVE' | 'UPCOMING' | 'COMPLETED';
    description?: string;
  }
): {
  success: boolean;
  newCycle?: Cycle;
  error?: string;
  nextState?: PlanningState;
} {
  if (!canMutatePlanning(state.currentUser.role)) {
    return { success: false, error: 'Permission denied: Observer cannot create cycles.' };
  }

  const teamId = data.teamId ? data.teamId.trim() : '';
  const status = data.status || 'UPCOMING';

  const validation = validateCycleCreation(
    {
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
      teamId,
      status,
    },
    state.cycles
  );

  if (!validation.valid) {
    return { success: false, error: validation.errors.join(' ') };
  }

  if (!state.teams.some(t => t.id === teamId)) {
    return { success: false, error: `Team "${teamId}" does not exist in workspace.` };
  }

  const newCycle: Cycle = {
    id: `cycle_${Date.now()}`,
    name: data.name.trim(),
    startDate: data.startDate,
    endDate: data.endDate,
    status,
    teamId,
    description: data.description?.trim(),
  };

  return {
    success: true,
    newCycle,
    nextState: {
      ...state,
      cycles: [...state.cycles, newCycle],
    },
  };
}

/**
 * Validates candidate cycle state and updates cycle.
 */
export function executeUpdateCycle(
  state: PlanningState,
  cycleId: string,
  updates: Partial<Cycle>
): {
  success: boolean;
  error?: string;
  nextState?: PlanningState;
} {
  if (!canMutatePlanning(state.currentUser.role)) {
    return { success: false, error: 'Permission denied: Observer cannot update cycles.' };
  }

  const existing = state.cycles.find(c => c.id === cycleId);
  if (!existing) {
    return { success: false, error: `Cycle "${cycleId}" not found.` };
  }

  const candidate: Cycle = {
    ...existing,
    ...updates,
  };

  if (!candidate.name || !candidate.name.trim()) {
    return { success: false, error: 'Cycle name cannot be empty.' };
  }

  if (!candidate.teamId || !candidate.teamId.trim() || candidate.teamId === 'ALL') {
    return { success: false, error: 'Cycle must belong to exactly one real team.' };
  }

  if (!state.teams.some(t => t.id === candidate.teamId)) {
    return { success: false, error: `Team "${candidate.teamId}" does not exist.` };
  }

  const s = new Date(candidate.startDate).getTime();
  const e = new Date(candidate.endDate).getTime();
  if (isNaN(s) || isNaN(e) || s >= e) {
    return { success: false, error: 'Start date must be before end date.' };
  }

  if (candidate.status === 'ACTIVE') {
    const activeCheck = validateActiveCycleInvariant(candidate.teamId, state.cycles, cycleId);
    if (!activeCheck.allowed) {
      return { success: false, error: activeCheck.reason };
    }
  }

  const nextCycles = state.cycles.map(c => (c.id === cycleId ? candidate : c));

  return {
    success: true,
    nextState: {
      ...state,
      cycles: nextCycles,
    },
  };
}

/**
 * Validates and updates issue cycle assignment.
 */
export function executeUpdateIssueCycle(
  state: PlanningState,
  issueId: string,
  cycleId?: string
): {
  success: boolean;
  error?: string;
  nextState?: PlanningState;
} {
  if (!canMutatePlanning(state.currentUser.role)) {
    return { success: false, error: 'Permission denied: Observer cannot assign cycles.' };
  }

  const targetIssue = state.issues.find(i => i.id === issueId);
  if (!targetIssue) {
    return { success: false, error: `Issue "${issueId}" not found.` };
  }

  let targetCycle: Cycle | undefined;
  if (cycleId) {
    targetCycle = state.cycles.find(c => c.id === cycleId);
    if (!targetCycle) {
      return { success: false, error: `Cycle "${cycleId}" not found.` };
    }

    const check = canAssignIssueToCycle(targetIssue, targetCycle, state.projects);
    if (!check.allowed) {
      return { success: false, error: check.reason };
    }
  }

  if (targetIssue.cycleId === cycleId) {
    return { success: true, nextState: state };
  }

  const now = new Date().toISOString();
  const nextIssues = state.issues.map(i =>
    i.id === issueId ? { ...i, cycleId, updatedAt: now, version: i.version + 1 } : i
  );

  const fromCycle = targetIssue.cycleId
    ? state.cycles.find(c => c.id === targetIssue.cycleId)
    : undefined;

  const ev = createActivityEvent(
    issueId,
    cycleId ? 'CYCLE_ASSIGNED' : 'CYCLE_REMOVED',
    state.currentUser,
    {
      from: fromCycle?.name || 'Unscheduled',
      to: targetCycle?.name || 'Unscheduled',
      cycleId,
      cycleName: targetCycle?.name,
      reason: targetCycle ? `Assigned to cycle ${targetCycle.name}` : 'Removed from cycle',
    }
  );

  return {
    success: true,
    nextState: {
      ...state,
      issues: nextIssues,
      activities: [ev, ...state.activities],
    },
  };
}

/**
 * Validates and updates issue milestone linkage.
 */
export function executeUpdateIssueMilestone(
  state: PlanningState,
  milestones: Milestone[],
  issueId: string,
  milestoneId?: string
): {
  success: boolean;
  error?: string;
  nextState?: PlanningState;
} {
  if (!canMutatePlanning(state.currentUser.role)) {
    return { success: false, error: 'Permission denied: Observer cannot link milestones.' };
  }

  const targetIssue = state.issues.find(i => i.id === issueId);
  if (!targetIssue) {
    return { success: false, error: `Issue "${issueId}" not found.` };
  }

  let targetMilestone: Milestone | undefined;
  if (milestoneId) {
    targetMilestone = milestones.find(m => m.id === milestoneId);
    if (!targetMilestone) {
      return { success: false, error: `Milestone "${milestoneId}" not found.` };
    }
  }

  if (targetIssue.milestoneId === milestoneId) {
    return { success: true, nextState: state };
  }

  const now = new Date().toISOString();
  const nextIssues = state.issues.map(i =>
    i.id === issueId ? { ...i, milestoneId, updatedAt: now, version: i.version + 1 } : i
  );

  const fromMilestone = targetIssue.milestoneId
    ? milestones.find(m => m.id === targetIssue.milestoneId)
    : undefined;

  const ev = createActivityEvent(
    issueId,
    milestoneId ? 'MILESTONE_LINKED' : 'MILESTONE_UNLINKED',
    state.currentUser,
    {
      from: fromMilestone?.name,
      to: targetMilestone?.name,
      milestoneId,
      milestoneName: targetMilestone?.name,
      reason: targetMilestone
        ? `Linked to milestone ${targetMilestone.name}`
        : 'Unlinked from milestone',
    }
  );

  return {
    success: true,
    nextState: {
      ...state,
      issues: nextIssues,
      activities: [ev, ...state.activities],
    },
  };
}

/**
 * Validates and creates a milestone.
 */
export function executeCreateMilestone(
  state: PlanningState,
  milestones: Milestone[],
  data: {
    name: string;
    targetDate: string;
    description?: string;
    teamId?: string;
  }
): {
  success: boolean;
  newMilestone?: Milestone;
  error?: string;
  nextMilestones?: Milestone[];
} {
  if (!canMutatePlanning(state.currentUser.role)) {
    return { success: false, error: 'Permission denied: Observer cannot create milestones.' };
  }

  const validation = validateMilestoneData({
    name: data.name,
    targetDate: data.targetDate,
  });

  if (!validation.valid) {
    return { success: false, error: validation.errors.join(' ') };
  }

  const newMilestone: Milestone = {
    id: `milestone_${Date.now()}`,
    name: data.name.trim(),
    targetDate: data.targetDate.trim(),
    description: data.description ? data.description.trim() : '',
    teamId: data.teamId,
  };

  return {
    success: true,
    newMilestone,
    nextMilestones: [...milestones, newMilestone],
  };
}

/**
 * Validates and updates a milestone.
 */
export function executeUpdateMilestone(
  state: PlanningState,
  milestones: Milestone[],
  milestoneId: string,
  updates: Partial<Milestone>
): {
  success: boolean;
  error?: string;
  nextMilestones?: Milestone[];
} {
  if (!canMutatePlanning(state.currentUser.role)) {
    return { success: false, error: 'Permission denied: Observer cannot update milestones.' };
  }

  const existing = milestones.find(m => m.id === milestoneId);
  if (!existing) {
    return { success: false, error: `Milestone "${milestoneId}" not found.` };
  }

  const candidate: Milestone = {
    ...existing,
    ...updates,
  };

  const validation = validateMilestoneData({
    name: candidate.name,
    targetDate: candidate.targetDate,
  });

  if (!validation.valid) {
    return { success: false, error: validation.errors.join(' ') };
  }

  const nextMilestones = milestones.map(m => (m.id === milestoneId ? candidate : m));

  return {
    success: true,
    nextMilestones,
  };
}

/**
 * Validates and updates issue scheduling dates.
 */
export function executeUpdateIssueDates(
  state: PlanningState,
  issueId: string,
  startDate?: string,
  dueDate?: string
): {
  success: boolean;
  error?: string;
  nextState?: PlanningState;
} {
  if (!canMutatePlanning(state.currentUser.role)) {
    return { success: false, error: 'Permission denied: Observer cannot schedule issues.' };
  }

  const targetIssue = state.issues.find(i => i.id === issueId);
  if (!targetIssue) {
    return { success: false, error: `Issue "${issueId}" not found.` };
  }

  const dateCheck = validateScheduleDates(startDate, dueDate);
  if (!dateCheck.valid) {
    return { success: false, error: dateCheck.error || 'Invalid schedule dates.' };
  }

  const prevStart = targetIssue.startDate;
  const prevDue = targetIssue.dueDate;

  if (prevStart === startDate && prevDue === dueDate) {
    return { success: true, nextState: state };
  }

  const now = new Date().toISOString();
  const nextIssues = state.issues.map(i =>
    i.id === issueId
      ? { ...i, startDate, dueDate, updatedAt: now, version: i.version + 1 }
      : i
  );

  const event = createActivityEvent(issueId, 'SCHEDULE_CHANGED', state.currentUser, {
    from: prevStart || prevDue ? `${prevStart || 'None'} → ${prevDue || 'None'}` : 'Unscheduled',
    to: startDate || dueDate ? `${startDate || 'None'} → ${dueDate || 'None'}` : 'Unscheduled',
    reason: 'Issue schedule updated',
  });

  return {
    success: true,
    nextState: {
      ...state,
      issues: nextIssues,
      activities: [event, ...state.activities],
    },
  };
}
