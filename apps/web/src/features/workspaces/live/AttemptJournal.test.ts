import {it,expect} from 'vitest';
import {TabAttemptJournal} from './AttemptJournal';
const actor='12345678-1234-4234-8234-123456789012',key='12345678-1234-4234-8234-123456789013';
const attempt={key,body:{name:'Real workspace',slug:'real-workspace'}};
function fixture(){let data:string|null=null;return {storage:{getItem:()=>data,setItem:(_key:string,value:string)=>{data=value;},removeItem:()=>{data=null;}},raw:(value:string)=>data=value};}
it('restores only one same-account canonical pending request across store reconstruction',()=>{const f=fixture();new TabAttemptJournal(f.storage).write(actor,attempt);expect(new TabAttemptJournal(f.storage).read(actor)).toEqual(attempt);});
it('removes a different account record rather than displaying it',()=>{const f=fixture(),journal=new TabAttemptJournal(f.storage);journal.write(actor,attempt);expect(journal.read(key)).toBeUndefined();expect(f.storage.getItem()).toBeNull();});
it('rejects malformed and oversized records and never stores cookie or authority fields',()=>{const f=fixture(),journal=new TabAttemptJournal(f.storage);for(const raw of ['{','x'.repeat(2049),JSON.stringify({actor,key:'forged',body:attempt.body}),JSON.stringify({actor,key,body:{...attempt.body,userId:actor}})]){f.raw(raw);expect(journal.read(actor)).toBeUndefined();expect(f.storage.getItem()).toBeNull();}journal.write(actor,attempt);expect(JSON.parse(f.storage.getItem()!)).toEqual({actor,...attempt});journal.write(actor);expect(f.storage.getItem()).toBeNull();});
it('does not silently replace unavailable persistence with an untracked request',()=>{const journal=new TabAttemptJournal({getItem:()=>{throw new Error('Blocked');},setItem:()=>{throw new Error('Blocked');},removeItem:()=>{}});expect(()=>journal.write(actor,attempt)).toThrow('Blocked');});
