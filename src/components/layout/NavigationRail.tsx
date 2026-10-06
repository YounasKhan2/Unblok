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
  ShieldAlert,
  ChevronsUpDown,
  Check,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { useCollaboration } from '../../features/collaboration/context/CollaborationContext';
import { useKeyboard } from '../../context/KeyboardContext';
import { Avatar } from '../ui/Avatar';

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
  const { unreadCount } = useCollaboration();
  const { setIsHelpModalOpen } = useKeyboard();

  const totalBlockedCount = issues.filter(i => getIssueBlockerStatus(i.id).isBlocked).length;

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
      badgeColor: 'bg-[#dd5b00] text-white',
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
      } shrink-0 bg-[#fafaf9] border-r border-[#e5e3df] h-full hidden md:flex flex-col justify-between select-none transition-all duration-150 z-30`}
      aria-label="Application Navigation"
    >
      {/* 1. Header & Collapse Toggle */}
      <div>
        <div className="h-[44px] flex items-center justify-between px-3 border-b border-[#e5e3df]">
          {!isNavCollapsed && (
            <div className="flex items-center gap-2 truncate">
              <span className="font-semibold text-xs text-[#1a1a1a] truncate">
                Navigation
              </span>
            </div>
          )}

          <button
            onClick={() => setIsNavCollapsed(!isNavCollapsed)}
            className="p-1 rounded text-[#787671] hover:text-[#1a1a1a] hover:bg-[#ede9e4] transition-colors ml-auto cursor-pointer"
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
                  className="my-1 border-t border-[#e5e3df]/70 mx-1"
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
                    ? 'bg-[#ede9e4] font-semibold text-[#1a1a1a]'
                    : 'text-[#52504b] hover:bg-[#ede9e4]/60 hover:text-[#1a1a1a]'
                }`}
                title={isNavCollapsed ? `${item.label} (${item.shortcut})` : undefined}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-[#5645d4]' : 'text-[#787671] group-hover:text-[#1a1a1a]'
                  }`}
                />
                {!isNavCollapsed && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}

                {!isNavCollapsed && item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      item.badgeColor || 'bg-purple-100 text-[#5645d4]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Left Active indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-1 bottom-1 w-[2.5px] bg-[#5645d4] rounded-r" />
                )}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* 3. Bottom Pinned Items (Settings, Help, User) */}
      <div className="p-1.5 border-t border-[#e5e3df] space-y-0.5 text-xs">
        {/* Settings Navigation Link */}
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-[5px] transition-colors cursor-pointer ${
              isActive || location.pathname.startsWith('/settings')
                ? 'bg-[#ede9e4] font-semibold text-[#1a1a1a]'
                : 'text-[#52504b] hover:bg-[#ede9e4]/60 hover:text-[#1a1a1a]'
            }`
          }
          title={isNavCollapsed ? 'Settings' : undefined}
        >
          <Settings className="w-4 h-4 text-[#787671] shrink-0" />
          {!isNavCollapsed && <span>Settings</span>}
        </NavLink>

        {/* Shortcuts Help */}
        <button
          onClick={() => setIsHelpModalOpen(true)}
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-[#787671] hover:text-[#1a1a1a] hover:bg-[#ede9e4] rounded-[5px] transition-colors cursor-pointer"
          title="Keyboard shortcuts (?)"
        >
          <HelpCircle className="w-4 h-4 shrink-0" />
          {!isNavCollapsed && <span>Shortcuts (?)</span>}
        </button>

        {/* Reset Demo State */}
        <button
          onClick={resetToDemoData}
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-[#787671] hover:text-red-600 hover:bg-red-50 rounded-[5px] transition-colors cursor-pointer"
          title="Reset to initial seed data"
        >
          <RotateCcw className="w-4 h-4 shrink-0" />
          {!isNavCollapsed && <span>Reset Demo State</span>}
        </button>

        {/* Current User Card & Role Switcher Popover */}
        <div className="pt-1 border-t border-[#e5e3df]/70 mt-1 relative">
          <div className="flex items-center justify-between p-1 rounded-[5px] hover:bg-[#ede9e4] transition-colors group">
            <Link
              to="/settings/preferences"
              className="flex items-center gap-2 flex-1 min-w-0"
              title={`${currentUser.name} (${currentUser.role}) — Preferences`}
            >
              <Avatar user={currentUser} size="xs" />
              {!isNavCollapsed && (
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-xs font-semibold text-[#1a1a1a] truncate leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-[#787671] uppercase font-mono">
                    {currentUser.role}
                  </div>
                </div>
              )}
            </Link>

            {!isNavCollapsed && (
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="p-1 rounded text-[#787671] hover:text-[#1a1a1a] hover:bg-[#e5e3df] transition-colors cursor-pointer"
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
              <div className="absolute left-0 bottom-full mb-1 w-56 bg-white border border-[#e5e3df] rounded-lg shadow-xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1 text-[10px] font-semibold text-[#787671] uppercase tracking-wider">
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
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-left hover:bg-[#fafaf9] transition-colors cursor-pointer ${
                        isSelected ? 'bg-purple-50/50 font-semibold' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar user={u} size="xs" />
                        <div className="min-w-0">
                          <div className="text-xs text-[#1a1a1a] truncate">{u.name}</div>
                          <div className="text-[10px] font-mono text-[#787671] uppercase">
                            {u.role}
                          </div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#5645d4] shrink-0" />}
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
