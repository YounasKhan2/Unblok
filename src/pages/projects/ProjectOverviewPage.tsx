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
    <div className="flex-1 overflow-y-auto bg-[#fafaf9] p-4 sm:p-6 space-y-6 select-none">
      {/* 1. Operational Summary Strip (Concise, high-density, no vanity KPI cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white border border-[#e5e3df] p-3 rounded-lg">
          <div className="text-[11px] font-semibold text-[#787671] uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#5645d4]" />
            <span>Active Triage</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-[#1a1a1a] font-mono">
              {summary.activeIssues}
            </span>
            <span className="text-[11px] text-[#787671]">of {summary.totalIssues} total</span>
          </div>
        </div>

        <div className="bg-white border border-[#e5e3df] p-3 rounded-lg">
          <div className="text-[11px] font-semibold text-[#787671] uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-[#dd5b00]" />
            <span>Prerequisites Blocked</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-xl font-bold font-mono ${
                summary.blockedIssues > 0 ? 'text-[#dd5b00]' : 'text-[#1a1a1a]'
              }`}
            >
              {summary.blockedIssues}
            </span>
            <span className="text-[11px] text-[#787671]">
              {summary.blockedIssues > 0 ? 'require upstream unblocking' : 'no active blockers'}
            </span>
          </div>
        </div>

        <div className="bg-white border border-[#e5e3df] p-3 rounded-lg">
          <div className="text-[11px] font-semibold text-[#787671] uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <GitFork className="w-3.5 h-3.5 text-[#5645d4]" />
            <span>Blocking Downstream</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-[#5645d4] font-mono">
              {summary.blockingDownstream}
            </span>
            <span className="text-[11px] text-[#787671]">tasks waiting on this project</span>
          </div>
        </div>

        <div className="bg-white border border-[#e5e3df] p-3 rounded-lg">
          <div className="text-[11px] font-semibold text-[#787671] uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#0f7b6c]" />
            <span>Completed</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-[#0f7b6c] font-mono">
              {summary.completedIssues}
            </span>
            <span className="text-[11px] text-[#787671]">
              {summary.totalIssues > 0
                ? `${Math.round((summary.completedIssues / summary.totalIssues) * 100)}% resolved`
                : 'none'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Needs Attention Section */}
      <section className="bg-white border border-[#e5e3df] rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 bg-[#fafaf9] border-b border-[#e5e3df] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#dd5b00]" />
            <h2 className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider">
              Needs Attention
            </h2>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#fff5ee] text-[#dd5b00] border border-[#ffd8be]">
              {needsAttention.length}
            </span>
            <span className="text-[11px] text-[#787671] hidden sm:inline ml-1">
              Blocked issues, urgent priorities, and items due soon
            </span>
          </div>

          <Link
            to={`/projects/${project.key}/issues?blocker=BLOCKED_ONLY`}
            className="text-[11px] font-medium text-[#5645d4] hover:underline flex items-center gap-1"
          >
            <span>View in issues list</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="divide-y divide-[#e5e3df]">
          {needsAttention.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-[#787671] italic">
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
                  className="flex items-center justify-between h-[38px] px-4 hover:bg-[#f6f5f4] cursor-pointer transition-colors text-xs"
                >
                  <div className="flex items-center gap-2.5 truncate mr-3 flex-1 min-w-0">
                    <PriorityIcon priority={issue.priority} size="sm" />
                    <span className="font-mono font-bold text-[#5645d4] hover:underline">
                      {issue.key}
                    </span>
                    <span className="truncate text-[#1a1a1a] font-medium">{issue.title}</span>
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
        <section className="bg-white border border-[#e5e3df] rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 bg-[#fafaf9] border-b border-[#e5e3df] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#5645d4]" />
              <h2 className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider">
                Active Execution
              </h2>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-[#5645d4]">
                {activeExecution.length}
              </span>
            </div>

            <Link
              to={`/projects/${project.key}/board`}
              className="text-[11px] font-medium text-[#5645d4] hover:underline flex items-center gap-1"
            >
              <span>View board</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-[#e5e3df] max-h-72 overflow-y-auto">
            {activeExecution.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-[#787671] italic">
                No tasks currently in progress or review.
              </div>
            ) : (
              activeExecution.map(issue => (
                <div
                  key={issue.id}
                  onClick={() => openDrawer(issue.key)}
                  className="flex items-center justify-between h-[36px] px-4 hover:bg-[#f6f5f4] cursor-pointer transition-colors text-xs"
                >
                  <div className="flex items-center gap-2 truncate mr-3 flex-1 min-w-0">
                    <PriorityIcon priority={issue.priority} size="sm" />
                    <span className="font-mono font-bold text-[#5645d4]">{issue.key}</span>
                    <span className="truncate text-[#1a1a1a]">{issue.title}</span>
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
        <section className="bg-white border border-[#e5e3df] rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 bg-[#fafaf9] border-b border-[#e5e3df] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitFork className="w-4 h-4 text-[#5645d4]" />
              <h2 className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider">
                Blocking Downstream
              </h2>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-[#5645d4]">
                {blockingOthers.length}
              </span>
            </div>

            <span className="text-[11px] text-[#787671]">Prerequisites for peers</span>
          </div>

          <div className="divide-y divide-[#e5e3df] max-h-72 overflow-y-auto">
            {blockingOthers.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-[#787671] italic">
                No issues in this project are actively blocking teammate work.
              </div>
            ) : (
              blockingOthers.map(item => (
                <div
                  key={item.issue.id}
                  onClick={() => openDrawer(item.issue.key)}
                  className="p-3 hover:bg-[#f6f5f4] cursor-pointer transition-colors text-xs"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 font-mono font-bold text-[#5645d4]">
                      <span>{item.issue.key}</span>
                      <span className="text-[#1a1a1a] font-normal truncate">{item.issue.title}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-[#5645d4] bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200 shrink-0">
                      Blocks {item.activeDownstreamIssues.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-[#787671] truncate pl-2">
                    <span className="text-[#a4a097]">Downstream:</span>
                    {item.activeDownstreamIssues.slice(0, 3).map(down => (
                      <span
                        key={down.id}
                        className="font-mono bg-[#f6f5f4] px-1 py-0.2 rounded border border-[#e5e3df] text-[#37352f]"
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
        <section className="bg-white border border-[#e5e3df] rounded-lg overflow-hidden lg:col-span-2">
          <div className="px-4 py-2.5 bg-[#fafaf9] border-b border-[#e5e3df] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#5645d4]" />
              <h2 className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider">
                Current Cycle Execution
              </h2>
              {activeCycle && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-[#5645d4]">
                  {activeCycle.name}
                </span>
              )}
            </div>

            <Link
              to={`/projects/${project.key}/planning`}
              className="text-[11px] font-medium text-[#5645d4] hover:underline flex items-center gap-1"
            >
              <span>Planning view</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-[#e5e3df] max-h-60 overflow-y-auto">
            {currentCycleIssues.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-[#787671] italic">
                No issues allocated to the team&rsquo;s current active cycle.
              </div>
            ) : (
              currentCycleIssues.map(issue => (
                <div
                  key={issue.id}
                  onClick={() => openDrawer(issue.key)}
                  className="flex items-center justify-between h-[36px] px-4 hover:bg-[#f6f5f4] cursor-pointer transition-colors text-xs"
                >
                  <div className="flex items-center gap-2 truncate mr-3 flex-1 min-w-0">
                    <span className="font-mono font-bold text-[#5645d4]">{issue.key}</span>
                    <span className="truncate text-[#1a1a1a]">{issue.title}</span>
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
        <section className="bg-white border border-[#e5e3df] rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 bg-[#fafaf9] border-b border-[#e5e3df] flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#5645d4]" />
            <h2 className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider">
              Recent Activity
            </h2>
          </div>

          <div className="divide-y divide-[#e5e3df] max-h-60 overflow-y-auto p-2 space-y-1.5 text-xs">
            {recentActivity.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-[#787671] italic">
                No recent activity logged for this project.
              </div>
            ) : (
              recentActivity.map(event => {
                const actionLabel = event.details.reason
                  ? event.details.reason
                  : event.eventType.replace(/_/g, ' ').toLowerCase();
                return (
                  <div key={event.id} className="p-2 bg-[#fafaf9] rounded border border-[#e5e3df]/60">
                    <div className="flex items-center justify-between text-[10px] text-[#787671] mb-1">
                      <span className="font-semibold text-[#1a1a1a]">{event.userName}</span>
                      <span>
                        {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#37352f] leading-snug">
                      {actionLabel}
                      {event.details.from !== undefined && event.details.to !== undefined && (
                        <span className="ml-1 text-[#787671]">
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
