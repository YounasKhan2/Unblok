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

  // Metrics
  const memberCount = users.filter(u => u.teamId === team.id).length;
  const ownedProjects = projects.filter(p => p.teamId === team.id && !(p as any).archivedAt);
  const activeCycle = cycles.find(c => c.teamId === team.id && c.status === 'ACTIVE');
  const leadUser = (team as any).leadId ? users.find(u => u.id === (team as any).leadId) : undefined;

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border transition-colors ${
        isArchived
          ? 'bg-[#f6f5f4]/50 border-[#e5e3df] opacity-70'
          : 'bg-white border-[#e5e3df] hover:border-[#c8c4be]'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-[#f6f5f4] text-[#52504b] border border-[#e5e3df]">
            {team.key}
          </span>
          <h3 className="text-xs font-semibold text-[#1a1a1a] truncate">
            {team.name}
          </h3>
          {isArchived && (
            <span className="text-[10px] bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.2 rounded font-medium">
              ARCHIVED
            </span>
          )}
        </div>
        {team.description && (
          <p className="text-[11px] text-[#787671] mt-1 line-clamp-1">
            {team.description}
          </p>
        )}
        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-[#787671]">
          <span>{memberCount} member{memberCount === 1 ? '' : 's'}</span>
          <span>•</span>
          <span>{ownedProjects.length} owned project{ownedProjects.length === 1 ? '' : 's'}</span>
          {activeCycle && (
            <>
              <span>•</span>
              <span className="text-emerald-700 font-medium">
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
              icon={<Edit2 className="w-3.5 h-3.5 text-[#787671]" />}
              onClick={() => onEdit(team)}
            >
              Edit
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Archive className="w-3.5 h-3.5 text-red-600" />}
              onClick={() => onArchive(team)}
              className="text-red-700 hover:bg-red-50 hover:border-red-200"
            >
              Archive
            </Button>
          </>
        ) : (
          onRestore && (
            <Button
              variant="secondary"
              size="sm"
              icon={<RotateCcw className="w-3.5 h-3.5 text-emerald-600" />}
              onClick={() => onRestore(team)}
              className="text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200"
            >
              Restore
            </Button>
          )
        )}
      </div>
    </div>
  );
};
