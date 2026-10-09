/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-12 Invitation Entry Page
 * Section 13 & 14: Handles deterministic invitation validation states:
 * valid existing-account, valid new-account, expired, revoked, invalid, already accepted.
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext';
import { InvitationDetails } from '../../features/auth/types';
import { AuthCard } from '../../features/auth/components/AuthCard';
import {
  Mail,
  Building2,
  Users,
  Shield,
  Clock,
  Ban,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Loader2,
  LogIn,
  UserPlus,
} from 'lucide-react';

export const InvitePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { adapter, status, user } = useAuth();

  const [invitation, setInvitation] = useState<InvitationDetails | null>(() => {
    if (!token) return { token: '', status: 'INVALID' };
    if ('validateInvitationSync' in adapter && typeof (adapter as any).validateInvitationSync === 'function') {
      return (adapter as any).validateInvitationSync(token);
    }
    return null;
  });
  const [isValidating, setIsValidating] = useState(() => !invitation);
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState('');

  const shouldAutoAccept = searchParams.get('accepted') === 'true';

  useEffect(() => {
    if (invitation) return;

    let isMounted = true;
    async function checkToken() {
      if (!token) {
        setInvitation({ token: '', status: 'INVALID' });
        setIsValidating(false);
        return;
      }

      try {
        const details = await adapter.validateInvitation(token);
        if (isMounted) {
          setInvitation(details);
        }
      } catch {
        if (isMounted) {
          setInvitation({ token, status: 'INVALID' });
        }
      } finally {
        if (isMounted) {
          setIsValidating(false);
        }
      }
    }

    checkToken();
    return () => {
      isMounted = false;
    };
  }, [token, adapter]);

  const handleAccept = async () => {
    if (!token || !user) return;
    setIsAccepting(true);
    setAcceptError('');

    try {
      const result = await adapter.acceptInvitation(token, user.id);
      if (result.success) {
        navigate('/my-work', { replace: true });
      } else {
        setAcceptError(result.error || 'Failed to accept invitation.');
      }
    } catch {
      setAcceptError('An unexpected error occurred while accepting the invitation.');
    } finally {
      setIsAccepting(false);
    }
  };

  // If user just signed in and was redirected with ?accepted=true
  useEffect(() => {
    if (invitation?.status === 'VALID' && status === 'authenticated' && user && shouldAutoAccept) {
      handleAccept();
    }
  }, [invitation, status, user, shouldAutoAccept]);

  if (isValidating) {
    return (
      <AuthCard title="Validating invitation" subtitle="Checking invitation credentials...">
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 text-[var(--color-pub-accent)] animate-spin mb-3" />
          <p className="text-xs text-[var(--color-pub-text-secondary)]">
            Verifying workspace invitation...
          </p>
        </div>
      </AuthCard>
    );
  }

  if (!invitation) return null;

  // State 1: Expired Invitation
  if (invitation.status === 'EXPIRED') {
    return (
      <AuthCard
        badge={
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-sm">
            <Clock className="w-6 h-6 stroke-[2]" />
          </div>
        }
        title="This invitation has expired."
        subtitle="Workspace invitation links expire after 7 days for workspace security."
        footer={
          <div>
            <Link to="/login" className="pub-btn-secondary w-full justify-center text-sm py-2">
              Back to sign in
            </Link>
          </div>
        }
      >
        <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900 leading-relaxed">
          <p className="font-semibold mb-1">Invitation expired</p>
          <p>
            Please request a new invitation link from your workspace administrator or team lead.
          </p>
        </div>
      </AuthCard>
    );
  }

  // State 2: Revoked Invitation
  if (invitation.status === 'REVOKED') {
    return (
      <AuthCard
        badge={
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100 shadow-sm">
            <Ban className="w-6 h-6 stroke-[2]" />
          </div>
        }
        title="This invitation is no longer available."
        subtitle="This invitation has been revoked or cancelled by the workspace administrator."
        footer={
          <div>
            <Link to="/login" className="pub-btn-secondary w-full justify-center text-sm py-2">
              Back to sign in
            </Link>
          </div>
        }
      >
        <div className="p-4 rounded-xl bg-red-50/60 border border-red-200 text-xs text-red-900 leading-relaxed">
          <p className="font-semibold mb-1">Access revoked</p>
          <p>
            If you believe this is a mistake, please contact the workspace owner to issue an updated invitation.
          </p>
        </div>
      </AuthCard>
    );
  }

  // State 3: Invalid Invitation (Section 14: Never reveal workspace info for invalid tokens)
  if (invitation.status === 'INVALID') {
    return (
      <AuthCard
        badge={
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100 shadow-sm">
            <AlertTriangle className="w-6 h-6 stroke-[2]" />
          </div>
        }
        title="This invitation link is invalid."
        subtitle="The invitation link appears to be malformed or does not exist."
        footer={
          <div>
            <Link to="/" className="pub-btn-secondary w-full justify-center text-sm py-2">
              Return to Unblok homepage
            </Link>
          </div>
        }
      >
        <div className="p-4 rounded-xl bg-red-50/60 border border-red-200 text-xs text-red-900 leading-relaxed">
          <p className="font-semibold mb-1">Invalid link</p>
          <p>
            Check that the URL was copied completely or request a new invitation from your team.
          </p>
        </div>
      </AuthCard>
    );
  }

  // State 4: Already Accepted
  if (invitation.status === 'ACCEPTED') {
    return (
      <AuthCard
        badge={
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm">
            <CheckCircle2 className="w-6 h-6 stroke-[2]" />
          </div>
        }
        title="This invitation has already been accepted."
        subtitle={`Membership for ${invitation.workspaceName || 'this workspace'} has already been activated.`}
        footer={
          <div>
            <Link to="/my-work" className="pub-btn-primary w-full justify-center text-sm py-2.5">
              <span>Open workspace</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </div>
        }
      >
        <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
          <p className="font-semibold mb-1">Active membership</p>
          <p>
            You are already a member of this workspace. Click below to continue directly to your workspace.
          </p>
        </div>
      </AuthCard>
    );
  }

  // State 5: Valid Invitation
  const isExistingUser = invitation.isExistingUser;
  const isAuthenticated = status === 'authenticated';

  return (
    <AuthCard
      badge={
        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-[var(--color-pub-accent)] flex items-center justify-center border border-indigo-100 shadow-sm">
          <Mail className="w-6 h-6 stroke-[2]" />
        </div>
      }
      title={`Join ${invitation.workspaceName || 'workspace'}`}
      subtitle={`You've been invited by ${invitation.inviterName || 'your team lead'} to collaborate on Unblok.`}
    >
      <div className="space-y-5">
        {acceptError && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs">
            {acceptError}
          </div>
        )}

        {/* Invitation Metadata Card */}
        <div className="p-4 rounded-xl bg-[var(--color-pub-surface-subtle)] border border-[var(--color-pub-border)] space-y-3 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--color-pub-border)]">
            <div className="flex items-center gap-2 text-[var(--color-pub-text-secondary)]">
              <Building2 className="w-4 h-4 text-gray-500" />
              <span>Workspace</span>
            </div>
            <span className="font-semibold text-[var(--color-pub-text-primary)]">
              {invitation.workspaceName}
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-[var(--color-pub-border)]">
            <div className="flex items-center gap-2 text-[var(--color-pub-text-secondary)]">
              <Mail className="w-4 h-4 text-gray-500" />
              <span>Invited Email</span>
            </div>
            <span className="font-mono text-[var(--color-pub-text-primary)]">
              {invitation.invitedEmail}
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-[var(--color-pub-border)]">
            <div className="flex items-center gap-2 text-[var(--color-pub-text-secondary)]">
              <Shield className="w-4 h-4 text-gray-500" />
              <span>Intended Role</span>
            </div>
            <span className="font-semibold px-2 py-0.5 rounded bg-white border border-[var(--color-pub-border)] text-[var(--color-pub-text-primary)]">
              {invitation.intendedRole || 'MEMBER'}
            </span>
          </div>

          {invitation.teamName && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[var(--color-pub-text-secondary)]">
                <Users className="w-4 h-4 text-gray-500" />
                <span>Assigned Team</span>
              </div>
              <span className="font-semibold text-[var(--color-pub-text-primary)]">
                {invitation.teamName}
              </span>
            </div>
          )}
        </div>

        {/* Context-aware Actions */}
        <div className="pt-2">
          {isAuthenticated ? (
            // User is already logged in: single click to accept
            <button
              type="button"
              onClick={handleAccept}
              disabled={isAccepting}
              className="pub-btn-primary w-full justify-center py-2.5 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-pub-accent)] disabled:opacity-60 transition-all"
            >
              {isAccepting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Joining workspace...</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <span>Accept invitation</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>
          ) : isExistingUser ? (
            // Existing account: prompt to sign in
            <div className="space-y-3">
              <Link
                to={`/login?returnTo=${encodeURIComponent(`/invite/${token}?accepted=true`)}`}
                className="pub-btn-primary w-full justify-center py-2.5 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-pub-accent)] transition-all"
              >
                <LogIn className="w-4 h-4 mr-1.5" />
                <span>Sign in to accept</span>
              </Link>
              <p className="text-[11px] text-center text-[var(--color-pub-text-secondary)]">
                An existing Unblok account was found for {invitation.invitedEmail}.
              </p>
            </div>
          ) : (
            // New user account: prompt to create account
            <div className="space-y-3">
              <Link
                to={`/signup?inviteToken=${encodeURIComponent(token || '')}&email=${encodeURIComponent(
                  invitation.invitedEmail || ''
                )}`}
                className="pub-btn-primary w-full justify-center py-2.5 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-pub-accent)] transition-all"
              >
                <UserPlus className="w-4 h-4 mr-1.5" />
                <span>Create account to join</span>
              </Link>
              <p className="text-[11px] text-center text-[var(--color-pub-text-secondary)]">
                You'll join {invitation.workspaceName} immediately after creating your account.
              </p>
            </div>
          )}
        </div>
      </div>
    </AuthCard>
  );
};
