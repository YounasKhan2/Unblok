import {AdministrationApi} from '../../workspaces/live/AdministrationApi';
import {teamMemberMutationSchema,transferRecordedSchema,transferAcceptedSchema,transferRejectedSchema,transferDetailSchema,teamMemberAddSchema,teamMemberRoleSchema,transferRequestSchema,emptyAuthSchema,type TeamManagementAction} from '@unblok/contracts';
import { createTeamSchema, patchTeamSchema, teamDetailSchema, teamPageSchema, teamMemberPageSchema } from '@unblok/contracts';
import { AuthApi } from '../../auth/api/authApi';
export type MemberPage = ReturnType<typeof teamMemberPageSchema.parse>;
export type LiveTeam = ReturnType<typeof teamDetailSchema.parse>;
export type TeamPage = ReturnType<typeof teamPageSchema.parse>;
export type CreateInput = ReturnType<typeof createTeamSchema.parse>;
export type PatchInput = ReturnType<typeof patchTeamSchema.parse>;
export type TeamFilter = 'ACTIVE' | 'ARCHIVED' | 'ALL';
export type ManagementAction = TeamManagementAction;
export type Transfer = ReturnType<typeof transferDetailSchema.parse>;
export class TeamsApi {
    constructor(private readonly auth: AuthApi) { }
    list(workspace: string, status: TeamFilter, signal: AbortSignal, after?: string) { const query = new URLSearchParams({ limit: '20', status }); if (after)
        query.set('after', after); return this.auth.teamRead('/' + workspace + '/teams?' + query, teamPageSchema, signal).then(page => { if (page.items.length > 20 || page.page.hasMore !== !!page.page.nextCursor || page.items.some(t => t.workspaceId !== workspace))
        throw new Error('Invalid Team page'); return page; }); }
    members(workspace:string,id:string,signal:AbortSignal,after?:string){const query=new URLSearchParams({limit:'20',status:'ALL'});if(after)query.set('after',after);return this.auth.teamRead('/'+workspace+'/teams/'+id+'/memberships?'+query,teamMemberPageSchema,signal).then(page=>{if(page.items.length>20||new Set(page.items.map(m=>m.membershipId)).size!==page.items.length||page.page.hasMore!==!!page.page.nextCursor||(page.page.hasMore&&!page.items.length))throw Error('Invalid member page');return page;});}
    candidates(workspace:string,signal:AbortSignal,after?:string){return new AdministrationApi(this.auth).members(workspace,{status:'ACTIVE',search:'',role:'ALL',teamId:'ALL'},signal,after).then(p=>{if(p.items.length>20||new Set(p.items.map(m=>m.id)).size!==p.items.length||p.page.hasMore!==!!p.page.nextCursor)throw Error('Invalid candidate page');return {items:p.items.map(m=>({id:m.id,name:m.displayName,role:m.role,status:m.status})),page:p.page};});}
    transfer(workspace:string,team:string,request:string,signal:AbortSignal){return this.auth.teamRead('/'+workspace+'/teams/'+team+'/ownership-transfer-requests/'+request,transferDetailSchema,signal).then(value=>{if(value.teamId!==team||value.requestId!==request)throw Error('Invalid transfer scope');return value;});}
    manage(workspace:string,team:string,action:ManagementAction,body:Record<string,unknown>,target:string|undefined,key:string,match:string,signal:AbortSignal){
        const root='/'+workspace+'/teams/'+team;
        const memberResult=(r:ReturnType<typeof teamMemberMutationSchema.parse>)=>{if(r.membershipId!==(action==='add'?body.membershipId:target))throw Error('Invalid member mutation scope');return r;};
        const consentResult=<T extends {requestId:string}>(r:T)=>{if(r.requestId!==target)throw Error('Invalid consent scope');return r;};
        if(action==='add')return this.auth.teamManage(root+'/memberships',teamMemberMutationSchema,teamMemberAddSchema.parse(body),key,match,signal,undefined,true).then(memberResult);
        if(action==='role'||action==='remove')return this.auth.teamManage(root+'/memberships/'+target,teamMemberMutationSchema,action==='remove'?undefined:teamMemberRoleSchema.parse(body),key,match,signal,action==='remove'?'DELETE':'PATCH').then(memberResult);
        if(action==='request')return this.auth.teamManage(root+'/ownership-transfer-requests',transferRecordedSchema,transferRequestSchema.parse(body),key,match,signal,undefined,true);
        if(action==='accept')return this.auth.teamManage(root+'/ownership-transfer-requests/'+target+'/accept',transferAcceptedSchema,emptyAuthSchema.parse(body),key,match,signal).then(consentResult);
        if(action==='reject')return this.auth.teamManage(root+'/ownership-transfer-requests/'+target+'/reject',transferRejectedSchema,emptyAuthSchema.parse(body),key,match,signal).then(consentResult);
        return this.auth.teamManage(root+'/'+action,teamDetailSchema,emptyAuthSchema.parse(body),key,match,signal).then(t=>{if(t.id!==team||t.workspaceId!==workspace||t.status!==(action==='archive'?'ARCHIVED':'ACTIVE'))throw Error('Invalid Team scope');return t;});
    }
    detail(workspace: string, id: string, signal: AbortSignal) { return this.auth.teamRead('/' + workspace + '/teams/' + id, teamDetailSchema, signal).then(team => { if (team.workspaceId !== workspace || team.id !== id)
        throw new Error('Invalid Team scope'); return team; }); }
    create(workspace: string, body: CreateInput, key: string, signal: AbortSignal) { return this.auth.teamCreate('/' + workspace + '/teams', teamDetailSchema, createTeamSchema.parse(body), key, signal).then(team => { if (team.workspaceId !== workspace)
        throw new Error('Invalid Team scope'); return team; }); }
    update(workspace: string, id: string, body: PatchInput, key: string, match: string, signal: AbortSignal) { return this.auth.teamUpdate('/' + workspace + '/teams/' + id, teamDetailSchema, patchTeamSchema.parse(body), key, match, signal).then(team => { if (team.workspaceId !== workspace || team.id !== id)
        throw new Error('Invalid Team scope'); return team; }); }
}
