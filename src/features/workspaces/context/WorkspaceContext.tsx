/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-13 Workspace State Boundary & Lifecycle Provider
 * Section 6, 7, 8, 14, 23, 24: Dedicated context managing active workspace and memberships.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Workspace,
  WorkspaceMembership,
  WorkspaceLifecycleState,
  WorkspaceAdapter,
  CreateWorkspaceInput,
  MembershipStatus,
} from '../types';
import { defaultWorkspaceAdapter } from '../adapters/mockWorkspaceAdapter';
import { resolveActiveWorkspace } from '../domain/workspaceSelection';
import { useAuth } from '../../auth/context/AuthContext';

export interface WorkspaceContextType {
  workspaces: Workspace[];
  memberships: WorkspaceMembership[];
  activeWorkspaceId: string | null;
  activeWorkspace: Workspace | null;
  activeMembership: WorkspaceMembership | null;
  status: WorkspaceLifecycleState;
  switchWorkspace: (workspaceId: string) => Promise<boolean>;
  createWorkspace: (input: CreateWorkspaceInput) => Promise<Workspace>;
  archiveActiveWorkspace: () => Promise<void>;
  simulateMembershipStatus: (workspaceId: string, status: MembershipStatus) => Promise<void>;
  removeMembership: (membershipId: string) => Promise<boolean>;
  reloadWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export interface WorkspaceProviderProps {
  children: React.ReactNode;
  adapter?: WorkspaceAdapter;
  initialActiveWorkspaceId?: string | null;
  initialWorkspaces?: Workspace[];
  initialMemberships?: WorkspaceMembership[];
}

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({
  children,
  adapter = defaultWorkspaceAdapter,
  initialActiveWorkspaceId,
  initialWorkspaces,
  initialMemberships,
}) => {
  const { user, status: authStatus } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => initialWorkspaces ?? []);
  const [memberships, setMemberships] = useState<WorkspaceMembership[]>(() => initialMemberships ?? []);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(() => {
    if (initialActiveWorkspaceId !== undefined) return initialActiveWorkspaceId;
    if (initialMemberships && initialMemberships.length > 0) {
      return resolveActiveWorkspace(initialMemberships, null, initialWorkspaces ?? []).activeWorkspaceId;
    }
    return null;
  });
  const [lifecycleStatus, setLifecycleStatus] = useState<WorkspaceLifecycleState>(() => {
    if (initialMemberships !== undefined) {
      if (initialMemberships.length === 0) return 'empty';
      const resolved = resolveActiveWorkspace(initialMemberships, initialActiveWorkspaceId ?? null, initialWorkspaces ?? []);
      return resolved.activeWorkspaceId ? 'ready' : (resolved.resolutionSource === 'zero_memberships' ? 'empty' : 'unavailable');
    }
    return 'loading';
  });

  const currentUserId = user?.id;

  const loadWorkspaceState = useCallback(async () => {
    if (!currentUserId || authStatus !== 'authenticated') {
      setWorkspaces([]);
      setMemberships([]);
      setActiveWorkspaceId(null);
      setLifecycleStatus('empty');
      return;
    }

    try {
      const allWorkspaces = await adapter.getWorkspaces();
      const userMemberships = await adapter.getUserMemberships(currentUserId);

      setWorkspaces(allWorkspaces);
      setMemberships(userMemberships);

      // Inspect persisted workspace ID or use provided initial
      const persistedId =
        initialActiveWorkspaceId ?? (await adapter.getActiveWorkspaceId(currentUserId));

      const resolution = resolveActiveWorkspace(userMemberships, persistedId, allWorkspaces);

      if (resolution.activeWorkspaceId) {
        setActiveWorkspaceId(resolution.activeWorkspaceId);
        await adapter.setActiveWorkspaceId(currentUserId, resolution.activeWorkspaceId);
        setLifecycleStatus('ready');
      } else if (resolution.resolutionSource === 'zero_memberships') {
        setActiveWorkspaceId(null);
        setLifecycleStatus('empty');
      } else {
        setActiveWorkspaceId(null);
        setLifecycleStatus('unavailable');
      }
    } catch (err) {
      console.error('Failed to load workspace state:', err);
      setLifecycleStatus('error');
    }
  }, [currentUserId, authStatus, adapter, initialActiveWorkspaceId]);

  useEffect(() => {
    loadWorkspaceState();
  }, [loadWorkspaceState]);

  const activeWorkspace = useMemo(() => {
    if (!activeWorkspaceId) return null;
    return workspaces.find((w) => w.id === activeWorkspaceId) || null;
  }, [activeWorkspaceId, workspaces]);

  const activeMembership = useMemo(() => {
    if (!activeWorkspaceId) return null;
    return memberships.find((m) => m.workspaceId === activeWorkspaceId) || null;
  }, [activeWorkspaceId, memberships]);

