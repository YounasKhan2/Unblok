/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Issue,
  Dependency,
  Project,
  Team,
  User,
  Cycle,
  Milestone,
  IssueComment,
  ActivityEvent,
  BlockerStatusInfo,
} from '../../types';
import { isUpstreamActivelyBlocking } from '../../domain/lifecycle';

export interface ResolvedDependencyItem {
  dependencyId: string;
  issue: Issue;
  project?: Project;
  team?: Team;
  isActivelyBlocking: boolean;
}

export interface IssueDetailData {
  issue: Issue;
  project?: Project;
  team?: Team;
  assignee?: User;
  creator?: User;
  cycle?: Cycle;
  milestone?: Milestone;
  blockerStatus: BlockerStatusInfo;
  upstreamDependencies: ResolvedDependencyItem[];
  activeBlockers: ResolvedDependencyItem[];
  resolvedBlockers: ResolvedDependencyItem[];
  downstreamDependencies: ResolvedDependencyItem[];
  comments: IssueComment[];
  rootComments: IssueComment[];
  repliesMap: Map<string, IssueComment[]>;
  activities: ActivityEvent[];
}

/**
 * Pure selector that resolves all authoritative entity relationships and derived dependency status
 * for a canonical Issue Detail view.
 */
export function selectIssueDetail(
  issueKeyOrId: string | undefined,
  issues: Issue[],
  dependencies: Dependency[],
  projects: Project[],
  teams: Team[],
  users: User[],
  cycles: Cycle[],
  milestones: Milestone[],
  comments: IssueComment[],
  activities: ActivityEvent[]
): IssueDetailData | null {
  if (!issueKeyOrId || !issueKeyOrId.trim()) {
    return null;
  }

  const normalized = issueKeyOrId.trim().toLowerCase();
  const issue = issues.find(
    i => i.key.toLowerCase() === normalized || i.id.toLowerCase() === normalized
  );

  if (!issue) {
    return null;
  }

  const project = projects.find(p => p.id === issue.projectId);
  const team = teams.find(t => t.id === issue.teamId);
  const assignee = users.find(u => u.id === issue.assigneeId);
  const creator = users.find(u => u.id === issue.creatorId);
  const cycle = cycles.find(c => c.id === issue.cycleId);
  const milestone = milestones.find(m => m.id === issue.milestoneId);

  const issuesMap = new Map(issues.map(i => [i.id, i]));
  const projectsMap = new Map(projects.map(p => [p.id, p]));
  const teamsMap = new Map(teams.map(t => [t.id, t]));

  // Upstream dependencies (Issues that block this issue: upstream BLOCKS issue)
  const upstreamDependencies: ResolvedDependencyItem[] = dependencies
    .filter(d => d.downstreamIssueId === issue.id)
    .reduce<ResolvedDependencyItem[]>((acc, dep) => {
      const upstreamIssue = issuesMap.get(dep.upstreamIssueId);
      if (upstreamIssue) {
        acc.push({
          dependencyId: dep.id,
          issue: upstreamIssue,
          project: projectsMap.get(upstreamIssue.projectId),
          team: teamsMap.get(upstreamIssue.teamId),
          isActivelyBlocking: isUpstreamActivelyBlocking(upstreamIssue.state),
        });
      }
      return acc;
    }, []);

  const activeBlockers = upstreamDependencies.filter(u => u.isActivelyBlocking);
  const resolvedBlockers = upstreamDependencies.filter(u => !u.isActivelyBlocking);

  // Downstream dependencies (Issues that this issue blocks: issue BLOCKS downstream)
  const downstreamDependencies: ResolvedDependencyItem[] = dependencies
    .filter(d => d.upstreamIssueId === issue.id)
    .reduce<ResolvedDependencyItem[]>((acc, dep) => {
      const downstreamIssue = issuesMap.get(dep.downstreamIssueId);
      if (downstreamIssue) {
        acc.push({
          dependencyId: dep.id,
          issue: downstreamIssue,
          project: projectsMap.get(downstreamIssue.projectId),
          team: teamsMap.get(downstreamIssue.teamId),
          isActivelyBlocking: isUpstreamActivelyBlocking(issue.state),
        });
      }
      return acc;
    }, []);

  const blockerStatus: BlockerStatusInfo = {
    activeCount: activeBlockers.length,
    resolvedCount: resolvedBlockers.length,
    activeBlockers: activeBlockers.map(b => b.issue),
    resolvedBlockers: resolvedBlockers.map(b => b.issue),
    downstreamIssues: downstreamDependencies.map(d => d.issue),
    isBlocked: activeBlockers.length > 0,
  };

  // Comments for this issue, split into root comments and replies map
  const issueComments = comments.filter(c => c.issueId === issue.id);
  const rootComments = issueComments.filter(c => !c.parentId);
  const repliesMap = new Map<string, IssueComment[]>();
  for (const c of issueComments) {
    if (c.parentId) {
      const list = repliesMap.get(c.parentId) || [];
      list.push(c);
      repliesMap.set(c.parentId, list);
    }
  }

  // Activities for this issue sorted by timestamp descending
  const issueActivities = activities
    .filter(a => a.issueId === issue.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return {
    issue,
    project,
    team,
    assignee,
    creator,
    cycle,
    milestone,
    blockerStatus,
    upstreamDependencies,
    activeBlockers,
    resolvedBlockers,
    downstreamDependencies,
    comments: issueComments,
    rootComments,
    repliesMap,
    activities: issueActivities,
  };
}
