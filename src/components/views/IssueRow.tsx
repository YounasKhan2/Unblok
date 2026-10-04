import React from 'react';
import { Issue } from '../../types';
import { useProject } from '../../context/ProjectContext';
import { StatePill } from '../ui/StatePill';
import { PriorityIcon } from '../ui/PriorityIcon';
import { Avatar } from '../ui/Avatar';
import { BlockerBadge } from '../ui/BlockerBadge';

interface IssueRowProps {
  issue: Issue;
  isSelected: boolean;
  isMultiSelected?: boolean;
  onSelect: () => void;
  onToggleMultiSelect?: (isShift: boolean) => void;
}

export const IssueRow: React.FC<IssueRowProps> = ({
  issue,
  isSelected,
  isMultiSelected = false,
  onSelect,
  onToggleMultiSelect,
}) => {
  const { users, teams, getIssueBlockerStatus, setSelectedIssueId } = useProject();

  const blockerStatus = getIssueBlockerStatus(issue.id);
  const assignee = users.find(u => u.id === issue.assigneeId);
  const team = teams.find(t => t.id === issue.teamId);

  return (
    <div
      onClick={onSelect}
      className={`group relative flex items-center h-[34px] px-3 border-b border-[#e5e3df] text-xs cursor-pointer select-none transition-colors ${
        isMultiSelected
          ? 'bg-[#5645d4]/12'
          : isSelected
          ? 'bg-[#5645d4]/8 font-medium'
          : 'hover:bg-[#f6f5f4] bg-white'
      }`}
    >
      {/* Selection Left Accent Bar */}
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#5645d4]" />
      )}

      {/* Checkbox for Multi-select */}
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
          onChange={() => {}} // Controlled via parent onClick
          className="w-3.5 h-3.5 rounded-[3px] border-[#c8c4be] text-[#5645d4] focus:ring-0 cursor-pointer"
        />
      </div>

      {/* Priority Column */}
      <div className="w-7 shrink-0 flex items-center justify-center">
        <PriorityIcon priority={issue.priority} size="sm" />
      </div>

      {/* Key Column */}
      <div className="w-20 shrink-0 font-mono font-semibold text-[#5645d4] group-hover:underline">
        {issue.key}
      </div>

      {/* Title Column */}
      <div className="flex-1 min-w-0 pr-3 truncate flex items-center gap-2">
        <span className={`truncate ${issue.state === 'CANCELLED' ? 'line-through text-[#a4a097]' : 'text-[#1a1a1a]'}`}>
          {issue.title}
        </span>
      </div>

      {/* Blocker & Dependency Status Badge */}
      <div className="shrink-0 mr-3 flex items-center">
        <BlockerBadge
          status={blockerStatus}
          onSelectIssue={id => setSelectedIssueId(id)}
        />
      </div>

      {/* State Column */}
      <div className="w-28 shrink-0 flex items-center">
        <StatePill state={issue.state} size="sm" />
      </div>

      {/* Team Column */}
      <div className="w-24 shrink-0 hidden md:flex items-center gap-1.5 truncate text-[#787671]">
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: team?.color || '#5645d4' }}
        />
        <span className="truncate">{team?.key}</span>
      </div>

      {/* Assignee Column */}
      <div className="w-28 shrink-0 flex items-center gap-1.5 truncate">
        <Avatar user={assignee} size="xs" />
        <span className="truncate text-[#787671]">{assignee ? assignee.name.split(' ')[0] : '—'}</span>
      </div>
    </div>
  );
};
