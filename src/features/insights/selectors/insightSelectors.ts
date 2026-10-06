/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Issue, Dependency, Project, Team, Milestone, Cycle, ActivityEvent } from '../../../types';
import { isUpstreamActivelyBlocking } from '../../../domain/lifecycle';
import {
  calculateLongestActiveChain,
  calculateCrossTeamMatrix,
  getBottlenecks,
  resolveEdges,
} from '../../dependencies/selectors';
import { selectMilestonesOverview } from '../../planning/selectors/milestoneSelectors';
import { selectCyclesOverview } from '../../planning/selectors/cycleSelectors';
import {
  ExecutionRisk,
  ExecutionSummaryMetrics,
  EnrichedRiskIssue,
  InsightsFilterState,
  WorkspaceInsightsData,
} from '../types';
import { calculateExecutionRisk, isActiveIssue, getCalendarDaysDiff } from '../domain/executionRisk';
import { calculateProjectDeliveryHealth, calculateTeamDeliveryHealth } from '../domain/deliveryHealth';
import { deriveInsightSignals } from '../domain/insightRules';

export interface SelectWorkspaceInsightsParams {
  issues: Issue[];
  dependencies: Dependency[];
  projects: Project[];
  teams: Team[];
  milestones: Milestone[];
  cycles: Cycle[];
  activities?: ActivityEvent[];
  filters?: InsightsFilterState;
  referenceTime?: Date;
}

export const DEFAULT_INSIGHTS_FILTER: InsightsFilterState = {
  team: 'ALL',
  project: 'ALL',
  risk: 'ALL',
  cycle: 'ALL',
};

const PRIORITY_RANK = {
  URGENT: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
} as const;

/**
 * Pure intelligence selector deriving all workspace execution intelligence,
 * risk scoring, bottleneck rankings, delivery health, and attention signals.
 */
