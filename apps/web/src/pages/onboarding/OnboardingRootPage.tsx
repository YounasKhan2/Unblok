/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-13 & UX-14 Onboarding Entry Dispatcher
 * Section 10, 15, 16, 17: Domain-derived progression routing into:
 * Workspace -> Team -> Project -> Invite -> Complete -> Product.
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useWorkspace } from '../../features/workspaces/context/WorkspaceContext';
import { useProject } from '../../context/ProjectContext';
import { resolveOnboardingRoute } from '../../features/onboarding/domain/onboardingProgression';

export const OnboardingRootPage: React.FC = () => {
  const { memberships, activeWorkspace, activeMembership, status } = useWorkspace();
  const { teams, projects } = useProject();

  if (status === 'loading') {
    return null;
  }

  const activeMemberships = memberships.filter((m) => m.status === 'ACTIVE');

  // If user has no active memberships, send them to workspace creation
  if (activeMemberships.length === 0) {
    return <Navigate to="/onboarding/workspace" replace />;
  }

  const targetRoute = resolveOnboardingRoute({
    activeWorkspace,
    activeMembership,
    teams,
    projects,
  });

  return <Navigate to={targetRoute} replace />;
};
