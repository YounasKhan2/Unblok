/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-13 / UX-14 Team Setup Boundary Placeholder
 * Section 18: After workspace creation, transitions here. Team setup belongs to UX-14.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { AuthCard } from '../../features/auth/components/AuthCard';
import { useWorkspace } from '../../features/workspaces/context/WorkspaceContext';
import { Users, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const TeamOnboardingPlaceholderPage: React.FC = () => {
  const { activeWorkspace, activeMembership } = useWorkspace();

  return (
    <AuthCard
      badge={
        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm">
          <CheckCircle2 className="w-6 h-6 stroke-[2]" />
        </div>
      }
      title="Workspace Created"
      subtitle={`'${activeWorkspace?.name || 'Your workspace'}' is ready. Role: ${activeMembership?.role || 'ADMIN'}.`}
      footer={
        <div>
          <Link
            to="/my-work"
            className="pub-btn-primary w-full justify-center text-sm py-2.5"
          >
            <span>Enter workspace</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Link>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-pub-surface-subtle)] border border-[var(--color-pub-border)] text-xs font-semibold text-[var(--color-pub-text-secondary)]">
          <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-pub-accent)]" />
          <span>Team Setup Boundary · Scheduled for UX-14</span>
        </div>

        <div className="p-4 rounded-xl bg-[var(--color-pub-surface-subtle)] border border-[var(--color-pub-border)] text-xs text-[var(--color-pub-text-secondary)] leading-relaxed space-y-2">
          <div className="flex items-center gap-1.5 font-semibold text-[var(--color-pub-text-primary)]">
            <Users className="w-4 h-4 text-[var(--color-pub-accent)]" />
            <span>First Engineering Team Lifecycle</span>
          </div>
          <p>
            In UX-13, workspace creation is complete and your Administrator membership is established.
          </p>
          <p>
            UX-14 will implement engineering team definition (team key, routing, and project ownership boundaries). For now, you can proceed directly into the workspace.
          </p>
        </div>
      </div>
    </AuthCard>
  );
};
