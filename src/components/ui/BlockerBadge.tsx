import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, ArrowDownRight, ExternalLink } from 'lucide-react';
import { BlockerStatusInfo, Issue } from '../../types';

export interface BlockerBadgeProps {
  status: BlockerStatusInfo;
  onSelectIssue?: (issueId: string) => void;
  compact?: boolean;
}

export const BlockerBadge: React.FC<BlockerBadgeProps> = ({
  status,
  onSelectIssue,
  compact = false,
}) => {
  const [showPopover, setShowPopover] = useState(false);

  // If there are no blockers and no downstream dependencies, render nothing to keep scanning clean
  if (status.activeCount === 0 && status.resolvedCount === 0 && status.downstreamIssues.length === 0) {
    return null;
  }

  return (
    <div className="relative inline-flex items-center gap-1.5" onMouseLeave={() => setShowPopover(false)}>
      {/* 1. Active Blocker Badge (Visually prominent as per PRD AC-06 & Section 32) */}
      {status.activeCount > 0 && (
        <button
          onClick={e => {
            e.stopPropagation();
            setShowPopover(!showPopover);
          }}
          onMouseEnter={() => setShowPopover(true)}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] text-[11px] font-semibold bg-warning-subtle text-warning border border-warning/30 hover:bg-warning-subtle/80 transition-colors cursor-pointer"
          title={`Blocked by ${status.activeCount} active task(s)`}
        >
          <ShieldAlert className="w-3 h-3 text-warning" />
          <span>BLOCKED {status.activeCount}</span>
        </button>
      )}

      {/* 2. Resolved Inactive Blocker Badge */}
      {status.activeCount === 0 && status.resolvedCount > 0 && (
        <button
          onClick={e => {
            e.stopPropagation();
            setShowPopover(!showPopover);
          }}
          onMouseEnter={() => setShowPopover(true)}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] text-[11px] font-medium bg-success-subtle text-success border border-success/30 hover:bg-success-subtle/80 transition-colors cursor-pointer"
          title={`${status.resolvedCount} prerequisite(s) completed`}
        >
          <CheckCircle2 className="w-3 h-3 text-success" />
          {!compact && <span>RESOLVED {status.resolvedCount}</span>}
        </button>
      )}

      {/* 3. Downstream Blocked Indicator ("Blocks X") */}
      {status.downstreamIssues.length > 0 && (
        <span
          className="inline-flex items-center gap-0.5 text-[11px] text-text-muted px-1 py-0.5 rounded hover:bg-surface-muted cursor-help"
          title={`Prerequisite for: ${status.downstreamIssues.map(d => d.key).join(', ')}`}
        >
          <ArrowDownRight className="w-3 h-3 text-accent" />
          <span>Blocks {status.downstreamIssues.length}</span>
        </span>
      )}

      {/* Popover explaining blockers on hover/click */}
      {showPopover && (
        <div
          className="absolute z-50 bottom-full left-0 mb-1.5 w-64 bg-surface-base rounded-lg shadow-xl border border-border p-2.5 text-xs text-text-primary animate-in fade-in zoom-in-95 duration-100"
          onClick={e => e.stopPropagation()}
        >
          {status.activeCount > 0 && (
            <div className="mb-2">
              <div className="flex items-center gap-1.5 font-semibold text-warning pb-1 border-b border-border">
                <ShieldAlert className="w-3.5 h-3.5 text-warning" />
                <span>Active Blockers ({status.activeCount})</span>
              </div>
              <p className="text-[10px] text-text-muted my-1">
                Must be resolved before this issue can transition to DONE.
              </p>
              <div className="space-y-1 mt-1.5 max-h-36 overflow-y-auto">
                {status.activeBlockers.map((issue: Issue) => (
                  <div
                    key={issue.id}
                    onClick={() => {
                      onSelectIssue?.(issue.id);
                      setShowPopover(false);
                    }}
                    className="flex items-center justify-between p-1 rounded hover:bg-surface-subtle cursor-pointer group"
                  >
                    <div className="truncate mr-1">
                      <span className="font-mono font-semibold text-accent group-hover:underline">
                        {issue.key}
                      </span>
                      <span className="text-text-primary ml-1.5">{issue.title}</span>
                    </div>
                    <span className="text-[10px] shrink-0 font-medium px-1.5 py-0.2 rounded bg-surface-muted text-text-secondary border border-border">
                      {issue.state}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {status.resolvedCount > 0 && (
            <div className="mt-1">
              <div className="flex items-center gap-1.5 font-semibold text-success pb-1 border-b border-border">
                <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                <span>Resolved Prerequisite Tasks ({status.resolvedCount})</span>
              </div>
              <p className="text-[10px] text-text-muted my-1">
                Persisted dependencies. Reopening will reactivate the blocker.
              </p>
              <div className="space-y-1 mt-1 max-h-24 overflow-y-auto">
                {status.resolvedBlockers.map((issue: Issue) => (
                  <div
                    key={issue.id}
                    onClick={() => {
                      onSelectIssue?.(issue.id);
                      setShowPopover(false);
                    }}
                    className="flex items-center justify-between p-1 rounded hover:bg-surface-subtle cursor-pointer group"
                  >
                    <span className="font-mono text-accent group-hover:underline">
                      {issue.key}
                    </span>
                    <span className="text-[10px] text-success font-medium">{issue.state}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {status.downstreamIssues.length > 0 && (
            <div className="mt-2 pt-1.5 border-t border-border">
              <span className="text-[11px] font-medium text-text-muted">
                Downstream blocked issues:
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {status.downstreamIssues.map(d => (
                  <span
                    key={d.id}
                    onClick={() => {
                      onSelectIssue?.(d.id);
                      setShowPopover(false);
                    }}
                    className="font-mono text-[10px] px-1 py-0.5 rounded bg-accent-subtle text-accent hover:opacity-85 cursor-pointer border border-accent/20"
                  >
                    {d.key}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
