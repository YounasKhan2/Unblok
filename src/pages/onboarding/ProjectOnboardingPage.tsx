/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-14 Project Onboarding Step
 * Section 10, 12: Create first project strictly bound to an owning team.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { AuthCard } from '../../features/auth/components/AuthCard';
import { useWorkspace } from '../../features/workspaces/context/WorkspaceContext';
import { useProject } from '../../context/ProjectContext';
import { validateProjectInput } from '../../features/projects/domain/projectCreation';
import { FolderGit2, ArrowRight, CheckCircle2 } from 'lucide-react';

export const ProjectOnboardingPage: React.FC = () => {
  const { activeWorkspace, activeMembership } = useWorkspace();
  const { teams, projects, createProject } = useProject();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [teamId, setTeamId] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Default select first available team if available
  useEffect(() => {
    if (teams.length > 0 && !teamId) {
      setTeamId(teams[0].id);
    }
  }, [teams, teamId]);

  if (!activeWorkspace) {
    return <Navigate to="/onboarding/workspace" replace />;
  }
  if (activeMembership?.role !== 'ADMIN') {
    return <Navigate to="/my-work" replace />;
  }
  if (teams.length === 0) {
    return <Navigate to="/onboarding/team" replace />;
  }

  const existingFirstProject = projects.length > 0 ? projects[0] : null;

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
    const validation = validateProjectInput(
      { name, key, teamId, description },
      projects,
      teams,
      activeWorkspace?.id
    );
    if (!validation.valid) {
      setError(validation.error || 'Please correct the form errors.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createProject({
        name: name.trim(),
        key: key.trim().toUpperCase(),
        teamId,
        description: description.trim() || undefined,
      });

      navigate('/onboarding/invite');
    } catch (err: any) {
      setError(err?.message || 'Failed to create project.');
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      badge={
        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-[var(--color-pub-accent)] flex items-center justify-center border border-indigo-100 shadow-sm">
          <FolderGit2 className="w-6 h-6 stroke-[2]" />
        </div>
      }
      title="Create your first project"
      subtitle="Projects organize issues, roadmaps, and execution tracking under an owning team."
      footer={
        <div className="space-y-3">
          <button
            type="submit"
            form="create-project-onboarding-form"
            disabled={isSubmitting}
            className="pub-btn-primary w-full justify-center text-sm py-2.5 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Creating project...</span>
            ) : (
              <>
                <span>Continue to invite teammates</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </>
            )}
          </button>

          {existingFirstProject && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => navigate('/onboarding/invite')}
                className="text-xs text-[var(--color-pub-text-muted)] hover:text-[var(--color-pub-text-primary)] transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Continue with existing project ({existingFirstProject.name})</span>
              </button>
            </div>
          )}
        </div>
      }
    >
      <form id="create-project-onboarding-form" onSubmit={handleSubmit} className="space-y-4">
        {existingFirstProject && (
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center justify-between">
            <div>
              <span className="font-semibold">Project established:</span> {existingFirstProject.name} ({existingFirstProject.key})
            </div>
            <button
              type="button"
              onClick={() => navigate('/onboarding/invite')}
              className="text-emerald-700 underline font-medium hover:text-emerald-900 cursor-pointer"
            >
              Use this project
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
            Owning team <span className="text-rose-500">*</span>
          </label>
          <select
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-[var(--color-pub-border)] rounded-lg bg-[var(--color-pub-surface-base)] text-[var(--color-pub-text-primary)] focus:outline-none focus:border-[var(--color-pub-accent)]"
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.key})
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-[var(--color-pub-text-secondary)]">
            Every project belongs strictly to exactly one owning team.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--color-pub-text-primary)] mb-1.5">
            Project name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={handleNameChange}
            placeholder="e.g. Developer Platform, Billing Engine"
            className="w-full px-3 py-2 text-sm border border-[var(--color-pub-border)] rounded-lg bg-[var(--color-pub-surface-base)] text-[var(--color-pub-text-primary)] placeholder-[var(--color-pub-text-muted)] focus:outline-none focus:border-[var(--color-pub-accent)]"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--color-pub-text-primary)] mb-1.5">
            Project key <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            maxLength={6}
            value={key}
            onChange={(e) => setKey(e.target.value.toUpperCase())}
            placeholder="e.g. DEV, CORE"
            className="w-full px-3 py-2 text-sm font-mono border border-[var(--color-pub-border)] rounded-lg bg-[var(--color-pub-surface-base)] text-[var(--color-pub-text-primary)] placeholder-[var(--color-pub-text-muted)] focus:outline-none focus:border-[var(--color-pub-accent)] uppercase"
          />
          <p className="mt-1 text-[11px] text-[var(--color-pub-text-secondary)]">
            Used as prefix for all issue identifiers (e.g. DEV-101).
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
            placeholder="e.g. Developer tooling, build systems, and internal services."
            className="w-full px-3 py-2 text-sm border border-[var(--color-pub-border)] rounded-lg bg-[var(--color-pub-surface-base)] text-[var(--color-pub-text-primary)] placeholder-[var(--color-pub-text-muted)] focus:outline-none focus:border-[var(--color-pub-accent)] resize-none"
          />
        </div>
      </form>
    </AuthCard>
  );
};
