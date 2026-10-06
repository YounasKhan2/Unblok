import React, { useState } from 'react';
import { User, UserRole, Team } from '../../../types';
import { Avatar } from '../../../components/ui/Avatar';
import { useSettings } from '../context/SettingsContext';

interface MemberRowProps {
  user: User;
  teams: Team[];
}

export const MemberRow: React.FC<MemberRowProps> = ({ user, teams }) => {
  const { updateUserRole, canDemoteUser, currentUser } = useSettings();
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);

  const userTeams = teams.filter(t =>
    (user.teamIds || (user.teamId ? [user.teamId] : [])).includes(t.id)
  );
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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-border bg-surface-base hover:border-border-strong transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar user={user} size="sm" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-text-primary truncate">
              {user.name}
            </span>
            {isCurrentUser && (
              <span className="text-[10px] bg-surface-muted text-text-secondary px-1.5 py-0.5 rounded font-medium border border-border-subtle">
                You
              </span>
            )}
          </div>
          <div className="text-[11px] text-text-muted truncate">{user.email}</div>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:justify-end flex-wrap">
        {/* Teams Badges */}
        <div className="flex items-center gap-1 flex-wrap max-w-xs">
          {userTeams.length > 0 ? (
            userTeams.map(t => (
              <span
                key={t.id}
                className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-surface-subtle text-text-secondary border border-border"
                title={t.name}
              >
                {t.key}
              </span>
            ))
          ) : (
            <span className="text-[10px] text-text-muted italic">No team</span>
          )}
        </div>

        {/* Role Selector */}
        <div className="flex flex-col items-end">
          <select
            value={user.role}
            onChange={handleRoleChange}
            aria-label={`Role for ${user.name}`}
            className="text-xs bg-surface-subtle border border-border rounded-md px-2 py-1 font-medium text-text-primary hover:border-border-strong focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
          >
            <option value="ADMIN">ADMIN</option>
            <option value="MEMBER">MEMBER</option>
            <option value="OBSERVER">OBSERVER</option>
          </select>
          {errorFeedback && (
            <span className="text-[10px] text-danger font-medium mt-1 animate-in fade-in">
              {errorFeedback}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
