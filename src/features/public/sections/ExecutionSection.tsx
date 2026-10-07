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
    <MarketingSection id="execution" className="bg-[#f4f2ed]/60" hasBorder>
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
              <p className="pub-body-lead text-base">
                Your priorities, blockers, and active work—together.
              </p>
            </div>

            {/* Focused contextual callout */}
            <div className="bg-white border border-[#e5e3df] rounded-xl p-5 space-y-3.5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#111827]">
                    Personal Blocker Clarity
                  </h3>
                  <p className="text-xs text-[#4b5563] mt-0.5 leading-relaxed">
                    Instantly identify which upstream tasks are holding up your delivery, and clear the path for teammates waiting on you.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-3 border-t border-[#f4f2ed]">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#111827]">
                    Completion Guards
                  </h3>
                  <p className="text-xs text-[#4b5563] mt-0.5 leading-relaxed">
                    Invariants prevent moving blocked issues to Done until prerequisite blockers are genuinely resolved.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Link
                to="/features"
                className="inline-flex items-center text-sm font-semibold text-[#6366f1] hover:text-[#4f46e5] group"
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
