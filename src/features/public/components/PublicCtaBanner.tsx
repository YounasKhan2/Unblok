/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Layers } from 'lucide-react';
import { MarketingContainer } from './MarketingContainer';

interface PublicCtaBannerProps {
  title?: string;
  description?: string;
  primaryCtaLabel?: string;
  primaryCtaTo?: string;
  secondaryCtaLabel?: string;
  secondaryCtaTo?: string;
  className?: string;
}

export const PublicCtaBanner: React.FC<PublicCtaBannerProps> = ({
  title = 'Ready to bring clarity to technical execution?',
  description = 'Manage day-to-day execution while understanding what is blocked, why it is blocked, and what needs attention next.',
  primaryCtaLabel = 'Get started',
  primaryCtaTo = '/signup',
  secondaryCtaLabel,
  secondaryCtaTo,
  className = '',
}) => {
  return (
    <section className={`py-16 sm:py-24 ${className}`}>
      <MarketingContainer size="narrow">
        <div className="bg-[var(--color-pub-surface)] border border-[var(--color-pub-border)] rounded-2xl p-8 sm:p-14 text-center shadow-lg shadow-black/[0.03] relative overflow-hidden">
          {/* Subtle accent border at top */}
          <div className="absolute top-0 inset-x-0 h-1 bg-[var(--color-pub-accent)]" />

          <div className="w-11 h-11 rounded-xl bg-[var(--color-pub-accent-subtle)] text-[var(--color-pub-accent)] mx-auto flex items-center justify-center mb-5 shadow-sm">
            <Layers className="w-5 h-5 stroke-[2.2]" />
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--color-pub-text-primary)] tracking-tight mb-3">
            {title}
          </h2>

          <p className="pub-body-lead mx-auto mb-8 text-sm sm:text-base max-w-xl">
            {description}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={primaryCtaTo}
              className="pub-btn-primary text-sm sm:text-base px-6 py-3 w-full sm:w-auto shadow-sm"
            >
              {primaryCtaLabel}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>

            {secondaryCtaLabel && secondaryCtaTo && (
              <Link
                to={secondaryCtaTo}
                className="pub-btn-secondary text-sm sm:text-base px-6 py-3 w-full sm:w-auto"
              >
                {secondaryCtaLabel}
              </Link>
            )}
          </div>
        </div>
      </MarketingContainer>
    </section>
  );
};
