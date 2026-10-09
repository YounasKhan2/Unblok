import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  CheckCircle2,
  Plus,
  Trash2,
  ExternalLink,
  ArrowRight,
  AlertTriangle,
  Search,
} from 'lucide-react';
import { Issue, Dependency } from '../../types';
import { useProject } from '../../context/ProjectContext';
import { isUpstreamActivelyBlocking } from '../../domain/lifecycle';
import { wouldCreateCycle } from '../../domain/dependency';
import { StatePill } from '../ui/StatePill';
import { PriorityIcon } from '../ui/PriorityIcon';

interface DependencyManagerProps {
  issue: Issue;
  isReadOnly?: boolean;
}

export const DependencyManager: React.FC<DependencyManagerProps> = ({
  issue,
  isReadOnly: propReadOnly,
}) => {
  const {
    issues,
    dependencies,
    addDependency,
    removeDependency,
    setSelectedIssueId,
    currentUser,
  } = useProject();

  const location = useLocation();
  const navigate = useNavigate();

  const isReadOnly = propReadOnly ?? (currentUser.role === 'OBSERVER');

  const [isAddingBlocker, setIsAddingBlocker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleIssueClick = (targetIssue: Issue) => {
    if (location.pathname.startsWith('/issues/')) {
      navigate(`/issues/${targetIssue.key}`);
    } else {
      setSelectedIssueId(targetIssue.id);
    }
  };

  const issuesMap = useMemo(() => new Map(issues.map(i => [i.id, i])), [issues]);

  // Upstream blockers (Issues that block this issue: upstream BLOCKS issue)
  const upstreamDependencies = useMemo(() => {
    return dependencies
      .filter(d => d.downstreamIssueId === issue.id)
      .map(dep => ({
        dependencyId: dep.id,
        issue: issuesMap.get(dep.upstreamIssueId),
      }))
      .filter(item => item.issue !== undefined) as { dependencyId: string; issue: Issue }[];
  }, [dependencies, issue.id, issuesMap]);

  // Downstream work (Issues that this issue blocks: issue BLOCKS downstream)
  const downstreamDependencies = useMemo(() => {
    return dependencies
      .filter(d => d.upstreamIssueId === issue.id)
      .map(dep => ({
        dependencyId: dep.id,
        issue: issuesMap.get(dep.downstreamIssueId),
      }))
      .filter(item => item.issue !== undefined) as { dependencyId: string; issue: Issue }[];
  }, [dependencies, issue.id, issuesMap]);

  const activeBlockers = upstreamDependencies.filter(u => isUpstreamActivelyBlocking(u.issue.state));
  const resolvedBlockers = upstreamDependencies.filter(u => !isUpstreamActivelyBlocking(u.issue.state));

  // Search results for adding a blocker
  const eligibleBlockerCandidates = useMemo(() => {
    if (!isAddingBlocker) return [];

    const existingUpstreamIds = new Set(upstreamDependencies.map(u => u.issue.id));

    return issues
      .filter(candidate => {
        // Can't block self
        if (candidate.id === issue.id) return false;
        // Can't duplicate existing upstream
        if (existingUpstreamIds.has(candidate.id)) return false;

        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return (
          candidate.key.toLowerCase().includes(q) ||
          candidate.title.toLowerCase().includes(q)
        );
      })
      .slice(0, 8);
  }, [isAddingBlocker, issues, issue.id, upstreamDependencies, searchTerm]);

  const handleSelectBlocker = (candidate: Issue) => {
    const success = addDependency(candidate.id, issue.id);
    if (success) {
      setIsAddingBlocker(false);
      setSearchTerm('');
    }
  };

  return (
    <div className="space-y-4 pt-2">
      {/* 1. Actively Blocked Warning Banner */}
      {activeBlockers.length > 0 && (
        <div className="p-3 bg-blocker/10 border border-blocker/30 rounded-lg">
          <div className="flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-blocker shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-blocker">
                Execution Blocked ({activeBlockers.length} Active Prerequisite{activeBlockers.length > 1 ? 's' : ''})
              </div>
              <p className="text-[11px] text-blocker/90 mt-0.5 leading-normal">
                This issue cannot transition to <span className="font-semibold">DONE</span> until all active upstream
                tasks are completed or cancelled.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Blocked By (Upstream) Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Blocked By (Upstream)
            </span>
            <span className="text-[11px] font-medium px-1.5 py-0.2 rounded-full bg-surface-muted text-text-secondary">
              {upstreamDependencies.length}
            </span>
          </div>

          {!isReadOnly && !isAddingBlocker && (
            <button
              onClick={() => setIsAddingBlocker(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:opacity-90 px-2 py-0.5 rounded hover:bg-accent/10 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Blocker</span>
            </button>
          )}
        </div>

        {/* Add Blocker Combobox */}
        {!isReadOnly && isAddingBlocker && (
          <div className="p-2.5 mb-3 bg-surface-subtle rounded-lg border border-border text-xs space-y-2 animate-in fade-in duration-100">
            <div className="flex items-center justify-between font-medium text-text-primary">
              <span>Select an issue that BLOCKS {issue.key}:</span>
              <button
                onClick={() => {
                  setIsAddingBlocker(false);
                  setSearchTerm('');
                }}
                className="text-[11px] text-text-muted hover:text-text-primary"
              >
                Cancel
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2 text-text-muted top-2" />
              <input
                type="text"
                autoFocus
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by issue key or title..."
                className="w-full pl-7 pr-3 py-1.5 text-xs bg-surface-base border border-border-strong rounded focus:outline-none focus:border-accent"
              />
            </div>

            <div className="max-h-40 overflow-y-auto space-y-1">
              {eligibleBlockerCandidates.length === 0 ? (
                <div className="py-2 text-center text-text-muted text-[11px]">
                  No matching issues found in workspace.
                </div>
              ) : (
                eligibleBlockerCandidates.map(candidate => {
                  // Pre-check cycle warning
                  const cycleCheck = wouldCreateCycle(candidate.id, issue.id, dependencies, issuesMap);

                  return (
                    <div
                      key={candidate.id}
                      onClick={() => !cycleCheck.hasCycle && handleSelectBlocker(candidate)}
                      className={`flex items-center justify-between p-1.5 rounded transition-colors ${
                        cycleCheck.hasCycle
                          ? 'opacity-60 bg-danger/10 border border-danger/20 cursor-not-allowed'
                          : 'hover:bg-surface-base hover:border-border border border-transparent cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate mr-2">
                        <PriorityIcon priority={candidate.priority} size="sm" />
                        <span className="font-mono font-semibold text-accent">{candidate.key}</span>
                        <span className="truncate text-text-secondary">{candidate.title}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {cycleCheck.hasCycle ? (
                          <span className="text-[10px] text-danger font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Cycle Risk
                          </span>
                        ) : (
                          <StatePill state={candidate.state} size="sm" showLabel={false} />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Existing Upstream Blockers List */}
        {upstreamDependencies.length === 0 ? (
          <div className="py-2.5 px-3 bg-surface-subtle rounded-lg border border-dashed border-border text-center text-xs text-text-muted">
            No blockers. This issue can proceed directly.
          </div>
        ) : (
          <div className="space-y-1.5">
            {upstreamDependencies.map(({ dependencyId, issue: blocker }) => {
              const isActive = isUpstreamActivelyBlocking(blocker.state);

              return (
                <div
                  key={dependencyId}
                  className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-colors ${
                    isActive
                      ? 'bg-blocker/10 border-blocker/30'
                      : 'bg-surface-subtle border-border opacity-80'
                  }`}
                >
                  <div
                    className="flex items-center gap-2 truncate mr-2 cursor-pointer group"
                    onClick={() => handleIssueClick(blocker)}
                  >
                    {isActive ? (
                      <ShieldAlert className="w-3.5 h-3.5 text-blocker shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                    )}
                    <span className="font-mono font-semibold text-accent group-hover:underline">
                      {blocker.key}
                    </span>
                    <span className="truncate text-text-secondary">{blocker.title}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <StatePill state={blocker.state} size="sm" />
                    {!isReadOnly && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          removeDependency(dependencyId);
                        }}
                        className="p-1 text-text-muted hover:text-danger rounded hover:bg-surface-base transition-colors cursor-pointer"
                        title="Remove dependency"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Blocks (Downstream) Section */}
      <div className="pt-2 border-t border-border">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Blocks (Downstream Work)
          </span>
          <span className="text-[11px] font-medium px-1.5 py-0.2 rounded-full bg-surface-muted text-text-secondary">
            {downstreamDependencies.length}
          </span>
        </div>

        {downstreamDependencies.length === 0 ? (
          <div className="py-2.5 px-3 bg-surface-subtle rounded-lg border border-dashed border-border text-center text-xs text-text-muted">
            Does not block any downstream tasks.
          </div>
        ) : (
          <div className="space-y-1.5">
            {downstreamDependencies.map(({ dependencyId, issue: downstream }) => (
              <div
                key={dependencyId}
                onClick={() => handleIssueClick(downstream)}
                className="flex items-center justify-between p-2 rounded-lg border border-border bg-surface-base hover:border-accent text-xs cursor-pointer group transition-colors"
              >
                <div className="flex items-center gap-2 truncate mr-2">
                  <ArrowRight className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span className="font-mono font-semibold text-accent group-hover:underline">
                    {downstream.key}
                  </span>
                  <span className="truncate text-text-secondary">{downstream.title}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <StatePill state={downstream.state} size="sm" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
