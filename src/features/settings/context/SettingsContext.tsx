/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Team, User, UserRole } from '../../../types';
import { useProject } from '../../../context/ProjectContext';
import {
  CreateTeamInput,
  EditTeamInput,
  IntegrationProvider,
  InviteMemberInput,
  PendingInvitation,
  RepoIntegrationConfig,
  SettingsContextType,
  UserPreferences,
  WebhookConfig,
  WorkspaceSettings,
} from '../types';
import {
  assertAdminMutation,
  canAccessAdministrativeSettings,
  canChangeUserRole,
} from '../domain/permissions';
import {
  ArchiveTeamGuardResult,
  canArchiveTeam as canArchiveTeamDomain,
  planCreateTeam,
  validateTeamParameters,
} from '../domain/teamAdministration';
import { validateMemberInvitation } from '../domain/memberAdministration';
import {
  applyThemeToDocument,
  createDefaultUserPreferences,
  setupThemeSubscription,
} from '../domain/preferences';
import {
  getUserPreferencesStorageKey,
  INITIAL_PENDING_INVITATIONS,
  INITIAL_REPO_INTEGRATIONS,
  INITIAL_WEBHOOKS,
  INITIAL_WORKSPACE_SETTINGS,
  loadSettingsFromStorage,
  loadUserPreferences,
  saveSettingsToStorage,
  SETTINGS_STORAGE_KEYS,
} from '../data/mockSettingsData';
import { useWorkspace } from '../../workspaces/context/WorkspaceContext';

