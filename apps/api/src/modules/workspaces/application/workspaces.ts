import type { Request } from 'express';
import { Tenancy, WorkspaceFault, AuthUnavailableError } from '@unblok/database';
import type { CreateWorkspaceInput, WorkspaceQuery } from '@unblok/contracts';
import { Sessions } from '../../sessions';

export { WorkspaceFault };
export class WorkspaceRateError extends Error { constructor(readonly retryAfter: number) { super('Rate exceeded'); } }
export class Workspaces {
  constructor(private readonly sessions: Sessions, private readonly tenancy: Tenancy, private readonly limits?: { consume(actor: string, ip: string): Promise<{ allowed: boolean; retryAfter: number }> }) {}
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
  detail(req: Request, id: string) { return this.sessions.withRequest(req, principal => this.tenancy.workspaceContext(principal, id)); }
  me(req: Request, id: string) { return this.sessions.withRequest(req, async principal => (await this.tenancy.workspaceContext(principal, id)).self); }
}
