/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dependency, Issue, Project, Team } from '../../types';
import { isUpstreamActivelyBlocking } from '../../domain/lifecycle';
import {
  ResolvedEdge,
  IssueDependencyIntelligence,
  BottleneckRankItem,
  CriticalChainResult,
  CrossTeamMatrixData,
  TeamMatrixCell,
  DependencySummaryMetrics,
  DependencyFilterState,
  GraphLayoutData,
  GraphLayoutNode,
  GraphLayoutEdge,
} from './types';

/**
 * Normalizes dependency data into indexed lookups and adjacency maps.
 */
export function buildNormalizedGraph(issues: Issue[], dependencies: Dependency[]) {
  const issuesMap = new Map<string, Issue>(issues.map(i => [i.id, i]));
  const outgoingByIssueId = new Map<string, string[]>();
  const incomingByIssueId = new Map<string, string[]>();
  const activeOutgoingByIssueId = new Map<string, string[]>();
  const activeIncomingByIssueId = new Map<string, string[]>();

  for (const issue of issues) {
    outgoingByIssueId.set(issue.id, []);
    incomingByIssueId.set(issue.id, []);
    activeOutgoingByIssueId.set(issue.id, []);
    activeIncomingByIssueId.set(issue.id, []);
  }

  for (const dep of dependencies) {
    const upstream = issuesMap.get(dep.upstreamIssueId);
    const downstream = issuesMap.get(dep.downstreamIssueId);
    if (!upstream || !downstream) continue;

    outgoingByIssueId.get(dep.upstreamIssueId)?.push(dep.downstreamIssueId);
    incomingByIssueId.get(dep.downstreamIssueId)?.push(dep.upstreamIssueId);

    const isActive = isUpstreamActivelyBlocking(upstream.state);
    if (isActive) {
      activeOutgoingByIssueId.get(dep.upstreamIssueId)?.push(dep.downstreamIssueId);
      activeIncomingByIssueId.get(dep.downstreamIssueId)?.push(dep.upstreamIssueId);
    }
  }

  return {
    issuesMap,
    outgoingByIssueId,
    incomingByIssueId,
    activeOutgoingByIssueId,
    activeIncomingByIssueId,
  };
}

/**
 * Resolves raw dependencies into rich entity relationships with full project/team context.
 */
export function resolveEdges(
  dependencies: Dependency[],
  issues: Issue[],
  projects: Project[],
  teams: Team[]
): ResolvedEdge[] {
  const issuesMap = new Map(issues.map(i => [i.id, i]));
  const projectsMap = new Map(projects.map(p => [p.id, p]));
  const teamsMap = new Map(teams.map(t => [t.id, t]));

  const resolved: ResolvedEdge[] = [];

  for (const dep of dependencies) {
    const upstreamIssue = issuesMap.get(dep.upstreamIssueId);
    const downstreamIssue = issuesMap.get(dep.downstreamIssueId);
    if (!upstreamIssue || !downstreamIssue) continue;

    const isActive = isUpstreamActivelyBlocking(upstreamIssue.state);
    const isResolved = !isActive;
    const isCrossProject = upstreamIssue.projectId !== downstreamIssue.projectId;
    const isCrossTeam = upstreamIssue.teamId !== downstreamIssue.teamId;

    resolved.push({
      dependencyId: dep.id,
      dependency: dep,
      upstreamIssue,
      downstreamIssue,
      upstreamProject: projectsMap.get(upstreamIssue.projectId),
      downstreamProject: projectsMap.get(downstreamIssue.projectId),
      upstreamTeam: teamsMap.get(upstreamIssue.teamId),
      downstreamTeam: teamsMap.get(downstreamIssue.teamId),
      isActive,
      isResolved,
      isCrossProject,
      isCrossTeam,
      createdAt: dep.createdAt,
      createdBy: dep.createdBy,
    });
  }

  return resolved;
}

/**
 * Computes the active transitive downstream blast radius for a given issue.
 * Traverses active outgoing edges to find all unique downstream issues that are impacted.
 * Deduplicates multiple convergence paths (e.g. Diamond DAGs A -> B -> D and A -> C -> D).
 */
