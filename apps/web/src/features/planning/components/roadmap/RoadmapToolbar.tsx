/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Team, User, Cycle, Milestone } from '../../../../types';
import { RoadmapFilterState } from '../../types';
import { Button } from '../../../../components/ui/Button';
import {
  Users,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  RotateCcw,
  Calendar,
  ShieldAlert,
  Plus,
} from 'lucide-react';

interface RoadmapToolbarProps {
  filters: RoadmapFilterState;
  onFilterChange: (updates: Partial<RoadmapFilterState>) => void;
  onResetFilters: () => void;
  rangeLabel: string;
  onPrevRange: () => void;
  onNextRange: () => void;
  onToday: () => void;
  onOpenScheduleModal: () => void;
  teams: Team[];
  users: User[];
  cycles: Cycle[];
  milestones: Milestone[];
  isObserver: boolean;
}

export const RoadmapToolbar: React.FC<RoadmapToolbarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  rangeLabel,
  onPrevRange,
  onNextRange,
  onToday,
  onOpenScheduleModal,
  teams,
  users,
  cycles,
  milestones,
  isObserver,
}) => {
  const hasActiveFilters =
    filters.team !== 'ALL' ||
    filters.assignee !== 'ALL' ||
    filters.cycle !== 'ALL' ||
    filters.milestone !== 'ALL' ||
    filters.blockedOnly ||
    Boolean(filters.searchQuery);

  return (
    <div className="bg-surface-base border-b border-border px-4 py-2.5 flex flex-col gap-2.5 shrink-0 select-none">
      {/* Top Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Mode & Navigation */}
        <div className="flex items-center gap-3">
          {/* Grouping Toggle */}
          <div
            role="group"
            aria-label="Roadmap grouping"
            className="inline-flex items-center p-0.5 rounded-[6px] bg-surface-muted border border-border"
          >
            <button
              type="button"
              onClick={() => onFilterChange({ group: 'team' })}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-semibold cursor-pointer transition-colors ${
                filters.group === 'team'
                  ? 'bg-surface-base text-text-primary shadow-2xs border border-border'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>By Team</span>
            </button>
            <button
              type="button"
              onClick={() => onFilterChange({ group: 'assignee' })}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-semibold cursor-pointer transition-colors ${
                filters.group === 'assignee'
                  ? 'bg-surface-base text-text-primary shadow-2xs border border-border'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>By Assignee</span>
            </button>
          </div>

          {/* Date Window Navigation */}
          <div className="inline-flex items-center gap-1 bg-surface-base border border-border rounded-[6px] p-0.5">
            <button
              type="button"
              onClick={onPrevRange}
              aria-label="Previous date range"
              className="p-1 text-text-secondary hover:text-text-primary hover:bg-surface-muted rounded cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onToday}
              className="px-2 py-0.5 text-xs font-semibold text-text-primary hover:bg-surface-muted rounded cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={onNextRange}
              aria-label="Next date range"
              className="p-1 text-text-secondary hover:text-text-primary hover:bg-surface-muted rounded cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <span className="text-xs font-bold text-text-primary font-mono hidden sm:inline">
            {rangeLabel}
          </span>
        </div>

        {/* Primary Action: Schedule Work */}
        <div className="flex items-center gap-2">
          {!isObserver && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onOpenScheduleModal}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Schedule Work
            </Button>
          )}
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {/* Search */}
        <input
          type="text"
          placeholder="Filter by key or title..."
          value={filters.searchQuery}
          onChange={e => onFilterChange({ searchQuery: e.target.value })}
          className="h-7 w-40 text-xs px-2 rounded-[4px] border border-border bg-surface-base text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
        />

        {/* Team filter */}
        <select
          value={filters.team}
          onChange={e => onFilterChange({ team: e.target.value })}
          className="h-7 text-xs px-2 rounded-[4px] border border-border bg-surface-base text-text-primary focus:outline-none focus:border-accent"
        >
          <option value="ALL">All Teams</option>
          {teams.map(t => (
            <option key={t.id} value={t.key}>
              {t.name} ({t.key})
            </option>
          ))}
        </select>

        {/* Assignee filter */}
        <select
          value={filters.assignee}
          onChange={e => onFilterChange({ assignee: e.target.value })}
          className="h-7 text-xs px-2 rounded-[4px] border border-border bg-surface-base text-text-primary focus:outline-none focus:border-accent"
        >
          <option value="ALL">All Assignees</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>

        {/* Cycle filter */}
        <select
          value={filters.cycle}
          onChange={e => onFilterChange({ cycle: e.target.value })}
          className="h-7 text-xs px-2 rounded-[4px] border border-border bg-surface-base text-text-primary focus:outline-none focus:border-accent"
        >
          <option value="ALL">All Cycles</option>
          {cycles.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Milestone filter */}
        <select
          value={filters.milestone}
          onChange={e => onFilterChange({ milestone: e.target.value })}
          className="h-7 text-xs px-2 rounded-[4px] border border-border bg-surface-base text-text-primary focus:outline-none focus:border-accent"
        >
          <option value="ALL">All Milestones</option>
          {milestones.map(m => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        {/* Blocked filter toggle */}
        <button
          type="button"
          onClick={() => onFilterChange({ blockedOnly: !filters.blockedOnly })}
          className={`h-7 px-2.5 rounded-[4px] border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
            filters.blockedOnly
              ? 'bg-danger/10 text-danger border-danger/40'
              : 'bg-surface-base text-text-secondary border-border hover:bg-surface-muted'
          }`}
        >
          <ShieldAlert className="w-3 h-3" />
          <span>Blocked Only</span>
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="h-7 px-2 text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1 cursor-pointer"
            title="Reset filters"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
};
