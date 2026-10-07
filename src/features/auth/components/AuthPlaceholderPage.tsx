/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-11B Auth Placeholder State
 * Clean structural placeholder under AuthLayout boundary.
 * UX-12 will implement actual authentication ceremonies.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';

interface AuthPlaceholderPageProps {
  mode: 'login' | 'signup';
}

export const AuthPlaceholderPage: React.FC<AuthPlaceholderPageProps> = ({ mode }) => {
  const isLogin = mode === 'login';
  const title = isLogin ? 'Sign in to Unblok' : 'Create your Unblok account';
  const subtitle = isLogin
    ? 'Access your engineering workspace, blocker graphs, and active execution stream.'
    : 'Get started with high-density execution intelligence and dependency tracking.';

  return (
    <div className="bg-white border border-[var(--color-pub-border)] rounded-2xl p-8 sm:p-10 shadow-lg shadow-black/[0.04]">
      {/* Icon Badge */}
      <div className="w-12 h-12 rounded-xl bg-[var(--color-pub-accent-subtle)] text-[var(--color-pub-accent)] flex items-center justify-center mb-6 shadow-sm">
        <Lock className="w-5 h-5 stroke-[2.2]" />
      </div>

      {/* Boundary Badge */}
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-pub-surface-subtle)] border border-[var(--color-pub-border)] text-xs font-semibold text-[var(--color-pub-text-secondary)] mb-4">
        <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-pub-accent)]" />
        <span>Auth Boundary · Scheduled for UX-12</span>
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-[var(--color-pub-text-primary)] mb-2">
        {title}
      </h1>

      <p className="text-sm text-[var(--color-pub-text-secondary)] leading-relaxed mb-8">
        {subtitle}
      </p>

      {/* Explicit Phase Disclosure */}
      <div className="bg-[var(--color-pub-surface-subtle)] border border-[var(--color-pub-border)] rounded-xl p-4 mb-8 text-left">
        <p className="text-xs font-semibold text-[var(--color-pub-text-primary)] mb-1">
          Authentication experience coming in UX-12
        </p>
        <p className="text-xs text-[var(--color-pub-text-secondary)] leading-relaxed">
          This boundary will handle guest session authentication, credentials, and safe returnTo redirects.
        </p>
      </div>

      {/* Navigation Actions */}
      <div className="space-y-3">
        <Link
          to="/"
          className="pub-btn-secondary w-full justify-center text-sm py-2.5"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Return to homepage
        </Link>

        <div className="pt-2 text-center text-xs text-[var(--color-pub-text-secondary)]">
          {isLogin ? (
            <span>
              Don't have an account?{' '}
              <Link to="/signup" className="text-[var(--color-pub-accent)] font-semibold hover:underline">
                Sign up
              </Link>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <Link to="/login" className="text-[var(--color-pub-accent)] font-semibold hover:underline">
                Sign in
              </Link>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
