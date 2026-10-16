import {workspaceMenuItems} from '../../features/workspaces/live/workspaceMenu';
import React,{useEffect,useRef,useState} from 'react';
import {Navigate,useNavigate,useParams} from 'react-router-dom';
import {useSession} from '../../features/auth/session/SessionContext';
import {useLiveWorkspace} from '../../features/workspaces/live/WorkspaceContext';
import {ShellContext,type ShellBindings} from './ShellBindings';
import {AppShellLayout} from '../layouts/AppShellLayout';
import {LivePreferences} from '../../features/settings/context/LivePreferences';
import {ShortcutsHelpView} from '../../components/modals/ShortcutsHelpView';
import {LiveWorkspacePage} from '../../features/workspaces/live/WorkspacePages';
import {WorkspaceCreationContext} from '../../features/workspaces/components/WorkspaceCreationBindings';
export function LiveCreationBinding({children}:{children:React.ReactNode}){
 const session=useSession(),w=useLiveWorkspace();
 return <WorkspaceCreationContext.Provider value={{mode:'live',name:session.user?.name??'',busy:w.creating,attempt:w.attempt?.body,blocked:w.reconciliationBlocked,error:w.creationError,create:input=>w.store.create(input)}}>{children}</WorkspaceCreationContext.Provider>;
}
export function OpenLiveWorkspace(){
 const {workspaceId}=useParams(),w=useLiveWorkspace();
 if(w.selected===workspaceId&&w.context?.workspace.id===workspaceId)return <Navigate to="/my-work" replace/>;
 return <LiveWorkspacePage/>;
}
export function LiveShellBoundary(){
 const s=useSession(),w=useLiveWorkspace(),{workspaceId}=useParams();
 const generation=s.store.generation();
 // Route changes validate once. A switch in flight must not reselect the old URL.
 useEffect(()=>{if(workspaceId&&s.status==='authenticated'&&!s.pending&&w.store.snapshot().selected!==workspaceId)void w.store.select(workspaceId);},[workspaceId,s.status,s.pending,generation,w.store]);
 const current=s.status==='authenticated'&&!s.pending&&w.context&&w.selected===w.context.workspace.id?w.context:null;
 if(!s.user||s.pending)return <p role="status">Checking your session…</p>;
 if(workspaceId&&current?.workspace.id!==workspaceId)return <LiveWorkspacePage manageSelection={false}/>;
 if(!current&&!w.selecting)return <Navigate to="/account" replace/>;
 // Remount all private projections and local overlays on every authority change.
 const scope=[s.user.id,s.store.generation(),w.selected,current?.self.membershipId,current?.self.role,current?.self.membershipStatus,current?.workspace.status].join(':');
 return <LiveBoundShell key={scope}/>;
}
function LiveBoundShell(){
 const s=useSession(),w=useLiveWorkspace(),navigate=useNavigate();
 const [collapsed,setCollapsed]=useState(false),[help,setHelp]=useState(false),sequence=useRef(0);
 const current=w.selected===w.context?.workspace.id?w.context:null;
 useEffect(()=>{const handler=(event:KeyboardEvent)=>{
 const target=event.target;if(event.defaultPrevented||(target instanceof Element&&target.closest('input,textarea,select,[contenteditable="true"],[role="menu"],[role="dialog"]')))return;
 if(event.key==='Escape'){setHelp(false);return;}if(help)return;
 if(event.key==='['||event.key===']'){event.preventDefault();setCollapsed(value=>!value);return;}
 if(event.key==='?'){event.preventDefault();setHelp(true);return;}
 if(event.metaKey||event.ctrlKey||event.altKey)return;
 const key=event.key.toLowerCase();if(sequence.current>Date.now()){sequence.current=0;const routes:Record<string,string>={m:'/my-work',i:'/inbox',p:'/projects',t:'/teams',c:'/cycles',s:'/milestones',r:'/roadmap',d:'/dependencies'};if(routes[key]){event.preventDefault();navigate(routes[key]);}}
 else if(key==='g')sequence.current=Date.now()+1500;
 };window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler);},[navigate,help]);
 const identity={id:s.user!.id,name:s.user!.name,role:current?.self.role};
 const bindings:ShellBindings={mode:'live',currentUser:identity,isNavCollapsed:collapsed,setIsNavCollapsed:setCollapsed,unreadCount:null,blockedCount:null,
 businessAvailable:false,createAvailable:!w.creating&&!s.pending,
 setIsCreateModalOpen:()=>{throw new Error('Issue creation is not connected.');},setIsHelpModalOpen:setHelp,
 workspaces:workspaceMenuItems(w.page,current),activeWorkspace:current?.workspace??null,activeWorkspaceId:current?.workspace.id??null,
 switchWorkspace:async id=>{const actor=s.user!.id,generation=s.store.generation();await w.store.select(id);const latest=w.store.snapshot();return s.store.snapshot().user?.id===actor&&s.store.generation()===generation&&latest.selected===id&&latest.context?.workspace.id===id;},
 unavailable:!current?<p role="status" className="p-4 text-sm text-text-secondary">Opening workspace…</p>:undefined,
 overlays:<ShortcutsHelpView live isHelpModalOpen={help} setIsHelpModalOpen={setHelp}/>};
 return <LivePreferences key={identity.id} identity={identity}><ShellContext.Provider value={bindings}><AppShellLayout/></ShellContext.Provider></LivePreferences>;
}
