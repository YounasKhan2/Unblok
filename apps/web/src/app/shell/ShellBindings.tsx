import React, {createContext, useContext} from 'react';
import type {UserRole} from '../../types';
export interface ShellIdentity {id:string;name:string;avatar?:string;role?:UserRole}
export interface WorkspaceMenuItem {workspace:{id:string;name:string;avatar?:string;status:string};membership:{role:UserRole;status:string}}
/** Presentation only. None of these fields authorizes a server operation. */
export interface ShellBindings {
 mode:'demo'|'live'; currentUser:ShellIdentity; isNavCollapsed:boolean; setIsNavCollapsed:(value:boolean)=>void;
 unreadCount:number|null; blockedCount:number|null; setIsCreateModalOpen:(value:boolean)=>void; setIsHelpModalOpen:(value:boolean)=>void;
 workspaces:WorkspaceMenuItem[]; activeWorkspace:WorkspaceMenuItem['workspace']|null; activeWorkspaceId:string|null;
 switchWorkspace:(id:string)=>Promise<boolean>; createAvailable:boolean; businessAvailable:boolean;
 banner?:React.ReactNode; unavailable?:React.ReactNode; bulk?:React.ReactNode; overlays?:React.ReactNode;
 demoControls?:{users:ShellIdentity[];setCurrentUser:(user:ShellIdentity)=>void;reset:()=>void;backupKey:string|null;restore:()=>void;error:string|null};
}
export const ShellContext=createContext<ShellBindings|null>(null);
export function useShell(){const value=useContext(ShellContext);if(!value)throw new Error('Shell bindings required');return value;}
