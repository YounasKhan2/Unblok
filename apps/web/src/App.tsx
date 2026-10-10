/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SessionProvider } from './features/auth/session/SessionContext';
import { LiveRouter } from './features/auth/live/LiveRouter';
import { DemoExperience } from './features/auth/live/DemoExperience';

export default function App() {
  if (window.location.pathname === '/demo' || window.location.pathname.startsWith('/demo/')) return <DemoExperience/>;
  return <SessionProvider><LiveRouter/></SessionProvider>;
}
