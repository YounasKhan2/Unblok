import {expect,test} from 'bun:test';
import {createTeamSchema,patchTeamSchema,teamDetailSchema,teamPageSchema} from '@unblok/contracts';
import {teamOpenApi} from './team-contracts';
import {readFile} from 'node:fs/promises';
test('generated strict Team schemas and exactly four foundation operations stay in parity',async()=>{
 const generated=teamOpenApi();expect(JSON.parse(await readFile('docs/backend/evidence/BE-TEAM-01-openapi.json','utf8'))).toEqual(generated);
 expect(Object.values(generated.paths).flatMap(p=>Object.entries(p).filter(([key])=>key!=='parameters').map(([,o])=>(o as {operationId:string}).operationId))).toEqual(['listTeams','createTeam','detailTeam','updateTeam']);
 expect(createTeamSchema.safeParse({name:'Owner',key:'ENG',ownerMembershipId:'forged'}).success).toBe(false);
 expect(patchTeamSchema.safeParse({key:'NEW'}).success).toBe(false);expect(patchTeamSchema.safeParse({}).success).toBe(false);
 expect(generated.components.schemas.TeamDetail!.additionalProperties).toBe(false);
 expect(createTeamSchema.safeParse({name:'🎯'.repeat(120),key:'ENG',description:'🎯'.repeat(2000)}).success).toBe(true);
 expect(teamDetailSchema.shape.capabilities.shape.readProjects.safeParse(true).success).toBe(false);
 expect(teamPageSchema.shape.items.safeParse(Array(101).fill({})).success).toBe(false);
});
