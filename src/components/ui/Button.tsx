import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'dark' | 'secondary' | 'ghost' | 'on-dark' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  icon,
  iconRight,
  className = '',
  disabled,
  ...props
}) => {
  // Notion uses rectangular geometry (rounded-md / 8px), NOT pills!
  const baseClasses =
    'inline-flex items-center justify-center font-medium transition-colors select-none rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#5645d4]/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1 gap-1.5 h-7',
    md: 'text-sm px-3.5 py-1.5 gap-2 h-8',
    lg: 'text-sm px-4 py-2 gap-2 h-10',
  };

  const variantClasses = {
    // Notion signature purple
    primary:
      'bg-[#5645d4] hover:bg-[#4534b3] active:bg-[#3a2a99] text-white shadow-xs',
    // Black button
    dark:
      'bg-[#1a1a1a] hover:bg-[#000000] active:bg-[#2a2a2a] text-white shadow-xs',
    // Outlined secondary
    secondary:
      'bg-white hover:bg-[#f6f5f4] active:bg-[#ede9e4] text-[#1a1a1a] border border-[#e5e3df] hover:border-[#c8c4be]',
    // Ghost
    ghost:
      'bg-transparent hover:bg-[#f6f5f4] active:bg-[#ede9e4] text-[#37352f]',
    // On-dark surface button
    'on-dark':
      'bg-white/10 hover:bg-white/20 active:bg-white/30 text-white border border-white/20',
    // Danger
    danger:
      'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 active:bg-red-200',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
      {iconRight && <span className="shrink-0">{iconRight}</span>}
    </button>
  );
};
