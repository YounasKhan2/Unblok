import React, { useState } from 'react';
import { User, UserRole, Team } from '../../../types';
import { Avatar } from '../../../components/ui/Avatar';
import { RoleBadge } from './RoleBadge';
import { useSettings } from '../context/SettingsContext';

interface MemberRowProps {
  user: User;
  teams: Team[];
}

export const MemberRow: React.FC<MemberRowProps> = ({ user, teams }) => {
  const { updateUserRole, canDemoteUser, currentUser } = useSettings();
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);

  const userTeams = teams.filter(t => user.teamId === t.id);
  const isCurrentUser = user.id === currentUser.id;

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as UserRole;
    if (newRole === user.role) return;

    if (user.role === 'ADMIN' && newRole !== 'ADMIN' && !canDemoteUser(user.id)) {
      setErrorFeedback('Cannot demote the last ADMIN in this workspace.');
      setTimeout(() => setErrorFeedback(null), 3500);
      return;
    }

    try {
      updateUserRole(user.id, newRole);
      setErrorFeedback(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Role change failed';
      setErrorFeedback(msg);
      setTimeout(() => setErrorFeedback(null), 3500);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-[#e5e3df] bg-white hover:border-[#c8c4be] transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar user={user} size="sm" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#1a1a1a] truncate">
              {user.name}
            </span>
            {isCurrentUser && (
              <span className="text-[10px] bg-[#ede9e4] text-[#52504b] px-1.5 py-0.2 rounded font-medium">
                You
              </span>
            )}
          </div>
          <div className="text-[11px] text-[#787671] truncate">{user.email}</div>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:justify-end flex-wrap">
        {/* Teams Badges */}
        <div className="flex items-center gap-1 flex-wrap max-w-xs">
          {userTeams.length > 0 ? (
            userTeams.map(t => (
              <span
                key={t.id}
                className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-[#f6f5f4] text-[#52504b] border border-[#e5e3df]"
                title={t.name}
              >
                {t.key}
              </span>
            ))
          ) : (
            <span className="text-[10px] text-[#a4a097] italic">No team</span>
          )}
        </div>

        {/* Role Selector */}
        <div className="flex flex-col items-end">
          <select
            value={user.role}
            onChange={handleRoleChange}
            aria-label={`Role for ${user.name}`}
            className="text-xs bg-[#fafaf9] border border-[#e5e3df] rounded-md px-2 py-1 font-medium text-[#1a1a1a] hover:border-[#c8c4be] focus:outline-none focus:ring-1 focus:ring-[#5645d4] cursor-pointer"
          >
            <option value="ADMIN">ADMIN</option>
            <option value="MEMBER">MEMBER</option>
            <option value="OBSERVER">OBSERVER</option>
          </select>
          {errorFeedback && (
            <span className="text-[10px] text-red-600 font-medium mt-1 animate-in fade-in">
              {errorFeedback}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
