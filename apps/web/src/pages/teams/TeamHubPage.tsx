import {TeamHubPageFrame} from './TeamHubPageFrame';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-14 Team Hub Page
 * Part B: Real Team Hub for /teams/:teamKey with Overview, Issues, Projects, and Planning.
 */

import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext';
import { useSettings } from '../../features/settings/context/SettingsContext';
import { resolveTeam, selectTeamOverview } from '../../features/teams/domain/teamResolution';
import { PrivateNotFoundPage } from '../placeholder/PrivateNotFoundPage';
import { CreateProjectModal } from '../../features/projects/components/CreateProjectModal';

export const TeamHubPage: React.FC = () => {
  const { teamKey } = useParams<{ teamKey: string }>();
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

  return <TeamHubPageFrame team={team} overview={overview} canCreate={canCreate} setSelectedIssueId={setSelectedIssueId} renderProject={(open,close)=><CreateProjectModal isOpen={open} onClose={close} defaultTeamId={team.id}/>}/>;
};
