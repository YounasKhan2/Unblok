/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { NavigationRail } from '../../components/layout/NavigationRail';
import { WorkspaceHeader } from '../../components/layout/WorkspaceHeader';
import { IssueDrawer } from '../../components/drawer/IssueDrawer';
import { CommandPalette } from '../../components/modals/CommandPalette';
import { CreateIssueModal } from '../../components/modals/CreateIssueModal';
import { CompletionGuardDialog } from '../../components/modals/CompletionGuardDialog';
import { CycleErrorDialog } from '../../components/modals/CycleErrorDialog';
import { ShortcutsHelpModal } from '../../components/modals/ShortcutsHelpModal';
import { BulkActionBar } from '../../components/layout/BulkActionBar';

export const AppShellLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-[#1a1a1a]">
      {/* Zone 1: Navigation Rail (52px collapsed / 220px expanded) */}
      <NavigationRail />

      {/* Zone 2: Main Application Canvas Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-white relative">
        {/* Workspace Top Header (44px) */}
        <WorkspaceHeader />

        {/* Dynamic Routed Page Content */}
        <main className="flex-1 flex min-w-0 overflow-hidden relative" role="main">
          <Outlet />
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
