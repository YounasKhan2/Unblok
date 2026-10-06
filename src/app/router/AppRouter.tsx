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
import { IssueDetailPage } from '../../pages/issues/IssueDetailPage';
import { DependenciesPage } from '../../pages/dependencies/DependenciesPage';
import { CyclesPage } from '../../pages/cycles/CyclesPage';
import { CycleDetailPage } from '../../pages/cycles/CycleDetailPage';
import { MilestonesPage } from '../../pages/milestones/MilestonesPage';
import { MilestoneDetailPage } from '../../pages/milestones/MilestoneDetailPage';
import { RoadmapPage } from '../../pages/roadmap/RoadmapPage';
import { InboxPage } from '../../pages/inbox/InboxPage';
import { InsightsPage } from '../../pages/insights/InsightsPage';
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

          {/* 3. Canonical Inbox Page (UX-06) */}
          <Route path="/inbox" element={<InboxPage />} />

          {/* Projects Space (UX-02 Fully Implemented) */}
          <Route path="/projects" element={<ProjectsDirectoryPage />} />
          <Route path="/projects/:projectKey" element={<ProjectContextLayout />}>
            <Route index element={<ProjectOverviewPage />} />
            <Route path="issues" element={<ProjectIssuesPage />} />
            <Route path="board" element={<ProjectBoardPage />} />
            <Route path="planning" element={<ProjectPlanningPage />} />
            <Route path="settings" element={<ProjectSettingsPage />} />
          </Route>

          {/* Issues Space (UX-03 Real Canonical Page) */}
          <Route path="/issues/:issueKey" element={<IssueDetailPage />} />

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

          {/* Planning Space (UX-05 Canonical Implementation) */}
          <Route path="/cycles" element={<CyclesPage />} />
          <Route path="/cycles/:cycleId" element={<CycleDetailPage />} />
          <Route path="/milestones" element={<MilestonesPage />} />
          <Route path="/milestones/:milestoneId" element={<MilestoneDetailPage />} />
          <Route path="/roadmap" element={<RoadmapPage />} />

          {/* Dependency Intelligence Space (UX-04 Canonical Page) */}
          <Route path="/dependencies" element={<DependenciesPage />} />

          {/* Insights Space (UX-07 Canonical Destination) */}
          <Route path="/insights" element={<InsightsPage />} />

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
