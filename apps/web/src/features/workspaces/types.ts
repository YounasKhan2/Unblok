/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-13 Workspace Lifecycle & Multi-Workspace Architecture
 * Section 3, 4, 5: Canonical Workspace, Membership, and Adapter Contracts.
 */

export type WorkspaceRole = 'ADMIN' | 'MEMBER' | 'OBSERVER';
export type MembershipStatus = 'ACTIVE' | 'INVITED' | 'SUSPENDED';
export type WorkspaceStatus = 'ACTIVE' | 'ARCHIVED';

export type WorkspaceLifecycleState =
  | 'loading'
  | 'ready'
  | 'empty'
  | 'unavailable'
  | 'error';

export type OnboardingProgress =
  | 'ACCOUNT_CREATED'
  | 'WORKSPACE_CREATED'
  | 'TEAM_CREATED'
  | 'PROJECT_CREATED'
  | 'COMPLETE';

/**
 * Canonical Workspace Entity (Section 5)
 */
export interface Workspace {
  id: string;
  name: string;
  slug: string;
  avatar?: string;
  createdAt: string;
  status: WorkspaceStatus;
}

/**
 * Canonical Workspace Membership (Section 4)
 * Decoupled from global User identity: role is strictly membership-scoped.
 */
export interface WorkspaceMembership {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  status: MembershipStatus;
  joinedAt?: string;
  workspaceName?: string;
  teamIds?: string[];
}

/**
 * Input for creating a new prototype workspace (Section 17)
 */
export interface CreateWorkspaceInput {
  name: string;
  slug?: string;
}

/**
 * Workspace Adapter Contract (Section 3)
 * Decouples frontend features and UI from prototype/mock persistence.
 * Future backend API client will implement this exact contract.
 */
export interface WorkspaceAdapter {
  getWorkspaces(): Promise<Workspace[]>;
  getWorkspaceById(id: string): Promise<Workspace | null>;
  getUserMemberships(userId: string): Promise<WorkspaceMembership[]>;
  getActiveWorkspaceId(userId: string): Promise<string | null>;
  setActiveWorkspaceId(userId: string, workspaceId: string): Promise<void>;
  createWorkspace(userId: string, input: CreateWorkspaceInput): Promise<{
    workspace: Workspace;
    membership: WorkspaceMembership;
  }>;
  updateWorkspaceStatus(workspaceId: string, status: WorkspaceStatus): Promise<Workspace | null>;
  updateMembershipStatus(
    membershipId: string,
    status: MembershipStatus
  ): Promise<WorkspaceMembership | null>;
  removeMembership(membershipId: string): Promise<boolean>;
  acceptInvitation(
    workspaceId: string,
    userId: string,
    role?: WorkspaceRole
  ): Promise<WorkspaceMembership>;
}
