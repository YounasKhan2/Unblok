/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MilestoneSummaryData } from '../../types';
import { MilestoneHealthBadge } from './MilestoneHealthBadge';
import { StatePill } from '../../../../components/ui/StatePill';
import { PriorityIcon } from '../../../../components/ui/PriorityIcon';
import { BlockerBadge } from '../../../../components/ui/BlockerBadge';
import { useProject } from '../../../../context/ProjectContext';
import { useDrawerRoute } from '../../../../app/router/useDrawerRoute';
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  Target,
  CheckCircle2,
  Users,
  FolderKanban,
  ArrowRight,
} from 'lucide-react';

interface MilestoneRiskPanelProps {
  summary: MilestoneSummaryData;
}

export const MilestoneRiskPanel: React.FC<MilestoneRiskPanelProps> = ({ summary }) => {
  const { milestone, health, isCompleted, progress, blockedIssues, contributingTeams, contributingProjects } =
    summary;

  const { getIssueBlockerStatus } = useProject();
  const { openDrawer } = useDrawerRoute();

  return (
    <div className="space-y-6">
      {/* 1. Health Status Card */}
      <div className="bg-surface-base border border-border rounded-lg p-5">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <MilestoneHealthBadge health={health} isCompleted={isCompleted} size="md" />
            <span className="text-xs font-semibold text-text-secondary">
              Strategic Health Assessment
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {progress.isOverdue
                ? `Overdue by ${Math.abs(progress.daysRemaining)} days`
                : `${progress.daysRemaining} days until target`}
            </span>
          </div>
        </div>

        <div className="p-3 bg-surface-muted rounded-md border border-border text-xs text-text-primary leading-relaxed">
          {health === 'BLOCKED' && (
            <p className="flex items-center gap-2 text-danger font-medium">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>
                {blockedIssues.length} unfinished milestone {blockedIssues.length === 1 ? 'task is' : 'tasks are'} actively blocked by upstream prerequisite tasks. Delivery cannot proceed until dependencies are unblocked.
              </span>
            </p>
          )}

          {health === 'AT_RISK' && (
            <p className="flex items-center gap-2 text-warning font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                Delivery is at risk: milestone is {progress.isOverdue ? 'past target release date' : 'approaching target release date'} with {progress.remaining} unfinished tasks remaining ({progress.percent}% complete).
              </span>
            </p>
          )}

          {health === 'ON_TRACK' && (
            <p className="flex items-center gap-2 text-success font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                {isCompleted
                  ? 'All tasks linked to this milestone have been completed.'
                  : 'Milestone execution is progressing on track with zero active blocker bottlenecks.'}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* 2. Critical Dependency Blockers List */}
      {blockedIssues.length > 0 && (
        <div className="bg-surface-base border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-danger" />
              <span>Actively Blocked Milestone Tasks ({blockedIssues.length})</span>
            </h3>
            <span className="text-[11px] text-text-muted">
              Click a task to inspect blockers in drawer
            </span>
          </div>

          <div className="divide-y divide-border border border-border rounded-md overflow-hidden">
            {blockedIssues.map(issue => {
              const blocker = getIssueBlockerStatus(issue.id);

              return (
                <div
                  key={issue.id}
                  onClick={() => openDrawer(issue.key)}
                  className="p-3 hover:bg-surface-muted transition-colors flex items-center justify-between gap-3 text-xs cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <PriorityIcon priority={issue.priority} size="sm" />
                    <span className="font-mono text-accent font-semibold group-hover:underline">
                      {issue.key}
                    </span>
                    <span className="truncate font-medium text-text-primary">
                      {issue.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <BlockerBadge status={blocker} onSelectIssue={openDrawer} />
                    <StatePill state={issue.state} size="sm" />
                    <ArrowRight className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Scope & Contributing Entities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Teams */}
        <div className="bg-surface-base border border-border rounded-lg p-4">
          <h4 className="text-xs font-bold text-text-primary mb-2 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-text-muted" />
            <span>Contributing Teams ({contributingTeams.length})</span>
          </h4>
          <div className="space-y-1.5">
            {contributingTeams.map(team => (
              <div
                key={team.id}
                className="flex items-center justify-between text-xs p-1.5 rounded hover:bg-surface-muted"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: team.color }}
                  />
                  <span className="font-medium text-text-primary">{team.name}</span>
                </div>
                <span className="font-mono text-[11px] text-text-muted">{team.key}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Projects */}
        <div className="bg-surface-base border border-border rounded-lg p-4">
          <h4 className="text-xs font-bold text-text-primary mb-2 flex items-center gap-1.5">
            <FolderKanban className="w-3.5 h-3.5 text-text-muted" />
            <span>Contributing Projects ({contributingProjects.length})</span>
          </h4>
          <div className="space-y-1.5">
            {contributingProjects.map(project => (
              <div
                key={project.id}
                className="flex items-center justify-between text-xs p-1.5 rounded hover:bg-surface-muted"
              >
                <span className="font-medium text-text-primary">{project.name}</span>
                <span className="font-mono text-[11px] text-text-muted">{project.key}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
