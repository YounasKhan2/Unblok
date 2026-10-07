/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from '../../pages/public/HomePage';
import { PublicLayout } from '../../app/layouts/PublicLayout';
import { AuthLayout } from '../../app/layouts/AuthLayout';
import { AuthPlaceholderPage } from '../auth/components/AuthPlaceholderPage';
import { PublicHeader } from './components/PublicHeader';
import { PublicFooter } from './components/PublicFooter';
import { PublicPlaceholderPage } from './components/PublicPlaceholderPage';
import { PublicNotFoundPage } from './components/PublicNotFoundPage';
import { PrivateNotFoundPage } from '../../pages/placeholder/PrivateNotFoundPage';
import { ProductCapture } from './components/ProductCapture';
import { HeroSection } from './sections/HeroSection';
import { FinalCtaSection } from './sections/FinalCtaSection';
import { AppRoutes } from '../../app/router/AppRouter';
import { AppProviders } from '../../app/providers/AppProviders';

describe('UX-11B Public Homepage & Routing Architecture Validation', () => {
  describe('1. Public Homepage Narrative & Section Presence', () => {
    it('renders all seven canonical homepage sections with minimal, grounded copy', () => {
      const html = renderToString(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );

      // Hero
      expect(html).toContain('Engineering execution,');
      expect(html).toContain('unblocked.');
      expect(html).toContain('Know what’s moving, what’s stuck, and why.');

      // Execution
      expect(html).toContain('Start with what matters.');
      expect(html).toContain('Your priorities, blockers, and active work—together.');

      // Dependencies
      expect(html).toContain('See the chain.');
      expect(html).toContain('Know what&#x27;s blocked—and what gets affected next.');

      // Issue Context
      expect(html).toContain('Work without losing your place.');
      expect(html).toContain('Triage, update, and collaborate from the same execution view.');

      // Planning
      expect(html).toContain('Plan around reality.');
      expect(html).toContain('Connect delivery plans to the work already in motion.');

      // Insights
      expect(html).toContain('See risk earlier.');
      expect(html).toContain('Turn execution signals into clear attention points.');

      // Final CTA
      expect(html).toContain('Less chasing. More shipping.');
      expect(html).toContain('Start unblocking your team today.');
    });

    it('contains no forbidden SaaS marketing fluff, ungrounded claims, or fake proof', () => {
      const html = renderToString(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );

      // Prohibited generic SaaS tropes
      expect(html).not.toContain('10,000 teams');
      expect(html).not.toContain('Trusted by');
      expect(html).not.toContain('Free trial');
      expect(html).not.toContain('free trial');
      expect(html).not.toContain('Zero setup');
      expect(html).not.toContain('zero setup');

      // Prohibited ungrounded capability claims (Item 8 Capability Audit)
      expect(html).not.toMatch(/\bburndown\b/i);
      expect(html).not.toMatch(/\bvelocity\b/i);
      expect(html).not.toMatch(/\bsprint\b/i);
      expect(html).not.toMatch(/\bcritical path\b/i);
      expect(html).not.toMatch(/\breal-time\b/i);
      expect(html).not.toMatch(/\bautomatic\b/i);
      expect(html).not.toMatch(/\bautomated\b/i);
      expect(html).not.toMatch(/\bpredictive\b/i);
      expect(html).not.toMatch(/\bAI\b/);
      expect(html).not.toMatch(/\blead intervention\b/i);
      expect(html).not.toMatch(/\batomic issue dependencies\b/i);
    });

    it('contains no fake operational status or internal prototype development copy on public surfaces', () => {
      const homeHtml = renderToString(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );
      expect(homeHtml).not.toContain('All systems operational');
      expect(homeHtml).not.toContain('live prototype');
      expect(homeHtml).not.toContain('demo data');

      const footerHtml = renderToString(
        <MemoryRouter>
          <PublicFooter />
        </MemoryRouter>
      );
      expect(footerHtml).not.toContain('All systems operational');
      expect(footerHtml).not.toContain('animate-pulse');
    });
  });

  describe('2. PublicLayout & Fixed Theme Isolation', () => {
    it('wraps content in the unblok-public-theme container with semantic landmarks', () => {
      const html = renderToString(
        <MemoryRouter>
          <PublicLayout />
        </MemoryRouter>
      );

      expect(html).toContain('class="unblok-public-theme"');
      expect(html).toContain('<header');
      expect(html).toContain('<main id="main-content"');
      expect(html).toContain('<footer');
    });

    it('strictly exposes no theme toggle switchers on public surfaces', () => {
      const html = renderToString(
        <MemoryRouter>
          <PublicLayout />
        </MemoryRouter>
      );

      expect(html).not.toContain('Dark Mode');
      expect(html).not.toContain('Light Mode');
      expect(html).not.toContain('System Theme');
      expect(html).not.toContain('theme-toggle');
    });
  });

  describe('3. Auth CTA Routing & Boundary Ownership', () => {
    it('routes Sign in to /login and Get started to /signup across header, hero, and final CTA', () => {
      const headerHtml = renderToString(
        <MemoryRouter>
          <PublicHeader />
        </MemoryRouter>
      );

      // Desktop & Mobile Header CTAs
      expect(headerHtml).toContain('href="/login"');
      expect(headerHtml).toContain('href="/signup"');
      expect(headerHtml).not.toContain('href="/my-work"');

      // Hero CTA
      const heroHtml = renderToString(
        <MemoryRouter>
          <HeroSection />
        </MemoryRouter>
      );
      expect(heroHtml).toContain('href="/signup"');
      expect(heroHtml).not.toContain('href="/my-work"');

      // Final CTA
      const finalCtaHtml = renderToString(
        <MemoryRouter>
          <FinalCtaSection />
        </MemoryRouter>
      );
      expect(finalCtaHtml).toContain('href="/signup"');
      expect(finalCtaHtml).not.toContain('href="/my-work"');
    });

    it('renders dedicated AuthLayout with centered canvas and no AppShell rail', () => {
      const authHtml = renderToString(
        <MemoryRouter>
          <AuthLayout />
        </MemoryRouter>
      );

      expect(authHtml).toContain('Back to homepage');
      expect(authHtml).toContain('Terms of Service');
      expect(authHtml).toContain('Privacy Policy');
      expect(authHtml).not.toContain('nav-rail');
      expect(authHtml).not.toContain('workspace-header');
    });

    it('renders honest UX-12 AuthPlaceholderPage for /login and /signup', () => {
      const loginHtml = renderToString(
        <MemoryRouter>
          <AuthPlaceholderPage mode="login" />
        </MemoryRouter>
      );
      expect(loginHtml).toContain('Sign in to Unblok');
      expect(loginHtml).toContain('Authentication experience coming in UX-12');
      expect(loginHtml).toContain('href="/signup"');

      const signupHtml = renderToString(
        <MemoryRouter>
          <AuthPlaceholderPage mode="signup" />
        </MemoryRouter>
      );
      expect(signupHtml).toContain('Create your Unblok account');
      expect(signupHtml).toContain('Authentication experience coming in UX-12');
      expect(signupHtml).toContain('href="/login"');
    });
  });

  describe('4. Deterministic 404 Route Ownership', () => {
    it('renders Public 404 for truly unknown global/public URLs within PublicLayout', () => {
      const urls = ['/unknown', '/company', '/random-page', '/something-that-does-not-exist'];

      urls.forEach((url) => {
        const html = renderToString(
          <AppProviders>
            <MemoryRouter initialEntries={[url]}>
              <AppRoutes />
            </MemoryRouter>
          </AppProviders>
        );

        // Renders Public 404 inside PublicLayout
        expect(html).toContain('404 — Page Not Found');
        expect(html).toContain('Return to Homepage');
        expect(html).toContain('Explore Product');
        expect(html).toContain('class="unblok-public-theme"');

        // Does NOT render in AppShellLayout
        expect(html).not.toContain('Resource Not Found');
        expect(html).not.toContain('workspace-sidebar');
      });
    });

    it('retains in-shell Private 404 ownership for unknown descendants under all canonical private namespaces', () => {
      const privateUrls = [
        '/projects/ENG/nonexistent',
        '/issues/nonexistent/extra',
        '/teams/ENG/nonexistent',
        '/cycles/nonexistent/extra',
        '/milestones/nonexistent/extra',
        '/settings/nonexistent',
        '/dependencies/nonexistent',
        '/roadmap/nonexistent',
        '/insights/nonexistent',
        '/my-work/nonexistent',
        '/inbox/nonexistent',
      ];

      privateUrls.forEach((url) => {
        const html = renderToString(
          <AppProviders>
            <MemoryRouter initialEntries={[url]}>
              <AppRoutes />
            </MemoryRouter>
          </AppProviders>
        );

        // Must stay inside AppShell and render in-shell Private 404
        expect(html).toContain('Resource Not Found');
        expect(html).toContain('Go to My Work');
        expect(html).toContain('Open Search (⌘K)');

        // Must NOT fall into Public 404
        expect(html).not.toContain('404 — Page Not Found');
        expect(html).not.toContain('Return to Homepage');
      });
    });
  });

  describe('5. Mobile Navigation & Accessibility Attributes', () => {
    it('configures accessible dialog attributes on mobile navigation', () => {
      const html = renderToString(
        <MemoryRouter>
          <PublicHeader />
        </MemoryRouter>
      );

      expect(html).toContain('aria-label="Open navigation menu"');
      expect(html).toContain('aria-expanded="false"');
      expect(html).toContain('aria-controls="mobile-navigation-menu"');
    });
  });

  describe('6. ProductCapture Component & Proof Quality', () => {
    it('renders browser bezel frame with window dots and URL label', () => {
      const html = renderToString(
        <ProductCapture
          src="/marketing/01-hero-my-work.png"
          alt="My Work Cockpit"
          displayUrl="unblok.io/my-work"
          priority={true}
        />
      );

      expect(html).toContain('pub-browser-frame');
      expect(html).toContain('pub-browser-bar');
      expect(html).toContain('pub-browser-dot');
      expect(html).toContain('unblok.io/my-work');
      expect(html).toContain('loading="eager"');
      expect(html).toContain('fetchPriority="high"');
      expect(html).toContain('alt="My Work Cockpit"');
    });

    it('renders responsive picture tag when mobileSrc is supplied', () => {
      const html = renderToString(
        <ProductCapture
          src="/marketing/01-hero-my-work.png"
          mobileSrc="/marketing/01-hero-my-work-mobile.png"
          alt="Responsive Test"
        />
      );

      expect(html).toContain('<picture>');
      expect(html).toContain('media="(max-width: 640px)"');
      expect(html).toContain('srcSet="/marketing/01-hero-my-work-mobile.png"');
      expect(html).toContain('src="/marketing/01-hero-my-work.png"');
    });
  });

  describe('7. PublicPlaceholderPage Contract', () => {
    it('renders placeholder with Coming Soon and auth/home actions without internal phase jargon', () => {
      const html = renderToString(
        <MemoryRouter>
          <PublicPlaceholderPage
            title="Pricing & Packaging"
            category="Commercial"
            description="Dedicated commercial presentation surface."
          />
        </MemoryRouter>
      );

      expect(html).toContain('Coming Soon');
      expect(html).not.toContain('UX-11C');
      expect(html).not.toContain('Scheduled for');
      expect(html).toContain('Pricing &amp; Packaging');
      expect(html).toContain('Dedicated commercial presentation surface.');
      expect(html).toContain('href="/"');
      expect(html).toContain('href="/signup"');
    });
  });
});
