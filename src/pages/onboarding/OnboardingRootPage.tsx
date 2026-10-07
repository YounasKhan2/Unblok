/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-13 Onboarding Entry Dispatcher
 * Section 17, 20, 30: Routes new accounts with zero memberships into workspace creation,
 * or returns existing members to My Work.
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useWorkspace } from '../../features/workspaces/context/WorkspaceContext';

export const OnboardingRootPage: React.FC = () => {
  const { memberships, status } = useWorkspace();

  if (status === 'loading') {
    return null;
  }

  const activeMemberships = memberships.filter((m) => m.status === 'ACTIVE');

  // If user has no active memberships, send them to workspace creation
  if (activeMemberships.length === 0) {
    return <Navigate to="/onboarding/workspace" replace />;
  }

  // Otherwise, user already has valid workspace(s)
  return <Navigate to="/my-work" replace />;
};
