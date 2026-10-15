/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React,{Suspense,lazy} from 'react';
import { SessionProvider } from './features/auth/session/SessionContext';
import { LiveRouter } from './features/auth/live/LiveRouter';
const DemoExperience=lazy(()=>import('./features/auth/live/DemoExperience').then(module=>({default:module.DemoExperience})));

export default function App() {
  if (window.location.pathname === '/demo' || window.location.pathname.startsWith('/demo/')) return <Suspense fallback={null}><DemoExperience/></Suspense>;
  return <SessionProvider><LiveRouter/></SessionProvider>;
}
