/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-13 Deterministic Mock Workspace Adapter
 * Section 3, 23, 28: Clean adapter implementation for prototype state and tests.
 */

import {
  Workspace,
  WorkspaceMembership,
  WorkspaceAdapter,
  CreateWorkspaceInput,
  WorkspaceStatus,
  MembershipStatus,
  WorkspaceRole,
} from '../types';
import { SEED_WORKSPACES, SEED_MEMBERSHIPS } from '../data/mockWorkspaces';
import { slugifyWorkspaceName } from '../domain/workspaceSelection';
import { assertNotLastAdminRemoval } from '../domain/workspaceLifecycle';

const STORAGE_WORKSPACES_KEY = 'unblok_workspaces_v1';
const STORAGE_MEMBERSHIPS_KEY = 'unblok_memberships_v1';
const STORAGE_ACTIVE_WORKSPACE_PREFIX = 'unblok_active_workspace_id_';

export class MockWorkspaceAdapter implements WorkspaceAdapter {
  private workspaces: Workspace[];
  private memberships: WorkspaceMembership[];
  private seedWorkspaces: Workspace[];
  private seedMemberships: WorkspaceMembership[];

  constructor(seeds: { workspaces: Workspace[]; memberships: WorkspaceMembership[] } = {
    workspaces: SEED_WORKSPACES,
    memberships: SEED_MEMBERSHIPS,
  }) {
    this.seedWorkspaces = seeds.workspaces.map(workspace => ({ ...workspace }));
    this.seedMemberships = seeds.memberships.map(membership => ({
      ...membership,
      teamIds: membership.teamIds ? [...membership.teamIds] : undefined,
    }));
    this.workspaces = this.loadWorkspaces();
    this.memberships = this.loadMemberships();
  }

