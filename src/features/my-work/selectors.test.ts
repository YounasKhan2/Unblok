/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { selectMyWorkData } from './selectors';
import { Issue, Dependency } from '../../types';

describe('selectMyWorkData', () => {
  const currentUserId = 'usr_alice';

  const mockIssues: Issue[] = [
    // 1. Blocked task (IN_PROGRESS, but blocked by ISS-UPSTREAM) -> MUST be in Needs Attention!
    {
      id: 'iss_blocked',
      key: 'ENG-101',
      projectId: 'proj_1',
      teamId: 'team_1',
      title: 'Blocked Database Task',
      description: 'Waiting on upstream infra',
      state: 'IN_PROGRESS',
      priority: 'MEDIUM',
      assigneeId: currentUserId,
      creatorId: currentUserId,
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
      version: 1,
    },
    // Upstream blocker (assigned to someone else, IN_PROGRESS)
    {
      id: 'iss_upstream',
      key: 'INF-50',
      projectId: 'proj_1',
      teamId: 'team_1',
      title: 'Infra Prerequisite',
      description: '',
      state: 'IN_PROGRESS',
      priority: 'HIGH',
      assigneeId: 'usr_bob',
      creatorId: 'usr_bob',
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
      version: 1,
    },
    // 2. Active In Progress task (unblocked) -> In Progress
    {
      id: 'iss_in_progress',
      key: 'ENG-102',
      projectId: 'proj_1',
      teamId: 'team_1',
      title: 'Active Service Migration',
      description: '',
      state: 'IN_PROGRESS',
      priority: 'MEDIUM',
      assigneeId: currentUserId,
      creatorId: currentUserId,
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
      version: 1,
    },
    // 3. In Review task -> In Review
    {
      id: 'iss_in_review',
      key: 'ENG-103',
      projectId: 'proj_1',
      teamId: 'team_1',
      title: 'API Gateway PR',
      description: '',
      state: 'IN_REVIEW',
      priority: 'MEDIUM',
      assigneeId: currentUserId,
      creatorId: currentUserId,
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
      version: 1,
    },
    // 4. Up Next / Todo -> Up Next
    {
      id: 'iss_todo',
      key: 'ENG-104',
      projectId: 'proj_1',
      teamId: 'team_1',
      title: 'Upcoming Sprint Item',
      description: '',
      state: 'TODO',
      priority: 'LOW',
      assigneeId: currentUserId,
      creatorId: currentUserId,
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
      version: 1,
    },
    // 5. Recently Completed -> Recently Completed
    {
      id: 'iss_done',
      key: 'ENG-105',
      projectId: 'proj_1',
      teamId: 'team_1',
      title: 'Completed Hotfix',
      description: '',
      state: 'DONE',
      priority: 'HIGH',
      assigneeId: currentUserId,
      creatorId: currentUserId,
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
      version: 1,
    },
    // 6. An issue assigned to Alice that BLOCKS someone else
    {
      id: 'iss_blocking_others',
      key: 'ENG-106',
      projectId: 'proj_1',
      teamId: 'team_1',
      title: 'Core Schema Migration',
      description: 'Blocks downstream web UI',
      state: 'IN_PROGRESS',
      priority: 'HIGH',
      assigneeId: currentUserId,
      creatorId: currentUserId,
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
      version: 1,
    },
    // Downstream task blocked by ENG-106
    {
      id: 'iss_downstream_web',
      key: 'WEB-201',
      projectId: 'proj_2',
      teamId: 'team_2',
      title: 'Web Profile Form',
      description: '',
      state: 'TODO',
      priority: 'MEDIUM',
      assigneeId: 'usr_charlie',
      creatorId: currentUserId,
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
      version: 1,
    },
  ];

  const mockDependencies: Dependency[] = [
    // INF-50 BLOCKS ENG-101 (Alice's task)
    {
      id: 'dep_1',
      upstreamIssueId: 'iss_upstream',
      downstreamIssueId: 'iss_blocked',
      createdAt: '2026-10-01',
      createdBy: 'usr_bob',
    },
    // ENG-106 (Alice's task) BLOCKS WEB-201 (Charlie's task)
    {
      id: 'dep_2',
      upstreamIssueId: 'iss_blocking_others',
      downstreamIssueId: 'iss_downstream_web',
      createdAt: '2026-10-01',
      createdBy: currentUserId,
    },
  ];

  it('classifies blocked assigned task in Needs Attention and deduplicates from In Progress', () => {
    const result = selectMyWorkData(mockIssues, mockDependencies, currentUserId);

    // ENG-101 is IN_PROGRESS, but is BLOCKED, so it MUST be in needsAttention
    expect(result.needsAttention.map(i => i.key)).toContain('ENG-101');
    // Deduplication rule: ENG-101 must NOT appear in inProgress!
    expect(result.inProgress.map(i => i.key)).not.toContain('ENG-101');
  });

  it('classifies unblocked In Progress, In Review, Up Next, and Completed accurately', () => {
    const result = selectMyWorkData(mockIssues, mockDependencies, currentUserId);

    expect(result.inProgress.map(i => i.key)).toContain('ENG-102');
    expect(result.inReview.map(i => i.key)).toContain('ENG-103');
    expect(result.upNext.map(i => i.key)).toContain('ENG-104');
    expect(result.recentlyCompleted.map(i => i.key)).toContain('ENG-105');
  });

  it('identifies issues blocking other team members with downstream impact', () => {
    const result = selectMyWorkData(mockIssues, mockDependencies, currentUserId);

    expect(result.blockingOthers.length).toBe(1);
    expect(result.blockingOthers[0].issue.key).toBe('ENG-106');
    expect(result.blockingOthers[0].downstreamCount).toBe(1);
    expect(result.blockingOthers[0].activeDownstreamIssues[0].key).toBe('WEB-201');
    expect(result.summary.blockingCount).toBe(1);
  });

  it('filters issues by search query and preserves deduplication', () => {
    const result = selectMyWorkData(mockIssues, mockDependencies, currentUserId, {
      searchQuery: 'Gateway',
    });

    expect(result.inReview.length).toBe(1);
    expect(result.inReview[0].key).toBe('ENG-103');
    expect(result.needsAttention.length).toBe(0);
    expect(result.inProgress.length).toBe(0);
  });
});
