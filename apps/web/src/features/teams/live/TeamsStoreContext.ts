import {createContext} from 'react';
import type {TeamsStore} from './TeamsStore';
// Keep context identity outside the React Fast Refresh component module.
// Provider and consumers must share the same object when that module reevaluates.
export const TeamsStoreContext=createContext<TeamsStore|null>(null);
