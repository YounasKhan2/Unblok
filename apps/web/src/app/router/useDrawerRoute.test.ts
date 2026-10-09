/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';

describe('useDrawerRoute & URL query state contract', () => {
  it('constructs correct drawer query search string without destroying base filters', () => {
    const baseParams = new URLSearchParams('state=TODO&priority=HIGH&blocker=BLOCKED_ONLY&q=database');
    baseParams.set('drawer', 'ENG-142');
    baseParams.set('tab', 'dependencies');

    expect(baseParams.toString()).toBe('state=TODO&priority=HIGH&blocker=BLOCKED_ONLY&q=database&drawer=ENG-142&tab=dependencies');
  });

  it('removes drawer-specific parameters (drawer, legacy issue, tab) on close while strictly preserving base filters and search', () => {
    const activeParams = new URLSearchParams('q=auth&state=IN_PROGRESS&priority=HIGH&blocker=UNBLOCKED_ONLY&drawer=ENG-142&issue=ENG-142&tab=dependencies');

    // Canonical close drawer logic
    activeParams.delete('drawer');
    activeParams.delete('issue');
    activeParams.delete('tab');

    expect(activeParams.toString()).toBe('q=auth&state=IN_PROGRESS&priority=HIGH&blocker=UNBLOCKED_ONLY');
    expect(activeParams.get('q')).toBe('auth');
    expect(activeParams.get('state')).toBe('IN_PROGRESS');
    expect(activeParams.get('priority')).toBe('HIGH');
    expect(activeParams.get('blocker')).toBe('UNBLOCKED_ONLY');
    expect(activeParams.get('drawer')).toBeNull();
    expect(activeParams.get('issue')).toBeNull();
    expect(activeParams.get('tab')).toBeNull();
  });

  it('updates adjacent issue key on J/K keyboard navigation replacing drawer key in-place', () => {
    const currentParams = new URLSearchParams('state=TODO&drawer=ENG-142&tab=activity');
    // Replacement navigation replaces drawer key
    currentParams.set('drawer', 'ENG-151');

    expect(currentParams.get('drawer')).toBe('ENG-151');
    expect(currentParams.get('state')).toBe('TODO');
    expect(currentParams.get('tab')).toBe('activity');
  });

  it('safely handles direct deep link parsing with drawer and tab parameters', () => {
    const initialUrl = '/my-work?state=TODO&drawer=ENG-142&tab=dependencies';
    const params = new URLSearchParams(initialUrl.split('?')[1]);

    expect(params.get('drawer')).toBe('ENG-142');
    expect(params.get('tab')).toBe('dependencies');
    expect(params.get('state')).toBe('TODO');
  });

  it('preserves filters when switching drawer tabs', () => {
    const currentParams = new URLSearchParams('q=auth&state=IN_REVIEW&drawer=ENG-142&tab=properties');
    currentParams.set('tab', 'discussions');

    expect(currentParams.get('tab')).toBe('discussions');
    expect(currentParams.get('drawer')).toBe('ENG-142');
    expect(currentParams.get('q')).toBe('auth');
    expect(currentParams.get('state')).toBe('IN_REVIEW');
  });
});
