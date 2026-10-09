import React, { useState, useEffect } from 'react';
import { useSettings } from '../../features/settings/context/SettingsContext';
import { SettingsSection } from '../../features/settings/components/SettingsSection';
import { SettingsField } from '../../features/settings/components/SettingsField';
import { SettingsSaveBar } from '../../features/settings/components/SettingsSaveBar';
import { ThemePreference, DensityPreference } from '../../features/settings/types';
import { Sun, Moon, Laptop, Eye, Layers } from 'lucide-react';

export const PreferencesSettingsPage: React.FC = () => {
  const { preferences, updatePreferences, currentUser } = useSettings();

  // Local drafts for personal preferences
  const [theme, setTheme] = useState<ThemePreference>(preferences.theme);
  const [density, setDensity] = useState<DensityPreference>(preferences.density);
  const [mentions, setMentions] = useState(preferences.notifications.mentions);
  const [assignments, setAssignments] = useState(preferences.notifications.assignments);
  const [blockerChanges, setBlockerChanges] = useState(
    preferences.notifications.blockerChanges
  );
  const [cycleUpdates, setCycleUpdates] = useState(preferences.notifications.cycleUpdates);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);

  // Sync draft when preferences change (e.g., user switched)
  useEffect(() => {
    setTheme(preferences.theme);
    setDensity(preferences.density);
    setMentions(preferences.notifications.mentions);
    setAssignments(preferences.notifications.assignments);
    setBlockerChanges(preferences.notifications.blockerChanges);
    setCycleUpdates(preferences.notifications.cycleUpdates);
  }, [preferences]);

  const isDirty =
    theme !== preferences.theme ||
    density !== preferences.density ||
    mentions !== preferences.notifications.mentions ||
    assignments !== preferences.notifications.assignments ||
    blockerChanges !== preferences.notifications.blockerChanges ||
    cycleUpdates !== preferences.notifications.cycleUpdates;

  const handleReset = () => {
    setTheme(preferences.theme);
    setDensity(preferences.density);
    setMentions(preferences.notifications.mentions);
    setAssignments(preferences.notifications.assignments);
    setBlockerChanges(preferences.notifications.blockerChanges);
    setCycleUpdates(preferences.notifications.cycleUpdates);
    setErrorMessage(undefined);
  };

  const handleSave = () => {
    setIsSaving(true);
    setErrorMessage(undefined);
    try {
      updatePreferences({
        theme,
        density,
        notifications: {
          mentions,
          assignments,
          blockerChanges,
          cycleUpdates,
        },
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2">
        <h2 className="text-base font-bold text-text-primary tracking-tight">
          Personal Preferences
        </h2>
        <p className="text-xs text-text-muted mt-0.5">
          Customize your display appearance, layout density, and notification channels for <strong className="font-semibold text-text-primary">{currentUser.name}</strong>.
        </p>
      </div>

      {/* 1. Appearance Section */}
      <SettingsSection
        title="Appearance & Display"
        description="Select your preferred color theme and UI information density."
      >
        {/* Theme Picker */}
        <SettingsField
          label="Interface Theme"
          description="Choose how Unblok appears on your display."
        >
          <div className="grid grid-cols-3 gap-3 max-w-md pt-1">
            <button
              type="button"
              onClick={() => setTheme('SYSTEM')}
              className={`flex flex-col items-center gap-2 p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                theme === 'SYSTEM'
                  ? 'border-accent bg-accent/10 text-accent font-semibold'
                  : 'border-border bg-surface-base text-text-secondary hover:bg-surface-subtle'
              }`}
            >
              <Laptop className="w-5 h-5" />
              <span>System</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('LIGHT')}
              className={`flex flex-col items-center gap-2 p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                theme === 'LIGHT'
                  ? 'border-accent bg-accent/10 text-accent font-semibold'
                  : 'border-border bg-surface-base text-text-secondary hover:bg-surface-subtle'
              }`}
            >
              <Sun className="w-5 h-5" />
              <span>Light</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('DARK')}
              className={`flex flex-col items-center gap-2 p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                theme === 'DARK'
                  ? 'border-accent bg-accent/10 text-accent font-semibold'
                  : 'border-border bg-surface-base text-text-secondary hover:bg-surface-subtle'
              }`}
            >
              <Moon className="w-5 h-5" />
              <span>Dark</span>
            </button>
          </div>
        </SettingsField>

        {/* Density Picker */}
        <SettingsField
          label="Display Density"
          description="Persist your layout density preference. Unblok preserves the frozen 32px execution density contract across active project boards and lists; broader global propagation will follow in future milestones."
        >
          <div className="grid grid-cols-2 gap-3 max-w-md pt-1">
            <button
              type="button"
              onClick={() => setDensity('COMPACT')}
              className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                density === 'COMPACT'
                  ? 'border-accent bg-accent/10 text-accent font-semibold'
                  : 'border-border bg-surface-base text-text-secondary hover:bg-surface-subtle'
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <div className="text-left">
                <div className="font-semibold">Compact (Default)</div>
                <div className="text-[10px] text-text-muted">High density (frozen 32px contract)</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setDensity('COMFORTABLE')}
              className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                density === 'COMFORTABLE'
                  ? 'border-accent bg-accent/10 text-accent font-semibold'
                  : 'border-border bg-surface-base text-text-secondary hover:bg-surface-subtle'
              }`}
            >
              <Eye className="w-4 h-4 shrink-0" />
              <div className="text-left">
                <div className="font-semibold">Comfortable (Preview)</div>
                <div className="text-[10px] text-text-muted">Preview within settings (future global)</div>
              </div>
            </button>
          </div>
        </SettingsField>
      </SettingsSection>

      {/* 2. Notification Preferences Section */}
      <SettingsSection
        title="Personal Notifications"
        description="Choose which signals create personal notifications. Note: Activity history and audit logs remain canonical."
      >
        <div className="space-y-2">
          <SettingsField
            label="Mentions (@Sarah Chen)"
            description="Notify when you are explicitly mentioned in comments or issue descriptions."
            horizontal
          >
            <input
              type="checkbox"
              checked={mentions}
              onChange={e => setMentions(e.target.checked)}
              className="w-4 h-4 rounded border-border text-accent focus:ring-accent cursor-pointer"
            />
          </SettingsField>

          <SettingsField
            label="Issue Assignments"
            description="Notify when an issue is assigned or reassigned to you."
            horizontal
          >
            <input
              type="checkbox"
              checked={assignments}
              onChange={e => setAssignments(e.target.checked)}
              className="w-4 h-4 rounded border-border text-accent focus:ring-accent cursor-pointer"
            />
          </SettingsField>

          <SettingsField
            label="Blocker Changes & Unblocks"
            description="High-priority alerts when an issue blocking you is resolved, or a new blocker is linked."
            horizontal
          >
            <input
              type="checkbox"
              checked={blockerChanges}
              onChange={e => setBlockerChanges(e.target.checked)}
              className="w-4 h-4 rounded border-border text-accent focus:ring-accent cursor-pointer"
            />
          </SettingsField>

          <SettingsField
            label="Cycle Scope & Milestone Updates"
            description="Alerts when cycles start, roll over, or milestone delivery health is calculated."
            horizontal
          >
            <input
              type="checkbox"
              checked={cycleUpdates}
              onChange={e => setCycleUpdates(e.target.checked)}
              className="w-4 h-4 rounded border-border text-accent focus:ring-accent cursor-pointer"
            />
          </SettingsField>
        </div>

        <div className="p-3 bg-surface-subtle rounded-md border border-border text-[11px] text-text-muted space-y-1">
          <p className="font-semibold text-text-primary">Inbox & Activity History Notice:</p>
          <p>
            Notification preferences only configure presentation alerting. The canonical Inbox event log and team activity streams are immutable projections and are never deleted when a preference is toggled.
          </p>
        </div>
      </SettingsSection>

      {/* Save Bar */}
      <SettingsSaveBar
        isDirty={isDirty}
        isSaving={isSaving}
        saveSuccess={saveSuccess}
        errorMessage={errorMessage}
        onSave={handleSave}
        onReset={handleReset}
      />
    </div>
  );
};
