import { createTeamSchema, patchTeamSchema } from '@unblok/contracts';
import type { CreateInput, PatchInput } from './TeamsApi';
export type TeamAttempt = {
    actor: string;
    workspace: string;
    key: string;
    operation: 'create';
    body: CreateInput;
} | {
    actor: string;
    workspace: string;
    team: string;
    key: string;
    operation: 'update';
    body: PatchInput;
    match: string;
    conflict?: boolean;
};
export interface TeamJournal {
    read(actor: string, workspace: string, team?: string): TeamAttempt | undefined;
    write(attempt: TeamAttempt): void;
    remove(attempt: TeamAttempt): void;
    clear(): void;
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const same = (a: TeamAttempt, b: TeamAttempt) => a.actor === b.actor && a.workspace === b.workspace && a.operation === b.operation && (a.operation === 'create' || b.operation === 'update' && a.team === b.team);
// Recovery metadata is bounded and tab-scoped; it never grants resource access.
export class TabTeamJournal implements TeamJournal {
    private readonly slot = 'unblok:pending-team-mutations:v1';
    constructor(private readonly storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>) { }
    private rows(): TeamAttempt[] {
        const raw = this.storage.getItem(this.slot);
        if (!raw)
            return [];
        if (new TextEncoder().encode(raw).length > 131072)
            throw new Error('Invalid journal');
        const rows = JSON.parse(raw);
        if (!Array.isArray(rows) || rows.length > 8)
            throw new Error('Invalid journal');
        return rows.map(r => {
            if (!r || typeof r !== 'object' || ![r.actor, r.workspace, r.key].every(v => typeof v === 'string' && uuid.test(v)))
                throw new Error('Invalid journal');
            if (r.operation === 'create') {
                if (Object.keys(r).sort().join(',') !== 'actor,body,key,operation,workspace')
                    throw new Error('Invalid journal');
                return { ...r, body: createTeamSchema.parse(r.body) };
            }
            if (r.operation !== 'update' || !uuid.test(r.team) || typeof r.match !== 'string' || !/^"team-[1-9][0-9]{0,18}"$/.test(r.match) || r.conflict !== undefined && typeof r.conflict !== 'boolean' || Object.keys(r).some(k => !['actor', 'workspace', 'key', 'operation', 'team', 'body', 'match', 'conflict'].includes(k)))
                throw new Error('Invalid journal');
            return { ...r, body: patchTeamSchema.parse(r.body) };
        });
    }
    read(actor: string, workspace: string, team?: string) { const rows = this.rows(); if (rows.some(r => r.actor !== actor)) {
        this.clear();
        return;
    } return rows.find(r => r.workspace === workspace && (team ? r.operation === 'update' && r.team === team : r.operation === 'create')); }
    write(attempt: TeamAttempt) { const rows = this.rows().filter(r => r.actor === attempt.actor && !same(r, attempt)); if (rows.length >= 8)
        throw new Error('Pending requests need reconciliation'); const raw = JSON.stringify([...rows, attempt]); if (new TextEncoder().encode(raw).length > 131072)
        throw new Error('Pending requests need reconciliation'); this.storage.setItem(this.slot, raw); }
    remove(attempt: TeamAttempt) { this.storage.setItem(this.slot, JSON.stringify(this.rows().filter(r => !same(r, attempt)))); }
    clear() { this.storage.removeItem(this.slot); }
}
