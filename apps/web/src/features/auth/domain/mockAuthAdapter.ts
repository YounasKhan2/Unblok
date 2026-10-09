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
  'alex.rivera@nexus.example': {
    user: {
      id: 'usr_alex',
      name: 'Alex Rivera',
      email: 'alex.rivera@nexus.example',
    },
    membership: {
      workspaceId: 'ws_nexus',
      workspaceName: 'NEXUS Commerce',
      userId: 'usr_alex',
      role: 'MEMBER',
      membershipStatus: 'ACTIVE',
      teamIds: ['team_eng'],
    },
  },
  'sarah.chen@nexus.example': {
    user: {
      id: 'usr_sarah',
      name: 'Sarah Chen',
      email: 'sarah.chen@nexus.example',
    },
    membership: {
      workspaceId: 'ws_nexus',
      workspaceName: 'NEXUS Commerce',
      userId: 'usr_sarah',
      role: 'ADMIN',
      membershipStatus: 'ACTIVE',
      teamIds: ['team_eng', 'team_web'],
    },
  },
  'marcus.vance@nexus.example': {
    user: {
      id: 'usr_marcus',
      name: 'Marcus Vance',
      email: 'marcus.vance@nexus.example',
    },
    membership: {
      workspaceId: 'ws_nexus',
      workspaceName: 'NEXUS Commerce',
      userId: 'usr_marcus',
      role: 'MEMBER',
      membershipStatus: 'ACTIVE',
      teamIds: ['team_web'],
    },
  },
  'elena.rostova@nexus.example': {
    user: {
      id: 'usr_elena',
      name: 'Elena Rostova',
      email: 'elena.rostova@nexus.example',
    },
    membership: {
      workspaceId: 'ws_nexus',
      workspaceName: 'NEXUS Commerce',
      userId: 'usr_elena',
      role: 'MEMBER',
      membershipStatus: 'ACTIVE',
      teamIds: ['team_inf', 'team_eng'],
    },
  },
};

const legacyPrototypeEmailAliases: Record<string, string> = {
  'alex@unblok.dev': 'alex.rivera@nexus.example',
  'sarah@unblok.dev': 'sarah.chen@nexus.example',
  'marcus@unblok.dev': 'marcus.vance@nexus.example',
  'elena@unblok.dev': 'elena.rostova@nexus.example',
};

export const DETERMINISTIC_INVITATIONS: Record<string, InvitationDetails> = {
  'inv_existing_user': {
    token: 'inv_existing_user',
    status: 'VALID',
    workspaceName: 'NEXUS Commerce',
    workspaceId: 'ws_nexus',
    invitedEmail: 'alex.rivera@nexus.example',
    intendedRole: 'MEMBER',
    teamName: 'Commerce Platform',
    inviterName: 'Sarah Chen',
    isExistingUser: true,
  },
  'invite-existing-member': {
    token: 'invite-existing-member',
    status: 'VALID',
    workspaceName: 'NEXUS Commerce',
    workspaceId: 'ws_nexus',
    invitedEmail: 'alex.rivera@nexus.example',
    intendedRole: 'MEMBER',
    teamName: 'Commerce Platform',
    inviterName: 'Sarah Chen',
    isExistingUser: true,
  },
  'inv_new_user': {
    token: 'inv_new_user',
    status: 'VALID',
    workspaceName: 'NEXUS Commerce',
    workspaceId: 'ws_nexus',
    invitedEmail: 'jordan.taylor@nexus.example',
    intendedRole: 'MEMBER',
    teamName: 'Commerce Services',
    inviterName: 'Marcus Vance',
    isExistingUser: false,
  },
  'invite-new-member': {
    token: 'invite-new-member',
    status: 'VALID',
    workspaceName: 'NEXUS Commerce',
    workspaceId: 'ws_nexus',
    invitedEmail: 'jordan.taylor@nexus.example',
    intendedRole: 'MEMBER',
    teamName: 'Commerce Services',
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
    workspaceName: 'NEXUS Commerce',
  },
  'invite-accepted': {
    token: 'invite-accepted',
    status: 'ACCEPTED',
    workspaceName: 'NEXUS Commerce',
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
    const prototypeEmail = legacyPrototypeEmailAliases[normalizedEmail] ?? normalizedEmail;
    if (SEED_PROTOTYPE_USERS[prototypeEmail]) {
      const { user, membership } = SEED_PROTOTYPE_USERS[prototypeEmail];
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
      workspaceId: 'ws_nexus',
      workspaceName: 'NEXUS Commerce',
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
      workspaceId: invitation.workspaceId || 'ws_nexus',
      workspaceName: invitation.workspaceName || 'NEXUS Commerce',
    };
  }
}

export const defaultMockAuthAdapter = new MockAuthAdapter();
