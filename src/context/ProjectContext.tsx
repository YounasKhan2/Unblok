import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Issue,
  Dependency,
  Team,
  Project,
  User,
  ActivityEvent,
  IssueState,
  IssuePriority,
  ViewMode,
  FilterState,
  BlockerStatusInfo,
  SavedView,
  Cycle,
  Milestone,
  IssueComment,
  UserRole,
} from '../types';
import {
  INITIAL_ISSUES,
  INITIAL_DEPENDENCIES,
  INITIAL_TEAMS,
  INITIAL_PROJECTS,
  INITIAL_USERS,
  INITIAL_ACTIVITIES,
  INITIAL_CYCLES,
  INITIAL_MILESTONES,
  INITIAL_COMMENTS,
} from '../data/mockData';
import {
  MULTI_WORKSPACE_INITIAL_ISSUES,
  MULTI_WORKSPACE_INITIAL_DEPENDENCIES,
  MULTI_WORKSPACE_INITIAL_TEAMS,
  MULTI_WORKSPACE_INITIAL_PROJECTS,
  MULTI_WORKSPACE_INITIAL_ACTIVITIES,
  MULTI_WORKSPACE_INITIAL_CYCLES,
  MULTI_WORKSPACE_INITIAL_MILESTONES,
  MULTI_WORKSPACE_INITIAL_COMMENTS,
} from '../features/workspaces/data/multiWorkspaceMockData';
import { useWorkspace } from '../features/workspaces/context/WorkspaceContext';
import { canTransition } from '../domain/lifecycle';
import {
  getBlockerStatus,
  validateHardCompletionGuard,
  wouldCreateCycle,
} from '../domain/dependency';
import { createActivityEvent, checkBlockerBoundaryEvents } from '../domain/audit';
import { canMutatePlanning } from '../features/planning/permissions';
import {
  canAssignIssueToCycle,
  validateRollover,
  isIssueCompletedForPlanning,
} from '../features/planning/domain/cycleInvariants';
import {
  executeCompleteCycle,
  executeCreateCycle,
  executeUpdateCycle,
  executeUpdateIssueCycle,
  executeUpdateIssueMilestone,
  executeCreateMilestone,
  executeUpdateMilestone,
  executeUpdateIssueDates,
} from '../features/planning/domain/planningMutations';
import {
  UNBLOK_STORAGE_NAMESPACE,
  migrateStorageNamespace,
  clearAllStoredEntities,
} from './storageMigration';
import {
  executeAddComment,
  executeDeleteComment,
} from '../features/collaboration/domain/collaborationMutations';

interface CompletionGuardError {
  issue: Issue;
  blockers: Issue[];
  message: string;
}

interface CycleError {
  cyclePath: string[];
  message: string;
}

function mergeSeedRecordsById<T extends { id: string }>(stored: T[] | null, seeds: T[]): T[] {
  if (!stored) return seeds;
  const storedIds = new Set(stored.map(item => item.id));
  const missingSeeds = seeds.filter(item => !storedIds.has(item.id));
  return missingSeeds.length > 0 ? [...stored, ...missingSeeds] : stored;
}

export const DEFAULT_SAVED_VIEWS: SavedView[] = [
  {
    id: 'view_critical_blockers',
    name: 'Critical Path Blockers',
    isSystem: true,
    viewMode: 'LIST',
    filters: {
      searchQuery: '',
      state: 'ALL',
      priority: 'ALL',
      assigneeId: 'ALL',
      projectId: 'ALL',
      teamId: 'ALL',
      blockerFilter: 'BLOCKED_ONLY',
    },
  },
  {
    id: 'view_ready_dev',
    name: 'Ready for Dev (Unblocked)',
    isSystem: true,
    viewMode: 'LIST',
    filters: {
      searchQuery: '',
      state: 'TODO',
      priority: 'ALL',
      assigneeId: 'ALL',
      projectId: 'ALL',
      teamId: 'ALL',
      blockerFilter: 'UNBLOCKED_ONLY',
    },
  },
  {
    id: 'view_outbound_blockers',
    name: 'Cross-Team Delivery Bottlenecks',
    isSystem: true,
    viewMode: 'GRAPH',
    filters: {
      searchQuery: '',
      state: 'ALL',
      priority: 'ALL',
      assigneeId: 'ALL',
      projectId: 'ALL',
      teamId: 'ALL',
      blockerFilter: 'HAS_DOWNSTREAM',
    },
  },
];

interface ProjectContextType {
  issues: Issue[];
  dependencies: Dependency[];
  teams: Team[];
  projects: Project[];
  users: User[];
  activities: ActivityEvent[];
  currentUser: User;
  setCurrentUser: (user: User) => void;
  updateCanonicalTeams: (teams: Team[]) => void;
  updateCanonicalUsers: (users: User[]) => void;

  // Selection & Navigation
  selectedIssueId: string | null;
  selectedIssue: Issue | null;
  setSelectedIssueId: (id: string | null) => void;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  navigateIssue: (direction: 1 | -1) => void;

  // Multi-Selection for Bulk Operations
  selectedIssueIds: string[];
  toggleSelectIssue: (id: string, isShift?: boolean) => void;
  selectAllIssues: () => void;
  clearSelection: () => void;
  bulkUpdateState: (newState: IssueState) => { updated: number; blocked: number };
  bulkUpdatePriority: (newPriority: IssuePriority) => void;
  bulkUpdateAssignee: (assigneeId?: string) => void;
  bulkAddBlocker: (upstreamId: string) => { added: number; failed: number };

  // Layout & Views
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isNavCollapsed: boolean;
  setIsNavCollapsed: (collapsed: boolean) => void;

  // Filters & Saved Views
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
  filteredIssues: Issue[];
  savedViews: SavedView[];
  activeSavedViewId: string | null;
  applySavedView: (view: SavedView) => void;
  saveCurrentView: (name: string) => void;
  saveSavedView: (view: SavedView) => void;
  deleteSavedView: (viewId: string) => void;

  // Cycles & Sprints (Phase B — Planning)
  cycles: Cycle[];
  activeCycle: Cycle | null;
  updateIssueCycle: (issueId: string, cycleId?: string) => boolean;
  bulkUpdateCycle: (cycleId?: string) => void;
  rolloverIncompleteIssues: (fromCycleId: string, toCycleId: string) => { rolledCount: number };
  createCycle: (data: {
    name: string;
    startDate: string;
    endDate: string;
    teamId?: string;
    status?: 'ACTIVE' | 'UPCOMING' | 'COMPLETED';
    description?: string;
  }) => Cycle | null;
  updateCycle: (id: string, updates: Partial<Cycle>) => boolean;
  completeCycle: (
    cycleId: string,
    rolloverData?: { targetCycleId?: string; issueIdsToRollover?: string[] }
  ) => { success: boolean; rolledCount: number; error?: string };

