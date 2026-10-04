import React from 'react';
import { useProject } from '../../context/ProjectContext';
import { useKeyboard } from '../../context/KeyboardContext';
import { SearchInput } from '../ui/SearchInput';
import { List, Kanban, GitFork, ShieldAlert, X, Bookmark, Calendar } from 'lucide-react';
import { IssueState, IssuePriority } from '../../types';

export const FilterToolbar: React.FC = () => {
  const {
    filters,
    setFilters,
    resetFilters,
    viewMode,
    setViewMode,
    filteredIssues,
    issues,
    cycles,
    saveCurrentView,
  } = useProject();

  const { searchInputRef } = useKeyboard();

  const hasActiveFilters =
    filters.searchQuery !== '' ||
    filters.state !== 'ALL' ||
    filters.priority !== 'ALL' ||
    filters.assigneeId !== 'ALL' ||
    filters.teamId !== 'ALL' ||
    (filters.cycleId && filters.cycleId !== 'ALL') ||
    filters.blockerFilter !== 'ALL';

  return (
    <div className="px-4 py-2 bg-white border-b border-[#e5e3df] flex flex-wrap items-center justify-between gap-2.5 text-xs select-none">
      {/* 1. Left: Search Input & View Switcher */}
      <div className="flex items-center gap-2 flex-1 max-w-md min-w-[200px]">
        <SearchInput
          value={filters.searchQuery}
          onChange={val => setFilters(prev => ({ ...prev, searchQuery: val }))}
          inputRef={searchInputRef}
          className="flex-1"
        />

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-[#f0eeec] p-0.5 rounded-[6px] border border-[#e5e3df]">
          <button
            onClick={() => setViewMode('LIST')}
            className={`p-1.5 rounded-[4px] transition-colors cursor-pointer ${
              viewMode === 'LIST'
                ? 'bg-white text-[#1a1a1a] shadow-2xs font-medium'
                : 'text-[#787671] hover:text-[#1a1a1a]'
            }`}
            title="List view (V)"
          >
            <List className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setViewMode('BOARD')}
            className={`p-1.5 rounded-[4px] transition-colors cursor-pointer ${
              viewMode === 'BOARD'
                ? 'bg-white text-[#1a1a1a] shadow-2xs font-medium'
                : 'text-[#787671] hover:text-[#1a1a1a]'
            }`}
            title="Board view (V)"
          >
            <Kanban className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setViewMode('GRAPH')}
            className={`p-1.5 rounded-[4px] transition-colors cursor-pointer ${
              viewMode === 'GRAPH'
                ? 'bg-white text-[#5645d4] shadow-2xs font-medium'
                : 'text-[#787671] hover:text-[#1a1a1a]'
            }`}
            title="Dependency DAG Matrix (V)"
          >
            <GitFork className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Right: Blocker Filter & Property Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Blocker Filter Chips */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFilters(prev => ({ ...prev, blockerFilter: 'ALL' }))}
            className={`px-2 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
              filters.blockerFilter === 'ALL'
                ? 'bg-[#1a1a1a] text-white'
                : 'bg-[#f6f5f4] text-[#787671] hover:bg-[#ede9e4]'
            }`}
          >
            All
          </button>

          <button
            onClick={() =>
              setFilters(prev => ({
                ...prev,
                blockerFilter: prev.blockerFilter === 'BLOCKED_ONLY' ? 'ALL' : 'BLOCKED_ONLY',
              }))
            }
            className={`px-2 py-1 rounded-full text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer ${
              filters.blockerFilter === 'BLOCKED_ONLY'
                ? 'bg-[#dd5b00] text-white'
                : 'bg-[#ffe8d4] text-[#dd5b00] hover:bg-[#fedfc2]'
            }`}
          >
            <ShieldAlert className="w-3 h-3" />
            <span>Blocked Only</span>
          </button>

          <button
            onClick={() =>
              setFilters(prev => ({
                ...prev,
                blockerFilter: prev.blockerFilter === 'UNBLOCKED_ONLY' ? 'ALL' : 'UNBLOCKED_ONLY',
              }))
            }
            className={`px-2 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
              filters.blockerFilter === 'UNBLOCKED_ONLY'
                ? 'bg-[#1aae39] text-white'
                : 'bg-[#d9f3e1] text-[#1aae39] hover:bg-[#cbf0d5]'
            }`}
          >
            Ready (Unblocked)
          </button>
        </div>

        {/* Status Dropdown */}
        <select
          value={filters.state}
          onChange={e => setFilters(prev => ({ ...prev, state: e.target.value as IssueState | 'ALL' }))}
          className="h-7 px-2 text-xs bg-[#f6f5f4] border border-[#e5e3df] rounded-[6px] text-[#37352f] focus:outline-none focus:border-[#5645d4] cursor-pointer"
        >
          <option value="ALL">Status: All</option>
          <option value="BACKLOG">Backlog</option>
          <option value="TODO">Todo</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="DONE">Done</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        {/* Priority Dropdown */}
        <select
          value={filters.priority}
          onChange={e =>
            setFilters(prev => ({ ...prev, priority: e.target.value as IssuePriority | 'ALL' }))
          }
          className="h-7 px-2 text-xs bg-[#f6f5f4] border border-[#e5e3df] rounded-[6px] text-[#37352f] focus:outline-none focus:border-[#5645d4] cursor-pointer"
        >
          <option value="ALL">Priority: All</option>
          <option value="URGENT">Urgent</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        {/* Cycle Dropdown */}
        <select
          value={filters.cycleId || 'ALL'}
          onChange={e =>
            setFilters(prev => ({ ...prev, cycleId: e.target.value }))
          }
          className="h-7 px-2 text-xs bg-[#f6f5f4] border border-[#e5e3df] rounded-[6px] text-[#37352f] focus:outline-none focus:border-[#5645d4] cursor-pointer hidden sm:block"
        >
          <option value="ALL">Cycle: All</option>
          {cycles.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
          <option value="NO_CYCLE">No Cycle (Backlog)</option>
        </select>

        {/* Reset Filter Button */}
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-[11px] text-[#787671] hover:text-[#1a1a1a] px-1.5 py-1 rounded hover:bg-[#ede9e4] transition-colors cursor-pointer"
            title="Reset all filters"
          >
            <X className="w-3 h-3" />
            <span>Clear</span>
          </button>
        )}

        {/* Save Current View Preset */}
        {hasActiveFilters && (
          <button
            onClick={() => {
              const name = prompt('Enter a name for this saved view:');
              if (name && name.trim()) {
                saveCurrentView(name.trim());
              }
            }}
            className="flex items-center gap-1 text-[11px] text-[#5645d4] hover:text-[#4534b3] bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded-[6px] transition-colors cursor-pointer font-medium"
            title="Save current filters as a quick view"
          >
            <Bookmark className="w-3 h-3" />
            <span>Save View</span>
          </button>
        )}

        <div className="text-[11px] text-[#a4a097] pl-1 font-mono">
          {filteredIssues.length}/{issues.length}
        </div>
      </div>
    </div>
  );
};
