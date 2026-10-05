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
    <div className="bg-[#fafaf9] border-b border-[#e5e3df] px-4 py-1.5 flex items-center justify-between gap-3 text-xs shrink-0 select-none">
      {/* Left: Compact operational signals */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Blocked Signal Button */}
        {summary.blockedCount > 0 ? (
          <button
            onClick={() => onBlockerFilterChange(isBlockedActive ? 'ALL' : 'BLOCKED_ONLY')}
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] border text-xs font-medium transition-colors cursor-pointer ${
              isBlockedActive
                ? 'bg-[#ffe8d4] border-[#f5b38a] text-[#c24e00] font-semibold ring-1 ring-[#f5b38a]'
                : 'bg-[#fff5ee] border-[#ffd8be] text-[#dd5b00] hover:bg-[#ffe8d4]'
            }`}
            title={isBlockedActive ? 'Click to show all tasks' : 'Click to filter only blocked tasks'}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-[#dd5b00]" />
            <span>
              <strong>{summary.blockedCount}</strong> {summary.blockedCount === 1 ? 'task blocked' : 'tasks blocked'}
            </span>
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 text-[#787671] text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0f7b6c]" />
            <span>No active blockers</span>
          </span>
        )}

        <span className="text-[#c8c4be]">·</span>

        {/* Blocking Others Signal */}
        {summary.blockingCount > 0 ? (
          <button
            onClick={onJumpToBlockingOthers}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] border border-purple-200 bg-purple-50 text-[#5645d4] hover:bg-purple-100 transition-colors cursor-pointer text-xs font-medium"
            title="View tasks where you are an active prerequisite for teammates"
          >
            <GitFork className="w-3.5 h-3.5 text-[#5645d4]" />
            <span>
              Blocking <strong>{summary.blockingCount}</strong> downstream
            </span>
          </button>
        ) : (
          <span className="text-xs text-[#787671]">Not blocking teammates</span>
        )}
      </div>

      {/* Right: Active filter indicator & reset */}
      {hasActiveFilters && (
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-[#787671] flex items-center gap-1">
            <Filter className="w-3 h-3 text-[#5645d4]" />
            <span>Filtered queue</span>
          </span>
          {onClearFilters && (
            <button
              onClick={onClearFilters}
              className="inline-flex items-center gap-1 text-[11px] text-[#5645d4] hover:text-[#4534b3] font-medium hover:underline cursor-pointer"
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
