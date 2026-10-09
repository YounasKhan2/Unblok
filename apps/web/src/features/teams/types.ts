/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-14 Teams Directory, Team Hub & Team Creation Types
 */

import { Team, Project, Issue, User, Cycle, Milestone } from '../../types';

export type TeamStatusFilter = 'ALL' | 'ACTIVE' | 'ARCHIVED';

export type TeamHubTab = 'overview' | 'issues' | 'projects' | 'planning';

export interface CreateTeamInput {
  name: string;
  key: string;
  description?: string;
  color?: string;
  leadId?: string;
  memberIds?: string[];
}

export interface TeamDirectoryItem {
  team: Team;
  memberCount: number;
  projectCount: number;
  activeIssueCount: number;
  blockedIssueCount: number;
  isArchived: boolean;
}

export interface TeamOverviewData {
  team: Team;
  members: User[];
  ownedProjects: Project[];
  activeIssues: Issue[];
  blockedIssues: Issue[];
  needsAttentionIssues: Issue[];
  cycles: Cycle[];
  milestones: Milestone[];
  activeCycle: Cycle | null;
  isArchived: boolean;
}
