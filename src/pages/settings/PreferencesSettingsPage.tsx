import React, { useState, useEffect } from 'react';
import { useSettings } from '../../features/settings/context/SettingsContext';
import { SettingsSection } from '../../features/settings/components/SettingsSection';
import { SettingsField } from '../../features/settings/components/SettingsField';
import { SettingsSaveBar } from '../../features/settings/components/SettingsSaveBar';
import { ThemePreference, DensityPreference } from '../../features/settings/types';
import { Sun, Moon, Laptop, Bell, Eye, Layers } from 'lucide-react';

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
        <h2 className="text-base font-bold text-[#1a1a1a] tracking-tight">
          Personal Preferences
        </h2>
        <p className="text-xs text-[#787671] mt-0.5">
          Customize your display appearance, layout density, and notification channels for <strong className="font-semibold text-[#1a1a1a]">{currentUser.name}</strong>.
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
                  ? 'border-[#5645d4] bg-purple-50/50 text-[#5645d4] font-semibold'
                  : 'border-[#e5e3df] bg-white text-[#52504b] hover:bg-[#fafaf9]'
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
                  ? 'border-[#5645d4] bg-purple-50/50 text-[#5645d4] font-semibold'
                  : 'border-[#e5e3df] bg-white text-[#52504b] hover:bg-[#fafaf9]'
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
                  ? 'border-[#5645d4] bg-purple-50/50 text-[#5645d4] font-semibold'
                  : 'border-[#e5e3df] bg-white text-[#52504b] hover:bg-[#fafaf9]'
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
          description="Unblok defaults to compact 32px execution density. Comfortable mode offers expanded spacing."
        >
          <div className="grid grid-cols-2 gap-3 max-w-md pt-1">
            <button
              type="button"
              onClick={() => setDensity('COMPACT')}
              className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                density === 'COMPACT'
                  ? 'border-[#5645d4] bg-purple-50/50 text-[#5645d4] font-semibold'
                  : 'border-[#e5e3df] bg-white text-[#52504b] hover:bg-[#fafaf9]'
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <div className="text-left">
                <div className="font-semibold">Compact (Default)</div>
                <div className="text-[10px] text-[#787671]">High density (32px rows)</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setDensity('COMFORTABLE')}
              className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                density === 'COMFORTABLE'
                  ? 'border-[#5645d4] bg-purple-50/50 text-[#5645d4] font-semibold'
                  : 'border-[#e5e3df] bg-white text-[#52504b] hover:bg-[#fafaf9]'
              }`}
            >
              <Eye className="w-4 h-4 shrink-0" />
              <div className="text-left">
                <div className="font-semibold">Comfortable</div>
                <div className="text-[10px] text-[#787671]">Spaced rows (40px rows)</div>
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
              className="w-4 h-4 rounded border-[#e5e3df] text-[#5645d4] focus:ring-[#5645d4] cursor-pointer"
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
              className="w-4 h-4 rounded border-[#e5e3df] text-[#5645d4] focus:ring-[#5645d4] cursor-pointer"
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
              className="w-4 h-4 rounded border-[#e5e3df] text-[#5645d4] focus:ring-[#5645d4] cursor-pointer"
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
              className="w-4 h-4 rounded border-[#e5e3df] text-[#5645d4] focus:ring-[#5645d4] cursor-pointer"
            />
          </SettingsField>
        </div>

        <div className="p-3 bg-[#fafaf9] rounded-md border border-[#e5e3df] text-[11px] text-[#787671] space-y-1">
          <p className="font-semibold text-[#1a1a1a]">Inbox & Activity History Notice:</p>
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
