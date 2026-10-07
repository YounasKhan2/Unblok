import React from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  Clock,
  UserCheck,
  Signal,
  Link,
  Unlink,
  Edit3,
  PlusCircle,
  MessageSquare,
  AtSign,
  Calendar,
  RefreshCw,
  Target,
} from 'lucide-react';
import { ActivityEvent, ActivityEventType } from '../../types';
import { useProject } from '../../context/ProjectContext';

interface ActivityTimelineProps {
  issueId: string;
}

const EVENT_CONFIG: Record<
  ActivityEventType,
  { label: string; icon: React.ComponentType<{ className?: string }>; colorClass: string; bgClass: string }
> = {
  ISSUE_CREATED: {
    label: 'Created issue',
    icon: PlusCircle,
    colorClass: 'text-accent',
    bgClass: 'bg-accent/15',
  },
  STATE_CHANGED: {
    label: 'Changed status',
    icon: Clock,
    colorClass: 'text-accent',
    bgClass: 'bg-accent/15',
  },
  PRIORITY_CHANGED: {
    label: 'Updated priority',
    icon: Signal,
    colorClass: 'text-warning',
    bgClass: 'bg-warning/15',
  },
  ASSIGNEE_CHANGED: {
    label: 'Reassigned issue',
    icon: UserCheck,
    colorClass: 'text-text-muted',
    bgClass: 'bg-surface-muted',
  },
  DEPENDENCY_ADDED: {
    label: 'Added prerequisite blocker',
    icon: Link,
    colorClass: 'text-accent',
    bgClass: 'bg-accent/15',
  },
  DEPENDENCY_REMOVED: {
    label: 'Removed prerequisite link',
    icon: Unlink,
    colorClass: 'text-text-muted',
    bgClass: 'bg-surface-muted',
  },
  ISSUE_BLOCKED: {
    label: 'Issue became actively blocked',
    icon: ShieldAlert,
    colorClass: 'text-danger',
    bgClass: 'bg-danger/15',
  },
  ISSUE_UNBLOCKED: {
    label: 'Issue unblocked (Prerequisites resolved)',
    icon: CheckCircle2,
    colorClass: 'text-success',
    bgClass: 'bg-success/15',
  },
  TITLE_MODIFIED: {
    label: 'Edited title',
    icon: Edit3,
    colorClass: 'text-text-muted',
    bgClass: 'bg-surface-muted',
  },
  DESCRIPTION_MODIFIED: {
    label: 'Updated description',
    icon: Edit3,
    colorClass: 'text-text-muted',
    bgClass: 'bg-surface-muted',
  },
  COMMENT_ADDED: {
    label: 'Added a comment',
    icon: MessageSquare,
    colorClass: 'text-accent',
    bgClass: 'bg-accent/15',
  },
  USER_MENTIONED: {
    label: 'Mentioned in comment',
    icon: AtSign,
    colorClass: 'text-accent',
    bgClass: 'bg-accent/15',
  },
  CYCLE_ASSIGNED: {
    label: 'Assigned to delivery cycle',
    icon: Clock,
    colorClass: 'text-accent',
    bgClass: 'bg-accent/15',
  },
  CYCLE_REMOVED: {
    label: 'Removed from cycle',
    icon: Clock,
    colorClass: 'text-text-muted',
    bgClass: 'bg-surface-muted',
  },
  CYCLE_ROLLED_OVER: {
    label: 'Rolled over into cycle',
    icon: RefreshCw,
    colorClass: 'text-accent',
    bgClass: 'bg-accent/15',
  },
  MILESTONE_LINKED: {
    label: 'Linked to milestone',
    icon: Target,
    colorClass: 'text-accent',
    bgClass: 'bg-accent/15',
  },
  MILESTONE_UNLINKED: {
    label: 'Unlinked from milestone',
    icon: Unlink,
    colorClass: 'text-text-muted',
    bgClass: 'bg-surface-muted',
  },
  SCHEDULE_CHANGED: {
    label: 'Updated schedule dates',
    icon: Calendar,
    colorClass: 'text-accent',
    bgClass: 'bg-accent/15',
  },
};

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ issueId }) => {
  const { activities } = useProject();

  const issueActivities = activities.filter(a => a.issueId === issueId);

  if (issueActivities.length === 0) {
    return (
      <div className="py-4 text-center text-xs text-text-muted">
        No audit activity recorded yet.
      </div>
    );
  }

  const formatTimestamp = (iso: string) => {
    try {
      const date = new Date(iso);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-border">
      {issueActivities.map(event => {
        const config = EVENT_CONFIG[event.eventType] || EVENT_CONFIG.ISSUE_CREATED;
        const Icon = config.icon;

        return (
          <div key={event.id} className="relative flex items-start gap-3 pl-1 text-xs">
            <div
              className={`w-5 h-5 rounded-full ${config.bgClass} ${config.colorClass} flex items-center justify-center shrink-0 z-10 ring-2 ring-surface-base`}
            >
              <Icon className="w-3 h-3" />
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center justify-between text-[11px] text-text-muted">
                <span className="font-medium text-text-primary">{event.userName}</span>
                <span>{formatTimestamp(event.timestamp)}</span>
              </div>

              <div className="text-text-primary mt-0.5">
                <span className="font-medium">{config.label}</span>
                {event.details.from !== undefined && event.details.to !== undefined && (
                  <span className="ml-1.5 text-text-secondary">
                    <span className="line-through opacity-70">{String(event.details.from)}</span> →{' '}
                    <span className="font-semibold text-text-primary">{String(event.details.to)}</span>
                  </span>
                )}
                {event.details.upstreamKey && (
                  <span className="ml-1.5 font-mono font-semibold text-accent">
                    {event.details.upstreamKey}
                  </span>
                )}
                {event.details.reason && (
                  <div className="text-[11px] text-text-muted mt-0.5 italic">
                    "{event.details.reason}"
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
