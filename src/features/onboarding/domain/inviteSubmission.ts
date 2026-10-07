/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-14 Teammate Invitation Submission Domain Logic
 * Handles validation, idempotency, role preservation, and adapter availability checks.
 */

import { UserRole } from '../../../types';

export interface TeammateInviteRow {
  id: string;
  email: string;
  role: 'MEMBER' | 'OBSERVER';
}

export interface SucceededInvitation {
  email: string;
  role: 'MEMBER' | 'OBSERVER';
}

export interface InviteSubmissionResult {
  succeeded: SucceededInvitation[]; // Genuinely persisted invitations preserving original roles
  failed: Array<{ email: string; error: string }>;
  allSucceeded: boolean;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateInviteEmail(email: string): { valid: boolean; error?: string } {
  const normalized = email.trim();
  if (!normalized) {
    return { valid: false, error: 'Email address is required.' };
  }
  if (!EMAIL_REGEX.test(normalized)) {
    return { valid: false, error: `"${email}" is not a valid email address.` };
  }
  return { valid: true };
}

export type InviteMemberFunction = (input: {
  email: string;
  role: UserRole;
  teamIds: string[];
}) => Promise<{ success: boolean; error?: string } | void> | { success: boolean; error?: string } | void;

/**
 * Submits teammate invitations while preserving idempotency, role accuracy, and fail-closed persistence:
 * - Never marks an invitation successful without successful persistence through the invitation adapter
 * - If inviteMemberFn is unavailable, returns explicit failures for pending invitations
 * - Preserves each successful invitation's original MEMBER or OBSERVER role (no rewriting)
 * - Skips already succeeded addresses on retry to prevent duplicate invitations
 */
export async function submitTeammateInvitations(
  invites: Array<{ email: string; role: 'MEMBER' | 'OBSERVER' }>,
  alreadySucceeded:
    | SucceededInvitation[]
    | Map<string, 'MEMBER' | 'OBSERVER'>
    | Set<string> = [],
  inviteMemberFn?: InviteMemberFunction
): Promise<InviteSubmissionResult> {
  const validInvites = invites.filter((inv) => inv.email.trim().length > 0);

  // Normalize existing succeeded records into a Map preserving original roles
  const succeededMap = new Map<string, 'MEMBER' | 'OBSERVER'>();
  if (alreadySucceeded instanceof Map) {
    for (const [email, role] of alreadySucceeded.entries()) {
      succeededMap.set(email.trim().toLowerCase(), role);
    }
  } else if (Array.isArray(alreadySucceeded)) {
    for (const item of alreadySucceeded) {
      if (typeof item === 'object' && item !== null && 'email' in item) {
        succeededMap.set(item.email.trim().toLowerCase(), item.role || 'MEMBER');
      } else if (typeof item === 'string') {
        succeededMap.set((item as string).trim().toLowerCase(), 'MEMBER');
      }
    }
  } else if (alreadySucceeded instanceof Set) {
    for (const email of alreadySucceeded) {
      succeededMap.set(email.trim().toLowerCase(), 'MEMBER');
    }
  }

  const failed: Array<{ email: string; error: string }> = [];

  for (const inv of validInvites) {
    const rawEmail = inv.email.trim();
    const normalizedEmail = rawEmail.toLowerCase();

    // Prevent duplicate submission of already successful addresses
    if (succeededMap.has(normalizedEmail)) {
      continue;
    }

    // Fail closed: Never mark an invitation successful without persistence adapter
    if (!inviteMemberFn) {
      failed.push({
        email: rawEmail,
        error: 'Invitation adapter is unavailable. Cannot persist invitation.',
      });
      continue;
    }

    try {
      const res = await inviteMemberFn({
        email: normalizedEmail,
        role: inv.role,
        teamIds: [],
      });

      if (res && res.success === false) {
        failed.push({
          email: rawEmail,
          error: res.error || 'Invitation failed.',
        });
      } else {
        // Persist genuinely successful invitation preserving original role
        succeededMap.set(normalizedEmail, inv.role);
      }
    } catch (err: any) {
      failed.push({
        email: rawEmail,
        error: err?.message || 'Failed to send invitation.',
      });
    }
  }

  const succeeded: SucceededInvitation[] = Array.from(succeededMap.entries()).map(
    ([email, role]) => ({ email, role })
  );

  return {
    succeeded,
    failed,
    allSucceeded: failed.length === 0,
  };
}
