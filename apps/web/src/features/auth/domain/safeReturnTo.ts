/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-12 Safe ReturnTo Destination Validation
 * Section 10: Enforces safe internal redirection while rejecting open-redirect attacks,
 * protocol-relative URLs, and infinite auth/public redirect loops.
 */

export const DEFAULT_AUTHENTICATED_ROUTE = '/my-work';

/**
 * Public and authentication prefixes that must never be a returnTo target
 * to prevent circular auth loops or confusing post-login landing pages.
 */
const FORBIDDEN_REDIRECT_PREFIXES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/invite',
  '/', // root is public home
  '/product',
  '/features',
  '/solutions',
  '/pricing',
  '/security',
  '/contact',
  '/privacy',
  '/terms',
];

/**
 * Canonical authenticated spaces in Unblok.
 * Only paths matching or nested under these internal prefixes are accepted.
 */
const ALLOWED_AUTHENTICATED_PREFIXES = [
  '/my-work',
  '/projects',
  '/issues',
  '/dependencies',
  '/cycles',
  '/milestones',
  '/roadmap',
  '/inbox',
  '/insights',
  '/settings',
  '/onboarding',
];

/**
 * Validates whether a candidate path is a safe internal return target.
 */
export function isValidInternalReturnTo(candidate: string | null | undefined): boolean {
  if (!candidate || typeof candidate !== 'string') {
    return false;
  }

  // Reject strings with any unencoded whitespace or control characters
  if (/[\s\\<>"]/.test(candidate)) {
    return false;
  }

  const trimmed = candidate;

  // Must start with a single forward slash
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return false;
  }

  // Reject URLs containing protocol scheme markers
  if (trimmed.includes('://')) {
    return false;
  }

  // Extract path without query parameters or hash for route checking
  const [pathname] = trimmed.split(/[?#]/);

  // Exact root '/' is the public homepage, not an authenticated destination
  if (pathname === '/') {
    return false;
  }

  // Reject public/auth routes
  for (const forbidden of FORBIDDEN_REDIRECT_PREFIXES) {
    if (forbidden === '/') continue;
    if (pathname === forbidden || pathname.startsWith(`${forbidden}/`)) {
      return false;
    }
  }

  // Must match an allowed authenticated workspace prefix
  const isAllowedSpace = ALLOWED_AUTHENTICATED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  return isAllowedSpace;
}

/**
 * Normalizes and returns a safe destination path, falling back to /my-work.
 */
export function getSafeReturnTo(
  candidate: string | null | undefined,
  fallback: string = DEFAULT_AUTHENTICATED_ROUTE
): string {
  if (isValidInternalReturnTo(candidate)) {
    return (candidate as string).trim();
  }
  return fallback;
}
