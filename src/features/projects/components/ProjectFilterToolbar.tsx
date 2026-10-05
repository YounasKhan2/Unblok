/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Search,
  X,
  Filter,
  ArrowUpDown,
  Layers,
  Bookmark,
  Plus,
  ShieldAlert,
  GitFork,
} from 'lucide-react';
import { User, Cycle, SavedView } from '../../../types';
import { ProjectIssuesFilterParams } from '../selectors';
import { SavedViewModal } from './SavedViewModal';

export type SavedViewItem = SavedView;

interface ProjectFilterToolbarProps {
  filters: ProjectIssuesFilterParams;
  onFilterChange: (updates: Partial<ProjectIssuesFilterParams>) => void;
  onClearFilters: () => void;
  users: User[];
  cycles: Cycle[];
  savedViews: SavedView[];
  onApplySavedView: (view: SavedView) => void;
  onSaveView: (name: string) => void;
}

export const ProjectFilterToolbar: React.FC<ProjectFilterToolbarProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  users,
  cycles,
  savedViews,
  onApplySavedView,
  onSaveView,
}) => {
  const [isSavedViewModalOpen, setIsSavedViewModalOpen] = useState(false);

  const hasActiveFilters =
    Boolean(filters.searchQuery) ||
    (filters.state && filters.state !== 'ALL') ||
    (filters.priority && filters.priority !== 'ALL') ||
    (filters.assigneeId && filters.assigneeId !== 'ALL') ||
    (filters.blockerFilter && filters.blockerFilter !== 'ALL') ||
    (filters.cycleId && filters.cycleId !== 'ALL') ||
    (filters.sort && filters.sort !== 'manual') ||
    (filters.group && filters.group !== 'none');

  const currentFilterSummary = [
    filters.state && filters.state !== 'ALL' ? `state:${filters.state}` : null,
    filters.priority && filters.priority !== 'ALL' ? `pri:${filters.priority}` : null,
    filters.blockerFilter && filters.blockerFilter !== 'ALL' ? `blocker:${filters.blockerFilter}` : null,
    filters.sort && filters.sort !== 'manual' ? `sort:${filters.sort}` : null,
    filters.group && filters.group !== 'none' ? `group:${filters.group}` : null,
    filters.searchQuery ? `q:"${filters.searchQuery}"` : null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="bg-white border-b border-border px-4 py-2 flex flex-wrap items-center justify-between gap-2.5 text-xs select-none">
      {/* 1. Left: Search Bar & Core Filters */}
      <div className="flex items-center gap-2 flex-wrap flex-1 min-w-[280px]">
        {/* Search Input */}
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            value={filters.searchQuery || ''}
            onChange={e => onFilterChange({ searchQuery: e.target.value })}
            placeholder="Search or is:blocked, priority:... (/)"
            className="h-7 w-44 sm:w-56 pl-8 pr-7 bg-surface-muted border border-border rounded-[5px] text-xs text-text-primary placeholder-[#a4a097] focus:bg-white focus:border-accent focus:outline-none transition-all"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onFilterChange({ searchQuery: '' })}
              className="absolute right-2 text-text-muted hover:text-text-primary cursor-pointer"
              title="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* State Filter */}
        <select
          value={filters.state || 'ALL'}
          onChange={e => onFilterChange({ state: e.target.value })}
          className="h-7 px-2 bg-surface-muted border border-border rounded-[5px] text-xs text-text-secondary hover:border-border-strong focus:outline-none cursor-pointer"
          aria-label="Filter by lifecycle state"
        >
          <option value="ALL">All States</option>
          <option value="BACKLOG">Backlog</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="DONE">Done</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        {/* Priority Filter */}
        <select
          value={filters.priority || 'ALL'}
          onChange={e => onFilterChange({ priority: e.target.value })}
          className="h-7 px-2 bg-surface-muted border border-border rounded-[5px] text-xs text-text-secondary hover:border-border-strong focus:outline-none cursor-pointer hidden sm:inline-block"
          aria-label="Filter by priority"
        >
          <option value="ALL">All Priorities</option>
          <option value="URGENT">Urgent</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        {/* Blocker Filter */}
        <select
          value={filters.blockerFilter || 'ALL'}
          onChange={e => onFilterChange({ blockerFilter: e.target.value })}
          className="h-7 px-2 bg-surface-muted border border-border rounded-[5px] text-xs text-text-secondary hover:border-border-strong focus:outline-none cursor-pointer"
          aria-label="Filter by dependency / blocker status"
        >
          <option value="ALL">All Dependencies</option>
          <option value="BLOCKED_ONLY">Blocked Only</option>
          <option value="UNBLOCKED_ONLY">Unblocked Only</option>
          <option value="BLOCKING_OTHERS">Blocking Teammates</option>
        </select>

        {/* Assignee Filter */}
        <select
          value={filters.assigneeId || 'ALL'}
          onChange={e => onFilterChange({ assigneeId: e.target.value })}
          className="h-7 px-2 bg-surface-muted border border-border rounded-[5px] text-xs text-text-secondary hover:border-border-strong focus:outline-none cursor-pointer hidden md:inline-block"
          aria-label="Filter by assignee"
        >
          <option value="ALL">All Assignees</option>
          <option value="UNASSIGNED">Unassigned</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>

      {/* 2. Right: Sort, Group & Saved Views */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Sort Menu */}
        <div className="flex items-center gap-1">
          <ArrowUpDown className="w-3.5 h-3.5 text-text-muted" />
          <select
            value={filters.sort || 'manual'}
            onChange={e => onFilterChange({ sort: e.target.value })}
            className="h-7 px-2 bg-surface-muted border border-border rounded-[5px] text-xs text-text-secondary hover:border-border-strong focus:outline-none cursor-pointer"
            aria-label="Sort issues"
          >
            <option value="manual">Manual Sort</option>
            <option value="priority">Priority</option>
            <option value="updated">Recently Updated</option>
            <option value="created">Created Date</option>
            <option value="dueDate">Due Date</option>
          </select>
        </div>

        {/* Group Menu */}
        <div className="flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-text-muted" />
          <select
            value={filters.group || 'none'}
            onChange={e => onFilterChange({ group: e.target.value })}
            className="h-7 px-2 bg-surface-muted border border-border rounded-[5px] text-xs text-text-secondary hover:border-border-strong focus:outline-none cursor-pointer"
            aria-label="Group issues"
          >
            <option value="none">No Grouping</option>
            <option value="state">Group by State</option>
            <option value="priority">Group by Priority</option>
            <option value="assignee">Group by Assignee</option>
            <option value="cycle">Group by Cycle</option>
          </select>
        </div>

        {/* Saved Views Dropdown */}
        {savedViews.length > 0 && (
          <select
            onChange={e => {
              const view = savedViews.find(v => v.id === e.target.value);
              if (view) onApplySavedView(view);
            }}
            defaultValue=""
            className="h-7 px-2 bg-surface-muted border border-border rounded-[5px] text-xs text-accent font-medium hover:border-border-strong focus:outline-none cursor-pointer"
            aria-label="Saved Views"
          >
            <option value="" disabled>
              Views ({savedViews.length})
            </option>
            {savedViews.map(v => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        )}

        {/* Save Current View Button */}
        <button
          onClick={() => setIsSavedViewModalOpen(true)}
          className="h-7 px-2 border border-border hover:border-accent hover:text-accent rounded-[5px] flex items-center gap-1 text-xs text-text-muted bg-white transition-colors cursor-pointer"
          title="Save active filter configuration as a view"
        >
          <Bookmark className="w-3 h-3" />
          <span className="hidden lg:inline">Save View</span>
        </button>

        {/* Reset Filter Button */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="h-7 px-2 text-text-muted hover:text-text-primary flex items-center gap-1 text-xs hover:bg-surface-muted rounded-[5px] transition-colors cursor-pointer"
            title="Reset all search, filter, sort, and group options"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      <SavedViewModal
        isOpen={isSavedViewModalOpen}
        onClose={() => setIsSavedViewModalOpen(false)}
        onSave={onSaveView}
        currentFilterDescription={currentFilterSummary || 'All defaults'}
      />
    </div>
  );
};
