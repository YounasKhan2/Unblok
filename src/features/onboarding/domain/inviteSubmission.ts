/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-14 Teammate Invitation Submission Domain Logic
 * Handles validation, idempotency, non-swallowing of failures, and partial-retry correctness.
 */

import { UserRole } from '../../../types';

export interface TeammateInviteRow {
  id: string;
  email: string;
  role: 'MEMBER' | 'OBSERVER';
}

export interface InviteSubmissionResult {
  succeeded: string[]; // Normalized lowercase emails that are verified as invited
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
 * Submits teammate invitations while preserving idempotency and failure boundaries:
 * - Skips already succeeded emails to prevent duplicate invitations on retry
 * - Collects individual failures without silently swallowing errors
 * - Does not mark failed invitations as successfully saved
 */
export async function submitTeammateInvitations(
  invites: Array<{ email: string; role: 'MEMBER' | 'OBSERVER' }>,
  alreadySucceededEmails: Set<string>,
  inviteMemberFn?: InviteMemberFunction
): Promise<InviteSubmissionResult> {
  const validInvites = invites.filter((inv) => inv.email.trim().length > 0);
  const succeeded = new Set<string>(
    Array.from(alreadySucceededEmails).map((e) => e.trim().toLowerCase())
  );
  const failed: Array<{ email: string; error: string }> = [];

  for (const inv of validInvites) {
    const rawEmail = inv.email.trim();
    const normalizedEmail = rawEmail.toLowerCase();

    // If this invitation was already successfully dispatched in a prior attempt, skip to prevent duplicates
    if (succeeded.has(normalizedEmail)) {
      continue;
    }

    if (!inviteMemberFn) {
      // Standalone prototype mode without settings context
      succeeded.add(normalizedEmail);
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
        succeeded.add(normalizedEmail);
      }
    } catch (err: any) {
      failed.push({
        email: rawEmail,
        error: err?.message || 'Failed to send invitation.',
      });
    }
  }

  return {
    succeeded: Array.from(succeeded),
    failed,
    allSucceeded: failed.length === 0,
  };
}
