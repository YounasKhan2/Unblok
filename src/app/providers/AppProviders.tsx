/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { ProjectProvider, useProject } from '../../context/ProjectContext';
import { SettingsProvider } from '../../features/settings/context/SettingsContext';
import { CollaborationProvider } from '../../features/collaboration/context/CollaborationContext';
import { KeyboardProvider } from '../../context/KeyboardContext';
import { AuthProvider, useAuth } from '../../features/auth/context/AuthContext';
import { bridgeToLegacyUser } from '../../features/auth/domain/legacyBridge';
import { AuthStatus, AuthenticatedUser } from '../../features/auth/types';

import { WorkspaceProvider, useWorkspace } from '../../features/workspaces/context/WorkspaceContext';

interface AppProvidersProps {
  children: React.ReactNode;
  initialAuthStatus?: AuthStatus;
  initialUser?: AuthenticatedUser | null;
  initialActiveWorkspaceId?: string | null;
}

/**
 * Bridges authenticated identity and active workspace membership from
 * AuthContext and WorkspaceContext into legacy AppShell ProjectContext.
 */
const ProjectAuthBridge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, status } = useAuth();
  const { activeMembership } = useWorkspace();
  const { setCurrentUser } = useProject();

  useEffect(() => {
    if (status === 'authenticated' && user) {
      const legacyUser = bridgeToLegacyUser(user, activeMembership);
      setCurrentUser(legacyUser);
    }
  }, [status, user, activeMembership, setCurrentUser]);

  return <>{children}</>;
};

export const AppProviders: React.FC<AppProvidersProps> = ({
  children,
  initialAuthStatus,
  initialUser,
  initialActiveWorkspaceId,
}) => {
  return (
    <AuthProvider initialStatus={initialAuthStatus} initialUser={initialUser}>
      <WorkspaceProvider initialActiveWorkspaceId={initialActiveWorkspaceId}>
        <ProjectProvider>
          <ProjectAuthBridge>
            <SettingsProvider>
              <CollaborationProvider>
                <KeyboardProvider>{children}</KeyboardProvider>
              </CollaborationProvider>
            </SettingsProvider>
          </ProjectAuthBridge>
        </ProjectProvider>
      </WorkspaceProvider>
    </AuthProvider>
  );
};
