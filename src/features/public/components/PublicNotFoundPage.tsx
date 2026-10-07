/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-11A Public 404 Page (Not Found)
 * Clean editorial presentation rendered strictly inside PublicLayout.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Compass, FileQuestion } from 'lucide-react';
import { MarketingContainer } from './MarketingContainer';

export const PublicNotFoundPage: React.FC = () => {
  return (
    <div className="py-24 sm:py-32 flex-1 flex items-center justify-center">
      <MarketingContainer size="narrow">
        <div className="bg-white border border-[var(--color-pub-border)] rounded-2xl p-8 sm:p-14 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-[var(--color-pub-accent-subtle)] text-[var(--color-pub-accent)] flex items-center justify-center mx-auto mb-6 shadow-sm">
            <FileQuestion className="w-7 h-7 stroke-[2]" />
          </div>

          <div className="pub-eyebrow justify-center mb-3">
            404 Error
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-pub-text-primary)] tracking-tight mb-4">
            404 — Page Not Found
          </h1>

          <p className="text-base text-[var(--color-pub-text-secondary)] max-w-md mx-auto leading-relaxed mb-8">
            The page you are looking for does not exist, has been moved, or the URL is incorrect.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/"
              className="pub-btn-primary w-full sm:w-auto px-6 py-2.5 text-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Return to Homepage
            </Link>
            <Link
              to="/product"
              className="pub-btn-secondary w-full sm:w-auto px-6 py-2.5 text-sm"
            >
              <Compass className="w-4 h-4 mr-1.5" />
              Explore Product
            </Link>
          </div>
        </div>
      </MarketingContainer>
    </div>
  );
};
