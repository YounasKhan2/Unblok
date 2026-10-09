/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldAlert, GitFork, X, Filter } from 'lucide-react';
import { MyWorkSummary } from './selectors';

interface PersonalBlockerSummaryBannerProps {
  summary: MyWorkSummary;
  blockerFilter: string;
  onBlockerFilterChange: (filter: string) => void;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  onJumpToBlockingOthers?: () => void;
}

/**
 * Compact, operational execution and dependency signal bar.
 * Adheres strictly to the canonical filter contract:
 * - blockerFilter only accepts 'BLOCKED_ONLY', 'UNBLOCKED_ONLY', or 'ALL'
 * - Lifecycle states (TODO, IN_PROGRESS, IN_REVIEW, DONE) are NEVER written here.
 * - Avoids large dashboard KPI cards in favor of a dense, actionable signal strip.
 */
export const PersonalBlockerSummaryBanner: React.FC<PersonalBlockerSummaryBannerProps> = ({
  summary,
  blockerFilter,
  onBlockerFilterChange,
  hasActiveFilters = false,
  onClearFilters,
  onJumpToBlockingOthers,
}) => {
  // If there are no active blockers, no blocking issues, and no active filters, render a minimal subtle bar
  const isBlockedActive = blockerFilter === 'BLOCKED_ONLY';

  return (
    <div className="bg-surface-subtle border-b border-border px-4 py-1.5 flex items-center justify-between gap-3 text-xs shrink-0 select-none">
      {/* Left: Compact operational signals */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Blocked Signal Button */}
        {summary.blockedCount > 0 ? (
          <button
            onClick={() => onBlockerFilterChange(isBlockedActive ? 'ALL' : 'BLOCKED_ONLY')}
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] border text-xs font-medium transition-colors cursor-pointer ${
              isBlockedActive
                ? 'bg-danger-subtle border-danger text-danger font-semibold ring-1 ring-danger'
                : 'bg-danger-subtle/50 border-danger/40 text-danger hover:bg-danger-subtle'
            }`}
            title={isBlockedActive ? 'Click to show all tasks' : 'Click to filter only blocked tasks'}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-danger" />
            <span>
              <strong>{summary.blockedCount}</strong> {summary.blockedCount === 1 ? 'task blocked' : 'tasks blocked'}
            </span>
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 text-text-muted text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            <span>No active blockers</span>
          </span>
        )}

        <span className="text-border">·</span>

        {/* Blocking Others Signal */}
        {summary.blockingCount > 0 ? (
          <button
            onClick={onJumpToBlockingOthers}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] border border-accent/30 bg-accent-subtle text-accent hover:bg-accent-subtle/80 transition-colors cursor-pointer text-xs font-medium"
            title="View tasks where you are an active prerequisite for teammates"
          >
            <GitFork className="w-3.5 h-3.5 text-accent" />
            <span>
              Blocking <strong>{summary.blockingCount}</strong> downstream
            </span>
          </button>
        ) : (
          <span className="text-xs text-text-muted">Not blocking teammates</span>
        )}
      </div>

      {/* Right: Active filter indicator & reset */}
      {hasActiveFilters && (
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-text-muted flex items-center gap-1">
            <Filter className="w-3 h-3 text-accent" />
            <span>Filtered queue</span>
          </span>
          {onClearFilters && (
            <button
              onClick={onClearFilters}
              className="inline-flex items-center gap-1 text-[11px] text-accent hover:opacity-80 font-medium hover:underline cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
