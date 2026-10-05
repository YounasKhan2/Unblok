/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext';
import { useDrawerRoute } from '../../app/router/useDrawerRoute';
import {
  DependencyViewMode,
  DependencyFilterState,
  DependencyScopeFilter,
} from '../../features/dependencies/types';
import {
  resolveEdges,
  filterDependencies,
  calculateDependencySummary,
  deriveIssueDependencyIntelligence,
  getBottlenecks,
  calculateLongestActiveChain,
  calculateCrossTeamMatrix,
  calculateGraphLayout,
} from '../../features/dependencies/selectors';
import { DependencySummaryBar } from '../../features/dependencies/components/DependencySummaryBar';
import { DependencyViewTabs } from '../../features/dependencies/components/DependencyViewTabs';
import {
  DependencyGraphCanvas,
  DependencyGraphZoomControls,
} from '../../features/dependencies/components/DependencyGraphCanvas';
import { BottleneckPanel } from '../../features/dependencies/components/BottleneckPanel';
import { DependencyMatrix } from '../../features/dependencies/components/DependencyMatrix';
import { ActiveBlockerRegistry } from '../../features/dependencies/components/ActiveBlockerRegistry';
import { AddDependencyDialog } from '../../features/dependencies/components/AddDependencyDialog';
import { Network, Plus, ShieldAlert } from 'lucide-react';
import { useKeyboard } from '../../context/KeyboardContext';

