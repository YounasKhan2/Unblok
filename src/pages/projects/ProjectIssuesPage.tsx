/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import {
  List,
  ChevronDown,
  ChevronRight,
  Filter,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { Project, Team, Issue } from '../../types';
import { useProject } from '../../context/ProjectContext';
import { useKeyboard } from '../../context/KeyboardContext';
import { useDrawerRoute } from '../../app/router/useDrawerRoute';
import { selectProjectIssues, ProjectIssuesFilterParams } from '../../features/projects/selectors';
import { ProjectFilterToolbar, SavedViewItem } from '../../features/projects/components/ProjectFilterToolbar';
import { PriorityIcon } from '../../components/ui/PriorityIcon';
import { StatePill } from '../../components/ui/StatePill';
import { BlockerBadge } from '../../components/ui/BlockerBadge';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';

interface OutletContextType {
  project: Project;
  team?: Team;
}

export const ProjectIssuesPage: React.FC = () => {
  const { project } = useOutletContext<OutletContextType>();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    issues,
    dependencies,
    users,
    cycles,
    milestones,
    selectedIssueIds,
    toggleSelectIssue,
    selectAllIssues,
    clearSelection,
    setSelectedIssueId,
  } = useProject();

  const { registerCanvasHandlers, setIsCreateModalOpen } = useKeyboard();
  const { openDrawer, drawerIssueKey, navigateToAdjacentIssue } = useDrawerRoute();

  // Read URL query parameters
  const searchQuery = searchParams.get('q') || '';
  const state = searchParams.get('state') || 'ALL';
  const priority = searchParams.get('priority') || 'ALL';
  const assigneeId = searchParams.get('assignee') || 'ALL';
  const blockerFilter = searchParams.get('blocker') || 'ALL';
  const cycleId = searchParams.get('cycle') || 'ALL';
  const sort = searchParams.get('sort') || 'manual';
  const group = searchParams.get('group') || 'none';

  const filterParams: ProjectIssuesFilterParams = useMemo(
    () => ({
      searchQuery,
      state,
      priority,
      assigneeId,
      blockerFilter,
      cycleId,
      sort,
      group,
    }),
    [searchQuery, state, priority, assigneeId, blockerFilter, cycleId, sort, group]
  );

  // Pure selector for project issues
  const { filteredIssues, groupedIssues, blockerStatusMap, totalProjectIssuesCount } = useMemo(
    () =>
      selectProjectIssues(
        project,
        issues,
        dependencies,
        users,
        cycles,
        milestones,
        filterParams
      ),
    [project, issues, dependencies, users, cycles, milestones, filterParams]
  );

  // Update URL search parameters safely
  const updateFilters = useCallback(
    (updates: Partial<ProjectIssuesFilterParams>) => {
      const next = new URLSearchParams(searchParams);
      for (const [key, val] of Object.entries(updates)) {
        const paramKey = key === 'assigneeId' ? 'assignee' : key === 'blockerFilter' ? 'blocker' : key === 'cycleId' ? 'cycle' : key;
        if (!val || val === 'ALL' || (key === 'sort' && val === 'manual') || (key === 'group' && val === 'none')) {
          next.delete(paramKey);
        } else {
          next.set(paramKey, val);
        }
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const clearFilters = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete('q');
    next.delete('state');
    next.delete('priority');
    next.delete('assignee');
    next.delete('blocker');
    next.delete('cycle');
    next.delete('sort');
    next.delete('group');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  // Saved Views State
  const [customSavedViews, setCustomSavedViews] = useState<SavedViewItem[]>([
    {
      id: 'active_work',
      name: 'Active Work',
      params: { state: 'IN_PROGRESS' },
    },
    {
      id: 'blocked_triage',
      name: 'Blocked Triage',
      params: { blockerFilter: 'BLOCKED_ONLY' },
    },
    {
      id: 'by_priority',
      name: 'Grouped by Priority',
      params: { group: 'priority', sort: 'priority' },
    },
  ]);

  const handleSaveView = (name: string) => {
    const newView: SavedViewItem = {
      id: `view_${Date.now()}`,
      name,
      params: { ...filterParams },
    };
    setCustomSavedViews(prev => [...prev, newView]);
  };

  const handleApplySavedView = (view: SavedViewItem) => {
    updateFilters(view.params);
  };

  // Focused issue index for keyboard J/K navigation
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const currentFocusedIssue = filteredIssues[focusedIndex] || filteredIssues[0];

  // Collapsed group state
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // Synchronize drawer key with ProjectContext
  useEffect(() => {
    if (drawerIssueKey) {
      const match = issues.find(i => i.key === drawerIssueKey || i.id === drawerIssueKey);
      if (match) setSelectedIssueId(match.id);
    }
  }, [drawerIssueKey, issues, setSelectedIssueId]);

  // Register keyboard shortcuts with KeyboardContext
  useEffect(() => {
    registerCanvasHandlers({
      onNext: () => {
        setFocusedIndex(prev => {
          const next = Math.min(prev + 1, filteredIssues.length - 1);
          const nextIssue = filteredIssues[next];
          if (nextIssue && drawerIssueKey) {
            navigateToAdjacentIssue(nextIssue.key);
          }
          return next;
        });
      },
      onPrev: () => {
        setFocusedIndex(prev => {
          const next = Math.max(prev - 1, 0);
          const nextIssue = filteredIssues[next];
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
    filteredIssues,
    currentFocusedIssue,
    drawerIssueKey,
    openDrawer,
    navigateToAdjacentIssue,
    toggleSelectIssue,
    registerCanvasHandlers,
  ]);

  const isAllSelected =
    filteredIssues.length > 0 && filteredIssues.every(i => selectedIssueIds.includes(i.id));
  const isSomeSelected =
    filteredIssues.some(i => selectedIssueIds.includes(i.id)) && !isAllSelected;

  const handleMasterToggle = () => {
    if (isAllSelected) {
      clearSelection();
    } else {
      // Select all visible filtered issues
      filteredIssues.forEach(i => {
        if (!selectedIssueIds.includes(i.id)) {
          toggleSelectIssue(i.id);
        }
      });
    }
  };

  const hasActiveFilters =
    Boolean(searchQuery) ||
    state !== 'ALL' ||
    priority !== 'ALL' ||
    assigneeId !== 'ALL' ||
    blockerFilter !== 'ALL' ||
    cycleId !== 'ALL' ||
    sort !== 'manual' ||
    group !== 'none';

  const usersMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-white select-none">
      {/* 1. Filter Toolbar */}
      <ProjectFilterToolbar
        filters={filterParams}
        onFilterChange={updateFilters}
        onClearFilters={clearFilters}
        users={users}
        cycles={cycles}
        savedViews={customSavedViews}
        onApplySavedView={handleApplySavedView}
        onSaveView={handleSaveView}
      />

      {/* 2. Main Issues Triage Table Canvas */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-white" tabIndex={0}>
        {totalProjectIssuesCount === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-10 h-10 rounded-full bg-[#f6f5f4] flex items-center justify-center mb-3 text-[#787671]">
              <List className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#1a1a1a] mb-1">No issues in this project yet</h3>
            <p className="text-xs text-[#787671] max-w-sm mb-4 leading-relaxed">
              Begin by creating the first issue for {project.name}.
            </p>
            <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
              Create First Issue
            </Button>
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <p className="text-xs text-[#787671] mb-3">
              No issues match your active search or filters.
            </p>
            <Button variant="secondary" size="sm" onClick={clearFilters}>
              Clear All Filters
            </Button>
          </div>
        ) : (
          <div>
            {/* Table Header */}
            <div className="flex items-center h-[28px] px-3 bg-[#fafaf9] border-b border-[#e5e3df] text-[11px] font-semibold text-[#787671] uppercase tracking-wider sticky top-0 z-20">
              <div className="w-5 shrink-0 flex items-center pr-1">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={el => {
                    if (el) el.indeterminate = isSomeSelected;
                  }}
                  onChange={handleMasterToggle}
                  className="w-3.5 h-3.5 rounded-[3px] border-[#c8c4be] text-[#5645d4] focus:ring-0 cursor-pointer"
                  title="Select all filtered issues (Cmd+A)"
                />
              </div>
              <div className="w-6 shrink-0 text-center">Pri</div>
              <div className="w-20 shrink-0">Key</div>
              <div className="flex-1 min-w-0 pr-3">Title</div>
              <div className="shrink-0 mr-3 w-28">Blocker Status</div>
              <div className="w-28 shrink-0">State</div>
              <div className="w-28 shrink-0 hidden md:block">Assignee</div>
              <div className="w-24 shrink-0 hidden lg:block text-right pr-2">Due Date</div>
            </div>

            {/* Groups & Rows */}
            {groupedIssues.map(groupItem => {
              const isCollapsed = Boolean(collapsedGroups[groupItem.id]);
              const showGroupHeader = group !== 'none';

              return (
                <div key={groupItem.id}>
                  {showGroupHeader && (
                    <div
                      onClick={() => toggleGroupCollapse(groupItem.id)}
                      className="flex items-center justify-between px-3 py-1.5 bg-[#f6f5f4] border-b border-[#e5e3df] text-xs cursor-pointer select-none group sticky top-[28px] z-10"
                    >
                      <div className="flex items-center gap-2">
                        <button
                          className="p-0.5 text-[#787671] group-hover:text-[#1a1a1a] transition-colors"
                          aria-label={isCollapsed ? 'Expand group' : 'Collapse group'}
                        >
                          {isCollapsed ? (
                            <ChevronRight className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <span className="font-bold text-[#1a1a1a]">{groupItem.title}</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#e5e3df] text-[#52504b]">
                          {groupItem.count}
                        </span>
                        {groupItem.subtitle && (
                          <span className="text-[11px] text-[#787671]">· {groupItem.subtitle}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {!isCollapsed &&
                    groupItem.issues.map(issue => {
                      const isSelected =
                        drawerIssueKey === issue.key ||
                        currentFocusedIssue?.id === issue.id;
                      const isMultiSelected = selectedIssueIds.includes(issue.id);
                      const blockerStatus = blockerStatusMap.get(issue.id);
                      const assignee = usersMap.get(issue.assigneeId || '');

                      return (
                        <div
                          key={issue.id}
                          onClick={() => {
                            const index = filteredIssues.findIndex(i => i.id === issue.id);
                            if (index !== -1) setFocusedIndex(index);
                            setSelectedIssueId(issue.id);
                            openDrawer(issue.key);
                          }}
                          className={`group relative flex items-center h-[34px] px-3 border-b border-[#e5e3df] text-xs cursor-pointer select-none transition-colors ${
                            isMultiSelected
                              ? 'bg-[#5645d4]/12'
                              : isSelected
                              ? 'bg-[#5645d4]/8 font-medium'
                              : 'hover:bg-[#f6f5f4] bg-white'
                          }`}
                        >
                          {/* Selection indicator bar */}
                          {isSelected && (
                            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#5645d4]" />
                          )}

                          {/* Multi-select Checkbox */}
                          <div
                            className="w-5 shrink-0 flex items-center justify-start pr-1"
                            onClick={e => {
                              e.stopPropagation();
                              toggleSelectIssue(issue.id, e.shiftKey);
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isMultiSelected}
                              onChange={() => {}}
                              className="w-3.5 h-3.5 rounded-[3px] border-[#c8c4be] text-[#5645d4] focus:ring-0 cursor-pointer"
                              aria-label={`Select ${issue.key}`}
                            />
                          </div>

                          {/* Priority */}
                          <div className="w-6 shrink-0 flex items-center justify-center">
                            <PriorityIcon priority={issue.priority} size="sm" />
                          </div>

                          {/* Issue Key */}
                          <div className="w-20 shrink-0 font-mono font-semibold text-[#5645d4] group-hover:underline">
                            {issue.key}
                          </div>

                          {/* Title */}
                          <div className="flex-1 min-w-0 pr-3 truncate flex items-center gap-2">
                            <span
                              className={`truncate ${
                                issue.state === 'CANCELLED'
                                  ? 'line-through text-[#a4a097]'
                                  : 'text-[#1a1a1a]'
                              }`}
                            >
                              {issue.title}
                            </span>
                          </div>

                          {/* Blocker & Dependency Badge */}
                          <div
                            className="shrink-0 mr-3 flex items-center"
                            onClick={e => e.stopPropagation()}
                          >
                            {blockerStatus && (
                              <BlockerBadge
                                status={blockerStatus}
                                onSelectIssue={id => openDrawer(id)}
                              />
                            )}
                          </div>

                          {/* State Pill */}
                          <div className="w-28 shrink-0 flex items-center">
                            <StatePill state={issue.state} size="sm" />
                          </div>

                          {/* Assignee */}
                          <div className="w-28 shrink-0 hidden md:flex items-center gap-1.5 truncate">
                            <Avatar user={assignee} size="xs" />
                            <span className="truncate text-[#787671]">
                              {assignee ? assignee.name.split(' ')[0] : '—'}
                            </span>
                          </div>

                          {/* Due Date */}
                          <div className="w-24 shrink-0 hidden lg:flex items-center justify-end gap-1 text-[11px] text-[#787671] pr-2">
                            {issue.dueDate ? (
                              <>
                                <Calendar className="w-3 h-3 text-[#a4a097]" />
                                <span>{issue.dueDate}</span>
                              </>
                            ) : (
                              <span className="text-[#c8c4be]">—</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
