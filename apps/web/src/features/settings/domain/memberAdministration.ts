/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Team, User, UserRole } from '../../../types';
import { InviteMemberInput, PendingInvitation } from '../types';
import { VALID_ROLES } from './permissions';

export interface InviteValidationResult {
  valid: boolean;
  errors: {
    email?: string;
    role?: string;
    teamIds?: string[];
  };
  error?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates member invitation inputs against active users and pending invitations.
 */
export function validateMemberInvitation(
  input: InviteMemberInput,
  activeUsers: User[],
  pendingInvitations: PendingInvitation[],
  availableTeams: Team[]
): InviteValidationResult {
  const errors: { email?: string; role?: string; teamIds?: string[] } = {};

  const normalizedEmail = input.email.trim().toLowerCase();
  if (!normalizedEmail) {
    errors.email = 'Email address is required.';
  } else if (!EMAIL_REGEX.test(normalizedEmail)) {
    errors.email = 'Please provide a valid email address.';
  } else if (activeUsers.some(u => u.email.toLowerCase() === normalizedEmail)) {
    errors.email = 'A member with this email address already is an active member in the workspace.';
  } else if (
    pendingInvitations.some(
      inv => inv.status === 'PENDING' && inv.email.toLowerCase() === normalizedEmail
    )
  ) {
    errors.email = 'This email already has a pending invitation in the workspace.';
  }

  if (!VALID_ROLES.includes(input.role)) {
    errors.role = `Role must be one of: ${VALID_ROLES.join(', ')}.`;
  }

  if (input.teamIds && input.teamIds.length > 0) {
    const availableTeamIds = new Set(availableTeams.map(t => t.id));
    const invalidTeams = input.teamIds.filter(tid => !availableTeamIds.has(tid));
    if (invalidTeams.length > 0) {
      errors.teamIds = invalidTeams;
    }
  }

  const singleError =
    errors.email ||
    errors.role ||
    (errors.teamIds ? `Team "${errors.teamIds.join(', ')}" does not exist.` : undefined);

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    error: singleError,
  };
}
