/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, PanelRightClose, MessageSquare } from 'lucide-react';
import { MarketingContainer } from '../components/MarketingContainer';
import { MarketingSection } from '../components/MarketingSection';
import { ProductCapture } from '../components/ProductCapture';

export const IssueContextSection: React.FC = () => {
  return (
    <MarketingSection id="context" className="bg-[#f4f2ed]/50" hasBorder>
      <MarketingContainer>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* 7-column product screenshot side (reverse placement from ExecutionSection for visual rhythm!) */}
          <div className="lg:col-span-7 order-2 lg:order-1">
            <ProductCapture
              src="/marketing/04-issue-drawer-context.png"
              mobileSrc="/marketing/04-issue-drawer-mobile.png"
              alt="Unblok Project Issues list with 440px slide-over IssueDrawer open for rapid in-context triage"
              displayUrl="unblok.io/projects/ENG/issues?drawer=ENG-2"
              aspectRatio="16 / 10"
              shadow="default"
            />
          </div>

          {/* 5-column copy side */}
          <div className="lg:col-span-5 space-y-6 order-1 lg:order-2">
            <div>
              <div className="pub-eyebrow">
                Stay in Context
              </div>
              <h2 className="pub-section-title mb-4">
                Work without losing your place.
              </h2>
              <p className="pub-body-lead text-base">
                Triage, update, and collaborate from the same execution view.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#6366f1] shrink-0 mt-0.5">
                  <PanelRightClose className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#111827]">
                    Dual-Surface Architecture
                  </h3>
                  <p className="text-xs text-[#4b5563] mt-0.5 leading-relaxed">
                    Slide-over drawers let you inspect properties, update blockers, and review activity streams without losing list scroll position or filters.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#6366f1] shrink-0 mt-0.5">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#111827]">
                    Deep Discussion & Activity Trail
                  </h3>
                  <p className="text-xs text-[#4b5563] mt-0.5 leading-relaxed">
                    Comment threads, mentions, and immutable dependency state transitions are visible in one consolidated pane.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/features"
                className="inline-flex items-center text-sm font-semibold text-[#6366f1] hover:text-[#4f46e5] group"
              >
                <span>Learn about high-density issue navigation</span>
                <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </MarketingContainer>
    </MarketingSection>
  );
};
