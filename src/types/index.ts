export type IssueState = 
  | 'BACKLOG' 
  | 'TODO' 
  | 'IN_PROGRESS' 
  | 'IN_REVIEW' 
  | 'DONE' 
  | 'CANCELLED';

export type IssuePriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';

export type UserRole = 'ADMIN' | 'MEMBER' | 'OBSERVER';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  teamId: string;
}

export interface Team {
  id: string;
  name: string;
  key: string;
  color: string;
  description: string;
}

export interface Project {
  id: string;
  teamId: string;
  name: string;
  key: string;
  description: string;
  currentSequence: number;
}

export interface Dependency {
  id: string;
  upstreamIssueId: string;   // A (the blocker)
  downstreamIssueId: string; // B (the blocked issue) - A BLOCKS B
  createdAt: string;
  createdBy: string;
}

export type ActivityEventType =
  | 'ISSUE_CREATED'
  | 'STATE_CHANGED'
  | 'ASSIGNEE_CHANGED'
  | 'PRIORITY_CHANGED'
  | 'DEPENDENCY_ADDED'
  | 'DEPENDENCY_REMOVED'
  | 'ISSUE_BLOCKED'
  | 'ISSUE_UNBLOCKED'
  | 'TITLE_MODIFIED'
  | 'DESCRIPTION_MODIFIED'
  | 'COMMENT_ADDED'
  | 'USER_MENTIONED'
  | 'CYCLE_ASSIGNED'
  | 'CYCLE_REMOVED'
  | 'CYCLE_ROLLED_OVER'
  | 'MILESTONE_LINKED'
  | 'MILESTONE_UNLINKED'
  | 'SCHEDULE_CHANGED';

export interface IssueComment {
  id: string;
  issueId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
  parentId?: string; // For threaded replies
  mentions?: string[]; // IDs or names of mentioned users
}

export interface ActivityEvent {
  id: string;
  issueId: string;
  eventType: ActivityEventType;
  userId: string;
  userName: string;
  timestamp: string;
  details: {
    from?: any;
    to?: any;
    fromAssigneeId?: string;
    toAssigneeId?: string;
    targetUserId?: string;
    targetUserName?: string;
    targetIssueKey?: string;
    targetIssueTitle?: string;
    reason?: string;
    upstreamKey?: string;
    downstreamKey?: string;
    commentId?: string;
    mentionedUserName?: string;
    cycleId?: string;
    cycleName?: string;
    milestoneId?: string;
    milestoneName?: string;
    sourceCycleId?: string;
    targetCycleId?: string;
  };
}

export interface Cycle {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'UPCOMING' | 'COMPLETED';
  teamId: string;
  description?: string;
}

export type MilestoneHealth = 'ON_TRACK' | 'AT_RISK' | 'BLOCKED';

export interface Milestone {
  id: string;
  name: string;
  targetDate: string;
  description: string;
  teamId?: string;
}

export interface Issue {
  id: string;
  key: string;               // e.g. "ENG-142"
  projectId: string;
  teamId: string;
  cycleId?: string;          // Optional assignment to delivery cycle/sprint
  milestoneId?: string;      // Optional assignment to strategic milestone
  startDate?: string;        // e.g. "2026-10-01"
  dueDate?: string;          // e.g. "2026-10-14"
  title: string;
  description: string;
  state: IssueState;
  priority: IssuePriority;
  assigneeId?: string;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface BlockerStatusInfo {
  activeCount: number;
  resolvedCount: number;
  activeBlockers: Issue[];
  resolvedBlockers: Issue[];
  downstreamIssues: Issue[];
  isBlocked: boolean;
}

export type ViewMode = 'LIST' | 'BOARD' | 'GRAPH' | 'CYCLES' | 'MILESTONES' | 'TIMELINE';

export type BlockerFilter = 'ALL' | 'BLOCKED_ONLY' | 'UNBLOCKED_ONLY' | 'HAS_DOWNSTREAM';

export interface FilterState {
  searchQuery: string;
  state: IssueState | 'ALL';
  priority: IssuePriority | 'ALL';
  assigneeId: string | 'ALL';
  projectId: string | 'ALL';
  teamId: string | 'ALL';
  cycleId?: string | 'ALL';
  milestoneId?: string | 'ALL';
  blockerFilter: BlockerFilter;
}

export interface ProjectExecutionConfig {
  sort?: string;
  group?: string;
}

export interface SavedView {
  id: string;
  name: string;
  icon?: string;
  filters: FilterState;
  viewMode?: ViewMode;
  isSystem?: boolean;
  projectId?: string;
  executionConfig?: ProjectExecutionConfig;
}


