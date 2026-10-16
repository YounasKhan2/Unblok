import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { UserRole, Team } from '../../../types';
import {useMemberBindings} from './MemberBindings';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Pick<Team,'id'|'name'|'key'>[];
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  teams,
}) => {
  const binding=useMemberBindings();
  const {inviteMember}=binding;
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('MEMBER');
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleToggleTeam = (teamId: string) => {
    setSelectedTeamIds(prev =>
      prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if(binding.live&&selectedTeamIds.length>20){setError('Choose at most 20 initial Teams.');return;}

    try {
      const result=await inviteMember({
        email: email.trim(),
        role,
        teamIds: selectedTeamIds,
      });
      if(result===false)return;
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
      description="Send an invitation to join this workspace."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {(error||binding.live&&binding.error) && (
          <div role={binding.live?'alert':undefined} className="p-2.5 rounded-md bg-danger/10 border border-danger/30 text-xs text-danger font-medium">
            {error||binding.error}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="invite-email" className="block text-xs font-medium text-text-primary">
            Email Address <span className="text-danger">*</span>
          </label>
          <input
            disabled={binding.live&&(!binding.canMutate||binding.busy)}
            id="invite-email"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="colleague@nexus.example"
            className="w-full px-3 py-1.5 text-xs bg-surface-base border border-border text-text-primary rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="invite-role" className="block text-xs font-medium text-text-primary">
            Role <span className="text-danger">*</span>
          </label>
          <select
            disabled={binding.live&&(!binding.canMutate||binding.busy)}
            id="invite-role"
            value={role}
            onChange={e => setRole(e.target.value as UserRole)}
            className="w-full px-3 py-1.5 text-xs border border-border rounded-md bg-surface-base text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="ADMIN">ADMIN — Full workspace administration</option>
            <option value="MEMBER">MEMBER — Full execution and issue creation</option>
            <option value="OBSERVER">OBSERVER — Read-only product participation</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-text-primary">
            Initial Team Assignments (Optional)
          </label>
          <div className="grid grid-cols-2 gap-2 p-2 border border-border rounded-md max-h-36 overflow-y-auto bg-surface-subtle">
            {teams.map(team => (
              <label
                key={team.id}
                className="flex items-center gap-2 p-1.5 rounded hover:bg-surface-muted cursor-pointer text-xs"
              >
                <input
                  disabled={binding.live&&(!binding.canMutate||binding.busy)}
                  type="checkbox"
                  checked={selectedTeamIds.includes(team.id)}
                  onChange={() => handleToggleTeam(team.id)}
                  className="rounded border-border text-accent focus:ring-accent"
                />
                <span className="font-medium text-text-primary">{team.name}</span>
                <span className="text-[10px] text-text-muted font-mono">({team.key})</span>
              </label>
            ))}
          </div>
        </div>

        {binding.live&&binding.retryInvite&&<Button size="sm" type="button" disabled={binding.busy} onClick={async()=>{if(await binding.retryInvite?.()){setEmail('');setRole('MEMBER');setSelectedTeamIds([]);onClose();}}}>Retry same request</Button>}
        {binding.live&&binding.teamFooter}
        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={binding.live&&(!binding.canMutate||binding.busy)}>
            Send Invitation
          </Button>
        </div>
      </form>
    </Modal>
  );
};
