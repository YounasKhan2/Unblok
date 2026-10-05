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
import { canTransition } from '../domain/lifecycle';
import {
  getBlockerStatus,
  validateHardCompletionGuard,
  wouldCreateCycle,
} from '../domain/dependency';
import { createActivityEvent, checkBlockerBoundaryEvents } from '../domain/audit';
import {
  UNBLOK_STORAGE_NAMESPACE,
  migrateStorageNamespace,
  clearAllStoredEntities,
} from './storageMigration';

interface CompletionGuardError {
  issue: Issue;
  blockers: Issue[];
  message: string;
}

interface CycleError {
  cyclePath: string[];
  message: string;
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
  updateIssueCycle: (issueId: string, cycleId?: string) => void;
  bulkUpdateCycle: (cycleId?: string) => void;
  rolloverIncompleteIssues: (fromCycleId: string, toCycleId: string) => { rolledCount: number };
  createCycle: (data: { name: string; startDate: string; endDate: string; description?: string }) => Cycle;

  // Strategic Milestones (Phase B.2 — Objectives)
  milestones: Milestone[];
  updateIssueMilestone: (issueId: string, milestoneId?: string) => void;
  createMilestone: (data: { name: string; targetDate: string; description: string; teamId?: string }) => Milestone;
  updateMilestone: (id: string, updates: Partial<Milestone>) => void;

  // Collaboration & Threaded Comments (Phase C)
  comments: IssueComment[];
  addComment: (issueId: string, content: string, parentId?: string) => IssueComment;
  deleteComment: (commentId: string) => void;

