import { Dependency, Issue, BlockerStatusInfo } from '../types';
import { isUpstreamActivelyBlocking } from './lifecycle';

/**
 * Checks if adding an edge (upstreamId BLOCKS downstreamId) would create a cycle.
 * In a directed graph where edge (u, v) means "u BLOCKS v" (u is prerequisite of v),
 * a cycle occurs if there is already a path from downstreamId to upstreamId
 * (i.e. downstreamId already directly or indirectly blocks upstreamId).
 */
export function wouldCreateCycle(
  upstreamId: string,
  downstreamId: string,
  dependencies: Dependency[],
  issuesMap: Map<string, Issue>
): { hasCycle: boolean; cyclePath?: string[] } {
  // Self dependency check
  if (upstreamId === downstreamId) {
    const issueKey = issuesMap.get(upstreamId)?.key || upstreamId;
    return {
      hasCycle: true,
      cyclePath: [issueKey, issueKey],
    };
  }

  // Duplicate check
  const duplicate = dependencies.some(
    d => d.upstreamIssueId === upstreamId && d.downstreamIssueId === downstreamId
  );
  if (duplicate) {
    const uKey = issuesMap.get(upstreamId)?.key || upstreamId;
    const vKey = issuesMap.get(downstreamId)?.key || downstreamId;
    return {
      hasCycle: true,
      cyclePath: [uKey, vKey],
    };
  }

  // Build adjacency list: u -> list of downstream v's
  const adj = new Map<string, string[]>();
  for (const dep of dependencies) {
    if (!adj.has(dep.upstreamIssueId)) {
      adj.set(dep.upstreamIssueId, []);
    }
    adj.get(dep.upstreamIssueId)!.push(dep.downstreamIssueId);
  }

  // Check if upstreamId is reachable from downstreamId (DFS/BFS)
  const visited = new Set<string>();
  const parentMap = new Map<string, string>();
  const queue: string[] = [downstreamId];
  visited.add(downstreamId);

  let pathFound = false;

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === upstreamId) {
      pathFound = true;
      break;
    }

    const neighbors = adj.get(current) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        parentMap.set(neighbor, current);
        queue.push(neighbor);
      }
    }
  }

  if (pathFound) {
    // Reconstruct path
    const pathKeys: string[] = [];
    let curr: string | undefined = upstreamId;
    while (curr) {
      const key = issuesMap.get(curr)?.key || curr;
      pathKeys.unshift(key);
      curr = parentMap.get(curr);
    }
    // Add the proposed new edge from upstream to downstream to show complete loop
    const downstreamKey = issuesMap.get(downstreamId)?.key || downstreamId;
    pathKeys.unshift(downstreamKey);

    return {
      hasCycle: true,
      cyclePath: pathKeys,
    };
  }

  return { hasCycle: false };
}

/**
 * Computes blocker details for a given issue:
 * - Active blockers: Upstream issues in BACKLOG, TODO, IN_PROGRESS, IN_REVIEW
 * - Resolved blockers: Upstream issues in DONE, CANCELLED (persisted, but inactive)
 * - Downstream issues: Issues that this issue blocks
 */
export function getBlockerStatus(
  issueId: string,
  issues: Issue[],
  dependencies: Dependency[]
): BlockerStatusInfo {
  const issuesMap = new Map(issues.map(i => [i.id, i]));

  // Upstream dependencies (Issues that BLOCK this issue)
  const upstreamDeps = dependencies.filter(d => d.downstreamIssueId === issueId);
  const activeBlockers: Issue[] = [];
  const resolvedBlockers: Issue[] = [];

  for (const dep of upstreamDeps) {
    const upstreamIssue = issuesMap.get(dep.upstreamIssueId);
    if (upstreamIssue) {
      if (isUpstreamActivelyBlocking(upstreamIssue.state)) {
        activeBlockers.push(upstreamIssue);
      } else {
        resolvedBlockers.push(upstreamIssue);
      }
    }
  }

  // Downstream dependencies (Issues BLOCKED BY this issue)
  const downstreamDeps = dependencies.filter(d => d.upstreamIssueId === issueId);
  const downstreamIssues: Issue[] = [];
  for (const dep of downstreamDeps) {
    const downstreamIssue = issuesMap.get(dep.downstreamIssueId);
    if (downstreamIssue) {
      downstreamIssues.push(downstreamIssue);
    }
  }

  return {
    activeCount: activeBlockers.length,
    resolvedCount: resolvedBlockers.length,
    activeBlockers,
    resolvedBlockers,
    downstreamIssues,
    isBlocked: activeBlockers.length > 0,
  };
}

