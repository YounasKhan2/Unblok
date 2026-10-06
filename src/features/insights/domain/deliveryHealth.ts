/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Issue, Milestone, Project, Team } from '../../../types';
import { DeliveryHealth, ProjectDeliveryHealth, TeamDeliveryHealth, ExecutionRisk } from '../types';
import { isActiveIssue } from './executionRisk';

export const HEALTH_THRESHOLDS = {
  BLOCKED_RATIO_AT_RISK: 0.3,
  CRITICAL_RISK_COUNT_AT_RISK: 2,
} as const;

export interface ProjectHealthInput {
  project: Project;
  team?: Team;
  issues: Issue[];
  issueRisks: Map<string, ExecutionRisk>;
  activeBlockerCounts: Map<string, number>;
  milestones: Milestone[];
  referenceTime: Date;
}

export interface TeamHealthInput {
  team: Team;
  projects: Project[];
  issues: Issue[];
  issueRisks: Map<string, ExecutionRisk>;
  activeBlockerCounts: Map<string, number>;
  milestones: Milestone[];
  referenceTime: Date;
}

/**
 * Calculates delivery health for a project using explicit, explainable rules.
 */
export function calculateProjectDeliveryHealth(input: ProjectHealthInput): ProjectDeliveryHealth {
  const { project, team, issues, issueRisks, activeBlockerCounts, milestones, referenceTime } = input;

  const projectIssues = issues.filter(i => i.projectId === project.id);
  const activeIssues = projectIssues.filter(i => isActiveIssue(i.state));

  let blockedCount = 0;
  let highRiskCount = 0;
  let criticalRiskCount = 0;
  let overdueCount = 0;
  let overdueBlockedCount = 0;
  let dueSoonCount = 0;

  for (const issue of activeIssues) {
    const isBlocked = (activeBlockerCounts.get(issue.id) || 0) > 0;
    if (isBlocked) blockedCount++;

    const risk = issueRisks.get(issue.id);
    if (risk?.level === 'CRITICAL') {
      criticalRiskCount++;
    } else if (risk?.level === 'HIGH') {
      highRiskCount++;
    }

    if (issue.dueDate) {
      const dueMs = new Date(issue.dueDate).getTime();
      const refMs = referenceTime.getTime();
      if (dueMs < refMs) {
        overdueCount++;
        if (isBlocked) overdueBlockedCount++;
      } else if (dueMs - refMs <= 3 * 24 * 60 * 60 * 1000) {
        dueSoonCount++;
      }
    }
  }

  const activeCount = activeIssues.length;
  const blockedRatio = activeCount > 0 ? blockedCount / activeCount : 0;

  // Check linked milestone health
  const linkedMilestoneIds = new Set(
    projectIssues.map(i => i.milestoneId).filter((id): id is string => Boolean(id))
  );
  const linkedMilestones = milestones.filter(m => linkedMilestoneIds.has(m.id));
  const hasBlockedMilestone = linkedMilestones.some(m => (m as any).health === 'BLOCKED');
  const hasAtRiskMilestone = linkedMilestones.some(m => (m as any).health === 'AT_RISK');

  const reasons: string[] = [];
  let health: DeliveryHealth = 'HEALTHY';

  // AT_RISK Rules
  if (activeCount > 0 && blockedRatio >= HEALTH_THRESHOLDS.BLOCKED_RATIO_AT_RISK) {
    health = 'AT_RISK';
    reasons.push(`${Math.round(blockedRatio * 100)}% of active work is blocked (threshold: 30%)`);
  }
  if (criticalRiskCount >= HEALTH_THRESHOLDS.CRITICAL_RISK_COUNT_AT_RISK) {
    health = 'AT_RISK';
    reasons.push(`${criticalRiskCount} critical-risk issues accumulating`);
  }
  if (overdueBlockedCount > 0) {
    health = 'AT_RISK';
    reasons.push(`${overdueBlockedCount} overdue issue${overdueBlockedCount > 1 ? 's are' : ' is'} actively blocked`);
  }
  if (hasBlockedMilestone) {
    health = 'AT_RISK';
    reasons.push('Linked milestone is BLOCKED');
  }

  // WATCH Rules (if not already AT_RISK)
  if (health !== 'AT_RISK') {
    if (blockedCount > 0) {
      health = 'WATCH';
      reasons.push(`${blockedCount} active issue${blockedCount > 1 ? 's are' : ' is'} blocked`);
    }
    if (criticalRiskCount === 1 || highRiskCount > 0) {
      health = 'WATCH';
      const riskTotal = criticalRiskCount + highRiskCount;
      reasons.push(`${riskTotal} high/critical risk issue${riskTotal > 1 ? 's' : ''} in progress`);
    }
    if (overdueCount > 0 || dueSoonCount > 0) {
      health = 'WATCH';
      reasons.push(`${overdueCount} overdue and ${dueSoonCount} due-soon issues`);
    }
    if (hasAtRiskMilestone) {
      health = 'WATCH';
      reasons.push('Linked milestone is AT_RISK');
    }
  }

  if (reasons.length === 0) {
    reasons.push(activeCount === 0 ? 'No active work in project' : 'All delivery signals within healthy thresholds');
  }

  return {
    projectId: project.id,
    projectKey: project.key,
    projectName: project.name,
    teamId: project.teamId,
    teamName: team?.name || project.teamId,
    health,
    activeIssueCount: activeCount,
    blockedIssueCount: blockedCount,
    blockedRatio,
    highRiskCount,
    criticalRiskCount,
    overdueCount,
    reasons,
  };
}

