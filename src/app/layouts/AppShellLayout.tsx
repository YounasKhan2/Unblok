/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { NavigationRail } from '../../components/layout/NavigationRail';
import { WorkspaceHeader } from '../../components/layout/WorkspaceHeader';
import { IssueDrawer } from '../../components/drawer/IssueDrawer';
import { CommandPalette } from '../../components/modals/CommandPalette';
import { CreateIssueModal } from '../../components/modals/CreateIssueModal';
import { CompletionGuardDialog } from '../../components/modals/CompletionGuardDialog';
import { CycleErrorDialog } from '../../components/modals/CycleErrorDialog';
import { ShortcutsHelpModal } from '../../components/modals/ShortcutsHelpModal';
import { BulkActionBar } from '../../components/layout/BulkActionBar';
import { useKeyboard } from '../../context/KeyboardContext';
import { useWorkspace } from '../../features/workspaces/context/WorkspaceContext';
import { ArchivedWorkspaceBanner } from '../../features/workspaces/components/ArchivedWorkspaceBanner';
import { WorkspaceUnavailable } from '../../features/workspaces/components/WorkspaceUnavailable';

export const AppShellLayout: React.FC = () => {
  const navigate = useNavigate();
  const { registerRouteNavigator } = useKeyboard();
  const { status: workspaceStatus } = useWorkspace();

  useEffect(() => {
    registerRouteNavigator(navigate);
    return () => registerRouteNavigator(null);
  }, [navigate, registerRouteNavigator]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas text-text-primary">
      {/* Zone 1: Navigation Rail (52px collapsed / 220px expanded) */}
      <NavigationRail />

      {/* Zone 2: Main Application Canvas Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-canvas relative">
        {/* Workspace Top Header (44px) */}
        <WorkspaceHeader />

        {/* Section 26: Archived Workspace Banner */}
        <ArchivedWorkspaceBanner />

        {/* Dynamic Routed Page Content */}
        <main className="flex-1 flex min-w-0 overflow-hidden relative" role="main">
          {workspaceStatus === 'unavailable' ? (
            <WorkspaceUnavailable />
          ) : (
            <Outlet />
          )}
        </main>

        {/* Floating Bulk Action Bar (Multi-selection) */}
        <BulkActionBar />
      </div>

      {/* Zone 3: Global Slide-over Issue Drawer Layer (440px desktop) */}
      <IssueDrawer />

      {/* Zone 4: Global Overlays & Modals */}
      <CommandPalette />
      <CreateIssueModal />
      <CompletionGuardDialog />
      <CycleErrorDialog />
      <ShortcutsHelpModal />
    </div>
  );
};
