import { describe, it, expect } from 'vitest';
import { validateTeamParameters, canArchiveTeam, planCreateTeam } from './teamAdministration';
import { Team, Project, Cycle, User } from '../../../types';

describe('UX-08 Team Administration Domain', () => {
  const existingTeams: Team[] = [
    { id: 't-eng', name: 'Core Engineering', key: 'ENG', color: '#5645d4', description: '' },
    { id: 't-ops', name: 'Infrastructure Operations', key: 'OPS', color: '#5645d4', description: '' },
  ];

  describe('Team Creation and Edit Validation', () => {
    it('accepts valid team name and key per Journey 7', () => {
      const result = validateTeamParameters(
        {
          name: 'Security & Compliance',
          key: 'SEC',
        },
        existingTeams
      );
      expect(result.valid).toBe(true);
    });

    it('rejects empty or whitespace-only name', () => {
      const result = validateTeamParameters(
        {
          name: '   ',
          key: 'SEC',
        },
        existingTeams
      );
      expect(result.valid).toBe(false);
      expect(result.errors.name || result.error).toMatch(/name is required/i);
    });

    it('rejects invalid key format (lowercase or special chars)', () => {
      const lowerResult = validateTeamParameters(
        { name: 'Security', key: 'sec' },
        existingTeams
      );
      expect(lowerResult.valid).toBe(false);

      const invalidChars = validateTeamParameters(
        { name: 'Security', key: 'S-1' },
        existingTeams
      );
      expect(invalidChars.valid).toBe(false);
    });

    it('rejects key length outside 2-6 chars', () => {
      const tooShort = validateTeamParameters(
        { name: 'Security', key: 'S' },
        existingTeams
      );
      expect(tooShort.valid).toBe(false);

      const tooLong = validateTeamParameters(
        { name: 'Security', key: 'TOOLONGKEY' },
        existingTeams
      );
      expect(tooLong.valid).toBe(false);
    });

    it('rejects duplicate team key', () => {
      const result = validateTeamParameters(
        { name: 'Engineering Squad', key: 'ENG' },
        existingTeams
      );
      expect(result.valid).toBe(false);
      expect(result.errors.key || result.error).toMatch(/key "ENG" is already in use/i);
    });

    it('rejects duplicate team name', () => {
      const result = validateTeamParameters(
        { name: 'Core Engineering', key: 'CORE' },
        existingTeams
      );
      expect(result.valid).toBe(false);
      expect(result.errors.name || result.error).toMatch(/already exists/i);
    });

    it('allows updating an existing team with its own key/name', () => {
      const result = validateTeamParameters(
        { name: 'Core Engineering', key: 'ENG' },
        existingTeams,
        't-eng' // excludeCurrentId
      );
      expect(result.valid).toBe(true);
    });
  });

  describe('Canonical Team Archive Ownership Guard', () => {
    const projects: Project[] = [
      {
        id: 'p-1',
        name: 'Platform Auth',
        key: 'AUTH',
        teamId: 't-eng',
        description: '',
        currentSequence: 10,
      },
      {
        id: 'p-2',
        name: 'Legacy Migration',
        key: 'LEG',
        teamId: 't-ops',
        description: '',
        currentSequence: 5,
      },
    ];
    (projects[1] as any).archivedAt = '2026-05-01';

    const cycles: Cycle[] = [
      {
        id: 'c-1',
        name: 'Sprint 14',
        teamId: 't-ops',
        status: 'ACTIVE',
        startDate: '2026-10-01',
        endDate: '2026-10-15',
      },
      {
        id: 'c-2',
        name: 'Sprint 13',
        teamId: 't-ops',
        status: 'COMPLETED',
        startDate: '2026-09-15',
        endDate: '2026-09-30',
      },
    ];

    it('blocks archiving when the team owns active projects', () => {
      const check = canArchiveTeam('t-eng', projects, cycles);
      expect(check.allowed).toBe(false);
      expect(check.reason).toMatch(/owns 1 active project/i);
      expect(check.details?.projectKeys).toContain('AUTH');
    });

    it('blocks archiving when the team owns an ACTIVE cycle', () => {
      const check = canArchiveTeam('t-ops', projects, cycles);
      expect(check.allowed).toBe(false);
      expect(check.reason).toMatch(/1 active cycle/i);
      expect(check.details?.cycleNames).toContain('Sprint 14');
    });

    it('permits archiving when team has zero active project ownerships and no active cycles', () => {
      const emptyTeamProjects = projects.filter(p => p.teamId !== 't-ops');
      const completedOnlyCycles = cycles.filter(c => c.status !== 'ACTIVE');

      const check = canArchiveTeam('t-ops', emptyTeamProjects, completedOnlyCycles);
      expect(check.allowed).toBe(true);
      expect(check.reason).toBeUndefined();
    });
  });

  describe('Atomic planCreateTeam Mutation Boundary', () => {
    const existingUsers: User[] = [
      {
        id: 'usr_sarah',
        name: 'Sarah Chen',
        email: 'sarah@acme.corp',
        avatar: '',
        role: 'ADMIN',
        teamId: 't-eng',
        teamIds: ['t-eng'],
      },
      {
        id: 'usr_marcus',
        name: 'Marcus Vance',
        email: 'marcus@acme.corp',
        avatar: '',
        role: 'MEMBER',
        teamId: 't-ops',
        teamIds: ['t-ops', 't-eng'],
      },
    ];

    it('Invalid user: Attempt to create a Team with memberIds: [valid, missing] throws and preserves original teams and users', () => {
      const clonedTeams = [...existingTeams];
      const clonedUsers = [...existingUsers];

      expect(() =>
        planCreateTeam(
          {
            name: 'Security Squad',
            key: 'SEC',
            memberIds: ['usr_sarah', 'usr_missing'],
          },
          clonedTeams,
          clonedUsers,
          'ADMIN'
        )
      ).toThrow(/User with ID usr_missing not found/i);

      // Verify original state remains untouched
      expect(clonedTeams).toHaveLength(2);
      expect(clonedUsers).toHaveLength(2);
      expect(clonedUsers[0].teamIds).toEqual(['t-eng']);
    });

    it('Duplicate member IDs: Attempt with memberIds: [usr_sarah, usr_sarah] throws and leaves state unchanged', () => {
      const clonedTeams = [...existingTeams];
      const clonedUsers = [...existingUsers];

      expect(() =>
        planCreateTeam(
          {
            name: 'Security Squad',
            key: 'SEC',
            memberIds: ['usr_sarah', 'usr_sarah'],
          },
          clonedTeams,
          clonedUsers,
          'ADMIN'
        )
      ).toThrow(/Duplicate member IDs provided/i);

      expect(clonedTeams).toHaveLength(2);
      expect(clonedUsers).toHaveLength(2);
    });

    it('Valid creation: Team created exactly once, new membership added, existing unrelated memberships preserved', () => {
      const plan = planCreateTeam(
        {
          name: 'Security Squad',
          key: 'SEC',
          color: '#dd5b00',
          memberIds: ['usr_sarah', 'usr_marcus'],
        },
        existingTeams,
        existingUsers,
        'ADMIN'
      );

      // Team created exactly once
      expect(plan.updatedTeams).toHaveLength(3);
      expect(plan.newTeam.key).toBe('SEC');
      expect(plan.newTeam.name).toBe('Security Squad');

      // Sarah had t-eng, now has t-eng and new team
      const updatedSarah = plan.updatedUsers.find(u => u.id === 'usr_sarah')!;
      expect(updatedSarah.teamIds).toContain('t-eng');
      expect(updatedSarah.teamIds).toContain(plan.newTeam.id);
      expect(updatedSarah.teamIds).toHaveLength(2);

      // Marcus had t-ops and t-eng, now has t-ops, t-eng, and new team
      const updatedMarcus = plan.updatedUsers.find(u => u.id === 'usr_marcus')!;
      expect(updatedMarcus.teamIds).toContain('t-ops');
      expect(updatedMarcus.teamIds).toContain('t-eng');
      expect(updatedMarcus.teamIds).toContain(plan.newTeam.id);
      expect(updatedMarcus.teamIds).toHaveLength(3);
    });

    it('No-members creation: Creating a Team without memberIds still works normally', () => {
      const plan = planCreateTeam(
        {
          name: 'Security Squad',
          key: 'SEC',
        },
        existingTeams,
        existingUsers,
        'ADMIN'
      );

      expect(plan.updatedTeams).toHaveLength(3);
      expect(plan.newTeam.key).toBe('SEC');
      expect(plan.updatedUsers).toEqual(existingUsers);
    });

    it('RBAC boundary: Non-ADMIN actor cannot plan team creation', () => {
      expect(() =>
        planCreateTeam(
          { name: 'Security Squad', key: 'SEC' },
          existingTeams,
          existingUsers,
          'MEMBER'
        )
      ).toThrow(/Administrative mutations require ADMIN role/i);

      expect(() =>
        planCreateTeam(
          { name: 'Security Squad', key: 'SEC' },
          existingTeams,
          existingUsers,
          'OBSERVER'
        )
      ).toThrow(/Administrative mutations require ADMIN role/i);
    });
  });
});
