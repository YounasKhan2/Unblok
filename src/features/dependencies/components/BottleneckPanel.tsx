/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Flame, ChevronRight, ChevronLeft, ExternalLink, Users, FolderKanban } from 'lucide-react';
import { BottleneckRankItem } from '../types';

interface BottleneckPanelProps {
  bottlenecks: BottleneckRankItem[];
  selectedIssueId: string | null;
  onSelectIssue: (issueId: string) => void;
  onOpenDrawer: (issueKey: string) => void;
}

const STATE_COLORS: Record<string, string> = {
  BACKLOG: 'bg-[#f6f5f4] text-[#787671] border-[#e5e3df]',
  TODO: 'bg-[#f6f5f4] text-[#5d5b54] border-[#e5e3df]',
  IN_PROGRESS: 'bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]',
  IN_REVIEW: 'bg-[#fef3c7] text-[#b45309] border-[#fde68a]',
  DONE: 'bg-[#dcfce7] text-[#15803d] border-[#bbf7d0]',
  CANCELLED: 'bg-[#f6f5f4] text-[#a4a097] border-[#e5e3df]',
};

export const BottleneckPanel: React.FC<BottleneckPanelProps> = ({
  bottlenecks,
  selectedIssueId,
  onSelectIssue,
  onOpenDrawer,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="absolute top-4 right-4 z-10 p-2 bg-white/95 backdrop-blur-xs border border-[#e5e3df] rounded-[6px] shadow-xs hover:bg-[#fafaf9] text-[#e03e3e] flex items-center gap-1.5 cursor-pointer text-xs font-semibold"
        title="Expand Bottlenecks Ranking Panel"
      >
        <Flame className="w-4 h-4 text-[#e03e3e]" />
        <span>Top Bottlenecks ({bottlenecks.length})</span>
        <ChevronLeft className="w-3.5 h-3.5 text-[#787671]" />
      </button>
    );
  }

  return (
    <div
      role="region"
      aria-label="High Impact Bottlenecks"
      className="absolute top-4 right-4 z-10 w-80 max-w-[calc(100vw-2rem)] bg-white/95 backdrop-blur-xs border border-[#e5e3df] rounded-[8px] shadow-md flex flex-col max-h-[calc(100%-2rem)] overflow-hidden"
    >
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#e5e3df] flex items-center justify-between bg-[#fafaf9]">
        <div className="flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-[#e03e3e]" />
          <h2 className="text-xs font-semibold text-[#1a1a1a]">High Impact Bottlenecks</h2>
        </div>
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1 hover:bg-[#ede9e4] text-[#787671] rounded-[4px] cursor-pointer"
          title="Collapse Bottlenecks Panel"
          aria-label="Collapse Bottlenecks Panel"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Description */}
      <div className="px-3 py-1.5 text-[11px] text-[#787671] border-b border-[#e5e3df] bg-white">
        Ranked deterministically by active transitive downstream blast radius.
      </div>

      {/* List */}
      <div className="overflow-y-auto divide-y divide-[#e5e3df]">
        {bottlenecks.length === 0 ? (
          <div className="p-4 text-center text-xs text-[#787671]">
            No active bottlenecks found in the current workspace.
          </div>
        ) : (
          bottlenecks.map((item, idx) => {
            const isSelected = selectedIssueId === item.issue.id;
            return (
              <div
                key={item.issue.id}
                onClick={() => onSelectIssue(item.issue.id)}
                className={`p-2.5 text-xs transition-colors cursor-pointer ${
                  isSelected ? 'bg-[#fff5ee] border-l-2 border-l-[#dd5b00]' : 'hover:bg-[#fafaf9]'
                }`}
              >
                {/* Top line: Rank, Key, State, Drawer link */}
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-[#787671] w-4 text-center">
                      #{idx + 1}
                    </span>
                    <span className="font-mono font-semibold text-[#1a1a1a]">
                      {item.issue.key}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded border uppercase font-medium ${
                        STATE_COLORS[item.issue.state] || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {item.issue.state.replace('_', ' ')}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDrawer(item.issue.key);
                    }}
                    className="p-1 hover:bg-[#e5e3df] text-[#787671] hover:text-[#1a1a1a] rounded-[4px] cursor-pointer"
                    title={`Open ${item.issue.key} in drawer`}
                    aria-label={`Open ${item.issue.key} in drawer`}
                  >
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                {/* Title */}
                <p className="text-[12px] text-[#37352f] line-clamp-1 mb-1.5" title={item.issue.title}>
                  {item.issue.title}
                </p>

                {/* Impact breakdown */}
                <div className="text-[11px] text-[#dd5b00] font-medium flex items-center gap-1 mb-1">
                  <Flame className="w-3 h-3 text-[#dd5b00]" />
                  <span>
                    Blocks <strong>{item.transitiveBlastRadius}</strong> downstream{' '}
                    {item.transitiveBlastRadius === 1 ? 'issue' : 'issues'}
                  </span>
                </div>

                {/* Cross-Team / Cross-Project reach */}
                <div className="flex items-center gap-3 text-[10px] text-[#787671]">
                  <span className="inline-flex items-center gap-1" title={`${item.affectedTeams.length} teams affected`}>
                    <Users className="w-3 h-3 text-[#5645d4]" />
                    <span>{item.affectedTeams.length} {item.affectedTeams.length === 1 ? 'team' : 'teams'}</span>
                  </span>
                  <span className="inline-flex items-center gap-1" title={`${item.affectedProjects.length} projects affected`}>
                    <FolderKanban className="w-3 h-3 text-[#5d5b54]" />
                    <span>{item.affectedProjects.length} {item.affectedProjects.length === 1 ? 'project' : 'projects'}</span>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
