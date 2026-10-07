/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  ShieldAlert,
  Clock,
  GitFork,
  CheckCircle2,
  AlertCircle,
  Activity,
  ArrowRight,
  User,
  Calendar,
} from 'lucide-react';
import { Project, Team, Issue } from '../../types';
import { ProjectOverviewData } from '../../features/projects/selectors';
import { useDrawerRoute } from '../../app/router/useDrawerRoute';
import { StatePill } from '../../components/ui/StatePill';
import { PriorityIcon } from '../../components/ui/PriorityIcon';
import { BlockerBadge } from '../../components/ui/BlockerBadge';
import { Avatar } from '../../components/ui/Avatar';
import { useProject } from '../../context/ProjectContext';

interface OutletContextType {
  project: Project;
  team?: Team;
  overviewData: ProjectOverviewData;
}

export const ProjectOverviewPage: React.FC = () => {
  const { project, team, overviewData } = useOutletContext<OutletContextType>();
  const { openDrawer } = useDrawerRoute();
  const { users, getIssueBlockerStatus } = useProject();

  const {
    needsAttention,
    activeExecution,
    blockingOthers,
    currentCycleIssues,
    recentActivity,
    activeCycle,
    summary,
  } = overviewData;

  const usersMap = React.useMemo(() => new Map(users.map(u => [u.id, u])), [users]);

  return (
    <div className="flex-1 overflow-y-auto bg-canvas p-4 sm:p-6 space-y-6 select-none">
      {/* 1. Operational Summary Strip (Concise, high-density, no vanity KPI cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-surface-base border border-border p-3 rounded-lg">
          <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-accent" />
            <span>Active Triage</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-text-primary font-mono">
              {summary.activeIssues}
            </span>
            <span className="text-[11px] text-text-muted">of {summary.totalIssues} total</span>
          </div>
        </div>

        <div className="bg-surface-base border border-border p-3 rounded-lg">
          <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-danger" />
            <span>Prerequisites Blocked</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-xl font-bold font-mono ${
                summary.blockedIssues > 0 ? 'text-danger' : 'text-text-primary'
              }`}
            >
              {summary.blockedIssues}
            </span>
            <span className="text-[11px] text-text-muted">
              {summary.blockedIssues > 0 ? 'require upstream unblocking' : 'no active blockers'}
            </span>
          </div>
        </div>

        <div className="bg-surface-base border border-border p-3 rounded-lg">
          <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <GitFork className="w-3.5 h-3.5 text-accent" />
            <span>Blocking Downstream</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-accent font-mono">
              {summary.blockingDownstream}
            </span>
            <span className="text-[11px] text-text-muted">tasks waiting on this project</span>
          </div>
        </div>

        <div className="bg-surface-base border border-border p-3 rounded-lg">
          <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            <span>Completed</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-success font-mono">
              {summary.completedIssues}
            </span>
            <span className="text-[11px] text-text-muted">
              {summary.totalIssues > 0
                ? `${Math.round((summary.completedIssues / summary.totalIssues) * 100)}% resolved`
                : 'none'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Needs Attention Section */}
      <section className="bg-surface-base border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 bg-surface-subtle border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-danger" />
            <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Needs Attention
            </h2>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-danger-subtle text-danger border border-danger/30">
              {needsAttention.length}
            </span>
            <span className="text-[11px] text-text-muted hidden sm:inline ml-1">
              Blocked issues, urgent priorities, and items due soon
            </span>
          </div>

          <Link
            to={`/projects/${project.key}/issues?blocker=BLOCKED_ONLY`}
            className="text-[11px] font-medium text-accent hover:underline flex items-center gap-1"
          >
            <span>View in issues list</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="divide-y divide-border">
          {needsAttention.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-text-muted italic">
              No blocked or urgent issues currently requiring immediate attention.
            </div>
          ) : (
            needsAttention.map(issue => {
              const blockerStatus = getIssueBlockerStatus(issue.id);
              const assignee = usersMap.get(issue.assigneeId || '');

              return (
                <div
                  key={issue.id}
                  onClick={() => openDrawer(issue.key)}
                  className="flex items-center justify-between h-[38px] px-4 hover:bg-surface-muted cursor-pointer transition-colors text-xs"
                >
                  <div className="flex items-center gap-2.5 truncate mr-3 flex-1 min-w-0">
                    <PriorityIcon priority={issue.priority} size="sm" />
                    <span className="font-mono font-bold text-accent hover:underline">
                      {issue.key}
                    </span>
                    <span className="truncate text-text-primary font-medium">{issue.title}</span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <BlockerBadge status={blockerStatus} onSelectIssue={id => openDrawer(id)} />
                    <StatePill state={issue.state} size="sm" />
                    {assignee && <Avatar user={assignee} size="xs" />}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* 3. Active Execution & Downstream Impact Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Active Execution */}
        <section className="bg-surface-base border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 bg-surface-subtle border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent" />
              <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Active Execution
              </h2>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-accent-subtle text-accent">
                {activeExecution.length}
              </span>
            </div>

            <Link
              to={`/projects/${project.key}/board`}
              className="text-[11px] font-medium text-accent hover:underline flex items-center gap-1"
            >
              <span>View board</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-border max-h-72 overflow-y-auto">
            {activeExecution.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-text-muted italic">
                No tasks currently in progress or review.
              </div>
            ) : (
              activeExecution.map(issue => (
                <div
                  key={issue.id}
                  onClick={() => openDrawer(issue.key)}
                  className="flex items-center justify-between h-[36px] px-4 hover:bg-surface-muted cursor-pointer transition-colors text-xs"
                >
                  <div className="flex items-center gap-2 truncate mr-3 flex-1 min-w-0">
                    <PriorityIcon priority={issue.priority} size="sm" />
                    <span className="font-mono font-bold text-accent">{issue.key}</span>
                    <span className="truncate text-text-primary">{issue.title}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <StatePill state={issue.state} size="sm" />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Blocking Others: Downstream Impact */}
        <section className="bg-surface-base border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 bg-surface-subtle border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitFork className="w-4 h-4 text-accent" />
              <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Blocking Downstream
              </h2>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-accent-subtle text-accent">
                {blockingOthers.length}
              </span>
            </div>

            <span className="text-[11px] text-text-muted">Prerequisites for peers</span>
          </div>

          <div className="divide-y divide-border max-h-72 overflow-y-auto">
            {blockingOthers.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-text-muted italic">
                No issues in this project are actively blocking teammate work.
              </div>
            ) : (
              blockingOthers.map(item => (
                <div
                  key={item.issue.id}
                  onClick={() => openDrawer(item.issue.key)}
                  className="p-3 hover:bg-surface-muted cursor-pointer transition-colors text-xs"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 font-mono font-bold text-accent">
                      <span>{item.issue.key}</span>
                      <span className="text-text-primary font-normal truncate">{item.issue.title}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-accent bg-accent-subtle px-1.5 py-0.2 rounded border border-accent/20 shrink-0">
                      Blocks {item.activeDownstreamIssues.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-text-muted truncate pl-2">
                    <span className="text-text-muted">Downstream:</span>
                    {item.activeDownstreamIssues.slice(0, 3).map(down => (
                      <span
                        key={down.id}
                        className="font-mono bg-surface-muted px-1 py-0.2 rounded border border-border text-text-secondary"
                      >
                        {down.key}
                      </span>
                    ))}
                    {item.activeDownstreamIssues.length > 3 && (
                      <span>+{item.activeDownstreamIssues.length - 3} more</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* 4. Current Cycle & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Current Cycle Execution */}
        <section className="bg-surface-base border border-border rounded-lg overflow-hidden lg:col-span-2">
          <div className="px-4 py-2.5 bg-surface-subtle border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent" />
              <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Current Cycle Execution
              </h2>
              {activeCycle && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-accent-subtle text-accent">
                  {activeCycle.name}
                </span>
              )}
            </div>

            <Link
              to={`/projects/${project.key}/planning`}
              className="text-[11px] font-medium text-accent hover:underline flex items-center gap-1"
            >
              <span>Planning view</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-border max-h-60 overflow-y-auto">
            {currentCycleIssues.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-text-muted italic">
                No issues allocated to the team&rsquo;s current active cycle.
              </div>
            ) : (
              currentCycleIssues.map(issue => (
                <div
                  key={issue.id}
                  onClick={() => openDrawer(issue.key)}
                  className="flex items-center justify-between h-[36px] px-4 hover:bg-surface-muted cursor-pointer transition-colors text-xs"
                >
                  <div className="flex items-center gap-2 truncate mr-3 flex-1 min-w-0">
                    <span className="font-mono font-bold text-accent">{issue.key}</span>
                    <span className="truncate text-text-primary">{issue.title}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <StatePill state={issue.state} size="sm" />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="bg-surface-base border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 bg-surface-subtle border-b border-border flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent" />
            <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Recent Activity
            </h2>
          </div>

          <div className="divide-y divide-border max-h-60 overflow-y-auto p-2 space-y-1.5 text-xs">
            {recentActivity.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-text-muted italic">
                No recent activity logged for this project.
              </div>
            ) : (
              recentActivity.map(event => {
                const actionLabel = event.details.reason
                  ? event.details.reason
                  : event.eventType.replace(/_/g, ' ').toLowerCase();
                return (
                  <div key={event.id} className="p-2 bg-surface-subtle rounded border border-border/60">
                    <div className="flex items-center justify-between text-[10px] text-text-muted mb-1">
                      <span className="font-semibold text-text-primary">{event.userName}</span>
                      <span>
                        {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-[11px] text-text-secondary leading-snug">
                      {actionLabel}
                      {event.details.from !== undefined && event.details.to !== undefined && (
                        <span className="ml-1 text-text-muted">
                          ({String(event.details.from)} → {String(event.details.to)})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
