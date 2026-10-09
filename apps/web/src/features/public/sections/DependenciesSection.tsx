/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, GitFork } from 'lucide-react';
import { MarketingContainer } from '../components/MarketingContainer';
import { MarketingSection } from '../components/MarketingSection';
import { ProductCapture } from '../components/ProductCapture';

export const DependenciesSection: React.FC = () => {
  return (
    <MarketingSection id="dependencies" hasBorder>
      <MarketingContainer>
        {/* Signature Header Block */}
        <div className="max-w-2xl mx-auto text-center mb-10 sm:mb-14">
          <div className="pub-eyebrow justify-center">
            <GitFork className="w-3.5 h-3.5" />
            Unblock
          </div>
          <h2 className="pub-section-title mb-4">
            See the chain.
          </h2>
          <p className="pub-body-lead mx-auto text-base sm:text-lg">
            Know what's blocked—and what gets affected next.
          </p>
        </div>

        {/* Expansive Full-Width Dependency Graph Visual */}
        <div className="max-w-6xl mx-auto">
          <ProductCapture
            src="/marketing/03-dependencies-chain.png"
            alt="Unblok Dependency graph canvas showing upstream infrastructure blockers impacting frontend delivery"
            displayUrl="unblok.io/dependencies"
            aspectRatio="16 / 10"
            shadow="elevated"
          />

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--color-pub-text-secondary)] px-2">
            <p className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--color-pub-blocked)]" />
              <span>Active blockers explicitly link prerequisite issues across teams</span>
            </p>
            <Link
              to="/features"
              className="pub-link-accent text-xs font-semibold"
            >
              <span>Explore dependency intelligence</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        </div>
      </MarketingContainer>
    </MarketingSection>
  );
};
