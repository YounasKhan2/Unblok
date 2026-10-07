/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Code2,
  TrendingUp,
  Briefcase,
  CheckCircle2,
  GitFork,
  Activity,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { PublicPageHero } from '../../features/public/components/PublicPageHero';
import { MarketingContainer } from '../../features/public/components/MarketingContainer';
import { MarketingSection } from '../../features/public/components/MarketingSection';
import { ProductCapture } from '../../features/public/components/ProductCapture';
import { PublicCtaBanner } from '../../features/public/components/PublicCtaBanner';

export const SolutionsPage: React.FC = () => {
  return (
    <div className="flex flex-col w-full">
      {/* 1. Hero */}
      <PublicPageHero
        eyebrow="Solutions"
        title="Purpose-built for technical teams that deliver software"
        description="Whether you write code daily, lead an engineering organization, or deliver complex initiatives for clients, Unblok brings clarity to what is blocked and what ships next."
        actions={
          <>
            <Link to="/signup" className="pub-btn-primary text-sm sm:text-base px-6 py-3 shadow-sm">
              Get started
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
            <Link to="/pricing" className="pub-btn-secondary text-sm sm:text-base px-6 py-3">
              View packaging & access
            </Link>
          </>
        }
      />

      {/* Audience Quick Nav */}
      <div className="bg-[var(--color-pub-surface)] border-b border-[var(--color-pub-border)] py-3">
        <MarketingContainer>
          <div className="flex items-center justify-start sm:justify-center gap-3 sm:gap-6 overflow-x-auto text-xs sm:text-sm font-semibold text-[var(--color-pub-text-secondary)] no-scrollbar py-1">
            <a href="#engineering-teams" className="px-3 py-1.5 rounded-full hover:bg-[var(--color-pub-surface-subtle)] hover:text-[var(--color-pub-text-primary)] transition-colors whitespace-nowrap">
              For Engineering Teams
            </a>
            <span className="text-[var(--color-pub-border-strong)]" aria-hidden="true">·</span>
            <a href="#engineering-leaders" className="px-3 py-1.5 rounded-full hover:bg-[var(--color-pub-surface-subtle)] hover:text-[var(--color-pub-text-primary)] transition-colors whitespace-nowrap">
              For Engineering Leaders
            </a>
            <span className="text-[var(--color-pub-border-strong)]" aria-hidden="true">·</span>
            <a href="#consultancies" className="px-3 py-1.5 rounded-full hover:bg-[var(--color-pub-surface-subtle)] hover:text-[var(--color-pub-text-primary)] transition-colors whitespace-nowrap">
              For Consultancies & Multi-Project Teams
            </a>
          </div>
        </MarketingContainer>
      </div>

      {/* 2. Audience 1: Engineering Teams */}
      <MarketingSection id="engineering-teams" className="py-20 sm:py-28 border-b border-[var(--color-pub-border)]">
        <MarketingContainer>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                <Code2 className="w-3.5 h-3.5" />
                Engineering Teams
              </div>

              <h2 className="pub-section-title">
                Zero ambiguity on what is ready to code
              </h2>

              <p className="pub-body-lead text-base sm:text-lg">
                Engineers should not have to pull an issue only to find out halfway through that the API schema is missing, the design token is unmerged, or a dependent service is offline.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <div className="pub-accent-icon-box w-7 h-7 rounded-md mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--color-pub-text-primary)]">
                      Explicit blocker awareness before you start
                    </h3>
                    <p className="text-xs text-[var(--color-pub-text-secondary)] mt-0.5">
                      Visual blocker badges immediately signal when prerequisites are incomplete, preventing abandoned work-in-progress branches.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="pub-accent-icon-box w-7 h-7 rounded-md mt-0.5">
                    <GitFork className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--color-pub-text-primary)]">
                      Instant slide-over context triage
                    </h3>
                    <p className="text-xs text-[var(--color-pub-text-secondary)] mt-0.5">
                      Inspect descriptions, subtasks, activity logs, and link upstream blockers directly from the issue drawer without losing board position.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="pub-accent-icon-box w-7 h-7 rounded-md mt-0.5">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--color-pub-text-primary)]">
                      Focused personal cockpit
                    </h3>
                    <p className="text-xs text-[var(--color-pub-text-secondary)] mt-0.5">
                      My Work surfaces assigned cycle tasks and high-priority tickets so engineers start every day with crystal-clear focus.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <ProductCapture
                src="/marketing/02-execution-blockers.png"
                alt="Unblok My Work execution showing issues with blocker indicators"
                displayUrl="unblok.app/my-work"
                shadow="elevated"
              />
            </div>
          </div>
        </MarketingContainer>
      </MarketingSection>

      {/* 3. Audience 2: Engineering Leaders */}
      <MarketingSection id="engineering-leaders" className="py-20 sm:py-28 bg-[var(--color-pub-surface-subtle)] border-b border-[var(--color-pub-border)]">
        <MarketingContainer>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-7 order-2 lg:order-1">
              <ProductCapture
                src="/marketing/06-insights-command-center.png"
                alt="Unblok Insights command center showing Delivery Health and Dependency Pressure"
                displayUrl="unblok.app/insights"
                shadow="elevated"
              />
            </div>

            <div className="lg:col-span-5 space-y-6 order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                <TrendingUp className="w-3.5 h-3.5" />
                Engineering Leaders
              </div>

              <h2 className="pub-section-title">
                Delivery health without individual surveillance
              </h2>

              <p className="pub-body-lead text-base sm:text-lg">
                Engineering management is about clearing systemic friction and unblocking teams—not micro-managing lines of code or individual velocity charts. Unblok measures project delivery momentum and architectural bottlenecks.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <div className="pub-accent-icon-box w-7 h-7 rounded-md mt-0.5">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--color-pub-text-primary)]">
                      Deterministic delivery health
                    </h3>
                    <p className="text-xs text-[var(--color-pub-text-secondary)] mt-0.5">
                      Identify which projects are on track versus those accumulating blocker debt, based on actual dependency resolution speed.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="pub-accent-icon-box w-7 h-7 rounded-md mt-0.5">
                    <GitFork className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--color-pub-text-primary)]">
                      Dependency pressure visibility
                    </h3>
                    <p className="text-xs text-[var(--color-pub-text-secondary)] mt-0.5">
                      See which single architectural task is blocking five other teams so you can reassign resources to the true bottleneck.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="pub-accent-icon-box w-7 h-7 rounded-md mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--color-pub-text-primary)]">
                      Needs Attention triage
                    </h3>
                    <p className="text-xs text-[var(--color-pub-text-secondary)] mt-0.5">
                      Surface aging blockers and unassigned critical-path work before sprint reviews turn into surprise delays.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </MarketingContainer>
      </MarketingSection>

      {/* 4. Audience 3: Engineering Consultancies */}
      <MarketingSection id="consultancies" className="py-20 sm:py-28 border-b border-[var(--color-pub-border)]">
        <MarketingContainer>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 text-xs font-bold uppercase tracking-wider">
                <Briefcase className="w-3.5 h-3.5" />
                Consultancies & Multi-Project Teams
              </div>

              <h2 className="pub-section-title">
                Transparent delivery across concurrent client projects
              </h2>

              <p className="pub-body-lead text-base sm:text-lg">
                Technical agencies manage multiple client engagements with differing delivery cadences. Unblok keeps client workspaces separated, project owners clearly accountable, and external client blockers visible.
              </p>

              <div className="space-y-4 pt-2">
                <div className="p-4 rounded-xl bg-[var(--color-pub-surface-subtle)] border border-[var(--color-pub-border)]">
                  <h3 className="text-sm font-semibold text-[var(--color-pub-text-primary)] mb-1">
                    Multi-project ownership boundaries
                  </h3>
                  <p className="text-xs text-[var(--color-pub-text-secondary)]">
                    Keep projects cleanly separated by team and domain. Staff consultants across projects while retaining clean role and permission boundaries.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[var(--color-pub-surface-subtle)] border border-[var(--color-pub-border)]">
                  <h3 className="text-sm font-semibold text-[var(--color-pub-text-primary)] mb-1">
                    Objective blocker documentation for clients
                  </h3>
                  <p className="text-xs text-[var(--color-pub-text-secondary)]">
                    When deliverables stall due to delayed client credentials or missing third-party specs, the dependency chain proves exactly where the hold-up originated.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[var(--color-pub-surface-subtle)] border border-[var(--color-pub-border)]">
                  <h3 className="text-sm font-semibold text-[var(--color-pub-text-primary)] mb-1">
                    Auditable delivery trails
                  </h3>
                  <p className="text-xs text-[var(--color-pub-text-secondary)]">
                    Provide stakeholders with verifiable milestone progress, completed cycles, and clear activity history.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <ProductCapture
                src="/marketing/03-dependencies-chain.png"
                alt="Unblok Dependency chain proving multi-team handoffs"
                displayUrl="unblok.app/dependencies"
                shadow="elevated"
              />
            </div>
          </div>
        </MarketingContainer>
      </MarketingSection>

      {/* 5. Final CTA */}
      <PublicCtaBanner
        title="Find the right execution workflow for your team"
        description="Join engineering teams using Unblok to manage dependencies, eliminate blocker friction, and deliver on schedule."
        primaryCtaLabel="Get started"
        primaryCtaTo="/signup"
        secondaryCtaLabel="Contact our team"
        secondaryCtaTo="/contact"
      />
    </div>
  );
};