export function computeTransitiveDownstreamIds(
  startIssueId: string,
  activeOutgoingMap: Map<string, string[]>
): string[] {
  const visited = new Set<string>();
  const stack: string[] = [...(activeOutgoingMap.get(startIssueId) || [])];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (visited.has(current) || current === startIssueId) continue;
    visited.add(current);

    const nextNeighbors = activeOutgoingMap.get(current) || [];
    for (const next of nextNeighbors) {
      if (!visited.has(next)) {
        stack.push(next);
      }
    }
  }

  return Array.from(visited);
}

/**
 * Derives comprehensive issue dependency intelligence for all issues.
 */
export function deriveIssueDependencyIntelligence(
  issues: Issue[],
  dependencies: Dependency[],
  projects: Project[],
  teams: Team[]
): Map<string, IssueDependencyIntelligence> {
  const { issuesMap, outgoingByIssueId, incomingByIssueId, activeOutgoingByIssueId, activeIncomingByIssueId } =
    buildNormalizedGraph(issues, dependencies);

  const projectsMap = new Map(projects.map(p => [p.id, p]));
  const teamsMap = new Map(teams.map(t => [t.id, t]));
  const result = new Map<string, IssueDependencyIntelligence>();

  for (const issue of issues) {
    const activeUpstream = activeIncomingByIssueId.get(issue.id) || [];
    const totalIncoming = incomingByIssueId.get(issue.id) || [];
    const resolvedUpstreamCount = totalIncoming.length - activeUpstream.length;

    const directDownstream = outgoingByIssueId.get(issue.id) || [];
    const directActiveDownstream = activeOutgoingByIssueId.get(issue.id) || [];

    const transitiveDownstreamIssueIds = computeTransitiveDownstreamIds(issue.id, activeOutgoingByIssueId);

    const affectedTeamSet = new Set<string>();
    const affectedProjectSet = new Set<string>();

    for (const id of transitiveDownstreamIssueIds) {
      const downIssue = issuesMap.get(id);
      if (downIssue) {
        if (downIssue.teamId) affectedTeamSet.add(downIssue.teamId);
        if (downIssue.projectId) affectedProjectSet.add(downIssue.projectId);
      }
    }

    const affectedTeams = Array.from(affectedTeamSet)
      .map(id => teamsMap.get(id)!)
      .filter(Boolean);

    const affectedProjects = Array.from(affectedProjectSet)
      .map(id => projectsMap.get(id)!)
      .filter(Boolean);

    result.set(issue.id, {
      issue,
      activeUpstreamCount: activeUpstream.length,
      resolvedUpstreamCount,
      downstreamCount: directDownstream.length,
      activeDownstreamCount: directActiveDownstream.length,
      isBlocked: activeUpstream.length > 0,
      directBlastRadius: directActiveDownstream.length,
      transitiveBlastRadius: transitiveDownstreamIssueIds.length,
      transitiveDownstreamIssueIds,
      affectedTeams,
      affectedProjects,
    });
  }

  return result;
}

/**
 * Calculates deterministic bottleneck ranking.
 * Ranked primarily by:
 * 1. active transitive downstream blast radius (descending)
 * 2. number of affected Teams (descending)
 * 3. number of affected Projects (descending)
 * 4. issue key alphabetically (tie-breaker)
 */
export function getBottlenecks(
  issues: Issue[],
  dependencies: Dependency[],
  projects: Project[],
  teams: Team[],
  limit = 5
): BottleneckRankItem[] {
  const intelMap = deriveIssueDependencyIntelligence(issues, dependencies, projects, teams);
  const projectsMap = new Map(projects.map(p => [p.id, p]));
  const teamsMap = new Map(teams.map(t => [t.id, t]));

  const candidates: BottleneckRankItem[] = [];

  for (const intel of intelMap.values()) {
    // Only issues that actively block at least one downstream issue qualify as bottlenecks
    if (intel.activeDownstreamCount === 0 && intel.transitiveBlastRadius === 0) continue;

    candidates.push({
      issue: intel.issue,
      project: projectsMap.get(intel.issue.projectId),
      team: teamsMap.get(intel.issue.teamId),
      transitiveBlastRadius: intel.transitiveBlastRadius,
      directDownstreamCount: intel.activeDownstreamCount,
      affectedTeamCount: intel.affectedTeams.length,
      affectedProjectCount: intel.affectedProjects.length,
      affectedTeams: intel.affectedTeams,
      affectedProjects: intel.affectedProjects,
    });
  }

  candidates.sort((a, b) => {
    if (b.transitiveBlastRadius !== a.transitiveBlastRadius) {
      return b.transitiveBlastRadius - a.transitiveBlastRadius;
    }
    if (b.affectedTeamCount !== a.affectedTeamCount) {
      return b.affectedTeamCount - a.affectedTeamCount;
    }
    if (b.affectedProjectCount !== a.affectedProjectCount) {
      return b.affectedProjectCount - a.affectedProjectCount;
    }
    return a.issue.key.localeCompare(b.issue.key);
  });

  return candidates.slice(0, limit);
}

