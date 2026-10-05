/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext';
import { selectRoadmapProjection } from '../../features/planning/selectors/roadmapSelectors';
import { generateScheduleDays, formatRangeLabel } from '../../features/planning/domain/scheduleInvariants';
import { RoadmapToolbar } from '../../features/planning/components/roadmap/RoadmapToolbar';
import { RoadmapTimelineGrid } from '../../features/planning/components/roadmap/RoadmapTimelineGrid';
import { RoadmapMobileAgenda } from '../../features/planning/components/roadmap/RoadmapMobileAgenda';
import { ScheduleIssueModal } from '../../features/planning/components/roadmap/ScheduleIssueModal';
import { RoadmapFilterState, RoadmapViewMode } from '../../features/planning/types';
import { canMutatePlanning } from '../../features/planning/permissions';
import { CalendarRange } from 'lucide-react';

export const RoadmapPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { issues, teams, projects, users, dependencies, cycles, milestones, currentUser } = useProject();

  const isObserver = !canMutatePlanning(currentUser.role);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Default window starts on Monday of the current reference week (e.g. 2026-09-28)
  const [windowStartDate, setWindowStartDate] = useState<Date>(
    () => new Date('2026-09-28T00:00:00.000Z')
  );

  // Read URL filter state
  const rawGroup = searchParams.get('group');
  const group: RoadmapViewMode = rawGroup === 'assignee' ? 'assignee' : 'team';
  const team = searchParams.get('team') || 'ALL';
  const assignee = searchParams.get('assignee') || 'ALL';
  const cycle = searchParams.get('cycle') || 'ALL';
  const milestone = searchParams.get('milestone') || 'ALL';
  const blockedOnly = searchParams.get('blocked') === 'true';
  const searchQuery = searchParams.get('q') || '';

  const filters: RoadmapFilterState = useMemo(
    () => ({
      group,
      team,
      assignee,
      cycle,
      milestone,
      blockedOnly,
      searchQuery,
    }),
    [group, team, assignee, cycle, milestone, blockedOnly, searchQuery]
  );

  const updateFilters = useCallback(
    (updates: Partial<RoadmapFilterState>) => {
      const next = new URLSearchParams(searchParams);

      if (updates.group !== undefined) {
        if (updates.group === 'team') next.delete('group');
        else next.set('group', updates.group);
      }

      if (updates.team !== undefined) {
        if (updates.team === 'ALL') next.delete('team');
        else next.set('team', updates.team);
      }

      if (updates.assignee !== undefined) {
        if (updates.assignee === 'ALL') next.delete('assignee');
        else next.set('assignee', updates.assignee);
      }

      if (updates.cycle !== undefined) {
        if (updates.cycle === 'ALL') next.delete('cycle');
        else next.set('cycle', updates.cycle);
      }

      if (updates.milestone !== undefined) {
        if (updates.milestone === 'ALL') next.delete('milestone');
        else next.set('milestone', updates.milestone);
      }

      if (updates.blockedOnly !== undefined) {
        if (!updates.blockedOnly) next.delete('blocked');
        else next.set('blocked', 'true');
      }

      if (updates.searchQuery !== undefined) {
        if (!updates.searchQuery.trim()) next.delete('q');
        else next.set('q', updates.searchQuery.trim());
      }

      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const resetFilters = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  // Window date manipulation
  const scheduleDays = useMemo(
    () => generateScheduleDays(windowStartDate, 7, new Date('2026-10-04T00:00:00.000Z')),
    [windowStartDate]
  );

  const rangeLabel = useMemo(() => formatRangeLabel(scheduleDays), [scheduleDays]);

  const handlePrevRange = () => {
    setWindowStartDate(prev => new Date(prev.getTime() - 7 * 24 * 60 * 60 * 1000));
  };

  const handleNextRange = () => {
    setWindowStartDate(prev => new Date(prev.getTime() + 7 * 24 * 60 * 60 * 1000));
  };

  const handleToday = () => {
    setWindowStartDate(new Date('2026-09-28T00:00:00.000Z'));
  };

  // Select roadmap projection
  const { groups, totalScheduledCount, totalBlockedCount } = useMemo(
    () =>
      selectRoadmapProjection(
        issues,
        teams,
        projects,
        users,
        dependencies,
        scheduleDays,
        filters
      ),
    [issues, teams, projects, users, dependencies, scheduleDays, filters]
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-surface-subtle overflow-hidden select-none">
      {/* 1. Header Toolbar */}
      <RoadmapToolbar
        filters={filters}
        onFilterChange={updateFilters}
        onResetFilters={resetFilters}
        rangeLabel={rangeLabel}
        onPrevRange={handlePrevRange}
        onNextRange={handleNextRange}
        onToday={handleToday}
        onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
        teams={teams}
        users={users}
        cycles={cycles}
        milestones={milestones}
        isObserver={isObserver}
      />

      {/* 2. Desktop Timeline Canvas (hidden on mobile) */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        <RoadmapTimelineGrid days={scheduleDays} groups={groups} />
      </div>

      {/* 3. Mobile Agenda Projection (Section 50: compact agenda for mobile at ~390px) */}
      <div className="block md:hidden flex-1 overflow-y-auto">
        <div className="px-4 py-2 bg-surface-subtle border-b border-border text-xs text-text-muted flex items-center justify-between">
          <span className="font-semibold text-text-primary">Mobile Agenda</span>
          <span className="font-mono">{rangeLabel}</span>
        </div>
        <RoadmapMobileAgenda groups={groups} />
      </div>

      {/* Schedule Work Modal */}
      <ScheduleIssueModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
      />
    </div>
  );
};
