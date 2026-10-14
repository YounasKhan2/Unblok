import type { Request } from 'express';
import { Tenancy, AuthUnavailableError, TeamFault } from '@unblok/database';
import type { CreateTeamInput, PatchTeamInput, TeamListQuery,TeamMemberQuery,TeamManagementAction,TeamManagementInput } from '@unblok/contracts';
import { Sessions } from '../../sessions';
export class TeamRateError extends Error {constructor(readonly retryAfter:number){super('Rate exceeded');}}
export class Teams {
  constructor(private readonly sessions:Sessions,private readonly tenancy:Tenancy,private readonly limits:{consume(action:'create'|'update'|'read'|'manage',actor:string,workspace:string):Promise<{allowed:boolean;retryAfter:number}>}){}
  private run<T>(req:Request,workspace:string,action:'create'|'update'|'read'|'manage',work:(principal:Parameters<Tenancy['currentUser']>[0])=>Promise<T>){return this.sessions.withRequest(req,async p=>{
    if(!this.limits)throw new AuthUnavailableError();const actor=await this.tenancy.currentUser(p);
    // Scope authorization before admission metadata; capability revalidates under primary locks.
    await this.tenancy.workspaceContext(p,workspace);
    const budget=await this.limits.consume(action,actor.id,workspace);if(!budget.allowed)throw new TeamRateError(budget.retryAfter);return work(p);
  });}
  list(req:Request,workspace:string,query:TeamListQuery){return this.run(req,workspace,'read',p=>this.tenancy.listTeams(p,workspace,query));}
  detail(req:Request,workspace:string,id:string){return this.run(req,workspace,'read',p=>this.tenancy.detailTeam(p,workspace,id));}
  create(req:Request,workspace:string,input:CreateTeamInput,key:string){return this.run(req,workspace,'create',p=>this.tenancy.createTeam(p,workspace,input,key));}
  update(req:Request,workspace:string,id:string,input:PatchTeamInput,key:string,match?:string){return this.run(req,workspace,'update',p=>this.tenancy.updateTeam(p,workspace,id,input,key,match));}
  members(req:Request,workspace:string,team:string,query:TeamMemberQuery){return this.run(req,workspace,'read',p=>this.tenancy.teamMembers(p,workspace,team,query));}
  transfer(req:Request,workspace:string,team:string,request:string){return this.run(req,workspace,'read',p=>this.tenancy.teamTransferDetail(p,workspace,team,request));}
  manage(req:Request,workspace:string,team:string,action:TeamManagementAction,input:TeamManagementInput,key:string,target?:string,match?:string){return this.run(req,workspace,'manage',p=>this.tenancy.teamManage(p,workspace,team,action,input,key,target,match));}

}

export { TeamFault };
