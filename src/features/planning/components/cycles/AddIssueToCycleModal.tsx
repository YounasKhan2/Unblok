/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Cycle, Issue, Project } from '../../../../types';
import { Modal } from '../../../../components/ui/Modal';
import { Button } from '../../../../components/ui/Button';
import { StatePill } from '../../../../components/ui/StatePill';
import { PriorityIcon } from '../../../../components/ui/PriorityIcon';
import { BlockerBadge } from '../../../../components/ui/BlockerBadge';
import { selectAddIssueCandidates } from '../../selectors/cycleSelectors';
import { useProject } from '../../../../context/ProjectContext';
import { canMutatePlanning } from '../../permissions';
import { Search, Plus, Check, AlertTriangle } from 'lucide-react';

interface AddIssueToCycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  cycle: Cycle;
  onIssueAdded?: () => void;
}

export const AddIssueToCycleModal: React.FC<AddIssueToCycleModalProps> = ({
  isOpen,
  onClose,
  cycle,
  onIssueAdded,
}) => {
  const { issues, projects, updateIssueCycle, getIssueBlockerStatus, currentUser } = useProject();
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isObserver = !canMutatePlanning(currentUser.role);

  const candidates = useMemo(
    () => selectAddIssueCandidates(cycle, issues, projects, searchQuery),
    [cycle, issues, projects, searchQuery]
  );

  const projectsMap = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);

  const handleAdd = (issueId: string) => {
    setError(null);
    if (isObserver) {
      setError('Permission denied: Observer cannot assign issues to cycles.');
      return;
    }

    const success = updateIssueCycle(issueId, cycle.id);
    if (!success) {
      setError('Failed to assign issue to cycle. Please check team ownership.');
      return;
    }

    onIssueAdded?.();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add Tasks to ${cycle.name}`}>
      <div className="space-y-3">
        {error && (
          <div className="p-2.5 rounded bg-danger/10 border border-danger/30 text-danger text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search eligible team tasks by key, title, or project..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-2 rounded-[6px] border border-border bg-surface-base text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
          />
        </div>

        <div className="text-[11px] text-text-muted">
          Showing tasks from projects owned by team <span className="font-semibold text-text-primary">{cycle.teamId}</span> not currently in this cycle.
        </div>

        <div className="max-h-64 overflow-y-auto border border-border rounded-md divide-y divide-border">
          {candidates.length === 0 ? (
            <div className="p-8 text-center text-xs text-text-muted">
              No eligible unassigned tasks found for this team.
            </div>
          ) : (
            candidates.map(issue => {
              const project = projectsMap.get(issue.projectId);
              const blocker = getIssueBlockerStatus(issue.id);

              return (
                <div
                  key={issue.id}
                  className="flex items-center justify-between p-2.5 hover:bg-surface-subtle gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <PriorityIcon priority={issue.priority} size="sm" />
                    <span className="font-mono text-accent font-semibold">{issue.key}</span>
                    <span className="truncate text-text-primary font-medium">{issue.title}</span>
                    {project && (
                      <span className="text-[10px] text-text-muted px-1.5 py-0.2 rounded bg-surface-muted border border-border shrink-0">
                        {project.name}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <BlockerBadge status={blocker} compact={true} />
                    <StatePill state={issue.state} size="sm" />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleAdd(issue.id)}
                      disabled={isObserver}
                      icon={<Plus className="w-3 h-3" />}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-border">
          <Button type="button" variant="secondary" onClick={onClose} size="sm">
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
