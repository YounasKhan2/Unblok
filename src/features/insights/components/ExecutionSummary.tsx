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
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 p-3 rounded-lg bg-surface-card border border-border"
    >
      {/* 1. Active Issues */}
      <div className="flex flex-col gap-1 p-2 rounded bg-surface-base/60 border border-border/50">
        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
          <Layers className="w-3.5 h-3.5 text-accent" />
          <span className="font-medium truncate">Active Work</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold font-mono text-text-primary tracking-tight">
            {summary.activeIssuesCount}
          </span>
          <span className="text-[10px] text-text-muted">issues</span>
        </div>
      </div>

      {/* 2. Blocked Issues */}
      <div className="flex flex-col gap-1 p-2 rounded bg-surface-base/60 border border-border/50">
        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-medium truncate">Blocked Issues</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span
            className={`text-xl font-bold font-mono tracking-tight ${
              summary.blockedIssuesCount > 0 ? 'text-amber-500' : 'text-text-primary'
            }`}
          >
            {summary.blockedIssuesCount}
          </span>
          <span className="text-[10px] text-text-muted">active</span>
        </div>
      </div>

      {/* 3. High Risk Work */}
      <div className="flex flex-col gap-1 p-2 rounded bg-surface-base/60 border border-border/50">
        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
          <Flame className="w-3.5 h-3.5 text-rose-500" />
          <span className="font-medium truncate">High/Critical Risk</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span
            className={`text-xl font-bold font-mono tracking-tight ${
              summary.highRiskIssuesCount > 0 ? 'text-rose-500' : 'text-text-primary'
            }`}
          >
            {summary.highRiskIssuesCount}
          </span>
          <span className="text-[10px] text-text-muted">issues</span>
        </div>
      </div>

      {/* 4. Active Blockers */}
      <div className="flex flex-col gap-1 p-2 rounded bg-surface-base/60 border border-border/50">
        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
          <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
          <span className="font-medium truncate">Active Blockers</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span
            className={`text-xl font-bold font-mono tracking-tight ${
              summary.activeBlockersCount > 0 ? 'text-orange-500' : 'text-text-primary'
            }`}
          >
            {summary.activeBlockersCount}
          </span>
          <span className="text-[10px] text-text-muted">blocking others</span>
        </div>
      </div>

      {/* 5. At-Risk Milestones */}
      <div className="flex flex-col gap-1 p-2 rounded bg-surface-base/60 border border-border/50">
        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
          <MilestoneIcon className="w-3.5 h-3.5 text-purple-400" />
          <span className="font-medium truncate">At-Risk Milestones</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span
            className={`text-xl font-bold font-mono tracking-tight ${
              summary.atRiskMilestonesCount > 0 ? 'text-purple-400' : 'text-text-primary'
            }`}
          >
            {summary.atRiskMilestonesCount}
          </span>
          <span className="text-[10px] text-text-muted">milestones</span>
        </div>
      </div>

      {/* 6. Overdue Work */}
      <div className="flex flex-col gap-1 p-2 rounded bg-surface-base/60 border border-border/50">
        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
          <Clock className="w-3.5 h-3.5 text-red-400" />
          <span className="font-medium truncate">Overdue Work</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span
            className={`text-xl font-bold font-mono tracking-tight ${
              summary.overdueIssuesCount > 0 ? 'text-red-400' : 'text-text-primary'
            }`}
          >
            {summary.overdueIssuesCount}
          </span>
          <span className="text-[10px] text-text-muted">past due</span>
        </div>
      </div>
    </div>
  );
};
