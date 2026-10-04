import React from 'react';
import {
  CircleDashed,
  Circle,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
} from 'lucide-react';
import { IssueState } from '../../types';

export interface StatePillProps {
  state: IssueState;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
  onClick?: () => void;
}

export const STATE_CONFIG: Record<
  IssueState,
  { label: string; icon: React.ComponentType<{ className?: string }>; colorClasses: string; textClass: string }
> = {
  BACKLOG: {
    label: 'Backlog',
    icon: CircleDashed,
    colorClasses: 'bg-[#f0eeec] text-[#787671] border border-[#e5e3df]',
    textClass: 'text-[#787671]',
  },
  TODO: {
    label: 'Todo',
    icon: Circle,
    colorClasses: 'bg-[#f6f5f4] text-[#37352f] border border-[#d4d0c9]',
    textClass: 'text-[#37352f]',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    icon: Clock,
    colorClasses: 'bg-[#fef7d6] text-[#dd5b00] border border-[#f5d75e]',
    textClass: 'text-[#dd5b00]',
  },
  IN_REVIEW: {
    label: 'In Review',
    icon: Eye,
    colorClasses: 'bg-[#e6e0f5] text-[#5645d4] border border-[#d6b6f6]',
    textClass: 'text-[#5645d4]',
  },
  DONE: {
    label: 'Done',
    icon: CheckCircle2,
    colorClasses: 'bg-[#d9f3e1] text-[#1aae39] border border-[#b2e2be]',
    textClass: 'text-[#1aae39]',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: XCircle,
    colorClasses: 'bg-[#f0eeec] text-[#a4a097] border border-[#e5e3df] line-through',
    textClass: 'text-[#a4a097]',
  },
};

export const StatePill: React.FC<StatePillProps> = ({
  state,
  size = 'sm',
  showLabel = true,
  className = '',
  onClick,
}) => {
  const config = STATE_CONFIG[state] || STATE_CONFIG.BACKLOG;
  const Icon = config.icon;

  const sizeClasses = size === 'sm' ? 'text-[11px] px-1.5 py-0.5 gap-1 h-5' : 'text-xs px-2.5 py-1 gap-1.5 h-6';

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center font-medium rounded-full select-none transition-colors ${config.colorClasses} ${sizeClasses} ${
        onClick ? 'cursor-pointer hover:opacity-85' : ''
      } ${className}`}
      title={config.label}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3 shrink-0' : 'w-3.5 h-3.5 shrink-0'} />
      {showLabel && <span className="whitespace-nowrap">{config.label}</span>}
    </span>
  );
};
