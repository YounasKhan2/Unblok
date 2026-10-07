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
import { Workspace, WorkspaceMembership } from '../../features/workspaces/types';
import { WorkspaceProvider, useWorkspace } from '../../features/workspaces/context/WorkspaceContext';

interface AppProvidersProps {
  children: React.ReactNode;
  initialAuthStatus?: AuthStatus;
  initialUser?: AuthenticatedUser | null;
  initialActiveWorkspaceId?: string | null;
  initialWorkspaces?: Workspace[];
  initialMemberships?: WorkspaceMembership[];
}

/**
 * Bridges authenticated identity and active workspace membership from
 * AuthContext and WorkspaceContext into legacy AppShell ProjectContext.
 */
const ProjectAuthBridge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, status } = useAuth();
  const { activeMembership, activeWorkspaceId } = useWorkspace();
  const { setCurrentUser } = useProject();

  useEffect(() => {
    if (status === 'authenticated' && user) {
      const effectiveMembership = activeWorkspaceId ? activeMembership : null;
      const legacyUser = bridgeToLegacyUser(user, effectiveMembership);
      setCurrentUser(legacyUser);
    }
  }, [status, user, activeWorkspaceId, activeMembership, setCurrentUser]);

  return <>{children}</>;
};

export const AppProviders: React.FC<AppProvidersProps> = ({
  children,
  initialAuthStatus,
  initialUser,
  initialActiveWorkspaceId,
  initialWorkspaces,
  initialMemberships,
}) => {
  return (
    <AuthProvider initialStatus={initialAuthStatus} initialUser={initialUser}>
      <WorkspaceProvider
        initialActiveWorkspaceId={initialActiveWorkspaceId}
        initialWorkspaces={initialWorkspaces}
        initialMemberships={initialMemberships}
      >
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
