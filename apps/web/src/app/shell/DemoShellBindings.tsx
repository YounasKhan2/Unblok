import React,{useEffect,useRef,useState} from 'react';
import {useLocation,useNavigate} from 'react-router-dom';
import {ShellContext} from './ShellBindings';
import {useProject} from '../../context/ProjectContext';
import {useKeyboard} from '../../context/KeyboardContext';
import {useWorkspace} from '../../features/workspaces/context/WorkspaceContext';
import {useCollaboration} from '../../features/collaboration/context/CollaborationContext';
import {getLatestNexusFixtureBackup,restorePrototypeBackup} from '../../context/nexusFixtureReset';
import {IssueDrawer} from '../../components/drawer/IssueDrawer';
import {CommandPalette} from '../../components/modals/CommandPalette';
import {CreateIssueModal} from '../../components/modals/CreateIssueModal';
import {CompletionGuardDialog} from '../../components/modals/CompletionGuardDialog';
import {CycleErrorDialog} from '../../components/modals/CycleErrorDialog';
import {ShortcutsHelpModal} from '../../components/modals/ShortcutsHelpModal';
import {BulkActionBar} from '../../components/layout/BulkActionBar';
import {ArchivedWorkspaceBanner} from '../../features/workspaces/components/ArchivedWorkspaceBanner';
import {WorkspaceUnavailable} from '../../features/workspaces/components/WorkspaceUnavailable';
import type {User} from '../../types';
import {useAuth} from '../../features/auth/context/AuthBindings';
import {WorkspaceCreationContext} from '../../features/workspaces/components/WorkspaceCreationBindings';
export function DemoShellBindings({children}:{children:React.ReactNode}){
 const {user}=useAuth();
 const project=useProject(),keyboard=useKeyboard(),ws=useWorkspace(),{unreadCount}=useCollaboration();
 const [error,setError]=useState<string|null>(null);
 const backupKey=typeof window==='undefined'?null:getLatestNexusFixtureBackup(window.localStorage);
 const restore=()=>{if(!backupKey||!window.confirm(`Restore the backed-up prototype state from ${backupKey}? Current NEXUS changes will be backed up so they can be recovered.`))return;
 try{const undo=restorePrototypeBackup(window.localStorage,backupKey,true);console.info(`Prototype state restored. Current NEXUS state backup: ${undo}`);window.location.reload();}catch(e){setError(e instanceof Error?e.message:'Could not restore the prototype backup.');}};
 return <WorkspaceCreationContext.Provider value={{mode:'demo',name:user?.name??'',busy:false,create:async(input)=>(await ws.createWorkspace(input)).id}}><ShellContext.Provider value={{mode:'demo',currentUser:project.currentUser,isNavCollapsed:project.isNavCollapsed,setIsNavCollapsed:project.setIsNavCollapsed,
 unreadCount,blockedCount:project.issues.filter(i=>project.getIssueBlockerStatus(i.id).isBlocked).length,
 setIsCreateModalOpen:keyboard.setIsCreateModalOpen,setIsHelpModalOpen:keyboard.setIsHelpModalOpen,
 workspaces:ws.memberships.flatMap(m=>{const workspace=ws.workspaces.find(w=>w.id===m.workspaceId);return workspace?[{workspace,membership:m}]:[];}),activeWorkspace:ws.activeWorkspace,activeWorkspaceId:ws.activeWorkspaceId,switchWorkspace:ws.switchWorkspace,createAvailable:true,businessAvailable:true,
 demoControls:{users:project.users,setCurrentUser:user=>project.setCurrentUser(user as User),reset:project.resetToDemoData,backupKey,restore,error},
 }}>{children}</ShellContext.Provider></WorkspaceCreationContext.Provider>;
}
/** Router-dependent demo lifecycle stays outside the shared application frame. */
export function DemoShellLifecycle(){
 const p=useProject(),k=useKeyboard(),ws=useWorkspace(),navigate=useNavigate(),location=useLocation(),previous=useRef(ws.activeWorkspaceId);
 useEffect(()=>{k.registerRouteNavigator(navigate);return()=>k.registerRouteNavigator(null);},[navigate,k.registerRouteNavigator]);
 useEffect(()=>{if(previous.current&&ws.activeWorkspaceId&&previous.current!==ws.activeWorkspaceId){p.setIsDrawerOpen(false);p.setSelectedIssueId(null);p.clearSelection();if(['/teams/','/projects/','/issues/'].some(path=>location.pathname.startsWith(path)))navigate('/my-work',{replace:true});}previous.current=ws.activeWorkspaceId;},[ws.activeWorkspaceId,location.pathname,navigate,p.setIsDrawerOpen,p.setSelectedIssueId,p.clearSelection]);
 return null;
}
export function DemoShellFrame({children}:{children:React.ReactNode}){
 const shell=useShellForDemo(),ws=useWorkspace();
 const unavailable=ws.status==='unavailable'||ws.status==='empty'||(ws.status==='ready'&&!ws.activeWorkspaceId);
 return <ShellContext.Provider value={{...shell,banner:<ArchivedWorkspaceBanner/>,unavailable:unavailable?<WorkspaceUnavailable/>:undefined,bulk:<BulkActionBar/>,overlays:<><IssueDrawer/><CommandPalette/><CreateIssueModal/><CompletionGuardDialog/><CycleErrorDialog/><ShortcutsHelpModal/></>}}><DemoShellLifecycle/>{children}</ShellContext.Provider>;
}
import {useShell as useShellForDemo} from './ShellBindings';
