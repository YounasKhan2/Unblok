import { describe, it, expect } from 'vitest';
import { validateMemberInvitation } from './memberAdministration';
import { User, Team } from '../../../types';
import { PendingInvitation } from '../types';

describe('UX-08 Member Administration Domain', () => {
  const activeUsers: User[] = [
    { id: 'u1', name: 'Active Dev', email: 'active@unblok.dev', role: 'MEMBER', avatar: '', teamId: 'team-1' },
  ];

  const pendingInvitations: PendingInvitation[] = [
    {
      id: 'inv-1',
      email: 'pending@unblok.dev',
      role: 'MEMBER',
      teamIds: ['team-1'],
      invitedAt: '2026-10-01',
      status: 'PENDING',
    },
    {
      id: 'inv-2',
      email: 'revoked@unblok.dev',
      role: 'OBSERVER',
      teamIds: [],
      invitedAt: '2026-09-15',
      status: 'REVOKED',
    },
  ];

  const availableTeams: Team[] = [
    { id: 'team-1', name: 'Core Eng', key: 'ENG', color: '#5645d4', description: '' },
    { id: 'team-2', name: 'Platform', key: 'PLAT', color: '#5645d4', description: '' },
  ];

  it('validates and accepts clean invitation inputs', () => {
    const result = validateMemberInvitation(
      {
        email: 'newuser@unblok.dev',
        role: 'MEMBER',
        teamIds: ['team-1'],
      },
      activeUsers,
      pendingInvitations,
      availableTeams
    );
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('rejects invalid email formats', () => {
    const result = validateMemberInvitation(
      {
        email: 'invalid-email-string',
        role: 'MEMBER',
        teamIds: [],
      },
      activeUsers,
      pendingInvitations,
      availableTeams
    );
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/valid email/i);
  });

  it('rejects duplicate of existing active member email', () => {
    const result = validateMemberInvitation(
      {
        email: 'ACTIVE@UNBLOK.DEV', // Case-insensitive check
        role: 'MEMBER',
        teamIds: [],
      },
      activeUsers,
      pendingInvitations,
      availableTeams
    );
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/active member/i);
  });

  it('rejects duplicate of existing pending invitation', () => {
    const result = validateMemberInvitation(
      {
        email: 'pending@unblok.dev',
        role: 'OBSERVER',
        teamIds: [],
      },
      activeUsers,
      pendingInvitations,
      availableTeams
    );
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/already has a pending invitation/i);
  });

  it('allows reinviting an email whose previous invitation was revoked', () => {
    const result = validateMemberInvitation(
      {
        email: 'revoked@unblok.dev',
        role: 'OBSERVER',
        teamIds: [],
      },
      activeUsers,
      pendingInvitations,
      availableTeams
    );
    expect(result.valid).toBe(true);
  });

  it('rejects non-existent team IDs', () => {
    const result = validateMemberInvitation(
      {
        email: 'newbie@unblok.dev',
        role: 'MEMBER',
        teamIds: ['non-existent-team-id'],
      },
      activeUsers,
      pendingInvitations,
      availableTeams
    );
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/does not exist/i);
  });

  it('rejects invalid roles', () => {
    const result = validateMemberInvitation(
      {
        email: 'newbie@unblok.dev',
        role: 'SUPER_ADMIN' as any,
        teamIds: [],
      },
      activeUsers,
      pendingInvitations,
      availableTeams
    );
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/role must be one of/i);
  });
});
