/** @license SPDX-License-Identifier: Apache-2.0 */
import React from 'react';
import {Outlet} from 'react-router-dom';
import {NavigationRail} from '../../components/layout/NavigationRail';
import {WorkspaceHeader} from '../../components/layout/WorkspaceHeader';
import {useShell} from '../shell/ShellBindings';
export const AppShellLayout:React.FC=()=>{
 const shell=useShell();
 return <div className="flex h-screen w-screen overflow-hidden bg-canvas text-text-primary">
  <NavigationRail/>
  <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-canvas relative">
   <WorkspaceHeader/>{shell.banner}
   <main className="flex-1 flex min-w-0 overflow-hidden relative" role="main">{shell.unavailable??<Outlet/>}</main>
   {shell.bulk}
  </div>{shell.overlays}
 </div>;
};
