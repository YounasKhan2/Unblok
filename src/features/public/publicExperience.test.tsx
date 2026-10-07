/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../../app/router/AppRouter';
import { AppProviders } from '../../app/providers/AppProviders';
import { ProductPage } from '../../pages/public/ProductPage';
import { FeaturesPage } from '../../pages/public/FeaturesPage';
import { SolutionsPage } from '../../pages/public/SolutionsPage';
import { PricingPage } from '../../pages/public/PricingPage';
import { SecurityPage } from '../../pages/public/SecurityPage';
import { ContactPage } from '../../pages/public/ContactPage';
import { PrivacyPage } from '../../pages/public/PrivacyPage';
import { TermsPage } from '../../pages/public/TermsPage';
import { PublicHeader } from './components/PublicHeader';
import { PublicFooter } from './components/PublicFooter';

describe('UX-11C Complete Public Experience Tests', () => {
  const renderRoute = (url: string) => {
    return renderToString(
      <AppProviders>
        <MemoryRouter initialEntries={[url]}>
          <AppRoutes />
        </MemoryRouter>
      </AppProviders>
    );
  };

  describe('1. Public Routes Completion & Real Page Rendering', () => {
    const routes = [
      { path: '/product', expectedTitle: 'The complete execution lifecycle' },
      { path: '/features', expectedTitle: 'Comprehensive features for engineering execution' },
      { path: '/solutions', expectedTitle: 'Purpose-built for technical teams' },
      { path: '/pricing', expectedTitle: 'Predictable evaluation. Commercial packaging in progress.' },
      { path: '/security', expectedTitle: 'Security principles and architecture boundaries' },
      { path: '/contact', expectedTitle: 'Contact the Unblok team' },
      { path: '/privacy', expectedTitle: 'Privacy Notice' },
      { path: '/terms', expectedTitle: 'Terms of Service' },
    ];

    routes.forEach(({ path, expectedTitle }) => {
      it(`renders real page for ${path} with intended title and no placeholder`, () => {
        const html = renderRoute(path);

        // Renders real page title
        expect(html).toContain(expectedTitle);

        // Does NOT render PublicPlaceholderPage
        expect(html).not.toContain('Coming Soon');
        expect(html).not.toContain('Dedicated commercial presentation surface');
        expect(html).not.toContain('Public Route Specification');

        // Contained within PublicLayout with fixed public theme
        expect(html).toContain('class="unblok-public-theme"');
        expect(html).toContain('<header');
        expect(html).toContain('<footer');
      });
    });
  });

  describe('2. Navigation Links & CTAs Integrity', () => {
    it('contains valid destinations in PublicHeader', () => {
      const html = renderToString(
        <MemoryRouter>
          <PublicHeader />
        </MemoryRouter>
      );

      expect(html).toContain('href="/product"');
      expect(html).toContain('href="/features"');
      expect(html).toContain('href="/solutions"');
      expect(html).toContain('href="/pricing"');
      expect(html).toContain('href="/security"');

      // Auth CTAs strictly route to /login and /signup
      expect(html).toContain('href="/login"');
      expect(html).toContain('href="/signup"');
    });

    it('contains valid destinations in PublicFooter', () => {
      const html = renderToString(
        <MemoryRouter>
          <PublicFooter />
        </MemoryRouter>
      );

      expect(html).toContain('href="/product"');
      expect(html).toContain('href="/features"');
      expect(html).toContain('href="/pricing"');
      expect(html).toContain('href="/solutions"');
      expect(html).toContain('href="/security"');
      expect(html).toContain('href="/privacy"');
      expect(html).toContain('href="/terms"');
      expect(html).toContain('href="/contact"');
    });

    it('ensures CTAs across all completed public pages target /signup or /login', () => {
      const pages = [
        <ProductPage />,
        <FeaturesPage />,
        <SolutionsPage />,
        <PricingPage />,
        <SecurityPage />,
        <ContactPage />,
      ];

      pages.forEach((pageComponent) => {
        const html = renderToString(
          <MemoryRouter>
            {pageComponent}
          </MemoryRouter>
        );

        // CTAs targeting auth boundary
        if (html.includes('Get started') || html.includes('Evaluate free') || html.includes('Start team evaluation')) {
          expect(html).toContain('href="/signup"');
        }
      });
    });
  });

  describe('3. Truth Audit: Grounded Content & Absence of Fabrications', () => {
    it('verifies pricing contains no invented dollar prices, fake seat limits, or SLAs', () => {
      const html = renderToString(
        <MemoryRouter>
          <PricingPage />
        </MemoryRouter>
      );

      expect(html).not.toMatch(/\$\d+/); // No dollar signs with numbers
      expect(html).not.toContain('per user / month');
      expect(html).not.toContain('99.9% uptime');
      expect(html).not.toContain('99.99%');
      expect(html).toContain('Commercial packaging in progress');
      expect(html).toContain('No credit card required');
    });

    it('verifies security page contains no fake compliance certifications or audits', () => {
      const html = renderToString(
        <MemoryRouter>
          <SecurityPage />
        </MemoryRouter>
      );

      // Must not claim certified status
      expect(html).not.toContain('SOC 2 certified');
      expect(html).not.toContain('SOC 2 Type II certified');
      expect(html).not.toContain('ISO 27001 certified');
      expect(html).not.toContain('HIPAA compliant');
      expect(html).not.toContain('GDPR certified');

      // Transparently discloses preview state
      expect(html).toContain('Commitment to Factual Representation');
      expect(html).toContain('pre-compliance');
    });

    it('verifies privacy and terms clearly communicate pre-launch preview status', () => {
      const privacyHtml = renderToString(
        <MemoryRouter>
          <PrivacyPage />
        </MemoryRouter>
      );
      expect(privacyHtml).toContain('Pre-Launch Notice');
      expect(privacyHtml).toContain('Pre-Launch Privacy Notice');

      const termsHtml = renderToString(
        <MemoryRouter>
          <TermsPage />
        </MemoryRouter>
      );
      expect(termsHtml).toContain('Pre-Launch Notice');
      expect(termsHtml).toContain('Pre-Launch Terms of Service');
    });

    it('contains no internal development phase jargon on customer-facing pages', () => {
      const allPublicPagesHtml = [
        renderToString(<MemoryRouter><ProductPage /></MemoryRouter>),
        renderToString(<MemoryRouter><FeaturesPage /></MemoryRouter>),
        renderToString(<MemoryRouter><SolutionsPage /></MemoryRouter>),
        renderToString(<MemoryRouter><PricingPage /></MemoryRouter>),
        renderToString(<MemoryRouter><SecurityPage /></MemoryRouter>),
        renderToString(<MemoryRouter><ContactPage /></MemoryRouter>),
        renderToString(<MemoryRouter><PrivacyPage /></MemoryRouter>),
        renderToString(<MemoryRouter><TermsPage /></MemoryRouter>),
      ].join(' ');

      expect(allPublicPagesHtml).not.toContain('UX-11');
      expect(allPublicPagesHtml).not.toContain('UX-12');
      expect(allPublicPagesHtml).not.toContain('Scheduled for UX');
    });

    it('contains no fake customer testimonials or logos', () => {
      const allPublicPagesHtml = [
        renderToString(<MemoryRouter><ProductPage /></MemoryRouter>),
        renderToString(<MemoryRouter><FeaturesPage /></MemoryRouter>),
        renderToString(<MemoryRouter><SolutionsPage /></MemoryRouter>),
        renderToString(<MemoryRouter><PricingPage /></MemoryRouter>),
      ].join(' ');

      expect(allPublicPagesHtml).not.toContain('Testimonials');
      expect(allPublicPagesHtml).not.toContain('What our customers say');
      expect(allPublicPagesHtml).not.toContain('Trusted by Fortune 500');
    });
  });

  describe('4. Deterministic 404 Route Ownership Invariants Maintained', () => {
    it('unknown global URLs still render PublicNotFoundPage in PublicLayout', () => {
      const html = renderRoute('/unknown-route-12345');

      expect(html).toContain('404 — Page Not Found');
      expect(html).toContain('Return to Homepage');
      expect(html).toContain('class="unblok-public-theme"');
      expect(html).not.toContain('Resource Not Found');
    });

    it('unknown descendants of canonical private namespaces retain in-shell PrivateNotFoundPage', () => {
      const testPaths = [
        '/projects/ENG/nonexistent',
        '/issues/nonexistent/extra',
        '/cycles/nonexistent/extra',
        '/settings/nonexistent',
      ];

      testPaths.forEach((path) => {
        const html = renderRoute(path);

        expect(html).toContain('Resource Not Found');
        expect(html).toContain('Go to My Work');
        expect(html).not.toContain('404 — Page Not Found');
      });
    });
  });
});
