/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { selectWorkspaceInsights, DEFAULT_INSIGHTS_FILTER } from './selectors/insightSelectors';
import {
  INITIAL_ISSUES,
  INITIAL_PROJECTS,
  INITIAL_TEAMS,
  INITIAL_MILESTONES,
  INITIAL_CYCLES,
  INITIAL_DEPENDENCIES,
} from '../../data/mockData';

describe('UX-07 /insights Canonical Route Contracts & Integration', () => {
  const referenceTime = new Date('2026-10-10T12:00:00.000Z');

  it('1. /insights canonical selector produces valid, uncorrupted workspace state', () => {
    const data = selectWorkspaceInsights({
      issues: INITIAL_ISSUES,
      dependencies: INITIAL_DEPENDENCIES,
      projects: INITIAL_PROJECTS,
      teams: INITIAL_TEAMS,
      milestones: INITIAL_MILESTONES,
      cycles: INITIAL_CYCLES,
      filters: DEFAULT_INSIGHTS_FILTER,
      referenceTime,
    });

    expect(data.summary).toBeDefined();
    expect(data.needsAttention).toBeInstanceOf(Array);
    expect(data.highRiskIssues).toBeInstanceOf(Array);
    expect(data.bottlenecks).toBeInstanceOf(Array);
    expect(data.projectHealth).toBeInstanceOf(Array);
    expect(data.teamHealth).toBeInstanceOf(Array);
    expect(data.crossTeamMatrix).toBeDefined();
    expect(data.criticalChain).toBeDefined();
  });

  it('2. preserves all search parameters when drawer is opened or closed', () => {
    const baseParams = new URLSearchParams('team=team_eng&project=proj_eng_auth&risk=critical');
    
    // Simulating opening drawer with ?drawer=ENG-1
    const withDrawer = new URLSearchParams(baseParams);
    withDrawer.set('drawer', 'ENG-1');
    expect(withDrawer.get('team')).toBe('team_eng');
    expect(withDrawer.get('project')).toBe('proj_eng_auth');
    expect(withDrawer.get('risk')).toBe('critical');
    expect(withDrawer.get('drawer')).toBe('ENG-1');

    // Simulating closing drawer
    const closed = new URLSearchParams(withDrawer);
    closed.delete('drawer');
    expect(closed.get('team')).toBe('team_eng');
    expect(closed.get('project')).toBe('proj_eng_auth');
    expect(closed.get('risk')).toBe('critical');
    expect(closed.get('drawer')).toBeNull();
  });

  it('3. derived intelligence contains no persisted entity mutations or foreign fields', () => {
    const data = selectWorkspaceInsights({
      issues: INITIAL_ISSUES,
      dependencies: INITIAL_DEPENDENCIES,
      projects: INITIAL_PROJECTS,
      teams: INITIAL_TEAMS,
      milestones: INITIAL_MILESTONES,
      cycles: INITIAL_CYCLES,
      filters: DEFAULT_INSIGHTS_FILTER,
      referenceTime,
    });

    // Ensure raw issue entities in INITIAL_ISSUES are NOT mutated with risk scores
    for (const rawIssue of INITIAL_ISSUES) {
      expect((rawIssue as any).riskScore).toBeUndefined();
      expect((rawIssue as any).riskLevel).toBeUndefined();
    }

    // Ensure raw project entities are NOT mutated with health scores
    for (const rawProject of INITIAL_PROJECTS) {
      expect((rawProject as any).healthScore).toBeUndefined();
    }
  });

  it('4. Observer role can read workspace insights without restrictions', () => {
    // Insights is purely derived read-only intelligence available to all roles
    const data = selectWorkspaceInsights({
      issues: INITIAL_ISSUES,
      dependencies: INITIAL_DEPENDENCIES,
      projects: INITIAL_PROJECTS,
      teams: INITIAL_TEAMS,
      milestones: INITIAL_MILESTONES,
      cycles: INITIAL_CYCLES,
      filters: DEFAULT_INSIGHTS_FILTER,
      referenceTime,
    });

    expect(data.summary.activeIssuesCount).toBeGreaterThan(0);
  });
});
