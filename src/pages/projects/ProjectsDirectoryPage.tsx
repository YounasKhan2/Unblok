/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  Search,
  Filter,
  ShieldAlert,
  GitFork,
  ArrowRight,
  Clock,
  CheckCircle2,
  X,
  Target,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { selectProjectDirectory, ProjectDirectoryFilterParams } from '../../features/projects/selectors';
import { Button } from '../../components/ui/Button';

export const ProjectsDirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    projects,
    teams,
    issues,
    dependencies,
    cycles,
    milestones,
    activities: activityEvents,
  } = useProject();

  const [searchQuery, setSearchQuery] = useState('');
  const [teamId, setTeamId] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'HAS_BLOCKERS' | 'ACTIVE'>('ALL');

  const filterParams: ProjectDirectoryFilterParams = useMemo(
    () => ({
      searchQuery,
      teamId,
      statusFilter,
    }),
    [searchQuery, teamId, statusFilter]
  );

  const directoryItems = useMemo(
    () =>
      selectProjectDirectory(
        projects,
        teams,
        issues,
        dependencies,
        cycles,
        milestones,
        activityEvents,
        filterParams
      ),
    [projects, teams, issues, dependencies, cycles, milestones, activityEvents, filterParams]
  );

  const hasActiveFilters = searchQuery !== '' || teamId !== 'ALL' || statusFilter !== 'ALL';

  const clearFilters = () => {
    setSearchQuery('');
    setTeamId('ALL');
    setStatusFilter('ALL');
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-white select-none">
      {/* 1. Header Toolbar */}
      <div className="border-b border-[#e5e3df] bg-white px-4 py-2 shrink-0 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FolderKanban className="w-4 h-4 text-[#5645d4]" />
          <h1 className="text-sm font-bold text-[#1a1a1a] tracking-tight">Projects Directory</h1>
          <span className="text-xs text-[#787671] hidden sm:inline">·</span>
          <span className="text-xs text-[#787671] hidden sm:inline">
            Engineering Projects &amp; Delivery Streams
          </span>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#f6f5f4] text-[#5645d4] border border-[#e5e3df]">
            {directoryItems.length} {directoryItems.length === 1 ? 'project' : 'projects'}
          </span>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          {/* Search bar */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-[#787671] absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter projects... (/)"
              className="h-7 w-36 sm:w-48 pl-8 pr-7 bg-[#f6f5f4] border border-[#e5e3df] rounded-[5px] text-xs text-[#1a1a1a] placeholder-[#a4a097] focus:bg-white focus:border-[#5645d4] focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-[#787671] hover:text-[#1a1a1a] cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Team Filter */}
          <select
            value={teamId}
            onChange={e => setTeamId(e.target.value)}
            className="h-7 px-2 bg-[#f6f5f4] border border-[#e5e3df] rounded-[5px] text-xs text-[#37352f] hover:border-[#c8c4be] focus:outline-none cursor-pointer"
            aria-label="Filter by team"
          >
            <option value="ALL">All Teams</option>
            {teams.map(t => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.key})
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="h-7 px-2 bg-[#f6f5f4] border border-[#e5e3df] rounded-[5px] text-xs text-[#37352f] hover:border-[#c8c4be] focus:outline-none cursor-pointer"
            aria-label="Filter by execution posture"
          >
            <option value="ALL">All Statuses</option>
            <option value="HAS_BLOCKERS">Has Blockers</option>
            <option value="ACTIVE">Active Work</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="h-7 px-2 text-[#787671] hover:text-[#1a1a1a] hover:bg-[#f6f5f4] rounded-[5px] transition-colors cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* 2. Main High-Density Projects Table */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-white">
        {directoryItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-10 h-10 rounded-full bg-[#f6f5f4] flex items-center justify-center mb-3 text-[#787671]">
              <FolderKanban className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#1a1a1a] mb-1">
              {hasActiveFilters ? 'No projects match your active filters' : 'No projects yet'}
            </h3>
            <p className="text-xs text-[#787671] max-w-sm mb-4 leading-relaxed">
              {hasActiveFilters
                ? 'Try adjusting your search terms or clearing the team/status filters.'
                : 'Create projects in this workspace to organize team delivery.'}
            </p>
            {hasActiveFilters && (
              <Button variant="secondary" size="sm" onClick={clearFilters}>
                Clear All Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[#e5e3df]">
            {/* Table Header */}
            <div className="flex items-center h-[28px] px-4 bg-[#fafaf9] border-b border-[#e5e3df] text-[11px] font-semibold text-[#787671] uppercase tracking-wider sticky top-0 z-10">
              <div className="w-20 shrink-0">Key</div>
              <div className="flex-1 min-w-0 pr-4">Project &amp; Description</div>
              <div className="w-36 shrink-0 hidden md:block">Owning Team</div>
              <div className="w-24 shrink-0 text-center">Active Work</div>
              <div className="w-28 shrink-0 text-center">Blockers</div>
              <div className="w-32 shrink-0 hidden lg:block">Active Cycle</div>
              <div className="w-24 shrink-0 text-right pr-2">Progress</div>
              <div className="w-8 shrink-0" />
            </div>

            {/* Project Rows */}
            {directoryItems.map(item => (
              <div
                key={item.project.id}
                onClick={() => navigate(`/projects/${item.project.key}/issues`)}
                className="group flex items-center h-[48px] px-4 hover:bg-[#f6f5f4] cursor-pointer transition-colors text-xs"
              >
                {/* Project Key */}
                <div className="w-20 shrink-0 font-mono font-bold text-[#5645d4] group-hover:underline flex items-center gap-1.5">
                  <FolderKanban className="w-3.5 h-3.5" />
                  <span>{item.project.key}</span>
                </div>

                {/* Project Name & Description */}
                <div className="flex-1 min-w-0 pr-4 truncate">
                  <div className="font-semibold text-[#1a1a1a] truncate group-hover:text-[#5645d4]">
                    {item.project.name}
                  </div>
                  {item.project.description && (
                    <div className="text-[11px] text-[#787671] truncate">
                      {item.project.description}
                    </div>
                  )}
                </div>

                {/* Owning Team */}
                <div className="w-36 shrink-0 hidden md:flex items-center gap-1.5 truncate text-[#37352f]">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.team?.color || '#5645d4' }}
                  />
                  <span className="truncate">{item.team?.name || 'Unassigned Team'}</span>
                </div>

                {/* Active Work */}
                <div className="w-24 shrink-0 text-center">
                  <span className="font-semibold text-[#1a1a1a]">
                    {item.activeIssuesCount}
                  </span>
                  <span className="text-[11px] text-[#787671] ml-1">
                    / {item.totalIssuesCount}
                  </span>
                </div>

                {/* Blocker Posture */}
                <div className="w-28 shrink-0 text-center">
                  {item.blockedIssuesCount > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#fff5ee] border border-[#ffd8be] text-[#dd5b00] font-semibold text-[11px]">
                      <ShieldAlert className="w-3 h-3 text-[#dd5b00]" />
                      <span>{item.blockedIssuesCount} blocked</span>
                    </span>
                  ) : item.activeIssuesCount > 0 ? (
                    <span className="text-[11px] text-[#0f7b6c] font-medium inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0f7b6c]" />
                      <span>Unblocked</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#a4a097]">—</span>
                  )}
                </div>

                {/* Active Cycle */}
                <div className="w-32 shrink-0 hidden lg:flex items-center gap-1 text-[11px] text-[#787671] truncate">
                  {item.activeCycle ? (
                    <span className="px-1.5 py-0.2 rounded bg-purple-50 text-[#5645d4] border border-purple-200 truncate">
                      {item.activeCycle.name}
                    </span>
                  ) : (
                    <span className="text-[#a4a097] italic">No active cycle</span>
                  )}
                </div>

                {/* Progress % */}
                <div className="w-24 shrink-0 text-right pr-2">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="font-mono text-xs font-semibold text-[#1a1a1a]">
                      {item.progressPercent}%
                    </span>
                  </div>
                  <div className="w-full bg-[#e5e3df] rounded-full h-1 mt-1 overflow-hidden">
                    <div
                      className="bg-[#0f7b6c] h-1 rounded-full transition-all"
                      style={{ width: `${item.progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Arrow CTA */}
                <div className="w-8 shrink-0 flex justify-end text-[#a4a097] group-hover:text-[#5645d4]">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
