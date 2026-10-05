/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShellLayout } from '../layouts/AppShellLayout';
import { MyWorkPage } from '../../pages/my-work/MyWorkPage';
import { ProjectsDirectoryPage } from '../../pages/projects/ProjectsDirectoryPage';
import { ProjectContextLayout } from '../../features/projects/components/ProjectContextLayout';
import { ProjectOverviewPage } from '../../pages/projects/ProjectOverviewPage';
import { ProjectIssuesPage } from '../../pages/projects/ProjectIssuesPage';
import { ProjectBoardPage } from '../../pages/projects/ProjectBoardPage';
import { ProjectPlanningPage } from '../../pages/projects/ProjectPlanningPage';
import { ProjectSettingsPage } from '../../pages/projects/ProjectSettingsPage';
import { PlaceholderPage } from '../../pages/placeholder/PlaceholderPage';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShellLayout />}>
          {/* 1. Root redirect */}
          <Route path="/" element={<Navigate to="/my-work" replace />} />

          {/* 2. Primary UX-01 Page */}
          <Route path="/my-work" element={<MyWorkPage />} />

          {/* 3. Future Canonical Pages (Restrained Phase Placeholders) */}
          <Route
            path="/inbox"
            element={
              <PlaceholderPage
                pageTitle="Inbox"
                targetPhase="UX-04"
                description="Workspace inbox for team notifications, blocker updates, and assignments."
              />
            }
          />

          {/* Projects Space (UX-02 Fully Implemented) */}
          <Route path="/projects" element={<ProjectsDirectoryPage />} />
          <Route path="/projects/:projectKey" element={<ProjectContextLayout />}>
            <Route index element={<ProjectOverviewPage />} />
            <Route path="issues" element={<ProjectIssuesPage />} />
            <Route path="board" element={<ProjectBoardPage />} />
            <Route path="planning" element={<ProjectPlanningPage />} />
            <Route path="settings" element={<ProjectSettingsPage />} />
          </Route>

          {/* Issues Space */}
          <Route
            path="/issues/:issueKey"
            element={
              <PlaceholderPage
                pageTitle="Issue Detail"
                targetPhase="UX-03"
                description="Full-page issue view with dependency context, discussions, and audit history."
              />
            }
          />

          {/* Teams Space */}
          <Route
            path="/teams"
            element={
              <PlaceholderPage
                pageTitle="Teams Directory"
                targetPhase="UX-04"
                description="Engineering teams directory and ownership map."
              />
            }
          />
          <Route
            path="/teams/:teamKey"
            element={
              <PlaceholderPage
                pageTitle="Team Hub"
                targetPhase="UX-04"
                description="Team overview, active cycles, and owned projects."
              />
            }
          />

          {/* Planning Space */}
          <Route
            path="/cycles"
            element={
              <PlaceholderPage
                pageTitle="Delivery Cycles"
                targetPhase="UX-04"
                description="Delivery cycles and iteration schedules for engineering teams."
              />
            }
          />
          <Route
            path="/cycles/:cycleId"
            element={
              <PlaceholderPage
                pageTitle="Cycle Detail"
                targetPhase="UX-04"
                description="Team cycle execution view and issue progress."
              />
            }
          />
          <Route
            path="/milestones"
            element={
              <PlaceholderPage
                pageTitle="Strategic Milestones"
                targetPhase="UX-04"
                description="Strategic milestones and target release tracking."
              />
            }
          />
          <Route
            path="/milestones/:milestoneId"
            element={
              <PlaceholderPage
                pageTitle="Milestone Detail"
                targetPhase="UX-04"
                description="Milestone scope, progress rollups, and associated issues."
              />
            }
          />
          <Route
            path="/roadmap"
            element={
              <PlaceholderPage
                pageTitle="Schedule & Roadmap"
                targetPhase="UX-04"
                description="Timeline visualization across team schedules and milestones."
              />
            }
          />

          {/* Dependency Intelligence Space */}
          <Route
            path="/dependencies"
            element={
              <PlaceholderPage
                pageTitle="Dependency Intelligence"
                targetPhase="UX-04"
                description="Topological dependency visualization, active blockers, and delivery critical path."
              />
            }
          />

          {/* Insights Space */}
          <Route
            path="/insights"
            element={
              <PlaceholderPage
                pageTitle="Delivery Insights"
                targetPhase="UX-04"
                description="Delivery velocity metrics, blocker frequency, and cycle lead-time trends."
              />
            }
          />

          {/* Settings Space */}
          <Route path="/settings" element={<Navigate to="/settings/workspace" replace />} />
          <Route
            path="/settings/workspace"
            element={
              <PlaceholderPage
                pageTitle="Workspace Settings"
                targetPhase="UX-04"
                description="Workspace preferences and organization defaults."
              />
            }
          />
          <Route
            path="/settings/members"
            element={
              <PlaceholderPage
                pageTitle="Members & Permissions"
                targetPhase="UX-04"
                description="Workspace member directory and permission management."
              />
            }
          />
          <Route
            path="/settings/teams"
            element={
              <PlaceholderPage
                pageTitle="Team Management"
                targetPhase="UX-04"
                description="Engineering squad administration and team configurations."
              />
            }
          />
          <Route
            path="/settings/integrations"
            element={
              <PlaceholderPage
                pageTitle="Engineering Integrations"
                targetPhase="UX-04"
                description="Configure the engineering tools and external services connected to this workspace."
              />
            }
          />
          <Route
            path="/settings/preferences"
            element={
              <PlaceholderPage
                pageTitle="My Preferences"
                targetPhase="UX-04"
                description="Personal display, notification, and workflow preferences."
              />
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/my-work" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
