/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, AlertTriangle, ShieldCheck } from 'lucide-react';
import { MarketingContainer } from '../components/MarketingContainer';
import { MarketingSection } from '../components/MarketingSection';
import { ProductCapture } from '../components/ProductCapture';

export const ExecutionSection: React.FC = () => {
  return (
    <MarketingSection id="execution" className="bg-[var(--color-pub-surface-subtle)]/60" hasBorder>
      <MarketingContainer>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Asymmetric 5-column copy side */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <div className="pub-eyebrow">
                Execute
              </div>
              <h2 className="pub-section-title mb-4">
                Start with what matters.
              </h2>
              <p className="pub-body-lead text-base sm:text-lg">
                Your priorities, blockers, and active work—together.
              </p>
            </div>

            <div>
              <Link
                to="/features"
                className="pub-link-accent text-sm font-semibold group"
              >
                <span>Learn about personal execution triage</span>
                <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Asymmetric 7-column product screenshot side */}
          <div className="lg:col-span-7">
            <ProductCapture
              src="/marketing/02-execution-blockers.png"
              alt="Unblok My Work cockpit showing personal blocker alerts and blocking others queue"
              displayUrl="unblok.io/my-work?filter=blocked"
              aspectRatio="16 / 10"
              shadow="default"
            />
          </div>
        </div>
      </MarketingContainer>
    </MarketingSection>
  );
};
