/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-14 Team Resolution, Directory Aggregations & Validation Domain Logic
 */

import { Team, Project, Issue, User, Cycle, Milestone, Dependency } from '../../../types';
import { TeamDirectoryItem, TeamOverviewData, TeamStatusFilter } from '../types';

/**
 * Resolves a team strictly scoped to the active workspace by team key.
 * Never resolves by teamKey alone across multiple workspaces.
 */
export function resolveTeamByWorkspaceAndKey(
  teams: Team[],
  activeWorkspaceId: string | null,
  teamKey?: string
): Team | undefined {
  if (!activeWorkspaceId || !teamKey) return undefined;
  const normalizedKey = teamKey.trim().toUpperCase();
  return teams.find(
    (t) =>
      Boolean(t.workspaceId) &&
      t.workspaceId === activeWorkspaceId &&
      t.key.toUpperCase() === normalizedKey
  );
}

/**
 * Resolves a team from an already workspace-scoped list of teams by key.
 */
export function resolveTeam(teams: Team[], teamKey?: string): Team | undefined {
  if (!teamKey) return undefined;
  const normalizedKey = teamKey.trim().toUpperCase();
  return teams.find((t) => t.key.toUpperCase() === normalizedKey);
}

/**
 * Validates team creation parameters against existing workspace teams.
 */
export function validateTeamInput(
  input: { name: string; key: string },
  existingTeams: Team[],
  currentTeamId?: string
): { valid: boolean; errors: { name?: string; key?: string }; error?: string } {
  const errors: { name?: string; key?: string } = {};

  const trimmedName = (input.name || '').trim();
  if (!trimmedName) {
    errors.name = 'Team name is required.';
  } else if (trimmedName.length < 2) {
    errors.name = 'Team name must be at least 2 characters.';
  } else {
    const isDuplicateName = existingTeams.some(
      (t) => t.id !== currentTeamId && t.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicateName) {
      errors.name = `A team named "${trimmedName}" already exists in this workspace.`;
    }
  }

  const rawKey = (input.key || '').trim().toUpperCase();
  if (!rawKey) {
    errors.key = 'Team key is required.';
  } else if (!/^[A-Z0-9]{2,6}$/.test(rawKey)) {
    errors.key = 'Team key must be 2–6 uppercase alphanumeric characters (e.g. ENG, PLAT).';
  } else {
    const isDuplicateKey = existingTeams.some(
      (t) => t.id !== currentTeamId && t.key.toUpperCase() === rawKey
    );
    if (isDuplicateKey) {
      errors.key = `Team key "${rawKey}" is already in use in this workspace.`;
    }
  }

  const firstError = errors.name || errors.key;
  return {
    valid: Object.keys(errors).length === 0,
    errors,
    error: firstError,
  };
}

/**
 * Projects workspace teams into directory items with aggregated metrics.
 */
export function selectTeamDirectory(
  teams: Team[],
  projects: Project[],
  issues: Issue[],
  users: User[],
  archivedTeamIds: Set<string>,
  searchQuery = '',
  filter: TeamStatusFilter = 'ALL'
): TeamDirectoryItem[] {
  const query = searchQuery.trim().toLowerCase();

  return teams
    .filter((team) => {
      const isArchived = Boolean(archivedTeamIds && typeof archivedTeamIds.has === 'function' && archivedTeamIds.has(team.id)) || (team as any).archivedAt != null;
      if (filter === 'ACTIVE' && isArchived) return false;
      if (filter === 'ARCHIVED' && !isArchived) return false;

      if (query) {
        const matchesName = team.name.toLowerCase().includes(query);
        const matchesKey = team.key.toLowerCase().includes(query);
        const matchesDesc = (team.description || '').toLowerCase().includes(query);
        return matchesName || matchesKey || matchesDesc;
      }
      return true;
    })
    .map((team) => {
      const isArchived = Boolean(archivedTeamIds && typeof archivedTeamIds.has === 'function' && archivedTeamIds.has(team.id)) || (team as any).archivedAt != null;
      const teamProjects = projects.filter((p) => p.teamId === team.id);
      const teamIssues = issues.filter((i) => i.teamId === team.id);

      const memberCount = users.filter((u) => {
        const teamIds = u.teamIds || (u.teamId ? [u.teamId] : []);
        return teamIds.includes(team.id);
      }).length;

      const activeIssueCount = teamIssues.filter(
        (i) => i.state !== 'DONE' && i.state !== 'CANCELLED'
      ).length;

      const blockedIssueCount = teamIssues.filter((i) => (i as any).isBlocked).length;

      return {
        team,
        memberCount,
        projectCount: teamProjects.length,
        activeIssueCount,
        blockedIssueCount,
        isArchived,
      };
    });
}

/**
 * Aggregates complete context for the Team Hub view.
 */
export function selectTeamOverview(
  team: Team,
  projects: Project[],
  issues: Issue[],
  dependencies: Dependency[],
  users: User[],
  cycles: Cycle[],
  milestones: Milestone[],
  archivedTeamIds: Set<string> = new Set()
): TeamOverviewData {
  const isArchived = Boolean(archivedTeamIds && typeof archivedTeamIds.has === 'function' && archivedTeamIds.has(team.id)) || (team as any).archivedAt != null;
  const ownedProjects = projects.filter((p) => p.teamId === team.id);
  const teamIssues = issues.filter((i) => i.teamId === team.id);

  const members = users.filter((u) => {
    const teamIds = u.teamIds || (u.teamId ? [u.teamId] : []);
    const inMemberIds = Boolean((team as any).memberIds && (team as any).memberIds.includes(u.id));
    return teamIds.includes(team.id) || inMemberIds;
  });

  const activeIssues = teamIssues.filter(
    (i) => i.state !== 'DONE' && i.state !== 'CANCELLED'
  );

  const blockedIssues = teamIssues.filter((i) => (i as any).isBlocked);

  // Needs attention: blocked issues or urgent/high active issues
  const needsAttentionIssues = activeIssues.filter(
    (i) => (i as any).isBlocked || i.priority === 'URGENT' || i.priority === 'HIGH'
  );

  // Team cycles: cycles explicitly matching teamId, or active cycles containing issues for this team
  const teamIssueCycleIds = new Set(
    teamIssues.map((i) => i.cycleId).filter((id): id is string => Boolean(id))
  );

  const teamCycles = cycles.filter(
    (c) => c.teamId === team.id || teamIssueCycleIds.has(c.id)
  );

  const activeCycle = teamCycles.find((c) => c.status === 'ACTIVE') || null;

  const teamMilestones = milestones.filter(
    (m) => m.teamId === team.id || !m.teamId
  );

  return {
    team,
    members,
    ownedProjects,
    activeIssues,
    blockedIssues,
    needsAttentionIssues,
    cycles: teamCycles,
    milestones: teamMilestones,
    activeCycle,
    isArchived,
  };
}
