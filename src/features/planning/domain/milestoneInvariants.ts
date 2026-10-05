/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Milestone, Issue, Dependency, Project, Team } from '../../../types';
import { getBlockerStatus } from '../../../domain/dependency';
import { PlanningMilestoneHealth, MilestoneProgress, MilestoneSummaryData } from '../types';
import { isIssueCompletedForPlanning } from './cycleInvariants';

/**
 * Section 27 & 28: Milestone Health Rules
 * Health vocabulary exactly:
 * - ON TRACK
 * - AT RISK
 * - BLOCKED
 * Completion is separate from health. Do not use COMPLETED as health.
 *
 * Rules:
 * - BLOCKED: Unfinished Milestone work is materially affected by active dependencies.
 * - AT RISK: Not currently BLOCKED, but unfinished work is approaching or past its target date:
 *     1. Target date is in the past (overdue) while unfinished work remains.
 *     2. Days until target <= 7 and completion percent < 75%.
 *     3. Days until target <= 14 and completion percent < 50%.
 * - ON TRACK: Otherwise.
 */
export function deriveMilestoneHealth(
  milestone: Milestone,
  issues: Issue[],
  dependencies: Dependency[],
  referenceDate: Date = new Date()
): { health: PlanningMilestoneHealth; reason: string; isCompleted: boolean } {
  const milestoneIssues = issues.filter(i => i.milestoneId === milestone.id);
  const total = milestoneIssues.length;

  if (total === 0) {
    return {
      health: 'ON_TRACK',
      reason: 'No tasks linked to this milestone yet.',
      isCompleted: false,
    };
  }

  const completed = milestoneIssues.filter(i => isIssueCompletedForPlanning(i.state));
  const unfinished = milestoneIssues.filter(i => !isIssueCompletedForPlanning(i.state));
  const isCompleted = total > 0 && completed.length === total;

  if (isCompleted) {
    return {
      health: 'ON_TRACK',
      reason: 'All linked tasks have been completed.',
      isCompleted: true,
    };
  }

  // 1. Check for Active Dependency Blockers on Unfinished Work
  const blockedUnfinishedIssues = unfinished.filter(i => {
    const status = getBlockerStatus(i.id, issues, dependencies);
    return status.activeCount > 0;
  });

  if (blockedUnfinishedIssues.length > 0) {
    return {
      health: 'BLOCKED',
      reason: `${blockedUnfinishedIssues.length} unfinished task${
        blockedUnfinishedIssues.length > 1 ? 's are' : ' is'
      } actively blocked by prerequisite dependencies.`,
      isCompleted: false,
    };
  }

  // 2. Check Target Date Proximity (AT RISK check)
  const targetTime = new Date(`${milestone.targetDate}T23:59:59.999Z`).getTime();
  const nowTime = referenceDate.getTime();
  const daysUntilTarget = Math.ceil((targetTime - nowTime) / (1000 * 60 * 60 * 24));
  const completionPercent = Math.round((completed.length / total) * 100);

  if (daysUntilTarget < 0) {
    return {
      health: 'AT_RISK',
      reason: `Milestone is overdue by ${Math.abs(daysUntilTarget)} day${
        Math.abs(daysUntilTarget) !== 1 ? 's' : ''
      } with ${unfinished.length} remaining tasks.`,
      isCompleted: false,
    };
  }

  if (daysUntilTarget <= 7 && completionPercent < 75) {
    return {
      health: 'AT_RISK',
      reason: `Target date is in ${daysUntilTarget} day${
        daysUntilTarget !== 1 ? 's' : ''
      } but completion is currently only ${completionPercent}%.`,
      isCompleted: false,
    };
  }

  if (daysUntilTarget <= 14 && completionPercent < 50) {
    return {
      health: 'AT_RISK',
      reason: `Target date is in ${daysUntilTarget} days but completion is currently only ${completionPercent}%.`,
      isCompleted: false,
    };
  }

  return {
    health: 'ON_TRACK',
    reason: `Progress is on schedule (${completionPercent}% completed, ${daysUntilTarget} days remaining).`,
    isCompleted: false,
  };
}

/**
 * Section 32 & 33: Calculate Milestone Rollup & Deduplicate Contributors
 * Contributors derived from Issue -> Project -> Team.
 * Deduplicates Teams and Projects.
 */
export function calculateMilestoneRollup(
  milestone: Milestone,
  issues: Issue[],
  dependencies: Dependency[],
  projects: Project[],
  teams: Team[],
  referenceDate: Date = new Date()
): MilestoneSummaryData {
  const milestoneIssues = issues.filter(i => i.milestoneId === milestone.id);
  const total = milestoneIssues.length;

  let completed = 0;
  let remaining = 0;
  let blocked = 0;
  let inProgress = 0;
  const blockedIssues: Issue[] = [];

  const contributingProjectIds = new Set<string>();
  const contributingTeamIds = new Set<string>();

  for (const issue of milestoneIssues) {
    const isComp = isIssueCompletedForPlanning(issue.state);
    if (isComp) {
      completed++;
    } else {
      remaining++;
      const blocker = getBlockerStatus(issue.id, issues, dependencies);
      if (blocker.activeCount > 0) {
        blocked++;
        blockedIssues.push(issue);
      }
      if (issue.state === 'IN_PROGRESS' || issue.state === 'IN_REVIEW') {
        inProgress++;
      }
    }

    if (issue.projectId) contributingProjectIds.add(issue.projectId);
    if (issue.teamId) contributingTeamIds.add(issue.teamId);
  }

  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  const targetTime = new Date(`${milestone.targetDate}T23:59:59.999Z`).getTime();
  const nowTime = referenceDate.getTime();
  const daysRemaining = Math.max(0, Math.ceil((targetTime - nowTime) / (1000 * 60 * 60 * 24)));
  const isOverdue = targetTime < nowTime && remaining > 0;

  const progress: MilestoneProgress = {
    total,
    completed,
    remaining,
    blocked,
    inProgress,
    percent,
    daysRemaining,
    isOverdue,
  };

  const { health, isCompleted } = deriveMilestoneHealth(
    milestone,
    issues,
    dependencies,
    referenceDate
  );

  const contributingProjects = projects.filter(p => contributingProjectIds.has(p.id));
  const contributingTeams = teams.filter(t => contributingTeamIds.has(t.id));

  return {
    milestone,
    health,
    isCompleted,
    progress,
    contributingTeams,
    contributingProjects,
    issues: milestoneIssues,
    blockedIssues,
  };
}
