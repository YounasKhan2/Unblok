/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { BottleneckRankItem, CriticalChainResult } from '../../dependencies/types';
import { GitPullRequest, Layers, ExternalLink, Network, CheckCircle } from 'lucide-react';

interface BottleneckPanelProps {
  bottlenecks: BottleneckRankItem[];
  criticalChain: CriticalChainResult;
  onOpenDrawer: (issueKey: string) => void;
}

export const BottleneckPanel: React.FC<BottleneckPanelProps> = ({
  bottlenecks,
  criticalChain,
  onOpenDrawer,
}) => {
  if (bottlenecks.length === 0) {
    return (
      <div className="p-4 rounded-lg bg-surface-card border border-border">
        <div className="flex items-center gap-2 mb-3">
          <GitPullRequest className="w-4 h-4 text-orange-500" />
          <h2 className="text-sm font-semibold text-text-primary tracking-tight">Dependency Bottlenecks</h2>
        </div>
        <div className="flex items-center gap-3 p-4 rounded bg-surface-base border border-border text-text-secondary text-xs">
          <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span>No active dependency bottlenecks currently blocking delivery.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3.5 rounded-lg bg-surface-card border border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <GitPullRequest className="w-4 h-4 text-orange-500" />
          <h2 className="text-sm font-semibold text-text-primary tracking-tight">
            Dependency Bottlenecks
          </h2>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-surface-base text-text-secondary border border-border">
            {bottlenecks.length}
          </span>
        </div>
        <Link
          to="/dependencies"
          className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:text-accent-hover transition-colors"
        >
          <span>Open Full Graph</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Critical Chain Highlight Strip if chain exists */}
      {criticalChain.chainLength > 1 && (
        <div className="mb-3 p-2.5 rounded bg-surface-base border border-border flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Network className="w-3.5 h-3.5 text-accent flex-shrink-0" />
            <span className="text-text-secondary font-medium">Critical Chain:</span>
            <div className="font-mono text-[11px] text-text-primary truncate">
              {criticalChain.orderedIssueKeys.join(' → ')}
            </div>
          </div>
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-accent/10 text-accent border border-accent/20 flex-shrink-0">
            Depth {criticalChain.chainLength}
          </span>
        </div>
      )}

      {/* Bottlenecks List */}
      <div className="space-y-2">
        {bottlenecks.slice(0, 5).map(item => (
          <div
            key={item.issue.id}
            className="p-2.5 rounded bg-surface-base hover:bg-surface-elevated/70 border border-border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => onOpenDrawer(item.issue.key)}
                  className="font-mono text-xs font-semibold text-accent hover:underline"
                >
                  {item.issue.key}
                </button>
                <span className="text-xs font-medium text-text-primary truncate" title={item.issue.title}>
                  {item.issue.title}
                </span>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-text-secondary mt-1 flex-wrap">
                <span className="font-semibold text-orange-400">
                  Blocks {item.directDownstreamCount} active {item.directDownstreamCount === 1 ? 'task' : 'tasks'}
                </span>
                <span>•</span>
                <span>Blast radius: {item.transitiveBlastRadius}</span>
                <span>•</span>
                <span>
                  Affects {item.affectedTeamCount} {item.affectedTeamCount === 1 ? 'team' : 'teams'} (
                  {item.affectedTeams.map(t => t.name).join(', ')})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
              <button
                onClick={() => onOpenDrawer(item.issue.key)}
                className="text-[11px] text-text-secondary hover:text-text-primary px-2 py-1 rounded bg-surface-card hover:bg-surface-elevated border border-border transition-colors"
              >
                Inspect
              </button>
              <Link
                to={`/dependencies?issue=${item.issue.key}`}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:text-accent-hover px-2 py-1 rounded bg-accent/10 hover:bg-accent/20 border border-accent/20 transition-colors"
              >
                <span>Graph</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
