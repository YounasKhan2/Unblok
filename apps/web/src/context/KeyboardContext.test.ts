/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { evaluateKeyAction, KeyboardScope } from './KeyboardContext';

describe('Keyboard Architecture & Scope Hierarchy', () => {
  describe('CANVAS Scope', () => {
    it('dispatches navigation shortcuts when in canvas scope', () => {
      expect(
        evaluateKeyAction({
          key: 'j',
          isInputFocused: false,
          scope: 'CANVAS',
          hasSelection: false,
        })
      ).toBe('CANVAS_NEXT');

      expect(
        evaluateKeyAction({
          key: 'ArrowDown',
          isInputFocused: false,
          scope: 'CANVAS',
          hasSelection: false,
        })
      ).toBe('CANVAS_NEXT');

      expect(
        evaluateKeyAction({
          key: 'k',
          isInputFocused: false,
          scope: 'CANVAS',
          hasSelection: false,
        })
      ).toBe('CANVAS_PREV');

      expect(
        evaluateKeyAction({
          key: 'ArrowUp',
          isInputFocused: false,
          scope: 'CANVAS',
          hasSelection: false,
        })
      ).toBe('CANVAS_PREV');

      expect(
        evaluateKeyAction({
          key: 'Enter',
          isInputFocused: false,
          scope: 'CANVAS',
          hasSelection: false,
        })
      ).toBe('CANVAS_OPEN');

      expect(
        evaluateKeyAction({
          key: ' ',
          isInputFocused: false,
          scope: 'CANVAS',
          hasSelection: false,
        })
      ).toBe('CANVAS_OPEN');

      expect(
        evaluateKeyAction({
          key: 'x',
          isInputFocused: false,
          scope: 'CANVAS',
          hasSelection: false,
        })
      ).toBe('CANVAS_TOGGLE_SELECT');

      expect(
        evaluateKeyAction({
          key: 'c',
          isInputFocused: false,
          scope: 'CANVAS',
          hasSelection: false,
        })
      ).toBe('CREATE_ISSUE');

      expect(
        evaluateKeyAction({
          key: '[',
          isInputFocused: false,
          scope: 'CANVAS',
          hasSelection: false,
        })
      ).toBe('TOGGLE_RAIL');
    });

    it('clears selection on Escape in CANVAS scope when selection exists', () => {
      expect(
        evaluateKeyAction({
          key: 'Escape',
          isInputFocused: false,
          scope: 'CANVAS',
          hasSelection: true,
        })
      ).toBe('CLEAR_SELECTION');
    });
  });

  describe('Input / Editing Suppression', () => {
    it('suppresses single-key shortcuts when typing in an input or textarea', () => {
      const keys = ['j', 'k', 'x', 'c', '[', ']', '/', '?', ' ', 'Enter'];
      for (const key of keys) {
        expect(
          evaluateKeyAction({
            key,
            isInputFocused: true,
            scope: 'CANVAS',
            hasSelection: false,
          })
        ).toBe('NONE');
      }
    });

    it('blurs input on Escape when input is focused before clearing selection', () => {
      expect(
        evaluateKeyAction({
          key: 'Escape',
          isInputFocused: true,
          scope: 'CANVAS',
          hasSelection: true,
        })
      ).toBe('BLUR_INPUT');
    });
  });

  describe('DRAWER_NAV Scope', () => {
    it('dispatches drawer-adjacent navigation instead of canvas navigation', () => {
      expect(
        evaluateKeyAction({
          key: 'j',
          isInputFocused: false,
          scope: 'DRAWER_NAV',
          hasSelection: false,
        })
      ).toBe('DRAWER_NEXT');

      expect(
        evaluateKeyAction({
          key: 'k',
          isInputFocused: false,
          scope: 'DRAWER_NAV',
          hasSelection: false,
        })
      ).toBe('DRAWER_PREV');

      // Crucial requirement: J/K in DRAWER_NAV must NEVER fire CANVAS_NEXT or CANVAS_PREV!
      expect(
        evaluateKeyAction({
          key: 'j',
          isInputFocused: false,
          scope: 'DRAWER_NAV',
          hasSelection: false,
        })
      ).not.toBe('CANVAS_NEXT');
    });

    it('closes drawer on Escape in DRAWER_NAV scope', () => {
      expect(
        evaluateKeyAction({
          key: 'Escape',
          isInputFocused: false,
          scope: 'DRAWER_NAV',
          hasSelection: false,
        })
      ).toBe('CLOSE_DRAWER');
    });
  });

  describe('DRAWER_EDIT Scope', () => {
    it('blurs input first on Escape in DRAWER_EDIT before closing drawer', () => {
      expect(
        evaluateKeyAction({
          key: 'Escape',
          isInputFocused: true,
          scope: 'DRAWER_EDIT',
          hasSelection: false,
        })
      ).toBe('BLUR_INPUT');
    });
  });

  describe('POPOVER & MODAL Scopes', () => {
    it('suppresses underlying navigation shortcuts when POPOVER is active', () => {
      expect(
        evaluateKeyAction({
          key: 'j',
          isInputFocused: false,
          scope: 'POPOVER',
          hasSelection: false,
        })
      ).toBe('NONE');

      expect(
        evaluateKeyAction({
          key: 'c',
          isInputFocused: false,
          scope: 'POPOVER',
          hasSelection: false,
        })
      ).toBe('NONE');
    });

    it('suppresses underlying navigation shortcuts when MODAL is active', () => {
      expect(
        evaluateKeyAction({
          key: 'j',
          isInputFocused: false,
          scope: 'MODAL',
          hasSelection: false,
        })
      ).toBe('NONE');

      expect(
        evaluateKeyAction({
          key: 'k',
          isInputFocused: false,
          scope: 'MODAL',
          hasSelection: false,
        })
      ).toBe('NONE');
    });

    it('respects Esc hierarchy: popover closes before drawer or selection', () => {
      expect(
        evaluateKeyAction({
          key: 'Escape',
          isInputFocused: false,
          scope: 'POPOVER',
          hasSelection: true,
        })
      ).toBe('CLOSE_POPOVER');

      expect(
        evaluateKeyAction({
          key: 'Escape',
          isInputFocused: false,
          scope: 'MODAL',
          hasSelection: true,
        })
      ).toBe('CLOSE_MODAL');
    });
  });

  describe('Global Shell Shortcuts', () => {
    it('opens command palette with Cmd+K or Ctrl+K in any scope', () => {
      expect(
        evaluateKeyAction({
          key: 'k',
          metaKey: true,
          isInputFocused: false,
          scope: 'CANVAS',
          hasSelection: false,
        })
      ).toBe('OPEN_PALETTE');

      expect(
        evaluateKeyAction({
          key: 'k',
          ctrlKey: true,
          isInputFocused: true,
          scope: 'DRAWER_EDIT',
          hasSelection: false,
        })
      ).toBe('OPEN_PALETTE');
    });

    it('opens full issue with Cmd+O or Ctrl+O in drawer scopes', () => {
      expect(
        evaluateKeyAction({
          key: 'o',
          metaKey: true,
          isInputFocused: false,
          scope: 'DRAWER_NAV',
          hasSelection: false,
        })
      ).toBe('DRAWER_OPEN_FULL');

      expect(
        evaluateKeyAction({
          key: 'o',
          ctrlKey: true,
          isInputFocused: false,
          scope: 'DRAWER_EDIT',
          hasSelection: false,
        })
      ).toBe('DRAWER_OPEN_FULL');
    });
  });

  describe('Issue Detail & Property Shortcuts (S, P, A, M)', () => {
    it('dispatches picker and comment shortcuts for MEMBER when not editing', () => {
      expect(
        evaluateKeyAction({
          key: 's',
          isInputFocused: false,
          scope: 'CANVAS',
          hasSelection: false,
          userRole: 'MEMBER',
          canEdit: true,
        })
      ).toBe('OPEN_STATUS_PICKER');

      expect(
        evaluateKeyAction({
          key: 'p',
          isInputFocused: false,
          scope: 'CANVAS',
          hasSelection: false,
          userRole: 'MEMBER',
          canEdit: true,
        })
      ).toBe('OPEN_PRIORITY_PICKER');

      expect(
        evaluateKeyAction({
          key: 'a',
          isInputFocused: false,
          scope: 'CANVAS',
          hasSelection: false,
          userRole: 'MEMBER',
          canEdit: true,
        })
      ).toBe('OPEN_ASSIGNEE_PICKER');

      expect(
        evaluateKeyAction({
          key: 'm',
          isInputFocused: false,
          scope: 'CANVAS',
          hasSelection: false,
          userRole: 'MEMBER',
          canEdit: true,
        })
      ).toBe('FOCUS_COMMENT_COMPOSER');
    });

    it('dispatches picker and comment shortcuts for ADMIN when not editing', () => {
      expect(
        evaluateKeyAction({
          key: 's',
          isInputFocused: false,
          scope: 'CANVAS',
          hasSelection: false,
          userRole: 'ADMIN',
          canEdit: true,
        })
      ).toBe('OPEN_STATUS_PICKER');

      expect(
        evaluateKeyAction({
          key: 'p',
          isInputFocused: false,
          scope: 'CANVAS',
          hasSelection: false,
          userRole: 'ADMIN',
          canEdit: true,
        })
      ).toBe('OPEN_PRIORITY_PICKER');

      expect(
        evaluateKeyAction({
          key: 'a',
          isInputFocused: false,
          scope: 'CANVAS',
          hasSelection: false,
          userRole: 'ADMIN',
          canEdit: true,
        })
      ).toBe('OPEN_ASSIGNEE_PICKER');

      expect(
        evaluateKeyAction({
          key: 'm',
          isInputFocused: false,
          scope: 'CANVAS',
          hasSelection: false,
          userRole: 'ADMIN',
          canEdit: true,
        })
      ).toBe('FOCUS_COMMENT_COMPOSER');
    });

    it('suppresses S, P, A, M for OBSERVER (returns NONE and does not enter pickers/popovers)', () => {
      const observerKeys = ['s', 'S', 'p', 'P', 'a', 'A', 'm', 'M', 'c', 'C'];
      for (const key of observerKeys) {
        expect(
          evaluateKeyAction({
            key,
            isInputFocused: false,
            scope: 'CANVAS',
            hasSelection: false,
            userRole: 'OBSERVER',
            canEdit: false,
          })
        ).toBe('NONE');
      }
    });

    it('preserves read-only navigation shortcuts for OBSERVER', () => {
      // Observer can still navigate list, open drawers, focus search, toggle rails, open palette
      expect(
        evaluateKeyAction({
          key: 'j',
          isInputFocused: false,
          scope: 'CANVAS',
          hasSelection: false,
          userRole: 'OBSERVER',
          canEdit: false,
        })
      ).toBe('CANVAS_NEXT');

      expect(
        evaluateKeyAction({
          key: 'k',
          isInputFocused: false,
          scope: 'CANVAS',
          hasSelection: false,
          userRole: 'OBSERVER',
          canEdit: false,
        })
      ).toBe('CANVAS_PREV');

      expect(
        evaluateKeyAction({
          key: '/',
          isInputFocused: false,
          scope: 'CANVAS',
          hasSelection: false,
          userRole: 'OBSERVER',
          canEdit: false,
        })
      ).toBe('FOCUS_SEARCH');

      expect(
        evaluateKeyAction({
          key: '?',
          isInputFocused: false,
          scope: 'CANVAS',
          hasSelection: false,
          userRole: 'OBSERVER',
          canEdit: false,
        })
      ).toBe('OPEN_HELP');

      expect(
        evaluateKeyAction({
          key: 'o',
          metaKey: true,
          isInputFocused: false,
          scope: 'DRAWER_NAV',
          hasSelection: false,
          userRole: 'OBSERVER',
          canEdit: false,
        })
      ).toBe('DRAWER_OPEN_FULL');
    });

    it('suppresses S, P, A, M shortcuts when typing in inputs', () => {
      const keys = ['s', 'S', 'p', 'P', 'a', 'A', 'm', 'M'];
      for (const key of keys) {
        expect(
          evaluateKeyAction({
            key,
            isInputFocused: true,
            scope: 'CANVAS',
            hasSelection: false,
            userRole: 'MEMBER',
            canEdit: true,
          })
        ).toBe('NONE');
      }
    });

    it('suppresses all navigation, search, help, and action shortcuts when input/select is focused', () => {
      const keys = ['j', 'k', 'c', 'x', '/', '?', '1', '2', '3', '[', ']'];
      for (const key of keys) {
        expect(
          evaluateKeyAction({
            key,
            isInputFocused: true,
            scope: 'CANVAS',
            hasSelection: false,
            userRole: 'ADMIN',
            canEdit: true,
          })
        ).toBe('NONE');
      }
    });

    it('suppresses S, P, A, M shortcuts when in MODAL or POPOVER scope', () => {
      expect(
        evaluateKeyAction({
          key: 's',
          isInputFocused: false,
          scope: 'MODAL',
          hasSelection: false,
          userRole: 'MEMBER',
          canEdit: true,
        })
      ).toBe('NONE');

      expect(
        evaluateKeyAction({
          key: 'p',
          isInputFocused: false,
          scope: 'POPOVER',
          hasSelection: false,
          userRole: 'MEMBER',
          canEdit: true,
        })
      ).toBe('NONE');
    });
  });

  describe('UX-04 Dependency Intelligence Keyboard Architecture', () => {
    describe('View Switching (1, 2, 3)', () => {
      it('dispatches view actions in DEPENDENCY_PAGE scope', () => {
        expect(
          evaluateKeyAction({
            key: '1',
            isInputFocused: false,
            scope: 'DEPENDENCY_PAGE',
            hasSelection: false,
          })
        ).toBe('DEPENDENCY_VIEW_GRAPH');

        expect(
          evaluateKeyAction({
            key: '2',
            isInputFocused: false,
            scope: 'DEPENDENCY_PAGE',
            hasSelection: false,
          })
        ).toBe('DEPENDENCY_VIEW_MATRIX');

        expect(
          evaluateKeyAction({
            key: '3',
            isInputFocused: false,
            scope: 'DEPENDENCY_PAGE',
            hasSelection: false,
          })
        ).toBe('DEPENDENCY_VIEW_BLOCKERS');
      });

      it('dispatches view actions in DEPENDENCY_GRAPH scope', () => {
        expect(
          evaluateKeyAction({
            key: '1',
            isInputFocused: false,
            scope: 'DEPENDENCY_GRAPH',
            hasSelection: false,
          })
        ).toBe('DEPENDENCY_VIEW_GRAPH');

        expect(
          evaluateKeyAction({
            key: '2',
            isInputFocused: false,
            scope: 'DEPENDENCY_GRAPH',
            hasSelection: false,
          })
        ).toBe('DEPENDENCY_VIEW_MATRIX');

        expect(
          evaluateKeyAction({
            key: '3',
            isInputFocused: false,
            scope: 'DEPENDENCY_GRAPH',
            hasSelection: false,
          })
        ).toBe('DEPENDENCY_VIEW_BLOCKERS');
      });

      it('does NOT dispatch dependency view actions in CANVAS or other scopes', () => {
        expect(
          evaluateKeyAction({
            key: '1',
            isInputFocused: false,
            scope: 'CANVAS',
            hasSelection: false,
          })
        ).toBe('NONE');

        expect(
          evaluateKeyAction({
            key: '2',
            isInputFocused: false,
            scope: 'CANVAS',
            hasSelection: false,
          })
        ).toBe('NONE');

        expect(
          evaluateKeyAction({
            key: '3',
            isInputFocused: false,
            scope: 'CANVAS',
            hasSelection: false,
          })
        ).toBe('NONE');
      });
    });

    describe('Graph Zoom Controls (+, -, 0)', () => {
      it('dispatches zoom actions ONLY when DEPENDENCY_GRAPH scope is active', () => {
        expect(
          evaluateKeyAction({
            key: '+',
            isInputFocused: false,
            scope: 'DEPENDENCY_GRAPH',
            hasSelection: false,
          })
        ).toBe('GRAPH_ZOOM_IN');

        expect(
          evaluateKeyAction({
            key: '=',
            isInputFocused: false,
            scope: 'DEPENDENCY_GRAPH',
            hasSelection: false,
          })
        ).toBe('GRAPH_ZOOM_IN');

        expect(
          evaluateKeyAction({
            key: '-',
            isInputFocused: false,
            scope: 'DEPENDENCY_GRAPH',
            hasSelection: false,
          })
        ).toBe('GRAPH_ZOOM_OUT');

        expect(
          evaluateKeyAction({
            key: '_',
            isInputFocused: false,
            scope: 'DEPENDENCY_GRAPH',
            hasSelection: false,
          })
        ).toBe('GRAPH_ZOOM_OUT');

        expect(
          evaluateKeyAction({
            key: '0',
            isInputFocused: false,
            scope: 'DEPENDENCY_GRAPH',
            hasSelection: false,
          })
        ).toBe('GRAPH_RESET_ZOOM');
      });

      it('does NOT dispatch zoom actions in DEPENDENCY_PAGE scope when graph is not active', () => {
        expect(
          evaluateKeyAction({
            key: '+',
            isInputFocused: false,
            scope: 'DEPENDENCY_PAGE',
            hasSelection: false,
          })
        ).toBe('NONE');

        expect(
          evaluateKeyAction({
            key: '-',
            isInputFocused: false,
            scope: 'DEPENDENCY_PAGE',
            hasSelection: false,
          })
        ).toBe('NONE');

        expect(
          evaluateKeyAction({
            key: '0',
            isInputFocused: false,
            scope: 'DEPENDENCY_PAGE',
            hasSelection: false,
          })
        ).toBe('NONE');
      });

      it('does NOT dispatch zoom actions in CANVAS scope', () => {
        expect(
          evaluateKeyAction({
            key: '+',
            isInputFocused: false,
            scope: 'CANVAS',
            hasSelection: false,
          })
        ).toBe('NONE');

        expect(
          evaluateKeyAction({
            key: '-',
            isInputFocused: false,
            scope: 'CANVAS',
            hasSelection: false,
          })
        ).toBe('NONE');
      });
    });

    describe('Input & Scope Suppression', () => {
      it('suppresses 1, 2, 3 and zoom shortcuts when typing in inputs/textareas', () => {
        const depKeys = ['1', '2', '3', '+', '=', '-', '_', '0'];
        for (const key of depKeys) {
          expect(
            evaluateKeyAction({
              key,
              isInputFocused: true,
              scope: 'DEPENDENCY_GRAPH',
              hasSelection: false,
            })
          ).toBe('NONE');
        }
      });

      it('suppresses dependency shortcuts in MODAL and POPOVER scopes', () => {
        const depKeys = ['1', '2', '3', '+', '-', '0'];
        for (const key of depKeys) {
          expect(
            evaluateKeyAction({
              key,
              isInputFocused: false,
              scope: 'MODAL',
              hasSelection: false,
            })
          ).toBe('NONE');

          expect(
            evaluateKeyAction({
              key,
              isInputFocused: false,
              scope: 'POPOVER',
              hasSelection: false,
            })
          ).toBe('NONE');
        }
      });

      it('suppresses dependency shortcuts in DRAWER_EDIT and DRAWER_NAV scopes', () => {
        expect(
          evaluateKeyAction({
            key: '1',
            isInputFocused: false,
            scope: 'DRAWER_NAV',
            hasSelection: false,
          })
        ).toBe('NONE');

        expect(
          evaluateKeyAction({
            key: '+',
            isInputFocused: false,
            scope: 'DRAWER_NAV',
            hasSelection: false,
          })
        ).toBe('NONE');
      });
    });

    describe('Observer Role Navigation', () => {
      it('allows OBSERVER role to switch views and zoom in graph', () => {
        expect(
          evaluateKeyAction({
            key: '1',
            isInputFocused: false,
            scope: 'DEPENDENCY_PAGE',
            hasSelection: false,
            userRole: 'OBSERVER',
            canEdit: false,
          })
        ).toBe('DEPENDENCY_VIEW_GRAPH');

        expect(
          evaluateKeyAction({
            key: '2',
            isInputFocused: false,
            scope: 'DEPENDENCY_PAGE',
            hasSelection: false,
            userRole: 'OBSERVER',
            canEdit: false,
          })
        ).toBe('DEPENDENCY_VIEW_MATRIX');

        expect(
          evaluateKeyAction({
            key: '3',
            isInputFocused: false,
            scope: 'DEPENDENCY_PAGE',
            hasSelection: false,
            userRole: 'OBSERVER',
            canEdit: false,
          })
        ).toBe('DEPENDENCY_VIEW_BLOCKERS');

        expect(
          evaluateKeyAction({
            key: '+',
            isInputFocused: false,
            scope: 'DEPENDENCY_GRAPH',
            hasSelection: false,
            userRole: 'OBSERVER',
            canEdit: false,
          })
        ).toBe('GRAPH_ZOOM_IN');

        expect(
          evaluateKeyAction({
            key: '-',
            isInputFocused: false,
            scope: 'DEPENDENCY_GRAPH',
            hasSelection: false,
            userRole: 'OBSERVER',
            canEdit: false,
          })
        ).toBe('GRAPH_ZOOM_OUT');
      });
    });

    describe('Architecture Guard: No Global Window Listeners in Dependency Production Files', () => {
      it('ensures no dependency page or component registers its own window keydown listener', () => {
        // Read file contents of UX-04 files to ensure no window.addEventListener('keydown' exists
        const fs = require('fs');
        const path = require('path');

        const filesToCheck = [
          path.resolve(__dirname, '../pages/dependencies/DependenciesPage.tsx'),
          path.resolve(__dirname, '../features/dependencies/components/DependencyGraphCanvas.tsx'),
          path.resolve(__dirname, '../features/dependencies/components/DependencyMatrix.tsx'),
          path.resolve(__dirname, '../features/dependencies/components/ActiveBlockerRegistry.tsx'),
          path.resolve(__dirname, '../features/dependencies/components/AddDependencyDialog.tsx'),
          path.resolve(__dirname, '../features/dependencies/components/BottleneckPanel.tsx'),
          path.resolve(__dirname, '../features/dependencies/components/DependencyGraphControls.tsx'),
          path.resolve(__dirname, '../features/dependencies/components/DependencySummaryBar.tsx'),
          path.resolve(__dirname, '../features/dependencies/components/DependencyViewTabs.tsx'),
        ];

        for (const file of filesToCheck) {
          if (fs.existsSync(file)) {
            const content = fs.readFileSync(file, 'utf-8');
            expect(content.includes("window.addEventListener('keydown'")).toBe(false);
            expect(content.includes('window.addEventListener("keydown"')).toBe(false);
          }
        }
      });
    });

    describe('Composed Dependency Handler Ownership & Dispatching', () => {
      // Simulates the centralized dispatcher logic matching KeyboardProvider
      function createKeyboardDispatcher() {
        let dependencyHandlers: any = null;
        let drawerHandlers: any = null;
        let isDrawerOpen = false;
        let isCreateModalOpen = false;
        let isHelpModalOpen = false;
        let activePicker: string | null = null;
        let isInputFocused = false;
        let userRole = 'ADMIN';

        const registerDependencyHandlers = (handlers: any) => {
          dependencyHandlers = handlers;
        };

        const registerDrawerHandlers = (handlers: any) => {
          drawerHandlers = handlers;
        };

        const setDrawerOpen = (open: boolean) => {
          isDrawerOpen = open;
        };

        const setModalOpen = (open: boolean) => {
          isCreateModalOpen = open;
        };

        const setPicker = (picker: string | null) => {
          activePicker = picker;
        };

        const setInputFocused = (focused: boolean) => {
          isInputFocused = focused;
        };

        const dispatchKey = (key: string, metaKey = false, ctrlKey = false) => {
          let scope: KeyboardScope = 'CANVAS';
          if (isCreateModalOpen || isHelpModalOpen) {
            scope = 'MODAL';
          } else if (activePicker !== null) {
            scope = 'POPOVER';
          } else if (isDrawerOpen || drawerHandlers !== null) {
            scope = isInputFocused ? 'DRAWER_EDIT' : 'DRAWER_NAV';
          } else if (dependencyHandlers !== null) {
            scope = dependencyHandlers.onZoomIn ? 'DEPENDENCY_GRAPH' : 'DEPENDENCY_PAGE';
          }

          const action = evaluateKeyAction({
            key,
            metaKey,
            ctrlKey,
            isInputFocused,
            scope,
            hasSelection: false,
            canEdit: userRole !== 'OBSERVER',
            userRole: userRole as any,
          });

          switch (action) {
            case 'DEPENDENCY_VIEW_GRAPH':
              dependencyHandlers?.onSelectGraphView?.();
              break;
            case 'DEPENDENCY_VIEW_MATRIX':
              dependencyHandlers?.onSelectMatrixView?.();
              break;
            case 'DEPENDENCY_VIEW_BLOCKERS':
              dependencyHandlers?.onSelectBlockersView?.();
              break;
            case 'GRAPH_ZOOM_IN':
              dependencyHandlers?.onZoomIn?.();
              break;
            case 'GRAPH_ZOOM_OUT':
              dependencyHandlers?.onZoomOut?.();
              break;
            case 'GRAPH_RESET_ZOOM':
              dependencyHandlers?.onResetZoom?.();
              break;
            default:
              break;
          }

          return action;
        };

        return {
          registerDependencyHandlers,
          registerDrawerHandlers,
          setDrawerOpen,
          setModalOpen,
          setPicker,
          setInputFocused,
          dispatchKey,
          getHandlers: () => dependencyHandlers,
        };
      }

      it('1 & 4. Graph mode simultaneously retains view switching and zoom handlers, invoking graph operations on +, -, and 0', () => {
        const dispatcher = createKeyboardDispatcher();
        const calls: string[] = [];

        // DependenciesPage registers a composed handler when in Graph mode with zoom controls active
        const zoomControls = {
          zoomIn: () => calls.push('zoomIn'),
          zoomOut: () => calls.push('zoomOut'),
          resetZoom: () => calls.push('resetZoom'),
        };

        const viewMode = 'graph';
        dispatcher.registerDependencyHandlers({
          onSelectGraphView: () => calls.push('selectGraph'),
          onSelectMatrixView: () => calls.push('selectMatrix'),
          onSelectBlockersView: () => calls.push('selectBlockers'),
          ...(viewMode === 'graph' && zoomControls
            ? {
                onZoomIn: zoomControls.zoomIn,
                onZoomOut: zoomControls.zoomOut,
                onResetZoom: zoomControls.resetZoom,
              }
            : {}),
        });

        // Test +, -, 0 in Graph mode
        dispatcher.dispatchKey('+');
        dispatcher.dispatchKey('=');
        dispatcher.dispatchKey('-');
        dispatcher.dispatchKey('_');
        dispatcher.dispatchKey('0');

        expect(calls).toEqual(['zoomIn', 'zoomIn', 'zoomOut', 'zoomOut', 'resetZoom']);
      });

      it('2. Pressing 2 while Graph is mounted invokes Matrix switching', () => {
        const dispatcher = createKeyboardDispatcher();
        let switchedTo: string | null = null;

        const zoomControls = {
          zoomIn: () => {},
          zoomOut: () => {},
          resetZoom: () => {},
        };

        dispatcher.registerDependencyHandlers({
          onSelectGraphView: () => { switchedTo = 'graph'; },
          onSelectMatrixView: () => { switchedTo = 'matrix'; },
          onSelectBlockersView: () => { switchedTo = 'blockers'; },
          onZoomIn: zoomControls.zoomIn,
          onZoomOut: zoomControls.zoomOut,
          onResetZoom: zoomControls.resetZoom,
        });

        const action = dispatcher.dispatchKey('2');
        expect(action).toBe('DEPENDENCY_VIEW_MATRIX');
        expect(switchedTo).toBe('matrix');
      });

      it('3. Pressing 3 while Graph is mounted invokes Blockers switching', () => {
        const dispatcher = createKeyboardDispatcher();
        let switchedTo: string | null = null;

        const zoomControls = {
          zoomIn: () => {},
          zoomOut: () => {},
          resetZoom: () => {},
        };

        dispatcher.registerDependencyHandlers({
          onSelectGraphView: () => { switchedTo = 'graph'; },
          onSelectMatrixView: () => { switchedTo = 'matrix'; },
          onSelectBlockersView: () => { switchedTo = 'blockers'; },
          onZoomIn: zoomControls.zoomIn,
          onZoomOut: zoomControls.zoomOut,
          onResetZoom: zoomControls.resetZoom,
        });

        const action = dispatcher.dispatchKey('3');
        expect(action).toBe('DEPENDENCY_VIEW_BLOCKERS');
        expect(switchedTo).toBe('blockers');
      });

      it('5. Switching Graph -> Matrix removes Graph zoom capability without losing 1/2/3', () => {
        const dispatcher = createKeyboardDispatcher();
        const calls: string[] = [];

        // 1. Initially in Graph view
        let viewMode: 'graph' | 'matrix' | 'blockers' = 'graph';
        let zoomControls: { zoomIn: () => void; zoomOut: () => void; resetZoom: () => void } | null = {
          zoomIn: () => calls.push('zoomIn'),
          zoomOut: () => calls.push('zoomOut'),
          resetZoom: () => calls.push('resetZoom'),
        };

        const updateRegistration = () => {
          dispatcher.registerDependencyHandlers({
            onSelectGraphView: () => { calls.push('selectGraph'); viewMode = 'graph'; },
            onSelectMatrixView: () => { calls.push('selectMatrix'); viewMode = 'matrix'; },
            onSelectBlockersView: () => { calls.push('selectBlockers'); viewMode = 'blockers'; },
            ...(viewMode === 'graph' && zoomControls
              ? {
                  onZoomIn: zoomControls.zoomIn,
                  onZoomOut: zoomControls.zoomOut,
                  onResetZoom: zoomControls.resetZoom,
                }
              : {}),
          });
        };

        updateRegistration();

        // Verify zoom works in Graph mode
        dispatcher.dispatchKey('+');
        expect(calls).toEqual(['zoomIn']);

        // 2. Switch to Matrix view: viewMode becomes 'matrix'
        viewMode = 'matrix';
        zoomControls = null; // GraphCanvas unmounts in matrix view
        updateRegistration();

        // Zoom should now return NONE and not invoke any zoom handler
        const zoomAction = dispatcher.dispatchKey('+');
        expect(zoomAction).toBe('NONE');
        const resetAction = dispatcher.dispatchKey('0');
        expect(resetAction).toBe('NONE');

        // View switching 1/2/3 must still be fully retained
        dispatcher.dispatchKey('1');
        dispatcher.dispatchKey('2');
        dispatcher.dispatchKey('3');

        expect(calls).toContain('selectGraph');
        expect(calls).toContain('selectMatrix');
        expect(calls).toContain('selectBlockers');
      });

      it('6. GraphCanvas unmount/cleanup cannot clear the page view handlers', () => {
        const dispatcher = createKeyboardDispatcher();
        const calls: string[] = [];

        // DependenciesPage registers view handlers
        let zoomControls: { zoomIn: () => void; zoomOut: () => void; resetZoom: () => void } | null = {
          zoomIn: () => calls.push('zoomIn'),
          zoomOut: () => calls.push('zoomOut'),
          resetZoom: () => calls.push('resetZoom'),
        };

        const registerComposed = () => {
          dispatcher.registerDependencyHandlers({
            onSelectGraphView: () => calls.push('selectGraph'),
            onSelectMatrixView: () => calls.push('selectMatrix'),
            onSelectBlockersView: () => calls.push('selectBlockers'),
            ...(zoomControls
              ? {
                  onZoomIn: zoomControls.zoomIn,
                  onZoomOut: zoomControls.zoomOut,
                  onResetZoom: zoomControls.resetZoom,
                }
              : {}),
          });
        };

        registerComposed();

        // Simulate GraphCanvas unmounting: it calls onRegisterZoomControls(null)
        zoomControls = null;
        // DependenciesPage re-composes its handlers without zoom
        registerComposed();

        // Crucial test: page handlers (1, 2, 3) must NOT be null!
        expect(dispatcher.getHandlers()).not.toBeNull();
        expect(dispatcher.getHandlers().onSelectGraphView).toBeDefined();

        dispatcher.dispatchKey('2');
        expect(calls).toContain('selectMatrix');
      });

      it('7. Drawer/modal/popover/editing still suppress dependency actions appropriately', () => {
        const dispatcher = createKeyboardDispatcher();
        const calls: string[] = [];

        dispatcher.registerDependencyHandlers({
          onSelectGraphView: () => calls.push('selectGraph'),
          onSelectMatrixView: () => calls.push('selectMatrix'),
          onSelectBlockersView: () => calls.push('selectBlockers'),
          onZoomIn: () => calls.push('zoomIn'),
          onZoomOut: () => calls.push('zoomOut'),
          onResetZoom: () => calls.push('resetZoom'),
        });

        // 7a. Modal open -> suppresses 1, 2, 3, +, -, 0
        dispatcher.setModalOpen(true);
        expect(dispatcher.dispatchKey('1')).toBe('NONE');
        expect(dispatcher.dispatchKey('+')).toBe('NONE');
        dispatcher.setModalOpen(false);

        // 7b. Popover active -> suppresses 1, 2, 3, +, -, 0
        dispatcher.setPicker('STATUS');
        expect(dispatcher.dispatchKey('2')).toBe('NONE');
        expect(dispatcher.dispatchKey('-')).toBe('NONE');
        dispatcher.setPicker(null);

        // 7c. Drawer open -> suppresses dependency actions
        dispatcher.setDrawerOpen(true);
        expect(dispatcher.dispatchKey('3')).toBe('NONE');
        expect(dispatcher.dispatchKey('0')).toBe('NONE');
        dispatcher.setDrawerOpen(false);

        // 7d. Text input focused -> suppresses dependency actions
        dispatcher.setInputFocused(true);
        expect(dispatcher.dispatchKey('1')).toBe('NONE');
        expect(dispatcher.dispatchKey('+')).toBe('NONE');
        dispatcher.setInputFocused(false);

        // When all overlays are closed, actions fire normally
        dispatcher.dispatchKey('1');
        dispatcher.dispatchKey('+');
        expect(calls).toEqual(['selectGraph', 'zoomIn']);
      });
    });
  });
});
