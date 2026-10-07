/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { PublicLayout } from '../layouts/PublicLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { HomePage } from '../../pages/public/HomePage';
import { ProductPage } from '../../pages/public/ProductPage';
import { FeaturesPage } from '../../pages/public/FeaturesPage';
import { SolutionsPage } from '../../pages/public/SolutionsPage';
import { PricingPage } from '../../pages/public/PricingPage';
import { SecurityPage } from '../../pages/public/SecurityPage';
import { ContactPage } from '../../pages/public/ContactPage';
import { PrivacyPage } from '../../pages/public/PrivacyPage';
import { TermsPage } from '../../pages/public/TermsPage';
import { PublicNotFoundPage } from '../../features/public/components/PublicNotFoundPage';
import { AuthPlaceholderPage } from '../../features/auth/components/AuthPlaceholderPage';
import { AppShellLayout } from '../layouts/AppShellLayout';
import { PrivateNotFoundPage } from '../../pages/placeholder/PrivateNotFoundPage';
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
import { SettingsLayout } from '../../features/settings/components/SettingsLayout';
import { AdminRoute } from '../../features/settings/components/ProtectedRoute';
import { SettingsRedirectPage } from '../../pages/settings/SettingsRedirectPage';
import { WorkspaceSettingsPage } from '../../pages/settings/WorkspaceSettingsPage';
import { MembersSettingsPage } from '../../pages/settings/MembersSettingsPage';
import { TeamsSettingsPage } from '../../pages/settings/TeamsSettingsPage';
import { IntegrationsSettingsPage } from '../../pages/settings/IntegrationsSettingsPage';
import { PreferencesSettingsPage } from '../../pages/settings/PreferencesSettingsPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
        {/* ========================================================= */}
        {/* 1. PUBLIC ROUTE FAMILY (UX-11A / UX-11B)                  */}
        {/* Uses PublicLayout with fixed theme, header, and footer    */}
        {/* ========================================================= */}
        <Route element={<PublicLayout />}>
          {/* Public Homepage (UX-11B Primary Surface) */}
          <Route path="/" element={<HomePage />} />

          {/* Complete Public Experience Pages (UX-11C) */}
          <Route path="/product" element={<ProductPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/solutions" element={<SolutionsPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/security" element={<SecurityPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
        </Route>

        {/* ========================================================= */}
        {/* 2. AUTH ROUTE FAMILY (UX-11A / UX-12 Boundary)            */}
        {/* Dedicated AuthLayout with centered card canvas            */}
        {/* ========================================================= */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<AuthPlaceholderPage mode="login" />} />
          <Route path="/signup" element={<AuthPlaceholderPage mode="signup" />} />
        </Route>

        {/* ========================================================= */}
        {/* 3. PRIVATE APPLICATION SHELL (UX-00 through UX-10)        */}
        {/* Authenticated workspace execution routes                  */}
        {/* ========================================================= */}
        <Route element={<AppShellLayout />}>
          {/* Primary UX-01 Page */}
          <Route path="/my-work" element={<MyWorkPage />} />
          <Route path="/my-work/*" element={<PrivateNotFoundPage />} />

          {/* Canonical Inbox Page (UX-06) */}
          <Route path="/inbox" element={<InboxPage />} />
          <Route path="/inbox/*" element={<PrivateNotFoundPage />} />

          {/* Projects Space (UX-02 Fully Implemented) */}
          <Route path="/projects" element={<ProjectsDirectoryPage />} />
          <Route path="/projects/:projectKey" element={<ProjectContextLayout />}>
            <Route index element={<ProjectOverviewPage />} />
            <Route path="issues" element={<ProjectIssuesPage />} />
            <Route path="board" element={<ProjectBoardPage />} />
            <Route path="planning" element={<ProjectPlanningPage />} />
            <Route path="settings" element={<ProjectSettingsPage />} />
            <Route path="*" element={<PrivateNotFoundPage />} />
          </Route>
          <Route path="/projects/*" element={<PrivateNotFoundPage />} />

          {/* Issues Space (UX-03 Real Canonical Page) */}
          <Route path="/issues/:issueKey" element={<IssueDetailPage />} />
          <Route path="/issues/*" element={<PrivateNotFoundPage />} />

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
          <Route path="/teams/*" element={<PrivateNotFoundPage />} />

          {/* Planning Space (UX-05 Canonical Implementation) */}
          <Route path="/cycles" element={<CyclesPage />} />
          <Route path="/cycles/:cycleId" element={<CycleDetailPage />} />
          <Route path="/cycles/*" element={<PrivateNotFoundPage />} />

          <Route path="/milestones" element={<MilestonesPage />} />
          <Route path="/milestones/:milestoneId" element={<MilestoneDetailPage />} />
          <Route path="/milestones/*" element={<PrivateNotFoundPage />} />

          <Route path="/roadmap" element={<RoadmapPage />} />
          <Route path="/roadmap/*" element={<PrivateNotFoundPage />} />

          {/* Dependency Intelligence Space (UX-04 Canonical Page) */}
          <Route path="/dependencies" element={<DependenciesPage />} />
          <Route path="/dependencies/*" element={<PrivateNotFoundPage />} />

          {/* Insights Space (UX-07 Canonical Destination) */}
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/insights/*" element={<PrivateNotFoundPage />} />

          {/* Settings Space (UX-08 Canonical Implementation) */}
          <Route path="/settings" element={<Outlet />}>
            <Route index element={<SettingsRedirectPage />} />
            <Route element={<SettingsLayout />}>
              <Route
                path="workspace"
                element={
                  <AdminRoute>
                    <WorkspaceSettingsPage />
                  </AdminRoute>
                }
              />
              <Route
                path="members"
                element={
                  <AdminRoute>
                    <MembersSettingsPage />
                  </AdminRoute>
                }
              />
              <Route
                path="teams"
                element={
                  <AdminRoute>
                    <TeamsSettingsPage />
                  </AdminRoute>
                }
              />
              <Route
                path="integrations"
                element={
                  <AdminRoute>
                    <IntegrationsSettingsPage />
                  </AdminRoute>
                }
              />
              <Route path="preferences" element={<PreferencesSettingsPage />} />
              <Route path="*" element={<PrivateNotFoundPage />} />
            </Route>
            <Route path="*" element={<PrivateNotFoundPage />} />
          </Route>
          <Route path="/settings/*" element={<PrivateNotFoundPage />} />

          {/* Explicit private fallback routes */}
          <Route path="/app/*" element={<PrivateNotFoundPage />} />
        </Route>

        {/* ========================================================= */}
        {/* 4. PUBLIC 404 CATCH-ALL                                   */}
        {/* Unknown URLs render Public 404 in PublicLayout            */}
        {/* ========================================================= */}
        <Route element={<PublicLayout />}>
          <Route path="*" element={<PublicNotFoundPage />} />
        </Route>
      </Routes>
  );
};

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};
