import React from 'react';
import { UserRole } from '../../../types';

interface RoleBadgeProps {
  role: UserRole;
  size?: 'xs' | 'sm';
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = 'sm' }) => {
  const sizeClasses = size === 'xs' ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5';

  const roleStyles: Record<UserRole, string> = {
    ADMIN: 'bg-accent/10 text-accent border border-accent/30 font-semibold',
    MEMBER: 'bg-surface-muted text-text-secondary border border-border font-medium',
    OBSERVER: 'bg-warning/10 text-warning border border-warning/30 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center uppercase tracking-wider rounded font-mono ${sizeClasses} ${roleStyles[role]}`}
    >
      {role}
    </span>
  );
};