  // Strategic Milestones (Phase B.2 — Objectives)
  milestones: Milestone[];
  updateIssueMilestone: (issueId: string, milestoneId?: string) => boolean;
  createMilestone: (data: { name: string; targetDate: string; description: string; teamId?: string }) => Milestone | null;
  updateMilestone: (id: string, updates: Partial<Milestone>) => boolean;

  // Collaboration & Threaded Comments (Phase C)
  comments: IssueComment[];
  addComment: (
    issueId: string,
    content: string,
    parentId?: string,
    mentionIds?: string[]
  ) => IssueComment | null;
  deleteComment: (commentId: string) => boolean;

  // Issue Operations
  updateIssueState: (issueId: string, newState: IssueState) => boolean;
  updateIssuePriority: (issueId: string, newPriority: IssuePriority) => void;
  updateIssueAssignee: (issueId: string, assigneeId?: string) => void;
  updateIssueDetails: (issueId: string, title: string, description: string) => void;
  updateIssueDates: (issueId: string, startDate?: string, dueDate?: string) => boolean;
  createIssue: (data: {
    title: string;
    description: string;
    projectId: string;
    priority: IssuePriority;
    assigneeId?: string;
    upstreamBlockerId?: string;
  }) => Issue;

  // Dependency Operations
  addDependency: (upstreamId: string, downstreamId: string) => boolean;
  removeDependency: (dependencyId: string) => void;
  getIssueBlockerStatus: (issueId: string) => BlockerStatusInfo;

  // Guard & Cycle error dialog states
  completionGuardError: CompletionGuardError | null;
  clearCompletionGuardError: () => void;
  cycleError: CycleError | null;
  clearCycleError: () => void;

  // Reset
  resetToDemoData: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// Perform one-time migration of any legacy Kite prototype data to Unblok
migrateStorageNamespace();

const STORAGE_KEY = UNBLOK_STORAGE_NAMESPACE;

/**
 * Deterministically normalizes a user's team memberships into canonical `teamIds: string[]`.
 * Ensures uniqueness, non-empty IDs, and provides legacy `teamId` backwards compatibility.
 */
export function normalizeUserMemberships(user: any): User & { teamIds: string[] } {
  if (!user) return { ...INITIAL_USERS[0], teamIds: INITIAL_USERS[0].teamIds || ['team_eng'] };
  const rawTeamIds = Array.isArray(user.teamIds)
    ? user.teamIds
    : user.teamId
    ? [user.teamId]
    : [];
  const teamIds = Array.from(
    new Set(rawTeamIds.filter((t: any) => typeof t === 'string' && t.trim().length > 0))
  );
  return {
    ...user,
    teamIds,
    teamId: teamIds[0] || user.teamId || '',
  };
}

export function normalizeUsersList(users: any[]): (User & { teamIds: string[] })[] {
  if (!Array.isArray(users)) return INITIAL_USERS.map(normalizeUserMemberships);
  return users.map(normalizeUserMemberships);
}

function ensureWorkspaceTag<T extends { workspaceId?: string }>(items: T[]): T[] {
  return items.map((item) => (item.workspaceId ? item : { ...item, workspaceId: 'ws_acme' }));
}

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Section 6: Resolve active workspace context
  let activeWorkspaceId = 'ws_acme';
  let activeMembershipRole: UserRole | undefined;
  try {
    const ws = useWorkspace();
    activeWorkspaceId = ws.activeWorkspaceId || 'ws_acme';
    activeMembershipRole = ws.activeMembership?.role;
  } catch {
    // Graceful fallback for test environments without WorkspaceProvider
    activeWorkspaceId = 'ws_acme';
  }

