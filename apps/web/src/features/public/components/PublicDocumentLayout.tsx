/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, ArrowUpRight } from 'lucide-react';
import { MarketingContainer } from './MarketingContainer';

export interface DocumentSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface PublicDocumentLayoutProps {
  title: string;
  eyebrow: string;
  effectiveDate: string;
  preLaunchNotice: string;
  sections: DocumentSection[];
}

export const PublicDocumentLayout: React.FC<PublicDocumentLayoutProps> = ({
  title,
  eyebrow,
  effectiveDate,
  preLaunchNotice,
  sections,
}) => {
  return (
    <div className="py-12 sm:py-16 bg-[var(--color-pub-bg)]">
      <MarketingContainer size="narrow">
        {/* Breadcrumb / Back Link */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-pub-text-muted)] hover:text-[var(--color-pub-text-primary)] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Overview
          </Link>
        </div>

        {/* Document Header */}
        <header className="mb-8 pb-8 border-b border-[var(--color-pub-border)]">
          <p className="pub-eyebrow mb-2">
            {eyebrow}
          </p>
          <h1 className="pub-hero-title text-3xl sm:text-4xl lg:text-5xl mb-4">
            {title}
          </h1>
          <p className="text-xs text-[var(--color-pub-text-muted)]">
            Effective Date: {effectiveDate} · Status: Pre-Launch Preview Notice
          </p>
        </header>

        {/* Pre-launch Transparency Notice */}
        <div className="mb-10 p-4 sm:p-5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-950 flex items-start gap-3.5">
          <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm leading-relaxed">
            <strong className="font-semibold block text-amber-900 mb-1">Pre-Launch Notice</strong>
            <p className="text-amber-800/90">{preLaunchNotice}</p>
          </div>
        </div>

        {/* Document Table of Contents */}
        <nav aria-label="Document Sections" className="mb-12 p-5 rounded-xl bg-[var(--color-pub-surface)] border border-[var(--color-pub-border)]">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-pub-text-muted)] mb-3">
            Contents
          </h2>
          <ol className="space-y-1.5 text-sm list-decimal list-inside text-[var(--color-pub-text-secondary)]">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="hover:text-[var(--color-pub-accent)] transition-colors"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Main Document Sections */}
        <div className="space-y-10 sm:space-y-12">
          {sections.map((section, idx) => (
            <article
              key={section.id}
              id={section.id}
              className="scroll-mt-24 pt-6 first:pt-0 border-t first:border-0 border-[var(--color-pub-border)]/60"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-pub-text-primary)] mb-4">
                {idx + 1}. {section.title}
              </h2>
              <div className="text-sm leading-relaxed text-[var(--color-pub-text-secondary)] space-y-4">
                {section.content}
              </div>
            </article>
          ))}
        </div>

        {/* Document Footer */}
        <div className="mt-16 pt-8 border-t border-[var(--color-pub-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[var(--color-pub-text-muted)]">
          <p>Questions regarding this notice? Contact our team.</p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-1 font-semibold text-[var(--color-pub-accent)] hover:underline"
          >
            Contact us <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </MarketingContainer>
    </div>
  );
};
