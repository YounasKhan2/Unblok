import React,{createContext,useContext,useEffect,useState,useSyncExternalStore} from 'react';
import {useSession} from '../../auth/session/SessionContext';
import {WorkspaceStore} from './WorkspaceStore';
import {TabAttemptJournal} from './AttemptJournal';
const Context=createContext<WorkspaceStore|null>(null);
export function LiveWorkspaceProvider({children,store:injected}:{children:React.ReactNode;store?:WorkspaceStore}){
  const {store:session}=useSession();const [store]=useState(()=>injected??new WorkspaceStore(session,undefined,undefined,typeof window==='undefined'?undefined:new TabAttemptJournal({getItem:key=>window.sessionStorage.getItem(key),setItem:(key,value)=>window.sessionStorage.setItem(key,value),removeItem:key=>window.sessionStorage.removeItem(key)})));
  useEffect(()=>store.start(),[store]);
  useEffect(()=>{const refresh=()=>{if(document.visibilityState==='visible'){const s=store.snapshot();if(s.selected&&!s.creating)void store.select(s.selected);}};
    window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);
    return()=>{window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh);};},[store]);
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function useLiveWorkspace(){const store=useContext(Context);if(!store)throw new Error('LiveWorkspaceProvider required');return {store,...useSyncExternalStore(store.subscribe,store.snapshot,store.snapshot)};}
