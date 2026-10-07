/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-12 / UX-13 Onboarding Boundary Placeholder
 * Section 21: Brand-new non-invited accounts land here.
 * Structural boundary for workspace, team, and project onboarding lifecycle in UX-13.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { AuthCard } from '../../features/auth/components/AuthCard';
import { Building2, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../features/auth/context/AuthContext';

export const OnboardingPlaceholderPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <AuthCard
      badge={
        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-[var(--color-pub-accent)] flex items-center justify-center border border-indigo-100 shadow-sm">
          <Building2 className="w-6 h-6 stroke-[2]" />
        </div>
      }
      title="Welcome to Unblok"
      subtitle={`Account created for ${user?.name || 'you'} (${user?.email || ''}). Next step: workspace setup.`}
      footer={
        <div>
          <Link
            to="/my-work"
            className="pub-btn-primary w-full justify-center text-sm py-2.5"
          >
            <span>Enter prototype workspace</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Link>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Boundary Notice */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-pub-surface-subtle)] border border-[var(--color-pub-border)] text-xs font-semibold text-[var(--color-pub-text-secondary)]">
          <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-pub-accent)]" />
          <span>Onboarding Boundary · Scheduled for UX-13</span>
        </div>

        <div className="p-4 rounded-xl bg-[var(--color-pub-surface-subtle)] border border-[var(--color-pub-border)] text-xs text-[var(--color-pub-text-secondary)] leading-relaxed space-y-2">
          <div className="flex items-center gap-1.5 font-semibold text-[var(--color-pub-text-primary)]">
            <Sparkles className="w-4 h-4 text-[var(--color-pub-accent)]" />
            <span>Workspace & Team Onboarding Lifecycle</span>
          </div>
          <p>
            In UX-12, account registration creates your global user identity without silently generating a workspace or team.
          </p>
          <p>
            In UX-13, this route will guide new users through company workspace naming, first engineering team creation, and initial project configuration.
          </p>
        </div>
      </div>
    </AuthCard>
  );
};
