import type { Request } from 'express';
import { Tenancy, WorkspaceFault, AuthUnavailableError } from '@unblok/database';
import type { CreateWorkspaceInput, WorkspaceQuery, WorkspaceMembershipQuery, WorkspaceInvitationInput } from '@unblok/contracts';
import { Sessions } from '../../sessions';

export { WorkspaceFault };
export class WorkspaceRateError extends Error { constructor(readonly retryAfter: number) { super('Rate exceeded'); } }
export class Workspaces {
  constructor(private readonly sessions: Sessions, private readonly tenancy: Tenancy, private readonly limits?: { consume(actor: string, ip: string): Promise<{ allowed: boolean; retryAfter: number }> }, private readonly invitations?: {consume(action:'issue'|'accept',actor:string,ip:string,workspace?:string):Promise<{allowed:boolean;retryAfter:number}>}) {}
  create(req: Request, input: CreateWorkspaceInput, key: string) {
    return this.sessions.withRequest(req, async principal => {
      if (!this.limits) throw new AuthUnavailableError();
      const actor = await this.tenancy.currentUser(principal);
      const budget = await this.limits.consume(actor.id, req.ip ?? req.socket.remoteAddress ?? 'unknown');
      if (!budget.allowed) throw new WorkspaceRateError(budget.retryAfter);
      return this.tenancy.createWorkspace(principal, { ...input, key });
    });
  }
  list(req: Request, query: WorkspaceQuery) {
    const discovery: Parameters<Tenancy['discoverWorkspaces']>[1] = { limit: query.limit, sort: query.sort };
    if (query.after !== undefined) discovery.after = query.after;
    return this.sessions.withRequest(req, principal => this.tenancy.discoverWorkspaces(principal, discovery));
  }
  memberships(req:Request,id:string,query:WorkspaceMembershipQuery){return this.sessions.withRequest(req,p=>this.tenancy.memberships(p,id,query));}
  invite(req:Request,id:string,input:WorkspaceInvitationInput,key:string){return this.sessions.withRequest(req,async p=>{
    if(!this.invitations)throw new AuthUnavailableError();const actor=await this.tenancy.currentUser(p),context=await this.tenancy.workspaceContext(p,id);
    if(!actor.emailVerified||context.self.role!=='ADMIN'||context.workspace.status!=='ACTIVE')throw new WorkspaceFault('NOT_FOUND');
    const budget=await this.invitations.consume('issue',actor.id,req.ip??req.socket.remoteAddress??'unknown',id);if(!budget.allowed)throw new WorkspaceRateError(budget.retryAfter);
    await this.tenancy.issueInvitation(p,id,{...input,key});return {status:'accepted' as const};
  });}
  accept(req:Request,token:string,key:string){return this.sessions.withRequest(req,async p=>{
    if(!this.invitations)throw new AuthUnavailableError();const actor=await this.tenancy.currentUser(p),budget=await this.invitations.consume('accept',actor.id,req.ip??req.socket.remoteAddress??'unknown');if(!budget.allowed)throw new WorkspaceRateError(budget.retryAfter);
    await this.tenancy.acceptInvitation(p,token,key);return {status:'accepted' as const};
  });}
  detail(req: Request, id: string) { return this.sessions.withRequest(req, principal => this.tenancy.workspaceContext(principal, id)); }
  me(req: Request, id: string) { return this.sessions.withRequest(req, async principal => (await this.tenancy.workspaceContext(principal, id)).self); }
}
