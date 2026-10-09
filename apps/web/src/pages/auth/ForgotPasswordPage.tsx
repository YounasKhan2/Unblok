/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-12 Forgot Password Page
 * Section 11: Work email entry with honest prototype request acceptance state.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext';
import { AuthCard } from '../../features/auth/components/AuthCard';
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Loader2, KeyRound } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const { adapter, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isSubmitted) {
      emailInputRef.current?.focus();
    }
  }, [isSubmitted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setEmailError('Work email is required');
      emailInputRef.current?.focus();
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setEmailError('Please enter a valid work email address');
      emailInputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      await adapter.requestPasswordReset(cleanEmail);
      setSubmittedEmail(cleanEmail);
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <AuthCard
        badge={
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm">
            <CheckCircle2 className="w-6 h-6 stroke-[2]" />
          </div>
        }
        title="Reset request accepted"
        subtitle={`If an Unblok account exists for ${submittedEmail}, password reset instructions will be delivered when identity infrastructure is connected.`}
        footer={
          <div>
            <Link
              to="/login"
              className="pub-btn-secondary w-full justify-center text-sm py-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              <span>Back to sign in</span>
            </Link>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[var(--color-pub-surface-subtle)] border border-[var(--color-pub-border)] text-xs text-[var(--color-pub-text-secondary)] leading-relaxed space-y-2">
            <p className="font-semibold text-[var(--color-pub-text-primary)]">
              Prototype Verification Environment
            </p>
            <p>
              This prototype simulates the password reset ceremony without dispatching external email. You can directly inspect the reset ceremony using our deterministic token links:
            </p>
            <div className="pt-2 flex flex-col gap-1.5 font-medium">
              <Link
                to="/reset-password?token=rst_valid"
                className="inline-flex items-center gap-1.5 text-[var(--color-pub-accent)] hover:underline"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Test with valid reset token →</span>
              </Link>
              <Link
                to="/reset-password?token=rst_expired"
                className="inline-flex items-center gap-1.5 text-amber-700 hover:underline"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Test with expired reset token →</span>
              </Link>
            </div>
          </div>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Reset your password"
      subtitle="Enter the work email associated with your account to receive password reset instructions."
      footer={
        <div>
          Remember your password?{' '}
          <Link to="/login" className="text-[var(--color-pub-accent)] font-semibold hover:underline">
            Sign in
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Work Email */}
        <div className="space-y-1.5">
          <label
            htmlFor="forgot-email"
            className="block text-xs font-semibold text-[var(--color-pub-text-primary)]"
          >
            Work email <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            ref={emailInputRef}
            id="forgot-email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError('');
            }}
            disabled={isSubmitting || isLoading}
            autoComplete="email"
            placeholder="alex@company.com"
            required
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? 'forgot-email-error' : undefined}
            className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-[var(--color-pub-text-primary)] bg-white placeholder:text-[var(--color-pub-text-muted)] focus:outline-none focus:ring-2 transition-all ${
              emailError
                ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                : 'border-[var(--color-pub-border)] focus:border-[var(--color-pub-accent)] focus:ring-indigo-100'
            }`}
          />
          {emailError && (
            <p id="forgot-email-error" className="text-xs text-red-600 flex items-center gap-1.5 mt-1 font-medium" role="alert">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{emailError}</span>
            </p>
          )}
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="pub-btn-primary w-full justify-center py-2.5 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-pub-accent)] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Submitting request...</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <span>Send reset link</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </div>
      </form>
    </AuthCard>
  );
};
