/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Project,
  Team,
  Issue,
  Dependency,
  User,
  Cycle,
  Milestone,
  ActivityEvent,
  IssueState,
  IssuePriority,
  BlockerStatusInfo,
} from '../../types';
import { getBlockerStatus } from '../../domain/dependency';

export interface ProjectDirectoryItem {
  project: Project;
  team?: Team;
  totalIssuesCount: number;
  activeIssuesCount: number;
  completedIssuesCount: number;
  blockedIssuesCount: number;
  blockingOthersCount: number;
  progressPercent: number;
  activeCycle?: Cycle;
  milestones: Milestone[];
  latestActivity?: ActivityEvent;
}

export interface ProjectDirectoryFilterParams {
  searchQuery?: string;
  teamId?: string;
  statusFilter?: 'ALL' | 'HAS_BLOCKERS' | 'ACTIVE';
}

export interface ProjectIssuesFilterParams {
  searchQuery?: string;
  state?: string;
  priority?: string;
  assigneeId?: string;
  blockerFilter?: string;
  cycleId?: string;
  sort?: string;
  group?: string;
}

export interface IssueGroup {
  id: string;
  title: string;
  subtitle?: string;
  count: number;
  issues: Issue[];
}

export interface ProjectOverviewData {
  needsAttention: Issue[];
  activeExecution: Issue[];
  blockingOthers: {
    issue: Issue;
    downstreamIssues: Issue[];
    activeDownstreamIssues: Issue[];
  }[];
  currentCycleIssues: Issue[];
  recentActivity: ActivityEvent[];
  activeCycle?: Cycle;
  summary: {
    totalIssues: number;
    activeIssues: number;
    blockedIssues: number;
    blockingDownstream: number;
    completedIssues: number;
  };
}

/**
 * Resolves project by key or ID case-insensitively.
 */
export function resolveProject(projects: Project[], projectKeyOrId?: string): Project | undefined {
  if (!projectKeyOrId) return undefined;
  const normalized = projectKeyOrId.trim().toLowerCase();
  return projects.find(
    p => p.key.toLowerCase() === normalized || p.id.toLowerCase() === normalized
  );
}

/**
 * Derives the Projects Directory dataset with execution metrics, blocker counts, and team cycles.
 */
export function selectProjectDirectory(
  projects: Project[],
  teams: Team[],
  allIssues: Issue[],
  dependencies: Dependency[],
  cycles: Cycle[] = [],
  milestones: Milestone[] = [],
  activityEvents: ActivityEvent[] = [],
  filters: ProjectDirectoryFilterParams = {}
): ProjectDirectoryItem[] {
  const teamsMap = new Map(teams.map(t => [t.id, t]));
  const activeCyclesByTeam = new Map<string, Cycle>();
  for (const c of cycles) {
    if (c.status === 'ACTIVE' && c.teamId) {
      activeCyclesByTeam.set(c.teamId, c);
    }
  }

  // Precompute blocker status for all workspace issues with full cross-project graph truth
  const blockerStatusMap = new Map(
    allIssues.map(issue => [issue.id, getBlockerStatus(issue.id, allIssues, dependencies)])
  );

  const query = (filters.searchQuery || '').trim().toLowerCase();
  const teamFilter = filters.teamId || 'ALL';
  const statusFilter = filters.statusFilter || 'ALL';

  return projects
    .map(project => {
      const team = teamsMap.get(project.teamId);
      const projectIssues = allIssues.filter(i => i.projectId === project.id);
      const activeIssues = projectIssues.filter(i => i.state !== 'DONE' && i.state !== 'CANCELLED');
      const completedIssues = projectIssues.filter(i => i.state === 'DONE');

      const blockedIssues = activeIssues.filter(
        i => blockerStatusMap.get(i.id)?.isBlocked ?? false
      );

      // Issues in this project that actively block other issues (cross-project or intra-project)
      const blockingOthers = activeIssues.filter(i => {
        const status = blockerStatusMap.get(i.id);
        return (
          status &&
          status.downstreamIssues.some(d => d.state !== 'DONE' && d.state !== 'CANCELLED')
        );
      });

      const totalCount = projectIssues.length;
      const progressPercent = totalCount > 0 ? Math.round((completedIssues.length / totalCount) * 100) : 0;
      const activeCycle = activeCyclesByTeam.get(project.teamId);

      const projectMilestoneIds = new Set(projectIssues.map(i => i.milestoneId).filter(Boolean));
      const projectMilestones = milestones.filter(m => projectMilestoneIds.has(m.id));

      const projectIssueIds = new Set(projectIssues.map(i => i.id));
      const latestActivity = activityEvents.find(
        e => e.issueId && projectIssueIds.has(e.issueId)
      );

      return {
        project,
        team,
        totalIssuesCount: totalCount,
        activeIssuesCount: activeIssues.length,
        completedIssuesCount: completedIssues.length,
        blockedIssuesCount: blockedIssues.length,
        blockingOthersCount: blockingOthers.length,
        progressPercent,
        activeCycle,
        milestones: projectMilestones,
        latestActivity,
      };
    })
    .filter(item => {
      // 1. Team filter
      if (teamFilter !== 'ALL' && item.project.teamId !== teamFilter) {
        return false;
      }

      // 2. Status / Attention filter
      if (statusFilter === 'HAS_BLOCKERS' && item.blockedIssuesCount === 0) {
        return false;
      }
      if (statusFilter === 'ACTIVE' && item.activeIssuesCount === 0) {
        return false;
      }

      // 3. Search query
      if (query) {
        const matchesName = item.project.name.toLowerCase().includes(query);
        const matchesKey = item.project.key.toLowerCase().includes(query);
        const matchesDesc = (item.project.description || '').toLowerCase().includes(query);
        const matchesTeam = (item.team?.name || '').toLowerCase().includes(query);
        if (!matchesName && !matchesKey && !matchesDesc && !matchesTeam) {
          return false;
        }
      }

      return true;
    });
}

