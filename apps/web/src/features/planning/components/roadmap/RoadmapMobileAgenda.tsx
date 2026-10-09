/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RoadmapRosterGroup } from '../../types';
import { PriorityIcon } from '../../../../components/ui/PriorityIcon';
import { StatePill } from '../../../../components/ui/StatePill';
import { BlockerBadge } from '../../../../components/ui/BlockerBadge';
import { useDrawerRoute } from '../../../../app/router/useDrawerRoute';
import { useProject } from '../../../../context/ProjectContext';
import { Calendar, ShieldAlert } from 'lucide-react';

interface RoadmapMobileAgendaProps {
  groups: RoadmapRosterGroup[];
}

export const RoadmapMobileAgenda: React.FC<RoadmapMobileAgendaProps> = ({ groups }) => {
  const { openDrawer } = useDrawerRoute();
  const { getIssueBlockerStatus } = useProject();

  if (groups.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-text-muted">
        No scheduled work items match the current filters.
      </div>
    );
  }

  return (
    <div className="divide-y divide-border bg-surface-base select-none">
      {groups.map(group => (
        <div key={group.id} className="p-3">
          {/* Group Header */}
          <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-border/60">
            <div className="flex items-center gap-2 min-w-0">
              {group.color && (
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: group.color }}
                />
              )}
              <span className="text-xs font-bold text-text-primary truncate">{group.name}</span>
            </div>
            <span className="text-[11px] text-text-muted shrink-0">
              {group.totalScheduled} scheduled
            </span>
          </div>

          {/* Agenda List */}
          <div className="space-y-1.5">
            {group.issues.map(item => {
              const blocker = getIssueBlockerStatus(item.issue.id);

              return (
                <div
                  key={item.issue.id}
                  onClick={() => openDrawer(item.issue.key)}
                  className={`p-2.5 rounded-[6px] border text-xs cursor-pointer flex flex-col gap-1.5 transition-all ${
                    item.isBlocked
                      ? 'bg-danger/5 border-danger/30 hover:border-danger'
                      : 'bg-surface-subtle border-border hover:border-accent'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <PriorityIcon priority={item.issue.priority} size="sm" />
                      <span className="font-mono text-accent font-semibold">{item.issue.key}</span>
                      <span className="truncate font-medium text-text-primary">
                        {item.issue.title}
                      </span>
                    </div>

                    <StatePill state={item.issue.state} size="sm" showLabel={false} />
                  </div>

                  <div className="flex items-center justify-between gap-2 text-[11px] text-text-muted">
                    <div className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-text-muted" />
                      <span>
                        {item.issue.startDate || '—'} → {item.issue.dueDate || '—'}
                      </span>
                    </div>

                    {item.isBlocked && (
                      <span className="inline-flex items-center gap-0.5 text-danger font-semibold">
                        <ShieldAlert className="w-3 h-3" />
                        <span>Blocked {blocker.activeCount}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
