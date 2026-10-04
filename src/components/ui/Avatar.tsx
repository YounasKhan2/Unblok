import React from 'react';
import { User } from '../../types';

export interface AvatarProps {
  user?: User;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ user, size = 'sm', className = '' }) => {
  const sizeClasses = {
    xs: 'w-4 h-4 text-[9px]',
    sm: 'w-5 h-5 text-[10px]',
    md: 'w-6 h-6 text-xs',
    lg: 'w-8 h-8 text-sm',
  };

  if (!user) {
    return (
      <div
        className={`rounded-full bg-[#e5e3df] text-[#787671] flex items-center justify-center font-medium ${sizeClasses[size]} ${className}`}
        title="Unassigned"
      >
        ?
      </div>
    );
  }

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name}
        className={`rounded-full object-cover shrink-0 border border-[#e5e3df] ${sizeClasses[size]} ${className}`}
        title={`${user.name} (${user.role})`}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-[#e6e0f5] text-[#5645d4] font-semibold flex items-center justify-center shrink-0 border border-[#d2c6ed] ${sizeClasses[size]} ${className}`}
      title={`${user.name} (${user.role})`}
    >
      {initials}
    </div>
  );
};
