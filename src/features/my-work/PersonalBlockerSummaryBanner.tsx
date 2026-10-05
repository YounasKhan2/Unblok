/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldAlert, GitFork, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { MyWorkSummary } from './selectors';

interface PersonalBlockerSummaryBannerProps {
  summary: MyWorkSummary;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  activeCycleName?: string;
}

export const PersonalBlockerSummaryBanner: React.FC<PersonalBlockerSummaryBannerProps> = ({
  summary,
  activeFilter,
  onFilterChange,
  activeCycleName = 'Cycle 24',
}) => {
  return (
    <div className="bg-[#fafaf9] border-b border-[#e5e3df] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Left: Summary Metrics */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Blocked Alert Indicator */}
        <button
          onClick={() => onFilterChange(activeFilter === 'BLOCKED_ONLY' ? 'ALL' : 'BLOCKED_ONLY')}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-[5px] transition-colors cursor-pointer border ${
            activeFilter === 'BLOCKED_ONLY'
              ? 'bg-[#ffe8d4] border-[#f5b38a] text-[#c24e00] font-semibold'
              : summary.blockedCount > 0
              ? 'bg-[#fff5ee] border-[#ffd8be] text-[#dd5b00] hover:bg-[#ffe8d4]'
              : 'bg-white border-[#e5e3df] text-[#787671]'
          }`}
          title="Filter for blocked work requiring upstream unblocking"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-[#dd5b00]" />
          <span>
            <strong className="font-semibold">{summary.blockedCount}</strong>{' '}
            {summary.blockedCount === 1 ? 'task blocked' : 'tasks blocked'}
          </span>
        </button>

        {/* Blocking Others Indicator */}
        <button
          onClick={() => onFilterChange(activeFilter === 'BLOCKING_OTHERS' ? 'ALL' : 'BLOCKING_OTHERS')}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-[5px] transition-colors cursor-pointer border ${
            activeFilter === 'BLOCKING_OTHERS'
              ? 'bg-purple-100 border-purple-300 text-[#5645d4] font-semibold'
              : summary.blockingCount > 0
              ? 'bg-purple-50/70 border-purple-200 text-[#5645d4] hover:bg-purple-100'
              : 'bg-white border-[#e5e3df] text-[#787671]'
          }`}
          title="Tasks where your work is an active prerequisite for peers"
        >
          <GitFork className="w-3.5 h-3.5 text-[#5645d4]" />
          <span>
            Blocking <strong className="font-semibold">{summary.blockingCount}</strong> downstream
          </span>
        </button>

        {/* In Progress Indicator */}
        <button
          onClick={() => onFilterChange(activeFilter === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS')}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-[5px] transition-colors cursor-pointer border ${
            activeFilter === 'IN_PROGRESS'
              ? 'bg-blue-100 border-blue-300 text-blue-800 font-semibold'
              : 'bg-white border-[#e5e3df] text-[#37352f] hover:bg-[#f6f5f4]'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          <span>
            <strong className="font-semibold">{summary.inProgressCount}</strong> in progress
          </span>
        </button>

        {/* In Review Indicator */}
        {summary.inReviewCount > 0 && (
          <button
            onClick={() => onFilterChange(activeFilter === 'IN_REVIEW' ? 'ALL' : 'IN_REVIEW')}
            className={`hidden md:flex items-center gap-1.5 px-2 py-1 rounded-[5px] transition-colors cursor-pointer border ${
              activeFilter === 'IN_REVIEW'
                ? 'bg-amber-100 border-amber-300 text-amber-900 font-semibold'
                : 'bg-white border-[#e5e3df] text-[#37352f] hover:bg-[#f6f5f4]'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>
              <strong className="font-semibold">{summary.inReviewCount}</strong> in review
            </span>
          </button>
        )}

        {/* Recently Completed */}
        {summary.completedCount > 0 && (
          <button
            onClick={() => onFilterChange(activeFilter === 'DONE' ? 'ALL' : 'DONE')}
            className={`hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-[5px] transition-colors cursor-pointer border ${
              activeFilter === 'DONE'
                ? 'bg-emerald-100 border-emerald-300 text-emerald-900 font-semibold'
                : 'bg-white border-[#e5e3df] text-[#787671] hover:bg-[#f6f5f4]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              <strong className="font-semibold">{summary.completedCount}</strong> done
            </span>
          </button>
        )}
      </div>

      {/* Right: Active Cycle Badge & Clear Filter */}
      <div className="flex items-center gap-2 ml-auto">
        {activeFilter !== 'ALL' && (
          <button
            onClick={() => onFilterChange('ALL')}
            className="text-[11px] text-[#5645d4] hover:underline cursor-pointer font-medium"
          >
            Clear filter
          </button>
        )}
        <div className="text-[11px] font-mono text-[#787671] bg-white border border-[#e5e3df] px-2 py-0.5 rounded-[4px]">
          {activeCycleName}
        </div>
      </div>
    </div>
  );
};
