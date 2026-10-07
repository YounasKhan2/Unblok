/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HeroSection } from '../../features/public/sections/HeroSection';
import { ExecutionSection } from '../../features/public/sections/ExecutionSection';
import { DependenciesSection } from '../../features/public/sections/DependenciesSection';
import { IssueContextSection } from '../../features/public/sections/IssueContextSection';
import { PlanningSection } from '../../features/public/sections/PlanningSection';
import { InsightsSection } from '../../features/public/sections/InsightsSection';
import { FinalCtaSection } from '../../features/public/sections/FinalCtaSection';

export const HomePage: React.FC = () => {
  return (
    <div className="flex flex-col w-full">
      {/* 1. Hero */}
      <HeroSection />

      {/* 2. Execution (My Work) */}
      <ExecutionSection />

      {/* 3. Dependencies (DAG Canvas) */}
      <DependenciesSection />

      {/* 4. Issue Context (Project List + IssueDrawer) */}
      <IssueContextSection />

      {/* 5. Planning (Cycles & Milestones) */}
      <PlanningSection />

      {/* 6. Insights (Execution Intelligence) */}
      <InsightsSection />

      {/* 7. Final Conversion CTA */}
      <FinalCtaSection />
    </div>
  );
};
