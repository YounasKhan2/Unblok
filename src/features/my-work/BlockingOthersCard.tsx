/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GitFork, ArrowRight, ShieldAlert } from 'lucide-react';
import { BlockingOtherItem } from './selectors';
import { StatePill } from '../../components/ui/StatePill';
import { PriorityIcon } from '../../components/ui/PriorityIcon';
import { Avatar } from '../../components/ui/Avatar';
import { useProject } from '../../context/ProjectContext';

interface BlockingOthersCardProps {
  item: BlockingOtherItem;
  onOpenIssue: (issueKey: string) => void;
}

export const BlockingOthersCard: React.FC<BlockingOthersCardProps> = ({
  item,
  onOpenIssue,
}) => {
  const { users } = useProject();
  const { issue, activeDownstreamIssues } = item;

  return (
    <div className="border border-[#e5e3df] rounded-[6px] bg-white hover:border-[#5645d4]/40 transition-colors p-3 text-xs shadow-2xs">
      {/* Top Bar: Primary Issue owned by Current User */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div
          onClick={() => onOpenIssue(issue.key)}
          className="flex items-center gap-2 min-w-0 cursor-pointer group"
        >
          <PriorityIcon priority={issue.priority} size="sm" />
          <span className="font-mono font-bold text-[#5645d4] group-hover:underline">
            {issue.key}
          </span>
          <span className="font-medium text-[#1a1a1a] truncate group-hover:text-[#5645d4]">
            {issue.title}
          </span>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <StatePill state={issue.state} size="sm" />
        </div>
      </div>

      {/* Downstream Impact Strip */}
      <div className="bg-[#fafaf9] rounded-[4px] p-2 border border-[#e5e3df]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[#5645d4] font-medium text-[11px] shrink-0">
          <GitFork className="w-3.5 h-3.5" />
          <span>Directly Blocking {activeDownstreamIssues.length} Downstream Tasks:</span>
        </div>

        {/* Downstream Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {activeDownstreamIssues.map(down => {
            const assignee = users.find(u => u.id === down.assigneeId);
            return (
              <button
                key={down.id}
                onClick={e => {
                  e.stopPropagation();
                  onOpenIssue(down.key);
                }}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-white border border-[#e5e3df] hover:border-[#5645d4] text-[#1a1a1a] text-[11px] transition-colors cursor-pointer group"
                title={`${down.key}: ${down.title} (Assigned to ${assignee?.name || 'Unassigned'})`}
              >
                <span className="font-mono font-semibold text-[#5645d4] group-hover:underline">
                  {down.key}
                </span>
                <Avatar user={assignee} size="xs" />
                <span className="text-[10px] text-[#787671] hidden md:inline truncate max-w-[120px]">
                  {assignee ? assignee.name.split(' ')[0] : 'Unassigned'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