export function selectWorkspaceInsights(
  params: SelectWorkspaceInsightsParams
): WorkspaceInsightsData {
  const {
    issues,
    dependencies,
    projects,
    teams,
    milestones,
    cycles,
    filters = DEFAULT_INSIGHTS_FILTER,
    referenceTime = new Date(),
  } = params;

  // 1. O(1) Indexed lookups
  const issuesMap = new Map<string, Issue>(issues.map(i => [i.id, i]));
  const projectsMap = new Map<string, Project>(projects.map(p => [p.id, p]));
  const teamsMap = new Map<string, Team>(teams.map(t => [t.id, t]));

  // 2. Active Blocker & Dependency Graphs
  const activeBlockerCounts = new Map<string, number>();
  const activeDownstreamCounts = new Map<string, number>();
  const hasCrossTeamBlockerMap = new Map<string, boolean>();

  for (const issue of issues) {
    activeBlockerCounts.set(issue.id, 0);
    activeDownstreamCounts.set(issue.id, 0);
    hasCrossTeamBlockerMap.set(issue.id, false);
  }

  for (const dep of dependencies) {
    const upstream = issuesMap.get(dep.upstreamIssueId);
    const downstream = issuesMap.get(dep.downstreamIssueId);
    if (!upstream || !downstream) continue;

    const isBlocking = isUpstreamActivelyBlocking(upstream.state);
    if (isBlocking) {
      // Downstream is blocked by upstream
      const prevBlockers = activeBlockerCounts.get(downstream.id) || 0;
      activeBlockerCounts.set(downstream.id, prevBlockers + 1);

      // Upstream is actively blocking downstream
      const prevDownstream = activeDownstreamCounts.get(upstream.id) || 0;
      activeDownstreamCounts.set(upstream.id, prevDownstream + 1);

      // Check cross-team ownership via Project.teamId
      const upstreamProj = projectsMap.get(upstream.projectId);
      const downstreamProj = projectsMap.get(downstream.projectId);
      if (upstreamProj && downstreamProj && upstreamProj.teamId !== downstreamProj.teamId) {
        hasCrossTeamBlockerMap.set(downstream.id, true);
      }
    }
  }

  // 3. Compute Risk for all Issues
  const issueRisks = new Map<string, ExecutionRisk>();
  for (const issue of issues) {
    const risk = calculateExecutionRisk(
      issue,
      {
        activeBlockerCount: activeBlockerCounts.get(issue.id) || 0,
        hasCrossTeamBlocker: hasCrossTeamBlockerMap.get(issue.id) || false,
        activeDownstreamCount: activeDownstreamCounts.get(issue.id) || 0,
        project: projectsMap.get(issue.projectId),
      },
      referenceTime
    );
    issueRisks.set(issue.id, risk);
  }

  // 4. Milestone & Cycle Rollups (reusing UX-04 and UX-05 contracts)
  const milestoneOverview = selectMilestonesOverview(
    milestones,
    issues,
    dependencies,
    projects,
    teams,
    referenceTime
  );

  const cycleOverview = selectCyclesOverview(
    cycles,
    issues,
    dependencies,
    teams,
    undefined,
    referenceTime
  );

  // 5. Dependency Bottlenecks & Canonical Graphs (reusing UX-04)
  const allBottlenecks = getBottlenecks(issues, dependencies, projects, teams, 10);
  const criticalChain = calculateLongestActiveChain(issues, dependencies);
  const resolvedEdges = resolveEdges(dependencies, issues, projects, teams);
  const crossTeamMatrix = calculateCrossTeamMatrix(teams, resolvedEdges);

  // 6. Project & Team Delivery Health
  const allProjectHealth = projects.map(p =>
    calculateProjectDeliveryHealth({
      project: p,
      team: teamsMap.get(p.teamId),
      issues,
      issueRisks,
      activeBlockerCounts,
      milestones,
      referenceTime,
    })
  );

  const allTeamHealth = teams.map(t =>
    calculateTeamDeliveryHealth({
      team: t,
      projects,
      issues,
      issueRisks,
      activeBlockerCounts,
      milestones,
      referenceTime,
    })
  );

  // 7. Needs Attention Signals
  const allSignals = deriveInsightSignals({
    issues,
    projects,
    teams,
    issueRisks,
    bottlenecks: allBottlenecks,
    milestones: milestoneOverview.activeMilestones,
    cycles: cycleOverview.active,
    crossTeamMatrix,
    referenceTime,
  });

  // 8. Scope Filtering (Consistency across summary, signals, tables, health)
  const isTeamMatch = (teamId?: string, projTeamId?: string) => {
    if (filters.team === 'ALL') return true;
    return teamId === filters.team || projTeamId === filters.team;
  };

  const isProjectMatch = (projectId?: string) => {
    if (filters.project === 'ALL') return true;
    return projectId === filters.project;
  };

  const isCycleMatch = (cycleId?: string) => {
    if (filters.cycle === 'ALL') return true;
    return cycleId === filters.cycle;
  };

  const isRiskMatch = (level?: string) => {
    if (filters.risk === 'ALL') return true;
    return level === filters.risk;
  };

  // Filter Issues
  const scopedIssues = issues.filter(issue => {
    const proj = projectsMap.get(issue.projectId);
    if (!isTeamMatch(issue.teamId, proj?.teamId)) return false;
    if (!isProjectMatch(issue.projectId)) return false;
    if (!isCycleMatch(issue.cycleId)) return false;
    const risk = issueRisks.get(issue.id);
    if (!isRiskMatch(risk?.level)) return false;
    return true;
  });

  // Filter Active Issues for Summary
  const scopedActiveIssues = scopedIssues.filter(i => isActiveIssue(i.state));

  // Compute Scoped Summary Metrics
  const blockedIssuesCount = scopedActiveIssues.filter(
    i => (activeBlockerCounts.get(i.id) || 0) > 0
  ).length;

  const highRiskIssuesCount = scopedActiveIssues.filter(i => {
    const r = issueRisks.get(i.id);
    return r?.level === 'HIGH' || r?.level === 'CRITICAL';
  }).length;

  const activeBlockersCount = scopedActiveIssues.filter(
    i => (activeDownstreamCounts.get(i.id) || 0) > 0
  ).length;

  const overdueIssuesCount = scopedActiveIssues.filter(i => {
    if (!i.dueDate) return false;
    return getCalendarDaysDiff(i.dueDate, referenceTime) < 0;
  }).length;

  // Filtered Milestones Count
  const scopedActiveMilestones = milestoneOverview.activeMilestones.filter(m => {
    if (filters.team !== 'ALL' && m.milestone.teamId !== 'ALL' && m.milestone.teamId !== filters.team) {
      return false;
    }
    return true;
  });

  const atRiskMilestonesCount = scopedActiveMilestones.filter(
    m => m.health === 'AT_RISK' || m.health === 'BLOCKED'
  ).length;

  const summary: ExecutionSummaryMetrics = {
    activeIssuesCount: scopedActiveIssues.length,
    blockedIssuesCount,
    highRiskIssuesCount,
    activeBlockersCount,
    atRiskMilestonesCount,
    overdueIssuesCount,
  };

  // Enriched High-Risk Work Table
  const enrichedHighRiskIssues: EnrichedRiskIssue[] = scopedActiveIssues
    .map(issue => {
      const risk = issueRisks.get(issue.id) || { score: 0, level: 'LOW', reasons: [] };
      const proj = projectsMap.get(issue.projectId);
      const team = teamsMap.get(proj?.teamId || issue.teamId);
      const daysDiff = issue.dueDate ? getCalendarDaysDiff(issue.dueDate, referenceTime) : 999;
      return {
        issue,
        risk,
        project: proj,
        team,
        activeBlockerCount: activeBlockerCounts.get(issue.id) || 0,
        activeDownstreamCount: activeDownstreamCounts.get(issue.id) || 0,
        isOverdue: daysDiff < 0,
        isDueSoon: daysDiff >= 0 && daysDiff <= 3,
      };
    })
    .filter(item => {
      // If user specifically filtered by risk, we already filtered
      if (filters.risk !== 'ALL') return true;
      // Default table shows HIGH and CRITICAL work
      return item.risk.level === 'HIGH' || item.risk.level === 'CRITICAL';
    })
    .sort((a, b) => {
      // 1. Risk score descending
      if (b.risk.score !== a.risk.score) return b.risk.score - a.risk.score;
      // 2. Overdue urgency
      if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
      // 3. Priority descending
      const pDiff = (PRIORITY_RANK[b.issue.priority] || 0) - (PRIORITY_RANK[a.issue.priority] || 0);
      if (pDiff !== 0) return pDiff;
      // 4. Issue key alphabetically
      return a.issue.key.localeCompare(b.issue.key);
    });

  // Filter Needs Attention Signals
  const scopedSignals = allSignals.filter(sig => {
    if (filters.team !== 'ALL') {
      if (sig.teamIds && !sig.teamIds.includes(filters.team)) return false;
    }
    if (filters.project !== 'ALL') {
      if (sig.projectIds && !sig.projectIds.includes(filters.project)) return false;
    }
    return true;
  });

  // Filter Bottlenecks
  const scopedBottlenecks = allBottlenecks.filter(b => {
    if (filters.team !== 'ALL' && b.team?.id !== filters.team) return false;
    if (filters.project !== 'ALL' && b.project?.id !== filters.project) return false;
    return true;
  });

  // Filter Health Panels
  const scopedProjectHealth = allProjectHealth.filter(p => {
    if (filters.team !== 'ALL' && p.teamId !== filters.team) return false;
    if (filters.project !== 'ALL' && p.projectId !== filters.project) return false;
    return true;
  });

  const scopedTeamHealth = allTeamHealth.filter(t => {
    if (filters.team !== 'ALL' && t.teamId !== filters.team) return false;
    return true;
  });

  return {
    summary,
    needsAttention: scopedSignals,
    highRiskIssues: enrichedHighRiskIssues,
    bottlenecks: scopedBottlenecks,
    criticalChain,
    crossTeamMatrix,
    projectHealth: scopedProjectHealth,
    teamHealth: scopedTeamHealth,
  };
}
