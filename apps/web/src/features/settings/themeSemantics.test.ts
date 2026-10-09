import { describe, it, expect } from 'vitest';
import { setupThemeSubscription } from './domain/preferences';

describe('UX-09 Complete Application-Wide Theming Invariants', () => {
  it('enforces system theme resolution reacts to OS changes and toggles .dark root class', () => {
    const classList = new Set<string>();
    const mockDocument: any = {
      documentElement: {
        classList: {
          add: (cls: string) => classList.add(cls),
          remove: (cls: string) => classList.delete(cls),
          contains: (cls: string) => classList.has(cls),
        },
      },
    };

    let mediaQueryMatches = false;
    let changeHandler: any = null;
    const mockMediaQuery = {
      get matches() {
        return mediaQueryMatches;
      },
      addEventListener: (_event: string, handler: (e: any) => void) => {
        changeHandler = handler;
      },
      removeEventListener: () => {
        changeHandler = null;
      },
    };

    const mockWindow: any = {
      matchMedia: (query: string) => {
        if (query === '(prefers-color-scheme: dark)') return mockMediaQuery;
        return { matches: false, addEventListener: () => {}, removeEventListener: () => {} };
      },
    };

    // 1. Initial SYSTEM with light OS
    const cleanup = setupThemeSubscription('SYSTEM', {
      documentRef: mockDocument,
      windowRef: mockWindow,
    });
    expect(classList.has('dark')).toBe(false);

    // 2. OS transitions to dark
    mediaQueryMatches = true;
    if (typeof changeHandler === 'function') {
      changeHandler({ matches: true });
    }
    expect(classList.has('dark')).toBe(true);

    // 3. OS transitions back to light
    mediaQueryMatches = false;
    if (typeof changeHandler === 'function') {
      changeHandler({ matches: false });
    }
    expect(classList.has('dark')).toBe(false);

    cleanup();
  });

  it('DARK mode unconditionally sets root .dark class across entire application shell', () => {
    const classList = new Set<string>();
    const mockDocument: any = {
      documentElement: {
        classList: {
          add: (cls: string) => classList.add(cls),
          remove: (cls: string) => classList.delete(cls),
          contains: (cls: string) => classList.has(cls),
        },
      },
    };

    const cleanup = setupThemeSubscription('DARK', {
      documentRef: mockDocument,
    });
    expect(classList.has('dark')).toBe(true);
    cleanup();
  });

  it('LIGHT mode unconditionally removes root .dark class across entire application shell', () => {
    const classList = new Set<string>(['dark']);
    const mockDocument: any = {
      documentElement: {
        classList: {
          add: (cls: string) => classList.add(cls),
          remove: (cls: string) => classList.delete(cls),
          contains: (cls: string) => classList.has(cls),
        },
      },
    };

    const cleanup = setupThemeSubscription('LIGHT', {
      documentRef: mockDocument,
    });
    expect(classList.has('dark')).toBe(false);
    cleanup();
  });
});
