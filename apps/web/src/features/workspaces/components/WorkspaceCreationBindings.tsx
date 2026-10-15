import React,{createContext,useContext} from 'react';
export interface WorkspaceCreationBinding {mode:'live'|'demo';name:string;busy:boolean;attempt?:{name:string;slug:string};blocked?:boolean;error?:string;create:(input:{name:string;slug:string})=>Promise<string|null>}
export const WorkspaceCreationContext=createContext<WorkspaceCreationBinding|null>(null);
export function useWorkspaceCreation(){const value=useContext(WorkspaceCreationContext);if(!value)throw new Error('Workspace creation binding required');return value;}
