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

/**
 * Applies the visual theme contract to the root document.
 */
export function applyThemeToDocument(theme: 'LIGHT' | 'DARK' | 'SYSTEM'): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const isDark =
    theme === 'DARK' ||
    (theme === 'SYSTEM' &&
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-color-scheme: dark)').matches);

  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}
