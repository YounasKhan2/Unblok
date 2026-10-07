/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ProjectProvider } from '../../context/ProjectContext';
import { SettingsProvider } from '../../features/settings/context/SettingsContext';
import { CollaborationProvider } from '../../features/collaboration/context/CollaborationContext';
import { KeyboardProvider } from '../../context/KeyboardContext';

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <ProjectProvider>
      <SettingsProvider>
        <CollaborationProvider>
          <KeyboardProvider>{children}</KeyboardProvider>
        </CollaborationProvider>
      </SettingsProvider>
    </ProjectProvider>
  );
};

