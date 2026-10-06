import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Team, User } from '../../../types';
import { useSettings } from '../context/SettingsContext';

interface EditTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team | null;
  users: User[];
}

export const EditTeamModal: React.FC<EditTeamModalProps> = ({
  isOpen,
  onClose,
  team,
  users,
}) => {
  const { updateTeam } = useSettings();
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [leadId, setLeadId] = useState<string>('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (team) {
      setName(team.name);
      setKey(team.key);
      setDescription(team.description || '');
      setLeadId((team as any).leadId || '');
      setSelectedMemberIds(
        users.filter(u => u.teamId === team.id).map(u => u.id)
      );
      setError(null);
    }
  }, [team, users]);

  if (!team) return null;

  const handleToggleMember = (userId: string) => {
    setSelectedMemberIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      updateTeam(team.id, {
        name: name.trim(),
        key: key.trim().toUpperCase(),
        description: description.trim() || undefined,
        leadId: leadId || undefined,
        memberIds: selectedMemberIds,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update team');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Team: ${team.name}`}
      description="Update team attributes and member assignments."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2.5 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="edit-team-name" className="block text-xs font-medium text-[#1a1a1a]">
              Team Name <span className="text-red-500">*</span>
            </label>
            <input
              id="edit-team-name"
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-[#e5e3df] rounded-md focus:outline-none focus:ring-1 focus:ring-[#5645d4]"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="edit-team-key" className="block text-xs font-medium text-[#1a1a1a]">
              Team Key <span className="text-red-500">*</span>
            </label>
            <input
              id="edit-team-key"
              type="text"
              required
              maxLength={6}
              value={key}
              onChange={e => setKey(e.target.value.toUpperCase())}
              className="w-full px-3 py-1.5 text-xs font-mono uppercase border border-[#e5e3df] rounded-md focus:outline-none focus:ring-1 focus:ring-[#5645d4]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="edit-team-desc" className="block text-xs font-medium text-[#1a1a1a]">
            Description
          </label>
          <textarea
            id="edit-team-desc"
            rows={2}
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-[#e5e3df] rounded-md focus:outline-none focus:ring-1 focus:ring-[#5645d4]"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="edit-team-lead" className="block text-xs font-medium text-[#1a1a1a]">
            Team Lead (Attribution only)
          </label>
          <select
            id="edit-team-lead"
            value={leadId}
            onChange={e => setLeadId(e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-[#e5e3df] rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#5645d4]"
          >
            <option value="">No Team Lead</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-[#1a1a1a]">
            Team Members
          </label>
          <div className="grid grid-cols-2 gap-2 p-2 border border-[#e5e3df] rounded-md max-h-40 overflow-y-auto">
            {users.map(u => (
              <label
                key={u.id}
                className="flex items-center gap-2 p-1.5 rounded hover:bg-[#f6f5f4] cursor-pointer text-xs"
              >
                <input
                  type="checkbox"
                  checked={selectedMemberIds.includes(u.id)}
                  onChange={() => handleToggleMember(u.id)}
                  className="rounded border-[#e5e3df] text-[#5645d4] focus:ring-[#5645d4]"
                />
                <span className="font-medium text-[#1a1a1a] truncate">{u.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-[#e5e3df]">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit">
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