const SettingsContext = createContext<SettingsContextType | null>(null);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    currentUser,
    users,
    teams,
    projects,
    cycles,
    updateCanonicalTeams,
    updateCanonicalUsers,
  } = useProject();

  let activeWorkspace: any = null;
  try {
    const ws = useWorkspace();
    activeWorkspace = ws.activeWorkspace;
  } catch {
    // standalone unit test compatibility
  }

  const assertMutableWorkspace = useCallback(() => {
    if (activeWorkspace?.status === 'ARCHIVED') {
      throw new Error('Cannot mutate an archived workspace.');
    }
  }, [activeWorkspace?.status]);

  const isAdmin = canAccessAdministrativeSettings(currentUser.role);

  // ==========================================
  // Workspace State
  // ==========================================
  const [workspaceSettings, setWorkspaceSettings] = useState<WorkspaceSettings>(() =>
    loadSettingsFromStorage(SETTINGS_STORAGE_KEYS.WORKSPACE, INITIAL_WORKSPACE_SETTINGS)
  );

  const [isWorkspaceArchived, setIsWorkspaceArchived] = useState<boolean>(
    Boolean(workspaceSettings.archivedAt)
  );

  // ==========================================
  // Member & Invitations State
  // ==========================================
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>(() =>
    loadSettingsFromStorage(SETTINGS_STORAGE_KEYS.INVITATIONS, INITIAL_PENDING_INVITATIONS)
  );

  // ==========================================
  // Teams State (Archived)
  // ==========================================
  const [archivedTeams, setArchivedTeams] = useState<Team[]>(() =>
    loadSettingsFromStorage(SETTINGS_STORAGE_KEYS.ARCHIVED_TEAMS, [])
  );

  // ==========================================
  // Integrations State
  // ==========================================
  const [repoIntegrations, setRepoIntegrations] = useState<RepoIntegrationConfig[]>(() =>
    loadSettingsFromStorage(SETTINGS_STORAGE_KEYS.INTEGRATIONS, INITIAL_REPO_INTEGRATIONS)
  );

  const [webhooks, setWebhooks] = useState<WebhookConfig[]>(() =>
    loadSettingsFromStorage(SETTINGS_STORAGE_KEYS.WEBHOOKS, INITIAL_WEBHOOKS)
  );

  // ==========================================
  // User Preferences State (Per-user)
  // ==========================================
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const loaded = loadUserPreferences(currentUser.id);
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlTheme = urlParams.get('theme')?.toUpperCase();
      if (urlTheme === 'DARK' || urlTheme === 'LIGHT' || urlTheme === 'SYSTEM') {
        return { ...loaded, theme: urlTheme as any };
      }
    }
    return loaded;
  });

  // Keep preferences in sync when currentUser changes or URL search changes
  useEffect(() => {
    const loaded = loadUserPreferences(currentUser.id);
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlTheme = urlParams.get('theme')?.toUpperCase();
      if (urlTheme === 'DARK' || urlTheme === 'LIGHT' || urlTheme === 'SYSTEM') {
        setPreferences({ ...loaded, theme: urlTheme as any });
        return;
      }
    }
    setPreferences(loaded);
  }, [currentUser.id]);

  // Apply theme and maintain reactive OS preference listener for SYSTEM theme
  useEffect(() => {
    const cleanup = setupThemeSubscription(preferences.theme);
    return () => {
      cleanup();
    };
  }, [preferences.theme]);

  // Reset UX-08 prototype state handler
  const resetSettingsToDemoData = useCallback(() => {
    setWorkspaceSettings(INITIAL_WORKSPACE_SETTINGS);
    saveSettingsToStorage(SETTINGS_STORAGE_KEYS.WORKSPACE, INITIAL_WORKSPACE_SETTINGS);
    setIsWorkspaceArchived(false);

    setPendingInvitations(INITIAL_PENDING_INVITATIONS);
    saveSettingsToStorage(SETTINGS_STORAGE_KEYS.INVITATIONS, INITIAL_PENDING_INVITATIONS);

    setArchivedTeams([]);
    saveSettingsToStorage(SETTINGS_STORAGE_KEYS.ARCHIVED_TEAMS, []);

    setRepoIntegrations(INITIAL_REPO_INTEGRATIONS);
    saveSettingsToStorage(SETTINGS_STORAGE_KEYS.INTEGRATIONS, INITIAL_REPO_INTEGRATIONS);

    setWebhooks(INITIAL_WEBHOOKS);
    saveSettingsToStorage(SETTINGS_STORAGE_KEYS.WEBHOOKS, INITIAL_WEBHOOKS);

    const defaultPrefs = createDefaultUserPreferences(currentUser.id);
    setPreferences(defaultPrefs);
    saveSettingsToStorage(getUserPreferencesStorageKey(currentUser.id), defaultPrefs);
    applyThemeToDocument(defaultPrefs.theme);
  }, [currentUser.id]);

  useEffect(() => {
    const handleReset = () => {
      resetSettingsToDemoData();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('unblok:demo-reset', handleReset);
      return () => window.removeEventListener('unblok:demo-reset', handleReset);
    }
  }, [resetSettingsToDemoData]);

  // ==========================================
  // Workspace Actions
  // ==========================================
  const updateWorkspaceSettings = useCallback(
    (updates: Partial<WorkspaceSettings>) => {
      assertMutableWorkspace();
      assertAdminMutation(currentUser.role);
      setWorkspaceSettings(prev => {
        const next: WorkspaceSettings = {
          ...prev,
          ...updates,
          defaultIssuePriority:
            updates.workflowRules?.defaultPriority ||
            updates.defaultIssuePriority ||
            prev.defaultIssuePriority,
          defaultInitialState:
            updates.workflowRules?.defaultInitialState ||
            updates.defaultInitialState ||
            prev.defaultInitialState,
          workflowRules: updates.workflowRules || prev.workflowRules || {
            defaultPriority: prev.defaultIssuePriority || 'MEDIUM',
            defaultInitialState: prev.defaultInitialState || 'TODO',
            autoAssignCycleOnPlanning: true,
          },
        };
        saveSettingsToStorage(SETTINGS_STORAGE_KEYS.WORKSPACE, next);
        return next;
      });
    },
    [currentUser.role]
  );

  const archiveWorkspace = useCallback(() => {
    assertAdminMutation(currentUser.role);
    const now = new Date().toISOString();
    setWorkspaceSettings(prev => {
      const next = { ...prev, archivedAt: now };
      saveSettingsToStorage(SETTINGS_STORAGE_KEYS.WORKSPACE, next);
      return next;
    });
    setIsWorkspaceArchived(true);
  }, [currentUser.role]);

  const deleteWorkspace = useCallback(() => {
    assertAdminMutation(currentUser.role);
    // Destructive simulation: mark archived and record prototype state
    archiveWorkspace();
  }, [currentUser.role, archiveWorkspace]);

  // ==========================================
  // Member & Role Actions
  // ==========================================
  const canDemoteUser = useCallback(
    (userId: string): boolean => {
      return canChangeUserRole(currentUser.role, userId, 'MEMBER', users).allowed;
    },
    [currentUser.role, users]
  );

  const updateMemberRole = useCallback(
    (userId: string, newRole: UserRole): { success: boolean; error?: string } => {
      assertMutableWorkspace();
      assertAdminMutation(currentUser.role);

      const check = canChangeUserRole(currentUser.role, userId, newRole, users);
      if (!check.allowed) {
        throw new Error(check.reason || 'Cannot change member role');
      }

      const updatedUsers = users.map(u => (u.id === userId ? { ...u, role: newRole } : u));
      updateCanonicalUsers(updatedUsers);
      return { success: true };
    },
    [currentUser.role, users, updateCanonicalUsers, assertMutableWorkspace]
  );

  const inviteMember = useCallback(
    (input: InviteMemberInput): { success: boolean; error?: string } => {
      assertMutableWorkspace();
      assertAdminMutation(currentUser.role);

      const validation = validateMemberInvitation(
        input,
        users,
        pendingInvitations,
        teams
      );
      if (!validation.valid) {
        const firstError =
          validation.error ||
          validation.errors.email ||
          validation.errors.role ||
          (validation.errors.teamIds && 'One or more selected teams are invalid.');
        throw new Error(firstError || 'Invalid invitation parameters');
      }

      const newInvitation: PendingInvitation = {
        id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        email: input.email.trim().toLowerCase(),
        role: input.role,
        teamIds: input.teamIds || [],
        invitedAt: new Date().toISOString().split('T')[0],
        status: 'PENDING',
      };

      const next = [newInvitation, ...pendingInvitations];
      setPendingInvitations(next);
      saveSettingsToStorage(SETTINGS_STORAGE_KEYS.INVITATIONS, next);
      return { success: true };
    },
    [currentUser.role, users, pendingInvitations, teams, assertMutableWorkspace]
  );

  const resendInvitation = useCallback(
    (invitationId: string): { success: boolean; error?: string } => {
      assertMutableWorkspace();
      assertAdminMutation(currentUser.role);
      const next = pendingInvitations.map(inv =>
        inv.id === invitationId
          ? { ...inv, resentAt: new Date().toISOString().split('T')[0] }
          : inv
      );
      setPendingInvitations(next);
      saveSettingsToStorage(SETTINGS_STORAGE_KEYS.INVITATIONS, next);
      return { success: true };
    },
    [currentUser.role, pendingInvitations, assertMutableWorkspace]
  );

  const revokeInvitation = useCallback(
    (invitationId: string): { success: boolean; error?: string } => {
      assertMutableWorkspace();
      assertAdminMutation(currentUser.role);
      const next = pendingInvitations.map(inv =>
        inv.id === invitationId ? { ...inv, status: 'REVOKED' as const } : inv
      );
      setPendingInvitations(next);
      saveSettingsToStorage(SETTINGS_STORAGE_KEYS.INVITATIONS, next);
      return { success: true };
    },
    [currentUser.role, pendingInvitations, assertMutableWorkspace]
  );

  // ==========================================
  // Team Actions
  // ==========================================
  const canArchiveTeam = useCallback(
    (teamId: string): ArchiveTeamGuardResult => {
      const team = teams.find(t => t.id === teamId);
      return canArchiveTeamDomain(teamId, team?.name || 'this team', projects, cycles);
    },
    [teams, projects, cycles]
  );

  const createTeam = useCallback(
    (input: CreateTeamInput): { success: boolean; error?: string; id: string } => {
      assertMutableWorkspace();
      // Atomic pre-validation & planning: all role, team, and member validations run
      // BEFORE any state or storage mutations occur.
      const plan = planCreateTeam(input, teams, users, currentUser.role);

      // Commit canonical states only after all invariants pass
      updateCanonicalTeams(plan.updatedTeams);
      if (input.memberIds && input.memberIds.length > 0) {
        updateCanonicalUsers(plan.updatedUsers);
      }

      return { success: true, ...plan.newTeam };
    },
    [currentUser.role, teams, users, updateCanonicalTeams, updateCanonicalUsers, assertMutableWorkspace]
  );

  const updateTeam = useCallback(
    (id: string, input: EditTeamInput): { success: boolean; error?: string } => {
      assertMutableWorkspace();
      assertAdminMutation(currentUser.role);

      const targetTeam = teams.find(t => t.id === id);
      if (!targetTeam) {
        throw new Error('Team not found');
      }

      const validation = validateTeamParameters(input, teams, id);
      if (!validation.valid) {
        throw new Error(validation.error || validation.errors.name || validation.errors.key || 'Invalid team parameters');
      }

      // If memberIds are provided, validate users and unique IDs
      if (input.memberIds) {
        const uniqueMemberIds = new Set(input.memberIds);
        if (uniqueMemberIds.size !== input.memberIds.length) {
          throw new Error('Duplicate member IDs provided');
        }
        for (const uid of input.memberIds) {
          if (!users.some(u => u.id === uid)) {
            throw new Error(`User with ID ${uid} not found`);
          }
        }
      }

      const next = teams.map(t => {
        if (t.id === id) {
          const updated: Team = {
            ...t,
            name: input.name.trim(),
            key: input.key.trim().toUpperCase(),
            color: input.color || t.color,
            description: input.description !== undefined ? input.description.trim() : t.description,
          };
          if (input.leadId !== undefined) {
            (updated as any).leadId = input.leadId;
          }
          return updated;
        }
        return t;
      });
      updateCanonicalTeams(next);

      // If memberIds are provided, update canonical users' team memberships preserving all unrelated memberships
      if (input.memberIds) {
        const selectedSet = new Set(input.memberIds);
        const updatedUsers = users.map(u => {
          const currentMemberships = new Set(u.teamIds || (u.teamId ? [u.teamId] : []));
          if (selectedSet.has(u.id)) {
            currentMemberships.add(id);
          } else {
            currentMemberships.delete(id);
          }
          const nextTeamIds = Array.from(currentMemberships);
          return {
            ...u,
            teamIds: nextTeamIds,
            teamId: nextTeamIds[0] || '',
          };
        });
        updateCanonicalUsers(updatedUsers);
      }

      return { success: true };
    },
    [currentUser.role, teams, users, updateCanonicalTeams, updateCanonicalUsers, assertMutableWorkspace]
  );

  const archiveTeam = useCallback(
    (id: string): { success: boolean; error?: string } => {
      assertMutableWorkspace();
      assertAdminMutation(currentUser.role);

      const teamToArchive = teams.find(t => t.id === id);
      if (!teamToArchive) {
        throw new Error('Team not found.');
      }

      const guard = canArchiveTeamDomain(id, teamToArchive.name, projects, cycles);
      if (!guard.allowed) {
        throw new Error(guard.reason || 'Cannot archive team with active dependencies.');
      }

      const archivedTeam: Team = {
        ...teamToArchive,
      };
      (archivedTeam as any).archivedAt = new Date().toISOString();

      const nextActive = teams.filter(t => t.id !== id);
      const nextArchived = [archivedTeam, ...archivedTeams];

      updateCanonicalTeams(nextActive);
      setArchivedTeams(nextArchived);
      saveSettingsToStorage(SETTINGS_STORAGE_KEYS.ARCHIVED_TEAMS, nextArchived);

      return { success: true };
    },
    [currentUser.role, teams, projects, cycles, archivedTeams, updateCanonicalTeams, assertMutableWorkspace]
  );

  const restoreTeam = useCallback(
    (id: string): { success: boolean; error?: string } => {
      assertMutableWorkspace();
      assertAdminMutation(currentUser.role);

      const teamToRestore = archivedTeams.find(t => t.id === id);
      if (!teamToRestore) {
        throw new Error('Archived team not found.');
      }

      const restored: Team = {
        ...teamToRestore,
      };
      delete (restored as any).archivedAt;

      const nextArchived = archivedTeams.filter(t => t.id !== id);
      const nextActive = [...teams, restored];

      updateCanonicalTeams(nextActive);
      setArchivedTeams(nextArchived);
      saveSettingsToStorage(SETTINGS_STORAGE_KEYS.ARCHIVED_TEAMS, nextArchived);

      return { success: true };
    },
    [currentUser.role, archivedTeams, teams, updateCanonicalTeams, assertMutableWorkspace]
  );

  // ==========================================
  // Integrations Actions
  // ==========================================
  const connectRepo = useCallback(
    (provider: IntegrationProvider, repoName: string) => {
      assertMutableWorkspace();
      assertAdminMutation(currentUser.role);
      const next = repoIntegrations.map(r =>
        r.provider === provider
          ? {
              ...r,
              repositoryName: repoName,
              repository: repoName,
              status: 'CONNECTED' as const,
              lastSyncText: 'Just now',
              lastSync: 'Just now',
            }
          : r
      );
      setRepoIntegrations(next);
      saveSettingsToStorage(SETTINGS_STORAGE_KEYS.INTEGRATIONS, next);
    },
    [currentUser.role, repoIntegrations, assertMutableWorkspace]
  );

  const disconnectRepo = useCallback(
    (provider: IntegrationProvider) => {
      assertMutableWorkspace();
      assertAdminMutation(currentUser.role);
      const next = repoIntegrations.map(r =>
        r.provider === provider
          ? {
              ...r,
              repositoryName: '',
              repository: undefined,
              status: 'NOT_CONNECTED' as const,
              lastSyncText: undefined,
              lastSync: undefined,
            }
          : r
      );
      setRepoIntegrations(next);
      saveSettingsToStorage(SETTINGS_STORAGE_KEYS.INTEGRATIONS, next);
    },
    [currentUser.role, repoIntegrations, assertMutableWorkspace]
  );

  const updateRepoIntegration = useCallback(
    (provider: IntegrationProvider, updates: Partial<RepoIntegrationConfig>) => {
      assertMutableWorkspace();
      assertAdminMutation(currentUser.role);
      setRepoIntegrations(prev => {
        const next = prev.map(r => {
          if (r.provider === provider) {
            const repo = updates.repository !== undefined ? updates.repository : (updates.repositoryName !== undefined ? updates.repositoryName : r.repositoryName);
            const sync = updates.lastSync !== undefined ? updates.lastSync : (updates.lastSyncText !== undefined ? updates.lastSyncText : r.lastSyncText);
            return {
              ...r,
              ...updates,
              repositoryName: repo,
              repository: repo,
              lastSyncText: sync,
              lastSync: sync,
              commitLinkingEnabled: updates.commitLinkingEnabled ?? updates.recognizeKeysInCommits ?? r.commitLinkingEnabled,
            };
          }
          return r;
        });
        saveSettingsToStorage(SETTINGS_STORAGE_KEYS.INTEGRATIONS, next);
        return next;
      });
    },
    [currentUser.role, assertMutableWorkspace]
  );

  const createWebhook = useCallback(
    (name: string, endpointUrl: string, events: string[]): { success: boolean; error?: string } => {
      assertMutableWorkspace();
      assertAdminMutation(currentUser.role);

      if (!name.trim()) throw new Error('Webhook name is required.');
      if (!endpointUrl.trim().startsWith('http')) {
        throw new Error('Endpoint URL must begin with http:// or https://');
      }

      const newWebhook: WebhookConfig = {
        id: `wh_${Date.now()}`,
        name: name.trim(),
        endpointUrl: endpointUrl.trim(),
        url: endpointUrl.trim(),
        events: events.length > 0 ? events : ['STATE_CHANGED'],
        enabled: true,
        mockSecret: `whsec_demo_${Math.random().toString(36).substring(2, 12)}`,
        secret: `whsec_demo_${Math.random().toString(36).substring(2, 12)}`,
        createdAt: new Date().toISOString(),
      };

      const next = [newWebhook, ...webhooks];
      setWebhooks(next);
      saveSettingsToStorage(SETTINGS_STORAGE_KEYS.WEBHOOKS, next);
      return { success: true };
    },
    [currentUser.role, webhooks, assertMutableWorkspace]
  );

  const addWebhook = useCallback(
    (input: { name: string; url: string; events: string[]; enabled?: boolean }) => {
      return createWebhook(input.name, input.url, input.events);
    },
    [createWebhook]
  );

  const toggleWebhook = useCallback(
    (id: string, enabled?: boolean) => {
      assertMutableWorkspace();
      assertAdminMutation(currentUser.role);
      setWebhooks(prev => {
        const next = prev.map(w =>
          w.id === id ? { ...w, enabled: enabled !== undefined ? enabled : !w.enabled } : w
        );
        saveSettingsToStorage(SETTINGS_STORAGE_KEYS.WEBHOOKS, next);
        return next;
      });
    },
    [currentUser.role, assertMutableWorkspace]
  );

  const deleteWebhook = useCallback(
    (id: string) => {
      assertMutableWorkspace();
      assertAdminMutation(currentUser.role);
      setWebhooks(prev => {
        const next = prev.filter(w => w.id !== id);
        saveSettingsToStorage(SETTINGS_STORAGE_KEYS.WEBHOOKS, next);
        return next;
      });
    },
    [currentUser.role, assertMutableWorkspace]
  );

  // ==========================================
  // User Preferences Actions
  // ==========================================
  const updatePreferences = useCallback(
    (updates: Partial<UserPreferences>) => {
      setPreferences(prev => {
        const next = { ...prev, ...updates };
        saveSettingsToStorage(getUserPreferencesStorageKey(currentUser.id), next);
        return next;
      });
    },
    [currentUser.id]
  );

  // Prepared effective structures with aliases
  const effectiveWorkspace: WorkspaceSettings = useMemo(() => {
    return {
      ...workspaceSettings,
      workflowRules: workspaceSettings.workflowRules || {
        defaultPriority: workspaceSettings.defaultIssuePriority || 'MEDIUM',
        defaultInitialState: workspaceSettings.defaultInitialState || 'TODO',
        autoAssignCycleOnPlanning: true,
      },
    };
  }, [workspaceSettings]);

  const effectiveRepoIntegrations: RepoIntegrationConfig[] = useMemo(() => {
    return repoIntegrations.map(r => ({
      ...r,
      id: r.provider.toLowerCase(),
      name: r.provider === 'GITHUB' ? 'GitHub' : 'GitLab',
      repository: r.repositoryName,
      lastSync: r.lastSyncText,
    }));
  }, [repoIntegrations]);

  const effectiveWebhooks: WebhookConfig[] = useMemo(() => {
    return webhooks.map(w => ({
      ...w,
      url: w.endpointUrl,
      secret: w.mockSecret,
    }));
  }, [webhooks]);

  return (
    <SettingsContext.Provider
      value={{
        currentUser,
        isAdmin,
        workspaceSettings: effectiveWorkspace,
        workspace: effectiveWorkspace,
        updateWorkspaceSettings,
        updateWorkspace: updateWorkspaceSettings,
        archiveWorkspace,
        deleteWorkspace,
        isWorkspaceArchived,
        members: users,
        updateMemberRole,
        updateUserRole: updateMemberRole,
        canDemoteUser,
        pendingInvitations,
        invitations: pendingInvitations,
        inviteMember,
        resendInvitation,
        revokeInvitation,
        teams,
        archivedTeams,
        canArchiveTeam,
        createTeam,
        updateTeam,
        archiveTeam,
        restoreTeam,
        repoIntegrations: effectiveRepoIntegrations,
        connectRepo,
        disconnectRepo,
        updateRepoIntegration,
        webhooks: effectiveWebhooks,
        createWebhook,
        addWebhook,
        toggleWebhook,
        deleteWebhook,
        preferences,
        updatePreferences,
        resetSettingsToDemoData,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
