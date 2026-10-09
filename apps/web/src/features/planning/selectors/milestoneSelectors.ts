/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Milestone, Issue, Dependency, Project, Team } from '../../../types';
import { MilestoneSummaryData } from '../types';
import { calculateMilestoneRollup } from '../domain/milestoneInvariants';
import { isIssueCompletedForPlanning } from '../domain/cycleInvariants';
import { resolveEdges, calculateGraphLayout, calculateLongestActiveChain } from '../../dependencies/selectors';
import { GraphLayoutData } from '../../dependencies/types';

/**
 * Section 25 & 26: Select all milestones classified into Active vs Completed
 */
export function selectMilestonesOverview(
  milestones: Milestone[],
  issues: Issue[],
  dependencies: Dependency[],
  projects: Project[],
  teams: Team[],
  referenceDate: Date = new Date()
): {
  activeMilestones: MilestoneSummaryData[];
  completedMilestones: MilestoneSummaryData[];
  allMilestones: MilestoneSummaryData[];
} {
  const allSummaries = milestones.map(m =>
    calculateMilestoneRollup(m, issues, dependencies, projects, teams, referenceDate)
  );

  const activeMilestones = allSummaries.filter(m => !m.isCompleted);
  const completedMilestones = allSummaries.filter(m => m.isCompleted);

  return {
    activeMilestones,
    completedMilestones,
    allMilestones: allSummaries,
  };
}

/**
 * Section 30 & 31: Select Milestone Detail including dependency graph and delivery risk
 */
export function selectMilestoneDetail(
  milestoneId: string,
  milestones: Milestone[],
  issues: Issue[],
  dependencies: Dependency[],
  projects: Project[],
  teams: Team[],
  referenceDate: Date = new Date()
): {
  summary: MilestoneSummaryData;
  completedIssues: Issue[];
  unfinishedIssues: Issue[];
  graphLayout: GraphLayoutData;
  riskFactors: {
    overdue: boolean;
    blockedTasksCount: number;
    daysRemaining: number;
    healthReason: string;
  };
} | null {
  const milestone = milestones.find(m => m.id === milestoneId);
  if (!milestone) return null;

  const summary = calculateMilestoneRollup(
    milestone,
    issues,
    dependencies,
    projects,
    teams,
    referenceDate
  );

  const completedIssues = summary.issues.filter(i => isIssueCompletedForPlanning(i.state));
  const unfinishedIssues = summary.issues.filter(i => !isIssueCompletedForPlanning(i.state));

  // Section 35: Reuses UX-04 graph infrastructure for Milestone linked issues
  const milestoneIssueIds = new Set(summary.issues.map(i => i.id));
  const relevantDependencies = dependencies.filter(
    d => milestoneIssueIds.has(d.upstreamIssueId) && milestoneIssueIds.has(d.downstreamIssueId)
  );

  const resolvedEdgesList = resolveEdges(relevantDependencies, summary.issues, projects, teams);
  const criticalChain = calculateLongestActiveChain(summary.issues, relevantDependencies);
  const graphLayout = calculateGraphLayout(
    resolvedEdgesList,
    summary.issues,
    projects,
    teams,
    criticalChain
  );

  const riskFactors = {
    overdue: summary.progress.isOverdue,
    blockedTasksCount: summary.progress.blocked,
    daysRemaining: summary.progress.daysRemaining,
    healthReason: summary.health,
  };

  return {
    summary,
    completedIssues,
    unfinishedIssues,
    graphLayout,
    riskFactors,
  };
}

/**
 * Section 36: Select issues that can be linked to this milestone
 * Workspace-scoped: can link issues across any Project and Team!
 */
export function selectLinkableMilestoneCandidates(
  milestoneId: string,
  issues: Issue[],
  projects: Project[],
  teams: Team[],
  searchQuery: string = ''
): Issue[] {
  const query = searchQuery.trim().toLowerCase();
  const projectsMap = new Map(projects.map(p => [p.id, p]));
  const teamsMap = new Map(teams.map(t => [t.id, t]));

  return issues.filter(issue => {
    // Only issues not already assigned to this milestone
    if (issue.milestoneId === milestoneId) return false;

    if (!query) return true;

    const project = projectsMap.get(issue.projectId);
    const team = teamsMap.get(issue.teamId);

    const matchKey = issue.key.toLowerCase().includes(query);
    const matchTitle = issue.title.toLowerCase().includes(query);
    const matchProject = project ? project.name.toLowerCase().includes(query) : false;
    const matchTeam = team ? team.name.toLowerCase().includes(query) || team.key.toLowerCase().includes(query) : false;

    return matchKey || matchTitle || matchProject || matchTeam;
  });
}
