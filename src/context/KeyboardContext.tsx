/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useProject } from './ProjectContext';
import { UserRole } from '../types';

export type KeyboardScope =
  | 'CANVAS'
  | 'DRAWER_NAV'
  | 'DRAWER_EDIT'
  | 'POPOVER'
  | 'MODAL'
  | 'DEPENDENCY_PAGE'
  | 'DEPENDENCY_GRAPH';

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
  onOpenFull?: () => void;
}

export interface DetailKeyHandlers {
  onFocusComment?: () => void;
}

export interface DependencyKeyHandlers {
  onSelectGraphView?: () => void;
  onSelectMatrixView?: () => void;
  onSelectBlockersView?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
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
  | 'DRAWER_OPEN_FULL'
  | 'CREATE_ISSUE'
  | 'TOGGLE_RAIL'
  | 'OPEN_PALETTE'
  | 'OPEN_HELP'
  | 'FOCUS_SEARCH'
  | 'OPEN_STATUS_PICKER'
  | 'OPEN_PRIORITY_PICKER'
  | 'OPEN_ASSIGNEE_PICKER'
  | 'FOCUS_COMMENT_COMPOSER'
  | 'DEPENDENCY_VIEW_GRAPH'
  | 'DEPENDENCY_VIEW_MATRIX'
  | 'DEPENDENCY_VIEW_BLOCKERS'
  | 'GRAPH_ZOOM_IN'
  | 'GRAPH_ZOOM_OUT'
  | 'GRAPH_RESET_ZOOM'
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
  canEdit?: boolean;
  userRole?: UserRole;
}): KeyAction {
  const {
    key,
    metaKey,
    ctrlKey,
    shiftKey,
    isInputFocused,
    scope,
    hasSelection,
    canEdit = true,
    userRole,
  } = params;

  // Determine if editing and mutation shortcuts (S, P, A, M, C) are permitted
  const isEditingPermitted = canEdit && userRole !== 'OBSERVER';

  // 1. Meta shortcuts (Command palette, drawer open full)
  if ((metaKey || ctrlKey) && key.toLowerCase() === 'k') {
    return 'OPEN_PALETTE';
  }

  if ((metaKey || ctrlKey) && key.toLowerCase() === 'o') {
    if (scope === 'DRAWER_NAV' || scope === 'DRAWER_EDIT') {
      return 'DRAWER_OPEN_FULL';
    }
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

  // 8. Issue Property and Detail shortcuts (S, P, A, M) - only for editable roles (ADMIN, MEMBER)
  if (!metaKey && !ctrlKey && isEditingPermitted) {
    const lowerKey = key.toLowerCase();
    if (lowerKey === 's') {
      return 'OPEN_STATUS_PICKER';
    }
    if (lowerKey === 'p') {
      return 'OPEN_PRIORITY_PICKER';
    }
    if (lowerKey === 'a') {
      return 'OPEN_ASSIGNEE_PICKER';
    }
    if (lowerKey === 'm') {
      return 'FOCUS_COMMENT_COMPOSER';
    }
  }

  // 9. Drawer Navigation Scope
  if (scope === 'DRAWER_NAV') {
    if (key === 'j' || key === 'ArrowDown') {
      return 'DRAWER_NEXT';
    }
    if (key === 'k' || key === 'ArrowUp') {
      return 'DRAWER_PREV';
    }
    return 'NONE';
  }

  // 10. Dependency Graph Scope (+/- for zoom, 1/2/3 for views)
  if (scope === 'DEPENDENCY_GRAPH') {
    if (key === '+' || key === '=') {
      return 'GRAPH_ZOOM_IN';
    }
    if (key === '-' || key === '_') {
      return 'GRAPH_ZOOM_OUT';
    }
    if (key === '0') {
      return 'GRAPH_RESET_ZOOM';
    }
    if (key === '1') {
      return 'DEPENDENCY_VIEW_GRAPH';
    }
    if (key === '2') {
      return 'DEPENDENCY_VIEW_MATRIX';
    }
    if (key === '3') {
      return 'DEPENDENCY_VIEW_BLOCKERS';
    }
    return 'NONE';
  }

  // 11. Dependency Page Scope (1/2/3 for views)
  if (scope === 'DEPENDENCY_PAGE') {
    if (key === '1') {
      return 'DEPENDENCY_VIEW_GRAPH';
    }
    if (key === '2') {
      return 'DEPENDENCY_VIEW_MATRIX';
    }
    if (key === '3') {
      return 'DEPENDENCY_VIEW_BLOCKERS';
    }
    return 'NONE';
  }

  // 12. Canvas Scope
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
    if (key.toLowerCase() === 'c' && !metaKey && !ctrlKey && isEditingPermitted) {
      return 'CREATE_ISSUE';
    }
  }

  return 'NONE';
}

