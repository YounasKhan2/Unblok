/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-12 Deterministic Local Mock Adapter
 * Implements AuthAdapter contract for prototype demonstration and automated testing.
 * UI components interact strictly through the AuthAdapter contract.
 */

import {
  AuthAdapter,
  AuthResult,
  AuthenticatedUser,
  WorkspaceMembership,
  PasswordResetRequestResult,
  ResetPasswordResult,
  InvitationDetails,
  InvitationAcceptResult,
} from '../types';

/**
 * Seed accounts for deterministic prototype testing and demo access.
 * Isolated in adapter infrastructure — never hardcoded into client form copy.
 */
export const SEED_PROTOTYPE_USERS: Record<string, { user: AuthenticatedUser; membership: WorkspaceMembership }> = {
  'alex@unblok.dev': {
    user: {
      id: 'usr_alex',
      name: 'Alex Rivera',
      email: 'alex@unblok.dev',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
    },
    membership: {
      workspaceId: 'ws_acme',
      workspaceName: 'Acme Core Platform',
      userId: 'usr_alex',
      role: 'MEMBER',
      membershipStatus: 'ACTIVE',
      teamIds: ['team_eng'],
    },
  },
  'sarah@unblok.dev': {
    user: {
      id: 'usr_sarah',
      name: 'Sarah Chen',
      email: 'sarah@unblok.dev',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
    },
    membership: {
      workspaceId: 'ws_acme',
      workspaceName: 'Acme Core Platform',
      userId: 'usr_sarah',
      role: 'ADMIN',
      membershipStatus: 'ACTIVE',
      teamIds: ['team_eng', 'team_web'],
    },
  },
  'marcus@unblok.dev': {
    user: {
      id: 'usr_marcus',
      name: 'Marcus Vance',
      email: 'marcus@unblok.dev',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
    },
    membership: {
      workspaceId: 'ws_acme',
      workspaceName: 'Acme Core Platform',
      userId: 'usr_marcus',
      role: 'MEMBER',
      membershipStatus: 'ACTIVE',
      teamIds: ['team_eng'],
    },
  },
  'elena@unblok.dev': {
    user: {
      id: 'usr_elena',
      name: 'Elena Rostova',
      email: 'elena@unblok.dev',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces',
    },
    membership: {
      workspaceId: 'ws_acme',
      workspaceName: 'Acme Core Platform',
      userId: 'usr_elena',
      role: 'OBSERVER',
      membershipStatus: 'ACTIVE',
      teamIds: ['team_inf', 'team_eng'],
    },
  },
};

export const DETERMINISTIC_INVITATIONS: Record<string, InvitationDetails> = {
  'inv_existing_user': {
    token: 'inv_existing_user',
    status: 'VALID',
    workspaceName: 'Acme Core Platform',
    workspaceId: 'ws_acme',
    invitedEmail: 'alex@unblok.dev',
    intendedRole: 'MEMBER',
    teamName: 'Core Architecture',
    inviterName: 'Sarah Chen',
    isExistingUser: true,
  },
  'invite-existing-member': {
    token: 'invite-existing-member',
    status: 'VALID',
    workspaceName: 'Acme Core Platform',
    workspaceId: 'ws_acme',
    invitedEmail: 'alex@unblok.dev',
    intendedRole: 'MEMBER',
    teamName: 'Core Architecture',
    inviterName: 'Sarah Chen',
    isExistingUser: true,
  },
  'inv_new_user': {
    token: 'inv_new_user',
    status: 'VALID',
    workspaceName: 'Apex Robotics',
    workspaceId: 'ws_apex',
    invitedEmail: 'jordan.taylor@techcorp.io',
    intendedRole: 'MEMBER',
    teamName: 'Platform Core',
    inviterName: 'Marcus Vance',
    isExistingUser: false,
  },
  'invite-new-member': {
    token: 'invite-new-member',
    status: 'VALID',
    workspaceName: 'Apex Robotics',
    workspaceId: 'ws_apex',
    invitedEmail: 'jordan.taylor@techcorp.io',
    intendedRole: 'MEMBER',
    teamName: 'Platform Core',
    inviterName: 'Marcus Vance',
    isExistingUser: false,
  },
  'inv_expired': {
    token: 'inv_expired',
    status: 'EXPIRED',
  },
  'invite-expired': {
    token: 'invite-expired',
    status: 'EXPIRED',
  },
  'inv_revoked': {
    token: 'inv_revoked',
    status: 'REVOKED',
  },
  'invite-revoked': {
    token: 'invite-revoked',
    status: 'REVOKED',
  },
  'inv_accepted': {
    token: 'inv_accepted',
    status: 'ACCEPTED',
    workspaceName: 'Acme Core Platform',
  },
  'invite-accepted': {
    token: 'invite-accepted',
    status: 'ACCEPTED',
    workspaceName: 'Acme Core Platform',
  },
};

