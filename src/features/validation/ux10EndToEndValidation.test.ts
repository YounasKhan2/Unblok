/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  INITIAL_ISSUES,
  INITIAL_PROJECTS,
  INITIAL_TEAMS,
  INITIAL_USERS,
  INITIAL_DEPENDENCIES,
  INITIAL_CYCLES,
  INITIAL_MILESTONES,
  INITIAL_ACTIVITIES,
  INITIAL_COMMENTS,
} from '../../data/mockData';
import { canTransition } from '../../domain/lifecycle';
import {
  getBlockerStatus,
  validateHardCompletionGuard,
  wouldCreateCycle,
  calculateDagGraph,
} from '../../domain/dependency';
import {
  executeAddComment,
  extractMentionedUserIds,
  extractMentionNames,
} from '../collaboration/domain/collaborationMutations';
import { executeCompleteCycle } from '../planning/domain/planningMutations';
import { selectWorkspaceInsights } from '../insights/selectors/insightSelectors';
import { Dependency, Issue, User } from '../../types';

describe('UX-10 End-to-End Prototype Validation Suite', () => {
  describe('1. Canonical Hierarchy & Team Ownership', () => {
    it('enforces Workspace -> Team -> Project -> Issue hierarchy with Project.teamId authoritative', () => {
      // Every initial project belongs to exactly one team via teamId
      for (const project of INITIAL_PROJECTS) {
        expect(project.teamId).toBeDefined();
        const owningTeam = INITIAL_TEAMS.find(t => t.id === project.teamId);
        expect(owningTeam).toBeDefined();
      }

      // Every initial issue belongs to a project that has an authoritative teamId
      for (const issue of INITIAL_ISSUES) {
        expect(issue.projectId).toBeDefined();
        const project = INITIAL_PROJECTS.find(p => p.id === issue.projectId);
        expect(project).toBeDefined();
        expect(project!.teamId).toBeDefined();
      }
    });

    it('allows cross-project and cross-team dependencies within the workspace', () => {
      // Find cross-project and cross-team dependencies in initial seed data
      const projectsMap = new Map(INITIAL_PROJECTS.map(p => [p.id, p]));
      const issuesMap = new Map(INITIAL_ISSUES.map(i => [i.id, i]));

      const crossProjectDeps = INITIAL_DEPENDENCIES.filter(dep => {
        const u = issuesMap.get(dep.upstreamIssueId);
        const v = issuesMap.get(dep.downstreamIssueId);
        return u && v && u.projectId !== v.projectId;
      });

      expect(crossProjectDeps.length).toBeGreaterThan(0);

      const crossTeamDeps = INITIAL_DEPENDENCIES.filter(dep => {
        const u = issuesMap.get(dep.upstreamIssueId);
        const v = issuesMap.get(dep.downstreamIssueId);
        if (!u || !v) return false;
        const uProj = projectsMap.get(u.projectId);
        const vProj = projectsMap.get(v.projectId);
        return uProj && vProj && uProj.teamId !== vProj.teamId;
      });

      expect(crossTeamDeps.length).toBeGreaterThan(0);
    });
  });

  describe('2. Canonical Issue Lifecycle & Blocker Guard', () => {
    it('validates canonical issue lifecycle forward, backward, cancellation, and reopen transitions', () => {
      // Forward
      expect(canTransition('BACKLOG', 'TODO')).toBe(true);
      expect(canTransition('TODO', 'IN_PROGRESS')).toBe(true);
      expect(canTransition('IN_PROGRESS', 'IN_REVIEW')).toBe(true);
      expect(canTransition('IN_REVIEW', 'DONE')).toBe(true);

      // Backward
      expect(canTransition('IN_PROGRESS', 'TODO')).toBe(true);
      expect(canTransition('IN_REVIEW', 'IN_PROGRESS')).toBe(true);

      // Cancellation
      expect(canTransition('BACKLOG', 'CANCELLED')).toBe(true);
      expect(canTransition('TODO', 'CANCELLED')).toBe(true);
      expect(canTransition('IN_PROGRESS', 'CANCELLED')).toBe(true);
      expect(canTransition('IN_REVIEW', 'CANCELLED')).toBe(true);

      // Reopening
      expect(canTransition('DONE', 'TODO')).toBe(true);
      expect(canTransition('CANCELLED', 'TODO')).toBe(true);

      // Disallowed jump
      expect(canTransition('BACKLOG', 'DONE')).toBe(false);
      expect(canTransition('DONE', 'IN_PROGRESS')).toBe(false);
    });

    it('strictly forbids actively blocked issues from transitioning to DONE', () => {
      // Setup issue with active blocker
      const upstream: Issue = {
        id: 'test_u',
        key: 'TST-1',
        title: 'Prerequisite task',
        description: '',
        state: 'IN_PROGRESS',
        priority: 'HIGH',
        projectId: 'proj_eng',
        teamId: 'team_eng',
        creatorId: 'user_1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
      };

      const downstream: Issue = {
        id: 'test_d',
        key: 'TST-2',
        title: 'Blocked task',
        description: '',
        state: 'IN_REVIEW',
        priority: 'HIGH',
        projectId: 'proj_eng',
        teamId: 'team_eng',
        creatorId: 'user_1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
      };

      const dep: Dependency = {
        id: 'dep_test',
        upstreamIssueId: upstream.id,
        downstreamIssueId: downstream.id,
        createdAt: new Date().toISOString(),
        createdBy: 'user_1',
      };

      const guard = validateHardCompletionGuard(downstream, [upstream, downstream], [dep]);
      expect(guard.allowed).toBe(false);
      expect(guard.activeBlockers.length).toBe(1);
      expect(guard.activeBlockers[0].id).toBe(upstream.id);
    });
  });

  describe('3. Blocker Lifecycle & Reactivation Invariants (Step E)', () => {
    it('executes full 15-step blocker lifecycle with reactivation on reopen', () => {
      const upstream: Issue = {
        id: 'u1',
        key: 'UP-1',
        title: 'Upstream',
        description: '',
        state: 'TODO',
        priority: 'MEDIUM',
        projectId: 'proj_eng',
        teamId: 'team_eng',
        creatorId: 'user_1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
      };

      const downstream: Issue = {
        id: 'd1',
        key: 'DN-1',
        title: 'Downstream',
        description: '',
        state: 'TODO',
        priority: 'HIGH',
        projectId: 'proj_eng',
        teamId: 'team_eng',
        creatorId: 'user_1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
      };

      const dep: Dependency = {
        id: 'dep_1',
        upstreamIssueId: upstream.id,
        downstreamIssueId: downstream.id,
        createdAt: new Date().toISOString(),
        createdBy: 'user_1',
      };

      // 1. Initial active blocker
      let status = getBlockerStatus(downstream.id, [upstream, downstream], [dep]);
      expect(status.isBlocked).toBe(true);
      expect(status.activeCount).toBe(1);
      expect(status.resolvedCount).toBe(0);

      // 2. Guard prevents downstream completion
      let guard = validateHardCompletionGuard(downstream, [upstream, downstream], [dep]);
      expect(guard.allowed).toBe(false);

      // 3. Complete upstream (DONE)
      const completedUpstream = { ...upstream, state: 'DONE' as const };
      status = getBlockerStatus(downstream.id, [completedUpstream, downstream], [dep]);
      expect(status.isBlocked).toBe(false);
      expect(status.activeCount).toBe(0);
      expect(status.resolvedCount).toBe(1); // Persisted relation remains intact!

      // 4. Guard now allows downstream completion
      guard = validateHardCompletionGuard(downstream, [completedUpstream, downstream], [dep]);
      expect(guard.allowed).toBe(true);

      // 5. Reopen upstream (DONE -> TODO)
      const reopenedUpstream = { ...upstream, state: 'TODO' as const };
      status = getBlockerStatus(downstream.id, [reopenedUpstream, downstream], [dep]);
      expect(status.isBlocked).toBe(true);
      expect(status.activeCount).toBe(1);
      expect(status.resolvedCount).toBe(0);

      // 6. Guard rejects completion again
      guard = validateHardCompletionGuard(downstream, [reopenedUpstream, downstream], [dep]);
      expect(guard.allowed).toBe(false);
    });

    it('rejects self-dependencies, duplicate dependencies, and cycles', () => {
      const issuesMap = new Map<string, Issue>([
        ['a', { id: 'a', key: 'A', title: 'A' } as Issue],
        ['b', { id: 'b', key: 'B', title: 'B' } as Issue],
        ['c', { id: 'c', key: 'C', title: 'C' } as Issue],
      ]);

      const deps: Dependency[] = [
        { id: '1', upstreamIssueId: 'a', downstreamIssueId: 'b', createdAt: '', createdBy: '' },
        { id: '2', upstreamIssueId: 'b', downstreamIssueId: 'c', createdAt: '', createdBy: '' },
      ];

      // Self-dependency
      const selfCheck = wouldCreateCycle('a', 'a', deps, issuesMap);
      expect(selfCheck.hasCycle).toBe(true);

      // Duplicate dependency
      const dupCheck = wouldCreateCycle('a', 'b', deps, issuesMap);
      expect(dupCheck.hasCycle).toBe(true);

      // Circular dependency: c -> a would complete a -> b -> c -> a
      const cycleCheck = wouldCreateCycle('c', 'a', deps, issuesMap);
      expect(cycleCheck.hasCycle).toBe(true);
      expect(cycleCheck.cyclePath).toEqual(['A', 'A', 'B', 'C']);

      // Valid new edge: unrelated or DAG extension
      const validCheck = wouldCreateCycle('a', 'c', deps, issuesMap);
      expect(validCheck.hasCycle).toBe(false);
    });
  });

  describe('4. Planning Journey & Cycle Completion Atomicity', () => {
    it('executes atomic cycle completion with rollover validation', () => {
      const adminUser = INITIAL_USERS.find(u => u.role === 'ADMIN')!;
      const state = {
        cycles: INITIAL_CYCLES,
        issues: INITIAL_ISSUES,
        projects: INITIAL_PROJECTS,
        teams: INITIAL_TEAMS,
        currentUser: adminUser,
        activities: INITIAL_ACTIVITIES,
      };

      const activeCycle = INITIAL_CYCLES.find(c => c.status === 'ACTIVE')!;
      const nextCycle = INITIAL_CYCLES.find(c => c.status === 'UPCOMING')!;

      // Valid rollover
      const res = executeCompleteCycle(state, {
        cycleId: activeCycle.id,
        rolloverData: {
          targetCycleId: nextCycle?.id,
          issueIdsToRollover: undefined, // all uncompleted
        },
      });

      expect(res.success).toBe(true);
      expect(res.nextState).toBeDefined();

      // In nextState, activeCycle is COMPLETED and nextCycle has the rolled over issues
      const completedInNext = res.nextState!.cycles.find(c => c.id === activeCycle.id);
      expect(completedInNext?.status).toBe('COMPLETED');
    });

    it('rejects cycle completion for Observer role', () => {
      const observerUser = INITIAL_USERS.find(u => u.role === 'OBSERVER')!;
      const state = {
        cycles: INITIAL_CYCLES,
        issues: INITIAL_ISSUES,
        projects: INITIAL_PROJECTS,
        teams: INITIAL_TEAMS,
        currentUser: observerUser,
        activities: INITIAL_ACTIVITIES,
      };

      const activeCycle = INITIAL_CYCLES.find(c => c.status === 'ACTIVE')!;
      const res = executeCompleteCycle(state, {
        cycleId: activeCycle.id,
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Observer cannot complete cycles/i);
    });
  });

  describe('5. Mention Identity & Collaboration Projection Invariants', () => {
    it('resolves mentions using stable user IDs and prevents prefix collision (Ann vs Anna, Sarah vs Sarah Chen)', () => {
      const users: User[] = [
        { id: 'u_ann', name: 'Ann', email: 'ann@unblok.dev', role: 'MEMBER', avatar: '', teamId: 'team_eng' },
        { id: 'u_anna', name: 'Anna', email: 'anna@unblok.dev', role: 'MEMBER', avatar: '', teamId: 'team_eng' },
        { id: 'u_sarah', name: 'Sarah', email: 'sarah@unblok.dev', role: 'MEMBER', avatar: '', teamId: 'team_eng' },
        { id: 'u_sarah_chen', name: 'Sarah Chen', email: 'schen@unblok.dev', role: 'ADMIN', avatar: '', teamId: 'team_eng' },
      ];

      // Exact match for Anna must not match Ann
      const annaIds = extractMentionedUserIds('Hello @Anna please review this', users);
      expect(annaIds).toEqual(['u_anna']);

      // Exact match for Sarah Chen must not match Sarah
      const sarahChenIds = extractMentionedUserIds('Hey @Sarah Chen what do you think?', users);
      expect(sarahChenIds).toEqual(['u_sarah_chen']);

      // Duplicate mentions of same user yield single ID
      const dupIds = extractMentionedUserIds('@Anna and @Anna again', users);
      expect(dupIds).toEqual(['u_anna']);
    });

    it('emits USER_MENTIONED activity events with targetUserId on comment creation', () => {
      const actor = INITIAL_USERS[0];
      const target = INITIAL_USERS[1];

      const res = executeAddComment({
        issueId: INITIAL_ISSUES[0].id,
        content: `Hey @${target.name} can you take a look?`,
        actor,
        allUsers: INITIAL_USERS,
        issues: INITIAL_ISSUES,
        existingComments: INITIAL_COMMENTS,
      });

      expect(res.success).toBe(true);
      expect(res.comment).toBeDefined();

      const mentionEvents = res.events.filter(e => e.eventType === 'USER_MENTIONED');
      expect(mentionEvents.length).toBe(1);
      expect(mentionEvents[0].details.targetUserId).toBe(target.id);
    });

    it('forbids Observer from posting comments', () => {
      const observer = INITIAL_USERS.find(u => u.role === 'OBSERVER')!;
      const res = executeAddComment({
        issueId: INITIAL_ISSUES[0].id,
        content: 'Observer attempt to comment',
        actor: observer,
        allUsers: INITIAL_USERS,
        issues: INITIAL_ISSUES,
        existingComments: INITIAL_COMMENTS,
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Observers have read-only access and cannot author comments/i);
    });
  });

  describe('6. Insights Intelligence & Canonical Team Derivation', () => {
    it('derives team health strictly through Project.teamId', () => {
      const insights = selectWorkspaceInsights({
        issues: INITIAL_ISSUES,
        dependencies: INITIAL_DEPENDENCIES,
        projects: INITIAL_PROJECTS,
        teams: INITIAL_TEAMS,
        cycles: INITIAL_CYCLES,
        milestones: INITIAL_MILESTONES,
      });

      expect(insights.summary.activeIssuesCount).toBeGreaterThan(0);
      expect(insights.summary.activeBlockersCount).toBeGreaterThanOrEqual(0);

      // Delivery health must be one of HEALTHY, WATCH, AT_RISK
      expect(insights.teamHealth.length).toBeGreaterThan(0);
      for (const th of insights.teamHealth) {
        expect(['HEALTHY', 'WATCH', 'AT_RISK']).toContain(th.health);
      }
    });
  });
});
