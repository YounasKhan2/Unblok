/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-12 Auth Card Container
 * Section 4 & 6: Compact, focused, fast, accessible, 400-440px wide desktop container.
 */

import React from 'react';

export interface AuthCardProps {
  badge?: React.ReactNode;
  title: string;
  subtitle?: string;
  banner?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const AuthCard: React.FC<AuthCardProps> = ({
  badge,
  title,
  subtitle,
  banner,
  children,
  footer,
}) => {
  return (
    <div className="w-full max-w-[440px] mx-auto bg-white border border-[var(--color-pub-border)] rounded-2xl p-6 sm:p-8 shadow-xl shadow-black/[0.04]">
      {/* Optional Top Badge / Status */}
      {badge && <div className="mb-4">{badge}</div>}

      {/* Title & Subtitle */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-pub-text-primary)]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-xs sm:text-sm text-[var(--color-pub-text-secondary)] leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {/* Optional In-Card Banner (e.g., Session Expired, Invitation Context) */}
      {banner && <div className="mb-5">{banner}</div>}

      {/* Main Form Body */}
      <div>{children}</div>

      {/* Optional Bottom Switcher / Footer */}
      {footer && (
        <div className="mt-6 pt-5 border-t border-[var(--color-pub-border)] text-center text-xs text-[var(--color-pub-text-secondary)]">
          {footer}
        </div>
      )}
    </div>
  );
};
