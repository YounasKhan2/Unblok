import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { useSettings } from '../context/SettingsContext';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateTeamModal: React.FC<CreateTeamModalProps> = ({ isOpen, onClose }) => {
  const { createTeam } = useSettings();
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    // Auto-generate suggested key if user hasn't typed a custom key
    if (!key || key.length <= 4) {
      const generated = val
        .trim()
        .split(/\s+/)
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 4);
      if (generated) setKey(generated);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      createTeam({
        name: name.trim(),
        key: key.trim().toUpperCase(),
        description: description.trim() || undefined,
      });
      // Reset & close
      setName('');
      setKey('');
      setDescription('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create team');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Team"
      description="Create an engineering squad or functional team."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2.5 rounded-md bg-danger/10 border border-danger/30 text-xs text-danger font-medium">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="team-name" className="block text-xs font-medium text-text-primary">
            Team Name <span className="text-danger">*</span>
          </label>
          <input
            id="team-name"
            type="text"
            required
            value={name}
            onChange={handleNameChange}
            placeholder="e.g. Security & Compliance"
            className="w-full px-3 py-1.5 text-xs bg-surface-base border border-border text-text-primary rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="team-key" className="block text-xs font-medium text-text-primary">
            Team Key <span className="text-danger">*</span>
          </label>
          <input
            id="team-key"
            type="text"
            required
            maxLength={6}
            value={key}
            onChange={e => setKey(e.target.value.toUpperCase())}
            placeholder="e.g. SEC"
            className="w-full px-3 py-1.5 text-xs font-mono uppercase bg-surface-base border border-border text-text-primary rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <p className="text-[11px] text-text-muted">
            2-6 uppercase letters/digits used as an identifier across the workspace.
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="team-desc" className="block text-xs font-medium text-text-primary">
            Description (Optional)
          </label>
          <textarea
            id="team-desc"
            rows={2}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Focus and mission of this team..."
            className="w-full px-3 py-1.5 text-xs bg-surface-base border border-border text-text-primary rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit">
            Create Team
          </Button>
        </div>
      </form>
    </Modal>
  );
};
