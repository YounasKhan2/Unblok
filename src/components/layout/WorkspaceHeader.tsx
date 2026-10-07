/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext';
import { useCollaboration } from '../../features/collaboration/context/CollaborationContext';
import { useKeyboard } from '../../context/KeyboardContext';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { WorkspaceSwitcher } from '../../features/workspaces/components/WorkspaceSwitcher';
import {
  Plus,
  ShieldAlert,
  Search,
  Bell,
  HelpCircle,
  ChevronDown,
  Building2,
  Check,
  Menu,
  X,
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
} from 'lucide-react';

export const WorkspaceHeader: React.FC = () => {
  const { issues, currentUser, getIssueBlockerStatus } = useProject();
  const { unreadCount } = useCollaboration();
  const { setIsCreateModalOpen, setIsHelpModalOpen } = useKeyboard();
  const navigate = useNavigate();

  const handleOpenPalette = () => {
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true })
    );
  };

  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const blockedCount = issues.filter(i => getIssueBlockerStatus(i.id).isBlocked).length;

  const mobileNavItems = [
    { to: '/my-work', label: 'My Work', icon: CheckSquare },
    { to: '/inbox', label: 'Inbox', icon: Inbox },
    { to: '/projects', label: 'Projects', icon: FolderKanban },
    { to: '/teams', label: 'Teams', icon: Users },
    { to: '/cycles', label: 'Cycles', icon: Clock },
    { to: '/milestones', label: 'Milestones', icon: Target },
    { to: '/roadmap', label: 'Roadmap', icon: CalendarRange },
    { to: '/dependencies', label: 'Dependencies', icon: GitFork },
    { to: '/insights', label: 'Insights', icon: BarChart3 },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="h-[44px] bg-surface-base border-b border-border px-3.5 flex items-center justify-between shrink-0 select-none z-40 sticky top-0 shadow-2xs">
      {/* 1. Left: Mobile Menu Toggle + Brand & Workspace Switcher Context */}
      <div className="flex items-center gap-2">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          onClick={() => setIsMobileNavOpen(true)}
          className="p-1 md:hidden text-text-muted hover:text-text-primary hover:bg-surface-muted rounded-[5px] transition-colors cursor-pointer"
          aria-label="Open mobile navigation"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Unblok Brand Mark */}
        <Link to="/my-work" className="flex items-center gap-2 group">
          <div className="w-6 h-6 rounded-[5px] bg-accent text-white flex items-center justify-center font-bold text-xs shadow-2xs hover:opacity-90 transition-opacity">
            <svg
              className="w-3.5 h-3.5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <path d="M14 18h7" />
              <path d="M18 14l4 4-4 4" />
            </svg>
          </div>
          <span className="font-bold text-xs text-text-primary tracking-tight hidden sm:inline">
            Unblok
          </span>
        </Link>

        <span className="text-text-muted text-xs hidden sm:inline">/</span>

        {/* UX-13 Functional Workspace Switcher */}
        <WorkspaceSwitcher />
      </div>

      {/* 2. Middle: Global Search & Command Palette Trigger */}
      <div className="flex-1 max-w-md mx-3 hidden md:block">
        <button
          onClick={handleOpenPalette}
          className="w-full h-7 px-2.5 bg-surface-subtle hover:bg-surface-muted border border-border rounded-[5px] text-xs text-text-muted flex items-center justify-between cursor-pointer transition-colors"
          title="Search or jump to... (⌘K)"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-text-muted" />
            <span>Search or jump to...</span>
          </div>
          <kbd className="font-mono text-[10px] text-text-muted bg-surface-base border border-border px-1.5 py-0.2 rounded shadow-2xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* 3. Right: Global Create, Notifications & User */}
      <div className="flex items-center gap-2">
        {/* Global Create Issue Button */}
        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => setIsCreateModalOpen(true)}
          className="shadow-2xs font-semibold"
        >
          <span className="hidden sm:inline">New Issue</span>
          <span className="sm:hidden">New</span>
          <kbd className="hidden sm:inline-block ml-1 font-mono text-[9px] bg-white/20 px-1 py-0.2 rounded text-white">
            C
          </kbd>
        </Button>

        <div className="w-[1px] h-4 bg-border mx-0.5 hidden sm:block" />

        {/* Global Blockers Quick Badge */}
        {blockedCount > 0 && (
          <Link
            to="/dependencies"
            className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-[5px] bg-warning-subtle border border-warning/30 text-warning hover:bg-warning-subtle/80 text-[11px] font-semibold transition-colors"
            title={`${blockedCount} active blockers across workspace`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{blockedCount}</span>
          </Link>
        )}

        {/* Inbox / Notification Bell */}
        <Link
          to="/inbox"
          className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-muted rounded-[5px] transition-colors relative"
          title={`Inbox & notifications (G then I)${unreadCount > 0 ? ` — ${unreadCount} unread` : ''}`}
          aria-label={unreadCount > 0 ? `Inbox (${unreadCount} unread)` : 'Inbox'}
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span
              className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent"
              aria-hidden="true"
            />
          )}
        </Link>

        {/* Keyboard Shortcuts Trigger */}
        <button
          onClick={() => setIsHelpModalOpen(true)}
          className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-muted rounded-[5px] transition-colors hidden sm:block"
          title="Keyboard shortcuts (?)"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Current User Avatar with Settings link */}
        <Link
          to="/settings/preferences"
          className="flex items-center gap-1.5 p-0.5 rounded-[5px] hover:bg-surface-muted transition-colors"
          title={`${currentUser.name} (${currentUser.role}) — Preferences`}
        >
          <Avatar user={currentUser} size="xs" />
        </Link>
      </div>

      {/* Mobile Navigation Drawer Overlay */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs animate-in fade-in"
            onClick={() => setIsMobileNavOpen(false)}
          />
          <div className="relative w-64 max-w-[80vw] bg-surface-base border-r border-border h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-150">
            <div className="h-[44px] px-3.5 border-b border-border flex items-center justify-between">
              <span className="font-bold text-xs text-text-primary">Unblok Navigation</span>
              <button
                onClick={() => setIsMobileNavOpen(false)}
                className="p-1 text-text-muted hover:text-text-primary rounded cursor-pointer"
                aria-label="Close mobile menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {mobileNavItems.map(item => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsMobileNavOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-text-primary hover:bg-surface-muted rounded-[5px] transition-colors"
                  >
                    <Icon className="w-4 h-4 text-text-muted" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
