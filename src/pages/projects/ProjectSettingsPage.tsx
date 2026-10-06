/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Settings, Save, CheckCircle2 } from 'lucide-react';
import { Project, Team } from '../../types';
import { useProject } from '../../context/ProjectContext';
import { Button } from '../../components/ui/Button';

interface OutletContextType {
  project: Project;
  team?: Team;
}

export const ProjectSettingsPage: React.FC = () => {
  const { project, team } = useOutletContext<OutletContextType>();
  const { teams, currentUser } = useProject();
  const isAdmin = currentUser.role === 'ADMIN';

  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || '');
  const [teamId, setTeamId] = useState(project.teamId);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setToastMessage('Only workspace Administrators may update project configuration.');
      return;
    }
    project.name = name.trim();
    project.description = description.trim();
    project.teamId = teamId;

    setToastMessage('Project settings saved successfully.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-surface-subtle p-4 sm:p-6 select-none max-w-2xl">
      {toastMessage && (
        <div className="mb-4 px-3.5 py-2 bg-[#0a1530] text-white text-xs rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-success" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="bg-white border border-border rounded-lg p-5">
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-border">
          <Settings className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-bold text-text-primary">Project Configuration</h2>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {!isAdmin && (
            <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-800 font-medium">
              You have {currentUser.role} role. Only workspace Administrators may update project configuration.
            </div>
          )}

          {/* Project Name */}
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Project Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              required
              disabled={!isAdmin}
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-surface-subtle border border-border focus:border-accent rounded-[6px] focus:outline-none focus:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {/* Project Key & Sequence */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Project Key
              </label>
              <input
                type="text"
                disabled
                value={project.key}
                className="w-full px-3 py-2 text-xs bg-surface-muted border border-border rounded-[6px] text-text-muted font-mono cursor-not-allowed"
                title="Project key prefixes issue identifiers and cannot be renamed"
              />
              <span className="text-[10px] text-[#a4a097] mt-0.5 block">
                Prefix for all atomic issue IDs (e.g. {project.key}-101)
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Current Issue Sequence
              </label>
              <input
                type="text"
                disabled
                value={project.currentSequence}
                className="w-full px-3 py-2 text-xs bg-surface-muted border border-border rounded-[6px] text-text-muted font-mono cursor-not-allowed"
              />
              <span className="text-[10px] text-[#a4a097] mt-0.5 block">
                Next created issue will allocate #{project.currentSequence + 1}
              </span>
            </div>
          </div>

          {/* Owning Team */}
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Owning Engineering Team
            </label>
            <select
              value={teamId}
              disabled={!isAdmin}
              onChange={e => setTeamId(e.target.value)}
              className="w-full px-2.5 py-2 text-xs bg-surface-subtle border border-border rounded-[6px] focus:outline-none focus:border-accent disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {teams.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.key})
                </option>
              ))}
            </select>
            <span className="text-[10px] text-text-muted mt-0.5 block">
              Cycles and sprint cadences are derived from this owning squad.
            </span>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Description
            </label>
            <textarea
              rows={3}
              disabled={!isAdmin}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the architectural objectives and mission of this project..."
              className="w-full px-3 py-2 text-xs bg-surface-subtle border border-border focus:border-accent rounded-[6px] focus:outline-none focus:bg-white resize-none disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          <div className="pt-3 border-t border-border flex justify-end">
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={!isAdmin}
              icon={<Save className="w-3.5 h-3.5" />}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
