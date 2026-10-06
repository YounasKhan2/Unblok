import React, { useState, useEffect } from 'react';
import { useSettings } from '../../features/settings/context/SettingsContext';
import { SettingsSection } from '../../features/settings/components/SettingsSection';
import { SettingsField } from '../../features/settings/components/SettingsField';
import { SettingsSaveBar } from '../../features/settings/components/SettingsSaveBar';
import { DangerZone } from '../../features/settings/components/DangerZone';
import { IssuePriority, IssueState } from '../../types';

export const WorkspaceSettingsPage: React.FC = () => {
  const { workspace, updateWorkspace } = useSettings();

  const rules = workspace.workflowRules || {
    defaultPriority: workspace.defaultIssuePriority || 'MEDIUM',
    defaultInitialState: workspace.defaultInitialState || 'TODO',
    autoAssignCycleOnPlanning: true,
  };

  // Local draft state
  const [name, setName] = useState(workspace.name);
  const [key, setKey] = useState(workspace.key);
  const [description, setDescription] = useState(workspace.description || '');
  const [defaultPriority, setDefaultPriority] = useState<IssuePriority>(
    rules.defaultPriority
  );
  const [defaultInitialState, setDefaultInitialState] = useState<IssueState>(
    rules.defaultInitialState
  );
  const [autoAssignCycle, setAutoAssignCycle] = useState(
    rules.autoAssignCycleOnPlanning
  );

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);

  // Sync draft when workspace in context changes
  useEffect(() => {
    const currentRules = workspace.workflowRules || {
      defaultPriority: workspace.defaultIssuePriority || 'MEDIUM',
      defaultInitialState: workspace.defaultInitialState || 'TODO',
      autoAssignCycleOnPlanning: true,
    };
    setName(workspace.name);
    setKey(workspace.key);
    setDescription(workspace.description || '');
    setDefaultPriority(currentRules.defaultPriority);
    setDefaultInitialState(currentRules.defaultInitialState);
    setAutoAssignCycle(currentRules.autoAssignCycleOnPlanning);
  }, [workspace]);

  const isDirty =
    name !== workspace.name ||
    key !== workspace.key ||
    description !== (workspace.description || '') ||
    defaultPriority !== rules.defaultPriority ||
    defaultInitialState !== rules.defaultInitialState ||
    autoAssignCycle !== rules.autoAssignCycleOnPlanning;

  const handleReset = () => {
    setName(workspace.name);
    setKey(workspace.key);
    setDescription(workspace.description || '');
    setDefaultPriority(rules.defaultPriority);
    setDefaultInitialState(rules.defaultInitialState);
    setAutoAssignCycle(rules.autoAssignCycleOnPlanning);
    setErrorMessage(undefined);
  };

  const handleSave = () => {
    setIsSaving(true);
    setErrorMessage(undefined);
    try {
      updateWorkspace({
        name: name.trim(),
        key: key.trim().toUpperCase(),
        description: description.trim() || undefined,
        workflowRules: {
          defaultPriority,
          defaultInitialState,
          autoAssignCycleOnPlanning: autoAssignCycle,
        },
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
        <div>
          <h2 className="text-base font-bold text-[#1a1a1a] tracking-tight">
            Workspace Settings
          </h2>
          <p className="text-xs text-[#787671] mt-0.5">
            Configure organization profile, enterprise defaults, and workspace parameters.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#787671] uppercase tracking-wider font-semibold">
            Workspace ID:
          </span>
          <code className="text-xs font-mono bg-[#ede9e4] text-[#37352f] px-2 py-0.5 rounded select-all border border-[#e5e3df]">
            {workspace.id}
          </code>
        </div>
      </div>

      {/* 1. Workspace Profile Section */}
      <SettingsSection
        title="Workspace Profile"
        description="Public identification and branding for this Unblok workspace."
      >
        <SettingsField
          id="ws-name"
          label="Workspace Name"
          description="The human-readable title for your organization."
          required
        >
          <input
            id="ws-name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-[#e5e3df] rounded-md focus:outline-none focus:ring-1 focus:ring-[#5645d4]"
          />
        </SettingsField>

        <SettingsField
          id="ws-key"
          label="Workspace Key"
          description="Global prefix used for system references and workspace routing."
          required
        >
          <input
            id="ws-key"
            type="text"
            value={key}
            maxLength={8}
            onChange={e => setKey(e.target.value.toUpperCase())}
            className="w-full px-3 py-1.5 text-xs font-mono uppercase border border-[#e5e3df] rounded-md focus:outline-none focus:ring-1 focus:ring-[#5645d4]"
          />
        </SettingsField>

        <SettingsField
          id="ws-desc"
          label="Description"
          description="Optional workspace mission statement or departmental summary."
        >
          <textarea
            id="ws-desc"
            rows={2}
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-[#e5e3df] rounded-md focus:outline-none focus:ring-1 focus:ring-[#5645d4]"
          />
        </SettingsField>
      </SettingsSection>

      {/* 2. Default Workflow Rules */}
      <SettingsSection
        title="Default Workflow Rules"
        description="Default attributes applied when creating new issues or planning cycles. Frozen core invariants remain strictly enforced."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SettingsField
            id="default-priority"
            label="Default Issue Priority"
            description="Assigned when new issues are filed without an explicit priority."
          >
            <select
              id="default-priority"
              value={defaultPriority}
              onChange={e => setDefaultPriority(e.target.value as IssuePriority)}
              className="w-full px-3 py-1.5 text-xs border border-[#e5e3df] rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#5645d4]"
            >
              <option value="LOW">LOW — Low priority</option>
              <option value="MEDIUM">MEDIUM — Normal priority</option>
              <option value="HIGH">HIGH — High priority</option>
              <option value="URGENT">URGENT — Urgent priority</option>
            </select>
          </SettingsField>

          <SettingsField
            id="default-state"
            label="Default Initial Issue State"
            description="Initial lifecycle column for newly ingested work."
          >
            <select
              id="default-state"
              value={defaultInitialState}
              onChange={e => setDefaultInitialState(e.target.value as IssueState)}
              className="w-full px-3 py-1.5 text-xs border border-[#e5e3df] rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#5645d4]"
            >
              <option value="BACKLOG">BACKLOG — Product backlog</option>
              <option value="TODO">TODO — Ready for sprint / cycle</option>
            </select>
          </SettingsField>
        </div>

        <SettingsField
          id="auto-assign-cycle"
          label="Cycle Planning Assignment"
          description="Automatically associate planned issues with the team's active cycle."
          horizontal
        >
          <input
            id="auto-assign-cycle"
            type="checkbox"
            checked={autoAssignCycle}
            onChange={e => setAutoAssignCycle(e.target.checked)}
            className="w-4 h-4 rounded border-[#e5e3df] text-[#5645d4] focus:ring-[#5645d4] cursor-pointer"
          />
        </SettingsField>

        <div className="p-3 bg-[#fafaf9] rounded-md border border-[#e5e3df] text-[11px] text-[#787671] space-y-1">
          <p className="font-semibold text-[#1a1a1a]">Canonical Invariants Notice:</p>
          <p>
            The canonical six-state lifecycle (BACKLOG → TODO → IN_PROGRESS → IN_REVIEW → DONE / CANCELED),
            completion dependency guards, and cycle rollups are permanent enterprise invariants and cannot be altered.
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

      {/* 3. Danger Zone */}
      <DangerZone workspaceName={workspace.name} workspaceKey={workspace.key} />
    </div>
  );
};
