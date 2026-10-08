import {NEXUS_FIXTURE_VERSION} from '../data/nexusEnterprise';
/**
 * Explicit, reviewable prototype reset. Existing localStorage is backed up before
 * removal; app adapters will reseed NEXUS on the next full reload.
 * This is intentionally never invoked during application boot.
 */
export const NEXUS_RESET_BACKUP_PREFIX='unblok_nexus_backup_';
export function resetPrototypeToNexus(storage: Storage, confirmed: boolean): {backedUpKey:string;removedKeys:string[]} {
 if(!confirmed) throw new Error('Explicit confirmation is required to replace demo data.');
 const entries:Record<string,string>={};
 for(let i=0;i<storage.length;i++){
  const key=storage.key(i);
  if(key && (key.startsWith('unblok_')||key.startsWith('kite_')) && !key.startsWith(NEXUS_RESET_BACKUP_PREFIX)){
   const val=storage.getItem(key);if(val!==null)entries[key]=val;
  }
 }
 const backupKey=NEXUS_RESET_BACKUP_PREFIX+NEXUS_FIXTURE_VERSION+'_'+Date.now();
 storage.setItem(backupKey,JSON.stringify(entries));
 for(const key of Object.keys(entries)) storage.removeItem(key);
 return {backedUpKey:backupKey,removedKeys:Object.keys(entries)};
}
export function restorePrototypeBackup(storage: Storage, backupKey: string, confirmed:boolean):void {
 if(!confirmed) throw new Error('Confirmation required to restore prior demo state.');
 if(!backupKey.startsWith(NEXUS_RESET_BACKUP_PREFIX)) throw new Error('Invalid backup key');
 const raw=storage.getItem(backupKey);
 if(!raw) throw new Error('Backup does not exist');
 const records=JSON.parse(raw) as Record<string,string>;
 for(const [key,value] of Object.entries(records)){
  if(!key.startsWith('unblok_')&&!key.startsWith('kite_')) throw new Error('Invalid backup record');
  storage.setItem(key,value);
 }
}
