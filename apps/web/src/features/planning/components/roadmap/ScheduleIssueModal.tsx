/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Issue } from '../../../../types';
import { Modal } from '../../../../components/ui/Modal';
import { Button } from '../../../../components/ui/Button';
import { PriorityIcon } from '../../../../components/ui/PriorityIcon';
import { StatePill } from '../../../../components/ui/StatePill';
import { validateScheduleDates } from '../../domain/scheduleInvariants';
import { useProject } from '../../../../context/ProjectContext';
import { canMutatePlanning } from '../../permissions';
import { Calendar, Search, AlertTriangle } from 'lucide-react';

interface ScheduleIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultIssue?: Issue;
  onScheduled?: () => void;
}

export const ScheduleIssueModal: React.FC<ScheduleIssueModalProps> = ({
  isOpen,
  onClose,
  defaultIssue,
  onScheduled,
}) => {
  const { issues, updateIssueDates, currentUser } = useProject();

  const isObserver = !canMutatePlanning(currentUser.role);

  const [selectedIssueId, setSelectedIssueId] = useState<string>(defaultIssue?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState(defaultIssue?.startDate || '');
  const [dueDate, setDueDate] = useState(defaultIssue?.dueDate || '');
  const [error, setError] = useState<string | null>(null);

  const filteredIssues = useMemo(() => {
    if (!searchQuery.trim()) return issues.slice(0, 15);
    const q = searchQuery.toLowerCase();
    return issues.filter(i => i.key.toLowerCase().includes(q) || i.title.toLowerCase().includes(q));
  }, [issues, searchQuery]);

  const selectedIssue = useMemo(
    () => issues.find(i => i.id === selectedIssueId),
    [issues, selectedIssueId]
  );

  const handleSelectIssue = (issue: Issue) => {
    setSelectedIssueId(issue.id);
    setStartDate(issue.startDate || '');
    setDueDate(issue.dueDate || '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isObserver) {
      setError('Permission denied: Observer cannot schedule work.');
      return;
    }

    if (!selectedIssueId) {
      setError('Please select an issue to schedule.');
      return;
    }

    const check = validateScheduleDates(startDate, dueDate);
    if (!check.valid) {
      setError(check.error || 'Invalid schedule dates.');
      return;
    }

    const success = updateIssueDates(selectedIssueId, startDate || undefined, dueDate || undefined);
    if (!success) {
      setError('Failed to update schedule dates.');
      return;
    }

    onScheduled?.();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Schedule Work Item">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2.5 rounded bg-danger/10 border border-danger/30 text-danger text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Selected Issue Preview */}
        {selectedIssue ? (
          <div className="p-3 bg-surface-subtle border border-border rounded-md flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <PriorityIcon priority={selectedIssue.priority} size="sm" />
              <span className="font-mono text-accent font-semibold">{selectedIssue.key}</span>
              <span className="truncate text-xs text-text-primary font-medium">
                {selectedIssue.title}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedIssueId('')}
              className="text-xs text-accent hover:underline shrink-0 ml-2"
            >
              Change
            </button>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Select Task to Schedule
            </label>
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by key or title..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-[6px] border border-border bg-surface-base text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
              />
            </div>

            <div className="max-h-40 overflow-y-auto border border-border rounded-md divide-y divide-border">
              {filteredIssues.map(issue => (
                <div
                  key={issue.id}
                  onClick={() => handleSelectIssue(issue)}
                  className="p-2 hover:bg-surface-subtle flex items-center justify-between text-xs cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <PriorityIcon priority={issue.priority} size="sm" />
                    <span className="font-mono text-accent font-semibold">{issue.key}</span>
                    <span className="truncate text-text-primary">{issue.title}</span>
                  </div>
                  <StatePill state={issue.state} size="sm" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              disabled={isObserver}
              className="w-full text-xs px-3 py-2 rounded-[6px] border border-border bg-surface-base text-text-primary focus:outline-none focus:border-accent disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              disabled={isObserver}
              className="w-full text-xs px-3 py-2 rounded-[6px] border border-border bg-surface-base text-text-primary focus:outline-none focus:border-accent disabled:opacity-50"
            />
          </div>
        </div>

        <p className="text-[11px] text-text-muted">
          Roadmap visualizes tasks across their startDate and dueDate schedule range.
        </p>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <Button type="button" variant="secondary" onClick={onClose} size="sm">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isObserver || !selectedIssueId}
          >
            Save Schedule
          </Button>
        </div>
      </form>
    </Modal>
  );
};
