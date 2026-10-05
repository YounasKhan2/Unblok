/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  wouldCreateCycle,
  getBlockerStatus,
  validateHardCompletionGuard,
} from './dependency';
import { canTransition, isUpstreamActivelyBlocking } from './lifecycle';
import { Issue, Dependency } from '../types';

describe('Domain Rules - Lifecycle & Dependency Graph Invariants', () => {
  const issues: Issue[] = [
    {
      id: 'iss_1',
      key: 'ENG-1',
      projectId: 'proj_1',
      teamId: 'team_1',
      title: 'Issue 1',
      description: '',
      state: 'IN_PROGRESS',
      priority: 'HIGH',
      assigneeId: 'usr_1',
      creatorId: 'usr_1',
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
      version: 1,
    },
    {
      id: 'iss_2',
      key: 'ENG-2',
      projectId: 'proj_1',
      teamId: 'team_1',
      title: 'Issue 2',
      description: '',
      state: 'TODO',
      priority: 'MEDIUM',
      assigneeId: 'usr_2',
      creatorId: 'usr_1',
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
      version: 1,
    },
    {
      id: 'iss_3',
      key: 'ENG-3',
      projectId: 'proj_1',
      teamId: 'team_1',
      title: 'Issue 3',
      description: '',
      state: 'TODO',
      priority: 'LOW',
      assigneeId: 'usr_3',
      creatorId: 'usr_1',
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
      version: 1,
    },
  ];

  const issuesMap = new Map(issues.map(i => [i.id, i]));

  describe('DAG Cycle Prevention (wouldCreateCycle)', () => {
    it('detects and rejects self-dependencies (A BLOCKS A)', () => {
      const result = wouldCreateCycle('iss_1', 'iss_1', [], issuesMap);
      expect(result.hasCycle).toBe(true);
    });

    it('detects direct 2-node cycle (A -> B, then B -> A)', () => {
      const existingDeps: Dependency[] = [
        {
          id: 'dep_1',
          upstreamIssueId: 'iss_1',
          downstreamIssueId: 'iss_2',
          createdAt: '2026-10-01',
          createdBy: 'usr_1',
        },
      ];

      // Attempting iss_2 BLOCKS iss_1
      const result = wouldCreateCycle('iss_2', 'iss_1', existingDeps, issuesMap);
      expect(result.hasCycle).toBe(true);
      expect(result.cyclePath).toBeDefined();
    });

    it('detects transitive 3-node cycle (A -> B -> C, then C -> A)', () => {
      const existingDeps: Dependency[] = [
        {
          id: 'dep_1',
          upstreamIssueId: 'iss_1',
          downstreamIssueId: 'iss_2',
          createdAt: '2026-10-01',
          createdBy: 'usr_1',
        },
        {
          id: 'dep_2',
          upstreamIssueId: 'iss_2',
          downstreamIssueId: 'iss_3',
          createdAt: '2026-10-01',
          createdBy: 'usr_1',
        },
      ];

      // Attempting iss_3 BLOCKS iss_1
      const result = wouldCreateCycle('iss_3', 'iss_1', existingDeps, issuesMap);
      expect(result.hasCycle).toBe(true);
    });

    it('allows valid acyclic edges', () => {
      const existingDeps: Dependency[] = [
        {
          id: 'dep_1',
          upstreamIssueId: 'iss_1',
          downstreamIssueId: 'iss_2',
          createdAt: '2026-10-01',
          createdBy: 'usr_1',
        },
      ];

      // iss_1 also BLOCKS iss_3 (branching, perfectly acyclic)
      const result = wouldCreateCycle('iss_1', 'iss_3', existingDeps, issuesMap);
      expect(result.hasCycle).toBe(false);
    });
  });

  describe('Hard Completion Guard (validateHardCompletionGuard)', () => {
    it('blocks transition to DONE when upstream prerequisite is IN_PROGRESS', () => {
      const deps: Dependency[] = [
        {
          id: 'dep_1',
          upstreamIssueId: 'iss_1', // IN_PROGRESS
          downstreamIssueId: 'iss_2',
          createdAt: '2026-10-01',
          createdBy: 'usr_1',
        },
      ];

      const validation = validateHardCompletionGuard(issues[1], issues, deps);
      expect(validation.allowed).toBe(false);
      expect(validation.activeBlockers.length).toBe(1);
      expect(validation.activeBlockers[0].key).toBe('ENG-1');
      expect(validation.errorMessage).toContain('Cannot complete this issue');
    });

    it('allows transition to DONE when all upstream prerequisites are DONE or CANCELLED', () => {
      const resolvedIssues = issues.map(i =>
        i.id === 'iss_1' ? { ...i, state: 'DONE' as const } : i
      );

      const deps: Dependency[] = [
        {
          id: 'dep_1',
          upstreamIssueId: 'iss_1', // DONE (inactive blocker)
          downstreamIssueId: 'iss_2',
          createdAt: '2026-10-01',
          createdBy: 'usr_1',
        },
      ];

      const validation = validateHardCompletionGuard(resolvedIssues[1], resolvedIssues, deps);
      expect(validation.allowed).toBe(true);
      expect(validation.activeBlockers.length).toBe(0);
    });

    it('reports blocker status correctly via isUpstreamActivelyBlocking', () => {
      expect(isUpstreamActivelyBlocking('BACKLOG')).toBe(true);
      expect(isUpstreamActivelyBlocking('TODO')).toBe(true);
      expect(isUpstreamActivelyBlocking('IN_PROGRESS')).toBe(true);
      expect(isUpstreamActivelyBlocking('IN_REVIEW')).toBe(true);
      expect(isUpstreamActivelyBlocking('DONE')).toBe(false);
      expect(isUpstreamActivelyBlocking('CANCELLED')).toBe(false);
    });
  });

  describe('Lifecycle State Machine (canTransition)', () => {
    it('allows valid lifecycle transitions', () => {
      expect(canTransition('BACKLOG', 'TODO')).toBe(true);
      expect(canTransition('TODO', 'IN_PROGRESS')).toBe(true);
      expect(canTransition('IN_PROGRESS', 'IN_REVIEW')).toBe(true);
      expect(canTransition('IN_REVIEW', 'DONE')).toBe(true);
    });

    it('allows reopening DONE issues back to TODO', () => {
      expect(canTransition('DONE', 'TODO')).toBe(true);
      expect(canTransition('DONE', 'IN_PROGRESS')).toBe(false); // must reopen to TODO first
    });

    it('allows cancelling from non-DONE states', () => {
      expect(canTransition('TODO', 'CANCELLED')).toBe(true);
      expect(canTransition('IN_PROGRESS', 'CANCELLED')).toBe(true);
      expect(canTransition('IN_REVIEW', 'CANCELLED')).toBe(true);
    });
  });
});
