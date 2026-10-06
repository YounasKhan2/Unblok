/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Cycle, Project, Team, User, UserRole } from '../../../types';
import { CreateTeamInput, EditTeamInput } from '../types';

export interface TeamValidationResult {
  valid: boolean;
  errors: {
    name?: string;
    key?: string;
  };
  error?: string;
}

/**
 * Validates team creation or modification parameters.
 */
export function validateTeamParameters(
  input: CreateTeamInput | EditTeamInput,
  existingTeams: Team[],
  currentTeamId?: string
): TeamValidationResult {
  const errors: { name?: string; key?: string } = {};

  const trimmedName = (input.name || '').trim();
  if (!trimmedName) {
    errors.name = 'Team name is required.';
  } else if (trimmedName.length < 2) {
    errors.name = 'Team name must be at least 2 characters.';
  } else {
    const isDuplicateName = existingTeams.some(
      t => t.id !== currentTeamId && t.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicateName) {
      errors.name = `A team named "${trimmedName}" already exists.`;
    }
  }

  const rawKey = (input.key || '').trim();
  if (!rawKey) {
    errors.key = 'Team key is required.';
  } else if (!/^[A-Z0-9]{2,6}$/.test(rawKey)) {
    errors.key = 'Team key must be 2–6 uppercase alphanumeric characters (e.g. SEC, ENG).';
  } else {
    const isDuplicateKey = existingTeams.some(
      t => t.id !== currentTeamId && t.key.toUpperCase() === rawKey.toUpperCase()
    );
    if (isDuplicateKey) {
      errors.key = `Team key "${rawKey.toUpperCase()}" is already in use by another team.`;
    }
  }

  const firstError = errors.name || errors.key;

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    error: firstError,
  };
}

export interface ArchiveTeamGuardResult {
  allowed: boolean;
  reason?: string;
  ownedProjects: Project[];
  activeCycles: Cycle[];
  details?: {
    projectKeys: string[];
    cycleNames: string[];
  };
}

/**
 * Domain guard checking whether a team can be safely archived.
 * Inspects canonical Project.teamId ownership and active Cycles.
 * Prevents archiving if projects or active cycles would become orphaned.
 */
export function canArchiveTeam(
  teamId: string,
  arg2: string | Project[],
  arg3?: Project[] | Cycle[],
  arg4?: Cycle[]
): ArchiveTeamGuardResult {
  let teamName = 'this team';
  let projects: Project[] = [];
  let cycles: Cycle[] = [];

  if (typeof arg2 === 'string') {
    teamName = arg2;
    projects = (arg3 as Project[]) || [];
    cycles = arg4 || [];
  } else {
    projects = (arg2 as Project[]) || [];
    cycles = (arg3 as Cycle[]) || [];
  }

  const ownedProjects = projects.filter(p => p.teamId === teamId && !(p as any).archivedAt);
  const activeCycles = cycles.filter(c => c.teamId === teamId && c.status === 'ACTIVE');

  if (ownedProjects.length > 0 || activeCycles.length > 0) {
    const reasons: string[] = [];
    const projKeys = ownedProjects.map(p => p.key);
    const cycleNames = activeCycles.map(c => c.name);

    if (ownedProjects.length > 0) {
      reasons.push(
        `owns ${ownedProjects.length} active project${ownedProjects.length > 1 ? 's' : ''} (${projKeys.join(', ')})`
      );
    }
    if (activeCycles.length > 0) {
      reasons.push(
        `has ${activeCycles.length} active cycle${activeCycles.length > 1 ? 's' : ''} (${cycleNames.join(', ')})`
      );
    }

    return {
      allowed: false,
      reason: `Cannot archive team "${teamName}" because it ${reasons.join(
        ' and '
      )}. Reassign project ownership before archiving.`,
      ownedProjects,
      activeCycles,
      details: {
        projectKeys: projKeys,
        cycleNames,
      },
    };
  }

  return {
    allowed: true,
    ownedProjects: [],
    activeCycles: [],
    details: {
      projectKeys: [],
      cycleNames: [],
    },
  };
}

export interface PlanCreateTeamResult {
  newTeam: Team;
  updatedTeams: Team[];
  updatedUsers: User[];
}

/**
 * Pure planning and pre-validation helper for atomic team creation.
 * Validates role, team parameters, member uniqueness, and existence of all referenced users
 * BEFORE computing proposed team and user membership states.
 * Throws an error if any invariant fails, ensuring zero side-effects.
 */
export function planCreateTeam(
  input: CreateTeamInput,
  existingTeams: Team[],
  existingUsers: User[],
  actorRole: UserRole = 'ADMIN'
): PlanCreateTeamResult {
  // 1. ADMIN authorization
  if (actorRole !== 'ADMIN') {
    throw new Error('Administrative mutations require ADMIN role.');
  }

  // 2. Validate team parameters (name, key format, duplicate name/key)
  const validation = validateTeamParameters(input, existingTeams);
  if (!validation.valid) {
    throw new Error(validation.error || validation.errors.name || validation.errors.key || 'Invalid team parameters');
  }

  // 3. Validate memberIds: uniqueness & user existence
  const memberIds = input.memberIds || [];
  if (memberIds.length > 0) {
    const uniqueMemberIds = new Set(memberIds);
    if (uniqueMemberIds.size !== memberIds.length) {
      throw new Error('Duplicate member IDs provided');
    }
    for (const uid of memberIds) {
      if (!existingUsers.some(u => u.id === uid)) {
        throw new Error(`User with ID ${uid} not found`);
      }
    }
  }

  // 4. Construct proposed Team
  const newTeam: Team = {
    id: `team_${input.key.trim().toLowerCase()}_${Date.now()}`,
    name: input.name.trim(),
    key: input.key.trim().toUpperCase(),
    color: input.color || '#5645d4',
    description: input.description?.trim() || '',
  };
  if (input.leadId) {
    (newTeam as any).leadId = input.leadId;
  }

  // 5. Compute proposed user memberships (preserving unrelated memberships)
  const selectedSet = new Set(memberIds);
  const updatedUsers = memberIds.length === 0
    ? existingUsers
    : existingUsers.map(u => {
        if (selectedSet.has(u.id)) {
          const currentMemberships = new Set(u.teamIds || (u.teamId ? [u.teamId] : []));
          currentMemberships.add(newTeam.id);
          const nextTeamIds = Array.from(currentMemberships);
          return {
            ...u,
            teamIds: nextTeamIds,
            teamId: nextTeamIds[0] || '',
          };
        }
        return u;
      });

  return {
    newTeam,
    updatedTeams: [...existingTeams, newTeam],
    updatedUsers,
  };
}
