import { createTeamSchema, patchTeamSchema } from '@unblok/contracts';
import type { CreateInput, PatchInput } from './TeamsApi';
export type TeamAttempt = {
    actor: string;
    membership: string;
    workspace: string;
    key: string;
    operation: 'create';
    body: CreateInput;
} | {
    actor: string;
    membership: string;
    workspace: string;
    team: string;
    key: string;
    operation: 'update';
    body: PatchInput;
    match: string;
    conflict?: boolean;
};
export interface TeamJournal {
    read(actor: string, workspace: string, team: string | undefined, membership: string): TeamAttempt | undefined;
    write(attempt: TeamAttempt): void;
    remove(attempt: TeamAttempt): void;
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const same = (a: TeamAttempt, b: TeamAttempt) => a.actor === b.actor && a.membership === b.membership && a.workspace === b.workspace && a.operation === b.operation && (a.operation === 'create' || b.operation === 'update' && a.team === b.team);
// Recovery metadata is bounded and tab-scoped; it never grants resource access.
export class TabTeamJournal implements TeamJournal {
    private readonly slot = 'unblok:pending-team-mutations:v1';
    constructor(private readonly storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>) { }
    private parse(value:unknown):TeamAttempt {
        if(!value||typeof value!=='object')throw Error('Invalid journal');
        const r=value as TeamAttempt;
            if ( ![r.actor, r.workspace, r.key, r.membership].every(v => typeof v === 'string' && uuid.test(v)))
                throw new Error('Invalid journal');
            if (r.operation === 'create') {
                if (Object.keys(r).sort().join(',') !== 'actor,body,key,membership,operation,workspace')
                    throw new Error('Invalid journal');
                return { ...r, body: createTeamSchema.parse(r.body) };
            }
            if (r.operation !== 'update' || !uuid.test(r.team) || typeof r.match !== 'string' || !/^"team-[1-9][0-9]{0,18}"$/.test(r.match) || r.conflict !== undefined && typeof r.conflict !== 'boolean' || Object.keys(r).some(k => !['actor', 'workspace', 'membership', 'key', 'operation', 'team', 'body', 'match', 'conflict'].includes(k)))
                throw new Error('Invalid journal');
            return { ...r, body: patchTeamSchema.parse(r.body) };
    }
    private rows(): TeamAttempt[] {
        const raw = this.storage.getItem(this.slot);
        if (raw === null)
            return [];
        if (new TextEncoder().encode(raw).length > 131072)
            throw new Error('Invalid journal');
        const rows = JSON.parse(raw);
        if (!Array.isArray(rows) || rows.length > 8)
            throw new Error('Invalid journal');
        const parsed=rows.map((r:unknown)=>this.parse(r));
        if(parsed.some((r,i)=>parsed.slice(0,i).some(p=>same(p,r))))throw Error('Ambiguous journal');
        return parsed;
    }
    read(actor:string,workspace:string,team:string|undefined,membership:string){return this.rows().find(r=>r.actor===actor&&r.workspace===workspace&&r.membership===membership&&(team?r.operation==='update'&&r.team===team:r.operation==='create'));}
    private identity(r:TeamAttempt){return JSON.stringify([r.actor,r.workspace,r.membership,r.operation,r.operation==='update'?r.team:null,r.key,r.body,r.operation==='update'?r.match:null]);}
    write(attempt:TeamAttempt){
        // Validate before touching storage; canonical schemas are the same as first transmission.
        const canonical=this.parse(attempt);
        const rows=this.rows(),old=rows.find(r=>same(r,canonical));
        if(old&&this.identity(old)!==this.identity(canonical))throw Error('Pending request needs reconciliation');
        if(old&&old.operation==='update'&&old.conflict&&canonical.operation==='update'&&!canonical.conflict)throw Error('Conflict needs explicit reconciliation');
        if(!old&&rows.length>=8)throw Error('Pending requests need reconciliation');
        const raw=JSON.stringify(old?rows.map(r=>same(r,canonical)?canonical:r):[...rows,canonical]);
        if(new TextEncoder().encode(raw).length>131072)throw Error('Pending requests need reconciliation');this.storage.setItem(this.slot,raw);
    }
    remove(attempt:TeamAttempt){const op=this.parse(attempt),rows=this.rows(),old=rows.find(r=>same(r,op));if(!old)return;if(this.identity(old)!==this.identity(op))throw Error('Pending request changed');this.storage.setItem(this.slot,JSON.stringify(rows.filter(r=>!same(r,op))));}
    // No bulk clearing. Logout/account switches fence views, not uncertain receipt history.
}
