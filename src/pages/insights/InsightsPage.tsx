/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { IssueDrawer } from '../../components/drawer/IssueDrawer';
import { Sparkles, BarChart2 } from 'lucide-react';

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
    <div className="flex-1 flex flex-col min-h-0 bg-surface-base overflow-y-auto">
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

        {/* Top Summary Metric Strip */}
        <ExecutionSummary summary={insightsData.summary} />

        {/* Filter Bar */}
        <InsightsFilterBar
          filters={filters}
          teams={teams}
          projects={projects}
          cycles={cycles}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
        />

        {/* Main Content Layout: High-priority signal control surface */}
        <div className="space-y-4">
          {/* Section 1: Needs Attention Signals */}
          <NeedsAttentionPanel
            signals={insightsData.needsAttention}
            onOpenDrawer={openDrawer}
          />

          {/* Section 2: High-Risk Work Table */}
          <HighRiskWorkTable
            issues={insightsData.highRiskIssues}
            onOpenDrawer={openDrawer}
          />

          {/* Section 3: Dual Intelligence Grid (Bottlenecks & Delivery Health) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <BottleneckPanel
              bottlenecks={insightsData.bottlenecks}
              criticalChain={insightsData.criticalChain}
              onOpenDrawer={openDrawer}
            />

            <DeliveryHealthPanel
              projectHealth={insightsData.projectHealth}
              teamHealth={insightsData.teamHealth}
            />
          </div>

          {/* Section 4: Cross-Team Execution Pressure Matrix */}
          <CrossTeamMatrix
            matrixData={insightsData.crossTeamMatrix}
            scopeLabel={insightsData.matrixScopeLabel}
          />
        </div>
      </div>

      {/* Slide-over Issue Drawer */}
      <IssueDrawer />
    </div>
  );
};
