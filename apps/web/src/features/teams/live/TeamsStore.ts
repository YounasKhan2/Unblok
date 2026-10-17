import type {ManagementAction,Transfer} from './TeamsApi';
import { createTeamSchema, patchTeamSchema } from '@unblok/contracts';
import { AuthApiError } from '../../auth/api/authApi';
import { SessionStore } from '../../auth/session/SessionStore';
import { WorkspaceStore } from '../../workspaces/live/WorkspaceStore';
import { TeamsApi, type TeamPage, type MemberPage, type LiveTeam, type TeamFilter, type CreateInput, type PatchInput } from './TeamsApi';
import type { TeamJournal, TeamAttempt, ManagementAttempt } from './TeamJournal';
export interface TeamsState {
    settingsActive:TeamPage|null;
    settingsArchived:TeamPage|null;
    managementAllowed:boolean;
    managementAttempt:ManagementAttempt|undefined;
    transfer:Transfer|null;
    transferRequest:string;
    sharedRequest:string;
    candidates:Awaited<ReturnType<TeamsApi['candidates']>>|null;
    managementError:string;
    workspace: string;
    page: TeamPage | null;
    team: LiveTeam | null;
    members: MemberPage | null;
    membersLoading:boolean;
    membersError:string;
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
const empty = (): TeamsState => ({ settingsActive:null,settingsArchived:null,managementAllowed:false,managementAttempt:undefined,transfer:null,transferRequest:'',sharedRequest:'',candidates:null,managementError:'',workspace: '', page: null, team: null, members:null, membersLoading:false, membersError:'', filter: 'ACTIVE', loading: false, opening: false, sending: false, allowed: false, canCreate: false, error: '', detailError: '', mutationError: '', attempt: undefined, blocked: false, conflict: false, retryAfter: 0, notice: '' });
export class TeamsStore {
    private state = empty();
    private listeners = new Set<() => void>();
    // Server context hints gate the UI; every API call still requires live server authority.
    private identity = '';
    private actor = '';
    private membership = '';
    private membersRead?:AbortController;
    private memberCursors = new Set<string>();
    private version = 0;
    private target: string | undefined;
    private managementRead?:AbortController;
    private settingsReads:Partial<Record<'ACTIVE'|'ARCHIVED',AbortController>>={};
    private read?: AbortController;
    private detailRead?: AbortController;
    private mutation?: AbortController;
    constructor(private readonly session: SessionStore, private readonly workspaces: WorkspaceStore, private readonly api = new TeamsApi(session.api), private readonly journal?: TeamJournal, private readonly key = () => crypto.randomUUID()) {}
    snapshot = () => this.state;
    subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; };
    private publish(change: Partial<TeamsState>) { this.state = { ...this.state, ...change }; for (const fn of this.listeners)
        fn(); }
    private abort() { Object.values(this.settingsReads).forEach(c=>c?.abort()); this.read?.abort(); this.detailRead?.abort(); this.mutation?.abort(); this.membersRead?.abort(); this.managementRead?.abort(); this.memberCursors.clear(); }
    start() { this.sync(); const off = [this.session.subscribe(() => this.sync()), this.workspaces.subscribe(() => this.sync())]; return () => { off.forEach(f => f()); this.version++; this.identity = ''; this.abort(); }; }
    private restoreAttempt() { try {
        const attempt = this.journal?.read(this.actor, this.state.workspace, this.target, this.membership);
        this.publish({ managementAttempt:this.target?this.journal?.readManagement(this.actor,this.state.workspace,this.target,this.membership):undefined,attempt, conflict: attempt?.operation === 'update' && !!attempt.conflict });
    }
    catch {
        this.publish({ blocked: true, mutationError: 'Request history is unavailable. Check this Team before starting another request.' });
    } }
    private sync() {
        const s = this.session.snapshot(), w = this.workspaces.snapshot(), actor = s.status === 'authenticated' ? s.user!.id : '';
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
        this.membership=allowed?c!.self.membershipId:'';
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
        return; this.target = id; this.version++; this.abort(); this.publish({managementAllowed:false,managementAttempt:undefined,transfer:null,transferRequest:'',sharedRequest:'',candidates:null,managementError:'', page: null, team: null, members:null,membersLoading:false,membersError:'', loading: false, opening: false, sending: false, detailError: '', mutationError: '', attempt: undefined, conflict: false, blocked: false, notice: '' }); if (this.state.allowed) {
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
        this.detailRead?.abort();this.membersRead?.abort();
        const c = this.detailRead = new AbortController(), v = this.version;
        this.publish({ managementAllowed:false, opening: true, team: retain ? this.state.team : null, members:null,membersLoading:false,membersError:'', detailError: '' });
        try {
            const team = await this.api.detail(this.state.workspace, id, c.signal);
            if (this.current(v, c) && this.target === id)
                this.publish({ team });
        }
        catch (e) {
            if (this.current(v, c))
                this.publish({ team: null, members:null,detailError: e instanceof AuthApiError ? e.message : 'This Team is unavailable.' });
        }
        finally {
            if (this.current(v, c))
                {this.publish({ opening: false });if(this.state.team)void this.loadMembers();}
        }
    }
    async loadMembers(next = false) {
        const team = this.state.team;
        if (!team || !this.state.allowed || this.state.opening || this.state.membersLoading) return;
        const previous = next ? this.state.members : null;
        const after = previous?.page.nextCursor;
        if (next && (!previous?.page.hasMore || !after)) return;
        if (!next) this.memberCursors.clear();
        this.membersRead?.abort();
        const c = this.membersRead = new AbortController(), v = this.version, workspace = this.state.workspace;
        this.publish({ members: previous, membersLoading: true, membersError: '' });
        try {
            const page = await this.api.members(workspace, team.id, c.signal, after ?? undefined);
            if (!this.current(v, c) || this.state.team?.id !== team.id) return;
            const ids = new Set(previous?.items.map(m => m.membershipId));
            for (const member of page.items) {
                if (ids.has(member.membershipId)) throw Error('Invalid member continuation');
                ids.add(member.membershipId);
            }
            const cursor = page.page.nextCursor;
            if (cursor && (cursor === after || this.memberCursors.has(cursor))) throw Error('Invalid member continuation');
            if (after) this.memberCursors.add(after);
            this.publish({ managementAllowed:true,members: { items: [...(previous?.items ?? []), ...page.items], page: page.page } });
        } catch (e) {
            if (this.current(v, c)) {
                const denied = e instanceof AuthApiError && [401, 403, 404, 409].includes(e.status);
                // Keep only already validated rows on transport/invalid-continuation failure.
                // Stop continuation until an explicit fresh reload; authority loss clears everything.
                this.publish({ managementAllowed:false,members: previous && !denied ? { items: previous.items, page: { hasMore: false, nextCursor: null } } : null,
                    membersError: 'Team membership details are unavailable.' });
            }
        } finally {
            if (this.current(v, c)) this.publish({ membersLoading: false });
        }
    }
    async checkManagementAccess(){
        if(!this.state.allowed||!this.state.team||this.state.sending||this.state.opening)return false;
        this.managementRead?.abort();this.membersRead?.abort();
        const c=this.managementRead=new AbortController(),v=this.version,id=this.state.team.id,previousVersion=this.state.team.version;
        this.publish({opening:true,membersLoading:false,managementError:''});
        try{const team=await this.api.detail(this.state.workspace,id,c.signal),members=await this.api.members(this.state.workspace,id,c.signal);
            if(!this.current(v,c)||this.state.team?.id!==id)return false;
            if(team.version!==previousVersion)this.memberCursors.clear();
            const updates=new Map(members.items.map(m=>[m.membershipId,m]));
            const projection=team.version===previousVersion&&this.state.members?{items:this.state.members.items.map(m=>updates.get(m.membershipId)??m),page:this.state.members.page}:members;
            this.publish({team,managementAllowed:true,members:projection,candidates:null});return true;
        }catch(e){if(this.current(v,c)){
            const denied=e instanceof AuthApiError&&[403,404].includes(e.status);
            this.publish({managementAllowed:false,members:null,candidates:null,transfer:null,managementError:e instanceof AuthApiError?e.message:'Team management access is unavailable.',retryAfter:e instanceof AuthApiError&&e.retryAfter?Date.now()+e.retryAfter*1000:0});
            if(denied){this.publish({team:null,page:null,settingsActive:null,settingsArchived:null});void this.open(id);}
        }return false;}
        finally{if(this.current(v,c))this.publish({opening:false});}
    }
    async loadSettings(status:'ACTIVE'|'ARCHIVED',next=false){
        if(!this.state.allowed)return;const field=status==='ACTIVE'?'settingsActive':'settingsArchived',after=next?this.state[field]?.page.nextCursor:undefined;if(next&&!after)return;
        this.settingsReads[status]?.abort();const c=this.settingsReads[status]=new AbortController(),v=this.version;
        this.publish({[field]:null});
        try{const page=await this.api.list(this.state.workspace,status,c.signal,after??undefined);if(this.current(v,c))this.publish({[field]:page});}catch(e){if(this.current(v,c))this.publish({error:e instanceof AuthApiError?e.message:'Teams are unavailable.'});}
    }
    async loadCandidates(next=false){
        if(!this.state.managementAllowed||!this.state.team||this.state.sending)return;
        const after=next?this.state.candidates?.page.nextCursor:undefined;if(next&&!after)return;
        this.managementRead?.abort();const c=this.managementRead=new AbortController(),v=this.version;
        this.publish({candidates:null,managementError:''});
        try{const candidates=await this.api.candidates(this.state.workspace,c.signal,after??undefined);if(this.current(v,c))this.publish({candidates});}
        catch(e){if(this.current(v,c)){this.publish({managementError:e instanceof AuthApiError?e.message:'Eligible Workspace members are unavailable.',retryAfter:e instanceof AuthApiError&&e.retryAfter?Date.now()+e.retryAfter*1000:0});if(e instanceof AuthApiError&&[403,404].includes(e.status)){const id=this.state.team?.id;this.publish({managementAllowed:false,team:null,members:null,page:null,settingsActive:null,settingsArchived:null,candidates:null,transfer:null});if(id)void this.open(id);}}}
    }
    async loadTransfer(request:string){
        if(!this.state.allowed||!this.state.team||this.state.sending)return false;
        this.managementRead?.abort();const c=this.managementRead=new AbortController(),v=this.version,team=this.state.team.id;
        this.publish({opening:true,transfer:this.state.transferRequest===request?this.state.transfer:null,transferRequest:request,managementError:''});
        try{const transfer=await this.api.transfer(this.state.workspace,team,request,c.signal);if(this.current(v,c)&&this.state.team?.id===team){this.publish({transfer});return true;}}
        catch(e){if(this.current(v,c))this.publish({transfer:null,managementError:e instanceof AuthApiError&&e.status===429?e.message:'This ownership request is unavailable.',retryAfter:e instanceof AuthApiError&&e.retryAfter?Date.now()+e.retryAfter*1000:0});}
        finally{if(this.current(v,c))this.publish({opening:false});}
        return false;
    }
    async manage(action:ManagementAction,body:Record<string,unknown>={},target?:string){
        if(!this.state.allowed||!this.state.team||this.state.sending||this.state.blocked||this.state.attempt||Date.now()<this.state.retryAfter)return null;
        const team=this.state.team,v=this.version,old=this.state.managementAttempt;
        if(old&&(old.action!==action||old.target!==target||JSON.stringify(old.body)!==JSON.stringify(body)))return null;
        if(old?.conflict)return null;
        this.membersRead?.abort();this.detailRead?.abort();this.managementRead?.abort();
        const c=this.mutation=new AbortController();this.publish({sending:true,membersLoading:false,managementAllowed:false,managementError:'',notice:''});
        try{
            // Fresh private owner read is a provisional UI check, never a mutation grant.
            const fresh=old?team:await this.api.detail(this.state.workspace,team.id,c.signal);
            if(!old&&(action==='accept'||action==='reject')){
                const consent=await this.api.transfer(this.state.workspace,team.id,target!,c.signal);
                if(!this.current(v,c))return null;this.publish({transfer:consent});
                if(!old&&(consent.state!=='PENDING'||consent.successorMembershipId!==this.membership||fresh.version!==consent.baseTeamVersion))throw Error('This ownership request is not available for a new decision.');
            }else if(!old) await this.api.members(this.state.workspace,team.id,c.signal);
            if(!this.current(v,c))return null;
            if(!old&&fresh.status!=='ACTIVE'&&action!=='restore')throw Error('Archived Teams do not support this change.');
            const attempt:ManagementAttempt=old??{operation:'manage',action,actor:this.actor,membership:this.membership,workspace:this.state.workspace,team:team.id,key:this.key(),body,match:'"team-'+fresh.version+'"',...(target?{target}:{})};
            if(!this.journal)throw Error('Request history is unavailable.');this.journal.write(attempt);this.publish({managementAttempt:attempt});
            const result=await this.api.manage(attempt.workspace,attempt.team,attempt.action,attempt.body,attempt.target,attempt.key,attempt.match,c.signal);
            if(!this.current(v,c))return null;
            this.journal.remove(attempt);
            this.read?.abort();Object.values(this.settingsReads).forEach(read=>read?.abort());
            this.publish({page:null,settingsActive:null,settingsArchived:null,managementAttempt:undefined,managementAllowed:false,members:null,candidates:null,transfer:null,sharedRequest:'requestId' in result&&action==='request'?result.requestId:'',notice:'outcome' in result?'Team request: '+result.outcome+'.':action==='archive'?'Archive request confirmed. Current Team state is reloaded.':'Restore request confirmed. Current Team state is reloaded.'});
            void this.open(team.id);return result;
        }catch(e){if(this.current(v,c)){
            const a=e instanceof AuthApiError?e:undefined;
            this.publish({managementError:a?.message??(e instanceof Error?e.message:'The result is uncertain. Retry the same request.'),retryAfter:a?.retryAfter?Date.now()+a.retryAfter*1000:0});
            const attempt=this.state.managementAttempt;
            if((a?.status===412||a?.status===409&&a.code==='CONFLICT')&&attempt){try{const conflict={...attempt,conflict:true};this.journal?.write(conflict);this.publish({managementAttempt:conflict});}catch{this.publish({blocked:true});}}
            if(a&&[401,403,404].includes(a.status)){this.publish({managementAllowed:false,team:null,page:null,settingsActive:null,settingsArchived:null,members:null,candidates:null,transfer:null});void this.open(team.id);}
            if(a?.status===400&&attempt){try{this.journal?.remove(attempt);this.publish({managementAttempt:undefined});}catch{this.publish({blocked:true});}}
        }}finally{if(this.current(v,c))this.publish({sending:false});}
        return null;
    }
    resolveManagementConflict(){
        const a=this.state.managementAttempt;if(!a?.conflict||this.state.sending)return;
        try{this.journal?.remove(a);this.publish({managementAttempt:undefined,managementError:'Review current Team state before explicitly submitting a new request.'});if(this.target)void this.open(this.target);}catch{this.publish({blocked:true});}
    }
    async create(input: CreateInput) { if (!this.state.canCreate)
        return null; return this.send(createTeamSchema.parse(input)); }
    async update(input: PatchInput) { if (this.state.opening || !this.state.team?.capabilities.updateMetadata || this.state.conflict)
        return null; return this.send(patchTeamSchema.parse(input), this.state.team); }
    // Journal first. Unknown outcomes keep the same body/key/original precondition.
    private async send(body: CreateInput | PatchInput, team?: LiveTeam) {
        if (!this.state.allowed || this.state.sending || this.state.blocked || Date.now() < this.state.retryAfter)
            return null;
        const attempt = this.state.attempt ?? (team ? { operation: 'update' as const, actor: this.actor, membership:this.membership, workspace: this.state.workspace, team: team.id, key: this.key(), body: body as PatchInput, match: `"team-${team.version}"` } : { operation: 'create' as const, actor: this.actor, membership:this.membership, workspace: this.state.workspace, key: this.key(), body: body as CreateInput });
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
            else if(attempt.operation==='update')void this.open(attempt.team,true);
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
                    void this.open(attempt.team,true);
                }
                if (a?.status === 404 || a?.status === 403) {
                    this.publish({ team: null, members:null });
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