/**
 * Calculates delivery health for a team by aggregating projects owned by the team.
 * Ownership is derived through Project.teamId (never denormalized issue fields).
 */
export function calculateTeamDeliveryHealth(input: TeamHealthInput): TeamDeliveryHealth {
  const { team, projects, issues, issueRisks, activeBlockerCounts, milestones, referenceTime } = input;

  const teamProjects = projects.filter(p => p.teamId === team.id);
  const teamProjectIds = new Set(teamProjects.map(p => p.id));

  // Issues belonging to projects owned by this team
  const teamIssues = issues.filter(i => teamProjectIds.has(i.projectId));
  const activeIssues = teamIssues.filter(i => isActiveIssue(i.state));

  let blockedCount = 0;
  let highRiskCount = 0;
  let criticalRiskCount = 0;
  let overdueCount = 0;
  let overdueBlockedCount = 0;

  for (const issue of activeIssues) {
    const isBlocked = (activeBlockerCounts.get(issue.id) || 0) > 0;
    if (isBlocked) blockedCount++;

    const risk = issueRisks.get(issue.id);
    if (risk?.level === 'CRITICAL') {
      criticalRiskCount++;
    } else if (risk?.level === 'HIGH') {
      highRiskCount++;
    }

    if (issue.dueDate) {
      const dueMs = new Date(issue.dueDate).getTime();
      const refMs = referenceTime.getTime();
      if (dueMs < refMs) {
        overdueCount++;
        if (isBlocked) overdueBlockedCount++;
      }
    }
  }

  const activeCount = activeIssues.length;
  const blockedRatio = activeCount > 0 ? blockedCount / activeCount : 0;

  // Check linked milestone health
  const linkedMilestoneIds = new Set(
    teamIssues.map(i => i.milestoneId).filter((id): id is string => Boolean(id))
  );
  const linkedMilestones = milestones.filter(m => linkedMilestoneIds.has(m.id));
  const hasBlockedMilestone = linkedMilestones.some(m => (m as any).health === 'BLOCKED');
  const hasAtRiskMilestone = linkedMilestones.some(m => (m as any).health === 'AT_RISK');

  const reasons: string[] = [];
  let health: DeliveryHealth = 'HEALTHY';

  // AT_RISK Rules
  if (activeCount > 0 && blockedRatio >= HEALTH_THRESHOLDS.BLOCKED_RATIO_AT_RISK) {
    health = 'AT_RISK';
    reasons.push(`${Math.round(blockedRatio * 100)}% of team's active work is blocked`);
  }
  if (criticalRiskCount >= HEALTH_THRESHOLDS.CRITICAL_RISK_COUNT_AT_RISK) {
    health = 'AT_RISK';
    reasons.push(`${criticalRiskCount} critical-risk issues in team projects`);
  }
  if (overdueBlockedCount > 0) {
    health = 'AT_RISK';
    reasons.push(`${overdueBlockedCount} overdue blocked issue${overdueBlockedCount > 1 ? 's' : ''}`);
  }
  if (hasBlockedMilestone) {
    health = 'AT_RISK';
    reasons.push('Associated milestone is BLOCKED');
  }

  // WATCH Rules (if not already AT_RISK)
  if (health !== 'AT_RISK') {
    if (blockedCount > 0) {
      health = 'WATCH';
      reasons.push(`${blockedCount} active issue${blockedCount > 1 ? 's' : ''} blocked`);
    }
    if (criticalRiskCount === 1 || highRiskCount > 0) {
      health = 'WATCH';
      reasons.push(`${criticalRiskCount + highRiskCount} high/critical risk issue${criticalRiskCount + highRiskCount > 1 ? 's' : ''}`);
    }
    if (overdueCount > 0) {
      health = 'WATCH';
      reasons.push(`${overdueCount} overdue active issue${overdueCount > 1 ? 's' : ''}`);
    }
    if (hasAtRiskMilestone) {
      health = 'WATCH';
      reasons.push('Associated milestone is AT_RISK');
    }
  }

  if (reasons.length === 0) {
    reasons.push(activeCount === 0 ? 'No active work in team projects' : 'Team delivery execution on track');
  }

  return {
    teamId: team.id,
    teamKey: team.key,
    teamName: team.name,
    health,
    projectCount: teamProjects.length,
    activeIssueCount: activeCount,
    blockedIssueCount: blockedCount,
    blockedRatio,
    highRiskCount,
    criticalRiskCount,
    reasons,
  };
}
