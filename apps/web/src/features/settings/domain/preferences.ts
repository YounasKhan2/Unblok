/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserPreferences } from '../types';

export function createDefaultUserPreferences(userId: string): UserPreferences {
  return {
    userId,
    theme: 'SYSTEM',
    density: 'COMPACT', // Default Unblok 32px density contract
    notifications: {
      mentions: true,
      assignments: true,
      blockerChanges: true,
      cycleUpdates: false,
    },
  };
}

export type ThemeListenerCleanup = () => void;

export interface ThemeSubscriptionOptions {
  windowRef?: Window | any;
  documentRef?: Document | any;
  onThemeResolved?: (isDark: boolean) => void;
}

/**
 * Sets up a reactive theme subscription for the document root.
 * - LIGHT: Immediately strips `.dark` and returns a no-op cleanup.
 * - DARK: Immediately adds `.dark` and returns a no-op cleanup.
 * - SYSTEM: Resolves OS color scheme, updates `.dark`, and subscribes to `(prefers-color-scheme: dark)` changes.
 * Returns a cleanup function that detaches the media query listener.
 */
export function setupThemeSubscription(
  theme: 'LIGHT' | 'DARK' | 'SYSTEM',
  options?: ThemeSubscriptionOptions
): ThemeListenerCleanup {
  const win = options?.windowRef ?? (typeof window !== 'undefined' ? window : undefined);
  const doc = options?.documentRef ?? (typeof document !== 'undefined' ? document : undefined);

  if (!doc || !doc.documentElement) {
    return () => {};
  }

  const root = doc.documentElement;

  if (theme === 'LIGHT') {
    if (root.classList?.remove) {
      root.classList.remove('dark');
    }
    options?.onThemeResolved?.(false);
    return () => {};
  }

  if (theme === 'DARK') {
    if (root.classList?.add) {
      root.classList.add('dark');
    }
    options?.onThemeResolved?.(true);
    return () => {};
  }

  // theme === 'SYSTEM'
  if (!win || typeof win.matchMedia !== 'function') {
    if (root.classList?.remove) {
      root.classList.remove('dark');
    }
    options?.onThemeResolved?.(false);
    return () => {};
  }

  const mediaQuery = win.matchMedia('(prefers-color-scheme: dark)');

  const applyCurrentSystemTheme = (matches: boolean) => {
    if (matches) {
      if (root.classList?.add) {
        root.classList.add('dark');
      }
    } else {
      if (root.classList?.remove) {
        root.classList.remove('dark');
      }
    }
    options?.onThemeResolved?.(matches);
  };

  applyCurrentSystemTheme(Boolean(mediaQuery?.matches));

  if (!mediaQuery) {
    return () => {};
  }

  const listener = (event: MediaQueryListEvent | { matches: boolean }) => {
    applyCurrentSystemTheme(Boolean(event.matches));
  };

  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', listener);
    return () => {
      mediaQuery.removeEventListener('change', listener);
    };
  } else if (typeof (mediaQuery as any).addListener === 'function') {
    (mediaQuery as any).addListener(listener);
    return () => {
      (mediaQuery as any).removeListener(listener);
    };
  }

  return () => {};
}

/**
 * Applies the visual theme contract to the root document.
 */
export function applyThemeToDocument(
  theme: 'LIGHT' | 'DARK' | 'SYSTEM',
  options?: ThemeSubscriptionOptions
): void {
  setupThemeSubscription(theme, options);
}
