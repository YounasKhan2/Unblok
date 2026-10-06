import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { UserRole, Team } from '../../../types';
import { useSettings } from '../context/SettingsContext';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Team[];
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  teams,
}) => {
  const { inviteMember } = useSettings();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('MEMBER');
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleToggleTeam = (teamId: string) => {
    setSelectedTeamIds(prev =>
      prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      inviteMember({
        email: email.trim(),
        role,
        teamIds: selectedTeamIds,
      });
      // Reset form and close
      setEmail('');
      setRole('MEMBER');
      setSelectedTeamIds([]);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invite Workspace Member"
      description="Send a prototype invitation to join this workspace."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2.5 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="invite-email" className="block text-xs font-medium text-[#1a1a1a]">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            id="invite-email"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="colleague@acme.corp"
            className="w-full px-3 py-1.5 text-xs border border-[#e5e3df] rounded-md focus:outline-none focus:ring-1 focus:ring-[#5645d4]"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="invite-role" className="block text-xs font-medium text-[#1a1a1a]">
            Role <span className="text-red-500">*</span>
          </label>
          <select
            id="invite-role"
            value={role}
            onChange={e => setRole(e.target.value as UserRole)}
            className="w-full px-3 py-1.5 text-xs border border-[#e5e3df] rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#5645d4]"
          >
            <option value="ADMIN">ADMIN — Full workspace administration</option>
            <option value="MEMBER">MEMBER — Full execution and issue creation</option>
            <option value="OBSERVER">OBSERVER — Read-only product participation</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-[#1a1a1a]">
            Initial Team Assignments (Optional)
          </label>
          <div className="grid grid-cols-2 gap-2 p-2 border border-[#e5e3df] rounded-md max-h-36 overflow-y-auto">
            {teams.map(team => (
              <label
                key={team.id}
                className="flex items-center gap-2 p-1.5 rounded hover:bg-[#f6f5f4] cursor-pointer text-xs"
              >
                <input
                  type="checkbox"
                  checked={selectedTeamIds.includes(team.id)}
                  onChange={() => handleToggleTeam(team.id)}
                  className="rounded border-[#e5e3df] text-[#5645d4] focus:ring-[#5645d4]"
                />
                <span className="font-medium text-[#1a1a1a]">{team.name}</span>
                <span className="text-[10px] text-[#787671] font-mono">({team.key})</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-[#e5e3df]">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit">
            Send Invitation
          </Button>
        </div>
      </form>
    </Modal>
  );
};
