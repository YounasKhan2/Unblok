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

  // 6. Project & Team Delivery Health (reusing UX-05 derived MilestoneSummaryData)
  const allProjectHealth = projects.map(p =>
    calculateProjectDeliveryHealth({
      project: p,
      team: teamsMap.get(p.teamId),
      issues,
      issueRisks,
      activeBlockerCounts,
      milestoneSummaries: milestoneOverview.allMilestones,
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
      milestoneSummaries: milestoneOverview.allMilestones,
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
    crossTeamMatrix: calculateCrossTeamMatrix(teams, resolvedEdges),
    referenceTime,
  });

  // 8. Scope Filtering (Consistent contract across summary, signals, tables, bottlenecks, matrix, health)
  // Filter Issues
  const scopedIssues = issues.filter(issue => {
    const proj = projectsMap.get(issue.projectId);
    const resolvedTeamId = proj?.teamId || issue.teamId;

    if (filters.team !== 'ALL' && resolvedTeamId !== filters.team) return false;
    if (filters.project !== 'ALL' && issue.projectId !== filters.project) return false;
    if (filters.cycle !== 'ALL' && issue.cycleId !== filters.cycle) return false;
    if (filters.risk !== 'ALL') {
      const risk = issueRisks.get(issue.id);
      if (risk?.level !== filters.risk) return false;
    }
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
    if (filters.team !== 'ALL') {
      const hasTeam =
        m.contributingTeams.some(t => t.id === filters.team) ||
        m.issues.some(i => (projectsMap.get(i.projectId)?.teamId || i.teamId) === filters.team);
      if (!hasTeam) return false;
    }
    if (filters.project !== 'ALL') {
      const hasProject =
        m.contributingProjects.some(p => p.id === filters.project) ||
        m.issues.some(i => i.projectId === filters.project);
      if (!hasProject) return false;
    }
    if (filters.cycle !== 'ALL') {
      const hasCycle = m.issues.some(i => i.cycleId === filters.cycle);
      if (!hasCycle) return false;
    }
    if (filters.risk !== 'ALL') {
      const hasRisk = m.issues.some(i => issueRisks.get(i.id)?.level === filters.risk);
      if (!hasRisk) return false;
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
    // 1. Team filter
    if (filters.team !== 'ALL') {
      const matchesTeam =
        (sig.teamIds && sig.teamIds.includes(filters.team)) ||
        (sig.projectIds && sig.projectIds.some(pid => projectsMap.get(pid)?.teamId === filters.team)) ||
        (sig.issueIds && sig.issueIds.some(iid => {
          const i = issuesMap.get(iid);
          return i && (projectsMap.get(i.projectId)?.teamId || i.teamId) === filters.team;
        }));
      if (!matchesTeam) return false;
    }

    // 2. Project filter
    if (filters.project !== 'ALL') {
      const matchesProj =
        (sig.projectIds && sig.projectIds.includes(filters.project)) ||
        (sig.issueIds && sig.issueIds.some(iid => issuesMap.get(iid)?.projectId === filters.project));
      if (!matchesProj) return false;
    }

    // 3. Cycle filter
    if (filters.cycle !== 'ALL') {
      if (sig.kind === 'CYCLE_PRESSURE') {
        if (sig.cycleId !== filters.cycle) return false;
      } else {
        const matchesCycle =
          sig.cycleId === filters.cycle ||
          (sig.issueIds && sig.issueIds.some(iid => issuesMap.get(iid)?.cycleId === filters.cycle));
        if (!matchesCycle) return false;
      }
    }

    // 4. Risk filter (consistent scoping to affected issues/signals)
    if (filters.risk !== 'ALL') {
      if (sig.issueIds && sig.issueIds.length > 0) {
        const matchesRisk = sig.issueIds.some(iid => issueRisks.get(iid)?.level === filters.risk);
        if (!matchesRisk) return false;
      } else if (sig.kind === 'MILESTONE_RISK' && sig.milestoneId) {
        const ms = milestoneOverview.allMilestones.find(m => m.milestone.id === sig.milestoneId);
        const matchesRisk = ms?.issues.some(i => issueRisks.get(i.id)?.level === filters.risk);
        if (!matchesRisk) return false;
      } else if (sig.kind === 'CYCLE_PRESSURE' && sig.cycleId) {
        const cycleIssues = issues.filter(i => i.cycleId === sig.cycleId);
        const matchesRisk = cycleIssues.some(i => issueRisks.get(i.id)?.level === filters.risk);
        if (!matchesRisk) return false;
      } else {
        return false;
      }
    }

    return true;
  });

  // Filter Bottlenecks
  const scopedBottlenecks = allBottlenecks.filter(b => {
    const bProj = projectsMap.get(b.issue.projectId) || b.project;
    const bTeamId = bProj?.teamId || b.team?.id;

    if (filters.team !== 'ALL' && bTeamId !== filters.team) return false;
    if (filters.project !== 'ALL' && b.issue.projectId !== filters.project) return false;
    if (filters.cycle !== 'ALL' && b.issue.cycleId !== filters.cycle) return false;
    if (filters.risk !== 'ALL') {
      const risk = issueRisks.get(b.issue.id);
      if (risk?.level !== filters.risk) return false;
    }
    return true;
  });

  // Filter Health Panels
  const scopedProjectHealth = allProjectHealth.filter(p => {
    if (filters.team !== 'ALL' && p.teamId !== filters.team) return false;
    if (filters.project !== 'ALL' && p.projectId !== filters.project) return false;
    if (filters.cycle !== 'ALL') {
      const hasCycleIssue = issues.some(
        i => i.projectId === p.projectId && i.cycleId === filters.cycle && isActiveIssue(i.state)
      );
      if (!hasCycleIssue) return false;
    }
    if (filters.risk !== 'ALL') {
      const hasRiskIssue = issues.some(
        i => i.projectId === p.projectId && issueRisks.get(i.id)?.level === filters.risk && isActiveIssue(i.state)
      );
      if (!hasRiskIssue) return false;
    }
    return true;
  });

  const scopedTeamHealth = allTeamHealth.filter(t => {
    if (filters.team !== 'ALL' && t.teamId !== filters.team) return false;
    if (filters.project !== 'ALL') {
      const ownsProject = projects.some(p => p.id === filters.project && p.teamId === t.teamId);
      if (!ownsProject) return false;
    }
    if (filters.cycle !== 'ALL') {
      const hasCycleIssue = issues.some(i => {
        const p = projectsMap.get(i.projectId);
        return p?.teamId === t.teamId && i.cycleId === filters.cycle && isActiveIssue(i.state);
      });
      if (!hasCycleIssue) return false;
    }
    if (filters.risk !== 'ALL') {
      const hasRiskIssue = issues.some(i => {
        const p = projectsMap.get(i.projectId);
        return p?.teamId === t.teamId && issueRisks.get(i.id)?.level === filters.risk && isActiveIssue(i.state);
      });
      if (!hasRiskIssue) return false;
    }
    return true;
  });

  // Scoped Cross-Team Dependency Matrix
  let matrixScopeLabel = 'Workspace-wide';
  let edgesForMatrix = resolvedEdges;

  if (filters.team !== 'ALL') {
    const selectedTeam = teamsMap.get(filters.team);
    matrixScopeLabel = `Filtered: ${selectedTeam?.name || selectedTeam?.key || 'Team'}`;
    edgesForMatrix = resolvedEdges.filter(
      e => e.upstreamTeam?.id === filters.team || e.downstreamTeam?.id === filters.team
    );
  } else if (filters.project !== 'ALL') {
    const selectedProject = projectsMap.get(filters.project);
    matrixScopeLabel = `Filtered: ${selectedProject?.name || selectedProject?.key || 'Project'}`;
    edgesForMatrix = resolvedEdges.filter(
      e => e.upstreamProject?.id === filters.project || e.downstreamProject?.id === filters.project
    );
  } else if (filters.cycle !== 'ALL') {
    matrixScopeLabel = 'Filtered: Selected Cycle';
    edgesForMatrix = resolvedEdges.filter(
      e => e.upstreamIssue.cycleId === filters.cycle || e.downstreamIssue.cycleId === filters.cycle
    );
  } else if (filters.risk !== 'ALL') {
    matrixScopeLabel = `Workspace-wide (${filters.risk} risk filter active)`;
  }

  const crossTeamMatrix = calculateCrossTeamMatrix(teams, edgesForMatrix);

  return {
    summary,
    needsAttention: scopedSignals,
    highRiskIssues: enrichedHighRiskIssues,
    bottlenecks: scopedBottlenecks,
    criticalChain,
    crossTeamMatrix,
    matrixScopeLabel,
    projectHealth: scopedProjectHealth,
    teamHealth: scopedTeamHealth,
  };
}
