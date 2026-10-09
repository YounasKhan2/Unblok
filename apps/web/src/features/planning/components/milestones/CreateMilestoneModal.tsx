/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Milestone } from '../../../../types';
import { Modal } from '../../../../components/ui/Modal';
import { Button } from '../../../../components/ui/Button';
import { useProject } from '../../../../context/ProjectContext';
import { canMutatePlanning } from '../../permissions';
import { AlertTriangle, Target } from 'lucide-react';

interface CreateMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (milestone: Milestone) => void;
}

export const CreateMilestoneModal: React.FC<CreateMilestoneModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { createMilestone, currentUser } = useProject();
  const [name, setName] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isObserver = !canMutatePlanning(currentUser.role);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isObserver) {
      setError('Permission denied: Observer cannot create milestones.');
      return;
    }

    if (!name.trim()) {
      setError('Milestone name is required.');
      return;
    }

    if (!targetDate) {
      setError('Target date is required.');
      return;
    }

    const created = createMilestone({
      name: name.trim(),
      targetDate,
      description: description.trim(),
    });

    if (!created) {
      setError('Failed to create milestone.');
      return;
    }

    onCreated?.(created);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Strategic Milestone">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2.5 rounded bg-danger/10 border border-danger/30 text-danger text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1">
            Milestone Name <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. M4: Security Compliance & Zero-Trust"
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={isObserver}
            className="w-full text-xs px-3 py-2 rounded-[6px] border border-border bg-surface-base text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1">
            Target Release Date <span className="text-danger">*</span>
          </label>
          <input
            type="date"
            value={targetDate}
            onChange={e => setTargetDate(e.target.value)}
            disabled={isObserver}
            className="w-full text-xs px-3 py-2 rounded-[6px] border border-border bg-surface-base text-text-primary focus:outline-none focus:border-accent disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1">
            Description / Strategic Scope
          </label>
          <textarea
            rows={3}
            placeholder="Key deliverables and business outcome this milestone targets..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            disabled={isObserver}
            className="w-full text-xs px-3 py-2 rounded-[6px] border border-border bg-surface-base text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent disabled:opacity-50"
          />
        </div>

        <div className="p-3 bg-surface-muted rounded-md text-xs text-text-muted">
          Milestones are workspace-scoped. Tasks from any team or project across the workspace can contribute to this strategic target.
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <Button type="button" variant="secondary" onClick={onClose} size="sm">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isObserver || !name.trim() || !targetDate}
          >
            Create Milestone
          </Button>
        </div>
      </form>
    </Modal>
  );
};
