import {createHmac,timingSafeEqual} from 'node:crypto';
import {Prisma,type WorkspaceRole} from '@prisma/client';
import type {PrincipalAuthority} from './auth-fences';
import {WorkspaceFault,type WorkspaceKeys} from './workspaces';
import {workspaceAdmin} from './workspace-memberships';
import {credential,receipt,createAdministrationInvitation,permittedAssignments,invitationTeams,authenticInvitation,type InvitationKey} from './workspace-invitations';

type Tx=Prisma.TransactionClient;
export type AdministrationQuery={limit:number;after?:string|undefined;status?:string|undefined;role?:WorkspaceRole|undefined;search?:string|undefined;teamId?:string|undefined};
export type AdministrationAction='invite'|'resend'|'revoke'|'role'|'remove';
export type AdministrationInput={email?:string|undefined;role?:WorkspaceRole|undefined;teamIds?:string[]|undefined};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const fail=(reason:ConstructorParameters<typeof WorkspaceFault>[0]):never=>{throw new WorkspaceFault(reason);};
const clock=async(tx:Tx)=>(await tx.$queryRaw<{now:Date}[]>`SELECT clock_timestamp() AS now`)[0]!.now;
async function admission(tx:Tx,a:PrincipalAuthority,ws:string,write=false){const m=await workspaceAdmin(tx,a.userId,ws,write);if(!await credential(tx,a))fail('NOT_FOUND');return m;}
async function revision(tx:Tx,ws:string,keys:WorkspaceKeys){
 const rows=await tx.$queryRaw<{revision:bigint;authority:string}[]>`SELECT r.revision,((SELECT COALESCE(sum(u.auth_epoch),0)::text||':'||count(*) FILTER(WHERE u.auth_disabled)::text FROM users u WHERE u.id IN(SELECT inviter_id FROM workspace_invitations WHERE workspace_id=${ws}::uuid))||':'||(SELECT count(*)::text FROM password_credentials p WHERE p.email_verified_at IS NOT NULL AND p.identity_id IN(SELECT inviter_identity_id FROM workspace_invitations WHERE workspace_id=${ws}::uuid))) AS authority FROM workspace_administration_revisions r WHERE r.workspace_id=${ws}::uuid FOR SHARE OF r`;
 if(!rows[0])return fail('NOT_FOUND');
 // Epochs are monotonic; aggregate is scoped to distinct issuers, not per invitation.
 // HMAC prevents exposing cross-account epoch/verification counts in cursors.
 return rows[0].revision.toString()+':'+createHmac('sha256',Buffer.from(keys.idempotency,'hex')).update('unblok-administration-authority-v2\0'+ws+'\0'+rows[0].authority).digest('hex');
}
const publicRevision=(value:string)=>value.split(':')[0]!;
const mac=(secret:string,data:string)=>createHmac('sha256',Buffer.from(secret,'hex')).update('unblok-administration-cursor-v2\0'+data).digest('base64url');
type Cursor={v:2;kid:string;binding:string;revision:string;id:string;at:string;asOf:string;issued:number;expires:number};
function cursorContext(a:PrincipalAuthority,ws:string,operation:string,q:AdministrationQuery){return JSON.stringify([a.userId,a.identityId,ws,operation,q.limit,q.status??null,q.role??null,q.search??null,q.teamId??null]);}
function decode(q:AdministrationQuery,binding:string,rev:string,keys:WorkspaceKeys):Cursor|undefined{
 if(!Number.isInteger(q.limit)||q.limit<1||q.limit>100)fail('INVALID_REQUEST');if(!q.after)return;
 if(q.after.length>4096||!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/.test(q.after))fail('INVALID_REQUEST');
 const [data,sig]=q.after.split('.');let c:Cursor;try{c=JSON.parse(Buffer.from(data!,'base64url').toString('utf8'));}catch{fail('INVALID_REQUEST');}
 if(!c!||typeof c!.kid!=='string'||!Object.hasOwn(keys.cursors,c!.kid)||!timingSafeEqual(Buffer.from(sig!),Buffer.from(mac(keys.cursors[c!.kid]!,data!))))fail('INVALID_REQUEST');
 if(Object.keys(c!).sort().join(',')!=='asOf,at,binding,expires,id,issued,kid,revision,v'||c!.v!==2||c!.binding!==binding||!uuid.test(c!.id)||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(c!.at)||!Number.isFinite(Date.parse(c!.at))||!Number.isFinite(Date.parse(c!.asOf))||!Number.isSafeInteger(c!.issued)||!Number.isSafeInteger(c!.expires)||c!.issued>Date.now()||c!.expires<=Date.now()||c!.expires<=c!.issued||c!.expires-c!.issued>900000)fail('INVALID_REQUEST');
 if(c!.revision!==rev)fail('CURSOR_STALE');return c!;
}
function paginate<T extends {id:string}>(rows:T[],q:AdministrationQuery,binding:string,rev:string,keys:WorkspaceKeys,asOf:string,at:(row:T)=>string,c?:Cursor){
 const items=rows.slice(0,q.limit),last=items.at(-1),hasMore=rows.length>q.limit;let nextCursor:string|null=null;
 if(hasMore&&last){const issued=c?.issued??Date.now(),value:Cursor={v:2,kid:keys.active,binding,revision:rev,id:last.id,at:at(last),asOf,issued,expires:c?.expires??issued+900000};const data=Buffer.from(JSON.stringify(value)).toString('base64url');nextCursor=data+'.'+mac(keys.cursors[keys.active]!,data);}
 return {items,page:{hasMore,nextCursor}};
}
type TeamRow={id:string;name:string;key:string};
async function memberTeams(tx:Tx,ws:string,ids:string[],limit=6){if(!ids.length)return [];
 return tx.$queryRaw<(TeamRow&{membershipId:string})[]>(Prisma.sql`SELECT m.id AS "membershipId",t.* FROM workspace_memberships m CROSS JOIN LATERAL (SELECT t.id,t.name,t.key FROM team_memberships tm JOIN teams t ON t.workspace_id=tm.workspace_id AND t.id=tm.team_id WHERE tm.workspace_id=m.workspace_id AND tm.membership_id=m.id AND NOT t.legacy_quarantined ORDER BY t.id LIMIT ${limit}) t WHERE m.workspace_id=${ws}::uuid AND m.id IN (${Prisma.join(ids.map(id=>Prisma.sql`${id}::uuid`))}) ORDER BY m.id,t.id`);
}
export async function administrationMembers(tx:Tx,a:PrincipalAuthority,ws:string,q:AdministrationQuery,keys:WorkspaceKeys,currentKey?:InvitationKey){
 await admission(tx,a,ws);const rev=await revision(tx,ws,keys),binding=cursorContext(a,ws,'members:v2:'+(currentKey?.id??''),q),c=decode(q,binding,rev,keys),asOf=c?.asOf??(await clock(tx)).toISOString();
 if(q.teamId&&!uuid.test(q.teamId)||q.role&&!['ADMIN','MEMBER','OBSERVER'].includes(q.role)||q.status&&!['ALL','ACTIVE','INVITED','SUSPENDED','REMOVED'].includes(q.status)||q.search&&q.search.length>120)fail('INVALID_REQUEST');
 const status=q.status==='REMOVED'?Prisma.sql`AND m.removed_at IS NOT NULL`:q.status&&q.status!=='ALL'?Prisma.sql`AND m.status=${q.status}::"MembershipStatus" AND m.removed_at IS NULL`:Prisma.empty;
 const role=q.role?Prisma.sql`AND m.role=${q.role}::"WorkspaceRole"`:Prisma.empty;
 const search=q.search?Prisma.sql`AND (strpos(lower(u.name),lower(${q.search}))>0 OR strpos(lower(COALESCE(u.email,'')),lower(${q.search}))>0)`:Prisma.empty;
 const team=q.teamId?Prisma.sql`AND EXISTS(SELECT 1 FROM team_memberships tm WHERE tm.workspace_id=m.workspace_id AND tm.membership_id=m.id AND tm.team_id=${q.teamId}::uuid)`:Prisma.empty;
 const where=Prisma.sql`m.workspace_id=${ws}::uuid ${status} ${role} ${search} ${team}`;
 const range=c?Prisma.sql`AND (COALESCE(m.joined_at,'1970-01-01'::timestamptz),m.id)>(${new Date(c.at)}::timestamptz,${c.id}::uuid)`:Prisma.empty;
 type Row={id:string;displayName:string;email:string|null;role:WorkspaceRole;status:'ACTIVE'|'INVITED'|'SUSPENDED';joinedAt:Date|null;removedAt:Date|null;revision:bigint};
 const rows=await tx.$queryRaw<Row[]>(Prisma.sql`SELECT m.id,u.name AS "displayName",u.email,m.role,m.status,m.joined_at AS "joinedAt",m.removed_at AS "removedAt",m.administration_version AS revision FROM workspace_memberships m JOIN users u ON u.id=m.user_id WHERE ${where} ${range} ORDER BY COALESCE(m.joined_at,'1970-01-01'::timestamptz),m.id LIMIT ${q.limit+1}`);
 const counts=await tx.$queryRaw<{matching:bigint;active:bigint;pending:bigint}[]>(Prisma.sql`SELECT (SELECT count(*) FROM workspace_memberships m JOIN users u ON u.id=m.user_id WHERE ${where}) AS matching,(SELECT count(*) FROM workspace_memberships WHERE workspace_id=${ws}::uuid AND status='ACTIVE') AS active,(SELECT count(*) FROM workspace_invitations i ${invitationAuthorityJoins} WHERE i.workspace_id=${ws}::uuid AND i.key_id=${currentKey?.id??''} AND ${lifecycle(asOf)}='PENDING') AS pending`);
 const nested=await memberTeams(tx,ws,rows.slice(0,q.limit).map(r=>r.id));
 const result=paginate(rows,q,binding,rev,keys,asOf,r=>r.joinedAt?.toISOString()??new Date(0).toISOString(),c);
 return {...result,revision:publicRevision(rev),totals:{activeMembers:Number(counts[0]!.active),matchingMembers:Number(counts[0]!.matching),pendingInvitations:Number(counts[0]!.pending)},items:result.items.map(r=>{const tq={limit:5},tb=cursorContext(a,ws,'member-teams:'+r.id,tq),ts=nested.filter(t=>t.membershipId===r.id).map(({id,name,key})=>({id,name,key}));return {...r,revision:r.revision.toString(),joinedAt:r.joinedAt?.toISOString()??null,removedAt:r.removedAt?.toISOString()??null,teams:paginate(ts,tq,tb,rev,keys,asOf,()=>new Date(0).toISOString())};})};
}
export async function administrationTeams(tx:Tx,a:PrincipalAuthority,ws:string,q:AdministrationQuery,keys:WorkspaceKeys,member?:string){
 const actor=await admission(tx,a,ws),rev=await revision(tx,ws,keys);if(member&&!uuid.test(member))fail('INVALID_REQUEST');
 if(member&&!await tx.workspaceMembership.findUnique({where:{workspaceId_id:{workspaceId:ws,id:member}},select:{id:true}}))fail('NOT_FOUND');
 const binding=cursorContext(a,ws,member?'member-teams:'+member:'eligible-teams:v2',q),c=decode(q,binding,rev,keys),asOf=c?.asOf??(await clock(tx)).toISOString();
 const filter=member?Prisma.sql`EXISTS(SELECT 1 FROM team_memberships tm WHERE tm.workspace_id=t.workspace_id AND tm.team_id=t.id AND tm.membership_id=${member}::uuid)`:Prisma.sql`t.status='ACTIVE' AND t.owner_membership_id=${actor.id}::uuid AND EXISTS(SELECT 1 FROM team_memberships tm WHERE tm.workspace_id=t.workspace_id AND tm.team_id=t.id AND tm.membership_id=${actor.id}::uuid AND tm.team_role='MEMBER')`;
 const rows=await tx.$queryRaw<TeamRow[]>(Prisma.sql`SELECT t.id,t.name,t.key FROM teams t WHERE t.workspace_id=${ws}::uuid AND NOT t.legacy_quarantined AND ${filter} ${c?Prisma.sql`AND t.id>${c.id}::uuid`:Prisma.empty} ORDER BY t.id LIMIT ${q.limit+1}`);
 return paginate(rows,q,binding,rev,keys,asOf,()=>new Date(0).toISOString(),c);
}
// A public response never evaluates or returns this private lifecycle projection.
const invitationAuthorityJoins=Prisma.sql`LEFT JOIN users iu ON iu.id=i.inviter_id LEFT JOIN workspaces iw ON iw.id=i.workspace_id LEFT JOIN workspace_memberships im ON im.workspace_id=i.workspace_id AND im.id=i.inviter_membership_id AND im.user_id=i.inviter_id LEFT JOIN password_credentials ic ON ic.identity_id=i.inviter_identity_id LEFT JOIN identities ii ON ii.id=ic.identity_id AND ii.user_id=i.inviter_id AND ii.provider='password'`;
function lifecycle(asOf:string){return Prisma.sql`CASE WHEN i.consumed_at IS NOT NULL THEN 'ACCEPTED' WHEN i.canceled_at IS NOT NULL AND EXISTS(SELECT 1 FROM workspace_invitations successor WHERE successor.previous_id=i.id) THEN 'SUPERSEDED' WHEN i.canceled_at IS NOT NULL THEN 'REVOKED' WHEN i.expires_at<=${new Date(asOf)}::timestamptz THEN 'EXPIRED' WHEN i.attempts>=10 OR iu.id IS NULL OR iu.auth_disabled OR iu.auth_epoch<>i.inviter_epoch OR im.id IS NULL OR im.role<>'ADMIN' OR im.status<>'ACTIVE' OR iw.status<>'ACTIVE' OR ic.email_verified_at IS NULL OR ii.id IS NULL OR EXISTS(SELECT 1 FROM workspace_invitation_teams it JOIN teams t ON t.workspace_id=it.workspace_id AND t.id=it.team_id WHERE it.invitation_id=i.id AND (t.status<>'ACTIVE' OR t.legacy_quarantined OR t.version<>it.team_version OR t.owner_membership_id<>i.inviter_membership_id OR NOT EXISTS(SELECT 1 FROM team_memberships tm WHERE tm.workspace_id=t.workspace_id AND tm.team_id=t.id AND tm.membership_id=i.inviter_membership_id AND tm.team_role='MEMBER'))) THEN 'INVALIDATED' ELSE 'PENDING' END`;}
type InvitationRow={id:string;previousId:string|null;email:string;role:WorkspaceRole;status:string;delivery:string;issuedAt:Date;expiresAt:Date;consumedAt:Date|null;canceledAt:Date|null};
export async function administrationInvitations(tx:Tx,a:PrincipalAuthority,ws:string,q:AdministrationQuery,keys:WorkspaceKeys,invitation?:string,currentKey?:InvitationKey){
 await admission(tx,a,ws);if(invitation&&!uuid.test(invitation))fail('INVALID_REQUEST');const rev=await revision(tx,ws,keys),binding=cursorContext(a,ws,'invitations:v2:'+(currentKey?.id??''),q),c=decode(q,binding,rev,keys),asOf=c?.asOf??(await clock(tx)).toISOString();
 if(q.status&&!['PENDING','ACCEPTED','REVOKED','EXPIRED','SUPERSEDED','INVALIDATED'].includes(q.status)||q.search&&q.search.length>120)fail('INVALID_REQUEST');
 const state=Prisma.sql`CASE WHEN i.key_id<>${currentKey?.id??''} AND i.consumed_at IS NULL AND i.canceled_at IS NULL AND i.expires_at>${new Date(asOf)}::timestamptz THEN 'INVALIDATED' ELSE ${lifecycle(asOf)} END`;
 const where=Prisma.sql`i.workspace_id=${ws}::uuid ${invitation?Prisma.sql`AND i.id=${invitation}::uuid`:Prisma.empty} ${q.status?Prisma.sql`AND ${state}=${q.status}`:Prisma.empty} ${q.search?Prisma.sql`AND strpos(lower(i.email),lower(${q.search}))>0`:Prisma.empty}`;
 const rows=await tx.$queryRaw<InvitationRow[]>(Prisma.sql`SELECT i.id,i.previous_id AS "previousId",i.email,i.role,${state} AS status,CASE WHEN o.delivered_at IS NOT NULL THEN 'DELIVERED' WHEN o.invitation_id IS NULL OR (o.attempts>=5 AND (o.lease_until IS NULL OR o.lease_until<=${new Date(asOf)}::timestamptz)) THEN 'FAILED' ELSE 'QUEUED' END AS delivery,i.issued_at AS "issuedAt",i.expires_at AS "expiresAt",i.consumed_at AS "consumedAt",i.canceled_at AS "canceledAt" FROM workspace_invitations i ${invitationAuthorityJoins} LEFT JOIN workspace_invitation_outbox o ON o.invitation_id=i.id WHERE ${where} ${c?Prisma.sql`AND (i.issued_at,i.id)>(${new Date(c.at)}::timestamptz,${c.id}::uuid)`:Prisma.empty} ORDER BY i.issued_at,i.id LIMIT ${q.limit+1}`);
 if(invitation&&!rows.length)fail('NOT_FOUND');
 const total=await tx.$queryRaw<{n:bigint}[]>(Prisma.sql`SELECT count(*) AS n FROM workspace_invitations i ${invitationAuthorityJoins} WHERE ${where}`);
 const ids=rows.slice(0,q.limit).map(r=>r.id),teams=ids.length?await tx.$queryRaw<(TeamRow&{invitationId:string})[]>(Prisma.sql`SELECT it.invitation_id AS "invitationId",t.id,t.name,t.key FROM workspace_invitation_teams it JOIN teams t ON t.workspace_id=it.workspace_id AND t.id=it.team_id WHERE it.workspace_id=${ws}::uuid AND it.invitation_id IN (${Prisma.join(ids.map(id=>Prisma.sql`${id}::uuid`))}) ORDER BY it.invitation_id,t.id`):[];
 const result=paginate(rows,q,binding,rev,keys,asOf,r=>r.issuedAt.toISOString(),c);
 const projected=result.items.map(r=>({...r,revision:publicRevision(rev),issuedAt:r.issuedAt.toISOString(),expiresAt:r.expiresAt.toISOString(),consumedAt:r.consumedAt?.toISOString()??null,canceledAt:r.canceledAt?.toISOString()??null,teams:teams.filter(t=>t.invitationId===r.id).map(({id,name,key})=>({id,name,key}))}));
 return {...result,items:projected,revision:publicRevision(rev),total:Number(total[0]!.n)};
}
export async function administrationMutation(tx:Tx,a:PrincipalAuthority,ws:string,action:AdministrationAction,input:AdministrationInput,key:string,keys:WorkspaceKeys,invKey:InvitationKey,target?:string,match?:string){
 const actor=await admission(tx,a,ws,true);if(target&&!uuid.test(target))fail('INVALID_REQUEST');
 if(!await receipt(tx,a.userId,'administration:'+action+':v2',key,{workspaceId:ws,target:target??null,input,match:match??null},keys))return {status:'accepted' as const};
 if(action==='invite'){
  if(!input.email||input.email.length>320||input.email!==input.email.trim().toLowerCase()||!/^\S+@\S+$/.test(input.email)||!/^[\x21-\x7e]+$/.test(input.email)||!input.role||!['ADMIN','MEMBER','OBSERVER'].includes(input.role))fail('INVALID_REQUEST');
  await permittedAssignments(tx,ws,actor.id,input.teamIds??[]);
  const old=await tx.workspaceInvitation.findFirst({where:{workspaceId:ws,email:input.email!,consumedAt:null,canceledAt:null}});
  // A repeated new issuance is not a resend; only the explicit resend operation rotates proof authority.
  if(!old)await createAdministrationInvitation(tx,a,ws,actor.id,{email:input.email!,role:input.role!,teamIds:input.teamIds??[]},invKey);
 }else{
  if(!target)fail('INVALID_REQUEST');
  if(!match)fail('PRECONDITION_REQUIRED');if(!/^"[1-9][0-9]{0,18}"$/.test(match!))fail('INVALID_REQUEST');
  if(action==='role'||action==='remove'){
   const row=await tx.workspaceMembership.findUnique({where:{workspaceId_id:{workspaceId:ws,id:target!}}});if(!row)fail('NOT_FOUND');
   if(match!==`"${row!.administrationVersion}"`)fail('PRECONDITION_FAILED');
   if(row!.removedAt||row!.status!=='ACTIVE')fail('CONFLICT');
   const role=action==='role'?input.role:row!.role;if(!role||!['ADMIN','MEMBER','OBSERVER'].includes(role))fail('INVALID_REQUEST');
   if(action==='remove'||role!=='ADMIN'){
    if(await tx.team.count({where:{workspaceId:ws,ownerMembershipId:target!,legacyQuarantined:false}}))fail('CONFLICT');
    if(row!.role==='ADMIN'&&await tx.workspaceMembership.count({where:{workspaceId:ws,role:'ADMIN',status:'ACTIVE',id:{not:target!}}})===0)fail('CONFLICT');
   }
   await tx.workspaceMembership.update({where:{workspaceId_id:{workspaceId:ws,id:target!}},data:action==='remove'?{status:'SUSPENDED',removedAt:await clock(tx)}:{role:role!}});
  }else{
   const row=await tx.workspaceInvitation.findFirst({where:{workspaceId:ws,id:target!}});if(!row)fail('NOT_FOUND');
   if(match!==`"${publicRevision(await revision(tx,ws,keys))}"`)fail('PRECONDITION_FAILED');
   if(row!.consumedAt)fail('CONFLICT');
   if(action==='resend'){
    if(await tx.workspaceInvitation.count({where:{previousId:target!}}))fail('CONFLICT');
    const teams=await invitationTeams(tx,row!);await permittedAssignments(tx,ws,actor.id,teams);
    if(!row!.canceledAt)await tx.workspaceInvitation.update({where:{id:target!},data:{canceledAt:await clock(tx)}});
    await createAdministrationInvitation(tx,a,ws,actor.id,{email:row!.email,role:row!.role,teamIds:teams},invKey,target!);
   }else if(!row!.canceledAt)await tx.workspaceInvitation.update({where:{id:target!},data:{canceledAt:await clock(tx)}});
  }
 }
 return {status:'accepted' as const};
}
export async function administrationPreview(tx:Tx,a:PrincipalAuthority,token:string,key:InvitationKey){
 const neutral={status:'accepted' as const},id=token.split('.')[0]??'';if(!uuid.test(id))return neutral;
 const row=await tx.workspaceInvitation.findUnique({where:{id}}),recipient=await credential(tx,a);
 if(!row||!recipient||recipient.email!==row.email||!authenticInvitation(row,token,key))return neutral;
 await tx.$queryRaw`SELECT id FROM workspaces WHERE id=${row.workspaceId}::uuid FOR SHARE`;
 const now=await clock(tx),rows=await tx.$queryRaw<{status:string}[]>(Prisma.sql`SELECT ${lifecycle(now.toISOString())} AS status FROM workspace_invitations i ${invitationAuthorityJoins} WHERE i.id=${id}::uuid`);
 const workspace=await tx.workspace.findUnique({where:{id:row.workspaceId},select:{name:true}});
 const teams=await tx.$queryRaw<TeamRow[]>`SELECT t.id,t.name,t.key FROM workspace_invitation_teams it JOIN teams t ON t.workspace_id=it.workspace_id AND t.id=it.team_id WHERE it.workspace_id=${row.workspaceId}::uuid AND it.invitation_id=${id}::uuid ORDER BY t.id`;
 return {invitation:{workspaceId:row.workspaceId,workspaceName:workspace!.name,email:row.email,role:row.role,status:rows[0]!.status,expiresAt:row.expiresAt.toISOString(),teams}};
}
export async function administrationSelectors(tx:Tx,ws:string,target?:string){
 if(!uuid.test(ws)||target&&!uuid.test(target))return [];
 // Identifiers discovered before locks do not authorize; mutation re-reads under the Workspace gate.
 const row=target?await tx.workspaceMembership.findUnique({where:{workspaceId_id:{workspaceId:ws,id:target}},select:{userId:true}}):null;
 return row?[row.userId]:[];
}
