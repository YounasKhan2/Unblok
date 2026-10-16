import {administrationMemberPageSchema,administrationInvitationPageSchema,administrationTeamPageSchema,administrationInviteSchema,administrationPreviewSchema,signupResponseSchema} from '@unblok/contracts';
import {AuthApi} from '../../auth/api/authApi';
export type MemberPage=ReturnType<typeof administrationMemberPageSchema.parse>;
export type InvitationPage=ReturnType<typeof administrationInvitationPageSchema.parse>;
export type TeamPage=ReturnType<typeof administrationTeamPageSchema.parse>;
export type Invite=ReturnType<typeof administrationInviteSchema.parse>;
export type RecipientPreview=ReturnType<typeof administrationPreviewSchema.parse>;
export type Filters={status?:string;search:string;role:string;teamId:string};
export type Operation={action:'invite'|'resend'|'revoke'|'role'|'remove';target?:string;body?:Invite|{role:Invite['role']};match?:string;key:string;actor:string;workspace:string};
export class AdministrationApi {
 constructor(private readonly auth:AuthApi){}
 private root(id:string){return '/'+id+'/administration';}
 members(id:string,f:Filters,signal:AbortSignal,after?:string){const q=new URLSearchParams({limit:'20',status:f.status??'ACTIVE'});for(const k of ['search','role','teamId'] as const)if(f[k]&&f[k]!=='ALL')q.set(k,f[k]);if(after)q.set('after',after);return this.auth.administrationRead(this.root(id)+'/memberships?'+q,administrationMemberPageSchema,signal);}
 invitations(id:string,signal:AbortSignal,after?:string){return this.auth.administrationRead(this.root(id)+'/invitations?'+new URLSearchParams({limit:'20',...(after?{after}:{})}),administrationInvitationPageSchema,signal);}
 teams(id:string,signal:AbortSignal,after?:string,member?:string){return this.auth.administrationRead(this.root(id)+(member?'/memberships/'+member+'/teams':'/eligible-teams')+'?'+new URLSearchParams({limit:member?'5':'100',...(after?{after}:{})}),administrationTeamPageSchema,signal);}
 mutate(op:Operation,signal:AbortSignal){const path=this.root(op.workspace)+(op.action==='invite'?'/invitations':op.action==='role'||op.action==='remove'?'/memberships/'+op.target:'/invitations/'+op.target+'/'+op.action);return this.auth.administrationMutation(path,signupResponseSchema,op.action==='remove'?undefined:op.body??{},op.key,signal,op.match,op.action==='role'?'PATCH':op.action==='remove'?'DELETE':undefined);}
 preview(token:string,signal:AbortSignal){return this.auth.invitationPreview(administrationPreviewSchema,token,signal);}
}
