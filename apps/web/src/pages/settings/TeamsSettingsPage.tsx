import {TeamsSettingsPageFrame} from './TeamsSettingsPageFrame';
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

  return (<TeamsSettingsPageFrame activeTeams={activeTeams} archivedTeams={archivedTeams} users={users} projects={projects} cycles={cycles} onCreate={()=>setIsCreateModalOpen(true)} onEdit={setEditingTeam} onArchive={setArchivingTeam} onRestore={t=>restoreTeam(t.id)}>
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
    </TeamsSettingsPageFrame>
  );
};
