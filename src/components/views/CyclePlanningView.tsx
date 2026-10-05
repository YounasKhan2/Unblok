import React, { useState, useMemo } from 'react';
import { useProject } from '../../context/ProjectContext';
import { StatePill } from '../ui/StatePill';
import { PriorityIcon } from '../ui/PriorityIcon';
import { Avatar } from '../ui/Avatar';
import { BlockerBadge } from '../ui/BlockerBadge';
import { Cycle } from '../../types';
import {
  Calendar,
  Clock,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  RotateCw,
  Plus,
  Layers,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';

export const CyclePlanningView: React.FC = () => {
  const {
    issues,
    cycles,
    activeCycle,
    users,
    teams,
    getIssueBlockerStatus,
    selectedIssueId,
    setSelectedIssueId,
    setIsDrawerOpen,
    updateIssueCycle,
    rolloverIncompleteIssues,
    createCycle,
  } = useProject();

  const [selectedCycleId, setSelectedCycleId] = useState<string>(
    activeCycle?.id || cycles[0]?.id || 'cycle_24'
  );
  const [isRolloverModalOpen, setIsRolloverModalOpen] = useState(false);
  const [targetRolloverCycleId, setTargetRolloverCycleId] = useState<string>(
    cycles.find(c => c.status === 'UPCOMING')?.id || cycles[1]?.id || ''
  );
  const [isNewCycleModalOpen, setIsNewCycleModalOpen] = useState(false);
  const [newCycleName, setNewCycleName] = useState('');
  const [newCycleStart, setNewCycleStart] = useState('');
  const [newCycleEnd, setNewCycleEnd] = useState('');

  const currentCycle = useMemo(
    () => cycles.find(c => c.id === selectedCycleId) || activeCycle || cycles[0],
    [cycles, selectedCycleId, activeCycle]
  );

  // Issues in this cycle
  const cycleIssues = useMemo(
    () => issues.filter(i => i.cycleId === currentCycle?.id),
    [issues, currentCycle]
  );

  // Unassigned Backlog issues available to pull in
  const backlogIssues = useMemo(
    () => issues.filter(i => !i.cycleId && i.state !== 'DONE' && i.state !== 'CANCELLED'),
    [issues]
  );

  // Cycle statistics
  const stats = useMemo(() => {
    const total = cycleIssues.length;
    if (total === 0) {
      return { total: 0, done: 0, inProgress: 0, blocked: 0, todo: 0, percent: 0 };
    }

    let done = 0;
    let inProgress = 0;
    let blocked = 0;
    let todo = 0;

    for (const issue of cycleIssues) {
      const blocker = getIssueBlockerStatus(issue.id);
      if (issue.state === 'DONE') done++;
      else if (blocker.activeCount > 0) blocked++;
      else if (issue.state === 'IN_PROGRESS' || issue.state === 'IN_REVIEW') inProgress++;
      else todo++;
    }

    const percent = Math.round((done / total) * 100);
    return { total, done, inProgress, blocked, todo, percent };
  }, [cycleIssues, getIssueBlockerStatus]);

  // Days calculation
  const daysInfo = useMemo(() => {
    if (!currentCycle) return { remaining: 0, total: 14 };
    const start = new Date(currentCycle.startDate).getTime();
    const end = new Date(currentCycle.endDate).getTime();
    const now = Date.now();
    const totalDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
    const remainingDays = Math.max(0, Math.round((end - now) / (1000 * 60 * 60 * 24)));
    return { remaining: remainingDays, total: totalDays };
  }, [currentCycle]);

  const handleRolloverConfirm = () => {
    if (currentCycle && targetRolloverCycleId) {
      rolloverIncompleteIssues(currentCycle.id, targetRolloverCycleId);
      setIsRolloverModalOpen(false);
    }
  };

  const handleCreateCycleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCycleName.trim() || !newCycleStart || !newCycleEnd) return;
    const created = createCycle({
      name: newCycleName.trim(),
      startDate: newCycleStart,
      endDate: newCycleEnd,
    });
    if (created) {
      setSelectedCycleId(created.id);
    }
    setIsNewCycleModalOpen(false);
    setNewCycleName('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fafaf9] overflow-hidden">
      {/* Top Header & Cycle Tabs */}
      <div className="px-6 py-4 bg-white border-b border-[#e5e3df] shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#5645d4]" />
              <h2 className="text-base font-semibold text-[#1a1a1a]">
                Delivery Cycles & Iteration Sprints
              </h2>
            </div>
            <p className="text-xs text-[#787671] mt-0.5">
              Two-week execution cadence, blocker rollover management, and delivery velocity tracking.
            </p>
          </div>

          {/* New Cycle Button */}
          <button
            onClick={() => setIsNewCycleModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#5645d4] hover:bg-[#4838bd] text-white shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Cycle</span>
          </button>
        </div>

        {/* Cycle Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {cycles.map(cycle => {
            const isSelected = cycle.id === currentCycle?.id;
            return (
              <button
                key={cycle.id}
                onClick={() => setSelectedCycleId(cycle.id)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg transition-colors cursor-pointer shrink-0 font-medium ${
                  isSelected
                    ? 'bg-[#5645d4] text-white shadow-2xs'
                    : 'bg-[#f6f5f4] text-[#37352f] hover:bg-[#ede9e4]'
                }`}
              >
                <span>{cycle.name}</span>
                {cycle.status === 'ACTIVE' && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-[#1aae39] text-white'
                    }`}
                  >
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Active Cycle KPI Card */}
        {currentCycle && (
          <div className="p-5 bg-white rounded-xl border border-[#e5e3df] shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-[#1a1a1a]">{currentCycle.name}</span>
                  <span className="text-xs px-2 py-0.5 font-mono text-[#787671] bg-[#f6f5f4] rounded border border-[#e5e3df]">
                    {currentCycle.startDate} → {currentCycle.endDate}
                  </span>
                </div>
                {currentCycle.description && (
                  <p className="text-xs text-[#787671] mt-1">{currentCycle.description}</p>
                )}
              </div>

              {/* Rollover Action Button */}
              {currentCycle.status === 'ACTIVE' && stats.total > stats.done && (
                <button
                  onClick={() => setIsRolloverModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-orange-50 hover:bg-orange-100 text-[#dd5b00] border border-orange-200 transition-colors cursor-pointer self-start md:self-auto"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Rollover Incomplete Tasks ({stats.total - stats.done})</span>
                </button>
              )}
            </div>

            {/* Scope Breakdown Progress Bar */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#1a1a1a]">{stats.percent}% Completed</span>
                  <span className="text-[#a4a097]">•</span>
                  <span className="text-[#787671]">{daysInfo.remaining} days left</span>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-[#787671]">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#1aae39]" />
                    Done ({stats.done})
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#0075de]" />
                    In Progress ({stats.inProgress})
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#dd5b00]" />
                    Blocked ({stats.blocked})
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#d4d0c9]" />
                    To Do ({stats.todo})
                  </span>
                </div>
              </div>

              {/* Multi-segment Progress Bar */}
              <div className="w-full h-2.5 rounded-full bg-[#ede9e4] overflow-hidden flex">
                {stats.total > 0 ? (
                  <>
                    <div
                      style={{ width: `${(stats.done / stats.total) * 100}%` }}
                      className="bg-[#1aae39] transition-all duration-300"
                      title={`Done: ${stats.done}`}
                    />
                    <div
                      style={{ width: `${(stats.inProgress / stats.total) * 100}%` }}
                      className="bg-[#0075de] transition-all duration-300"
                      title={`In Progress: ${stats.inProgress}`}
                    />
                    <div
                      style={{ width: `${(stats.blocked / stats.total) * 100}%` }}
                      className="bg-[#dd5b00] transition-all duration-300"
                      title={`Blocked: ${stats.blocked}`}
                    />
                  </>
                ) : (
                  <div className="w-full h-full bg-[#ede9e4]" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Two-Column Planning Board */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1 & 2: Active Cycle Tasks (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#787671] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Cycle Scope ({cycleIssues.length} issues)</span>
              </h3>
            </div>

            <div className="bg-white rounded-xl border border-[#e5e3df] overflow-hidden divide-y divide-[#e5e3df]/60 shadow-2xs">
              {cycleIssues.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#787671]">
                  No issues assigned to this cycle yet. Pull tasks from the Unassigned Backlog on the right.
                </div>
              ) : (
                cycleIssues.map(issue => {
                  const blockerStatus = getIssueBlockerStatus(issue.id);
                  const assignee = users.find(u => u.id === issue.assigneeId);
                  const isSelected = issue.id === selectedIssueId;

                  return (
                    <div
                      key={issue.id}
                      onClick={() => {
                        setSelectedIssueId(issue.id);
                        setIsDrawerOpen(true);
                      }}
                      className={`flex items-center h-10 px-3 text-xs cursor-pointer select-none transition-colors ${
                        isSelected ? 'bg-[#5645d4]/8 font-medium' : 'hover:bg-[#f6f5f4]'
                      }`}
                    >
                      <div className="w-6 shrink-0 flex items-center justify-center">
                        <PriorityIcon priority={issue.priority} size="sm" />
                      </div>
                      <span className="w-20 shrink-0 font-mono font-bold text-[#5645d4]">
                        {issue.key}
                      </span>
                      <span className="flex-1 min-w-0 truncate text-[#1a1a1a] pr-3">
                        {issue.title}
                      </span>
                      <div className="mr-3">
                        <BlockerBadge status={blockerStatus} />
                      </div>
                      <div className="w-28 mr-3">
                        <StatePill state={issue.state} size="sm" />
                      </div>
                      <Avatar user={assignee} size="sm" />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Column 3: Unassigned Backlog (1 col) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#787671] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Unassigned Backlog ({backlogIssues.length})</span>
              </h3>
            </div>

            <div className="bg-white rounded-xl border border-[#e5e3df] overflow-hidden divide-y divide-[#e5e3df]/60 shadow-2xs max-h-[500px] overflow-y-auto">
              {backlogIssues.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#787671]">
                  All active tasks are assigned to a cycle.
                </div>
              ) : (
                backlogIssues.map(issue => (
                  <div
                    key={issue.id}
                    className="p-3 text-xs hover:bg-[#fafaf9] transition-colors flex items-center justify-between gap-2"
                  >
                    <div
                      className="min-w-0 flex-1 cursor-pointer"
                      onClick={() => {
                        setSelectedIssueId(issue.id);
                        setIsDrawerOpen(true);
                      }}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <PriorityIcon priority={issue.priority} size="sm" />
                        <span className="font-mono font-bold text-[#5645d4]">{issue.key}</span>
                      </div>
                      <div className="truncate text-[#1a1a1a]">{issue.title}</div>
                    </div>

                    {currentCycle && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          updateIssueCycle(issue.id, currentCycle.id);
                        }}
                        className="px-2 py-1 text-[11px] font-semibold text-[#5645d4] hover:bg-purple-50 rounded border border-purple-200 transition-colors shrink-0 cursor-pointer"
                        title={`Move to ${currentCycle.name}`}
                      >
                        + Add
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rollover Modal Dialog */}
      {isRolloverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#0a1530]/50 backdrop-blur-xs"
            onClick={() => setIsRolloverModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-2xl border border-[#e5e3df] p-5 space-y-4">
            <div className="flex items-center gap-2 text-[#dd5b00]">
              <RotateCw className="w-5 h-5" />
              <h3 className="font-semibold text-sm text-[#1a1a1a]">
                Rollover Incomplete Tasks
              </h3>
            </div>

            <p className="text-xs text-[#787671]">
              Move all {stats.total - stats.done} uncompleted and blocked tasks from{' '}
              <strong className="text-[#1a1a1a]">{currentCycle?.name}</strong> into the target cycle below.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#37352f]">Destination Cycle</label>
              <select
                value={targetRolloverCycleId}
                onChange={e => setTargetRolloverCycleId(e.target.value)}
                className="w-full h-8 px-2 text-xs bg-[#f6f5f4] border border-[#e5e3df] rounded-lg text-[#1a1a1a] focus:outline-none focus:border-[#5645d4]"
              >
                {cycles
                  .filter(c => c.id !== currentCycle?.id)
                  .map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.startDate} → {c.endDate})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsRolloverModalOpen(false)}
                className="px-3 py-1.5 text-xs text-[#787671] hover:bg-[#f6f5f4] rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRolloverConfirm}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#dd5b00] hover:bg-[#c95200] text-white transition-colors cursor-pointer"
              >
                Confirm Rollover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Cycle Modal Dialog */}
      {isNewCycleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#0a1530]/50 backdrop-blur-xs"
            onClick={() => setIsNewCycleModalOpen(false)}
          />
          <form
            onSubmit={handleCreateCycleSubmit}
            className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-2xl border border-[#e5e3df] p-5 space-y-4"
          >
            <div className="flex items-center gap-2 text-[#5645d4]">
              <Calendar className="w-5 h-5" />
              <h3 className="font-semibold text-sm text-[#1a1a1a]">Create Delivery Cycle</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-[#37352f] block mb-1">Cycle Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cycle 26"
                  value={newCycleName}
                  onChange={e => setNewCycleName(e.target.value)}
                  className="w-full h-8 px-2 bg-[#f6f5f4] border border-[#e5e3df] rounded-lg text-[#1a1a1a] focus:outline-none focus:border-[#5645d4]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-[#37352f] block mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={newCycleStart}
                    onChange={e => setNewCycleStart(e.target.value)}
                    className="w-full h-8 px-2 bg-[#f6f5f4] border border-[#e5e3df] rounded-lg text-[#1a1a1a] focus:outline-none focus:border-[#5645d4]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#37352f] block mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={newCycleEnd}
                    onChange={e => setNewCycleEnd(e.target.value)}
                    className="w-full h-8 px-2 bg-[#f6f5f4] border border-[#e5e3df] rounded-lg text-[#1a1a1a] focus:outline-none focus:border-[#5645d4]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsNewCycleModalOpen(false)}
                className="px-3 py-1.5 text-xs text-[#787671] hover:bg-[#f6f5f4] rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#5645d4] hover:bg-[#4838bd] text-white transition-colors cursor-pointer"
              >
                Create Cycle
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
