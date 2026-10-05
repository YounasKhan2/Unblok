/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Project, Milestone } from '../../../../types';
import { ProjectMilestoneAllocationGroup } from '../../types';
import { StatePill } from '../../../../components/ui/StatePill';
import { PriorityIcon } from '../../../../components/ui/PriorityIcon';
import { BlockerBadge } from '../../../../components/ui/BlockerBadge';
import { useDrawerRoute } from '../../../../app/router/useDrawerRoute';
import { useProject } from '../../../../context/ProjectContext';
import { canMutatePlanning } from '../../permissions';
import {
  Target,
  Plus,
  X,
  ChevronDown,
  ChevronRight,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

interface ProjectMilestoneMappingTabProps {
  project: Project;
  groups: ProjectMilestoneAllocationGroup[];
  unlinkedGroup: ProjectMilestoneAllocationGroup;
  allMilestones: Milestone[];
}

export const ProjectMilestoneMappingTab: React.FC<ProjectMilestoneMappingTabProps> = ({
  project,
  groups,
  unlinkedGroup,
  allMilestones,
}) => {
  const { openDrawer } = useDrawerRoute();
  const { updateIssueMilestone, getIssueBlockerStatus, currentUser } = useProject();

  const isObserver = !canMutatePlanning(currentUser.role);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (id: string) => {
    setCollapsedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAssignMilestone = (issueId: string, milestoneId?: string) => {
    if (isObserver) return;
    updateIssueMilestone(issueId, milestoneId);
  };

  return (
    <div className="space-y-6 select-none">
      {/* 1. Linked Milestones */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider px-1">
          Strategic Milestones ({groups.length})
        </h3>

        {groups.map(group => {
          const { milestone, issues, completedCount, totalCount } = group;
          if (!milestone) return null;

          const isCollapsed = Boolean(collapsedGroups[milestone.id]);
          const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

          return (
            <div
              key={milestone.id}
              className="bg-surface-base border border-border rounded-lg overflow-hidden"
            >
              {/* Milestone Header */}
              <div
                onClick={() => toggleGroup(milestone.id)}
                className="px-4 py-3 bg-surface-subtle border-b border-border flex flex-wrap items-center justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="text-text-muted hover:text-text-primary p-0.5"
                    aria-label={`Toggle ${milestone.name}`}
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  <Target className="w-4 h-4 text-accent" />
                  <h4 className="text-xs font-bold text-text-primary">{milestone.name}</h4>
                  <span className="text-[11px] text-text-muted flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-text-muted" />
                    <span>Target: {milestone.targetDate}</span>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-surface-muted border border-border text-text-secondary">
                    {completedCount}/{totalCount} completed ({percent}%)
                  </span>
                </div>
              </div>

              {/* Linked Issues */}
              {!isCollapsed && (
                <div className="divide-y divide-border">
                  {issues.length === 0 ? (
                    <div className="p-6 text-center text-xs text-text-muted italic">
                      No tasks from {project.name} linked to this milestone yet.
                    </div>
                  ) : (
                    issues.map(issue => {
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
                                onClick={() => handleAssignMilestone(issue.id, undefined)}
                                className="text-text-muted hover:text-danger p-1 rounded transition-colors cursor-pointer"
                                title="Unlink from milestone"
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

      {/* 2. Unlinked Tasks Section */}
      <div className="bg-surface-base border border-border rounded-lg overflow-hidden">
        <div
          onClick={() => toggleGroup('unlinked')}
          className="px-4 py-3 bg-surface-subtle border-b border-border flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="text-text-muted hover:text-text-primary p-0.5"
              aria-label="Toggle unlinked"
            >
              {collapsedGroups['unlinked'] ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              No Milestone Assigned
            </h3>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-surface-muted text-text-secondary border border-border">
              {unlinkedGroup.issues.length} tasks
            </span>
          </div>

          <span className="text-xs text-text-muted">
            Tasks in {project.name} not mapped to any strategic milestone
          </span>
        </div>

        {!collapsedGroups['unlinked'] && (
          <div className="divide-y divide-border">
            {unlinkedGroup.issues.length === 0 ? (
              <div className="p-6 text-center text-xs text-text-muted">
                All tasks in this project are linked to strategic milestones.
              </div>
            ) : (
              unlinkedGroup.issues.map(issue => {
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

                      {/* Quick Link to Milestone Dropdown */}
                      {!isObserver && (
                        <select
                          value=""
                          onChange={e => handleAssignMilestone(issue.id, e.target.value)}
                          className="h-6 text-[11px] px-2 py-0 rounded border border-border bg-surface-base text-text-secondary focus:outline-none focus:border-accent cursor-pointer"
                        >
                          <option value="" disabled>
                            Link to Milestone...
                          </option>
                          {allMilestones.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.name}
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
    </div>
  );
};
