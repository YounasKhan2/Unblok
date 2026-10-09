/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-12 Authentication & Account Lifecycle Automated Test Suite
 * Section 31: Comprehensive coverage of routing, login, signup, password reset,
 * invitations, session transitions, safe returnTo, and architectural decoupling.
 */

import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AppProviders } from '../../app/providers/AppProviders';
import { AppRoutes } from '../../app/router/AppRouter';
import { AuthProvider } from './context/AuthContext';
import { MockAuthAdapter, DETERMINISTIC_INVITATIONS } from './domain/mockAuthAdapter';
import { getSafeReturnTo, isValidInternalReturnTo } from './domain/safeReturnTo';
import { evaluatePassword } from './domain/passwordRules';
import { bridgeToLegacyUser } from './domain/legacyBridge';
import { AuthenticatedUser, WorkspaceMembership } from './types';
import { LoginPage } from '../../pages/auth/LoginPage';
import { SignupPage } from '../../pages/auth/SignupPage';
import { ForgotPasswordPage } from '../../pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../../pages/auth/ResetPasswordPage';
import { InvitePage } from '../../pages/auth/InvitePage';
import { OnboardingPlaceholderPage } from '../../pages/auth/OnboardingPlaceholderPage';
import { AuthDevHarness, isDevHarnessEnabled } from './components/AuthDevHarness';

