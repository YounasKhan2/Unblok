/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Layers } from 'lucide-react';
import { MarketingContainer } from '../components/MarketingContainer';
import { MarketingSection } from '../components/MarketingSection';

export const FinalCtaSection: React.FC = () => {
  return (
    <MarketingSection id="final-cta" className="py-24 sm:py-32">
      <MarketingContainer size="narrow">
        <div className="bg-white border border-[var(--color-pub-border)] rounded-2xl p-10 sm:p-16 text-center shadow-lg shadow-black/[0.03] relative overflow-hidden">
          {/* Subtle accent backdrop indicator */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-[var(--color-pub-accent)]" />

          <div className="w-12 h-12 rounded-xl bg-[var(--color-pub-accent-subtle)] text-[var(--color-pub-accent)] mx-auto flex items-center justify-center mb-6 shadow-sm">
            <Layers className="w-6 h-6 stroke-[2.2]" />
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[var(--color-pub-text-primary)] tracking-tight mb-4">
            Less chasing. More shipping.
          </h2>

          <p className="pub-body-lead mx-auto mb-8 text-base sm:text-lg">
            Start unblocking your team today.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              to="/signup"
              className="pub-btn-primary text-base px-7 py-3.5 w-full sm:w-auto shadow-md"
            >
              Get started
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
            <Link
              to="/product"
              className="pub-btn-secondary text-base px-7 py-3.5 w-full sm:w-auto"
            >
              Explore product
            </Link>
          </div>

          <p className="text-xs text-[var(--color-pub-text-muted)] mt-6">
            Explore the live prototype with complete workspace demo data.
          </p>
        </div>
      </MarketingContainer>
    </MarketingSection>
  );
};
