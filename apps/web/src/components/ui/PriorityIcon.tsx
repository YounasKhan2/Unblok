import React from 'react';
import { AlertCircle, SignalHigh, SignalMedium, SignalLow } from 'lucide-react';
import { IssuePriority } from '../../types';

export interface PriorityIconProps {
  priority: IssuePriority;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
  onClick?: () => void;
}

export const PRIORITY_CONFIG: Record<
  IssuePriority,
  { label: string; icon: React.ComponentType<{ className?: string }>; colorClass: string; bgClass: string }
> = {
  URGENT: {
    label: 'Urgent',
    icon: AlertCircle,
    colorClass: 'text-danger',
    bgClass: 'bg-danger-subtle text-danger border-danger/30',
  },
  HIGH: {
    label: 'High',
    icon: SignalHigh,
    colorClass: 'text-warning',
    bgClass: 'bg-warning-subtle text-warning border-warning/30',
  },
  MEDIUM: {
    label: 'Medium',
    icon: SignalMedium,
    colorClass: 'text-accent',
    bgClass: 'bg-accent-subtle text-accent border-accent/30',
  },
  LOW: {
    label: 'Low',
    icon: SignalLow,
    colorClass: 'text-text-muted',
    bgClass: 'bg-surface-muted text-text-muted border-border',
  },
};

export const PriorityIcon: React.FC<PriorityIconProps> = ({
  priority,
  size = 'sm',
  showLabel = false,
  className = '',
  onClick,
}) => {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.MEDIUM;
  const Icon = config.icon;
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  if (!showLabel) {
    return (
      <span
        onClick={onClick}
        className={`inline-flex items-center justify-center ${config.colorClass} ${
          onClick ? 'cursor-pointer hover:opacity-80' : ''
        } ${className}`}
        title={`Priority: ${config.label}`}
      >
        <Icon className={iconSize} />
      </span>
    );
  }

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] border text-xs font-medium ${config.bgClass} ${
        onClick ? 'cursor-pointer hover:opacity-85' : ''
      } ${className}`}
    >
      <Icon className={iconSize} />
      <span>{config.label}</span>
    </span>
  );
};
