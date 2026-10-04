import { ActivityEvent, ActivityEventType, User } from '../types';

export function createActivityEvent(
  issueId: string,
  eventType: ActivityEventType,
  user: User,
  details: ActivityEvent['details']
): ActivityEvent {
  return {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    issueId,
    eventType,
    userId: user.id,
    userName: user.name,
    timestamp: new Date().toISOString(),
    details,
  };
}

/**
 * Checks if a transition between previousActiveCount and newActiveCount constitutes
 * a boundary event (ISSUE_BLOCKED or ISSUE_UNBLOCKED).
 */
export function checkBlockerBoundaryEvents(
  issueId: string,
  previousActiveCount: number,
  newActiveCount: number,
  user: User,
  triggerReason?: string
): ActivityEvent[] {
  const events: ActivityEvent[] = [];

  // Transition 0 -> 1+ means the issue just became blocked
  if (previousActiveCount === 0 && newActiveCount > 0) {
    events.push(
      createActivityEvent(issueId, 'ISSUE_BLOCKED', user, {
        from: 0,
        to: newActiveCount,
        reason: triggerReason || `Issue is now actively blocked by ${newActiveCount} prerequisite task(s)`,
      })
    );
  }
  // Transition >0 -> 0 means all blockers are resolved, unblocking the issue
  else if (previousActiveCount > 0 && newActiveCount === 0) {
    events.push(
      createActivityEvent(issueId, 'ISSUE_UNBLOCKED', user, {
        from: previousActiveCount,
        to: 0,
        reason: triggerReason || 'All active prerequisite blockers have been resolved',
      })
    );
  }

  return events;
}
