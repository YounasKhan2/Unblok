import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { useSettings } from '../../features/settings/context/SettingsContext';
import { SettingsSection } from '../../features/settings/components/SettingsSection';
import { TeamAdminRow } from '../../features/settings/components/TeamAdminRow';
import { CreateTeamModal } from '../../features/settings/components/CreateTeamModal';
import { EditTeamModal } from '../../features/settings/components/EditTeamModal';
import { ArchiveTeamModal } from '../../features/settings/components/ArchiveTeamModal';
import { Button } from '../../components/ui/Button';
import { Plus } from 'lucide-react';
import { Team } from '../../types';

export const TeamsSettingsPage: React.FC = () => {
  const { teams, users, projects, cycles } = useProject();
  const { restoreTeam } = useSettings();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [archivingTeam, setArchivingTeam] = useState<Team | null>(null);

  const activeTeams = teams.filter(t => !(t as any).archivedAt);
  const archivedTeams = teams.filter(t => Boolean((t as any).archivedAt));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div>
          <h2 className="text-base font-bold text-[#1a1a1a] tracking-tight">
            Team Management
          </h2>
          <p className="text-xs text-[#787671] mt-0.5">
            Configure engineering squads, project ownership domains, and squad assignments.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => setIsCreateModalOpen(true)}
        >
          Create Team
        </Button>
      </div>

      {/* 1. Active Teams Section */}
      <SettingsSection
        title={`Active Teams (${activeTeams.length})`}
        description="Engineering squads actively owning projects, cycles, and issues."
      >
        <div className="space-y-2">
          {activeTeams.length > 0 ? (
            activeTeams.map(team => (
              <TeamAdminRow
                key={team.id}
                team={team}
                users={users}
                projects={projects}
                cycles={cycles}
                onEdit={t => setEditingTeam(t)}
                onArchive={t => setArchivingTeam(t)}
              />
            ))
          ) : (
            <div className="text-center py-6 text-xs text-[#787671] bg-[#fafaf9] rounded-lg border border-[#e5e3df]">
              No active teams configured.
            </div>
          )}
        </div>
      </SettingsSection>

      {/* 2. Archived Teams Section */}
      {archivedTeams.length > 0 && (
        <SettingsSection
          title={`Archived Teams (${archivedTeams.length})`}
          description="Decommissioned teams with zero active project dependencies."
        >
          <div className="space-y-2">
            {archivedTeams.map(team => (
              <TeamAdminRow
                key={team.id}
                team={team}
                users={users}
                projects={projects}
                cycles={cycles}
                onEdit={t => setEditingTeam(t)}
                onArchive={t => setArchivingTeam(t)}
                onRestore={t => restoreTeam(t.id)}
              />
            ))}
          </div>
        </SettingsSection>
      )}

      {/* Create Team Modal */}
      <CreateTeamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Edit Team Modal */}
      <EditTeamModal
        isOpen={Boolean(editingTeam)}
        onClose={() => setEditingTeam(null)}
        team={editingTeam}
        users={users}
      />

      {/* Archive Team Modal */}
      <ArchiveTeamModal
        isOpen={Boolean(archivingTeam)}
        onClose={() => setArchivingTeam(null)}
        team={archivingTeam}
        projects={projects}
        cycles={cycles}
      />
    </div>
  );
};
