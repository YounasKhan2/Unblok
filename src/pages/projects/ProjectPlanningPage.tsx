/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useCallback } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { Project, Team } from '../../types';
import { useProject } from '../../context/ProjectContext';
import {
  selectProjectCycleAllocation,
  selectProjectMilestoneMapping,
} from '../../features/planning/selectors/projectPlanningSelectors';
import { ProjectCycleAllocationTab } from '../../features/planning/components/project/ProjectCycleAllocationTab';
import { ProjectMilestoneMappingTab } from '../../features/planning/components/project/ProjectMilestoneMappingTab';
import {
  ProjectPlanningFilterState,
  ProjectPlanningViewMode,
} from '../../features/planning/types';
import { Clock, Target, Search, Calendar, Filter } from 'lucide-react';

interface OutletContextType {
  project: Project;
  team?: Team;
}

export const ProjectPlanningPage: React.FC = () => {
  const { project, team } = useOutletContext<OutletContextType>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { issues, cycles, milestones, dependencies } = useProject();

  // URL state: ?view=cycles or ?view=milestones
  const rawView = searchParams.get('view');
  const viewMode: ProjectPlanningViewMode = rawView === 'milestones' ? 'milestones' : 'cycles';
  const searchQuery = searchParams.get('q') || '';
  const priorityFilter = searchParams.get('priority') || 'ALL';
  const stateFilter = searchParams.get('state') || 'ALL';

  const filters: ProjectPlanningFilterState = useMemo(
    () => ({
      view: viewMode,
      searchQuery,
      priorityFilter,
      stateFilter,
    }),
    [viewMode, searchQuery, priorityFilter, stateFilter]
  );

  const updateFilters = useCallback(
    (updates: Partial<ProjectPlanningFilterState>) => {
      const next = new URLSearchParams(searchParams);

      if (updates.view !== undefined) {
        if (updates.view === 'cycles') next.delete('view');
        else next.set('view', updates.view);
      }

      if (updates.searchQuery !== undefined) {
        if (!updates.searchQuery.trim()) next.delete('q');
        else next.set('q', updates.searchQuery.trim());
      }

      if (updates.priorityFilter !== undefined) {
        if (updates.priorityFilter === 'ALL') next.delete('priority');
        else next.set('priority', updates.priorityFilter);
      }

      if (updates.stateFilter !== undefined) {
        if (updates.stateFilter === 'ALL') next.delete('state');
        else next.set('state', updates.stateFilter);
      }

      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  // Derivations for Cycle Allocation view
  const cycleAllocationData = useMemo(
    () => selectProjectCycleAllocation(project, issues, cycles, dependencies, filters),
    [project, issues, cycles, dependencies, filters]
  );

  // Derivations for Milestone Mapping view
  const milestoneMappingData = useMemo(
    () => selectProjectMilestoneMapping(project, issues, milestones, filters),
    [project, issues, milestones, filters]
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-surface-subtle overflow-hidden select-none">
      {/* 1. Header Toolbar */}
      <div className="bg-surface-base border-b border-border px-6 py-3.5 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-text-primary">Project Delivery Plan</h2>
          <p className="text-xs text-text-muted">
            Allocate tasks from <span className="font-semibold text-text-primary">{project.name}</span> into team cycles and workspace milestones.
          </p>
        </div>

        {/* View Switcher Tabs (Cycles vs Milestones) */}
        <div className="flex items-center gap-2">
          <div
            role="tablist"
            aria-label="Project planning view modes"
            className="inline-flex items-center p-0.5 rounded-[6px] bg-surface-muted border border-border"
          >
            <button
              role="tab"
              aria-selected={viewMode === 'cycles'}
              onClick={() => updateFilters({ view: 'cycles' })}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] text-xs font-semibold cursor-pointer transition-colors ${
                viewMode === 'cycles'
                  ? 'bg-surface-base text-text-primary shadow-2xs border border-border'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Cycle Allocation</span>
            </button>

            <button
              role="tab"
              aria-selected={viewMode === 'milestones'}
              onClick={() => updateFilters({ view: 'milestones' })}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] text-xs font-semibold cursor-pointer transition-colors ${
                viewMode === 'milestones'
                  ? 'bg-surface-base text-text-primary shadow-2xs border border-border'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Milestone Mapping</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="px-6 py-2 bg-surface-base border-b border-border flex flex-wrap items-center gap-3 shrink-0 text-xs">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter tasks by key or title..."
            value={searchQuery}
            onChange={e => updateFilters({ searchQuery: e.target.value })}
            className="h-7 w-48 pl-8 pr-2.5 rounded-[4px] border border-border bg-surface-base text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
          />
        </div>

        <select
          value={priorityFilter}
          onChange={e => updateFilters({ priorityFilter: e.target.value })}
          className="h-7 px-2 rounded-[4px] border border-border bg-surface-base text-text-primary focus:outline-none focus:border-accent"
        >
          <option value="ALL">All Priorities</option>
          <option value="URGENT">Urgent</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        <select
          value={stateFilter}
          onChange={e => updateFilters({ stateFilter: e.target.value })}
          className="h-7 px-2 rounded-[4px] border border-border bg-surface-base text-text-primary focus:outline-none focus:border-accent"
        >
          <option value="ALL">All States</option>
          <option value="BACKLOG">Backlog</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="DONE">Done</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <div className="ml-auto text-xs text-text-muted">
          Owning Team: <span className="font-semibold text-text-primary">{team?.name || 'Core Eng'}</span>
        </div>
      </div>

      {/* 3. Main Planning Body */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          {viewMode === 'cycles' ? (
            <ProjectCycleAllocationTab
              project={project}
              eligibleCycles={cycleAllocationData.eligibleCycles}
              activeCycle={cycleAllocationData.activeCycle}
              backlogIssues={cycleAllocationData.backlogIssues}
              cycleGroups={cycleAllocationData.cycleGroups}
            />
          ) : (
            <ProjectMilestoneMappingTab
              project={project}
              groups={milestoneMappingData.groups}
              unlinkedGroup={milestoneMappingData.unlinkedGroup}
              allMilestones={milestoneMappingData.allMilestones}
            />
          )}
        </div>
      </div>
    </div>
  );
};
