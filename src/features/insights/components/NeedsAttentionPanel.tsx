/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { InsightSignal } from '../types';
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';

interface NeedsAttentionPanelProps {
  signals: InsightSignal[];
  onOpenDrawer?: (issueKey: string) => void;
}

const DEFAULT_VISIBLE_COUNT = 6;

export const NeedsAttentionPanel: React.FC<NeedsAttentionPanelProps> = ({
  signals,
  onOpenDrawer,
}) => {
  const [showAll, setShowAll] = useState(false);

  const displayedSignals = showAll ? signals : signals.slice(0, DEFAULT_VISIBLE_COUNT);
  const remainingCount = signals.length - DEFAULT_VISIBLE_COUNT;

  if (signals.length === 0) {
    return (
      <div className="p-4 rounded-lg bg-surface-card border border-border">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-sm font-semibold text-text-primary tracking-tight">Needs Attention</h2>
        </div>
        <div className="flex items-center gap-3 p-4 rounded bg-emerald-500/5 border border-emerald-500/20 text-emerald-400">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <div className="text-xs">
            <span className="font-semibold block text-emerald-300">Clean Execution State</span>
            <span>No immediate bottlenecks or delivery risks detected in the active scope.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3.5 rounded-lg bg-surface-card border border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-rose-500" />
          <h2 className="text-sm font-semibold text-text-primary tracking-tight">Needs Attention</h2>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
            {signals.length} {signals.length === 1 ? 'signal' : 'signals'}
          </span>
        </div>
        <span className="text-[11px] text-text-muted">Ranked by execution impact</span>
      </div>

      <div className="space-y-2">
        {displayedSignals.map(sig => {
          const isCritical = sig.severity === 'CRITICAL';
          const isWarning = sig.severity === 'WARNING';

          const badgeClasses = isCritical
            ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
            : isWarning
            ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
            : 'bg-blue-500/15 text-blue-400 border-blue-500/30';

          const icon = isCritical ? (
            <AlertOctagon className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
          ) : isWarning ? (
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          ) : (
            <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          );

          return (
            <div
              key={sig.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 rounded bg-surface-base hover:bg-surface-elevated/80 border border-border transition-colors"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                {icon}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${badgeClasses}`}
                    >
                      {sig.severity}
                    </span>
                    <span className="text-xs font-semibold text-text-primary truncate">
                      {sig.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">
                    {sig.explanation}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5 self-end sm:self-center flex-shrink-0">
                {sig.drawerIssueKey && onOpenDrawer && (
                  <button
                    onClick={() => onOpenDrawer(sig.drawerIssueKey!)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:text-accent-hover px-2 py-1 rounded bg-accent/10 hover:bg-accent/20 border border-accent/20 transition-colors"
                    title={`Inspect ${sig.drawerIssueKey} in drawer`}
                  >
                    <span>Inspect</span>
                    <SlidersHorizontal className="w-3 h-3" />
                  </button>
                )}

                {sig.targetUrl && (
                  <Link
                    to={sig.targetUrl}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-text-secondary hover:text-text-primary px-2 py-1 rounded bg-surface-card hover:bg-surface-elevated border border-border transition-colors"
                    title="Navigate to execution context"
                  >
                    <span>Open</span>
                    <ExternalLink className="w-3 h-3 text-text-muted" />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Expand / Collapse toggle */}
      {remainingCount > 0 && (
        <div className="mt-2.5 pt-2 border-t border-border/60 flex justify-center">
          <button
            onClick={() => setShowAll(prev => !prev)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-hover py-1 px-3 rounded hover:bg-accent/10 transition-colors"
          >
            {showAll ? (
              <>
                <span>Show top {DEFAULT_VISIBLE_COUNT} signals</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>View all {signals.length} signals (+{remainingCount} more)</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
