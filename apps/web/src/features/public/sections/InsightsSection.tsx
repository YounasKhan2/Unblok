/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart2 } from 'lucide-react';
import { MarketingContainer } from '../components/MarketingContainer';
import { MarketingSection } from '../components/MarketingSection';
import { ProductCapture } from '../components/ProductCapture';

export const InsightsSection: React.FC = () => {
  return (
    <MarketingSection id="insights" className="bg-[var(--color-pub-surface-subtle)]/60" hasBorder>
      <MarketingContainer>
        {/* Header Block */}
        <div className="max-w-2xl mx-auto text-center mb-10 sm:mb-14">
          <div className="pub-eyebrow justify-center">
            <BarChart2 className="w-3.5 h-3.5" />
            Understand
          </div>
          <h2 className="pub-section-title mb-4">
            See risk earlier.
          </h2>
          <p className="pub-body-lead mx-auto text-base sm:text-lg">
            Turn execution signals into clear attention points.
          </p>
        </div>

        {/* Real Product Command Center Capture */}
        <div className="max-w-6xl mx-auto">
          <ProductCapture
            src="/marketing/06-insights-command-center.png"
            alt="Unblok Insights command center showing delivery health score, active blockers count, and execution risk signals"
            displayUrl="unblok.io/insights"
            aspectRatio="16 / 10"
            shadow="elevated"
          />

          <div className="mt-8 text-center">
            <Link
              to="/features"
              className="pub-link-accent text-sm font-semibold"
            >
              <span>Explore execution insights</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        </div>
      </MarketingContainer>
    </MarketingSection>
  );
};
