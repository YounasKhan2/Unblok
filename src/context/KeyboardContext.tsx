/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useProject } from './ProjectContext';

export type KeyboardScope = 'CANVAS' | 'DRAWER_NAV' | 'DRAWER_EDIT' | 'POPOVER' | 'MODAL';

export type ActivePickerType = 'STATUS' | 'PRIORITY' | 'ASSIGNEE' | 'BLOCKER' | null;

export interface CanvasKeyHandlers {
  onNext?: () => void;
  onPrev?: () => void;
  onOpen?: () => void;
  onToggleSelect?: () => void;
}

export interface DrawerKeyHandlers {
  onNext?: () => void;
  onPrev?: () => void;
  onClose?: () => void;
}

export type KeyAction =
  | 'BLUR_INPUT'
  | 'CLOSE_POPOVER'
  | 'CLOSE_MODAL'
  | 'CLOSE_DRAWER'
  | 'CLEAR_SELECTION'
  | 'CANVAS_NEXT'
  | 'CANVAS_PREV'
  | 'CANVAS_OPEN'
  | 'CANVAS_TOGGLE_SELECT'
  | 'DRAWER_NEXT'
  | 'DRAWER_PREV'
  | 'CREATE_ISSUE'
  | 'TOGGLE_RAIL'
  | 'OPEN_PALETTE'
  | 'OPEN_HELP'
  | 'FOCUS_SEARCH'
  | 'NONE';

/**
 * Pure evaluator for keyboard actions enforcing the frozen Esc hierarchy and scope boundaries:
 *
 * Scope Hierarchy:
 *   1. MODAL / POPOVER: captures Esc to close; blocks all canvas/drawer single-key commands.
 *   2. DRAWER_EDIT: typing in input suppresses shortcuts; Esc exits editing before closing drawer.
 *   3. DRAWER_NAV: J/K navigates adjacent drawer issues; Esc closes drawer; does NOT move canvas focus.
 *   4. CANVAS: J/K navigates list; Enter/Space opens; X toggles selection; C creates issue; [ / ] toggles rail.
 *
 * Escape Hierarchy:
 *   popover → modal → editing state (blur) → drawer → selection clear
 */
export function evaluateKeyAction(params: {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  isInputFocused: boolean;
  scope: KeyboardScope;
  hasSelection: boolean;
}): KeyAction {
  const { key, metaKey, ctrlKey, shiftKey, isInputFocused, scope, hasSelection } = params;

  // 1. Meta shortcuts (Command palette, etc.)
  if ((metaKey || ctrlKey) && key.toLowerCase() === 'k') {
    return 'OPEN_PALETTE';
  }

  // 2. Escape Hierarchy
  if (key === 'Escape') {
    if (scope === 'POPOVER') {
      return 'CLOSE_POPOVER';
    }
    if (scope === 'MODAL') {
      return 'CLOSE_MODAL';
    }
    if (isInputFocused) {
      return 'BLUR_INPUT';
    }
    if (scope === 'DRAWER_NAV' || scope === 'DRAWER_EDIT') {
      return 'CLOSE_DRAWER';
    }
    if (hasSelection) {
      return 'CLEAR_SELECTION';
    }
    return 'NONE';
  }

  // 3. Typing in any text input/textarea suppresses single-key shortcuts
  if (isInputFocused) {
    return 'NONE';
  }

  // 4. Modals and Popovers suppress all navigation shortcuts
  if (scope === 'MODAL' || scope === 'POPOVER') {
    return 'NONE';
  }

  // 5. Global rail toggle shortcut ('[' or ']')
  if (key === '[' || key === ']') {
    return 'TOGGLE_RAIL';
  }

  // 6. Help Cheatsheet ('?')
  if (key === '?' || (shiftKey && key === '/')) {
    return 'OPEN_HELP';
  }

  // 7. Search Focus ('/')
  if (key === '/') {
    return 'FOCUS_SEARCH';
  }

  // 8. Drawer Navigation Scope
  if (scope === 'DRAWER_NAV') {
    if (key === 'j' || key === 'ArrowDown') {
      return 'DRAWER_NEXT';
    }
    if (key === 'k' || key === 'ArrowUp') {
      return 'DRAWER_PREV';
    }
    return 'NONE';
  }

  // 9. Canvas Scope
  if (scope === 'CANVAS') {
    if (key === 'j' || key === 'ArrowDown') {
      return 'CANVAS_NEXT';
    }
    if (key === 'k' || key === 'ArrowUp') {
      return 'CANVAS_PREV';
    }
    if (key === 'Enter' || key === ' ') {
      return 'CANVAS_OPEN';
    }
    if (key.toLowerCase() === 'x' && !metaKey && !ctrlKey) {
      return 'CANVAS_TOGGLE_SELECT';
    }
    if (key.toLowerCase() === 'c' && !metaKey && !ctrlKey) {
      return 'CREATE_ISSUE';
    }
  }

  return 'NONE';
}

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
  registerCanvasHandlers: (handlers: CanvasKeyHandlers | null) => void;
  registerDrawerHandlers: (handlers: DrawerKeyHandlers | null) => void;
}