/**
 * Calculates the longest active dependency chain in the workspace DAG.
 * (Critical Path defined by active dependency depth, not duration estimates).
 * Uses topological processing and deterministic tie-breaking.
 */
export function calculateLongestActiveChain(
  issues: Issue[],
  dependencies: Dependency[]
): CriticalChainResult {
  const { issuesMap, activeOutgoingByIssueId } = buildNormalizedGraph(issues, dependencies);

  // Active edges map: upstream -> set of active edges
  const activeEdgeMap = new Map<string, string>(); // `u->v` => depId
  for (const dep of dependencies) {
    const upstream = issuesMap.get(dep.upstreamIssueId);
    if (upstream && isUpstreamActivelyBlocking(upstream.state)) {
      activeEdgeMap.set(`${dep.upstreamIssueId}->${dep.downstreamIssueId}`, dep.id);
    }
  }

  // Memoized DFS from each node
  const memo = new Map<string, string[]>();

  function dfs(nodeId: string, visitedInPath: Set<string>): string[] {
    if (memo.has(nodeId)) {
      return memo.get(nodeId)!;
    }

    const nextNodes = activeOutgoingByIssueId.get(nodeId) || [];
    if (nextNodes.length === 0) {
      const single = [nodeId];
      memo.set(nodeId, single);
      return single;
    }

    let bestChildPath: string[] = [];

    for (const nextId of nextNodes) {
      if (visitedInPath.has(nextId)) continue; // Safeguard against cycle

      visitedInPath.add(nextId);
      const childPath = dfs(nextId, visitedInPath);
      visitedInPath.delete(nextId);

      if (childPath.length > bestChildPath.length) {
        bestChildPath = childPath;
      } else if (childPath.length === bestChildPath.length && childPath.length > 0) {
        // Deterministic tie-breaker: compare issue keys alphabetically
        const keyBest = bestChildPath.map(id => issuesMap.get(id)?.key || id).join('->');
        const keyChild = childPath.map(id => issuesMap.get(id)?.key || id).join('->');
        if (keyChild.localeCompare(keyBest) < 0) {
          bestChildPath = childPath;
        }
      }
    }

    const result = [nodeId, ...bestChildPath];
    memo.set(nodeId, result);
    return result;
  }

  let longestPath: string[] = [];

  for (const issue of issues) {
    const path = dfs(issue.id, new Set([issue.id]));
    if (path.length > longestPath.length) {
      longestPath = path;
    } else if (path.length === longestPath.length && path.length > 1) {
      const keyLongest = longestPath.map(id => issuesMap.get(id)?.key || id).join('->');
      const keyPath = path.map(id => issuesMap.get(id)?.key || id).join('->');
      if (keyPath.localeCompare(keyLongest) < 0) {
        longestPath = path;
      }
    }
  }

  // If path is just 1 node with no edges, chain is empty (no active dependency edges)
  if (longestPath.length <= 1) {
    return {
      orderedIssueIds: [],
      orderedIssueKeys: [],
      chainLength: 0,
      activeEdgeIds: [],
    };
  }

  const activeEdgeIds: string[] = [];
  for (let i = 0; i < longestPath.length - 1; i++) {
    const edgeKey = `${longestPath[i]}->${longestPath[i + 1]}`;
    const edgeId = activeEdgeMap.get(edgeKey);
    if (edgeId) activeEdgeIds.push(edgeId);
  }

  return {
    orderedIssueIds: longestPath,
    orderedIssueKeys: longestPath.map(id => issuesMap.get(id)?.key || id),
    chainLength: longestPath.length - 1,
    activeEdgeIds,
  };
}

/**
 * Calculates the Cross-Team Matrix.
 * Rows = Blocking Team, Columns = Blocked Team.
 * Counts active cross-team dependency edges. Same-team edges are excluded.
 */
