/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NEXUS Omnichannel Commerce Platform — Enterprise Dataset Validation
 * Comprehensive test suite validating all 13 canonical requirements from UX-15.5.
 */

import { describe, it, expect } from 'vitest';
import {
  NEXUS_FIXTURE_VERSION,
  NEXUS_WORKSPACE,
  NEXUS_PROJECT,
  NEXUS_PROJECTS,
  NEXUS_TEAMS,
  NEXUS_USERS,
  NEXUS_CYCLES,
  NEXUS_MILESTONES,
  NEXUS_ISSUES,
  NEXUS_DEPENDENCIES,
  NEXUS_COMMENTS,
  NEXUS_ACTIVITIES,
} from './index';
import { deriveInboxItems } from '../../features/collaboration/domain/inboxProjection';
import { canAssignIssueToCycle } from '../../features/planning/domain/cycleInvariants';
import { deriveMilestoneHealth } from '../../features/planning/domain/milestoneInvariants';
import { validateHardCompletionGuard, getBlockerStatus } from '../../domain/dependency';
import { filterEntitiesByWorkspace } from '../../features/workspaces/domain/workspaceIsolation';
import { MULTI_WORKSPACE_INITIAL_ISSUES } from '../../features/workspaces/tests/fixtures/multiWorkspaceContractFixtures';
import { Issue } from '../../types';

