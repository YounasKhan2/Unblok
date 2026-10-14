import type { Request } from 'express';
import { Tenancy, AuthUnavailableError, TeamFault } from '@unblok/database';
import type { CreateTeamInput, PatchTeamInput, TeamListQuery } from '@unblok/contracts';
import { Sessions } from '../../sessions';
export class TeamRateError extends Error {constructor(readonly retryAfter:number){super('Rate exceeded');}}
export class Teams {
  constructor(private readonly sessions:Sessions,private readonly tenancy:Tenancy,private readonly limits:{consume(action:'create'|'update'|'read',actor:string,workspace:string):Promise<{allowed:boolean;retryAfter:number}>}){}
  private run<T>(req:Request,workspace:string,action:'create'|'update'|'read',work:(principal:Parameters<Tenancy['currentUser']>[0])=>Promise<T>){return this.sessions.withRequest(req,async p=>{
    if(!this.limits)throw new AuthUnavailableError();const actor=await this.tenancy.currentUser(p);
    // Scope authorization before admission metadata; capability revalidates under primary locks.
    await this.tenancy.workspaceContext(p,workspace);
    const budget=await this.limits.consume(action,actor.id,workspace);if(!budget.allowed)throw new TeamRateError(budget.retryAfter);return work(p);
  });}
  list(req:Request,workspace:string,query:TeamListQuery){return this.run(req,workspace,'read',p=>this.tenancy.listTeams(p,workspace,query));}
  detail(req:Request,workspace:string,id:string){return this.run(req,workspace,'read',p=>this.tenancy.detailTeam(p,workspace,id));}
  create(req:Request,workspace:string,input:CreateTeamInput,key:string){return this.run(req,workspace,'create',p=>this.tenancy.createTeam(p,workspace,input,key));}
  update(req:Request,workspace:string,id:string,input:PatchTeamInput,key:string,match?:string){return this.run(req,workspace,'update',p=>this.tenancy.updateTeam(p,workspace,id,input,key,match));}
}

export { TeamFault };
