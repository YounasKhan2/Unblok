/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-12 Login Page
 * Section 9, 10, 17, 24, 25, 26, 29: Work email & password authentication, safe returnTo,
 * session-expired re-entry state, accessible form handling.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext';
import { getSafeReturnTo } from '../../features/auth/domain/safeReturnTo';
import { AuthCard } from '../../features/auth/components/AuthCard';
import { PasswordInput } from '../../features/auth/components/PasswordInput';
import { AlertCircle, Clock, ArrowRight, Loader2, KeyRound } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, status, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const returnToParam = searchParams.get('returnTo');
  const isSessionExpired = status === 'sessionExpired' || searchParams.get('sessionExpired') === 'true';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [authError, setAuthError] = useState('');

  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Focus management on mount
  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  const validateForm = (): boolean => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setAuthError('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setEmailError('Work email is required');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setEmailError('Please enter a valid work email address');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    }

    if (!isValid) {
      if (!cleanEmail) {
        emailInputRef.current?.focus();
      } else if (!password) {
        passwordInputRef.current?.focus();
      }
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const result = await login({ email, password });
      if (result.success) {
        const destination = getSafeReturnTo(returnToParam);
        navigate(destination, { replace: true });
      } else {
        setAuthError(result.error || 'Email or password is incorrect.');
        passwordInputRef.current?.focus();
      }
    } catch {
      setAuthError('An unexpected authentication error occurred. Please try again.');
    }
  };

  const handleQuickFill = () => {
    setEmail('alex@unblok.dev');
    setPassword('Password123!');
    setEmailError('');
    setPasswordError('');
    setAuthError('');
  };

  return (
    <AuthCard
      title={isSessionExpired ? 'Your session expired' : 'Sign in to Unblok'}
      subtitle={
        isSessionExpired
          ? 'Sign in again to continue where you left off.'
          : 'Access your engineering workspace, blocker graphs, and active execution stream.'
      }
      banner={
        isSessionExpired ? (
          <div
            className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed"
            role="status"
          >
            <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Session timeout</span>
              Your prototype session reached its expiration limit. Enter your credentials to resume your work.
            </div>
          </div>
        ) : null
      }
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            New to Unblok?{' '}
            <Link
              to={returnToParam ? `/signup?returnTo=${encodeURIComponent(returnToParam)}` : '/signup'}
              className="text-[var(--color-pub-accent)] font-semibold hover:underline"
            >
              Create account
            </Link>
          </span>

          <button
            type="button"
            onClick={handleQuickFill}
            className="inline-flex items-center gap-1 text-[11px] text-[var(--color-pub-text-muted)] hover:text-[var(--color-pub-accent)] transition-colors cursor-pointer"
            title="Pre-fill demo credentials for prototype testing"
          >
            <KeyRound className="w-3 h-3" />
            <span>Fill demo credentials</span>
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Global Error Banner */}
        {authError && (
          <div
            className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs leading-relaxed"
            role="alert"
            aria-live="assertive"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Authentication failed</span>
              {authError}
            </div>
          </div>
        )}

        {/* Work Email */}
        <div className="space-y-1.5">
          <label
            htmlFor="login-email"
            className="block text-xs font-semibold text-[var(--color-pub-text-primary)]"
          >
            Work email <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            ref={emailInputRef}
            id="login-email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError('');
            }}
            disabled={isLoading}
            autoComplete="email"
            placeholder="alex@company.com"
            required
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? 'login-email-error' : undefined}
            className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-[var(--color-pub-text-primary)] bg-white placeholder:text-[var(--color-pub-text-muted)] focus:outline-none focus:ring-2 transition-all ${
              emailError
                ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                : 'border-[var(--color-pub-border)] focus:border-[var(--color-pub-accent)] focus:ring-indigo-100'
            }`}
          />
          {emailError && (
            <p id="login-email-error" className="text-xs text-red-600 flex items-center gap-1.5 mt-1 font-medium" role="alert">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{emailError}</span>
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <PasswordInput
            ref={passwordInputRef as any}
            id="login-password"
            name="password"
            label="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (passwordError) setPasswordError('');
            }}
            disabled={isLoading}
            autoComplete="current-password"
            error={passwordError}
            required
          />

          <div className="flex justify-end mt-1.5">
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-[var(--color-pub-accent)] hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--color-pub-accent)] rounded"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {/* Submit Action */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="pub-btn-primary w-full justify-center py-2.5 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-pub-accent)] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <span>{isSessionExpired ? 'Sign in again' : 'Sign in'}</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </div>
      </form>
    </AuthCard>
  );
};
