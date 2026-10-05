/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Issue } from '../../types';
import { useProject } from '../../context/ProjectContext';
import { StatePill } from '../../components/ui/StatePill';
import { PriorityIcon } from '../../components/ui/PriorityIcon';
import { BlockerBadge } from '../../components/ui/BlockerBadge';
import { Calendar, GitFork } from 'lucide-react';

interface MyWorkRowProps {
  issue: Issue;
  isSelected: boolean;
  isMultiSelected?: boolean;
  onSelect: () => void;
  onToggleMultiSelect?: (isShift: boolean) => void;
  onOpenIssue: (key: string) => void;
  showDownstreamIndicator?: boolean;
}

export const MyWorkRow: React.FC<MyWorkRowProps> = ({
  issue,
  isSelected,
  isMultiSelected = false,
  onSelect,
  onToggleMultiSelect,
  onOpenIssue,
  showDownstreamIndicator = true,
}) => {
  const { teams, getIssueBlockerStatus } = useProject();

  const blockerStatus = getIssueBlockerStatus(issue.id);
  const team = teams.find(t => t.id === issue.teamId);
  const hasActiveDownstream =
    showDownstreamIndicator &&
    blockerStatus.downstreamIssues.some(
      d => d.state !== 'DONE' && d.state !== 'CANCELLED'
    );

  return (
    <div
      onClick={onSelect}
      className={`group relative flex items-center h-[36px] px-3 border-b border-[#e5e3df] text-xs cursor-pointer select-none transition-colors ${
        isMultiSelected
          ? 'bg-[#5645d4]/12'
          : isSelected
          ? 'bg-[#5645d4]/8 font-medium'
          : 'hover:bg-[#f6f5f4] bg-white'
      }`}
      role="row"
      aria-selected={isSelected}
    >
      {/* Keyboard selection left accent marker */}
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#5645d4]" />
      )}

      {/* Multi-select checkbox */}
      <div
        className="w-5 shrink-0 flex items-center justify-start pr-1"
        onClick={e => {
          e.stopPropagation();
          onToggleMultiSelect?.(e.shiftKey);
        }}
      >
        <input
          type="checkbox"
          checked={isMultiSelected}
          onChange={() => {}}
          className="w-3.5 h-3.5 rounded-[3px] border-[#c8c4be] text-[#5645d4] focus:ring-0 cursor-pointer"
          aria-label={`Select ${issue.key}`}
        />
      </div>

      {/* Priority */}
      <div className="w-6 shrink-0 flex items-center justify-center">
        <PriorityIcon priority={issue.priority} size="sm" />
      </div>

      {/* Issue Key */}
      <div className="w-20 shrink-0 font-mono font-semibold text-[#5645d4] group-hover:underline">
        {issue.key}
      </div>

      {/* Title */}
      <div className="flex-1 min-w-0 pr-3 truncate flex items-center gap-2">
        <span
          className={`truncate ${
            issue.state === 'CANCELLED' ? 'line-through text-[#a4a097]' : 'text-[#1a1a1a]'
          }`}
        >
          {issue.title}
        </span>

        {/* Blocking Others Pill Indicator */}
        {hasActiveDownstream && (
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-purple-100 text-[#5645d4] shrink-0"
            title={`Blocks ${blockerStatus.downstreamIssues.length} downstream tasks`}
          >
            <GitFork className="w-2.5 h-2.5" />
            <span>Blocks {blockerStatus.downstreamIssues.length}</span>
          </span>
        )}
      </div>

      {/* Blocker & Upstream Prerequisite Pill */}
      <div className="shrink-0 mr-3 flex items-center">
        <BlockerBadge
          status={blockerStatus}
          onSelectIssue={id => {
            // Open clicked blocker issue
            onOpenIssue(id);
          }}
        />
      </div>

      {/* State Pill */}
      <div className="w-28 shrink-0 flex items-center">
        <StatePill state={issue.state} size="sm" />
      </div>

      {/* Due Date Indicator */}
      <div className="w-24 shrink-0 hidden lg:flex items-center gap-1 text-[11px] text-[#787671]">
        {issue.dueDate ? (
          <>
            <Calendar className="w-3 h-3 text-[#a4a097]" />
            <span>{issue.dueDate}</span>
          </>
        ) : (
          <span className="text-[#c8c4be]">—</span>
        )}
      </div>

      {/* Team Badge */}
      <div className="w-20 shrink-0 hidden md:flex items-center gap-1.5 truncate text-[#787671] text-[11px]">
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: team?.color || '#5645d4' }}
        />
        <span className="truncate">{team?.key || 'ENG'}</span>
      </div>
    </div>
  );
};
