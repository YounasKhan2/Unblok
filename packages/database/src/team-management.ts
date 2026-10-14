import {Prisma} from '@prisma/client';
import {createHmac,randomUUID,timingSafeEqual} from 'node:crypto';
import {TeamFault,scope,row,revision,teamProjection,type Row,type Scope} from './teams';
import type {WorkspaceKeys} from './workspaces';
import type {PrincipalAuthority} from './auth-fences';
export type TeamManagementAction='add'|'remove'|'role'|'request'|'accept'|'reject'|'archive'|'restore';
export type TeamCeiling='MEMBER'|'OBSERVER';
export type MemberQuery={limit:number;status:'ACTIVE'|'SUSPENDED'|'INVITED'|'ALL';after?:string|undefined};
export type ManagementInput={membershipId?:string;teamRole?:TeamCeiling;successorMembershipId?:string};
type Tx=Prisma.TransactionClient;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
function fail(reason:ConstructorParameters<typeof TeamFault>[0]):never{throw new TeamFault(reason);}
const mac=(secret:string,domain:string,payload:string)=>createHmac('sha256',Buffer.from(secret,'hex')).update(domain+'\0'+payload).digest('base64url');
type Intent={workspaceId:string;teamId:string;requestId:string;initiatorMembershipId:string;successorMembershipId:string;initiatorUserId:string;successorUserId:string;sourceFamilyId:string;initiatorEpoch:bigint;successorEpoch:bigint;baseVersion:bigint;policyRevision:bigint;revision:bigint;state:string;issuedAt:Date;expiresAt:Date};
async function intent(tx:Tx,ws:string,team:string){return tx.teamTransferIntent.findUnique({where:{workspaceId_teamId:{workspaceId:ws,teamId:team}}});}
async function ceiling(tx:Tx,ws:string,team:string,member:string){return tx.teamMembership.findUnique({where:{workspaceId_teamId_membershipId:{workspaceId:ws,teamId:team,membershipId:member}}});}
async function owner(tx:Tx,ws:string,team:string,s:Scope,r:Row){if(s.status!=='ACTIVE'||s.role!=='ADMIN'||r.ownerMembershipId!==s.membership||(await ceiling(tx,ws,team,s.membership))?.teamRole!=='MEMBER')fail('FORBIDDEN');}
function precondition(r:Row,match?:string){if(match===undefined)fail('PRECONDITION_REQUIRED');if(!/^"team-[1-9][0-9]{0,18}"$/.test(match))fail('INVALID_REQUEST');if(match!==`"team-${r.version}"`)fail('PRECONDITION_FAILED');}
async function currentTime(tx:Tx){return (await tx.$queryRaw<{now:Date}[]>`SELECT clock_timestamp() AS now`)[0]!.now;}
async function validIntent(tx:Tx,i:Intent,r:Row,policy:string){
 const now=await currentTime(tx);if(now>=i.expiresAt)return 'EXPIRED';
 if(r.version!==i.baseVersion||r.ownerMembershipId!==i.initiatorMembershipId||r.status!=='ACTIVE'||policy!==i.policyRevision.toString())return 'INVALIDATED';
 const [im,sm,iu,su,f,ij,sj,w]=await Promise.all([tx.workspaceMembership.findUnique({where:{workspaceId_id:{workspaceId:i.workspaceId,id:i.initiatorMembershipId}}}),tx.workspaceMembership.findUnique({where:{workspaceId_id:{workspaceId:i.workspaceId,id:i.successorMembershipId}}}),tx.user.findUnique({where:{id:i.initiatorUserId}}),tx.user.findUnique({where:{id:i.successorUserId}}),tx.authSessionFamily.findUnique({where:{id:i.sourceFamilyId}}),ceiling(tx,i.workspaceId,i.teamId,i.initiatorMembershipId),ceiling(tx,i.workspaceId,i.teamId,i.successorMembershipId),tx.workspace.findUnique({where:{id:i.workspaceId}})]);
 if(!im||!sm||!iu||!su||!f||w?.status!=='ACTIVE'||im.userId!==i.initiatorUserId||sm.userId!==i.successorUserId||im.status!=='ACTIVE'||sm.status!=='ACTIVE'||im.role!=='ADMIN'||sm.role!=='ADMIN'||ij?.teamRole!=='MEMBER'||sj?.teamRole!=='MEMBER'||iu.authDisabled||su.authDisabled||iu.authEpoch!==i.initiatorEpoch||su.authEpoch!==i.successorEpoch||f.userId!==iu.id||f.authEpoch!==iu.authEpoch||f.revokedAt||f.absoluteExpiresAt<=now||f.idleExpiresAt<=now)return 'INVALIDATED';
 return 'PENDING';
}
// Discovery is bounded and grants no authority; boundary locks every user/family before Workspace.
export async function managementSelectors(tx:Tx,ws:string,team:string,input:ManagementInput){
 if(!uuid.test(ws)||!uuid.test(team))fail('INVALID_REQUEST');
 const r=await tx.team.findUnique({where:{workspaceId_id:{workspaceId:ws,id:team}},select:{ownerMembershipId:true}}),i=await intent(tx,ws,team);
 const targets=[r?.ownerMembershipId,input.membershipId,input.successorMembershipId,i?.initiatorMembershipId,i?.successorMembershipId].filter((v):v is string=>!!v);
 if(targets.some(v=>!uuid.test(v)))fail('INVALID_REQUEST');
 const members=await tx.workspaceMembership.findMany({where:{workspaceId:ws,id:{in:[...new Set(targets)]}},select:{userId:true}});
 return {users:members.map(m=>m.userId),families:i?[i.sourceFamilyId]:[]};
}
export async function transferDetail(tx:Tx,a:PrincipalAuthority,ws:string,team:string,request:string){
 if(!uuid.test(request))fail('INVALID_REQUEST');const s=await scope(tx,a.userId,ws,false),policy=await revision(tx,ws),r=await row(tx,ws,team,s),i=await intent(tx,ws,team);
 const own=s.role==='ADMIN'&&s.status==='ACTIVE'&&r.ownerMembershipId===s.membership&&(await ceiling(tx,ws,team,s.membership))?.teamRole==='MEMBER';
 const addressed=i?.successorMembershipId===s.membership&&s.role==='ADMIN'&&s.status==='ACTIVE'&&r.status==='ACTIVE'&&(await ceiling(tx,ws,team,s.membership))?.teamRole==='MEMBER';
 if(!i||i.requestId!==request||!own&&!addressed)fail('NOT_FOUND');
 const state=i.state==='PENDING'?await validIntent(tx,i,r,policy):i.state;
 return {requestId:i.requestId,teamId:team,state,expiresAt:i.expiresAt.toISOString(),baseTeamVersion:i.baseVersion.toString(),revision:i.revision.toString(),initiatorMembershipId:i.initiatorMembershipId,successorMembershipId:i.successorMembershipId};
}
type MemberRow={membershipId:string;displayName:string;workspaceRole:'ADMIN'|'MEMBER'|'OBSERVER';workspaceStatus:'ACTIVE'|'SUSPENDED'|'INVITED';teamRole:TeamCeiling;joinedAt:Date|null;isOwner:boolean};
type MemberCursor={v:number;kid:string;actor:string;workspace:string;team:string;operation:string;limit:number;status:string;policy:string;directory:string;joined:string|null;id:string;issued:number;expires:number};
export async function teamDirectory(tx:Tx,a:PrincipalAuthority,ws:string,team:string,q:MemberQuery,keys:WorkspaceKeys){
 const s=await scope(tx,a.userId,ws,false),policy=await revision(tx,ws),r=await row(tx,ws,team,s);await owner(tx,ws,team,s,r);
 if(!Number.isInteger(q.limit)||q.limit<1||q.limit>100||!['ACTIVE','SUSPENDED','INVITED','ALL'].includes(q.status))fail('INVALID_REQUEST');
 const directory=(await tx.team.findUniqueOrThrow({where:{workspaceId_id:{workspaceId:ws,id:team}},select:{directoryRevision:true}})).directoryRevision.toString();let c:MemberCursor|undefined;
 if(q.after){
  if(q.after.length>2048||!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/.test(q.after))fail('INVALID_REQUEST');const [payload,sig]=q.after.split('.');let value:MemberCursor;try{value=JSON.parse(Buffer.from(payload!,'base64url').toString());}catch{fail('INVALID_REQUEST');}
  if(!value||typeof value.kid!=='string'||!Object.hasOwn(keys.cursors,value.kid)||!timingSafeEqual(Buffer.from(sig!),Buffer.from(mac(keys.cursors[value.kid]!,'unblok-team-members-cursor-v1',payload!))))fail('INVALID_REQUEST');
  if(Object.keys(value).sort().join(',')!=='actor,directory,expires,id,issued,joined,kid,limit,operation,policy,status,team,v,workspace'||value.v!==1||value.operation!=='team:members:v1'||value.actor!==a.userId||value.workspace!==ws||value.team!==team||value.limit!==q.limit||value.status!==q.status||!uuid.test(value.id)||value.joined!==null&&(typeof value.joined!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value.joined)||!Number.isFinite(Date.parse(value.joined)))||!Number.isSafeInteger(value.issued)||!Number.isSafeInteger(value.expires)||value.issued>Date.now()||value.expires<=Date.now()||value.expires<=value.issued||value.expires-value.issued>900000||!/^[1-9][0-9]{0,18}$/.test(value.policy)||!/^[1-9][0-9]{0,18}$/.test(value.directory))fail('INVALID_REQUEST');
  if(value.policy!==policy||value.directory!==directory)fail('CURSOR_STALE');c=value;
 }
 const status=q.status==='ALL'?Prisma.empty:Prisma.sql`AND m.status=${q.status}::"MembershipStatus"`;
 const range=c?Prisma.sql`AND (COALESCE(tm.joined_at,'-infinity'::timestamptz),tm.membership_id)>(COALESCE(${c.joined===null?null:new Date(c.joined)}::timestamptz,'-infinity'::timestamptz),${c.id}::uuid)`:Prisma.empty;
 const rows=await tx.$queryRaw<MemberRow[]>(Prisma.sql`SELECT m.id AS "membershipId",u.name AS "displayName",m.role AS "workspaceRole",m.status AS "workspaceStatus",tm.team_role AS "teamRole",tm.joined_at AS "joinedAt",m.id=${r.ownerMembershipId}::uuid AS "isOwner" FROM team_memberships tm JOIN workspace_memberships m ON m.workspace_id=tm.workspace_id AND m.id=tm.membership_id JOIN users u ON u.id=m.user_id WHERE tm.workspace_id=${ws}::uuid AND tm.team_id=${team}::uuid ${status} ${range} ORDER BY COALESCE(tm.joined_at,'-infinity'::timestamptz),tm.membership_id LIMIT ${q.limit+1}`);
 let bytes=0;
 const output: Array<Omit<MemberRow,'joinedAt'>&{joinedAt:string|null}>=[];
 for(const m of rows.slice(0,q.limit)){const item={...m,joinedAt:m.joinedAt?.toISOString()??null},size=Buffer.byteLength(JSON.stringify(item))+1;if(bytes+size>126976)break;output.push(item);bytes+=size;}
 const hasMore=rows.length>output.length,last=rows[output.length-1];let nextCursor:string|null=null;
 if(hasMore&&last){const issued=Date.now(),value:MemberCursor={v:1,kid:keys.active,actor:a.userId,workspace:ws,team,operation:'team:members:v1',limit:q.limit,status:q.status,policy,directory,joined:last.joinedAt?.toISOString()??null,id:last.membershipId,issued,expires:issued+900000},payload=Buffer.from(JSON.stringify(value)).toString('base64url');nextCursor=payload+'.'+mac(keys.cursors[keys.active]!,'unblok-team-members-cursor-v1',payload);}
 return {items:output,page:{hasMore,nextCursor}};
}
export async function manageTeam(tx:Tx,a:PrincipalAuthority,ws:string,team:string,action:TeamManagementAction,input:ManagementInput,key:string,keys:WorkspaceKeys,target?:string,match?:string){
 const allowed=action==='add'?['membershipId','teamRole']:action==='role'?['teamRole']:action==='request'?['successorMembershipId']:[];
 if(!uuid.test(key)||Object.keys(input).some(k=>!allowed.includes(k))||target&&!uuid.test(target)||action==='add'&&(!input.membershipId||!uuid.test(input.membershipId))||action==='request'&&(!input.successorMembershipId||!uuid.test(input.successorMembershipId))||['add','role'].includes(action)&&!['MEMBER','OBSERVER'].includes(input.teamRole??'')||['role','remove','accept','reject'].includes(action)&&!target)fail('INVALID_REQUEST');
 const s=await scope(tx,a.userId,ws,true),policy=await revision(tx,ws),r=await row(tx,ws,team,s),join=await ceiling(tx,ws,team,s.membership);
 const operation=`team:${action}:v1`;
 const old=await tx.teamMutationResult.findUnique({where:{actorId_workspaceId_operation_requestKey:{actorId:a.userId,workspaceId:ws,operation,requestKey:key}}});
 const consent=['request','accept','reject'].includes(action);
 // Replay binds the recorded original revision, never a changed current slot.
 const captured=consent&&!old?await intent(tx,ws,team):null;
 const intentRevision=old?old.intentRevision:captured?.revision??null;
 const digest=Buffer.from(mac(keys.idempotency,'unblok-team-management-receipt-v1',JSON.stringify({operation,workspace:ws,team,actor:a.userId,target:target??null,match:match??null,body:input,intentRevision:intentRevision?.toString()??null})),'base64url').toString('hex');
 if(consent&&old){if(s.status!=='ACTIVE'||s.role!=='ADMIN'||join?.teamRole!=='MEMBER')fail('FORBIDDEN');}
 else if(action==='accept'||action==='reject'){
  if(s.status!=='ACTIVE'||s.role!=='ADMIN'||join?.teamRole!=='MEMBER'||r.status!=='ACTIVE')fail('FORBIDDEN');
  const i=await intent(tx,ws,team);if(!i||i.requestId!==target)fail('NOT_FOUND');if(i.successorMembershipId!==s.membership){if(i.initiatorMembershipId===s.membership)fail('FORBIDDEN');fail('NOT_FOUND');}
 }else await owner(tx,ws,team,s,r);
 if(old){
  if(old.teamId!==team||old.payloadDigest!==digest)fail('CONFLICT');
  // Matching receipt was actor/scoped before locking; replay allocates no new slot.
  await tx.$queryRaw`SELECT id FROM team_mutation_results WHERE id=${old.id}::uuid FOR UPDATE`;
  if(old.retainUntil<=await currentTime(tx)||old.result===null){await tx.teamMutationResult.update({where:{id:old.id},data:{result:Prisma.DbNull}});return new TeamFault('IDEMPOTENCY_RESULT_EXPIRED');}
  return {status:old.httpStatus??200,value:old.result};
 }
 precondition(r,match);if(r.status!=='ACTIVE'&&action!=='restore'&&action!=='archive')fail('FORBIDDEN');
 const reservation=randomUUID();await tx.$executeRaw`INSERT INTO team_mutation_results(id,workspace_id,actor_id,operation,request_key,payload_digest,team_id,retain_until,intent_revision) VALUES(${reservation}::uuid,${ws}::uuid,${a.userId}::uuid,${operation},${key}::uuid,${digest},${team}::uuid,date_trunc('milliseconds',statement_timestamp())+interval '24 hours',${intentRevision})`;
 await tx.$queryRaw`SELECT id FROM teams WHERE workspace_id=${ws}::uuid AND id=${team}::uuid FOR UPDATE`;
 const existing=await intent(tx,ws,team);if(existing)await tx.$queryRaw`SELECT request_id FROM team_transfer_intents WHERE workspace_id=${ws}::uuid AND team_id=${team}::uuid FOR UPDATE`;
 let value:unknown,status=200;
 if(action==='add'||action==='remove'||action==='role'){
  const member=action==='add'?input.membershipId!:target!,m=await tx.workspaceMembership.findUnique({where:{workspaceId_id:{workspaceId:ws,id:member}}}),j=await ceiling(tx,ws,team,member);
  if(member===r.ownerMembershipId&&(action==='remove'||input.teamRole==='OBSERVER'))fail('CONFLICT');
  if(action!=='remove'&&(!m||m.status!=='ACTIVE'||(await tx.user.findUnique({where:{id:m.userId},select:{authDisabled:true}}))?.authDisabled))fail('CONFLICT');
  let outcome='UNCHANGED';
  if(action==='add'){if(j&&j.teamRole!==input.teamRole)fail('CONFLICT');if(!j){await tx.teamMembership.create({data:{workspaceId:ws,teamId:team,membershipId:member,teamRole:input.teamRole!}});outcome='ADDED';status=201;}}
  else if(action==='remove'){if(j){await tx.teamMembership.delete({where:{workspaceId_teamId_membershipId:{workspaceId:ws,teamId:team,membershipId:member}}});outcome='REMOVED';}}
  else{if(!j)fail('CONFLICT');if(j.teamRole!==input.teamRole){await tx.teamMembership.update({where:{workspaceId_teamId_membershipId:{workspaceId:ws,teamId:team,membershipId:member}},data:{teamRole:input.teamRole!}});outcome='UPDATED';}}
  const version=(await tx.team.findUniqueOrThrow({where:{workspaceId_id:{workspaceId:ws,id:team}},select:{version:true}})).version.toString();
  value={membershipId:member,outcome,version,...(action==='remove'?{}:{teamRole:input.teamRole})};
 }else if(action==='archive'||action==='restore'){
  const desired=action==='archive'?'ARCHIVED':'ACTIVE';
  if(action==='archive'&&r.status!=='ARCHIVED'&&await tx.project.findFirst({where:{workspaceId:ws,teamId:team,status:'ACTIVE'},select:{id:true}}))fail('CONFLICT');
  if(r.status!==desired)await tx.team.update({where:{workspaceId_id:{workspaceId:ws,id:team}},data:{status:desired,version:{increment:1},directoryRevision:{increment:1}}});
  value=teamProjection(await row(tx,ws,team,s),s);
 }else if(action==='request'){
  const member=input.successorMembershipId!,m=await tx.workspaceMembership.findUnique({where:{workspaceId_id:{workspaceId:ws,id:member}}}),j=await ceiling(tx,ws,team,member),u=m?await tx.user.findUnique({where:{id:m.userId}}):null;
  if(member===s.membership||!m||m.role!=='ADMIN'||m.status!=='ACTIVE'||j?.teamRole!=='MEMBER'||!u||u.authDisabled)fail('CONFLICT');
  if(existing&&existing.state==='PENDING'){
   const state=await validIntent(tx,existing,r,policy);
   if(state==='PENDING'){if(existing.successorMembershipId!==member)fail('CONFLICT');value={requestId:existing.requestId,outcome:'RECORDED'};}
   else await tx.teamTransferIntent.update({where:{workspaceId_teamId:{workspaceId:ws,teamId:team}},data:{state,revision:{increment:1}}});
  }
  if(!value){const requestId=randomUUID(),now=await currentTime(tx),data={requestId,initiatorMembershipId:s.membership,successorMembershipId:member,initiatorUserId:a.userId,successorUserId:u.id,sourceFamilyId:a.session!.familyId,initiatorEpoch:a.authEpoch,successorEpoch:u.authEpoch,baseVersion:r.version,policyRevision:BigInt(policy),state:'PENDING',issuedAt:now,expiresAt:new Date(now.getTime()+900000)};
   if(existing)await tx.teamTransferIntent.update({where:{workspaceId_teamId:{workspaceId:ws,teamId:team}},data:{...data,revision:{increment:1}}});else await tx.teamTransferIntent.create({data:{...data,workspaceId:ws,teamId:team}});
   value={requestId,outcome:'RECORDED'};status=201;
  }
 }else{
  const i=existing;if(!i||i.requestId!==target)fail('NOT_FOUND');
  if(i.successorMembershipId!==s.membership)fail('NOT_FOUND');const desired=action==='accept'?'ACCEPTED':'REJECTED';
  if(i.state===desired){value={requestId:i.requestId,outcome:desired,...(desired==='ACCEPTED'?{version:(i.baseVersion+1n).toString()}:{})};}
  else{if(i.state!=='PENDING'||await validIntent(tx,i,r,policy)!=='PENDING')fail('CONFLICT');
   await tx.teamTransferIntent.update({where:{workspaceId_teamId:{workspaceId:ws,teamId:team}},data:{state:desired,revision:{increment:1}}});
   if(action==='accept')await tx.team.update({where:{workspaceId_id:{workspaceId:ws,id:team}},data:{ownerMembershipId:i.successorMembershipId,version:{increment:1},directoryRevision:{increment:1}}});
   value={requestId:i.requestId,outcome:desired,...(desired==='ACCEPTED'?{version:(i.baseVersion+1n).toString()}:{})};
  }
 }
 if(Buffer.byteLength(JSON.stringify(value))>16384)throw new Error('Invalid management result');
 await tx.teamMutationResult.update({where:{id:reservation},data:{result:value as Prisma.InputJsonValue,httpStatus:status}});
 return {status,value};
}
