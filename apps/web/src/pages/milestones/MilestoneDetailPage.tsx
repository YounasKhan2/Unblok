/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext';
import { selectMilestoneDetail } from '../../features/planning/selectors/milestoneSelectors';
import { MilestoneHealthBadge } from '../../features/planning/components/milestones/MilestoneHealthBadge';
import { MilestoneRiskPanel } from '../../features/planning/components/milestones/MilestoneRiskPanel';
import { MilestoneDependencyView } from '../../features/planning/components/milestones/MilestoneDependencyView';
import { EditMilestoneModal } from '../../features/planning/components/milestones/EditMilestoneModal';
import { LinkMilestoneIssuesModal } from '../../features/planning/components/milestones/LinkMilestoneIssuesModal';
import { StatePill } from '../../components/ui/StatePill';
import { PriorityIcon } from '../../components/ui/PriorityIcon';
import { BlockerBadge } from '../../components/ui/BlockerBadge';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { useDrawerRoute } from '../../app/router/useDrawerRoute';
import { canMutatePlanning } from '../../features/planning/permissions';
import {
  Target,
  Calendar,
  Plus,
  Edit2,
  ArrowLeft,
  List as ListIcon,
  Network,
  ShieldAlert,
  AlertTriangle,
  X,
  Users,
  FolderKanban,
} from 'lucide-react';

export const MilestoneDetailPage: React.FC = () => {
  const { milestoneId } = useParams<{ milestoneId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    milestones,
    issues,
    dependencies,
    projects,
    teams,
    users,
    updateIssueMilestone,
    getIssueBlockerStatus,
    currentUser,
  } = useProject();

  const { openDrawer } = useDrawerRoute();
  const isObserver = !canMutatePlanning(currentUser.role);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  // Tab: 'issues' | 'graph' | 'risk'
  const activeTab = (searchParams.get('tab') || 'issues') as 'issues' | 'graph' | 'risk';

  const handleTabChange = (tab: 'issues' | 'graph' | 'risk') => {
    const next = new URLSearchParams(searchParams);
    if (tab === 'issues') {
      next.delete('tab');
    } else {
      next.set('tab', tab);
    }
    setSearchParams(next, { replace: true });
  };

  const detail = useMemo(() => {
    if (!milestoneId) return null;
    return selectMilestoneDetail(milestoneId, milestones, issues, dependencies, projects, teams);
  }, [milestoneId, milestones, issues, dependencies, projects, teams]);

  const usersMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);
  const projectsMap = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);
  const teamsMap = useMemo(() => new Map(teams.map(t => [t.id, t])), [teams]);

  // Section 38: Explicit Milestone Not Found UI
  if (!detail) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-surface-base select-none">
        <div className="w-12 h-12 rounded-full bg-surface-muted flex items-center justify-center mb-4 text-text-muted">
          <Target className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-text-primary mb-1">Milestone Not Found</h2>
        <p className="text-xs text-text-muted max-w-sm mb-6">
          The strategic milestone with identifier <span className="font-mono text-text-primary">{milestoneId}</span> does not exist or has been removed.
        </p>
        <Link
          to="/milestones"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[6px] bg-accent text-white text-xs font-semibold hover:bg-accent/90 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Milestones Directory</span>
        </Link>
      </div>
    );
  }

  const { summary, graphLayout } = detail;
  const { milestone, health, isCompleted, progress, contributingTeams, contributingProjects } =
    summary;

  const handleUnlink = (issueId: string) => {
    if (isObserver) return;
    updateIssueMilestone(issueId, undefined);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-surface-subtle overflow-hidden select-none">
      {/* 1. Header */}
      <div className="bg-surface-base border-b border-border px-6 py-4 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-start gap-3">
            <Link
              to="/milestones"
              className="p-1 text-text-muted hover:text-text-primary rounded hover:bg-surface-muted mt-0.5 transition-colors"
              title="Back to milestones directory"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <MilestoneHealthBadge
                  health={health}
                  isCompleted={isCompleted}
                  size="sm"
                />

                <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                  <Calendar className="w-3.5 h-3.5 text-text-muted" />
                  <span>Target Date: {milestone.targetDate}</span>
                </span>
              </div>

              <h1 className="text-lg font-bold text-text-primary">{milestone.name}</h1>
              {milestone.description && (
                <p className="text-xs text-text-muted mt-0.5">{milestone.description}</p>
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
                  onClick={() => setIsEditModalOpen(true)}
                  icon={<Edit2 className="w-3.5 h-3.5" />}
                >
                  Edit
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setIsLinkModalOpen(true)}
                  icon={<Plus className="w-3.5 h-3.5" />}
                >
                  Link Tasks
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Milestone Operational Rollup Bar */}
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
            <div className="text-text-muted">
              {progress.daysRemaining} days left
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-text-primary font-mono">
              {progress.percent}% Completed
            </span>
          </div>
        </div>
      </div>

      {/* 2. Detail View Switcher Tabs (Section 31: Issues, Dependency Graph, Delivery Risk) */}
      <div className="px-6 py-2 bg-surface-base border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1 p-0.5 rounded-[6px] bg-surface-muted border border-border">
          <button
            type="button"
            onClick={() => handleTabChange('issues')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'issues'
                ? 'bg-surface-base text-text-primary shadow-2xs border border-border'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <ListIcon className="w-3.5 h-3.5" />
            <span>Tasks ({summary.issues.length})</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('graph')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'graph'
                ? 'bg-surface-base text-text-primary shadow-2xs border border-border'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Dependency Graph</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('risk')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'risk'
                ? 'bg-surface-base text-text-primary shadow-2xs border border-border'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Delivery Risk</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span>{contributingTeams.length} contributing teams</span>
          <span>·</span>
          <span>{contributingProjects.length} projects</span>
        </div>
      </div>

      {/* 3. Main Body Canvas */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'issues' && (
          <div className="bg-surface-base border border-border rounded-lg overflow-hidden divide-y divide-border">
            {summary.issues.length === 0 ? (
              <div className="p-12 text-center text-xs text-text-muted">
                <Target className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-50" />
                <p className="font-semibold text-text-primary mb-1">No tasks linked yet</p>
                <p className="mb-4">Link cross-team tasks to track milestone deliverables.</p>
                {!isObserver && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsLinkModalOpen(true)}
                    icon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Link Tasks
                  </Button>
                )}
              </div>
            ) : (
              summary.issues.map(issue => {
                const blocker = getIssueBlockerStatus(issue.id);
                const assignee = usersMap.get(issue.assigneeId || '');
                const project = projectsMap.get(issue.projectId);
                const team = teamsMap.get(issue.teamId);

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

                      {team && (
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: team.color }}
                          title={team.name}
                        />
                      )}

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
                          onClick={() => handleUnlink(issue.id)}
                          className="text-text-muted hover:text-danger p-1 rounded transition-colors cursor-pointer"
                          title="Unlink task from milestone"
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

        {activeTab === 'graph' && (
          <MilestoneDependencyView layout={graphLayout} />
        )}

        {activeTab === 'risk' && (
          <MilestoneRiskPanel summary={summary} />
        )}
      </div>

      {/* Edit Milestone Modal */}
      <EditMilestoneModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        milestone={milestone}
      />

      {/* Link Issues Modal */}
      <LinkMilestoneIssuesModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        milestone={milestone}
      />
    </div>
  );
};