export const DependenciesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    issues,
    dependencies,
    projects,
    teams,
    currentUser,
    addDependency,
    removeDependency,
  } = useProject();

  const { openDrawer } = useDrawerRoute();
  const { registerDependencyHandlers } = useKeyboard();

  const isObserver = currentUser.role === 'OBSERVER';

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  // Upward zoom controls registered from DependencyGraphCanvas
  const [zoomControls, setZoomControls] = useState<DependencyGraphZoomControls | null>(null);

  // URL state synchronization
  const rawView = searchParams.get('view');
  const viewMode: DependencyViewMode =
    rawView === 'matrix' || rawView === 'blockers' ? rawView : 'graph';

  const filters: DependencyFilterState = useMemo(() => {
    const rawStatus = searchParams.get('status');
    const status: DependencyFilterState['status'] =
      rawStatus === 'resolved' || rawStatus === 'all' ? rawStatus : 'active';

    const rawScope = searchParams.get('scope');
    const scope: DependencyScopeFilter =
      rawScope === 'cross-team' || rawScope === 'cross-project' || rawScope === 'same-project'
        ? rawScope
        : 'all';

    return {
      view: viewMode,
      status,
      team: searchParams.get('team') || 'ALL',
      project: searchParams.get('project') || 'ALL',
      crossTeamOnly: searchParams.get('crossTeam') === 'true',
      scope,
      q: searchParams.get('q') || '',
    };
  }, [searchParams, viewMode]);

  // Handle View Change while preserving other query params
  const handleViewChange = useCallback(
    (newView: DependencyViewMode) => {
      const next = new URLSearchParams(searchParams);
      if (newView === 'graph') {
        next.delete('view');
      } else {
        next.set('view', newView);
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  // Handle Filter Updates while preserving other query params
  const handleFilterChange = useCallback(
    (updates: Partial<DependencyFilterState>) => {
      const next = new URLSearchParams(searchParams);

      if (updates.status !== undefined) {
        if (updates.status === 'active') {
          next.delete('status');
        } else {
          next.set('status', updates.status);
        }
      }

      if (updates.team !== undefined) {
        if (!updates.team || updates.team === 'ALL') {
          next.delete('team');
        } else {
          next.set('team', updates.team);
        }
      }

      if (updates.project !== undefined) {
        if (!updates.project || updates.project === 'ALL') {
          next.delete('project');
        } else {
          next.set('project', updates.project);
        }
      }

      if (updates.crossTeamOnly !== undefined) {
        if (!updates.crossTeamOnly) {
          next.delete('crossTeam');
        } else {
          next.set('crossTeam', 'true');
        }
      }

      if (updates.scope !== undefined) {
        if (updates.scope === 'all') {
          next.delete('scope');
        } else {
          next.set('scope', updates.scope);
        }
      }

      if (updates.q !== undefined) {
        if (!updates.q.trim()) {
          next.delete('q');
        } else {
          next.set('q', updates.q.trim());
        }
      }

      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete('status');
    next.delete('team');
    next.delete('project');
    next.delete('crossTeam');
    next.delete('scope');
    next.delete('q');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  // Compute active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status !== 'active') count++;
    if (filters.team && filters.team !== 'ALL') count++;
    if (filters.project && filters.project !== 'ALL') count++;
    if (filters.crossTeamOnly) count++;
    if (filters.scope !== 'all') count++;
    if (filters.q) count++;
    return count;
  }, [filters]);

  // Centralized keyboard navigation via KeyboardContext
  // DependenciesPage owns ONE composed registration:
  // - Always provides view switching: 1 (Graph), 2 (Matrix), 3 (Blockers)
  // - Composes Graph zoom actions (+, -, 0) strictly when Graph view is active
  useEffect(() => {
    registerDependencyHandlers({
      onSelectGraphView: () => handleViewChange('graph'),
      onSelectMatrixView: () => handleViewChange('matrix'),
      onSelectBlockersView: () => handleViewChange('blockers'),
      ...(viewMode === 'graph' && zoomControls
        ? {
            onZoomIn: zoomControls.zoomIn,
            onZoomOut: zoomControls.zoomOut,
            onResetZoom: zoomControls.resetZoom,
          }
        : {}),
    });
    return () => {
      registerDependencyHandlers(null);
    };
  }, [handleViewChange, registerDependencyHandlers, viewMode, zoomControls]);

  // Pure graph intelligence selectors
  const resolvedAllEdges = useMemo(
    () => resolveEdges(dependencies, issues, projects, teams),
    [dependencies, issues, projects, teams]
  );

  const filteredEdges = useMemo(
    () => filterDependencies(resolvedAllEdges, filters),
    [resolvedAllEdges, filters]
  );

  const bottlenecks = useMemo(
    () => getBottlenecks(issues, dependencies, projects, teams, 5),
    [issues, dependencies, projects, teams]
  );

  const criticalChain = useMemo(
    () => calculateLongestActiveChain(issues, dependencies),
    [issues, dependencies]
  );

  const summaryMetrics = useMemo(
    () => calculateDependencySummary(issues, resolvedAllEdges, bottlenecks, criticalChain),
    [issues, resolvedAllEdges, bottlenecks, criticalChain]
  );

  const crossTeamMatrix = useMemo(
    () => calculateCrossTeamMatrix(teams, filteredEdges),
    [teams, filteredEdges]
  );

  // Graph Layout calculation
  const graphLayout = useMemo(() => {
    return calculateGraphLayout(filteredEdges, issues, projects, teams, criticalChain);
  }, [filteredEdges, issues, projects, teams, criticalChain]);

  // Open canonical Issue Drawer on Dependencies tab
  const handleOpenDrawer = useCallback(
    (issueKey: string) => {
      openDrawer(issueKey, 'dependencies');
    },
    [openDrawer]
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-surface-base">
      {/* 1. Page Header (Compact high-density engineering control surface) */}
      <header className="border-b border-border bg-surface-base px-4 py-2.5 flex items-center justify-between shrink-0 select-none">
        <div>
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-accent" />
            <h1 className="text-sm font-bold text-text-primary">Dependency Intelligence</h1>
          </div>
          <p className="text-[11px] text-text-muted mt-0.5 flex items-center gap-2 flex-wrap">
            <span>Workspace execution graph and blocker analysis</span>
            <span className="text-border-strong">·</span>
            <span className="text-blocker font-medium">
              {summaryMetrics.activeEdgesCount} Active {summaryMetrics.activeEdgesCount === 1 ? 'Blocker' : 'Blockers'}
            </span>
            <span className="text-border-strong">·</span>
            <span className="text-accent font-medium">
              {summaryMetrics.crossTeamActiveEdgesCount} Cross-Team
            </span>
            <span className="text-border-strong">·</span>
            <span className="text-danger font-medium">
              {summaryMetrics.bottlenecksCount} {summaryMetrics.bottlenecksCount === 1 ? 'Bottleneck' : 'Bottlenecks'}
            </span>
          </p>
        </div>

        {/* Primary Action Button */}
        {!isObserver && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-accent hover:bg-primary-pressed text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Dependency</span>
          </button>
        )}
      </header>

      {/* 2. Summary Strip */}
      <DependencySummaryBar
        metrics={summaryMetrics}
        activeFilterCount={activeFilterCount}
        onClearFilters={handleClearFilters}
      />

      {/* 3. View Mode Switcher & URL-backed Filters */}
      <DependencyViewTabs
        currentView={viewMode}
        onViewChange={handleViewChange}
        filters={filters}
        onFilterChange={handleFilterChange}
        teams={teams}
        projects={projects}
        onAddDependencyClick={() => setIsAddModalOpen(true)}
        isObserver={isObserver}
      />

      {/* 4. Main Body: View-dependent execution surface */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {/* Desktop View Modes */}
        {viewMode === 'graph' && (
          <div className="flex-1 relative flex flex-col md:flex-row h-full overflow-hidden">
            {/* Mobile note for small screens */}
            <div className="md:hidden p-3 bg-blocker/10 border-b border-blocker/30 text-xs text-blocker flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>
                Graph canvas is optimized for desktop viewports. Below is the operational blocker registry.
              </span>
            </div>

            {/* Canvas (Hidden on small mobile screens to prevent squished unusable canvas) */}
            <div className="hidden md:flex flex-1 relative h-full">
              <DependencyGraphCanvas
                layout={graphLayout}
                criticalChain={criticalChain}
                selectedIssueId={selectedIssueId}
                onSelectIssue={setSelectedIssueId}
                onOpenDrawer={handleOpenDrawer}
                onRemoveDependency={removeDependency}
                onRegisterZoomControls={setZoomControls}
                isObserver={isObserver}
              />
              {/* Ranked Bottleneck Panel */}
              <BottleneckPanel
                bottlenecks={bottlenecks}
                selectedIssueId={selectedIssueId}
                onSelectIssue={setSelectedIssueId}
                onOpenDrawer={handleOpenDrawer}
              />
            </div>

            {/* Mobile Fallback: Active Blocker Registry */}
            <div className="flex-1 md:hidden overflow-auto">
              <ActiveBlockerRegistry
                edges={filteredEdges}
                onOpenDrawer={handleOpenDrawer}
                onRemoveDependency={removeDependency}
                isObserver={isObserver}
              />
            </div>
          </div>
        )}

        {viewMode === 'matrix' && (
          <DependencyMatrix
            matrixData={crossTeamMatrix}
            onOpenDrawer={handleOpenDrawer}
            onRemoveDependency={removeDependency}
            isObserver={isObserver}
          />
        )}

        {viewMode === 'blockers' && (
          <ActiveBlockerRegistry
            edges={filteredEdges}
            onOpenDrawer={handleOpenDrawer}
            onRemoveDependency={removeDependency}
            isObserver={isObserver}
          />
        )}
      </main>

      {/* 5. Add Dependency Modal (ADMIN / MEMBER only) */}
      {!isObserver && (
        <AddDependencyDialog
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          issues={issues}
          teams={teams}
          projects={projects}
          dependencies={dependencies}
          onAddDependency={addDependency}
        />
      )}
    </div>
  );
};
