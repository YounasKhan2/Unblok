/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-14 Onboarding Domain Progression & State Resolution
 * Section 10, 15, 16, 17: Domain-derived progression resolving setup state
 * from canonical workspace, team, and project entities.
 */

import { Workspace, WorkspaceMembership } from '../../workspaces/types';
import { Team, Project } from '../../../types';

export interface OnboardingDomainContext {
  activeWorkspace: Workspace | null;
  activeMembership: WorkspaceMembership | null;
  teams: Team[];
  projects: Project[];
}

export const ONBOARDING_STORAGE_PREFIX = 'unblok_onboarding_';

export function getOnboardingStorageKey(workspaceId: string): string {
  return `${ONBOARDING_STORAGE_PREFIX}${workspaceId}`;
}

export interface StoredOnboardingState {
  inviteCompletedOrSkipped: boolean;
  setupCompleted: boolean;
  completedAt?: string;
  sentInvitations?: Array<{ email: string; role: 'MEMBER' | 'OBSERVER' }>;
}

const memoryStorage = new Map<string, string>();

export function getStoredOnboardingState(workspaceId: string): StoredOnboardingState {
  try {
    const key = getOnboardingStorageKey(workspaceId);
    let raw: string | null = null;
    if (typeof localStorage !== 'undefined') {
      raw = localStorage.getItem(key);
    } else {
      raw = memoryStorage.get(key) ?? null;
    }
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore storage errors
  }
  return {
    inviteCompletedOrSkipped: false,
    setupCompleted: false,
  };
}

export function saveStoredOnboardingState(
  workspaceId: string,
  state: Partial<StoredOnboardingState>
): StoredOnboardingState {
  const current = getStoredOnboardingState(workspaceId);
  const updated: StoredOnboardingState = {
    ...current,
    ...state,
  };
  try {
    const key = getOnboardingStorageKey(workspaceId);
    const serialized = JSON.stringify(updated);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, serialized);
    } else {
      memoryStorage.set(key, serialized);
    }
  } catch {
    // ignore storage errors
  }
  return updated;
}

export function clearStoredOnboardingState(workspaceId: string): void {
  try {
    const key = getOnboardingStorageKey(workspaceId);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
    memoryStorage.delete(key);
  } catch {
    // ignore storage errors
  }
}

/**
 * Resolves the appropriate onboarding or application route based on domain state.
 */
export function resolveOnboardingRoute(ctx: OnboardingDomainContext): string {
  const { activeWorkspace, activeMembership, teams, projects } = ctx;

  // 1. If no active workspace or membership exists, must create workspace
  if (!activeWorkspace || !activeMembership) {
    return '/onboarding/workspace';
  }

  // 2. Non-ADMIN members (invited users) bypass onboarding completely
  if (activeMembership.role !== 'ADMIN') {
    return '/my-work';
  }

  const stored = getStoredOnboardingState(activeWorkspace.id);

  // 3. If setup is already flagged complete and entities exist, route to product
  if (stored.setupCompleted && teams.length > 0 && projects.length > 0) {
    return '/my-work';
  }

  // 4. If no teams exist in active workspace, must create first team
  if (teams.length === 0) {
    return '/onboarding/team';
  }

  // 5. If no projects exist in active workspace, must create first project
  if (projects.length === 0) {
    return '/onboarding/project';
  }

  // 6. If invite step hasn't been completed or skipped yet
  if (!stored.inviteCompletedOrSkipped) {
    return '/onboarding/invite';
  }

  // 7. Reached completion summary
  return '/onboarding/complete';
}
