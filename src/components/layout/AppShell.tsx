import React from 'react';
import { NavigationRail } from './NavigationRail';
import { WorkspaceHeader } from './WorkspaceHeader';
import { FilterToolbar } from './FilterToolbar';
import { IssueList } from '../views/IssueList';
import { IssueBoard } from '../views/IssueBoard';
import { DependencyMatrix } from '../views/DependencyMatrix';
import { CyclePlanningView } from '../views/CyclePlanningView';
import { MilestonesView } from '../views/MilestonesView';
import { TimelineRoadmapView } from '../views/TimelineRoadmapView';
import { IssueDrawer } from '../drawer/IssueDrawer';
import { CreateIssueModal } from '../modals/CreateIssueModal';
import { CompletionGuardDialog } from '../modals/CompletionGuardDialog';
import { CycleErrorDialog } from '../modals/CycleErrorDialog';
import { ShortcutsHelpModal } from '../modals/ShortcutsHelpModal';
import { CommandPalette } from '../modals/CommandPalette';
import { BulkActionBar } from './BulkActionBar';
import { useProject } from '../../context/ProjectContext';

export const AppShell: React.FC = () => {
  const { viewMode } = useProject();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-[#1a1a1a]">
      {/* Region 1: Navigation Rail (220px / 48px) */}
      <NavigationRail />

      {/* Region 2: Execution Canvas */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-white relative">
        {/* Navy Executive Workspace Header */}
        <WorkspaceHeader />

        {/* Filter and View Toolbar */}
        <FilterToolbar />

        {/* Dynamic Canvas View */}
        <div className="flex-1 flex min-w-0 overflow-hidden relative">
          {viewMode === 'LIST' && <IssueList />}
          {viewMode === 'BOARD' && <IssueBoard />}
          {viewMode === 'GRAPH' && <DependencyMatrix />}
          {viewMode === 'CYCLES' && <CyclePlanningView />}
          {viewMode === 'MILESTONES' && <MilestonesView />}
          {viewMode === 'TIMELINE' && <TimelineRoadmapView />}
        </div>

        {/* Floating Bulk Action Bar for Multi-selection */}
        <BulkActionBar />
      </main>

      {/* Region 3: Contextual Issue Detail Drawer (440px Non-modal) */}
      <IssueDrawer />

      {/* Universal Command Palette & Modals */}
      <CommandPalette />
      <CreateIssueModal />
      <CompletionGuardDialog />
      <CycleErrorDialog />
      <ShortcutsHelpModal />
    </div>
  );
};
