import React,{useEffect,useState} from 'react';
import {Link,useParams,useNavigate} from 'react-router-dom';
import {Button} from '../../../components/ui/Button';
import {useSession} from '../../auth/session/SessionContext';
import {useLiveWorkspace} from '../../workspaces/live/WorkspaceContext';
import {useTeams} from './TeamsContext';
import {TeamDialog} from './TeamDialog';
import {TeamsDirectoryPageFrame} from '../../../pages/teams/TeamsDirectoryPageFrame';
import {TeamHubPageFrame,TeamMemberList} from '../../../pages/teams/TeamHubPageFrame';
import type {TeamOverviewData} from '../types';
function useScope() {
    const { workspaceId, teamId } = useParams(), w = useLiveWorkspace(), s = useSession(), t = useTeams(), generation = s.store.generation();
    useEffect(() => { const scope=w.store.snapshot();if (workspaceId && s.status === 'authenticated' && !s.pending && (scope.selected!==workspaceId||(!scope.context&&!scope.selecting&&!scope.contextError)))
        void w.store.select(workspaceId); }, [workspaceId, w.store, s.status, s.pending, generation]);
    useEffect(() => { t.store.route(teamId); }, [teamId, t.store, t.workspace]);
    return { workspaceId, teamId, w, s, t, current: w.selected === workspaceId ? w.context : null };
}

function Feedback(){const t=useTeams(),w=useLiveWorkspace(),{teamId}=useParams();return <div className="px-4 space-y-2 text-xs">{(w.selecting||t.loading||t.opening)&&<p role="status">Checking Team access…</p>}{(w.contextError||t.error||t.detailError)&&<p role="alert" className="text-danger">{w.contextError||t.error||t.detailError}</p>}{t.notice&&<p role="status">{t.notice}</p>}<Button size="sm" disabled={t.loading||t.opening||w.selecting} onClick={()=>{if(w.contextError&&w.selected)void w.store.select(w.selected);else if(teamId)void t.store.open(teamId);else void t.store.load();}}>Reload Teams</Button></div>;}
export function TeamDirectoryPage(){const {workspaceId,t,current,s}=useScope(),navigate=useNavigate(),ready=!!current&&t.workspace===workspaceId;
 return <TeamsDirectoryPageFrame key={s.user?.id+':'+workspaceId+':'+current?.self.membershipId} directoryItems={ready?(t.page?.items??[]).map(team=>({team,isArchived:team.status==='ARCHIVED',memberCount:null,projectCount:null,activeIssueCount:null,blockedIssueCount:null})):[]} total={null} isAdmin={ready&&t.canCreate} searchQuery="" statusFilter={t.filter} setStatusFilter={f=>t.store.filter(f)} onTeam={team=>navigate('/workspaces/'+workspaceId+'/teams/'+team.id)} unavailable loaded={ready&&!!t.page} feedback={<Feedback/>} pagination={ready&&t.page?.page.hasMore?<Button size="sm" disabled={t.loading} onClick={()=>void t.store.load(true)}>Next Teams</Button>:null} renderCreate={(open,close)=>open&&ready&&t.canCreate?<TeamDialog mode="create" close={close}/>:null}/>;
}
function Members(){const t=useTeams();return <>{t.membersLoading?<p role="status" className="text-xs text-text-muted">Loading Team membership details…</p>:t.members?<><TeamMemberList members={t.members.items.map(m=>({id:m.membershipId,name:m.displayName,detail:(m.isOwner?'Owner · ':'')+m.teamRole+' · '+m.workspaceStatus}))}/>{!t.members.items.length&&<p className="text-xs text-text-muted">No membership records on this page.</p>}{t.members.page.hasMore&&<Button size="sm" disabled={t.membersLoading} onClick={()=>void t.store.loadMembers(true)}>Next members</Button>}</>:<p className="text-xs text-text-muted">{t.membersError||'Team membership details are unavailable.'}</p>}</>;}
export function LiveTeamHubPage(){const {workspaceId,teamId,t,s,w,current}=useScope(),[edit,setEdit]=useState(false),ready=!!current&&t.workspace===workspaceId,team=ready&&t.team?.id===teamId?t.team:null;
 useEffect(()=>setEdit(false),[workspaceId,teamId,s.store.generation(),current?.self.membershipId]);
 useEffect(()=>{if(!ready||t.detailError||team&&!team.capabilities.updateMetadata)setEdit(false);},[ready,t.detailError,team]);
 if(!team)return <Feedback/>;
 // Unsupported collections are never rendered as empty business results or derived zero metrics.
 const overview:TeamOverviewData={team,members:[],ownedProjects:[],activeIssues:[],blockedIssues:[],needsAttentionIssues:[],cycles:[],milestones:[],activeCycle:null,isArchived:team.status==='ARCHIVED'};
 const openEdit=()=>{const generation=s.store.generation(),membership=current?.self.membershipId;void t.store.open(team.id,true).then(()=>{const fresh=t.store.snapshot().team,c=s.store.snapshot();if(s.store.generation()===generation&&c.status==='authenticated'&&t.store.snapshot().allowed&&fresh&&fresh.id===teamId&&fresh.workspaceId===workspaceId&&fresh.capabilities.updateMetadata&&membership===w.store.snapshot().context?.self.membershipId)setEdit(true);});};
 return <><TeamHubPageFrame key={s.user?.id+':'+workspaceId+':'+teamId+':'+current?.self.membershipId} team={team} overview={overview} canCreate={false} live={{members:<Members/>,edit:team.capabilities.updateMetadata?<Button size="sm" disabled={t.opening} onClick={openEdit}>Edit metadata</Button>:null,feedback:<Feedback/>}}/>{edit&&(team.capabilities.updateMetadata||t.conflict)&&<TeamDialog mode="edit" close={()=>setEdit(false)}/>}</>;
}
