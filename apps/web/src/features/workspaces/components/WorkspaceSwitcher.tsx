/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-13 Workspace Switcher Component
 * Section 8, 9, 32, 49: Accessible workspace switcher popover in shell header.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import {
  Building2,
  ChevronDown,
  Check,
  Plus,
  Shield,
  User,
  Eye,
  Archive,
} from 'lucide-react';
import { WorkspaceRole } from '../types';

export const WorkspaceSwitcher: React.FC = () => {
  const {
    workspaces,
    memberships,
    activeWorkspace,
    activeWorkspaceId,
    switchWorkspace,
  } = useWorkspace();

  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Combine workspace entities with current user's membership
  const availableWorkspaces = memberships
    .map((m) => {
      const ws = workspaces.find((w) => w.id === m.workspaceId);
      if (!ws) return null;
      return {
        workspace: ws,
        membership: m,
      };
    })
    .filter(Boolean) as Array<{
    workspace: (typeof workspaces)[0];
    membership: (typeof memberships)[0];
  }>;

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setFocusedIndex(-1);
    triggerRef.current?.focus();
  }, []);

  const handleSelectWorkspace = useCallback(
    async (workspaceId: string) => {
      if (workspaceId === activeWorkspaceId) {
        closeMenu();
        return;
      }

      const success = await switchWorkspace(workspaceId);
      if (success) {
        closeMenu();
        // Section 32: Deterministic safe destination on workspace switch
        navigate('/my-work');
      }
    },
    [activeWorkspaceId, switchWorkspace, closeMenu, navigate]
  );

  const handleCreateWorkspace = useCallback(() => {
    closeMenu();
    // Section 29: Create workspace from existing product
    navigate('/onboarding/workspace?mode=create');
  }, [closeMenu, navigate]);

  // Click outside listener
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
        setFocusedIndex(0);
      }
      return;
    }

    const totalItems = availableWorkspaces.length + 1; // +1 for "Create workspace"

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        closeMenu();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % totalItems);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + totalItems) % totalItems);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < availableWorkspaces.length) {
          handleSelectWorkspace(availableWorkspaces[focusedIndex].workspace.id);
        } else if (focusedIndex === availableWorkspaces.length) {
          handleCreateWorkspace();
        }
        break;
      case 'Tab':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  const getRoleBadge = (role: WorkspaceRole) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-200/60 dark:border-indigo-800/60">
            <Shield className="w-2.5 h-2.5" />
            Admin
          </span>
        );
      case 'MEMBER':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/60">
            <User className="w-2.5 h-2.5" />
            Member
          </span>
        );
      case 'OBSERVER':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200/60 dark:border-amber-800/60">
            <Eye className="w-2.5 h-2.5" />
            Observer
          </span>
        );
    }
  };

  return (
    <div className="relative">
      {/* Workspace Switcher Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        data-testid="workspace-switcher-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls="workspace-switcher-menu"
        className="flex items-center gap-1.5 px-2 py-1 rounded-[5px] text-xs font-semibold text-text-primary hover:bg-surface-muted transition-colors cursor-pointer border border-transparent hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        title={`Current Workspace: ${activeWorkspace?.name || 'Select Workspace'}`}
      >
        <span className="w-4 h-4 rounded bg-accent/15 text-accent flex items-center justify-center text-[10px] shrink-0 font-bold">
          {activeWorkspace?.avatar || '🏢'}
        </span>
        <span className="truncate max-w-[140px] sm:max-w-[200px]">
          {activeWorkspace?.name || 'Workspace'}
        </span>
        {activeWorkspace?.status === 'ARCHIVED' && (
          <span className="text-[10px] text-amber-500 font-normal px-1 rounded bg-amber-500/10">
            Archived
          </span>
        )}
        <ChevronDown className="w-3 h-3 text-text-muted shrink-0" />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          ref={menuRef}
          id="workspace-switcher-menu"
          role="menu"
          aria-label="Workspaces"
          className="absolute left-0 top-full mt-1 w-72 bg-surface-base border border-border rounded-lg shadow-xl py-1.5 z-50 text-xs animate-in fade-in-50 zoom-in-95 duration-100"
        >
          {/* Header */}
          <div className="px-3 py-1 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
            Your Workspaces
          </div>

          {/* List of available workspaces */}
          <div className="py-1 max-h-60 overflow-y-auto space-y-0.5">
            {availableWorkspaces.map(({ workspace, membership }, index) => {
              const isActive = workspace.id === activeWorkspaceId;
              const isFocused = focusedIndex === index;
              const isArchived = workspace.status === 'ARCHIVED';

              return (
                <button
                  key={workspace.id}
                  type="button"
                  data-testid={`workspace-option-${workspace.id}`}
                  role="menuitem"
                  onClick={() => handleSelectWorkspace(workspace.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-surface-muted/90 font-medium text-text-primary'
                      : isFocused
                      ? 'bg-surface-muted text-text-primary'
                      : 'text-text-secondary hover:bg-surface-muted/60 hover:text-text-primary'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded bg-surface-subtle border border-border flex items-center justify-center text-xs shrink-0">
                      {workspace.avatar || '🏢'}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-xs flex items-center gap-1.5">
                        <span className="truncate">{workspace.name}</span>
                        {isArchived && (
                          <Archive className="w-3 h-3 text-amber-500 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {getRoleBadge(membership.role)}
                        {membership.status === 'SUSPENDED' && (
                          <span className="text-[10px] text-red-500 bg-red-50 dark:bg-red-950 px-1 rounded">
                            Suspended
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isActive && (
                    <Check className="w-4 h-4 text-accent shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="border-t border-border my-1" />

          {/* Create Workspace Action */}
          <button
            type="button"
            role="menuitem"
            onClick={handleCreateWorkspace}
            className={`w-full flex items-center gap-2 px-3 py-2 text-accent hover:bg-surface-muted transition-colors cursor-pointer font-medium ${
              focusedIndex === availableWorkspaces.length ? 'bg-surface-muted' : ''
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create workspace</span>
          </button>
        </div>
      )}
    </div>
  );
};
