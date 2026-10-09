/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { selectIssueDetail } from './selectors';
import {
  INITIAL_ISSUES,
  INITIAL_DEPENDENCIES,
  INITIAL_PROJECTS,
  INITIAL_TEAMS,
  INITIAL_USERS,
  INITIAL_CYCLES,
  INITIAL_MILESTONES,
  INITIAL_COMMENTS,
  INITIAL_ACTIVITIES,
} from '../../data/mockData';

describe('selectIssueDetail selector', () => {
  it('resolves canonical issue by exact key (ENG-1)', () => {
    const detail = selectIssueDetail(
      'ENG-1',
      INITIAL_ISSUES,
      INITIAL_DEPENDENCIES,
      INITIAL_PROJECTS,
      INITIAL_TEAMS,
      INITIAL_USERS,
      INITIAL_CYCLES,
      INITIAL_MILESTONES,
      INITIAL_COMMENTS,
      INITIAL_ACTIVITIES
    );

    expect(detail).not.toBeNull();
    expect(detail!.issue.key).toBe('ENG-1');
    expect(detail!.project?.key).toBe('ENG');
    expect(detail!.team?.key).toBe('ENG');
    expect(detail!.assignee?.name).toBe('David Kim');
    expect(detail!.cycle?.name).toBe('Cycle 24');
    expect(detail!.milestone?.name).toBe('M1: Multi-tenant Auth & Token Revocation');
  });

  it('resolves canonical issue by case-insensitive key (eng-1)', () => {
    const detail = selectIssueDetail(
      'eng-1',
      INITIAL_ISSUES,
      INITIAL_DEPENDENCIES,
      INITIAL_PROJECTS,
      INITIAL_TEAMS,
      INITIAL_USERS,
      INITIAL_CYCLES,
      INITIAL_MILESTONES,
      INITIAL_COMMENTS,
      INITIAL_ACTIVITIES
    );

    expect(detail).not.toBeNull();
    expect(detail!.issue.key).toBe('ENG-1');
  });

  it('resolves canonical issue by issue ID (iss_eng_1)', () => {
    const detail = selectIssueDetail(
      'iss_eng_1',
      INITIAL_ISSUES,
      INITIAL_DEPENDENCIES,
      INITIAL_PROJECTS,
      INITIAL_TEAMS,
      INITIAL_USERS,
      INITIAL_CYCLES,
      INITIAL_MILESTONES,
      INITIAL_COMMENTS,
      INITIAL_ACTIVITIES
    );

    expect(detail).not.toBeNull();
    expect(detail!.issue.key).toBe('ENG-1');
  });

  it('returns null for nonexistent issue key', () => {
    const detail = selectIssueDetail(
      'NONEXISTENT-999',
      INITIAL_ISSUES,
      INITIAL_DEPENDENCIES,
      INITIAL_PROJECTS,
      INITIAL_TEAMS,
      INITIAL_USERS,
      INITIAL_CYCLES,
      INITIAL_MILESTONES,
      INITIAL_COMMENTS,
      INITIAL_ACTIVITIES
    );

    expect(detail).toBeNull();
  });

  it('returns null for empty or undefined issue key', () => {
    expect(
      selectIssueDetail(
        undefined,
        INITIAL_ISSUES,
        INITIAL_DEPENDENCIES,
        INITIAL_PROJECTS,
        INITIAL_TEAMS,
        INITIAL_USERS,
        INITIAL_CYCLES,
        INITIAL_MILESTONES,
        INITIAL_COMMENTS,
        INITIAL_ACTIVITIES
      )
    ).toBeNull();

    expect(
      selectIssueDetail(
        '   ',
        INITIAL_ISSUES,
        INITIAL_DEPENDENCIES,
        INITIAL_PROJECTS,
        INITIAL_TEAMS,
        INITIAL_USERS,
        INITIAL_CYCLES,
        INITIAL_MILESTONES,
        INITIAL_COMMENTS,
        INITIAL_ACTIVITIES
      )
    ).toBeNull();
  });

  it('correctly derives active blockers and cross-team dependencies for ENG-1', () => {
    const detail = selectIssueDetail(
      'ENG-1',
      INITIAL_ISSUES,
      INITIAL_DEPENDENCIES,
      INITIAL_PROJECTS,
      INITIAL_TEAMS,
      INITIAL_USERS,
      INITIAL_CYCLES,
      INITIAL_MILESTONES,
      INITIAL_COMMENTS,
      INITIAL_ACTIVITIES
    );

    expect(detail).not.toBeNull();
    expect(detail!.blockerStatus.isBlocked).toBe(true);
    expect(detail!.activeBlockers.length).toBe(1);
    expect(detail!.activeBlockers[0].issue.key).toBe('INF-1');
    // Verify cross-team relationship
    expect(detail!.activeBlockers[0].team?.name).toBe('Infra & Reliability');
    expect(detail!.activeBlockers[0].project?.key).toBe('INF');

    // Downstream dependency
    expect(detail!.downstreamDependencies.length).toBe(1);
    expect(detail!.downstreamDependencies[0].issue.key).toBe('WEB-1');
    expect(detail!.downstreamDependencies[0].team?.name).toBe('Web & Apps');
  });

  it('correctly derives resolved blockers for WEB-3', () => {
    // In mock data: ENG-3 (DONE) BLOCKS WEB-3
    const detail = selectIssueDetail(
      'WEB-3',
      INITIAL_ISSUES,
      INITIAL_DEPENDENCIES,
      INITIAL_PROJECTS,
      INITIAL_TEAMS,
      INITIAL_USERS,
      INITIAL_CYCLES,
      INITIAL_MILESTONES,
      INITIAL_COMMENTS,
      INITIAL_ACTIVITIES
    );

    expect(detail).not.toBeNull();
    expect(detail!.blockerStatus.isBlocked).toBe(false);
    expect(detail!.activeBlockers.length).toBe(0);
    expect(detail!.resolvedBlockers.length).toBe(1);
    expect(detail!.resolvedBlockers[0].issue.key).toBe('ENG-3');
    expect(detail!.resolvedBlockers[0].isActivelyBlocking).toBe(false);
  });

  it('correctly associates comments and threaded replies for INF-1', () => {
    const detail = selectIssueDetail(
      'INF-1',
      INITIAL_ISSUES,
      INITIAL_DEPENDENCIES,
      INITIAL_PROJECTS,
      INITIAL_TEAMS,
      INITIAL_USERS,
      INITIAL_CYCLES,
      INITIAL_MILESTONES,
      INITIAL_COMMENTS,
      INITIAL_ACTIVITIES
    );

    expect(detail).not.toBeNull();
    expect(detail!.comments.length).toBe(2);
    expect(detail!.rootComments.length).toBe(1);
    expect(detail!.rootComments[0].id).toBe('comm_1');
    const replies = detail!.repliesMap.get('comm_1');
    expect(replies).toBeDefined();
    expect(replies!.length).toBe(1);
    expect(replies![0].id).toBe('comm_2');
  });
});
