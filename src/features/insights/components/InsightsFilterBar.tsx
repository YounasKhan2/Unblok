/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Project, Team, Cycle } from '../../../types';
import { InsightsFilterState } from '../types';
import { Filter, RotateCcw } from 'lucide-react';

interface InsightsFilterBarProps {
  filters: InsightsFilterState;
  teams: Team[];
  projects: Project[];
  cycles: Cycle[];
  onFilterChange: (updates: Partial<InsightsFilterState>) => void;
  onResetFilters: () => void;
}

export const InsightsFilterBar: React.FC<InsightsFilterBarProps> = ({
  filters,
  teams,
  projects,
  cycles,
  onFilterChange,
  onResetFilters,
}) => {
  const isFiltered =
    filters.team !== 'ALL' ||
    filters.project !== 'ALL' ||
    filters.risk !== 'ALL' ||
    filters.cycle !== 'ALL';

  return (
    <div
      role="search"
      aria-label="Insights Filters"
      className="flex flex-wrap items-center justify-between gap-2.5 p-2 rounded-lg bg-surface-base border border-border"
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary px-1.5">
          <Filter className="w-3.5 h-3.5 text-text-muted" />
          <span>Scope:</span>
        </div>

        {/* Team Filter */}
        <select
          id="insights-team-filter"
          aria-label="Filter by Team"
          value={filters.team}
          onChange={e => onFilterChange({ team: e.target.value })}
          className="text-xs bg-surface-card border border-border text-text-primary rounded px-2.5 py-1 focus:outline-none focus:border-accent"
        >
          <option value="ALL">All Teams</option>
          {teams.map(t => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        {/* Project Filter */}
        <select
          id="insights-project-filter"
          aria-label="Filter by Project"
          value={filters.project}
          onChange={e => onFilterChange({ project: e.target.value })}
          className="text-xs bg-surface-card border border-border text-text-primary rounded px-2.5 py-1 focus:outline-none focus:border-accent"
        >
          <option value="ALL">All Projects</option>
          {projects
            .filter(p => filters.team === 'ALL' || p.teamId === filters.team)
            .map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
        </select>

        {/* Risk Level Filter */}
        <select
          id="insights-risk-filter"
          aria-label="Filter by Risk Level"
          value={filters.risk}
          onChange={e => onFilterChange({ risk: e.target.value })}
          className="text-xs bg-surface-card border border-border text-text-primary rounded px-2.5 py-1 focus:outline-none focus:border-accent"
        >
          <option value="ALL">All Risk Levels</option>
          <option value="CRITICAL">Critical Risk</option>
          <option value="HIGH">High Risk</option>
          <option value="MEDIUM">Medium Risk</option>
          <option value="LOW">Low Risk</option>
        </select>

        {/* Cycle Filter */}
        <select
          id="insights-cycle-filter"
          aria-label="Filter by Cycle"
          value={filters.cycle}
          onChange={e => onFilterChange({ cycle: e.target.value })}
          className="text-xs bg-surface-card border border-border text-text-primary rounded px-2.5 py-1 focus:outline-none focus:border-accent"
        >
          <option value="ALL">All Cycles</option>
          {cycles.map(c => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.status})
            </option>
          ))}
        </select>
      </div>

      {/* Reset Filter Button */}
      {isFiltered && (
        <button
          onClick={onResetFilters}
          className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary px-2 py-1 rounded bg-surface-card hover:bg-surface-elevated border border-border transition-colors"
          title="Reset all filters to workspace default"
        >
          <RotateCcw className="w-3 h-3 text-text-muted" />
          <span>Reset</span>
        </button>
      )}
    </div>
  );
};
