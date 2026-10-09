/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { EnrichedRiskIssue } from '../types';
import { StatePill } from '../../../components/ui/StatePill';
import { PriorityIcon } from '../../../components/ui/PriorityIcon';
import {
  Flame,
  ShieldAlert,
  Clock,
  ArrowUpRight,
  SlidersHorizontal,
  CheckCircle,
} from 'lucide-react';

interface HighRiskWorkTableProps {
  issues: EnrichedRiskIssue[];
  onOpenDrawer: (issueKey: string) => void;
}

export const HighRiskWorkTable: React.FC<HighRiskWorkTableProps> = ({
  issues,
  onOpenDrawer,
}) => {
  if (issues.length === 0) {
    return (
      <div className="p-4 rounded-lg bg-surface-card border border-border">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="w-4 h-4 text-danger" />
          <h2 className="text-sm font-semibold text-text-primary tracking-tight">High-Risk Work</h2>
        </div>
        <div className="flex items-center gap-3 p-4 rounded bg-surface-base border border-border text-text-secondary text-xs">
          <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
          <span>No critical or high-risk active work identified in the current scope.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3.5 rounded-lg bg-surface-card border border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-danger" />
          <h2 className="text-sm font-semibold text-text-primary tracking-tight">High-Risk Work</h2>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-surface-base text-text-secondary border border-border">
            {issues.length} {issues.length === 1 ? 'issue' : 'issues'}
          </span>
        </div>
        <span className="text-[11px] text-text-muted">
          Sorted by risk score & urgency
        </span>
      </div>

      {/* Desktop / Tablet Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-border/70 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              <th className="py-2 px-2.5">Issue</th>
              <th className="py-2 px-2">State</th>
              <th className="py-2 px-2">Pri</th>
              <th className="py-2 px-2">Team / Project</th>
              <th className="py-2 px-2.5">Risk Level</th>
              <th className="py-2 px-2.5">Why</th>
              <th className="py-2 px-2">Due Date</th>
              <th className="py-2 px-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 font-normal">
            {issues.map(item => {
              const isCritical = item.risk.level === 'CRITICAL';
              const riskBadgeClasses = isCritical
                ? 'bg-danger/10 text-danger border-danger/30'
                : 'bg-warning/10 text-warning border-warning/30';

              return (
                <tr
                  key={item.issue.id}
                  onClick={() => onOpenDrawer(item.issue.key)}
                  className="hover:bg-surface-elevated/70 cursor-pointer transition-colors group"
                >
                  {/* Issue Key & Title */}
                  <td className="py-2 px-2.5 max-w-[240px]">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-mono text-xs font-semibold text-accent group-hover:underline">
                        {item.issue.key}
                      </span>
                      <span className="text-xs text-text-primary truncate" title={item.issue.title}>
                        {item.issue.title}
                      </span>
                    </div>
                  </td>

                  {/* State */}
                  <td className="py-2 px-2 whitespace-nowrap">
                    <StatePill state={item.issue.state} size="sm" />
                  </td>

                  {/* Priority */}
                  <td className="py-2 px-2 whitespace-nowrap">
                    <PriorityIcon priority={item.issue.priority} size="sm" />
                  </td>

                  {/* Team / Project */}
                  <td className="py-2 px-2 whitespace-nowrap text-[11px] text-text-secondary">
                    <div className="flex flex-col leading-tight">
                      <span className="font-medium text-text-primary">{item.team?.name || 'No Team'}</span>
                      <span className="text-[10px] text-text-muted">{item.project?.name || 'No Project'}</span>
                    </div>
                  </td>

                  {/* Risk Level Badge */}
                  <td className="py-2 px-2.5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${riskBadgeClasses}`}
                    >
                      <span>{item.risk.level}</span>
                      <span className="font-mono text-[9px] opacity-80">({item.risk.score})</span>
                    </span>
                  </td>

                  {/* Why / Reasons */}
                  <td className="py-2 px-2.5 max-w-[260px]">
                    <div className="flex flex-col gap-0.5">
                      {item.risk.reasons.slice(0, 2).map((r, rIdx) => (
                        <span key={rIdx} className="text-[11px] text-text-secondary truncate" title={r.description}>
                          • {r.description}
                        </span>
                      ))}
                      {item.risk.reasons.length > 2 && (
                        <span className="text-[10px] text-text-muted">
                          +{item.risk.reasons.length - 2} more reasons
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Due Date & Overdue */}
                  <td className="py-2 px-2 whitespace-nowrap text-[11px]">
                    {item.issue.dueDate ? (
                      <div className="flex items-center gap-1 font-mono">
                        <Clock className={`w-3 h-3 ${item.isOverdue ? 'text-danger' : 'text-text-muted'}`} />
                        <span className={item.isOverdue ? 'text-danger font-bold' : 'text-text-secondary'}>
                          {item.issue.dueDate}
                        </span>
                      </div>
                    ) : (
                      <span className="text-text-muted font-mono">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-2 px-2 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => onOpenDrawer(item.issue.key)}
                        className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-surface-elevated"
                        title="Open in Drawer"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                      </button>
                      <Link
                        to={`/issues/${item.issue.key}`}
                        className="p-1 rounded text-text-secondary hover:text-accent hover:bg-surface-elevated"
                        title="Open Full Issue Page"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Card View */}
      <div className="md:hidden space-y-2.5">
        {issues.map(item => {
          const isCritical = item.risk.level === 'CRITICAL';
          const riskBadgeClasses = isCritical
            ? 'bg-danger/10 text-danger border-danger/30'
            : 'bg-warning/10 text-warning border-warning/30';

          return (
            <div
              key={item.issue.id}
              onClick={() => onOpenDrawer(item.issue.key)}
              className="p-2.5 rounded bg-surface-base border border-border flex flex-col gap-2 cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-semibold text-accent">
                  {item.issue.key}
                </span>
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${riskBadgeClasses}`}
                >
                  {item.risk.level} ({item.risk.score})
                </span>
              </div>

              <div className="text-xs font-medium text-text-primary line-clamp-2">
                {item.issue.title}
              </div>

              <div className="flex items-center gap-2 flex-wrap text-xs pt-1 border-t border-border/50">
                <StatePill state={item.issue.state} size="sm" />
                <PriorityIcon priority={item.issue.priority} size="sm" />
                {item.issue.dueDate && (
                  <span className={`text-[11px] font-mono ${item.isOverdue ? 'text-danger font-bold' : 'text-text-muted'}`}>
                    Due {item.issue.dueDate}
                  </span>
                )}
              </div>

              {item.risk.reasons.length > 0 && (
                <div className="text-[11px] text-text-secondary bg-surface-card p-1.5 rounded border border-border/50">
                  {item.risk.reasons[0].description}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
