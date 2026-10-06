/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IssuePriority, IssueState, Team, User, UserRole } from '../../types';
import { ArchiveTeamGuardResult } from './domain/teamAdministration';

// ==========================================
// Workspace Settings
// ==========================================

export interface WorkspaceSettings {
  id: string; // Read-only identifier e.g. "ws_acme_eng"
  name: string; // e.g. "Acme Platform Engineering"
  key: string; // e.g. "ACME"
  description: string;
  defaultIssuePriority: IssuePriority;
  defaultInitialState: IssueState;
  archivedAt?: string;
  workflowRules?: {
    defaultPriority: IssuePriority;
    defaultInitialState: IssueState;
    autoAssignCycleOnPlanning: boolean;
  };
}

// ==========================================
// Member Administration & Invitations
// ==========================================

export interface PendingInvitation {
  id: string;
  email: string;
  role: UserRole;
  teamIds: string[];
  invitedAt: string;
  resentAt?: string;
  status: 'PENDING' | 'REVOKED';
}

export interface InviteMemberInput {
  email: string;
  role: UserRole;
  teamIds: string[];
}

// ==========================================
// Team Administration
// ==========================================

export interface CreateTeamInput {
  name: string;
  key: string;
  color?: string;
  description?: string;
  leadId?: string;
  memberIds?: string[];
}

export interface EditTeamInput {
  name: string;
  key: string;
  color?: string;
  description?: string;
  leadId?: string;
  memberIds?: string[];
}

// ==========================================
// Integrations (Prototype / Mock)
// ==========================================

export type IntegrationProvider = 'GITHUB' | 'GITLAB';

export type IntegrationStatus = 'NOT_CONNECTED' | 'CONNECTED' | 'ERROR';

export interface RepoIntegrationConfig {
  id?: string;
  name?: string;
  provider: IntegrationProvider;
  repositoryName: string;
  repository?: string; // Convenience alias
  status: IntegrationStatus;
  lastSyncText?: string;
  lastSync?: string; // Convenience alias
  commitLinkingEnabled: boolean;
  recognizeKeysInCommits?: boolean; // Convenience alias
  branchPattern?: string;
  issueKeyPattern: string;
}

export interface WebhookConfig {
  id: string;
  name: string;
  endpointUrl: string;
  url?: string; // Convenience alias
  events: string[];
  enabled: boolean;
  mockSecret: string;
  secret?: string; // Convenience alias
  createdAt: string;
}

// ==========================================
// User Preferences
// ==========================================

export type ThemePreference = 'LIGHT' | 'DARK' | 'SYSTEM';

export type DensityPreference = 'COMPACT' | 'COMFORTABLE';

export interface UserNotificationPreferences {
  mentions: boolean;
  assignments: boolean;
  blockerChanges: boolean;
  cycleUpdates: boolean;
}

export interface UserPreferences {
  userId: string;
  theme: ThemePreference;
  density: DensityPreference;
  notifications: UserNotificationPreferences;
}

// ==========================================
// Settings Context Interface
// ==========================================

export interface SettingsContextType {
  // Authorization
  currentUser: User;
  isAdmin: boolean;

  // Workspace
  workspaceSettings: WorkspaceSettings;
  workspace: WorkspaceSettings; // Alias
  updateWorkspaceSettings: (updates: Partial<WorkspaceSettings>) => void;
  updateWorkspace: (updates: Partial<WorkspaceSettings>) => void; // Alias
  archiveWorkspace: () => void;
  deleteWorkspace: () => void;
  isWorkspaceArchived: boolean;

  // Members
  members: User[];
  updateMemberRole: (userId: string, newRole: UserRole) => { success: boolean; error?: string };
  updateUserRole: (userId: string, newRole: UserRole) => { success: boolean; error?: string }; // Alias
  canDemoteUser: (userId: string) => boolean;
  pendingInvitations: PendingInvitation[];
  invitations: PendingInvitation[]; // Alias
  inviteMember: (input: InviteMemberInput) => { success: boolean; error?: string };
  resendInvitation: (invitationId: string) => { success: boolean; error?: string };
  revokeInvitation: (invitationId: string) => { success: boolean; error?: string };

  // Teams
  teams: Team[];
  archivedTeams: Team[];
  canArchiveTeam: (teamId: string) => ArchiveTeamGuardResult;
  createTeam: (input: CreateTeamInput) => { success: boolean; error?: string };
  updateTeam: (id: string, input: EditTeamInput) => { success: boolean; error?: string };
  archiveTeam: (id: string) => { success: boolean; error?: string };
  restoreTeam: (id: string) => { success: boolean; error?: string };

  // Integrations (Prototype)
  repoIntegrations: RepoIntegrationConfig[];
  connectRepo: (provider: IntegrationProvider, repoName: string) => void;
  disconnectRepo: (provider: IntegrationProvider) => void;
  updateRepoIntegration: (provider: IntegrationProvider, updates: Partial<RepoIntegrationConfig>) => void;
  webhooks: WebhookConfig[];
  createWebhook: (name: string, endpointUrl: string, events: string[]) => { success: boolean; error?: string };
  addWebhook: (input: { name: string; url: string; events: string[]; enabled?: boolean }) => { success: boolean; error?: string }; // Alias
  toggleWebhook: (id: string, enabled?: boolean) => void;
  deleteWebhook: (id: string) => void;

  // Preferences
  preferences: UserPreferences;
  updatePreferences: (updates: Partial<UserPreferences>) => void;

  // Reset
  resetSettingsToDemoData: () => void;
}
