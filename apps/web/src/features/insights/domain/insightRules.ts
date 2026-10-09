/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Cycle, Issue, Milestone, Project, Team } from '../../../types';
import { BottleneckRankItem, CrossTeamMatrixData } from '../../dependencies/types';
import { MilestoneSummaryData, CycleSummaryData } from '../../planning/types';
import { ExecutionRisk, InsightSignal, InsightSignalKind } from '../types';
import { isActiveIssue, getCalendarDaysDiff } from './executionRisk';

export interface SignalDerivationParams {
  issues: Issue[];
  projects: Project[];
  teams: Team[];
  issueRisks: Map<string, ExecutionRisk>;
  bottlenecks: BottleneckRankItem[];
  milestones: MilestoneSummaryData[];
  cycles: CycleSummaryData[];
  crossTeamMatrix: CrossTeamMatrixData;
  referenceTime: Date;
}

const SEVERITY_WEIGHT = {
  CRITICAL: 300,
  WARNING: 200,
  INFO: 100,
} as const;

/**
 * Derives deterministic, explainable "Needs Attention" insight signals.
 * No AI, no non-deterministic text. Pure rule-based projections.
 */
export function deriveInsightSignals(params: SignalDerivationParams): InsightSignal[] {
  const {
    issues,
    projects,
    teams,
    issueRisks,
    bottlenecks,
    milestones,
    cycles,
    crossTeamMatrix,
    referenceTime,
  } = params;

  const signals: InsightSignal[] = [];
  const handledIssueIds = new Set<string>();
  const projectsMap = new Map<string, Project>(projects.map(p => [p.id, p]));

  // 1. Critical Blockers from Bottlenecks
  for (const b of bottlenecks) {
    if (b.directDownstreamCount >= 2 || b.affectedTeamCount >= 2) {
      const isCritical = b.directDownstreamCount >= 3 || b.affectedTeamCount >= 2;
      const severity = isCritical ? 'CRITICAL' : 'WARNING';
      const teamText = b.affectedTeamCount > 1 ? `across ${b.affectedTeamCount} teams` : 'within team';
      const blockerProj = projectsMap.get(b.issue.projectId) || b.project;
      const blockerTeamId = blockerProj?.teamId || b.team?.id;

      signals.push({
        id: `sig_crit_blocker_${b.issue.id}`,
        kind: 'CRITICAL_BLOCKER',
        severity,
        impactScore: 100 + b.directDownstreamCount * 10 + b.affectedTeamCount * 5,
        title: `${b.issue.key} is blocking ${b.directDownstreamCount} active issues`,
        explanation: `Actively blocks ${b.directDownstreamCount} downstream tasks ${teamText}. Blast radius: ${b.transitiveBlastRadius} issues.`,
        issueIds: [b.issue.id],
        projectIds: blockerProj ? [blockerProj.id] : undefined,
        teamIds: blockerTeamId ? [blockerTeamId] : undefined,
        cycleId: b.issue.cycleId,
        milestoneId: b.issue.milestoneId,
        drawerIssueKey: b.issue.key,
        targetUrl: `/dependencies?issue=${b.issue.key}`,
      });
      handledIssueIds.add(b.issue.id);
    }
  }

  // 2. Delivery Risk (Critical execution risk)
  for (const issue of issues) {
    if (!isActiveIssue(issue.state)) continue;
    const risk = issueRisks.get(issue.id);
    if (risk && risk.level === 'CRITICAL' && !handledIssueIds.has(issue.id)) {
      const topReasons = risk.reasons.map(r => r.description).join('. ');
      const proj = projectsMap.get(issue.projectId);
      const resolvedTeamId = proj?.teamId || issue.teamId;

      signals.push({
        id: `sig_delivery_risk_${issue.id}`,
        kind: 'DELIVERY_RISK',
        severity: 'CRITICAL',
        impactScore: 80 + risk.score * 5,
        title: `${issue.key} delivery at critical risk`,
        explanation: topReasons || 'Multiple compounding execution blockers detected.',
        issueIds: [issue.id],
        projectIds: [issue.projectId],
        teamIds: resolvedTeamId ? [resolvedTeamId] : undefined,
        cycleId: issue.cycleId,
        milestoneId: issue.milestoneId,
        drawerIssueKey: issue.key,
        targetUrl: `/issues/${issue.key}`,
      });
      handledIssueIds.add(issue.id);
    }
  }

  // 3. Overdue Work (Active issues that are overdue and not yet captured)
  for (const issue of issues) {
    if (!isActiveIssue(issue.state) || !issue.dueDate) continue;
    if (handledIssueIds.has(issue.id)) continue;

    const daysDiff = getCalendarDaysDiff(issue.dueDate, referenceTime);
    if (daysDiff < 0) {
      const daysOverdue = Math.abs(daysDiff);
      const isUrgent = issue.priority === 'URGENT' || daysOverdue >= 5;
      const proj = projectsMap.get(issue.projectId);
      const resolvedTeamId = proj?.teamId || issue.teamId;

      signals.push({
        id: `sig_overdue_${issue.id}`,
        kind: 'OVERDUE_WORK',
        severity: isUrgent ? 'CRITICAL' : 'WARNING',
        impactScore: 50 + daysOverdue * 3,
        title: `${issue.key} is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue`,
        explanation: `Target date was ${issue.dueDate}. Currently ${issue.state.replace('_', ' ')} with ${issue.priority.toLowerCase()} priority.`,
        issueIds: [issue.id],
        projectIds: [issue.projectId],
        teamIds: resolvedTeamId ? [resolvedTeamId] : undefined,
        cycleId: issue.cycleId,
        milestoneId: issue.milestoneId,
        drawerIssueKey: issue.key,
        targetUrl: `/issues/${issue.key}`,
      });
      handledIssueIds.add(issue.id);
    }
  }

  // 4. Milestone Risk (BLOCKED or AT_RISK)
  for (const m of milestones) {
    if (m.isCompleted) continue;
    if (m.health === 'BLOCKED' || m.health === 'AT_RISK') {
      const isBlocked = m.health === 'BLOCKED';
      signals.push({
        id: `sig_milestone_${m.milestone.id}`,
        kind: 'MILESTONE_RISK',
        severity: isBlocked ? 'CRITICAL' : 'WARNING',
        impactScore: isBlocked ? 95 : 65,
        title: `Milestone "${m.milestone.name}" is ${isBlocked ? 'Blocked' : 'At Risk'}`,
        explanation: `${m.progress.remaining} unfinished issues (${m.progress.blocked} blocked). Target date: ${m.milestone.targetDate || 'Unscheduled'}.`,
        milestoneId: m.milestone.id,
        projectIds: m.contributingProjects.map(p => p.id),
        teamIds: m.contributingTeams.map(t => t.id),
        issueIds: m.issues.map(i => i.id),
        targetUrl: `/milestones/${m.milestone.id}`,
      });
    }
  }

  // 5. Cycle Pressure (Active cycles with <= 3 days remaining and unfinished work)
  for (const c of cycles) {
    if (c.cycle.status !== 'ACTIVE') continue;
    if (c.progress.remaining > 0 && c.progress.daysRemaining <= 3) {
      const isCritical = c.progress.daysRemaining <= 1 && c.progress.remaining >= 3;
      const cycleIssues = issues.filter(i => i.cycleId === c.cycle.id);
      const cycleProjectIds = Array.from(new Set(cycleIssues.map(i => i.projectId)));
      const cycleTeamIds = c.team ? [c.team.id] : (c.cycle.teamId ? [c.cycle.teamId] : []);

      signals.push({
        id: `sig_cycle_${c.cycle.id}`,
        kind: 'CYCLE_PRESSURE',
        severity: isCritical ? 'CRITICAL' : 'WARNING',
        impactScore: 70 + (4 - c.progress.daysRemaining) * 5 + c.progress.remaining,
        title: `Cycle "${c.cycle.name}" under delivery pressure`,
        explanation: `${c.progress.remaining} unfinished tasks with ${c.progress.daysRemaining} day${c.progress.daysRemaining === 1 ? '' : 's'} remaining.`,
        cycleId: c.cycle.id,
        teamIds: cycleTeamIds.length > 0 ? cycleTeamIds : undefined,
        projectIds: cycleProjectIds.length > 0 ? cycleProjectIds : undefined,
        issueIds: cycleIssues.map(i => i.id),
        targetUrl: `/cycles/${c.cycle.id}`,
      });
    }
  }

  // 6. Cross-Team Bottlenecks (Teams with >= 2 active dependency edges)
  for (const [sourceTeamId, row] of crossTeamMatrix.matrix.entries()) {
    const sourceTeam = teams.find(t => t.id === sourceTeamId);
    if (!sourceTeam) continue;

    for (const [targetTeamId, cell] of row.entries()) {
      if (sourceTeamId === targetTeamId) continue;
      if (cell.activeEdgeCount >= 2) {
        const targetTeam = teams.find(t => t.id === targetTeamId);
        if (!targetTeam) continue;

        signals.push({
          id: `sig_cross_team_${sourceTeamId}_${targetTeamId}`,
          kind: 'CROSS_TEAM_BOTTLENECK',
          severity: cell.activeEdgeCount >= 3 ? 'CRITICAL' : 'WARNING',
          impactScore: 60 + cell.activeEdgeCount * 6,
          title: `${sourceTeam.name} → ${targetTeam.name} cross-team bottleneck`,
          explanation: `${cell.activeEdgeCount} active dependency edges blocking ${cell.blockedIssueCount} downstream tasks.`,
          teamIds: [sourceTeamId, targetTeamId],
          targetUrl: `/dependencies?team=${sourceTeamId}&view=matrix`,
        });
      }
    }
  }

  // Prioritization:
  // 1. Severity weight descending (CRITICAL > WARNING > INFO)
  // 2. ImpactScore descending
  // 3. ID localeCompare for deterministic tie-breaker
  signals.sort((a, b) => {
    const sevDiff = SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity];
    if (sevDiff !== 0) return sevDiff;
    if (b.impactScore !== a.impactScore) return b.impactScore - a.impactScore;
    return a.id.localeCompare(b.id);
  });

  return signals;
}
