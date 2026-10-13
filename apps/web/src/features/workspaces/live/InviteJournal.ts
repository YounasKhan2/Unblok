import {workspaceInvitationSchema} from '@unblok/contracts';
import type {InviteInput} from './MembersApi';
export interface InviteAttempt {actor:string;workspace:string;key:string;body:InviteInput}
export interface InviteJournal {read(actor:string,workspace:string):InviteAttempt|undefined;write(attempt:InviteAttempt):void;remove(actor:string,workspace:string):void;clear():void}
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const slot='unblok:pending-invitations:v1';
export class TabInviteJournal implements InviteJournal {
 constructor(private readonly storage:Pick<Storage,'getItem'|'setItem'|'removeItem'>){}
 private rows():InviteAttempt[]{const raw=this.storage.getItem(slot);if(!raw)return [];if(raw.length>12000)throw new Error('Invalid journal');const rows:unknown=JSON.parse(raw);if(!Array.isArray(rows)||rows.length>8)throw new Error('Invalid journal');
  return rows.map(r=>{if(!r||Object.keys(r).sort().join(',')!=='actor,body,key,workspace'||![r.actor,r.workspace,r.key].every(v=>typeof v==='string'&&uuid.test(v)))throw new Error('Invalid journal');return {...r,body:workspaceInvitationSchema.parse(r.body)};});}
 read(actor:string,workspace:string){const rows=this.rows();if(rows.some(r=>r.actor!==actor)){this.clear();return;}return rows.find(r=>r.workspace===workspace);}
 write(attempt:InviteAttempt){const rows=this.rows().filter(r=>r.actor===attempt.actor&&r.workspace!==attempt.workspace);if(rows.length>=8)throw new Error('Pending requests need reconciliation');this.storage.setItem(slot,JSON.stringify([...rows,attempt]));}
 remove(actor:string,workspace:string){this.storage.setItem(slot,JSON.stringify(this.rows().filter(r=>r.actor===actor&&r.workspace!==workspace)));}
 clear(){this.storage.removeItem(slot);}
}

export interface AcceptanceJournal {read(actor:string,proofHash:string):string|undefined;write(actor:string,proofHash:string,key:string):void;clear():void}
export class TabAcceptanceJournal implements AcceptanceJournal {
 private slot='unblok:pending-acceptance:v1';
 constructor(private readonly storage:Pick<Storage,'getItem'|'setItem'|'removeItem'>){}
 private rows():{actor:string;key:string;proofHash:string}[]{const raw=this.storage.getItem(this.slot);if(!raw)return [];if(raw.length>4096)throw new Error('Invalid acceptance journal');const rows=JSON.parse(raw);if(!Array.isArray(rows)||rows.length>8)throw new Error('Invalid acceptance journal');for(const row of rows)if(!row||Object.keys(row).sort().join(',')!=='actor,key,proofHash'||!uuid.test(row.actor)||!uuid.test(row.key)||!/^[0-9a-f]{64}$/.test(row.proofHash))throw new Error('Invalid acceptance journal');return rows;}
 read(actor:string,proofHash:string){const rows=this.rows();if(rows.some(row=>row.actor!==actor)){this.clear();return;}return rows.find(row=>row.proofHash===proofHash)?.key;}
 write(actor:string,proofHash:string,key:string){const rows=this.rows().filter(row=>row.actor===actor&&row.proofHash!==proofHash);if(rows.length>=8)throw new Error('Pending invitations need reconciliation');this.storage.setItem(this.slot,JSON.stringify([...rows,{actor,proofHash,key}]));}
 clear(){this.storage.removeItem(this.slot);}
}
