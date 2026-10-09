/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-14 Project Creation Domain Logic & Invariant Validation
 */

import { Project, Team, UserRole } from '../../../types';

export interface CreateProjectInput {
  name: string;
  key: string;
  teamId: string;
  description?: string;
}

export interface ProjectValidationResult {
  valid: boolean;
  errors: {
    name?: string;
    key?: string;
    teamId?: string;
  };
  error?: string;
}

/**
 * Validates project creation parameters.
 * Enforces:
 * - Nonempty name (>= 2 chars)
 * - Key format (2-6 uppercase alphanumeric e.g. ENG, DEV)
 * - Owning team must exist in active workspace and not be archived
 * - Key uniqueness within active workspace
 */
export function validateProjectInput(
  input: CreateProjectInput,
  existingProjects: Project[],
  existingTeams: Team[],
  activeWorkspaceIdOrArchivedIds?: string | Set<string>,
  archivedTeamIdsParam?: Set<string>
): ProjectValidationResult {
  let activeWorkspaceId: string | undefined;
  let archivedTeamIds: Set<string> | undefined;

  if (typeof activeWorkspaceIdOrArchivedIds === 'string') {
    activeWorkspaceId = activeWorkspaceIdOrArchivedIds;
    archivedTeamIds = archivedTeamIdsParam;
  } else if (activeWorkspaceIdOrArchivedIds instanceof Set) {
    archivedTeamIds = activeWorkspaceIdOrArchivedIds;
  }

  const errors: { name?: string; key?: string; teamId?: string } = {};

  const trimmedName = (input.name || '').trim();
  if (!trimmedName) {
    errors.name = 'Project name is required.';
  } else if (trimmedName.length < 2) {
    errors.name = 'Project name must be at least 2 characters.';
  }

  const rawKey = (input.key || '').trim().toUpperCase();
  if (!rawKey) {
    errors.key = 'Project key is required.';
  } else if (!/^[A-Z0-9]{2,6}$/.test(rawKey)) {
    errors.key = 'Project key must be 2–6 uppercase alphanumeric characters (e.g. DEV, PLAT).';
  } else {
    // Project keys must be unique within the active workspace.
    // Identical project keys in different workspaces remain valid.
    const activeWs = (activeWorkspaceId || '').trim();
    const isDuplicateKey = existingProjects.some((p) => {
      if (activeWs && p.workspaceId && p.workspaceId.trim() !== activeWs) {
        return false;
      }
      return p.key.toUpperCase() === rawKey;
    });

    if (isDuplicateKey) {
      errors.key = `Project key "${rawKey}" is already in use in this workspace.`;
    }
  }

  const teamId = (input.teamId || '').trim();
  if (!teamId) {
    errors.teamId = 'Owning team is required.';
  } else {
    const owningTeam = existingTeams.find((t) => t.id === teamId);
    if (!owningTeam) {
      errors.teamId = 'Selected team does not exist in this workspace.';
    } else {
      const activeWs = (activeWorkspaceId || '').trim();
      const teamWs = (owningTeam.workspaceId || '').trim();

      if (!activeWs) {
        errors.teamId = 'No active workspace context.';
      } else if (!teamWs || teamWs !== activeWs) {
        errors.teamId = 'Selected team does not belong to the active workspace.';
      } else if (
        archivedTeamIds?.has(teamId) ||
        (owningTeam as any).archivedAt != null ||
        (owningTeam as any).archived === true ||
        (owningTeam as any).status === 'ARCHIVED'
      ) {
        errors.teamId = 'Cannot create project under an archived team.';
      }
    }
  }

  const firstError = errors.name || errors.key || errors.teamId;
  return {
    valid: Object.keys(errors).length === 0,
    errors,
    error: firstError,
  };
}

/**
 * Plans and constructs a new Project record after validating all invariants.
 * Explicitly verifies:
 * - The owning Team belongs to activeWorkspaceId (fail-closed on missing/null/empty/foreign)
 * - The Team is not archived
 * - Project key is unique within activeWorkspaceId
 */
export function planCreateProject(
  input: CreateProjectInput,
  existingProjects: Project[],
  existingTeams: Team[],
  activeWorkspaceId: string,
  actorRole: UserRole = 'MEMBER',
  archivedTeamIds?: Set<string>
): { newProject: Project; updatedProjects: Project[] } {
  // Authorization: OBSERVER cannot create projects
  if (actorRole === 'OBSERVER') {
    throw new Error('Project creation is not permitted for read-only OBSERVER role.');
  }

  const activeWs = (activeWorkspaceId || '').trim();
  if (!activeWs) {
    throw new Error('No active workspace context.');
  }

  const validation = validateProjectInput(
    input,
    existingProjects,
    existingTeams,
    activeWs,
    archivedTeamIds
  );

  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid project parameters.');
  }

  // Double-check owning team directly against workspace ownership and archived state (fail closed)
  const trimmedTeamId = input.teamId.trim();
  const owningTeam = existingTeams.find((t) => t.id === trimmedTeamId);
  if (!owningTeam) {
    throw new Error('Selected team does not exist in this workspace.');
  }
  const teamWs = (owningTeam.workspaceId || '').trim();
  if (!teamWs || teamWs !== activeWs) {
    throw new Error('Selected team does not belong to the active workspace.');
  }
  if (
    archivedTeamIds?.has(trimmedTeamId) ||
    (owningTeam as any).archivedAt != null ||
    (owningTeam as any).archived === true ||
    (owningTeam as any).status === 'ARCHIVED'
  ) {
    throw new Error('Cannot create project under an archived team.');
  }

  const newProject: Project = {
    id: `proj_${input.key.trim().toLowerCase()}_${Date.now()}`,
    workspaceId: activeWorkspaceId,
    teamId: trimmedTeamId,
    name: input.name.trim(),
    key: input.key.trim().toUpperCase(),
    description: input.description?.trim() || '',
    currentSequence: 0,
  };

  return {
    newProject,
    updatedProjects: [...existingProjects, newProject],
  };
}
