/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Network, Grid3X3, Plus, Search, ShieldAlert, Users } from 'lucide-react';
import { DependencyFilterState, DependencyViewMode } from '../types';
import { Team, Project } from '../../../types';

interface DependencyViewTabsProps {
  currentView: DependencyViewMode;
  onViewChange: (view: DependencyViewMode) => void;
  filters: DependencyFilterState;
  onFilterChange: (updates: Partial<DependencyFilterState>) => void;
  teams: Team[];
  projects: Project[];
  onAddDependencyClick: () => void;
  isObserver: boolean;
}

export const DependencyViewTabs: React.FC<DependencyViewTabsProps> = ({
  currentView,
  onViewChange,
  filters,
  onFilterChange,
  teams,
  projects,
  onAddDependencyClick,
  isObserver,
}) => {
  return (
    <div className="border-b border-border bg-surface-base px-4 py-2 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
      {/* View Switcher Tabs */}
      <div className="flex items-center gap-1">
        <div
          role="tablist"
          aria-label="Dependency Intelligence View Modes"
          className="inline-flex items-center p-0.5 rounded-[6px] bg-surface-muted border border-border"
        >
          <button
            role="tab"
            aria-selected={currentView === 'graph'}
            onClick={() => onViewChange('graph')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] text-xs font-medium cursor-pointer transition-colors ${
              currentView === 'graph'
                ? 'bg-surface-base text-text-primary shadow-xs border border-border'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Graph Canvas</span>
            <kbd className="hidden sm:inline text-[10px] text-text-muted bg-surface-subtle px-1 rounded border border-border">1</kbd>
          </button>

          <button
            role="tab"
            aria-selected={currentView === 'matrix'}
            onClick={() => onViewChange('matrix')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] text-xs font-medium cursor-pointer transition-colors ${
              currentView === 'matrix'
                ? 'bg-surface-base text-text-primary shadow-xs border border-border'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span>Cross-Team Matrix</span>
            <kbd className="hidden sm:inline text-[10px] text-text-muted bg-surface-subtle px-1 rounded border border-border">2</kbd>
          </button>

          <button
            role="tab"
            aria-selected={currentView === 'blockers'}
            onClick={() => onViewChange('blockers')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] text-xs font-medium cursor-pointer transition-colors ${
              currentView === 'blockers'
                ? 'bg-surface-base text-text-primary shadow-xs border border-border'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-blocker" />
            <span>Active Blockers</span>
            <kbd className="hidden sm:inline text-[10px] text-text-muted bg-surface-subtle px-1 rounded border border-border">3</kbd>
          </button>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        {/* Search */}
        <div className="relative inline-flex items-center">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            value={filters.q}
            onChange={(e) => onFilterChange({ q: e.target.value })}
            placeholder="Search key or title..."
            className="pl-8 pr-2.5 py-1 text-xs rounded-[4px] border border-border bg-surface-subtle focus:bg-surface-base focus:outline-none focus:ring-1 focus:ring-accent w-36 sm:w-44 text-text-primary"
            aria-label="Filter dependencies by issue key or title"
          />
        </div>

        {/* Team Filter */}
        <select
          value={filters.team || 'ALL'}
          onChange={(e) => onFilterChange({ team: e.target.value })}
          aria-label="Filter by Team"
          className="px-2 py-1 text-xs rounded-[4px] border border-border bg-surface-subtle text-text-primary hover:bg-surface-base focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
        >
          <option value="ALL">All Teams</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.key})
            </option>
          ))}
        </select>

        {/* Project Filter */}
        <select
          value={filters.project || 'ALL'}
          onChange={(e) => onFilterChange({ project: e.target.value })}
          aria-label="Filter by Project"
          className="px-2 py-1 text-xs rounded-[4px] border border-border bg-surface-subtle text-text-primary hover:bg-surface-base focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
        >
          <option value="ALL">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.key})
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={filters.status}
          onChange={(e) => onFilterChange({ status: e.target.value as DependencyFilterState['status'] })}
          aria-label="Filter by dependency status"
          className="px-2 py-1 text-xs rounded-[4px] border border-border bg-surface-subtle text-text-primary hover:bg-surface-base focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
        >
          <option value="active">Active Only</option>
          <option value="resolved">Resolved Only</option>
          <option value="all">Active & Resolved</option>
        </select>

        {/* Cross-Team Toggle */}
        <button
          onClick={() => onFilterChange({ crossTeamOnly: !filters.crossTeamOnly })}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] border text-xs font-medium cursor-pointer transition-colors ${
            filters.crossTeamOnly
              ? 'bg-accent/10 border-accent/30 text-accent font-semibold'
              : 'bg-surface-base border-border text-text-secondary hover:bg-surface-subtle'
          }`}
          title="Filter only relationships where upstream and downstream belong to different teams"
        >
          <Users className="w-3.5 h-3.5" />
          <span>Cross-Team</span>
        </button>

        {/* Primary Action: Add Dependency */}
        {!isObserver ? (
          <button
            onClick={onAddDependencyClick}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] bg-accent hover:bg-primary-pressed text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors shrink-0"
            title="Add a new dependency edge (upstream BLOCKS downstream)"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Dependency</span>
          </button>
        ) : (
          <span
            className="text-[11px] text-text-muted px-2 py-1 bg-surface-muted rounded-[4px] border border-border"
            title="Observers have read-only access to dependencies"
          >
            Read-only (Observer)
          </span>
        )}
      </div>
    </div>
  );
};
