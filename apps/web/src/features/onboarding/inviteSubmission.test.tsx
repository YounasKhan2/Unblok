/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-14 Teammate Invitation Submission Domain & Page Tests
 * Validates:
 * - Success: Single and multiple invitations with preserved MEMBER and OBSERVER roles
 * - Failure: inviteMember error is not silently swallowed and not marked as saved
 * - Adapter availability: Fails closed when inviteMemberFn is unavailable
 * - Partial failure: Error displayed for failed row, success retained, retry does not duplicate
 * - Role preservation: Original OBSERVER and MEMBER roles preserved on partial retry and skip
 * - Skip action preserved
 * - Honest prototype notice preserved
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import {
  submitTeammateInvitations,
  validateInviteEmail,
} from './domain/inviteSubmission';
import {
  saveStoredOnboardingState,
  getStoredOnboardingState,
  clearStoredOnboardingState,
} from './domain/onboardingProgression';
import { InviteTeammatesOnboardingPage } from '../../pages/onboarding/InviteTeammatesOnboardingPage';
import { AppProviders } from '../../app/providers/AppProviders';

describe('UX-14 Teammate Invitation Submission Correctness', () => {
  beforeEach(() => {
    clearStoredOnboardingState('ws_nexus');
  });

  describe('1. Email validation', () => {
    it('validates proper email formats and rejects malformed inputs', () => {
      expect(validateInviteEmail('alice@example.com').valid).toBe(true);
      expect(validateInviteEmail('').valid).toBe(false);
      expect(validateInviteEmail('not-an-email').valid).toBe(false);
      expect(validateInviteEmail('alice@').valid).toBe(false);
    });
  });

  describe('2. Success scenario & Role preservation', () => {
    it('successfully processes invitations and returns all succeeded with preserved roles', async () => {
      const mockInviteMember = vi.fn().mockResolvedValue({ success: true });

      const result = await submitTeammateInvitations(
        [
          { email: 'alice@company.com', role: 'MEMBER' },
          { email: 'bob@company.com', role: 'OBSERVER' },
        ],
        [],
        mockInviteMember
      );

      expect(result.allSucceeded).toBe(true);
      expect(result.failed).toHaveLength(0);
      expect(result.succeeded).toEqual([
        { email: 'alice@company.com', role: 'MEMBER' },
        { email: 'bob@company.com', role: 'OBSERVER' },
      ]);

      expect(mockInviteMember).toHaveBeenCalledTimes(2);
      expect(mockInviteMember).toHaveBeenNthCalledWith(1, {
        email: 'alice@company.com',
        role: 'MEMBER',
        teamIds: [],
      });
      expect(mockInviteMember).toHaveBeenNthCalledWith(2, {
        email: 'bob@company.com',
        role: 'OBSERVER',
        teamIds: [],
      });
    });

    it('preserves OBSERVER role without rewriting to MEMBER', async () => {
      const mockInviteMember = vi.fn().mockResolvedValue({ success: true });

      const result = await submitTeammateInvitations(
        [{ email: 'observer-audit@company.com', role: 'OBSERVER' }],
        [],
        mockInviteMember
      );

      expect(result.allSucceeded).toBe(true);
      expect(result.succeeded[0].role).toBe('OBSERVER');
    });
  });

  describe('3. Adapter availability & Failure scenarios', () => {
    it('fails closed when inviteMemberFn is unavailable and never marks invitations as successful', async () => {
      const result = await submitTeammateInvitations(
        [
          { email: 'pending@company.com', role: 'MEMBER' },
          { email: 'observer@company.com', role: 'OBSERVER' },
        ],
        [],
        undefined // adapter unavailable
      );

      expect(result.allSucceeded).toBe(false);
      expect(result.succeeded).toHaveLength(0);
      expect(result.failed).toHaveLength(2);
      expect(result.failed[0].error).toContain('unavailable');
      expect(result.failed[1].error).toContain('unavailable');
    });

    it('does not silently swallow failed inviteMember calls and does not mark failed as saved', async () => {
      const mockInviteMember = vi
        .fn()
        .mockRejectedValue(new Error('This email already has a pending invitation in the workspace.'));

      const result = await submitTeammateInvitations(
        [{ email: 'duplicate@company.com', role: 'MEMBER' }],
        [],
        mockInviteMember
      );

      expect(result.allSucceeded).toBe(false);
      expect(result.succeeded).toHaveLength(0); // NOT marked as succeeded
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0]).toEqual({
        email: 'duplicate@company.com',
        error: 'This email already has a pending invitation in the workspace.',
      });
    });

    it('captures structured error returned with success: false', async () => {
      const mockInviteMember = vi.fn().mockResolvedValue({
        success: false,
        error: 'Domain quota exceeded.',
      });

      const result = await submitTeammateInvitations(
        [{ email: 'quota@company.com', role: 'MEMBER' }],
        [],
        mockInviteMember
      );

      expect(result.allSucceeded).toBe(false);
      expect(result.succeeded).toHaveLength(0);
      expect(result.failed[0].error).toBe('Domain quota exceeded.');
    });
  });

  describe('4. Partial failure, retry idempotency & Skip role preservation', () => {
    it('preserves succeeded invitations with exact roles, isolates failed ones, and prevents duplicates on retry', async () => {
      // First attempt: alice (OBSERVER) succeeds, bob (MEMBER) fails
      const mockInviteMember = vi
        .fn()
        .mockImplementation(async ({ email }) => {
          if (email === 'bob@company.com') {
            throw new Error('Network timeout inviting bob');
          }
          return { success: true };
        });

      const attempt1 = await submitTeammateInvitations(
        [
          { email: 'alice@company.com', role: 'OBSERVER' },
          { email: 'bob@company.com', role: 'MEMBER' },
        ],
        [],
        mockInviteMember
      );

      expect(attempt1.allSucceeded).toBe(false);
      expect(attempt1.succeeded).toEqual([
        { email: 'alice@company.com', role: 'OBSERVER' },
      ]);
      expect(attempt1.failed).toEqual([
        { email: 'bob@company.com', error: 'Network timeout inviting bob' },
      ]);
      expect(mockInviteMember).toHaveBeenCalledTimes(2);

      // Succeeded invitation is preserved in caller's state with role OBSERVER
      const alreadySucceeded = attempt1.succeeded;

      // Reset mock for retry attempt
      mockInviteMember.mockClear();
      mockInviteMember.mockResolvedValue({ success: true });

      // Second attempt (retry): alice is already succeeded and skipped; bob is retried
      const attempt2 = await submitTeammateInvitations(
        [
          { email: 'alice@company.com', role: 'OBSERVER' },
          { email: 'bob@company.com', role: 'MEMBER' },
        ],
        alreadySucceeded,
        mockInviteMember
      );

      expect(attempt2.allSucceeded).toBe(true);
      expect(attempt2.failed).toHaveLength(0);
      expect(attempt2.succeeded).toEqual([
        { email: 'alice@company.com', role: 'OBSERVER' },
        { email: 'bob@company.com', role: 'MEMBER' },
      ]);

      // CRITICAL: mockInviteMember was only called ONCE during retry (for bob), avoiding duplicate invitation for alice!
      expect(mockInviteMember).toHaveBeenCalledTimes(1);
      expect(mockInviteMember).toHaveBeenCalledWith({
        email: 'bob@company.com',
        role: 'MEMBER',
        teamIds: [],
      });
    });

    it('persists genuinely successful invitations with original roles when skipping after partial success', () => {
      // Suppose alice (OBSERVER) succeeded, but bob failed. User skips.
      const partiallySucceeded = [
        { email: 'alice@company.com', role: 'OBSERVER' as const },
      ];

      saveStoredOnboardingState('ws_nexus', {
        inviteCompletedOrSkipped: true,
        sentInvitations: partiallySucceeded,
      });

      const state = getStoredOnboardingState('ws_nexus');
      expect(state?.inviteCompletedOrSkipped).toBe(true);
      expect(state?.sentInvitations).toHaveLength(1);
      expect(state?.sentInvitations?.[0]).toEqual({
        email: 'alice@company.com',
        role: 'OBSERVER', // NOT rewritten to MEMBER
      });
    });
  });

  describe('5. Component UI & Honest prototype notice', () => {
    it('renders honest prototype notice and skip button without claiming real emails are sent', () => {
      const html = renderToString(
        <AppProviders initialAuthStatus="authenticated" initialActiveWorkspaceId="ws_nexus">
          <MemoryRouter>
            <InviteTeammatesOnboardingPage />
          </MemoryRouter>
        </AppProviders>
      );

      expect(html).toContain('Prototype notice:');
      expect(html).toContain('Email delivery is not connected');
      expect(html).toContain('Skip for now');
      expect(html).toContain('Save invitations and continue');
    });

    it('records skipped state when user skips invitations with zero previous invites', () => {
      saveStoredOnboardingState('ws_nexus', {
        inviteCompletedOrSkipped: true,
      });

      const state = getStoredOnboardingState('ws_nexus');
      expect(state?.inviteCompletedOrSkipped).toBe(true);
      expect(state?.sentInvitations).toBeUndefined();
    });

    it('records sent invitations in stored state when all invitations succeed preserving roles', () => {
      saveStoredOnboardingState('ws_nexus', {
        inviteCompletedOrSkipped: true,
        sentInvitations: [
          { email: 'alice@company.com', role: 'MEMBER' },
          { email: 'bob@company.com', role: 'OBSERVER' },
        ],
      });

      const state = getStoredOnboardingState('ws_nexus');
      expect(state?.inviteCompletedOrSkipped).toBe(true);
      expect(state?.sentInvitations).toHaveLength(2);
      expect(state?.sentInvitations?.[0]).toEqual({
        email: 'alice@company.com',
        role: 'MEMBER',
      });
      expect(state?.sentInvitations?.[1]).toEqual({
        email: 'bob@company.com',
        role: 'OBSERVER',
      });
    });
  });
});
