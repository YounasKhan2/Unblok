import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { StatePill } from '../ui/StatePill';
import { PriorityIcon } from '../ui/PriorityIcon';
import { Avatar } from '../ui/Avatar';
import { Popover } from '../ui/Popover';
import { StatusPicker, PriorityPicker, AssigneePicker } from '../ui/PropertyPickers';
import {
  CheckSquare,
  X,
  Layers,
  Signal,
  UserCheck,
  Link2,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';
import { IssueState, IssuePriority } from '../../types';

export const BulkActionBar: React.FC = () => {
  const {
    selectedIssueIds,
    clearSelection,
    selectAllIssues,
    bulkUpdateState,
    bulkUpdatePriority,
    bulkUpdateAssignee,
    bulkAddBlocker,
    users,
    issues,
  } = useProject();

  const [activeMenu, setActiveMenu] = useState<'STATUS' | 'PRIORITY' | 'ASSIGNEE' | 'BLOCKER' | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (selectedIssueIds.length === 0) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleStatusSelect = (state: IssueState) => {
    const res = bulkUpdateState(state);
    setActiveMenu(null);
    if (res.blocked > 0) {
      showToast(`Updated ${res.updated} issue(s). ${res.blocked} blocked by active prerequisites.`);
    } else {
      showToast(`Updated ${res.updated} issue(s) to ${state}.`);
    }
  };

  const handlePrioritySelect = (priority: IssuePriority) => {
    bulkUpdatePriority(priority);
    setActiveMenu(null);
    showToast(`Updated priority of ${selectedIssueIds.length} issue(s) to ${priority}.`);
  };

  const handleAssigneeSelect = (assigneeId?: string) => {
    bulkUpdateAssignee(assigneeId);
    setActiveMenu(null);
    const user = users.find(u => u.id === assigneeId);
    showToast(`Assigned ${selectedIssueIds.length} issue(s) to ${user ? user.name : 'Unassigned'}.`);
  };

  const handleAddBlockerSelect = (upstreamId: string) => {
    const res = bulkAddBlocker(upstreamId);
    setActiveMenu(null);
    const upstream = issues.find(i => i.id === upstreamId);
    showToast(`Added blocker ${upstream?.key || ''} to ${res.added} issue(s).`);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="mb-2 px-3 py-1.5 bg-[#0a1530] text-white text-xs rounded-lg shadow-lg border border-[#1a2a52] flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#1aae39]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Floating Action Strip - Notion sober rectangular 8px rounded geometry */}
      <div className="flex items-center gap-2 bg-[#0a1530] text-white px-4 py-2 rounded-xl shadow-2xl border border-[#1a2a52] text-xs animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Count badge */}
        <div className="flex items-center gap-2 pr-2 border-r border-[#1a2a52]">
          <CheckSquare className="w-4 h-4 text-[#ff64c8]" />
          <span className="font-semibold text-white">
            {selectedIssueIds.length} selected
          </span>
          <button
            onClick={selectAllIssues}
            className="text-[11px] text-[#a4a097] hover:text-white underline ml-1 cursor-pointer"
          >
            All
          </button>
        </div>

        {/* 1. Status Bulk Action */}
        <div className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === 'STATUS' ? null : 'STATUS')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Status</span>
            <ChevronDown className="w-3 h-3 text-[#a4a097]" />
          </button>

          <Popover isOpen={activeMenu === 'STATUS'} onClose={() => setActiveMenu(null)} width="w-48" placement="top">
            <StatusPicker
              currentState="TODO"
              onSelect={handleStatusSelect}
              onClose={() => setActiveMenu(null)}
            />
          </Popover>
        </div>

        {/* 2. Priority Bulk Action */}
        <div className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === 'PRIORITY' ? null : 'PRIORITY')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors cursor-pointer"
          >
            <Signal className="w-3.5 h-3.5" />
            <span>Priority</span>
            <ChevronDown className="w-3 h-3 text-[#a4a097]" />
          </button>

          <Popover isOpen={activeMenu === 'PRIORITY'} onClose={() => setActiveMenu(null)} width="w-44" placement="top">
            <PriorityPicker
              currentPriority="MEDIUM"
              onSelect={handlePrioritySelect}
              onClose={() => setActiveMenu(null)}
            />
          </Popover>
        </div>

        {/* 3. Assignee Bulk Action */}
        <div className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === 'ASSIGNEE' ? null : 'ASSIGNEE')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Assignee</span>
            <ChevronDown className="w-3 h-3 text-[#a4a097]" />
          </button>

          <Popover isOpen={activeMenu === 'ASSIGNEE'} onClose={() => setActiveMenu(null)} width="w-56" placement="top">
            <AssigneePicker
              users={users}
              onSelect={handleAssigneeSelect}
              onClose={() => setActiveMenu(null)}
            />
          </Popover>
        </div>

        {/* 4. Add Common Blocker Bulk Action */}
        <div className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === 'BLOCKER' ? null : 'BLOCKER')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors cursor-pointer"
          >
            <Link2 className="w-3.5 h-3.5 text-[#ff64c8]" />
            <span>Add Blocker</span>
            <ChevronDown className="w-3 h-3 text-[#a4a097]" />
          </button>

          <Popover isOpen={activeMenu === 'BLOCKER'} onClose={() => setActiveMenu(null)} width="w-64" placement="top">
            <div className="p-2 space-y-1">
              <div className="text-[10px] font-semibold text-[#787671] uppercase tracking-wider px-1">
                Select Upstream Blocker
              </div>
              <p className="text-[11px] text-[#787671] px-1 mb-1">
                Will mark selected {selectedIssueIds.length} tasks as blocked by:
              </p>
              <div className="max-h-48 overflow-y-auto space-y-0.5">
                {issues
                  .filter(i => !selectedIssueIds.includes(i.id))
                  .slice(0, 8)
                  .map(issue => (
                    <button
                      key={issue.id}
                      onClick={() => handleAddBlockerSelect(issue.id)}
                      className="w-full flex items-center justify-between p-1.5 text-xs rounded hover:bg-[#f6f5f4] text-left cursor-pointer truncate"
                    >
                      <span className="font-mono font-semibold text-[#5645d4] mr-2">
                        {issue.key}
                      </span>
                      <span className="truncate text-[#37352f] flex-1">{issue.title}</span>
                    </button>
                  ))}
              </div>
            </div>
          </Popover>
        </div>

        {/* Deselect / Dismiss */}
        <button
          onClick={clearSelection}
          className="p-1.5 text-[#a4a097] hover:text-white rounded hover:bg-white/10 transition-colors ml-1 cursor-pointer"
          title="Clear selection (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
