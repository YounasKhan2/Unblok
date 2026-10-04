import React from 'react';
import { useProject } from '../../context/ProjectContext';
import { IssueRow } from './IssueRow';
import { PlusCircle, Filter } from 'lucide-react';
import { Button } from '../ui/Button';

export const IssueList: React.FC = () => {
  const {
    filteredIssues,
    selectedIssueId,
    setSelectedIssueId,
    selectedIssueIds,
    toggleSelectIssue,
    selectAllIssues,
    clearSelection,
    setIsDrawerOpen,
    resetFilters,
  } = useProject();

  const handleSelectIssue = (id: string) => {
    setSelectedIssueId(id);
    setIsDrawerOpen(true);
  };

  const isAllSelected =
    filteredIssues.length > 0 &&
    filteredIssues.every(i => selectedIssueIds.includes(i.id));
  const isSomeSelected =
    filteredIssues.some(i => selectedIssueIds.includes(i.id)) && !isAllSelected;

  const handleMasterToggle = () => {
    if (isAllSelected) {
      clearSelection();
    } else {
      selectAllIssues();
    }
  };

  if (filteredIssues.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-xs text-[#787671] bg-white">
        <div className="w-10 h-10 rounded-full bg-[#f6f5f4] flex items-center justify-center mb-3 text-[#a4a097]">
          <Filter className="w-5 h-5" />
        </div>
        <div className="text-sm font-semibold text-[#1a1a1a] mb-1">No issues match current filters</div>
        <p className="max-w-sm text-[#787671] mb-4">
          Try adjusting your search query, status filters, or clear all filters to see the full backlog.
        </p>
        <Button size="sm" variant="secondary" onClick={resetFilters}>
          Clear All Filters
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden">
      {/* Table Header */}
      <div className="flex items-center h-7 px-3 bg-[#fafaf9] border-b border-[#e5e3df] text-[11px] font-semibold text-[#787671] uppercase tracking-wider select-none shrink-0">
        <div className="w-5 shrink-0 flex items-center pr-1">
          <input
            type="checkbox"
            checked={isAllSelected}
            ref={el => {
              if (el) el.indeterminate = isSomeSelected;
            }}
            onChange={handleMasterToggle}
            className="w-3.5 h-3.5 rounded-[3px] border-[#c8c4be] text-[#5645d4] focus:ring-0 cursor-pointer"
            title="Select all filtered issues (Cmd+A)"
          />
        </div>
        <div className="w-7 text-center">Pri</div>
        <div className="w-20">Key</div>
        <div className="flex-1 min-w-0 pr-3">Title</div>
        <div className="w-28 text-left mr-3">Blockers</div>
        <div className="w-28 text-left">Status</div>
        <div className="w-24 text-left hidden md:block">Team</div>
        <div className="w-28 text-left">Assignee</div>
      </div>

      {/* Rows Container */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#e5e3df]/60">
        {filteredIssues.map(issue => (
          <IssueRow
            key={issue.id}
            issue={issue}
            isSelected={issue.id === selectedIssueId}
            isMultiSelected={selectedIssueIds.includes(issue.id)}
            onSelect={() => handleSelectIssue(issue.id)}
            onToggleMultiSelect={isShift => toggleSelectIssue(issue.id, isShift)}
          />
        ))}
      </div>
    </div>
  );
};
