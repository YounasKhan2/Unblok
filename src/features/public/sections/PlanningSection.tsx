/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar } from 'lucide-react';
import { MarketingContainer } from '../components/MarketingContainer';
import { MarketingSection } from '../components/MarketingSection';
import { ProductCapture } from '../components/ProductCapture';

export const PlanningSection: React.FC = () => {
  return (
    <MarketingSection id="planning" hasBorder>
      <MarketingContainer>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Asymmetric copy side */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <div className="pub-eyebrow">
                <Calendar className="w-3.5 h-3.5" />
                Plan
              </div>
              <h2 className="pub-section-title mb-4">
                Plan around reality.
              </h2>
              <p className="pub-body-lead text-base sm:text-lg">
                Connect delivery plans to the work already in motion.
              </p>
            </div>

            <div className="pt-2">
              <Link
                to="/features"
                className="pub-link-accent group text-sm font-semibold"
              >
                <span>Explore planning capabilities</span>
                <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Product screenshot side */}
          <div className="lg:col-span-7">
            <ProductCapture
              src="/marketing/05-planning-cycles.png"
              alt="Unblok Planning Cycles showing active cycle progress, scope allocation, and issue status"
              displayUrl="unblok.io/cycles"
              aspectRatio="16 / 10"
              shadow="default"
            />
          </div>
        </div>
      </MarketingContainer>
    </MarketingSection>
  );
};