export function calculateCrossTeamMatrix(
  teams: Team[],
  resolvedEdges: ResolvedEdge[]
): CrossTeamMatrixData {
  const matrix = new Map<string, Map<string, TeamMatrixCell>>();

  for (const sourceTeam of teams) {
    const row = new Map<string, TeamMatrixCell>();
    for (const targetTeam of teams) {
      row.set(targetTeam.id, {
        blockingTeam: sourceTeam,
        blockedTeam: targetTeam,
        activeEdgeCount: 0,
        resolvedEdgeCount: 0,
        matchingEdges: [],
        blockedIssueCount: 0,
      });
    }
    matrix.set(sourceTeam.id, row);
  }

  let totalCrossTeamActiveEdges = 0;

  for (const edge of resolvedEdges) {
    if (!edge.upstreamTeam || !edge.downstreamTeam) continue;
    // Exclude same-team edges from cross-team matrix
    if (edge.upstreamTeam.id === edge.downstreamTeam.id) continue;

    const row = matrix.get(edge.upstreamTeam.id);
    if (!row) continue;
    const cell = row.get(edge.downstreamTeam.id);
    if (!cell) continue;

    cell.matchingEdges.push(edge);
    if (edge.isActive) {
      cell.activeEdgeCount += 1;
      totalCrossTeamActiveEdges += 1;
    } else {
      cell.resolvedEdgeCount += 1;
    }
  }

  // Count unique blocked issues for each non-empty cell
  for (const row of matrix.values()) {
    for (const cell of row.values()) {
      const activeMatching = cell.matchingEdges.filter(e => e.isActive);
      const uniqueBlocked = new Set(activeMatching.map(e => e.downstreamIssue.id));
      cell.blockedIssueCount = uniqueBlocked.size;
    }
  }

  return {
    teams,
    matrix,
    totalCrossTeamActiveEdges,
  };
}

/**
 * Filters dependency edges based on shareable URL filter criteria.
 * Search matches upstream OR downstream issue key or title.
 */
export function filterDependencies(
  resolvedEdges: ResolvedEdge[],
  filters: DependencyFilterState
): ResolvedEdge[] {
  return resolvedEdges.filter(edge => {
    // 1. Status filter
    if (filters.status === 'active' && !edge.isActive) return false;
    if (filters.status === 'resolved' && !edge.isResolved) return false;

    // 2. Cross-team only filter
    if (filters.crossTeamOnly && !edge.isCrossTeam) return false;

    // 3. Scope filter
    if (filters.scope === 'cross-team' && !edge.isCrossTeam) return false;
    if (filters.scope === 'cross-project' && !edge.isCrossProject) return false;
    if (filters.scope === 'same-project' && edge.isCrossProject) return false;

    // 4. Team filter (matches either upstream or downstream)
    if (filters.team && filters.team !== 'ALL') {
      const teamIdOrKey = filters.team.toLowerCase();
      const upMatch =
        edge.upstreamTeam?.id.toLowerCase() === teamIdOrKey ||
        edge.upstreamTeam?.key.toLowerCase() === teamIdOrKey;
      const downMatch =
        edge.downstreamTeam?.id.toLowerCase() === teamIdOrKey ||
        edge.downstreamTeam?.key.toLowerCase() === teamIdOrKey;
      if (!upMatch && !downMatch) return false;
    }

    // 5. Project filter (matches either upstream or downstream)
    if (filters.project && filters.project !== 'ALL') {
      const projIdOrKey = filters.project.toLowerCase();
      const upMatch =
        edge.upstreamProject?.id.toLowerCase() === projIdOrKey ||
        edge.upstreamProject?.key.toLowerCase() === projIdOrKey;
      const downMatch =
        edge.downstreamProject?.id.toLowerCase() === projIdOrKey ||
        edge.downstreamProject?.key.toLowerCase() === projIdOrKey;
      if (!upMatch && !downMatch) return false;
    }

    // 6. Search query (matches upstream key/title or downstream key/title)
    if (filters.q && filters.q.trim()) {
      const q = filters.q.trim().toLowerCase();
      const upKey = edge.upstreamIssue.key.toLowerCase();
      const upTitle = edge.upstreamIssue.title.toLowerCase();
      const downKey = edge.downstreamIssue.key.toLowerCase();
      const downTitle = edge.downstreamIssue.title.toLowerCase();

      const matches =
        upKey.includes(q) ||
        upTitle.includes(q) ||
        downKey.includes(q) ||
        downTitle.includes(q);

      if (!matches) return false;
    }

    return true;
  });
}

