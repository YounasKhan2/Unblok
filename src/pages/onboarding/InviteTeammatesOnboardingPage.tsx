/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-14 Invite Teammates Onboarding Step
 * Section 10, 13: Optional invitations step with honest prototype notice.
 */

import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { AuthCard } from '../../features/auth/components/AuthCard';
import { useWorkspace } from '../../features/workspaces/context/WorkspaceContext';
import { useSettings } from '../../features/settings/context/SettingsContext';
import { saveStoredOnboardingState } from '../../features/onboarding/domain/onboardingProgression';
import { Mail, Plus, Trash2, ArrowRight, UserPlus, Info } from 'lucide-react';

interface InviteRow {
  id: string;
  email: string;
  role: 'MEMBER' | 'OBSERVER';
}

export const InviteTeammatesOnboardingPage: React.FC = () => {
  const { activeWorkspace, activeMembership, memberships, status } = useWorkspace();
  let settingsContext: any = null;
  try {
    settingsContext = useSettings();
  } catch {
    // optional
  }
  const navigate = useNavigate();

  const [invites, setInvites] = useState<InviteRow[]>([
    { id: '1', email: '', role: 'MEMBER' },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (status !== 'loading' && memberships.length === 0) {
    return <Navigate to="/onboarding/workspace" replace />;
  }
  if (status !== 'loading' && activeMembership && activeMembership.role !== 'ADMIN') {
    return <Navigate to="/my-work" replace />;
  }

  const handleAddRow = () => {
    setInvites((prev) => [
      ...prev,
      { id: String(Date.now()), email: '', role: 'MEMBER' },
    ]);
  };

  const handleRemoveRow = (id: string) => {
    if (invites.length <= 1) {
      setInvites([{ id: '1', email: '', role: 'MEMBER' }]);
      return;
    }
    setInvites((prev) => prev.filter((r) => r.id !== id));
  };

  const handleRowChange = (id: string, field: 'email' | 'role', val: string) => {
    setInvites((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: val } : r))
    );
  };

  const handleSkip = () => {
    if (activeWorkspace) {
      saveStoredOnboardingState(activeWorkspace.id, {
        inviteCompletedOrSkipped: true,
      });
    }
    navigate('/onboarding/complete');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validInvites = invites.filter((r) => r.email.trim().length > 0);

    // Validate email formats if provided
    for (const inv of validInvites) {
      if (!inv.email.includes('@') || !inv.email.includes('.')) {
        setError(`"${inv.email}" is not a valid email address.`);
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (validInvites.length > 0 && settingsContext?.inviteMember) {
        for (const inv of validInvites) {
          try {
            await settingsContext.inviteMember(inv.email.trim(), inv.role, []);
          } catch {
            // allow prototype fallback
          }
        }
      }

      if (activeWorkspace) {
        saveStoredOnboardingState(activeWorkspace.id, {
          inviteCompletedOrSkipped: true,
          sentInvitations: validInvites.map((i) => ({
            email: i.email.trim(),
            role: i.role,
          })),
        });
      }

      navigate('/onboarding/complete');
    } catch (err: any) {
      setError(err?.message || 'Failed to record invitations.');
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      badge={
        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-[var(--color-pub-accent)] flex items-center justify-center border border-indigo-100 shadow-sm">
          <UserPlus className="w-6 h-6 stroke-[2]" />
        </div>
      }
      title="Invite your teammates"
      subtitle={`Collaborate with engineering, product, and leadership across ${activeWorkspace?.name || 'your workspace'}.`}
      footer={
        <div className="space-y-3">
          <button
            type="submit"
            form="invite-teammates-form"
            disabled={isSubmitting}
            className="pub-btn-primary w-full justify-center text-sm py-2.5 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Saving invitations...</span>
            ) : (
              <>
                <span>Save invitations and continue</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </>
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleSkip}
              className="text-xs text-[var(--color-pub-text-muted)] hover:text-[var(--color-pub-text-primary)] transition-colors cursor-pointer"
            >
              Skip for now
            </button>
          </div>
        </div>
      }
    >
      <form id="invite-teammates-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Honest Prototype Notice */}
        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Prototype notice:</strong> Invitations are saved in this prototype simulation. Email delivery is not connected.
          </span>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700" role="alert">
            {error}
          </div>
        )}

        <div className="space-y-2.5">
          {invites.map((row, idx) => (
            <div key={row.id} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-pub-text-muted)]" />
                <input
                  type="email"
                  value={row.email}
                  onChange={(e) => handleRowChange(row.id, 'email', e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-[var(--color-pub-border)] rounded-md bg-[var(--color-pub-surface-base)] text-[var(--color-pub-text-primary)] placeholder-[var(--color-pub-text-muted)] focus:outline-none focus:border-[var(--color-pub-accent)]"
                  autoFocus={idx === 0}
                />
              </div>

              <select
                value={row.role}
                onChange={(e) => handleRowChange(row.id, 'role', e.target.value as any)}
                className="w-28 px-2 py-1.5 text-xs border border-[var(--color-pub-border)] rounded-md bg-[var(--color-pub-surface-base)] text-[var(--color-pub-text-primary)] focus:outline-none focus:border-[var(--color-pub-accent)]"
              >
                <option value="MEMBER">Member</option>
                <option value="OBSERVER">Observer</option>
              </select>

              <button
                type="button"
                onClick={() => handleRemoveRow(row.id)}
                className="p-1.5 text-[var(--color-pub-text-muted)] hover:text-rose-600 rounded transition-colors"
                title="Remove row"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddRow}
          className="text-xs font-semibold text-[var(--color-pub-accent)] hover:underline inline-flex items-center gap-1 cursor-pointer pt-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add another teammate</span>
        </button>
      </form>
    </AuthCard>
  );
};
