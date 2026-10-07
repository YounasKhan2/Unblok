/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-13 Deterministic Seed Workspaces & Multi-Workspace Memberships
 * Section 22, 39: Three distinct workspaces + archived workspace scenario.
 */

import { Workspace, WorkspaceMembership } from '../types';

export const SEED_WORKSPACES: Workspace[] = [
  {
    id: 'ws_acme',
    name: 'Acme Core Platform',
    slug: 'acme-core',
    avatar: '🏢',
    createdAt: '2026-01-15T08:00:00.000Z',
    status: 'ACTIVE',
  },
  {
    id: 'ws_apex',
    name: 'Apex Robotics',
    slug: 'apex-robotics',
    avatar: '🤖',
    createdAt: '2026-03-20T10:00:00.000Z',
    status: 'ACTIVE',
  },
  {
    id: 'ws_northstar',
    name: 'Northstar Labs',
    slug: 'northstar-labs',
    avatar: '✨',
    createdAt: '2026-05-12T14:30:00.000Z',
    status: 'ACTIVE',
  },
  {
    id: 'ws_archived',
    name: 'Legacy Cloud (Archived)',
    slug: 'legacy-cloud',
    avatar: '📦',
    createdAt: '2025-06-01T09:00:00.000Z',
    status: 'ARCHIVED',
  },
];

export const SEED_MEMBERSHIPS: WorkspaceMembership[] = [
  // Alex Rivera (usr_alex) - MEMBER in Acme, ADMIN in Apex
  {
    id: 'mem_alex_acme',
    workspaceId: 'ws_acme',
    workspaceName: 'Acme Core Platform',
    userId: 'usr_alex',
    role: 'MEMBER',
    status: 'ACTIVE',
    joinedAt: '2026-01-16T09:00:00.000Z',
    teamIds: ['team_eng'],
  },
  {
    id: 'mem_alex_apex',
    workspaceId: 'ws_apex',
    workspaceName: 'Apex Robotics',
    userId: 'usr_alex',
    role: 'ADMIN',
    status: 'ACTIVE',
    joinedAt: '2026-03-20T10:05:00.000Z',
    teamIds: ['team_apex_auto', 'team_apex_hw'],
  },

  // Sarah Chen (usr_sarah) - ADMIN in Acme, OBSERVER in Northstar
  {
    id: 'mem_sarah_acme',
    workspaceId: 'ws_acme',
    workspaceName: 'Acme Core Platform',
    userId: 'usr_sarah',
    role: 'ADMIN',
    status: 'ACTIVE',
    joinedAt: '2026-01-15T08:05:00.000Z',
    teamIds: ['team_eng', 'team_web'],
  },
  {
    id: 'mem_sarah_northstar',
    workspaceId: 'ws_northstar',
    workspaceName: 'Northstar Labs',
    userId: 'usr_sarah',
    role: 'OBSERVER',
    status: 'ACTIVE',
    joinedAt: '2026-05-15T11:00:00.000Z',
    teamIds: ['team_ns_quant'],
  },

  // Marcus Vance (usr_marcus) - MEMBER in Acme, MEMBER in Archived workspace
  {
    id: 'mem_marcus_acme',
    workspaceId: 'ws_acme',
    workspaceName: 'Acme Core Platform',
    userId: 'usr_marcus',
    role: 'MEMBER',
    status: 'ACTIVE',
    joinedAt: '2026-01-20T14:00:00.000Z',
    teamIds: ['team_web'],
  },
  {
    id: 'mem_marcus_archived',
    workspaceId: 'ws_archived',
    workspaceName: 'Legacy Cloud (Archived)',
    userId: 'usr_marcus',
    role: 'MEMBER',
    status: 'ACTIVE',
    joinedAt: '2025-06-01T09:15:00.000Z',
    teamIds: [],
  },

  // Elena Rostova (usr_elena) - OBSERVER in Acme, SUSPENDED in Apex
  {
    id: 'mem_elena_acme',
    workspaceId: 'ws_acme',
    workspaceName: 'Acme Core Platform',
    userId: 'usr_elena',
    role: 'OBSERVER',
    status: 'ACTIVE',
    joinedAt: '2026-01-18T16:00:00.000Z',
    teamIds: ['team_inf'],
  },
  {
    id: 'mem_elena_apex',
    workspaceId: 'ws_apex',
    workspaceName: 'Apex Robotics',
    userId: 'usr_elena',
    role: 'MEMBER',
    status: 'SUSPENDED',
    joinedAt: '2026-04-01T10:00:00.000Z',
    teamIds: ['team_apex_hw'],
  },

  // David Kim (usr_david) - MEMBER in Acme
  {
    id: 'mem_david_acme',
    workspaceId: 'ws_acme',
    workspaceName: 'Acme Core Platform',
    userId: 'usr_david',
    role: 'MEMBER',
    status: 'ACTIVE',
    joinedAt: '2026-01-16T10:00:00.000Z',
    teamIds: ['team_eng'],
  },
];

export const SEED_USERS: Record<string, { id: string; name: string; email: string; avatar?: string }> = {
  usr_alex: {
    id: 'usr_alex',
    name: 'Alex Rivera',
    email: 'alex@acme.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  },
  usr_sarah: {
    id: 'usr_sarah',
    name: 'Sarah Chen',
    email: 'sarah@acme.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
  },
  usr_marcus: {
    id: 'usr_marcus',
    name: 'Marcus Vance',
    email: 'marcus@acme.com',
  },
  usr_elena: {
    id: 'usr_elena',
    name: 'Elena Rostova',
    email: 'elena@acme.com',
  },
  usr_david: {
    id: 'usr_david',
    name: 'David Kim',
    email: 'david@acme.com',
  },
};

export function getMembershipsForUser(userId: string): WorkspaceMembership[] {
  return SEED_MEMBERSHIPS.filter(m => m.userId === userId);
}

