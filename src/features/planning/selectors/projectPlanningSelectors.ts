/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Project, Issue, Cycle, Milestone, Dependency } from '../../../types';
import {
  ProjectCycleAllocationGroup,
  ProjectMilestoneAllocationGroup,
  ProjectPlanningFilterState,
} from '../types';
import { calculateCycleProgress, isIssueCompletedForPlanning } from '../domain/cycleInvariants';

/**
 * Section 53 & 54: Select Project Cycle Allocation
 * Enforces owning-team invariant: only cycles where cycle.teamId === project.teamId (or ALL) are valid!
 */
export function selectProjectCycleAllocation(
  project: Project,
  issues: Issue[],
  cycles: Cycle[],
  dependencies: Dependency[],
  filters: ProjectPlanningFilterState,
  referenceDate: Date = new Date()
): {
  eligibleCycles: Cycle[];
  activeCycle?: Cycle;
  backlogIssues: Issue[];
  cycleGroups: ProjectCycleAllocationGroup[];
  totalProjectIssuesCount: number;
} {
  // Only issues of this project
  const projectIssues = issues.filter(i => i.projectId === project.id);
  const totalProjectIssuesCount = projectIssues.length;

  // Filter issues by state / priority / query
  const query = filters.searchQuery.trim().toLowerCase();
  const filteredProjectIssues = projectIssues.filter(issue => {
    if (filters.stateFilter !== 'ALL' && issue.state !== filters.stateFilter) return false;
    if (filters.priorityFilter !== 'ALL' && issue.priority !== filters.priorityFilter) return false;
    if (query) {
      const matchKey = issue.key.toLowerCase().includes(query);
      const matchTitle = issue.title.toLowerCase().includes(query);
      if (!matchKey && !matchTitle) return false;
    }
    return true;
  });

  // Section 54: Owning-team cycle invariant
  const eligibleCycles = cycles.filter(
    c => c.teamId === project.teamId || c.teamId === 'ALL'
  );

  const activeCycle = eligibleCycles.find(c => c.status === 'ACTIVE');

  // Backlog issues: issues with no cycleId
  const backlogIssues = filteredProjectIssues.filter(i => !i.cycleId);

  // Group scheduled issues by cycle
  const cycleGroups: ProjectCycleAllocationGroup[] = [];

  for (const cycle of eligibleCycles) {
    const issuesInCycle = filteredProjectIssues.filter(i => i.cycleId === cycle.id);
    const progress = calculateCycleProgress(cycle, issues, dependencies, referenceDate);

    cycleGroups.push({
      cycle,
      issues: issuesInCycle,
      progress,
    });
  }

  // Sort groups: ACTIVE first, then UPCOMING, then COMPLETED
  cycleGroups.sort((a, b) => {
    const order: Record<string, number> = { ACTIVE: 0, UPCOMING: 1, COMPLETED: 2 };
    return (order[a.cycle.status] ?? 3) - (order[b.cycle.status] ?? 3);
  });

  return {
    eligibleCycles,
    activeCycle,
    backlogIssues,
    cycleGroups,
    totalProjectIssuesCount,
  };
}

/**
 * Section 57: Select Project Milestone Mapping
 * Group project issues into:
 * - Linked Milestones
 * - No Milestone
 */
export function selectProjectMilestoneMapping(
  project: Project,
  issues: Issue[],
  milestones: Milestone[],
  filters: ProjectPlanningFilterState
): {
  groups: ProjectMilestoneAllocationGroup[];
  unlinkedGroup: ProjectMilestoneAllocationGroup;
  allMilestones: Milestone[];
} {
  const projectIssues = issues.filter(i => i.projectId === project.id);
  const query = filters.searchQuery.trim().toLowerCase();

  const filteredProjectIssues = projectIssues.filter(issue => {
    if (filters.stateFilter !== 'ALL' && issue.state !== filters.stateFilter) return false;
    if (filters.priorityFilter !== 'ALL' && issue.priority !== filters.priorityFilter) return false;
    if (query) {
      const matchKey = issue.key.toLowerCase().includes(query);
      const matchTitle = issue.title.toLowerCase().includes(query);
      if (!matchKey && !matchTitle) return false;
    }
    return true;
  });

  // Group by milestone
  const groups: ProjectMilestoneAllocationGroup[] = [];
  const referencedMilestoneIds = new Set(
    filteredProjectIssues.map(i => i.milestoneId).filter(Boolean)
  );

  // Referenced milestones first, plus any available milestones
  for (const milestone of milestones) {
    const issuesInMilestone = filteredProjectIssues.filter(i => i.milestoneId === milestone.id);
    if (issuesInMilestone.length > 0 || referencedMilestoneIds.has(milestone.id)) {
      const completedCount = issuesInMilestone.filter(i =>
        isIssueCompletedForPlanning(i.state)
      ).length;

      groups.push({
        milestone,
        issues: issuesInMilestone,
        completedCount,
        totalCount: issuesInMilestone.length,
      });
    }
  }

  // Unlinked issues (no milestone assigned)
  const unlinkedIssues = filteredProjectIssues.filter(i => !i.milestoneId);
  const unlinkedCompleted = unlinkedIssues.filter(i =>
    isIssueCompletedForPlanning(i.state)
  ).length;

  const unlinkedGroup: ProjectMilestoneAllocationGroup = {
    milestone: undefined,
    issues: unlinkedIssues,
    completedCount: unlinkedCompleted,
    totalCount: unlinkedIssues.length,
  };

  return {
    groups,
    unlinkedGroup,
    allMilestones: milestones,
  };
}
