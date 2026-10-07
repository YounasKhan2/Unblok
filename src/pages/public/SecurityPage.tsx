/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  Lock,
  UserCheck,
  FileCheck,
  Server,
  Layers,
  AlertTriangle,
  GitBranch,
} from 'lucide-react';
import { PublicPageHero } from '../../features/public/components/PublicPageHero';
import { MarketingContainer } from '../../features/public/components/MarketingContainer';
import { MarketingSection } from '../../features/public/components/MarketingSection';
import { PublicCtaBanner } from '../../features/public/components/PublicCtaBanner';

export const SecurityPage: React.FC = () => {
  return (
    <div className="flex flex-col w-full pub-env-grid">
      {/* 1. Hero */}
      <PublicPageHero
        eyebrow="Trust & Security"
        title="Security principles and architecture boundaries"
        description="We believe technical software requires transparent architecture. Here is an honest accounting of our current security model and our production engineering direction."
        actions={
          <>
            <Link to="/contact" className="pub-btn-primary text-sm sm:text-base px-6 py-3 shadow-sm">
              Ask an architecture question
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
            <Link to="/product" className="pub-btn-secondary text-sm sm:text-base px-6 py-3">
              Explore product architecture
            </Link>
          </>
        }
      />

      {/* 2. Transparency Disclaimer Banner */}
      <MarketingSection className="py-8 bg-amber-500/10 border-b border-amber-500/20">
        <MarketingContainer size="narrow">
          <div className="flex items-start gap-3.5 text-xs sm:text-sm text-amber-950">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block text-amber-900 mb-0.5">
                Commitment to Factual Representation
              </strong>
              <p className="text-amber-800/90 leading-relaxed">
                Unblok is currently in active pre-launch development. We do not claim third-party compliance certifications (such as SOC 2, ISO 27001, HIPAA, or external penetration testing audits) that have not been completed. Below, we clearly distinguish implemented product behaviors from our production architecture roadmap.
              </p>
            </div>
          </div>
        </MarketingContainer>
      </MarketingSection>

      {/* 3. Core Architectural Principles (Currently Represented) */}
      <MarketingSection className="py-16 sm:py-24 border-b border-[var(--color-pub-border)]">
        <MarketingContainer>
          <div className="max-w-3xl mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              Established Product Principles
            </div>
            <h2 className="pub-section-title mb-3">
              Enforced invariants and logical boundaries
            </h2>
            <p className="pub-body-lead text-sm sm:text-base">
              The Unblok data model is built on strict state machine invariants and logical tenant separation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Principle 1 */}
            <div className="p-6 rounded-2xl bg-[var(--color-pub-surface)] border border-[var(--color-pub-border)] shadow-sm">
              <div className="pub-accent-icon-box w-9 h-9 rounded-lg mb-4">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-[var(--color-pub-text-primary)] mb-2">
                Logical Workspace Isolation
              </h3>
              <p className="text-xs leading-relaxed text-[var(--color-pub-text-secondary)]">
                All projects, issues, cycles, and team definitions are strictly partitioned by workspace identity. No cross-workspace state leakage or cross-tenant query execution is permitted.
              </p>
            </div>

            {/* Principle 2 */}
            <div className="p-6 rounded-2xl bg-[var(--color-pub-surface)] border border-[var(--color-pub-border)] shadow-sm">
              <div className="pub-accent-icon-box w-9 h-9 rounded-lg mb-4">
                <UserCheck className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-[var(--color-pub-text-primary)] mb-2">
                Three-Tier Role Model
              </h3>
              <p className="text-xs leading-relaxed text-[var(--color-pub-text-secondary)]">
                Explicit permission model with <strong>Admin</strong> (workspace configuration, member administration), <strong>Member</strong> (create, edit, execute issues), and <strong>Observer</strong> (read-only audit).
              </p>
            </div>

            {/* Principle 3 */}
            <div className="p-6 rounded-2xl bg-[var(--color-pub-surface)] border border-[var(--color-pub-border)] shadow-sm">
              <div className="pub-accent-icon-box w-9 h-9 rounded-lg mb-4">
                <Lock className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-[var(--color-pub-text-primary)] mb-2">
                Permission-Aware Experiences
              </h3>
              <p className="text-xs leading-relaxed text-[var(--color-pub-text-secondary)]">
                Administrative settings routes and privileged actions are gated at the routing boundary. Observers cannot trigger mutation states or edit workspace governance.
              </p>
            </div>

            {/* Principle 4 */}
            <div className="p-6 rounded-2xl bg-[var(--color-pub-surface)] border border-[var(--color-pub-border)] shadow-sm">
              <div className="pub-accent-icon-box w-9 h-9 rounded-lg mb-4">
                <GitBranch className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-[var(--color-pub-text-primary)] mb-2">
                Dependency Invariant Guards
              </h3>
              <p className="text-xs leading-relaxed text-[var(--color-pub-text-secondary)]">
                The blocker relationship engine validates dependency chains to prevent circular dependencies, self-blocking relationships, and corrupted state graphs.
              </p>
            </div>

            {/* Principle 5 */}
            <div className="p-6 rounded-2xl bg-[var(--color-pub-surface)] border border-[var(--color-pub-border)] shadow-sm">
              <div className="pub-accent-icon-box w-9 h-9 rounded-lg mb-4">
                <FileCheck className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-[var(--color-pub-text-primary)] mb-2">
                Auditable Activity Trail
              </h3>
              <p className="text-xs leading-relaxed text-[var(--color-pub-text-secondary)]">
                Every issue mutation, status transition, blocker addition, and assignee modification records an immutable activity event timestamped to the acting member.
              </p>
            </div>

            {/* Principle 6 */}
            <div className="p-6 rounded-2xl bg-[var(--color-pub-surface)] border border-[var(--color-pub-border)] shadow-sm">
              <div className="pub-accent-icon-box w-9 h-9 rounded-lg mb-4">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-[var(--color-pub-text-primary)] mb-2">
                Contextual Route Isolation
              </h3>
              <p className="text-xs leading-relaxed text-[var(--color-pub-text-secondary)]">
                Public marketing pages, authentication entryways, and authenticated application shell workspaces run under strictly isolated layout boundaries.
              </p>
            </div>
          </div>
        </MarketingContainer>
      </MarketingSection>

      {/* 4. Comparison Table: Current vs Production Roadmap */}
      <MarketingSection className="py-16 sm:py-24 bg-[var(--color-pub-surface-subtle)] border-b border-[var(--color-pub-border)]">
        <MarketingContainer>
          <div className="max-w-3xl mb-12">
            <h2 className="pub-section-title mb-3">
              Architectural state vs Production roadmap
            </h2>
            <p className="pub-body-lead text-sm sm:text-base">
              A transparent breakdown of what is currently operational in our prototype versus what is designed for production infrastructure.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[var(--color-pub-border)] bg-[var(--color-pub-surface)] shadow-sm">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[var(--color-pub-border)] bg-[var(--color-pub-surface-subtle)]">
                  <th className="py-3.5 px-4 sm:px-6 font-bold text-[var(--color-pub-text-primary)]">
                    Architecture Dimension
                  </th>
                  <th className="py-3.5 px-4 sm:px-6 font-bold text-emerald-800">
                    Current Implementation
                  </th>
                  <th className="py-3.5 px-4 sm:px-6 font-bold text-indigo-800">
                    Production Architecture Direction
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-pub-border)] text-[var(--color-pub-text-secondary)]">
                <tr>
                  <td className="py-4 px-4 sm:px-6 font-semibold text-[var(--color-pub-text-primary)]">
                    Tenant Isolation
                  </td>
                  <td className="py-4 px-4 sm:px-6">
                    Logical in-memory workspace boundaries with scoped store keys.
                  </td>
                  <td className="py-4 px-4 sm:px-6">
                    Row-level database security with tenant ID partition enforcement at query layer.
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-4 sm:px-6 font-semibold text-[var(--color-pub-text-primary)]">
                    Role Enforcement
                  </td>
                  <td className="py-4 px-4 sm:px-6">
                    Route guards, action capability filters, and role-based UI restrictions.
                  </td>
                  <td className="py-4 px-4 sm:px-6">
                    Server-authoritative authorization checks on every RPC and API endpoint.
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-4 sm:px-6 font-semibold text-[var(--color-pub-text-primary)]">
                    Session & Identity
                  </td>
                  <td className="py-4 px-4 sm:px-6">
                    Structural auth boundary ready for production account integration.
                  </td>
                  <td className="py-4 px-4 sm:px-6">
                    Secure HTTP-only session cookies, MFA support, and SAML/SSO integration.
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-4 sm:px-6 font-semibold text-[var(--color-pub-text-primary)]">
                    State Validation
                  </td>
                  <td className="py-4 px-4 sm:px-6">
                    Client-side dependency cycle prevention and schema typing.
                  </td>
                  <td className="py-4 px-4 sm:px-6">
                    Dual client-server transactional cycle detection with atomic rollbacks.
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-4 sm:px-6 font-semibold text-[var(--color-pub-text-primary)]">
                    Compliance & Audits
                  </td>
                  <td className="py-4 px-4 sm:px-6">
                    Honest pre-compliance posture; zero fabricated certs or badges.
                  </td>
                  <td className="py-4 px-4 sm:px-6">
                    Formal SOC 2 Type II audit engagement planned for general availability.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </MarketingContainer>
      </MarketingSection>

      {/* 5. Contact Architecture Team */}
      <PublicCtaBanner
        title="Have questions about our security model?"
        description="Our engineering team is happy to discuss our architectural direction, isolation model, or planned data protections."
        primaryCtaLabel="Contact architecture team"
        primaryCtaTo="/contact"
        secondaryCtaLabel="View privacy notice"
        secondaryCtaTo="/privacy"
      />
    </div>
  );
};
