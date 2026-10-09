/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  buildNormalizedGraph,
  resolveEdges,
  filterDependencies,
  calculateDependencySummary,
  deriveIssueDependencyIntelligence,
  getBottlenecks,
  calculateLongestActiveChain,
  calculateCrossTeamMatrix,
  formatBlockerAge,
} from './selectors';
import { Issue, Dependency, Project, Team } from '../../types';
import { wouldCreateCycle } from '../../domain/dependency';

describe('UX-04: Dependency Intelligence & Graph Resolution', () => {
  const mockTeams: Team[] = [
    { id: 'team_inf', name: 'Infrastructure', key: 'INF', description: 'Core Infra', color: '#dd5b00' },
    { id: 'team_eng', name: 'Engineering', key: 'ENG', description: 'Product Eng', color: '#5645d4' },
    { id: 'team_web', name: 'Web Platform', key: 'WEB', description: 'Frontend', color: '#0f7b6c' },
  ];

  const mockProjects: Project[] = [
    { id: 'prj_plat', teamId: 'team_inf', name: 'Platform', key: 'PLAT', description: '', currentSequence: 10 },
    { id: 'prj_core', teamId: 'team_eng', name: 'Core Engine', key: 'CORE', description: '', currentSequence: 10 },
    { id: 'prj_web', teamId: 'team_web', name: 'Web App', key: 'WEB', description: '', currentSequence: 10 },
  ];

  const createIssue = (
    id: string,
    key: string,
    state: Issue['state'],
    teamId: string,
    projectId: string,
    title = 'Test Issue'
  ): Issue => ({
    id,
    key,
    title,
    description: '',
    state,
    priority: 'MEDIUM',
    projectId,
    teamId,
    creatorId: 'u1',
    version: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  });

  describe('59 & 60. Graph Resolution & Blocked Semantics', () => {
    it('correctly derives active vs resolved edges and blocked semantics', () => {
      const issueA = createIssue('iss_A', 'INF-1', 'IN_PROGRESS', 'team_inf', 'prj_plat');
      const issueB = createIssue('iss_B', 'ENG-1', 'TODO', 'team_eng', 'prj_core');
      const issueC = createIssue('iss_C', 'WEB-1', 'TODO', 'team_web', 'prj_web');

      const dep1: Dependency = {
        id: 'dep_1',
        upstreamIssueId: 'iss_A',
        downstreamIssueId: 'iss_B',
        createdAt: '2026-01-01T00:00:00Z',
        createdBy: 'u1',
      };

      const dep2: Dependency = {
        id: 'dep_2',
        upstreamIssueId: 'iss_B',
        downstreamIssueId: 'iss_C',
        createdAt: '2026-01-01T00:00:00Z',
        createdBy: 'u1',
      };

      const issues = [issueA, issueB, issueC];
      const dependencies = [dep1, dep2];

      const resolved = resolveEdges(dependencies, issues, mockProjects, mockTeams);
      expect(resolved).toHaveLength(2);

      // dep1 is active, cross-project, cross-team
      expect(resolved[0].isActive).toBe(true);
      expect(resolved[0].isResolved).toBe(false);
      expect(resolved[0].isCrossTeam).toBe(true);
      expect(resolved[0].isCrossProject).toBe(true);

      const intel = deriveIssueDependencyIntelligence(issues, dependencies, mockProjects, mockTeams);
      expect(intel.get('iss_A')?.isBlocked).toBe(false);
      expect(intel.get('iss_B')?.isBlocked).toBe(true);
      expect(intel.get('iss_B')?.activeUpstreamCount).toBe(1);
      expect(intel.get('iss_C')?.isBlocked).toBe(true);
      expect(intel.get('iss_C')?.activeUpstreamCount).toBe(1);
    });

    it('marks dependency inactive when upstream is DONE or CANCELLED, but relationship is persisted', () => {
      const issueA = createIssue('iss_A', 'INF-1', 'DONE', 'team_inf', 'prj_plat');
      const issueB = createIssue('iss_B', 'ENG-1', 'TODO', 'team_eng', 'prj_core');

      const dep: Dependency = {
        id: 'dep_1',
        upstreamIssueId: 'iss_A',
        downstreamIssueId: 'iss_B',
        createdAt: '2026-01-01T00:00:00Z',
        createdBy: 'u1',
      };

      const resolved = resolveEdges([dep], [issueA, issueB], mockProjects, mockTeams);
      expect(resolved).toHaveLength(1);
      expect(resolved[0].isActive).toBe(false);
      expect(resolved[0].isResolved).toBe(true);

      const intel = deriveIssueDependencyIntelligence([issueA, issueB], [dep], mockProjects, mockTeams);
      // Downstream is NOT blocked because upstream is DONE
      expect(intel.get('iss_B')?.isBlocked).toBe(false);
      expect(intel.get('iss_B')?.activeUpstreamCount).toBe(0);
      expect(intel.get('iss_B')?.resolvedUpstreamCount).toBe(1);
    });

    it('remains blocked if one upstream is resolved but another upstream is active', () => {
      const issueA = createIssue('iss_A', 'INF-1', 'DONE', 'team_inf', 'prj_plat');
      const issueB = createIssue('iss_B', 'ENG-1', 'IN_PROGRESS', 'team_eng', 'prj_core');
      const issueC = createIssue('iss_C', 'WEB-1', 'TODO', 'team_web', 'prj_web');

      const depA: Dependency = { id: 'dep_a', upstreamIssueId: 'iss_A', downstreamIssueId: 'iss_C', createdAt: '2026-01-01T00:00:00Z', createdBy: 'u1' };
      const depB: Dependency = { id: 'dep_b', upstreamIssueId: 'iss_B', downstreamIssueId: 'iss_C', createdAt: '2026-01-01T00:00:00Z', createdBy: 'u1' };

      const intel = deriveIssueDependencyIntelligence([issueA, issueB, issueC], [depA, depB], mockProjects, mockTeams);
      const cIntel = intel.get('iss_C');
      expect(cIntel?.isBlocked).toBe(true);
      expect(cIntel?.activeUpstreamCount).toBe(1);
      expect(cIntel?.resolvedUpstreamCount).toBe(1);
    });

    it('handles missing issue references safely without crashing', () => {
      const issueA = createIssue('iss_A', 'INF-1', 'IN_PROGRESS', 'team_inf', 'prj_plat');
      const depOrphan: Dependency = {
        id: 'dep_orphan',
        upstreamIssueId: 'iss_A',
        downstreamIssueId: 'iss_non_existent',
        createdAt: '2026-01-01T00:00:00Z',
        createdBy: 'u1',
      };

      const resolved = resolveEdges([depOrphan], [issueA], mockProjects, mockTeams);
      expect(resolved).toHaveLength(0); // Safely skipped
    });
  });

  describe('61. DAG Cycle Prevention (wouldCreateCycle)', () => {
    it('rejects self-edge', () => {
      const issuesMap = new Map([['iss_1', createIssue('iss_1', 'ENG-1', 'TODO', 'team_eng', 'prj_core')]]);
      const check = wouldCreateCycle('iss_1', 'iss_1', [], issuesMap);
      expect(check.hasCycle).toBe(true);
    });

    it('rejects duplicate and circular edges', () => {
      const issue1 = createIssue('iss_1', 'ENG-1', 'TODO', 'team_eng', 'prj_core');
      const issue2 = createIssue('iss_2', 'ENG-2', 'TODO', 'team_eng', 'prj_core');
      const issue3 = createIssue('iss_3', 'ENG-3', 'TODO', 'team_eng', 'prj_core');
      const issuesMap = new Map([[issue1.id, issue1], [issue2.id, issue2], [issue3.id, issue3]]);

      const existingDeps: Dependency[] = [
        { id: 'd1', upstreamIssueId: 'iss_1', downstreamIssueId: 'iss_2', createdAt: '2026-01-01T00:00:00Z', createdBy: 'u1' },
        { id: 'd2', upstreamIssueId: 'iss_2', downstreamIssueId: 'iss_3', createdAt: '2026-01-01T00:00:00Z', createdBy: 'u1' },
      ];

      // iss_3 -> iss_1 would create a 3-hop cycle
      const cycleCheck = wouldCreateCycle('iss_3', 'iss_1', existingDeps, issuesMap);
      expect(cycleCheck.hasCycle).toBe(true);

      // iss_4 -> iss_1 is valid (no cycle)
      const validCheck = wouldCreateCycle('iss_1', 'iss_3', existingDeps, issuesMap);
      // iss_1 -> iss_3 is a transitive edge, does not create a cycle
      expect(validCheck.hasCycle).toBe(false);
    });
  });

  describe('62. Diamond DAG Blast Radius & Deduplication', () => {
    it('deduplicates reachable downstream issues in diamond graphs: A -> B, A -> C, B -> D, C -> D', () => {
      const issueA = createIssue('iss_A', 'A', 'TODO', 'team_inf', 'prj_plat');
      const issueB = createIssue('iss_B', 'B', 'TODO', 'team_eng', 'prj_core');
      const issueC = createIssue('iss_C', 'C', 'TODO', 'team_web', 'prj_web');
      const issueD = createIssue('iss_D', 'D', 'TODO', 'team_eng', 'prj_core');

      const dependencies: Dependency[] = [
        { id: 'd1', upstreamIssueId: 'iss_A', downstreamIssueId: 'iss_B', createdAt: '2026-01-01T00:00:00Z', createdBy: 'u1' },
        { id: 'd2', upstreamIssueId: 'iss_A', downstreamIssueId: 'iss_C', createdAt: '2026-01-01T00:00:00Z', createdBy: 'u1' },
        { id: 'd3', upstreamIssueId: 'iss_B', downstreamIssueId: 'iss_D', createdAt: '2026-01-01T00:00:00Z', createdBy: 'u1' },
        { id: 'd4', upstreamIssueId: 'iss_C', downstreamIssueId: 'iss_D', createdAt: '2026-01-01T00:00:00Z', createdBy: 'u1' },
      ];

      const intel = deriveIssueDependencyIntelligence([issueA, issueB, issueC, issueD], dependencies, mockProjects, mockTeams);
      const aIntel = intel.get('iss_A');

      // Direct downstream count = 2 (B, C)
      expect(aIntel?.activeDownstreamCount).toBe(2);
      // Transitive blast radius must be EXACTLY 3 (B, C, D) — D must NOT be counted twice!
      expect(aIntel?.transitiveBlastRadius).toBe(3);
      expect(new Set(aIntel?.transitiveDownstreamIssueIds)).toEqual(new Set(['iss_B', 'iss_C', 'iss_D']));
    });

    it('does not count resolved downstream paths in active blast radius', () => {
      const issueA = createIssue('iss_A', 'A', 'TODO', 'team_inf', 'prj_plat');
      const issueB = createIssue('iss_B', 'B', 'DONE', 'team_eng', 'prj_core'); // Resolved
      const issueC = createIssue('iss_C', 'C', 'TODO', 'team_web', 'prj_web');

      const dependencies: Dependency[] = [
        { id: 'd1', upstreamIssueId: 'iss_A', downstreamIssueId: 'iss_B', createdAt: '2026-01-01T00:00:00Z', createdBy: 'u1' },
        { id: 'd2', upstreamIssueId: 'iss_B', downstreamIssueId: 'iss_C', createdAt: '2026-01-01T00:00:00Z', createdBy: 'u1' },
      ];

      const intel = deriveIssueDependencyIntelligence([issueA, issueB, issueC], dependencies, mockProjects, mockTeams);
      const aIntel = intel.get('iss_A');

      // A -> B is active (A is TODO), but B is DONE so B -> C is NOT active
      expect(aIntel?.transitiveBlastRadius).toBe(1); // Only B is blocked
    });
  });

  describe('63. Longest Active Chain (Critical Path based on depth)', () => {
    it('deterministically finds the longest active chain in the DAG', () => {
      const issueA = createIssue('iss_A', 'INF-1', 'TODO', 'team_inf', 'prj_plat');
      const issueB = createIssue('iss_B', 'ENG-1', 'TODO', 'team_eng', 'prj_core');
      const issueC = createIssue('iss_C', 'ENG-2', 'TODO', 'team_eng', 'prj_core');
      const issueD = createIssue('iss_D', 'ENG-3', 'TODO', 'team_eng', 'prj_core');
      const issueE = createIssue('iss_E', 'WEB-1', 'TODO', 'team_web', 'prj_web');

      // Path 1: A -> B -> C -> D (length 3 edges)
      // Path 2: A -> E (length 1 edge)
      const dependencies: Dependency[] = [
        { id: 'd1', upstreamIssueId: 'iss_A', downstreamIssueId: 'iss_B', createdAt: '2026-01-01T00:00:00Z', createdBy: 'u1' },
        { id: 'd2', upstreamIssueId: 'iss_B', downstreamIssueId: 'iss_C', createdAt: '2026-01-01T00:00:00Z', createdBy: 'u1' },
        { id: 'd3', upstreamIssueId: 'iss_C', downstreamIssueId: 'iss_D', createdAt: '2026-01-01T00:00:00Z', createdBy: 'u1' },
        { id: 'd4', upstreamIssueId: 'iss_A', downstreamIssueId: 'iss_E', createdAt: '2026-01-01T00:00:00Z', createdBy: 'u1' },
      ];

      const chain = calculateLongestActiveChain([issueA, issueB, issueC, issueD, issueE], dependencies);
      expect(chain.chainLength).toBe(3);
      expect(chain.orderedIssueKeys).toEqual(['INF-1', 'ENG-1', 'ENG-2', 'ENG-3']);
      expect(chain.activeEdgeIds).toHaveLength(3);
    });

    it('updates active chain when an intermediate issue becomes DONE', () => {
      const issueA = createIssue('iss_A', 'INF-1', 'TODO', 'team_inf', 'prj_plat');
      const issueB = createIssue('iss_B', 'ENG-1', 'DONE', 'team_eng', 'prj_core'); // RESOLVED!
      const issueC = createIssue('iss_C', 'ENG-2', 'TODO', 'team_eng', 'prj_core');
      const issueD = createIssue('iss_D', 'ENG-3', 'TODO', 'team_eng', 'prj_core');
      const issueE = createIssue('iss_E', 'WEB-1', 'TODO', 'team_web', 'prj_web');

      const dependencies: Dependency[] = [
        { id: 'd1', upstreamIssueId: 'iss_A', downstreamIssueId: 'iss_B', createdAt: '2026-01-01T00:00:00Z', createdBy: 'u1' },
        { id: 'd2', upstreamIssueId: 'iss_B', downstreamIssueId: 'iss_C', createdAt: '2026-01-01T00:00:00Z', createdBy: 'u1' },
        { id: 'd3', upstreamIssueId: 'iss_C', downstreamIssueId: 'iss_D', createdAt: '2026-01-01T00:00:00Z', createdBy: 'u1' },
        { id: 'd4', upstreamIssueId: 'iss_A', downstreamIssueId: 'iss_E', createdAt: '2026-01-01T00:00:00Z', createdBy: 'u1' },
      ];

      const chain = calculateLongestActiveChain([issueA, issueB, issueC, issueD, issueE], dependencies);
      // Since B is DONE, B -> C is inactive. The active chains are:
      // A -> E (length 1)
      // A -> B (length 1)
      // C -> D (length 1)
      expect(chain.chainLength).toBe(1);
    });
  });

  describe('64. Cross-Team Matrix Aggregation', () => {
    it('aggregates active cross-team edges and excludes same-team edges from cell counts', () => {
      const issueInf = createIssue('iss_inf', 'INF-1', 'TODO', 'team_inf', 'prj_plat');
      const issueEng1 = createIssue('iss_eng1', 'ENG-1', 'TODO', 'team_eng', 'prj_core');
      const issueEng2 = createIssue('iss_eng2', 'ENG-2', 'TODO', 'team_eng', 'prj_core');

      // 1 cross-team edge (INF -> ENG-1)
      // 1 same-team edge (ENG-1 -> ENG-2)
      const dep1: Dependency = { id: 'd1', upstreamIssueId: 'iss_inf', downstreamIssueId: 'iss_eng1', createdAt: '2026-01-01T00:00:00Z', createdBy: 'u1' };
      const dep2: Dependency = { id: 'd2', upstreamIssueId: 'iss_eng1', downstreamIssueId: 'iss_eng2', createdAt: '2026-01-01T00:00:00Z', createdBy: 'u1' };

      const resolved = resolveEdges([dep1, dep2], [issueInf, issueEng1, issueEng2], mockProjects, mockTeams);
      const matrixData = calculateCrossTeamMatrix(mockTeams, resolved);

      expect(matrixData.totalCrossTeamActiveEdges).toBe(1);

      // Check INF -> ENG cell
      const infRow = matrixData.matrix.get('team_inf');
      const infToEngCell = infRow?.get('team_eng');
      expect(infToEngCell?.activeEdgeCount).toBe(1);
      expect(infToEngCell?.matchingEdges).toHaveLength(1);

      // Check ENG -> ENG cell (diagonal)
      const engRow = matrixData.matrix.get('team_eng');
      const engToEngCell = engRow?.get('team_eng');
      expect(engToEngCell?.activeEdgeCount).toBe(0); // Excluded!
    });
  });

  describe('65. Filters & Honest Blocker Age', () => {
    it('filters dependencies by search query matching either upstream or downstream', () => {
      const issueA = createIssue('iss_A', 'INF-42', 'TODO', 'team_inf', 'prj_plat', 'Database Migration');
      const issueB = createIssue('iss_B', 'ENG-142', 'TODO', 'team_eng', 'prj_core', 'User Authentication');

      const dep: Dependency = { id: 'd1', upstreamIssueId: 'iss_A', downstreamIssueId: 'iss_B', createdAt: '2026-01-01T00:00:00Z', createdBy: 'u1' };
      const resolved = resolveEdges([dep], [issueA, issueB], mockProjects, mockTeams);

      // Search upstream title
      const filteredByUpTitle = filterDependencies(resolved, {
        view: 'graph',
        status: 'active',
        team: 'ALL',
        project: 'ALL',
        crossTeamOnly: false,
        scope: 'all',
        q: 'Database',
      });
      expect(filteredByUpTitle).toHaveLength(1);

      // Search downstream key
      const filteredByDownKey = filterDependencies(resolved, {
        view: 'graph',
        status: 'active',
        team: 'ALL',
        project: 'ALL',
        crossTeamOnly: false,
        scope: 'all',
        q: 'ENG-142',
      });
      expect(filteredByDownKey).toHaveLength(1);
    });

    it('formats honest blocker age without throwing or fabricating', () => {
      const ageNow = formatBlockerAge(new Date().toISOString());
      expect(ageNow).toBe('<1m');

      const agePast = formatBlockerAge(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString());
      expect(agePast).toBe('5d');

      const invalidAge = formatBlockerAge('invalid-date');
      expect(invalidAge).toBe('—');
    });
  });
});
