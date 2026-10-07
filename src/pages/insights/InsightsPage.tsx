import React, { useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext';
import { useDrawerRoute } from '../../app/router/useDrawerRoute';
import { selectWorkspaceInsights, DEFAULT_INSIGHTS_FILTER } from '../../features/insights/selectors/insightSelectors';
import { InsightsFilterState } from '../../features/insights/types';
import { ExecutionSummary } from '../../features/insights/components/ExecutionSummary';
import { InsightsFilterBar } from '../../features/insights/components/InsightsFilterBar';
import { NeedsAttentionPanel } from '../../features/insights/components/NeedsAttentionPanel';
import { HighRiskWorkTable } from '../../features/insights/components/HighRiskWorkTable';
import { BottleneckPanel } from '../../features/insights/components/BottleneckPanel';
import { DeliveryHealthPanel } from '../../features/insights/components/DeliveryHealthPanel';
import { CrossTeamMatrix } from '../../features/insights/components/CrossTeamMatrix';
import { BarChart2, GitFork, ArrowRight } from 'lucide-react';

export const InsightsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { openDrawer } = useDrawerRoute();

  const {
    issues,
    dependencies,
    projects,
    teams,
    milestones,
    cycles,
    activities,
  } = useProject();

  // 1. Read filter state from URL search params
  const filters: InsightsFilterState = useMemo(() => {
    return {
      team: searchParams.get('team') || DEFAULT_INSIGHTS_FILTER.team,
      project: searchParams.get('project') || DEFAULT_INSIGHTS_FILTER.project,
      risk: searchParams.get('risk')?.toUpperCase() || DEFAULT_INSIGHTS_FILTER.risk,
      cycle: searchParams.get('cycle') || DEFAULT_INSIGHTS_FILTER.cycle,
    };
  }, [searchParams]);

  // 2. Update filters while preserving other query params (like drawer)
  const handleFilterChange = useCallback(
    (updates: Partial<InsightsFilterState>) => {
      const nextParams = new URLSearchParams(searchParams);
      if (updates.team !== undefined) {
        if (updates.team === 'ALL') nextParams.delete('team');
        else nextParams.set('team', updates.team);
      }
      if (updates.project !== undefined) {
        if (updates.project === 'ALL') nextParams.delete('project');
        else nextParams.set('project', updates.project);
      }
      if (updates.risk !== undefined) {
        if (updates.risk === 'ALL') nextParams.delete('risk');
        else nextParams.set('risk', updates.risk.toLowerCase());
      }
      if (updates.cycle !== undefined) {
        if (updates.cycle === 'ALL') nextParams.delete('cycle');
        else nextParams.set('cycle', updates.cycle);
      }
      setSearchParams(nextParams);
    },
    [searchParams, setSearchParams]
  );

  const handleResetFilters = useCallback(() => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('team');
    nextParams.delete('project');
    nextParams.delete('risk');
    nextParams.delete('cycle');
    setSearchParams(nextParams);
  }, [searchParams, setSearchParams]);

  // 3. Pure intelligence selector derivation
  const insightsData = useMemo(() => {
    return selectWorkspaceInsights({
      issues,
      dependencies,
      projects,
      teams,
      milestones,
      cycles,
      activities,
      filters,
    });
  }, [issues, dependencies, projects, teams, milestones, cycles, activities, filters]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-canvas overflow-y-auto">
      <div className="max-w-[1600px] w-full mx-auto p-4 sm:p-6 space-y-4">
        {/* Page Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-accent" />
              <h1 className="text-lg font-bold text-text-primary tracking-tight">
                Execution Intelligence
              </h1>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              Deterministic delivery risk, active blockers, and dependency bottlenecks across your workspace.
            </p>
          </div>
        </header>

        {/* 1. Top Summary Metric Strip: High-density orientation */}
        <ExecutionSummary summary={insightsData.summary} />

        {/* 2. Filter Bar */}
        <InsightsFilterBar
          filters={filters}
          teams={teams}
          projects={projects}
          cycles={cycles}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
        />

        {/* 3. Primary Action & Health 2-Column Region */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Prioritized action signals */}
          <NeedsAttentionPanel
            signals={insightsData.needsAttention}
            onOpenDrawer={openDrawer}
          />

          {/* Right: Aggregate delivery condition */}
          <DeliveryHealthPanel
            projectHealth={insightsData.projectHealth}
            teamHealth={insightsData.teamHealth}
          />
        </div>

        {/* 4. Detailed High-Risk Work List (Dense Execution Table) */}
        <HighRiskWorkTable
          issues={insightsData.highRiskIssues}
          onOpenDrawer={openDrawer}
        />

        {/* 5. Systemic Dependency Pressure Region */}
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between pb-1 border-b border-border/50">
            <div className="flex items-center gap-2">
              <GitFork className="w-4 h-4 text-accent" />
              <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Dependency Pressure
              </h2>
            </div>
            <Link
              to="/dependencies"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
            >
              <span>Open Dependency Intelligence</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <BottleneckPanel
              bottlenecks={insightsData.bottlenecks}
              criticalChain={insightsData.criticalChain}
              onOpenDrawer={openDrawer}
            />

            <CrossTeamMatrix
              matrixData={insightsData.crossTeamMatrix}
              scopeLabel={insightsData.matrixScopeLabel}
            />
          </div>
        </section>
      </div>
    </div>
  );
};
