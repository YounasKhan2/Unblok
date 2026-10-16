import {AdministrationStore,AdministrationJournal} from './AdministrationStore';
import React,{createContext,useContext,useEffect,useState,useSyncExternalStore} from 'react';
import {useSession} from '../../auth/session/SessionContext';
import {useLiveWorkspace} from './WorkspaceContext';
import {MembersStore} from './MembersStore';
import {InvitationStore,takeInvitationLink} from './InvitationStore';
import {TabInviteJournal,TabAcceptanceJournal} from './InviteJournal';
const Context=createContext<{members:MembersStore;invitation:InvitationStore;administration:AdministrationStore}|null>(null);
export function MembersProvider({children,stores:injected}:{children:React.ReactNode;stores?:{members:MembersStore;invitation:InvitationStore}}){
 const {store:session}=useSession(),{store:workspaces}=useLiveWorkspace();
 const [stores]=useState(()=>{if(injected)return {...injected,administration:new AdministrationStore(session,workspaces),legacy:true};const members=new MembersStore(session,workspaces,undefined,typeof window==='undefined'?undefined:new TabInviteJournal({getItem:k=>window.sessionStorage.getItem(k),setItem:(k,v)=>window.sessionStorage.setItem(k,v),removeItem:k=>window.sessionStorage.removeItem(k)})),invitation=new InvitationStore(session,workspaces,undefined,undefined,typeof window==='undefined'?undefined:new TabAcceptanceJournal({getItem:k=>window.sessionStorage.getItem(k),setItem:(k,v)=>window.sessionStorage.setItem(k,v),removeItem:k=>window.sessionStorage.removeItem(k)}));
  if(typeof window!=='undefined'){const token=takeInvitationLink(window.location,path=>window.history.replaceState(null,'',path));if(token)invitation.capture(token);}const administration=new AdministrationStore(session,workspaces,undefined,typeof window==='undefined'?undefined:new AdministrationJournal({getItem:k=>window.sessionStorage.getItem(k),setItem:(k,v)=>window.sessionStorage.setItem(k,v),removeItem:k=>window.sessionStorage.removeItem(k)}),undefined,typeof window==='undefined'?undefined:new TabInviteJournal({getItem:k=>window.sessionStorage.getItem(k),setItem:(k,v)=>window.sessionStorage.setItem(k,v),removeItem:k=>window.sessionStorage.removeItem(k)}));return {members,invitation,administration,legacy:false};});
 useEffect(()=>{const stops=[...(stores.legacy?[stores.members.start()]:[]),stores.invitation.start(),stores.administration.start()];
  const capture=()=>{const token=takeInvitationLink(window.location,path=>window.history.replaceState(window.history.state,'',path));if(token)stores.invitation.capture(token);};
  window.addEventListener('hashchange',capture);return()=>{window.removeEventListener('hashchange',capture);stops.forEach(stop=>stop());};},[stores]);
 return <Context.Provider value={stores}>{children}</Context.Provider>;
}
export function useMembers(){const c=useContext(Context);if(!c)throw new Error('MembersProvider required');return {store:c.members,...useSyncExternalStore(c.members.subscribe,c.members.snapshot,c.members.snapshot)};}
export function useInvitation(){const c=useContext(Context);if(!c)throw new Error('MembersProvider required');return {store:c.invitation,...useSyncExternalStore(c.invitation.subscribe,c.invitation.snapshot,c.invitation.snapshot)};}

export function useAdministration(){const c=useContext(Context);if(!c)throw new Error('MembersProvider required');return {store:c.administration,...useSyncExternalStore(c.administration.subscribe,c.administration.snapshot,c.administration.snapshot)};}