  private loadWorkspaces(): Workspace[] {
    try {
      if (typeof localStorage === 'undefined') return this.seedWorkspaces.map(workspace => ({ ...workspace }));
      const raw = localStorage.getItem(STORAGE_WORKSPACES_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_WORKSPACES_KEY, JSON.stringify(this.seedWorkspaces));
        return this.seedWorkspaces.map(workspace => ({ ...workspace }));
      }
      return JSON.parse(raw);
    } catch {
      return this.seedWorkspaces.map(workspace => ({ ...workspace }));
    }
  }

  private saveWorkspaces(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_WORKSPACES_KEY, JSON.stringify(this.workspaces));
      }
    } catch (e) {
      console.warn('Failed to persist workspaces:', e);
    }
  }

  private loadMemberships(): WorkspaceMembership[] {
    try {
      if (typeof localStorage === 'undefined') return this.seedMemberships.map(membership => ({
        ...membership,
        teamIds: membership.teamIds ? [...membership.teamIds] : undefined,
      }));
      const raw = localStorage.getItem(STORAGE_MEMBERSHIPS_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_MEMBERSHIPS_KEY, JSON.stringify(this.seedMemberships));
        return this.seedMemberships.map(membership => ({
          ...membership,
          teamIds: membership.teamIds ? [...membership.teamIds] : undefined,
        }));
      }
      return JSON.parse(raw);
    } catch {
      return this.seedMemberships.map(membership => ({
        ...membership,
        teamIds: membership.teamIds ? [...membership.teamIds] : undefined,
      }));
    }
  }

  private saveMemberships(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_MEMBERSHIPS_KEY, JSON.stringify(this.memberships));
      }
    } catch (e) {
      console.warn('Failed to persist memberships:', e);
    }
  }

  async getWorkspaces(): Promise<Workspace[]> {
    return [...this.workspaces];
  }

  async getWorkspaceById(id: string): Promise<Workspace | null> {
    const ws = this.workspaces.find((w) => w.id === id);
    return ws ? { ...ws } : null;
  }

  async getUserMemberships(userId: string): Promise<WorkspaceMembership[]> {
    return this.memberships.filter((m) => m.userId === userId).map((m) => ({ ...m }));
  }

  private memoryActiveWorkspace = new Map<string, string>();

  async getActiveWorkspaceId(userId: string): Promise<string | null> {
    try {
      if (typeof localStorage !== 'undefined') {
        const val = localStorage.getItem(`${STORAGE_ACTIVE_WORKSPACE_PREFIX}${userId}`);
        if (val) return val;
      }
      return this.memoryActiveWorkspace.get(userId) || null;
    } catch {
      return this.memoryActiveWorkspace.get(userId) || null;
    }
  }

  async setActiveWorkspaceId(userId: string, workspaceId: string): Promise<void> {
    this.memoryActiveWorkspace.set(userId, workspaceId);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`${STORAGE_ACTIVE_WORKSPACE_PREFIX}${userId}`, workspaceId);
      }
    } catch (e) {
      console.warn('Failed to persist active workspace id:', e);
    }
  }

  async acceptInvitation(
    workspaceId: string,
    userId: string,
    role: WorkspaceRole = 'MEMBER'
  ): Promise<WorkspaceMembership> {
    const ws = this.workspaces.find((w) => w.id === workspaceId);
    const existing = this.memberships.find(
      (m) => m.workspaceId === workspaceId && m.userId === userId
    );
    if (existing) {
      existing.status = 'ACTIVE';
      existing.role = role;
      this.saveMemberships();
      return { ...existing };
    }

    const newMembership: WorkspaceMembership = {
      id: `mem_${userId}_${workspaceId}`,
      workspaceId,
      workspaceName: ws?.name || 'Workspace',
      userId,
      role,
      status: 'ACTIVE',
      joinedAt: new Date().toISOString(),
      teamIds: [],
    };
    this.memberships.push(newMembership);
    this.saveMemberships();
    return { ...newMembership };
  }

  async createWorkspace(
    userId: string,
    input: CreateWorkspaceInput
  ): Promise<{ workspace: Workspace; membership: WorkspaceMembership }> {
    const cleanSlug = input.slug?.trim() || slugifyWorkspaceName(input.name);
    const newWorkspaceId = `ws_${cleanSlug}_${Date.now().toString(36)}`;

    const newWorkspace: Workspace = {
      id: newWorkspaceId,
      name: input.name.trim(),
      slug: cleanSlug,
      avatar: '🚀',
      createdAt: new Date().toISOString(),
      status: 'ACTIVE',
    };

    const newMembership: WorkspaceMembership = {
      id: `mem_${userId}_${newWorkspaceId}`,
      workspaceId: newWorkspaceId,
      workspaceName: newWorkspace.name,
      userId,
      role: 'ADMIN',
      status: 'ACTIVE',
      joinedAt: new Date().toISOString(),
      teamIds: [],
    };

    this.workspaces.push(newWorkspace);
    this.memberships.push(newMembership);

    this.saveWorkspaces();
    this.saveMemberships();
    await this.setActiveWorkspaceId(userId, newWorkspaceId);

    return {
      workspace: { ...newWorkspace },
      membership: { ...newMembership },
    };
  }

  async updateWorkspaceStatus(
    workspaceId: string,
    status: WorkspaceStatus
  ): Promise<Workspace | null> {
    const ws = this.workspaces.find((w) => w.id === workspaceId);
    if (!ws) return null;
    ws.status = status;
    this.saveWorkspaces();
    return { ...ws };
  }

  async updateMembershipStatus(
    membershipId: string,
    status: MembershipStatus
  ): Promise<WorkspaceMembership | null> {
    const mem = this.memberships.find((m) => m.id === membershipId);
    if (!mem) return null;

    // Last admin protection invariant check: prevent transitioning final active admin to non-active status
    if (status !== 'ACTIVE') {
      assertNotLastAdminRemoval(this.memberships, mem.userId, mem.workspaceId);
    }

    mem.status = status;
    this.saveMemberships();
    return { ...mem };
  }

  async removeMembership(membershipId: string): Promise<boolean> {
    const mem = this.memberships.find((m) => m.id === membershipId);
    if (!mem) return false;

    // Last admin protection invariant check
    assertNotLastAdminRemoval(this.memberships, mem.userId, mem.workspaceId);

    this.memberships = this.memberships.filter((m) => m.id !== membershipId);
    this.saveMemberships();
    return true;
  }

  /**
   * Reset adapter storage for testing
   */
  resetToSeeds(): void {
    this.workspaces = this.seedWorkspaces.map(workspace => ({ ...workspace }));
    this.memberships = this.seedMemberships.map(membership => ({
      ...membership,
      teamIds: membership.teamIds ? [...membership.teamIds] : undefined,
    }));
    this.saveWorkspaces();
    this.saveMemberships();
  }
}

export const defaultWorkspaceAdapter = new MockWorkspaceAdapter();
