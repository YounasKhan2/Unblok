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
  const { teams } = useProject();

  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || '');
  const [teamId, setTeamId] = useState(project.teamId);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    project.name = name.trim();
    project.description = description.trim();
    project.teamId = teamId;

    setToastMessage('Project settings saved successfully.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#fafaf9] p-4 sm:p-6 select-none max-w-2xl">
      {toastMessage && (
        <div className="mb-4 px-3.5 py-2 bg-[#0a1530] text-white text-xs rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-[#1aae39]" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="bg-white border border-[#e5e3df] rounded-lg p-5">
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[#e5e3df]">
          <Settings className="w-4 h-4 text-[#5645d4]" />
          <h2 className="text-sm font-bold text-[#1a1a1a]">Project Configuration</h2>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Project Name */}
          <div>
            <label className="block text-xs font-semibold text-[#1a1a1a] mb-1">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#fafaf9] border border-[#e5e3df] focus:border-[#5645d4] rounded-[6px] focus:outline-none focus:bg-white"
            />
          </div>

          {/* Project Key & Sequence */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1a1a1a] mb-1">
                Project Key
              </label>
              <input
                type="text"
                disabled
                value={project.key}
                className="w-full px-3 py-2 text-xs bg-[#f6f5f4] border border-[#e5e3df] rounded-[6px] text-[#787671] font-mono cursor-not-allowed"
                title="Project key prefixes issue identifiers and cannot be renamed"
              />
              <span className="text-[10px] text-[#a4a097] mt-0.5 block">
                Prefix for all atomic issue IDs (e.g. {project.key}-101)
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1a1a1a] mb-1">
                Current Issue Sequence
              </label>
              <input
                type="text"
                disabled
                value={project.currentSequence}
                className="w-full px-3 py-2 text-xs bg-[#f6f5f4] border border-[#e5e3df] rounded-[6px] text-[#787671] font-mono cursor-not-allowed"
              />
              <span className="text-[10px] text-[#a4a097] mt-0.5 block">
                Next created issue will allocate #{project.currentSequence + 1}
              </span>
            </div>
          </div>

          {/* Owning Team */}
          <div>
            <label className="block text-xs font-semibold text-[#1a1a1a] mb-1">
              Owning Engineering Team
            </label>
            <select
              value={teamId}
              onChange={e => setTeamId(e.target.value)}
              className="w-full px-2.5 py-2 text-xs bg-[#fafaf9] border border-[#e5e3df] rounded-[6px] focus:outline-none focus:border-[#5645d4]"
            >
              {teams.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.key})
                </option>
              ))}
            </select>
            <span className="text-[10px] text-[#787671] mt-0.5 block">
              Cycles and sprint cadences are derived from this owning squad.
            </span>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[#1a1a1a] mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the architectural objectives and mission of this project..."
              className="w-full px-3 py-2 text-xs bg-[#fafaf9] border border-[#e5e3df] focus:border-[#5645d4] rounded-[6px] focus:outline-none focus:bg-white resize-none"
            />
          </div>

          <div className="pt-3 border-t border-[#e5e3df] flex justify-end">
            <Button variant="primary" size="sm" type="submit" icon={<Save className="w-3.5 h-3.5" />}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
