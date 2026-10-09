/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useProject } from '../../context/ProjectContext';
import { selectMilestonesOverview } from '../../features/planning/selectors/milestoneSelectors';
import { MilestoneCard } from '../../features/planning/components/milestones/MilestoneCard';
import { CreateMilestoneModal } from '../../features/planning/components/milestones/CreateMilestoneModal';
import { Button } from '../../components/ui/Button';
import { canMutatePlanning } from '../../features/planning/permissions';
import { Target, Plus, CheckCircle2, ShieldAlert } from 'lucide-react';

export const MilestonesPage: React.FC = () => {
  const { milestones, issues, dependencies, projects, teams, currentUser } = useProject();

  const isObserver = !canMutatePlanning(currentUser.role);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { activeMilestones, completedMilestones } = useMemo(
    () => selectMilestonesOverview(milestones, issues, dependencies, projects, teams),
    [milestones, issues, dependencies, projects, teams]
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-surface-subtle overflow-y-auto select-none">
      {/* 1. Header */}
      <div className="bg-surface-base border-b border-border px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-5 h-5 text-accent" />
            <h1 className="text-base font-bold text-text-primary">Strategic Milestones</h1>
          </div>
          <p className="text-xs text-text-muted">
            Workspace-level strategic delivery targets and release goals spanning teams and projects.
          </p>
        </div>

        {!isObserver && (
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Create Milestone
          </Button>
        )}
      </div>

      {/* 2. Main Content Body */}
      <div className="p-6 space-y-8 max-w-7xl mx-auto w-full">
        {/* Active Milestones Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span>Active Milestones ({activeMilestones.length})</span>
            </h2>
            <span className="text-[11px] text-text-muted">
              Current strategic delivery targets
            </span>
          </div>

          {activeMilestones.length === 0 ? (
            <div className="p-8 text-center bg-surface-base border border-border rounded-lg text-xs text-text-muted">
              No active milestones currently tracked in this workspace.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeMilestones.map(summary => (
                <MilestoneCard key={summary.milestone.id} summary={summary} />
              ))}
            </div>
          )}
        </section>

        {/* Completed Milestones Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              <span>Completed Milestones ({completedMilestones.length})</span>
            </h2>
            <span className="text-[11px] text-text-muted">
              Archived historical achievements (100% finished)
            </span>
          </div>

          {completedMilestones.length === 0 ? (
            <div className="p-8 text-center bg-surface-base border border-border rounded-lg text-xs text-text-muted">
              No completed milestones recorded yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedMilestones.map(summary => (
                <MilestoneCard key={summary.milestone.id} summary={summary} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Create Milestone Modal */}
      <CreateMilestoneModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};
