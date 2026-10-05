/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dependency, Issue, Project, Team } from '../../types';

export type DependencyViewMode = 'graph' | 'matrix' | 'blockers';

export type DependencyStatusFilter = 'all' | 'active' | 'resolved';

export type DependencyScopeFilter = 'all' | 'cross-team' | 'cross-project' | 'same-project';

export interface DependencyFilterState {
  view: DependencyViewMode;
  team: string; // 'ALL' or team key/id
  project: string; // 'ALL' or project key/id
  status: DependencyStatusFilter;
  crossTeamOnly: boolean;
  scope: DependencyScopeFilter;
  q: string;
}

export interface ResolvedEdge {
  dependencyId: string;
  dependency: Dependency;
  upstreamIssue: Issue;
  downstreamIssue: Issue;
  upstreamProject?: Project;
  downstreamProject?: Project;
  upstreamTeam?: Team;
  downstreamTeam?: Team;
  isActive: boolean;
  isResolved: boolean;
  isCrossProject: boolean;
  isCrossTeam: boolean;
  createdAt: string;
  createdBy: string;
}

export interface IssueDependencyIntelligence {
  issue: Issue;
  activeUpstreamCount: number;
  resolvedUpstreamCount: number;
  downstreamCount: number;
  activeDownstreamCount: number;
  isBlocked: boolean;
  directBlastRadius: number;
  transitiveBlastRadius: number;
  transitiveDownstreamIssueIds: string[];
  affectedTeams: Team[];
  affectedProjects: Project[];
}

export interface BottleneckRankItem {
  issue: Issue;
  project?: Project;
  team?: Team;
  transitiveBlastRadius: number;
  directDownstreamCount: number;
  affectedTeamCount: number;
  affectedProjectCount: number;
  affectedTeams: Team[];
  affectedProjects: Project[];
}

export interface CriticalChainResult {
  orderedIssueIds: string[];
  orderedIssueKeys: string[];
  chainLength: number;
  activeEdgeIds: string[];
}

export interface TeamMatrixCell {
  blockingTeam: Team;
  blockedTeam: Team;
  activeEdgeCount: number;
  resolvedEdgeCount: number;
  matchingEdges: ResolvedEdge[];
  blockedIssueCount: number;
}

export interface CrossTeamMatrixData {
  teams: Team[];
  matrix: Map<string, Map<string, TeamMatrixCell>>; // blockingTeamId -> blockedTeamId -> cell
  totalCrossTeamActiveEdges: number;
}

export interface DependencySummaryMetrics {
  activeEdgesCount: number;
  blockedIssuesCount: number;
  resolvedEdgesCount: number;
  crossTeamActiveEdgesCount: number;
  crossProjectActiveEdgesCount: number;
  bottlenecksCount: number;
  longestActiveChainDepth: number;
}

export interface GraphLayoutNode {
  id: string;
  issue: Issue;
  project?: Project;
  team?: Team;
  level: number;
  x: number;
  y: number;
  inCriticalPath: boolean;
  activeBlockersCount: number;
  downstreamCount: number;
  transitiveBlastRadius: number;
  isBlocked: boolean;
  isRoot: boolean;
  isLeaf: boolean;
}

export interface GraphLayoutEdge {
  id: string;
  dependencyId: string;
  upstreamId: string;
  downstreamId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  isActive: boolean;
  isResolved: boolean;
  inCriticalPath: boolean;
  isCrossTeam: boolean;
  svgPath: string;
}

export interface GraphLayoutData {
  nodes: GraphLayoutNode[];
  edges: GraphLayoutEdge[];
  criticalChain: CriticalChainResult;
  width: number;
  height: number;
}