/**
 * Priority numeric rank for deterministic sorting (lower is higher priority).
 */
const PRIORITY_ORDER: Record<IssuePriority, number> = {
  URGENT: 1,
  HIGH: 2,
  MEDIUM: 3,
  LOW: 4,
};

/**
 * Canonical lifecycle state display order.
 */
export const LIFECYCLE_ORDER: IssueState[] = [
  'BACKLOG',
  'TODO',
  'IN_PROGRESS',
  'IN_REVIEW',
  'DONE',
  'CANCELLED',
];

/**
 * Filter, sort, and group issues belonging to a project.
 * Preserves cross-project dependency truth by computing blockers against the full workspace dataset.
 */
export function selectProjectIssues(
  project: Project,
  allIssues: Issue[],
  dependencies: Dependency[],
  users: User[] = [],
  cycles: Cycle[] = [],
  milestones: Milestone[] = [],
  filters: ProjectIssuesFilterParams = {}
): {
  filteredIssues: Issue[];
  groupedIssues: IssueGroup[];
  blockerStatusMap: Map<string, BlockerStatusInfo>;
  totalProjectIssuesCount: number;
} {
  const projectIssues = allIssues.filter(i => i.projectId === project.id);
  const totalProjectIssuesCount = projectIssues.length;

  // Compute full dependency graph across ALL workspace issues
  const blockerStatusMap = new Map(
    allIssues.map(issue => [issue.id, getBlockerStatus(issue.id, allIssues, dependencies)])
  );

  const rawSearch = (filters.searchQuery || '').trim();
  const stateFilter = filters.state || 'ALL';
  const priorityFilter = filters.priority || 'ALL';
  const assigneeFilter = filters.assigneeId || 'ALL';
  const blockerFilter = filters.blockerFilter || 'ALL';
  const cycleFilter = filters.cycleId || 'ALL';
  const sortMode = filters.sort || 'manual';
  const groupMode = filters.group || 'none';

  // Parse advanced search syntax tokens if present
  let textQuery = rawSearch;
  let syntaxBlocker: 'blocked' | 'unblocked' | 'blocker' | null = null;
  let syntaxPriority: string | null = null;
  let syntaxState: string | null = null;
  let syntaxTeam: string | null = null;

  if (rawSearch) {
    const tokens = rawSearch.split(/\s+/);
    const textTokens: string[] = [];

    for (const token of tokens) {
      const lower = token.toLowerCase();
      if (lower === 'is:blocked') {
        syntaxBlocker = 'blocked';
      } else if (lower === 'is:unblocked') {
        syntaxBlocker = 'unblocked';
      } else if (lower === 'is:blocker' || lower === 'has:downstream') {
        syntaxBlocker = 'blocker';
      } else if (lower.startsWith('priority:')) {
        syntaxPriority = lower.replace('priority:', '').toUpperCase();
      } else if (lower.startsWith('state:') || lower.startsWith('status:')) {
        syntaxState = lower.replace(/^status:|^state:/, '').toUpperCase();
      } else if (lower.startsWith('team:')) {
        syntaxTeam = lower.replace('team:', '').toLowerCase();
      } else {
        textTokens.push(token);
      }
    }
    textQuery = textTokens.join(' ').toLowerCase();
  }

  // 1. Filter issues
  const filteredIssues = projectIssues.filter(issue => {
    const blockerInfo = blockerStatusMap.get(issue.id);

    // Advanced search syntax: is:blocked, is:unblocked, is:blocker
    if (syntaxBlocker === 'blocked' && (!blockerInfo || !blockerInfo.isBlocked)) return false;
    if (syntaxBlocker === 'unblocked' && blockerInfo && blockerInfo.isBlocked) return false;
    if (
      syntaxBlocker === 'blocker' &&
      (!blockerInfo ||
        !blockerInfo.downstreamIssues.some(d => d.state !== 'DONE' && d.state !== 'CANCELLED'))
    ) {
      return false;
    }

    // Advanced search syntax: priority:...
    if (syntaxPriority && issue.priority !== syntaxPriority) return false;

    // Advanced search syntax: state:...
    if (syntaxState && issue.state !== syntaxState) return false;

    // Advanced search syntax: team:...
    if (syntaxTeam) {
      const teamMatch =
        issue.teamId.toLowerCase() === syntaxTeam ||
        issue.teamId.toLowerCase().replace('team_', '') === syntaxTeam;
      if (!teamMatch) return false;
    }

    // Standard State filter
    if (stateFilter !== 'ALL' && issue.state !== stateFilter) return false;

    // Standard Priority filter
    if (priorityFilter !== 'ALL' && issue.priority !== priorityFilter) return false;

    // Standard Assignee filter
    if (assigneeFilter !== 'ALL') {
      if (assigneeFilter === 'UNASSIGNED') {
        if (issue.assigneeId) return false;
      } else if (issue.assigneeId !== assigneeFilter) {
        return false;
      }
    }

    // Standard Blocker filter
    if (blockerFilter === 'BLOCKED_ONLY') {
      if (!blockerInfo || !blockerInfo.isBlocked) return false;
    } else if (blockerFilter === 'UNBLOCKED_ONLY') {
      if (blockerInfo && blockerInfo.isBlocked) return false;
    } else if (blockerFilter === 'BLOCKING_OTHERS') {
      if (
        !blockerInfo ||
        !blockerInfo.downstreamIssues.some(d => d.state !== 'DONE' && d.state !== 'CANCELLED')
      ) {
        return false;
      }
    }

    // Standard Cycle filter
    if (cycleFilter !== 'ALL') {
      if (cycleFilter === 'UNSCHEDULED') {
        if (issue.cycleId) return false;
      } else if (issue.cycleId !== cycleFilter) {
        return false;
      }
    }

    // Free text match on key, title, description
    if (textQuery) {
      const matchKey = issue.key.toLowerCase().includes(textQuery);
      const matchTitle = issue.title.toLowerCase().includes(textQuery);
      const matchDesc = (issue.description || '').toLowerCase().includes(textQuery);
      if (!matchKey && !matchTitle && !matchDesc) return false;
    }

    return true;
  });

  // 2. Sort issues deterministically
  const sortedIssues = [...filteredIssues].sort((a, b) => {
    switch (sortMode) {
      case 'priority': {
        const rankA = PRIORITY_ORDER[a.priority] ?? 99;
        const rankB = PRIORITY_ORDER[b.priority] ?? 99;
        if (rankA !== rankB) return rankA - rankB;
        // Tie-breaker: updatedAt desc, then key asc
        return (b.updatedAt || '').localeCompare(a.updatedAt || '') || a.key.localeCompare(b.key);
      }
      case 'updated': {
        const dateA = a.updatedAt || a.createdAt;
        const dateB = b.updatedAt || b.createdAt;
        return dateB.localeCompare(dateA) || a.key.localeCompare(b.key);
      }
      case 'created': {
        return b.createdAt.localeCompare(a.createdAt) || a.key.localeCompare(b.key);
      }
      case 'dueDate': {
        if (!a.dueDate && !b.dueDate) return a.key.localeCompare(b.key);
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate) || a.key.localeCompare(b.key);
      }
      case 'manual':
      default: {
        // Natural project order (by key number/createdAt)
        return a.key.localeCompare(b.key);
      }
    }
  });

  // 3. Group issues if grouping requested
  let groupedIssues: IssueGroup[] = [];

  if (groupMode === 'state') {
    const STATE_LABELS: Record<IssueState, string> = {
      BACKLOG: 'Backlog',
      TODO: 'To Do',
      IN_PROGRESS: 'In Progress',
      IN_REVIEW: 'In Review',
      DONE: 'Done',
      CANCELLED: 'Cancelled',
    };
    groupedIssues = LIFECYCLE_ORDER.map(st => {
      const groupItems = sortedIssues.filter(i => i.state === st);
      return {
        id: st,
        title: STATE_LABELS[st],
        count: groupItems.length,
        issues: groupItems,
      };
    }).filter(g => g.count > 0 || g.id === 'TODO' || g.id === 'IN_PROGRESS');
  } else if (groupMode === 'priority') {
    const priorities: IssuePriority[] = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];
    groupedIssues = priorities.map(p => {
      const groupItems = sortedIssues.filter(i => i.priority === p);
      return {
        id: p,
        title: p.charAt(0) + p.slice(1).toLowerCase(),
        count: groupItems.length,
        issues: groupItems,
      };
    }).filter(g => g.count > 0);
  } else if (groupMode === 'assignee') {
    const usersMap = new Map(users.map(u => [u.id, u]));
    const assignedGroups = users.map(user => {
      const groupItems = sortedIssues.filter(i => i.assigneeId === user.id);
      return {
        id: user.id,
        title: user.name,
        subtitle: user.email,
        count: groupItems.length,
        issues: groupItems,
      };
    }).filter(g => g.count > 0);

    const unassignedItems = sortedIssues.filter(i => !i.assigneeId);
    if (unassignedItems.length > 0) {
      assignedGroups.push({
        id: 'unassigned',
        title: 'Unassigned',
        subtitle: 'No owner allocated',
        count: unassignedItems.length,
        issues: unassignedItems,
      });
    }
    groupedIssues = assignedGroups;
  } else if (groupMode === 'cycle') {
    const cyclesMap = new Map(cycles.map(c => [c.id, c]));
    const cycleGroups = cycles.map(cycle => {
      const groupItems = sortedIssues.filter(i => i.cycleId === cycle.id);
      return {
        id: cycle.id,
        title: cycle.name,
        subtitle: cycle.status === 'ACTIVE' ? 'Active Cycle' : cycle.status,
        count: groupItems.length,
        issues: groupItems,
      };
    }).filter(g => g.count > 0);

    const unscheduledItems = sortedIssues.filter(i => !i.cycleId);
    if (unscheduledItems.length > 0) {
      cycleGroups.push({
        id: 'unscheduled',
        title: 'Unscheduled',
        subtitle: 'Backlog triage',
        count: unscheduledItems.length,
        issues: unscheduledItems,
      });
    }
    groupedIssues = cycleGroups;
  } else {
    // Single flat default group
    groupedIssues = [
      {
        id: 'all',
        title: 'All Issues',
        count: sortedIssues.length,
        issues: sortedIssues,
      },
    ];
  }

  return {
    filteredIssues: sortedIssues,
    groupedIssues,
    blockerStatusMap,
    totalProjectIssuesCount,
  };
}

