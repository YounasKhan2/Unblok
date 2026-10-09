/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-12 Reset Password Page
 * Section 12: Deterministic password reset ceremony supporting valid, expired, and invalid states.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext';
import { evaluatePassword } from '../../features/auth/domain/passwordRules';
import { AuthCard } from '../../features/auth/components/AuthCard';
import { PasswordInput } from '../../features/auth/components/PasswordInput';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  KeyRound,
  Loader2,
  ShieldAlert,
} from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const { adapter, isLoading } = useAuth();
  const [searchParams] = useSearchParams();

  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [formError, setFormError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const newPasswordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  // Determine token validity status deterministically
  const isExpired = token === 'rst_expired' || token === 'reset-expired';
  const isInvalid = !token || token === 'rst_invalid' || token === 'reset-invalid';

  useEffect(() => {
    if (!isExpired && !isInvalid && !isSuccess) {
      newPasswordRef.current?.focus();
    }
  }, [isExpired, isInvalid, isSuccess]);

  // State 1: Expired Token
  if (isExpired) {
    return (
      <AuthCard
        badge={
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-sm">
            <Clock className="w-6 h-6 stroke-[2]" />
          </div>
        }
        title="This reset link has expired."
        subtitle="Password reset links expire after a short period for account security. Please submit a new request."
        footer={
          <div>
            <Link
              to="/forgot-password"
              className="pub-btn-primary w-full justify-center text-sm py-2.5"
            >
              Request a new reset link
            </Link>
          </div>
        }
      >
        <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900 leading-relaxed">
          <p className="font-semibold mb-1">Link expired</p>
          <p>
            This deterministic token simulates an expired security token. Click above to return to the password reset form.
          </p>
        </div>
      </AuthCard>
    );
  }

  // State 2: Invalid / Missing Token
  if (isInvalid) {
    return (
      <AuthCard
        badge={
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100 shadow-sm">
            <ShieldAlert className="w-6 h-6 stroke-[2]" />
          </div>
        }
        title="This reset link is invalid."
        subtitle="This link may have already been used, is malformed, or has been revoked."
        footer={
          <div>
            <Link
              to="/forgot-password"
              className="pub-btn-primary w-full justify-center text-sm py-2.5"
            >
              Request a new reset link
            </Link>
          </div>
        }
      >
        <div className="p-4 rounded-xl bg-red-50/60 border border-red-200 text-xs text-red-900 leading-relaxed">
          <p className="font-semibold mb-1">Invalid token</p>
          <p>
            Please check the link in your request confirmation or submit a new password recovery request.
          </p>
        </div>
      </AuthCard>
    );
  }

  // State 3: Password Updated Successfully
  if (isSuccess) {
    return (
      <AuthCard
        badge={
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm">
            <CheckCircle2 className="w-6 h-6 stroke-[2]" />
          </div>
        }
        title="Password updated"
        subtitle="Your password has been successfully reset. You can now sign in with your new credentials."
        footer={
          <div className="w-full">
            <Link
              to="/login"
              className="pub-btn-primary w-full justify-center text-sm py-2.5"
            >
              <span>Continue to sign in</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </div>
        }
      >
        <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
          <p className="font-semibold mb-1">Credentials updated</p>
          <p>
            Your account credentials have been refreshed. Your next authentication ceremony will require your new password.
          </p>
        </div>
      </AuthCard>
    );
  }

  // State 4: Valid Token — Password Reset Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setConfirmError('');
    setFormError('');

    let isValid = true;
    const rules = evaluatePassword(newPassword);

    if (!newPassword) {
      setPasswordError('New password is required');
      isValid = false;
    } else if (!rules.isValid) {
      setPasswordError('Password does not satisfy the requirement criteria below');
      isValid = false;
    }

    if (!confirmPassword) {
      setConfirmError('Please confirm your new password');
      isValid = false;
    } else if (newPassword !== confirmPassword) {
      setConfirmError('Passwords do not match');
      isValid = false;
    }

    if (!isValid) {
      if (!newPassword || passwordError) {
        newPasswordRef.current?.focus();
      } else {
        confirmPasswordRef.current?.focus();
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await adapter.resetPassword({ token, newPassword });
      if (result.success) {
        setIsSuccess(true);
      } else {
        setFormError('Failed to reset password. The link may have expired or is invalid.');
      }
    } catch {
      setFormError('An unexpected error occurred while resetting your password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      badge={
        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-[var(--color-pub-accent)] flex items-center justify-center border border-indigo-100 shadow-sm">
          <KeyRound className="w-6 h-6 stroke-[2]" />
        </div>
      }
      title="Set new password"
      subtitle="Create a secure password for your Unblok account."
      footer={
        <div>
          Remember your existing credentials?{' '}
          <Link to="/login" className="text-[var(--color-pub-accent)] font-semibold hover:underline">
            Sign in
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && (
          <div
            className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs leading-relaxed"
            role="alert"
            aria-live="assertive"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Reset failed</span>
              {formError}
            </div>
          </div>
        )}

        {/* New Password */}
        <div>
          <PasswordInput
            ref={newPasswordRef as any}
            id="reset-new-password"
            name="newPassword"
            label="New password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              if (passwordError) setPasswordError('');
            }}
            disabled={isSubmitting || isLoading}
            autoComplete="new-password"
            showRequirements={true}
            error={passwordError}
            required
          />
        </div>

        {/* Confirm New Password */}
        <div>
          <PasswordInput
            ref={confirmPasswordRef as any}
            id="reset-confirm-password"
            name="confirmPassword"
            label="Confirm new password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (confirmError) setConfirmError('');
            }}
            disabled={isSubmitting || isLoading}
            autoComplete="new-password"
            error={confirmError}
            required
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="pub-btn-primary w-full justify-center py-2.5 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-pub-accent)] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Resetting password...</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <span>Reset password</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </div>
      </form>
    </AuthCard>
  );
};
