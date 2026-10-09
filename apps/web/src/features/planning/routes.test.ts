/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { selectCycleDetail } from './selectors/cycleSelectors';
import { selectMilestoneDetail } from './selectors/milestoneSelectors';
import { resolveProject } from '../projects/selectors';
import { Cycle, Milestone, Project } from '../../types';

describe('UX-05 Route Contracts & Not-Found Invariants', () => {
  const mockCycles: Cycle[] = [
    {
      id: 'cycle_24',
      name: 'Cycle 24',
      startDate: '2026-10-01',
      endDate: '2026-10-14',
      status: 'ACTIVE',
      teamId: 'team_eng',
    },
  ];

  const mockMilestones: Milestone[] = [
    {
      id: 'milestone_m1',
      name: 'M1: Enterprise Launch',
      targetDate: '2026-10-31',
      description: '',
    },
  ];

  const mockProjects: Project[] = [
    {
      id: 'proj_api',
      teamId: 'team_eng',
      name: 'API Platform',
      key: 'ENG',
      description: '',
      currentSequence: 10,
    },
  ];

  it('1. Known /cycles/:cycleId resolves detail data', () => {
    const detail = selectCycleDetail('cycle_24', mockCycles, [], [], [], []);
    expect(detail).not.toBeNull();
    expect(detail?.cycle.name).toBe('Cycle 24');
  });

  it('2. Unknown /cycles/:cycleId returns null (triggering explicit not-found UI)', () => {
    const detail = selectCycleDetail('cycle_nonexistent', mockCycles, [], [], [], []);
    expect(detail).toBeNull();
  });

  it('3. Known /milestones/:milestoneId resolves detail data', () => {
    const detail = selectMilestoneDetail('milestone_m1', mockMilestones, [], [], [], []);
    expect(detail).not.toBeNull();
    expect(detail?.summary.milestone.name).toBe('M1: Enterprise Launch');
  });

  it('4. Unknown /milestones/:milestoneId returns null (triggering explicit not-found UI)', () => {
    const detail = selectMilestoneDetail('milestone_unknown', mockMilestones, [], [], [], []);
    expect(detail).toBeNull();
  });

  it('5. Known /projects/:projectKey/planning resolves project', () => {
    const project = resolveProject(mockProjects, 'ENG');
    expect(project).toBeDefined();
    expect(project?.id).toBe('proj_api');
  });

  it('6. Unknown /projects/:projectKey/planning returns undefined (triggering explicit not-found UI)', () => {
    const project = resolveProject(mockProjects, 'UNKNOWN_KEY');
    expect(project).toBeUndefined();
  });
});