/**
 * Derives operational Project Overview data (Needs Attention, Active Execution, Blocking Others, Current Cycle, Activity).
 */
export function selectProjectOverview(
  project: Project,
  allIssues: Issue[],
  dependencies: Dependency[],
  users: User[] = [],
  cycles: Cycle[] = [],
  milestones: Milestone[] = [],
  activityEvents: ActivityEvent[] = [],
  todayDateStr: string = new Date().toISOString().split('T')[0]
): ProjectOverviewData {
  const projectIssues = allIssues.filter(i => i.projectId === project.id);

  // Compute full dependency graph across ALL workspace issues
  const blockerStatusMap = new Map(
    allIssues.map(issue => [issue.id, getBlockerStatus(issue.id, allIssues, dependencies)])
  );

  const activeCyclesByTeam = new Map<string, Cycle>();
  for (const c of cycles) {
    if (c.status === 'ACTIVE' && c.teamId) {
      activeCyclesByTeam.set(c.teamId, c);
    }
  }
  const activeCycle = activeCyclesByTeam.get(project.teamId);

  const needsAttention: Issue[] = [];
  const activeExecution: Issue[] = [];
  const currentCycleIssues: Issue[] = [];
  const blockingOthers: ProjectOverviewData['blockingOthers'] = [];

  for (const issue of projectIssues) {
    if (issue.state === 'CANCELLED') continue;

    const blockerInfo = blockerStatusMap.get(issue.id);
    const isBlocked = blockerInfo?.isBlocked ?? false;
    const isUrgent = issue.priority === 'URGENT';
    const isDueSoonOrOverdue =
      Boolean(issue.dueDate) && issue.dueDate! <= todayDateStr && issue.state !== 'DONE';

    // 1. Needs Attention (Blocked, Urgent, or Due/Overdue)
    if (issue.state !== 'DONE' && (isBlocked || isUrgent || isDueSoonOrOverdue)) {
      needsAttention.push(issue);
    }

    // 2. Active Execution (In Progress or In Review)
    if (issue.state === 'IN_PROGRESS' || issue.state === 'IN_REVIEW') {
      activeExecution.push(issue);
    }

    // 3. Current Cycle (Scheduled in team's active cycle)
    if (activeCycle && issue.cycleId === activeCycle.id) {
      currentCycleIssues.push(issue);
    }

    // 4. Blocking Others (Dependency-impact surface: this issue blocks others)
    if (issue.state !== 'DONE' && blockerInfo && blockerInfo.downstreamIssues.length > 0) {
      const activeDownstream = blockerInfo.downstreamIssues.filter(
        d => d.state !== 'DONE' && d.state !== 'CANCELLED'
      );
      if (activeDownstream.length > 0) {
        blockingOthers.push({
          issue,
          downstreamIssues: blockerInfo.downstreamIssues,
          activeDownstreamIssues: activeDownstream,
        });
      }
    }
  }

  // Filter recent activity to events referencing this project's issues
  const projectIssueIds = new Set(projectIssues.map(i => i.id));
  const recentActivity = activityEvents
    .filter(e => e.issueId && projectIssueIds.has(e.issueId))
    .slice(0, 10);

  const activeIssues = projectIssues.filter(i => i.state !== 'DONE' && i.state !== 'CANCELLED');
  const completedIssues = projectIssues.filter(i => i.state === 'DONE');
  const blockedCount = projectIssues.filter(
    i => i.state !== 'DONE' && (blockerStatusMap.get(i.id)?.isBlocked ?? false)
  ).length;

  const totalBlockingDownstream = blockingOthers.reduce(
    (sum, item) => sum + item.activeDownstreamIssues.length,
    0
  );

  return {
    needsAttention,
    activeExecution,
    blockingOthers,
    currentCycleIssues,
    recentActivity,
    activeCycle,
    summary: {
      totalIssues: projectIssues.length,
      activeIssues: activeIssues.length,
      blockedIssues: blockedCount,
      blockingDownstream: totalBlockingDownstream,
      completedIssues: completedIssues.length,
    },
  };
}

/**
 * Derives the Project Board dataset with issues partitioned into canonical lifecycle columns.
 */
export function selectProjectBoard(
  project: Project,
  allIssues: Issue[],
  dependencies: Dependency[],
  filters: ProjectIssuesFilterParams = {}
): {
  columns: { state: IssueState; issues: Issue[] }[];
  blockerStatusMap: Map<string, BlockerStatusInfo>;
  totalIssuesCount: number;
} {
  const { filteredIssues, blockerStatusMap } = selectProjectIssues(
    project,
    allIssues,
    dependencies,
    [],
    [],
    [],
    filters
  );

  const boardStates: IssueState[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

  const columns = boardStates.map(state => ({
    state,
    issues: filteredIssues.filter(i => i.state === state),
  }));

  return {
    columns,
    blockerStatusMap,
    totalIssuesCount: filteredIssues.length,
  };
}
