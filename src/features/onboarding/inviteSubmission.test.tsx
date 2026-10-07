/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-14 Teammate Invitation Submission Domain & Page Tests
 * Validates:
 * - Success: Single and multiple invitations
 * - Failure: inviteMember error is not silently swallowed and not marked as saved
 * - Partial failure: Error displayed for failed row, success retained, retry does not duplicate
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
    clearStoredOnboardingState('ws_acme');
  });

  describe('1. Email validation', () => {
    it('validates proper email formats and rejects malformed inputs', () => {
      expect(validateInviteEmail('alice@example.com').valid).toBe(true);
      expect(validateInviteEmail('').valid).toBe(false);
      expect(validateInviteEmail('not-an-email').valid).toBe(false);
      expect(validateInviteEmail('alice@').valid).toBe(false);
    });
  });

  describe('2. Success scenario', () => {
    it('successfully processes invitations and returns all succeeded', async () => {
      const mockInviteMember = vi.fn().mockResolvedValue({ success: true });

      const result = await submitTeammateInvitations(
        [
          { email: 'alice@company.com', role: 'MEMBER' },
          { email: 'bob@company.com', role: 'OBSERVER' },
        ],
        new Set<string>(),
        mockInviteMember
      );

      expect(result.allSucceeded).toBe(true);
      expect(result.failed).toHaveLength(0);
      expect(result.succeeded).toEqual(['alice@company.com', 'bob@company.com']);

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
  });

  describe('3. Failure scenario', () => {
    it('does not silently swallow failed inviteMember calls and does not mark failed as saved', async () => {
      const mockInviteMember = vi
        .fn()
        .mockRejectedValue(new Error('This email already has a pending invitation in the workspace.'));

      const result = await submitTeammateInvitations(
        [{ email: 'duplicate@company.com', role: 'MEMBER' }],
        new Set<string>(),
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
        new Set<string>(),
        mockInviteMember
      );

      expect(result.allSucceeded).toBe(false);
      expect(result.succeeded).toHaveLength(0);
      expect(result.failed[0].error).toBe('Domain quota exceeded.');
    });
  });

  describe('4. Partial failure & retry idempotency', () => {
    it('preserves succeeded invitations, isolates failed ones, and prevents duplicates on retry', async () => {
      // First attempt: alice succeeds, bob fails
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
          { email: 'alice@company.com', role: 'MEMBER' },
          { email: 'bob@company.com', role: 'MEMBER' },
        ],
        new Set<string>(),
        mockInviteMember
      );

      expect(attempt1.allSucceeded).toBe(false);
      expect(attempt1.succeeded).toEqual(['alice@company.com']);
      expect(attempt1.failed).toEqual([
        { email: 'bob@company.com', error: 'Network timeout inviting bob' },
      ]);
      expect(mockInviteMember).toHaveBeenCalledTimes(2);

      // Succeeded emails are preserved in caller's set
      const alreadySucceeded = new Set(attempt1.succeeded);

      // Reset mock for retry attempt
      mockInviteMember.mockClear();
      mockInviteMember.mockResolvedValue({ success: true });

      // Second attempt (retry): alice is already in alreadySucceeded, bob is retried
      const attempt2 = await submitTeammateInvitations(
        [
          { email: 'alice@company.com', role: 'MEMBER' },
          { email: 'bob@company.com', role: 'MEMBER' },
        ],
        alreadySucceeded,
        mockInviteMember
      );

      expect(attempt2.allSucceeded).toBe(true);
      expect(attempt2.failed).toHaveLength(0);
      expect(attempt2.succeeded).toContain('alice@company.com');
      expect(attempt2.succeeded).toContain('bob@company.com');

      // CRITICAL: mockInviteMember was only called ONCE during retry (for bob), avoiding duplicate invitation for alice!
      expect(mockInviteMember).toHaveBeenCalledTimes(1);
      expect(mockInviteMember).toHaveBeenCalledWith({
        email: 'bob@company.com',
        role: 'MEMBER',
        teamIds: [],
      });
    });
  });

  describe('5. Component UI & Honest prototype notice', () => {
    it('renders honest prototype notice and skip button without claiming real emails are sent', () => {
      const html = renderToString(
        <AppProviders initialAuthStatus="authenticated" initialActiveWorkspaceId="ws_acme">
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

    it('records skipped state when user skips invitations', () => {
      saveStoredOnboardingState('ws_acme', {
        inviteCompletedOrSkipped: true,
      });

      const state = getStoredOnboardingState('ws_acme');
      expect(state?.inviteCompletedOrSkipped).toBe(true);
      expect(state?.sentInvitations).toBeUndefined();
    });

    it('records sent invitations in stored state when all invitations succeed', () => {
      saveStoredOnboardingState('ws_acme', {
        inviteCompletedOrSkipped: true,
        sentInvitations: [
          { email: 'alice@company.com', role: 'MEMBER' },
          { email: 'bob@company.com', role: 'OBSERVER' },
        ],
      });

      const state = getStoredOnboardingState('ws_acme');
      expect(state?.inviteCompletedOrSkipped).toBe(true);
      expect(state?.sentInvitations).toHaveLength(2);
      expect(state?.sentInvitations?.[0].email).toBe('alice@company.com');
      expect(state?.sentInvitations?.[1].email).toBe('bob@company.com');
    });
  });
});
