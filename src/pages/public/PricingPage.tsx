/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Layers,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  Mail,
  Zap,
} from 'lucide-react';
import { PublicPageHero } from '../../features/public/components/PublicPageHero';
import { MarketingContainer } from '../../features/public/components/MarketingContainer';
import { MarketingSection } from '../../features/public/components/MarketingSection';
import { PublicCtaBanner } from '../../features/public/components/PublicCtaBanner';

export const PricingPage: React.FC = () => {
  return (
    <div className="flex flex-col w-full">
      {/* 1. Hero */}
      <PublicPageHero
        eyebrow="Pricing & Packaging"
        title="Predictable evaluation. Commercial packaging in progress."
        description="We are finalizing our commercial subscription tiers ahead of production launch. Explore full platform capabilities today during our active preview evaluation."
        badge={
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Evaluation Preview · Full Access
          </div>
        }
        actions={
          <>
            <Link to="/signup" className="pub-btn-primary text-sm sm:text-base px-6 py-3 shadow-sm">
              Get started
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
            <Link to="/contact" className="pub-btn-secondary text-sm sm:text-base px-6 py-3">
              Talk with our team
            </Link>
          </>
        }
      />

      {/* 2. Commercial Preview Banner */}
      <MarketingSection className="py-12 bg-[var(--color-pub-surface-subtle)] border-b border-[var(--color-pub-border)]">
        <MarketingContainer size="narrow">
          <div className="p-6 sm:p-8 rounded-2xl bg-[var(--color-pub-surface)] border border-[var(--color-pub-border)] shadow-sm text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--color-pub-accent-subtle)] text-[var(--color-pub-accent)] mb-4">
              <Zap className="w-5 h-5 stroke-[2]" />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-pub-text-primary)] mb-2">
              Preview Access Overview
            </h2>

            <p className="text-sm text-[var(--color-pub-text-secondary)] max-w-xl mx-auto leading-relaxed mb-6">
              During the current platform evaluation, all core execution, dependency modeling, planning, and delivery intelligence features are available for testing without subscription fees or payment requirements.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-[var(--color-pub-text-muted)]">
              <span className="px-3 py-1 rounded-full bg-[var(--color-pub-surface-subtle)] border border-[var(--color-pub-border)]">
                No credit card required
              </span>
              <span className="px-3 py-1 rounded-full bg-[var(--color-pub-surface-subtle)] border border-[var(--color-pub-border)]">
                Complete platform capabilities
              </span>
              <span className="px-3 py-1 rounded-full bg-[var(--color-pub-surface-subtle)] border border-[var(--color-pub-border)]">
                Workspace data portability
              </span>
            </div>
          </div>
        </MarketingContainer>
      </MarketingSection>

      {/* 3. Expected Packaging Dimensions */}
      <MarketingSection className="py-16 sm:py-24 border-b border-[var(--color-pub-border)]">
        <MarketingContainer>
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="pub-section-title mb-3">
              How packaging will be structured
            </h2>
            <p className="pub-body-lead mx-auto text-sm sm:text-base">
              Commercial plans will be organized around organizational scale and governance needs—never by restricting core dependency intelligence from technical teams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Dimension 1: Team Tier */}
            <div className="p-6 sm:p-8 rounded-2xl bg-[var(--color-pub-surface)] border border-[var(--color-pub-border)] shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-pub-accent)] block mb-1">
                  Foundation
                </span>
                <h3 className="text-xl font-bold text-[var(--color-pub-text-primary)] mb-2">
                  Technical Teams
                </h3>
                <p className="text-xs text-[var(--color-pub-text-secondary)] leading-relaxed mb-6">
                  Engineered for fast-moving product engineering teams running active sprint cycles and issue workflows.
                </p>

                <div className="pt-4 border-t border-[var(--color-pub-border)] space-y-3 text-xs text-[var(--color-pub-text-secondary)]">
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>My Work personal execution cockpit</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>First-class blocker relationships (A Blocks B)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Interactive Dependency Graph & Matrix</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Cycles & milestone delivery tracking</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Notification Inbox & activity streams</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-[var(--color-pub-border)]">
                <span className="text-xs font-semibold text-[var(--color-pub-text-muted)] block mb-3">
                  Currently available in preview
                </span>
                <Link to="/signup" className="pub-btn-secondary w-full justify-center text-xs">
                  Evaluate free
                </Link>
              </div>
            </div>

            {/* Dimension 2: Business / Multi-Team Tier */}
            <div className="p-6 sm:p-8 rounded-2xl bg-[var(--color-pub-surface)] border-2 border-[var(--color-pub-accent)] shadow-md flex flex-col justify-between relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[var(--color-pub-accent)] text-white text-[10px] font-bold uppercase tracking-wider">
                Recommended for Orgs
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-pub-accent)] block mb-1">
                  Scale
                </span>
                <h3 className="text-xl font-bold text-[var(--color-pub-text-primary)] mb-2">
                  Engineering Organizations
                </h3>
                <p className="text-xs text-[var(--color-pub-text-secondary)] leading-relaxed mb-6">
                  For mid-sized engineering departments coordinating delivery across multiple squads and shared architectural dependencies.
                </p>

                <div className="pt-4 border-t border-[var(--color-pub-border)] space-y-3 text-xs text-[var(--color-pub-text-secondary)]">
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>All Technical Teams capabilities</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Delivery Health & Execution Risk intelligence</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Dependency Pressure systemic bottleneck radar</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Cross-team ownership and teams directory</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Admin, Member, and Observer role enforcement</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-[var(--color-pub-border)]">
                <span className="text-xs font-semibold text-[var(--color-pub-accent)] block mb-3">
                  Pricing finalized at production launch
                </span>
                <Link to="/signup" className="pub-btn-primary w-full justify-center text-xs">
                  Start team evaluation
                </Link>
              </div>
            </div>

            {/* Dimension 3: Enterprise / Consultancies Tier */}
            <div className="p-6 sm:p-8 rounded-2xl bg-[var(--color-pub-surface)] border border-[var(--color-pub-border)] shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-pub-text-muted)] block mb-1">
                  Governance
                </span>
                <h3 className="text-xl font-bold text-[var(--color-pub-text-primary)] mb-2">
                  Consultancies & Enterprise
                </h3>
                <p className="text-xs text-[var(--color-pub-text-secondary)] leading-relaxed mb-6">
                  For engineering agencies and organizations requiring dedicated support, custom legal terms, and advanced workspace boundaries.
                </p>

                <div className="pt-4 border-t border-[var(--color-pub-border)] space-y-3 text-xs text-[var(--color-pub-text-secondary)]">
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>All Organization capabilities</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Multi-workspace client management</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Priority architecture & onboarding consultation</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Direct access to core engineering roadmap</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Tailored enterprise agreements & invoices</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-[var(--color-pub-border)]">
                <span className="text-xs font-semibold text-[var(--color-pub-text-muted)] block mb-3">
                  Custom consultation available
                </span>
                <Link to="/contact" className="pub-btn-secondary w-full justify-center text-xs">
                  Contact architecture team
                </Link>
              </div>
            </div>
          </div>
        </MarketingContainer>
      </MarketingSection>

      {/* 4. Commercial FAQ */}
      <MarketingSection className="py-16 sm:py-20 bg-[var(--color-pub-surface-subtle)] border-b border-[var(--color-pub-border)]">
        <MarketingContainer size="narrow">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-[var(--color-pub-text-primary)] mb-2">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-[var(--color-pub-text-secondary)]">
              Clear answers about our preview status, commercial timeline, and team onboarding.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-xl bg-[var(--color-pub-surface)] border border-[var(--color-pub-border)]">
              <h3 className="text-sm font-semibold text-[var(--color-pub-text-primary)] mb-1">
                Is Unblok free to test during development?
              </h3>
              <p className="text-xs text-[var(--color-pub-text-secondary)] leading-relaxed">
                Yes. Full platform capabilities are accessible during our preview phase. You can set up projects, create issues, test dependency graphs, and evaluate cycle workflows without paying any subscription fees.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[var(--color-pub-surface)] border border-[var(--color-pub-border)]">
              <h3 className="text-sm font-semibold text-[var(--color-pub-text-primary)] mb-1">
                When will final commercial pricing be announced?
              </h3>
              <p className="text-xs text-[var(--color-pub-text-secondary)] leading-relaxed">
                Final pricing and subscription plans will be formally announced prior to general production availability. Early evaluating teams will receive advance notice and grandfathered evaluation options.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[var(--color-pub-surface)] border border-[var(--color-pub-border)]">
              <h3 className="text-sm font-semibold text-[var(--color-pub-text-primary)] mb-1">
                Will core dependency features be locked behind high enterprise tiers?
              </h3>
              <p className="text-xs text-[var(--color-pub-text-secondary)] leading-relaxed">
                No. First-class blocker tracking (A Blocks B) is Unblok's core identity. Every engineer on every plan will always have access to dependency relationship mapping and blocker visibility.
              </p>
            </div>
          </div>
        </MarketingContainer>
      </MarketingSection>

      {/* 5. Final CTA */}
      <PublicCtaBanner
        title="Start evaluating Unblok with your team today"
        description="Experience the difference first-class dependency intelligence makes for technical delivery."
        primaryCtaLabel="Get started"
        primaryCtaTo="/signup"
        secondaryCtaLabel="Contact us"
        secondaryCtaTo="/contact"
      />
    </div>
  );
};
