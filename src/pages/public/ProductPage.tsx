/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, GitFork, Compass, MessageSquare, Activity } from 'lucide-react';
import { PublicPageHero } from '../../features/public/components/PublicPageHero';
import { MarketingContainer } from '../../features/public/components/MarketingContainer';
import { MarketingSection } from '../../features/public/components/MarketingSection';
import { ProductCapture } from '../../features/public/components/ProductCapture';
import { PublicCtaBanner } from '../../features/public/components/PublicCtaBanner';

export const ProductPage: React.FC = () => {
  return (
    <div className="flex flex-col w-full">
      {/* 1. Hero */}
      <PublicPageHero
        eyebrow="Product Journey"
        title="The complete execution lifecycle for technical teams"
        description="Connect day-to-day work with first-class dependency intelligence. Know what is blocked, why it is blocked, and what ships next."
        actions={
          <>
            <Link to="/signup" className="pub-btn-primary text-sm sm:text-base px-6 py-3 shadow-sm">
              Get started
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
            <Link to="/features" className="pub-btn-secondary text-sm sm:text-base px-6 py-3">
              View capability atlas
            </Link>
          </>
        }
      />

      {/* Lifecycle Navigation Bar */}
      <nav aria-label="Product Lifecycle Stages" className="sticky top-[60px] z-40 bg-[var(--color-pub-surface)]/95 backdrop-blur-md border-b border-[var(--color-pub-border)] py-2.5">
        <MarketingContainer>
          <div className="flex items-center justify-start sm:justify-center gap-2 sm:gap-6 overflow-x-auto text-xs sm:text-sm font-semibold text-[var(--color-pub-text-secondary)] py-0.5 no-scrollbar">
            <a href="#execute" className="px-3 py-1.5 rounded-full hover:bg-[var(--color-pub-surface-subtle)] hover:text-[var(--color-pub-text-primary)] transition-colors whitespace-nowrap">
              1. Execute
            </a>
            <span className="text-[var(--color-pub-border-strong)]" aria-hidden="true">→</span>
            <a href="#unblock" className="px-3 py-1.5 rounded-full text-[var(--color-pub-accent)] bg-[var(--color-pub-accent-subtle)] hover:opacity-90 transition-opacity whitespace-nowrap">
              2. Unblock
            </a>
            <span className="text-[var(--color-pub-border-strong)]" aria-hidden="true">→</span>
            <a href="#plan" className="px-3 py-1.5 rounded-full hover:bg-[var(--color-pub-surface-subtle)] hover:text-[var(--color-pub-text-primary)] transition-colors whitespace-nowrap">
              3. Plan
            </a>
            <span className="text-[var(--color-pub-border-strong)]" aria-hidden="true">→</span>
            <a href="#collaborate" className="px-3 py-1.5 rounded-full hover:bg-[var(--color-pub-surface-subtle)] hover:text-[var(--color-pub-text-primary)] transition-colors whitespace-nowrap">
              4. Collaborate
            </a>
            <span className="text-[var(--color-pub-border-strong)]" aria-hidden="true">→</span>
            <a href="#understand" className="px-3 py-1.5 rounded-full hover:bg-[var(--color-pub-surface-subtle)] hover:text-[var(--color-pub-text-primary)] transition-colors whitespace-nowrap">
              5. Understand
            </a>
          </div>
        </MarketingContainer>
      </nav>

      {/* 2. Stage 1: EXECUTE */}
      <MarketingSection id="execute" className="py-20 sm:py-28 border-b border-[var(--color-pub-border)] pub-env-grid">
        <MarketingContainer>
          <div className="max-w-3xl mb-8 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-3">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Stage 01 · Execute
            </div>
            <h2 className="pub-section-title mb-2">
              Move work without losing execution context
            </h2>
            <p className="pub-body-lead text-sm sm:text-base">
              High-density project issue lists surface status, priority, and immediate blocker state directly inline.
            </p>
          </div>

          <div className="relative z-10">
            <ProductCapture
              src="/marketing/proof-issue-list.png"
              alt="Unblok Project Issues list with state pills, severity icons, and blocker tags"
              displayUrl="unblok.app/projects/ENG/issues"
              shadow="elevated"
            />
          </div>
        </MarketingContainer>
      </MarketingSection>

      {/* 3. Stage 2: UNBLOCK (Signature Section) */}
      <MarketingSection id="unblock" className="py-20 sm:py-28 bg-[var(--color-pub-surface-subtle)] border-b border-[var(--color-pub-border)] pub-env-dependency">
        <MarketingContainer>
          <div className="max-w-3xl mx-auto text-center mb-10 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-pub-accent-subtle)] text-[var(--color-pub-accent)] text-xs font-bold uppercase tracking-wider mb-3">
              <GitFork className="w-3.5 h-3.5" />
              Stage 02 · Signature Differentiator
            </div>

            <h2 className="pub-section-title mb-3">
              Blockers as first-class relationships
            </h2>

            <p className="pub-body-lead mx-auto text-sm sm:text-base">
              Issue A Blocks Issue B is a real execution contract. Downstream impact is exposed before deadlines slip.
            </p>
          </div>

          <div className="mb-10 relative z-10">
            <ProductCapture
              src="/marketing/proof-dependencies.png"
              alt="Unblok Interactive Dependency Graph Canvas showing node linkages and blocker status"
              displayUrl="unblok.app/dependencies"
              shadow="elevated"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            <div className="p-5 rounded-2xl bg-[var(--color-pub-surface)] border border-[var(--color-pub-border)] shadow-sm">
              <h3 className="text-sm font-bold text-[var(--color-pub-text-primary)] mb-1">
                Upstream blocker enforcement
              </h3>
              <p className="text-xs text-[var(--color-pub-text-secondary)] leading-relaxed">
                Blocked issues are visibly flagged across every view. Engineers immediately know why work cannot start, preventing wasted setup effort on incomplete prerequisites.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--color-pub-surface)] border border-[var(--color-pub-border)] shadow-sm">
              <h3 className="text-sm font-bold text-[var(--color-pub-text-primary)] mb-1">
                Downstream impact visibility
              </h3>
              <p className="text-xs text-[var(--color-pub-text-secondary)] leading-relaxed">
                When a core service or database migration is delayed, Unblok shows all downstream features awaiting that resolution across teams and milestones.
              </p>
            </div>
          </div>
        </MarketingContainer>
      </MarketingSection>

      {/* 4. Stage 3: PLAN */}
      <MarketingSection id="plan" className="py-20 sm:py-28 border-b border-[var(--color-pub-border)] pub-env-timeline">
        <MarketingContainer>
          <div className="max-w-3xl mb-8 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 text-xs font-bold uppercase tracking-wider mb-3">
              <Compass className="w-3.5 h-3.5" />
              Stage 03 · Plan
            </div>

            <h2 className="pub-section-title mb-2">
              Plan around live dependency readiness
            </h2>

            <p className="pub-body-lead text-sm sm:text-base">
              Strategic roadmaps and milestones reflect actual delivery feasibility based on unresolved blocker paths.
            </p>
          </div>

          <div className="relative z-10">
            <ProductCapture
              src="/marketing/proof-roadmap.png"
              alt="Unblok Strategic Roadmap showing milestone release tracks"
              displayUrl="unblok.app/roadmap"
              shadow="elevated"
            />
          </div>
        </MarketingContainer>
      </MarketingSection>

      {/* 5. Stage 4: COLLABORATE */}
      <MarketingSection id="collaborate" className="py-20 sm:py-28 bg-[var(--color-pub-surface-subtle)] border-b border-[var(--color-pub-border)]">
        <MarketingContainer>
          <div className="max-w-3xl mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-700 text-xs font-bold uppercase tracking-wider mb-3">
              <MessageSquare className="w-3.5 h-3.5" />
              Stage 04 · Collaborate
            </div>

            <h2 className="pub-section-title mb-2">
              Discussions attached directly to the work
            </h2>

            <p className="pub-body-lead text-sm sm:text-base">
              A centralized notification inbox keeps assignments, unblock alerts, and mentions in a unified triage stream.
            </p>
          </div>

          <div>
            <ProductCapture
              src="/marketing/proof-inbox.png"
              alt="Unblok Notification Inbox showing triage stream and read receipts"
              displayUrl="unblok.app/inbox"
              shadow="elevated"
            />
          </div>
        </MarketingContainer>
      </MarketingSection>

      {/* 6. Stage 5: UNDERSTAND */}
      <MarketingSection id="understand" className="py-20 sm:py-28 border-b border-[var(--color-pub-border)] pub-env-signals">
        <MarketingContainer>
          <div className="max-w-3xl mb-8 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-700 text-xs font-bold uppercase tracking-wider mb-3">
              <Activity className="w-3.5 h-3.5" />
              Stage 05 · Understand
            </div>

            <h2 className="pub-section-title mb-2">
              Deterministic visibility into execution health
            </h2>

            <p className="pub-body-lead text-sm sm:text-base">
              Delivery Health scores, Needs Attention queues, and Dependency Pressure maps calculated from active work states.
            </p>
          </div>

          <div className="relative z-10">
            <ProductCapture
              src="/marketing/proof-insights.png"
              alt="Unblok Insights command center showing Delivery Health and Needs Attention queue"
              displayUrl="unblok.app/insights"
              shadow="elevated"
            />
          </div>
        </MarketingContainer>
      </MarketingSection>

      {/* 7. Final Conversion CTA */}
      <PublicCtaBanner
        title="Ready to experience high-density execution?"
        description="Explore how Unblok brings clarity to blockers, planning, and delivery health across your engineering organization."
        primaryCtaLabel="Get started"
        primaryCtaTo="/signup"
        secondaryCtaLabel="Explore capability atlas"
        secondaryCtaTo="/features"
      />
    </div>
  );
};
