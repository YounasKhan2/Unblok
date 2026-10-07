/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-14 Reusable Create Project Modal Component
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useProject } from '../../../context/ProjectContext';
import { useWorkspace } from '../../workspaces/context/WorkspaceContext';
import { useSettings } from '../../settings/context/SettingsContext';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { validateProjectInput } from '../domain/projectCreation';
import { Project } from '../../../types';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTeamId?: string;
  onCreated?: (project: Project) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  defaultTeamId,
  onCreated,
}) => {
  const navigate = useNavigate();
  const { projects, teams, currentUser, createProject } = useProject();

  let activeWorkspaceId: string | undefined;
  try {
    const ws = useWorkspace();
    activeWorkspaceId = ws.activeWorkspaceId || ws.activeWorkspace?.id;
  } catch {
    // Standalone fallback
  }

  let archivedTeamIds = new Set<string>();
  try {
    const settings = useSettings();
    archivedTeamIds = new Set(settings.archivedTeams.map((t) => t.id));
  } catch {
    // Standalone / test fallback
  }

  const activeTeams = teams.filter((t) => !archivedTeamIds.has(t.id));

  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [teamId, setTeamId] = useState('');
  const [description, setDescription] = useState('');
  const [touched, setTouched] = useState<{ name?: boolean; key?: boolean; teamId?: boolean }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canCreate = currentUser.role !== 'OBSERVER';

  useEffect(() => {
    if (isOpen) {
      setName('');
      setKey('');
      const initialTeam = defaultTeamId || activeTeams[0]?.id || '';
      setTeamId(initialTeam);
      setDescription('');
      setTouched({});
      setSubmitError(null);
    }
  }, [isOpen, defaultTeamId, activeTeams]);

  // Auto-generate project key from name
  const handleNameChange = (val: string) => {
    setName(val);
    if (!touched.key) {
      const suggested = val
        .trim()
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 4)
        .toUpperCase();
      setKey(suggested);
    }
  };

  const validation = validateProjectInput(
    { name, key, teamId, description },
    projects,
    teams,
    activeWorkspaceId || undefined,
    archivedTeamIds
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, key: true, teamId: true });

    if (!canCreate) {
      setSubmitError('Project creation is not permitted for read-only OBSERVER role.');
      return;
    }

    if (!validation.valid) {
      setSubmitError(validation.error || 'Please resolve form errors before submitting.');
      return;
    }

    try {
      const newProj = createProject({
        name: name.trim(),
        key: key.trim().toUpperCase(),
        teamId: teamId.trim(),
        description: description.trim(),
      });

      if (onCreated) {
        onCreated(newProj);
      }
      onClose();
      navigate(`/projects/${newProj.key}`);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to create project.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Project" maxWidth="md">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {!canCreate && (
          <div
            role="alert"
            className="flex items-center gap-2 p-3 text-xs rounded-lg border border-warning/30 bg-warning/10 text-warning"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>You have read-only permissions and cannot create projects.</span>
          </div>
        )}

        {submitError && (
          <div
            role="alert"
            className="flex items-center gap-2 p-3 text-xs rounded-lg border border-danger/30 bg-danger/10 text-danger"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Project Name */}
        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1">
            Project name <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNameChange(e.target.value)}
            onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
            placeholder="e.g. Developer Platform"
            disabled={!canCreate}
            autoFocus
            className="w-full text-xs bg-surface-base border border-border rounded-lg p-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
          />
          {touched.name && validation.errors.name && (
            <p className="mt-1 text-xs text-danger">{validation.errors.name}</p>
          )}
        </div>

        {/* Project Key */}
        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1">
            Project key <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            value={key}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setKey(e.target.value.toUpperCase());
              setTouched((prev) => ({ ...prev, key: true }));
            }}
            onBlur={() => setTouched((prev) => ({ ...prev, key: true }))}
            placeholder="e.g. DEV"
            maxLength={6}
            disabled={!canCreate}
            className="w-full text-xs font-mono bg-surface-base border border-border rounded-lg p-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent uppercase disabled:opacity-50"
          />
          <p className="mt-1 text-[11px] text-text-muted">
            2–6 uppercase characters used as prefix for issue identifiers (e.g. DEV-101).
          </p>
          {touched.key && validation.errors.key && (
            <p className="mt-1 text-xs text-danger">{validation.errors.key}</p>
          )}
        </div>

        {/* Owning Team */}
        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1">
            Owning Team <span className="text-danger">*</span>
          </label>
          <select
            value={teamId}
            onChange={(e) => {
              setTeamId(e.target.value);
              setTouched((prev) => ({ ...prev, teamId: true }));
            }}
            onBlur={() => setTouched((prev) => ({ ...prev, teamId: true }))}
            disabled={!canCreate || activeTeams.length === 0}
            className="w-full text-xs bg-surface-base border border-border rounded-lg p-2.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
          >
            {activeTeams.length === 0 ? (
              <option value="">No active teams available in workspace</option>
            ) : (
              activeTeams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.key})
                </option>
              ))
            )}
          </select>
          {activeTeams.length === 0 && (
            <p className="mt-1 text-xs text-warning">
              You must create a team first before creating a project.
            </p>
          )}
          {touched.teamId && validation.errors.teamId && (
            <p className="mt-1 text-xs text-danger">{validation.errors.teamId}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1">
            Description <span className="text-text-muted font-normal">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What technical systems does this project encompass?"
            disabled={!canCreate}
            rows={3}
            className="w-full text-xs bg-surface-base border border-border rounded-lg p-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent resize-none disabled:opacity-50"
          />
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!canCreate || activeTeams.length === 0 || (Boolean(touched.name) && !validation.valid)}
          >
            Create Project
          </Button>
        </div>
      </form>
    </Modal>
  );
};
