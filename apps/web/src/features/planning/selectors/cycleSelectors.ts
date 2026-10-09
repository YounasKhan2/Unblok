/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Cycle, Issue, Dependency, Team, Project } from '../../../types';
import { CycleSummaryData, CycleProgress } from '../types';
import {
  classifyCycles,
  calculateCycleProgress,
  canAssignIssueToCycle,
  isIssueCompletedForPlanning,
} from '../domain/cycleInvariants';

/**
 * Section 12 & 13: Select and classify cycles with summary progress
 */
export function selectCyclesOverview(
  cycles: Cycle[],
  issues: Issue[],
  dependencies: Dependency[],
  teams: Team[],
  teamFilter?: string,
  referenceDate: Date = new Date()
): {
  active: CycleSummaryData[];
  upcoming: CycleSummaryData[];
  completed: CycleSummaryData[];
  allFiltered: CycleSummaryData[];
} {
  const teamsMap = new Map(teams.map(t => [t.id, t]));
  const classified = classifyCycles(cycles, teamFilter);

  const mapCycleToSummary = (c: Cycle): CycleSummaryData => {
    const progress = calculateCycleProgress(c, issues, dependencies, referenceDate);
    const team = c.teamId ? teamsMap.get(c.teamId) : undefined;
    return { cycle: c, team, progress };
  };

  const active = classified.active.map(mapCycleToSummary);
  const upcoming = classified.upcoming.map(mapCycleToSummary);
  const completed = classified.completed.map(mapCycleToSummary);

  return {
    active,
    upcoming,
    completed,
    allFiltered: [...active, ...upcoming, ...completed],
  };
}

/**
 * Section 17 & 18: Select full Cycle Detail with progress, issues, team, and projects
 */
export function selectCycleDetail(
  cycleId: string,
  cycles: Cycle[],
  issues: Issue[],
  dependencies: Dependency[],
  teams: Team[],
  projects: Project[],
  referenceDate: Date = new Date()
): {
  cycle: Cycle;
  team?: Team;
  progress: CycleProgress;
  cycleIssues: Issue[];
  completedIssues: Issue[];
  unfinishedIssues: Issue[];
} | null {
  const cycle = cycles.find(c => c.id === cycleId);
  if (!cycle) return null;

  const team = cycle.teamId ? teams.find(t => t.id === cycle.teamId) : undefined;
  const progress = calculateCycleProgress(cycle, issues, dependencies, referenceDate);

  const cycleIssues = issues.filter(i => i.cycleId === cycle.id);
  const completedIssues = cycleIssues.filter(i => isIssueCompletedForPlanning(i.state));
  const unfinishedIssues = cycleIssues.filter(i => !isIssueCompletedForPlanning(i.state));

  return {
    cycle,
    team,
    progress,
    cycleIssues,
    completedIssues,
    unfinishedIssues,
  };
}

/**
 * Section 23: Select eligible rollover targets and candidates
 * Target must:
 * - be UPCOMING
 * - belong to the same Team
 */
export function selectRolloverOptions(
  fromCycleId: string,
  cycles: Cycle[],
  issues: Issue[]
): {
  fromCycle: Cycle | null;
  unfinishedIssues: Issue[];
  eligibleTargetCycles: Cycle[];
} {
  const fromCycle = cycles.find(c => c.id === fromCycleId) || null;
  if (!fromCycle) {
    return { fromCycle: null, unfinishedIssues: [], eligibleTargetCycles: [] };
  }

  const unfinishedIssues = issues.filter(
    i => i.cycleId === fromCycle.id && !isIssueCompletedForPlanning(i.state)
  );

  const eligibleTargetCycles = cycles.filter(
    c =>
      c.id !== fromCycle.id &&
      c.status === 'UPCOMING' &&
      (fromCycle.teamId === 'ALL' || c.teamId === fromCycle.teamId)
  );

  return {
    fromCycle,
    unfinishedIssues,
    eligibleTargetCycles,
  };
}

/**
 * Section 20: Select candidate issues eligible to be added to this Cycle
 * Candidate Issue must:
 * - belong to Project owned by Cycle Team
 * - not already belong to that Cycle
 */
export function selectAddIssueCandidates(
  cycle: Cycle,
  issues: Issue[],
  projects: Project[],
  searchQuery: string = ''
): Issue[] {
  const query = searchQuery.trim().toLowerCase();

  return issues.filter(issue => {
    // Cannot already be in this cycle
    if (issue.cycleId === cycle.id) return false;

    // Check project ownership
    const project = projects.find(p => p.id === issue.projectId);
    if (!project) return false;

    // Enforce owning team invariant
    const check = canAssignIssueToCycle(issue, cycle, projects);
    if (!check.allowed) return false;

    // Search query
    if (query) {
      const matchKey = issue.key.toLowerCase().includes(query);
      const matchTitle = issue.title.toLowerCase().includes(query);
      const matchProject = project.name.toLowerCase().includes(query);
      if (!matchKey && !matchTitle && !matchProject) return false;
    }

    return true;
  });
}
