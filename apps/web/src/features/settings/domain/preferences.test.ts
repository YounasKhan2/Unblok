import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createDefaultUserPreferences,
  applyThemeToDocument,
  setupThemeSubscription,
} from './preferences';

describe('UX-08 Personal Preferences & Reactive Theme Domain', () => {
  let classList: Set<string>;
  let mockDocument: any;
  let listeners: Set<(e: any) => void>;
  let mediaQueryMatches: boolean;
  let mockMediaQuery: any;
  let mockWindow: any;

  beforeEach(() => {
    classList = new Set<string>();
    mockDocument = {
      documentElement: {
        classList: {
          add: (cls: string) => classList.add(cls),
          remove: (cls: string) => classList.delete(cls),
          contains: (cls: string) => classList.has(cls),
        },
      },
    };

    listeners = new Set();
    mediaQueryMatches = false;

    mockMediaQuery = {
      get matches() {
        return mediaQueryMatches;
      },
      addEventListener: vi.fn((event: string, handler: (e: any) => void) => {
        if (event === 'change') listeners.add(handler);
      }),
      removeEventListener: vi.fn((event: string, handler: (e: any) => void) => {
        if (event === 'change') listeners.delete(handler);
      }),
    };

    mockWindow = {
      matchMedia: vi.fn((query: string) => {
        if (query === '(prefers-color-scheme: dark)') {
          return mockMediaQuery;
        }
        return { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() };
      }),
    };
  });

  afterEach(() => {
    listeners.clear();
  });

  it('creates clean default preferences for a given user ID', () => {
    const prefs = createDefaultUserPreferences('user-123');
    expect(prefs.userId).toBe('user-123');
    expect(prefs.theme).toBe('SYSTEM');
    expect(prefs.density).toBe('COMPACT');
    expect(prefs.notifications.mentions).toBe(true);
    expect(prefs.notifications.assignments).toBe(true);
    expect(prefs.notifications.blockerChanges).toBe(true);
    expect(prefs.notifications.cycleUpdates).toBe(false);
  });

  it('LIGHT theme: strips .dark immediately and attaches no listeners', () => {
    classList.add('dark');
    const cleanup = setupThemeSubscription('LIGHT', {
      documentRef: mockDocument,
      windowRef: mockWindow,
    });
    expect(classList.has('dark')).toBe(false);
    expect(mockMediaQuery.addEventListener).not.toHaveBeenCalled();
    cleanup();
  });

  it('DARK theme: adds .dark immediately and attaches no listeners', () => {
    const cleanup = setupThemeSubscription('DARK', {
      documentRef: mockDocument,
      windowRef: mockWindow,
    });
    expect(classList.has('dark')).toBe(true);
    expect(mockMediaQuery.addEventListener).not.toHaveBeenCalled();
    cleanup();
  });

  it('SYSTEM initial light: OS is light (matches: false) -> removes .dark', () => {
    classList.add('dark');
    mediaQueryMatches = false;
    const cleanup = setupThemeSubscription('SYSTEM', {
      documentRef: mockDocument,
      windowRef: mockWindow,
    });
    expect(classList.has('dark')).toBe(false);
    expect(mockMediaQuery.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    cleanup();
  });

  it('SYSTEM initial dark: OS is dark (matches: true) -> adds .dark', () => {
    mediaQueryMatches = true;
    const cleanup = setupThemeSubscription('SYSTEM', {
      documentRef: mockDocument,
      windowRef: mockWindow,
    });
    expect(classList.has('dark')).toBe(true);
    expect(mockMediaQuery.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    cleanup();
  });

  it('SYSTEM OS light -> dark: dynamically adds .dark when OS preference changes', () => {
    mediaQueryMatches = false;
    const cleanup = setupThemeSubscription('SYSTEM', {
      documentRef: mockDocument,
      windowRef: mockWindow,
    });
    expect(classList.has('dark')).toBe(false);

    // Simulate OS switching to dark
    mediaQueryMatches = true;
    for (const listener of listeners) {
      listener({ matches: true });
    }
    expect(classList.has('dark')).toBe(true);

    cleanup();
  });

  it('SYSTEM OS dark -> light: dynamically removes .dark when OS preference changes', () => {
    mediaQueryMatches = true;
    const cleanup = setupThemeSubscription('SYSTEM', {
      documentRef: mockDocument,
      windowRef: mockWindow,
    });
    expect(classList.has('dark')).toBe(true);

    // Simulate OS switching to light
    mediaQueryMatches = false;
    for (const listener of listeners) {
      listener({ matches: false });
    }
    expect(classList.has('dark')).toBe(false);

    cleanup();
  });

  it('SYSTEM listener cleanup: properly detaches change listener when cleaned up', () => {
    mediaQueryMatches = true;
    const cleanup = setupThemeSubscription('SYSTEM', {
      documentRef: mockDocument,
      windowRef: mockWindow,
    });
    expect(listeners.size).toBe(1);

    cleanup();
    expect(mockMediaQuery.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    expect(listeners.size).toBe(0);

    // Further OS changes do not mutate document
    for (const listener of listeners) {
      listener({ matches: false });
    }
    expect(classList.has('dark')).toBe(true); // Untouched
  });

  it('SYSTEM -> explicit theme listener cleanup', () => {
    mediaQueryMatches = true;
    let cleanup = setupThemeSubscription('SYSTEM', {
      documentRef: mockDocument,
      windowRef: mockWindow,
    });
    expect(listeners.size).toBe(1);

    // Preference switch to LIGHT: cleanup previous subscription
    cleanup();
    cleanup = setupThemeSubscription('LIGHT', {
      documentRef: mockDocument,
      windowRef: mockWindow,
    });
    expect(listeners.size).toBe(0);
    expect(classList.has('dark')).toBe(false);
  });

  it('current-user preference switch: switching users swaps active theme', () => {
    // User A prefers DARK
    let cleanup = setupThemeSubscription('DARK', {
      documentRef: mockDocument,
      windowRef: mockWindow,
    });
    expect(classList.has('dark')).toBe(true);

    // Switch to User B who prefers LIGHT
    cleanup();
    cleanup = setupThemeSubscription('LIGHT', {
      documentRef: mockDocument,
      windowRef: mockWindow,
    });
    expect(classList.has('dark')).toBe(false);
    cleanup();
  });

  it('handles server-side / node environment gracefully when document is undefined', () => {
    expect(() => applyThemeToDocument('DARK', { documentRef: undefined })).not.toThrow();
  });
});
