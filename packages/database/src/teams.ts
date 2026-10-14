import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { Prisma, type WorkspaceRole } from '@prisma/client';
import type { WorkspaceKeys } from './workspaces';
export class TeamFault extends Error {
  constructor(readonly reason: 'INVALID_REQUEST' | 'NOT_FOUND' | 'FORBIDDEN' | 'CURSOR_STALE' | 'CONFLICT' | 'PRECONDITION_REQUIRED' | 'PRECONDITION_FAILED' | 'IDEMPOTENCY_RESULT_EXPIRED') { super(reason); this.name = 'TeamFault'; }
}
export type TeamQuery = { limit: number; status: 'ACTIVE' | 'ARCHIVED' | 'ALL'; after?: string | undefined };
export type TeamInput = { name: string; key: string; description: string; color: string };
export type TeamPatch = {name?:string|undefined;description?:string|undefined;color?:string|undefined};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const colors = ['#5645d4','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#64748b'];
function fail(reason: ConstructorParameters<typeof TeamFault>[0]): never { throw new TeamFault(reason); }
const chars = (value: string) => Array.from(value).length;
function metadata(input: TeamPatch) {
  if (input.name !== undefined && (typeof input.name!=='string' || input.name.includes('\0') || input.name !== input.name.trim() || chars(input.name)<1 || chars(input.name)>120 || Buffer.byteLength(input.name)>480)) fail('INVALID_REQUEST');
  if (input.description !== undefined && (typeof input.description!=='string' || input.description.includes('\0') || chars(input.description)>2000 || Buffer.byteLength(input.description)>8000)) fail('INVALID_REQUEST');
  if (input.color !== undefined && (typeof input.color!=='string' || !colors.includes(input.color))) fail('INVALID_REQUEST');
}
type Scope = { membership: string; role: WorkspaceRole; status: string };
type Row = { workspaceId: string; id: string; key: string; name: string; description: string; color: string; status: 'ACTIVE' | 'ARCHIVED'; createdAt: Date; version: bigint; ownerMembershipId: string };
const fields = Prisma.sql`t.workspace_id AS "workspaceId",t.id,t.key,t.name,t.description,t.color,t.status,t.created_at AS "createdAt",t.version,t.owner_membership_id AS "ownerMembershipId"`;
export function teamProjection(row: Row, scope: Scope) {
  return { workspaceId: row.workspaceId, id: row.id, key: row.key, name: row.name, description: row.description, color: row.color, status: row.status, createdAt: row.createdAt.toISOString(), version: row.version.toString(),
    capabilities: { updateMetadata: scope.role==='ADMIN' && scope.membership===row.ownerMembershipId && scope.status==='ACTIVE' && row.status==='ACTIVE', manageMembers: false, transferOwnership: false, archive: false, restore: false, readProjects: false, writeIssues: false } };
}
async function scope(tx: Prisma.TransactionClient, actor: string, workspace: string, write: boolean): Promise<Scope> {
  if (!uuid.test(workspace)) fail('INVALID_REQUEST');
  const rows = await tx.$queryRaw<{status:string}[]>(Prisma.sql`SELECT status FROM workspaces WHERE id=${workspace}::uuid ${write ? Prisma.sql`FOR UPDATE` : Prisma.sql`FOR SHARE`}`);
  const m = await tx.workspaceMembership.findUnique({ where: { workspaceId_userId: { workspaceId: workspace, userId: actor } }, select: { id:true,role:true,status:true } });
  if (!rows[0] || !m || m.status!=='ACTIVE') fail('NOT_FOUND');
  return { membership:m.id,role:m.role,status:rows[0].status };
}
async function row(tx: Prisma.TransactionClient, workspace: string, id: string, s: Scope) {
  if (!uuid.test(id)) fail('INVALID_REQUEST');
  const rows = await tx.$queryRaw<Row[]>(Prisma.sql`SELECT ${fields} FROM teams t JOIN team_memberships tm ON tm.workspace_id=t.workspace_id AND tm.team_id=t.id
    WHERE t.workspace_id=${workspace}::uuid AND t.id=${id}::uuid AND NOT t.legacy_quarantined AND tm.membership_id=${s.membership}::uuid`);
  if (!rows[0]) fail('NOT_FOUND'); return rows[0];
}
async function revision(tx: Prisma.TransactionClient, workspace: string) {
  const rows = await tx.$queryRaw<{revision:bigint}[]>`SELECT revision FROM workspace_policy_revisions WHERE workspace_id=${workspace}::uuid FOR SHARE`;
  if (!rows[0]) fail('NOT_FOUND'); return rows[0].revision.toString();
}
export async function detailTeam(tx: Prisma.TransactionClient, actor: string, workspace: string, id: string) {
  const s=await scope(tx,actor,workspace,false); await revision(tx,workspace); return teamProjection(await row(tx,workspace,id,s),s);
}
const mac=(secret:string,domain:string,payload:string)=>createHmac('sha256',Buffer.from(secret,'hex')).update(domain+'\0'+payload).digest('base64url');
type Cursor={v:number;kid:string;actor:string;workspace:string;operation:string;status:string;limit:number;revision:string;created:string;id:string;issued:number;expires:number};
export async function listTeams(tx: Prisma.TransactionClient, actor:string, workspace:string, query:TeamQuery, keys:WorkspaceKeys) {
  const s=await scope(tx,actor,workspace,false),rev=await revision(tx,workspace);
  if(!Number.isInteger(query.limit)||query.limit<1||query.limit>100||!['ACTIVE','ARCHIVED','ALL'].includes(query.status))fail('INVALID_REQUEST');
  let cursor:Cursor|undefined;
  if(query.after){
    if(query.after.length>2048||!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/.test(query.after))fail('INVALID_REQUEST');
    const [encoded,signature]=query.after.split('.');let c:Cursor;
    try{c=JSON.parse(Buffer.from(encoded!,'base64url').toString('utf8'));}catch{fail('INVALID_REQUEST');}
    if(!c||typeof c.kid!=='string'||!Object.hasOwn(keys.cursors,c.kid)||!timingSafeEqual(Buffer.from(signature!),Buffer.from(mac(keys.cursors[c.kid]!,'unblok-team-cursor-v1',encoded!))))fail('INVALID_REQUEST');
    if(Object.keys(c).sort().join(',')!=='actor,created,expires,id,issued,kid,limit,operation,revision,status,v,workspace'||c.v!==1||c.operation!=='teams:list:created_asc:v1'||c.actor!==actor||c.workspace!==workspace||c.status!==query.status||c.limit!==query.limit||!uuid.test(c.id)||typeof c.created!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(c.created)||!Number.isFinite(Date.parse(c.created))||!Number.isSafeInteger(c.issued)||!Number.isSafeInteger(c.expires)||c.issued>Date.now()||c.expires<=Date.now()||c.expires<=c.issued||c.expires-c.issued>900000||!/^[1-9][0-9]{0,18}$/.test(c.revision))fail('INVALID_REQUEST');
    if(c.revision!==rev)fail('CURSOR_STALE');cursor=c;
  }
  const filter=query.status==='ALL'?Prisma.empty:Prisma.sql`AND t.status=${query.status}::"RecordStatus"`;
  const range=cursor?Prisma.sql`AND (t.created_at,t.id)>(${new Date(cursor.created)}::timestamptz,${cursor.id}::uuid)`:Prisma.empty;
  const rows=await tx.$queryRaw<Row[]>(Prisma.sql`SELECT ${fields} FROM teams t JOIN team_memberships tm ON tm.workspace_id=t.workspace_id AND tm.team_id=t.id
    WHERE t.workspace_id=${workspace}::uuid AND tm.membership_id=${s.membership}::uuid AND NOT t.legacy_quarantined ${filter} ${range} ORDER BY t.created_at,t.id LIMIT ${query.limit+1}`);
  const items:ReturnType<typeof teamProjection>[]=[];let bytes=0;
  for(const r of rows.slice(0,query.limit)){const item=teamProjection(r,s),size=Buffer.byteLength(JSON.stringify(item))+1;if(size>126976)throw new Error('Invalid Team projection');if(bytes+size>126976)break;items.push(item);bytes+=size;}
  const hasMore=rows.length>items.length,last=rows[items.length-1],issued=Date.now();let nextCursor:string|null=null;
  if(hasMore&&last){const c:Cursor={v:1,kid:keys.active,actor,workspace,operation:'teams:list:created_asc:v1',status:query.status,limit:query.limit,revision:rev,created:last.createdAt.toISOString(),id:last.id,issued,expires:issued+900000};const encoded=Buffer.from(JSON.stringify(c)).toString('base64url');nextCursor=encoded+'.'+mac(keys.cursors[keys.active]!,'unblok-team-cursor-v1',encoded);}
  return {items,page:{hasMore,nextCursor}};
}
export async function mutateTeam(tx: Prisma.TransactionClient, actor:string, workspace:string, input:TeamInput|TeamPatch, requestKey:string, keys:WorkspaceKeys, target?:string, match?:string) {
  if(!uuid.test(requestKey)||!input||typeof input!=='object'||Object.keys(input).some(key=>!(target?['name','description','color']:['name','key','description','color']).includes(key))||target&&Object.keys(input).length===0)fail('INVALID_REQUEST');
  if(!target&&['name','key','description','color'].some(key=>typeof input[key as keyof typeof input]!=='string'))fail('INVALID_REQUEST');metadata(input);
  const operation=target?'team:update:v1':'team:create:v1';
  const s=await scope(tx,actor,workspace,true);await revision(tx,workspace);
  const pointer=await tx.teamMutationResult.findUnique({where:{actorId_workspaceId_operation_requestKey:{actorId:actor,workspaceId:workspace,operation,requestKey}},select:{teamId:true}});
  const id=target??pointer?.teamId??randomUUID();
  let current:Row|undefined;
  if(target||pointer){current=await row(tx,workspace,id,s);}
  // Visible reads do not imply management; no hidden Team existence or ledger disclosure.
  if(s.role!=='ADMIN'||s.status!=='ACTIVE'||current&&(current.status!=='ACTIVE'||current.ownerMembershipId!==s.membership))fail('FORBIDDEN');
  const body=target?{name:input.name,description:input.description,color:input.color}:{name:input.name,key:(input as TeamInput).key,description:input.description,color:input.color};
  const digest=Buffer.from(mac(keys.idempotency,'unblok-team-receipt-v1',JSON.stringify({operation,workspace,actor,target:target??null,match:match??null,body})),'base64url').toString('hex');
  if(pointer){
    const old=(await tx.$queryRaw<{payload_digest:string;result:unknown;expired:boolean}[]>`SELECT payload_digest,result,retain_until<=statement_timestamp() AS expired FROM team_mutation_results WHERE actor_id=${actor}::uuid AND workspace_id=${workspace}::uuid AND operation=${operation} AND request_key=${requestKey}::uuid FOR UPDATE`)[0];
    if(!old||old.payload_digest!==digest)fail('CONFLICT');
    if(old.expired||old.result===null){await tx.$executeRaw`UPDATE team_mutation_results SET result=NULL WHERE actor_id=${actor}::uuid AND workspace_id=${workspace}::uuid AND operation=${operation} AND request_key=${requestKey}::uuid`;return new TeamFault('IDEMPOTENCY_RESULT_EXPIRED');}
    return old.result;
  }
  if(target){if(match===undefined)fail('PRECONDITION_REQUIRED');if(!/^"team-[1-9][0-9]{0,18}"$/.test(match))fail('INVALID_REQUEST');if(match!==`"team-${current!.version}"`)fail('PRECONDITION_FAILED');}
  const reservation=randomUUID();
  await tx.$executeRaw`INSERT INTO team_mutation_results(id,workspace_id,actor_id,operation,request_key,payload_digest,team_id,retain_until) VALUES(${reservation}::uuid,${workspace}::uuid,${actor}::uuid,${operation},${requestKey}::uuid,${digest},${id}::uuid,date_trunc('milliseconds',statement_timestamp())+interval '24 hours')`;
  if(target){
    // A metadata PATCH must change a value, so one version represents one effect.
    const changes=Object.fromEntries(Object.entries(input).filter(([key,value])=>value!==undefined&&value!==current![key as keyof Row]));
    if(Object.keys(changes).length) await tx.team.update({where:{workspaceId_id:{workspaceId:workspace,id}},data:{...changes,version:{increment:1}}});
  }else{
    const create=input as TeamInput;if(!/^[A-Z0-9]{2,6}$/.test(create.key))fail('INVALID_REQUEST');
    await tx.team.create({data:{workspaceId:workspace,id,ownerMembershipId:s.membership,name:create.name,key:create.key,description:create.description,color:create.color}});
    await tx.teamMembership.create({data:{workspaceId:workspace,teamId:id,membershipId:s.membership}});
  }
  const result=teamProjection(await row(tx,workspace,id,s),s);
  if(Buffer.byteLength(JSON.stringify(result))>16384)throw new Error('Invalid Team response');
  await tx.$executeRaw`UPDATE team_mutation_results SET result=${JSON.stringify(result)}::jsonb WHERE id=${reservation}::uuid`;
  return result;
}
