/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface CapabilityItem {
  name: string;
  description: string;
  badge?: string;
}

export interface CapabilityGroupProps {
  id?: string;
  title: string;
  eyebrow?: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  items: CapabilityItem[];
  className?: string;
}

export const CapabilityGroup: React.FC<CapabilityGroupProps> = ({
  id,
  title,
  eyebrow,
  description,
  icon: Icon,
  items,
  className = '',
}) => {
  return (
    <div id={id} className={`scroll-mt-24 p-6 sm:p-8 rounded-2xl bg-[var(--color-pub-surface)] border border-[var(--color-pub-border)] shadow-sm ${className}`}>
      {/* Category Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-[var(--color-pub-border)]">
        <div className="flex items-start gap-4">
          <div className="pub-accent-icon-box w-10 h-10 rounded-xl mt-0.5">
            <Icon className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            {eyebrow && (
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-pub-accent)] block mb-1">
                {eyebrow}
              </span>
            )}
            <h3 className="text-xl sm:text-2xl font-bold text-[var(--color-pub-text-primary)]">
              {title}
            </h3>
            <p className="text-sm text-[var(--color-pub-text-secondary)] mt-1 max-w-xl">
              {description}
            </p>
          </div>
        </div>
      </div>

      {/* Items list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
        {items.map((item) => (
          <div
            key={item.name}
            className="p-4 rounded-xl bg-[var(--color-pub-surface-subtle)]/50 border border-[var(--color-pub-border)]/60 hover:border-[var(--color-pub-border-strong)] transition-colors"
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <h4 className="text-sm font-semibold text-[var(--color-pub-text-primary)]">
                {item.name}
              </h4>
              {item.badge && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-pub-accent-subtle)] text-[var(--color-pub-accent)] uppercase tracking-wider whitespace-nowrap">
                  {item.badge}
                </span>
              )}
            </div>
            <p className="text-xs leading-relaxed text-[var(--color-pub-text-secondary)]">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
