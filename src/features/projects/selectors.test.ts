/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  resolveProject,
  selectProjectDirectory,
  selectProjectIssues,
  selectProjectOverview,
  selectProjectBoard,
} from './selectors';
import { Project, Team, Issue, Dependency, Cycle, Milestone } from '../../types';

describe('Projects Pure Selectors', () => {
  const mockTeams: Team[] = [
    {
      id: 'team_eng',
      name: 'Core Platform',
      key: 'ENG',
      color: '#5645d4',
      description: 'Core execution',
    },
    {
      id: 'team_web',
      name: 'Web & Apps',
      key: 'WEB',
      color: '#2a9d99',
      description: 'Frontend client',
    },
  ];

  const mockProjects: Project[] = [
    {
      id: 'proj_eng',
      name: 'Authentication V2',
      key: 'ENG',
      teamId: 'team_eng',
      description: 'Session tokens & OAuth',
      currentSequence: 5,
    },
    {
      id: 'proj_web',
      name: 'Client App V1',
      key: 'WEB',
      teamId: 'team_web',
      description: 'Web interfaces',
      currentSequence: 3,
    },
  ];

  const mockIssues: Issue[] = [
    {
      id: 'iss_eng_1',
      key: 'ENG-1',
      projectId: 'proj_eng',
      teamId: 'team_eng',
      title: 'OAuth rotation worker',
      description: 'Implement OAuth refresh token rotation worker.',
      state: 'IN_PROGRESS',
      priority: 'HIGH',
      assigneeId: 'usr_sarah',
      creatorId: 'usr_sarah',
      createdAt: '2026-10-01T10:00:00.000Z',
      updatedAt: '2026-10-02T12:00:00.000Z',
      version: 1,
    },
    {
      id: 'iss_eng_2',
      key: 'ENG-2',
      projectId: 'proj_eng',
      teamId: 'team_eng',
      title: 'Database connection pools',
      description: 'Tune postgresql pool sizes and timeouts.',
      state: 'TODO',
      priority: 'URGENT',
      assigneeId: 'usr_david',
      creatorId: 'usr_sarah',
      createdAt: '2026-10-01T11:00:00.000Z',
      updatedAt: '2026-10-03T14:00:00.000Z',
      version: 1,
    },
    {
      id: 'iss_eng_3',
      key: 'ENG-3',
      projectId: 'proj_eng',
      teamId: 'team_eng',
      title: 'Legacy session deprecation',
      description: 'Drop support for legacy session tokens.',
      state: 'DONE',
      priority: 'LOW',
      assigneeId: 'usr_sarah',
      creatorId: 'usr_sarah',
      createdAt: '2026-10-01T09:00:00.000Z',
      updatedAt: '2026-10-04T15:00:00.000Z',
      version: 1,
    },
    // Cross-project issue in WEB
    {
      id: 'iss_web_1',
      key: 'WEB-1',
      projectId: 'proj_web',
      teamId: 'team_web',
      title: 'Web login modal',
      description: 'Build web login modal UI.',
      state: 'TODO',
      priority: 'HIGH',
      assigneeId: 'usr_marcus',
      creatorId: 'usr_sarah',
      createdAt: '2026-10-01T13:00:00.000Z',
      updatedAt: '2026-10-02T16:00:00.000Z',
      version: 1,
    },
  ];

  // Dependencies:
  // ENG-1 BLOCKS ENG-2 (intra-project blocker)
  // ENG-1 BLOCKS WEB-1 (cross-project blocker!)
  const mockDependencies: Dependency[] = [
    {
      id: 'dep_1',
      upstreamIssueId: 'iss_eng_1',
      downstreamIssueId: 'iss_eng_2',
      createdAt: '2026-10-01T12:00:00.000Z',
      createdBy: 'usr_sarah',
    },
    {
      id: 'dep_2',
      upstreamIssueId: 'iss_eng_1',
      downstreamIssueId: 'iss_web_1',
      createdAt: '2026-10-01T14:00:00.000Z',
      createdBy: 'usr_sarah',
    },
  ];

  describe('resolveProject', () => {
    it('resolves project by uppercase key', () => {
      const proj = resolveProject(mockProjects, 'ENG');
      expect(proj?.id).toBe('proj_eng');
    });

    it('resolves project by lowercase key', () => {
      const proj = resolveProject(mockProjects, 'eng');
      expect(proj?.id).toBe('proj_eng');
    });

    it('resolves project by ID', () => {
      const proj = resolveProject(mockProjects, 'proj_web');
      expect(proj?.key).toBe('WEB');
    });

    it('returns undefined for non-existent project', () => {
      const proj = resolveProject(mockProjects, 'NON_EXISTENT');
      expect(proj).toBeUndefined();
    });
  });

  describe('selectProjectDirectory', () => {
    it('computes issue counts, blocked counts, and progress per project', () => {
      const dir = selectProjectDirectory(mockProjects, mockTeams, mockIssues, mockDependencies);
      expect(dir.length).toBe(2);

      const eng = dir.find(d => d.project.key === 'ENG');
      expect(eng).toBeDefined();
      expect(eng?.totalIssuesCount).toBe(3);
      expect(eng?.activeIssuesCount).toBe(2);
      expect(eng?.completedIssuesCount).toBe(1);
      // ENG-2 is blocked by ENG-1
      expect(eng?.blockedIssuesCount).toBe(1);
      // ENG-1 blocks ENG-2 and WEB-1
      expect(eng?.blockingOthersCount).toBe(1);
      expect(eng?.progressPercent).toBe(33); // 1 / 3
    });

    it('filters directory by search query', () => {
      const filtered = selectProjectDirectory(
        mockProjects,
        mockTeams,
        mockIssues,
        mockDependencies,
        [],
        [],
        [],
        { searchQuery: 'Authentication' }
      );
      expect(filtered.length).toBe(1);
      expect(filtered[0].project.key).toBe('ENG');
    });

    it('filters directory by HAS_BLOCKERS status', () => {
      const filtered = selectProjectDirectory(
        mockProjects,
        mockTeams,
        mockIssues,
        mockDependencies,
        [],
        [],
        [],
        { statusFilter: 'HAS_BLOCKERS' }
      );
      // ENG has blocked issue ENG-2, WEB has blocked issue WEB-1
      expect(filtered.map(d => d.project.key)).toContain('ENG');
      expect(filtered.map(d => d.project.key)).toContain('WEB');
    });
  });

  describe('selectProjectIssues & Cross-Project Dependencies', () => {
    it('scopes issues strictly to the project without truncating cross-project blocker truth', () => {
      const webProject = mockProjects[1]; // WEB
      const { filteredIssues, blockerStatusMap } = selectProjectIssues(
        webProject,
        mockIssues,
        mockDependencies
      );

      // Only WEB issues returned
      expect(filteredIssues.length).toBe(1);
      expect(filteredIssues[0].key).toBe('WEB-1');

      // CRUCIAL: WEB-1 is blocked by ENG-1 (external to WEB project).
      // Blocker truth MUST be preserved!
      const web1Blocker = blockerStatusMap.get('iss_web_1');
      expect(web1Blocker?.isBlocked).toBe(true);
      expect(web1Blocker?.activeBlockers.map(u => u.key)).toContain('ENG-1');
    });

    it('supports search syntax is:blocked and is:unblocked', () => {
      const engProject = mockProjects[0];
      const blockedResult = selectProjectIssues(
        engProject,
        mockIssues,
        mockDependencies,
        [],
        [],
        [],
        { searchQuery: 'is:blocked' }
      );
      expect(blockedResult.filteredIssues.map(i => i.key)).toEqual(['ENG-2']);

      const unblockedResult = selectProjectIssues(
        engProject,
        mockIssues,
        mockDependencies,
        [],
        [],
        [],
        { searchQuery: 'is:unblocked' }
      );
      expect(unblockedResult.filteredIssues.map(i => i.key)).toContain('ENG-1');
      expect(unblockedResult.filteredIssues.map(i => i.key)).toContain('ENG-3');
    });

    it('supports search syntax is:blocker and has:downstream', () => {
      const engProject = mockProjects[0];
      const blockerResult = selectProjectIssues(
        engProject,
        mockIssues,
        mockDependencies,
        [],
        [],
        [],
        { searchQuery: 'is:blocker' }
      );
      // ENG-1 actively blocks ENG-2 and WEB-1
      expect(blockerResult.filteredIssues.map(i => i.key)).toEqual(['ENG-1']);

      const downstreamResult = selectProjectIssues(
        engProject,
        mockIssues,
        mockDependencies,
        [],
        [],
        [],
        { searchQuery: 'has:downstream' }
      );
      expect(downstreamResult.filteredIssues.map(i => i.key)).toEqual(['ENG-1']);
    });

    it('supports search syntax priority: and state: and team:', () => {
      const engProject = mockProjects[0];
      const priResult = selectProjectIssues(
        engProject,
        mockIssues,
        mockDependencies,
        [],
        [],
        [],
        { searchQuery: 'priority:urgent' }
      );
      expect(priResult.filteredIssues.map(i => i.key)).toEqual(['ENG-2']);

      const stateResult = selectProjectIssues(
        engProject,
        mockIssues,
        mockDependencies,
        [],
        [],
        [],
        { searchQuery: 'state:done' }
      );
      expect(stateResult.filteredIssues.map(i => i.key)).toEqual(['ENG-3']);

      const teamResult = selectProjectIssues(
        engProject,
        mockIssues,
        mockDependencies,
        [],
        [],
        [],
        { searchQuery: 'team:eng' }
      );
      expect(teamResult.filteredIssues.length).toBe(3);
    });

    it('sorts issues deterministically by priority', () => {
      const engProject = mockProjects[0];
      const { filteredIssues } = selectProjectIssues(
        engProject,
        mockIssues,
        mockDependencies,
        [],
        [],
        [],
        { sort: 'priority' }
      );

      // URGENT (ENG-2) > HIGH (ENG-1) > LOW (ENG-3)
      expect(filteredIssues.map(i => i.key)).toEqual(['ENG-2', 'ENG-1', 'ENG-3']);
    });

    it('groups issues by lifecycle state in canonical order', () => {
      const engProject = mockProjects[0];
      const { groupedIssues } = selectProjectIssues(
        engProject,
        mockIssues,
        mockDependencies,
        [],
        [],
        [],
        { group: 'state' }
      );

      const groupIds = groupedIssues.map(g => g.id);
      expect(groupIds).toContain('TODO');
      expect(groupIds).toContain('IN_PROGRESS');
      expect(groupIds).toContain('DONE');

      const todoGroup = groupedIssues.find(g => g.id === 'TODO');
      expect(todoGroup?.issues.map(i => i.key)).toContain('ENG-2');
    });

    it('groups issues by priority', () => {
      const engProject = mockProjects[0];
      const { groupedIssues } = selectProjectIssues(
        engProject,
        mockIssues,
        mockDependencies,
        [],
        [],
        [],
        { group: 'priority' }
      );

      const groupIds = groupedIssues.map(g => g.id);
      expect(groupIds).toContain('URGENT');
      expect(groupIds).toContain('HIGH');
      expect(groupIds).toContain('LOW');

      const urgentGroup = groupedIssues.find(g => g.id === 'URGENT');
      expect(urgentGroup?.issues.map(i => i.key)).toEqual(['ENG-2']);
    });
  });

  describe('selectProjectOverview', () => {
    it('categorizes issues into Needs Attention, Active Execution, and Blocking Others', () => {
      const engProject = mockProjects[0];
      const overview = selectProjectOverview(
        engProject,
        mockIssues,
        mockDependencies
      );

      // ENG-2 is blocked and URGENT -> Needs Attention
      expect(overview.needsAttention.map(i => i.key)).toContain('ENG-2');

      // ENG-1 is IN_PROGRESS -> Active Execution
      expect(overview.activeExecution.map(i => i.key)).toContain('ENG-1');

      // ENG-1 blocks downstream tasks (ENG-2 and WEB-1) -> Blocking Others
      expect(overview.blockingOthers.map(b => b.issue.key)).toContain('ENG-1');
      const eng1Downstream = overview.blockingOthers.find(b => b.issue.key === 'ENG-1');
      expect(eng1Downstream?.downstreamIssues.map(d => d.key)).toContain('WEB-1');
    });
  });

  describe('selectProjectBoard', () => {
    it('partitions issues into canonical lifecycle columns', () => {
      const engProject = mockProjects[0];
      const { columns } = selectProjectBoard(
        engProject,
        mockIssues,
        mockDependencies
      );

      const inProgressCol = columns.find(c => c.state === 'IN_PROGRESS');
      expect(inProgressCol?.issues.map(i => i.key)).toContain('ENG-1');

      const todoCol = columns.find(c => c.state === 'TODO');
      expect(todoCol?.issues.map(i => i.key)).toContain('ENG-2');

      const doneCol = columns.find(c => c.state === 'DONE');
      expect(doneCol?.issues.map(i => i.key)).toContain('ENG-3');
    });
  });
});
