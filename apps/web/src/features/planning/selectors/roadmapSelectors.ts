/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Issue, Team, Project, User, Dependency, Cycle, Milestone } from '../../../types';
import { getBlockerStatus } from '../../../domain/dependency';
import {
  RoadmapFilterState,
  RoadmapDayColumn,
  RoadmapRosterGroup,
  RoadmapScheduledIssue,
} from '../types';
import { calculateTimelineSpan } from '../domain/scheduleInvariants';

/**
 * Section 41-46 & 67: Fast pre-indexed roadmap projection
 */
export function selectRoadmapProjection(
  issues: Issue[],
  teams: Team[],
  projects: Project[],
  users: User[],
  dependencies: Dependency[],
  windowDays: RoadmapDayColumn[],
  filters: RoadmapFilterState
): {
  groups: RoadmapRosterGroup[];
  totalScheduledCount: number;
  totalBlockedCount: number;
} {
  // 1. Build lookup maps to prevent O(N*M) lookups
  const teamsMap = new Map(teams.map(t => [t.id, t]));
  const projectsMap = new Map(projects.map(p => [p.id, p]));
  const usersMap = new Map(users.map(u => [u.id, u]));

  // 2. Filter issues according to canonical filter state
  const query = filters.searchQuery.trim().toLowerCase();

  const filteredIssues = issues.filter(issue => {
    // Only issues that have at least one scheduling date (startDate or dueDate)
    if (!issue.startDate && !issue.dueDate) return false;

    // Team filter
    if (filters.team !== 'ALL') {
      const team = teamsMap.get(issue.teamId);
      if (issue.teamId !== filters.team && team?.key !== filters.team) {
        return false;
      }
    }

    // Assignee filter
    if (filters.assignee !== 'ALL' && issue.assigneeId !== filters.assignee) {
      return false;
    }

    // Cycle filter
    if (filters.cycle !== 'ALL' && issue.cycleId !== filters.cycle) {
      return false;
    }

    // Milestone filter
    if (filters.milestone !== 'ALL' && issue.milestoneId !== filters.milestone) {
      return false;
    }

    // Blocker filter
    if (filters.blockedOnly) {
      const blocker = getBlockerStatus(issue.id, issues, dependencies);
      if (blocker.activeCount === 0) return false;
    }

    // Search query
    if (query) {
      const matchKey = issue.key.toLowerCase().includes(query);
      const matchTitle = issue.title.toLowerCase().includes(query);
      if (!matchKey && !matchTitle) return false;
    }

    return true;
  });

  // 3. Project each filtered issue into the current schedule window
  let totalScheduledCount = 0;
  let totalBlockedCount = 0;

  const scheduledIssues: RoadmapScheduledIssue[] = [];

  for (const issue of filteredIssues) {
    const span = calculateTimelineSpan(issue.startDate, issue.dueDate, windowDays);
    if (!span || !span.inWindow) continue;

    const blocker = getBlockerStatus(issue.id, issues, dependencies);
    const isBlocked = blocker.activeCount > 0;

    totalScheduledCount++;
    if (isBlocked) totalBlockedCount++;

    scheduledIssues.push({
      issue,
      project: projectsMap.get(issue.projectId),
      team: teamsMap.get(issue.teamId),
      assignee: issue.assigneeId ? usersMap.get(issue.assigneeId) : undefined,
      isBlocked,
      blockedCount: blocker.activeCount,
      startCol: span.startCol,
      spanCols: span.spanCols,
      startsBeforeWindow: span.startsBeforeWindow,
      endsAfterWindow: span.endsAfterWindow,
    });
  }

  // 4. Group by Team or Assignee
  const groups: RoadmapRosterGroup[] = [];

  if (filters.group === 'team') {
    // Group by owning team
    const issuesByTeam = new Map<string, RoadmapScheduledIssue[]>();
    for (const item of scheduledIssues) {
      const tId = item.issue.teamId || 'unassigned';
      if (!issuesByTeam.has(tId)) issuesByTeam.set(tId, []);
      issuesByTeam.get(tId)!.push(item);
    }

    for (const team of teams) {
      // If team filter is applied, only show matching team
      if (filters.team !== 'ALL' && team.id !== filters.team && team.key !== filters.team) {
        continue;
      }

      const teamIssues = issuesByTeam.get(team.id) || [];
      const blocked = teamIssues.filter(i => i.isBlocked).length;

      groups.push({
        id: team.id,
        name: team.name,
        key: team.key,
        color: team.color,
        secondaryInfo: `${teamIssues.length} tasks scheduled`,
        totalScheduled: teamIssues.length,
        blockedCount: blocked,
        issues: teamIssues,
      });
    }
  } else {
    // Group by Assignee
    const issuesByAssignee = new Map<string, RoadmapScheduledIssue[]>();
    for (const item of scheduledIssues) {
      const uId = item.issue.assigneeId || 'unassigned';
      if (!issuesByAssignee.has(uId)) issuesByAssignee.set(uId, []);
      issuesByAssignee.get(uId)!.push(item);
    }

    // Active users
    for (const user of users) {
      if (filters.assignee !== 'ALL' && user.id !== filters.assignee) {
        continue;
      }

      const userIssues = issuesByAssignee.get(user.id) || [];
      const blocked = userIssues.filter(i => i.isBlocked).length;
      const userTeam = teamsMap.get(user.teamId);

      groups.push({
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        color: userTeam?.color,
        secondaryInfo: `${userIssues.length} tasks · ${userTeam?.key || 'ENG'}`,
        totalScheduled: userIssues.length,
        blockedCount: blocked,
        issues: userIssues,
      });
    }

    // Unassigned bucket if it contains scheduled items
    const unassignedIssues = issuesByAssignee.get('unassigned') || [];
    if (unassignedIssues.length > 0 && filters.assignee === 'ALL') {
      groups.push({
        id: 'unassigned',
        name: 'Unassigned',
        secondaryInfo: `${unassignedIssues.length} tasks without assignee`,
        totalScheduled: unassignedIssues.length,
        blockedCount: unassignedIssues.filter(i => i.isBlocked).length,
        issues: unassignedIssues,
      });
    }
  }

  return {
    groups,
    totalScheduledCount,
    totalBlockedCount,
  };
}