  const switchWorkspace = useCallback(
    async (targetWorkspaceId: string): Promise<boolean> => {
      if (!currentUserId) return false;

      // Verify target membership exists and is active
      const targetMembership = memberships.find((m) => m.workspaceId === targetWorkspaceId);
      if (!targetMembership || targetMembership.status !== 'ACTIVE') {
        return false;
      }

      const targetWorkspace = workspaces.find((w) => w.id === targetWorkspaceId);
      if (!targetWorkspace || (targetWorkspace.status !== 'ACTIVE' && targetWorkspace.status !== 'ARCHIVED')) {
        return false;
      }

      setActiveWorkspaceId(targetWorkspaceId);
      await adapter.setActiveWorkspaceId(currentUserId, targetWorkspaceId);
      setLifecycleStatus('ready');
      return true;
    },
    [currentUserId, memberships, workspaces, adapter]
  );

  const createWorkspace = useCallback(
    async (input: CreateWorkspaceInput): Promise<Workspace> => {
      if (!currentUserId) {
        throw new Error('Cannot create workspace without authenticated user.');
      }

      const result = await adapter.createWorkspace(currentUserId, input);

      setWorkspaces((prev) => [...prev, result.workspace]);
      setMemberships((prev) => [...prev, result.membership]);
      setActiveWorkspaceId(result.workspace.id);
      setLifecycleStatus('ready');

      return result.workspace;
    },
    [currentUserId, adapter]
  );

  const archiveActiveWorkspace = useCallback(async () => {
    if (!activeWorkspaceId) return;
    const updated = await adapter.updateWorkspaceStatus(activeWorkspaceId, 'ARCHIVED');
    if (updated) {
      setWorkspaces((prev) =>
        prev.map((w) => (w.id === activeWorkspaceId ? { ...w, status: 'ARCHIVED' } : w))
      );
    }
  }, [activeWorkspaceId, adapter]);

  const simulateMembershipStatus = useCallback(
    async (workspaceId: string, status: MembershipStatus) => {
      const targetMem = memberships.find((m) => m.workspaceId === workspaceId);
      if (!targetMem) return;

      const updated = await adapter.updateMembershipStatus(targetMem.id, status);
      if (updated) {
        const nextMemberships = memberships.map((m) =>
          m.id === targetMem.id ? { ...m, status } : m
        );
        setMemberships(nextMemberships);

        // If the active membership was suspended or revoked, re-resolve active workspace
        if (workspaceId === activeWorkspaceId && status !== 'ACTIVE') {
          const resolution = resolveActiveWorkspace(nextMemberships, null, workspaces);
          if (resolution.activeWorkspaceId) {
            setActiveWorkspaceId(resolution.activeWorkspaceId);
            if (currentUserId) {
              await adapter.setActiveWorkspaceId(currentUserId, resolution.activeWorkspaceId);
            }
            setLifecycleStatus('ready');
          } else {
            setActiveWorkspaceId(null);
            if (currentUserId) {
              await adapter.setActiveWorkspaceId(currentUserId, '');
            }
            setLifecycleStatus(
              resolution.resolutionSource === 'zero_memberships' ? 'empty' : 'unavailable'
            );
          }
        }
      }
    },
    [memberships, activeWorkspaceId, workspaces, currentUserId, adapter]
  );

  const removeMembership = useCallback(
    async (membershipId: string): Promise<boolean> => {
      const targetMem = memberships.find((m) => m.id === membershipId);
      if (!targetMem) return false;

      const success = await adapter.removeMembership(membershipId);
      if (success) {
        const nextMemberships = memberships.filter((m) => m.id !== membershipId);
        setMemberships(nextMemberships);

        // If the active membership was removed, re-resolve active workspace
        if (targetMem.workspaceId === activeWorkspaceId) {
          const resolution = resolveActiveWorkspace(nextMemberships, null, workspaces);
          if (resolution.activeWorkspaceId) {
            setActiveWorkspaceId(resolution.activeWorkspaceId);
            if (currentUserId) {
              await adapter.setActiveWorkspaceId(currentUserId, resolution.activeWorkspaceId);
            }
            setLifecycleStatus('ready');
          } else {
            setActiveWorkspaceId(null);
            if (currentUserId) {
              await adapter.setActiveWorkspaceId(currentUserId, '');
            }
            setLifecycleStatus(
              resolution.resolutionSource === 'zero_memberships' ? 'empty' : 'unavailable'
            );
          }
        }
        return true;
      }
      return false;
    },
    [memberships, activeWorkspaceId, workspaces, currentUserId, adapter]
  );

  const value = useMemo(
    () => ({
      workspaces,
      memberships,
      activeWorkspaceId,
      activeWorkspace,
      activeMembership,
      status: lifecycleStatus,
      switchWorkspace,
      createWorkspace,
      archiveActiveWorkspace,
      simulateMembershipStatus,
      removeMembership,
      reloadWorkspaces: loadWorkspaceState,
    }),
    [
      workspaces,
      memberships,
      activeWorkspaceId,
      activeWorkspace,
      activeMembership,
      lifecycleStatus,
      switchWorkspace,
      createWorkspace,
      archiveActiveWorkspace,
      simulateMembershipStatus,
      removeMembership,
      loadWorkspaceState,
    ]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};

export const useWorkspace = (): WorkspaceContextType => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider.');
  }
  return context;
};
