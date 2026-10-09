/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  resolveEdges,
  deriveIssueDependencyIntelligence,
  computeTransitiveDownstreamIds,
  getBottlenecks,
  calculateLongestActiveChain,
  calculateCrossTeamMatrix,
  filterDependencies,
  calculateDependencySummary,
  formatBlockerAge,
  buildNormalizedGraph,
} from './selectors';
import { Issue, Dependency, Project, Team } from '../../types';

describe('UX-04: Dependency Intelligence Selectors', () => {
  // Test fixture setup
  const mockTeams: Team[] = [
    { id: 'team_inf', name: 'Infrastructure', key: 'INF', color: '#dd5b00', description: '' },
    { id: 'team_eng', name: 'Core Engine', key: 'ENG', color: '#5645d4', description: '' },
    { id: 'team_web', name: 'Web Platform', key: 'WEB', color: '#0075de', description: '' },
  ];

  const mockProjects: Project[] = [
    { id: 'proj_inf', teamId: 'team_inf', name: 'Database Scaling', key: 'INF', description: '', currentSequence: 1 },
    { id: 'proj_eng_auth', teamId: 'team_eng', name: 'Auth Core', key: 'ENG', description: '', currentSequence: 1 },
    { id: 'proj_eng_perf', teamId: 'team_eng', name: 'Performance', key: 'PERF', description: '', currentSequence: 1 },
    { id: 'proj_web', teamId: 'team_web', name: 'Web App', key: 'WEB', description: '', currentSequence: 1 },
  ];

  const makeIssue = (id: string, key: string, teamId: string, projectId: string, state: Issue['state'] = 'IN_PROGRESS'): Issue => ({
    id,
    key,
    teamId,
    projectId,
    title: `Issue ${key}`,
    description: '',
    state,
    priority: 'HIGH',
    creatorId: 'u1',
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
    version: 1,
  });

  const makeDep = (id: string, upstreamId: string, downstreamId: string, createdAt = '2026-10-02T10:00:00Z'): Dependency => ({
    id,
    upstreamIssueId: upstreamId,
    downstreamIssueId: downstreamId,
    createdAt,
    createdBy: 'u1',
  });

  describe('1. Edge Resolution & Boundary Rules', () => {
    it('resolves active and resolved edges correctly', () => {
      const issues = [
        makeIssue('i1', 'INF-1', 'team_inf', 'proj_inf', 'IN_PROGRESS'),
        makeIssue('i2', 'ENG-1', 'team_eng', 'proj_eng_auth', 'TODO'),
        makeIssue('i3', 'WEB-1', 'team_web', 'proj_web', 'TODO'),
        makeIssue('i4', 'ENG-2', 'team_eng', 'proj_eng_auth', 'DONE'),
      ];

      const deps = [
        makeDep('d1', 'i1', 'i2'), // INF-1 (IN_PROGRESS) -> ENG-1 (active, cross-team, cross-project)
        makeDep('d2', 'i4', 'i3'), // ENG-2 (DONE) -> WEB-1 (resolved, cross-team, cross-project)
      ];

      const edges = resolveEdges(deps, issues, mockProjects, mockTeams);
      expect(edges).toHaveLength(2);

      expect(edges[0].isActive).toBe(true);
      expect(edges[0].isResolved).toBe(false);
      expect(edges[0].isCrossTeam).toBe(true);
      expect(edges[0].isCrossProject).toBe(true);
      expect(edges[0].upstreamTeam?.key).toBe('INF');
      expect(edges[0].downstreamTeam?.key).toBe('ENG');

      expect(edges[1].isActive).toBe(false);
      expect(edges[1].isResolved).toBe(true);
      expect(edges[1].isCrossTeam).toBe(true);
    });

    it('distinguishes cross-project within same team', () => {
      const issues = [
        makeIssue('i1', 'ENG-1', 'team_eng', 'proj_eng_auth'),
        makeIssue('i2', 'PERF-1', 'team_eng', 'proj_eng_perf'),
      ];
      const deps = [makeDep('d1', 'i1', 'i2')];

      const edges = resolveEdges(deps, issues, mockProjects, mockTeams);
      expect(edges[0].isCrossTeam).toBe(false); // Same team
      expect(edges[0].isCrossProject).toBe(true); // Different projects
    });

    it('safely skips edges referencing missing issues', () => {
      const issues = [makeIssue('i1', 'INF-1', 'team_inf', 'proj_inf')];
      const deps = [makeDep('d1', 'i1', 'missing_id')];

      const edges = resolveEdges(deps, issues, mockProjects, mockTeams);
      expect(edges).toHaveLength(0);
    });
  });

  describe('2. Blocked Semantics & Derivation', () => {
    it('treats issue as blocked iff active upstream count > 0', () => {
      const issues = [
        makeIssue('i1', 'INF-1', 'team_inf', 'proj_inf', 'IN_PROGRESS'),
        makeIssue('i2', 'ENG-1', 'team_eng', 'proj_eng_auth', 'DONE'),
        makeIssue('i3', 'WEB-1', 'team_web', 'proj_web', 'TODO'),
        makeIssue('i4', 'WEB-2', 'team_web', 'proj_web', 'TODO'),
      ];

      const deps = [
        makeDep('d1', 'i1', 'i3'), // Active upstream -> WEB-1 is blocked
        makeDep('d2', 'i2', 'i4'), // Resolved upstream -> WEB-2 is NOT blocked
      ];

      const intel = deriveIssueDependencyIntelligence(issues, deps, mockProjects, mockTeams);

      expect(intel.get('i3')?.isBlocked).toBe(true);
      expect(intel.get('i3')?.activeUpstreamCount).toBe(1);

      expect(intel.get('i4')?.isBlocked).toBe(false);
      expect(intel.get('i4')?.activeUpstreamCount).toBe(0);
      expect(intel.get('i4')?.resolvedUpstreamCount).toBe(1);
    });

    it('remains blocked if at least one upstream is active even if another is resolved', () => {
      const issues = [
        makeIssue('i1', 'INF-1', 'team_inf', 'proj_inf', 'IN_PROGRESS'),
        makeIssue('i2', 'ENG-1', 'team_eng', 'proj_eng_auth', 'DONE'),
        makeIssue('i3', 'WEB-1', 'team_web', 'proj_web', 'TODO'),
      ];

      const deps = [
        makeDep('d1', 'i1', 'i3'), // active
        makeDep('d2', 'i2', 'i3'), // resolved
      ];

      const intel = deriveIssueDependencyIntelligence(issues, deps, mockProjects, mockTeams);
      const webIntel = intel.get('i3')!;

      expect(webIntel.isBlocked).toBe(true);
      expect(webIntel.activeUpstreamCount).toBe(1);
      expect(webIntel.resolvedUpstreamCount).toBe(1);
    });
  });

  describe('3. Transitive Blast Radius (Diamond DAG Deduplication)', () => {
    it('deduplicates convergent downstream paths in diamond graph', () => {
      // A -> B -> D
      // A -> C -> D
      const issues = [
        makeIssue('a', 'A', 'team_eng', 'proj_eng_auth', 'IN_PROGRESS'),
        makeIssue('b', 'B', 'team_eng', 'proj_eng_auth', 'TODO'),
        makeIssue('c', 'C', 'team_eng', 'proj_eng_auth', 'TODO'),
        makeIssue('d', 'D', 'team_eng', 'proj_eng_auth', 'TODO'),
      ];

      const deps = [
        makeDep('d1', 'a', 'b'),
        makeDep('d2', 'a', 'c'),
        makeDep('d3', 'b', 'd'),
        makeDep('d4', 'c', 'd'),
      ];

      const { activeOutgoingByIssueId } = buildNormalizedGraph(issues, deps);
      const downstreamIds = computeTransitiveDownstreamIds('a', activeOutgoingByIssueId);

      // Should visit B, C, D exactly once
      expect(downstreamIds).toHaveLength(3);
      expect(new Set(downstreamIds)).toEqual(new Set(['b', 'c', 'd']));
    });

    it('does not traverse through resolved dependencies into active blast radius', () => {
      // A (IN_PROGRESS) -> B (DONE) -> C (TODO)
      // Since edge B->C is inactive (B is DONE), A does not transitively block C through an active chain
      const issues = [
        makeIssue('a', 'A', 'team_eng', 'proj_eng_auth', 'IN_PROGRESS'),
        makeIssue('b', 'B', 'team_eng', 'proj_eng_auth', 'DONE'),
        makeIssue('c', 'C', 'team_eng', 'proj_eng_auth', 'TODO'),
      ];

      const deps = [
        makeDep('d1', 'a', 'b'),
        makeDep('d2', 'b', 'c'),
      ];

      const { activeOutgoingByIssueId } = buildNormalizedGraph(issues, deps);
      const downstreamIds = computeTransitiveDownstreamIds('a', activeOutgoingByIssueId);

      // a -> b is active because a is IN_PROGRESS. But b is DONE, so b has no active outgoing edges.
      expect(downstreamIds).toEqual(['b']);
    });
  });

  describe('4. Deterministic Bottleneck Ranking', () => {
    it('ranks bottlenecks primarily by active transitive blast radius, then affected teams/projects, then key', () => {
      const issues = [
        makeIssue('i1', 'INF-1', 'team_inf', 'proj_inf', 'IN_PROGRESS'),
        makeIssue('i2', 'ENG-1', 'team_eng', 'proj_eng_auth', 'TODO'),
        makeIssue('i3', 'WEB-1', 'team_web', 'proj_web', 'TODO'),
        makeIssue('i4', 'WEB-2', 'team_web', 'proj_web', 'TODO'),
      ];

      // i1 blocks i2 -> i3 (radius 2, across 2 other teams)
      // i2 blocks i3 (radius 1)
      const deps = [
        makeDep('d1', 'i1', 'i2'),
        makeDep('d2', 'i2', 'i3'),
      ];

      const bottlenecks = getBottlenecks(issues, deps, mockProjects, mockTeams, 5);

      expect(bottlenecks).toHaveLength(2);
      expect(bottlenecks[0].issue.key).toBe('INF-1');
      expect(bottlenecks[0].transitiveBlastRadius).toBe(2);
      expect(bottlenecks[0].affectedTeamCount).toBe(2);

      expect(bottlenecks[1].issue.key).toBe('ENG-1');
      expect(bottlenecks[1].transitiveBlastRadius).toBe(1);
    });
  });

  describe('5. Longest Active Chain (Critical Chain)', () => {
    it('finds the longest active dependency chain deterministically', () => {
      // Chain 1: A -> B -> C (depth 2)
      // Chain 2: X -> Y -> Z -> W (depth 3)
      const issues = [
        makeIssue('a', 'A', 'team_eng', 'proj_eng_auth', 'TODO'),
        makeIssue('b', 'B', 'team_eng', 'proj_eng_auth', 'TODO'),
        makeIssue('c', 'C', 'team_eng', 'proj_eng_auth', 'TODO'),
        makeIssue('x', 'X', 'team_inf', 'proj_inf', 'IN_PROGRESS'),
        makeIssue('y', 'Y', 'team_inf', 'proj_inf', 'TODO'),
        makeIssue('z', 'Z', 'team_inf', 'proj_inf', 'TODO'),
        makeIssue('w', 'W', 'team_inf', 'proj_inf', 'TODO'),
      ];

      const deps = [
        makeDep('d1', 'a', 'b'),
        makeDep('d2', 'b', 'c'),
        makeDep('d3', 'x', 'y'),
        makeDep('d4', 'y', 'z'),
        makeDep('d5', 'z', 'w'),
      ];

      const result = calculateLongestActiveChain(issues, deps);

      expect(result.chainLength).toBe(3);
      expect(result.orderedIssueKeys).toEqual(['X', 'Y', 'Z', 'W']);
      expect(result.activeEdgeIds).toEqual(['d3', 'd4', 'd5']);
    });

    it('returns empty chain when no active dependency edges exist', () => {
      const issues = [
        makeIssue('a', 'A', 'team_eng', 'proj_eng_auth', 'DONE'),
        makeIssue('b', 'B', 'team_eng', 'proj_eng_auth', 'DONE'),
      ];
      const deps = [makeDep('d1', 'a', 'b')]; // resolved

      const result = calculateLongestActiveChain(issues, deps);
      expect(result.chainLength).toBe(0);
      expect(result.orderedIssueKeys).toEqual([]);
    });
  });

  describe('6. Cross-Team Matrix Aggregation', () => {
    it('excludes same-team edges and counts active cross-team relationships', () => {
      const issues = [
        makeIssue('inf1', 'INF-1', 'team_inf', 'proj_inf', 'IN_PROGRESS'),
        makeIssue('inf2', 'INF-2', 'team_inf', 'proj_inf', 'IN_PROGRESS'),
        makeIssue('eng1', 'ENG-1', 'team_eng', 'proj_eng_auth', 'TODO'),
        makeIssue('eng2', 'ENG-2', 'team_eng', 'proj_eng_auth', 'TODO'),
        makeIssue('web1', 'WEB-1', 'team_web', 'proj_web', 'TODO'),
      ];

      const deps = [
        makeDep('d1', 'inf1', 'inf2'), // SAME TEAM INF -> INF (must be excluded from cross-team matrix)
        makeDep('d2', 'inf1', 'eng1'), // Cross INF -> ENG
        makeDep('d3', 'inf2', 'eng1'), // Cross INF -> ENG
        makeDep('d4', 'eng1', 'web1'), // Cross ENG -> WEB
      ];

      const resolved = resolveEdges(deps, issues, mockProjects, mockTeams);
      const matrixData = calculateCrossTeamMatrix(mockTeams, resolved);

      expect(matrixData.totalCrossTeamActiveEdges).toBe(3);

      const infRow = matrixData.matrix.get('team_inf')!;
      const infToEng = infRow.get('team_eng')!;
      expect(infToEng.activeEdgeCount).toBe(2);
      expect(infToEng.matchingEdges).toHaveLength(2);
      expect(infToEng.blockedIssueCount).toBe(1); // eng1 blocked by 2 items

      const infToWeb = infRow.get('team_web')!;
      expect(infToWeb.activeEdgeCount).toBe(0);

      const engRow = matrixData.matrix.get('team_eng')!;
      const engToWeb = engRow.get('team_web')!;
      expect(engToWeb.activeEdgeCount).toBe(1);
    });
  });

  describe('7. Dependency Filters & Search', () => {
    it('filters by status, scope, and text search across either upstream or downstream', () => {
      const issues = [
        makeIssue('i1', 'INF-1', 'team_inf', 'proj_inf', 'IN_PROGRESS'),
        makeIssue('i2', 'ENG-142', 'team_eng', 'proj_eng_auth', 'TODO'),
        makeIssue('i3', 'ENG-143', 'team_eng', 'proj_eng_auth', 'DONE'),
        makeIssue('i4', 'WEB-81', 'team_web', 'proj_web', 'TODO'),
      ];

      const deps = [
        makeDep('d1', 'i1', 'i2'), // INF-1 -> ENG-142 (active, cross-team)
        makeDep('d2', 'i3', 'i4'), // ENG-143 -> WEB-81 (resolved, cross-team)
      ];

      const resolved = resolveEdges(deps, issues, mockProjects, mockTeams);

      // Search matches downstream key
      const searchDownstream = filterDependencies(resolved, {
        view: 'blockers',
        team: 'ALL',
        project: 'ALL',
        status: 'all',
        crossTeamOnly: false,
        scope: 'all',
        q: '142',
      });
      expect(searchDownstream).toHaveLength(1);
      expect(searchDownstream[0].dependencyId).toBe('d1');

      // Search matches upstream key
      const searchUpstream = filterDependencies(resolved, {
        view: 'blockers',
        team: 'ALL',
        project: 'ALL',
        status: 'all',
        crossTeamOnly: false,
        scope: 'all',
        q: 'INF',
      });
      expect(searchUpstream).toHaveLength(1);
      expect(searchUpstream[0].dependencyId).toBe('d1');

      // Filter by active status
      const activeOnly = filterDependencies(resolved, {
        view: 'blockers',
        team: 'ALL',
        project: 'ALL',
        status: 'active',
        crossTeamOnly: false,
        scope: 'all',
        q: '',
      });
      expect(activeOnly).toHaveLength(1);
      expect(activeOnly[0].isActive).toBe(true);

      // Filter by resolved status
      const resolvedOnly = filterDependencies(resolved, {
        view: 'blockers',
        team: 'ALL',
        project: 'ALL',
        status: 'resolved',
        crossTeamOnly: false,
        scope: 'all',
        q: '',
      });
      expect(resolvedOnly).toHaveLength(1);
      expect(resolvedOnly[0].isResolved).toBe(true);
    });
  });

  describe('8. Summary Metrics Calculation', () => {
    it('aggregates metrics deterministically', () => {
      const issues = [
        makeIssue('i1', 'INF-1', 'team_inf', 'proj_inf', 'IN_PROGRESS'),
        makeIssue('i2', 'ENG-1', 'team_eng', 'proj_eng_auth', 'TODO'),
        makeIssue('i3', 'WEB-1', 'team_web', 'proj_web', 'TODO'),
      ];

      const deps = [
        makeDep('d1', 'i1', 'i2'),
        makeDep('d2', 'i2', 'i3'),
      ];

      const resolved = resolveEdges(deps, issues, mockProjects, mockTeams);
      const bottlenecks = getBottlenecks(issues, deps, mockProjects, mockTeams);
      const chain = calculateLongestActiveChain(issues, deps);

      const summary = calculateDependencySummary(issues, resolved, bottlenecks, chain);

      expect(summary.activeEdgesCount).toBe(2);
      expect(summary.blockedIssuesCount).toBe(2);
      expect(summary.crossTeamActiveEdgesCount).toBe(2);
      expect(summary.longestActiveChainDepth).toBe(2);
    });
  });

  describe('9. Honest Blocker Age Formatting', () => {
    it('formats age correctly from dependency createdAt', () => {
      const baseTime = new Date('2026-10-05T12:00:00Z');

      expect(formatBlockerAge('2026-10-05T11:59:30Z', baseTime)).toBe('<1m');
      expect(formatBlockerAge('2026-10-05T11:45:00Z', baseTime)).toBe('15m');
      expect(formatBlockerAge('2026-10-05T08:00:00Z', baseTime)).toBe('4h');
      expect(formatBlockerAge('2026-10-02T12:00:00Z', baseTime)).toBe('3d');
    });
  });
});
