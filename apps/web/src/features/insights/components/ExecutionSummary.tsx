/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ExecutionSummaryMetrics } from '../types';
import {
  AlertTriangle,
  Flame,
  Milestone as MilestoneIcon,
  Clock,
  Layers,
  ShieldAlert,
} from 'lucide-react';

interface ExecutionSummaryProps {
  summary: ExecutionSummaryMetrics;
}

export const ExecutionSummary: React.FC<ExecutionSummaryProps> = ({ summary }) => {
  return (
    <div
      role="region"
      aria-label="Execution Summary Metrics"
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 p-2 rounded-lg bg-surface-base border border-border"
    >
      {/* 1. Active Issues */}
      <div className="flex items-center gap-2 p-2 rounded bg-surface-subtle border border-border/40">
        <Layers className="w-4 h-4 text-accent shrink-0" />
        <div className="min-w-0">
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold font-mono text-text-primary tracking-tight">
              {summary.activeIssuesCount}
            </span>
            <span className="text-[11px] font-semibold text-text-secondary truncate">Active</span>
          </div>
        </div>
      </div>

      {/* 2. Blocked Issues */}
      <div className="flex items-center gap-2 p-2 rounded bg-surface-subtle border border-border/40">
        <ShieldAlert className="w-4 h-4 text-warning shrink-0" />
        <div className="min-w-0">
          <div className="flex items-baseline gap-1">
            <span
              className={`text-sm font-bold font-mono tracking-tight ${
                summary.blockedIssuesCount > 0 ? 'text-warning' : 'text-text-primary'
              }`}
            >
              {summary.blockedIssuesCount}
            </span>
            <span className="text-[11px] font-semibold text-text-secondary truncate">Blocked</span>
          </div>
        </div>
      </div>

      {/* 3. High Risk Work */}
      <div className="flex items-center gap-2 p-2 rounded bg-surface-subtle border border-border/40">
        <Flame className="w-4 h-4 text-danger shrink-0" />
        <div className="min-w-0">
          <div className="flex items-baseline gap-1">
            <span
              className={`text-sm font-bold font-mono tracking-tight ${
                summary.highRiskIssuesCount > 0 ? 'text-danger' : 'text-text-primary'
              }`}
            >
              {summary.highRiskIssuesCount}
            </span>
            <span className="text-[11px] font-semibold text-text-secondary truncate">High Risk</span>
          </div>
        </div>
      </div>

      {/* 4. Active Blockers */}
      <div className="flex items-center gap-2 p-2 rounded bg-surface-subtle border border-border/40">
        <AlertTriangle className="w-4 h-4 text-blocker shrink-0" />
        <div className="min-w-0">
          <div className="flex items-baseline gap-1">
            <span
              className={`text-sm font-bold font-mono tracking-tight ${
                summary.activeBlockersCount > 0 ? 'text-blocker' : 'text-text-primary'
              }`}
            >
              {summary.activeBlockersCount}
            </span>
            <span className="text-[11px] font-semibold text-text-secondary truncate">Bottlenecks</span>
          </div>
        </div>
      </div>

      {/* 5. At-Risk Milestones */}
      <div className="flex items-center gap-2 p-2 rounded bg-surface-subtle border border-border/40">
        <MilestoneIcon className="w-4 h-4 text-accent shrink-0" />
        <div className="min-w-0">
          <div className="flex items-baseline gap-1">
            <span
              className={`text-sm font-bold font-mono tracking-tight ${
                summary.atRiskMilestonesCount > 0 ? 'text-accent' : 'text-text-primary'
              }`}
            >
              {summary.atRiskMilestonesCount}
            </span>
            <span className="text-[11px] font-semibold text-text-secondary truncate">At-Risk MS</span>
          </div>
        </div>
      </div>

      {/* 6. Overdue Work */}
      <div className="flex items-center gap-2 p-2 rounded bg-surface-subtle border border-border/40">
        <Clock className="w-4 h-4 text-danger shrink-0" />
        <div className="min-w-0">
          <div className="flex items-baseline gap-1">
            <span
              className={`text-sm font-bold font-mono tracking-tight ${
                summary.overdueIssuesCount > 0 ? 'text-danger' : 'text-text-primary'
              }`}
            >
              {summary.overdueIssuesCount}
            </span>
            <span className="text-[11px] font-semibold text-text-secondary truncate">Overdue</span>
          </div>
        </div>
      </div>
    </div>
  );
};
