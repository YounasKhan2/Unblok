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
import { PublicHeader } from './components/PublicHeader';
import { PublicFooter } from './components/PublicFooter';
import { PublicPlaceholderPage } from './components/PublicPlaceholderPage';
import { ProductCapture } from './components/ProductCapture';
import { MarketingContainer } from './components/MarketingContainer';
import { HeroSection } from './sections/HeroSection';
import { ExecutionSection } from './sections/ExecutionSection';
import { DependenciesSection } from './sections/DependenciesSection';
import { IssueContextSection } from './sections/IssueContextSection';
import { PlanningSection } from './sections/PlanningSection';
import { InsightsSection } from './sections/InsightsSection';
import { FinalCtaSection } from './sections/FinalCtaSection';

describe('UX-11B Public Homepage & Routing Architecture Validation', () => {
  describe('1. Public Homepage Narrative & Section Presence', () => {
    it('renders all seven canonical homepage sections with correct headings and semantics', () => {
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

    it('contains no forbidden SaaS marketing fluff or fake proof', () => {
      const html = renderToString(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );

      expect(html).not.toContain('10,000 teams');
      expect(html).not.toContain('Trusted by');
      expect(html).not.toContain('Free trial');
      expect(html).not.toContain('free trial');
      expect(html).not.toContain('Zero setup');
      expect(html).not.toContain('zero setup');
      expect(html).not.toContain('predictive AI');
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

      // No Light/Dark/System theme switcher buttons
      expect(html).not.toContain('Dark Mode');
      expect(html).not.toContain('Light Mode');
      expect(html).not.toContain('System Theme');
      expect(html).not.toContain('theme-toggle');
    });
  });

  describe('3. PublicHeader Navigation & Semantics', () => {
    it('exposes desktop navigation links and direct live product entry', () => {
      const html = renderToString(
        <MemoryRouter>
          <PublicHeader />
        </MemoryRouter>
      );

      // Main Navigation links
      expect(html).toContain('href="/product"');
      expect(html).toContain('href="/features"');
      expect(html).toContain('href="/solutions"');
      expect(html).toContain('href="/pricing"');
      expect(html).toContain('href="/security"');

      // Actions linking to live product cockpit
      expect(html).toContain('href="/my-work"');
      expect(html).toContain('Sign in');
      expect(html).toContain('Get started');

      // Accessible toggle button
      expect(html).toContain('aria-label="Open navigation menu"');
      expect(html).toContain('aria-expanded="false"');
    });
  });

  describe('4. PublicFooter Structure', () => {
    it('renders clean four-column footer with legal and status indicators', () => {
      const html = renderToString(
        <MemoryRouter>
          <PublicFooter />
        </MemoryRouter>
      );

      expect(html).toContain('All systems operational');
      expect(html).toContain('href="/privacy"');
      expect(html).toContain('href="/terms"');
      expect(html).toContain('href="/security"');
      expect(html).toContain('© 2026 Unblok. Minimal. Informative. Creative.');
    });
  });

  describe('5. ProductCapture Component & Proof Quality', () => {
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

  describe('6. PublicPlaceholderPage Contract', () => {
    it('renders placeholder with clear phase labeling and return actions', () => {
      const html = renderToString(
        <MemoryRouter>
          <PublicPlaceholderPage
            title="Pricing & Packaging"
            category="Commercial"
            description="Dedicated commercial presentation surface."
            targetPhase="UX-11C"
          />
        </MemoryRouter>
      );

      expect(html).toContain('UX-11C');
      expect(html).toContain('Pricing &amp; Packaging');
      expect(html).toContain('Dedicated commercial presentation surface.');
      expect(html).toContain('href="/"');
      expect(html).toContain('href="/my-work"');
    });
  });
});
