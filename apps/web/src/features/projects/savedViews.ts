/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedView, FilterState, ViewMode, IssueState, IssuePriority, BlockerFilter } from '../../types';
import { ProjectIssuesFilterParams } from './selectors';

/**
 * Universal system presets available across all projects.
 */
export const DEFAULT_PROJECT_SAVED_VIEWS: SavedView[] = [
  {
    id: 'sys_proj_active_work',
    name: 'Active Work',
    isSystem: true,
    viewMode: 'LIST',
    projectId: 'ALL',
    filters: {
      searchQuery: '',
      state: 'IN_PROGRESS',
      priority: 'ALL',
      assigneeId: 'ALL',
      projectId: 'ALL',
      teamId: 'ALL',
      cycleId: 'ALL',
      milestoneId: 'ALL',
      blockerFilter: 'ALL',
    },
    executionConfig: {
      sort: 'manual',
      group: 'none',
    },
  },
  {
    id: 'sys_proj_blocked_triage',
    name: 'Blocked Triage',
    isSystem: true,
    viewMode: 'LIST',
    projectId: 'ALL',
    filters: {
      searchQuery: '',
      state: 'ALL',
      priority: 'ALL',
      assigneeId: 'ALL',
      projectId: 'ALL',
      teamId: 'ALL',
      cycleId: 'ALL',
      milestoneId: 'ALL',
      blockerFilter: 'BLOCKED_ONLY',
    },
    executionConfig: {
      sort: 'manual',
      group: 'none',
    },
  },
  {
    id: 'sys_proj_by_priority',
    name: 'Grouped by Priority',
    isSystem: true,
    viewMode: 'LIST',
    projectId: 'ALL',
    filters: {
      searchQuery: '',
      state: 'ALL',
      priority: 'ALL',
      assigneeId: 'ALL',
      projectId: 'ALL',
      teamId: 'ALL',
      cycleId: 'ALL',
      milestoneId: 'ALL',
      blockerFilter: 'ALL',
    },
    executionConfig: {
      sort: 'priority',
      group: 'priority',
    },
  },
];

/**
 * Resolves saved views available for a specific project.
 * Enforces project scoping:
 * - Includes universal system presets
 * - Includes custom views specifically scoped to this projectId
 * - Excludes any custom views created for other projects
 */
export function resolveProjectSavedViews(
  allSavedViews: SavedView[] = [],
  projectId: string
): SavedView[] {
  const result: SavedView[] = [];
  const seenIds = new Set<string>();

  // 1. Add base system presets
  for (const preset of DEFAULT_PROJECT_SAVED_VIEWS) {
    result.push(preset);
    seenIds.add(preset.id);
  }

  // 2. Add saved views from store matching this project
  for (const view of allSavedViews) {
    if (seenIds.has(view.id)) continue;

    // View is scoped to another project: strictly exclude
    if (view.projectId && view.projectId !== 'ALL' && view.projectId !== projectId) {
      continue;
    }

    // View is scoped to this project or is a universal system view
    if (view.projectId === projectId || (view.isSystem && (!view.projectId || view.projectId === 'ALL'))) {
      result.push(view);
      seenIds.add(view.id);
    }
  }

  return result;
}

/**
 * Builds a type-safe SavedView instance from current project execution and filter state.
 */
export function createProjectSavedView(params: {
  name: string;
  projectId: string;
  teamId?: string;
  currentFilters: ProjectIssuesFilterParams;
  viewMode?: ViewMode;
}): SavedView {
  const { name, projectId, teamId = 'ALL', currentFilters, viewMode = 'LIST' } = params;

  return {
    id: `view_proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim(),
    isSystem: false,
    projectId,
    viewMode,
    filters: {
      searchQuery: currentFilters.searchQuery || '',
      state: (currentFilters.state as IssueState) || 'ALL',
      priority: (currentFilters.priority as IssuePriority) || 'ALL',
      assigneeId: currentFilters.assigneeId || 'ALL',
      projectId,
      teamId,
      cycleId: currentFilters.cycleId || 'ALL',
      milestoneId: 'ALL',
      blockerFilter: (currentFilters.blockerFilter as BlockerFilter) || 'ALL',
    },
    executionConfig: {
      sort: currentFilters.sort && currentFilters.sort !== 'manual' ? currentFilters.sort : undefined,
      group: currentFilters.group && currentFilters.group !== 'none' ? currentFilters.group : undefined,
    },
  };
}

/**
 * Applies a SavedView to URLSearchParams, updating the canonical execution state.
 * Preserves unrelated parameters (e.g. drawer, tab) while updating search, filters, sort, and group.
 */
export function applySavedViewToUrl(
  view: SavedView,
  currentSearchParams: URLSearchParams
): URLSearchParams {
  const next = new URLSearchParams(currentSearchParams);

  // 1. Search Query
  if (view.filters.searchQuery) {
    next.set('q', view.filters.searchQuery);
  } else {
    next.delete('q');
  }

  // 2. Lifecycle State
  if (view.filters.state && view.filters.state !== 'ALL') {
    next.set('state', view.filters.state);
  } else {
    next.delete('state');
  }

  // 3. Priority
  if (view.filters.priority && view.filters.priority !== 'ALL') {
    next.set('priority', view.filters.priority);
  } else {
    next.delete('priority');
  }

  // 4. Assignee
  if (view.filters.assigneeId && view.filters.assigneeId !== 'ALL') {
    next.set('assignee', view.filters.assigneeId);
  } else {
    next.delete('assignee');
  }

  // 5. Blocker filter
  if (view.filters.blockerFilter && view.filters.blockerFilter !== 'ALL') {
    next.set('blocker', view.filters.blockerFilter);
  } else {
    next.delete('blocker');
  }

  // 6. Cycle
  if (view.filters.cycleId && view.filters.cycleId !== 'ALL') {
    next.set('cycle', view.filters.cycleId);
  } else {
    next.delete('cycle');
  }

  // 7. Sort
  const sort = view.executionConfig?.sort;
  if (sort && sort !== 'manual') {
    next.set('sort', sort);
  } else {
    next.delete('sort');
  }

  // 8. Group
  const group = view.executionConfig?.group;
  if (group && group !== 'none') {
    next.set('group', group);
  } else {
    next.delete('group');
  }

  return next;
}

/**
 * Safe serialization of saved views for localStorage persistence.
 */
export function serializeSavedViews(views: SavedView[]): string {
  return JSON.stringify(views);
}

/**
 * Safe deserialization of saved views with validation and fallback.
 */
export function deserializeSavedViews(
  raw: string | null | undefined,
  fallback: SavedView[] = DEFAULT_PROJECT_SAVED_VIEWS
): SavedView[] {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return fallback;
    return parsed.filter(v => v && typeof v === 'object' && typeof v.id === 'string' && typeof v.name === 'string');
  } catch {
    return fallback;
  }
}
