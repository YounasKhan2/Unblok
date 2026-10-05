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
      <div className="flex items-center justify-between pb-1 border-b border-border">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Properties
        </h2>
        {isReadOnly && (
          <span className="text-[10px] font-semibold text-text-muted bg-surface-muted px-1.5 py-0.5 rounded">
            Observer (Read-Only)
          </span>
        )}
      </div>

      {/* Property Grid reuses canonical status, priority, assignee, cycle, milestone & dates */}
      <PropertyGrid issue={issue} isReadOnly={isReadOnly} />

      {/* Owning Project & Team Context Link Card */}
      {project && (
        <div className="p-3 bg-surface-subtle rounded-lg border border-border text-xs space-y-2">
          <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
            Owning Context
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Project</span>
              <Link
                to={`/projects/${project.key}/issues`}
                className="font-medium text-accent hover:underline inline-flex items-center gap-1"
              >
                <span>{project.name}</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {team && (
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Team</span>
                <span className="flex items-center gap-1.5 font-medium text-text-primary">
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
      <div className="px-3 py-2 bg-surface-subtle rounded-lg border border-border text-[11px] text-text-muted flex items-start gap-1.5">
        <Info className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
        <span>
          Story points estimation is explicitly deferred in this phase to prevent domain schema divergence.
        </span>
      </div>
    </aside>
  );
};
