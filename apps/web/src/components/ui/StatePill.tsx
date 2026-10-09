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
    colorClasses: 'bg-surface-muted text-text-muted border border-border',
    textClass: 'text-text-muted',
  },
  TODO: {
    label: 'Todo',
    icon: Circle,
    colorClasses: 'bg-surface-subtle text-text-secondary border border-border-strong',
    textClass: 'text-text-secondary',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    icon: Clock,
    colorClasses: 'bg-warning-subtle text-warning border border-warning/30',
    textClass: 'text-warning',
  },
  IN_REVIEW: {
    label: 'In Review',
    icon: Eye,
    colorClasses: 'bg-accent-subtle text-accent border border-accent/30',
    textClass: 'text-accent',
  },
  DONE: {
    label: 'Done',
    icon: CheckCircle2,
    colorClasses: 'bg-success-subtle text-success border border-success/30',
    textClass: 'text-success',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: XCircle,
    colorClasses: 'bg-surface-muted text-text-muted/60 border border-border line-through',
    textClass: 'text-text-muted/60',
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
