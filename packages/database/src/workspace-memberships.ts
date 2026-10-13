import {createHmac,timingSafeEqual} from 'node:crypto';
import {Prisma,type MembershipStatus,type WorkspaceRole} from '@prisma/client';
import {WorkspaceFault,type WorkspaceKeys} from './workspaces';
export type MembershipQuery={limit:number;sort:'joined_asc'|'joined_desc';status?:MembershipStatus|'ALL'|undefined;after?:string|undefined};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export async function workspaceAdmin(tx:Prisma.TransactionClient,actor:string,workspaceId:string,write=false){
 if(!uuid.test(workspaceId))throw new WorkspaceFault('INVALID_REQUEST');
 const rows=write?await tx.$queryRaw<{status:string}[]>`SELECT status FROM workspaces WHERE id=${workspaceId}::uuid FOR UPDATE`:
 await tx.$queryRaw<{status:string}[]>`SELECT status FROM workspaces WHERE id=${workspaceId}::uuid FOR SHARE`;
 const member=await tx.workspaceMembership.findUnique({where:{workspaceId_userId:{workspaceId,userId:actor}},select:{id:true,role:true,status:true}});
 if(!rows[0]||member?.role!=='ADMIN'||member.status!=='ACTIVE'||(write&&rows[0].status!=='ACTIVE'))throw new WorkspaceFault('NOT_FOUND');
 return member;
}
const mac=(secret:string,value:string)=>createHmac('sha256',Buffer.from(secret,'hex')).update('unblok-api-cursor-v1\0'+value).digest('base64url');
type Cursor={v:1;kid:string;actor:string;workspace:string;operation:string;status:string;sort:string;limit:number;revision:string;joined:string;id:string;issued:number;expires:number};
export async function listMemberships(tx:Prisma.TransactionClient,actor:string,workspace:string,query:MembershipQuery,keys:WorkspaceKeys){
 await workspaceAdmin(tx,actor,workspace);
 const revisions=await tx.$queryRaw<{revision:bigint}[]>`SELECT revision FROM workspace_policy_revisions WHERE workspace_id=${workspace}::uuid FOR SHARE`;
 if(!revisions[0])throw new WorkspaceFault('NOT_FOUND');const revision=revisions[0].revision.toString();
 const invalid=()=>new WorkspaceFault('INVALID_REQUEST');let cursor:Cursor|undefined;
 if(query.after){
  if(query.after.length>2048||!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/.test(query.after))throw invalid();
  const [encoded,signature]=query.after.split('.');let c:Cursor;try{c=JSON.parse(Buffer.from(encoded!,'base64url').toString('utf8'));}catch{throw invalid();}
  if(!c||typeof c.kid!=='string'||!Object.hasOwn(keys.cursors,c.kid)||!timingSafeEqual(Buffer.from(signature!),Buffer.from(mac(keys.cursors[c.kid]!,encoded!))))throw invalid();
  if(Object.keys(c).sort().join(',')!=='actor,expires,id,issued,joined,kid,limit,operation,revision,sort,status,v,workspace'||c.v!==1||c.operation!=='workspace:members:list:v1'||c.actor!==actor||c.workspace!==workspace||c.status!==(query.status??'ALL')||c.sort!==query.sort||c.limit!==query.limit||!uuid.test(c.id)||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(c.joined)||!Number.isFinite(Date.parse(c.joined))||!Number.isSafeInteger(c.issued)||!Number.isSafeInteger(c.expires)||c.issued>Date.now()||c.expires<=Date.now()||c.expires<=c.issued||c.expires-c.issued>900000||!/^[1-9][0-9]{0,18}$/.test(c.revision))throw invalid();
  if(c.revision!==revision)throw new WorkspaceFault('CURSOR_STALE');cursor=c;
 }
 if(!Number.isInteger(query.limit)||query.limit<1||query.limit>100||!['joined_asc','joined_desc'].includes(query.sort)||query.status&&!['ACTIVE','INVITED','SUSPENDED','ALL'].includes(query.status))throw invalid();
 const ascending=query.sort==='joined_asc',direction=ascending?Prisma.sql`ASC`:Prisma.sql`DESC`,comparison=ascending?Prisma.sql`>`:Prisma.sql`<`;
 const filter=query.status&&query.status!=='ALL'?Prisma.sql`AND m.status=${query.status}::"MembershipStatus"`:Prisma.empty;
 const range=cursor?Prisma.sql`AND (COALESCE(m.joined_at,'1970-01-01'::timestamptz),m.id) ${comparison} (${new Date(cursor.joined)}::timestamptz,${cursor.id}::uuid)`:Prisma.empty;
 const rows=await tx.$queryRaw<{id:string;displayName:string;role:WorkspaceRole;status:MembershipStatus;joinedAt:Date|null}[]>(Prisma.sql`SELECT m.id,u.name AS "displayName",m.role,m.status,m.joined_at AS "joinedAt" FROM workspace_memberships m JOIN users u ON u.id=m.user_id WHERE m.workspace_id=${workspace}::uuid ${filter} ${range} ORDER BY COALESCE(m.joined_at,'1970-01-01'::timestamptz) ${direction},m.id ${direction} LIMIT ${query.limit+1}`);
 const items=rows.slice(0,query.limit).map(r=>({...r,joinedAt:r.joinedAt?.toISOString()??null})),hasMore=rows.length>items.length,last=items.at(-1),issued=Date.now();
 let nextCursor:string|null=null;
 if(hasMore&&last){const c:Cursor={v:1,kid:keys.active,actor,workspace,operation:'workspace:members:list:v1',status:query.status??'ALL',sort:query.sort,limit:query.limit,revision,joined:last.joinedAt??new Date(0).toISOString(),id:last.id,issued,expires:issued+900000};const encoded=Buffer.from(JSON.stringify(c)).toString('base64url');nextCursor=encoded+'.'+mac(keys.cursors[keys.active]!,encoded);}
 return {items,page:{hasMore,nextCursor}};
}
