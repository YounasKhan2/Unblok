/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-14 Onboarding Complete Summary Page
 * Section 10, 14: Concise workspace readiness review and execution launchpad.
 */

import React, { useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { AuthCard } from '../../features/auth/components/AuthCard';
import { useWorkspace } from '../../features/workspaces/context/WorkspaceContext';
import { useProject } from '../../context/ProjectContext';
import { saveStoredOnboardingState } from '../../features/onboarding/domain/onboardingProgression';
import { CheckCircle2, ArrowRight, Building2, Users, FolderGit2, Sparkles } from 'lucide-react';

export const OnboardingCompletePage: React.FC = () => {
  const { activeWorkspace, activeMembership, memberships, status } = useWorkspace();
  const { teams, projects } = useProject();
  const navigate = useNavigate();

  useEffect(() => {
    if (activeWorkspace) {
      saveStoredOnboardingState(activeWorkspace.id, {
        setupCompleted: true,
        completedAt: new Date().toISOString(),
      });
    }
  }, [activeWorkspace]);

  if (status !== 'loading' && memberships.length === 0) {
    return <Navigate to="/onboarding/workspace" replace />;
  }

  const firstTeam = teams.length > 0 ? teams[0] : null;
  const firstProject = projects.length > 0 ? projects[0] : null;

  const handleOpenProject = () => {
    if (firstProject) {
      navigate(`/projects/${firstProject.key}`);
    } else {
      navigate('/projects');
    }
  };

  const handleGoToMyWork = () => {
    navigate('/my-work');
  };

  return (
    <AuthCard
      badge={
        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm">
          <CheckCircle2 className="w-6 h-6 stroke-[2]" />
        </div>
      }
      title="Your workspace is ready"
      subtitle={`Setup is complete for ${activeWorkspace?.name || 'your workspace'}. You are logged in as ${activeMembership?.role || 'ADMIN'}.`}
      footer={
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleOpenProject}
            className="pub-btn-primary w-full justify-center text-sm py-2.5 cursor-pointer"
          >
            <span>Open project</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </button>

          <button
            type="button"
            onClick={handleGoToMyWork}
            className="w-full py-2.5 text-xs font-semibold text-[var(--color-pub-text-secondary)] hover:text-[var(--color-pub-text-primary)] transition-colors border border-[var(--color-pub-border)] rounded-lg hover:bg-[var(--color-pub-surface-subtle)] cursor-pointer"
          >
            Go to My Work
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="p-3.5 rounded-xl bg-[var(--color-pub-surface-subtle)] border border-[var(--color-pub-border)] space-y-3">
          <div className="flex items-center gap-2.5 text-xs">
            <Building2 className="w-4 h-4 text-[var(--color-pub-accent)] shrink-0" />
            <div className="flex-1">
              <span className="text-[var(--color-pub-text-secondary)]">Workspace: </span>
              <span className="font-semibold text-[var(--color-pub-text-primary)]">
                {activeWorkspace?.name || 'Your workspace'}
              </span>
            </div>
            <span className="font-mono text-[11px] px-1.5 py-0.5 bg-white border border-[var(--color-pub-border)] rounded text-[var(--color-pub-text-muted)]">
              {activeWorkspace?.slug || 'workspace'}
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-xs">
            <Users className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="flex-1">
              <span className="text-[var(--color-pub-text-secondary)]">Primary Team: </span>
              <span className="font-semibold text-[var(--color-pub-text-primary)]">
                {firstTeam ? firstTeam.name : 'Engineering'}
              </span>
            </div>
            {firstTeam && (
              <span className="font-mono text-[11px] px-1.5 py-0.5 bg-white border border-[var(--color-pub-border)] rounded text-emerald-700 font-medium">
                {firstTeam.key}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 text-xs">
            <FolderGit2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <div className="flex-1">
              <span className="text-[var(--color-pub-text-secondary)]">Initial Project: </span>
              <span className="font-semibold text-[var(--color-pub-text-primary)]">
                {firstProject ? firstProject.name : 'NEXUS — Omnichannel Commerce Platform'}
              </span>
            </div>
            {firstProject && (
              <span className="font-mono text-[11px] px-1.5 py-0.5 bg-white border border-[var(--color-pub-border)] rounded text-indigo-700 font-medium">
                {firstProject.key}
              </span>
            )}
          </div>
        </div>

        <div className="text-[11px] text-[var(--color-pub-text-muted)] text-center leading-relaxed">
          You can create additional teams, assign project ownership, and import issues directly from your workspace execution navigation.
        </div>
      </div>
    </AuthCard>
  );
};
