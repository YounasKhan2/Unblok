import { createTeamSchema, patchTeamSchema } from '@unblok/contracts';
import { AuthApiError } from '../../auth/api/authApi';
import { SessionStore } from '../../auth/session/SessionStore';
import { WorkspaceStore } from '../../workspaces/live/WorkspaceStore';
import { TeamsApi, type TeamPage, type LiveTeam, type TeamFilter, type CreateInput, type PatchInput } from './TeamsApi';
import type { TeamJournal, TeamAttempt } from './TeamJournal';
export interface TeamsState {
    workspace: string;
    page: TeamPage | null;
    team: LiveTeam | null;
    filter: TeamFilter;
    loading: boolean;
    opening: boolean;
    sending: boolean;
    allowed: boolean;
    canCreate: boolean;
    error: string;
    detailError: string;
    mutationError: string;
    attempt: TeamAttempt | undefined;
    blocked: boolean;
    conflict: boolean;
    retryAfter: number;
    notice: string;
}
const empty = (): TeamsState => ({ workspace: '', page: null, team: null, filter: 'ACTIVE', loading: false, opening: false, sending: false, allowed: false, canCreate: false, error: '', detailError: '', mutationError: '', attempt: undefined, blocked: false, conflict: false, retryAfter: 0, notice: '' });
export class TeamsStore {
    private state = empty();
    private listeners = new Set<() => void>();
    // Server context hints gate the UI; every API call still requires live server authority.
    private identity = '';
    private actor = '';
    private logout = 0;
    private version = 0;
    private target: string | undefined;
    private read?: AbortController;
    private detailRead?: AbortController;
    private mutation?: AbortController;
    constructor(private readonly session: SessionStore, private readonly workspaces: WorkspaceStore, private readonly api = new TeamsApi(session.api), private readonly journal?: TeamJournal, private readonly key = () => crypto.randomUUID()) { this.logout = session.explicitLogoutGeneration(); }
    snapshot = () => this.state;
    subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; };
    private publish(change: Partial<TeamsState>) { this.state = { ...this.state, ...change }; for (const fn of this.listeners)
        fn(); }
    private abort() { this.read?.abort(); this.detailRead?.abort(); this.mutation?.abort(); }
    start() { this.sync(); const off = [this.session.subscribe(() => this.sync()), this.workspaces.subscribe(() => this.sync())]; return () => { off.forEach(f => f()); this.version++; this.identity = ''; this.abort(); }; }
    private restoreAttempt() { try {
        const attempt = this.journal?.read(this.actor, this.state.workspace, this.target);
        this.publish({ attempt, conflict: attempt?.operation === 'update' && !!attempt.conflict });
    }
    catch {
        this.publish({ blocked: true, mutationError: 'Request history is unavailable. Check this Team before starting another request.' });
    } }
    private sync() {
        const s = this.session.snapshot(), w = this.workspaces.snapshot(), actor = s.status === 'authenticated' ? s.user!.id : '';
        if (this.logout !== this.session.explicitLogoutGeneration() || actor && this.actor && actor !== this.actor) {
            try {
                this.journal?.clear();
            }
            catch { }
            this.actor = '';
        }
        this.logout = this.session.explicitLogoutGeneration();
        if (actor)
            this.actor = actor;
        const c = w.context, allowed = !!actor && !s.pending && !!c && w.selected === c.workspace.id && c.self.membershipStatus === 'ACTIVE';
        const identity = allowed ? `${actor}:${this.session.generation()}:${c!.workspace.id}:${c!.self.membershipId}:${c!.self.role}:${c!.self.membershipStatus}:${c!.workspace.status}` : '';
        if (identity === this.identity)
            return;
        const previous = this.state.workspace;
        this.identity = identity;
        this.version++;
        this.abort();
        this.state = empty();
        if (allowed) {
            if (previous && previous !== c!.workspace.id)
                this.target = undefined;
            this.publish({ workspace: c!.workspace.id, allowed: true, canCreate: c!.self.role === 'ADMIN' && c!.workspace.status === 'ACTIVE' });
            this.restoreAttempt();
            if (this.target)
                void this.open(this.target);
            else
                void this.load();
        }
        else
            this.publish({});
    }
    route(id?: string) { if (this.target === id)
        return; this.target = id; this.version++; this.abort(); this.publish({ page: null, team: null, loading: false, opening: false, sending: false, detailError: '', mutationError: '', attempt: undefined, conflict: false, blocked: false, notice: '' }); if (this.state.allowed) {
        this.restoreAttempt();
        if (id)
            void this.open(id);
        else
            void this.load();
    } }
    // Aborting transport alone cannot prove cancellation or prevent a late completion.
    private current(version: number, c: AbortController) { return !!this.identity && version === this.version && !c.signal.aborted; }
    async load(next = false) {
        if (!this.state.allowed)
            return;
        const after = next ? this.state.page?.page.nextCursor : undefined;
        if (next && !after)
            return;
        this.read?.abort();
        const c = this.read = new AbortController(), v = this.version, ws = this.state.workspace;
        this.publish({ loading: true, page: null, error: '' });
        try {
            const page = await this.api.list(ws, this.state.filter, c.signal, after ?? undefined);
            if (this.current(v, c))
                this.publish({ page });
        }
        catch (e) {
            if (this.current(v, c)) {
                const a = e instanceof AuthApiError ? e : undefined;
                this.publish({ error: a?.code === 'CURSOR_STALE' ? 'Team access or the list changed. Reload to continue.' : a?.message ?? 'Teams are unavailable. Please try again.' });
                if (a?.status === 404)
                    this.workspaces.invalidateSelection(ws);
            }
        }
        finally {
            if (this.current(v, c))
                this.publish({ loading: false });
        }
    }
    filter(filter: TeamFilter) { this.publish({ filter }); void this.load(); }
    // Retain only within this exact route while refreshing the edit capability.
    // update() stays closed until the fresh response completes.
    async open(id: string, retain = false) {
        if (!this.state.allowed || this.target !== id)
            return;
        this.detailRead?.abort();
        const c = this.detailRead = new AbortController(), v = this.version;
        this.publish({ opening: true, team: retain ? this.state.team : null, detailError: '' });
        try {
            const team = await this.api.detail(this.state.workspace, id, c.signal);
            if (this.current(v, c) && this.target === id)
                this.publish({ team });
        }
        catch (e) {
            if (this.current(v, c))
                this.publish({ team: null, detailError: e instanceof AuthApiError ? e.message : 'This Team is unavailable.' });
        }
        finally {
            if (this.current(v, c))
                this.publish({ opening: false });
        }
    }
    async create(input: CreateInput) { if (!this.state.canCreate)
        return null; return this.send(createTeamSchema.parse(input)); }
    async update(input: PatchInput) { if (this.state.opening || !this.state.team?.capabilities.updateMetadata || this.state.conflict)
        return null; return this.send(patchTeamSchema.parse(input), this.state.team); }
    // Journal first. Unknown outcomes keep the same body/key/original precondition.
    private async send(body: CreateInput | PatchInput, team?: LiveTeam) {
        if (!this.state.allowed || this.state.sending || this.state.blocked || Date.now() < this.state.retryAfter)
            return null;
        const attempt = this.state.attempt ?? (team ? { operation: 'update' as const, actor: this.actor, workspace: this.state.workspace, team: team.id, key: this.key(), body: body as PatchInput, match: `"team-${team.version}"` } : { operation: 'create' as const, actor: this.actor, workspace: this.state.workspace, key: this.key(), body: body as CreateInput });
        if (JSON.stringify(attempt.body) !== JSON.stringify(body) || attempt.operation !== (team ? 'update' : 'create'))
            return null;
        try {
            if (!this.journal)
                throw new Error('No journal');
            this.journal.write(attempt);
        }
        catch {
            this.publish({ blocked: true, mutationError: 'We couldn’t save this request for a safe retry.' });
            return null;
        }
        this.read?.abort();
        this.detailRead?.abort();
        const c = this.mutation = new AbortController(), v = this.version;
        this.publish({ attempt, sending: true, loading: false, opening: false, mutationError: '', notice: '' });
        try {
            const result = attempt.operation === 'create' ? await this.api.create(attempt.workspace, attempt.body, attempt.key, c.signal) : await this.api.update(attempt.workspace, attempt.team, attempt.body, attempt.key, attempt.match, c.signal);
            if (!this.current(v, c))
                return null;
            try {
                this.journal.remove(attempt);
            }
            catch {
                this.publish({ blocked: true, mutationError: 'The response was confirmed, but retry history could not be cleared.' });
                return null;
            }
            this.publish({ attempt: undefined, conflict: false, team: attempt.operation === 'update' ? result : this.state.team, notice: attempt.operation === 'create' ? 'Team created.' : 'Team metadata saved.' });
            if (!this.target)
                void this.load();
            return result;
        }
        catch (e) {
            if (this.current(v, c)) {
                const a = e instanceof AuthApiError ? e : undefined;
                this.publish({ mutationError: a?.message ?? 'The result is uncertain. Retry keeps the original request.', retryAfter: a?.retryAfter ? Date.now() + a.retryAfter * 1000 : 0 });
                if (a?.status === 412 && attempt.operation === 'update') {
                    try {
                        this.journal.write({ ...attempt, conflict: true });
                        this.publish({ attempt: { ...attempt, conflict: true }, conflict: true });
                    }
                    catch {
                        this.publish({ blocked: true });
                    }
                    void this.open(attempt.team);
                }
                if (a?.status === 404 || a?.status === 403) {
                    this.publish({ team: null });
                    if (attempt.operation === 'update')
                        void this.open(attempt.team);
                    else
                        void this.workspaces.select(attempt.workspace);
                }
                if (a?.status === 400) {
                    try {
                        this.journal.remove(attempt);
                        this.publish({ attempt: undefined });
                    }
                    catch {
                        this.publish({ blocked: true });
                    }
                }
            }
        }
        finally {
            if (this.current(v, c))
                this.publish({ sending: false });
        }
        return null;
    }
    // This is an explicit user decision; the subsequent submit allocates a fresh key.
    resolveConflict() { if (!this.state.conflict || !this.state.team?.capabilities.updateMetadata || this.state.sending || !this.state.attempt)
        return; try {
        this.journal?.remove(this.state.attempt);
        this.publish({ attempt: undefined, conflict: false, mutationError: 'Review your retained draft. Submit explicitly against the refreshed version.' });
    }
    catch {
        this.publish({ blocked: true });
    } }
}
