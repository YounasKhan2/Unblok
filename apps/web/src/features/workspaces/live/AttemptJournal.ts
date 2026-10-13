import {createWorkspaceSchema} from '@unblok/contracts';
import type {WorkspaceInput} from './WorkspaceApi';
export type CreationAttempt={key:string;body:WorkspaceInput};
export interface AttemptJournal {read(actor:string):CreationAttempt|undefined;write(actor:string,attempt?:CreationAttempt):void}
const name='unblok.workspace.creation.v1';
// Pending request metadata only. Never an identity, membership or session grant.
// One tab-local record; reject and remove another account's record on restoration.
export class TabAttemptJournal implements AttemptJournal {
  constructor(private readonly storage:Pick<Storage,'getItem'|'setItem'|'removeItem'>){}
  read(actor:string){const raw=this.storage.getItem(name);if(!raw)return;
    try{if(raw.length>2048)throw new Error();const value=JSON.parse(raw);
      if(typeof value.actor==='string'&&value.actor!==actor){this.storage.removeItem(name);return;}
      if(value.actor!==actor||!/^([0-9a-f]{8}-){1}[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value.key))throw new Error();
      return {key:value.key as string,body:createWorkspaceSchema.parse(value.body)};
    }catch{throw new Error('Pending request metadata is unavailable.');}
  }
  write(actor:string,attempt?:CreationAttempt){if(attempt)this.storage.setItem(name,JSON.stringify({actor,...attempt}));else this.storage.removeItem(name);}
}
