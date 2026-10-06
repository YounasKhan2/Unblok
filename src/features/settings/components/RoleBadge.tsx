import React from 'react';
import { UserRole } from '../../../types';

interface RoleBadgeProps {
  role: UserRole;
  size?: 'xs' | 'sm';
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = 'sm' }) => {
  const sizeClasses = size === 'xs' ? 'text-[9px] px-1.5 py-0.2' : 'text-[10px] px-2 py-0.5';

  const roleStyles: Record<UserRole, string> = {
    ADMIN: 'bg-purple-50 text-[#5645d4] border border-purple-200 font-semibold',
    MEMBER: 'bg-[#f6f5f4] text-[#52504b] border border-[#e5e3df] font-medium',
    OBSERVER: 'bg-amber-50 text-amber-700 border border-amber-200 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center uppercase tracking-wider rounded font-mono ${sizeClasses} ${roleStyles[role]}`}
    >
      {role}
    </span>
  );
};
