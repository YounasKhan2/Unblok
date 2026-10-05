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
    <div className="border-b border-[#e5e3df] bg-white px-4 py-2 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
      {/* View Switcher Tabs */}
      <div className="flex items-center gap-1">
        <div
          role="tablist"
          aria-label="Dependency Intelligence View Modes"
          className="inline-flex items-center p-0.5 rounded-[6px] bg-[#f6f5f4] border border-[#e5e3df]"
        >
          <button
            role="tab"
            aria-selected={currentView === 'graph'}
            onClick={() => onViewChange('graph')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] text-xs font-medium cursor-pointer transition-colors ${
              currentView === 'graph'
                ? 'bg-white text-[#1a1a1a] shadow-xs border border-[#e5e3df]'
                : 'text-[#5d5b54] hover:text-[#1a1a1a]'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Graph Canvas</span>
            <kbd className="hidden sm:inline text-[10px] text-[#787671] bg-[#fafaf9] px-1 rounded border border-[#e5e3df]">1</kbd>
          </button>

          <button
            role="tab"
            aria-selected={currentView === 'matrix'}
            onClick={() => onViewChange('matrix')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] text-xs font-medium cursor-pointer transition-colors ${
              currentView === 'matrix'
                ? 'bg-white text-[#1a1a1a] shadow-xs border border-[#e5e3df]'
                : 'text-[#5d5b54] hover:text-[#1a1a1a]'
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span>Cross-Team Matrix</span>
            <kbd className="hidden sm:inline text-[10px] text-[#787671] bg-[#fafaf9] px-1 rounded border border-[#e5e3df]">2</kbd>
          </button>

          <button
            role="tab"
            aria-selected={currentView === 'blockers'}
            onClick={() => onViewChange('blockers')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] text-xs font-medium cursor-pointer transition-colors ${
              currentView === 'blockers'
                ? 'bg-white text-[#1a1a1a] shadow-xs border border-[#e5e3df]'
                : 'text-[#5d5b54] hover:text-[#1a1a1a]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-[#dd5b00]" />
            <span>Active Blockers</span>
            <kbd className="hidden sm:inline text-[10px] text-[#787671] bg-[#fafaf9] px-1 rounded border border-[#e5e3df]">3</kbd>
          </button>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        {/* Search */}
        <div className="relative inline-flex items-center">
          <Search className="w-3.5 h-3.5 text-[#787671] absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            value={filters.q}
            onChange={(e) => onFilterChange({ q: e.target.value })}
            placeholder="Search key or title..."
            className="pl-8 pr-2.5 py-1 text-xs rounded-[4px] border border-[#e5e3df] bg-[#fafaf9] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#5645d4] w-36 sm:w-44 text-[#1a1a1a]"
            aria-label="Filter dependencies by issue key or title"
          />
        </div>

        {/* Team Filter */}
        <select
          value={filters.team || 'ALL'}
          onChange={(e) => onFilterChange({ team: e.target.value })}
          aria-label="Filter by Team"
          className="px-2 py-1 text-xs rounded-[4px] border border-[#e5e3df] bg-[#fafaf9] text-[#37352f] hover:bg-white focus:outline-none focus:ring-1 focus:ring-[#5645d4] cursor-pointer"
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
          className="px-2 py-1 text-xs rounded-[4px] border border-[#e5e3df] bg-[#fafaf9] text-[#37352f] hover:bg-white focus:outline-none focus:ring-1 focus:ring-[#5645d4] cursor-pointer"
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
          className="px-2 py-1 text-xs rounded-[4px] border border-[#e5e3df] bg-[#fafaf9] text-[#37352f] hover:bg-white focus:outline-none focus:ring-1 focus:ring-[#5645d4] cursor-pointer"
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
              ? 'bg-[#ede9fe] border-[#c4b5fd] text-[#5645d4] font-semibold'
              : 'bg-white border-[#e5e3df] text-[#5d5b54] hover:bg-[#fafaf9]'
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
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] bg-[#5645d4] hover:bg-[#4534b3] text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors shrink-0"
            title="Add a new dependency edge (upstream BLOCKS downstream)"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Dependency</span>
          </button>
        ) : (
          <span
            className="text-[11px] text-[#787671] px-2 py-1 bg-[#f6f5f4] rounded-[4px] border border-[#e5e3df]"
            title="Observers have read-only access to dependencies"
          >
            Read-only (Observer)
          </span>
        )}
      </div>
    </div>
  );
};
