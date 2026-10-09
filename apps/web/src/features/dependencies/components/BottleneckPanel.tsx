/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Flame, ChevronRight, ChevronLeft, ExternalLink, Users, FolderKanban } from 'lucide-react';
import { BottleneckRankItem } from '../types';
import { DEPENDENCY_STATE_CLASSES } from '../tokens';

interface BottleneckPanelProps {
  bottlenecks: BottleneckRankItem[];
  selectedIssueId: string | null;
  onSelectIssue: (issueId: string) => void;
  onOpenDrawer: (issueKey: string) => void;
}

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
        className="absolute top-4 right-4 z-10 p-2 bg-surface-base/95 backdrop-blur-xs border border-border rounded-[6px] shadow-xs hover:bg-surface-subtle text-danger flex items-center gap-1.5 cursor-pointer text-xs font-semibold"
        title="Expand Bottlenecks Ranking Panel"
      >
        <Flame className="w-4 h-4 text-danger" />
        <span>Top Bottlenecks ({bottlenecks.length})</span>
        <ChevronLeft className="w-3.5 h-3.5 text-text-muted" />
      </button>
    );
  }

  return (
    <div
      role="region"
      aria-label="High Impact Bottlenecks"
      className="absolute top-4 right-4 z-10 w-80 max-w-[calc(100vw-2rem)] bg-surface-base/95 backdrop-blur-xs border border-border rounded-[8px] shadow-md flex flex-col max-h-[calc(100%-2rem)] overflow-hidden"
    >
      {/* Header */}
      <div className="px-3 py-2 border-b border-border flex items-center justify-between bg-surface-subtle">
        <div className="flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-danger" />
          <h2 className="text-xs font-semibold text-text-primary">High Impact Bottlenecks</h2>
        </div>
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1 hover:bg-surface-muted text-text-muted rounded-[4px] cursor-pointer"
          title="Collapse Bottlenecks Panel"
          aria-label="Collapse Bottlenecks Panel"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Description */}
      <div className="px-3 py-1.5 text-[11px] text-text-muted border-b border-border bg-surface-base">
        Ranked deterministically by active transitive downstream blast radius.
      </div>

      {/* List */}
      <div className="overflow-y-auto divide-y divide-border">
        {bottlenecks.length === 0 ? (
          <div className="p-4 text-center text-xs text-text-muted">
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
                  isSelected ? 'bg-blocker/10 border-l-2 border-l-blocker' : 'hover:bg-surface-subtle'
                }`}
              >
                {/* Top line: Rank, Key, State, Drawer link */}
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-text-muted w-4 text-center">
                      #{idx + 1}
                    </span>
                    <span className="font-mono font-semibold text-text-primary">
                      {item.issue.key}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded border uppercase font-medium ${
                        DEPENDENCY_STATE_CLASSES[item.issue.state] || 'bg-surface-muted text-text-muted border-border'
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
                    className="p-1 hover:bg-surface-muted text-text-muted hover:text-text-primary rounded-[4px] cursor-pointer"
                    title={`Open ${item.issue.key} in drawer`}
                    aria-label={`Open ${item.issue.key} in drawer`}
                  >
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                {/* Title */}
                <p className="text-[12px] text-text-primary line-clamp-1 mb-1.5" title={item.issue.title}>
                  {item.issue.title}
                </p>

                {/* Impact breakdown */}
                <div className="text-[11px] text-blocker font-medium flex items-center gap-1 mb-1">
                  <Flame className="w-3 h-3 text-blocker" />
                  <span>
                    Blocks <strong>{item.transitiveBlastRadius}</strong> downstream{' '}
                    {item.transitiveBlastRadius === 1 ? 'issue' : 'issues'}
                  </span>
                </div>

                {/* Cross-Team / Cross-Project reach */}
                <div className="flex items-center gap-3 text-[10px] text-text-muted">
                  <span className="inline-flex items-center gap-1" title={`${item.affectedTeams.length} teams affected`}>
                    <Users className="w-3 h-3 text-accent" />
                    <span>{item.affectedTeams.length} {item.affectedTeams.length === 1 ? 'team' : 'teams'}</span>
                  </span>
                  <span className="inline-flex items-center gap-1" title={`${item.affectedProjects.length} projects affected`}>
                    <FolderKanban className="w-3 h-3 text-text-secondary" />
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
