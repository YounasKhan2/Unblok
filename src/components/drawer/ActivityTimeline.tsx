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
    colorClass: 'text-[#5645d4]',
    bgClass: 'bg-purple-100',
  },
  STATE_CHANGED: {
    label: 'Changed status',
    icon: Clock,
    colorClass: 'text-[#0075de]',
    bgClass: 'bg-blue-100',
  },
  PRIORITY_CHANGED: {
    label: 'Updated priority',
    icon: Signal,
    colorClass: 'text-[#dd5b00]',
    bgClass: 'bg-orange-100',
  },
  ASSIGNEE_CHANGED: {
    label: 'Reassigned issue',
    icon: UserCheck,
    colorClass: 'text-[#787671]',
    bgClass: 'bg-gray-100',
  },
  DEPENDENCY_ADDED: {
    label: 'Added prerequisite blocker',
    icon: Link,
    colorClass: 'text-[#5645d4]',
    bgClass: 'bg-purple-100',
  },
  DEPENDENCY_REMOVED: {
    label: 'Removed prerequisite link',
    icon: Unlink,
    colorClass: 'text-[#787671]',
    bgClass: 'bg-gray-100',
  },
  ISSUE_BLOCKED: {
    label: 'Issue became actively blocked',
    icon: ShieldAlert,
    colorClass: 'text-[#dd5b00]',
    bgClass: 'bg-[#ffe8d4]',
  },
  ISSUE_UNBLOCKED: {
    label: 'Issue unblocked (Prerequisites resolved)',
    icon: CheckCircle2,
    colorClass: 'text-[#1aae39]',
    bgClass: 'bg-[#d9f3e1]',
  },
  TITLE_MODIFIED: {
    label: 'Edited title',
    icon: Edit3,
    colorClass: 'text-[#787671]',
    bgClass: 'bg-gray-100',
  },
  DESCRIPTION_MODIFIED: {
    label: 'Updated description',
    icon: Edit3,
    colorClass: 'text-[#787671]',
    bgClass: 'bg-gray-100',
  },
  COMMENT_ADDED: {
    label: 'Added a comment',
    icon: MessageSquare,
    colorClass: 'text-[#5645d4]',
    bgClass: 'bg-purple-100',
  },
  USER_MENTIONED: {
    label: 'Mentioned in comment',
    icon: AtSign,
    colorClass: 'text-[#5645d4]',
    bgClass: 'bg-purple-100',
  },
  CYCLE_ASSIGNED: {
    label: 'Assigned to delivery cycle',
    icon: Clock,
    colorClass: 'text-[#0075de]',
    bgClass: 'bg-blue-100',
  },
  CYCLE_REMOVED: {
    label: 'Removed from cycle',
    icon: Clock,
    colorClass: 'text-[#787671]',
    bgClass: 'bg-gray-100',
  },
  CYCLE_ROLLED_OVER: {
    label: 'Rolled over into cycle',
    icon: RefreshCw,
    colorClass: 'text-[#5645d4]',
    bgClass: 'bg-purple-100',
  },
  MILESTONE_LINKED: {
    label: 'Linked to milestone',
    icon: Target,
    colorClass: 'text-[#5645d4]',
    bgClass: 'bg-purple-100',
  },
  MILESTONE_UNLINKED: {
    label: 'Unlinked from milestone',
    icon: Unlink,
    colorClass: 'text-[#787671]',
    bgClass: 'bg-gray-100',
  },
  SCHEDULE_CHANGED: {
    label: 'Updated schedule dates',
    icon: Calendar,
    colorClass: 'text-[#0075de]',
    bgClass: 'bg-blue-100',
  },
};

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ issueId }) => {
  const { activities } = useProject();

  const issueActivities = activities.filter(a => a.issueId === issueId);

  if (issueActivities.length === 0) {
    return (
      <div className="py-4 text-center text-xs text-[#787671]">
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
    <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-[#e5e3df]">
      {issueActivities.map(event => {
        const config = EVENT_CONFIG[event.eventType] || EVENT_CONFIG.ISSUE_CREATED;
        const Icon = config.icon;

        return (
          <div key={event.id} className="relative flex items-start gap-3 pl-1 text-xs">
            <div
              className={`w-5 h-5 rounded-full ${config.bgClass} ${config.colorClass} flex items-center justify-center shrink-0 z-10 ring-2 ring-white`}
            >
              <Icon className="w-3 h-3" />
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center justify-between text-[11px] text-[#787671]">
                <span className="font-medium text-[#1a1a1a]">{event.userName}</span>
                <span>{formatTimestamp(event.timestamp)}</span>
              </div>

              <div className="text-[#37352f] mt-0.5">
                <span className="font-medium">{config.label}</span>
                {event.details.from !== undefined && event.details.to !== undefined && (
                  <span className="ml-1.5 text-[#5d5b54]">
                    <span className="line-through opacity-70">{String(event.details.from)}</span> →{' '}
                    <span className="font-semibold text-[#1a1a1a]">{String(event.details.to)}</span>
                  </span>
                )}
                {event.details.upstreamKey && (
                  <span className="ml-1.5 font-mono font-semibold text-[#5645d4]">
                    {event.details.upstreamKey}
                  </span>
                )}
                {event.details.reason && (
                  <div className="text-[11px] text-[#787671] mt-0.5 italic">
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
