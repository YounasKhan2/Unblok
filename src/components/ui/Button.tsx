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
    'inline-flex items-center justify-center font-medium transition-colors select-none rounded-[6px] focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1 gap-1.5 h-7',
    md: 'text-sm px-3.5 py-1.5 gap-2 h-8',
    lg: 'text-sm px-4 py-2 gap-2 h-10',
  };

  const variantClasses = {
    // Signature accent
    primary:
      'bg-accent hover:opacity-90 active:opacity-80 text-white shadow-xs',
    // Dark/Neutral button
    dark:
      'bg-surface-muted hover:bg-surface-subtle text-text-primary border border-border shadow-xs',
    // Outlined secondary
    secondary:
      'bg-surface-base hover:bg-surface-subtle active:bg-surface-muted text-text-primary border border-border hover:border-border-strong',
    // Ghost
    ghost:
      'bg-transparent hover:bg-surface-subtle active:bg-surface-muted text-text-secondary hover:text-text-primary',
    // On-dark surface button
    'on-dark':
      'bg-white/10 hover:bg-white/20 active:bg-white/30 text-white border border-white/20',
    // Danger
    danger:
      'bg-danger-subtle hover:bg-danger/20 text-danger border border-danger/30 active:bg-danger/30',
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
