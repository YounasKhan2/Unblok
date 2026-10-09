/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Team, Cycle } from '../../../../types';
import { Modal } from '../../../../components/ui/Modal';
import { Button } from '../../../../components/ui/Button';
import { validateCycleCreation } from '../../domain/cycleInvariants';
import { canMutatePlanning } from '../../permissions';
import { useProject } from '../../../../context/ProjectContext';
import { Clock, AlertTriangle } from 'lucide-react';

interface CreateCycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Team[];
  defaultTeamId?: string;
  onCreated?: (cycle: Cycle) => void;
}

export const CreateCycleModal: React.FC<CreateCycleModalProps> = ({
  isOpen,
  onClose,
  teams,
  defaultTeamId,
  onCreated,
}) => {
  const { createCycle, cycles, currentUser } = useProject();

  const isObserver = !canMutatePlanning(currentUser.role);

  const [teamId, setTeamId] = useState(defaultTeamId || teams[0]?.id || '');
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<'UPCOMING' | 'ACTIVE'>('UPCOMING');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isObserver) {
      setError('Permission denied: Observer users cannot create cycles.');
      return;
    }

    const validation = validateCycleCreation(
      {
        name,
        startDate,
        endDate,
        teamId,
        status,
      },
      cycles
    );

    if (!validation.valid) {
      setError(validation.errors[0]);
      return;
    }

    const created = createCycle({
      name,
      startDate,
      endDate,
      teamId,
      status,
      description,
    });

    if (!created) {
      setError('Could not create cycle. Please check active cycle rules.');
      return;
    }

    onCreated?.(created);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Delivery Cycle">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-md bg-danger/10 border border-danger/30 text-danger text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isObserver && (
          <div className="p-2.5 rounded bg-surface-muted border border-border text-xs text-text-muted">
            Read-only observer mode. Cycle creation is disabled.
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1">
            Owning Team <span className="text-danger">*</span>
          </label>
          <select
            value={teamId}
            onChange={e => setTeamId(e.target.value)}
            disabled={isObserver}
            className="w-full text-xs bg-surface-base border border-border rounded-[6px] px-3 py-2 text-text-primary focus:outline-none focus:border-accent disabled:opacity-50"
          >
            {teams.map(t => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.key})
              </option>
            ))}
          </select>
          <p className="text-[11px] text-text-muted mt-1">
            Every cycle belongs to exactly one team. Issues from this team's projects can enter this cycle.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1">
            Cycle Name <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Cycle 26"
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={isObserver}
            className="w-full text-xs bg-surface-base border border-border rounded-[6px] px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent disabled:opacity-50"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Start Date <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              disabled={isObserver}
              className="w-full text-xs bg-surface-base border border-border rounded-[6px] px-3 py-2 text-text-primary focus:outline-none focus:border-accent disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              End Date <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              disabled={isObserver}
              className="w-full text-xs bg-surface-base border border-border rounded-[6px] px-3 py-2 text-text-primary focus:outline-none focus:border-accent disabled:opacity-50"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1">
            Initial Status
          </label>
          <div className="flex items-center gap-3 text-xs">
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="cycleStatus"
                value="UPCOMING"
                checked={status === 'UPCOMING'}
                onChange={() => setStatus('UPCOMING')}
                disabled={isObserver}
              />
              <span>Upcoming</span>
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="cycleStatus"
                value="ACTIVE"
                checked={status === 'ACTIVE'}
                onChange={() => setStatus('ACTIVE')}
                disabled={isObserver}
              />
              <span>Active (One active cycle per team)</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1">
            Objective / Description
          </label>
          <textarea
            rows={2}
            placeholder="Key delivery goals for this iteration..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            disabled={isObserver}
            className="w-full text-xs bg-surface-base border border-border rounded-[6px] px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent disabled:opacity-50"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <Button type="button" variant="secondary" onClick={onClose} size="sm">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isObserver || !name.trim() || !startDate || !endDate}
          >
            Create Cycle
          </Button>
        </div>
      </form>
    </Modal>
  );
};
