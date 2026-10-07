/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-12 Reviewer & Development Test Harness
 * Section 19: Dedicated test harness for inspecting authenticated prototype state
 * without cluttering normal customer navigation.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Wrench,
  X,
  UserCheck,
  LogOut,
  Clock,
  Shield,
  KeyRound,
  Mail,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

export const AuthDevHarness: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { status, user, membership, switchReviewerUser, logout, expireSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Listen for Alt+Shift+D shortcut to toggle harness
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* Discreet Reviewer Trigger Badge (fixed bottom-left) */}
      <div className="fixed bottom-3 left-3 z-50">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-900/90 text-white text-xs font-mono shadow-lg hover:bg-black transition-colors backdrop-blur-sm border border-gray-700/60 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          title="Toggle Reviewer Harness (Alt+Shift+D)"
          aria-expanded={isOpen}
          aria-controls="auth-dev-harness-dialog"
        >
          <Wrench className="w-3.5 h-3.5 text-indigo-400" />
          <span>Reviewer Harness</span>
          <span className="text-[10px] text-gray-400 font-sans px-1 rounded bg-gray-800">
            {status}
          </span>
        </button>
      </div>

      {/* Slide-over Drawer / Modal */}
      {isOpen && (
        <div
          id="auth-dev-harness-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="harness-title"
          className="fixed inset-y-0 left-0 w-full sm:w-96 bg-gray-950 text-gray-100 z-50 shadow-2xl border-r border-gray-800 flex flex-col animate-in slide-in-from-left duration-200"
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-indigo-600/30 text-indigo-400 flex items-center justify-center">
                <Wrench className="w-4 h-4" />
              </div>
              <div>
                <h2 id="harness-title" className="text-sm font-bold text-white">
                  Auth Prototype Harness
                </h2>
                <p className="text-[11px] text-gray-400 font-mono">
                  UX-12 Reviewer Inspection
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              aria-label="Close reviewer harness"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
            {/* Active Status Card */}
            <div className="p-3 rounded-lg bg-gray-900 border border-gray-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                  Active Status
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    status === 'authenticated'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : status === 'sessionExpired'
                      ? 'bg-amber-950 text-amber-400 border border-amber-800'
                      : 'bg-gray-800 text-gray-300 border border-gray-700'
                  }`}
                >
                  {status}
                </span>
              </div>
              {user && (
                <div className="pt-1 text-[11px] text-gray-300">
                  <span className="font-semibold text-white">{user.name}</span> ({user.email})
                  {membership && (
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      Workspace: {membership.workspaceName || membership.workspaceId} · Role: {membership.role}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Session Lifecycle Controls */}
            <div className="space-y-2">
              <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Session Lifecycle
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    expireSession();
                    if (!location.pathname.startsWith('/login')) {
                      navigate(`/login?returnTo=${encodeURIComponent(location.pathname)}&sessionExpired=true`);
                    }
                  }}
                  className="flex items-center gap-1.5 p-2 rounded bg-amber-950/40 text-amber-300 border border-amber-800/80 hover:bg-amber-900/60 transition-colors text-left"
                >
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>Expire Session</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="flex items-center gap-1.5 p-2 rounded bg-gray-900 text-gray-300 border border-gray-800 hover:bg-gray-800 transition-colors text-left"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  <span>Set Guest</span>
                </button>
              </div>
            </div>

            {/* Switch Prototype Account */}
            <div className="space-y-2">
              <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Seed Accounts (Fast Sign-In)
              </h3>
              <div className="space-y-1.5">
                {[
                  { name: 'Alex Rivera', role: 'MEMBER', email: 'alex@unblok.dev' },
                  { name: 'Sarah Chen', role: 'ADMIN', email: 'sarah@unblok.dev' },
                  { name: 'Marcus Vance', role: 'MEMBER', email: 'marcus@unblok.dev' },
                  { name: 'Elena Rostova', role: 'OBSERVER', email: 'elena@unblok.dev' },
                ].map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => {
                      switchReviewerUser(account.email);
                      navigate('/my-work');
                    }}
                    className="w-full flex items-center justify-between p-2 rounded bg-gray-900 hover:bg-gray-850 border border-gray-800 hover:border-indigo-600/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-white">{account.name}</div>
                        <div className="text-[10px] text-gray-400">{account.email}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-800 text-gray-300">
                      {account.role}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Deterministic Invitation Routes */}
            <div className="space-y-2">
              <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                <span>Deterministic Invitations</span>
              </h3>
              <div className="space-y-1">
                {[
                  { label: 'Existing User Invite', path: '/invite/inv_existing_user' },
                  { label: 'New User Invite', path: '/invite/inv_new_user' },
                  { label: 'Expired Invite', path: '/invite/inv_expired' },
                  { label: 'Revoked Invite', path: '/invite/inv_revoked' },
                  { label: 'Already Accepted', path: '/invite/inv_accepted' },
                ].map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded bg-gray-900/60 hover:bg-gray-800 text-gray-300 hover:text-white transition-colors"
                  >
                    <span>{item.label}</span>
                    <ChevronRight className="w-3 h-3 text-gray-500" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Password Recovery Routes */}
            <div className="space-y-2">
              <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                <span>Password Recovery Links</span>
              </h3>
              <div className="space-y-1">
                {[
                  { label: 'Forgot Password Form', path: '/forgot-password' },
                  { label: 'Valid Reset Token', path: '/reset-password?token=rst_valid' },
                  { label: 'Expired Reset Token', path: '/reset-password?token=rst_expired' },
                  { label: 'Invalid Reset Token', path: '/reset-password?token=rst_invalid' },
                ].map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded bg-gray-900/60 hover:bg-gray-800 text-gray-300 hover:text-white transition-colors"
                  >
                    <span>{item.label}</span>
                    <ChevronRight className="w-3 h-3 text-gray-500" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Deep Links & Safe Return */}
            <div className="space-y-2">
              <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                <span>Deep Links & Boundaries</span>
              </h3>
              <div className="space-y-1">
                <Link
                  to="/login?returnTo=%2Fprojects%2FENG%2Fissues"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded bg-gray-900/60 hover:bg-gray-800 text-gray-300 hover:text-white transition-colors"
                >
                  <span>Login with returnTo=/projects/ENG/issues</span>
                  <ExternalLink className="w-3 h-3 text-gray-500" />
                </Link>
                <Link
                  to="/onboarding"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded bg-gray-900/60 hover:bg-gray-800 text-gray-300 hover:text-white transition-colors"
                >
                  <span>Onboarding Boundary (UX-13 Placeholder)</span>
                  <ExternalLink className="w-3 h-3 text-gray-500" />
                </Link>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="p-3 border-t border-gray-800 text-[10px] text-gray-500 text-center font-mono">
            Dev/Reviewer only · Press Alt+Shift+D to toggle
          </div>
        </div>
      )}
    </>
  );
};
