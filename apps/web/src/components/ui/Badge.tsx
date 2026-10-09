import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'purple' | 'pink' | 'orange' | 'mint' | 'lavender' | 'peach' | 'sky' | 'gray' | 'danger';
  shape?: 'pill' | 'rect';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'gray',
  shape = 'pill',
  size = 'sm',
  icon,
  className = '',
  onClick,
}) => {
  const shapeClasses = shape === 'pill' ? 'rounded-full' : 'rounded-[4px]';

  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5';

  const variantClasses = {
    purple: 'bg-accent text-white',
    pink: 'bg-[#ff64c8] text-white',
    orange: 'bg-warning text-white',
    mint: 'bg-success-subtle text-success border border-success/30',
    lavender: 'bg-accent-subtle text-accent border border-accent/30',
    peach: 'bg-warning-subtle text-warning border border-warning/30',
    sky: 'bg-accent-subtle text-accent border border-accent/30',
    gray: 'bg-surface-muted text-text-secondary border border-border',
    danger: 'bg-danger-subtle text-danger border border-danger/30',
  };

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center font-medium select-none ${shapeClasses} ${sizeClasses} ${variantClasses[variant]} ${
        onClick ? 'cursor-pointer hover:opacity-85' : ''
      } ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
};
