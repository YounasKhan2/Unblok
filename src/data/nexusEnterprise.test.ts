import { describe, expect, it, vi } from 'vitest';
import { getBlockerStatus } from '../domain/dependency';
import { calculateCrossTeamMatrix, resolveEdges } from '../features/dependencies/selectors';
import { deriveInboxItems } from '../features/collaboration/domain/inboxProjection';
import { selectMilestoneDetail } from '../features/planning/selectors/milestoneSelectors';
import { selectRoadmapProjection } from '../features/planning/selectors/roadmapSelectors';
import { generateScheduleDays } from '../features/planning/domain/scheduleInvariants';
import { SEED_MEMBERSHIPS } from '../features/workspaces/data/mockWorkspaces';
import {
  INITIAL_ACTIVITIES,
  INITIAL_COMMENTS,
  INITIAL_CYCLES,
  INITIAL_DEPENDENCIES,
  INITIAL_ISSUES,
  INITIAL_MILESTONES,
  INITIAL_PROJECTS,
  INITIAL_TEAMS,
  INITIAL_USERS,
  NEXUS_FIXTURE_VERSION,
  NEXUS_OWNER_TEAM_ID,
  NEXUS_PROJECT_ID,
  NEXUS_REFERENCE_DATE,
  NEXUS_WORKSPACE_ID,
  validateNexusFixture,
} from './nexusEnterprise';