  // Load master states from localStorage or initialize with multi-workspace seeds
  const [masterIssues, setMasterIssues] = useState<Issue[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_issues`);
      const parsed = stored ? JSON.parse(stored) : null;
      return ensureWorkspaceTag(mergeSeedRecordsById(parsed, MULTI_WORKSPACE_INITIAL_ISSUES));
    } catch {
      return MULTI_WORKSPACE_INITIAL_ISSUES;
    }
  });

  const [masterDependencies, setMasterDependencies] = useState<Dependency[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_dependencies`);
      const parsed = stored ? JSON.parse(stored) : null;
      return ensureWorkspaceTag(mergeSeedRecordsById(parsed, MULTI_WORKSPACE_INITIAL_DEPENDENCIES));
    } catch {
      return MULTI_WORKSPACE_INITIAL_DEPENDENCIES;
    }
  });

  const [masterProjects, setMasterProjects] = useState<Project[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_projects`);
      const parsed = stored ? JSON.parse(stored) : null;
      return ensureWorkspaceTag(mergeSeedRecordsById(parsed, MULTI_WORKSPACE_INITIAL_PROJECTS));
    } catch {
      return MULTI_WORKSPACE_INITIAL_PROJECTS;
    }
  });

  const [masterActivities, setMasterActivities] = useState<ActivityEvent[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_activities`);
      const parsed = stored ? JSON.parse(stored) : null;
      return ensureWorkspaceTag(mergeSeedRecordsById(parsed, MULTI_WORKSPACE_INITIAL_ACTIVITIES));
    } catch {
      return MULTI_WORKSPACE_INITIAL_ACTIVITIES;
    }
  });

  const [masterTeams, setMasterTeams] = useState<Team[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_teams`);
      const parsed = stored ? JSON.parse(stored) : null;
      return ensureWorkspaceTag(mergeSeedRecordsById(parsed, MULTI_WORKSPACE_INITIAL_TEAMS));
    } catch {
      return MULTI_WORKSPACE_INITIAL_TEAMS;
    }
  });

  const [users, setUsers] = useState<User[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_users`);
      return stored ? normalizeUsersList(JSON.parse(stored)) : normalizeUsersList(INITIAL_USERS);
    } catch {
      return normalizeUsersList(INITIAL_USERS);
    }
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_current_user`);
      return stored ? normalizeUserMemberships(JSON.parse(stored)) : normalizeUserMemberships(INITIAL_USERS[0]);
    } catch {
      return normalizeUserMemberships(INITIAL_USERS[0]);
    }
  });

  const updateCanonicalTeams = useCallback((newTeams: Team[]) => {
    const tagged = ensureWorkspaceTag(newTeams);
    setMasterTeams(tagged);
    try {
      localStorage.setItem(`${STORAGE_KEY}_teams`, JSON.stringify(tagged));
    } catch (e) {
      console.warn('Failed to persist teams:', e);
    }
  }, []);

  const updateCanonicalUsers = useCallback((newUsers: User[]) => {
    const normalized = normalizeUsersList(newUsers);
    setUsers(normalized);
    try {
      localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(normalized));
    } catch (e) {
      console.warn('Failed to persist users:', e);
    }
    // Also keep currentUser updated if their role or info changed
    setCurrentUser(prev => {
      const updated = normalized.find(u => u.id === prev.id) || prev;
      try {
        localStorage.setItem(`${STORAGE_KEY}_current_user`, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to persist current user:', e);
      }
      return updated;
    });
  }, []);

  const handleSetCurrentUser = useCallback((user: User) => {
    const normalized = normalizeUserMemberships(user);
    setCurrentUser(normalized);
    try {
      localStorage.setItem(`${STORAGE_KEY}_current_user`, JSON.stringify(normalized));
    } catch (e) {
      console.warn('Failed to persist current user:', e);
    }
  }, []);

  // UI state
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(INITIAL_ISSUES[1].id);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<ViewMode>('LIST');
  const [isNavCollapsed, setIsNavCollapsed] = useState<boolean>(false);

  // Multi-selection state
  const [selectedIssueIds, setSelectedIssueIds] = useState<string[]>([]);

  // Saved Views state
  const [savedViews, setSavedViews] = useState<SavedView[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_saved_views`);
      return stored ? JSON.parse(stored) : DEFAULT_SAVED_VIEWS;
    } catch {
      return DEFAULT_SAVED_VIEWS;
    }
  });
  const [activeSavedViewId, setActiveSavedViewId] = useState<string | null>(null);

  // Error modal states
  const [completionGuardError, setCompletionGuardError] = useState<CompletionGuardError | null>(null);
  const [cycleError, setCycleError] = useState<CycleError | null>(null);

  // Cycles master state
  const [masterCycles, setMasterCycles] = useState<Cycle[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_cycles`);
      const parsed = stored ? JSON.parse(stored) : null;
      return ensureWorkspaceTag(mergeSeedRecordsById(parsed, MULTI_WORKSPACE_INITIAL_CYCLES));
    } catch {
      return MULTI_WORKSPACE_INITIAL_CYCLES;
    }
  });

  // Milestones master state
  const [masterMilestones, setMasterMilestones] = useState<Milestone[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_milestones`);
      const parsed = stored ? JSON.parse(stored) : null;
      return ensureWorkspaceTag(mergeSeedRecordsById(parsed, MULTI_WORKSPACE_INITIAL_MILESTONES));
    } catch {
      return MULTI_WORKSPACE_INITIAL_MILESTONES;
    }
  });

  // Comments master state
  const [masterComments, setMasterComments] = useState<IssueComment[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_comments`);
      const parsed = stored ? JSON.parse(stored) : null;
      return ensureWorkspaceTag(mergeSeedRecordsById(parsed, MULTI_WORKSPACE_INITIAL_COMMENTS));
    } catch {
      return MULTI_WORKSPACE_INITIAL_COMMENTS;
    }
  });

  // State mutator aliases for existing internal actions
  const setIssues = setMasterIssues;
  const setDependencies = setMasterDependencies;
  const setProjects = setMasterProjects;
  const setTeams = setMasterTeams;
  const setActivities = setMasterActivities;
  const setCycles = setMasterCycles;
  const setMilestones = setMasterMilestones;
  const setComments = setMasterComments;

  // Section 10 & 11: Active Workspace Scoped Projections
  const issues = useMemo(
    () => masterIssues.filter((i) => (i.workspaceId || 'ws_acme') === activeWorkspaceId),
    [masterIssues, activeWorkspaceId]
  );

  const projects = useMemo(
    () => masterProjects.filter((p) => (p.workspaceId || 'ws_acme') === activeWorkspaceId),
    [masterProjects, activeWorkspaceId]
  );

  const teams = useMemo(
    () => masterTeams.filter((t) => (t.workspaceId || 'ws_acme') === activeWorkspaceId),
    [masterTeams, activeWorkspaceId]
  );

  const cycles = useMemo(
    () => masterCycles.filter((c) => (c.workspaceId || 'ws_acme') === activeWorkspaceId),
    [masterCycles, activeWorkspaceId]
  );

  const milestones = useMemo(
    () => masterMilestones.filter((m) => (m.workspaceId || 'ws_acme') === activeWorkspaceId),
    [masterMilestones, activeWorkspaceId]
  );

  const dependencies = useMemo(() => {
    const scopedIssueIds = new Set(issues.map((i) => i.id));
    return masterDependencies.filter(
      (d) =>
        (d.workspaceId || 'ws_acme') === activeWorkspaceId &&
        scopedIssueIds.has(d.upstreamIssueId) &&
        scopedIssueIds.has(d.downstreamIssueId)
    );
  }, [masterDependencies, issues, activeWorkspaceId]);

  const activities = useMemo(
    () => masterActivities.filter((a) => (a.workspaceId || 'ws_acme') === activeWorkspaceId),
    [masterActivities, activeWorkspaceId]
  );

  const comments = useMemo(
    () => masterComments.filter((c) => (c.workspaceId || 'ws_acme') === activeWorkspaceId),
    [masterComments, activeWorkspaceId]
  );

  const activeCycle = useMemo(
    () => cycles.find((c) => c.status === 'ACTIVE') || cycles[0] || null,
    [cycles]
  );

  // Filters state
  const initialFilters: FilterState = {
    searchQuery: '',
    state: 'ALL',
    priority: 'ALL',
    assigneeId: 'ALL',
    projectId: 'ALL',
    teamId: 'ALL',
    cycleId: 'ALL',
    milestoneId: 'ALL',
    blockerFilter: 'ALL',
  };
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  // Section 33: Clear transient drawer and filters on workspace switch
  useEffect(() => {
    setSelectedIssueIds([]);
    setIsDrawerOpen(false);
    setActiveSavedViewId(null);
    setFilters(initialFilters);
  }, [activeWorkspaceId]);

  // Section 14: Synchronize role from active membership
  useEffect(() => {
    if (activeMembershipRole && currentUser.role !== activeMembershipRole) {
      setCurrentUser((prev) => ({ ...prev, role: activeMembershipRole }));
    }
  }, [activeMembershipRole, currentUser.role]);

  // Persist master state
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_issues`, JSON.stringify(masterIssues));
  }, [masterIssues]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_dependencies`, JSON.stringify(masterDependencies));
  }, [masterDependencies]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_projects`, JSON.stringify(masterProjects));
  }, [masterProjects]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_activities`, JSON.stringify(masterActivities));
  }, [masterActivities]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_saved_views`, JSON.stringify(savedViews));
  }, [savedViews]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_cycles`, JSON.stringify(masterCycles));
  }, [masterCycles]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_milestones`, JSON.stringify(masterMilestones));
  }, [masterMilestones]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_comments`, JSON.stringify(masterComments));
  }, [masterComments]);

  const issuesMap = useMemo(() => new Map(issues.map((i) => [i.id, i])), [issues]);

  const selectedIssue = useMemo(
    () => (selectedIssueId ? issuesMap.get(selectedIssueId) || null : issues[0] || null),
    [selectedIssueId, issuesMap, issues]
  );

  const getIssueBlockerStatus = useCallback(
    (issueId: string): BlockerStatusInfo => {
      return getBlockerStatus(issueId, issues, dependencies);
    },
    [issues, dependencies]
  );

  // Power Search & Filtered issues calculation
  const filteredIssues = useMemo(() => {
    const rawQuery = filters.searchQuery.trim();
    const tokens = rawQuery.split(/\s+/).filter(Boolean);

    // Parse query syntax tokens
    const textTerms: string[] = [];
    let isBlockedQuery: boolean | null = null;
    let hasDownstreamQuery: boolean | null = null;
    let queryPriority: string | null = null;
    let queryState: string | null = null;
    let queryTeam: string | null = null;

    for (const token of tokens) {
      const lower = token.toLowerCase();
      if (lower === 'is:blocked') {
        isBlockedQuery = true;
      } else if (lower === 'is:unblocked') {
        isBlockedQuery = false;
      } else if (lower === 'has:downstream' || lower === 'is:blocker') {
        hasDownstreamQuery = true;
      } else if (lower.startsWith('priority:')) {
        queryPriority = lower.replace('priority:', '').toUpperCase();
      } else if (lower.startsWith('state:') || lower.startsWith('status:')) {
        queryState = lower.replace(/^(state:|status:)/, '').toUpperCase();
      } else if (lower.startsWith('team:')) {
        queryTeam = lower.replace('team:', '').toUpperCase();
      } else {
        textTerms.push(lower);
      }
    }

    return issues.filter(issue => {
      const blockerInfo = getBlockerStatus(issue.id, issues, dependencies);

      // 1. Syntax Tokens
      if (isBlockedQuery !== null) {
        if (isBlockedQuery && blockerInfo.activeCount === 0) return false;
        if (!isBlockedQuery && blockerInfo.activeCount > 0) return false;
      }

      if (hasDownstreamQuery && blockerInfo.downstreamIssues.length === 0) {
        return false;
      }

      if (queryPriority && issue.priority !== queryPriority) {
        return false;
      }

      if (queryState && issue.state !== queryState) {
        return false;
      }

      if (queryTeam) {
        const team = teams.find(t => t.id === issue.teamId);
        if (!team || (team.key.toUpperCase() !== queryTeam && !team.name.toUpperCase().includes(queryTeam))) {
          return false;
        }
      }

      // 2. Free text search
      if (textTerms.length > 0) {
        const matchesAll = textTerms.every(term => {
          const inKey = issue.key.toLowerCase().includes(term);
          const inTitle = issue.title.toLowerCase().includes(term);
          const inDesc = issue.description.toLowerCase().includes(term);
          return inKey || inTitle || inDesc;
        });
        if (!matchesAll) return false;
      }

      // 3. UI Filters: State
      if (filters.state !== 'ALL' && issue.state !== filters.state) {
        return false;
      }

      // 4. UI Filters: Priority
      if (filters.priority !== 'ALL' && issue.priority !== filters.priority) {
        return false;
      }

      // 5. UI Filters: Assignee
      if (filters.assigneeId !== 'ALL') {
        if (filters.assigneeId === 'UNASSIGNED') {
          if (issue.assigneeId) return false;
        } else if (issue.assigneeId !== filters.assigneeId) {
          return false;
        }
      }

      // 6. UI Filters: Project
      if (filters.projectId !== 'ALL' && issue.projectId !== filters.projectId) {
        return false;
      }

      // 7. UI Filters: Team
      if (filters.teamId !== 'ALL' && issue.teamId !== filters.teamId) {
        return false;
      }

      // 8. UI Filters: Cycle
      if (filters.cycleId && filters.cycleId !== 'ALL') {
        if (filters.cycleId === 'NO_CYCLE') {
          if (issue.cycleId) return false;
        } else if (issue.cycleId !== filters.cycleId) {
          return false;
        }
      }

      // 9. UI Filters: Milestone
      if (filters.milestoneId && filters.milestoneId !== 'ALL') {
        if (filters.milestoneId === 'NO_MILESTONE') {
          if (issue.milestoneId) return false;
        } else if (issue.milestoneId !== filters.milestoneId) {
          return false;
        }
      }

      // 10. UI Filters: Blocker Filter
      if (filters.blockerFilter !== 'ALL') {
        if (filters.blockerFilter === 'BLOCKED_ONLY' && blockerInfo.activeCount === 0) {
          return false;
        }
        if (filters.blockerFilter === 'UNBLOCKED_ONLY' && blockerInfo.activeCount > 0) {
          return false;
        }
        if (filters.blockerFilter === 'HAS_DOWNSTREAM' && blockerInfo.downstreamIssues.length === 0) {
          return false;
        }
      }

      return true;
    });
  }, [issues, dependencies, teams, filters]);

  // Update Issue Cycle
  const updateIssueCycle = useCallback(
    (issueId: string, cycleId?: string): boolean => {
      const res = executeUpdateIssueCycle(
        { cycles, issues, projects, teams, currentUser, activities },
        issueId,
        cycleId
      );
      if (!res.success || !res.nextState) return false;
      setIssues(res.nextState.issues);
      setActivities(res.nextState.activities);
      return true;
    },
    [cycles, issues, projects, teams, currentUser, activities]
  );

  // Bulk Update Cycle
  const bulkUpdateCycle = useCallback(
    (cycleId?: string) => {
      if (!canMutatePlanning(currentUser.role)) return;
      if (selectedIssueIds.length === 0) return;

      const targetCycle = cycleId ? cycles.find(c => c.id === cycleId) : undefined;
      if (cycleId && !targetCycle) return;

      const validIds: string[] = [];

      for (const id of selectedIssueIds) {
        const issue = issuesMap.get(id);
        if (issue) {
          const check = canAssignIssueToCycle(issue, targetCycle, projects);
          if (check.allowed) {
            validIds.push(id);
          }
        }
      }

      if (validIds.length === 0) return;

      const now = new Date().toISOString();
      setIssues(prev =>
        prev.map(i =>
          validIds.includes(i.id)
            ? { ...i, cycleId, updatedAt: now, version: i.version + 1 }
            : i
        )
      );

      const events = validIds.map(id => {
        const issue = issuesMap.get(id);
        const fromCycle = issue?.cycleId ? cycles.find(c => c.id === issue.cycleId) : undefined;
        return createActivityEvent(
          id,
          cycleId ? 'CYCLE_ASSIGNED' : 'CYCLE_REMOVED',
          currentUser,
          {
            from: fromCycle?.name || 'Unscheduled',
            to: targetCycle?.name || 'Unscheduled',
            cycleId,
            cycleName: targetCycle?.name,
            reason: targetCycle ? `Assigned to cycle ${targetCycle.name}` : 'Removed from cycle',
          }
        );
      });
      setActivities(prev => [...events, ...prev]);
    },
    [selectedIssueIds, cycles, issuesMap, projects, currentUser]
  );

  // Rollover Incomplete Issues
  const rolloverIncompleteIssues = useCallback(
    (fromCycleId: string, toCycleId: string): { rolledCount: number } => {
      if (!canMutatePlanning(currentUser.role)) return { rolledCount: 0 };

      const fromCycle = cycles.find(c => c.id === fromCycleId);
      const toCycle = cycles.find(c => c.id === toCycleId);
      if (!fromCycle || !toCycle) return { rolledCount: 0 };

      const check = validateRollover(fromCycle, toCycle);
      if (!check.allowed) return { rolledCount: 0 };

      const now = new Date().toISOString();
      const eligibleIds: string[] = [];

      for (const issue of issues) {
        if (
          issue.cycleId === fromCycleId &&
          !isIssueCompletedForPlanning(issue.state)
        ) {
          eligibleIds.push(issue.id);
        }
      }

      if (eligibleIds.length > 0) {
        setIssues(prev =>
          prev.map(i =>
            eligibleIds.includes(i.id)
              ? { ...i, cycleId: toCycleId, updatedAt: now, version: i.version + 1 }
              : i
          )
        );

        const events = eligibleIds.map(id =>
          createActivityEvent(id, 'CYCLE_ROLLED_OVER', currentUser, {
            from: fromCycle.name,
            to: toCycle.name,
            sourceCycleId: fromCycle.id,
            targetCycleId: toCycle.id,
            reason: `Rolled over into ${toCycle.name}`,
          })
        );
        setActivities(prev => [...events, ...prev]);
      }

      return { rolledCount: eligibleIds.length };
    },
    [issues, cycles, currentUser]
  );

  // Create Cycle (enforcing all creation invariants at mutation boundary)
  const createCycle = useCallback(
    (data: {
      name: string;
      startDate: string;
      endDate: string;
      teamId?: string;
      status?: 'ACTIVE' | 'UPCOMING' | 'COMPLETED';
      description?: string;
    }): Cycle | null => {
      const res = executeCreateCycle(
        { cycles, issues, projects, teams, currentUser, activities },
        data
      );
      if (!res.success || !res.nextState || !res.newCycle) return null;
      setCycles(res.nextState.cycles);
      return res.newCycle;
    },
    [cycles, issues, projects, teams, currentUser, activities]
  );

  // Update Cycle (validates candidate cycle state before mutating)
  const updateCycle = useCallback(
    (id: string, updates: Partial<Cycle>): boolean => {
      const res = executeUpdateCycle(
        { cycles, issues, projects, teams, currentUser, activities },
        id,
        updates
      );
      if (!res.success || !res.nextState) return false;
      setCycles(res.nextState.cycles);
      return true;
    },
    [cycles, issues, projects, teams, currentUser, activities]
  );

  // Complete Cycle & Rollover (ATOMIC: perform ALL validation before ANY mutation)
  const completeCycle = useCallback(
    (
      cycleId: string,
      rolloverData?: { targetCycleId?: string; issueIdsToRollover?: string[] }
    ): { success: boolean; rolledCount: number; error?: string } => {
      const res = executeCompleteCycle(
        { cycles, issues, projects, teams, currentUser, activities },
        { cycleId, rolloverData }
      );
      if (!res.success || !res.nextState) {
        return { success: false, rolledCount: 0, error: res.error };
      }
      setCycles(res.nextState.cycles);
      setIssues(res.nextState.issues);
      setActivities(res.nextState.activities);
      return { success: true, rolledCount: res.rolledCount };
    },
    [cycles, issues, projects, teams, currentUser, activities]
  );

  // Strategic Milestones Methods
  const updateIssueMilestone = useCallback(
    (issueId: string, milestoneId?: string): boolean => {
      const res = executeUpdateIssueMilestone(
        { cycles, issues, projects, teams, currentUser, activities },
        milestones,
        issueId,
        milestoneId
      );
      if (!res.success || !res.nextState) return false;
      setIssues(res.nextState.issues);
      setActivities(res.nextState.activities);
      return true;
    },
    [cycles, issues, projects, teams, currentUser, activities, milestones]
  );

  const createMilestone = useCallback(
    (data: { name: string; targetDate: string; description?: string; teamId?: string }): Milestone | null => {
      const res = executeCreateMilestone(
        { cycles, issues, projects, teams, currentUser, activities },
        milestones,
        data
      );
      if (!res.success || !res.nextMilestones || !res.newMilestone) return null;
      setMilestones(res.nextMilestones);
      return res.newMilestone;
    },
    [cycles, issues, projects, teams, currentUser, activities, milestones]
  );

  const updateMilestone = useCallback(
    (id: string, updates: Partial<Milestone>): boolean => {
      const res = executeUpdateMilestone(
        { cycles, issues, projects, teams, currentUser, activities },
        milestones,
        id,
        updates
      );
      if (!res.success || !res.nextMilestones) return false;
      setMilestones(res.nextMilestones);
      return true;
    },
    [cycles, issues, projects, teams, currentUser, activities, milestones]
  );

  // Collaboration & Threaded Comments (Phase C & UX-06)
  const addComment = useCallback(
    (
      issueId: string,
      content: string,
      parentId?: string,
      mentionIds?: string[]
    ): IssueComment | null => {
      const res = executeAddComment({
        issueId,
        content,
        parentId,
        actor: currentUser,
        allUsers: users,
        issues,
        existingComments: comments,
        explicitMentionIds: mentionIds,
      });

      if (!res.success || !res.comment) {
        return null;
      }

      setComments(prev => [...prev, res.comment!]);
      setActivities(prev => [...res.events, ...prev]);
      return res.comment;
    },
    [currentUser, users, issues, comments]
  );

  const deleteComment = useCallback(
    (commentId: string): boolean => {
      const res = executeDeleteComment({
        commentId,
        actor: currentUser,
        existingComments: comments,
      });

      if (!res.success) {
        return false;
      }

      setComments(prev => prev.filter(c => !res.deletedCommentIds.includes(c.id)));
      return true;
    },
    [currentUser, comments]
  );

  // Multi-Selection Methods
  const toggleSelectIssue = useCallback(
    (id: string, isShift?: boolean) => {
      setSelectedIssueIds(prev => {
        if (isShift && prev.length > 0) {
          // Range select between last selected issue and this issue
          const lastId = prev[prev.length - 1];
          const lastIndex = filteredIssues.findIndex(i => i.id === lastId);
          const currentIndex = filteredIssues.findIndex(i => i.id === id);
          if (lastIndex !== -1 && currentIndex !== -1) {
            const start = Math.min(lastIndex, currentIndex);
            const end = Math.max(lastIndex, currentIndex);
            const rangeIds = filteredIssues.slice(start, end + 1).map(i => i.id);
            const combined = Array.from(new Set([...prev, ...rangeIds]));
            return combined;
          }
        }

        if (prev.includes(id)) {
          return prev.filter(item => item !== id);
        } else {
          return [...prev, id];
        }
      });
    },
    [filteredIssues]
  );

  const selectAllIssues = useCallback(() => {
    setSelectedIssueIds(filteredIssues.map(i => i.id));
  }, [filteredIssues]);

  const clearSelection = useCallback(() => {
    setSelectedIssueIds([]);
  }, []);

  // Bulk Update State (enforces Hard Completion Guard!)
  const bulkUpdateState = useCallback(
    (newState: IssueState): { updated: number; blocked: number } => {
      if (selectedIssueIds.length === 0) return { updated: 0, blocked: 0 };

      const idsToUpdate: string[] = [];
      const blockedIssues: Issue[] = [];

      for (const id of selectedIssueIds) {
        const issue = issuesMap.get(id);
        if (!issue) continue;

        if (newState === 'DONE') {
          const guard = validateHardCompletionGuard(issue, issues, dependencies);
          if (!guard.allowed) {
            blockedIssues.push(issue);
            continue;
          }
        }

        if (canTransition(issue.state, newState)) {
          idsToUpdate.push(id);
        }
      }

      if (idsToUpdate.length > 0) {
        const now = new Date().toISOString();
        setIssues(prev =>
          prev.map(i =>
            idsToUpdate.includes(i.id)
              ? { ...i, state: newState, updatedAt: now, version: i.version + 1 }
              : i
          )
        );

        const newEvents: ActivityEvent[] = idsToUpdate.map(id => {
          const prev = issuesMap.get(id);
          return createActivityEvent(id, 'STATE_CHANGED', currentUser, {
            from: prev?.state,
            to: newState,
            reason: 'Bulk triage update',
          });
        });
        setActivities(prev => [...newEvents, ...prev]);
      }

      if (blockedIssues.length > 0) {
        setCompletionGuardError({
          issue: blockedIssues[0],
          blockers: getBlockerStatus(blockedIssues[0].id, issues, dependencies).activeBlockers,
          message: `Could not complete ${blockedIssues.length} issue(s) because they have active prerequisite blockers: ${blockedIssues.map(b => b.key).join(', ')}.`,
        });
      }

      return { updated: idsToUpdate.length, blocked: blockedIssues.length };
    },
    [selectedIssueIds, issuesMap, issues, dependencies, currentUser]
  );

  // Bulk Update Priority
  const bulkUpdatePriority = useCallback(
    (newPriority: IssuePriority) => {
      if (selectedIssueIds.length === 0) return;

      const now = new Date().toISOString();
      setIssues(prev =>
        prev.map(i =>
          selectedIssueIds.includes(i.id)
            ? { ...i, priority: newPriority, updatedAt: now, version: i.version + 1 }
            : i
        )
      );

      const newEvents: ActivityEvent[] = selectedIssueIds.map(id => {
        const prev = issuesMap.get(id);
        return createActivityEvent(id, 'PRIORITY_CHANGED', currentUser, {
          from: prev?.priority,
          to: newPriority,
          reason: 'Bulk triage update',
        });
      });
      setActivities(prev => [...newEvents, ...prev]);
    },
    [selectedIssueIds, issuesMap, currentUser]
  );

  // Bulk Update Assignee
  const bulkUpdateAssignee = useCallback(
    (assigneeId?: string) => {
      if (selectedIssueIds.length === 0) return;

      const now = new Date().toISOString();
      setIssues(prev =>
        prev.map(i =>
          selectedIssueIds.includes(i.id)
            ? { ...i, assigneeId, updatedAt: now, version: i.version + 1 }
            : i
        )
      );

      const targetUser = users.find(u => u.id === assigneeId);
      const newEvents: ActivityEvent[] = selectedIssueIds.map(id => {
        const prev = issuesMap.get(id);
        const prevUser = users.find(u => u.id === prev?.assigneeId);
        return createActivityEvent(id, 'ASSIGNEE_CHANGED', currentUser, {
          from: prevUser?.name || 'Unassigned',
          to: targetUser?.name || 'Unassigned',
          fromAssigneeId: prev?.assigneeId,
          toAssigneeId: assigneeId,
          reason: 'Bulk triage assignment',
        });
      });
      setActivities(prev => [...newEvents, ...prev]);
    },
    [selectedIssueIds, issuesMap, users, currentUser]
  );

  // Saved Views Management
  const applySavedView = useCallback((view: SavedView) => {
    setFilters(view.filters);
    if (view.viewMode) {
      setViewMode(view.viewMode);
    }
    setActiveSavedViewId(view.id);
  }, []);

  const saveSavedView = useCallback((view: SavedView) => {
    setSavedViews(prev => {
      const idx = prev.findIndex(v => v.id === view.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = view;
        return copy;
      }
      return [...prev, view];
    });
    setActiveSavedViewId(view.id);
  }, []);

  const deleteSavedView = useCallback((viewId: string) => {
    setSavedViews(prev => prev.filter(v => v.id !== viewId));
    setActiveSavedViewId(prev => (prev === viewId ? null : prev));
  }, []);

  const saveCurrentView = useCallback(
    (name: string) => {
      const newView: SavedView = {
        id: `view_${Date.now()}`,
        name: name.trim(),
        filters: { ...filters },
        viewMode,
        isSystem: false,
      };
      saveSavedView(newView);
    },
    [filters, viewMode, saveSavedView]
  );

  // Navigate through issues (J / K)
  const navigateIssue = useCallback(
    (direction: 1 | -1) => {
      if (filteredIssues.length === 0) return;
      if (!selectedIssueId) {
        setSelectedIssueId(filteredIssues[0].id);
        setIsDrawerOpen(true);
        return;
      }

      const currentIndex = filteredIssues.findIndex(i => i.id === selectedIssueId);
      if (currentIndex === -1) {
        setSelectedIssueId(filteredIssues[0].id);
      } else {
        const nextIndex = Math.max(0, Math.min(filteredIssues.length - 1, currentIndex + direction));
        setSelectedIssueId(filteredIssues[nextIndex].id);
      }
      setIsDrawerOpen(true);
    },
    [filteredIssues, selectedIssueId]
  );

  // Update Issue State with Hard Completion Guard & Reactivation Check
  const updateIssueState = useCallback(
    (issueId: string, newState: IssueState): boolean => {
      const issue = issuesMap.get(issueId);
      if (!issue) return false;
      if (issue.state === newState) return true;

      // Check lifecycle rules
      if (!canTransition(issue.state, newState)) {
        return false;
      }

      // Hard Completion Guard (Section 14 & AC-06)
      if (newState === 'DONE') {
        const guard = validateHardCompletionGuard(issue, issues, dependencies);
        if (!guard.allowed) {
          setCompletionGuardError({
            issue,
            blockers: guard.activeBlockers,
            message: guard.errorMessage || 'Cannot complete actively blocked issue.',
          });
          return false;
        }
      }

      const previousState = issue.state;
      const updatedTimestamp = new Date().toISOString();

      // 1. Update the issue
      setIssues(prevIssues =>
        prevIssues.map(i =>
          i.id === issueId
            ? { ...i, state: newState, updatedAt: updatedTimestamp, version: i.version + 1 }
            : i
        )
      );

      // 2. Record state change event
      const stateEvent = createActivityEvent(issueId, 'STATE_CHANGED', currentUser, {
        from: previousState,
        to: newState,
      });

      const newActivities = [stateEvent];

      // 3. Reactivation and Boundary check for Downstream Issues!
      // If issue state changed, it affects downstream dependencies:
      const downstreamDeps = dependencies.filter(d => d.upstreamIssueId === issueId);

      for (const dep of downstreamDeps) {
        const downstreamIssue = issuesMap.get(dep.downstreamIssueId);
        if (!downstreamIssue) continue;

        // Current status before state change
        const prevStatus = getBlockerStatus(downstreamIssue.id, issues, dependencies);

        // Hypothetical status after this upstream state changes
        const simulatedIssues = issues.map(i => (i.id === issueId ? { ...i, state: newState } : i));
        const nextStatus = getBlockerStatus(downstreamIssue.id, simulatedIssues, dependencies);

        const boundaryEvents = checkBlockerBoundaryEvents(
          downstreamIssue.id,
          prevStatus.activeCount,
          nextStatus.activeCount,
          currentUser,
          `Prerequisite ${issue.key} moved to ${newState}`
        );

        newActivities.push(...boundaryEvents);
      }

      setActivities(prev => [newActivities[0], ...newActivities.slice(1), ...prev]);
      return true;
    },
    [issues, issuesMap, dependencies, currentUser]
  );

  // Update Priority
  const updateIssuePriority = useCallback(
    (issueId: string, newPriority: IssuePriority) => {
      const issue = issuesMap.get(issueId);
      if (!issue || issue.priority === newPriority) return;

      const prevPriority = issue.priority;
      setIssues(prev =>
        prev.map(i =>
          i.id === issueId
            ? { ...i, priority: newPriority, updatedAt: new Date().toISOString(), version: i.version + 1 }
            : i
        )
      );

      const event = createActivityEvent(issueId, 'PRIORITY_CHANGED', currentUser, {
        from: prevPriority,
        to: newPriority,
      });
      setActivities(prev => [event, ...prev]);
    },
    [issuesMap, currentUser]
  );

  // Update Assignee
  const updateIssueAssignee = useCallback(
    (issueId: string, assigneeId?: string) => {
      const issue = issuesMap.get(issueId);
      if (!issue || issue.assigneeId === assigneeId) return;

      const prevAssigneeId = issue.assigneeId;
      setIssues(prev =>
        prev.map(i =>
          i.id === issueId
            ? { ...i, assigneeId, updatedAt: new Date().toISOString(), version: i.version + 1 }
            : i
        )
      );

      const prevUser = users.find(u => u.id === prevAssigneeId);
      const nextUser = users.find(u => u.id === assigneeId);

      const event = createActivityEvent(issueId, 'ASSIGNEE_CHANGED', currentUser, {
        from: prevUser?.name || 'Unassigned',
        to: nextUser?.name || 'Unassigned',
        fromAssigneeId: prevAssigneeId,
        toAssigneeId: assigneeId,
      });
      setActivities(prev => [event, ...prev]);
    },
    [issuesMap, users, currentUser]
  );

  // Update Title & Description
  const updateIssueDetails = useCallback(
    (issueId: string, title: string, description: string) => {
      const issue = issuesMap.get(issueId);
      if (!issue) return;

      const titleChanged = issue.title !== title;
      const descChanged = issue.description !== description;

      if (!titleChanged && !descChanged) return;

      setIssues(prev =>
        prev.map(i =>
          i.id === issueId
            ? { ...i, title, description, updatedAt: new Date().toISOString(), version: i.version + 1 }
            : i
        )
      );

      const newEvents: ActivityEvent[] = [];
      if (titleChanged) {
        newEvents.push(
          createActivityEvent(issueId, 'TITLE_MODIFIED', currentUser, {
            from: issue.title,
            to: title,
          })
        );
      }
      if (descChanged) {
        newEvents.push(
          createActivityEvent(issueId, 'DESCRIPTION_MODIFIED', currentUser, {
            reason: 'Description updated',
          })
        );
      }

      setActivities(prev => [...newEvents, ...prev]);
    },
    [issuesMap, currentUser]
  );

  const updateIssueDates = useCallback(
    (issueId: string, startDate?: string, dueDate?: string): boolean => {
      const res = executeUpdateIssueDates(
        { cycles, issues, projects, teams, currentUser, activities },
        issueId,
        startDate,
        dueDate
      );
      if (!res.success || !res.nextState) return false;
      setIssues(res.nextState.issues);
      setActivities(res.nextState.activities);
      return true;
    },
    [cycles, issues, projects, teams, currentUser, activities]
  );

  // Add Dependency (with Cycle check & Boundary check)
  const addDependency = useCallback(
    (upstreamId: string, downstreamId: string): boolean => {
      // 1. Cycle detection (PRD Section 16 & 17)
      const cycleCheck = wouldCreateCycle(upstreamId, downstreamId, dependencies, issuesMap);
      if (cycleCheck.hasCycle) {
        const path = cycleCheck.cyclePath ? cycleCheck.cyclePath.join(' → ') : '';
        setCycleError({
          cyclePath: cycleCheck.cyclePath || [],
          message: `Cannot add dependency: this would create a circular dependency loop (${path}). The dependency graph must remain an acyclic directed graph (DAG).`,
        });
        return false;
      }

      const upstream = masterIssues.find((i) => i.id === upstreamId);
      const downstream = masterIssues.find((i) => i.id === downstreamId);
      if (!upstream || !downstream) return false;

      // Section 12: Invariant Check - Cross-workspace dependencies are strictly forbidden
      const upstreamWs = upstream.workspaceId || 'ws_acme';
      const downstreamWs = downstream.workspaceId || 'ws_acme';
      if (upstreamWs !== downstreamWs || upstreamWs !== activeWorkspaceId) {
        console.warn(
          `Cross-workspace dependency forbidden between '${upstreamWs}' and '${downstreamWs}'`
        );
        return false;
      }

      // Previous active count on downstream
      const prevStatus = getBlockerStatus(downstreamId, issues, dependencies);

      const newDep: Dependency = {
        id: `dep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        workspaceId: activeWorkspaceId,
        upstreamIssueId: upstreamId,
        downstreamIssueId: downstreamId,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.id,
      };

      const updatedDeps = [...dependencies, newDep];
      setDependencies(updatedDeps);

      // Audit event
      const depEvent = createActivityEvent(downstreamId, 'DEPENDENCY_ADDED', currentUser, {
        upstreamKey: upstream.key,
        targetIssueTitle: upstream.title,
      });

      // Boundary check
      const nextStatus = getBlockerStatus(downstreamId, issues, updatedDeps);
      const boundaryEvents = checkBlockerBoundaryEvents(
        downstreamId,
        prevStatus.activeCount,
        nextStatus.activeCount,
        currentUser,
        `Blocked by prerequisite ${upstream.key}`
      );

      setActivities(prev => [depEvent, ...boundaryEvents, ...prev]);
      return true;
    },
    [dependencies, issues, issuesMap, currentUser]
  );

  // Remove Dependency
  const removeDependency = useCallback(
    (dependencyId: string) => {
      const dep = dependencies.find(d => d.id === dependencyId);
      if (!dep) return;

      const upstream = issuesMap.get(dep.upstreamIssueId);
      const downstream = issuesMap.get(dep.downstreamIssueId);

      const prevStatus = getBlockerStatus(dep.downstreamIssueId, issues, dependencies);

      const updatedDeps = dependencies.filter(d => d.id !== dependencyId);
      setDependencies(updatedDeps);

      if (downstream && upstream) {
        const depEvent = createActivityEvent(dep.downstreamIssueId, 'DEPENDENCY_REMOVED', currentUser, {
          upstreamKey: upstream.key,
          targetIssueTitle: upstream.title,
        });

        const nextStatus = getBlockerStatus(dep.downstreamIssueId, issues, updatedDeps);
        const boundaryEvents = checkBlockerBoundaryEvents(
          dep.downstreamIssueId,
          prevStatus.activeCount,
          nextStatus.activeCount,
          currentUser,
          `Prerequisite ${upstream.key} link removed`
        );

        setActivities(prev => [depEvent, ...boundaryEvents, ...prev]);
      }
    },
    [dependencies, issues, issuesMap, currentUser]
  );

  // Bulk Add Blocker
  const bulkAddBlocker = useCallback(
    (upstreamId: string): { added: number; failed: number } => {
      let added = 0;
      let failed = 0;

      for (const downstreamId of selectedIssueIds) {
        if (downstreamId === upstreamId) {
          failed++;
          continue;
        }
        const cycleCheck = wouldCreateCycle(upstreamId, downstreamId, dependencies, issuesMap);
        if (cycleCheck.hasCycle) {
          failed++;
          continue;
        }

        const success = addDependency(upstreamId, downstreamId);
        if (success) added++;
        else failed++;
      }

      return { added, failed };
    },
    [selectedIssueIds, dependencies, issuesMap, addDependency]
  );

  // Create Issue (Atomic sequence allocation per project)
  const createIssue = useCallback(
    (data: {
      title: string;
      description: string;
      projectId: string;
      priority: IssuePriority;
      assigneeId?: string;
      upstreamBlockerId?: string;
    }): Issue => {
      const targetProject = projects.find(p => p.id === data.projectId) || projects[0];
      const nextNumber = targetProject.currentSequence;
      const issueKey = `${targetProject.key}-${nextNumber}`;

      // Bump sequence for project
      setProjects(prev =>
        prev.map(p => (p.id === targetProject.id ? { ...p, currentSequence: p.currentSequence + 1 } : p))
      );

      const now = new Date().toISOString();
      const newIssue: Issue = {
        id: `iss_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        workspaceId: activeWorkspaceId,
        key: issueKey,
        projectId: targetProject?.id || data.projectId,
        teamId: targetProject?.teamId || '',
        title: data.title.trim(),
        description: data.description.trim(),
        state: 'TODO',
        priority: data.priority,
        assigneeId: data.assigneeId,
        creatorId: currentUser.id,
        createdAt: now,
        updatedAt: now,
        version: 1,
      };

      setIssues(prev => [newIssue, ...prev]);

      const createEvent = createActivityEvent(newIssue.id, 'ISSUE_CREATED', currentUser, {
        to: 'TODO',
        reason: 'Issue created',
      });
      setActivities(prev => [createEvent, ...prev]);

      // If an initial blocker was specified, establish dependency
      if (data.upstreamBlockerId) {
        setTimeout(() => {
          addDependency(data.upstreamBlockerId!, newIssue.id);
        }, 50);
      }

      setSelectedIssueId(newIssue.id);
      setIsDrawerOpen(true);

      return newIssue;
    },
    [projects, currentUser, addDependency, activeWorkspaceId]
  );

  // Reset demo data
  const resetToDemoData = useCallback(() => {
    clearAllStoredEntities();

    setIssues(MULTI_WORKSPACE_INITIAL_ISSUES);
    setDependencies(MULTI_WORKSPACE_INITIAL_DEPENDENCIES);
    setProjects(MULTI_WORKSPACE_INITIAL_PROJECTS);
    setActivities(MULTI_WORKSPACE_INITIAL_ACTIVITIES);
    setSavedViews(DEFAULT_SAVED_VIEWS);
    setCycles(MULTI_WORKSPACE_INITIAL_CYCLES);
    setMilestones(MULTI_WORKSPACE_INITIAL_MILESTONES);
    setComments(MULTI_WORKSPACE_INITIAL_COMMENTS);
    setTeams(MULTI_WORKSPACE_INITIAL_TEAMS);
    setUsers(normalizeUsersList(INITIAL_USERS));
    setCurrentUser(normalizeUserMemberships(INITIAL_USERS[0]));
    setSelectedIssueId(MULTI_WORKSPACE_INITIAL_ISSUES[1]?.id || null);
    setFilters(initialFilters);

    // CollaborationProvider owns user-scoped receipt state outside this
    // context. Notify it after storage is cleared so reset restores the
    // canonical demo Inbox instead of retaining stale in-memory receipts.
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('unblok:demo-reset'));
    }
  }, []);

  return (
    <ProjectContext.Provider
      value={{
        issues,
        dependencies,
        teams,
        projects,
        users,
        activities,
        currentUser,
        setCurrentUser: handleSetCurrentUser,
        updateCanonicalTeams,
        updateCanonicalUsers,
        selectedIssueId,
        selectedIssue,
        setSelectedIssueId,
        isDrawerOpen,
        setIsDrawerOpen,
        navigateIssue,
        selectedIssueIds,
        toggleSelectIssue,
        selectAllIssues,
        clearSelection,
        bulkUpdateState,
        bulkUpdatePriority,
        bulkUpdateAssignee,
        bulkAddBlocker,
        viewMode,
        setViewMode,
        isNavCollapsed,
        setIsNavCollapsed,
        filters,
        setFilters,
        resetFilters: () => setFilters(initialFilters),
        filteredIssues,
        savedViews,
        activeSavedViewId,
        applySavedView,
        saveCurrentView,
        saveSavedView,
        deleteSavedView,
        cycles,
        activeCycle,
        updateIssueCycle,
        bulkUpdateCycle,
        rolloverIncompleteIssues,
        createCycle,
        updateCycle,
        completeCycle,
        milestones,
        updateIssueMilestone,
        createMilestone,
        updateMilestone,
        comments,
        addComment,
        deleteComment,
        updateIssueState,
        updateIssuePriority,
        updateIssueAssignee,
        updateIssueDetails,
        updateIssueDates,
        createIssue,
        addDependency,
        removeDependency,
        getIssueBlockerStatus,
        completionGuardError,
        clearCompletionGuardError: () => setCompletionGuardError(null),
        cycleError,
        clearCycleError: () => setCycleError(null),
        resetToDemoData,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
