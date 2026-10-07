/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Flag } from 'lucide-react';
import { MarketingContainer } from '../components/MarketingContainer';
import { MarketingSection } from '../components/MarketingSection';
import { ProductCapture } from '../components/ProductCapture';

export const PlanningSection: React.FC = () => {
  return (
    <MarketingSection id="planning" hasBorder>
      <MarketingContainer>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* 5-column copy side */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <div className="pub-eyebrow">
                Plan
              </div>
              <h2 className="pub-section-title mb-4">
                Plan around reality.
              </h2>
              <p className="pub-body-lead text-base">
                Connect delivery plans to the work already in motion.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-[#6366f1] shrink-0 mt-0.5">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#111827]">
                    Time-Boxed Cycles
                  </h3>
                  <p className="text-xs text-[#4b5563] mt-0.5 leading-relaxed">
                    Scope sprint cadences with immediate visibility into which tasks are blocked and which are ready for active engineering.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-[#6366f1] shrink-0 mt-0.5">
                  <Flag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#111827]">
                    Strategic Milestones
                  </h3>
                  <p className="text-xs text-[#4b5563] mt-0.5 leading-relaxed">
                    Track multi-team delivery goals across squads with honest status derived from atomic issue dependencies.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/features"
                className="inline-flex items-center text-sm font-semibold text-[#6366f1] hover:text-[#4f46e5] group"
              >
                <span>Learn about causal planning systems</span>
                <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* 7-column product screenshot side */}
          <div className="lg:col-span-7">
            <ProductCapture
              src="/marketing/05-planning-cycles.png"
              alt="Unblok Planning Cycles showing active sprint status and issue distribution"
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
