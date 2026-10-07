/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { selectIssueDetail } from '../../features/issues/selectors';
import { IssueBreadcrumbHeader } from '../../features/issues/components/IssueBreadcrumbHeader';
import { IssueTitleEditor } from '../../features/issues/components/IssueTitleEditor';
import { IssueDescription } from '../../features/issues/components/IssueDescription';
import { IssueMetadataSidebar } from '../../features/issues/components/IssueMetadataSidebar';
import { IssueContentTabs } from '../../features/issues/components/IssueContentTabs';

export const IssueDetailPage: React.FC = () => {
  const { issueKey } = useParams<{ issueKey: string }>();

  const {
    issues,
    dependencies,
    projects,
    teams,
    users,
    cycles,
    milestones,
    comments,
    activities,
    currentUser,
    updateIssueDetails,
    setSelectedIssueId,
  } = useProject();

  const [mobilePropsExpanded, setMobilePropsExpanded] = useState(false);

  // Pure deterministic selector for all authoritative issue state
  const issueData = useMemo(() => {
    return selectIssueDetail(
      issueKey,
      issues,
      dependencies,
      projects,
      teams,
      users,
      cycles,
      milestones,
      comments,
      activities
    );
  }, [
    issueKey,
    issues,
    dependencies,
    projects,
    teams,
    users,
    cycles,
    milestones,
    comments,
    activities,
  ]);

  // Sync selectedIssueId with active issue
  useEffect(() => {
    if (issueData?.issue) {
      setSelectedIssueId(issueData.issue.id);
      document.title = `${issueData.issue.key}: ${issueData.issue.title} — Unblok`;
    } else {
      document.title = 'Issue Not Found — Unblok';
    }
  }, [issueData?.issue, setSelectedIssueId]);

  // Observer role check
  const isReadOnly = currentUser.role === 'OBSERVER';

  // 1. Invalid / Not Found State
  if (!issueData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface-base text-center">
        <div className="w-14 h-14 rounded-2xl bg-warning/10 border border-warning/30 flex items-center justify-center text-warning mb-4 shadow-sm">
          <AlertCircle className="w-7 h-7" />
        </div>

        <h1 className="text-xl font-bold text-text-primary mb-2">Issue not found</h1>
        <p className="text-sm text-text-muted max-w-md mb-6 leading-relaxed">
          The requested issue <span className="font-mono font-semibold text-text-primary">{issueKey || ''}</span> does
          not exist or you do not have permission to view it in this workspace.
        </p>

        <Link
          to="/my-work"
          className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:opacity-90 text-white text-xs font-semibold rounded-lg shadow-sm transition-opacity cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to My Work</span>
        </Link>
      </div>
    );
  }

  const {
    issue,
    project,
    team,
    blockerStatus,
    upstreamDependencies,
    downstreamDependencies,
    comments: issueComments,
    activities: issueActivities,
  } = issueData;

  const handleSaveTitle = (newTitle: string) => {
    updateIssueDetails(issue.id, newTitle, issue.description);
  };

  const handleSaveDescription = (newDescription: string) => {
    updateIssueDetails(issue.id, issue.title, newDescription);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-surface-base">
      {/* 1. Breadcrumb Header */}
      <IssueBreadcrumbHeader
        issue={issue}
        project={project}
        team={team}
        blockerStatus={blockerStatus}
      />

      {/* 2. Main Scrollable Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Active Blocker Alert Banner */}
          {blockerStatus.activeCount > 0 && (
            <div className="mb-6 p-3.5 bg-blocker/10 border border-blocker/30 rounded-lg animate-in fade-in duration-150">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-blocker shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-blocker">
                    Execution Blocked ({blockerStatus.activeCount} Active Prerequisite{blockerStatus.activeCount > 1 ? 's' : ''})
                  </div>
                  <p className="text-[11px] text-blocker/90 mt-0.5 leading-relaxed">
                    This issue cannot transition to <span className="font-semibold">DONE</span> until all active upstream
                    tasks are completed or cancelled.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {blockerStatus.activeBlockers.map(b => (
                      <Link
                        key={b.id}
                        to={`/issues/${b.key}`}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-base/80 border border-blocker/30 text-[11px] font-medium text-blocker hover:bg-surface-base transition-colors"
                      >
                        <span className="font-mono font-bold text-accent">{b.key}</span>
                        <span className="truncate max-w-[200px]">{b.title}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Two-Column Deep-Work Layout (Desktop ~65% / ~35%, Tablet/Mobile responsive) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Title, Description, Subsections (~65% / 8 cols) */}
            <div className="lg:col-span-8 space-y-6 min-w-0">
              {/* Editable Title */}
              <IssueTitleEditor
                title={issue.title}
                isReadOnly={isReadOnly}
                onSave={handleSaveTitle}
              />

              {/* Mobile Properties Dropdown (Visible only below lg screen) */}
              <div className="lg:hidden border border-border rounded-lg bg-surface-subtle overflow-hidden">
                <button
                  type="button"
                  onClick={() => setMobilePropsExpanded(!mobilePropsExpanded)}
                  className="w-full flex items-center justify-between p-3 text-xs font-semibold text-text-primary cursor-pointer"
                >
                  <span className="uppercase tracking-wider text-text-muted">Properties</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-accent font-medium">
                      {issue.state} · {issue.priority}
                    </span>
                    {mobilePropsExpanded ? (
                      <ChevronUp className="w-4 h-4 text-text-muted" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-text-muted" />
                    )}
                  </div>
                </button>

                {mobilePropsExpanded && (
                  <div className="p-3 pt-0 border-t border-border">
                    <IssueMetadataSidebar
                      issue={issue}
                      project={project}
                      team={team}
                      isReadOnly={isReadOnly}
                    />
                  </div>
                )}
              </div>

              {/* Markdown Description */}
              <IssueDescription
                description={issue.description}
                isReadOnly={isReadOnly}
                onSave={handleSaveDescription}
              />

              {/* Deep Work Content Subsections (Discussion | Dependencies | Activity) */}
              <div className="pt-4 border-t border-border">
                <IssueContentTabs
                  issue={issue}
                  upstreamDependencies={upstreamDependencies}
                  downstreamDependencies={downstreamDependencies}
                  activeBlockerCount={blockerStatus.activeCount}
                  commentCount={issueComments.length}
                  activityCount={issueActivities.length}
                  isReadOnly={isReadOnly}
                />
              </div>
            </div>

            {/* Right Column: Persistent Metadata Sidebar on Desktop (~35% / 4 cols) */}
            <div className="hidden lg:block lg:col-span-4 sticky top-6">
              <IssueMetadataSidebar
                issue={issue}
                project={project}
                team={team}
                isReadOnly={isReadOnly}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
