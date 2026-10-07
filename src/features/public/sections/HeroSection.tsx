/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { MarketingContainer } from '../components/MarketingContainer';
import { ProductCapture } from '../components/ProductCapture';

export const HeroSection: React.FC = () => {
  return (
    <section className="pt-12 sm:pt-20 lg:pt-24 pb-16 sm:pb-24 overflow-hidden relative">
      <MarketingContainer>
        {/* Editorial Text Block */}
        <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16 pub-animate-fade-in">
          <div className="pub-eyebrow justify-center">
            Engineering Execution
          </div>

          <h1 className="pub-hero-title mb-6">
            Engineering execution,<br />
            unblocked.
          </h1>

          <p className="pub-body-lead mx-auto mb-8 text-base sm:text-lg">
            Know what’s moving, what’s stuck, and why.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              to="/my-work"
              className="pub-btn-primary text-base px-6 py-3 w-full sm:w-auto shadow-md"
            >
              Get started
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
            <a
              href="#execution"
              className="pub-btn-secondary text-base px-6 py-3 w-full sm:w-auto"
            >
              Explore Unblok
              <ChevronDown className="w-4 h-4 ml-1 opacity-70" />
            </a>
          </div>
        </div>

        {/* Large Genuine Product Capture */}
        <div className="max-w-6xl mx-auto relative px-2 sm:px-0">
          <ProductCapture
            src="/marketing/01-hero-my-work.png"
            mobileSrc="/marketing/01-hero-my-work-mobile.png"
            alt="Unblok My Work cockpit displaying active personal blockers, assigned tasks, and upstream dependency status"
            displayUrl="unblok.io/my-work"
            priority={true}
            shadow="elevated"
            className="transform sm:-rotate-[0.3deg] hover:rotate-0 transition-transform duration-500"
          />
        </div>
      </MarketingContainer>
    </section>
  );
};
