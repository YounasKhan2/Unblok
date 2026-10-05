/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShellLayout } from '../layouts/AppShellLayout';
import { MyWorkPage } from '../../pages/my-work/MyWorkPage';
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
                description="High-signal collaboration inbox collecting mentions, blocker resolutions, and cycle updates."
              />
            }
          />

          {/* Projects Space */}
          <Route
            path="/projects"
            element={
              <PlaceholderPage
                pageTitle="Projects Directory"
                targetPhase="UX-02"
                description="Workspace directory of all engineering projects, team ownership, and delivery health."
              />
            }
          />
          <Route
            path="/projects/:projectKey"
            element={
              <PlaceholderPage
                pageTitle="Project Overview"
                targetPhase="UX-02"
                description="Project executive dashboard, delivery progress snapshot, and active blockers."
              />
            }
          />
          <Route
            path="/projects/:projectKey/issues"
            element={
              <PlaceholderPage
                pageTitle="Project Issues"
                targetPhase="UX-02"
                description="High-density tabular triage list of all issues belonging to this project."
              />
            }
          />
          <Route
            path="/projects/:projectKey/board"
            element={
              <PlaceholderPage
                pageTitle="Project Board"
                targetPhase="UX-02"
                description="Kanban board visualization with completion guard enforcement."
              />
            }
          />
          <Route
            path="/projects/:projectKey/planning"
            element={
              <PlaceholderPage
                pageTitle="Project Planning"
                targetPhase="UX-02"
                description="Sprint cycle and milestone allocation specifically for this project."
              />
            }
          />
          <Route
            path="/projects/:projectKey/settings"
            element={
              <PlaceholderPage
                pageTitle="Project Settings"
                targetPhase="UX-02"
                description="Project configuration, key management, and danger zone."
              />
            }
          />

          {/* Issues Space */}
          <Route
            path="/issues/:issueKey"
            element={
              <PlaceholderPage
                pageTitle="Issue Detail"
                targetPhase="UX-03"
                description="Canonical full-screen issue destination with multi-hop dependencies and full audit trail."
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
                description="Workspace team directory displaying all squads, lead engineers, and active projects."
              />
            }
          />
          <Route
            path="/teams/:teamKey"
            element={
              <PlaceholderPage
                pageTitle="Team Hub"
                targetPhase="UX-04"
                description="Dedicated team hub presenting squad members, owned projects, and cross-team dependencies."
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
                description="Team sprint cadences, active cycles, and rollover velocity."
              />
            }
          />
          <Route
            path="/cycles/:cycleId"
            element={
              <PlaceholderPage
                pageTitle="Cycle Detail"
                targetPhase="UX-04"
                description="Detailed sprint execution view and 1-click rollover."
              />
            }
          />
          <Route
            path="/milestones"
            element={
              <PlaceholderPage
                pageTitle="Strategic Milestones"
                targetPhase="UX-04"
                description="Directory of organizational release targets and aggregate health rollups."
              />
            }
          />
          <Route
            path="/milestones/:milestoneId"
            element={
              <PlaceholderPage
                pageTitle="Milestone Detail"
                targetPhase="UX-04"
                description="Deep-dive milestone tracking and critical path blocker trees."
              />
            }
          />
          <Route
            path="/roadmap"
            element={
              <PlaceholderPage
                pageTitle="Schedule & Roadmap"
                targetPhase="UX-04"
                description="Multi-week timeline schedule and team capacity distribution."
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
                description="Topological DAG graph canvas, bottleneck heatmap, and active blocker queue."
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
                description="Blocker aging velocity, cycle lead times, and cross-team blast radius metrics."
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
                description="Organization settings, tenant configuration, and workflow definitions."
              />
            }
          />
          <Route
            path="/settings/members"
            element={
              <PlaceholderPage
                pageTitle="Members & Permissions"
                targetPhase="UX-04"
                description="Workspace member directory and role-based access control."
              />
            }
          />
          <Route
            path="/settings/teams"
            element={
              <PlaceholderPage
                pageTitle="Team Management"
                targetPhase="UX-04"
                description="Squad administration, team keys, and member rosters."
              />
            }
          />
          <Route
            path="/settings/integrations"
            element={
              <PlaceholderPage
                pageTitle="Engineering Integrations"
                targetPhase="UX-04"
                description="Repository connections, webhook dispatch, and notification channels."
              />
            }
          />
          <Route
            path="/settings/preferences"
            element={
              <PlaceholderPage
                pageTitle="My Preferences"
                targetPhase="UX-04"
                description="Personal density, appearance theme, and personal notification rules."
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
