/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  DEFAULT_PROJECT_SAVED_VIEWS,
  resolveProjectSavedViews,
  createProjectSavedView,
  applySavedViewToUrl,
  serializeSavedViews,
  deserializeSavedViews,
} from './savedViews';
import { SavedView } from '../../types';

describe('Project Saved Views Engine', () => {
  const sampleProject = {
    id: 'proj_platform',
    teamId: 'team_eng',
    name: 'Core Platform',
    key: 'ENG',
    description: 'Core infrastructure services',
    currentSequence: 142,
  };

  const sampleProjectB = {
    id: 'proj_web',
    teamId: 'team_web',
    name: 'Web Application',
    key: 'WEB',
    description: 'React client app',
    currentSequence: 88,
  };

  describe('createProjectSavedView', () => {
    it('captures full project execution state including filters, sort, group, and project scoping', () => {
      const view = createProjectSavedView({
        name: 'Urgent Blocked In-Progress',
        projectId: sampleProject.id,
        teamId: sampleProject.teamId,
        currentFilters: {
          searchQuery: 'auth token',
          state: 'IN_PROGRESS',
          priority: 'URGENT',
          assigneeId: 'usr_david',
          blockerFilter: 'BLOCKED_ONLY',
          cycleId: 'cycle_24',
          sort: 'priority',
          group: 'priority',
        },
        viewMode: 'LIST',
      });

      expect(view.name).toBe('Urgent Blocked In-Progress');
      expect(view.projectId).toBe('proj_platform');
      expect(view.isSystem).toBe(false);
      expect(view.viewMode).toBe('LIST');
      expect(view.filters.searchQuery).toBe('auth token');
      expect(view.filters.state).toBe('IN_PROGRESS');
      expect(view.filters.priority).toBe('URGENT');
      expect(view.filters.assigneeId).toBe('usr_david');
      expect(view.filters.blockerFilter).toBe('BLOCKED_ONLY');
      expect(view.filters.cycleId).toBe('cycle_24');
      expect(view.executionConfig?.sort).toBe('priority');
      expect(view.executionConfig?.group).toBe('priority');
    });

    it('omits default manual sort and none grouping from executionConfig', () => {
      const view = createProjectSavedView({
        name: 'Simple View',
        projectId: sampleProject.id,
        currentFilters: {
          searchQuery: '',
          state: 'ALL',
          priority: 'ALL',
          assigneeId: 'ALL',
          blockerFilter: 'ALL',
          cycleId: 'ALL',
          sort: 'manual',
          group: 'none',
        },
      });

      expect(view.executionConfig?.sort).toBeUndefined();
      expect(view.executionConfig?.group).toBeUndefined();
    });
  });

  describe('resolveProjectSavedViews (Project Scoping)', () => {
    it('includes default system presets for all projects', () => {
      const views = resolveProjectSavedViews([], sampleProject.id);
      expect(views.length).toBeGreaterThanOrEqual(3);
      expect(views.some(v => v.name === 'Active Work')).toBe(true);
      expect(views.some(v => v.name === 'Blocked Triage')).toBe(true);
      expect(views.some(v => v.name === 'Grouped by Priority')).toBe(true);
    });

    it('strictly isolates custom saved views by project ID', () => {
      const customViewProjA: SavedView = {
        id: 'view_a',
        name: 'Platform Custom Pipeline',
        isSystem: false,
        projectId: sampleProject.id,
        filters: {
          searchQuery: '',
          state: 'ALL',
          priority: 'ALL',
          assigneeId: 'ALL',
          projectId: sampleProject.id,
          teamId: 'team_eng',
          blockerFilter: 'ALL',
        },
      };

      const customViewProjB: SavedView = {
        id: 'view_b',
        name: 'Web UI Sprint Scope',
        isSystem: false,
        projectId: sampleProjectB.id,
        filters: {
          searchQuery: '',
          state: 'ALL',
          priority: 'ALL',
          assigneeId: 'ALL',
          projectId: sampleProjectB.id,
          teamId: 'team_web',
          blockerFilter: 'ALL',
        },
      };

      const allSavedViews = [customViewProjA, customViewProjB];

      // Scoping for Project A
      const projAViews = resolveProjectSavedViews(allSavedViews, sampleProject.id);
      expect(projAViews.some(v => v.id === 'view_a')).toBe(true);
      expect(projAViews.some(v => v.id === 'view_b')).toBe(false);

      // Scoping for Project B
      const projBViews = resolveProjectSavedViews(allSavedViews, sampleProjectB.id);
      expect(projBViews.some(v => v.id === 'view_a')).toBe(false);
      expect(projBViews.some(v => v.id === 'view_b')).toBe(true);
    });
  });

  describe('applySavedViewToUrl (URL & Execution State Restoration)', () => {
    it('restores all filters and search query into URLSearchParams', () => {
      const view: SavedView = {
        id: 'view_test_restore',
        name: 'Triage Urgent In Progress',
        filters: {
          searchQuery: 'redis lock',
          state: 'IN_PROGRESS',
          priority: 'URGENT',
          assigneeId: 'usr_sarah',
          blockerFilter: 'BLOCKED_ONLY',
          cycleId: 'cycle_24',
          projectId: 'ALL',
          teamId: 'ALL',
        },
        executionConfig: {
          sort: 'priority',
          group: 'state',
        },
      };

      const initialParams = new URLSearchParams('drawer=ENG-101&tab=comments');
      const nextParams = applySavedViewToUrl(view, initialParams);

      // Verify filters restored
      expect(nextParams.get('q')).toBe('redis lock');
      expect(nextParams.get('state')).toBe('IN_PROGRESS');
      expect(nextParams.get('priority')).toBe('URGENT');
      expect(nextParams.get('assignee')).toBe('usr_sarah');
      expect(nextParams.get('blocker')).toBe('BLOCKED_ONLY');
      expect(nextParams.get('cycle')).toBe('cycle_24');

      // Verify sort and group restored
      expect(nextParams.get('sort')).toBe('priority');
      expect(nextParams.get('group')).toBe('state');

      // Verify unrelated URL parameters preserved
      expect(nextParams.get('drawer')).toBe('ENG-101');
      expect(nextParams.get('tab')).toBe('comments');
    });

    it('cleans up default parameters when applying a broad view', () => {
      const broadView: SavedView = {
        id: 'view_broad',
        name: 'Reset All Filters View',
        filters: {
          searchQuery: '',
          state: 'ALL',
          priority: 'ALL',
          assigneeId: 'ALL',
          blockerFilter: 'ALL',
          cycleId: 'ALL',
          projectId: 'ALL',
          teamId: 'ALL',
        },
        executionConfig: {
          sort: 'manual',
          group: 'none',
        },
      };

      const initialParams = new URLSearchParams('q=old&state=DONE&priority=LOW&sort=priority&group=cycle');
      const nextParams = applySavedViewToUrl(broadView, initialParams);

      expect(nextParams.has('q')).toBe(false);
      expect(nextParams.has('state')).toBe(false);
      expect(nextParams.has('priority')).toBe(false);
      expect(nextParams.has('sort')).toBe(false);
      expect(nextParams.has('group')).toBe(false);
    });
  });

  describe('Serialization and Persistence Compatibility', () => {
    it('serializes and deserializes saved views without data corruption', () => {
      const views: SavedView[] = [
        ...DEFAULT_PROJECT_SAVED_VIEWS,
        {
          id: 'custom_1',
          name: 'Custom 1',
          projectId: 'proj_platform',
          filters: {
            searchQuery: 'test',
            state: 'TODO',
            priority: 'HIGH',
            assigneeId: 'usr_david',
            blockerFilter: 'BLOCKED_ONLY',
            projectId: 'proj_platform',
            teamId: 'team_eng',
          },
          executionConfig: {
            sort: 'priority',
            group: 'assignee',
          },
        },
      ];

      const serialized = serializeSavedViews(views);
      expect(typeof serialized).toBe('string');

      const restored = deserializeSavedViews(serialized);
      expect(restored).toHaveLength(views.length);
      expect(restored[restored.length - 1].name).toBe('Custom 1');
      expect(restored[restored.length - 1].executionConfig?.group).toBe('assignee');
    });

    it('safely handles null, invalid json, or non-array inputs during deserialization', () => {
      const fallback = DEFAULT_PROJECT_SAVED_VIEWS;
      expect(deserializeSavedViews(null, fallback)).toBe(fallback);
      expect(deserializeSavedViews('invalid-json{{{', fallback)).toBe(fallback);
      expect(deserializeSavedViews('{"not":"an array"}', fallback)).toBe(fallback);
    });
  });
});
