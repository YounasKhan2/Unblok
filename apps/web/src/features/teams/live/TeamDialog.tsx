import React,{useEffect,useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {createTeamSchema,patchTeamSchema} from '@unblok/contracts';
import {Button} from '../../../components/ui/Button';
import {CreateTeamModalFrame} from '../components/CreateTeamModalFrame';
import {EditTeamModalFrame} from '../../settings/components/EditTeamModalFrame';
import {useTeams} from './TeamsContext';
export function TeamDialog({mode,close}:{mode:'create'|'edit';close:()=>void}){
 const t=useTeams(),navigate=useNavigate(),[now,setNow]=useState(Date.now());
 useEffect(()=>{if(t.retryAfter<=Date.now())return;const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[t.retryAfter]);
 const waiting=t.retryAfter>now,locked=!!t.attempt&&!t.conflict,feedback=<>{t.attempt&&!t.conflict&&<p role="status" className="text-xs text-text-secondary">This request is pending confirmation. Retry uses the original details and request key. Closing this dialog does not cancel the request.</p>}{waiting&&<p role="status" className="text-xs">Wait {Math.ceil((t.retryAfter-now)/1000)} seconds before retrying the same request.</p>}{t.conflict&&<section className="rounded-md border border-warning p-3 text-xs space-y-2"><h3 className="font-semibold">Review conflicting metadata</h3><p>Your draft is retained. Current name: {t.team?.name??'Loading current Team…'}</p><p className="whitespace-pre-wrap break-words">Current description: {t.team?.description??'Unavailable'}</p><p>Current color: {t.team?.color??'Unavailable'}</p><Button type="button" size="sm" disabled={!t.team?.capabilities.updateMetadata||t.opening||t.blocked} onClick={()=>t.store.resolveConflict()}>Use refreshed version for my draft</Button></section>}</>;
 if(mode==='create')return <CreateTeamModalFrame isOpen onClose={close} teams={[]} isAdmin={t.canCreate} createTeam={input=>t.store.create(createTeamSchema.parse(locked?t.attempt!.body:input))} onCreated={team=>navigate('/workspaces/'+t.workspace+'/teams/'+team.id)} live={{busy:t.sending,locked,blocked:t.blocked||waiting,error:t.mutationError,draft:t.attempt?.operation==='create'?t.attempt.body:undefined,feedback}}/>;
 return <EditTeamModalFrame isOpen onClose={close} team={t.team} users={[]} updateTeam={(_id,input)=>t.store.update(patchTeamSchema.parse(locked?t.attempt!.body:{name:input.name,description:input.description??'',color:input.color}))} live={{busy:t.sending,locked,blocked:t.blocked||waiting||t.conflict||t.opening||!t.team?.capabilities.updateMetadata,error:t.mutationError,draft:t.attempt?.operation==='update'?t.attempt.body:undefined,color:t.team?.color??'#5645d4',feedback}}/>;
}
