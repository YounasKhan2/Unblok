import {test,expect} from 'bun:test';
import {workspaceInvitationOpenApi} from './workspace-invitation-contracts';
import {workspaceInvitationSchema,workspaceInvitationAcceptSchema,workspaceMembershipQuerySchema,workspaceMembershipPageSchema} from '@unblok/contracts';
import {loadInvitationKey} from '@unblok/backend-runtime';
import {randomBytes} from 'node:crypto';
test('live invitation contracts match approved field vocabulary, reject grants and require independent keys',async()=>{
 expect(await Bun.file('docs/backend/evidence/BE-WS-02-openapi.json').json()).toEqual(workspaceInvitationOpenApi());const registry=await Bun.file('docs/backend/contracts/be-api-00/registry.json').json();
 expect(Object.keys(workspaceMembershipPageSchema.shape.items.element.shape).sort()).toEqual(Object.keys(registry.schemas.MembershipRow.properties).sort());
 for(const [name,schema] of Object.entries({InvitationRequest:workspaceInvitationSchema,InvitationAccept:workspaceInvitationAcceptSchema}))expect(Object.keys(schema.shape).sort()).toEqual(Object.keys(registry.schemas[name].properties).sort());
 expect(workspaceMembershipQuerySchema.parse({status:'ALL'}).limit).toBe(50);expect(workspaceMembershipQuerySchema.safeParse({limit:'101'}).success).toBe(false);
 expect(workspaceInvitationSchema.safeParse({email:'a@example.test',role:'ADMIN'}).success).toBe(false);expect(workspaceInvitationAcceptSchema.safeParse({token:'forged',userId:'forged'}).success).toBe(false);
 const secret=randomBytes(32).toString('hex');expect(loadInvitationKey({WORKSPACE_INVITATION_KEY_ID:'v1',WORKSPACE_INVITATION_KEY:secret}).secret).toBe(secret);
 for(const name of ['EMAIL_VERIFICATION_KEY','PASSWORD_RECOVERY_KEY','WORKSPACE_CURSOR_KEY','WORKSPACE_IDEMPOTENCY_KEY','SESSION_SECRETS'])expect(()=>loadInvitationKey({WORKSPACE_INVITATION_KEY_ID:'v1',WORKSPACE_INVITATION_KEY:secret,[name]:secret})).toThrow();
});
