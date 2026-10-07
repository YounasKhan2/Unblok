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
        eyebrow="Workflow Solutions"
        title="Purpose-built workflows for technical teams"
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
      <div className="bg-[var(--color-pub-surface)] border-b border-[var(--color-pub-border)] py-2.5">
        <MarketingContainer>
          <div className="flex items-center justify-start sm:justify-center gap-3 sm:gap-6 overflow-x-auto text-xs sm:text-sm font-semibold text-[var(--color-pub-text-secondary)] no-scrollbar py-0.5">
            <a href="#engineering-teams" className="px-3 py-1.5 rounded-full hover:bg-[var(--color-pub-surface-subtle)] hover:text-[var(--color-pub-text-primary)] transition-colors whitespace-nowrap">
              For Engineering Teams
            </a>
            <span className="text-[var(--color-pub-border-strong)]" aria-hidden="true">·</span>
            <a href="#engineering-leaders" className="px-3 py-1.5 rounded-full hover:bg-[var(--color-pub-surface-subtle)] hover:text-[var(--color-pub-text-primary)] transition-colors whitespace-nowrap">
              For Engineering Leaders
            </a>
            <span className="text-[var(--color-pub-border-strong)]" aria-hidden="true">·</span>
            <a href="#consultancies" className="px-3 py-1.5 rounded-full hover:bg-[var(--color-pub-surface-subtle)] hover:text-[var(--color-pub-text-primary)] transition-colors whitespace-nowrap">
              For Consultancies
            </a>
          </div>
        </MarketingContainer>
      </div>

      {/* 2. Audience 1: Engineering Teams */}
      <MarketingSection id="engineering-teams" className="py-20 sm:py-28 border-b border-[var(--color-pub-border)] pub-env-grid">
        <MarketingContainer>
          <div className="max-w-3xl mb-12 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-3">
              <Code2 className="w-3.5 h-3.5" />
              For Engineering Teams
            </div>
            <h2 className="pub-section-title mb-2">
              My Work → Issue → Blocker → Resolution
            </h2>
            <p className="pub-body-lead text-sm sm:text-base">
              A continuous workflow that eliminates surprise blockers and context switching.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-8">
              <ProductCapture
                src="/marketing/proof-issue-list.png"
                alt="Unblok Issue execution view showing personal commitments and inline blocker tags"
                displayUrl="unblok.app/projects/ENG/issues"
                shadow="elevated"
              />
            </div>
            <div className="lg:col-span-4 space-y-4">
              <div className="p-4 rounded-xl bg-[var(--color-pub-surface)] border border-[var(--color-pub-border)] shadow-sm">
                <span className="text-[11px] font-bold text-[var(--color-pub-accent)] uppercase tracking-wider block mb-1">Step 1 · Pick Up</span>
                <h3 className="text-sm font-bold text-[var(--color-pub-text-primary)] mb-1">Personal Cockpit</h3>
                <p className="text-xs text-[var(--color-pub-text-secondary)]">Active commitments and blocker warnings in one view.</p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--color-pub-surface)] border border-[var(--color-pub-border)] shadow-sm">
                <span className="text-[11px] font-bold text-[var(--color-pub-accent)] uppercase tracking-wider block mb-1">Step 2 · Triage</span>
                <h3 className="text-sm font-bold text-[var(--color-pub-text-primary)] mb-1">Slide-Over Context</h3>
                <p className="text-xs text-[var(--color-pub-text-secondary)]">Inspect subtasks and link upstream blockers without leaving the board.</p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--color-pub-surface)] border border-[var(--color-pub-border)] shadow-sm">
                <span className="text-[11px] font-bold text-[var(--color-pub-accent)] uppercase tracking-wider block mb-1">Step 3 · Unblock</span>
                <h3 className="text-sm font-bold text-[var(--color-pub-text-primary)] mb-1">First-Class Resolution</h3>
                <p className="text-xs text-[var(--color-pub-text-secondary)]">Resolving an upstream task unblocks dependent teammates automatically.</p>
              </div>
            </div>
          </div>
        </MarketingContainer>
      </MarketingSection>

      {/* 3. Audience 2: Engineering Leaders */}
      <MarketingSection id="engineering-leaders" className="py-20 sm:py-28 bg-[var(--color-pub-surface-subtle)] border-b border-[var(--color-pub-border)] pub-env-signals">
        <MarketingContainer>
          <div className="max-w-3xl mb-12 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-3">
              <TrendingUp className="w-3.5 h-3.5" />
              For Engineering Leaders
            </div>
            <h2 className="pub-section-title mb-2">
              Delivery health without individual surveillance
            </h2>
            <p className="pub-body-lead text-sm sm:text-base">
              Identify systemic bottleneck tasks and cross-team dependency pressure before sprint reviews turn into surprise delays.
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

      {/* 4. Audience 3: Engineering Consultancies */}
      <MarketingSection id="consultancies" className="py-20 sm:py-28 border-b border-[var(--color-pub-border)] pub-env-timeline">
        <MarketingContainer>
          <div className="max-w-3xl mb-12 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 text-xs font-bold uppercase tracking-wider mb-3">
              <Briefcase className="w-3.5 h-3.5" />
              For Consultancies & Multi-Project Teams
            </div>
            <h2 className="pub-section-title mb-2">
              Transparent delivery across concurrent client projects
            </h2>
            <p className="pub-body-lead text-sm sm:text-base">
              Multi-project ownership boundaries with objective blocker documentation when external client requirements stall delivery.
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
