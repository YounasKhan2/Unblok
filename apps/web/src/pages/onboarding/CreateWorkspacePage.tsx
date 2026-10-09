/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-13 Create Workspace Onboarding Page
 * Section 17, 18, 29: Workspace naming, slug generation, and Admin membership creation.
 */

import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { AuthCard } from '../../features/auth/components/AuthCard';
import { useWorkspace } from '../../features/workspaces/context/WorkspaceContext';
import { useAuth } from '../../features/auth/context/AuthContext';
import { slugifyWorkspaceName } from '../../features/workspaces/domain/workspaceSelection';
import { Building2, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export const CreateWorkspacePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const isExistingUserMode = searchParams.get('mode') === 'create';

  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createWorkspace } = useWorkspace();
  const { user } = useAuth();
  const navigate = useNavigate();

  const slugPreview = name ? slugifyWorkspaceName(name) : 'your-workspace';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a workspace name.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const newWs = await createWorkspace({
        name: name.trim(),
        slug: slugPreview,
      });

      // Section 18: Creator becomes ADMIN, routes to /onboarding/team boundary
      navigate('/onboarding/team');
    } catch (err: any) {
      setError(err?.message || 'Failed to create workspace. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      badge={
        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-[var(--color-pub-accent)] flex items-center justify-center border border-indigo-100 shadow-sm">
          <Building2 className="w-6 h-6 stroke-[2]" />
        </div>
      }
      title="Create your workspace"
      subtitle={
        isExistingUserMode
          ? 'Set up a new workspace context. Your existing memberships remain unchanged.'
          : `Welcome ${user?.name || ''}. Set up your primary organization workspace.`
      }
      footer={
        <div className="space-y-3">
          <button
            type="submit"
            form="create-workspace-form"
            disabled={isSubmitting}
            className="pub-btn-primary w-full justify-center text-sm py-2.5 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Creating workspace...</span>
            ) : (
              <>
                <span>Create workspace</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </>
            )}
          </button>

          {isExistingUserMode && (
            <div className="text-center">
              <Link
                to="/my-work"
                className="text-xs text-[var(--color-pub-text-muted)] hover:text-[var(--color-pub-text-primary)] transition-colors"
              >
                Cancel and return to My Work
              </Link>
            </div>
          )}
        </div>
      }
    >
      <form id="create-workspace-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div
            role="alert"
            className="p-3 rounded-lg bg-red-50 text-red-600 text-xs border border-red-200"
          >
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="workspace-name"
            className="block text-xs font-semibold text-[var(--color-pub-text-primary)] mb-1.5"
          >
            Workspace name
          </label>
          <input
            id="workspace-name"
            type="text"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            placeholder="e.g. NEXUS Commerce"
            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-pub-border)] bg-[var(--color-pub-surface-base)] text-[var(--color-pub-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-pub-accent)] focus:border-transparent transition-all"
            autoFocus
          />
        </div>

        <div>
          <span className="block text-xs font-semibold text-[var(--color-pub-text-secondary)] mb-1">
            Workspace URL preview
          </span>
          <div className="px-3 py-2 rounded-lg bg-[var(--color-pub-surface-subtle)] border border-[var(--color-pub-border)] font-mono text-xs text-[var(--color-pub-text-muted)] truncate">
            unblok.dev/<span className="text-[var(--color-pub-accent)] font-semibold">{slugPreview}</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-[var(--color-pub-surface-subtle)] border border-[var(--color-pub-border)] text-xs text-[var(--color-pub-text-secondary)] space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-[var(--color-pub-text-primary)]">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-pub-accent)]" />
            <span>Administrator Privileges</span>
          </div>
          <p>
            You will become the initial <strong>ADMIN</strong> for this workspace. Workspace roles are strictly isolated and do not grant global permissions.
          </p>
        </div>
      </form>
    </AuthCard>
  );
};
