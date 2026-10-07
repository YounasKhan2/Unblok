/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MarketingContainer } from './MarketingContainer';

interface PublicPageHeroProps {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  align?: 'left' | 'center';
  className?: string;
}

export const PublicPageHero: React.FC<PublicPageHeroProps> = ({
  eyebrow,
  title,
  description,
  actions,
  badge,
  align = 'center',
  className = '',
}) => {
  const isCenter = align === 'center';

  return (
    <section className={`pt-12 sm:pt-16 pb-12 sm:pb-16 border-b border-[var(--color-pub-border)] bg-[var(--color-pub-bg)] ${className}`}>
      <MarketingContainer>
        <div className={`max-w-3xl ${isCenter ? 'mx-auto text-center' : 'text-left'}`}>
          {badge && <div className={`mb-4 flex ${isCenter ? 'justify-center' : 'justify-start'}`}>{badge}</div>}

          {eyebrow && (
            <p className="pub-eyebrow mb-3">
              {eyebrow}
            </p>
          )}

          <h1 className="pub-hero-title mb-5 text-[var(--color-pub-text-primary)]">
            {title}
          </h1>

          <p className="pub-body-lead mb-8 text-[var(--color-pub-text-secondary)] mx-auto">
            {description}
          </p>

          {actions && (
            <div className={`flex flex-wrap items-center gap-3 ${isCenter ? 'justify-center' : 'justify-start'}`}>
              {actions}
            </div>
          )}
        </div>
      </MarketingContainer>
    </section>
  );
};