const KeyboardContext = createContext<KeyboardContextType | undefined>(undefined);

export const KeyboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    selectedIssueIds,
    clearSelection,
    isDrawerOpen,
    setIsDrawerOpen,
    isNavCollapsed,
    setIsNavCollapsed,
    navigateIssue,
  } = useProject();

  const [activePicker, setActivePicker] = useState<ActivePickerType>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const canvasHandlersRef = useRef<CanvasKeyHandlers | null>(null);
  const drawerHandlersRef = useRef<DrawerKeyHandlers | null>(null);

  const registerCanvasHandlers = useCallback((handlers: CanvasKeyHandlers | null) => {
    canvasHandlersRef.current = handlers;
  }, []);

  const registerDrawerHandlers = useCallback((handlers: DrawerKeyHandlers | null) => {
    drawerHandlersRef.current = handlers;
  }, []);

  // Compute scope dynamically based on active layers and focus
  const [scope, setScope] = useState<KeyboardScope>('CANVAS');

  useEffect(() => {
    if (isCreateModalOpen || isHelpModalOpen) {
      setScope('MODAL');
    } else if (activePicker !== null) {
      setScope('POPOVER');
    } else if (isDrawerOpen || drawerHandlersRef.current !== null) {
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl?.getAttribute('contenteditable') === 'true';
      setScope(isInput ? 'DRAWER_EDIT' : 'DRAWER_NAV');
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

      // Current active scope determination
      let currentScope: KeyboardScope = 'CANVAS';
      if (isCreateModalOpen || isHelpModalOpen) {
        currentScope = 'MODAL';
      } else if (activePicker !== null) {
        currentScope = 'POPOVER';
      } else if (isDrawerOpen || drawerHandlersRef.current !== null) {
        currentScope = isInputFocused ? 'DRAWER_EDIT' : 'DRAWER_NAV';
      }

      const action = evaluateKeyAction({
        key: e.key,
        metaKey: e.metaKey,
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey,
        isInputFocused,
        scope: currentScope,
        hasSelection: selectedIssueIds.length > 0,
      });

      switch (action) {
        case 'OPEN_PALETTE':
          // Command Palette handles its own open via keydown listener
          break;

        case 'CLOSE_POPOVER':
          e.preventDefault();
          e.stopPropagation();
          setActivePicker(null);
          break;

        case 'CLOSE_MODAL':
          e.preventDefault();
          if (isCreateModalOpen) setIsCreateModalOpen(false);
          if (isHelpModalOpen) setIsHelpModalOpen(false);
          break;

        case 'BLUR_INPUT':
          e.preventDefault();
          if (activeEl instanceof HTMLElement) {
            activeEl.blur();
          }
          break;

        case 'CLOSE_DRAWER':
          e.preventDefault();
          if (drawerHandlersRef.current?.onClose) {
            drawerHandlersRef.current.onClose();
          } else {
            setIsDrawerOpen(false);
          }
          break;

        case 'CLEAR_SELECTION':
          e.preventDefault();
          clearSelection();
          break;

        case 'TOGGLE_RAIL':
          e.preventDefault();
          setIsNavCollapsed(!isNavCollapsed);
          break;

        case 'OPEN_HELP':
          e.preventDefault();
          setIsHelpModalOpen(true);
          break;

        case 'FOCUS_SEARCH':
          e.preventDefault();
          searchInputRef.current?.focus();
          break;

        case 'DRAWER_NEXT':
          e.preventDefault();
          drawerHandlersRef.current?.onNext?.();
          break;

        case 'DRAWER_PREV':
          e.preventDefault();
          drawerHandlersRef.current?.onPrev?.();
          break;

        case 'CANVAS_NEXT':
          e.preventDefault();
          if (canvasHandlersRef.current?.onNext) {
            canvasHandlersRef.current.onNext();
          } else {
            navigateIssue(1);
          }
          break;

        case 'CANVAS_PREV':
          e.preventDefault();
          if (canvasHandlersRef.current?.onPrev) {
            canvasHandlersRef.current.onPrev();
          } else {
            navigateIssue(-1);
          }
          break;

        case 'CANVAS_OPEN':
          e.preventDefault();
          if (canvasHandlersRef.current?.onOpen) {
            canvasHandlersRef.current.onOpen();
          } else {
            setIsDrawerOpen(true);
          }
          break;

        case 'CANVAS_TOGGLE_SELECT':
          e.preventDefault();
          canvasHandlersRef.current?.onToggleSelect?.();
          break;

        case 'CREATE_ISSUE':
          e.preventDefault();
          setIsCreateModalOpen(true);
          break;

        case 'NONE':
        default:
          break;
      }
    },
    [
      activePicker,
      isCreateModalOpen,
      isHelpModalOpen,
      isDrawerOpen,
      selectedIssueIds.length,
      isNavCollapsed,
      setIsNavCollapsed,
      setIsDrawerOpen,
      clearSelection,
      navigateIssue,
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
        registerCanvasHandlers,
        registerDrawerHandlers,
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
