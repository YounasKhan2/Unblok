import {workspaceMembershipPageSchema,workspaceInvitationSchema,workspaceInvitationAcceptSchema,signupResponseSchema} from '@unblok/contracts';
import {AuthApi} from '../../auth/api/authApi';
export type MembersPage=ReturnType<typeof workspaceMembershipPageSchema.parse>;
export type InviteInput=ReturnType<typeof workspaceInvitationSchema.parse>;
export type MemberFilter='ALL'|'ACTIVE'|'INVITED'|'SUSPENDED';
export type MemberSort='joined_asc'|'joined_desc';
export class MembersApi {
 constructor(private readonly auth:AuthApi){}
 list(id:string,status:MemberFilter,sort:MemberSort,signal:AbortSignal,after?:string){
  const query=new URLSearchParams({limit:'20',status,sort});if(after)query.set('after',after);
  return this.auth.workspaceRead('/'+id+'/memberships?'+query,workspaceMembershipPageSchema,signal).then(page=>{if(page.items.length>20||page.page.hasMore!==!!page.page.nextCursor)throw new Error('Invalid member page');return page;});
 }
 invite(id:string,body:InviteInput,key:string,signal:AbortSignal){return this.auth.workspaceInvite(id,signupResponseSchema,workspaceInvitationSchema.parse(body),key,signal);}
 accept(token:string,key:string,signal:AbortSignal){return this.auth.acceptInvitation(signupResponseSchema,workspaceInvitationAcceptSchema.parse({token}),key,signal);}
}
