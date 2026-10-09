import React from 'react';
import { Team, User, Project, Cycle } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Edit2, Archive, RotateCcw } from 'lucide-react';

interface TeamAdminRowProps {
  team: Team;
  users: User[];
  projects: Project[];
  cycles: Cycle[];
  onEdit: (team: Team) => void;
  onArchive: (team: Team) => void;
  onRestore?: (team: Team) => void;
}

export const TeamAdminRow: React.FC<TeamAdminRowProps> = ({
  team,
  users,
  projects,
  cycles,
  onEdit,
  onArchive,
  onRestore,
}) => {
  const isArchived = Boolean((team as any).archivedAt);

  // Metrics with multi-team membership support
  const memberCount = users.filter(u =>
    (u.teamIds || (u.teamId ? [u.teamId] : [])).includes(team.id)
  ).length;
  const ownedProjects = projects.filter(p => p.teamId === team.id && !(p as any).archivedAt);
  const activeCycle = cycles.find(c => c.teamId === team.id && c.status === 'ACTIVE');
  const leadUser = (team as any).leadId ? users.find(u => u.id === (team as any).leadId) : undefined;

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border transition-colors ${
        isArchived
          ? 'bg-surface-subtle/50 border-border opacity-70'
          : 'bg-surface-base border-border hover:border-border-strong'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-surface-muted text-text-secondary border border-border">
            {team.key}
          </span>
          <h3 className="text-xs font-semibold text-text-primary truncate">
            {team.name}
          </h3>
          {isArchived && (
            <span className="text-[10px] bg-danger/10 text-danger border border-danger/30 px-1.5 py-0.5 rounded font-medium">
              ARCHIVED
            </span>
          )}
        </div>
        {team.description && (
          <p className="text-[11px] text-text-muted mt-1 line-clamp-1">
            {team.description}
          </p>
        )}
        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-text-muted">
          <span>{memberCount} member{memberCount === 1 ? '' : 's'}</span>
          <span>•</span>
          <span>{ownedProjects.length} owned project{ownedProjects.length === 1 ? '' : 's'}</span>
          {activeCycle && (
            <>
              <span>•</span>
              <span className="text-success font-medium">
                Cycle: {activeCycle.name}
              </span>
            </>
          )}
          {leadUser && (
            <>
              <span>•</span>
              <span>Lead: {leadUser.name}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {!isArchived ? (
          <>
            <Button
              variant="secondary"
              size="sm"
              icon={<Edit2 className="w-3.5 h-3.5 text-text-muted" />}
              onClick={() => onEdit(team)}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={<Archive className="w-3.5 h-3.5" />}
              onClick={() => onArchive(team)}
            >
              Archive
            </Button>
          </>
        ) : (
          onRestore && (
            <Button
              variant="secondary"
              size="sm"
              icon={<RotateCcw className="w-3.5 h-3.5 text-success" />}
              onClick={() => onRestore(team)}
              className="text-success hover:bg-success/10 hover:border-success/30"
            >
              Restore
            </Button>
          )
        )}
      </div>
    </div>
  );
};