  // Issue Operations
  updateIssueState: (issueId: string, newState: IssueState) => boolean;
  updateIssuePriority: (issueId: string, newPriority: IssuePriority) => void;
  updateIssueAssignee: (issueId: string, assigneeId?: string) => void;
  updateIssueDetails: (issueId: string, title: string, description: string) => void;
  updateIssueDates: (issueId: string, startDate?: string, dueDate?: string) => void;
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

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from localStorage or initialize with seed data
  const [issues, setIssues] = useState<Issue[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_issues`);
      return stored ? JSON.parse(stored) : INITIAL_ISSUES;
    } catch {
      return INITIAL_ISSUES;
    }
  });

  const [dependencies, setDependencies] = useState<Dependency[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_dependencies`);
      return stored ? JSON.parse(stored) : INITIAL_DEPENDENCIES;
    } catch {
      return INITIAL_DEPENDENCIES;
    }
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_projects`);
      return stored ? JSON.parse(stored) : INITIAL_PROJECTS;
    } catch {
      return INITIAL_PROJECTS;
    }
  });

  const [activities, setActivities] = useState<ActivityEvent[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_activities`);
      return stored ? JSON.parse(stored) : INITIAL_ACTIVITIES;
    } catch {
      return INITIAL_ACTIVITIES;
    }
  });

  const [teams] = useState<Team[]>(INITIAL_TEAMS);
  const [users] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]);

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

  // Cycles state
  const [cycles, setCycles] = useState<Cycle[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_cycles`);
      return stored ? JSON.parse(stored) : INITIAL_CYCLES;
    } catch {
      return INITIAL_CYCLES;
    }
  });

  const activeCycle = useMemo(
    () => cycles.find(c => c.status === 'ACTIVE') || cycles[0] || null,
    [cycles]
  );

  // Milestones state
  const [milestones, setMilestones] = useState<Milestone[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_milestones`);
      return stored ? JSON.parse(stored) : INITIAL_MILESTONES;
    } catch {
      return INITIAL_MILESTONES;
    }
  });

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

  // Persist state
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_issues`, JSON.stringify(issues));
  }, [issues]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_dependencies`, JSON.stringify(dependencies));
  }, [dependencies]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_projects`, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_activities`, JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_saved_views`, JSON.stringify(savedViews));
  }, [savedViews]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_cycles`, JSON.stringify(cycles));
  }, [cycles]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_milestones`, JSON.stringify(milestones));
  }, [milestones]);

  // Comments state
  const [comments, setComments] = useState<IssueComment[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_comments`);
      return stored ? JSON.parse(stored) : INITIAL_COMMENTS;
    } catch {
      return INITIAL_COMMENTS;
    }
  });

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_comments`, JSON.stringify(comments));
  }, [comments]);

  const issuesMap = useMemo(() => new Map(issues.map(i => [i.id, i])), [issues]);

  const selectedIssue = useMemo(
    () => (selectedIssueId ? issuesMap.get(selectedIssueId) || null : null),
    [selectedIssueId, issuesMap]
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
    (issueId: string, cycleId?: string) => {
      const now = new Date().toISOString();
      setIssues(prev =>
        prev.map(i =>
          i.id === issueId ? { ...i, cycleId, updatedAt: now, version: i.version + 1 } : i
        )
      );

      const targetCycle = cycles.find(c => c.id === cycleId);
      const targetIssue = issuesMap.get(issueId);
      if (targetIssue) {
        const ev = createActivityEvent(issueId, 'STATE_CHANGED', currentUser, {
          reason: targetCycle ? `Assigned to ${targetCycle.name}` : 'Removed from cycle',
        });
        setActivities(prev => [ev, ...prev]);
      }
    },
    [cycles, issuesMap, currentUser]
  );

  // Bulk Update Cycle
  const bulkUpdateCycle = useCallback(
    (cycleId?: string) => {
      if (selectedIssueIds.length === 0) return;
      const now = new Date().toISOString();
      setIssues(prev =>
        prev.map(i =>
          selectedIssueIds.includes(i.id)
            ? { ...i, cycleId, updatedAt: now, version: i.version + 1 }
            : i
        )
      );
    },
    [selectedIssueIds]
  );

  // Rollover Incomplete Issues
  const rolloverIncompleteIssues = useCallback(
    (fromCycleId: string, toCycleId: string): { rolledCount: number } => {
      const now = new Date().toISOString();
      const eligibleIds: string[] = [];

      for (const issue of issues) {
        if (
          issue.cycleId === fromCycleId &&
          issue.state !== 'DONE' &&
          issue.state !== 'CANCELLED'
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

        const toCycle = cycles.find(c => c.id === toCycleId);
        const events = eligibleIds.map(id =>
          createActivityEvent(id, 'STATE_CHANGED', currentUser, {
            reason: `Rolled over into ${toCycle?.name || toCycleId}`,
          })
        );
        setActivities(prev => [...events, ...prev]);
      }

      return { rolledCount: eligibleIds.length };
    },
    [issues, cycles, currentUser]
  );

  // Create Cycle
  const createCycle = useCallback(
    (data: { name: string; startDate: string; endDate: string; description?: string }): Cycle => {
      const newCycle: Cycle = {
        id: `cycle_${Date.now()}`,
        name: data.name.trim(),
        startDate: data.startDate,
        endDate: data.endDate,
        status: 'UPCOMING',
        teamId: 'ALL',
        description: data.description?.trim(),
      };
      setCycles(prev => [...prev, newCycle]);
      return newCycle;
    },
    []
  );

  // Strategic Milestones Methods
  const updateIssueMilestone = useCallback(
    (issueId: string, milestoneId?: string) => {
      const now = new Date().toISOString();
      setIssues(prev =>
        prev.map(i =>
          i.id === issueId ? { ...i, milestoneId, updatedAt: now, version: i.version + 1 } : i
        )
      );

      const targetMilestone = milestones.find(m => m.id === milestoneId);
      const targetIssue = issuesMap.get(issueId);
      if (targetIssue) {
        const ev = createActivityEvent(issueId, 'STATE_CHANGED', currentUser, {
          reason: targetMilestone
            ? `Assigned to milestone ${targetMilestone.name}`
            : 'Removed from milestone',
        });
        setActivities(prev => [ev, ...prev]);
      }
    },
    [milestones, issuesMap, currentUser]
  );

  const createMilestone = useCallback(
    (data: { name: string; targetDate: string; description: string; teamId?: string }): Milestone => {
      const newMilestone: Milestone = {
        id: `milestone_${Date.now()}`,
        name: data.name.trim(),
        targetDate: data.targetDate,
        description: data.description.trim(),
        teamId: data.teamId || 'ALL',
      };
      setMilestones(prev => [...prev, newMilestone]);
      return newMilestone;
    },
    []
  );

  const updateMilestone = useCallback(
    (id: string, updates: Partial<Milestone>) => {
      setMilestones(prev =>
        prev.map(m => (m.id === id ? { ...m, ...updates } : m))
      );
    },
    []
  );

  // Collaboration & Threaded Comments (Phase C)
  const addComment = useCallback(
    (issueId: string, content: string, parentId?: string): IssueComment => {
      const now = new Date().toISOString();
      const detectedMentions: string[] = [];
      for (const u of users) {
        if (content.toLowerCase().includes(`@${u.name.toLowerCase()}`)) {
          detectedMentions.push(u.id);
        }
      }

      const newComment: IssueComment = {
        id: `comm_${Date.now()}`,
        issueId,
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorAvatar: currentUser.avatar,
        content: content.trim(),
        createdAt: now,
        parentId,
        mentions: detectedMentions,
      };

      setComments(prev => [...prev, newComment]);

      // Record Activity Event
      const commentEvent = createActivityEvent(issueId, 'COMMENT_ADDED', currentUser, {
        commentId: newComment.id,
        reason: content.length > 60 ? `${content.substring(0, 60)}...` : content,
      });

      const mentionEvents = detectedMentions.map(userId => {
        const u = users.find(x => x.id === userId);
        return createActivityEvent(issueId, 'USER_MENTIONED', currentUser, {
          commentId: newComment.id,
          mentionedUserName: u?.name || 'teammate',
        });
      });

      setActivities(prev => [commentEvent, ...mentionEvents, ...prev]);

      return newComment;
    },
    [currentUser, users]
  );

  const deleteComment = useCallback((commentId: string) => {
    setComments(prev => prev.filter(c => c.id !== commentId && c.parentId !== commentId));
  }, []);

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
    (issueId: string, startDate?: string, dueDate?: string) => {
      const now = new Date().toISOString();
      setIssues(prev =>
        prev.map(i =>
          i.id === issueId
            ? { ...i, startDate, dueDate, updatedAt: now, version: i.version + 1 }
            : i
        )
      );
    },
    []
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

      const upstream = issuesMap.get(upstreamId);
      const downstream = issuesMap.get(downstreamId);
      if (!upstream || !downstream) return false;

      // Previous active count on downstream
      const prevStatus = getBlockerStatus(downstreamId, issues, dependencies);

      const newDep: Dependency = {
        id: `dep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
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
        key: issueKey,
        projectId: targetProject.id,
        teamId: targetProject.teamId,
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
    [projects, currentUser, addDependency]
  );

  // Reset demo data
  const resetToDemoData = useCallback(() => {
    clearAllStoredEntities();

    setIssues(INITIAL_ISSUES);
    setDependencies(INITIAL_DEPENDENCIES);
    setProjects(INITIAL_PROJECTS);
    setActivities(INITIAL_ACTIVITIES);
    setSavedViews(DEFAULT_SAVED_VIEWS);
    setCycles(INITIAL_CYCLES);
    setMilestones(INITIAL_MILESTONES);
    setComments(INITIAL_COMMENTS);
    setSelectedIssueId(INITIAL_ISSUES[1].id);
    setFilters(initialFilters);
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
        setCurrentUser,
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
