import type { Workspace, WorkspaceMembership } from '../../types';

export const CONTRACT_SEED_WORKSPACES: Workspace[] = [
  { id: 'ws_acme', name: 'Acme Core Platform', slug: 'acme-core', avatar: '🏢', createdAt: '2026-01-15T08:00:00.000Z', status: 'ACTIVE' },
  { id: 'ws_apex', name: 'Apex Robotics', slug: 'apex-robotics', avatar: '🤖', createdAt: '2026-03-20T10:00:00.000Z', status: 'ACTIVE' },
  { id: 'ws_northstar', name: 'Northstar Labs', slug: 'northstar-labs', avatar: '✨', createdAt: '2026-05-12T14:30:00.000Z', status: 'ACTIVE' },
  { id: 'ws_archived', name: 'Legacy Cloud (Archived)', slug: 'legacy-cloud', avatar: '📦', createdAt: '2025-06-01T09:00:00.000Z', status: 'ARCHIVED' },
];

export const CONTRACT_SEED_MEMBERSHIPS: WorkspaceMembership[] = [
  { id: 'mem_alex_acme', workspaceId: 'ws_acme', workspaceName: 'Acme Core Platform', userId: 'usr_alex', role: 'MEMBER', status: 'ACTIVE', joinedAt: '2026-01-16T09:00:00.000Z', teamIds: ['team_eng'] },
  { id: 'mem_alex_apex', workspaceId: 'ws_apex', workspaceName: 'Apex Robotics', userId: 'usr_alex', role: 'ADMIN', status: 'ACTIVE', joinedAt: '2026-03-20T10:05:00.000Z', teamIds: ['team_apex_auto', 'team_apex_hw'] },
  { id: 'mem_sarah_acme', workspaceId: 'ws_acme', workspaceName: 'Acme Core Platform', userId: 'usr_sarah', role: 'ADMIN', status: 'ACTIVE', joinedAt: '2026-01-15T08:05:00.000Z', teamIds: ['team_eng', 'team_web'] },
  { id: 'mem_sarah_northstar', workspaceId: 'ws_northstar', workspaceName: 'Northstar Labs', userId: 'usr_sarah', role: 'OBSERVER', status: 'ACTIVE', joinedAt: '2026-05-15T11:00:00.000Z', teamIds: ['team_ns_quant'] },
  { id: 'mem_marcus_acme', workspaceId: 'ws_acme', workspaceName: 'Acme Core Platform', userId: 'usr_marcus', role: 'MEMBER', status: 'ACTIVE', joinedAt: '2026-01-20T14:00:00.000Z', teamIds: ['team_web'] },
  { id: 'mem_marcus_archived', workspaceId: 'ws_archived', workspaceName: 'Legacy Cloud (Archived)', userId: 'usr_marcus', role: 'MEMBER', status: 'ACTIVE', joinedAt: '2025-06-01T09:15:00.000Z', teamIds: [] },
  { id: 'mem_elena_acme', workspaceId: 'ws_acme', workspaceName: 'Acme Core Platform', userId: 'usr_elena', role: 'OBSERVER', status: 'ACTIVE', joinedAt: '2026-01-18T16:00:00.000Z', teamIds: ['team_inf'] },
  { id: 'mem_elena_apex', workspaceId: 'ws_apex', workspaceName: 'Apex Robotics', userId: 'usr_elena', role: 'MEMBER', status: 'SUSPENDED', joinedAt: '2026-04-01T10:00:00.000Z', teamIds: ['team_apex_hw'] },
  { id: 'mem_david_acme', workspaceId: 'ws_acme', workspaceName: 'Acme Core Platform', userId: 'usr_david', role: 'MEMBER', status: 'ACTIVE', joinedAt: '2026-01-16T10:00:00.000Z', teamIds: ['team_eng'] },
];

export const CONTRACT_SEED_USERS: Record<string, { id: string; name: string; email: string; avatar?: string }> = {
  usr_alex: { id: 'usr_alex', name: 'Alex Rivera', email: 'alex@acme.com' },
  usr_sarah: { id: 'usr_sarah', name: 'Sarah Chen', email: 'sarah@acme.com' },
  usr_marcus: { id: 'usr_marcus', name: 'Marcus Vance', email: 'marcus@acme.com' },
  usr_elena: { id: 'usr_elena', name: 'Elena Rostova', email: 'elena@acme.com' },
  usr_david: { id: 'usr_david', name: 'David Kim', email: 'david@acme.com' },
};

export function getContractMembershipsForUser(userId: string): WorkspaceMembership[] {
  return CONTRACT_SEED_MEMBERSHIPS.filter(membership => membership.userId === userId);
}
