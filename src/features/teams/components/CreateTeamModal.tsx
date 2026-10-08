/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-14 Reusable Create Team Modal Component
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { useProject } from '../../../context/ProjectContext';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { validateTeamInput } from '../domain/teamResolution';
import { Team } from '../../../types';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (team: Team) => void;
}

const PRESET_COLORS = [
  '#5645d4', // Indigo / Brand
  '#0ea5e9', // Sky blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#64748b', // Slate
];

export const CreateTeamModal: React.FC<CreateTeamModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { teams, currentUser, createTeam } = useProject();

  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [touched, setTouched] = useState<{ name?: boolean; key?: boolean }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isAdmin = currentUser.role === 'ADMIN';

  useEffect(() => {
    if (isOpen) {
      setName('');
      setKey('');
      setDescription('');
      setColor(PRESET_COLORS[0]);
      setTouched({});
      setSubmitError(null);
    }
  }, [isOpen]);

  // Auto-generate key from name if user hasn't explicitly customized key
  const handleNameChange = (val: string) => {
    setName(val);
    if (!touched.key) {
      const suggested = val
        .trim()
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 4)
        .toUpperCase();
      setKey(suggested);
    }
  };

  const validation = validateTeamInput({ name, key }, teams);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, key: true });

    if (!isAdmin) {
      setSubmitError('Team creation requires Administrator permissions.');
      return;
    }

    if (!validation.valid) {
      setSubmitError(validation.error || 'Please resolve form errors before submitting.');
      return;
    }

    try {
      const newTeam = createTeam({
        name: name.trim(),
        key: key.trim().toUpperCase(),
        description: description.trim(),
        color,
      });

      if (onCreated) {
        onCreated(newTeam);
      }
      onClose();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to create team.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create team" maxWidth="md">
      <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
        {!isAdmin && (
          <div
            role="alert"
            className="flex items-center gap-2 p-3 text-xs rounded-lg border border-warning/30 bg-warning/10 text-warning"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Only workspace Administrators can create teams.</span>
          </div>
        )}

        {submitError && (
          <div
            role="alert"
            className="flex items-center gap-2 p-3 text-xs rounded-lg border border-danger/30 bg-danger/10 text-danger"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Team Name */}
        <div>
          <label className="block text-xs font-medium text-text-primary mb-1">
            Team name <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNameChange(e.target.value)}
            onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
            placeholder="e.g. Core Engineering"
            disabled={!isAdmin}
            autoFocus
            className="w-full text-xs bg-surface-base border border-border rounded-lg p-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
          />
          {touched.name && validation.errors.name && (
            <p className="mt-1 text-xs text-danger">{validation.errors.name}</p>
          )}
        </div>

        {/* Team Key */}
        <div>
          <label className="block text-xs font-medium text-text-primary mb-1">
            Team key <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            value={key}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setKey(e.target.value.toUpperCase());
              setTouched((prev) => ({ ...prev, key: true }));
            }}
            onBlur={() => setTouched((prev) => ({ ...prev, key: true }))}
            placeholder="e.g. ENG"
            maxLength={6}
            disabled={!isAdmin}
            className="w-full text-xs font-mono bg-surface-base border border-border rounded-lg p-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent uppercase disabled:opacity-50"
          />
          <p className="mt-1 text-[11px] text-text-muted">
            2–6 uppercase characters used as prefix for owned work.
          </p>
          {touched.key && validation.errors.key && (
            <p className="mt-1 text-xs text-danger">{validation.errors.key}</p>
          )}
        </div>

        {/* Color Palette */}
        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1.5">
            Team color badge
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                disabled={!isAdmin}
                className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer ${
                  color === c ? 'border-text-primary scale-110 shadow-sm' : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
                aria-label={`Select color ${c}`}
              />
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-text-primary mb-1">
            Description <span className="text-text-muted font-normal">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this team build and maintain?"
            disabled={!isAdmin}
            rows={3}
            className="w-full text-xs bg-surface-base border border-border rounded-lg p-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent resize-none disabled:opacity-50"
          />
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!isAdmin || (Boolean(touched.name) && !validation.valid)}
          >
            Create Team
          </Button>
        </div>
      </form>
    </Modal>
  );
};