interface KeyboardContextType {
  scope: KeyboardScope;
  setScope: (scope: KeyboardScope) => void;
  activePicker: ActivePickerType;
  setActivePicker: (picker: ActivePickerType | ((prev: ActivePickerType) => ActivePickerType)) => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  isHelpModalOpen: boolean;
  setIsHelpModalOpen: (open: boolean) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  registerCanvasHandlers: (handlers: CanvasKeyHandlers | null) => void;
  registerDrawerHandlers: (handlers: DrawerKeyHandlers | null) => void;
  registerDetailHandlers: (handlers: DetailKeyHandlers | null) => void;
  registerDependencyHandlers: (handlers: DependencyKeyHandlers | null) => void;
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
    currentUser,
  } = useProject();

  const [activePicker, setActivePicker] = useState<ActivePickerType>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const canvasHandlersRef = useRef<CanvasKeyHandlers | null>(null);
  const drawerHandlersRef = useRef<DrawerKeyHandlers | null>(null);
  const detailHandlersRef = useRef<DetailKeyHandlers | null>(null);
  const dependencyHandlersRef = useRef<DependencyKeyHandlers | null>(null);

  const registerCanvasHandlers = useCallback((handlers: CanvasKeyHandlers | null) => {
    canvasHandlersRef.current = handlers;
  }, []);

  const registerDrawerHandlers = useCallback((handlers: DrawerKeyHandlers | null) => {
    drawerHandlersRef.current = handlers;
  }, []);

  const registerDetailHandlers = useCallback((handlers: DetailKeyHandlers | null) => {
    detailHandlersRef.current = handlers;
  }, []);

  const [dependencyRegVersion, setDependencyRegVersion] = useState<number>(0);

  const registerDependencyHandlers = useCallback((handlers: DependencyKeyHandlers | null) => {
    dependencyHandlersRef.current = handlers;
    setDependencyRegVersion((v) => v + 1);
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
    } else if (dependencyHandlersRef.current !== null) {
      // If dependency handlers are registered, check if zoom is available (graph scope) or general view navigation
      setScope(dependencyHandlersRef.current.onZoomIn ? 'DEPENDENCY_GRAPH' : 'DEPENDENCY_PAGE');
    } else {
      setScope('CANVAS');
    }
  }, [isCreateModalOpen, isHelpModalOpen, activePicker, isDrawerOpen, dependencyRegVersion]);

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
      } else if (dependencyHandlersRef.current !== null) {
        currentScope = dependencyHandlersRef.current.onZoomIn ? 'DEPENDENCY_GRAPH' : 'DEPENDENCY_PAGE';
      }

      const action = evaluateKeyAction({
        key: e.key,
        metaKey: e.metaKey,
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey,
        isInputFocused,
        scope: currentScope,
        hasSelection: selectedIssueIds.length > 0,
        canEdit: currentUser.role !== 'OBSERVER',
        userRole: currentUser.role,
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

        case 'DRAWER_OPEN_FULL':
          e.preventDefault();
          drawerHandlersRef.current?.onOpenFull?.();
          break;

        case 'OPEN_STATUS_PICKER':
          e.preventDefault();
          setActivePicker(prev => (prev === 'STATUS' ? null : 'STATUS'));
          break;

        case 'OPEN_PRIORITY_PICKER':
          e.preventDefault();
          setActivePicker(prev => (prev === 'PRIORITY' ? null : 'PRIORITY'));
          break;

        case 'OPEN_ASSIGNEE_PICKER':
          e.preventDefault();
          setActivePicker(prev => (prev === 'ASSIGNEE' ? null : 'ASSIGNEE'));
          break;

        case 'FOCUS_COMMENT_COMPOSER':
          e.preventDefault();
          detailHandlersRef.current?.onFocusComment?.();
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

        case 'DEPENDENCY_VIEW_GRAPH':
          e.preventDefault();
          dependencyHandlersRef.current?.onSelectGraphView?.();
          break;

        case 'DEPENDENCY_VIEW_MATRIX':
          e.preventDefault();
          dependencyHandlersRef.current?.onSelectMatrixView?.();
          break;

        case 'DEPENDENCY_VIEW_BLOCKERS':
          e.preventDefault();
          dependencyHandlersRef.current?.onSelectBlockersView?.();
          break;

        case 'GRAPH_ZOOM_IN':
          e.preventDefault();
          dependencyHandlersRef.current?.onZoomIn?.();
          break;

        case 'GRAPH_ZOOM_OUT':
          e.preventDefault();
          dependencyHandlersRef.current?.onZoomOut?.();
          break;

        case 'GRAPH_RESET_ZOOM':
          e.preventDefault();
          dependencyHandlersRef.current?.onResetZoom?.();
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
      currentUser.role,
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
        registerDetailHandlers,
        registerDependencyHandlers,
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
