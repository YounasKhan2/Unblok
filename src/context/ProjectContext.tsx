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
  NEXUS_WORKSPACE_ID,
} from '../data/nexusEnterprise';
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
} from './storageMigration';
import { resetPrototypeToNexus } from './nexusFixtureReset';
import {
  executeAddComment,
  executeDeleteComment,
} from '../features/collaboration/domain/collaborationMutations';
import { planCreateTeam } from '../features/settings/domain/teamAdministration';
import { planCreateProject, CreateProjectInput } from '../features/projects/domain/projectCreation';

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

  // Teams & Projects Creation (UX-14)
  createTeam: (data: { name: string; key: string; description?: string; color?: string; leadId?: string; memberIds?: string[] }) => Team;
  createProject: (data: CreateProjectInput) => Project;

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

/**
 * Controlled one-time migration for legacy pre-UX-13 storage records.
 * Distinguishes explicit legacy-data migration from normal entity creation.
 */
function migrateLegacyStorageRecords<T extends { id: string; workspaceId?: string }>(
  stored: T[] | null,
  seeds: T[]
): T[] {
  if (!stored) return seeds;
  const migrated = stored.map((item) => (item.workspaceId ? item : { ...item, workspaceId: NEXUS_WORKSPACE_ID }));
  const storedIds = new Set(migrated.map((item) => item.id));
  const missingSeeds = seeds.filter((item) => !storedIds.has(item.id));
  return missingSeeds.length > 0 ? [...migrated, ...missingSeeds] : migrated;
}

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Section 6: Resolve active workspace context
  let workspaceContext: ReturnType<typeof useWorkspace> | null = null;
  let isStandaloneLegacyTest = false;
  try {
    workspaceContext = useWorkspace();
  } catch {
    // Isolated legacy test environment without WorkspaceProvider
    isStandaloneLegacyTest = true;
  }

  const activeWorkspaceId = isStandaloneLegacyTest
    ? NEXUS_WORKSPACE_ID
    : (workspaceContext?.activeWorkspaceId ?? null);
  const activeMembershipRole = isStandaloneLegacyTest
    ? undefined
    : workspaceContext?.activeMembership?.role;
  const activeWorkspace = isStandaloneLegacyTest
    ? null
    : (workspaceContext?.activeWorkspace ?? null);

  // Load persisted state or initialize with the canonical NEXUS fixture.
  const [masterIssues, setMasterIssues] = useState<Issue[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_issues`);
      const parsed = stored ? JSON.parse(stored) : null;
      return migrateLegacyStorageRecords(parsed, INITIAL_ISSUES);
    } catch {
      return INITIAL_ISSUES;
    }
  });

  const [masterDependencies, setMasterDependencies] = useState<Dependency[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_dependencies`);
      const parsed = stored ? JSON.parse(stored) : null;
      return migrateLegacyStorageRecords(parsed, INITIAL_DEPENDENCIES);
    } catch {
      return INITIAL_DEPENDENCIES;
    }
  });

  const [masterProjects, setMasterProjects] = useState<Project[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_projects`);
      const parsed = stored ? JSON.parse(stored) : null;
      return migrateLegacyStorageRecords(parsed, INITIAL_PROJECTS);
    } catch {
      return INITIAL_PROJECTS;
    }
  });

  const [masterActivities, setMasterActivities] = useState<ActivityEvent[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_activities`);
      const parsed = stored ? JSON.parse(stored) : null;
      return migrateLegacyStorageRecords(parsed, INITIAL_ACTIVITIES);
    } catch {
      return INITIAL_ACTIVITIES;
    }
  });

  const [masterTeams, setMasterTeams] = useState<Team[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_teams`);
      const parsed = stored ? JSON.parse(stored) : null;
      return migrateLegacyStorageRecords(parsed, INITIAL_TEAMS);
    } catch {
      return INITIAL_TEAMS;
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
    setMasterTeams(newTeams);
    try {
      localStorage.setItem(`${STORAGE_KEY}_teams`, JSON.stringify(newTeams));
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
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(INITIAL_ISSUES[1]?.id ?? null);
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
      return migrateLegacyStorageRecords(parsed, INITIAL_CYCLES);
    } catch {
      return INITIAL_CYCLES;
    }
  });

  // Milestones master state
  const [masterMilestones, setMasterMilestones] = useState<Milestone[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_milestones`);
      const parsed = stored ? JSON.parse(stored) : null;
      return migrateLegacyStorageRecords(parsed, INITIAL_MILESTONES);
    } catch {
      return INITIAL_MILESTONES;
    }
  });

  // Comments master state
  const [masterComments, setMasterComments] = useState<IssueComment[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_comments`);
      const parsed = stored ? JSON.parse(stored) : null;
      return migrateLegacyStorageRecords(parsed, INITIAL_COMMENTS);
    } catch {
      return INITIAL_COMMENTS;
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
  // When activeWorkspaceId is null/invalid: projections must be strictly empty (no NEXUS leakage).
  const issues = useMemo(
    () => (!activeWorkspaceId ? [] : masterIssues.filter((i) => Boolean(i.workspaceId) && i.workspaceId === activeWorkspaceId)),
    [masterIssues, activeWorkspaceId]
  );

  const projects = useMemo(
    () => (!activeWorkspaceId ? [] : masterProjects.filter((p) => Boolean(p.workspaceId) && p.workspaceId === activeWorkspaceId)),
    [masterProjects, activeWorkspaceId]
  );

  const teams = useMemo(
    () => (!activeWorkspaceId ? [] : masterTeams.filter((t) => Boolean(t.workspaceId) && t.workspaceId === activeWorkspaceId)),
    [masterTeams, activeWorkspaceId]
  );

  const cycles = useMemo(
    () => (!activeWorkspaceId ? [] : masterCycles.filter((c) => Boolean(c.workspaceId) && c.workspaceId === activeWorkspaceId)),
    [masterCycles, activeWorkspaceId]
  );

  const milestones = useMemo(
    () => (!activeWorkspaceId ? [] : masterMilestones.filter((m) => Boolean(m.workspaceId) && m.workspaceId === activeWorkspaceId)),
    [masterMilestones, activeWorkspaceId]
  );

  const dependencies = useMemo(() => {
    if (!activeWorkspaceId) return [];
    const scopedIssueIds = new Set(issues.map((i) => i.id));
    return masterDependencies.filter(
      (d) =>
        Boolean(d.workspaceId) &&
        d.workspaceId === activeWorkspaceId &&
        scopedIssueIds.has(d.upstreamIssueId) &&
        scopedIssueIds.has(d.downstreamIssueId)
    );
  }, [masterDependencies, issues, activeWorkspaceId]);

  const activities = useMemo(
    () => (!activeWorkspaceId ? [] : masterActivities.filter((a) => Boolean(a.workspaceId) && a.workspaceId === activeWorkspaceId)),
    [masterActivities, activeWorkspaceId]
  );

  const comments = useMemo(
    () => (!activeWorkspaceId ? [] : masterComments.filter((c) => Boolean(c.workspaceId) && c.workspaceId === activeWorkspaceId)),
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

  /**
   * Section 14: Permission Authority Bridge
   * Canonical authority is `activeMembership.role`.
   * For backwards compatibility with frozen legacy consumers (e.g. WorkflowSettingsSection,
   * TeamSettingsSection, TriageToolbar, IssueDetailDrawer, etc.), `effectiveCurrentUser`
   * binds `currentUser.role` directly to `activeMembershipRole` with zero stale window.
   */
  const effectiveCurrentUser: User = useMemo(() => {
    if (isStandaloneLegacyTest) {
      return currentUser;
    }
    if (!activeWorkspaceId || !activeMembershipRole) {
      return {
        ...currentUser,
        role: 'OBSERVER' as UserRole,
      };
    }
    return {
      ...currentUser,
      role: activeMembershipRole,
    };
  }, [currentUser, isStandaloneLegacyTest, activeWorkspaceId, activeMembershipRole]);

  /**
   * Section 2: Authoritative Mutation Policy
   * Execution mutations are rejected if workspace is null/unavailable,
   * archived, or if the user has an OBSERVER role.
   */
  const canMutate = useMemo(() => {
    if (isStandaloneLegacyTest) return true;
    if (!activeWorkspaceId) return false;
    if (activeWorkspace && activeWorkspace.status === 'ARCHIVED') return false;
    if (activeMembershipRole === 'OBSERVER') return false;
    return true;
  }, [isStandaloneLegacyTest, activeWorkspaceId, activeWorkspace, activeMembershipRole]);

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

  useEffect(() => {
    if (!activeWorkspaceId || issues.length === 0) {
      setSelectedIssueId(null);
    } else if (selectedIssueId && !issues.some((i) => i.id === selectedIssueId)) {
      setSelectedIssueId(issues[0]?.id ?? null);
    }
  }, [activeWorkspaceId, issues, selectedIssueId]);

  const selectedIssue = useMemo(
    () => {
      if (!activeWorkspaceId || issues.length === 0) return null;
      return (selectedIssueId ? issuesMap.get(selectedIssueId) || null : issues[0] || null);
    },
    [selectedIssueId, issuesMap, issues, activeWorkspaceId]
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
      if (!canMutate) return false;
      const res = executeUpdateIssueCycle(
        { cycles, issues, projects, teams, currentUser: effectiveCurrentUser, activities },
        issueId,
        cycleId
      );
      if (!res.success || !res.nextState) return false;
      setIssues(res.nextState.issues);
      setActivities(res.nextState.activities);
      return true;
    },
    [canMutate, cycles, issues, projects, teams, effectiveCurrentUser, activities]
  );

  // Bulk Update Cycle
  const bulkUpdateCycle = useCallback(
    (cycleId?: string) => {
      if (!canMutate || !canMutatePlanning(effectiveCurrentUser.role)) return;
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
          effectiveCurrentUser,
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
    [canMutate, effectiveCurrentUser, selectedIssueIds, cycles, issuesMap, projects]
  );

  // Rollover Incomplete Issues
  const rolloverIncompleteIssues = useCallback(
    (fromCycleId: string, toCycleId: string): { rolledCount: number } => {
      if (!canMutate || !canMutatePlanning(effectiveCurrentUser.role)) return { rolledCount: 0 };

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
          createActivityEvent(id, 'CYCLE_ROLLED_OVER', effectiveCurrentUser, {
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
    [canMutate, effectiveCurrentUser, issues, cycles]
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
      if (!canMutate || !activeWorkspaceId) return null;
      const res = executeCreateCycle(
        { cycles, issues, projects, teams, currentUser: effectiveCurrentUser, activities },
        data
      );
      if (!res.success || !res.nextState || !res.newCycle) return null;
      const cycleWithWorkspace: Cycle = {
        ...res.newCycle,
        workspaceId: activeWorkspaceId,
      };
      setCycles(prev => [cycleWithWorkspace, ...prev.filter(c => c.id !== cycleWithWorkspace.id)]);
      return cycleWithWorkspace;
    },
    [canMutate, activeWorkspaceId, cycles, issues, projects, teams, effectiveCurrentUser, activities]
  );

  // Update Cycle (validates candidate cycle state before mutating)
  const updateCycle = useCallback(
    (id: string, updates: Partial<Cycle>): boolean => {
      if (!canMutate) return false;
      const res = executeUpdateCycle(
        { cycles, issues, projects, teams, currentUser: effectiveCurrentUser, activities },
        id,
        updates
      );
      if (!res.success || !res.nextState) return false;
      setCycles(res.nextState.cycles);
      return true;
    },
    [canMutate, cycles, issues, projects, teams, effectiveCurrentUser, activities]
  );

  // Complete Cycle & Rollover (ATOMIC: perform ALL validation before ANY mutation)
  const completeCycle = useCallback(
    (
      cycleId: string,
      rolloverData?: { targetCycleId?: string; issueIdsToRollover?: string[] }
    ): { success: boolean; rolledCount: number; error?: string } => {
      if (!canMutate) {
        return { success: false, rolledCount: 0, error: 'Mutations not permitted' };
      }
      const res = executeCompleteCycle(
        { cycles, issues, projects, teams, currentUser: effectiveCurrentUser, activities },
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
    [canMutate, cycles, issues, projects, teams, effectiveCurrentUser, activities]
  );

  // Strategic Milestones Methods
  const updateIssueMilestone = useCallback(
    (issueId: string, milestoneId?: string): boolean => {
      if (!canMutate) return false;
      const res = executeUpdateIssueMilestone(
        { cycles, issues, projects, teams, currentUser: effectiveCurrentUser, activities },
        milestones,
        issueId,
        milestoneId
      );
      if (!res.success || !res.nextState) return false;
      setIssues(res.nextState.issues);
      setActivities(res.nextState.activities);
      return true;
    },
    [canMutate, cycles, issues, projects, teams, effectiveCurrentUser, activities, milestones]
  );

  const createMilestone = useCallback(
    (data: { name: string; targetDate: string; description?: string; teamId?: string }): Milestone | null => {
      if (!canMutate || !activeWorkspaceId) return null;
      const res = executeCreateMilestone(
        { cycles, issues, projects, teams, currentUser: effectiveCurrentUser, activities },
        milestones,
        data
      );
      if (!res.success || !res.nextMilestones || !res.newMilestone) return null;
      const milestoneWithWorkspace: Milestone = {
        ...res.newMilestone,
        workspaceId: activeWorkspaceId,
      };
      setMilestones(prev => [milestoneWithWorkspace, ...prev.filter(m => m.id !== milestoneWithWorkspace.id)]);
      return milestoneWithWorkspace;
    },
    [canMutate, activeWorkspaceId, cycles, issues, projects, teams, effectiveCurrentUser, activities, milestones]
  );

  const updateMilestone = useCallback(
    (id: string, updates: Partial<Milestone>): boolean => {
      if (!canMutate) return false;
      const res = executeUpdateMilestone(
        { cycles, issues, projects, teams, currentUser: effectiveCurrentUser, activities },
        milestones,
        id,
        updates
      );
      if (!res.success || !res.nextMilestones) return false;
      setMilestones(res.nextMilestones);
      return true;
    },
    [canMutate, cycles, issues, projects, teams, effectiveCurrentUser, activities, milestones]
  );

  // Collaboration & Threaded Comments (Phase C & UX-06)
  const addComment = useCallback(
    (
      issueId: string,
      content: string,
      parentId?: string,
      mentionIds?: string[]
    ): IssueComment | null => {
      if (!canMutate || !activeWorkspaceId) return null;
      const res = executeAddComment({
        issueId,
        content,
        parentId,
        actor: effectiveCurrentUser,
        allUsers: users,
        issues,
        existingComments: comments,
        explicitMentionIds: mentionIds,
      });

      if (!res.success || !res.comment) {
        return null;
      }

      const commentWithWorkspace: IssueComment = {
        ...res.comment,
        workspaceId: activeWorkspaceId,
      };

      setComments(prev => [...prev, commentWithWorkspace]);
      setActivities(prev => [...res.events, ...prev]);
      return commentWithWorkspace;
    },
    [canMutate, activeWorkspaceId, effectiveCurrentUser, users, issues, comments]
  );

  const deleteComment = useCallback(
    (commentId: string): boolean => {
      if (!canMutate) return false;
      const res = executeDeleteComment({
        commentId,
        actor: effectiveCurrentUser,
        existingComments: comments,
      });

      if (!res.success) {
        return false;
      }

      setComments(prev => prev.filter(c => !res.deletedCommentIds.includes(c.id)));
      return true;
    },
    [canMutate, effectiveCurrentUser, comments]
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
      if (!canMutate) return { updated: 0, blocked: selectedIssueIds.length };
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
          return createActivityEvent(id, 'STATE_CHANGED', effectiveCurrentUser, {
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
    [canMutate, selectedIssueIds, issuesMap, issues, dependencies, effectiveCurrentUser]
  );

  // Bulk Update Priority
  const bulkUpdatePriority = useCallback(
    (newPriority: IssuePriority) => {
      if (!canMutate) return;
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
        return createActivityEvent(id, 'PRIORITY_CHANGED', effectiveCurrentUser, {
          from: prev?.priority,
          to: newPriority,
          reason: 'Bulk triage update',
        });
      });
      setActivities(prev => [...newEvents, ...prev]);
    },
    [canMutate, selectedIssueIds, issuesMap, effectiveCurrentUser]
  );

  // Bulk Update Assignee
  const bulkUpdateAssignee = useCallback(
    (assigneeId?: string) => {
      if (!canMutate) return;
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
        return createActivityEvent(id, 'ASSIGNEE_CHANGED', effectiveCurrentUser, {
          from: prevUser?.name || 'Unassigned',
          to: targetUser?.name || 'Unassigned',
          fromAssigneeId: prev?.assigneeId,
          toAssigneeId: assigneeId,
          reason: 'Bulk triage assignment',
        });
      });
      setActivities(prev => [...newEvents, ...prev]);
    },
    [canMutate, selectedIssueIds, issuesMap, users, effectiveCurrentUser]
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
      if (!canMutate) return false;
      const issue = masterIssues.find((i) => i.id === issueId);
      if (!issue || !issue.workspaceId || issue.workspaceId !== activeWorkspaceId) return false;
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
      const stateEvent = createActivityEvent(issueId, 'STATE_CHANGED', effectiveCurrentUser, {
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
          effectiveCurrentUser,
          `Prerequisite ${issue.key} moved to ${newState}`
        );

        newActivities.push(...boundaryEvents);
      }

      setActivities(prev => [newActivities[0], ...newActivities.slice(1), ...prev]);
      return true;
    },
    [canMutate, activeWorkspaceId, masterIssues, issues, issuesMap, dependencies, effectiveCurrentUser]
  );

  // Update Priority
  const updateIssuePriority = useCallback(
    (issueId: string, newPriority: IssuePriority) => {
      if (!canMutate) return;
      const issue = masterIssues.find((i) => i.id === issueId);
      if (!issue || !issue.workspaceId || issue.workspaceId !== activeWorkspaceId) return;
      if (issue.priority === newPriority) return;

      const prevPriority = issue.priority;
      setIssues(prev =>
        prev.map(i =>
          i.id === issueId
            ? { ...i, priority: newPriority, updatedAt: new Date().toISOString(), version: i.version + 1 }
            : i
        )
      );

      const event = createActivityEvent(issueId, 'PRIORITY_CHANGED', effectiveCurrentUser, {
        from: prevPriority,
        to: newPriority,
      });
      setActivities(prev => [event, ...prev]);
    },
    [canMutate, activeWorkspaceId, masterIssues, effectiveCurrentUser]
  );

  // Update Assignee
  const updateIssueAssignee = useCallback(
    (issueId: string, assigneeId?: string) => {
      if (!canMutate) return;
      const issue = masterIssues.find((i) => i.id === issueId);
      if (!issue || !issue.workspaceId || issue.workspaceId !== activeWorkspaceId) return;
      if (issue.assigneeId === assigneeId) return;

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

      const event = createActivityEvent(issueId, 'ASSIGNEE_CHANGED', effectiveCurrentUser, {
        from: prevUser?.name || 'Unassigned',
        to: nextUser?.name || 'Unassigned',
        fromAssigneeId: prevAssigneeId,
        toAssigneeId: assigneeId,
      });
      setActivities(prev => [event, ...prev]);
    },
    [canMutate, activeWorkspaceId, masterIssues, users, effectiveCurrentUser]
  );

  // Update Title & Description
  const updateIssueDetails = useCallback(
    (issueId: string, title: string, description: string) => {
      if (!canMutate) return;
      const issue = masterIssues.find((i) => i.id === issueId);
      if (!issue || !issue.workspaceId || issue.workspaceId !== activeWorkspaceId) return;

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
          createActivityEvent(issueId, 'TITLE_MODIFIED', effectiveCurrentUser, {
            from: issue.title,
            to: title,
          })
        );
      }
      if (descChanged) {
        newEvents.push(
          createActivityEvent(issueId, 'DESCRIPTION_MODIFIED', effectiveCurrentUser, {
            reason: 'Description updated',
          })
        );
      }

      setActivities(prev => [...newEvents, ...prev]);
    },
    [canMutate, activeWorkspaceId, masterIssues, effectiveCurrentUser]
  );

  const updateIssueDates = useCallback(
    (issueId: string, startDate?: string, dueDate?: string): boolean => {
      if (!canMutate) return false;
      const issue = masterIssues.find((i) => i.id === issueId);
      if (!issue || !issue.workspaceId || issue.workspaceId !== activeWorkspaceId) return false;

      const res = executeUpdateIssueDates(
        { cycles, issues, projects, teams, currentUser: effectiveCurrentUser, activities },
        issueId,
        startDate,
        dueDate
      );
      if (!res.success || !res.nextState) return false;
      setIssues(res.nextState.issues);
      setActivities(res.nextState.activities);
      return true;
    },
    [canMutate, activeWorkspaceId, masterIssues, cycles, issues, projects, teams, effectiveCurrentUser, activities]
  );

  // Add Dependency (with Cycle check & Boundary check)
  const addDependency = useCallback(
    (upstreamId: string, downstreamId: string): boolean => {
      if (!canMutate) return false;

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
      // Missing or malformed workspaceIds must not silently default to NEXUS.
      if (!upstream.workspaceId || !downstream.workspaceId) {
        console.warn('Cross-workspace dependency forbidden: missing workspaceId on entity');
        return false;
      }
      if (upstream.workspaceId !== downstream.workspaceId || upstream.workspaceId !== activeWorkspaceId) {
        console.warn(
          `Cross-workspace dependency forbidden between '${upstream.workspaceId}' and '${downstream.workspaceId}'`
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
        createdBy: effectiveCurrentUser.id,
      };

      const updatedDeps = [...dependencies, newDep];
      setDependencies(updatedDeps);

      // Audit event
      const depEvent = createActivityEvent(downstreamId, 'DEPENDENCY_ADDED', effectiveCurrentUser, {
        upstreamKey: upstream.key,
        targetIssueTitle: upstream.title,
      });

      // Boundary check
      const nextStatus = getBlockerStatus(downstreamId, issues, updatedDeps);
      const boundaryEvents = checkBlockerBoundaryEvents(
        downstreamId,
        prevStatus.activeCount,
        nextStatus.activeCount,
        effectiveCurrentUser,
        `Blocked by prerequisite ${upstream.key}`
      );

      setActivities(prev => [depEvent, ...boundaryEvents, ...prev]);
      return true;
    },
    [canMutate, dependencies, issues, issuesMap, masterIssues, activeWorkspaceId, effectiveCurrentUser]
  );

  // Remove Dependency
  const removeDependency = useCallback(
    (dependencyId: string) => {
      if (!canMutate) return;
      const dep = masterDependencies.find(d => d.id === dependencyId);
      if (!dep || !dep.workspaceId || dep.workspaceId !== activeWorkspaceId) return;

      const upstream = issuesMap.get(dep.upstreamIssueId);
      const downstream = issuesMap.get(dep.downstreamIssueId);

      const prevStatus = getBlockerStatus(dep.downstreamIssueId, issues, dependencies);

      const updatedDeps = dependencies.filter(d => d.id !== dependencyId);
      setDependencies(updatedDeps);

      if (downstream && upstream) {
        const depEvent = createActivityEvent(dep.downstreamIssueId, 'DEPENDENCY_REMOVED', effectiveCurrentUser, {
          upstreamKey: upstream.key,
          targetIssueTitle: upstream.title,
        });

        const nextStatus = getBlockerStatus(dep.downstreamIssueId, issues, updatedDeps);
        const boundaryEvents = checkBlockerBoundaryEvents(
          dep.downstreamIssueId,
          prevStatus.activeCount,
          nextStatus.activeCount,
          effectiveCurrentUser,
          `Prerequisite ${upstream.key} link removed`
        );

        setActivities(prev => [depEvent, ...boundaryEvents, ...prev]);
      }
    },
    [canMutate, masterDependencies, activeWorkspaceId, dependencies, issues, issuesMap, effectiveCurrentUser]
  );

  // Bulk Add Blocker
  const bulkAddBlocker = useCallback(
    (upstreamId: string): { added: number; failed: number } => {
      if (!canMutate) return { added: 0, failed: selectedIssueIds.length };
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
    [canMutate, selectedIssueIds, dependencies, issuesMap, addDependency]
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
      if (!canMutate) {
        throw new Error('Cannot create issue in an archived workspace or with read-only permissions.');
      }
      if (!activeWorkspaceId) {
        throw new Error('Cannot create issue without an active workspace context.');
      }
      const targetProject = projects.find(p => p.id === data.projectId) || projects[0];
      if (!targetProject) {
        throw new Error('Cannot create issue without a project in active workspace.');
      }
      if (!targetProject.workspaceId || targetProject.workspaceId !== activeWorkspaceId) {
        throw new Error(`Target project does not belong to active workspace '${activeWorkspaceId}'.`);
      }
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
        creatorId: effectiveCurrentUser.id,
        createdAt: now,
        updatedAt: now,
        version: 1,
      };

      setIssues(prev => [newIssue, ...prev]);

      const createEvent = createActivityEvent(newIssue.id, 'ISSUE_CREATED', effectiveCurrentUser, {
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
    [canMutate, activeWorkspaceId, projects, effectiveCurrentUser, addDependency]
  );

  // Section 7 & 19: Canonical Team Creation (UX-14)
  const createTeam = useCallback(
    (input: {
      name: string;
      key: string;
      description?: string;
      color?: string;
      leadId?: string;
      memberIds?: string[];
    }): Team => {
      if (!canMutate || !activeWorkspaceId) {
        throw new Error('Cannot create team in an archived workspace or with read-only permissions.');
      }
      if (effectiveCurrentUser.role !== 'ADMIN') {
        throw new Error('Administrative mutations require ADMIN role.');
      }
      const plan = planCreateTeam(input, teams, users, effectiveCurrentUser.role);
      const newTeamWithWs: Team = {
        ...plan.newTeam,
        workspaceId: activeWorkspaceId,
      };
      const updatedTeams = [...masterTeams, newTeamWithWs];
      setMasterTeams(updatedTeams);
      try {
        localStorage.setItem(`${STORAGE_KEY}_teams`, JSON.stringify(updatedTeams));
      } catch (e) {
        console.warn('Failed to persist teams:', e);
      }
      if (input.memberIds && input.memberIds.length > 0) {
        updateCanonicalUsers(plan.updatedUsers);
      }
      return newTeamWithWs;
    },
    [canMutate, activeWorkspaceId, effectiveCurrentUser.role, teams, users, masterTeams, updateCanonicalUsers]
  );

  // Section 8 & 19: Canonical Project Creation (UX-14)
  const createProject = useCallback(
    (input: CreateProjectInput): Project => {
      if (!canMutate || !activeWorkspaceId) {
        throw new Error('Cannot create project in an archived workspace or with read-only permissions.');
      }
      if (effectiveCurrentUser.role === 'OBSERVER') {
        throw new Error('Project creation is not permitted for read-only OBSERVER role.');
      }
      const plan = planCreateProject(input, projects, teams, activeWorkspaceId, effectiveCurrentUser.role);
      const updatedProjects = [...masterProjects, plan.newProject];
      setMasterProjects(updatedProjects);
      try {
        localStorage.setItem(`${STORAGE_KEY}_projects`, JSON.stringify(updatedProjects));
      } catch (e) {
        console.warn('Failed to persist projects:', e);
      }
      return plan.newProject;
    },
    [canMutate, activeWorkspaceId, effectiveCurrentUser.role, projects, teams, masterProjects]
  );

  // Reset only after explicit confirmation; the helper snapshots all app-owned browser state.
  const resetToDemoData = useCallback(() => {
    if (typeof window === 'undefined') return;
    const confirmed = window.confirm(
      'Replace the current prototype state with the NEXUS fixture? A recoverable backup will be created first, and you may need to log in again after reload.'
    );
    if (!confirmed) return;

    try {
      const { backedUpKey } = resetPrototypeToNexus(window.localStorage, true);
      console.info(`NEXUS fixture reset complete. Previous state backup: ${backedUpKey}`);
      window.location.reload();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown storage error';
      window.alert(`NEXUS reset failed. Your previous state may still be available in a backup. ${message}`);
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
        currentUser: effectiveCurrentUser,
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
        createTeam,
        createProject,
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
