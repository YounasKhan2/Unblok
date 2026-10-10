import React,{createContext,useContext,useEffect,useState,useSyncExternalStore} from 'react';
import {AuthApi,authOrigin} from '../api/authApi';
import {SessionStore} from './SessionStore';
const Context=createContext<SessionStore|null>(null);
export function SessionProvider({children,store:injected}:{children:React.ReactNode;store?:SessionStore}) {
  const [store]=useState(()=>injected??new SessionStore(new AuthApi(authOrigin(import.meta.env.VITE_AUTH_API_ORIGIN??'',import.meta.env.PROD))));
  useEffect(()=>{
    void store.refresh();
    const refresh=()=>{if(document.visibilityState==='visible'&&!store.snapshot().pending)void store.refresh();};
    window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);
    const timer=setInterval(()=>{if(store.snapshot().status==='authenticated')refresh();},60000);
    return()=>{window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh);clearInterval(timer);};
  },[store]);
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function useSession() {
  const store=useContext(Context);if(!store)throw new Error('SessionProvider required');
  return {store,...useSyncExternalStore(store.subscribe,store.snapshot,store.snapshot)};
}
