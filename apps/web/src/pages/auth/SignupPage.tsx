/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-12 Sign Up Page
 * Section 7, 8, 13, 21, 24, 26, 29: Identity-only account registration.
 * Does not create workspace/team/project. Routes new users to /onboarding boundary,
 * and invited users directly to their invited workspace.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext';
import { evaluatePassword } from '../../features/auth/domain/passwordRules';
import { AuthCard } from '../../features/auth/components/AuthCard';
import { PasswordInput } from '../../features/auth/components/PasswordInput';
import { AlertCircle, ArrowRight, Loader2, MailCheck } from 'lucide-react';

export const SignupPage: React.FC = () => {
  const { signup, adapter, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const inviteToken = searchParams.get('inviteToken');
  const prefilledEmail = searchParams.get('email') || '';

  const [name, setName] = useState('');
  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState('');

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');

  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (prefilledEmail) {
      nameInputRef.current?.focus();
    } else {
      nameInputRef.current?.focus();
    }
  }, [prefilledEmail]);

  const validateForm = (): boolean => {
    let isValid = true;
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setFormError('');

    const cleanName = name.trim();
    if (!cleanName) {
      setNameError('Full name is required');
      isValid = false;
    }

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setEmailError('Work email is required');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setEmailError('Please enter a valid work email address');
      isValid = false;
    }

    const passwordRules = evaluatePassword(password);
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (!passwordRules.isValid) {
      setPasswordError('Password must meet all requirement criteria below');
      isValid = false;
    }

    if (!isValid) {
      if (!cleanName) {
        nameInputRef.current?.focus();
      } else if (!cleanEmail || emailError) {
        emailInputRef.current?.focus();
      } else if (!password || passwordError) {
        passwordInputRef.current?.focus();
      }
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const result = await signup({ name, email, password });
      if (result.success && result.user) {
        // Section 21: If user was invited, accept invitation and enter workspace directly
        if (inviteToken) {
          await adapter.acceptInvitation(inviteToken, result.user.id);
          navigate('/my-work', { replace: true });
        } else {
          // Standard signup routes to onboarding lifecycle boundary
          navigate('/onboarding', { replace: true });
        }
      } else {
        setFormError(result.error || 'Failed to create account. Please check your information.');
      }
    } catch {
      setFormError('An unexpected registration error occurred. Please try again.');
    }
  };

  return (
    <AuthCard
      title="Create your account"
      subtitle="Start tracking dependencies, eliminating blockers, and delivering with clarity."
      banner={
        inviteToken ? (
          <div
            className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs leading-relaxed"
            role="status"
          >
            <MailCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Joining via invitation</span>
              Your account will automatically join the invited workspace upon creation.
            </div>
          </div>
        ) : null
      }
      footer={
        <div>
          Already have an account?{' '}
          <Link to="/login" className="text-[var(--color-pub-accent)] font-semibold hover:underline">
            Sign in
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Form-level Error Alert */}
        {formError && (
          <div
            className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs leading-relaxed"
            role="alert"
            aria-live="assertive"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Registration error</span>
              {formError}
            </div>
          </div>
        )}

        {/* Full Name */}
        <div className="space-y-1.5">
          <label
            htmlFor="signup-name"
            className="block text-xs font-semibold text-[var(--color-pub-text-primary)]"
          >
            Full name <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            ref={nameInputRef}
            id="signup-name"
            name="name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError('');
            }}
            disabled={isLoading}
            autoComplete="name"
            placeholder="Alex Rivera"
            required
            aria-invalid={Boolean(nameError)}
            aria-describedby={nameError ? 'signup-name-error' : undefined}
            className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-[var(--color-pub-text-primary)] bg-white placeholder:text-[var(--color-pub-text-muted)] focus:outline-none focus:ring-2 transition-all ${
              nameError
                ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                : 'border-[var(--color-pub-border)] focus:border-[var(--color-pub-accent)] focus:ring-indigo-100'
            }`}
          />
          {nameError && (
            <p id="signup-name-error" className="text-xs text-red-600 flex items-center gap-1.5 mt-1 font-medium" role="alert">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{nameError}</span>
            </p>
          )}
        </div>

        {/* Work Email */}
        <div className="space-y-1.5">
          <label
            htmlFor="signup-email"
            className="block text-xs font-semibold text-[var(--color-pub-text-primary)]"
          >
            Work email <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            ref={emailInputRef}
            id="signup-email"
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
            aria-describedby={emailError ? 'signup-email-error' : undefined}
            className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-[var(--color-pub-text-primary)] bg-white placeholder:text-[var(--color-pub-text-muted)] focus:outline-none focus:ring-2 transition-all ${
              emailError
                ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                : 'border-[var(--color-pub-border)] focus:border-[var(--color-pub-accent)] focus:ring-indigo-100'
            }`}
          />
          {emailError && (
            <p id="signup-email-error" className="text-xs text-red-600 flex items-center gap-1.5 mt-1 font-medium" role="alert">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{emailError}</span>
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <PasswordInput
            ref={passwordInputRef as any}
            id="signup-password"
            name="password"
            label="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (passwordError) setPasswordError('');
            }}
            disabled={isLoading}
            autoComplete="new-password"
            showRequirements={true}
            error={passwordError}
            required
          />
        </div>

        {/* Legal Disclaimer */}
        <p className="text-[11px] text-[var(--color-pub-text-secondary)] leading-relaxed pt-1">
          By creating an account, you agree to our{' '}
          <Link to="/terms" className="text-[var(--color-pub-accent)] hover:underline">
            Terms of Service
          </Link>{' '}
          and acknowledge our{' '}
          <Link to="/privacy" className="text-[var(--color-pub-accent)] hover:underline">
            Privacy Policy
          </Link>
          .
        </p>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="pub-btn-primary w-full justify-center py-2.5 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-pub-accent)] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating account...</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <span>Create account</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </div>
      </form>
    </AuthCard>
  );
};
