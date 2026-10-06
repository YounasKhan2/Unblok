/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkspaceSettings } from '../types';

export const DEFAULT_WORKSPACE_SETTINGS: WorkspaceSettings = {
  id: 'ws_acme_eng',
  name: 'Acme Platform Engineering',
  key: 'ACME',
  description: 'Core platform services, client applications, and site reliability infrastructure.',
  defaultIssuePriority: 'MEDIUM',
  defaultInitialState: 'TODO',
  workflowRules: {
    defaultPriority: 'MEDIUM',
    defaultInitialState: 'TODO',
    autoAssignCycleOnPlanning: true,
  },
};

export interface WorkspaceValidationResult {
  valid: boolean;
  errors: {
    name?: string;
    key?: string;
  };
}

/**
 * Validates workspace profile settings.
 */
export function validateWorkspaceSettings(name: string, key: string): WorkspaceValidationResult {
  const errors: { name?: string; key?: string } = {};

  const trimmedName = name.trim();
  if (!trimmedName) {
    errors.name = 'Workspace name cannot be empty.';
  } else if (trimmedName.length < 2) {
    errors.name = 'Workspace name must be at least 2 characters.';
  } else if (trimmedName.length > 60) {
    errors.name = 'Workspace name cannot exceed 60 characters.';
  }

  const trimmedKey = key.trim().toUpperCase();
  if (!trimmedKey) {
    errors.key = 'Workspace key cannot be empty.';
  } else if (!/^[A-Z0-9]{2,10}$/.test(trimmedKey)) {
    errors.key = 'Workspace key must be 2–10 uppercase alphanumeric characters.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
