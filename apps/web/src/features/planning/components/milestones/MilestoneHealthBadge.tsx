/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PlanningMilestoneHealth } from '../../types';
import { ShieldAlert, AlertTriangle, CheckCircle2, Target } from 'lucide-react';

interface MilestoneHealthBadgeProps {
  health: PlanningMilestoneHealth;
  isCompleted?: boolean;
  reason?: string;
  size?: 'sm' | 'md';
}

export const MilestoneHealthBadge: React.FC<MilestoneHealthBadgeProps> = ({
  health,
  isCompleted = false,
  reason,
  size = 'md',
}) => {
  if (isCompleted) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-bold uppercase rounded-[4px] border select-none bg-success/10 text-success border-success/30 ${
          size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
        }`}
        title={reason || 'Milestone achieved (100% completed)'}
      >
        <CheckCircle2 className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        <span>Completed</span>
      </span>
    );
  }

  const config = {
    BLOCKED: {
      label: 'BLOCKED',
      icon: ShieldAlert,
      classes: 'bg-danger/10 text-danger border-danger/30',
    },
    AT_RISK: {
      label: 'AT RISK',
      icon: AlertTriangle,
      classes: 'bg-warning/10 text-warning border-warning/30',
    },
    ON_TRACK: {
      label: 'ON TRACK',
      icon: Target,
      classes: 'bg-success/10 text-success border-success/30',
    },
  }[health];

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold uppercase rounded-[4px] border select-none transition-colors ${
        config.classes
      } ${size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}`}
      title={reason}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{config.label}</span>
    </span>
  );
};
