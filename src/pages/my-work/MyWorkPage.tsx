/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  X,
  Plus,
  GitFork,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { useKeyboard } from '../../context/KeyboardContext';
import { useDrawerRoute } from '../../app/router/useDrawerRoute';
import { selectMyWorkData, MyWorkFilterParams } from '../../features/my-work/selectors';
import { PersonalBlockerSummaryBanner } from '../../features/my-work/PersonalBlockerSummaryBanner';
import { MyWorkSection } from '../../features/my-work/MyWorkSection';
import { BlockingOthersCard } from '../../features/my-work/BlockingOthersCard';
import { Button } from '../../components/ui/Button';
import { Issue } from '../../types';

export const MyWorkPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    issues,
    dependencies,
    currentUser,
    cycles,
    selectedIssueIds,
    toggleSelectIssue,
    setSelectedIssueId,
  } = useProject();

  const { setIsCreateModalOpen, registerCanvasHandlers } = useKeyboard();
  const { openDrawer, drawerIssueKey, navigateToAdjacentIssue } = useDrawerRoute();

  const blockingOthersRef = useRef<HTMLDivElement>(null);

  // Read URL-backed filters strictly separated by query parameter:
  // state= lifecycle filtering (TODO, IN_PROGRESS, IN_REVIEW, DONE)
  // priority= priority filtering (URGENT, HIGH, MEDIUM, LOW)
  // blocker= blocker filtering (BLOCKED_ONLY, UNBLOCKED_ONLY, ALL)
  // q= search query
  const searchQuery = searchParams.get('q') || '';
  const lifecycleFilter = searchParams.get('state') || 'ALL';
  const blockerFilter = searchParams.get('blocker') || 'ALL';
  const priorityFilter = searchParams.get('priority') || 'ALL';

  const filterParams: MyWorkFilterParams = useMemo(
    () => ({
      searchQuery,
      lifecycleFilter,
      blockerFilter,
      priorityFilter,
    }),
    [searchQuery, lifecycleFilter, blockerFilter, priorityFilter]
  );

  // Pure domain selector for My Work with team-scoped active cycle derivation
  const {
    needsAttention,
    inProgress,
    inReview,
    upNext,
    recentlyCompleted,
    blockingOthers,
    summary,
    groups,
    activeCycles,
  } = useMemo(
    () =>
      selectMyWorkData(
        issues,
        dependencies,
        currentUser.id,
        filterParams,
        undefined,
        cycles,
        currentUser.teamIds || (currentUser.teamId ? [currentUser.teamId] : [])
      ),
    [issues, dependencies, currentUser.id, currentUser.teamIds, currentUser.teamId, filterParams, cycles]
  );

  // Filter update helper that updates URL query state cleanly
  const updateFilters = useCallback(
    (updates: Partial<Record<'q' | 'state' | 'blocker' | 'priority', string>>) => {
      const nextParams = new URLSearchParams(searchParams);
      for (const [key, value] of Object.entries(updates)) {
        if (!value || value === 'ALL') {
          nextParams.delete(key);
        } else {
          nextParams.set(key, value);
        }
      }
      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const clearAllFilters = useCallback(() => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('q');
    nextParams.delete('state');
    nextParams.delete('blocker');
    nextParams.delete('priority');
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const hasActiveFilters =
    searchQuery !== '' ||
    lifecycleFilter !== 'ALL' ||
    blockerFilter !== 'ALL' ||
    priorityFilter !== 'ALL';

  // Flat list of all currently displayed issues in execution priority order for keyboard navigation
  const visibleIssues = useMemo(() => {
    return [
      ...needsAttention,
      ...inProgress,
      ...inReview,
      ...upNext,
      ...recentlyCompleted,
    ];
  }, [needsAttention, inProgress, inReview, upNext, recentlyCompleted]);

  // Selected focused issue index for keyboard J/K navigation
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  const currentFocusedIssue = visibleIssues[focusedIndex] || visibleIssues[0];

  // Synchronize drawer key with ProjectContext selectedIssueId
  useEffect(() => {
    if (drawerIssueKey) {
      const match = issues.find(i => i.key === drawerIssueKey || i.id === drawerIssueKey);
      if (match) {
        setSelectedIssueId(match.id);
      }
    }
  }, [drawerIssueKey, issues, setSelectedIssueId]);

  // Register canvas keyboard commands with KeyboardContext (replaces ad-hoc keydown listener)
  useEffect(() => {
    registerCanvasHandlers({
      onNext: () => {
        setFocusedIndex(prev => {
          const next = Math.min(prev + 1, visibleIssues.length - 1);
          const nextIssue = visibleIssues[next];
          if (nextIssue && drawerIssueKey) {
            navigateToAdjacentIssue(nextIssue.key);
          }
          return next;
        });
      },
      onPrev: () => {
        setFocusedIndex(prev => {
          const next = Math.max(prev - 1, 0);
          const nextIssue = visibleIssues[next];
          if (nextIssue && drawerIssueKey) {
            navigateToAdjacentIssue(nextIssue.key);
          }
          return next;
        });
      },
      onOpen: () => {
        if (currentFocusedIssue) {
          openDrawer(currentFocusedIssue.key);
        }
      },
      onToggleSelect: () => {
        if (currentFocusedIssue) {
          toggleSelectIssue(currentFocusedIssue.id);
        }
      },
    });

    return () => {
      registerCanvasHandlers(null);
    };
  }, [
    visibleIssues,
    currentFocusedIssue,
    drawerIssueKey,
    openDrawer,
    navigateToAdjacentIssue,
    toggleSelectIssue,
    registerCanvasHandlers,
  ]);

  const handleSelectRow = (issue: Issue) => {
    const index = visibleIssues.findIndex(i => i.id === issue.id);
    if (index !== -1) setFocusedIndex(index);
    setSelectedIssueId(issue.id);
  };

  const handleToggleMultiSelect = (issueId: string, isShift: boolean) => {
    toggleSelectIssue(issueId, isShift);
  };

  const isTotalQueueEmpty = summary.totalAssigned === 0;

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-canvas">
      {/* 1. Contextual Page Header */}
      <div className="border-b border-border bg-surface-base px-4 py-2 shrink-0 flex flex-wrap items-center justify-between gap-3 select-none">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-bold text-text-primary tracking-tight">My Work</h1>
          <span className="text-xs text-text-muted hidden sm:inline">·</span>
          <span className="text-xs text-text-muted hidden sm:inline">
            Execution Queue
          </span>
          {activeCycles.length > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-accent-subtle text-accent font-semibold truncate max-w-[140px]">
              {activeCycles.map(c => c.name).join(', ')}
            </span>
          )}
        </div>

        {/* Search & Filter Toolbar Controls */}
        <div className="flex items-center gap-2 text-xs">
          {/* Quick Search */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => updateFilters({ q: e.target.value })}
              placeholder="Filter tasks... (/)"
              className="h-7 w-32 sm:w-48 pl-8 pr-2.5 bg-surface-subtle border border-border rounded-[5px] text-xs text-text-primary placeholder:text-text-muted focus:bg-surface-base focus:border-accent focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => updateFilters({ q: '' })}
                className="absolute right-2 text-text-muted hover:text-text-primary"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Canonical State Filter */}
          <select
            value={lifecycleFilter}
            onChange={e => updateFilters({ state: e.target.value })}
            className="h-7 px-2 bg-surface-subtle border border-border rounded-[5px] text-xs text-text-secondary hover:border-border focus:outline-none cursor-pointer"
            aria-label="Filter by state"
          >
            <option value="ALL">All States</option>
            <option value="TODO">Todo</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="DONE">Done</option>
          </select>

          {/* Canonical Priority Filter */}
          <select
            value={priorityFilter}
            onChange={e => updateFilters({ priority: e.target.value })}
            className="h-7 px-2 bg-surface-subtle border border-border rounded-[5px] text-xs text-text-secondary hover:border-border focus:outline-none cursor-pointer hidden md:inline-block"
            aria-label="Filter by priority"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* New Task CTA */}
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsCreateModalOpen(true)}
            className="font-semibold shadow-2xs"
          >
            <span className="hidden sm:inline">Create Task</span>
            <span className="sm:hidden">New</span>
            <kbd className="hidden sm:inline-block ml-1 font-mono text-[9px] bg-white/20 px-1 py-0.2 rounded text-white">
              C
            </kbd>
          </Button>
        </div>
      </div>

      {/* 2. Compact Operational Execution/Dependency Signal Bar */}
      <PersonalBlockerSummaryBanner
        summary={summary}
        blockerFilter={blockerFilter}
        onBlockerFilterChange={filter => updateFilters({ blocker: filter })}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearAllFilters}
        onJumpToBlockingOthers={() => {
          blockingOthersRef.current?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* 3. Main Scrollable Execution Canvas (Front and center!) */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-canvas" tabIndex={0}>
        {isTotalQueueEmpty ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-10 h-10 rounded-full bg-success-subtle text-success flex items-center justify-center mb-3">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-text-primary mb-1">
              All clear! No tasks currently assigned
            </h3>
            <p className="text-xs text-text-muted max-w-sm mb-4 leading-relaxed">
              You have no active or blocked tasks in the current cycle. Browse team backlogs
              or create a new task to begin.
            </p>
            <Button
              variant="secondary"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              Create New Task
            </Button>
          </div>
        ) : visibleIssues.length === 0 && hasActiveFilters ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <p className="text-xs text-text-muted mb-3">
              No tasks match your active search or filters.
            </p>
            <Button variant="secondary" size="sm" onClick={clearAllFilters}>
              Clear All Filters
            </Button>
          </div>
        ) : (
          <div className="py-2">
            {/* Table Header Bar for Tabular Column Alignment */}
            <div className="flex items-center h-[28px] px-3 border-b border-border text-[11px] font-semibold text-text-muted uppercase tracking-wider select-none bg-surface-subtle">
              <div className="w-5 shrink-0" />
              <div className="w-6 shrink-0 text-center">Pri</div>
              <div className="w-20 shrink-0">Key</div>
              <div className="flex-1 min-w-0 pr-3 truncate">Title</div>
              <div className="shrink-0 mr-3 w-28 truncate hidden sm:block">Blocker Status</div>
              <div className="w-28 shrink-0">State</div>
              <div className="w-24 shrink-0 hidden lg:block">Due Date</div>
              <div className="w-20 shrink-0 hidden md:block">Team</div>
            </div>

            {/* Primary Actionable Execution Groups (Needs Attention, In Progress, In Review, Up Next) */}
            {groups
              .filter(g => g.id !== 'recentlyCompleted')
              .map(group => {
                // Hide empty sections unless it's Needs Attention or In Progress
                if (
                  group.count === 0 &&
                  group.id !== 'needsAttention' &&
                  group.id !== 'inProgress'
                ) {
                  return null;
                }

                return (
                  <MyWorkSection
                    key={group.id}
                    id={group.id}
                    title={group.title}
                    subtitle={group.subtitle}
                    count={group.count}
                    issues={group.issues}
                    emptyMessage={group.emptyMessage}
                    selectedIssueKey={drawerIssueKey || currentFocusedIssue?.key || null}
                    selectedIssueIds={selectedIssueIds}
                    onSelectRow={handleSelectRow}
                    onToggleMultiSelect={handleToggleMultiSelect}
                    onOpenIssue={openDrawer}
                  />
                );
              })}

            {/* 4. Secondary Dependency-Impact Context: Blocking Others */}
            {blockingOthers.length > 0 && blockerFilter !== 'BLOCKED_ONLY' && (
              <div
                ref={blockingOthersRef}
                className="mt-4 mx-3 p-3.5 bg-accent-subtle/30 rounded-lg border border-accent/20 mb-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <GitFork className="w-4 h-4 text-accent" />
                  <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                    Blocking Others (Downstream Impact)
                  </h2>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-accent-subtle text-accent">
                    {blockingOthers.length}
                  </span>
                  <span className="text-[11px] text-text-muted ml-1">
                    Your assigned work that teammates are actively waiting on
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {blockingOthers.map(item => (
                    <BlockingOthersCard
                      key={item.issue.id}
                      item={item}
                      onOpenIssue={openDrawer}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 5. Recently Completed Group (Collapsible at bottom) */}
            {groups
              .filter(g => g.id === 'recentlyCompleted')
              .map(group => {
                if (group.count === 0) return null;
                return (
                  <MyWorkSection
                    key={group.id}
                    id={group.id}
                    title={group.title}
                    subtitle={group.subtitle}
                    count={group.count}
                    issues={group.issues}
                    emptyMessage={group.emptyMessage}
                    selectedIssueKey={drawerIssueKey || currentFocusedIssue?.key || null}
                    selectedIssueIds={selectedIssueIds}
                    onSelectRow={handleSelectRow}
                    onToggleMultiSelect={handleToggleMultiSelect}
                    onOpenIssue={openDrawer}
                    defaultCollapsed={true}
                  />
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};