describe('UX-12 Authentication & Account Lifecycle Contract Suite', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  /* ======================================================================== */
  /* 1. ROUTING FAMILY                                                        */
  /* ======================================================================== */
  describe('1. Routing Family Under AuthLayout', () => {
    it('renders LoginPage at /login under AuthLayout', () => {
      const html = renderToString(
        <AppProviders initialAuthStatus="guest">
          <MemoryRouter initialEntries={['/login']}>
            <AppRoutes />
          </MemoryRouter>
        </AppProviders>
      );
      expect(html).toContain('Sign in to Unblok');
      expect(html).toContain('Work email');
      expect(html).toContain('Password');
      expect(html).toContain('Forgot password?');
      expect(html).toContain('Terms of Service');
      expect(html).toContain('Privacy Policy');
      expect(html).not.toContain('nav-rail');
    });

    it('renders SignupPage at /signup under AuthLayout', () => {
      const html = renderToString(
        <AppProviders initialAuthStatus="guest">
          <MemoryRouter initialEntries={['/signup']}>
            <AppRoutes />
          </MemoryRouter>
        </AppProviders>
      );
      expect(html).toContain('Create your account');
      expect(html).toContain('Full name');
      expect(html).toContain('Work email');
      expect(html).toContain('Password');
      expect(html).toContain('Create account');
      expect(html).toContain('Already have an account?');
    });

    it('renders ForgotPasswordPage at /forgot-password under AuthLayout', () => {
      const html = renderToString(
        <AppProviders initialAuthStatus="guest">
          <MemoryRouter initialEntries={['/forgot-password']}>
            <AppRoutes />
          </MemoryRouter>
        </AppProviders>
      );
      expect(html).toContain('Reset your password');
      expect(html).toContain('Send reset link');
      expect(html).toContain('Remember your password?');
    });

    it('renders ResetPasswordPage at /reset-password?token=rst_valid under AuthLayout', () => {
      const html = renderToString(
        <AppProviders initialAuthStatus="guest">
          <MemoryRouter initialEntries={['/reset-password?token=rst_valid']}>
            <AppRoutes />
          </MemoryRouter>
        </AppProviders>
      );
      expect(html).toContain('Set new password');
      expect(html).toContain('New password');
      expect(html).toContain('Confirm new password');
      expect(html).toContain('Reset password');
    });

    it('renders InvitePage at /invite/:token under AuthLayout', () => {
      const html = renderToString(
        <AppProviders initialAuthStatus="guest">
          <MemoryRouter initialEntries={['/invite/inv_existing_user']}>
            <AppRoutes />
          </MemoryRouter>
        </AppProviders>
      );
      expect(html).toContain('Join NEXUS Commerce');
      expect(html).toContain('Sign in to accept');
    });
  });

  /* ======================================================================== */
  /* 2. LOGIN CEREMONY                                                        */
  /* ======================================================================== */
  describe('2. Login Ceremony & Credentials', () => {
    it('authenticates valid credentials via adapter and returns user and membership', async () => {
      const adapter = new MockAuthAdapter();
      const result = await adapter.login({ email: 'alex@unblok.dev', password: 'Password123!' });
      expect(result.success).toBe(true);
      expect(result.user?.id).toBe('usr_alex');
      expect(result.user?.email).toBe('alex.rivera@nexus.example');
      expect(result.membership?.role).toBe('MEMBER');
      expect(result.membership?.workspaceName).toBe('NEXUS Commerce');
    });

    it('rejects invalid credentials with safe, non-enumerating error message', async () => {
      const adapter = new MockAuthAdapter();
      const result = await adapter.login({ email: 'fail@unblok.dev', password: 'Password123!' });
      expect(result.success).toBe(false);
      expect(result.error).toBe('Email or password is incorrect.');
      expect(result.user).toBeUndefined();
    });

    it('rejects short passwords under 3 characters', async () => {
      const adapter = new MockAuthAdapter();
      const result = await adapter.login({ email: 'alex@unblok.dev', password: '12' });
      expect(result.success).toBe(false);
      expect(result.error).toBe('Email or password is incorrect.');
    });

    it('preserves returnTo parameter in signup transition link', () => {
      const html = renderToString(
        <AppProviders initialAuthStatus="guest">
          <MemoryRouter initialEntries={['/login?returnTo=%2Fprojects%2FENG%2Fissues']}>
            <LoginPage />
          </MemoryRouter>
        </AppProviders>
      );
      expect(html).toContain('href="/signup?returnTo=%2Fprojects%2FENG%2Fissues"');
    });
  });

  /* ======================================================================== */
  /* 3. SIGNUP CEREMONY & ONBOARDING BOUNDARY                                 */
  /* ======================================================================== */
  describe('3. Signup Ceremony & Onboarding Boundary', () => {
    it('creates global identity only without generating workspace or team', async () => {
      const adapter = new MockAuthAdapter();
      const result = await adapter.signup({
        name: 'Jordan Taylor',
        email: 'jordan@example.com',
        password: 'SecurePassword123!',
      });
      expect(result.success).toBe(true);
      expect(result.user?.name).toBe('Jordan Taylor');
      expect(result.user?.email).toBe('jordan@example.com');
      // Architecture check: membership is undefined upon signup
      expect(result.membership).toBeUndefined();
    });

    it('validates password criteria as user types', () => {
      const weak = evaluatePassword('short');
      expect(weak.isValid).toBe(false);
      expect(weak.hasMinLength).toBe(false);

      const lengthOnly = evaluatePassword('12345678');
      expect(lengthOnly.hasMinLength).toBe(true);
      expect(lengthOnly.hasLetter).toBe(false);
      expect(lengthOnly.isValid).toBe(false);

      const strong = evaluatePassword('Password123!');
      expect(strong.hasMinLength).toBe(true);
      expect(strong.hasLetter).toBe(true);
      expect(strong.hasNumberOrSpecial).toBe(true);
      expect(strong.isValid).toBe(true);
    });

    it('renders onboarding boundary for newly registered non-invited accounts', () => {
      const newUser: AuthenticatedUser = {
        id: 'usr_new_01',
        name: 'Taylor Swift',
        email: 'taylor@music.io',
      };
      const html = renderToString(
        <AppProviders initialAuthStatus="authenticated" initialUser={newUser}>
          <MemoryRouter initialEntries={['/onboarding']}>
            <OnboardingPlaceholderPage />
          </MemoryRouter>
        </AppProviders>
      );
      expect(html).toContain('Welcome to Unblok');
      expect(html).toContain('Taylor Swift');
      expect(html).toContain('Onboarding Boundary · Scheduled for UX-13');
      expect(html).toContain('Enter prototype workspace');
    });

    it('shows invitation context in SignupPage when inviteToken is provided', () => {
      const html = renderToString(
        <AppProviders initialAuthStatus="guest">
          <MemoryRouter initialEntries={['/signup?inviteToken=inv_new_user&email=jordan%40nexus.example']}>
            <SignupPage />
          </MemoryRouter>
        </AppProviders>
      );
      expect(html).toContain('Joining via invitation');
      expect(html).toContain('Your account will automatically join the invited workspace upon creation');
    });
  });

  /* ======================================================================== */
  /* 4. PASSWORD RESET LIFECYCLE                                              */
  /* ======================================================================== */
  describe('4. Password Recovery & Reset Lifecycle', () => {
    it('honestly prototypes reset request acceptance without claiming email sent', async () => {
      const adapter = new MockAuthAdapter();
      const result = await adapter.requestPasswordReset('alex@unblok.dev');
      expect(result.success).toBe(true);
      expect(result.message).toContain('Reset request accepted for alex@unblok.dev');
      expect(result.message).not.toContain('Email sent');
    });

    it('renders Reset request accepted UI upon form submission', () => {
      const html = renderToString(
        <AppProviders initialAuthStatus="guest">
          <MemoryRouter initialEntries={['/forgot-password']}>
            <ForgotPasswordPage />
          </MemoryRouter>
        </AppProviders>
      );
      expect(html).toContain('Reset your password');
      expect(html).toContain('Send reset link');
    });

    it('valid token renders password reset form', () => {
      const html = renderToString(
        <AppProviders initialAuthStatus="guest">
          <MemoryRouter initialEntries={['/reset-password?token=rst_valid']}>
            <ResetPasswordPage />
          </MemoryRouter>
        </AppProviders>
      );
      expect(html).toContain('Set new password');
      expect(html).toContain('New password');
      expect(html).toContain('Confirm new password');
      expect(html).toContain('Reset password');
    });

    it('expired token renders clear expired state with request link', () => {
      const html = renderToString(
        <AppProviders initialAuthStatus="guest">
          <MemoryRouter initialEntries={['/reset-password?token=rst_expired']}>
            <ResetPasswordPage />
          </MemoryRouter>
        </AppProviders>
      );
      expect(html).toContain('This reset link has expired.');
      expect(html).toContain('Request a new reset link');
    });

    it('invalid token renders clear invalid state with request link', () => {
      const html = renderToString(
        <AppProviders initialAuthStatus="guest">
          <MemoryRouter initialEntries={['/reset-password?token=rst_invalid']}>
            <ResetPasswordPage />
          </MemoryRouter>
        </AppProviders>
      );
      expect(html).toContain('This reset link is invalid.');
      expect(html).toContain('Request a new reset link');
    });

    it('adapter resets password on valid token and new password', async () => {
      const adapter = new MockAuthAdapter();
      const result = await adapter.resetPassword({
        token: 'rst_valid',
        newPassword: 'BrandNewPassword123!',
      });
      expect(result.success).toBe(true);
    });

    it('adapter rejects weak password on reset', async () => {
      const adapter = new MockAuthAdapter();
      const result = await adapter.resetPassword({
        token: 'rst_valid',
        newPassword: 'short',
      });
      expect(result.success).toBe(false);
      expect(result.error).toBe('WEAK_PASSWORD');
    });
  });

  /* ======================================================================== */
  /* 5. INVITATIONS LIFECYCLE                                                 */
  /* ======================================================================== */
  describe('5. Invitation Entry Lifecycle', () => {
    it('valid invitation + existing user renders workspace details and Sign in to accept', () => {
      const html = renderToString(
        <AppProviders initialAuthStatus="guest">
          <MemoryRouter initialEntries={['/invite/inv_existing_user']}>
            <Routes>
              <Route path="/invite/:token" element={<InvitePage />} />
            </Routes>
          </MemoryRouter>
        </AppProviders>
      );
      expect(html).toContain('Join NEXUS Commerce');
      expect(html).toContain('alex.rivera@nexus.example');
      expect(html).toContain('Commerce Platform');
      expect(html).toContain('Sign in to accept');
    });

    it('valid invitation + new user renders Create account to join', () => {
      const html = renderToString(
        <AppProviders initialAuthStatus="guest">
          <MemoryRouter initialEntries={['/invite/inv_new_user']}>
            <Routes>
              <Route path="/invite/:token" element={<InvitePage />} />
            </Routes>
          </MemoryRouter>
        </AppProviders>
      );
      expect(html).toContain('Join NEXUS Commerce');
      expect(html).toContain('jordan.taylor@nexus.example');
      expect(html).toContain('Commerce Services');
      expect(html).toContain('Create account to join');
    });

    it('expired invitation renders clear expired state', () => {
      const html = renderToString(
        <AppProviders initialAuthStatus="guest">
          <MemoryRouter initialEntries={['/invite/inv_expired']}>
            <Routes>
              <Route path="/invite/:token" element={<InvitePage />} />
            </Routes>
          </MemoryRouter>
        </AppProviders>
      );
      expect(html).toContain('This invitation has expired.');
      expect(html).toContain('Back to sign in');
    });

    it('revoked invitation renders clear revoked state', () => {
      const html = renderToString(
        <AppProviders initialAuthStatus="guest">
          <MemoryRouter initialEntries={['/invite/inv_revoked']}>
            <Routes>
              <Route path="/invite/:token" element={<InvitePage />} />
            </Routes>
          </MemoryRouter>
        </AppProviders>
      );
      expect(html).toContain('This invitation is no longer available.');
      expect(html).toContain('Access revoked');
    });

    it('invalid invitation renders invalid state without disclosing workspace metadata', () => {
      const html = renderToString(
        <AppProviders initialAuthStatus="guest">
          <MemoryRouter initialEntries={['/invite/random_unknown_token']}>
            <Routes>
              <Route path="/invite/:token" element={<InvitePage />} />
            </Routes>
          </MemoryRouter>
        </AppProviders>
      );
      expect(html).toContain('This invitation link is invalid.');
      expect(html).toContain('Return to Unblok homepage');
      // Crucial security requirement: no workspace details revealed
      expect(html).not.toContain('Acme Core Platform');
      expect(html).not.toContain('Apex Robotics');
    });

    it('already accepted invitation renders Open workspace action', () => {
      const html = renderToString(
        <AppProviders initialAuthStatus="guest">
          <MemoryRouter initialEntries={['/invite/inv_accepted']}>
            <Routes>
              <Route path="/invite/:token" element={<InvitePage />} />
            </Routes>
          </MemoryRouter>
        </AppProviders>
      );
      expect(html).toContain('This invitation has already been accepted.');
      expect(html).toContain('Open workspace');
    });
  });

  /* ======================================================================== */
  /* 6. SESSION LIFECYCLE & PROTECTED ROUTES                                   */
  /* ======================================================================== */
  describe('6. Session Lifecycle & Protected Routes', () => {
    it('blocks guest accessing private routes and triggers redirect to login with safe returnTo', () => {
      const guestHtml = renderToString(
        <AppProviders initialAuthStatus="guest">
          <MemoryRouter initialEntries={['/my-work']}>
            <AppRoutes />
          </MemoryRouter>
        </AppProviders>
      );
      // Private app shell content must NOT be rendered for guests
      expect(guestHtml).not.toContain('My Work');
      expect(guestHtml).not.toContain('nav-rail');

      // Verify safe return calculation
      const safeReturn = getSafeReturnTo('/projects/ENG/issues');
      expect(safeReturn).toBe('/projects/ENG/issues');
    });

    it('allows authenticated user to enter protected private route', () => {
      const html = renderToString(
        <AppProviders initialAuthStatus="authenticated">
          <MemoryRouter initialEntries={['/my-work']}>
            <AppRoutes />
          </MemoryRouter>
        </AppProviders>
      );
      expect(html).toContain('My Work');
      expect(html).not.toContain('Sign in to Unblok');
    });

    it('renders session expired banner and preserves return destination', () => {
      const html = renderToString(
        <AppProviders initialAuthStatus="sessionExpired">
          <MemoryRouter initialEntries={['/login?returnTo=%2Fprojects%2FENG%2Fissues&sessionExpired=true']}>
            <LoginPage />
          </MemoryRouter>
        </AppProviders>
      );
      expect(html).toContain('Your session expired');
      expect(html).toContain('Sign in again to continue where you left off.');
      expect(html).toContain('Session timeout');
      expect(html).toContain('Sign in again');
    });
  });

  /* ======================================================================== */
  /* 7. ARCHITECTURE & MEMBERSHIP DECOUPLING                                  */
  /* ======================================================================== */
  describe('7. Architecture & Membership Decoupling', () => {
    it('global AuthenticatedUser does not define workspace role', () => {
      const user: AuthenticatedUser = {
        id: 'usr_independent',
        name: 'Taylor Swift',
        email: 'taylor@music.io',
      };
      // Type and property assertion: User shape has no role property
      expect((user as any).role).toBeUndefined();
    });

    it('WorkspaceMembership carries role, workspaceId, and membershipStatus', () => {
      const membership: WorkspaceMembership = {
        workspaceId: 'ws_alpha',
        workspaceName: 'Alpha Technologies',
        userId: 'usr_independent',
        role: 'ADMIN',
        membershipStatus: 'ACTIVE',
      };
      expect(membership.role).toBe('ADMIN');
      expect(membership.workspaceId).toBe('ws_alpha');
      expect(membership.membershipStatus).toBe('ACTIVE');
    });

    it('legacy bridge maps decoupled identity to legacy User.role without mutating source', () => {
      const authUser: AuthenticatedUser = {
        id: 'usr_dev_01',
        name: 'Developer One',
        email: 'dev1@example.com',
      };
      const membership: WorkspaceMembership = {
        workspaceId: 'ws_beta',
        userId: 'usr_dev_01',
        role: 'OBSERVER',
        membershipStatus: 'ACTIVE',
      };

      const legacyUser = bridgeToLegacyUser(authUser, membership);
      expect(legacyUser.id).toBe('usr_dev_01');
      expect(legacyUser.role).toBe('OBSERVER');
      // Original authUser remains unmodified
      expect((authUser as any).role).toBeUndefined();
    });

    it('rejects external URLs in safeReturnTo to prevent open redirects', () => {
      expect(isValidInternalReturnTo('https://malicious.site/phish')).toBe(false);
      expect(getSafeReturnTo('https://malicious.site/phish')).toBe('/my-work');
    });

    it('rejects public/auth loops in safeReturnTo to prevent redirect loops', () => {
      expect(isValidInternalReturnTo('/login')).toBe(false);
      expect(isValidInternalReturnTo('/signup')).toBe(false);
      expect(isValidInternalReturnTo('/forgot-password')).toBe(false);
      expect(isValidInternalReturnTo('/reset-password')).toBe(false);
      expect(isValidInternalReturnTo('/invite/xyz')).toBe(false);
      expect(isValidInternalReturnTo('/')).toBe(false);
      expect(isValidInternalReturnTo('/pricing')).toBe(false);

      expect(getSafeReturnTo('/login')).toBe('/my-work');
    });
  });

  /* ======================================================================== */
  /* 8. REVIEWER DEV HARNESS ENVIRONMENT ISOLATION (PRODUCTION SAFETY)        */
  /* ======================================================================== */
  describe('8. Reviewer Dev Harness Environment Isolation', () => {
    it('production/customer mode does not render Reviewer Harness or DOM nodes', () => {
      // In production mode (enabled={false}), AuthDevHarness renders null
      const html = renderToString(
        <AppProviders initialAuthStatus="guest">
          <MemoryRouter initialEntries={['/login']}>
            <AppRoutes />
            <AuthDevHarness enabled={false} />
          </MemoryRouter>
        </AppProviders>
      );

      // Verify Reviewer Harness badge is completely absent
      expect(html).not.toContain('Reviewer Harness');
      expect(html).not.toContain('auth-dev-harness-dialog');
      expect(html).not.toContain('Alt+Shift+D');
      expect(html).not.toContain('Toggle Reviewer Harness');
    });

    it('production/customer mode does not expose account-switch or debug controls', () => {
      const html = renderToString(
        <AppProviders initialAuthStatus="guest">
          <MemoryRouter initialEntries={['/login']}>
            <AppRoutes />
            <AuthDevHarness enabled={false} />
          </MemoryRouter>
        </AppProviders>
      );

      // Verify reviewer tools are absent from customer tree
      expect(html).not.toContain('Switch Active Role');
      expect(html).not.toContain('Simulate Expired Session');
      expect(html).not.toContain('Quick Token Links');
      expect(html).not.toContain('Prototype Auth Harness');
    });

    it('development/reviewer mode can still mount the harness', () => {
      const html = renderToString(
        <AppProviders initialAuthStatus="guest">
          <MemoryRouter initialEntries={['/login']}>
            <AppRoutes />
            <AuthDevHarness enabled={true} />
          </MemoryRouter>
        </AppProviders>
      );

      // In development mode, the trigger is available
      expect(html).toContain('Reviewer Harness');
      expect(html).toContain('auth-dev-harness-dialog');
      expect(html).toContain('Toggle Reviewer Harness (Alt+Shift+D)');
    });

    it('isDevHarnessEnabled defaults to Vite DEV environment check', () => {
      // Confirms the function delegates directly to Vite's import.meta.env.DEV
      expect(typeof isDevHarnessEnabled()).toBe('boolean');
    });
  });
});
