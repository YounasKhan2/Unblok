import React from 'react';
import { Issue } from '../../types';
import { useProject } from '../../context/ProjectContext';
import { PriorityIcon } from '../ui/PriorityIcon';
import { Avatar } from '../ui/Avatar';
import { BlockerBadge } from '../ui/BlockerBadge';

interface IssueCardProps {
  issue: Issue;
  isSelected: boolean;
  onSelect: () => void;
}

export const IssueCard: React.FC<IssueCardProps> = ({ issue, isSelected, onSelect }) => {
  const { users, teams, getIssueBlockerStatus, setSelectedIssueId } = useProject();

  const blockerStatus = getIssueBlockerStatus(issue.id);
  const assignee = users.find(u => u.id === issue.assigneeId);
  const team = teams.find(t => t.id === issue.teamId);

  return (
    <div
      onClick={onSelect}
      className={`group relative p-2.5 rounded-lg border bg-white shadow-2xs hover:shadow-sm cursor-pointer select-none transition-all ${
        isSelected
          ? 'border-[#5645d4] ring-1 ring-[#5645d4]/30'
          : 'border-[#e5e3df] hover:border-[#c8c4be]'
      }`}
    >
      {/* Top row: Priority, Key, Team */}
      <div className="flex items-center justify-between gap-1 mb-1.5 text-xs">
        <div className="flex items-center gap-1.5 font-mono">
          <PriorityIcon priority={issue.priority} size="sm" />
          <span className="font-semibold text-[#5645d4] group-hover:underline">{issue.key}</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-[#787671]">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: team?.color || '#5645d4' }}
          />
          <span>{team?.key}</span>
        </div>
      </div>

      {/* Title */}
      <div className="text-xs font-medium text-[#1a1a1a] line-clamp-2 mb-2 leading-snug">
        {issue.title}
      </div>

      {/* Footer: Blocker badge + Assignee */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#f0eeec]">
        <div className="flex items-center">
          <BlockerBadge status={blockerStatus} onSelectIssue={id => setSelectedIssueId(id)} compact />
        </div>

        <div className="flex items-center gap-1">
          <Avatar user={assignee} size="xs" />
        </div>
      </div>
    </div>
  );
};
