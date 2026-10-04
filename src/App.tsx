/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ProjectProvider } from './context/ProjectContext';
import { KeyboardProvider } from './context/KeyboardContext';
import { AppShell } from './components/layout/AppShell';

export default function App() {
  return (
    <ProjectProvider>
      <KeyboardProvider>
        <AppShell />
      </KeyboardProvider>
    </ProjectProvider>
  );
}
