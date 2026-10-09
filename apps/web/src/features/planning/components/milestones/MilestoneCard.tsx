/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { MilestoneSummaryData } from '../../types';
import { MilestoneHealthBadge } from './MilestoneHealthBadge';
import { Calendar, ShieldAlert, ArrowRight, Target, Users, FolderKanban } from 'lucide-react';

interface MilestoneCardProps {
  summary: MilestoneSummaryData;
}

export const MilestoneCard: React.FC<MilestoneCardProps> = ({ summary }) => {
  const { milestone, health, isCompleted, progress, contributingTeams, contributingProjects } =
    summary;

  return (
    <Link
      to={`/milestones/${milestone.id}`}
      className="group block bg-surface-base border border-border hover:border-accent/40 rounded-lg p-5 transition-all shadow-2xs hover:shadow-xs select-none"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <MilestoneHealthBadge
              health={health}
              isCompleted={isCompleted}
              size="sm"
            />

            <div className="inline-flex items-center gap-1 text-xs text-text-muted">
              <Calendar className="w-3.5 h-3.5 text-text-muted" />
              <span>Target: {milestone.targetDate}</span>
            </div>
          </div>

          <h3 className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors flex items-center gap-1.5 truncate">
            {milestone.name}
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-accent shrink-0" />
          </h3>
        </div>

        <div className="text-right shrink-0">
          <span className="text-lg font-bold text-text-primary font-mono">{progress.percent}%</span>
          <div className="text-[11px] text-text-muted">{progress.completed}/{progress.total} tasks</div>
        </div>
      </div>

      {milestone.description && (
        <p className="text-xs text-text-secondary line-clamp-2 mb-3">
          {milestone.description}
        </p>
      )}

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-surface-muted rounded-full overflow-hidden flex border border-border mb-3">
        <div
          className="bg-success h-full transition-all duration-300"
          style={{ width: `${progress.percent}%` }}
        />
        {progress.blocked > 0 && (
          <div
            className="bg-danger h-full transition-all duration-300"
            style={{ width: `${(progress.blocked / Math.max(1, progress.total)) * 100}%` }}
            title={`${progress.blocked} blocked tasks`}
          />
        )}
      </div>

      {/* Footer Meta: Contributing Teams & Projects, Blockers */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/60 text-xs text-text-muted">
        <div className="flex items-center gap-3">
          {/* Contributing Teams */}
          {contributingTeams.length > 0 && (
            <div className="flex items-center gap-1.5" title={`Teams: ${contributingTeams.map(t => t.name).join(', ')}`}>
              <Users className="w-3.5 h-3.5 text-text-muted" />
              <div className="flex items-center -space-x-1">
                {contributingTeams.map(t => (
                  <span
                    key={t.id}
                    className="w-3.5 h-3.5 rounded-full border border-surface-base"
                    style={{ backgroundColor: t.color }}
                    title={t.name}
                  />
                ))}
              </div>
              <span className="text-[11px] text-text-secondary font-medium">
                {contributingTeams.length} {contributingTeams.length === 1 ? 'team' : 'teams'}
              </span>
            </div>
          )}

          {/* Contributing Projects */}
          {contributingProjects.length > 0 && (
            <div className="flex items-center gap-1" title={`Projects: ${contributingProjects.map(p => p.name).join(', ')}`}>
              <FolderKanban className="w-3.5 h-3.5 text-text-muted" />
              <span className="text-[11px] text-text-secondary font-medium">
                {contributingProjects.length} {contributingProjects.length === 1 ? 'project' : 'projects'}
              </span>
            </div>
          )}
        </div>

        {progress.blocked > 0 ? (
          <div className="inline-flex items-center gap-1 text-danger font-semibold text-[11px]">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{progress.blocked} blocked</span>
          </div>
        ) : (
          <div className="text-[11px] text-text-muted">
            {progress.daysRemaining} days left
          </div>
        )}
      </div>
    </Link>
  );
};
