import React, { useState, useMemo } from 'react';
import { useProject } from '../../context/ProjectContext';
import { StatePill } from '../ui/StatePill';
import { PriorityIcon } from '../ui/PriorityIcon';
import { Avatar } from '../ui/Avatar';
import { BlockerBadge } from '../ui/BlockerBadge';
import { Milestone, MilestoneHealth, Issue } from '../../types';
import {
  Target,
  Calendar,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Flag,
} from 'lucide-react';

export const MilestonesView: React.FC = () => {
  const {
    issues,
    milestones,
    users,
    teams,
    getIssueBlockerStatus,
    selectedIssueId,
    setSelectedIssueId,
    setIsDrawerOpen,
    updateIssueMilestone,
    createMilestone,
  } = useProject();

  const [expandedMilestones, setExpandedMilestones] = useState<Record<string, boolean>>({
    milestone_m1: true,
    milestone_m2: true,
    milestone_m3: true,
  });

  const [isNewMilestoneModalOpen, setIsNewMilestoneModalOpen] = useState(false);
  const [newMilestoneName, setNewMilestoneName] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');
  const [newMilestoneDesc, setNewMilestoneDesc] = useState('');
  const [newMilestoneTeam, setNewMilestoneTeam] = useState('ALL');

  const toggleExpand = (id: string) => {
    setExpandedMilestones(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Calculate statistics and health for each milestone
  const milestoneData = useMemo(() => {
    return milestones.map(milestone => {
      const milestoneIssues = issues.filter(i => i.milestoneId === milestone.id);
      const total = milestoneIssues.length;

      let done = 0;
      let inProgress = 0;
      let blockedCount = 0;
      const blockingPrerequisites: Issue[] = [];

      for (const issue of milestoneIssues) {
        const blocker = getIssueBlockerStatus(issue.id);
        if (issue.state === 'DONE') {
          done++;
        } else if (blocker.activeCount > 0) {
          blockedCount++;
          for (const b of blocker.activeBlockers) {
            if (!blockingPrerequisites.some(p => p.id === b.id)) {
              blockingPrerequisites.push(b);
            }
          }
        } else if (issue.state === 'IN_PROGRESS' || issue.state === 'IN_REVIEW') {
          inProgress++;
        }
      }

      const percent = total > 0 ? Math.round((done / total) * 100) : 0;

      // Determine Health
      let health: MilestoneHealth = 'ON_TRACK';
      if (total > 0 && done === total) {
        health = 'COMPLETED';
      } else if (blockedCount > 0) {
        health = 'BLOCKED';
      } else if (percent < 40) {
        health = 'AT_RISK';
      }

      // Calculate days remaining
      const targetTime = new Date(milestone.targetDate).getTime();
      const now = Date.now();
      const daysRemaining = Math.round((targetTime - now) / (1000 * 60 * 60 * 24));

      return {
        milestone,
        issues: milestoneIssues,
        total,
        done,
        inProgress,
        blockedCount,
        percent,
        health,
        daysRemaining,
        blockingPrerequisites,
      };
    });
  }, [milestones, issues, getIssueBlockerStatus]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneName.trim() || !newMilestoneDate) return;

    createMilestone({
      name: newMilestoneName.trim(),
      targetDate: newMilestoneDate,
      description: newMilestoneDesc.trim(),
      teamId: newMilestoneTeam,
    });

    setIsNewMilestoneModalOpen(false);
    setNewMilestoneName('');
    setNewMilestoneDate('');
    setNewMilestoneDesc('');
  };

  const getHealthBadge = (health: MilestoneHealth) => {
    switch (health) {
      case 'COMPLETED':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-purple-100 text-[#5645d4]">
            <CheckCircle2 className="w-3 h-3" />
            <span>Completed</span>
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-red-100 text-[#d83a52]">
            <ShieldAlert className="w-3 h-3" />
            <span>Blocked</span>
          </span>
        );
      case 'AT_RISK':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-orange-100 text-[#dd5b00]">
            <AlertTriangle className="w-3 h-3" />
            <span>At Risk</span>
          </span>
        );
      case 'ON_TRACK':
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-green-100 text-[#1aae39]">
            <Target className="w-3 h-3" />
            <span>On Track</span>
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fafaf9] overflow-hidden">
      {/* Top Header */}
      <div className="px-6 py-4 bg-white border-b border-[#e5e3df] shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-[#5645d4]" />
            <h2 className="text-base font-semibold text-[#1a1a1a]">
              Strategic Delivery Milestones
            </h2>
          </div>
          <p className="text-xs text-[#787671] mt-0.5">
            Outcome-oriented release targets, cross-team health tracking, and prerequisite blocker impacts.
          </p>
        </div>

        <button
          onClick={() => setIsNewMilestoneModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#5645d4] hover:bg-[#4838bd] text-white shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Milestone</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="space-y-4">
          {milestoneData.map(data => {
            const isExpanded = !!expandedMilestones[data.milestone.id];

            return (
              <div
                key={data.milestone.id}
                className="bg-white rounded-xl border border-[#e5e3df] shadow-xs overflow-hidden transition-all"
              >
                {/* Milestone Summary Header */}
                <div
                  onClick={() => toggleExpand(data.milestone.id)}
                  className="p-4 cursor-pointer hover:bg-[#fafaf9] transition-colors select-none"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-[#787671] shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[#787671] shrink-0" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#1a1a1a]">
                            {data.milestone.name}
                          </span>
                          {getHealthBadge(data.health)}
                        </div>
                        <p className="text-xs text-[#787671] mt-0.5">
                          {data.milestone.description}
                        </p>
                      </div>
                    </div>

                    {/* Target Date & Stats */}
                    <div className="flex items-center gap-4 text-xs shrink-0 self-end md:self-auto">
                      <div className="flex items-center gap-1.5 text-[#787671] bg-[#f6f5f4] px-2.5 py-1 rounded-lg border border-[#e5e3df]">
                        <Calendar className="w-3.5 h-3.5 text-[#5645d4]" />
                        <span>Target: {data.milestone.targetDate}</span>
                        <span className="text-[#a4a097]">•</span>
                        <span className="font-semibold text-[#1a1a1a]">
                          {data.daysRemaining >= 0
                            ? `${data.daysRemaining} days left`
                            : 'Overdue'}
                        </span>
                      </div>

                      <div className="font-semibold text-xs text-[#1a1a1a] min-w-[70px] text-right">
                        {data.done} / {data.total} tasks ({data.percent}%)
                      </div>
                    </div>
                  </div>

                  {/* Multi-segment Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-[#ede9e4] overflow-hidden flex mt-3">
                    {data.total > 0 ? (
                      <>
                        <div
                          style={{ width: `${(data.done / data.total) * 100}%` }}
                          className="bg-[#1aae39] transition-all duration-300"
                        />
                        <div
                          style={{ width: `${(data.inProgress / data.total) * 100}%` }}
                          className="bg-[#0075de] transition-all duration-300"
                        />
                        <div
                          style={{ width: `${(data.blockedCount / data.total) * 100}%` }}
                          className="bg-[#dd5b00] transition-all duration-300"
                        />
                      </>
                    ) : (
                      <div className="w-full h-full bg-[#ede9e4]" />
                    )}
                  </div>
                </div>

                {/* Blocker Callout Alert if Milestone is Blocked */}
                {data.blockingPrerequisites.length > 0 && (
                  <div className="mx-4 mb-3 p-3 rounded-lg bg-[#ffe8d4]/40 border border-[#ffd3ad] text-xs">
                    <div className="flex items-center gap-2 font-semibold text-[#dd5b00] mb-1">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      <span>
                        Milestone blocked by {data.blockingPrerequisites.length} prerequisite task(s):
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {data.blockingPrerequisites.map(blocker => (
                        <div
                          key={blocker.id}
                          onClick={() => {
                            setSelectedIssueId(blocker.id);
                            setIsDrawerOpen(true);
                          }}
                          className="flex items-center gap-1.5 px-2 py-1 rounded bg-white border border-[#ffd3ad] cursor-pointer hover:border-[#dd5b00] shadow-2xs text-[11px]"
                        >
                          <PriorityIcon priority={blocker.priority} size="sm" />
                          <span className="font-mono font-bold text-[#5645d4]">{blocker.key}</span>
                          <span className="text-[#37352f] truncate max-w-[160px]">{blocker.title}</span>
                          <StatePill state={blocker.state} size="sm" showLabel={false} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expanded Tasks List */}
                {isExpanded && (
                  <div className="border-t border-[#e5e3df] divide-y divide-[#e5e3df]/60 bg-[#fafaf9]/40">
                    {data.issues.length === 0 ? (
                      <div className="p-4 text-center text-xs text-[#787671]">
                        No tasks linked to this milestone. Tag tasks using the issue drawer.
                      </div>
                    ) : (
                      data.issues.map(issue => {
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
                            className={`flex items-center h-10 px-4 text-xs cursor-pointer select-none transition-colors ${
                              isSelected ? 'bg-[#5645d4]/8 font-medium' : 'hover:bg-white'
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
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* New Milestone Modal Dialog */}
      {isNewMilestoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#0a1530]/50 backdrop-blur-xs"
            onClick={() => setIsNewMilestoneModalOpen(false)}
          />
          <form
            onSubmit={handleCreateSubmit}
            className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-2xl border border-[#e5e3df] p-5 space-y-4"
          >
            <div className="flex items-center gap-2 text-[#5645d4]">
              <Target className="w-5 h-5" />
              <h3 className="font-semibold text-sm text-[#1a1a1a]">Create Strategic Milestone</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-[#37352f] block mb-1">Milestone Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. M4: Multi-region DB Failover"
                  value={newMilestoneName}
                  onChange={e => setNewMilestoneName(e.target.value)}
                  className="w-full h-8 px-2 bg-[#f6f5f4] border border-[#e5e3df] rounded-lg text-[#1a1a1a] focus:outline-none focus:border-[#5645d4]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#37352f] block mb-1">Target Delivery Date</label>
                <input
                  type="date"
                  required
                  value={newMilestoneDate}
                  onChange={e => setNewMilestoneDate(e.target.value)}
                  className="w-full h-8 px-2 bg-[#f6f5f4] border border-[#e5e3df] rounded-lg text-[#1a1a1a] focus:outline-none focus:border-[#5645d4]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#37352f] block mb-1">Description / Key Outcome</label>
                <textarea
                  rows={3}
                  placeholder="What customer value or infrastructure capability does this milestone unlock?"
                  value={newMilestoneDesc}
                  onChange={e => setNewMilestoneDesc(e.target.value)}
                  className="w-full p-2 bg-[#f6f5f4] border border-[#e5e3df] rounded-lg text-[#1a1a1a] focus:outline-none focus:border-[#5645d4] resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsNewMilestoneModalOpen(false)}
                className="px-3 py-1.5 text-xs text-[#787671] hover:bg-[#f6f5f4] rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#5645d4] hover:bg-[#4838bd] text-white transition-colors cursor-pointer"
              >
                Create Milestone
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
