import { IssueState } from '../types';

export const ALLOWED_TRANSITIONS: Record<IssueState, IssueState[]> = {
  BACKLOG: ['TODO', 'CANCELLED'],
  TODO: ['IN_PROGRESS', 'BACKLOG', 'CANCELLED'],
  IN_PROGRESS: ['IN_REVIEW', 'TODO', 'CANCELLED'],
  IN_REVIEW: ['DONE', 'IN_PROGRESS', 'CANCELLED'],
  DONE: ['TODO'], // Reopening
  CANCELLED: ['TODO'], // Reopening
};

export function canTransition(from: IssueState, to: IssueState): boolean {
  if (from === to) return true;
  const allowed = ALLOWED_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

export function isIssueStateActive(state: IssueState): boolean {
  return state === 'BACKLOG' || state === 'TODO' || state === 'IN_PROGRESS' || state === 'IN_REVIEW';
}

export function isUpstreamActivelyBlocking(upstreamState: IssueState): boolean {
  // As per PRD section 12:
  // "A dependency is considered actively blocking when its upstream issue is in:
  // BACKLOG, TODO, IN_PROGRESS, IN_REVIEW.
  // An upstream issue in DONE, CANCELLED does not actively block the downstream issue.
  // However, the dependency relationship remains persisted."
  return isIssueStateActive(upstreamState);
}
