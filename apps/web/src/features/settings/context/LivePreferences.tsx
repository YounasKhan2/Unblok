import React,{useEffect,useState} from 'react';
import {PreferenceContext} from './PreferenceBindings';
import {createDefaultUserPreferences,setupThemeSubscription} from '../domain/preferences';
import type {UserPreferences} from '../types';
import type {ShellIdentity} from '../../../app/shell/ShellBindings';
const key=(id:string)=>'unblok_execution_state_v1_settings_user_prefs_'+id;
function read(id:string):UserPreferences{
 const fallback=createDefaultUserPreferences(id);
 try{const raw=JSON.parse(localStorage.getItem(key(id))??'null');if(raw?.userId===id&&['LIGHT','DARK','SYSTEM'].includes(raw.theme)&&['COMPACT','COMFORTABLE'].includes(raw.density))return {...fallback,theme:raw.theme,density:raw.density};}catch{}
 return fallback;
}
export function LivePreferences({identity,children}:{identity:ShellIdentity;children:React.ReactNode}){
 const [preferences,setPreferences]=useState(()=>{const saved=read(identity.id),theme=new URLSearchParams(typeof window==='undefined'?'':window.location.search).get('theme')?.toUpperCase();return ['LIGHT','DARK','SYSTEM'].includes(theme??'')?{...saved,theme:theme as UserPreferences['theme']}:saved;});
 useEffect(()=>setupThemeSubscription(preferences.theme),[preferences.theme]);
 const updatePreferences=(updates:Partial<UserPreferences>)=>{const next={...preferences,theme:updates.theme??preferences.theme,density:updates.density??preferences.density};localStorage.setItem(key(identity.id),JSON.stringify(next));setPreferences(next);};
 return <PreferenceContext.Provider value={{currentUser:identity,isAdmin:identity.role==='ADMIN',live:true,preferences,updatePreferences}}>{children}</PreferenceContext.Provider>;
}
