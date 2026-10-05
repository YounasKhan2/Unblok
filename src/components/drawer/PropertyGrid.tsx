import React, { useState } from 'react';
import { Issue } from '../../types';
import { useProject } from '../../context/ProjectContext';
import { useKeyboard } from '../../context/KeyboardContext';
import { StatePill } from '../ui/StatePill';
import { PriorityIcon } from '../ui/PriorityIcon';
import { Avatar } from '../ui/Avatar';
import { Popover } from '../ui/Popover';
import { StatusPicker, PriorityPicker, AssigneePicker } from '../ui/PropertyPickers';
import { ChevronDown, Tag, Calendar, Check, Target } from 'lucide-react';

interface PropertyGridProps {
  issue: Issue;
  isReadOnly?: boolean;
}

export const PropertyGrid: React.FC<PropertyGridProps> = ({ issue, isReadOnly: propReadOnly }) => {
  const {
    teams,
    projects,
    users,
    cycles,
    milestones,
    updateIssueState,
    updateIssuePriority,
    updateIssueAssignee,
    updateIssueCycle,
    updateIssueMilestone,
    updateIssueDates,
    currentUser,
  } = useProject();

  const isReadOnly = propReadOnly ?? (currentUser.role === 'OBSERVER');

  const { activePicker, setActivePicker } = useKeyboard();

  const [statusOpen, setStatusOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [cycleOpen, setCycleOpen] = useState(false);
  const [milestoneOpen, setMilestoneOpen] = useState(false);

  // Sync with global keyboard picker triggers (S, P, A) - suppressed in readOnly
  const isStatusActive = !isReadOnly && (statusOpen || activePicker === 'STATUS');
  const isPriorityActive = !isReadOnly && (priorityOpen || activePicker === 'PRIORITY');
  const isAssigneeActive = !isReadOnly && (assigneeOpen || activePicker === 'ASSIGNEE');
  const isCycleActive = !isReadOnly && cycleOpen;
  const isMilestoneActive = !isReadOnly && milestoneOpen;

  const closePickers = () => {
    setStatusOpen(false);
    setPriorityOpen(false);
    setAssigneeOpen(false);
    setCycleOpen(false);
    setMilestoneOpen(false);
    setActivePicker(null);
  };

  const project = projects.find(p => p.id === issue.projectId);
  const team = teams.find(t => t.id === issue.teamId);
  const assignee = users.find(u => u.id === issue.assigneeId);
  const currentCycle = cycles.find(c => c.id === issue.cycleId);
  const currentMilestone = milestones.find(m => m.id === issue.milestoneId);

  return (
    <div className="grid grid-cols-2 gap-2 p-3 bg-[#fafaf9] rounded-lg border border-[#e5e3df] text-xs">
      {/* 1. Status Property */}
      <div className="relative">
        <label className="text-[10px] font-semibold text-[#787671] uppercase tracking-wider flex items-center justify-between mb-1">
          <span>Status</span>
          {!isReadOnly && <kbd className="font-mono text-[9px] text-[#a4a097] border border-[#e5e3df] px-1 rounded bg-white">S</kbd>}
        </label>
        <button
          disabled={isReadOnly}
          onClick={() => {
            if (isReadOnly) return;
            closePickers();
            setStatusOpen(!isStatusActive);
          }}
          className={`w-full flex items-center justify-between px-2 py-1.5 bg-white border border-[#e5e3df] rounded-[6px] text-xs shadow-2xs ${
            isReadOnly ? 'cursor-default' : 'cursor-pointer hover:border-[#c8c4be]'
          }`}
        >
          <StatePill state={issue.state} size="sm" />
          {!isReadOnly && <ChevronDown className="w-3 h-3 text-[#787671]" />}
        </button>

        {!isReadOnly && (
          <Popover isOpen={isStatusActive} onClose={closePickers} width="w-48">
            <StatusPicker
              currentState={issue.state}
              onSelect={state => updateIssueState(issue.id, state)}
              onClose={closePickers}
            />
          </Popover>
        )}
      </div>

      {/* 2. Priority Property */}
      <div className="relative">
        <label className="text-[10px] font-semibold text-[#787671] uppercase tracking-wider flex items-center justify-between mb-1">
          <span>Priority</span>
          {!isReadOnly && <kbd className="font-mono text-[9px] text-[#a4a097] border border-[#e5e3df] px-1 rounded bg-white">P</kbd>}
        </label>
        <button
          disabled={isReadOnly}
          onClick={() => {
            if (isReadOnly) return;
            closePickers();
            setPriorityOpen(!isPriorityActive);
          }}
          className={`w-full flex items-center justify-between px-2 py-1.5 bg-white border border-[#e5e3df] rounded-[6px] text-xs shadow-2xs ${
            isReadOnly ? 'cursor-default' : 'cursor-pointer hover:border-[#c8c4be]'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <PriorityIcon priority={issue.priority} size="sm" />
            <span className="font-medium text-[#1a1a1a] capitalize">{issue.priority.toLowerCase()}</span>
          </div>
          {!isReadOnly && <ChevronDown className="w-3 h-3 text-[#787671]" />}
        </button>

        {!isReadOnly && (
          <Popover isOpen={isPriorityActive} onClose={closePickers} width="w-44">
            <PriorityPicker
              currentPriority={issue.priority}
              onSelect={priority => updateIssuePriority(issue.id, priority)}
              onClose={closePickers}
            />
          </Popover>
        )}
      </div>

      {/* 3. Assignee Property */}
      <div className="relative">
        <label className="text-[10px] font-semibold text-[#787671] uppercase tracking-wider flex items-center justify-between mb-1">
          <span>Assignee</span>
          {!isReadOnly && <kbd className="font-mono text-[9px] text-[#a4a097] border border-[#e5e3df] px-1 rounded bg-white">A</kbd>}
        </label>
        <button
          disabled={isReadOnly}
          onClick={() => {
            if (isReadOnly) return;
            closePickers();
            setAssigneeOpen(!isAssigneeActive);
          }}
          className={`w-full flex items-center justify-between px-2 py-1.5 bg-white border border-[#e5e3df] rounded-[6px] text-xs shadow-2xs truncate ${
            isReadOnly ? 'cursor-default' : 'cursor-pointer hover:border-[#c8c4be]'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            <Avatar user={assignee} size="xs" />
            <span className="truncate text-[#1a1a1a]">{assignee ? assignee.name : 'Unassigned'}</span>
          </div>
          {!isReadOnly && <ChevronDown className="w-3 h-3 text-[#787671] shrink-0" />}
        </button>

        {!isReadOnly && (
          <Popover isOpen={isAssigneeActive} onClose={closePickers} width="w-56">
            <AssigneePicker
              users={users}
              currentAssigneeId={issue.assigneeId}
              onSelect={assigneeId => updateIssueAssignee(issue.id, assigneeId)}
              onClose={closePickers}
            />
          </Popover>
        )}
      </div>

      {/* 4. Cycle / Sprint Property */}
      <div className="relative">
        <label className="text-[10px] font-semibold text-[#787671] uppercase tracking-wider flex items-center justify-between mb-1">
          <span>Cycle</span>
          <Calendar className="w-2.5 h-2.5 text-[#a4a097]" />
        </label>
        <button
          disabled={isReadOnly}
          onClick={() => {
            if (isReadOnly) return;
            closePickers();
            setCycleOpen(!isCycleActive);
          }}
          className={`w-full flex items-center justify-between px-2 py-1.5 bg-white border border-[#e5e3df] rounded-[6px] text-xs shadow-2xs truncate ${
            isReadOnly ? 'cursor-default' : 'cursor-pointer hover:border-[#c8c4be]'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            <Calendar className="w-3 h-3 text-[#5645d4] shrink-0" />
            <span className="truncate text-[#1a1a1a]">
              {currentCycle ? currentCycle.name : 'No Cycle'}
            </span>
          </div>
          {!isReadOnly && <ChevronDown className="w-3 h-3 text-[#787671] shrink-0" />}
        </button>

        {!isReadOnly && (
          <Popover isOpen={isCycleActive} onClose={closePickers} width="w-52">
            <div className="p-1 space-y-0.5">
              <div className="text-[10px] font-semibold text-[#787671] uppercase tracking-wider px-2 py-1">
                Select Cycle
              </div>
              <button
                onClick={() => {
                  updateIssueCycle(issue.id, undefined);
                  closePickers();
                }}
                className="w-full flex items-center justify-between px-2 py-1.5 text-xs rounded hover:bg-[#f6f5f4] text-left cursor-pointer"
              >
                <span className="text-[#787671]">No Cycle (Backlog)</span>
                {!issue.cycleId && <Check className="w-3 h-3 text-[#5645d4]" />}
              </button>
              {cycles.map(c => {
                const isSelected = issue.cycleId === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      updateIssueCycle(issue.id, c.id);
                      closePickers();
                    }}
                    className="w-full flex items-center justify-between px-2 py-1.5 text-xs rounded hover:bg-[#f6f5f4] text-left cursor-pointer"
                  >
                    <span className={isSelected ? 'font-semibold text-[#5645d4]' : 'text-[#37352f]'}>
                      {c.name}
                    </span>
                    {isSelected && <Check className="w-3 h-3 text-[#5645d4]" />}
                  </button>
                );
              })}
            </div>
          </Popover>
        )}
      </div>

      {/* 5. Strategic Milestone Property */}
      <div className="relative">
        <label className="text-[10px] font-semibold text-[#787671] uppercase tracking-wider flex items-center justify-between mb-1">
          <span>Milestone</span>
          <Target className="w-2.5 h-2.5 text-[#a4a097]" />
        </label>
        <button
          disabled={isReadOnly}
          onClick={() => {
            if (isReadOnly) return;
            closePickers();
            setMilestoneOpen(!isMilestoneActive);
          }}
          className={`w-full flex items-center justify-between px-2 py-1.5 bg-white border border-[#e5e3df] rounded-[6px] text-xs shadow-2xs truncate ${
            isReadOnly ? 'cursor-default' : 'cursor-pointer hover:border-[#c8c4be]'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            <Target className="w-3 h-3 text-[#5645d4] shrink-0" />
            <span className="truncate text-[#1a1a1a]">
              {currentMilestone ? currentMilestone.name : 'No Milestone'}
            </span>
          </div>
          {!isReadOnly && <ChevronDown className="w-3 h-3 text-[#787671] shrink-0" />}
        </button>

        {!isReadOnly && (
          <Popover isOpen={isMilestoneActive} onClose={closePickers} width="w-60">
            <div className="p-1 space-y-0.5">
              <div className="text-[10px] font-semibold text-[#787671] uppercase tracking-wider px-2 py-1">
                Select Milestone
              </div>
              <button
                onClick={() => {
                  updateIssueMilestone(issue.id, undefined);
                  closePickers();
                }}
                className="w-full flex items-center justify-between px-2 py-1.5 text-xs rounded hover:bg-[#f6f5f4] text-left cursor-pointer"
              >
                <span className="text-[#787671]">No Milestone</span>
                {!issue.milestoneId && <Check className="w-3 h-3 text-[#5645d4]" />}
              </button>
              {milestones.map(m => {
                const isSelected = issue.milestoneId === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      updateIssueMilestone(issue.id, m.id);
                      closePickers();
                    }}
                    className="w-full flex items-center justify-between px-2 py-1.5 text-xs rounded hover:bg-[#f6f5f4] text-left cursor-pointer"
                  >
                    <div className="truncate pr-1">
                      <span className={isSelected ? 'font-semibold text-[#5645d4]' : 'text-[#37352f]'}>
                        {m.name}
                      </span>
                    </div>
                    {isSelected && <Check className="w-3 h-3 text-[#5645d4]" />}
                  </button>
                );
              })}
            </div>
          </Popover>
        )}
      </div>

      {/* 6. Team / Project Context */}
      <div>
        <label className="text-[10px] font-semibold text-[#787671] uppercase tracking-wider block mb-1">
          Project & Team
        </label>
        <div className="px-2 py-1.5 bg-white border border-[#e5e3df] rounded-[6px] text-xs truncate flex items-center gap-1.5 shadow-2xs">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: team?.color || '#5645d4' }}
          />
          <span className="truncate text-[#37352f]" title={project?.name}>
            {project?.name || 'Project'}
          </span>
        </div>
      </div>

      {/* 7. Start Date */}
      <div>
        <label className="text-[10px] font-semibold text-[#787671] uppercase tracking-wider block mb-1">
          Start Date
        </label>
        <input
          type="date"
          disabled={isReadOnly}
          readOnly={isReadOnly}
          value={issue.startDate || ''}
          onChange={e => updateIssueDates(issue.id, e.target.value || undefined, issue.dueDate)}
          className={`w-full px-2 py-1 bg-white border border-[#e5e3df] rounded-[6px] text-xs shadow-2xs ${
            isReadOnly ? 'cursor-default bg-neutral-50/50' : 'hover:border-[#c8c4be] focus:outline-none focus:border-[#5645d4]'
          }`}
        />
      </div>

      {/* 8. Due Date */}
      <div>
        <label className="text-[10px] font-semibold text-[#787671] uppercase tracking-wider block mb-1">
          Due Date
        </label>
        <input
          type="date"
          disabled={isReadOnly}
          readOnly={isReadOnly}
          value={issue.dueDate || ''}
          onChange={e => updateIssueDates(issue.id, issue.startDate, e.target.value || undefined)}
          className={`w-full px-2 py-1 bg-white border border-[#e5e3df] rounded-[6px] text-xs shadow-2xs ${
            isReadOnly ? 'cursor-default bg-neutral-50/50' : 'hover:border-[#c8c4be] focus:outline-none focus:border-[#5645d4]'
          }`}
        />
      </div>
    </div>
  );
};