describe('NEXUS enterprise reference data', () => {
  it('contains the requested high-density entity volumes', () => {
    expect(NEXUS_FIXTURE_VERSION).toBe('nexus-enterprise-v3');
    expect(INITIAL_ISSUES).toHaveLength(300);
    expect(INITIAL_TEAMS).toHaveLength(6);
    expect(INITIAL_USERS).toHaveLength(35);
    expect(INITIAL_PROJECTS).toHaveLength(1);
    expect(INITIAL_CYCLES).toHaveLength(12);
    expect(INITIAL_MILESTONES).toHaveLength(10);
    expect(INITIAL_DEPENDENCIES).toHaveLength(180);
    expect(INITIAL_COMMENTS).toHaveLength(420);
    expect(INITIAL_ACTIVITIES.length).toBeGreaterThanOrEqual(600);
  });

  it('uses a fixed reference date and stable identifiers', () => {
    expect(NEXUS_REFERENCE_DATE).toBe('2026-10-08');
    expect(INITIAL_ISSUES[0]).toMatchObject({
      id: 'iss_nex_1',
      key: 'NEX-1',
      workspaceId: NEXUS_WORKSPACE_ID,
      projectId: NEXUS_PROJECT_ID,
      createdAt: expect.any(String),
    });
    expect(INITIAL_DEPENDENCIES[0].id).toBe('dep_nex_1');
    expect(INITIAL_COMMENTS[0].id).toBe('comm_nex_1');
    expect(INITIAL_ACTIVITIES.some(activity => activity.id === 'act_nex_1')).toBe(true);
  });

  it('regenerates identical entity data after module reload', async () => {
    const baseline = JSON.stringify([
      INITIAL_TEAMS,
      INITIAL_PROJECTS,
      INITIAL_USERS,
      INITIAL_CYCLES,
      INITIAL_MILESTONES,
      INITIAL_ISSUES,
      INITIAL_DEPENDENCIES,
      INITIAL_COMMENTS,
      INITIAL_ACTIVITIES,
    ]);

    vi.resetModules();
    const regenerated = await import('./nexusEnterprise');
    expect(JSON.stringify([
      regenerated.INITIAL_TEAMS,
      regenerated.INITIAL_PROJECTS,
      regenerated.INITIAL_USERS,
      regenerated.INITIAL_CYCLES,
      regenerated.INITIAL_MILESTONES,
      regenerated.INITIAL_ISSUES,
      regenerated.INITIAL_DEPENDENCIES,
      regenerated.INITIAL_COMMENTS,
      regenerated.INITIAL_ACTIVITIES,
    ])).toBe(baseline);
  });

  it('has valid entity references, unique IDs, and a directed acyclic dependency graph', () => {
    expect(validateNexusFixture()).toEqual([]);

    const blockedIssue = INITIAL_ISSUES.find(issue =>
      getBlockerStatus(issue.id, INITIAL_ISSUES, INITIAL_DEPENDENCIES).activeCount > 1
    );
    expect(blockedIssue).toBeDefined();

    const resolvedIssue = INITIAL_ISSUES.find(issue =>
      getBlockerStatus(issue.id, INITIAL_ISSUES, INITIAL_DEPENDENCIES).resolvedCount > 0
    );
    expect(resolvedIssue).toBeDefined();

    expect(INITIAL_ISSUES.some(issue =>
      issue.state === 'IN_REVIEW' &&
      Date.parse(issue.updatedAt) < Date.parse('2026-09-24T00:00:00.000Z')
    )).toBe(true);
    expect(INITIAL_ISSUES.some(issue =>
      issue.dueDate !== undefined &&
      issue.dueDate < NEXUS_REFERENCE_DATE &&
      issue.state !== 'DONE' &&
      issue.state !== 'CANCELLED'
    )).toBe(true);
    expect(INITIAL_ISSUES.some(issue => !issue.assigneeId)).toBe(true);
    expect(INITIAL_ISSUES.some(issue => issue.description.length > 900)).toBe(true);
    const commentedIssueIds = new Set(INITIAL_COMMENTS.map(comment => comment.issueId));
    expect(INITIAL_ISSUES.some(issue => !commentedIssueIds.has(issue.id))).toBe(true);
  });

  it('keeps one workspace, an owner-team flagship, and aligned team cycles', () => {
    expect(INITIAL_PROJECTS[0]).toMatchObject({
      workspaceId: NEXUS_WORKSPACE_ID,
      teamId: NEXUS_OWNER_TEAM_ID,
      key: 'NEX',
    });
    expect(INITIAL_TEAMS.every(team => team.workspaceId === NEXUS_WORKSPACE_ID)).toBe(true);
    expect(INITIAL_ISSUES.every(issue =>
      issue.workspaceId === NEXUS_WORKSPACE_ID &&
      issue.projectId === NEXUS_PROJECT_ID &&
      INITIAL_TEAMS.some(team => team.id === issue.teamId)
    )).toBe(true);
    expect(new Set(INITIAL_ISSUES.map(issue => issue.teamId))).toEqual(new Set(INITIAL_TEAMS.map(team => team.id)));
    expect(INITIAL_CYCLES.every(cycle => cycle.workspaceId === NEXUS_WORKSPACE_ID)).toBe(true);
    expect(INITIAL_CYCLES.filter(cycle => cycle.status !== 'COMPLETED').every(cycle =>
      cycle.teamId === NEXUS_OWNER_TEAM_ID
    )).toBe(true);
    expect(INITIAL_ISSUES.every(issue =>
      !issue.cycleId || INITIAL_CYCLES.find(cycle => cycle.id === issue.cycleId)?.teamId === issue.teamId
    )).toBe(true);
    expect(INITIAL_CYCLES.filter(cycle => cycle.status === 'ACTIVE')).toHaveLength(1);
    expect(INITIAL_CYCLES.at(-1)?.status).toBe('UPCOMING');
    expect(SEED_MEMBERSHIPS).toHaveLength(INITIAL_USERS.length);
    expect(SEED_MEMBERSHIPS.every(membership =>
      membership.workspaceId === NEXUS_WORKSPACE_ID &&
      INITIAL_USERS.some(user => user.id === membership.userId && user.role === membership.role)
    )).toBe(true);
  });

  it('populates milestone dependency graphs and cross-team matrix data', () => {
    for (const milestone of INITIAL_MILESTONES) {
      const detail = selectMilestoneDetail(
        milestone.id,
        INITIAL_MILESTONES,
        INITIAL_ISSUES,
        INITIAL_DEPENDENCIES,
        INITIAL_PROJECTS,
        INITIAL_TEAMS,
        new Date(`${NEXUS_REFERENCE_DATE}T00:00:00.000Z`)
      );
      expect(detail?.graphLayout.nodes.length).toBeGreaterThanOrEqual(12);
      expect(detail?.graphLayout.edges.length).toBeGreaterThanOrEqual(18);
    }

    const edges = resolveEdges(INITIAL_DEPENDENCIES, INITIAL_ISSUES, INITIAL_PROJECTS, INITIAL_TEAMS);
    const matrix = calculateCrossTeamMatrix(INITIAL_TEAMS, edges);
    expect(matrix.totalCrossTeamActiveEdges).toBeGreaterThan(0);
    expect(matrix.teams).toHaveLength(6);
    expect(Array.from(matrix.matrix.values()).some(row =>
      Array.from(row.values()).some(cell => cell.activeEdgeCount > 0 && cell.blockedIssueCount > 0)
    )).toBe(true);
  });

  it('stages a balanced, populated current-week timeline across all teams', () => {
    const week = generateScheduleDays(new Date('2026-10-05T00:00:00.000Z'), 7, new Date(`${NEXUS_REFERENCE_DATE}T00:00:00.000Z`));
    const projection = selectRoadmapProjection(
      INITIAL_ISSUES,
      INITIAL_TEAMS,
      INITIAL_PROJECTS,
      INITIAL_USERS,
      INITIAL_DEPENDENCIES,
      week,
      {
        group: 'team',
        team: 'ALL',
        assignee: 'ALL',
        cycle: 'ALL',
        milestone: 'ALL',
        blockedOnly: false,
        searchQuery: '',
      }
    );
    const populatedTeams = projection.groups.filter(group => group.totalScheduled > 0);

    expect(projection.totalScheduledCount).toBeGreaterThanOrEqual(70);
    expect(populatedTeams).toHaveLength(INITIAL_TEAMS.length);
    expect(week.map(day => day.dateStr)).toEqual([
      '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11',
    ]);
  });

  it('has threaded collaboration and a populated mention stream for the derived Inbox', () => {
    expect(INITIAL_COMMENTS.some(comment => Boolean(comment.parentId))).toBe(true);
    expect(INITIAL_COMMENTS.some(comment => Boolean(comment.mentions?.length))).toBe(true);
    expect(INITIAL_ACTIVITIES.filter(activity => activity.eventType === 'USER_MENTIONED').length).toBeGreaterThanOrEqual(120);
    expect(INITIAL_ACTIVITIES.some(activity => activity.eventType === 'ASSIGNEE_CHANGED')).toBe(true);
    expect(INITIAL_ACTIVITIES.every((activity, index, activities) =>
      index === 0 || Date.parse(activities[index - 1].timestamp) >= Date.parse(activity.timestamp)
    )).toBe(true);

    const totalInboxItems = INITIAL_USERS.reduce((count, currentUser) =>
      count + deriveInboxItems({
        activities: INITIAL_ACTIVITIES,
        issues: INITIAL_ISSUES,
        comments: INITIAL_COMMENTS,
        users: INITIAL_USERS,
        currentUser,
        receipts: {},
      }).length, 0);
    expect(totalInboxItems).toBeGreaterThanOrEqual(120);
    expect(deriveInboxItems({
      activities: INITIAL_ACTIVITIES,
      issues: INITIAL_ISSUES,
      comments: INITIAL_COMMENTS,
      users: INITIAL_USERS,
      currentUser: INITIAL_USERS[0],
      receipts: {},
    }).length).toBeGreaterThanOrEqual(100);
  });
});
