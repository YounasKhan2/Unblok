/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext';
import { selectCyclesOverview } from '../../features/planning/selectors/cycleSelectors';
import { CycleSummaryCard } from '../../features/planning/components/cycles/CycleSummaryCard';
import { CreateCycleModal } from '../../features/planning/components/cycles/CreateCycleModal';
import { Button } from '../../components/ui/Button';
import { canMutatePlanning } from '../../features/planning/permissions';
import { Clock, Plus, Users, Filter, CheckCircle2 } from 'lucide-react';

export const CyclesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { cycles, issues, dependencies, teams, currentUser } = useProject();

  const isObserver = !canMutatePlanning(currentUser.role);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // URL-bound team filter e.g. /cycles?team=ENG
  const teamParam = searchParams.get('team') || 'ALL';

  const handleTeamChange = (val: string) => {
    const next = new URLSearchParams(searchParams);
    if (val === 'ALL') {
      next.delete('team');
    } else {
      next.set('team', val);
    }
    setSearchParams(next, { replace: true });
  };

  const { active, upcoming, completed } = useMemo(
    () => selectCyclesOverview(cycles, issues, dependencies, teams, teamParam),
    [cycles, issues, dependencies, teams, teamParam]
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-surface-subtle overflow-y-auto select-none">
      {/* 1. Header */}
      <div className="bg-surface-base border-b border-border px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-5 h-5 text-accent" />
            <h1 className="text-base font-bold text-text-primary">Team Delivery Cycles</h1>
          </div>
          <p className="text-xs text-text-muted">
            Workspace overview of sprint cadences, active commitments, and completion rollups by team.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Team Filter Dropdown */}
          <div className="flex items-center gap-1.5 text-xs bg-surface-base border border-border rounded-[6px] px-2.5 py-1">
            <Users className="w-3.5 h-3.5 text-text-muted" />
            <select
              value={teamParam}
              onChange={e => handleTeamChange(e.target.value)}
              className="bg-transparent text-text-primary focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Teams</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.key})
                </option>
              ))}
            </select>
          </div>

          {!isObserver && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Create Cycle
            </Button>
          )}
        </div>
      </div>

      {/* 2. Main Content Body */}
      <div className="p-6 space-y-8 max-w-7xl mx-auto w-full">
        {/* Active Cycles Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span>Active Cycles ({active.length})</span>
            </h2>
            <span className="text-[11px] text-text-muted">
              Current bounded delivery iterations
            </span>
          </div>

          {active.length === 0 ? (
            <div className="p-8 text-center bg-surface-base border border-border rounded-lg text-xs text-text-muted">
              No active cycles found for the selected team filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {active.map(summary => (
                <CycleSummaryCard key={summary.cycle.id} summary={summary} />
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Cycles Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-border-strong" />
              <span>Upcoming Cycles ({upcoming.length})</span>
            </h2>
            <span className="text-[11px] text-text-muted">
              Scheduled future iterations and rollover targets
            </span>
          </div>

          {upcoming.length === 0 ? (
            <div className="p-8 text-center bg-surface-base border border-border rounded-lg text-xs text-text-muted">
              No upcoming cycles scheduled.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcoming.map(summary => (
                <CycleSummaryCard key={summary.cycle.id} summary={summary} />
              ))}
            </div>
          )}
        </section>

        {/* Completed Cycles Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              <span>Completed Cycles ({completed.length})</span>
            </h2>
            <span className="text-[11px] text-text-muted">
              Archived historical execution cadences
            </span>
          </div>

          {completed.length === 0 ? (
            <div className="p-8 text-center bg-surface-base border border-border rounded-lg text-xs text-text-muted">
              No completed cycles recorded yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completed.map(summary => (
                <CycleSummaryCard key={summary.cycle.id} summary={summary} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Create Cycle Modal */}
      <CreateCycleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        teams={teams}
        defaultTeamId={teamParam !== 'ALL' ? teamParam : undefined}
      />
    </div>
  );
};