/**
 * Hard Completion Guard:
 * Returns an error message if the issue cannot transition to DONE due to active blockers.
 */
export function validateHardCompletionGuard(
  issue: Issue,
  issues: Issue[],
  dependencies: Dependency[]
): { allowed: boolean; activeBlockers: Issue[]; errorMessage?: string } {
  const blockerInfo = getBlockerStatus(issue.id, issues, dependencies);

  if (blockerInfo.activeCount > 0) {
    const blockerList = blockerInfo.activeBlockers
      .map(b => `${b.key} — "${b.title}" (${b.state})`)
      .join('\n');

    return {
      allowed: false,
      activeBlockers: blockerInfo.activeBlockers,
      errorMessage: `Cannot complete this issue.\n\nBlocked by ${blockerInfo.activeCount} active prerequisite${
        blockerInfo.activeCount > 1 ? 's' : ''
      }:\n${blockerList}`,
    };
  }

  return {
    allowed: true,
    activeBlockers: [],
  };
}

export interface GraphNode {
  id: string;
  issue: Issue;
  level: number;
  x: number;
  y: number;
  inCriticalPath: boolean;
  activeBlockersCount: number;
  downstreamCount: number;
  isRoot: boolean;
  isLeaf: boolean;
}

export interface GraphEdge {
  id: string;
  upstreamId: string;
  downstreamId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  isActive: boolean;
  inCriticalPath: boolean;
  svgPath: string;
}

export interface DagGraphResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  criticalPathKeys: string[];
  width: number;
  height: number;
}

/**
 * Calculates a layered topological DAG layout and identifies the Critical Path
 * (longest chain of uncompleted dependencies).
 */
