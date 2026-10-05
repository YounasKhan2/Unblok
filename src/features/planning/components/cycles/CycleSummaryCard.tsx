/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { CycleSummaryData } from '../../types';
import { CycleProgressBadge } from './CycleProgressBadge';
import { Calendar, ShieldAlert, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';

interface CycleSummaryCardProps {
  summary: CycleSummaryData;
}

export const CycleSummaryCard: React.FC<CycleSummaryCardProps> = ({ summary }) => {
  const { cycle, team, progress } = summary;

  const statusColors = {
    ACTIVE: 'bg-accent/10 text-accent border-accent/30',
    UPCOMING: 'bg-surface-muted text-text-secondary border-border',
    COMPLETED: 'bg-success/10 text-success border-success/30',
  };

  return (
    <Link
      to={`/cycles/${cycle.id}`}
      className="group block bg-surface-base border border-border hover:border-accent/40 rounded-lg p-4 transition-all shadow-2xs hover:shadow-xs select-none"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold tracking-wider uppercase border ${
                statusColors[cycle.status]
              }`}
            >
              {cycle.status}
            </span>

            {team && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[11px] font-semibold bg-surface-muted text-text-secondary border border-border">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: team.color }}
                />
                <span>{team.name}</span>
                <span className="text-text-muted font-mono">({team.key})</span>
              </span>
            )}
          </div>

          <h3 className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors flex items-center gap-1.5">
            {cycle.name}
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-accent" />
          </h3>
        </div>

        <div className="text-right shrink-0">
          <div className="inline-flex items-center gap-1 text-xs text-text-muted">
            <Calendar className="w-3.5 h-3.5 text-text-muted" />
            <span>
              {cycle.startDate} → {cycle.endDate}
            </span>
          </div>
        </div>
      </div>

      {cycle.description && (
        <p className="text-xs text-text-secondary line-clamp-2 mb-3">
          {cycle.description}
        </p>
      )}

      {/* Progress & Blocker Indicator */}
      <div className="pt-2 border-t border-border/60">
        <CycleProgressBadge progress={progress} showDetails={true} />
      </div>
    </Link>
  );
};
