/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Construction } from 'lucide-react';
import { MarketingContainer } from './MarketingContainer';

interface PublicPlaceholderPageProps {
  title: string;
  category: string;
  description: string;
  targetPhase?: string;
}

export const PublicPlaceholderPage: React.FC<PublicPlaceholderPageProps> = ({
  title,
  category,
  description,
  targetPhase = 'UX-11C',
}) => {
  return (
    <div className="py-24 sm:py-32 flex-1 flex items-center">
      <MarketingContainer size="narrow">
        <div className="bg-white border border-[var(--color-pub-border)] rounded-2xl p-8 sm:p-12 shadow-sm text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-pub-accent-subtle)] text-[var(--color-pub-accent)] text-xs font-semibold mb-6">
            <Construction className="w-3.5 h-3.5" />
            <span>Public Route Specification · Scheduled for {targetPhase}</span>
          </div>

          <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-pub-text-muted)] mb-2">
            {category}
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-pub-text-primary)] tracking-tight mb-4">
            {title}
          </h1>
          <p className="text-base text-[var(--color-pub-text-secondary)] max-w-xl mx-auto leading-relaxed mb-8">
            {description}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/"
              className="pub-btn-secondary w-full sm:w-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Return Home
            </Link>
            <Link
              to="/signup"
              className="pub-btn-primary w-full sm:w-auto"
            >
              Get started
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </MarketingContainer>
    </div>
  );
};
