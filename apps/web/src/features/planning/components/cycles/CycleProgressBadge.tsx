/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CycleProgress } from '../../types';
import { ShieldAlert, CheckCircle2, Clock } from 'lucide-react';

interface CycleProgressBadgeProps {
  progress: CycleProgress;
  showDetails?: boolean;
}

export const CycleProgressBadge: React.FC<CycleProgressBadgeProps> = ({
  progress,
  showDetails = false,
}) => {
  return (
    <div className="flex flex-col gap-1.5 min-w-[120px]">
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-semibold text-text-primary">{progress.percent}%</span>
        <span className="text-text-muted">
          {progress.completed}/{progress.total} done
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-surface-muted rounded-full overflow-hidden flex border border-border">
        {progress.completed > 0 && (
          <div
            className="bg-success h-full transition-all duration-300"
            style={{ width: `${(progress.completed / Math.max(1, progress.total)) * 100}%` }}
            title={`${progress.completed} completed`}
          />
        )}
        {progress.inProgress > 0 && (
          <div
            className="bg-accent h-full transition-all duration-300"
            style={{ width: `${(progress.inProgress / Math.max(1, progress.total)) * 100}%` }}
            title={`${progress.inProgress} in progress`}
          />
        )}
        {progress.blocked > 0 && (
          <div
            className="bg-blocker h-full transition-all duration-300"
            style={{ width: `${(progress.blocked / Math.max(1, progress.total)) * 100}%` }}
            title={`${progress.blocked} blocked`}
          />
        )}
      </div>

      {showDetails && (
        <div className="flex items-center gap-3 text-[10px] text-text-muted pt-0.5">
          <span className="inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            {progress.completed} done
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            {progress.inProgress} in prog
          </span>
          {progress.blocked > 0 && (
            <span className="inline-flex items-center gap-1 text-blocker font-medium">
              <ShieldAlert className="w-2.5 h-2.5" />
              {progress.blocked} blocked
            </span>
          )}
          <span className="inline-flex items-center gap-1 ml-auto">
            <Clock className="w-2.5 h-2.5" />
            {progress.daysRemaining}d left
          </span>
        </div>
      )}
    </div>
  );
};
