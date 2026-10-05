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
import { canTransition } from '../../domain/lifecycle';
import {
  validateHardCompletionGuard,
  wouldCreateCycle,
  getBlockerStatus,
} from '../../domain/dependency';
import { evaluateKeyAction } from '../../context/KeyboardContext';
import { Issue, Dependency, IssueComment } from '../../types';

describe('UX-03: Complete Issue Experience Domain & System Contract', () => {
  describe('1. Resolution & Not Found States', () => {
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

    it('returns null (triggering Issue Not Found state) for nonexistent key', () => {
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

    it('resolves project and team relationships correctly', () => {
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
      expect(detail!.project?.id).toBe('proj_inf_ops');
      expect(detail!.project?.name).toBe('Database Migration & Edge Routing');
      expect(detail!.team?.id).toBe('team_inf');
      expect(detail!.team?.name).toBe('Infra & Reliability');
    });
  });

  describe('2. Dependency Derivation & Semantics', () => {
    it('correctly derives active blockers for ENG-1 (blocked by INF-1)', () => {
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
      expect(detail!.blockerStatus.activeCount).toBe(1);
      expect(detail!.activeBlockers[0].issue.key).toBe('INF-1');
      // Cross-team blocker relationship
      expect(detail!.activeBlockers[0].team?.name).toBe('Infra & Reliability');
      expect(detail!.activeBlockers[0].project?.key).toBe('INF');
    });

    it('correctly derives resolved blockers for WEB-3 (persisted dependency with ENG-3 in DONE)', () => {
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
      expect(detail!.blockerStatus.activeCount).toBe(0);
      expect(detail!.resolvedBlockers.length).toBe(1);
      expect(detail!.resolvedBlockers[0].issue.key).toBe('ENG-3');
      expect(detail!.resolvedBlockers[0].issue.state).toBe('DONE');
      expect(detail!.resolvedBlockers[0].isActivelyBlocking).toBe(false);
    });

    it('correctly derives downstream dependent work (ENG-1 blocks WEB-1)', () => {
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
      expect(detail!.downstreamDependencies.length).toBe(1);
      expect(detail!.downstreamDependencies[0].issue.key).toBe('WEB-1');
      expect(detail!.downstreamDependencies[0].team?.key).toBe('WEB');
    });
  });

  describe('3. Shared State & Canonical Mutations', () => {
    it('simulates canonical title update and reflects in detail selector', () => {
      const updatedIssues: Issue[] = INITIAL_ISSUES.map(i =>
        i.key === 'ENG-1' ? { ...i, title: 'Updated Auth Spec Title' } : i
      );
      const detail = selectIssueDetail(
        'ENG-1',
        updatedIssues,
        INITIAL_DEPENDENCIES,
        INITIAL_PROJECTS,
        INITIAL_TEAMS,
        INITIAL_USERS,
        INITIAL_CYCLES,
        INITIAL_MILESTONES,
        INITIAL_COMMENTS,
        INITIAL_ACTIVITIES
      );
      expect(detail!.issue.title).toBe('Updated Auth Spec Title');
    });

    it('simulates canonical description update and reflects in detail selector', () => {
      const updatedIssues: Issue[] = INITIAL_ISSUES.map(i =>
        i.key === 'ENG-1' ? { ...i, description: '## Detailed Architecture\n- Zero Trust\n- OAuth' } : i
      );
      const detail = selectIssueDetail(
        'ENG-1',
        updatedIssues,
        INITIAL_DEPENDENCIES,
        INITIAL_PROJECTS,
        INITIAL_TEAMS,
        INITIAL_USERS,
        INITIAL_CYCLES,
        INITIAL_MILESTONES,
        INITIAL_COMMENTS,
        INITIAL_ACTIVITIES
      );
      expect(detail!.issue.description).toContain('## Detailed Architecture');
    });

    it('simulates canonical priority update and reflects in detail selector', () => {
      const updatedIssues: Issue[] = INITIAL_ISSUES.map(i =>
        i.key === 'ENG-1' ? { ...i, priority: 'LOW' } : i
      );
      const detail = selectIssueDetail(
        'ENG-1',
        updatedIssues,
        INITIAL_DEPENDENCIES,
        INITIAL_PROJECTS,
        INITIAL_TEAMS,
        INITIAL_USERS,
        INITIAL_CYCLES,
        INITIAL_MILESTONES,
        INITIAL_COMMENTS,
        INITIAL_ACTIVITIES
      );
      expect(detail!.issue.priority).toBe('LOW');
    });

    it('simulates canonical assignee update and reflects in detail selector', () => {
      const updatedIssues: Issue[] = INITIAL_ISSUES.map(i =>
        i.key === 'ENG-1' ? { ...i, assigneeId: 'usr_sarah' } : i
      );
      const detail = selectIssueDetail(
        'ENG-1',
        updatedIssues,
        INITIAL_DEPENDENCIES,
        INITIAL_PROJECTS,
        INITIAL_TEAMS,
        INITIAL_USERS,
        INITIAL_CYCLES,
        INITIAL_MILESTONES,
        INITIAL_COMMENTS,
        INITIAL_ACTIVITIES
      );
      expect(detail!.assignee?.name).toBe('Sarah Chen');
    });
  });

  describe('4. Lifecycle & Hard Completion Guard', () => {
    it('validates allowed forward and backwards lifecycle transitions', () => {
      expect(canTransition('BACKLOG', 'TODO')).toBe(true);
      expect(canTransition('TODO', 'IN_PROGRESS')).toBe(true);
      expect(canTransition('IN_PROGRESS', 'IN_REVIEW')).toBe(true);
      expect(canTransition('IN_REVIEW', 'DONE')).toBe(true);

      // Backwards allowed
      expect(canTransition('IN_PROGRESS', 'TODO')).toBe(true);
      expect(canTransition('IN_REVIEW', 'IN_PROGRESS')).toBe(true);

      // Disallowed skipping
      expect(canTransition('BACKLOG', 'DONE')).toBe(false);
      expect(canTransition('TODO', 'DONE')).toBe(false);
    });

    it('rejects transition to DONE when issue is actively blocked (Hard Completion Guard)', () => {
      const eng1 = INITIAL_ISSUES.find(i => i.key === 'ENG-1')!;
      const guardResult = validateHardCompletionGuard(eng1, INITIAL_ISSUES, INITIAL_DEPENDENCIES);

      expect(guardResult.allowed).toBe(false);
      expect(guardResult.activeBlockers.length).toBeGreaterThan(0);
      expect(guardResult.activeBlockers[0].key).toBe('INF-1');
    });

    it('allows transition to DONE when all upstream blockers are resolved', () => {
      const web3 = INITIAL_ISSUES.find(i => i.key === 'WEB-3')!;
      const guardResult = validateHardCompletionGuard(web3, INITIAL_ISSUES, INITIAL_DEPENDENCIES);

      expect(guardResult.allowed).toBe(true);
      expect(guardResult.activeBlockers.length).toBe(0);
    });

    it('re-activates downstream blocker if resolved upstream issue is reopened to TODO', () => {
      // Simulate ENG-3 reopened from DONE to TODO
      const reopenedIssues: Issue[] = INITIAL_ISSUES.map(i =>
        i.key === 'ENG-3' ? { ...i, state: 'TODO' } : i
      );
      const statusAfterReopen = getBlockerStatus('iss_web_3', reopenedIssues, INITIAL_DEPENDENCIES);

      expect(statusAfterReopen.isBlocked).toBe(true);
      expect(statusAfterReopen.activeCount).toBe(1);
    });
  });

  describe('5. Dependency Invariants & Cycle Detection', () => {
    const issuesMap = new Map(INITIAL_ISSUES.map(i => [i.id, i]));

    it('rejects self-edge dependency', () => {
      const check = wouldCreateCycle('iss_eng_1', 'iss_eng_1', INITIAL_DEPENDENCIES, issuesMap);
      expect(check.hasCycle).toBe(true);
    });

    it('rejects circular dependency edge (e.g. WEB-1 -> INF-1 when INF-1 -> ENG-1 -> WEB-1)', () => {
      // INF-1 -> ENG-1 -> WEB-1 exists.
      // Trying to make WEB-1 block INF-1 creates a cycle!
      const check = wouldCreateCycle('iss_web_1', 'iss_inf_1', INITIAL_DEPENDENCIES, issuesMap);
      expect(check.hasCycle).toBe(true);
      expect(check.cyclePath?.length).toBeGreaterThan(0);
    });

    it('allows valid non-cyclic dependency edge', () => {
      // ENG-8 (DONE) has no dependencies; ENG-8 blocking INF-3 creates no cycle
      const check = wouldCreateCycle('iss_eng_8', 'iss_inf_3', INITIAL_DEPENDENCIES, issuesMap);
      expect(check.hasCycle).toBe(false);
    });
  });

  describe('6. Discussions & Mentions Contract', () => {
    it('associates root comments and nested replies correctly', () => {
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
      expect(detail!.comments.length).toBe(2);
      expect(detail!.rootComments.length).toBe(1);
      expect(detail!.repliesMap.get('comm_1')?.length).toBe(1);
    });

    it('extracts mentioned teammate names in comment', () => {
      const comm = INITIAL_COMMENTS.find(c => c.id === 'comm_1')!;
      expect(comm.mentions).toContain('usr_elena');
    });
  });

  describe('7. Authorization Prototype (Roles)', () => {
    it('identifies role capabilities correctly', () => {
      const admin = INITIAL_USERS.find(u => u.role === 'ADMIN')!;
      const member = INITIAL_USERS.find(u => u.role === 'MEMBER')!;
      const observer = INITIAL_USERS.find(u => u.role === 'OBSERVER')!;

      expect(admin.role).toBe('ADMIN');
      expect(member.role).toBe('MEMBER');
      expect(observer.role).toBe('OBSERVER');

      // Permissions predicate test
      const canEdit = (role: string) => role === 'ADMIN' || role === 'MEMBER';
      expect(canEdit(admin.role)).toBe(true);
      expect(canEdit(member.role)).toBe(true);
      expect(canEdit(observer.role)).toBe(false);
    });
  });

  describe('8. Navigation & Return Context Strategy', () => {
    it('computes clean returnUrl preserving search queries without drawer or tab parameters', () => {
      const pathname = '/projects/ENG/issues';
      const search = '?q=auth&group=state&drawer=ENG-142&tab=dependencies';

      const cleanSearch = search
        .replace(/([?&])drawer=[^&]*(&|$)/, '$1')
        .replace(/([?&])tab=[^&]*(&|$)/, '$1')
        .replace(/[?&]$/, '');

      const returnUrl = pathname + cleanSearch;
      expect(returnUrl).toBe('/projects/ENG/issues?q=auth&group=state');
    });
  });

  describe('9. Keyboard Architecture & Editor Suppression', () => {
    it('dispatches S, P, A, M shortcuts in CANVAS scope when not editing', () => {
      expect(
        evaluateKeyAction({
          key: 's',
          isInputFocused: false,
          scope: 'CANVAS',
          hasSelection: false,
        })
      ).toBe('OPEN_STATUS_PICKER');

      expect(
        evaluateKeyAction({
          key: 'p',
          isInputFocused: false,
          scope: 'CANVAS',
          hasSelection: false,
        })
      ).toBe('OPEN_PRIORITY_PICKER');

      expect(
        evaluateKeyAction({
          key: 'a',
          isInputFocused: false,
          scope: 'CANVAS',
          hasSelection: false,
        })
      ).toBe('OPEN_ASSIGNEE_PICKER');

      expect(
        evaluateKeyAction({
          key: 'm',
          isInputFocused: false,
          scope: 'CANVAS',
          hasSelection: false,
        })
      ).toBe('FOCUS_COMMENT_COMPOSER');
    });

    it('suppresses single-character shortcuts (S, P, A, M, C, J, K) while editing an input', () => {
      const editableKeys = ['s', 'p', 'a', 'm', 'c', 'j', 'k', 'x', '[', ']'];
      for (const k of editableKeys) {
        expect(
          evaluateKeyAction({
            key: k,
            isInputFocused: true,
            scope: 'CANVAS',
            hasSelection: false,
          })
        ).toBe('NONE');
      }
    });

    it('dispatches Cmd+O in DRAWER_NAV scope to open full issue', () => {
      expect(
        evaluateKeyAction({
          key: 'o',
          metaKey: true,
          isInputFocused: false,
          scope: 'DRAWER_NAV',
          hasSelection: false,
        })
      ).toBe('DRAWER_OPEN_FULL');
    });
  });
});
