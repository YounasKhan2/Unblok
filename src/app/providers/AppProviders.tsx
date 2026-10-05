/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ProjectProvider } from '../../context/ProjectContext';
import { KeyboardProvider } from '../../context/KeyboardContext';

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <ProjectProvider>
      <KeyboardProvider>{children}</KeyboardProvider>
    </ProjectProvider>
  );
};
