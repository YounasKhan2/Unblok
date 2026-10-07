/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, GitFork, Compass, MessageSquare, Activity, ShieldCheck } from 'lucide-react';
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
        eyebrow="Product Overview"
        title="The complete execution lifecycle for technical teams"
        description="Unblok connects day-to-day issue execution with first-class dependency intelligence. Know exactly what is blocked, why it is blocked, and what to work on next."
        actions={
          <>
            <Link to="/signup" className="pub-btn-primary text-sm sm:text-base px-6 py-3 shadow-sm">
              Get started
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
            <Link to="/features" className="pub-btn-secondary text-sm sm:text-base px-6 py-3">
              View all features
            </Link>
          </>
        }
      />

      {/* Lifecycle Navigation Bar */}
      <nav aria-label="Product Lifecycle Stages" className="sticky top-[60px] z-40 bg-[var(--color-pub-surface)]/95 backdrop-blur-md border-b border-[var(--color-pub-border)] py-3">
        <MarketingContainer>
          <div className="flex items-center justify-start sm:justify-center gap-2 sm:gap-6 overflow-x-auto text-xs sm:text-sm font-semibold text-[var(--color-pub-text-secondary)] py-1 no-scrollbar">
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
      <MarketingSection id="execute" className="py-20 sm:py-28 border-b border-[var(--color-pub-border)]">
        <MarketingContainer>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Stage 01 · Execution
              </div>

              <h2 className="pub-section-title">
                Move work without losing context
              </h2>

              <p className="pub-body-lead text-base sm:text-lg">
                Technical teams lose hours jumping between disconnected boards, tracking sheets, and chat threads. Unblok gives engineers a focused personal cockpit that aggregates active commitments and shows immediate blocker status.
              </p>

              <div className="space-y-3 pt-2">
                <div className="p-3.5 rounded-xl bg-[var(--color-pub-surface)] border border-[var(--color-pub-border)]">
                  <h3 className="text-sm font-semibold text-[var(--color-pub-text-primary)] mb-1">
                    Personal cockpit in My Work
                  </h3>
                  <p className="text-xs text-[var(--color-pub-text-secondary)]">
                    Direct access to assigned issues, current cycle priorities, and items awaiting review without wading through team backlog noise.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--color-pub-surface)] border border-[var(--color-pub-border)]">
                  <h3 className="text-sm font-semibold text-[var(--color-pub-text-primary)] mb-1">
                    Slide-over issue drawer
                  </h3>
                  <p className="text-xs text-[var(--color-pub-text-secondary)]">
                    Triage, edit subtasks, and adjust status without navigating away from the project board or list.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <ProductCapture
                src="/marketing/01-hero-my-work.png"
                mobileSrc="/marketing/01-hero-my-work-mobile.png"
                alt="Unblok My Work personal execution cockpit showing active commitments and blocker alerts"
                displayUrl="unblok.app/my-work"
                shadow="elevated"
              />
            </div>
          </div>
        </MarketingContainer>
      </MarketingSection>

      {/* 3. Stage 2: UNBLOCK (Signature Section) */}
      <MarketingSection id="unblock" className="py-20 sm:py-28 bg-[var(--color-pub-surface-subtle)] border-b border-[var(--color-pub-border)]">
        <MarketingContainer>
          <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-pub-accent-subtle)] text-[var(--color-pub-accent)] text-xs font-bold uppercase tracking-wider mb-4">
              <GitFork className="w-3.5 h-3.5" />
              Stage 02 · Signature Differentiator
            </div>

            <h2 className="pub-section-title mb-4">
              Blockers as first-class relationships
            </h2>

            <p className="pub-body-lead mx-auto text-base sm:text-lg">
              Generic task managers treat dependencies as vague text comments or optional tags. In Unblok, <strong className="text-[var(--color-pub-text-primary)]">Issue A Blocks Issue B</strong> is a real execution contract.
            </p>
          </div>

          <div className="mb-12">
            <ProductCapture
              src="/marketing/03-dependencies-chain.png"
              alt="Unblok Dependency Graph showing active blocker chains and downstream impact visibility"
              displayUrl="unblok.app/dependencies"
              shadow="elevated"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[var(--color-pub-surface)] border border-[var(--color-pub-border)] shadow-sm">
              <h3 className="text-base font-bold text-[var(--color-pub-text-primary)] mb-2">
                Upstream blocker enforcement
              </h3>
              <p className="text-xs leading-relaxed text-[var(--color-pub-text-secondary)]">
                Blocked issues are visibly flagged across every view. Engineers immediately know why work cannot start, preventing wasted setup effort on incomplete prerequisites.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[var(--color-pub-surface)] border border-[var(--color-pub-border)] shadow-sm">
              <h3 className="text-base font-bold text-[var(--color-pub-text-primary)] mb-2">
                Downstream impact visibility
              </h3>
              <p className="text-xs leading-relaxed text-[var(--color-pub-text-secondary)]">
                When a core service or database migration is delayed, Unblok shows all downstream features awaiting that resolution across teams and milestones.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[var(--color-pub-surface)] border border-[var(--color-pub-border)] shadow-sm">
              <h3 className="text-base font-bold text-[var(--color-pub-text-primary)] mb-2">
                Interactive dependency graph
              </h3>
              <p className="text-xs leading-relaxed text-[var(--color-pub-text-secondary)]">
                Inspect complex multi-team initiative chains with node-level status badges, blocker indicators, and immediate issue preview drawers.
              </p>
            </div>
          </div>
        </MarketingContainer>
      </MarketingSection>

      {/* 4. Stage 3: PLAN */}
      <MarketingSection id="plan" className="py-20 sm:py-28 border-b border-[var(--color-pub-border)]">
        <MarketingContainer>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-7 order-2 lg:order-1">
              <ProductCapture
                src="/marketing/05-planning-cycles.png"
                alt="Unblok Planning surface showing active sprint cycles and milestone deliverables"
                displayUrl="unblok.app/cycles"
                shadow="elevated"
              />
            </div>

            <div className="lg:col-span-5 space-y-6 order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 text-xs font-bold uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5" />
                Stage 03 · Planning
              </div>

              <h2 className="pub-section-title">
                Plan around actual execution feasibility
              </h2>

              <p className="pub-body-lead text-base sm:text-lg">
                Sprints fail when planned work ignores underlying dependency readiness. Unblok connects cycle commitments directly to live blocker states.
              </p>

              <div className="space-y-4 pt-2">
                <div className="p-4 rounded-xl bg-[var(--color-pub-surface-subtle)] border border-[var(--color-pub-border)]">
                  <h3 className="text-sm font-semibold text-[var(--color-pub-text-primary)] mb-1">
                    Time-boxed Cycles
                  </h3>
                  <p className="text-xs text-[var(--color-pub-text-secondary)]">
                    Structure 2-week iterations with transparent burnup tracking and blocker density indicators for each cycle backlog.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[var(--color-pub-surface-subtle)] border border-[var(--color-pub-border)]">
                  <h3 className="text-sm font-semibold text-[var(--color-pub-text-primary)] mb-1">
                    Strategic Milestones & Roadmap
                  </h3>
                  <p className="text-xs text-[var(--color-pub-text-secondary)]">
                    Group deliverables into release milestones that surface critical path delays before commit deadlines are missed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </MarketingContainer>
      </MarketingSection>

      {/* 5. Stage 4: COLLABORATE */}
      <MarketingSection id="collaborate" className="py-20 sm:py-28 bg-[var(--color-pub-surface-subtle)] border-b border-[var(--color-pub-border)]">
        <MarketingContainer>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-700 text-xs font-bold uppercase tracking-wider">
                <MessageSquare className="w-3.5 h-3.5" />
                Stage 04 · Collaboration
              </div>

              <h2 className="pub-section-title">
                Contextual discussion where work actually happens
              </h2>

              <p className="pub-body-lead text-base sm:text-lg">
                Conversations stay attached to issues, blocker links, and status changes. No more hunting through ephemeral chat channels to find why a decision was made.
              </p>

              <div className="space-y-3 pt-2">
                <div className="p-3.5 rounded-xl bg-[var(--color-pub-surface)] border border-[var(--color-pub-border)]">
                  <h3 className="text-sm font-semibold text-[var(--color-pub-text-primary)] mb-1">
                    Centralized Inbox with triage state
                  </h3>
                  <p className="text-xs text-[var(--color-pub-text-secondary)]">
                    Review assigned issues, unblock mentions, and blocker notifications in a unified stream with mark-read receipts.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--color-pub-surface)] border border-[var(--color-pub-border)]">
                  <h3 className="text-sm font-semibold text-[var(--color-pub-text-primary)] mb-1">
                    Audit trail & activity stream
                  </h3>
                  <p className="text-xs text-[var(--color-pub-text-secondary)]">
                    Every dependency addition, status change, and assignment is preserved in the issue activity timeline.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <ProductCapture
                src="/marketing/07-collaboration-inbox.png"
                alt="Unblok Inbox showing notifications and triage workflow"
                displayUrl="unblok.app/inbox"
                shadow="elevated"
              />
            </div>
          </div>
        </MarketingContainer>
      </MarketingSection>

      {/* 6. Stage 5: UNDERSTAND */}
      <MarketingSection id="understand" className="py-20 sm:py-28 border-b border-[var(--color-pub-border)]">
        <MarketingContainer>
          <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-700 text-xs font-bold uppercase tracking-wider mb-4">
              <Activity className="w-3.5 h-3.5" />
              Stage 05 · Execution Intelligence
            </div>

            <h2 className="pub-section-title mb-4">
              Objective visibility into execution health
            </h2>

            <p className="pub-body-lead mx-auto text-base sm:text-lg">
              No black-box scores or opaque machine learning claims. Unblok calculates deterministic health signals from active cycle progress, stale blockers, and critical-path pressure.
            </p>
          </div>

          <div className="mb-12">
            <ProductCapture
              src="/marketing/06-insights-command-center.png"
              alt="Unblok Insights command center showing Delivery Health, Needs Attention, and Dependency Pressure"
              displayUrl="unblok.app/insights"
              shadow="elevated"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[var(--color-pub-surface)] border border-[var(--color-pub-border)] shadow-sm">
              <div className="pub-accent-icon-box w-9 h-9 rounded-lg mb-3">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-[var(--color-pub-text-primary)] mb-1.5">
                Delivery Health scoring
              </h3>
              <p className="text-xs leading-relaxed text-[var(--color-pub-text-secondary)]">
                Quantifies project delivery momentum across completed items, active blockers, and high-priority backlog density.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[var(--color-pub-surface)] border border-[var(--color-pub-border)] shadow-sm">
              <div className="pub-accent-icon-box w-9 h-9 rounded-lg mb-3">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-[var(--color-pub-text-primary)] mb-1.5">
                Needs Attention queue
              </h3>
              <p className="text-xs leading-relaxed text-[var(--color-pub-text-secondary)]">
                Surfaces issues with prolonged blocker staleness, unassigned critical tasks, and high downstream dependency load for immediate triage.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[var(--color-pub-surface)] border border-[var(--color-pub-border)] shadow-sm">
              <div className="pub-accent-icon-box w-9 h-9 rounded-lg mb-3">
                <GitFork className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-[var(--color-pub-text-primary)] mb-1.5">
                Dependency Pressure map
              </h3>
              <p className="text-xs leading-relaxed text-[var(--color-pub-text-secondary)]">
                Identifies systemic bottleneck issues holding up the greatest number of downstream deliverables across projects.
              </p>
            </div>
          </div>
        </MarketingContainer>
      </MarketingSection>

      {/* 7. Final Conversion CTA */}
      <PublicCtaBanner
        title="Ready to experience high-density execution?"
        description="Explore how Unblok brings clarity to blockers, planning, and delivery health across your engineering organization."
        primaryCtaLabel="Get started"
        primaryCtaTo="/signup"
        secondaryCtaLabel="Explore features directory"
        secondaryCtaTo="/features"
      />
    </div>
  );
};
