/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-14 Team Onboarding Step
 * Section 10, 11: Create first engineering team within the newly established workspace.
 */

import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { AuthCard } from '../../features/auth/components/AuthCard';
import { useWorkspace } from '../../features/workspaces/context/WorkspaceContext';
import { useProject } from '../../context/ProjectContext';
import { validateTeamInput } from '../../features/teams/domain/teamResolution';
import { Users, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';

export const TeamOnboardingPage: React.FC = () => {
  const { activeWorkspace, activeMembership, memberships, status } = useWorkspace();
  const { teams, createTeam } = useProject();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If user has no memberships at all and workspace resolution is done, route to workspace creation
  if (status !== 'loading' && memberships.length === 0) {
    return <Navigate to="/onboarding/workspace" replace />;
  }
  // If non-admin member, route to product
  if (status !== 'loading' && activeMembership && activeMembership.role !== 'ADMIN') {
    return <Navigate to="/my-work" replace />;
  }

  const existingFirstTeam = teams.length > 0 ? teams[0] : null;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!key || key.length <= 4) {
      const generated = val
        .trim()
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase()
        .slice(0, 4);
      setKey(generated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateTeamInput({ name, key }, teams);
    if (!validation.valid) {
      setError(validation.error || 'Please correct the form errors.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createTeam({
        name: name.trim(),
        key: key.trim().toUpperCase(),
        description: description.trim() || undefined,
      });

      navigate('/onboarding/project');
    } catch (err: any) {
      setError(err?.message || 'Failed to create team.');
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      badge={
        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-[var(--color-pub-accent)] flex items-center justify-center border border-indigo-100 shadow-sm">
          <Users className="w-6 h-6 stroke-[2]" />
        </div>
      }
      banner={
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-pub-surface-subtle)] border border-[var(--color-pub-border)] text-xs font-semibold text-[var(--color-pub-text-secondary)]">
          <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-pub-accent)]" />
          <span>Team Setup Boundary</span>
        </div>
      }
      title="Create your first team"
      subtitle={`Workspace Created: '${activeWorkspace?.name || 'Your workspace'}' is ready. Establish your primary engineering team identity.`}
      footer={
        <div className="space-y-3">
          <button
            type="submit"
            form="create-team-onboarding-form"
            disabled={isSubmitting}
            className="pub-btn-primary w-full justify-center text-sm py-2.5 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Creating team...</span>
            ) : (
              <>
                <span>Continue to project setup</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </>
            )}
          </button>

          {existingFirstTeam && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => navigate('/onboarding/project')}
                className="text-xs text-[var(--color-pub-text-muted)] hover:text-[var(--color-pub-text-primary)] transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Continue with existing team ({existingFirstTeam.name})</span>
              </button>
            </div>
          )}
        </div>
      }
    >
      <form id="create-team-onboarding-form" onSubmit={handleSubmit} className="space-y-4">
        {existingFirstTeam && (
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center justify-between">
            <div>
              <span className="font-semibold">Team established:</span> {existingFirstTeam.name} ({existingFirstTeam.key})
            </div>
            <button
              type="button"
              onClick={() => navigate('/onboarding/project')}
              className="text-emerald-700 underline font-medium hover:text-emerald-900 cursor-pointer"
            >
              Use this team
            </button>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700" role="alert">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-[var(--color-pub-text-primary)] mb-1.5">
            Team name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={handleNameChange}
            placeholder="e.g. Platform Engineering, Core Systems"
            className="w-full px-3 py-2 text-sm border border-[var(--color-pub-border)] rounded-lg bg-[var(--color-pub-surface-base)] text-[var(--color-pub-text-primary)] placeholder-[var(--color-pub-text-muted)] focus:outline-none focus:border-[var(--color-pub-accent)]"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--color-pub-text-primary)] mb-1.5">
            Team key <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            maxLength={6}
            value={key}
            onChange={(e) => setKey(e.target.value.toUpperCase())}
            placeholder="e.g. PLAT, ENG"
            className="w-full px-3 py-2 text-sm font-mono border border-[var(--color-pub-border)] rounded-lg bg-[var(--color-pub-surface-base)] text-[var(--color-pub-text-primary)] placeholder-[var(--color-pub-text-muted)] focus:outline-none focus:border-[var(--color-pub-accent)] uppercase"
          />
          <p className="mt-1 text-[11px] text-[var(--color-pub-text-secondary)]">
            2 to 6 uppercase letters or numbers. Unique within this workspace.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--color-pub-text-primary)] mb-1.5">
            Description <span className="text-[var(--color-pub-text-muted)] font-normal">(optional)</span>
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Core runtime infrastructure, developer experience, and deployment pipelines."
            className="w-full px-3 py-2 text-sm border border-[var(--color-pub-border)] rounded-lg bg-[var(--color-pub-surface-base)] text-[var(--color-pub-text-primary)] placeholder-[var(--color-pub-text-muted)] focus:outline-none focus:border-[var(--color-pub-accent)] resize-none"
          />
        </div>
      </form>
    </AuthCard>
  );
};
