import type { Workspace, WorkspaceMembership } from '../types';
import {
  INITIAL_USERS,
  NEXUS_REFERENCE_DATE,
  NEXUS_WORKSPACE_ID,
} from '../../../data/nexusEnterprise';

const fixtureCreatedAt = `${NEXUS_REFERENCE_DATE}T09:00:00.000Z`;

export const SEED_WORKSPACES: Workspace[] = [{
  id: NEXUS_WORKSPACE_ID,
  name: 'NEXUS Commerce',
  slug: 'nexus-commerce',
  avatar: '🛒',
  createdAt: '2026-04-11T09:00:00.000Z',
  status: 'ACTIVE',
}];

export const SEED_MEMBERSHIPS: WorkspaceMembership[] = INITIAL_USERS.map(user => ({
  id: `mem_nex_${user.id}`,
  workspaceId: NEXUS_WORKSPACE_ID,
  workspaceName: 'NEXUS Commerce',
  userId: user.id,
  role: user.role,
  status: 'ACTIVE',
  joinedAt: fixtureCreatedAt,
  teamIds: user.teamIds || [],
}));

export const SEED_USERS: Record<string, { id: string; name: string; email: string; avatar?: string }> =
  Object.fromEntries(INITIAL_USERS.map(user => [user.id, {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
  }]));

export const getMembershipsForUser = (userId: string): WorkspaceMembership[] =>
  SEED_MEMBERSHIPS.filter(membership => membership.userId === userId);
