import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useProject } from './ProjectContext';

export type KeyboardScope = 'CANVAS' | 'DRAWER_NAV' | 'DRAWER_EDIT' | 'POPOVER' | 'MODAL';

export type ActivePickerType = 'STATUS' | 'PRIORITY' | 'ASSIGNEE' | 'BLOCKER' | null;

interface KeyboardContextType {
  scope: KeyboardScope;
  setScope: (scope: KeyboardScope) => void;
  activePicker: ActivePickerType;
  setActivePicker: (picker: ActivePickerType) => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  isHelpModalOpen: boolean;
  setIsHelpModalOpen: (open: boolean) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

const KeyboardContext = createContext<KeyboardContextType | undefined>(undefined);

export const KeyboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    selectedIssueId,
    selectedIssueIds,
    toggleSelectIssue,
    selectAllIssues,
    clearSelection,
    isDrawerOpen,
    setIsDrawerOpen,
    navigateIssue,
    viewMode,
    setViewMode,
    isNavCollapsed,
    setIsNavCollapsed,
    setSelectedIssueId,
  } = useProject();

  const [scope, setScope] = useState<KeyboardScope>('CANVAS');
  const [activePicker, setActivePicker] = useState<ActivePickerType>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Determine current active scope
  useEffect(() => {
    if (isCreateModalOpen || isHelpModalOpen) {
      setScope('MODAL');
    } else if (activePicker !== null) {
      setScope('POPOVER');
    } else if (isDrawerOpen) {
      setScope('DRAWER_NAV');
    } else {
      setScope('CANVAS');
    }
  }, [isCreateModalOpen, isHelpModalOpen, activePicker, isDrawerOpen]);

  const handleGlobalKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputFocused =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl?.getAttribute('contenteditable') === 'true';

      // Section 25 & 28: ESCAPE HIERARCHY
      if (e.key === 'Escape') {
        if (activePicker !== null) {
          e.preventDefault();
          e.stopPropagation();
          setActivePicker(null);
          return;
        }
        if (isCreateModalOpen) {
          e.preventDefault();
          setIsCreateModalOpen(false);
          return;
        }
        if (isHelpModalOpen) {
          e.preventDefault();
          setIsHelpModalOpen(false);
          return;
        }
        if (isInputFocused) {
          (activeEl as HTMLElement).blur();
          return;
        }
        if (selectedIssueIds.length > 0) {
          e.preventDefault();
          clearSelection();
          return;
        }
        if (isDrawerOpen) {
          e.preventDefault();
          setIsDrawerOpen(false);
          return;
        }
        return;
      }

      // If typing in any input/textarea, suppress single-key shortcuts!
      if (isInputFocused) {
        return;
      }

      // Select All shortcut (Cmd+A / Ctrl+A) when not inside input
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        selectAllIssues();
        return;
      }

      // Toggle current issue multi-select (X shortcut)
      if (e.key.toLowerCase() === 'x' && !e.metaKey && !e.ctrlKey) {
        if (selectedIssueId) {
          e.preventDefault();
          toggleSelectIssue(selectedIssueId);
          return;
        }
      }

      // If a modal or popover is open, don't execute global navigation shortcuts
      if (isCreateModalOpen || isHelpModalOpen) {
        return;
      }

      // Search shortcut ('/')
      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // Help cheatsheet ('?')
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsHelpModalOpen(true);
        return;
      }

      // New Issue shortcut ('c' or 'C')
      if (e.key.toLowerCase() === 'c' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setIsCreateModalOpen(true);
        return;
      }

      // View switcher ('v')
      if (e.key.toLowerCase() === 'v' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setViewMode(viewMode === 'LIST' ? 'BOARD' : viewMode === 'BOARD' ? 'GRAPH' : 'LIST');
        return;
      }

      // Toggle Navigation Rail ('[' or '\')
      if (e.key === '[' || e.key === '\\') {
        e.preventDefault();
        setIsNavCollapsed(!isNavCollapsed);
        return;
      }

      // Navigation shortcuts (J / K / ArrowDown / ArrowUp)
      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        navigateIssue(1);
        return;
      }
      if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        navigateIssue(-1);
        return;
      }

      // Drawer toggle (Enter or Space)
      if (e.key === 'Enter' || e.key === ' ') {
        if (selectedIssueId) {
          e.preventDefault();
          setIsDrawerOpen(!isDrawerOpen);
        }
        return;
      }

      // Issue property shortcuts (operate on selected issue)
      if (selectedIssueId) {
        if (e.key.toLowerCase() === 's') {
          e.preventDefault();
          setActivePicker(activePicker === 'STATUS' ? null : 'STATUS');
          return;
        }
        if (e.key.toLowerCase() === 'p') {
          e.preventDefault();
          setActivePicker(activePicker === 'PRIORITY' ? null : 'PRIORITY');
          return;
        }
        if (e.key.toLowerCase() === 'a') {
          e.preventDefault();
          setActivePicker(activePicker === 'ASSIGNEE' ? null : 'ASSIGNEE');
          return;
        }
        if (e.key.toLowerCase() === 'b') {
          e.preventDefault();
          setActivePicker(activePicker === 'BLOCKER' ? null : 'BLOCKER');
          return;
        }
      }
    },
    [
      activePicker,
      isCreateModalOpen,
      isHelpModalOpen,
      isDrawerOpen,
      selectedIssueId,
      viewMode,
      isNavCollapsed,
      navigateIssue,
      setIsDrawerOpen,
      setViewMode,
      setIsNavCollapsed,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [handleGlobalKeyDown]);

  return (
    <KeyboardContext.Provider
      value={{
        scope,
        setScope,
        activePicker,
        setActivePicker,
        isCreateModalOpen,
        setIsCreateModalOpen,
        isHelpModalOpen,
        setIsHelpModalOpen,
        searchInputRef,
      }}
    >
      {children}
    </KeyboardContext.Provider>
  );
};

export const useKeyboard = (): KeyboardContextType => {
  const context = useContext(KeyboardContext);
  if (!context) {
    throw new Error('useKeyboard must be used within a KeyboardProvider');
  }
  return context;
};
