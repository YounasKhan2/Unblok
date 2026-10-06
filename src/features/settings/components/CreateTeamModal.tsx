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
          <div className="p-2.5 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="team-name" className="block text-xs font-medium text-[#1a1a1a]">
            Team Name <span className="text-red-500">*</span>
          </label>
          <input
            id="team-name"
            type="text"
            required
            value={name}
            onChange={handleNameChange}
            placeholder="e.g. Security & Compliance"
            className="w-full px-3 py-1.5 text-xs border border-[#e5e3df] rounded-md focus:outline-none focus:ring-1 focus:ring-[#5645d4]"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="team-key" className="block text-xs font-medium text-[#1a1a1a]">
            Team Key <span className="text-red-500">*</span>
          </label>
          <input
            id="team-key"
            type="text"
            required
            maxLength={6}
            value={key}
            onChange={e => setKey(e.target.value.toUpperCase())}
            placeholder="e.g. SEC"
            className="w-full px-3 py-1.5 text-xs font-mono uppercase border border-[#e5e3df] rounded-md focus:outline-none focus:ring-1 focus:ring-[#5645d4]"
          />
          <p className="text-[11px] text-[#787671]">
            2-6 uppercase letters/digits used as an identifier across the workspace.
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="team-desc" className="block text-xs font-medium text-[#1a1a1a]">
            Description (Optional)
          </label>
          <textarea
            id="team-desc"
            rows={2}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Focus and mission of this team..."
            className="w-full px-3 py-1.5 text-xs border border-[#e5e3df] rounded-md focus:outline-none focus:ring-1 focus:ring-[#5645d4]"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-[#e5e3df]">
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
