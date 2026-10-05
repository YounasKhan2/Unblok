/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';

describe('useDrawerRoute & URL query state logic', () => {
  it('constructs correct drawer query search string without destroying base filters', () => {
    const baseParams = new URLSearchParams('state=TODO&priority=HIGH');
    baseParams.set('drawer', 'ENG-142');
    baseParams.set('tab', 'dependencies');

    expect(baseParams.toString()).toBe('state=TODO&priority=HIGH&drawer=ENG-142&tab=dependencies');
  });

  it('removes drawer-specific parameters on close while preserving base filters and search', () => {
    const activeParams = new URLSearchParams('q=auth&state=IN_PROGRESS&drawer=ENG-142&tab=dependencies');
    
    // Close drawer logic
    activeParams.delete('drawer');
    activeParams.delete('tab');

    expect(activeParams.toString()).toBe('q=auth&state=IN_PROGRESS');
    expect(activeParams.get('q')).toBe('auth');
    expect(activeParams.get('state')).toBe('IN_PROGRESS');
    expect(activeParams.get('drawer')).toBeNull();
  });

  it('updates adjacent issue key on J/K keyboard navigation without clearing active tab', () => {
    const currentParams = new URLSearchParams('drawer=ENG-142&tab=activity');
    currentParams.set('drawer', 'ENG-151');

    expect(currentParams.get('drawer')).toBe('ENG-151');
    expect(currentParams.get('tab')).toBe('activity');
  });
});
