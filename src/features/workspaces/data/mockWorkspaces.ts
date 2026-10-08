import type {Workspace,WorkspaceMembership} from '../types';
import {INITIAL_USERS} from '../../../data/nexusEnterprise';
export const SEED_WORKSPACES:Workspace[]=[{id:'ws_acme',name:'NEXUS Commerce',slug:'nexus-commerce',avatar:'🛒',createdAt:'2026-05-01T09:00:00.000Z',status:'ACTIVE'}];
export const SEED_MEMBERSHIPS:WorkspaceMembership[]=INITIAL_USERS.map((u,i)=>({id:'mem_nex_'+u.id,workspaceId:'ws_acme',workspaceName:'NEXUS Commerce',userId:u.id,role:i===0?'ADMIN':i===4?'OBSERVER':'MEMBER',status:'ACTIVE',joinedAt:'2026-05-01T09:00:00.000Z',teamIds:u.teamIds||[]}));
export const SEED_USERS:Record<string,{id:string;name:string;email:string;avatar?:string}>=Object.fromEntries(INITIAL_USERS.map(u=>[u.id,{id:u.id,name:u.name,email:u.email,avatar:u.avatar}]));
export const getMembershipsForUser=(userId:string):WorkspaceMembership[]=>SEED_MEMBERSHIPS.filter(m=>m.userId===userId);
