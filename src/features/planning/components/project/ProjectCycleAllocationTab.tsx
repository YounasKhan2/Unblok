/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Project, Issue, Cycle } from '../../../../types';
import { ProjectCycleAllocationGroup } from '../../types';
import { StatePill } from '../../../../components/ui/StatePill';
import { PriorityIcon } from '../../../../components/ui/PriorityIcon';
import { BlockerBadge } from '../../../../components/ui/BlockerBadge';
import { CycleProgressBadge } from '../cycles/CycleProgressBadge';
import { Button } from '../../../../components/ui/Button';
import { useDrawerRoute } from '../../../../app/router/useDrawerRoute';
import { useProject } from '../../../../context/ProjectContext';
import { canMutatePlanning } from '../../permissions';
import {
  Clock,
  Plus,
  X,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

interface ProjectCycleAllocationTabProps {
  project: Project;
  eligibleCycles: Cycle[];
  activeCycle?: Cycle;
  backlogIssues: Issue[];
  cycleGroups: ProjectCycleAllocationGroup[];
}

export const ProjectCycleAllocationTab: React.FC<ProjectCycleAllocationTabProps> = ({
  project,
  eligibleCycles,
  activeCycle,
  backlogIssues,
  cycleGroups,
}) => {
  const { openDrawer } = useDrawerRoute();
  const { updateIssueCycle, getIssueBlockerStatus, currentUser } = useProject();

  const isObserver = !canMutatePlanning(currentUser.role);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (id: string) => {
    setCollapsedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAssignToCycle = (issueId: string, cycleId?: string) => {
    if (isObserver) return;
    updateIssueCycle(issueId, cycleId);
  };

  return (
    <div className="space-y-6 select-none">
      {/* 1. Unscheduled Backlog Section */}
      <div className="bg-surface-base border border-border rounded-lg overflow-hidden">
        <div
          onClick={() => toggleGroup('backlog')}
          className="px-4 py-3 bg-surface-subtle border-b border-border flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="text-text-muted hover:text-text-primary p-0.5"
              aria-label="Toggle backlog"
            >
              {collapsedGroups['backlog'] ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Unscheduled Backlog
            </h3>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-surface-muted text-text-secondary border border-border">
              {backlogIssues.length} tasks
            </span>
          </div>

          <span className="text-xs text-text-muted">
            Tasks in {project.name} not allocated to any delivery cycle
          </span>
        </div>

        {!collapsedGroups['backlog'] && (
          <div className="divide-y divide-border">
            {backlogIssues.length === 0 ? (
              <div className="p-6 text-center text-xs text-text-muted">
                No unscheduled backlog tasks in this project.
              </div>
            ) : (
              backlogIssues.map(issue => {
                const blocker = getIssueBlockerStatus(issue.id);

                return (
                  <div
                    key={issue.id}
                    onClick={() => openDrawer(issue.key)}
                    className="flex items-center justify-between px-4 py-2 hover:bg-surface-muted/50 transition-colors text-xs cursor-pointer group"
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

                    <div className="flex items-center gap-3 shrink-0" onClick={e => e.stopPropagation()}>
                      <BlockerBadge status={blocker} onSelectIssue={openDrawer} />
                      <StatePill state={issue.state} size="sm" />

                      {/* Quick Assign to Cycle Dropdown */}
                      {!isObserver && (
                        <select
                          value=""
                          onChange={e => handleAssignToCycle(issue.id, e.target.value)}
                          className="h-6 text-[11px] px-2 py-0 rounded border border-border bg-surface-base text-text-secondary focus:outline-none focus:border-accent cursor-pointer"
                        >
                          <option value="" disabled>
                            Assign to Cycle...
                          </option>
                          {eligibleCycles.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.status})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* 2. Scheduled Cycles Section */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider px-1">
          Allocated Cycles ({cycleGroups.length})
        </h3>

        {cycleGroups.map(group => {
          const { cycle, issues: groupIssues, progress } = group;
          const isCollapsed = Boolean(collapsedGroups[cycle.id]);

          return (
            <div
              key={cycle.id}
              className="bg-surface-base border border-border rounded-lg overflow-hidden"
            >
              {/* Group Header */}
              <div
                onClick={() => toggleGroup(cycle.id)}
                className="px-4 py-3 bg-surface-subtle border-b border-border flex flex-wrap items-center justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="text-text-muted hover:text-text-primary p-0.5"
                    aria-label={`Toggle ${cycle.name}`}
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider border ${
                      cycle.status === 'ACTIVE'
                        ? 'bg-accent/10 text-accent border-accent/30'
                        : 'bg-surface-muted text-text-secondary border-border'
                    }`}
                  >
                    {cycle.status}
                  </span>

                  <h4 className="text-xs font-bold text-text-primary">{cycle.name}</h4>
                  <span className="text-[11px] text-text-muted">
                    ({cycle.startDate} → {cycle.endDate})
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-surface-muted border border-border text-text-secondary">
                    {groupIssues.length} tasks
                  </span>
                  <div className="w-28 hidden sm:block">
                    <CycleProgressBadge progress={progress} />
                  </div>
                </div>
              </div>

              {/* Group Issues */}
              {!isCollapsed && (
                <div className="divide-y divide-border">
                  {groupIssues.length === 0 ? (
                    <div className="p-6 text-center text-xs text-text-muted italic">
                      No tasks from {project.name} allocated to this cycle yet.
                    </div>
                  ) : (
                    groupIssues.map(issue => {
                      const blocker = getIssueBlockerStatus(issue.id);

                      return (
                        <div
                          key={issue.id}
                          onClick={() => openDrawer(issue.key)}
                          className="flex items-center justify-between px-4 py-2 hover:bg-surface-muted/50 transition-colors text-xs cursor-pointer group"
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

                          <div
                            className="flex items-center gap-3 shrink-0"
                            onClick={e => e.stopPropagation()}
                          >
                            <BlockerBadge status={blocker} onSelectIssue={openDrawer} />
                            <StatePill state={issue.state} size="sm" />

                            {!isObserver && (
                              <button
                                type="button"
                                onClick={() => handleAssignToCycle(issue.id, undefined)}
                                className="text-text-muted hover:text-danger p-1 rounded transition-colors cursor-pointer"
                                title="Unschedule (return to project backlog)"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
