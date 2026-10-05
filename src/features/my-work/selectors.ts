/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Issue, Dependency, IssueState, IssuePriority } from '../../types';
import { getBlockerStatus } from '../../domain/dependency';

export interface MyWorkGroup {
  id: 'needsAttention' | 'inProgress' | 'inReview' | 'upNext' | 'recentlyCompleted';
  title: string;
  subtitle?: string;
  count: number;
  issues: Issue[];
  emptyMessage: string;
}

export interface BlockingOtherItem {
  issue: Issue;
  downstreamCount: number;
  downstreamIssues: Issue[];
  activeDownstreamIssues: Issue[];
}

export interface MyWorkSummary {
  totalAssigned: number;
  blockedCount: number;
  blockingCount: number;
  inProgressCount: number;
  inReviewCount: number;
  upNextCount: number;
  completedCount: number;
}

export interface MyWorkFilterParams {
  searchQuery?: string;
  lifecycleFilter?: string;
  blockerFilter?: string;
  priorityFilter?: string;
}

export interface MyWorkSelectionResult {
  needsAttention: Issue[];
  inProgress: Issue[];
  inReview: Issue[];
  upNext: Issue[];
  recentlyCompleted: Issue[];
  blockingOthers: BlockingOtherItem[];
  summary: MyWorkSummary;
  groups: MyWorkGroup[];
}

/**
 * Pure domain selector for /my-work.
 *
 * Implements the frozen deduplication rule:
 * An assigned issue appears in its SINGLE HIGHEST-PRIORITY actionable group:
 *   1. Needs Attention (Blocked, Urgent, or Overdue/Due today)
 *   2. In Progress (Active execution)
 *   3. In Review (Under technical/design review)
 *   4. Up Next (Planned for current cycle / Todo)
 *   5. Recently Completed (Done in current sprint/cadence)
 *
 * "Blocking Others" is evaluated as a dependency-impact surface exposing
 * downstream blast radius without duplicating issues in standard execution lists.
 */
