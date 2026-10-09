/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext';
import { selectCycleDetail } from '../../features/planning/selectors/cycleSelectors';
import { CycleProgressBadge } from '../../features/planning/components/cycles/CycleProgressBadge';
import { AddIssueToCycleModal } from '../../features/planning/components/cycles/AddIssueToCycleModal';
import { CompleteCycleRolloverModal } from '../../features/planning/components/cycles/CompleteCycleRolloverModal';
import { StatePill } from '../../components/ui/StatePill';
import { PriorityIcon } from '../../components/ui/PriorityIcon';
import { BlockerBadge } from '../../components/ui/BlockerBadge';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { useDrawerRoute } from '../../app/router/useDrawerRoute';
import { canMutatePlanning } from '../../features/planning/permissions';
import { Issue, IssueState } from '../../types';
import {
  Clock,
  Calendar,
  Plus,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  List as ListIcon,
  Kanban,
  X,
  ShieldAlert,
} from 'lucide-react';

export const CycleDetailPage: React.FC = () => {
  const { cycleId } = useParams<{ cycleId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { cycles, issues, dependencies, teams, projects, users, updateIssueCycle, getIssueBlockerStatus, currentUser } =
    useProject();

  const { openDrawer } = useDrawerRoute();
  const isObserver = !canMutatePlanning(currentUser.role);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRolloverModalOpen, setIsRolloverModalOpen] = useState(false);

  // Tab: List or Board
  const activeTab = searchParams.get('tab') === 'board' ? 'board' : 'list';

  const handleTabChange = (tab: 'list' | 'board') => {
    const next = new URLSearchParams(searchParams);
    if (tab === 'list') {
      next.delete('tab');
    } else {
      next.set('tab', tab);
    }
    setSearchParams(next, { replace: true });
  };

  const cycleDetail = useMemo(() => {
    if (!cycleId) return null;
    return selectCycleDetail(cycleId, cycles, issues, dependencies, teams, projects);
  }, [cycleId, cycles, issues, dependencies, teams, projects]);

  const usersMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);
  const projectsMap = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);

  // Section 24: Explicit Cycle Not Found UI
  if (!cycleDetail) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-surface-base select-none">
        <div className="w-12 h-12 rounded-full bg-surface-muted flex items-center justify-center mb-4 text-text-muted">
          <Clock className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-text-primary mb-1">Cycle Not Found</h2>
        <p className="text-xs text-text-muted max-w-sm mb-6">
          The cycle with identifier <span className="font-mono text-text-primary">{cycleId}</span> does not exist or has been removed from this workspace.
        </p>
        <Link
          to="/cycles"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[6px] bg-accent text-white text-xs font-semibold hover:bg-accent/90 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Cycles Directory</span>
        </Link>
      </div>
    );
  }

  const { cycle, team, progress, cycleIssues } = cycleDetail;

  const handleUnschedule = (issueId: string) => {
    if (isObserver) return;
    updateIssueCycle(issueId, undefined);
  };

  // Group issues by state for Board view
  const boardColumns: { state: IssueState; title: string }[] = [
    { state: 'BACKLOG', title: 'Backlog' },
    { state: 'TODO', title: 'To Do' },
    { state: 'IN_PROGRESS', title: 'In Progress' },
    { state: 'IN_REVIEW', title: 'In Review' },
    { state: 'DONE', title: 'Done' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-surface-subtle overflow-hidden select-none">
      {/* 1. Header */}
      <div className="bg-surface-base border-b border-border px-6 py-4 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-start gap-3">
            <Link
              to="/cycles"
              className="p-1 text-text-muted hover:text-text-primary rounded hover:bg-surface-muted mt-0.5 transition-colors"
              title="Back to cycles directory"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span
                  className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-wider border ${
                    cycle.status === 'ACTIVE'
                      ? 'bg-accent/10 text-accent border-accent/30'
                      : cycle.status === 'COMPLETED'
                      ? 'bg-success/10 text-success border-success/30'
                      : 'bg-surface-muted text-text-secondary border-border'
                  }`}
                >
                  {cycle.status}
                </span>

                {team && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[11px] font-semibold bg-surface-muted text-text-secondary border border-border">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: team.color }}
                    />
                    <span>{team.name}</span>
                    <span className="font-mono text-text-muted">({team.key})</span>
                  </span>
                )}

                <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                  <Calendar className="w-3.5 h-3.5 text-text-muted" />
                  <span>
                    {cycle.startDate} → {cycle.endDate}
                  </span>
                </span>
              </div>

              <h1 className="text-lg font-bold text-text-primary">{cycle.name}</h1>
              {cycle.description && (
                <p className="text-xs text-text-muted mt-0.5">{cycle.description}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {!isObserver && (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsAddModalOpen(true)}
                  icon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add Tasks
                </Button>

                {cycle.status !== 'COMPLETED' && (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setIsRolloverModalOpen(true)}
                    icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  >
                    Complete & Rollover
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Operational Progress Summary Bar */}
        <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-xs">
            <div>
              <span className="text-text-muted">Total: </span>
              <span className="font-bold text-text-primary">{progress.total}</span>
            </div>
            <div>
              <span className="text-text-muted">Completed: </span>
              <span className="font-bold text-success">{progress.completed}</span>
            </div>
            <div>
              <span className="text-text-muted">Remaining: </span>
              <span className="font-bold text-text-primary">{progress.remaining}</span>
            </div>
            {progress.blocked > 0 && (
              <div className="inline-flex items-center gap-1 text-danger font-semibold">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{progress.blocked} Blocked</span>
              </div>
            )}
          </div>

          <div className="w-48">
            <CycleProgressBadge progress={progress} />
          </div>
        </div>
      </div>

      {/* 2. View Switcher Toolbar (List vs Board) */}
      <div className="px-6 py-2 bg-surface-base border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1 p-0.5 rounded-[6px] bg-surface-muted border border-border">
          <button
            type="button"
            onClick={() => handleTabChange('list')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'list'
                ? 'bg-surface-base text-text-primary shadow-2xs border border-border'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <ListIcon className="w-3.5 h-3.5" />
            <span>List</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('board')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'board'
                ? 'bg-surface-base text-text-primary shadow-2xs border border-border'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Board</span>
          </button>
        </div>

        <span className="text-xs text-text-muted">
          {cycleIssues.length} tasks assigned to this cycle
        </span>
      </div>

      {/* 3. Main Execution Canvas */}
      <div className="flex-1 overflow-y-auto p-6">
        {cycleIssues.length === 0 ? (
          <div className="p-12 text-center bg-surface-base border border-border rounded-lg text-xs text-text-muted">
            <Clock className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-50" />
            <p className="font-semibold text-text-primary mb-1">No tasks in this cycle</p>
            <p className="mb-4">Allocate tasks from team projects to begin execution.</p>
            {!isObserver && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsAddModalOpen(true)}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Tasks to Cycle
              </Button>
            )}
          </div>
        ) : activeTab === 'list' ? (
          /* List View */
          <div className="bg-surface-base border border-border rounded-lg overflow-hidden divide-y divide-border">
            {cycleIssues.map(issue => {
              const blocker = getIssueBlockerStatus(issue.id);
              const assignee = usersMap.get(issue.assigneeId || '');
              const project = projectsMap.get(issue.projectId);

              return (
                <div
                  key={issue.id}
                  onClick={() => openDrawer(issue.key)}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-surface-muted/50 transition-colors text-xs cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <PriorityIcon priority={issue.priority} size="sm" />
                    <span className="font-mono text-accent font-semibold group-hover:underline">
                      {issue.key}
                    </span>
                    <span className="truncate font-medium text-text-primary">
                      {issue.title}
                    </span>
                    {project && (
                      <span className="text-[10px] text-text-muted px-1.5 py-0.2 rounded bg-surface-muted border border-border shrink-0">
                        {project.name}
                      </span>
                    )}
                  </div>

                  <div
                    className="flex items-center gap-3 shrink-0"
                    onClick={e => e.stopPropagation()}
                  >
                    <BlockerBadge status={blocker} onSelectIssue={openDrawer} />
                    <StatePill state={issue.state} size="sm" />
                    {assignee ? (
                      <Avatar user={assignee} size="sm" />
                    ) : (
                      <span className="text-[11px] text-text-muted">—</span>
                    )}

                    {!isObserver && (
                      <button
                        type="button"
                        onClick={() => handleUnschedule(issue.id)}
                        className="text-text-muted hover:text-danger p-1 rounded transition-colors cursor-pointer"
                        title="Remove task from cycle (unschedule to backlog)"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Board View */
          <div className="flex gap-4 overflow-x-auto pb-4 h-full">
            {boardColumns.map(col => {
              const colIssues = cycleIssues.filter(i => i.state === col.state);

              return (
                <div
                  key={col.state}
                  className="w-72 shrink-0 bg-surface-base border border-border rounded-lg flex flex-col max-h-full"
                >
                  {/* Column Header */}
                  <div className="p-3 bg-surface-subtle border-b border-border flex items-center justify-between">
                    <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                      {col.title}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-surface-muted border border-border text-text-secondary">
                      {colIssues.length}
                    </span>
                  </div>

                  {/* Column Cards */}
                  <div className="p-2 space-y-2 flex-1 overflow-y-auto">
                    {colIssues.map(issue => {
                      const blocker = getIssueBlockerStatus(issue.id);
                      const assignee = usersMap.get(issue.assigneeId || '');

                      return (
                        <div
                          key={issue.id}
                          onClick={() => openDrawer(issue.key)}
                          className="p-3 bg-surface-base border border-border rounded-md shadow-2xs hover:border-accent hover:shadow-xs transition-all cursor-pointer group"
                        >
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <span className="font-mono text-xs font-semibold text-accent group-hover:underline">
                              {issue.key}
                            </span>
                            <PriorityIcon priority={issue.priority} size="sm" />
                          </div>

                          <h4 className="text-xs font-medium text-text-primary line-clamp-2 mb-2">
                            {issue.title}
                          </h4>

                          <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[11px]">
                            <BlockerBadge status={blocker} compact={true} onSelectIssue={openDrawer} />
                            {assignee && (
                              <Avatar user={assignee} size="xs" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Issue Modal */}
      <AddIssueToCycleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        cycle={cycle}
      />

      {/* Complete Cycle & Rollover Modal */}
      <CompleteCycleRolloverModal
        isOpen={isRolloverModalOpen}
        onClose={() => setIsRolloverModalOpen(false)}
        cycle={cycle}
      />
    </div>
  );
};
