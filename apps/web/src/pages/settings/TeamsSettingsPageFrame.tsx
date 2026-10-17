import React from 'react';
import {SettingsSection} from '../../features/settings/components/SettingsSection';
import {TeamAdminRow} from '../../features/settings/components/TeamAdminRow';
import {Button} from '../../components/ui/Button';
import {Plus} from 'lucide-react';
import type {Team,User,Project,Cycle} from '../../types';
export function TeamsSettingsPageFrame({activeTeams,archivedTeams,users,projects,cycles,onCreate,onEdit,onArchive,onRestore,live,children}:{children?:React.ReactNode;activeTeams:Team[];archivedTeams:Team[];users:User[];projects:Project[];cycles:Cycle[];onCreate:()=>void;onEdit:(t:Team)=>void;onArchive:(t:Team)=>void;onRestore:(t:Team)=>void;live?:{canCreate:boolean;activeLoaded:boolean;activePagination:React.ReactNode;archivedPagination:React.ReactNode}}){
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div>
          <h2 className="text-base font-bold text-text-primary tracking-tight">
            Team Management
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Configure engineering squads, project ownership domains, and squad assignments.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-3.5 h-3.5" />}
          disabled={!!live&&!live.canCreate}
          onClick={onCreate}
        >
          Create Team
        </Button>
      </div>

      {/* 1. Active Teams Section */}
      <SettingsSection
        title={`Active Teams (${live?'Unavailable':activeTeams.length})`}
        description="Engineering squads actively owning projects, cycles, and issues."
      >
        <div className="space-y-2">
          {activeTeams.length > 0 ? (
            activeTeams.map(team => (
              <TeamAdminRow
                key={team.id}
                team={team} live={live?{status:archivedTeams.includes(team)?'ARCHIVED':'ACTIVE'}:undefined}
                users={users}
                projects={projects}
                cycles={cycles}
                onEdit={onEdit}
                onArchive={onArchive}
              />
            ))
          ) : (
            <div className="text-center py-6 text-xs text-text-muted bg-surface-subtle rounded-lg border border-border">
              {live&&!live.activeLoaded?'Loading active Teams…':'No active teams configured.'}
            </div>
          )}
        </div>
      </SettingsSection>

      {live?.activePagination}
      {/* 2. Archived Teams Section */}
      {(archivedTeams.length > 0 || !!live) && (
        <SettingsSection
          title={`Archived Teams (${live?'Unavailable':archivedTeams.length})`}
          description="Decommissioned teams with zero active project dependencies."
        >
          <div className="space-y-2">
            {archivedTeams.map(team => (
              <TeamAdminRow
                key={team.id}
                team={team} live={live?{status:archivedTeams.includes(team)?'ARCHIVED':'ACTIVE'}:undefined}
                users={users}
                projects={projects}
                cycles={cycles}
                onEdit={onEdit}
                onArchive={onArchive}
                onRestore={onRestore}
              />
            ))}
          </div>
        </SettingsSection>
      )}
      {live?.archivedPagination}
      {children}
    </div>
  );
};
