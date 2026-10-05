/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  X,
  Plus,
  GitFork,
  ArrowUpDown,
  Sparkles,
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

  const { setIsCreateModalOpen } = useKeyboard();
  const { openDrawer, drawerIssueKey, navigateToAdjacentIssue } = useDrawerRoute();

  // Read URL-backed filters
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

  // Active Team Cycle
  const activeCycle = cycles.find(c => c.status === 'ACTIVE') || cycles[0];

  // Pure domain selector for My Work
  const {
    needsAttention,
    inProgress,
    inReview,
    upNext,
    recentlyCompleted,
    blockingOthers,
    summary,
    groups,
  } = useMemo(
    () => selectMyWorkData(issues, dependencies, currentUser.id, filterParams),
    [issues, dependencies, currentUser.id, filterParams]
  );

  // Filter update helper that updates URL query state
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

  // Keyboard navigation across visible issues
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input, textarea, or contentEditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === 'j' || e.key === 'J' || e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex(prev => {
          const next = Math.min(prev + 1, visibleIssues.length - 1);
          const nextIssue = visibleIssues[next];
          if (nextIssue && drawerIssueKey) {
            navigateToAdjacentIssue(nextIssue.key);
          }
          return next;
        });
      } else if (e.key === 'k' || e.key === 'K' || e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex(prev => {
          const next = Math.max(prev - 1, 0);
          const nextIssue = visibleIssues[next];
          if (nextIssue && drawerIssueKey) {
            navigateToAdjacentIssue(nextIssue.key);
          }
          return next;
        });
      } else if (e.key === ' ' || e.key === 'Enter') {
        if (currentFocusedIssue) {
          e.preventDefault();
          openDrawer(currentFocusedIssue.key);
        }
      } else if (e.key === 'x' || e.key === 'X') {
        if (currentFocusedIssue) {
          e.preventDefault();
          toggleSelectIssue(currentFocusedIssue.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    visibleIssues,
    focusedIndex,
    currentFocusedIssue,
    drawerIssueKey,
    openDrawer,
    navigateToAdjacentIssue,
    toggleSelectIssue,
  ]);

  const handleSelectRow = (issue: Issue) => {
    const index = visibleIssues.findIndex(i => i.id === issue.id);
    if (index !== -1) setFocusedIndex(index);
    openDrawer(issue.key);
  };

  const handleToggleMultiSelect = (issueId: string, isShift: boolean) => {
    toggleSelectIssue(issueId, isShift);
  };

  const isTotalQueueEmpty = summary.totalAssigned === 0;

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-white">
      {/* 1. Contextual Page Header */}
      <div className="border-b border-[#e5e3df] bg-white px-4 py-2 shrink-0 flex flex-wrap items-center justify-between gap-3 select-none">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-bold text-[#1a1a1a] tracking-tight">My Work</h1>
          <span className="text-xs text-[#787671] hidden sm:inline">·</span>
          <span className="text-xs text-[#787671] hidden sm:inline">
            Personal Execution Queue
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-100 text-[#5645d4] font-semibold">
            {activeCycle?.name || 'Cycle 24'}
          </span>
        </div>

        {/* Search & Filter Toolbar Controls */}
        <div className="flex items-center gap-2 text-xs">
          {/* Quick Search */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-[#787671] absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => updateFilters({ q: e.target.value })}
              placeholder="Filter tasks... (/)"
              className="h-7 w-36 sm:w-48 pl-8 pr-2.5 bg-[#f6f5f4] border border-[#e5e3df] rounded-[5px] text-xs text-[#1a1a1a] placeholder-[#a4a097] focus:bg-white focus:border-[#5645d4] focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => updateFilters({ q: '' })}
                className="absolute right-2 text-[#787671] hover:text-[#1a1a1a]"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* State Filter */}
          <select
            value={lifecycleFilter}
            onChange={e => updateFilters({ state: e.target.value })}
            className="h-7 px-2 bg-[#f6f5f4] border border-[#e5e3df] rounded-[5px] text-xs text-[#37352f] hover:border-[#c8c4be] focus:outline-none cursor-pointer"
            aria-label="Filter by state"
          >
            <option value="ALL">All States</option>
            <option value="TODO">Todo</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="DONE">Done</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={e => updateFilters({ priority: e.target.value })}
            className="h-7 px-2 bg-[#f6f5f4] border border-[#e5e3df] rounded-[5px] text-xs text-[#37352f] hover:border-[#c8c4be] focus:outline-none cursor-pointer hidden md:inline-block"
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
            <span>Create Task</span>
            <kbd className="hidden sm:inline-block ml-1 font-mono text-[9px] bg-white/20 px-1 py-0.2 rounded text-white">
              C
            </kbd>
          </Button>
        </div>
      </div>

      {/* 2. Personal Blocker Posture Banner */}
      <PersonalBlockerSummaryBanner
        summary={summary}
        activeFilter={blockerFilter}
        onFilterChange={filter => updateFilters({ blocker: filter })}
        activeCycleName={activeCycle?.name}
      />

      {/* 3. Main Scrollable Execution Canvas */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-white" tabIndex={0}>
        {/* Blocking Others: Distinct Dependency Impact Surface */}
        {blockingOthers.length > 0 && blockerFilter !== 'BLOCKED_ONLY' && (
          <div className="p-4 bg-purple-50/20 border-b border-[#e5e3df]">
            <div className="flex items-center gap-2 mb-2.5">
              <GitFork className="w-4 h-4 text-[#5645d4]" />
              <h2 className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider">
                Blocking Others (Downstream Impact)
              </h2>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-[#5645d4]">
                {blockingOthers.length}
              </span>
              <span className="text-[11px] text-[#787671] ml-1">
                Your tasks that teammates are waiting on
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

        {/* Deduplicated Actionable Execution Groups */}
        {isTotalQueueEmpty ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#1a1a1a] mb-1">
              All clear! No tasks currently assigned
            </h3>
            <p className="text-xs text-[#787671] max-w-sm mb-4 leading-relaxed">
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
            <p className="text-xs text-[#787671] mb-3">
              No tasks match your active search or filters.
            </p>
            <Button variant="secondary" size="sm" onClick={clearAllFilters}>
              Clear All Filters
            </Button>
          </div>
        ) : (
          <div className="py-2">
            {/* Table Header Bar for Tabular Column Alignment */}
            <div className="flex items-center h-[28px] px-3 border-b border-[#e5e3df] text-[11px] font-semibold text-[#787671] uppercase tracking-wider select-none bg-[#fafaf9]">
              <div className="w-5 shrink-0" />
              <div className="w-6 shrink-0 text-center">Pri</div>
              <div className="w-20 shrink-0">Key</div>
              <div className="flex-1 min-w-0 pr-3">Title</div>
              <div className="shrink-0 mr-3 w-28">Blocker Status</div>
              <div className="w-28 shrink-0">State</div>
              <div className="w-24 shrink-0 hidden lg:block">Due Date</div>
              <div className="w-20 shrink-0 hidden md:block">Team</div>
            </div>

            {/* Execution Sections */}
            {groups.map(group => {
              // Hide empty sections unless it's Needs Attention or In Progress
              if (group.count === 0 && group.id !== 'needsAttention' && group.id !== 'inProgress') {
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
                  defaultCollapsed={group.id === 'recentlyCompleted'}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