describe('NEXUS Enterprise Dataset Validation (UX-15.5)', () => {
  /* ======================================================================== */
  /* 1. ENTITY TARGETS & COUNTS                                               */
  /* ======================================================================== */
  describe('1. Entity Targets & Counts', () => {
    it('fixture version is correctly specified and versioned', () => {
      expect(NEXUS_FIXTURE_VERSION).toBe('nexus-2026.10.1');
    });

    it('workspace target: 1 primary seeded workspace', () => {
      expect(NEXUS_WORKSPACE.id).toBe('ws_nexus');
      expect(NEXUS_WORKSPACE.name).toBe('NEXUS Commerce');
      expect(NEXUS_WORKSPACE.slug).toBe('nexus-commerce');
      expect(NEXUS_WORKSPACE.status).toBe('ACTIVE');
    });

    it('flagship project target: 1 project owned by Commerce Platform', () => {
      expect(NEXUS_PROJECTS.length).toBe(1);
      expect(NEXUS_PROJECT.id).toBe('proj_nexus');
      expect(NEXUS_PROJECT.key).toBe('NEX');
      expect(NEXUS_PROJECT.name).toBe('NEXUS — Omnichannel Commerce Platform');
      expect(NEXUS_PROJECT.teamId).toBe('team_cp');
      expect(NEXUS_PROJECT.workspaceId).toBe('ws_nexus');
    });

    it('functional teams target: exactly 6 teams with distinct keys and colors', () => {
      expect(NEXUS_TEAMS.length).toBe(6);
      const teamKeys = NEXUS_TEAMS.map((t) => t.key);
      expect(new Set(teamKeys).size).toBe(6);
      expect(teamKeys).toEqual(expect.arrayContaining(['CP', 'SFX', 'SVC', 'PAY', 'INF', 'QE']));
      NEXUS_TEAMS.forEach((t) => {
        expect(t.workspaceId).toBe('ws_nexus');
        expect(t.name).toBeTruthy();
        expect(t.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    it('users target: 35 fictional employees across all roles and teams', () => {
      expect(NEXUS_USERS.length).toBe(35);
      const userIds = new Set(NEXUS_USERS.map((u) => u.id));
      expect(userIds.size).toBe(35);

      const emails = new Set(NEXUS_USERS.map((u) => u.email));
      expect(emails.size).toBe(35);

      const roles = new Set(NEXUS_USERS.map((u) => u.role));
      expect(roles.has('ADMIN')).toBe(true);
      expect(roles.has('MEMBER')).toBe(true);
      expect(roles.has('OBSERVER')).toBe(true);
    });

    it('detailed issues target: exactly 300 realistic engineering issues', () => {
      expect(NEXUS_ISSUES.length).toBe(300);
      const issueIds = new Set(NEXUS_ISSUES.map((i) => i.id));
      expect(issueIds.size).toBe(300);
    });

    it('team cycles target: 12 cycles covering past, active and upcoming', () => {
      expect(NEXUS_CYCLES.length).toBe(12);
      const cycleIds = new Set(NEXUS_CYCLES.map((c) => c.id));
      expect(cycleIds.size).toBe(12);

      const statuses = new Set(NEXUS_CYCLES.map((c) => c.status));
      expect(statuses.has('COMPLETED')).toBe(true);
      expect(statuses.has('ACTIVE')).toBe(true);
      expect(statuses.has('UPCOMING')).toBe(true);
    });

    it('milestones target: 10 workspace milestones covering architecture to GA', () => {
      expect(NEXUS_MILESTONES.length).toBe(10);
      const milestoneIds = new Set(NEXUS_MILESTONES.map((m) => m.id));
      expect(milestoneIds.size).toBe(10);
    });

    it('marketing graph target: 15 narrative-led directed dependency edges', () => {
      expect(NEXUS_DEPENDENCIES.length).toBeGreaterThanOrEqual(12);
      expect(NEXUS_DEPENDENCIES.length).toBeLessThanOrEqual(20);
      expect(NEXUS_DEPENDENCIES.length).toBe(15);
    });

    it('comments target: 400+ technical comments', () => {
      expect(NEXUS_COMMENTS.length).toBeGreaterThanOrEqual(400);
      expect(NEXUS_COMMENTS.length).toBe(430);
    });

    it('activity events target: 600+ activity transitions', () => {
      expect(NEXUS_ACTIVITIES.length).toBeGreaterThanOrEqual(600);
      expect(NEXUS_ACTIVITIES.length).toBe(962);
    });

    it('notifications target: 120+ inbox notifications for primary user (Alex Rivera)', () => {
      const alex = NEXUS_USERS[0];
      const alexInbox = deriveInboxItems({
        activities: NEXUS_ACTIVITIES,
        issues: NEXUS_ISSUES,
        comments: NEXUS_COMMENTS,
        users: NEXUS_USERS,
        currentUser: alex,
        receipts: {},
      });
      expect(alexInbox.length).toBeGreaterThanOrEqual(120);
      expect(alexInbox.length).toBe(139);
    });
  });

  /* ======================================================================== */
  /* 2. REFERENTIAL INTEGRITY                                                 */
  /* ======================================================================== */
  describe('2. Referential Integrity', () => {
    const validUserIds = new Set(NEXUS_USERS.map((u) => u.id));
    const validTeamIds = new Set(NEXUS_TEAMS.map((t) => t.id));
    const validCycleIds = new Set(NEXUS_CYCLES.map((c) => c.id));
    const validMilestoneIds = new Set(NEXUS_MILESTONES.map((m) => m.id));
    const validIssueIds = new Set(NEXUS_ISSUES.map((i) => i.id));
    const validCommentIds = new Set(NEXUS_COMMENTS.map((c) => c.id));

    it('every issue references valid project, team, workspace, and optional assignees/cycles/milestones', () => {
      NEXUS_ISSUES.forEach((issue) => {
        expect(issue.workspaceId).toBe('ws_nexus');
        expect(issue.projectId).toBe('proj_nexus');
        expect(issue.teamId).toBe('team_cp');
        if (issue.assigneeId) {
          expect(validUserIds.has(issue.assigneeId)).toBe(true);
        }
        if (issue.cycleId) {
          expect(validCycleIds.has(issue.cycleId)).toBe(true);
        }
        if (issue.milestoneId) {
          expect(validMilestoneIds.has(issue.milestoneId)).toBe(true);
        }
        if (issue.creatorId) {
          expect(validUserIds.has(issue.creatorId)).toBe(true);
        }
      });
    });

    it('every dependency references valid and distinct issues in ws_nexus', () => {
      NEXUS_DEPENDENCIES.forEach((dep) => {
        expect(dep.workspaceId).toBe('ws_nexus');
        expect(validIssueIds.has(dep.upstreamIssueId)).toBe(true);
        expect(validIssueIds.has(dep.downstreamIssueId)).toBe(true);
        expect(dep.upstreamIssueId).not.toBe(dep.downstreamIssueId);
      });
    });

    it('every comment references a valid issue, valid author, and valid parent if threaded', () => {
      NEXUS_COMMENTS.forEach((comment) => {
        expect(comment.workspaceId).toBe('ws_nexus');
        expect(validIssueIds.has(comment.issueId)).toBe(true);
        expect(validUserIds.has(comment.authorId)).toBe(true);
        if (comment.parentId) {
          expect(validCommentIds.has(comment.parentId)).toBe(true);
        }
        if (comment.mentions && comment.mentions.length > 0) {
          comment.mentions.forEach((m) => expect(validUserIds.has(m)).toBe(true));
        }
      });
    });

    it('every activity event references a valid issue and valid user', () => {
      NEXUS_ACTIVITIES.forEach((activity) => {
        expect(activity.workspaceId).toBe('ws_nexus');
        expect(validIssueIds.has(activity.issueId)).toBe(true);
        expect(validUserIds.has(activity.userId)).toBe(true);
      });
    });
  });

  /* ======================================================================== */
  /* 3. WORKSPACE & TEAM OWNERSHIP RULES                                      */
  /* ======================================================================== */
  describe('3. Workspace & Team Ownership Rules', () => {
    it('flagship project belongs strictly to Commerce Platform', () => {
      expect(NEXUS_PROJECT.teamId).toBe('team_cp');
    });

    it('canonical cycle invariant: all issues in cycles belong to team_cp cycles', () => {
      const issuesWithCycle = NEXUS_ISSUES.filter((i) => Boolean(i.cycleId));
      expect(issuesWithCycle.length).toBeGreaterThan(0);

      issuesWithCycle.forEach((issue) => {
        const cycle = NEXUS_CYCLES.find((c) => c.id === issue.cycleId);
        expect(cycle).toBeDefined();
        expect(cycle?.teamId).toBe('team_cp');

        const eligibility = canAssignIssueToCycle(issue, cycle, NEXUS_PROJECTS);
        expect(eligibility.allowed).toBe(true);
      });
    });

    it('cycles belonging to other teams contain no NEX project issues', () => {
      const otherTeamCycles = NEXUS_CYCLES.filter((c) => c.teamId !== 'team_cp');
      expect(otherTeamCycles.length).toBe(5);

      otherTeamCycles.forEach((cycle) => {
        const assignedIssues = NEXUS_ISSUES.filter((i) => i.cycleId === cycle.id);
        expect(assignedIssues.length).toBe(0);
      });
    });

    it('each team has at most 1 ACTIVE cycle concurrently', () => {
      NEXUS_TEAMS.forEach((team) => {
        const activeCycles = NEXUS_CYCLES.filter(
          (c) => c.teamId === team.id && c.status === 'ACTIVE'
        );
        expect(activeCycles.length).toBeLessThanOrEqual(1);
      });
    });
  });

  /* ======================================================================== */
  /* 4. ISSUE KEY UNIQUENESS & DISTRIBUTION                                   */
  /* ======================================================================== */
  describe('4. Issue Key Uniqueness & Realism', () => {
    it('issue keys are sequential from NEX-1 to NEX-300 with zero duplicates', () => {
      const keys = NEXUS_ISSUES.map((i) => i.key);
      expect(new Set(keys).size).toBe(300);

      for (let num = 1; num <= 300; num++) {
        expect(keys).toContain(`NEX-${num}`);
      }
    });

    it('issues have non-empty titles, technical descriptions, and acceptance criteria', () => {
      NEXUS_ISSUES.forEach((issue) => {
        expect(issue.title.trim().length).toBeGreaterThan(15);
        expect(issue.description.trim().length).toBeGreaterThan(40);
        expect(issue.description).toContain('### Acceptance Criteria');
      });
    });

    it('distributes across all canonical lifecycle states', () => {
      const states = new Set(NEXUS_ISSUES.map((i) => i.state));
      expect(states.has('BACKLOG')).toBe(true);
      expect(states.has('TODO')).toBe(true);
      expect(states.has('IN_PROGRESS')).toBe(true);
      expect(states.has('IN_REVIEW')).toBe(true);
      expect(states.has('DONE')).toBe(true);
      expect(states.has('CANCELLED')).toBe(true);
    });

    it('distributes across all priority levels', () => {
      const priorities = new Set(NEXUS_ISSUES.map((i) => i.priority));
      expect(priorities.has('LOW')).toBe(true);
      expect(priorities.has('MEDIUM')).toBe(true);
      expect(priorities.has('HIGH')).toBe(true);
      expect(priorities.has('URGENT')).toBe(true);
    });
  });

  /* ======================================================================== */
  /* 5. DEPENDENCY GRAPH INTEGRITY & COMPLETION GUARDS                        */
  /* ======================================================================== */
  describe('5. Dependency Graph Integrity & Completion Guards', () => {
    it('preserves five active blocked-work examples while limiting graph fan-in and fan-out', () => {
      const issues = new Map(NEXUS_ISSUES.map((issue) => [issue.id, issue]));
      const incoming = new Map<string, number>();
      const outgoing = new Map<string, number>();
      const active = NEXUS_DEPENDENCIES.filter((dep) => {
        incoming.set(dep.downstreamIssueId, (incoming.get(dep.downstreamIssueId) || 0) + 1);
        outgoing.set(dep.upstreamIssueId, (outgoing.get(dep.upstreamIssueId) || 0) + 1);
        const upstream = issues.get(dep.upstreamIssueId);
        const downstream = issues.get(dep.downstreamIssueId);
        return upstream && downstream &&
          upstream.state !== 'DONE' && upstream.state !== 'CANCELLED' &&
          downstream.state !== 'DONE' && downstream.state !== 'CANCELLED';
      });
      expect(active.length).toBe(5);
      expect(Math.max(...incoming.values())).toBeLessThanOrEqual(2);
      expect(Math.max(...outgoing.values())).toBeLessThanOrEqual(2);
    });

    it('has zero self-dependencies and zero duplicate directed edges', () => {
      const edgeSignatures = new Set<string>();

      NEXUS_DEPENDENCIES.forEach((dep) => {
        expect(dep.upstreamIssueId).not.toBe(dep.downstreamIssueId);
        const sig = `${dep.upstreamIssueId}->${dep.downstreamIssueId}`;
        expect(edgeSignatures.has(sig)).toBe(false);
        edgeSignatures.add(sig);
      });
    });

    it('dependency graph is an acyclic directed graph (DAG) via topological sorting', () => {
      // Kahn's algorithm
      const inDegree = new Map<string, number>();
      const adj = new Map<string, string[]>();

      NEXUS_ISSUES.forEach((i) => {
        inDegree.set(i.id, 0);
        adj.set(i.id, []);
      });

      NEXUS_DEPENDENCIES.forEach((dep) => {
        inDegree.set(dep.downstreamIssueId, (inDegree.get(dep.downstreamIssueId) || 0) + 1);
        adj.get(dep.upstreamIssueId)?.push(dep.downstreamIssueId);
      });

      const queue: string[] = [];
      inDegree.forEach((deg, id) => {
        if (deg === 0) queue.push(id);
      });

      let visitedCount = 0;
      while (queue.length > 0) {
        const u = queue.shift()!;
        visitedCount++;

        const neighbors = adj.get(u) || [];
        for (const v of neighbors) {
          const currentDeg = inDegree.get(v)! - 1;
          inDegree.set(v, currentDeg);
          if (currentDeg === 0) {
            queue.push(v);
          }
        }
      }

      expect(visitedCount).toBe(NEXUS_ISSUES.length);
    });

    it('completion guard rejects transitions to DONE when active blockers are unresolved', () => {
      const activeDeps = NEXUS_DEPENDENCIES.filter((dep) => {
        const blocker = NEXUS_ISSUES.find((i) => i.id === dep.upstreamIssueId);
        const blocked = NEXUS_ISSUES.find((i) => i.id === dep.downstreamIssueId);
        return (
          blocker &&
          blocked &&
          blocker.state !== 'DONE' &&
          blocker.state !== 'CANCELLED' &&
          blocked.state !== 'DONE'
        );
      });

      expect(activeDeps.length).toBeGreaterThan(0);
      const testDep = activeDeps[0];
      const blockedIssue = NEXUS_ISSUES.find((i) => i.id === testDep.downstreamIssueId)!;

      const guard = validateHardCompletionGuard(
        blockedIssue,
        NEXUS_ISSUES,
        NEXUS_DEPENDENCIES
      );

      expect(guard.allowed).toBe(false);
      expect(guard.activeBlockers.length).toBeGreaterThan(0);
    });

    it('completion guard permits transitions to DONE when blockers are resolved', () => {
      const resolvedDeps = NEXUS_DEPENDENCIES.filter((dep) => {
        const blocker = NEXUS_ISSUES.find((i) => i.id === dep.upstreamIssueId);
        return blocker && blocker.state === 'DONE';
      });

      expect(resolvedDeps.length).toBeGreaterThan(0);
      const blockerId = resolvedDeps[0].upstreamIssueId;
      const blockerIssue = NEXUS_ISSUES.find((i) => i.id === blockerId)!;

      // Check blocker issue itself can be done
      const blockerStatus = getBlockerStatus(blockerIssue.id, NEXUS_ISSUES, NEXUS_DEPENDENCIES);
      if (blockerStatus.activeCount === 0) {
        const guard = validateHardCompletionGuard(
          blockerIssue,
          NEXUS_ISSUES,
          NEXUS_DEPENDENCIES
        );
        expect(guard.allowed).toBe(true);
      }
    });
  });

  /* ======================================================================== */
  /* 6. MILESTONE HEALTH COMPUTATION                                          */
  /* ======================================================================== */
  describe('6. Milestone Health Computation', () => {
    it('canonical deriveMilestoneHealth computes valid health for all milestones without errors', () => {
      const refDate = new Date('2026-10-07T12:00:00.000Z');

      NEXUS_MILESTONES.forEach((ms) => {
        const result = deriveMilestoneHealth(ms, NEXUS_ISSUES, NEXUS_DEPENDENCIES, refDate);
        expect(['ON_TRACK', 'AT_RISK', 'BLOCKED']).toContain(result.health);
        expect(typeof result.reason).toBe('string');
        expect(typeof result.isCompleted).toBe('boolean');
      });
    });
  });

  /* ======================================================================== */
  /* 7. ISOLATION & NO LEGACY FIXTURE LEAKAGE                                 */
  /* ======================================================================== */
  describe('7. Isolation & No Legacy Fixture Leakage', () => {
    it('NEXUS workspace contains zero legacy ENG-, WEB-, or INF- issues', () => {
      const nexusIssues = filterEntitiesByWorkspace<Issue>(NEXUS_ISSUES, 'ws_nexus');
      expect(nexusIssues.length).toBe(300);

      nexusIssues.forEach((issue) => {
        expect(issue.key.startsWith('NEX-')).toBe(true);
        expect(issue.key.startsWith('ENG-')).toBe(false);
        expect(issue.key.startsWith('WEB-')).toBe(false);
        expect(issue.key.startsWith('INF-')).toBe(false);
        expect(issue.workspaceId).toBe('ws_nexus');
      });
    });

    it('legacy test workspaces retain isolated contract-test data without corruption', () => {
      const acmeIssues = filterEntitiesByWorkspace<Issue>(MULTI_WORKSPACE_INITIAL_ISSUES, 'ws_acme');
      expect(acmeIssues.length).toBeGreaterThan(0);
      acmeIssues.forEach((issue) => {
        expect(issue.workspaceId).toBe('ws_acme');
      });
    });
  });
});
