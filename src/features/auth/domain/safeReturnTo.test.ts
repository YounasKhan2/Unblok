/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  isValidInternalReturnTo,
  getSafeReturnTo,
  DEFAULT_AUTHENTICATED_ROUTE,
} from './safeReturnTo';

describe('UX-12 Safe returnTo Validation Contract', () => {
  describe('Valid internal paths', () => {
    const validPaths = [
      '/my-work',
      '/projects/ENG/issues',
      '/issues/ENG-142',
      '/dependencies',
      '/inbox',
      '/cycles',
      '/milestones/ms_01',
      '/roadmap',
      '/insights',
      '/settings/workspace',
      '/settings/members',
      '/settings/preferences',
      '/onboarding',
      '/projects/ENG/issues?state=TODO&assignee=usr_alex',
      '/issues/ENG-142#comments',
    ];

    validPaths.forEach((path) => {
      it(`accepts valid internal path: "${path}"`, () => {
        expect(isValidInternalReturnTo(path)).toBe(true);
        expect(getSafeReturnTo(path)).toBe(path);
      });
    });
  });

  describe('Rejected external & protocol-relative destinations', () => {
    const dangerousPaths = [
      'https://evil.example',
      'http://evil.example',
      '//evil.example',
      '//evil.example/my-work',
      'javascript:alert(1)',
      'data:text/html,<html>',
      'ftp://malicious.host',
      '\\evil.example',
      '/\\evil.example',
    ];

    dangerousPaths.forEach((path) => {
      it(`rejects dangerous target: "${path}" and falls back to default`, () => {
        expect(isValidInternalReturnTo(path)).toBe(false);
        expect(getSafeReturnTo(path)).toBe(DEFAULT_AUTHENTICATED_ROUTE);
      });
    });
  });

  describe('Rejected public & auth loop destinations', () => {
    const loopPaths = [
      '/',
      '/login',
      '/login?returnTo=/my-work',
      '/signup',
      '/forgot-password',
      '/reset-password',
      '/reset-password?token=xyz',
      '/invite/some-token',
      '/product',
      '/features',
      '/solutions',
      '/pricing',
      '/security',
      '/contact',
      '/terms',
      '/privacy',
    ];

    loopPaths.forEach((path) => {
      it(`rejects loop path: "${path}" and falls back to default`, () => {
        expect(isValidInternalReturnTo(path)).toBe(false);
        expect(getSafeReturnTo(path)).toBe(DEFAULT_AUTHENTICATED_ROUTE);
      });
    });
  });

  describe('Malformed and empty inputs', () => {
    const invalidInputs = [
      null,
      undefined,
      '',
      '   ',
      'my-work', // missing leading slash
      'projects/ENG',
      '   /my-work\n',
      '/with space in path',
    ];

    invalidInputs.forEach((input) => {
      it(`rejects invalid input: ${JSON.stringify(input)} and falls back to default`, () => {
        expect(isValidInternalReturnTo(input as any)).toBe(false);
        expect(getSafeReturnTo(input as any)).toBe(DEFAULT_AUTHENTICATED_ROUTE);
      });
    });

    it('allows a custom fallback route if provided and candidate is invalid', () => {
      expect(getSafeReturnTo('https://evil.com', '/projects')).toBe('/projects');
    });
  });
});