export function selectMyWorkData(
  allIssues: Issue[],
  dependencies: Dependency[],
  currentUserId: string,
  filters: MyWorkFilterParams = {},
  todayDateStr: string = new Date().toISOString().split('T')[0]
): MyWorkSelectionResult {
  const issuesMap = new Map(allIssues.map(i => [i.id, i]));

  // 1. Filter issues assigned to current user
  const userAssignedIssues = allIssues.filter(issue => issue.assigneeId === currentUserId);

  // 2. Precompute blocker status for all assigned issues
  const blockerStatusMap = new Map(
    allIssues.map(issue => [issue.id, getBlockerStatus(issue.id, allIssues, dependencies)])
  );

  // Apply search and filters if provided
  const query = (filters.searchQuery || '').trim().toLowerCase();
  const stateFilter = filters.lifecycleFilter || 'ALL';
  const blockerFilter = filters.blockerFilter || 'ALL';
  const priorityFilter = filters.priorityFilter || 'ALL';

  const matchesFilters = (issue: Issue): boolean => {
    // Search query matches key or title
    if (query) {
      const matchesKey = issue.key.toLowerCase().includes(query);
      const matchesTitle = issue.title.toLowerCase().includes(query);
      if (!matchesKey && !matchesTitle) return false;
    }

    // Lifecycle state filter
    if (stateFilter !== 'ALL' && issue.state !== stateFilter) {
      return false;
    }

    // Priority filter
    if (priorityFilter !== 'ALL' && issue.priority !== priorityFilter) {
      return false;
    }

    // Blocker filter
    if (blockerFilter === 'BLOCKED_ONLY') {
      const status = blockerStatusMap.get(issue.id);
      if (!status || !status.isBlocked) return false;
    } else if (blockerFilter === 'UNBLOCKED_ONLY') {
      const status = blockerStatusMap.get(issue.id);
      if (status && status.isBlocked) return false;
    }

    return true;
  };

  const filteredAssignedIssues = userAssignedIssues.filter(matchesFilters);

  // Deduplicated bucketing arrays
  const needsAttention: Issue[] = [];
  const inProgress: Issue[] = [];
  const inReview: Issue[] = [];
  const upNext: Issue[] = [];
  const recentlyCompleted: Issue[] = [];

  // Categorize each assigned issue into exactly one actionable group
  for (const issue of filteredAssignedIssues) {
    const blockerInfo = blockerStatusMap.get(issue.id);
    const isBlocked = blockerInfo?.isBlocked ?? false;
    const isUrgent = issue.priority === 'URGENT';
    const isDueTodayOrOverdue =
      Boolean(issue.dueDate) && issue.dueDate! <= todayDateStr && issue.state !== 'DONE';

    // Tier 1: Needs Attention (Highest Priority)
    // Criteria: actively blocked, urgent incomplete task, or due/overdue
    if (issue.state !== 'DONE' && issue.state !== 'CANCELLED') {
      if (isBlocked || isUrgent || isDueTodayOrOverdue) {
        needsAttention.push(issue);
        continue;
      }
    }

    // Tier 2: In Progress
    if (issue.state === 'IN_PROGRESS') {
      inProgress.push(issue);
      continue;
    }

    // Tier 3: In Review
    if (issue.state === 'IN_REVIEW') {
      inReview.push(issue);
      continue;
    }

    // Tier 4: Up Next (TODO or BACKLOG scheduled)
    if (issue.state === 'TODO' || issue.state === 'BACKLOG') {
      upNext.push(issue);
      continue;
    }

    // Tier 5: Recently Completed (DONE)
    if (issue.state === 'DONE') {
      recentlyCompleted.push(issue);
      continue;
    }
  }

  // 3. Derive "Blocking Others" (Dependency-impact surface)
  // Find all issues where current user is assigned, issue is NOT DONE/CANCELLED,
  // and this issue actively blocks one or more downstream issues.
  const blockingOthers: BlockingOtherItem[] = [];

  for (const issue of userAssignedIssues) {
    if (issue.state === 'DONE' || issue.state === 'CANCELLED') continue;

    const blockerInfo = blockerStatusMap.get(issue.id);
    if (!blockerInfo || blockerInfo.downstreamIssues.length === 0) continue;

    // Filter to active downstream issues (those not done)
    const activeDownstream = blockerInfo.downstreamIssues.filter(
      down => down.state !== 'DONE' && down.state !== 'CANCELLED'
    );

    if (activeDownstream.length > 0) {
      blockingOthers.push({
        issue,
        downstreamCount: activeDownstream.length,
        downstreamIssues: blockerInfo.downstreamIssues,
        activeDownstreamIssues: activeDownstream,
      });
    }
  }

  // 4. Compute High-Density Summary Metrics
  const blockedCount = userAssignedIssues.filter(
    i => i.state !== 'DONE' && (blockerStatusMap.get(i.id)?.isBlocked ?? false)
  ).length;

  const totalDownstreamBlockedByMe = blockingOthers.reduce(
    (sum, item) => sum + item.activeDownstreamIssues.length,
    0
  );

  const summary: MyWorkSummary = {
    totalAssigned: userAssignedIssues.length,
    blockedCount,
    blockingCount: totalDownstreamBlockedByMe,
    inProgressCount: inProgress.length,
    inReviewCount: inReview.length,
    upNextCount: upNext.length,
    completedCount: recentlyCompleted.length,
  };

  const groups: MyWorkGroup[] = [
    {
      id: 'needsAttention',
      title: 'Needs Attention',
      subtitle: 'Blocked tasks, urgent priorities, and items due soon',
      count: needsAttention.length,
      issues: needsAttention,
      emptyMessage: 'No urgent or blocked issues currently requiring attention.',
    },
    {
      id: 'inProgress',
      title: 'In Progress',
      subtitle: 'Active development work',
      count: inProgress.length,
      issues: inProgress,
      emptyMessage: 'No unblocked tasks currently marked In Progress.',
    },
    {
      id: 'inReview',
      title: 'In Review',
      subtitle: 'Code reviews and design sign-offs',
      count: inReview.length,
      issues: inReview,
      emptyMessage: 'No issues currently in code or design review.',
    },
    {
      id: 'upNext',
      title: 'Up Next',
      subtitle: 'Planned tasks for active team cycle',
      count: upNext.length,
      issues: upNext,
      emptyMessage: 'No planned backlog items assigned for the current cycle.',
    },
    {
      id: 'recentlyCompleted',
      title: 'Recently Completed',
      subtitle: 'Tasks completed in the current cycle',
      count: recentlyCompleted.length,
      issues: recentlyCompleted,
      emptyMessage: 'No tasks completed yet in this cycle.',
    },
  ];

  return {
    needsAttention,
    inProgress,
    inReview,
    upNext,
    recentlyCompleted,
    blockingOthers,
    summary,
    groups,
  };
}
