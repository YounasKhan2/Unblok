/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Issue, Project, Team, Milestone, Cycle } from '../../types';
import { BottleneckRankItem, CriticalChainResult, CrossTeamMatrixData } from '../dependencies/types';

export type ExecutionRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ExecutionRiskReason {
  code: string;
  weight: number;
  description: string;
}

export interface ExecutionRisk {
  score: number;
  level: ExecutionRiskLevel;
  reasons: ExecutionRiskReason[];
}

export interface EnrichedRiskIssue {
  issue: Issue;
  risk: ExecutionRisk;
  project?: Project;
  team?: Team;
  activeBlockerCount: number;
  activeDownstreamCount: number;
  isOverdue: boolean;
  isDueSoon: boolean;
}

export type DeliveryHealth = 'HEALTHY' | 'WATCH' | 'AT_RISK';

export interface ProjectDeliveryHealth {
  projectId: string;
  projectKey: string;
  projectName: string;
  teamId: string;
  teamName: string;
  health: DeliveryHealth;
  activeIssueCount: number;
  blockedIssueCount: number;
  blockedRatio: number;
  highRiskCount: number;
  criticalRiskCount: number;
  overdueCount: number;
  reasons: string[];
}

export interface TeamDeliveryHealth {
  teamId: string;
  teamKey: string;
  teamName: string;
  health: DeliveryHealth;
  projectCount: number;
  activeIssueCount: number;
  blockedIssueCount: number;
  blockedRatio: number;
  highRiskCount: number;
  criticalRiskCount: number;
  reasons: string[];
}

export type InsightSignalKind =
  | 'CRITICAL_BLOCKER'
  | 'DELIVERY_RISK'
  | 'MILESTONE_RISK'
  | 'CYCLE_PRESSURE'
  | 'CROSS_TEAM_BOTTLENECK'
  | 'OVERDUE_WORK';

export interface InsightSignal {
  id: string;
  kind: InsightSignalKind;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  impactScore: number;
  title: string;
  explanation: string;
  issueIds?: string[];
  projectIds?: string[];
  teamIds?: string[];
  milestoneId?: string;
  cycleId?: string;
  targetUrl?: string;
  drawerIssueKey?: string;
}

export interface ExecutionSummaryMetrics {
  activeIssuesCount: number;
  blockedIssuesCount: number;
  highRiskIssuesCount: number;
  activeBlockersCount: number;
  atRiskMilestonesCount: number;
  overdueIssuesCount: number;
}

export interface InsightsFilterState {
  team: string; // 'ALL' or team id
  project: string; // 'ALL' or project id
  risk: string; // 'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  cycle: string; // 'ALL' or cycle id
}

export interface WorkspaceInsightsData {
  summary: ExecutionSummaryMetrics;
  needsAttention: InsightSignal[];
  highRiskIssues: EnrichedRiskIssue[];
  bottlenecks: BottleneckRankItem[];
  criticalChain: CriticalChainResult;
  crossTeamMatrix: CrossTeamMatrixData;
  projectHealth: ProjectDeliveryHealth[];
  teamHealth: TeamDeliveryHealth[];
}
