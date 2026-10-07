/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  GitFork,
  Compass,
  MessageSquare,
  Activity,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { PublicPageHero } from '../../features/public/components/PublicPageHero';
import { MarketingContainer } from '../../features/public/components/MarketingContainer';
import { CapabilityGroup } from '../../features/public/components/CapabilityGroup';
import { PublicCtaBanner } from '../../features/public/components/PublicCtaBanner';

export const FeaturesPage: React.FC = () => {
  return (
    <div className="flex flex-col w-full">
      {/* 1. Hero */}
      <PublicPageHero
        eyebrow="Capability Directory"
        title="Comprehensive features for engineering execution"
        description="A technical breakdown of Unblok capabilities across issue tracking, dependency graphs, cycle planning, team collaboration, and delivery intelligence."
        actions={
          <>
            <Link to="/signup" className="pub-btn-primary text-sm sm:text-base px-6 py-3 shadow-sm">
              Get started
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
            <Link to="/product" className="pub-btn-secondary text-sm sm:text-base px-6 py-3">
              See product workflow
            </Link>
          </>
        }
      />

      {/* Quick Category Anchors */}
      <div className="bg-[var(--color-pub-surface)] border-b border-[var(--color-pub-border)] py-3">
        <MarketingContainer>
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto text-xs font-semibold text-[var(--color-pub-text-secondary)] no-scrollbar py-1">
            <span className="text-[var(--color-pub-text-muted)] uppercase tracking-wider text-[11px]">Jump to:</span>
            <a href="#feat-execution" className="px-2.5 py-1 rounded-md hover:bg-[var(--color-pub-surface-subtle)] hover:text-[var(--color-pub-text-primary)] transition-colors whitespace-nowrap">
              Execution
            </a>
            <a href="#feat-dependencies" className="px-2.5 py-1 rounded-md hover:bg-[var(--color-pub-surface-subtle)] hover:text-[var(--color-pub-text-primary)] transition-colors whitespace-nowrap">
              Dependencies
            </a>
            <a href="#feat-planning" className="px-2.5 py-1 rounded-md hover:bg-[var(--color-pub-surface-subtle)] hover:text-[var(--color-pub-text-primary)] transition-colors whitespace-nowrap">
              Planning
            </a>
            <a href="#feat-collaboration" className="px-2.5 py-1 rounded-md hover:bg-[var(--color-pub-surface-subtle)] hover:text-[var(--color-pub-text-primary)] transition-colors whitespace-nowrap">
              Collaboration
            </a>
            <a href="#feat-intelligence" className="px-2.5 py-1 rounded-md hover:bg-[var(--color-pub-surface-subtle)] hover:text-[var(--color-pub-text-primary)] transition-colors whitespace-nowrap">
              Intelligence
            </a>
            <a href="#feat-administration" className="px-2.5 py-1 rounded-md hover:bg-[var(--color-pub-surface-subtle)] hover:text-[var(--color-pub-text-primary)] transition-colors whitespace-nowrap">
              Administration
            </a>
          </div>
        </MarketingContainer>
      </div>

      {/* 2. Capability Groups Directory */}
      <div className="py-16 sm:py-20 bg-[var(--color-pub-bg)] space-y-10 sm:space-y-12">
        <MarketingContainer>
          <div className="space-y-8">
            {/* Category 1: Execution */}
            <CapabilityGroup
              id="feat-execution"
              eyebrow="Core Engine"
              title="Execution & Issue Workflows"
              description="High-density tools built for engineers who need to capture, inspect, and complete tasks quickly."
              icon={CheckCircle2}
              items={[
                {
                  name: 'My Work Cockpit',
                  description: 'Personalized command center highlighting issues assigned to you, items in the active cycle, and blocked commitments.',
                  badge: 'Cockpit',
                },
                {
                  name: 'Project Directory & Views',
                  description: 'Unified project index with health indicators, target cycle status, and dedicated project workspaces.',
                  badge: 'Projects',
                },
                {
                  name: 'High-Density Issue Lists',
                  description: 'Sortable, filterable lists with instant status tags, priority markers, blocker indicators, and inline editing.',
                  badge: 'List View',
                },
                {
                  name: 'Kanban Board with Drag & Drop',
                  description: 'Visual stage columns reflecting real project workflow with status validation guards.',
                  badge: 'Board',
                },
                {
                  name: 'Slide-Over Issue Drawer',
                  description: 'Deep issue context, subtask checklists, and blocker relationships accessible without losing current page scroll.',
                  badge: 'Drawer',
                },
                {
                  name: 'Priority & Status Workflows',
                  description: 'Structured states from Backlog to Done with explicit Urgent, High, Medium, and Low severity classifications.',
                  badge: 'Workflow',
                },
              ]}
            />

            {/* Category 2: Dependencies */}
            <CapabilityGroup
              id="feat-dependencies"
              eyebrow="Core Differentiator"
              title="Blockers & Dependency Intelligence"
              description="First-class relationship modeling that exposes upstream constraints and downstream impact."
              icon={GitFork}
              items={[
                {
                  name: 'First-Class Blocker Relationships',
                  description: 'Explicit A Blocks B definitions that prevent accidental premature starts and enforce resolution order.',
                  badge: 'Enforcement',
                },
                {
                  name: 'Multiple Blocker Chains',
                  description: 'Support for multiple upstream blockers and fan-out downstream dependencies on complex architectural tasks.',
                  badge: 'Multi-link',
                },
                {
                  name: 'Interactive Dependency Graph',
                  description: 'Visual node-link graph with interactive zoom, focus filtering, node inspect, and blocker highlighting.',
                  badge: 'Graph',
                },
                {
                  name: 'Cross-Project Dependency Matrix',
                  description: 'Tabular view identifying handoffs between teams and projects that risk stalled delivery.',
                  badge: 'Matrix',
                },
                {
                  name: 'Visual Blocked Badging',
                  description: 'Unmistakable blocker badges across boards, lists, and drawers warning team members of waiting states.',
                  badge: 'Indicators',
                },
                {
                  name: 'Downstream Impact Visibility',
                  description: 'Instantly view which critical path deliverables are affected when an upstream task slips.',
                  badge: 'Impact',
                },
              ]}
            />

            {/* Category 3: Planning */}
            <CapabilityGroup
              id="feat-planning"
              eyebrow="Delivery Alignment"
              title="Cycles, Milestones & Roadmap"
              description="Structured iteration planning anchored directly to live execution feasibility."
              icon={Compass}
              items={[
                {
                  name: 'Time-Boxed Cycles',
                  description: 'Structured 2-week iteration cadence with active dates, scope velocity tracking, and rollover management.',
                  badge: 'Iterations',
                },
                {
                  name: 'Strategic Milestones',
                  description: 'Target deliverables uniting cross-team issues toward key product launches and major releases.',
                  badge: 'Milestones',
                },
                {
                  name: 'Cross-Cycle Roadmap',
                  description: 'Chronological timeline visualizing milestone target windows and underlying issue completion trajectories.',
                  badge: 'Roadmap',
                },
                {
                  name: 'Project-Level Planning Hub',
                  description: 'Dedicated planning cockpit inside each project linking cycle backlogs to overall project objectives.',
                  badge: 'Alignment',
                },
              ]}
            />

            {/* Category 4: Collaboration */}
            <CapabilityGroup
              id="feat-collaboration"
              eyebrow="Contextual Communication"
              title="In-Context Collaboration"
              description="Keep technical discussion attached to the work itself, eliminating lost decisions and scattered chat."
              icon={MessageSquare}
              items={[
                {
                  name: 'In-Context Issue Comments',
                  description: 'Markdown-supported discussion directly on the issue timeline with code snippet formatting.',
                  badge: 'Threads',
                },
                {
                  name: 'Member @Mentions',
                  description: 'Ping teammates directly in issue comments and descriptions with immediate inbox routing.',
                  badge: 'Mentions',
                },
                {
                  name: 'Centralized Notification Inbox',
                  description: 'Unified triage stream for assigned tasks, blocker updates, and mentions with read receipts.',
                  badge: 'Inbox',
                },
                {
                  name: 'Tamper-Evident Activity Stream',
                  description: 'Full chronological audit log of state mutations, assignee adjustments, and blocker attachments.',
                  badge: 'Audit Log',
                },
              ]}
            />

            {/* Category 5: Intelligence */}
            <CapabilityGroup
              id="feat-intelligence"
              eyebrow="Execution Insights"
              title="Deterministic Delivery Intelligence"
              description="Objective signals calculated directly from active work states, blocker age, and cycle velocity."
              icon={Activity}
              items={[
                {
                  name: 'Delivery Health Score',
                  description: 'Comprehensive health rating measuring active cycle completion momentum against remaining blocker volume.',
                  badge: 'Health Index',
                },
                {
                  name: 'Needs Attention Triage Queue',
                  description: 'Automated surfacing of stalled blockers, overdue tasks, and unassigned critical-path issues.',
                  badge: 'Attention',
                },
                {
                  name: 'Dependency Pressure Index',
                  description: 'Heuristic calculation ranking upstream issues causing the highest downstream blocked count.',
                  badge: 'Pressure',
                },
                {
                  name: 'Execution Risk Profiling',
                  description: 'Flags cycles and milestones with high ratios of unresolved blockers nearing scheduled completion.',
                  badge: 'Risk Analysis',
                },
              ]}
            />

            {/* Category 6: Administration */}
            <CapabilityGroup
              id="feat-administration"
              eyebrow="Governance"
              title="Administration & Workspace Controls"
              description="Clean role boundaries and workspace configuration reflected in the current prototype."
              icon={Sliders}
              items={[
                {
                  name: 'Workspace Organization',
                  description: 'Dedicated workspace boundary managing shared projects, members, teams, and default settings.',
                  badge: 'Workspace',
                },
                {
                  name: 'Role-Based Access Control',
                  description: 'Three clear roles: Admin (full configuration), Member (execute and edit), and Observer (read-only audit).',
                  badge: 'RBAC',
                },
                {
                  name: 'Engineering Teams Directory',
                  description: 'Map engineering teams, member assignments, and project ownership boundaries.',
                  badge: 'Teams',
                },
                {
                  name: 'User Preferences',
                  description: 'Individual notification defaults, density configurations, and personal workspace preferences.',
                  badge: 'Preferences',
                },
              ]}
            />
          </div>
        </MarketingContainer>
      </div>

      {/* 3. Conversion CTA */}
      <PublicCtaBanner
        title="Ready to evaluate Unblok for your team?"
        description="See how structured dependencies and execution clarity eliminate blockers before they cause delivery delays."
        primaryCtaLabel="Get started"
        primaryCtaTo="/signup"
        secondaryCtaLabel="Explore product story"
        secondaryCtaTo="/product"
      />
    </div>
  );
};
