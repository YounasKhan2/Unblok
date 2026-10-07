/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { useParams, NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  List,
  Kanban,
  Calendar,
  Settings,
  Plus,
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useProject } from '../../../context/ProjectContext';
import { useKeyboard } from '../../../context/KeyboardContext';
import { resolveProject, selectProjectOverview } from '../selectors';
import { Button } from '../../../components/ui/Button';
import { PrivateNotFoundPage } from '../../../pages/placeholder/PrivateNotFoundPage';

export const ProjectContextLayout: React.FC = () => {
  const { projectKey } = useParams<{ projectKey: string }>();
  const navigate = useNavigate();
  const {
    projects,
    teams,
    issues,
    dependencies,
    users,
    cycles,
    milestones,
    activities: activityEvents,
  } = useProject();

  const { setIsCreateModalOpen } = useKeyboard();

  const project = useMemo(() => resolveProject(projects, projectKey), [projects, projectKey]);
  const team = useMemo(() => teams.find(t => t.id === project?.teamId), [teams, project]);

  const overviewData = useMemo(() => {
    if (!project) return null;
    return selectProjectOverview(
      project,
      issues,
      dependencies,
      users,
      cycles,
      milestones,
      activityEvents
    );
  }, [project, issues, dependencies, users, cycles, milestones, activityEvents]);

  if (!project) {
    return <PrivateNotFoundPage />;
  }

  const { summary } = overviewData!;

  const navTabs = [
    { to: `/projects/${project.key}`, label: 'Overview', end: true },
    { to: `/projects/${project.key}/issues`, label: 'Issues', end: false },
    { to: `/projects/${project.key}/board`, label: 'Board', end: false },
    { to: `/projects/${project.key}/planning`, label: 'Planning', end: false },
    { to: `/projects/${project.key}/settings`, label: 'Settings', end: false },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-canvas">
      {/* 1. Project Context Header (Ultra-compact, non-hero, high density) */}
      <div className="border-b border-border bg-surface-base px-4 pt-2 pb-0 shrink-0 select-none">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          {/* Identity & Team ownership */}
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              to="/projects"
              className="text-text-muted hover:text-text-primary transition-colors p-1 rounded hover:bg-surface-muted"
              title="Back to all projects"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>

            <div className="flex items-center gap-2 truncate">
              <h1 className="text-sm font-bold text-text-primary tracking-tight truncate">
                {project.name}
              </h1>
              <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-surface-muted text-accent border border-border shrink-0">
                {project.key}
              </span>
            </div>

            {team && (
              <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-border text-xs text-text-muted shrink-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: team.color || 'var(--color-accent)' }}
                />
                <span className="truncate">{team.name}</span>
              </div>
            )}
          </div>

          {/* Quick Execution Signals & Actions */}
          <div className="flex items-center gap-2.5 text-xs">
            {/* Active issues signal */}
            <span className="text-xs text-text-muted hidden md:inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-accent" />
              <strong>{summary.activeIssues}</strong> active
            </span>

            {/* Blocked alert signal */}
            {summary.blockedIssues > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-danger-subtle border border-danger/30 text-danger font-semibold text-xs">
                <ShieldAlert className="w-3.5 h-3.5 text-danger" />
                <span>{summary.blockedIssues} blocked</span>
              </span>
            )}

            {/* Done signal */}
            <span className="text-xs text-text-muted hidden lg:inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              <span>{summary.completedIssues} done</span>
            </span>

            {/* Create Issue CTA in current project */}
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setIsCreateModalOpen(true)}
              className="font-semibold shadow-2xs ml-1"
            >
              <span>New Issue</span>
              <kbd className="hidden sm:inline-block ml-1 font-mono text-[9px] bg-white/20 px-1 py-0.2 rounded text-white">
                C
              </kbd>
            </Button>
          </div>
        </div>

        {/* 2. Route-Driven Project Navigation Sub-Tabs */}
        <nav
          className="flex items-center gap-1 text-xs border-t border-border pt-0.5 -mb-px overflow-x-auto"
          aria-label="Project Sub Navigation"
        >
          {navTabs.map(tab => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `px-3 py-1.5 font-medium transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-accent text-text-primary font-semibold'
                    : 'border-transparent text-text-muted hover:text-text-primary hover:border-border-strong'
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* 3. Sub-route Execution Surface */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Outlet context={{ project, team, overviewData }} />
      </div>
    </div>
  );
};
