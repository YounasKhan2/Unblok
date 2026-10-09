/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useCallback } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { Plus, Kanban } from 'lucide-react';
import { Project, Team, IssueState, SavedView } from '../../types';
import { useProject } from '../../context/ProjectContext';
import { useKeyboard } from '../../context/KeyboardContext';
import { useDrawerRoute } from '../../app/router/useDrawerRoute';
import { selectProjectBoard, ProjectIssuesFilterParams } from '../../features/projects/selectors';
import { ProjectFilterToolbar } from '../../features/projects/components/ProjectFilterToolbar';
import {
  resolveProjectSavedViews,
  createProjectSavedView,
  applySavedViewToUrl,
} from '../../features/projects/savedViews';
import { IssueCard } from '../../components/views/IssueCard';
import { STATE_CONFIG } from '../../components/ui/StatePill';
import { Button } from '../../components/ui/Button';

interface OutletContextType {
  project: Project;
  team?: Team;
}

export const ProjectBoardPage: React.FC = () => {
  const { project } = useOutletContext<OutletContextType>();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    issues,
    dependencies,
    users,
    cycles,
    savedViews,
    saveSavedView,
    selectedIssueId,
    setSelectedIssueId,
    updateIssueState,
  } = useProject();

  const { setIsCreateModalOpen } = useKeyboard();
  const { openDrawer, drawerIssueKey } = useDrawerRoute();

  const searchQuery = searchParams.get('q') || '';
  const state = searchParams.get('state') || 'ALL';
  const priority = searchParams.get('priority') || 'ALL';
  const assigneeId = searchParams.get('assignee') || 'ALL';
  const blockerFilter = searchParams.get('blocker') || 'ALL';
  const cycleId = searchParams.get('cycle') || 'ALL';

  const filterParams: ProjectIssuesFilterParams = useMemo(
    () => ({
      searchQuery,
      state,
      priority,
      assigneeId,
      blockerFilter,
      cycleId,
    }),
    [searchQuery, state, priority, assigneeId, blockerFilter, cycleId]
  );

  const { columns, totalIssuesCount } = useMemo(
    () =>
      selectProjectBoard(
        project,
        issues,
        dependencies,
        filterParams
      ),
    [project, issues, dependencies, filterParams]
  );

  // Update URL search parameters safely
  const updateFilters = (updates: Partial<ProjectIssuesFilterParams>) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, val] of Object.entries(updates)) {
      const paramKey =
        key === 'assigneeId'
          ? 'assignee'
          : key === 'blockerFilter'
          ? 'blocker'
          : key === 'cycleId'
          ? 'cycle'
          : key;
      if (!val || val === 'ALL') {
        next.delete(paramKey);
      } else {
        next.set(paramKey, val);
      }
    }
    setSearchParams(next, { replace: true });
  };

  const clearFilters = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('q');
    next.delete('state');
    next.delete('priority');
    next.delete('assignee');
    next.delete('blocker');
    next.delete('cycle');
    setSearchParams(next, { replace: true });
  };

  // Unified project saved views
  const projectSavedViews = useMemo(
    () => resolveProjectSavedViews(savedViews, project.id),
    [savedViews, project.id]
  );

  const handleSaveView = useCallback(
    (name: string) => {
      const newView = createProjectSavedView({
        name,
        projectId: project.id,
        teamId: project.teamId,
        currentFilters: filterParams,
        viewMode: 'BOARD',
      });
      saveSavedView(newView);
    },
    [project.id, project.teamId, filterParams, saveSavedView]
  );

  const handleApplySavedView = useCallback(
    (view: SavedView) => {
      const nextParams = applySavedViewToUrl(view, searchParams);
      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  // Drag and drop handler
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetState: IssueState) => {
    e.preventDefault();
    const issueId = e.dataTransfer.getData('text/plain');
    if (issueId) {
      updateIssueState(issueId, targetState);
    }
  };

  const hasActiveFilters =
    Boolean(searchQuery) ||
    state !== 'ALL' ||
    priority !== 'ALL' ||
    assigneeId !== 'ALL' ||
    blockerFilter !== 'ALL' ||
    cycleId !== 'ALL';

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-canvas select-none">
      {/* 1. Filter Toolbar */}
      <ProjectFilterToolbar
        filters={filterParams}
        onFilterChange={updateFilters}
        onClearFilters={clearFilters}
        users={users}
        cycles={cycles}
        savedViews={projectSavedViews}
        onApplySavedView={handleApplySavedView}
        onSaveView={handleSaveView}
      />

      {/* 2. Kanban Board Canvas */}
      <div className="flex-1 flex overflow-x-auto p-4 gap-3 bg-canvas min-w-0 min-h-0">
        {totalIssuesCount === 0 && hasActiveFilters ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-10 h-10 rounded-full bg-surface-muted flex items-center justify-center mb-3 text-text-muted">
              <Kanban className="w-5 h-5" />
            </div>
            <p className="text-xs text-text-muted mb-3">No board issues match active filters.</p>
            <Button variant="secondary" size="sm" onClick={clearFilters}>
              Clear All Filters
            </Button>
          </div>
        ) : (
          columns.map(column => {
            const config = STATE_CONFIG[column.state];
            const Icon = config.icon;

            return (
              <div
                key={column.state}
                onDragOver={handleDragOver}
                onDrop={e => handleDrop(e, column.state)}
                className="w-72 shrink-0 flex flex-col bg-surface-subtle rounded-xl border border-border max-h-full overflow-hidden"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-3 py-2 bg-surface-base border-b border-border text-xs shrink-0">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${config.textClass}`} />
                    <span className="font-semibold text-text-primary">{config.label}</span>
                    <span className="text-[11px] font-medium px-1.5 py-0.2 rounded-full bg-border text-text-secondary">
                      {column.issues.length}
                    </span>
                  </div>

                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="p-1 text-text-muted hover:text-text-primary hover:bg-surface-muted rounded transition-colors cursor-pointer"
                    title={`Create issue in ${config.label} (C)`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Column Cards Container */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0">
                  {column.issues.length === 0 ? (
                    <div className="h-16 flex items-center justify-center border-2 border-dashed border-border rounded-lg text-[11px] text-text-muted">
                      No issues
                    </div>
                  ) : (
                    column.issues.map(issue => (
                      <div
                        key={issue.id}
                        draggable
                        onDragStart={e => e.dataTransfer.setData('text/plain', issue.id)}
                      >
                        <IssueCard
                          issue={issue}
                          isSelected={
                            drawerIssueKey === issue.key || selectedIssueId === issue.id
                          }
                          onSelect={() => {
                            setSelectedIssueId(issue.id);
                            openDrawer(issue.key);
                          }}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
