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
      { path: '/features', expectedTitle: 'The visual capability atlas of Unblok' },
      { path: '/solutions', expectedTitle: 'Purpose-built workflows for technical teams' },
      { path: '/pricing', expectedTitle: 'Predictable evaluation. Commercial packaging in progress.' },
      { path: '/security', expectedTitle: 'Security principles and architecture boundaries' },
      { path: '/contact', expectedTitle: 'Contact the Unblok team' },
      { path: '/privacy', expectedTitle: 'Pre-Launch Privacy Notice' },
      { path: '/terms', expectedTitle: 'Pre-Launch Terms Notice' },
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
    const getAllPublicPagesHtml = () => [
      renderToString(<MemoryRouter><ProductPage /></MemoryRouter>),
      renderToString(<MemoryRouter><FeaturesPage /></MemoryRouter>),
      renderToString(<MemoryRouter><SolutionsPage /></MemoryRouter>),
      renderToString(<MemoryRouter><PricingPage /></MemoryRouter>),
      renderToString(<MemoryRouter><SecurityPage /></MemoryRouter>),
      renderToString(<MemoryRouter><ContactPage /></MemoryRouter>),
      renderToString(<MemoryRouter><PrivacyPage /></MemoryRouter>),
      renderToString(<MemoryRouter><TermsPage /></MemoryRouter>),
    ].join(' ');

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

    it('verifies explicit absence of prohibited terminology across all public pages', () => {
      const allPublicPagesHtml = getAllPublicPagesHtml();

      const prohibitedPatterns: { name: string; pattern: RegExp }[] = [
        { name: 'sprint', pattern: /\bsprints?\b/i },
        { name: 'burnup', pattern: /\bburnup\b/i },
        { name: 'burndown', pattern: /\bburndown\b/i },
        { name: 'velocity', pattern: /\bvelocity\b/i },
        { name: 'critical path', pattern: /critical path/i },
        { name: 'live delivery intelligence', pattern: /live delivery intelligence/i },
        { name: 'live dependency readiness', pattern: /live dependency readiness/i },
        { name: 'Delivery Health score', pattern: /Delivery Health score/i },
        { name: 'SOC 2 Type II audit engagement planned', pattern: /SOC 2 Type II audit engagement planned/i },
        { name: 'SAML/SSO', pattern: /SAML\/SSO/i },
        { name: 'MFA support', pattern: /MFA support/i },
        { name: 'row-level database security', pattern: /row-level database security/i },
        { name: 'Expected response within 1 business day', pattern: /Expected response within 1 business day/i },
        { name: 'Prototype Preview', pattern: /Prototype Preview/i },
        { name: 'backend mail processing', pattern: /backend mail processing/i },
        { name: 'evaluation license', pattern: /evaluation license/i },
        { name: 'revocable', pattern: /\brevocable\b/i },
        { name: 'non-transferable', pattern: /\bnon-transferable\b/i },
        { name: 'reverse engineer', pattern: /reverse engineer/i },
      ];

      prohibitedPatterns.forEach(({ name, pattern }) => {
        expect(allPublicPagesHtml, `Expected public pages NOT to contain prohibited phrase: "${name}"`).not.toMatch(pattern);
      });
    });

    it('verifies Security clearly separates prototype invariants from production requirements', () => {
      const securityHtml = renderToString(
        <MemoryRouter>
          <SecurityPage />
        </MemoryRouter>
      );

      // Distinguishes demonstrated invariants from production requirements
      expect(securityHtml).toContain('Demonstrated product invariant');
      expect(securityHtml).toContain('Cross-workspace relationships are forbidden by the domain contract');
      expect(securityHtml).toContain('Production requirement');
      expect(securityHtml).toContain('Workspace isolation must be authoritatively enforced by the production backend and data architecture');
      expect(securityHtml).toContain('UI permission restrictions are not production authorization');
    });

    it('verifies /privacy identifies itself as Pre-Launch Privacy Notice without premature commitments', () => {
      const privacyHtml = renderToString(
        <MemoryRouter>
          <PrivacyPage />
        </MemoryRouter>
      );

      expect(privacyHtml).toContain('Pre-Launch Privacy Notice');
      expect(privacyHtml).toContain('Workspace isolation is a production requirement and must be enforced authoritatively by the production system');
      expect(privacyHtml).not.toContain('enforced at the database row-level');
      expect(privacyHtml).not.toContain('hello@unblok.dev');
    });

    it('verifies /terms identifies itself as Pre-Launch Terms Notice and disclaims final commercial agreement', () => {
      const termsHtml = renderToString(
        <MemoryRouter>
          <TermsPage />
        </MemoryRouter>
      );

      expect(termsHtml).toContain('Pre-Launch Terms Notice');
      expect(termsHtml).toContain('not the final commercial Terms of Service');
      expect(termsHtml).toContain('Nothing on the current page or across our preview web surfaces should be interpreted as a final commercial agreement');
      expect(termsHtml).not.toContain('evaluation license');
      expect(termsHtml).not.toContain('reverse engineer');
      expect(termsHtml).not.toContain('hello@unblok.dev');
    });

    it('verifies /contact has no fake operational commitments or mailbox', () => {
      const contactHtml = renderToString(
        <MemoryRouter>
          <ContactPage />
        </MemoryRouter>
      );

      expect(contactHtml).toContain('Contact the Unblok team');
      expect(contactHtml).toContain('Inbound Closed During Pre-Launch');
      expect(contactHtml).not.toContain('hello@unblok.dev');
      expect(contactHtml).not.toContain('Expected response within 1 business day');
      expect(contactHtml).not.toContain('Prototype Preview');
      expect(contactHtml).not.toContain('Direct Client Dispatch');
      expect(contactHtml).not.toContain('backend mail processing');
    });

    it('contains no internal development phase jargon on customer-facing pages', () => {
      const allPublicPagesHtml = getAllPublicPagesHtml();

      expect(allPublicPagesHtml).not.toContain('UX-11');
      expect(allPublicPagesHtml).not.toContain('UX-12');
      expect(allPublicPagesHtml).not.toContain('Scheduled for UX');
      expect(allPublicPagesHtml).not.toContain('scheduled for production release');
      expect(allPublicPagesHtml).not.toContain('demo data');
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
