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
  archivedTeamIds?: Set<string>
): ProjectValidationResult {
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
    const isDuplicateKey = existingProjects.some(
      (p) => p.key.toUpperCase() === rawKey
    );
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
    } else if (archivedTeamIds?.has(teamId) || (owningTeam as any).archivedAt != null) {
      errors.teamId = 'Cannot create project under an archived team.';
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

  if (!activeWorkspaceId) {
    throw new Error('No active workspace context.');
  }

  const validation = validateProjectInput(
    input,
    existingProjects,
    existingTeams,
    archivedTeamIds
  );

  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid project parameters.');
  }

  const newProject: Project = {
    id: `proj_${input.key.trim().toLowerCase()}_${Date.now()}`,
    workspaceId: activeWorkspaceId,
    teamId: input.teamId.trim(),
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
