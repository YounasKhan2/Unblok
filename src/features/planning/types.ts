/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Cycle, Milestone, Issue, Team, Project, User, IssuePriority, IssueState } from '../../types';

export type PlanningMilestoneHealth = 'ON_TRACK' | 'AT_RISK' | 'BLOCKED';

export interface CycleProgress {
  total: number;
  completed: number;
  remaining: number;
  blocked: number;
  inProgress: number;
  todo: number;
  percent: number;
  daysRemaining: number;
  totalDays: number;
}

export interface ClassifiedCycles {
  active: Cycle[];
  upcoming: Cycle[];
  completed: Cycle[];
}

export interface CycleSummaryData {
  cycle: Cycle;
  team?: Team;
  progress: CycleProgress;
}

export interface MilestoneProgress {
  total: number;
  completed: number;
  remaining: number;
  blocked: number;
  inProgress: number;
  percent: number;
  daysRemaining: number;
  isOverdue: boolean;
}

export interface MilestoneSummaryData {
  milestone: Milestone;
  health: PlanningMilestoneHealth;
  isCompleted: boolean;
  progress: MilestoneProgress;
  contributingTeams: Team[];
  contributingProjects: Project[];
  issues: Issue[];
  blockedIssues: Issue[];
}

export type RoadmapViewMode = 'team' | 'assignee';

export interface RoadmapFilterState {
  group: RoadmapViewMode;
  team: string; // 'ALL' | teamKey or teamId
  assignee: string; // 'ALL' | userId
  cycle: string; // 'ALL' | cycleId
  milestone: string; // 'ALL' | milestoneId
  blockedOnly: boolean;
  searchQuery: string;
}

export interface RoadmapDayColumn {
  dateStr: string; // 'YYYY-MM-DD'
  dayNum: number;
  dayOfWeek: string; // 'Mon', 'Tue', etc.
  monthName: string; // 'Oct', 'Nov', etc.
  isWeekend: boolean;
  isToday: boolean;
}

export interface RoadmapScheduledIssue {
  issue: Issue;
  project?: Project;
  team?: Team;
  assignee?: User;
  isBlocked: boolean;
  blockedCount: number;
  startCol: number; // 0-indexed column in current schedule window
  spanCols: number; // how many days it spans
  startsBeforeWindow: boolean;
  endsAfterWindow: boolean;
}

export interface RoadmapRosterGroup {
  id: string;
  name: string;
  key?: string;
  avatar?: string;
  color?: string;
  secondaryInfo?: string;
  totalScheduled: number;
  blockedCount: number;
  issues: RoadmapScheduledIssue[];
}

export type ProjectPlanningViewMode = 'cycles' | 'milestones';

export interface ProjectPlanningFilterState {
  view: ProjectPlanningViewMode;
  searchQuery: string;
  priorityFilter: string;
  stateFilter: string;
}

export interface ProjectCycleAllocationGroup {
  cycle: Cycle;
  issues: Issue[];
  progress: CycleProgress;
}

export interface ProjectMilestoneAllocationGroup {
  milestone?: Milestone; // undefined represents "No Milestone"
  issues: Issue[];
  completedCount: number;
  totalCount: number;
}
