import {createContext,useContext} from 'react';
import type {UserPreferences} from '../types';
import type {ShellIdentity} from '../../../app/shell/ShellBindings';
export interface PreferenceBinding {currentUser:ShellIdentity;isAdmin:boolean;live?:boolean;preferences:UserPreferences;updatePreferences:(updates:Partial<UserPreferences>)=>void}
export const PreferenceContext=createContext<PreferenceBinding|null>(null);
export function usePreferences(){const value=useContext(PreferenceContext);if(!value)throw new Error('Preference bindings required');return value;}
