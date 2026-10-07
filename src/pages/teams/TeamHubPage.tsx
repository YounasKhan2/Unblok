/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-14 Team Hub Page
 * Part B: Real Team Hub for /teams/:teamKey with Overview, Issues, Projects, and Planning.
 */

import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Users,
  FolderKanban,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Calendar,
  Layers,
  ArrowRight,
  Plus,
  Search,
  AlertTriangle,
  Tag,
  Circle,
  AlertCircle,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { useSettings } from '../../features/settings/context/SettingsContext';
import { Button } from '../../components/ui/Button';
import { resolveTeam, selectTeamOverview } from '../../features/teams/domain/teamResolution';
import { TeamHubTab } from '../../features/teams/types';
import { PrivateNotFoundPage } from '../placeholder/PrivateNotFoundPage';
import { CreateProjectModal } from '../../features/projects/components/CreateProjectModal';

export const TeamHubPage: React.FC = () => {
  const { teamKey } = useParams<{ teamKey: string }>();
  const navigate = useNavigate();
  const {
    teams,
    projects,
    issues,
    dependencies,
    users,
    cycles,
    milestones,
    currentUser,
    setSelectedIssueId,
  } = useProject();

  let archivedTeamIds = new Set<string>();
  try {
    const settings = useSettings();
    archivedTeamIds = new Set(settings.archivedTeams.map((t) => t.id));
  } catch {
    // Fallback if settings context not mounted
  }

  const [activeTab, setActiveTab] = useState<TeamHubTab>('overview');
  const [issueSearch, setIssueSearch] = useState('');
  const [issueStateFilter, setIssueStateFilter] = useState('ALL');
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);

  const team = useMemo(() => resolveTeam(teams, teamKey), [teams, teamKey]);

  const overview = useMemo(() => {
    if (!team) return null;
    return selectTeamOverview(
      team,
      projects,
      issues,
      dependencies,
      users,
      cycles,
      milestones,
      archivedTeamIds
    );
  }, [team, projects, issues, dependencies, users, cycles, milestones, archivedTeamIds]);

  // If team does not exist in the active workspace -> Private 404
  if (!team || !overview) {
    return <PrivateNotFoundPage />;
  }

  const canCreate = currentUser.role !== 'OBSERVER';

  // Filtered team issues for the Issues tab
  const filteredTeamIssues = overview.activeIssues.filter((i) => {
    if (issueStateFilter !== 'ALL' && i.state !== issueStateFilter) return false;
    if (issueSearch) {
      const q = issueSearch.toLowerCase();
      return (
        i.title.toLowerCase().includes(q) ||
        (i as any).key?.toLowerCase().includes(q) ||
        (i.description || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-canvas select-none">
      {/* 1. Context Header */}
      <div className="border-b border-border bg-surface-base px-6 py-4 shrink-0">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-xs shrink-0"
              style={{ backgroundColor: team.color || '#5645d4' }}
            >
              {team.key.slice(0, 2)}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-bold text-text-primary tracking-tight">
                  {team.name}
                </h1>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-subtle text-text-muted border border-border">
                  {team.key}
                </span>
                {overview.isArchived && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-warning/10 text-warning border border-warning/30">
                    Archived Team
                  </span>
                )}
              </div>

              {team.description && (
                <p className="text-xs text-text-secondary mt-1 max-w-2xl leading-relaxed">
                  {team.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canCreate && !overview.isArchived && (
              <Button
                variant="secondary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setIsCreateProjectOpen(true)}
              >
                Create Project
              </Button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-6 mt-4 border-t border-border/60 pt-2 -mb-2">
          {(['overview', 'issues', 'projects', 'planning'] as TeamHubTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-xs pb-2 font-medium capitalize border-b-2 transition-colors cursor-pointer ${
                activeTab === tab
                  ? 'border-accent text-accent font-semibold'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Tab Content */}
      <div className="flex-1 overflow-y-auto min-h-0 p-6">
        {/* TAB A: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6 max-w-6xl">
            {/* KPI Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl border border-border bg-surface-base shadow-xs">
                <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">
                  Active Issues
                </span>
                <span className="text-xl font-bold text-text-primary mt-1 block">
                  {overview.activeIssues.length}
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-surface-base shadow-xs">
                <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">
                  Blocked Issues
                </span>
                <span className={`text-xl font-bold mt-1 block ${overview.blockedIssues.length > 0 ? 'text-danger' : 'text-text-primary'}`}>
                  {overview.blockedIssues.length}
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-surface-base shadow-xs">
                <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">
                  Owned Projects
                </span>
                <span className="text-xl font-bold text-text-primary mt-1 block">
                  {overview.ownedProjects.length}
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-surface-base shadow-xs">
                <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">
                  Team Members
                </span>
                <span className="text-xl font-bold text-text-primary mt-1 block">
                  {overview.members.length}
                </span>
              </div>
            </div>

            {/* Needs Attention / Blocked Work */}
            <div className="p-4 rounded-xl border border-border bg-surface-base shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                    Needs Attention
                  </h2>
                </div>
                <span className="text-xs text-text-muted">
                  {overview.needsAttentionIssues.length} urgent or blocked
                </span>
              </div>

              {overview.needsAttentionIssues.length === 0 ? (
                <p className="text-xs text-text-muted py-3">
                  No blocked or urgent issues requiring immediate intervention.
                </p>
              ) : (
                <div className="divide-y divide-border/60">
                  {overview.needsAttentionIssues.slice(0, 5).map((iss) => (
                    <div
                      key={iss.id}
                      onClick={() => setSelectedIssueId(iss.id)}
                      className="py-2 flex items-center justify-between gap-3 hover:bg-surface-subtle/50 px-2 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-mono text-[11px] text-text-muted">
                          {(iss as any).key || iss.id}
                        </span>
                        <span className="text-xs font-medium text-text-primary truncate">
                          {iss.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {(iss as any).isBlocked && (
                          <span className="text-[10px] font-semibold text-danger px-1.5 py-0.5 rounded bg-danger/10 border border-danger/20">
                            Blocked
                          </span>
                        )}
                        <span className="text-[10px] uppercase font-semibold text-text-muted px-1.5 py-0.5 rounded bg-surface-subtle">
                          {iss.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Two Column Section: Owned Projects & Planning */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Owned Projects */}
              <div className="p-4 rounded-xl border border-border bg-surface-base shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FolderKanban className="w-4 h-4 text-accent" />
                    <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                      Owned Projects
                    </h2>
                  </div>
                  {canCreate && !overview.isArchived && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsCreateProjectOpen(true)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  )}
                </div>

                {overview.ownedProjects.length === 0 ? (
                  <p className="text-xs text-text-muted py-4">
                    This team does not currently own any projects.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {overview.ownedProjects.map((p) => (
                      <Link
                        key={p.id}
                        to={`/projects/${p.key}`}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-border/70 hover:border-accent/40 hover:bg-surface-subtle/40 transition-colors group"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-text-primary group-hover:text-accent transition-colors truncate">
                              {p.name}
                            </span>
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-subtle text-text-muted border border-border">
                              {p.key}
                            </span>
                          </div>
                          {p.description && (
                            <p className="text-[11px] text-text-muted truncate mt-0.5 max-w-sm">
                              {p.description}
                            </p>
                          )}
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Current Planning */}
              <div className="p-4 rounded-xl border border-border bg-surface-base shadow-xs">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-accent" />
                  <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                    Current Planning
                  </h2>
                </div>

                {overview.activeCycle ? (
                  <div className="p-3 rounded-lg border border-border/80 bg-surface-subtle/40 mb-3">
                    <span className="text-[10px] font-semibold text-accent uppercase tracking-wider block">
                      Active Cycle
                    </span>
                    <span className="text-xs font-bold text-text-primary block mt-0.5">
                      {overview.activeCycle.name}
                    </span>
                    <span className="text-[11px] text-text-muted block mt-0.5">
                      {overview.activeCycle.startDate} → {overview.activeCycle.endDate}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-text-muted py-2">
                    No active cycle assigned to this team.
                  </p>
                )}

                {/* Milestones list */}
                <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 mt-3">
                  Team Milestones
                </h3>
                {overview.milestones.length === 0 ? (
                  <p className="text-xs text-text-muted">No active milestones registered.</p>
                ) : (
                  <div className="space-y-1.5">
                    {overview.milestones.slice(0, 3).map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between text-xs py-1 text-text-secondary"
                      >
                        <span className="truncate">{m.name}</span>
                        <span className="text-[10px] font-mono text-text-muted shrink-0">
                          {m.targetDate}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Team Members */}
            <div className="p-4 rounded-xl border border-border bg-surface-base shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-accent" />
                  <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                    Team Members ({overview.members.length})
                  </h2>
                </div>
              </div>

              {overview.members.length === 0 ? (
                <p className="text-xs text-text-muted py-2">
                  No members are currently assigned to this team.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {overview.members.map((m) => (
                    <div
                      key={m.id}
                      className="p-2.5 rounded-lg border border-border/70 flex items-center gap-2.5 bg-surface-subtle/30"
                    >
                      <div className="w-6 h-6 rounded-full bg-accent/15 text-accent text-xs font-semibold flex items-center justify-center shrink-0">
                        {m.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-text-primary block truncate">
                          {m.name}
                        </span>
                        <span className="text-[10px] text-text-muted block truncate">
                          {m.email}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB B: ISSUES */}
        {activeTab === 'issues' && (
          <div className="space-y-4 max-w-6xl">
            {/* Filter bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  value={issueSearch}
                  onChange={(e) => setIssueSearch(e.target.value)}
                  placeholder="Filter team issues..."
                  className="w-full text-xs pl-8 pr-3 py-1.5 bg-surface-base border border-border rounded-lg text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={issueStateFilter}
                  onChange={(e) => setIssueStateFilter(e.target.value)}
                  className="text-xs bg-surface-base border border-border rounded-lg px-2.5 py-1.5 text-text-primary"
                >
                  <option value="ALL">All states</option>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="DONE">Done</option>
                </select>
              </div>
            </div>

            {/* Issue List */}
            {filteredTeamIssues.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center p-6 border border-dashed border-border rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-text-muted mb-2" />
                <p className="text-xs text-text-muted">No active issues found for this team.</p>
              </div>
            ) : (
              <div className="border border-border rounded-xl overflow-hidden bg-surface-base shadow-xs divide-y divide-border">
                {filteredTeamIssues.map((iss) => (
                  <div
                    key={iss.id}
                    onClick={() => setSelectedIssueId(iss.id)}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-surface-subtle/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-xs text-text-muted shrink-0">
                        {(iss as any).key || iss.id}
                      </span>
                      <span className="text-xs font-semibold text-text-primary truncate">
                        {iss.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {(iss as any).isBlocked && (
                        <span className="text-[10px] font-semibold text-danger px-1.5 py-0.5 rounded bg-danger/10 border border-danger/20">
                          Blocked
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-text-muted px-1.5 py-0.5 rounded bg-surface-subtle">
                        {iss.state}
                      </span>
                      <span className="text-[10px] uppercase font-semibold text-text-muted px-1.5 py-0.5 rounded bg-surface-subtle">
                        {iss.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB C: PROJECTS */}
        {activeTab === 'projects' && (
          <div className="space-y-4 max-w-6xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-text-primary">
                  Owned Projects ({overview.ownedProjects.length})
                </h2>
                <p className="text-xs text-text-muted">
                  Technical projects owned and delivered by {team.name}.
                </p>
              </div>

              {canCreate && !overview.isArchived && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => setIsCreateProjectOpen(true)}
                >
                  Create Project
                </Button>
              )}
            </div>

            {overview.ownedProjects.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center p-6 border border-dashed border-border rounded-xl">
                <FolderKanban className="w-6 h-6 text-text-muted mb-2" />
                <p className="text-xs text-text-muted mb-3">No projects owned by this team yet.</p>
                {canCreate && !overview.isArchived && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Plus className="w-3.5 h-3.5" />}
                    onClick={() => setIsCreateProjectOpen(true)}
                  >
                    Create First Project
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {overview.ownedProjects.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/projects/${p.key}`)}
                    className="p-4 rounded-xl border border-border bg-surface-base hover:border-accent/50 hover:bg-surface-subtle/30 transition-all cursor-pointer group shadow-xs"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors">
                          {p.name}
                        </span>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-subtle text-text-muted border border-border">
                          {p.key}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                    </div>

                    <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                      {p.description || 'No description provided.'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB D: PLANNING */}
        {activeTab === 'planning' && (
          <div className="space-y-6 max-w-6xl">
            <div>
              <h2 className="text-sm font-bold text-text-primary">Team Planning</h2>
              <p className="text-xs text-text-muted">
                Cycles, sprints, and strategic delivery milestones for {team.name}.
              </p>
            </div>

            {/* Cycles */}
            <div className="p-4 rounded-xl border border-border bg-surface-base shadow-xs">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3">
                Cycles
              </h3>
              {overview.cycles.length === 0 ? (
                <p className="text-xs text-text-muted">No cycles registered for this team.</p>
              ) : (
                <div className="space-y-2">
                  {overview.cycles.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 rounded-lg border border-border/80 flex items-center justify-between gap-3 bg-surface-subtle/30"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-text-primary">
                            {c.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-base text-text-muted border border-border font-mono">
                            {c.status}
                          </span>
                        </div>
                        <span className="text-[11px] text-text-muted mt-0.5 block">
                          {c.startDate} → {c.endDate}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Milestones */}
            <div className="p-4 rounded-xl border border-border bg-surface-base shadow-xs">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3">
                Milestones
              </h3>
              {overview.milestones.length === 0 ? (
                <p className="text-xs text-text-muted">No milestones registered for this team.</p>
              ) : (
                <div className="space-y-2">
                  {overview.milestones.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-lg border border-border/80 flex items-center justify-between gap-3 bg-surface-subtle/30"
                    >
                      <div>
                        <span className="text-xs font-semibold text-text-primary block">
                          {m.name}
                        </span>
                        {m.description && (
                          <span className="text-[11px] text-text-muted mt-0.5 block">
                            {m.description}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono text-text-muted shrink-0">
                        {m.targetDate}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        defaultTeamId={team.id}
      />
    </div>
  );
};