export class MockAuthAdapter implements AuthAdapter {
  async login({ email, password }: { email: string; password: string }): Promise<AuthResult> {
    const normalizedEmail = email.trim().toLowerCase();

    // Deterministic failure triggers
    if (
      normalizedEmail === 'fail@unblok.dev' ||
      normalizedEmail === 'invalid@unblok.dev' ||
      password === 'wrong-password' ||
      password.length < 3
    ) {
      return {
        success: false,
        error: 'Email or password is incorrect.',
      };
    }

    // Check if known prototype seed account
    if (SEED_PROTOTYPE_USERS[normalizedEmail]) {
      const { user, membership } = SEED_PROTOTYPE_USERS[normalizedEmail];
      return {
        success: true,
        user,
        membership,
      };
    }

    // For any other reasonable credentials in the prototype, create an authenticated session
    const generatedId = `usr_${Math.random().toString(36).substring(2, 9)}`;
    const derivedName = normalizedEmail.split('@')[0].replace(/[._]/g, ' ');
    const formattedName = derivedName.charAt(0).toUpperCase() + derivedName.slice(1);

    const user: AuthenticatedUser = {
      id: generatedId,
      name: formattedName || 'Team Member',
      email: normalizedEmail,
    };

    const membership: WorkspaceMembership = {
      workspaceId: 'ws_acme',
      workspaceName: 'Acme Core Platform',
      userId: generatedId,
      role: 'MEMBER',
      membershipStatus: 'ACTIVE',
      teamIds: ['team_eng'],
    };

    return {
      success: true,
      user,
      membership,
    };
  }

  async signup({ name, email, password }: { name: string; email: string; password: string }): Promise<AuthResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    if (!trimmedName || !normalizedEmail || password.length < 8) {
      return {
        success: false,
        error: 'Please provide valid account details matching password requirements.',
      };
    }

    const userId = `usr_${Math.random().toString(36).substring(2, 9)}`;
    const user: AuthenticatedUser = {
      id: userId,
      name: trimmedName,
      email: normalizedEmail,
    };

    // Signup produces account identity ONLY.
    // Workspace membership is empty until onboarding (UX-13) or invitation acceptance.
    return {
      success: true,
      user,
    };
  }

  async requestPasswordReset(email: string): Promise<PasswordResetRequestResult> {
    // Section 11: Honestly prototype request acceptance without pretending an email was dispatched
    const normalizedEmail = email.trim().toLowerCase();
    return {
      success: true,
      message: `Reset request accepted for ${normalizedEmail}. Reset instructions will be delivered when identity infrastructure is connected.`,
    };
  }

  async resetPassword({ token, newPassword }: { token: string; newPassword: string }): Promise<ResetPasswordResult> {
    const cleanToken = token.trim();

    if (!cleanToken || cleanToken === 'rst_invalid' || cleanToken === 'reset-invalid') {
      return {
        success: false,
        error: 'INVALID',
      };
    }

    if (cleanToken === 'rst_expired' || cleanToken === 'reset-expired') {
      return {
        success: false,
        error: 'EXPIRED',
      };
    }

    if (newPassword.length < 8) {
      return {
        success: false,
        error: 'WEAK_PASSWORD',
      };
    }

    return {
      success: true,
    };
  }

  validateInvitationSync(token: string): InvitationDetails {
    const cleanToken = token.trim();

    if (DETERMINISTIC_INVITATIONS[cleanToken]) {
      return DETERMINISTIC_INVITATIONS[cleanToken];
    }

    return {
      token: cleanToken,
      status: 'INVALID',
    };
  }

  async validateInvitation(token: string): Promise<InvitationDetails> {
    return this.validateInvitationSync(token);
  }

  async acceptInvitation(token: string, userId: string): Promise<InvitationAcceptResult> {
    const invitation = await this.validateInvitation(token);

    if (invitation.status !== 'VALID') {
      return {
        success: false,
        error: `Invitation cannot be accepted in state: ${invitation.status}`,
      };
    }

    return {
      success: true,
      workspaceId: invitation.workspaceId || 'ws_acme',
      workspaceName: invitation.workspaceName || 'Acme Core Platform',
    };
  }
}

export const defaultMockAuthAdapter = new MockAuthAdapter();