/**
 * Calculates compact workspace summary metrics.
 */
export function calculateDependencySummary(
  issues: Issue[],
  resolvedEdges: ResolvedEdge[],
  bottlenecks: BottleneckRankItem[],
  criticalChain: CriticalChainResult
): DependencySummaryMetrics {
  const activeEdges = resolvedEdges.filter(e => e.isActive);
  const resolvedEdgesList = resolvedEdges.filter(e => e.isResolved);

  // Issues that have at least one active upstream blocker
  const blockedIssueIdSet = new Set<string>();
  for (const e of activeEdges) {
    blockedIssueIdSet.add(e.downstreamIssue.id);
  }

  const crossTeamActiveEdges = activeEdges.filter(e => e.isCrossTeam);
  const crossProjectActiveEdges = activeEdges.filter(e => e.isCrossProject);

  return {
    activeEdgesCount: activeEdges.length,
    blockedIssuesCount: blockedIssueIdSet.size,
    resolvedEdgesCount: resolvedEdgesList.length,
    crossTeamActiveEdgesCount: crossTeamActiveEdges.length,
    crossProjectActiveEdgesCount: crossProjectActiveEdges.length,
    bottlenecksCount: bottlenecks.length,
    longestActiveChainDepth: criticalChain.chainLength,
  };
}

/**
 * Calculates a layered DAG canvas layout with deterministic coordinates,
 * SVG Bezier paths, and critical path highlighting.
 */
