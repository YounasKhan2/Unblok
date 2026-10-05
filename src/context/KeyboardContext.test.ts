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
  });
});
