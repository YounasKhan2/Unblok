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
    purple: 'bg-[#5645d4] text-white',
    pink: 'bg-[#ff64c8] text-white',
    orange: 'bg-[#dd5b00] text-white',
    mint: 'bg-[#d9f3e1] text-[#1aae39] border border-[#b2e2be]',
    lavender: 'bg-[#e6e0f5] text-[#5645d4] border border-[#d2c6ed]',
    peach: 'bg-[#ffe8d4] text-[#793400] border border-[#ffd3ad]',
    sky: 'bg-[#dcecfa] text-[#0075de] border border-[#bfdcf7]',
    gray: 'bg-[#f0eeec] text-[#5d5b54] border border-[#e5e3df]',
    danger: 'bg-red-50 text-red-700 border border-red-200',
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
