/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import {
  CheckSquare,
  Inbox,
  FolderKanban,
  Users,
  Clock,
  Target,
  CalendarRange,
  GitFork,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  RotateCcw,
  History,
  ShieldAlert,
  ChevronsUpDown,
  Check,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { useCollaboration } from '../../features/collaboration/context/CollaborationContext';
import { useKeyboard } from '../../context/KeyboardContext';
import { Avatar } from '../ui/Avatar';
import {
  getLatestNexusFixtureBackup,
  restorePrototypeBackup,
} from '../../context/nexusFixtureReset';

export const NavigationRail: React.FC = () => {
  const location = useLocation();
  const {
    issues,
    currentUser,
    setCurrentUser,
    users,
    isNavCollapsed,
    setIsNavCollapsed,
    getIssueBlockerStatus,
    resetToDemoData,
  } = useProject();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const { unreadCount } = useCollaboration();
  const { setIsHelpModalOpen } = useKeyboard();

  const totalBlockedCount = issues.filter(i => getIssueBlockerStatus(i.id).isBlocked).length;
  const latestBackupKey = typeof window === 'undefined'
    ? null
    : getLatestNexusFixtureBackup(window.localStorage);

  const restoreLastBackup = () => {
    if (typeof window === 'undefined' || !latestBackupKey) return;
    const confirmed = window.confirm(
      `Restore the backed-up prototype state from ${latestBackupKey}? Current NEXUS changes will be backed up so they can be recovered.`
    );
    if (!confirmed) return;

    try {
      const undoBackupKey = restorePrototypeBackup(window.localStorage, latestBackupKey, true);
      console.info(`Prototype state restored. Current NEXUS state backup: ${undoBackupKey}`);
      window.location.reload();
    } catch (error) {
      setRecoveryError(error instanceof Error ? error.message : 'Could not restore the prototype backup.');
    }
  };

  const navItems = [
    {
      to: '/my-work',
      label: 'My Work',
      icon: CheckSquare,
      shortcut: 'G M',
      badge: null,
    },
    {
      to: '/inbox',
      label: 'Inbox',
      icon: Inbox,
      shortcut: 'G I',
      badge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : String(unreadCount)) : null,
    },
    {
      isSeparator: true,
    },
    {
      to: '/projects',
      label: 'Projects',
      icon: FolderKanban,
      shortcut: 'G P',
      badge: null,
    },
    {
      to: '/teams',
      label: 'Teams',
      icon: Users,
      shortcut: 'G T',
      badge: null,
    },
    {
      isSeparator: true,
    },
    {
      to: '/cycles',
      label: 'Cycles',
      icon: Clock,
      shortcut: 'G C',
      badge: '24',
    },
    {
      to: '/milestones',
      label: 'Milestones',
      icon: Target,
      shortcut: 'G S',
      badge: '3',
    },
    {
      to: '/roadmap',
      label: 'Roadmap',
      icon: CalendarRange,
      shortcut: 'G R',
      badge: null,
    },
    {
      isSeparator: true,
    },
    {
      to: '/dependencies',
      label: 'Dependencies',
      icon: GitFork,
      shortcut: 'G D',
      badge: totalBlockedCount > 0 ? String(totalBlockedCount) : null,
      badgeColor: 'bg-blocker text-white',
    },
    {
      to: '/insights',
      label: 'Insights',
      icon: BarChart3,
      shortcut: '',
      badge: null,
    },
  ];

  return (
    <nav
      className={`${
        isNavCollapsed ? 'w-[52px]' : 'w-[220px]'
      } shrink-0 bg-surface-subtle border-r border-border h-full hidden md:flex flex-col justify-between select-none transition-all duration-150 z-30`}
      aria-label="Application Navigation"
    >
      {/* 1. Header & Collapse Toggle */}
      <div>
        <div className="h-[44px] flex items-center justify-between px-3 border-b border-border">
          {!isNavCollapsed && (
            <div className="flex items-center gap-2 truncate">
              <span className="font-semibold text-xs text-text-primary truncate">
                Navigation
              </span>
            </div>
          )}

          <button
            onClick={() => setIsNavCollapsed(!isNavCollapsed)}
            className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors ml-auto cursor-pointer"
            title={isNavCollapsed ? 'Expand sidebar ([)' : 'Collapse sidebar ([)'}
            aria-label={isNavCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isNavCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* 2. Primary Navigation Links */}
        <div className="p-1.5 space-y-0.5 text-xs">
          {navItems.map((item, idx) => {
            if (item.isSeparator) {
              return (
                <div
                  key={`sep-${idx}`}
                  className="my-1 border-t border-border mx-1"
                />
              );
            }

            const Icon = item.icon!;
            const isActive =
              location.pathname === item.to ||
              (item.to !== '/my-work' && location.pathname.startsWith(item.to!));

            return (
              <NavLink
                key={item.to}
                to={item.to!}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-[5px] transition-colors cursor-pointer group relative ${
                  isActive
                    ? 'bg-surface-muted font-semibold text-text-primary'
                    : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary'
                }`}
                title={isNavCollapsed ? `${item.label} (${item.shortcut})` : undefined}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-accent' : 'text-text-muted group-hover:text-text-primary'
                  }`}
                />
                {!isNavCollapsed && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}

                {!isNavCollapsed && item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      item.badgeColor || 'bg-accent-subtle text-accent'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Left Active indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-1 bottom-1 w-[2.5px] bg-accent rounded-r" />
                )}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* 3. Bottom Pinned Items (Settings, Help, User) */}
      <div className="p-1.5 border-t border-border space-y-0.5 text-xs">
        {/* Settings Navigation Link */}
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-[5px] transition-colors cursor-pointer ${
              isActive || location.pathname.startsWith('/settings')
                ? 'bg-surface-muted font-semibold text-text-primary'
                : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary'
            }`
          }
          title={isNavCollapsed ? 'Settings' : undefined}
        >
          <Settings className="w-4 h-4 text-text-muted shrink-0" />
          {!isNavCollapsed && <span>Settings</span>}
        </NavLink>

        {/* Shortcuts Help */}
        <button
          onClick={() => setIsHelpModalOpen(true)}
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-text-muted hover:text-text-primary hover:bg-surface-muted rounded-[5px] transition-colors cursor-pointer"
          title="Keyboard shortcuts (?)"
        >
          <HelpCircle className="w-4 h-4 shrink-0" />
          {!isNavCollapsed && <span>Shortcuts (?)</span>}
        </button>

        {/* Reset Demo State */}
        <button
          onClick={resetToDemoData}
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-text-muted hover:text-danger hover:bg-danger-subtle rounded-[5px] transition-colors cursor-pointer"
          title="Back up current state and reset to the NEXUS fixture"
        >
          <RotateCcw className="w-4 h-4 shrink-0" />
          {!isNavCollapsed && <span>Reset to NEXUS</span>}
        </button>
        {latestBackupKey && (
          <button
            onClick={restoreLastBackup}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-text-muted hover:text-text-primary hover:bg-surface-muted rounded-[5px] transition-colors cursor-pointer"
            title="Restore the most recent pre-reset backup"
          >
            <History className="w-4 h-4 shrink-0" />
            {!isNavCollapsed && <span>Restore previous state</span>}
          </button>
        )}
        {recoveryError && (
          <p className="px-2.5 py-1 text-[10px] text-danger" role="alert">
            {recoveryError}
          </p>
        )}

        {/* Current User Card & Role Switcher Popover */}
        <div className="pt-1 border-t border-border mt-1 relative">
          <div className="flex items-center justify-between p-1 rounded-[5px] hover:bg-surface-muted transition-colors group">
            <Link
              to="/settings/preferences"
              className="flex items-center gap-2 flex-1 min-w-0"
              title={`${currentUser.name} (${currentUser.role}) — Preferences`}
            >
              <Avatar user={currentUser} size="xs" />
              {!isNavCollapsed && (
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-xs font-semibold text-text-primary truncate leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-text-muted uppercase font-mono">
                    {currentUser.role}
                  </div>
                </div>
              )}
            </Link>

            {!isNavCollapsed && (
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors cursor-pointer"
                title="Switch User / Test Roles"
                aria-label="Switch User / Test Roles"
              >
                <ChevronsUpDown className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* User Switcher Dropdown Menu */}
          {isUserMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsUserMenuOpen(false)}
              />
              <div className="absolute left-0 bottom-full mb-1 w-56 bg-surface-base border border-border rounded-lg shadow-xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                  Switch Active Role (Test)
                </div>
                {users.map(u => {
                  const isSelected = u.id === currentUser.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setCurrentUser(u);
                        setIsUserMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-left hover:bg-surface-subtle transition-colors cursor-pointer ${
                        isSelected ? 'bg-accent/10 font-semibold' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar user={u} size="xs" />
                        <div className="min-w-0">
                          <div className="text-xs text-text-primary truncate">{u.name}</div>
                          <div className="text-[10px] font-mono text-text-muted uppercase">
                            {u.role}
                          </div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-accent shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
