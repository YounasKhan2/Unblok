/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  GitFork,
  Compass,
  MessageSquare,
  Activity,
  Sliders,
  Layers,
} from 'lucide-react';
import { PublicPageHero } from '../../features/public/components/PublicPageHero';
import { MarketingContainer } from '../../features/public/components/MarketingContainer';
import { MarketingSection } from '../../features/public/components/MarketingSection';
import { ProductCapture } from '../../features/public/components/ProductCapture';
import { PublicCtaBanner } from '../../features/public/components/PublicCtaBanner';

export const FeaturesPage: React.FC = () => {
  return (
    <div className="flex flex-col w-full pub-env-grid">
      {/* 1. Hero */}
      <PublicPageHero
        eyebrow="Capability Atlas"
        title="The visual capability atlas of Unblok"
        description="Explore how Unblok brings high-density issue execution, first-class blocker modeling, cycle planning, and live delivery intelligence together."
        actions={
          <>
            <Link to="/signup" className="pub-btn-primary text-sm sm:text-base px-6 py-3 shadow-sm">
              Get started
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
            <Link to="/product" className="pub-btn-secondary text-sm sm:text-base px-6 py-3">
              Explore product narrative
            </Link>
          </>
        }
      />

      {/* Quick Jump Bar */}
      <nav aria-label="Features Atlas Index" className="sticky top-[60px] z-40 bg-[var(--color-pub-surface)]/95 backdrop-blur-md border-b border-[var(--color-pub-border)] py-2.5">
        <MarketingContainer>
          <div className="flex items-center gap-3 sm:gap-6 overflow-x-auto text-xs font-semibold text-[var(--color-pub-text-secondary)] no-scrollbar py-0.5">
            <span className="text-[var(--color-pub-text-muted)] uppercase tracking-wider text-[11px] whitespace-nowrap">Atlas:</span>
            <a href="#atlas-execution" className="px-2.5 py-1 rounded-md hover:bg-[var(--color-pub-surface-subtle)] hover:text-[var(--color-pub-text-primary)] transition-colors whitespace-nowrap">
              Execution
            </a>
            <a href="#atlas-dependencies" className="px-2.5 py-1 rounded-md hover:bg-[var(--color-pub-surface-subtle)] hover:text-[var(--color-pub-text-primary)] transition-colors whitespace-nowrap">
              Dependencies
            </a>
            <a href="#atlas-planning" className="px-2.5 py-1 rounded-md hover:bg-[var(--color-pub-surface-subtle)] hover:text-[var(--color-pub-text-primary)] transition-colors whitespace-nowrap">
              Planning
            </a>
            <a href="#atlas-collaboration" className="px-2.5 py-1 rounded-md hover:bg-[var(--color-pub-surface-subtle)] hover:text-[var(--color-pub-text-primary)] transition-colors whitespace-nowrap">
              Collaboration
            </a>
            <a href="#atlas-intelligence" className="px-2.5 py-1 rounded-md hover:bg-[var(--color-pub-surface-subtle)] hover:text-[var(--color-pub-text-primary)] transition-colors whitespace-nowrap">
              Intelligence
            </a>
          </div>
        </MarketingContainer>
      </nav>

      {/* 2. Atlas Section 1: Execution & Issue Workflows */}
      <MarketingSection id="atlas-execution" className="py-20 sm:py-28 border-b border-[var(--color-pub-border)]">
        <MarketingContainer>
          <div className="max-w-3xl mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-3">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Execution & Issue Workflows
            </div>
            <h2 className="pub-section-title mb-2">
              Move work without losing context
            </h2>
            <p className="pub-body-lead text-sm sm:text-base">
              High-density lists, instant slide-over triage, and inline multi-issue operations.
            </p>
          </div>

          {/* Dominant Real Visual: Issue List */}
          <div className="mb-10">
            <div className="flex items-center justify-between pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-pub-text-primary)] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--color-pub-accent)]" />
                High-Density Issue List
              </span>
              <span className="text-xs text-[var(--color-pub-text-muted)]">
                Inline status, severity priorities, and blocker badges
              </span>
            </div>
            <ProductCapture
              src="/marketing/proof-issue-list.png"
              alt="Unblok High-Density Issue List showing priorities, status pills, and blocker warnings"
              displayUrl="unblok.app/projects/ENG/issues"
              shadow="elevated"
            />
          </div>

          {/* Supporting Orbiting Visual Fragments */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Fragment 1: Issue Drawer */}
            <div className="p-5 rounded-2xl bg-[var(--color-pub-surface)] border border-[var(--color-pub-border)] shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-pub-accent)] block mb-1">
                  Contextual Panel
                </span>
                <h3 className="text-base font-bold text-[var(--color-pub-text-primary)] mb-1">
                  Slide-Over Issue Drawer
                </h3>
                <p className="text-xs text-[var(--color-pub-text-secondary)] mb-4">
                  Full issue details, blocker links, and comment threads without losing page position.
                </p>
              </div>
              <div className="rounded-xl overflow-hidden border border-[var(--color-pub-border)] bg-white max-h-[340px] shadow-sm">
                <img
                  src="/marketing/proof-issue-drawer.png"
                  alt="Unblok 440px Slide-Over Issue Drawer showing subtasks and blockers"
                  className="w-full object-cover object-top"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Fragment 2: Multi-Select & Bulk Actions */}
            <div className="p-5 rounded-2xl bg-[var(--color-pub-surface)] border border-[var(--color-pub-border)] shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-pub-accent)] block mb-1">
                  Batch Operations
                </span>
                <h3 className="text-base font-bold text-[var(--color-pub-text-primary)] mb-1">
                  Multi-Select Action Bar
                </h3>
                <p className="text-xs text-[var(--color-pub-text-secondary)] mb-4">
                  Batch assign, transition status, and set upstream blockers for multiple tasks in one step.
                </p>
              </div>
              <div className="rounded-xl overflow-hidden border border-[var(--color-pub-border)] bg-white max-h-[340px] shadow-sm flex items-end">
                <img
                  src="/marketing/proof-bulk-actions.png"
                  alt="Unblok Multi-Select Issue List with floating Bulk Action Bar"
                  className="w-full object-cover object-bottom"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Fragment 3: Board Columns */}
            <div className="p-5 rounded-2xl bg-[var(--color-pub-surface)] border border-[var(--color-pub-border)] shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-pub-accent)] block mb-1">
                  Visual Stages
                </span>
                <h3 className="text-base font-bold text-[var(--color-pub-text-primary)] mb-1">
                  Stage Kanban Board
                </h3>
                <p className="text-xs text-[var(--color-pub-text-secondary)] mb-4">
                  Drag-and-drop workflow stages with blocker guard indicators.
                </p>
              </div>
              <div className="rounded-xl overflow-hidden border border-[var(--color-pub-border)] bg-white max-h-[340px] shadow-sm">
                <img
                  src="/marketing/proof-board.png"
                  alt="Unblok Kanban Board stage columns with status transition guards"
                  className="w-full object-cover object-top"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </MarketingContainer>
      </MarketingSection>

      {/* 3. Atlas Section 2: Dependencies & Blockers */}
      <MarketingSection id="atlas-dependencies" className="py-20 sm:py-28 bg-[var(--color-pub-surface-subtle)] border-b border-[var(--color-pub-border)] pub-env-dependency">
        <MarketingContainer>
          <div className="max-w-3xl mb-12 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-pub-accent-subtle)] text-[var(--color-pub-accent)] text-xs font-bold uppercase tracking-wider mb-3">
              <GitFork className="w-3.5 h-3.5" />
              Blockers & Dependency Intelligence
            </div>
            <h2 className="pub-section-title mb-2">
              A Blocks B. Downstream impact exposed.
            </h2>
            <p className="pub-body-lead text-sm sm:text-base">
              First-class relationship modeling prevents premature starts and highlights critical-path delays.
            </p>
          </div>

          <div className="mb-8 relative z-10">
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
                First-class blocker relationships
              </h3>
              <p className="text-xs text-[var(--color-pub-text-secondary)] leading-relaxed">
                Explicit contracts enforce resolution order. If an API contract is incomplete, downstream UI work is visibly blocked across boards and lists.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-[var(--color-pub-surface)] border border-[var(--color-pub-border)] shadow-sm">
              <h3 className="text-sm font-bold text-[var(--color-pub-text-primary)] mb-1">
                Downstream impact visibility
              </h3>
              <p className="text-xs text-[var(--color-pub-text-secondary)] leading-relaxed">
                When an architectural task slips, immediately identify every feature, milestone, and team waiting on that resolution.
              </p>
            </div>
          </div>
        </MarketingContainer>
      </MarketingSection>

      {/* 4. Atlas Section 3: Planning & Milestones */}
      <MarketingSection id="atlas-planning" className="py-20 sm:py-28 border-b border-[var(--color-pub-border)] pub-env-timeline">
        <MarketingContainer>
          <div className="max-w-3xl mb-12 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 text-xs font-bold uppercase tracking-wider mb-3">
              <Compass className="w-3.5 h-3.5" />
              Planning & Roadmaps
            </div>
            <h2 className="pub-section-title mb-2">
              Plan around live execution state
            </h2>
            <p className="pub-body-lead text-sm sm:text-base">
              Time-boxed cycles and multi-milestone roadmaps connected directly to blocker readiness.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
            {/* Cycle Visual */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-pub-text-primary)]">
                  Time-Boxed Cycles
                </span>
                <span className="text-xs text-[var(--color-pub-text-muted)]">
                  Active iteration burnup & scope tracking
                </span>
              </div>
              <ProductCapture
                src="/marketing/proof-cycle.png"
                alt="Unblok Cycle iteration view showing burndown status and issue scope"
                displayUrl="unblok.app/cycles"
                shadow="default"
              />
            </div>

            {/* Roadmap Visual */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-pub-text-primary)]">
                  Strategic Roadmap
                </span>
                <span className="text-xs text-[var(--color-pub-text-muted)]">
                  Multi-milestone timeline visualization
                </span>
              </div>
              <ProductCapture
                src="/marketing/proof-roadmap.png"
                alt="Unblok Strategic Roadmap showing milestone release tracks"
                displayUrl="unblok.app/roadmap"
                shadow="default"
              />
            </div>
          </div>
        </MarketingContainer>
      </MarketingSection>

      {/* 5. Atlas Section 4: Collaboration & Inbox */}
      <MarketingSection id="atlas-collaboration" className="py-20 sm:py-28 bg-[var(--color-pub-surface-subtle)] border-b border-[var(--color-pub-border)]">
        <MarketingContainer>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-700 text-xs font-bold uppercase tracking-wider">
                <MessageSquare className="w-3.5 h-3.5" />
                In-Context Collaboration
              </div>
              <h2 className="pub-section-title">
                Discussions attached to the work
              </h2>
              <p className="pub-body-lead text-sm sm:text-base">
                Notification inbox and issue activity history keep decisions attached to issues, eliminating lost context in external chat channels.
              </p>
              <div className="space-y-2 pt-2 text-xs text-[var(--color-pub-text-secondary)]">
                <p>• Centralized inbox stream with unread triage and mark-read receipts</p>
                <p>• In-context mentions and blocker notifications</p>
                <p>• Tamper-evident change log for state and assignment mutations</p>
              </div>
            </div>

            <div className="lg:col-span-7">
              <ProductCapture
                src="/marketing/proof-inbox.png"
                alt="Unblok Notification Inbox showing triage stream and read receipts"
                displayUrl="unblok.app/inbox"
                shadow="elevated"
              />
            </div>
          </div>
        </MarketingContainer>
      </MarketingSection>

      {/* 6. Atlas Section 5: Intelligence & Delivery Health */}
      <MarketingSection id="atlas-intelligence" className="py-20 sm:py-28 border-b border-[var(--color-pub-border)] pub-env-signals">
        <MarketingContainer>
          <div className="max-w-3xl mb-12 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-700 text-xs font-bold uppercase tracking-wider mb-3">
              <Activity className="w-3.5 h-3.5" />
              Deterministic Intelligence
            </div>
            <h2 className="pub-section-title mb-2">
              Delivery Health & Dependency Pressure
            </h2>
            <p className="pub-body-lead text-sm sm:text-base">
              Objective signals calculated directly from active blockers, cycle progress, and high-risk work.
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
        title="Ready to evaluate Unblok for your team?"
        description="See how structured dependencies and visual execution clarity eliminate blockers before they cause delivery delays."
        primaryCtaLabel="Get started"
        primaryCtaTo="/signup"
        secondaryCtaLabel="Explore product story"
        secondaryCtaTo="/product"
      />
    </div>
  );
};
