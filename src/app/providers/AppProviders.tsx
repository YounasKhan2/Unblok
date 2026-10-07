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

interface AppProvidersProps {
  children: React.ReactNode;
  initialAuthStatus?: AuthStatus;
  initialUser?: AuthenticatedUser | null;
}

/**
 * Bridges authenticated identity from AuthContext into legacy AppShell ProjectContext.
 * Isolated boundary for backwards compatibility until UX-13.
 */
const ProjectAuthBridge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, membership, status } = useAuth();
  const { setCurrentUser } = useProject();

  useEffect(() => {
    if (status === 'authenticated' && user) {
      const legacyUser = bridgeToLegacyUser(user, membership);
      setCurrentUser(legacyUser);
    }
  }, [status, user, membership, setCurrentUser]);

  return <>{children}</>;
};

export const AppProviders: React.FC<AppProvidersProps> = ({
  children,
  initialAuthStatus,
  initialUser,
}) => {
  return (
    <ProjectProvider>
      <AuthProvider initialStatus={initialAuthStatus} initialUser={initialUser}>
        <ProjectAuthBridge>
          <SettingsProvider>
            <CollaborationProvider>
              <KeyboardProvider>{children}</KeyboardProvider>
            </CollaborationProvider>
          </SettingsProvider>
        </ProjectAuthBridge>
      </AuthProvider>
    </ProjectProvider>
  );
};
