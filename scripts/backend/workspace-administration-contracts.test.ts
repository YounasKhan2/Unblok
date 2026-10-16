import {test,expect} from 'bun:test';
import {randomUUID} from 'node:crypto';
import {administrationInviteSchema,administrationMemberQuerySchema,administrationPreviewSchema,workspaceInvitationSchema} from '@unblok/contracts';
import {workspaceAdministrationOpenApi} from './workspace-administration-contracts';
test('additive administration contracts preserve strict legacy neutrality, canonical plans and bounded queries',async()=>{
 expect(await Bun.file('docs/backend/evidence/BE-01B-openapi.json').json()).toEqual(workspaceAdministrationOpenApi());
 expect(workspaceInvitationSchema.safeParse({email:'a@example.test',role:'ADMIN'}).success).toBe(false);
 const teamIds=[randomUUID(),randomUUID()];expect(administrationInviteSchema.parse({email:' A@EXAMPLE.TEST ',role:'ADMIN',teamIds}).teamIds).toEqual(teamIds.sort());
 expect(administrationInviteSchema.safeParse({email:'a@example.test',role:'ADMIN',teamIds:[teamIds[0],teamIds[0]]}).success).toBe(false);
 expect(administrationInviteSchema.safeParse({email:'a@example.test',role:'ADMIN',teamIds:Array.from({length:21},()=>randomUUID())}).success).toBe(false);
 expect(administrationInviteSchema.safeParse({email:'a@example.test',role:'ADMIN',userId:randomUUID()}).success).toBe(false);
 expect(administrationMemberQuerySchema.safeParse({limit:'101'}).success).toBe(false);expect(administrationMemberQuerySchema.parse({status:'REMOVED'}).limit).toBe(20);
 expect(administrationPreviewSchema.safeParse({status:'accepted'}).success).toBe(true);expect(administrationPreviewSchema.safeParse({status:'accepted',isExistingUser:true}).success).toBe(false);
});
