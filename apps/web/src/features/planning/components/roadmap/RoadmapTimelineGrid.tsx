/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RoadmapDayColumn, RoadmapRosterGroup, RoadmapScheduledIssue } from '../../types';
import { PriorityIcon } from '../../../../components/ui/PriorityIcon';
import { StatePill } from '../../../../components/ui/StatePill';
import { Avatar } from '../../../../components/ui/Avatar';
import { BlockerBadge } from '../../../../components/ui/BlockerBadge';
import { useDrawerRoute } from '../../../../app/router/useDrawerRoute';
import { useProject } from '../../../../context/ProjectContext';
import { ShieldAlert, Users, FolderKanban } from 'lucide-react';

interface RoadmapTimelineGridProps {
  days: RoadmapDayColumn[];
  groups: RoadmapRosterGroup[];
}

export const RoadmapTimelineGrid: React.FC<RoadmapTimelineGridProps> = ({ days, groups }) => {
  const { openDrawer } = useDrawerRoute();
  const { getIssueBlockerStatus } = useProject();

  if (groups.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-text-muted bg-surface-base">
        <p className="text-xs">No scheduled work items match the current filters and schedule window.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-x-auto bg-surface-base select-none">
      {/* 1. Sticky Grid Header */}
      <div className="flex border-b border-border bg-surface-subtle sticky top-0 z-20 shrink-0 min-w-[800px]">
        {/* Pinned Roster Header */}
        <div className="w-56 shrink-0 px-3 py-2 text-[11px] font-semibold text-text-muted uppercase tracking-wider border-r border-border flex items-center justify-between">
          <span>Workstream / Owner</span>
          <span>Tasks</span>
        </div>

        {/* Days Columns Header */}
        <div className="flex-1 grid grid-cols-7 divide-x divide-border">
          {days.map(d => (
            <div
              key={d.dateStr}
              className={`px-2 py-1.5 text-center text-xs transition-colors ${
                d.isToday
                  ? 'bg-accent/10 font-bold text-accent'
                  : d.isWeekend
                  ? 'bg-surface-muted/50 text-text-muted'
                  : 'text-text-secondary'
              }`}
            >
              <div className="text-[10px] uppercase font-semibold text-text-muted">
                {d.dayOfWeek}
              </div>
              <div
                className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs mx-auto ${
                  d.isToday ? 'bg-accent text-white font-bold' : ''
                }`}
              >
                {d.dayNum}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Timeline Grid Body (Roster Groups) */}
      <div className="flex-1 divide-y divide-border min-w-[800px] overflow-y-auto">
        {groups.map(group => {
          return (
            <div key={group.id} className="flex min-h-[56px] hover:bg-surface-subtle/30 transition-colors">
              {/* Pinned Left Roster Info */}
              <div className="w-56 shrink-0 p-3 border-r border-border flex items-center justify-between gap-2 bg-surface-base">
                <div className="flex items-center gap-2 min-w-0">
                  {group.avatar ? (
                    <Avatar user={{ id: group.id, name: group.name, avatar: group.avatar, email: '', role: 'MEMBER', teamId: '' }} size="sm" />
                  ) : group.color ? (
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: group.color }}
                    />
                  ) : (
                    <Users className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  )}

                  <div className="min-w-0">
                    <div className="text-xs font-bold text-text-primary truncate">{group.name}</div>
                    <div className="text-[10px] text-text-muted truncate">{group.secondaryInfo}</div>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-surface-muted text-text-secondary shrink-0">
                  {group.totalScheduled}
                </span>
              </div>

              {/* Right Schedule Canvas */}
              <div className="flex-1 grid grid-cols-7 divide-x divide-border relative p-1.5 gap-y-1.5 auto-rows-max">
                {group.issues.map(item => {
                  const blocker = getIssueBlockerStatus(item.issue.id);

                  // Calculate grid placement (1-indexed for CSS grid)
                  const gridColumnStart = item.startCol + 1;
                  const gridColumnEnd = `span ${item.spanCols}`;

                  return (
                    <div
                      key={item.issue.id}
                      onClick={() => openDrawer(item.issue.key)}
                      style={{
                        gridColumnStart,
                        gridColumn: `${gridColumnStart} / ${gridColumnEnd}`,
                      }}
                      className={`h-7 px-2 rounded-[4px] border text-xs flex items-center justify-between gap-1.5 cursor-pointer shadow-2xs transition-all hover:scale-[1.01] hover:shadow-xs group ${
                        item.isBlocked
                          ? 'bg-danger/10 border-danger/40 text-danger hover:border-danger'
                          : 'bg-surface-base border-border text-text-primary hover:border-accent'
                      }`}
                      title={`${item.issue.key}: ${item.issue.title} (${item.issue.startDate || ''} → ${
                        item.issue.dueDate || ''
                      })`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <PriorityIcon priority={item.issue.priority} size="sm" />
                        <span className="font-mono text-[11px] font-semibold text-accent shrink-0">
                          {item.issue.key}
                        </span>
                        <span className="truncate text-text-primary text-[11px] font-medium">
                          {item.issue.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {item.isBlocked && (
                          <span
                            className="inline-flex items-center gap-0.5 text-[10px] font-bold text-danger px-1 py-0.2 rounded bg-danger/15"
                            title={`Blocked by ${blocker.activeCount} prerequisite(s)`}
                          >
                            <ShieldAlert className="w-2.5 h-2.5" />
                            <span>{blocker.activeCount}</span>
                          </span>
                        )}
                        <StatePill state={item.issue.state} size="sm" showLabel={false} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
