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
    <MarketingSection id="context" className="bg-[var(--color-pub-surface-subtle)]/50" hasBorder>
      <MarketingContainer>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* 7-column product screenshot side */}
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
              <p className="pub-body-lead text-base sm:text-lg">
                Triage, update, and collaborate from the same execution view.
              </p>
            </div>

            <div className="pt-2">
              <Link
                to="/features"
                className="pub-link-accent text-sm font-semibold group"
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
