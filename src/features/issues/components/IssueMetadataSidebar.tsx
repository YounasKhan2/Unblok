/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Info } from 'lucide-react';
import { Issue, Project, Team } from '../../../types';
import { PropertyGrid } from '../../../components/drawer/PropertyGrid';

interface IssueMetadataSidebarProps {
  issue: Issue;
  project?: Project;
  team?: Team;
  isReadOnly?: boolean;
}

export const IssueMetadataSidebar: React.FC<IssueMetadataSidebarProps> = ({
  issue,
  project,
  team,
  isReadOnly = false,
}) => {
  return (
    <aside className="space-y-4" aria-label="Issue Properties and Metadata">
      <div className="flex items-center justify-between pb-1 border-b border-[#e5e3df]">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#787671]">
          Properties
        </h2>
        {isReadOnly && (
          <span className="text-[10px] font-semibold text-[#787671] bg-neutral-100 px-1.5 py-0.5 rounded">
            Observer (Read-Only)
          </span>
        )}
      </div>

      {/* Property Grid reuses canonical status, priority, assignee, cycle, milestone & dates */}
      <PropertyGrid issue={issue} isReadOnly={isReadOnly} />

      {/* Owning Project & Team Context Link Card */}
      {project && (
        <div className="p-3 bg-[#fafaf9] rounded-lg border border-[#e5e3df] text-xs space-y-2">
          <div className="text-[10px] font-semibold text-[#787671] uppercase tracking-wider">
            Owning Context
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[#787671]">Project</span>
              <Link
                to={`/projects/${project.key}/issues`}
                className="font-medium text-[#5645d4] hover:underline inline-flex items-center gap-1"
              >
                <span>{project.name}</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {team && (
              <div className="flex items-center justify-between">
                <span className="text-[#787671]">Team</span>
                <span className="flex items-center gap-1.5 font-medium text-[#1a1a1a]">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: team.color }}
                  />
                  <span>{team.name}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Story Points Note (Explicitly deferred as per UX-00 contract) */}
      <div className="px-3 py-2 bg-neutral-50 rounded-lg border border-[#e5e3df] text-[11px] text-[#787671] flex items-start gap-1.5">
        <Info className="w-3.5 h-3.5 text-[#a4a097] shrink-0 mt-0.5" />
        <span>
          Story points estimation is explicitly deferred in this phase to prevent domain schema divergence.
        </span>
      </div>
    </aside>
  );
};
