import { describe, it, expect, afterEach } from 'vitest';
import { createDefaultUserPreferences, applyThemeToDocument } from './preferences';

describe('UX-08 Personal Preferences Domain', () => {
  afterEach(() => {
    delete (globalThis as any).document;
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

  it('safely applies theme to document root in DOM environment', () => {
    const classList = new Set<string>();
    const mockDocument = {
      documentElement: {
        classList: {
          add: (cls: string) => classList.add(cls),
          remove: (cls: string) => classList.delete(cls),
          contains: (cls: string) => classList.has(cls),
        },
      },
    };
    (globalThis as any).document = mockDocument;

    // Light
    applyThemeToDocument('LIGHT');
    expect(mockDocument.documentElement.classList.contains('dark')).toBe(false);

    // Dark
    applyThemeToDocument('DARK');
    expect(mockDocument.documentElement.classList.contains('dark')).toBe(true);

    // Reset to light
    applyThemeToDocument('LIGHT');
    expect(mockDocument.documentElement.classList.contains('dark')).toBe(false);
  });

  it('handles server-side / node environment gracefully when document is undefined', () => {
    delete (globalThis as any).document;
    expect(() => applyThemeToDocument('DARK')).not.toThrow();
  });
});