export function calculateGraphLayout(
  filteredEdges: ResolvedEdge[],
  issues: Issue[],
  projects: Project[],
  teams: Team[],
  criticalChain: CriticalChainResult
): GraphLayoutData {
  const issuesMap = new Map(issues.map(i => [i.id, i]));
  const projectsMap = new Map(projects.map(p => [p.id, p]));
  const teamsMap = new Map(teams.map(t => [t.id, t]));

  // Collect unique issue IDs appearing in visible edges
  const visibleIssueIdSet = new Set<string>();
  for (const edge of filteredEdges) {
    visibleIssueIdSet.add(edge.upstreamIssue.id);
    visibleIssueIdSet.add(edge.downstreamIssue.id);
  }

  // If no edges match filters, return empty layout
  if (visibleIssueIdSet.size === 0) {
    return {
      nodes: [],
      edges: [],
      criticalChain,
      width: 800,
      height: 400,
    };
  }

  const adj = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const id of visibleIssueIdSet) {
    adj.set(id, []);
    inDegree.set(id, 0);
  }

  for (const edge of filteredEdges) {
    adj.get(edge.upstreamIssue.id)?.push(edge.downstreamIssue.id);
    inDegree.set(edge.downstreamIssue.id, (inDegree.get(edge.downstreamIssue.id) || 0) + 1);
  }

  // Calculate topological levels (distance from root)
  const levels = new Map<string, number>();
  for (const id of visibleIssueIdSet) {
    levels.set(id, 0);
  }

  let changed = true;
  let iterations = 0;
  while (changed && iterations < visibleIssueIdSet.size + 1) {
    changed = false;
    iterations++;
    for (const edge of filteredEdges) {
      const uLvl = levels.get(edge.upstreamIssue.id) || 0;
      const vLvl = levels.get(edge.downstreamIssue.id) || 0;
      if (uLvl + 1 > vLvl) {
        levels.set(edge.downstreamIssue.id, uLvl + 1);
        changed = true;
      }
    }
  }

  // Group nodes by level for row placement
  const levelGroups = new Map<number, string[]>();
  let maxLevel = 0;
  let maxNodesInLevel = 0;

  for (const [id, lvl] of levels.entries()) {
    if (lvl > maxLevel) maxLevel = lvl;
    if (!levelGroups.has(lvl)) {
      levelGroups.set(lvl, []);
    }
    levelGroups.get(lvl)!.push(id);
  }

  // Sort nodes in each level deterministically by team then issue key
  for (const [lvl, nodeIds] of levelGroups.entries()) {
    nodeIds.sort((a, b) => {
      const issueA = issuesMap.get(a);
      const issueB = issuesMap.get(b);
      const teamA = issueA?.teamId || '';
      const teamB = issueB?.teamId || '';
      if (teamA !== teamB) return teamA.localeCompare(teamB);
      return (issueA?.key || a).localeCompare(issueB?.key || b);
    });
    if (nodeIds.length > maxNodesInLevel) {
      maxNodesInLevel = nodeIds.length;
    }
  }

  const NODE_WIDTH = 260;
  const NODE_HEIGHT = 80;
  const X_SPACING = 340;
  const Y_SPACING = 110;
  const PADDING_X = 60;
  const PADDING_Y = 60;

  const nodePositions = new Map<string, { x: number; y: number }>();
  const nodes: GraphLayoutNode[] = [];
  const criticalPathSet = new Set(criticalChain.orderedIssueIds);
  const criticalEdgeSet = new Set(criticalChain.activeEdgeIds);

  for (const [lvl, nodeIds] of levelGroups.entries()) {
    nodeIds.forEach((id, rowIdx) => {
      const x = PADDING_X + lvl * X_SPACING;
      const y = PADDING_Y + rowIdx * Y_SPACING;
      nodePositions.set(id, { x, y });

      const issue = issuesMap.get(id)!;
      const inChain = criticalPathSet.has(id);

      // Active blockers count
      const activeIncoming = filteredEdges.filter(
        e => e.downstreamIssue.id === id && e.isActive
      );

      // Downstream count
      const downstreamEdges = filteredEdges.filter(
        e => e.upstreamIssue.id === id
      );

      nodes.push({
        id,
        issue,
        project: projectsMap.get(issue.projectId),
        team: teamsMap.get(issue.teamId),
        level: lvl,
        x,
        y,
        inCriticalPath: inChain,
        activeBlockersCount: activeIncoming.length,
        downstreamCount: downstreamEdges.length,
        transitiveBlastRadius: downstreamEdges.length,
        isBlocked: activeIncoming.length > 0,
        isRoot: (inDegree.get(id) || 0) === 0,
        isLeaf: (adj.get(id) || []).length === 0,
      });
    });
  }

  // Create smooth Bezier curve edges
  const edges: GraphLayoutEdge[] = [];
  for (const edge of filteredEdges) {
    const fromPos = nodePositions.get(edge.upstreamIssue.id);
    const toPos = nodePositions.get(edge.downstreamIssue.id);
    if (!fromPos || !toPos) continue;

    const fromX = fromPos.x + NODE_WIDTH;
    const fromY = fromPos.y + NODE_HEIGHT / 2;
    const toX = toPos.x;
    const toY = toPos.y + NODE_HEIGHT / 2;

    const dx = Math.max(40, (toX - fromX) / 2);
    const svgPath = `M ${fromX} ${fromY} C ${fromX + dx} ${fromY}, ${toX - dx} ${toY}, ${toX} ${toY}`;
    const inCriticalPath = criticalEdgeSet.has(edge.dependencyId);

    edges.push({
      id: edge.dependencyId,
      dependencyId: edge.dependencyId,
      upstreamId: edge.upstreamIssue.id,
      downstreamId: edge.downstreamIssue.id,
      fromX,
      fromY,
      toX,
      toY,
      isActive: edge.isActive,
      isResolved: edge.isResolved,
      inCriticalPath,
      isCrossTeam: edge.isCrossTeam,
      svgPath,
    });
  }

  const canvasWidth = Math.max(1000, PADDING_X * 2 + (maxLevel + 1) * X_SPACING);
  const canvasHeight = Math.max(550, PADDING_Y * 2 + maxNodesInLevel * Y_SPACING + 40);

  return {
    nodes,
    edges,
    criticalChain,
    width: canvasWidth,
    height: canvasHeight,
  };
}

/**
 * Formats blocker age honestly from the dependency creation timestamp.
 */
export function formatBlockerAge(createdAt: string, now: Date = new Date()): string {
  try {
    const created = new Date(createdAt).getTime();
    if (isNaN(created)) return '—';
    const current = now.getTime();
    const diffMs = Math.max(0, current - created);

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays >= 1) {
      return `${diffDays}d`;
    }
    if (diffHours >= 1) {
      return `${diffHours}h`;
    }
    if (diffMinutes >= 1) {
      return `${diffMinutes}m`;
    }
    return '<1m';
  } catch {
    return '—';
  }
}
