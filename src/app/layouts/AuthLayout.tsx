/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-11A / UX-12 AuthLayout
 * Architectural boundary for authentication ceremonies (Login, Signup, Recovery).
 * Centered card canvas, minimal brand mark, no application rail, no marketing fluff.
 */

import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Layers } from 'lucide-react';
import '../../features/public/styles/public.css';

export const AuthLayout: React.FC = () => {
  return (
    <div className="unblok-public-theme min-h-screen flex flex-col justify-between bg-[#faf9f6]">
      {/* Minimal Header */}
      <header className="w-full py-6 px-6 sm:px-8 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2.5 text-[#111827] font-bold text-lg tracking-tight hover:opacity-90 transition-opacity"
          aria-label="Unblok Home"
        >
          <div className="w-7 h-7 rounded-lg bg-[var(--color-pub-accent)] flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
            <Layers className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span className="font-extrabold text-lg tracking-tight">Unblok</span>
        </Link>

        <Link
          to="/"
          className="text-xs font-semibold text-[var(--color-pub-text-muted)] hover:text-[var(--color-pub-text-primary)] transition-colors"
        >
          Back to homepage
        </Link>
      </header>

      {/* Centered Auth Card Stage */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>

      {/* Minimal Legal Footer */}
      <footer className="w-full py-6 px-6 text-center border-t border-[var(--color-pub-border)]">
        <div className="flex items-center justify-center gap-6 text-xs text-[var(--color-pub-text-muted)]">
          <Link to="/terms" className="hover:text-[var(--color-pub-text-primary)] transition-colors">
            Terms of Service
          </Link>
          <span>·</span>
          <Link to="/privacy" className="hover:text-[var(--color-pub-text-primary)] transition-colors">
            Privacy Policy
          </Link>
          <span>·</span>
          <Link to="/security" className="hover:text-[var(--color-pub-text-primary)] transition-colors">
            Security
          </Link>
        </div>
        <p className="text-xs text-[var(--color-pub-text-muted)] mt-2">
          © {new Date().getFullYear()} Unblok. All rights reserved.
        </p>
      </footer>
    </div>
  );
};
