import React,{useEffect,useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {TeamsSettingsPageFrame} from '../../../pages/settings/TeamsSettingsPageFrame';
import {useTeams} from './TeamsContext';
import {useSession} from '../../auth/session/SessionContext';
import {useLiveWorkspace} from '../../workspaces/live/WorkspaceContext';
import {TeamDialog} from './TeamDialog';
import {Button} from '../../../components/ui/Button';
export function LiveTeamSettings(){const t=useTeams(),s=useSession(),w=useLiveWorkspace(),navigate=useNavigate(),[create,setCreate]=useState(false);
 useEffect(()=>{t.store.route();void t.store.loadSettings('ACTIVE');void t.store.loadSettings('ARCHIVED');setCreate(false);},[t.store,t.workspace,s.store.generation(),w.context?.self.membershipId]);
 const go=(id:string,action:string)=>navigate('/workspaces/'+t.workspace+'/teams/'+id+'?manage='+action);
 if(!t.allowed)return <p role="status">Checking Workspace access…</p>;
 return <>{t.error&&<p role="alert" className="text-xs text-danger">{t.error}</p>}<TeamsSettingsPageFrame activeTeams={t.settingsActive?.items??[]} archivedTeams={t.settingsArchived?.items??[]} users={[]} projects={[]} cycles={[]} onCreate={()=>{if(t.canCreate)setCreate(true);}} onEdit={team=>go(team.id,'edit')} onArchive={team=>go(team.id,'archive')} onRestore={team=>go(team.id,'restore')} live={{canCreate:t.canCreate,activeLoaded:!!t.settingsActive,activePagination:t.settingsActive?.page.hasMore?<Button size="sm" onClick={()=>void t.store.loadSettings('ACTIVE',true)}>Next active Teams</Button>:null,archivedPagination:t.settingsArchived?.page.hasMore?<Button size="sm" onClick={()=>void t.store.loadSettings('ARCHIVED',true)}>Next archived Teams</Button>:null}}/>{create&&t.canCreate&&<TeamDialog mode="create" close={()=>setCreate(false)}/>}</>;
}
