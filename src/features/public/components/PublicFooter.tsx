/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Layers } from 'lucide-react';
import { MarketingContainer } from './MarketingContainer';

export const PublicFooter: React.FC = () => {
  return (
    <footer className="w-full bg-[var(--color-pub-surface-subtle)] border-t border-[var(--color-pub-border)] pt-16 pb-12 mt-auto">
      <MarketingContainer>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12 pb-12 border-b border-[var(--color-pub-border)]">
          {/* Brand & Positioning Column */}
          <div className="col-span-2 space-y-4">
            <Link
              to="/"
              className="flex items-center gap-2.5 text-[var(--color-pub-text-primary)] font-bold text-lg tracking-tight"
            >
              <div className="w-6 h-6 rounded-md bg-[var(--color-pub-accent)] flex items-center justify-center text-white">
                <Layers className="w-3.5 h-3.5 stroke-[2.2]" />
              </div>
              <span className="font-extrabold text-base tracking-tight">Unblok</span>
            </Link>
            <p className="text-sm text-[var(--color-pub-text-secondary)] max-w-sm leading-relaxed">
              High-density execution and dependency intelligence for technical engineering teams.
            </p>
          </div>

          {/* Column 1: Product */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-pub-text-primary)]">
              Product
            </h4>
            <ul className="space-y-2 text-sm text-[var(--color-pub-text-secondary)]">
              <li>
                <Link to="/product" className="hover:text-[var(--color-pub-text-primary)] transition-colors">
                  Overview
                </Link>
              </li>
              <li>
                <Link to="/features" className="hover:text-[var(--color-pub-text-primary)] transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-[var(--color-pub-text-primary)] transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-[var(--color-pub-text-primary)] transition-colors">
                  Sign in
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Solutions */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-pub-text-primary)]">
              Solutions
            </h4>
            <ul className="space-y-2 text-sm text-[var(--color-pub-text-secondary)]">
              <li>
                <Link to="/solutions" className="hover:text-[var(--color-pub-text-primary)] transition-colors">
                  Engineering Teams
                </Link>
              </li>
              <li>
                <Link to="/solutions" className="hover:text-[var(--color-pub-text-primary)] transition-colors">
                  Engineering Leaders
                </Link>
              </li>
              <li>
                <Link to="/solutions" className="hover:text-[var(--color-pub-text-primary)] transition-colors">
                  Consultancies
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Trust & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-pub-text-primary)]">
              Trust & Legal
            </h4>
            <ul className="space-y-2 text-sm text-[var(--color-pub-text-secondary)]">
              <li>
                <Link to="/security" className="hover:text-[var(--color-pub-text-primary)] transition-colors">
                  Security
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-[var(--color-pub-text-primary)] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-[var(--color-pub-text-primary)] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[var(--color-pub-text-primary)] transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--color-pub-text-muted)]">
          <p>© 2026 Unblok. Minimal. Informative. Creative.</p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="hover:text-[var(--color-pub-text-secondary)] transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-[var(--color-pub-text-secondary)] transition-colors">
              Terms
            </Link>
            <Link to="/security" className="hover:text-[var(--color-pub-text-secondary)] transition-colors">
              Security
            </Link>
          </div>
        </div>
      </MarketingContainer>
    </footer>
  );
};
