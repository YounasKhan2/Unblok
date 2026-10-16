import {createHash,createHmac,randomUUID,timingSafeEqual} from 'node:crypto';
import type {Prisma,WorkspaceInvitation} from '@prisma/client';
import {AuthUnavailableError,type PrincipalAuthority} from './auth-fences';
import {WorkspaceFault,type WorkspaceKeys} from './workspaces';
import {workspaceAdmin} from './workspace-memberships';
export interface InvitationKey {readonly id:string;readonly secret:string}
type Transactions={transaction<T>(run:(tx:Prisma.TransactionClient)=>Promise<T>):Promise<T>};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const digest=(key:InvitationKey,domain:string,value:string)=>createHmac('sha256',Buffer.from(key.secret,'hex')).update(domain+'\0'+value).digest('hex');
export function validKey(key:InvitationKey){if(!/^[a-z0-9-]{1,40}$/.test(key.id)||!/^[0-9a-f]{64}$/.test(key.secret))throw new AuthUnavailableError();}
function proof(key:InvitationKey,row:Pick<WorkspaceInvitation,'id'|'workspaceId'|'inviterId'|'inviterEpoch'|'email'|'role'> & Partial<Pick<WorkspaceInvitation,'proofVersion'|'assignmentDigest'|'previousId'>>){
 const legacy=[key.id,row.id,row.workspaceId,row.inviterId,row.inviterEpoch.toString(),row.email,row.role];
 return row.id+'.'+createHmac('sha256',Buffer.from(key.secret,'hex')).update((row.proofVersion===2?'unblok-invitation-proof-v2\0':'unblok-invitation-proof-v1\0')+JSON.stringify(row.proofVersion===2?[...legacy,row.assignmentDigest,row.previousId??null]:legacy)).digest('base64url');
}
export const assignmentDigest=(ids:readonly string[])=>createHash('sha256').update([...ids].sort().join(',')).digest('hex');
export function authenticInvitation(row:WorkspaceInvitation,token:string,key:InvitationKey){return row.keyId===key.id&&timingSafeEqual(Buffer.from(digest(key,'unblok-invitation-digest-v1',token),'hex'),Buffer.from(row.tokenDigest,'hex'));}
export async function invitationPlan(tx:Prisma.TransactionClient,row:WorkspaceInvitation){return tx.$queryRaw<{id:string;version:bigint}[]>`SELECT team_id AS id,team_version AS version FROM workspace_invitation_teams WHERE workspace_id=${row.workspaceId}::uuid AND invitation_id=${row.id}::uuid ORDER BY team_id`;}
export async function invitationTeams(tx:Prisma.TransactionClient,row:WorkspaceInvitation){return (await invitationPlan(tx,row)).map(t=>t.id);}
export async function permittedAssignments(tx:Prisma.TransactionClient,workspaceId:string,member:string,ids:readonly string[]){
 if(ids.length>20||new Set(ids).size!==ids.length||ids.some(id=>!uuid.test(id)))throw new WorkspaceFault('INVALID_REQUEST');
 if(!ids.length)return [];
 const teams=await tx.team.findMany({where:{workspaceId,id:{in:[...ids]},status:'ACTIVE',legacyQuarantined:false,ownerMembershipId:member,memberships:{some:{membershipId:member,teamRole:'MEMBER'}}},select:{id:true,version:true},orderBy:{id:'asc'}});
 if(teams.length!==ids.length)throw new WorkspaceFault('NOT_FOUND');
 return teams;
}
export async function createAdministrationInvitation(tx:Prisma.TransactionClient,a:PrincipalAuthority,workspaceId:string,member:string,input:{email:string;role:'ADMIN'|'MEMBER'|'OBSERVER';teamIds:string[]},key:InvitationKey,previousId:string|null=null){
 validKey(key);const teams=await permittedAssignments(tx,workspaceId,member,input.teamIds);
 const now=await clock(tx),row={id:randomUUID(),workspaceId,inviterId:a.userId,inviterIdentityId:a.identityId,inviterMembershipId:member,inviterEpoch:a.authEpoch,email:input.email,role:input.role,proofVersion:2,assignmentDigest:assignmentDigest(teams.map(t=>t.id+':'+t.version)),previousId};
 await tx.workspaceInvitation.create({data:{...row,keyId:key.id,tokenDigest:digest(key,'unblok-invitation-digest-v1',proof(key,row)),issuedAt:now,expiresAt:new Date(now.getTime()+86400000),delivery:{create:{}}}});
 for(const t of teams)await tx.$executeRaw`INSERT INTO workspace_invitation_teams(workspace_id,invitation_id,team_id,team_version) VALUES(${workspaceId}::uuid,${row.id}::uuid,${t.id}::uuid,${t.version})`;
}
const clock=async(tx:Prisma.TransactionClient)=>(await tx.$queryRaw<{now:Date}[]>`SELECT clock_timestamp() AS now`)[0]!.now;
export function invitationSelector(token:string){const id=token.split('.')[0]??'';return uuid.test(id)?id:null;}
export async function credential(tx:Prisma.TransactionClient,authority:PrincipalAuthority){
 const row=await tx.passwordCredential.findUnique({where:{identityId:authority.identityId},include:{identity:true}});
 return row?.identity.userId===authority.userId&&row.identity.provider==='password'&&row.emailVerifiedAt!==null?row:null;
}
export async function receipt(tx:Prisma.TransactionClient,actor:string,operation:string,key:string,payload:unknown,keys:WorkspaceKeys){
 if(!uuid.test(key))throw new WorkspaceFault('INVALID_REQUEST');
 const value=digest({id:'ledger',secret:keys.idempotency},'unblok-invitation-ledger-v1',JSON.stringify(payload));
 const inserted=await tx.$queryRaw<{actor_id:string}[]>`INSERT INTO workspace_invitation_results(actor_id,operation,request_key,payload_digest) VALUES(${actor}::uuid,${operation},${key}::uuid,${value}) ON CONFLICT(actor_id,operation,request_key) DO NOTHING RETURNING actor_id`;
 const rows=await tx.$queryRaw<{payload_digest:string}[]>`SELECT payload_digest FROM workspace_invitation_results WHERE actor_id=${actor}::uuid AND operation=${operation} AND request_key=${key}::uuid FOR UPDATE`;
 if(rows[0]?.payload_digest!==value)throw new WorkspaceFault('CONFLICT');return inserted.length>0;
}
export async function issueInvitation(tx:Prisma.TransactionClient,authority:PrincipalAuthority,workspaceId:string,input:{email:string;role:'MEMBER'|'OBSERVER';key:string},key:InvitationKey,keys:WorkspaceKeys){
 validKey(key);const member=await workspaceAdmin(tx,authority.userId,workspaceId,true);
 const sender=await credential(tx,authority);if(!sender)throw new WorkspaceFault('NOT_FOUND');
 if(input.email.length>320||!input.email.includes('@')||!(/^[\x21-\x7e]+$/).test(input.email)||input.email!==input.email.trim().toLowerCase()||!['MEMBER','OBSERVER'].includes(input.role))throw new WorkspaceFault('INVALID_REQUEST');
 if(!await receipt(tx,authority.userId,'workspace:invite:v1',input.key,{workspaceId,email:input.email,role:input.role},keys))return;
 const now=await clock(tx),old=await tx.workspaceInvitation.findFirst({where:{workspaceId,email:input.email,consumedAt:null,canceledAt:null},include:{delivery:true}});
 if(old&&old.expiresAt>now&&old.attempts<10&&old.keyId===key.id&&old.inviterId===authority.userId&&old.inviterEpoch===authority.authEpoch&&old.inviterMembershipId===member.id&&old.delivery&&(old.delivery.deliveredAt!==null||old.delivery.attempts<5||(old.delivery.leaseUntil!==null&&old.delivery.leaseUntil>now)))return;
 if(old)await tx.workspaceInvitation.update({where:{id:old.id},data:{canceledAt:now}});
 const row={id:randomUUID(),workspaceId,inviterId:authority.userId,inviterIdentityId:authority.identityId,inviterMembershipId:member.id,inviterEpoch:authority.authEpoch,email:input.email,role:input.role};
 await tx.workspaceInvitation.create({data:{...row,keyId:key.id,tokenDigest:digest(key,'unblok-invitation-digest-v1',proof(key,row)),issuedAt:now,expiresAt:new Date(now.getTime()+86400000),delivery:{create:{}}}});
}
export async function acceptInvitation(tx:Prisma.TransactionClient,authority:PrincipalAuthority,selector:string|null,token:string,requestKey:string,key:InvitationKey,keys:WorkspaceKeys){
 validKey(key);const initial=selector?await tx.workspaceInvitation.findUnique({where:{id:selector}}):null;
 // Wrong/unverified recipients may not lock an unrelated tenant. This immutable
 // credential precheck grants nothing; eligible requests re-read under the later lock.
 const preliminary=await credential(tx,authority);
 if(initial&&(!preliminary||preliminary.email!==initial.email)){await receipt(tx,authority.userId,'invitation:accept:v1',requestKey,{token},keys);return;}
 // User locks were acquired before recipient family; now lock Workspace before ledger.
 if(initial)await tx.$queryRaw`SELECT id FROM workspaces WHERE id=${initial.workspaceId}::uuid FOR UPDATE`;
 if(!await receipt(tx,authority.userId,'invitation:accept:v1',requestKey,{token},keys))return;
 if(!initial)return;
 await tx.$queryRaw`SELECT identity_id FROM password_credentials WHERE identity_id=${authority.identityId}::uuid FOR SHARE`;
 await tx.$queryRaw`SELECT id FROM workspace_invitations WHERE id=${initial.id}::uuid FOR UPDATE`;
 const row=await tx.workspaceInvitation.findUniqueOrThrow({where:{id:initial.id}}),recipient=await credential(tx,authority),now=await clock(tx);
 if(!recipient||recipient.email!==row.email||row.consumedAt||row.canceledAt||row.expiresAt<=now||row.attempts>=10||row.keyId!==key.id)return;
 const supplied=digest(key,'unblok-invitation-digest-v1',token),matches=timingSafeEqual(Buffer.from(supplied,'hex'),Buffer.from(row.tokenDigest,'hex'));
 // Incorrect attempts must COMMIT even though the public result is always202.
 if(!matches){await tx.workspaceInvitation.update({where:{id:row.id},data:{attempts:{increment:1}}});return;}
 const issuer=await tx.user.findUnique({where:{id:row.inviterId},select:{authEpoch:true,authDisabled:true}}),workspace=await tx.workspace.findUnique({where:{id:row.workspaceId},select:{status:true}});
 const issuerCredential=await tx.passwordCredential.findUnique({where:{identityId:row.inviterIdentityId},include:{identity:true}});
 const inviter=await tx.workspaceMembership.findUnique({where:{workspaceId_id:{workspaceId:row.workspaceId,id:row.inviterMembershipId}},select:{userId:true,role:true,status:true}});
 if(!issuer||issuer.authDisabled||issuer.authEpoch!==row.inviterEpoch||workspace?.status!=='ACTIVE'||inviter?.userId!==row.inviterId||inviter.role!=='ADMIN'||inviter.status!=='ACTIVE'||!issuerCredential||issuerCredential.identity.userId!==row.inviterId||issuerCredential.identity.provider!=='password'||issuerCredential.emailVerifiedAt===null)return;
 const existing=await tx.workspaceMembership.findUnique({where:{workspaceId_userId:{workspaceId:row.workspaceId,userId:authority.userId}},select:{id:true,role:true,status:true}});
 if(existing?.status==='SUSPENDED')return;
 const plan=row.proofVersion===2?await invitationPlan(tx,row):[],assigned=plan.map(t=>t.id);
 if(row.proofVersion===2){
  if(assignmentDigest(plan.map(t=>t.id+':'+t.version))!==row.assignmentDigest)return;
  try{const current=await permittedAssignments(tx,row.workspaceId,row.inviterMembershipId,assigned);if(current.some((t,i)=>t.version!==plan[i]?.version))return;}catch(error){if(error instanceof WorkspaceFault)return;throw error;}
 }
 const consumed=await tx.$queryRaw<{id:string}[]>`UPDATE workspace_invitations SET consumed_at=clock_timestamp() WHERE id=${row.id}::uuid AND consumed_at IS NULL AND canceled_at IS NULL AND attempts<10 AND expires_at>clock_timestamp() RETURNING id`;
 if(!consumed.length)return;
 if(existing?.status==='ACTIVE')return; // Never change an existing ACTIVE role.
 const member=existing?await tx.workspaceMembership.update({where:{workspaceId_id:{workspaceId:row.workspaceId,id:existing.id}},data:{status:'ACTIVE',role:row.role,joinedAt:now}}):await tx.workspaceMembership.create({data:{workspaceId:row.workspaceId,userId:authority.userId,status:'ACTIVE',role:row.role,joinedAt:now}});
 if(assigned.length)await tx.teamMembership.createMany({data:assigned.map(teamId=>({workspaceId:row.workspaceId,teamId,membershipId:member.id,teamRole:row.role==='OBSERVER'?'OBSERVER' as const:'MEMBER' as const,joinedAt:now}))});
}
// Worker-only capability. Lease before external delivery; no tokens in queue/DB.
export class InvitationDelivery {
 constructor(private readonly database:Transactions,private readonly key:InvitationKey){validKey(key);}
 async once(send:(email:string,token:string,id:string)=>Promise<void>){
  try{const lease=randomUUID();const row=await this.database.transaction(async tx=>{
   await tx.$executeRaw`SET LOCAL lock_timeout='1500ms'`;await tx.$executeRaw`SET LOCAL statement_timeout='4000ms'`;
   const rows=await tx.$queryRaw<{invitation_id:string}[]>`SELECT o.invitation_id FROM workspace_invitation_outbox o JOIN workspace_invitations c ON c.id=o.invitation_id JOIN users u ON u.id=c.inviter_id JOIN workspaces w ON w.id=c.workspace_id JOIN workspace_memberships m ON m.workspace_id=c.workspace_id AND m.id=c.inviter_membership_id AND m.user_id=c.inviter_id JOIN password_credentials p ON p.identity_id=c.inviter_identity_id JOIN identities i ON i.id=p.identity_id AND i.user_id=c.inviter_id AND i.provider='password' WHERE o.delivered_at IS NULL AND o.attempts<5 AND o.next_attempt_at<=clock_timestamp() AND (o.lease_until IS NULL OR o.lease_until<=clock_timestamp()) AND c.key_id=${this.key.id} AND c.expires_at>clock_timestamp() AND c.consumed_at IS NULL AND c.canceled_at IS NULL AND c.attempts<10 AND NOT u.auth_disabled AND u.auth_epoch=c.inviter_epoch AND w.status='ACTIVE' AND m.role='ADMIN' AND m.status='ACTIVE' AND p.email_verified_at IS NOT NULL ORDER BY o.next_attempt_at,o.invitation_id LIMIT 1 FOR UPDATE OF o SKIP LOCKED`;
   if(!rows[0])return null;await tx.workspaceInvitationOutbox.update({where:{invitationId:rows[0].invitation_id},data:{leaseId:lease,leaseUntil:new Date((await clock(tx)).getTime()+30000),attempts:{increment:1}}});return tx.workspaceInvitation.findUniqueOrThrow({where:{id:rows[0].invitation_id}});
  });if(!row)return false;
  // Eligibility is a lease-time snapshot, not an external-mail cancellation
  // guarantee. Demotion/archival after commit can still precede this send.
  // Redemption must revalidate the proof's current primary database authority.
  const token=proof(this.key,row);if(!timingSafeEqual(Buffer.from(digest(this.key,'unblok-invitation-digest-v1',token),'hex'),Buffer.from(row.tokenDigest,'hex')))throw new AuthUnavailableError();
  let delivered=false;try{await send(row.email,token,row.id);delivered=true;}catch{/* unknown acknowledgement; never grant authority */}
  await this.database.transaction(async tx=>{const now=await clock(tx);await tx.workspaceInvitationOutbox.updateMany({where:{invitationId:row.id,leaseId:lease},data:{leaseId:null,leaseUntil:null,...(delivered?{deliveredAt:now}:{nextAttemptAt:new Date(now.getTime()+30000)})}});});return true;
  }catch{throw new AuthUnavailableError();}
 }
}
