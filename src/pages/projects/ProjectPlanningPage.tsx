/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { Calendar, Target, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Project, Team } from '../../types';
import { useProject } from '../../context/ProjectContext';
import { useDrawerRoute } from '../../app/router/useDrawerRoute';
import { StatePill } from '../../components/ui/StatePill';
import { PriorityIcon } from '../../components/ui/PriorityIcon';

interface OutletContextType {
  project: Project;
  team?: Team;
}

export const ProjectPlanningPage: React.FC = () => {
  const { project, team } = useOutletContext<OutletContextType>();
  const { issues, cycles, milestones } = useProject();
  const { openDrawer } = useDrawerRoute();

  const projectIssues = useMemo(
    () => issues.filter(i => i.projectId === project.id),
    [issues, project.id]
  );

  // Owning team active cycle
  const activeCycle = useMemo(
    () => cycles.find(c => c.status === 'ACTIVE' && c.teamId === project.teamId),
    [cycles, project.teamId]
  );

  // Issues in active cycle
  const cycleIssues = useMemo(
    () => (activeCycle ? projectIssues.filter(i => i.cycleId === activeCycle.id) : []),
    [projectIssues, activeCycle]
  );

  // Target milestones referenced by this project
  const projectMilestones = useMemo(() => {
    const milestoneIds = new Set(projectIssues.map(i => i.milestoneId).filter(Boolean));
    return milestones.filter(m => milestoneIds.has(m.id));
  }, [projectIssues, milestones]);

  // Unscheduled backlog issues
  const backlogIssues = useMemo(
    () => projectIssues.filter(i => !i.cycleId && i.state !== 'DONE' && i.state !== 'CANCELLED'),
    [projectIssues]
  );

  return (
    <div className="flex-1 overflow-y-auto bg-[#fafaf9] p-4 sm:p-6 space-y-6 select-none">
      {/* 1. Header Banner */}
      <div className="bg-white border border-[#e5e3df] p-4 rounded-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-[#1a1a1a] mb-0.5">Project Delivery Plan</h2>
          <p className="text-xs text-[#787671]">
            Active cycle allocation and milestone mapping for {project.name}.
          </p>
        </div>

        {activeCycle && (
          <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-lg text-xs">
            <Clock className="w-3.5 h-3.5 text-[#5645d4]" />
            <span className="font-semibold text-[#5645d4]">{activeCycle.name}</span>
            <span className="text-[#787671]">({activeCycle.startDate} → {activeCycle.endDate})</span>
          </div>
        )}
      </div>

      {/* 2. Active Cycle Sprint Queue */}
      <section className="bg-white border border-[#e5e3df] rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 bg-[#fafaf9] border-b border-[#e5e3df] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#5645d4]" />
            <h3 className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider">
              Current Cycle Allocation
            </h3>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-[#5645d4]">
              {cycleIssues.length} tasks
            </span>
          </div>

          <span className="text-[11px] text-[#787671]">
            {activeCycle ? activeCycle.name : 'No active team cycle'}
          </span>
        </div>

        <div className="divide-y divide-[#e5e3df]">
          {cycleIssues.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-[#787671] italic">
              No tasks currently allocated to this cycle.
            </div>
          ) : (
            cycleIssues.map(issue => (
              <div
                key={issue.id}
                onClick={() => openDrawer(issue.key)}
                className="flex items-center justify-between h-[36px] px-4 hover:bg-[#f6f5f4] cursor-pointer transition-colors text-xs"
              >
                <div className="flex items-center gap-2 truncate mr-3 flex-1 min-w-0">
                  <PriorityIcon priority={issue.priority} size="sm" />
                  <span className="font-mono font-bold text-[#5645d4]">{issue.key}</span>
                  <span className="truncate text-[#1a1a1a]">{issue.title}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <StatePill state={issue.state} size="sm" />
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 3. Milestone Rollups */}
      <section className="bg-white border border-[#e5e3df] rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 bg-[#fafaf9] border-b border-[#e5e3df] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[#5645d4]" />
            <h3 className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider">
              Associated Strategic Milestones
            </h3>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#e5e3df] text-[#52504b]">
              {projectMilestones.length}
            </span>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {projectMilestones.length === 0 ? (
            <div className="text-xs text-[#787671] italic">
              No strategic milestones currently linked to this project.
            </div>
          ) : (
            projectMilestones.map(m => {
              const milestoneTasks = projectIssues.filter(i => i.milestoneId === m.id);
              const doneCount = milestoneTasks.filter(i => i.state === 'DONE').length;
              const percent =
                milestoneTasks.length > 0 ? Math.round((doneCount / milestoneTasks.length) * 100) : 0;

              return (
                <div key={m.id} className="p-3 bg-[#fafaf9] rounded-lg border border-[#e5e3df]">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-semibold text-xs text-[#1a1a1a]">{m.name}</span>
                    <span className="text-[11px] font-mono text-[#787671]">Target: {m.targetDate}</span>
                  </div>
                  <p className="text-[11px] text-[#5d5b54] mb-2">{m.description}</p>
                  <div className="flex items-center justify-between text-[11px] text-[#787671] mb-1">
                    <span>{doneCount} of {milestoneTasks.length} tasks completed</span>
                    <span className="font-semibold">{percent}%</span>
                  </div>
                  <div className="w-full bg-[#e5e3df] rounded-full h-1 overflow-hidden">
                    <div className="bg-[#0f7b6c] h-1 rounded-full" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* 4. Unscheduled Backlog Preview */}
      <section className="bg-white border border-[#e5e3df] rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 bg-[#fafaf9] border-b border-[#e5e3df] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#787671]" />
            <h3 className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider">
              Unscheduled Backlog
            </h3>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#e5e3df] text-[#52504b]">
              {backlogIssues.length} tasks
            </span>
          </div>

          <Link
            to={`/projects/${project.key}/issues?cycle=UNSCHEDULED`}
            className="text-[11px] font-medium text-[#5645d4] hover:underline flex items-center gap-1"
          >
            <span>Triage in issues list</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="divide-y divide-[#e5e3df] max-h-52 overflow-y-auto">
          {backlogIssues.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-[#787671] italic">
              All active tasks are assigned to a cycle.
            </div>
          ) : (
            backlogIssues.slice(0, 5).map(issue => (
              <div
                key={issue.id}
                onClick={() => openDrawer(issue.key)}
                className="flex items-center justify-between h-[36px] px-4 hover:bg-[#f6f5f4] cursor-pointer transition-colors text-xs"
              >
                <div className="flex items-center gap-2 truncate mr-3 flex-1 min-w-0">
                  <PriorityIcon priority={issue.priority} size="sm" />
                  <span className="font-mono font-bold text-[#5645d4]">{issue.key}</span>
                  <span className="truncate text-[#1a1a1a]">{issue.title}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <StatePill state={issue.state} size="sm" />
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