export function calculateDagGraph(
  issues: Issue[],
  dependencies: Dependency[],
  selectedTeamId: string = 'ALL'
): DagGraphResult {
  const issuesMap = new Map(issues.map(i => [i.id, i]));

  // Filter issues if team is selected
  const relevantIssues = selectedTeamId === 'ALL'
    ? issues
    : issues.filter(i => {
        if (i.teamId === selectedTeamId) return true;
        // Also include cross-team dependencies connected to this team
        return dependencies.some(
          d =>
            (d.upstreamIssueId === i.id && issuesMap.get(d.downstreamIssueId)?.teamId === selectedTeamId) ||
            (d.downstreamIssueId === i.id && issuesMap.get(d.upstreamIssueId)?.teamId === selectedTeamId)
        );
      });

  const relevantIds = new Set(relevantIssues.map(i => i.id));
  const relevantDeps = dependencies.filter(
    d => relevantIds.has(d.upstreamIssueId) && relevantIds.has(d.downstreamIssueId)
  );

  // Adjacency graph
  const adj = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const id of relevantIds) {
    adj.set(id, []);
    inDegree.set(id, 0);
  }

  for (const dep of relevantDeps) {
    adj.get(dep.upstreamIssueId)?.push(dep.downstreamIssueId);
    inDegree.set(dep.downstreamIssueId, (inDegree.get(dep.downstreamIssueId) || 0) + 1);
  }

  // Calculate topological levels (ranks)
  const levels = new Map<string, number>();
  for (const id of relevantIds) {
    levels.set(id, 0);
  }

  // Multi-pass relaxation to find maximum level (distance from root)
  let changed = true;
  let iterations = 0;
  while (changed && iterations < relevantIds.size + 1) {
    changed = false;
    iterations++;
    for (const dep of relevantDeps) {
      const uLevel = levels.get(dep.upstreamIssueId) || 0;
      const vLevel = levels.get(dep.downstreamIssueId) || 0;
      if (uLevel + 1 > vLevel) {
        levels.set(dep.downstreamIssueId, uLevel + 1);
        changed = true;
      }
    }
  }

  // Find Critical Path:
  // The critical path is the longest path of active (not yet completed) dependencies.
  let longestPath: string[] = [];

  function dfsPath(currId: string, currentPath: string[]) {
    const nextPath = [...currentPath, currId];
    if (nextPath.length > longestPath.length) {
      longestPath = nextPath;
    }

    const nextNodes = adj.get(currId) || [];
    for (const nextId of nextNodes) {
      const nextIssue = issuesMap.get(nextId);
      // Critical path tracks through active (uncompleted) work
      if (nextIssue && nextIssue.state !== 'DONE' && nextIssue.state !== 'CANCELLED') {
        dfsPath(nextId, nextPath);
      }
    }
  }

  // Start DFS from active root/starter nodes
  for (const id of relevantIds) {
    const issue = issuesMap.get(id);
    if (issue && issue.state !== 'DONE' && issue.state !== 'CANCELLED') {
      dfsPath(id, []);
    }
  }

  const criticalPathSet = new Set(longestPath);
  const criticalPathEdges = new Set<string>();
  for (let i = 0; i < longestPath.length - 1; i++) {
    criticalPathEdges.add(`${longestPath[i]}->${longestPath[i + 1]}`);
  }

  // Group nodes by level for layout
  const levelGroups = new Map<number, string[]>();
  for (const [id, lvl] of levels.entries()) {
    if (!levelGroups.has(lvl)) {
      levelGroups.set(lvl, []);
    }
    levelGroups.get(lvl)!.push(id);
  }

  const NODE_WIDTH = 260;
  const NODE_HEIGHT = 80;
  const X_SPACING = 340;
  const Y_SPACING = 100;
  const PADDING_X = 60;
  const PADDING_Y = 60;

  const nodePositions = new Map<string, { x: number; y: number }>();
  const nodes: GraphNode[] = [];

  let maxLevel = 0;
  let maxNodesInLevel = 0;

  for (const [lvl, nodeIds] of levelGroups.entries()) {
    if (lvl > maxLevel) maxLevel = lvl;
    if (nodeIds.length > maxNodesInLevel) maxNodesInLevel = nodeIds.length;

    nodeIds.forEach((id, rowIdx) => {
      const x = PADDING_X + lvl * X_SPACING;
      const y = PADDING_Y + rowIdx * Y_SPACING;
      nodePositions.set(id, { x, y });

      const issue = issuesMap.get(id)!;
      const blockerStatus = getBlockerStatus(id, issues, dependencies);

      nodes.push({
        id,
        issue,
        level: lvl,
        x,
        y,
        inCriticalPath: criticalPathSet.has(id),
        activeBlockersCount: blockerStatus.activeCount,
        downstreamCount: blockerStatus.downstreamIssues.length,
        isRoot: (inDegree.get(id) || 0) === 0,
        isLeaf: (adj.get(id) || []).length === 0,
      });
    });
  }

  // Create Edges with smooth Bezier curves
  const edges: GraphEdge[] = [];
  for (const dep of relevantDeps) {
    const fromPos = nodePositions.get(dep.upstreamIssueId);
    const toPos = nodePositions.get(dep.downstreamIssueId);
    if (!fromPos || !toPos) continue;

    const fromX = fromPos.x + NODE_WIDTH;
    const fromY = fromPos.y + NODE_HEIGHT / 2;
    const toX = toPos.x;
    const toY = toPos.y + NODE_HEIGHT / 2;

    const dx = Math.max(40, (toX - fromX) / 2);
    const svgPath = `M ${fromX} ${fromY} C ${fromX + dx} ${fromY}, ${toX - dx} ${toY}, ${toX} ${toY}`;

    const upstreamIssue = issuesMap.get(dep.upstreamIssueId);
    const isActive = upstreamIssue ? isUpstreamActivelyBlocking(upstreamIssue.state) : true;
    const isCritical = criticalPathEdges.has(`${dep.upstreamIssueId}->${dep.downstreamIssueId}`);

    edges.push({
      id: dep.id,
      upstreamId: dep.upstreamIssueId,
      downstreamId: dep.downstreamIssueId,
      fromX,
      fromY,
      toX,
      toY,
      isActive,
      inCriticalPath: isCritical,
      svgPath,
    });
  }

  const canvasWidth = Math.max(1100, PADDING_X * 2 + (maxLevel + 1) * X_SPACING);
  const canvasHeight = Math.max(600, PADDING_Y * 2 + maxNodesInLevel * Y_SPACING + 40);

  return {
    nodes,
    edges,
    criticalPathKeys: longestPath.map(id => issuesMap.get(id)?.key || id),
    width: canvasWidth,
    height: canvasHeight,
  };
}

