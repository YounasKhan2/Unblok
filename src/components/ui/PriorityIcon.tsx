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
    colorClass: 'text-red-600',
    bgClass: 'bg-red-50 text-red-700 border-red-200',
  },
  HIGH: {
    label: 'High',
    icon: SignalHigh,
    colorClass: 'text-[#dd5b00]',
    bgClass: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  MEDIUM: {
    label: 'Medium',
    icon: SignalMedium,
    colorClass: 'text-[#0075de]',
    bgClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  LOW: {
    label: 'Low',
    icon: SignalLow,
    colorClass: 'text-[#787671]',
    bgClass: 'bg-gray-50 text-gray-700 border-gray-200',
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
