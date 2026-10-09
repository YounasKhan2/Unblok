/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-12 Authentication & Account Lifecycle Domain Types
 * Core contracts for authentication, identity vs workspace membership, and invitations.
 */

export type AuthStatus = 'guest' | 'authenticated' | 'sessionExpired';

/**
 * Global User Identity
 * Section 15 & 20: Identity contains only user attributes.
 * Workspace role belongs to WorkspaceMembership, NOT global User.
 */
export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export type WorkspaceRole = 'ADMIN' | 'MEMBER' | 'OBSERVER';
export type MembershipStatus = 'ACTIVE' | 'INVITED' | 'SUSPENDED';

/**
 * Workspace Membership Contract
 * Decoupled from global User identity to allow multi-workspace roles in UX-13+.
 */
export interface WorkspaceMembership {
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  membershipStatus: MembershipStatus;
  workspaceName?: string;
  teamIds?: string[];
}

export type InvitationStatus = 'VALID' | 'EXPIRED' | 'REVOKED' | 'ACCEPTED' | 'INVALID';

export interface InvitationDetails {
  token: string;
  status: InvitationStatus;
  workspaceName?: string;
  workspaceId?: string;
  invitedEmail?: string;
  intendedRole?: WorkspaceRole;
  teamName?: string;
  inviterName?: string;
  isExistingUser?: boolean;
}

export interface PasswordValidationRules {
  isValid: boolean;
  hasMinLength: boolean;
  hasLetter: boolean;
  hasNumberOrSpecial: boolean;
}

export interface AuthResult {
  success: boolean;
  user?: AuthenticatedUser;
  membership?: WorkspaceMembership;
  error?: string;
}

export interface PasswordResetRequestResult {
  success: boolean;
  message: string;
}

export interface ResetPasswordResult {
  success: boolean;
  error?: 'EXPIRED' | 'INVALID' | 'MISMATCH' | 'WEAK_PASSWORD' | string;
}

export interface InvitationAcceptResult {
  success: boolean;
  workspaceId?: string;
  workspaceName?: string;
  error?: string;
}

/**
 * Auth Prototype Contract
 * Pluggable boundary: UI components consume this interface.
 * Can be swapped with production Auth API Client in future without altering page components.
 */
export interface AuthAdapter {
  login(credentials: { email: string; password: string }): Promise<AuthResult>;
  signup(data: { name: string; email: string; password: string }): Promise<AuthResult>;
  requestPasswordReset(email: string): Promise<PasswordResetRequestResult>;
  resetPassword(data: { token: string; newPassword: string }): Promise<ResetPasswordResult>;
  validateInvitation(token: string): Promise<InvitationDetails>;
  acceptInvitation(token: string, userId: string): Promise<InvitationAcceptResult>;
}
