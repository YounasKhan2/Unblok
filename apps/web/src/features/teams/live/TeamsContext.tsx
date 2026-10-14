import React, { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import { useSession } from '../../auth/session/SessionContext';
import { useLiveWorkspace } from '../../workspaces/live/WorkspaceContext';
import { TeamsStore } from './TeamsStore';
import { TabTeamJournal } from './TeamJournal';
const Context = createContext<TeamsStore | null>(null);
export function TeamsProvider({ children, store: injected }: {
    children: React.ReactNode;
    store?: TeamsStore;
}) { const { store: session } = useSession(), { store: workspaces } = useLiveWorkspace(); const [store] = useState(() => injected ?? new TeamsStore(session, workspaces, undefined, typeof window === 'undefined' ? undefined : new TabTeamJournal({ getItem: k => window.sessionStorage.getItem(k), setItem: (k, v) => window.sessionStorage.setItem(k, v), removeItem: k => window.sessionStorage.removeItem(k) }))); useEffect(() => store.start(), [store]); return <Context.Provider value={store}>{children}</Context.Provider>; }
export function useTeams() { const store = useContext(Context); if (!store)
    throw new Error('TeamsProvider required'); return { store, ...useSyncExternalStore(store.subscribe, store.snapshot, store.snapshot) }; }
