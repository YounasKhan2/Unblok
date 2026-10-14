import { createTeamSchema, patchTeamSchema, teamDetailSchema, teamPageSchema } from '@unblok/contracts';
import { AuthApi } from '../../auth/api/authApi';
export type LiveTeam = ReturnType<typeof teamDetailSchema.parse>;
export type TeamPage = ReturnType<typeof teamPageSchema.parse>;
export type CreateInput = ReturnType<typeof createTeamSchema.parse>;
export type PatchInput = ReturnType<typeof patchTeamSchema.parse>;
export type TeamFilter = 'ACTIVE' | 'ARCHIVED' | 'ALL';
export class TeamsApi {
    constructor(private readonly auth: AuthApi) { }
    list(workspace: string, status: TeamFilter, signal: AbortSignal, after?: string) { const query = new URLSearchParams({ limit: '20', status }); if (after)
        query.set('after', after); return this.auth.teamRead('/' + workspace + '/teams?' + query, teamPageSchema, signal).then(page => { if (page.items.length > 20 || page.page.hasMore !== !!page.page.nextCursor || page.items.some(t => t.workspaceId !== workspace))
        throw new Error('Invalid Team page'); return page; }); }
    detail(workspace: string, id: string, signal: AbortSignal) { return this.auth.teamRead('/' + workspace + '/teams/' + id, teamDetailSchema, signal).then(team => { if (team.workspaceId !== workspace || team.id !== id)
        throw new Error('Invalid Team scope'); return team; }); }
    create(workspace: string, body: CreateInput, key: string, signal: AbortSignal) { return this.auth.teamCreate('/' + workspace + '/teams', teamDetailSchema, createTeamSchema.parse(body), key, signal).then(team => { if (team.workspaceId !== workspace)
        throw new Error('Invalid Team scope'); return team; }); }
    update(workspace: string, id: string, body: PatchInput, key: string, match: string, signal: AbortSignal) { return this.auth.teamUpdate('/' + workspace + '/teams/' + id, teamDetailSchema, patchTeamSchema.parse(body), key, match, signal).then(team => { if (team.workspaceId !== workspace || team.id !== id)
        throw new Error('Invalid Team scope'); return team; }); }
}
