/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  CheckCircle2,
  ArrowDown,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Issue } from '../../../types';
import { StatePill } from '../../../components/ui/StatePill';
import { PriorityIcon } from '../../../components/ui/PriorityIcon';
import { ResolvedDependencyItem } from '../selectors';

interface IssueDependencyMiniGraphProps {
  currentIssue: Issue;
  upstreamDependencies: ResolvedDependencyItem[];
  downstreamDependencies: ResolvedDependencyItem[];
}

export const IssueDependencyMiniGraph: React.FC<IssueDependencyMiniGraphProps> = ({
  currentIssue,
  upstreamDependencies,
  downstreamDependencies,
}) => {
  const activeBlockers = upstreamDependencies.filter(u => u.isActivelyBlocking);
  const resolvedBlockers = upstreamDependencies.filter(u => !u.isActivelyBlocking);

  const hasDependencies =
    upstreamDependencies.length > 0 || downstreamDependencies.length > 0;

  // Non-visual textual summary for screen readers
  const screenReaderSummary = `Dependency graph for ${currentIssue.key}: ` +
    (upstreamDependencies.length === 0
      ? 'No upstream blockers. '
      : `Blocked by ${activeBlockers.length} active issue(s) and ${resolvedBlockers.length} resolved issue(s). `) +
    (downstreamDependencies.length === 0
      ? 'Does not block any downstream work.'
      : `Blocks ${downstreamDependencies.length} downstream issue(s).`);

  if (!hasDependencies) {
    return null;
  }

  return (
    <div className="p-3.5 bg-[#fafaf9] rounded-lg border border-[#e5e3df] space-y-3">
      {/* Screen Reader summary */}
      <div className="sr-only" aria-live="polite">
        {screenReaderSummary}
      </div>

      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#787671]">
        <span className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-[#5645d4]" />
          <span>Dependency Graph Flow</span>
        </span>
        <span className="text-[10px] text-[#787671] normal-case">
          Interactive mini-DAG
        </span>
      </div>

      <div className="flex flex-col items-center space-y-2 pt-1">
        {/* 1. Top Tier: Upstream Blockers */}
        {upstreamDependencies.length > 0 && (
          <div className="w-full flex flex-col items-center space-y-1.5">
            <div className="text-[10px] font-semibold text-[#787671] uppercase tracking-wider">
              Upstream Prerequisites ({upstreamDependencies.length})
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 max-w-full">
              {upstreamDependencies.map(dep => {
                const isActive = dep.isActivelyBlocking;
                return (
                  <Link
                    key={dep.dependencyId}
                    to={`/issues/${dep.issue.key}`}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs shadow-2xs transition-all hover:scale-[1.02] ${
                      isActive
                        ? 'bg-[#ffe8d4]/70 border-[#ffd3ad] hover:border-[#dd5b00]'
                        : 'bg-white border-[#e5e3df] hover:border-[#5645d4] opacity-80'
                    }`}
                    title={`${dep.issue.key}: ${dep.issue.title} (${isActive ? 'Active Blocker' : 'Resolved'})`}
                  >
                    {isActive ? (
                      <ShieldAlert className="w-3.5 h-3.5 text-[#dd5b00] shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#1aae39] shrink-0" />
                    )}

                    <span className="font-mono font-bold text-[#5645d4]">
                      {dep.issue.key}
                    </span>

                    {dep.team && (
                      <span
                        className="text-[9px] font-medium px-1 rounded text-white"
                        style={{ backgroundColor: dep.team.color }}
                      >
                        {dep.team.key}
                      </span>
                    )}

                    <StatePill state={dep.issue.state} size="sm" showLabel={false} />
                  </Link>
                );
              })}
            </div>

            <ArrowDown className="w-4 h-4 text-[#5645d4] my-0.5 animate-bounce" />
          </div>
        )}

        {/* 2. Middle Tier: Current Issue */}
        <div className="w-full max-w-md p-2.5 rounded-lg bg-white border-2 border-[#5645d4] shadow-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <PriorityIcon priority={currentIssue.priority} size="sm" />
            <span className="font-mono font-bold text-sm text-[#5645d4]">
              {currentIssue.key}
            </span>
            <span className="truncate text-xs font-medium text-[#1a1a1a]">
              {currentIssue.title}
            </span>
          </div>

          <div className="shrink-0">
            <StatePill state={currentIssue.state} size="sm" />
          </div>
        </div>

        {/* 3. Bottom Tier: Downstream Issues */}
        {downstreamDependencies.length > 0 && (
          <div className="w-full flex flex-col items-center space-y-1.5 pt-0.5">
            <ArrowDown className="w-4 h-4 text-[#5645d4] my-0.5" />

            <div className="text-[10px] font-semibold text-[#787671] uppercase tracking-wider">
              Downstream Dependent Work ({downstreamDependencies.length})
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 max-w-full">
              {downstreamDependencies.map(dep => (
                <Link
                  key={dep.dependencyId}
                  to={`/issues/${dep.issue.key}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#e5e3df] bg-white hover:border-[#5645d4] text-xs shadow-2xs transition-all hover:scale-[1.02]"
                  title={`${dep.issue.key}: ${dep.issue.title}`}
                >
                  <ArrowRight className="w-3.5 h-3.5 text-[#5645d4] shrink-0" />
                  <span className="font-mono font-bold text-[#5645d4]">
                    {dep.issue.key}
                  </span>
                  {dep.team && (
                    <span
                      className="text-[9px] font-medium px-1 rounded text-white"
                      style={{ backgroundColor: dep.team.color }}
                    >
                      {dep.team.key}
                    </span>
                  )}
                  <StatePill state={dep.issue.state} size="sm" showLabel={false} />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
