import React from 'react';
import { IssueState, Issue } from '../../types';
import { useProject } from '../../context/ProjectContext';
import { IssueCard } from './IssueCard';
import { STATE_CONFIG } from '../ui/StatePill';
import { Plus } from 'lucide-react';
import { useKeyboard } from '../../context/KeyboardContext';

export const IssueBoard: React.FC = () => {
  const {
    filteredIssues,
    selectedIssueId,
    setSelectedIssueId,
    setIsDrawerOpen,
    updateIssueState,
  } = useProject();

  const { setIsCreateModalOpen } = useKeyboard();

  const columns: IssueState[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

  const issuesByColumn = columns.reduce((acc, col) => {
    acc[col] = filteredIssues.filter(i => i.state === col);
    return acc;
  }, {} as Record<IssueState, Issue[]>);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetState: IssueState) => {
    e.preventDefault();
    const issueId = e.dataTransfer.getData('text/plain');
    if (issueId) {
      updateIssueState(issueId, targetState);
    }
  };

  return (
    <div className="flex-1 flex overflow-x-auto p-4 gap-3 bg-canvas min-w-0">
      {columns.map(state => {
        const config = STATE_CONFIG[state];
        const Icon = config.icon;
        const columnIssues = issuesByColumn[state] || [];

        return (
          <div
            key={state}
            onDragOver={handleDragOver}
            onDrop={e => handleDrop(e, state)}
            className="w-72 shrink-0 flex flex-col bg-surface-subtle/80 rounded-xl border border-border max-h-full overflow-hidden"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-3 py-2.5 bg-surface-base/80 border-b border-border text-xs">
              <div className="flex items-center gap-2">
                <Icon className={`w-3.5 h-3.5 ${config.textClass}`} />
                <span className="font-semibold text-text-primary">{config.label}</span>
                <span className="text-[11px] font-medium px-1.5 py-0.2 rounded-full bg-surface-muted text-text-muted">
                  {columnIssues.length}
                </span>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="p-1 text-text-muted hover:text-text-primary hover:bg-surface-subtle rounded transition-colors cursor-pointer"
                title="Create issue in this column (C)"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Column Cards Container */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {columnIssues.length === 0 ? (
                <div className="h-20 flex items-center justify-center border-2 border-dashed border-border rounded-lg text-[11px] text-text-muted">
                  No issues
                </div>
              ) : (
                columnIssues.map(issue => (
                  <div
                    key={issue.id}
                    draggable
                    onDragStart={e => e.dataTransfer.setData('text/plain', issue.id)}
                  >
                    <IssueCard
                      issue={issue}
                      isSelected={issue.id === selectedIssueId}
                      onSelect={() => {
                        setSelectedIssueId(issue.id);
                        setIsDrawerOpen(true);
                      }}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
