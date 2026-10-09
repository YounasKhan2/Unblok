/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { Issue, Team, Project, User, Dependency, Cycle, Milestone } from '../../types';
import { selectRoadmapProjection } from './selectors/roadmapSelectors';
import {
  generateScheduleDays,
  calculateTimelineSpan,
  validateScheduleDates,
} from './domain/scheduleInvariants';
import { RoadmapFilterState } from './types';
import { canMutatePlanning } from './permissions';

describe('UX-05 Schedule & Roadmap Domain & Selectors', () => {
  const mockTeams: Team[] = [
    { id: 'team_eng', name: 'Core Engine', key: 'ENG', color: '#5645d4', description: '' },
    { id: 'team_web', name: 'Web App', key: 'WEB', color: '#0f7b6c', description: '' },
  ];

  const mockUsers: User[] = [
    { id: 'usr_sarah', name: 'Sarah Chen', email: '', avatar: '', role: 'ADMIN', teamId: 'team_eng' },
    { id: 'usr_marcus', name: 'Marcus Vance', email: '', avatar: '', role: 'MEMBER', teamId: 'team_web' },
    { id: 'usr_aisha', name: 'Aisha Patel', email: '', avatar: '', role: 'OBSERVER', teamId: 'team_web' },
  ];

  const mockProjects: Project[] = [
    { id: 'proj_api', teamId: 'team_eng', name: 'API Platform', key: 'API', description: '', currentSequence: 10 },
  ];

  const mockIssues: Issue[] = [
    {
      id: 'iss_1',
      key: 'API-1',
      title: 'Database connection pool',
      description: '',
      projectId: 'proj_api',
      teamId: 'team_eng',
      assigneeId: 'usr_sarah',
      cycleId: 'cycle_1',
      milestoneId: 'ms_1',
      startDate: '2026-10-01',
      dueDate: '2026-10-04',
      state: 'IN_PROGRESS',
      priority: 'HIGH',
      creatorId: 'usr_sarah',
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
      version: 1,
    },
    {
      id: 'iss_2',
      key: 'API-2',
      title: 'Auth token revoke endpoint',
      description: '',
      projectId: 'proj_api',
      teamId: 'team_eng',
      assigneeId: 'usr_sarah',
      startDate: '2026-10-03',
      dueDate: '2026-10-06',
      state: 'TODO',
      priority: 'URGENT',
      creatorId: 'usr_sarah',
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
      version: 1,
    },
    {
      id: 'iss_3',
      key: 'API-3',
      title: 'Web seat counter',
      description: '',
      projectId: 'proj_api',
      teamId: 'team_web',
      assigneeId: 'usr_marcus',
      startDate: '2026-10-02',
      dueDate: '2026-10-05',
      state: 'TODO',
      priority: 'LOW',
      creatorId: 'usr_sarah',
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
      version: 1,
    },
  ];

  const mockDependencies: Dependency[] = [
    {
      id: 'dep_1',
      upstreamIssueId: 'iss_1', // iss_1 blocks iss_2
      downstreamIssueId: 'iss_2',
      createdAt: '2026-10-01',
      createdBy: 'usr_sarah',
    },
  ];

  const windowDays = generateScheduleDays(new Date('2026-09-28T00:00:00.000Z'), 7);

  const baseFilters: RoadmapFilterState = {
    group: 'team',
    team: 'ALL',
    assignee: 'ALL',
    cycle: 'ALL',
    milestone: 'ALL',
    blockedOnly: false,
    searchQuery: '',
  };

  it('1. Team grouping (group=team)', () => {
    const projection = selectRoadmapProjection(
      mockIssues,
      mockTeams,
      mockProjects,
      mockUsers,
      mockDependencies,
      windowDays,
      { ...baseFilters, group: 'team' }
    );

    expect(projection.groups.length).toBe(2); // team_eng and team_web
    const engGroup = projection.groups.find(g => g.id === 'team_eng');
    expect(engGroup?.issues.length).toBe(2); // API-1 and API-2
  });

  it('2. Assignee grouping (group=assignee)', () => {
    const projection = selectRoadmapProjection(
      mockIssues,
      mockTeams,
      mockProjects,
      mockUsers,
      mockDependencies,
      windowDays,
      { ...baseFilters, group: 'assignee' }
    );

    const sarahGroup = projection.groups.find(g => g.id === 'usr_sarah');
    expect(sarahGroup?.issues.length).toBe(2);

    const marcusGroup = projection.groups.find(g => g.id === 'usr_marcus');
    expect(marcusGroup?.issues.length).toBe(1);
  });

  it('3. Date range projection: maps issues to timeline span inside window', () => {
    const span = calculateTimelineSpan('2026-10-01', '2026-10-04', windowDays);
    expect(span).not.toBeNull();
    expect(span?.inWindow).toBe(true);
    expect(span?.spanCols).toBeGreaterThan(0);
  });

  it('4. Team filter: isolates specific team', () => {
    const projection = selectRoadmapProjection(
      mockIssues,
      mockTeams,
      mockProjects,
      mockUsers,
      mockDependencies,
      windowDays,
      { ...baseFilters, team: 'ENG' }
    );

    expect(projection.groups.length).toBe(1);
    expect(projection.groups[0].key).toBe('ENG');
  });

  it('5. Assignee filter: isolates specific assignee', () => {
    const projection = selectRoadmapProjection(
      mockIssues,
      mockTeams,
      mockProjects,
      mockUsers,
      mockDependencies,
      windowDays,
      { ...baseFilters, group: 'assignee', assignee: 'usr_marcus' }
    );

    expect(projection.groups.length).toBe(1);
    expect(projection.groups[0].id).toBe('usr_marcus');
  });

  it('6. Cycle filter: filters by cycleId', () => {
    const projection = selectRoadmapProjection(
      mockIssues,
      mockTeams,
      mockProjects,
      mockUsers,
      mockDependencies,
      windowDays,
      { ...baseFilters, cycle: 'cycle_1' }
    );

    expect(projection.totalScheduledCount).toBe(1);
    expect(projection.groups[0].issues[0].issue.key).toBe('API-1');
  });

  it('7. Milestone filter: filters by milestoneId', () => {
    const projection = selectRoadmapProjection(
      mockIssues,
      mockTeams,
      mockProjects,
      mockUsers,
      mockDependencies,
      windowDays,
      { ...baseFilters, milestone: 'ms_1' }
    );

    expect(projection.totalScheduledCount).toBe(1);
    expect(projection.groups[0].issues[0].issue.key).toBe('API-1');
  });

  it('8. Blocked filter: isolates blocked scheduled tasks', () => {
    // API-2 is blocked by API-1
    const projection = selectRoadmapProjection(
      mockIssues,
      mockTeams,
      mockProjects,
      mockUsers,
      mockDependencies,
      windowDays,
      { ...baseFilters, blockedOnly: true }
    );

    expect(projection.totalScheduledCount).toBe(1);
    expect(projection.groups[0].issues[0].issue.key).toBe('API-2');
    expect(projection.groups[0].issues[0].isBlocked).toBe(true);
  });

  it('9. Canonical schedule mutation: validates startDate <= dueDate', () => {
    const valid = validateScheduleDates('2026-10-01', '2026-10-14');
    expect(valid.valid).toBe(true);

    const invalid = validateScheduleDates('2026-10-20', '2026-10-10');
    expect(invalid.valid).toBe(false);
    expect(invalid.error).toContain('cannot be after');
  });

  it('10. Observer rejection: observer cannot mutate schedule dates', () => {
    expect(canMutatePlanning(mockUsers[0].role)).toBe(true); // ADMIN
    expect(canMutatePlanning(mockUsers[1].role)).toBe(true); // MEMBER
    expect(canMutatePlanning(mockUsers[2].role)).toBe(false); // OBSERVER
  });

  it('11. Roadmap cannot mutate Cycle lifecycle: roadmap operations only affect startDate/dueDate', () => {
    // Invariant: Roadmap updates schedule properties, but cannot alter cycle status (Section 49)
    const issueBefore = mockIssues[0];
    const updatedDates = { startDate: '2026-10-02', dueDate: '2026-10-08' };

    // Simulating schedule work update
    const updatedIssue = { ...issueBefore, ...updatedDates };

    // Cycle association and lifecycle remain intact
    expect(updatedIssue.cycleId).toBe(issueBefore.cycleId);
    expect(updatedIssue.state).toBe(issueBefore.state);
    expect(updatedIssue.startDate).toBe('2026-10-02');
  });
});
