import {teamMemberAddSchema,teamMemberRoleSchema,transferRequestSchema,emptyAuthSchema,type TeamManagementAction} from '@unblok/contracts';
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
export type ManagementAttempt={operation:'manage';action:TeamManagementAction;actor:string;membership:string;workspace:string;team:string;key:string;body:Record<string,unknown>;match:string;target?:string;conflict?:boolean};
type StoredAttempt=TeamAttempt|ManagementAttempt;
export interface TeamJournal {
    readManagement(actor:string,workspace:string,team:string,membership:string):ManagementAttempt|undefined;
    read(actor: string, workspace: string, team: string | undefined, membership: string): TeamAttempt | undefined;
    write(attempt: StoredAttempt): void;
    remove(attempt: StoredAttempt): void;
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const same = (a: StoredAttempt, b: StoredAttempt) => a.actor === b.actor && a.membership === b.membership && a.workspace === b.workspace && (a.operation === 'create' ? b.operation === 'create' : b.operation !== 'create' && a.team === b.team);
// Recovery metadata is bounded and tab-scoped; it never grants resource access.
export class TabTeamJournal implements TeamJournal {
    private readonly slot = 'unblok:pending-team-mutations:v1';
    constructor(private readonly storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>) { }
    private parse(value:unknown):StoredAttempt {
        if(!value||typeof value!=='object')throw Error('Invalid journal');
        const r=value as StoredAttempt;
            if ( ![r.actor, r.workspace, r.key, r.membership].every(v => typeof v === 'string' && uuid.test(v)))
                throw new Error('Invalid journal');
            if (r.operation === 'create') {
                if (Object.keys(r).sort().join(',') !== 'actor,body,key,membership,operation,workspace')
                    throw new Error('Invalid journal');
                return { ...r, body: createTeamSchema.parse(r.body) };
            }
            if(r.operation==='manage'){
                if(!uuid.test(r.team)||!/^"team-[1-9][0-9]{0,18}"$/.test(r.match)||r.target!==undefined&&!uuid.test(r.target)||r.conflict!==undefined&&typeof r.conflict!=='boolean'||Object.keys(r).some(k=>!['operation','action','actor','membership','workspace','team','key','body','match','target','conflict'].includes(k)))throw Error('Invalid management journal');
                const schema=r.action==='add'?teamMemberAddSchema:r.action==='role'?teamMemberRoleSchema:r.action==='request'?transferRequestSchema:['remove','accept','reject','archive','restore'].includes(r.action)?emptyAuthSchema:null;
                if(!schema||['role','remove','accept','reject'].includes(r.action)!==!!r.target)throw Error('Invalid management target');
                return {...r,body:schema.parse(r.body)};
            }
            if (r.operation !== 'update' || !uuid.test(r.team) || typeof r.match !== 'string' || !/^"team-[1-9][0-9]{0,18}"$/.test(r.match) || r.conflict !== undefined && typeof r.conflict !== 'boolean' || Object.keys(r).some(k => !['actor', 'workspace', 'membership', 'key', 'operation', 'team', 'body', 'match', 'conflict'].includes(k)))
                throw new Error('Invalid journal');
            return { ...r, body: patchTeamSchema.parse(r.body) };
    }
    private rows(): StoredAttempt[] {
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
    read(actor:string,workspace:string,team:string|undefined,membership:string){return this.rows().filter((r):r is TeamAttempt=>r.operation!=='manage').find(r=>r.actor===actor&&r.workspace===workspace&&r.membership===membership&&(team?r.operation==='update'&&r.team===team:r.operation==='create'));}
    readManagement(actor:string,workspace:string,team:string,membership:string){return this.rows().find((r):r is ManagementAttempt=>r.operation==='manage'&&r.actor===actor&&r.workspace===workspace&&r.team===team&&r.membership===membership);}
    private identity(r:StoredAttempt){return JSON.stringify([r.actor,r.workspace,r.membership,r.operation,r.operation!=='create'?r.team:null,r.key,r.body,r.operation!=='create'?r.match:null,r.operation==='manage'?r.action:null,r.operation==='manage'?r.target:null]);}
    write(attempt:StoredAttempt){
        // Validate before touching storage; canonical schemas are the same as first transmission.
        const canonical=this.parse(attempt);
        const rows=this.rows(),old=rows.find(r=>same(r,canonical));
        if(old&&this.identity(old)!==this.identity(canonical))throw Error('Pending request needs reconciliation');
        if(old&&old.operation!=='create'&&old.conflict&&canonical.operation!=='create'&&!canonical.conflict)throw Error('Conflict needs explicit reconciliation');
        if(!old&&rows.length>=8)throw Error('Pending requests need reconciliation');
        const raw=JSON.stringify(old?rows.map(r=>same(r,canonical)?canonical:r):[...rows,canonical]);
        if(new TextEncoder().encode(raw).length>131072)throw Error('Pending requests need reconciliation');this.storage.setItem(this.slot,raw);
    }
    remove(attempt:StoredAttempt){const op=this.parse(attempt),rows=this.rows(),old=rows.find(r=>same(r,op));if(!old)return;if(this.identity(old)!==this.identity(op))throw Error('Pending request changed');this.storage.setItem(this.slot,JSON.stringify(rows.filter(r=>!same(r,op))));}
    // No bulk clearing. Logout/account switches fence views, not uncertain receipt history.
}
