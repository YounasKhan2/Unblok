/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Cycle, Issue } from '../../../../types';
import { Modal } from '../../../../components/ui/Modal';
import { Button } from '../../../../components/ui/Button';
import { StatePill } from '../../../../components/ui/StatePill';
import { PriorityIcon } from '../../../../components/ui/PriorityIcon';
import { useProject } from '../../../../context/ProjectContext';
import { selectRolloverOptions } from '../../selectors/cycleSelectors';
import { canMutatePlanning } from '../../permissions';
import { CheckCircle2, RotateCw, AlertTriangle, ArrowRight } from 'lucide-react';

interface CompleteCycleRolloverModalProps {
  isOpen: boolean;
  onClose: () => void;
  cycle: Cycle;
  onCompleted?: () => void;
}

export const CompleteCycleRolloverModal: React.FC<CompleteCycleRolloverModalProps> = ({
  isOpen,
  onClose,
  cycle,
  onCompleted,
}) => {
  const { cycles, issues, completeCycle, currentUser } = useProject();

  const isObserver = !canMutatePlanning(currentUser.role);

  const { unfinishedIssues, eligibleTargetCycles } = useMemo(
    () => selectRolloverOptions(cycle.id, cycles, issues),
    [cycle.id, cycles, issues]
  );

  const [targetCycleId, setTargetCycleId] = useState<string>(
    eligibleTargetCycles[0]?.id || ''
  );

  const [selectedIssueIds, setSelectedIssueIds] = useState<string[]>(() =>
    unfinishedIssues.map(i => i.id)
  );

  const [shouldRollover, setShouldRollover] = useState(eligibleTargetCycles.length > 0);
  const [error, setError] = useState<string | null>(null);

  const toggleIssue = (id: string) => {
    setSelectedIssueIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIssueIds.length === unfinishedIssues.length) {
      setSelectedIssueIds([]);
    } else {
      setSelectedIssueIds(unfinishedIssues.map(i => i.id));
    }
  };

  const handleComplete = () => {
    setError(null);

    if (isObserver) {
      setError('Permission denied: Observer cannot complete cycles.');
      return;
    }

    const rolloverPayload =
      shouldRollover && targetCycleId
        ? {
            targetCycleId,
            issueIdsToRollover: selectedIssueIds,
          }
        : undefined;

    const result = completeCycle(cycle.id, rolloverPayload);
    if (!result.success) {
      setError(result.error || 'Failed to complete cycle.');
      return;
    }

    onCompleted?.();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Complete ${cycle.name}`}>
      <div className="space-y-4">
        {error && (
          <div className="p-3 rounded-md bg-danger/10 border border-danger/30 text-danger text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3 bg-surface-muted rounded-md border border-border text-xs text-text-secondary leading-relaxed">
          <p className="font-medium text-text-primary mb-1">
            Separation of Cycle & Issue Completion:
          </p>
          <p>
            Completing this cycle marks the cadence as finished. Any completed tasks (Done/Cancelled)
            remain recorded here. Unfinished tasks require explicit rollover handling.
          </p>
        </div>

        {unfinishedIssues.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-text-primary">
                Unfinished Tasks ({unfinishedIssues.length})
              </span>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[11px] text-accent hover:underline cursor-pointer"
              >
                {selectedIssueIds.length === unfinishedIssues.length
                  ? 'Deselect All'
                  : 'Select All'}
              </button>
            </div>

            <div className="max-h-44 overflow-y-auto border border-border rounded-md divide-y divide-border">
              {unfinishedIssues.map(issue => (
                <label
                  key={issue.id}
                  className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-surface-subtle cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedIssueIds.includes(issue.id)}
                    onChange={() => toggleIssue(issue.id)}
                    className="w-3.5 h-3.5 rounded border-border-strong text-accent focus:ring-0"
                  />
                  <PriorityIcon priority={issue.priority} size="sm" />
                  <span className="font-mono text-accent font-semibold">{issue.key}</span>
                  <span className="truncate flex-1 text-text-primary">{issue.title}</span>
                  <StatePill state={issue.state} size="sm" />
                </label>
              ))}
            </div>

            {/* Target cycle selection */}
            <div className="mt-4 pt-3 border-t border-border space-y-3">
              <label className="flex items-center gap-2 text-xs text-text-primary font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={shouldRollover}
                  onChange={e => setShouldRollover(e.target.checked)}
                  disabled={eligibleTargetCycles.length === 0}
                />
                <span>Roll forward selected unfinished tasks into upcoming team cycle</span>
              </label>

              {shouldRollover && (
                <div>
                  <label className="block text-[11px] font-semibold text-text-muted mb-1">
                    Target Upcoming Cycle (Same Team)
                  </label>
                  {eligibleTargetCycles.length > 0 ? (
                    <select
                      value={targetCycleId}
                      onChange={e => setTargetCycleId(e.target.value)}
                      className="w-full text-xs bg-surface-base border border-border rounded-[6px] px-3 py-2 text-text-primary focus:outline-none focus:border-accent"
                    >
                      {eligibleTargetCycles.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.startDate} → {c.endDate})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs text-warning">
                      No upcoming cycle found for this team. Tasks not rolled over will become unscheduled backlog tasks.
                    </p>
                  )}
                </div>
              )}

              <p className="text-[11px] text-text-muted">
                Unfinished tasks that are not rolled forward will have their cycle assignment cleared and return to the project backlog.
              </p>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-text-muted flex flex-col items-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-success" />
            <span className="font-semibold text-text-primary">All tasks completed!</span>
            <span>All tasks in this cycle have been executed or cancelled.</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <Button type="button" variant="secondary" onClick={onClose} size="sm">
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleComplete}
            disabled={isObserver}
          >
            Complete Cycle
          </Button>
        </div>
      </div>
    </Modal>
  );
};
