/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-14 Teams Directory Page
 * Part A: Real Teams Directory replacing placeholder.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  Plus,
  ArrowRight,
  FolderKanban,
  CheckCircle2,
  Archive,
  Layers,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { useSettings } from '../../features/settings/context/SettingsContext';
import { Button } from '../../components/ui/Button';
import { selectTeamDirectory } from '../../features/teams/domain/teamResolution';
import { TeamStatusFilter } from '../../features/teams/types';
import { CreateTeamModal } from '../../features/teams/components/CreateTeamModal';

export const TeamsDirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { teams, projects, issues, users, currentUser } = useProject();

  let archivedTeamIds = new Set<string>();
  try {
    const settings = useSettings();
    archivedTeamIds = new Set(settings.archivedTeams.map((t) => t.id));
  } catch {
    // Fallback if settings not mounted
  }

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TeamStatusFilter>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const isAdmin = currentUser.role === 'ADMIN';

  const directoryItems = useMemo(
    () =>
      selectTeamDirectory(
        teams,
        projects,
        issues,
        users,
        archivedTeamIds,
        searchQuery,
        statusFilter
      ),
    [teams, projects, issues, users, archivedTeamIds, searchQuery, statusFilter]
  );

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-canvas select-none">
      {/* 1. Header Toolbar */}
      <div className="border-b border-border bg-surface-base px-4 py-2 shrink-0 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-accent" />
            <h1 className="text-sm font-bold text-text-primary tracking-tight">Teams</h1>
            <span className="text-xs text-text-muted">·</span>
            <span className="text-xs text-text-muted">{teams.length} total</span>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Browse teams, their members, and owned projects across this workspace.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin ? (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setIsCreateModalOpen(true)}
              data-testid="create-team-button"
            >
              Create team
            </Button>
          ) : (
            <div
              className="text-xs text-text-muted px-2.5 py-1 bg-surface-subtle border border-border rounded-lg"
              title="Team creation is restricted to workspace Administrators."
            >
              Admin required to create teams
            </div>
          )}
        </div>
      </div>

      {/* 2. Filter & Search Controls */}
      <div className="border-b border-border bg-surface-base/50 px-4 py-2.5 shrink-0 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search teams..."
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-surface-base border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-border p-0.5 bg-surface-base text-xs">
            {(['ALL', 'ACTIVE', 'ARCHIVED'] as TeamStatusFilter[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1 rounded-md font-medium capitalize transition-colors cursor-pointer ${
                  statusFilter === tab
                    ? 'bg-surface-elevated text-text-primary shadow-xs'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {tab.toLowerCase()} teams
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Directory Content */}
      <div className="flex-1 overflow-y-auto min-h-0 p-6">
        {directoryItems.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-8 border border-dashed border-border rounded-xl bg-surface-base/50">
            <Users className="w-8 h-8 text-text-muted mb-3" />
            <h3 className="text-sm font-semibold text-text-primary mb-1">
              {searchQuery ? 'No teams match your search' : 'No teams in this workspace'}
            </h3>
            <p className="text-xs text-text-muted max-w-sm mb-4">
              {searchQuery
                ? 'Try adjusting your search query or status filter.'
                : 'Teams own projects, cycles, and issues. Create your first team to organize work.'}
            </p>
            {isAdmin && !searchQuery && (
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setIsCreateModalOpen(true)}
              >
                Create team
              </Button>
            )}
          </div>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden bg-surface-base shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-subtle/50 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                  <th className="py-2.5 px-4">Team</th>
                  <th className="py-2.5 px-4 hidden md:table-cell">Members</th>
                  <th className="py-2.5 px-4 hidden sm:table-cell">Projects</th>
                  <th className="py-2.5 px-4 hidden sm:table-cell">Active Work</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {directoryItems.map((item) => (
                  <tr
                    key={item.team.id}
                    onClick={() => navigate(`/teams/${item.team.key}`)}
                    className="hover:bg-surface-subtle/60 transition-colors cursor-pointer group"
                    data-testid={`team-row-${item.team.key}`}
                  >
                    {/* Team Identity */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-xs"
                          style={{ backgroundColor: item.team.color || '#5645d4' }}
                        >
                          {item.team.key.slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-text-primary group-hover:text-accent transition-colors truncate">
                              {item.team.name}
                            </span>
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-subtle text-text-muted border border-border">
                              {item.team.key}
                            </span>
                            {item.isArchived && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/10 text-warning border border-warning/30 font-medium">
                                Archived
                              </span>
                            )}
                          </div>
                          {item.team.description && (
                            <p className="text-[11px] text-text-muted truncate max-w-md mt-0.5">
                              {item.team.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Members Count */}
                    <td className="py-3 px-4 hidden md:table-cell text-text-secondary">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-text-muted" />
                        <span>{item.memberCount} members</span>
                      </div>
                    </td>

                    {/* Owned Projects Count */}
                    <td className="py-3 px-4 hidden sm:table-cell text-text-secondary">
                      <div className="flex items-center gap-1.5">
                        <FolderKanban className="w-3.5 h-3.5 text-text-muted" />
                        <span>{item.projectCount} projects</span>
                      </div>
                    </td>

                    {/* Active Work Summary */}
                    <td className="py-3 px-4 hidden sm:table-cell text-text-secondary">
                      <div className="flex items-center gap-2">
                        <span>{item.activeIssueCount} active</span>
                        {item.blockedIssueCount > 0 && (
                          <span className="text-[10px] font-semibold text-danger px-1.5 py-0.5 rounded bg-danger/10 border border-danger/20">
                            {item.blockedIssueCount} blocked
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Navigation Action */}
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent group-hover:translate-x-0.5 transition-transform">
                        <span>View Hub</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Team Modal */}
      <CreateTeamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={(team) => {
          navigate(`/teams/${team.key}`);
        }}
      />
    </div>
  );
};
