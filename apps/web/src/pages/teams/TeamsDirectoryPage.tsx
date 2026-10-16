import {TeamsDirectoryPageFrame} from './TeamsDirectoryPageFrame';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-14 Teams Directory Page
 * Part A: Real Teams Directory replacing placeholder.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext';
import { useSettings } from '../../features/settings/context/SettingsContext';
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

  return <TeamsDirectoryPageFrame directoryItems={directoryItems} total={teams.length} isAdmin={isAdmin} searchQuery={searchQuery} setSearchQuery={setSearchQuery} statusFilter={statusFilter} setStatusFilter={setStatusFilter} onTeam={team=>navigate(`/teams/${team.key}`)} renderCreate={(open,close)=><CreateTeamModal isOpen={open} onClose={close} onCreated={team=>navigate(`/teams/${team.key}`)}/>}/>;
};
