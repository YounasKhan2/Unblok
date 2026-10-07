/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart2, ShieldAlert } from 'lucide-react';
import { MarketingContainer } from '../components/MarketingContainer';
import { MarketingSection } from '../components/MarketingSection';
import { ProductCapture } from '../components/ProductCapture';

export const InsightsSection: React.FC = () => {
  return (
    <MarketingSection id="insights" className="bg-[#f4f2ed]/50" hasBorder>
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
            alt="Unblok Insights command center showing delivery health score, active blockers count, and bottleneck leaderboard"
            displayUrl="unblok.io/insights"
            aspectRatio="16 / 10"
            shadow="elevated"
          />

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="bg-white border border-[#e5e3df] rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-[#111827] mb-1">
                Delivery Health Score
              </h3>
              <p className="text-xs text-[#4b5563] leading-relaxed">
                Objective scoring computed directly from unresolved blockers, overdue items, and sprint completion states.
              </p>
            </div>

            <div className="bg-white border border-[#e5e3df] rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-[#111827] mb-1">
                Bottleneck Radar
              </h3>
              <p className="text-xs text-[#4b5563] leading-relaxed">
                Identify which upstream issues are causing the largest cascade of blocked downstream work.
              </p>
            </div>

            <div className="bg-white border border-[#e5e3df] rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-[#111827] mb-1">
                High-Risk Flagging
              </h3>
              <p className="text-xs text-[#4b5563] leading-relaxed">
                Surface critical dependencies requiring immediate lead intervention before scheduled cycles slip.
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link
              to="/features"
              className="inline-flex items-center text-sm font-semibold text-[#6366f1] hover:text-[#4f46e5]"
            >
              <span>Explore execution insights & analytics</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        </div>
      </MarketingContainer>
    </MarketingSection>
  );
};
