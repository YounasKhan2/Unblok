/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldAlert, GitFork, CheckCircle2, Users, Flame, Network, X } from 'lucide-react';
import { DependencySummaryMetrics } from '../types';

interface DependencySummaryBarProps {
  metrics: DependencySummaryMetrics;
  activeFilterCount?: number;
  onClearFilters?: () => void;
}

/**
 * Compact, operational summary strip for workspace dependency intelligence.
 * High density, deterministic numbers, no decorative oversized cards.
 */
export const DependencySummaryBar: React.FC<DependencySummaryBarProps> = ({
  metrics,
  activeFilterCount = 0,
  onClearFilters,
}) => {
  return (
    <div
      role="region"
      aria-label="Dependency Summary Metrics"
      className="bg-surface-subtle border-b border-border px-4 py-2 flex items-center justify-between gap-4 text-xs shrink-0 select-none overflow-x-auto"
    >
      <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
        {/* Active Blockers */}
        <div
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] border border-blocker/30 bg-blocker/10 text-blocker"
          title="Total active upstream blockers causing downstream issues to be blocked"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-blocker" />
          <span>
            <strong className="font-semibold">{metrics.activeEdgesCount}</strong> Active {metrics.activeEdgesCount === 1 ? 'Edge' : 'Edges'}
          </span>
        </div>

        {/* Blocked Issues */}
        <div
          className="inline-flex items-center gap-1.5 text-text-primary"
          title="Issues currently blocked by at least one active upstream issue"
        >
          <span className="w-2 h-2 rounded-full bg-blocker" />
          <span>
            <strong className="font-semibold">{metrics.blockedIssuesCount}</strong> Blocked {metrics.blockedIssuesCount === 1 ? 'Issue' : 'Issues'}
          </span>
        </div>

        {/* Cross-Team Active Edges */}
        <div
          className="inline-flex items-center gap-1.5 text-text-primary"
          title="Active dependencies crossing team boundaries"
        >
          <Users className="w-3.5 h-3.5 text-accent" />
          <span>
            <strong className="font-semibold">{metrics.crossTeamActiveEdgesCount}</strong> Cross-Team
          </span>
        </div>

        {/* Cross-Project Active Edges */}
        <div
          className="inline-flex items-center gap-1.5 text-text-secondary"
          title="Active dependencies crossing project boundaries"
        >
          <GitFork className="w-3.5 h-3.5 text-text-muted" />
          <span>
            <strong className="font-semibold">{metrics.crossProjectActiveEdgesCount}</strong> Cross-Project
          </span>
        </div>

        {/* Bottlenecks */}
        <div
          className="inline-flex items-center gap-1.5 text-text-primary"
          title="High-impact upstream issues blocking multiple downstream items"
        >
          <Flame className="w-3.5 h-3.5 text-danger" />
          <span>
            <strong className="font-semibold">{metrics.bottlenecksCount}</strong> {metrics.bottlenecksCount === 1 ? 'Bottleneck' : 'Bottlenecks'}
          </span>
        </div>

        {/* Longest Active Chain */}
        <div
          className="inline-flex items-center gap-1.5 text-text-secondary"
          title="Longest active dependency chain depth (active DAG depth, not duration)"
        >
          <Network className="w-3.5 h-3.5 text-text-secondary" />
          <span>
            Depth: <strong className="font-semibold">{metrics.longestActiveChainDepth}</strong>
          </span>
        </div>

        {/* Resolved Edges */}
        <div
          className="inline-flex items-center gap-1.5 text-text-muted"
          title="Historically persisted dependency relationships where upstream is resolved"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-success" />
          <span>
            <strong className="font-semibold">{metrics.resolvedEdgesCount}</strong> Resolved History
          </span>
        </div>
      </div>

      {/* Right: Active Filters Reset */}
      {activeFilterCount > 0 && onClearFilters && (
        <button
          onClick={onClearFilters}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] border border-border hover:border-border-strong bg-surface-base text-text-secondary hover:text-text-primary text-xs font-medium cursor-pointer transition-colors shrink-0"
          title="Clear all active filters"
        >
          <X className="w-3 h-3 text-text-muted" />
          <span>Clear ({activeFilterCount})</span>
        </button>
      )}
    </div>
  );
};
