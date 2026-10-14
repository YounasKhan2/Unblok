import { z } from 'zod';
const unicode=(min:number,max:number,bytes:number)=>z.string().refine(v=>Array.from(v).length>=min&&Array.from(v).length<=max&&new TextEncoder().encode(v).length<=bytes&&!v.includes('\0')).meta({description:`Unicode characters ${min}–${max}; UTF-8 bytes <=${bytes}; no NUL.`});
export const teamColors=['#5645d4','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#64748b'] as const;
const name=unicode(1,120,480).refine(v=>v===v.trim()),description=unicode(0,2000,8000),color=z.enum(teamColors);
export const createTeamSchema=z.object({name,key:z.string().regex(/^[A-Z0-9]{2,6}$/),description:description.optional().default(''),color:color.optional().default('#5645d4')}).strict();
export const patchTeamSchema=z.object({name:name.optional(),description:description.optional(),color:color.optional()}).strict().refine(v=>Object.keys(v).length>0);
export const teamQuerySchema=z.object({limit:z.string().regex(/^[1-9][0-9]{0,2}$/).transform(Number).pipe(z.number().int().max(100)).optional().default(50),status:z.enum(['ACTIVE','ARCHIVED','ALL']).optional().default('ACTIVE'),after:z.string().min(1).max(2048).optional()}).strict();
export const teamDetailSchema=z.object({workspaceId:z.uuid(),id:z.uuid(),key:z.string().regex(/^[A-Z0-9]{2,6}$/),name,description,color,status:z.enum(['ACTIVE','ARCHIVED']),createdAt:z.iso.datetime(),version:z.string().regex(/^[1-9][0-9]{0,18}$/),capabilities:z.object({updateMetadata:z.boolean(),manageMembers:z.literal(false),transferOwnership:z.literal(false),archive:z.literal(false),restore:z.literal(false),readProjects:z.literal(false),writeIssues:z.literal(false)}).strict()}).strict();
export const teamPageSchema=z.object({items:z.array(teamDetailSchema).max(100),page:z.object({nextCursor:z.string().max(2048).nullable(),hasMore:z.boolean()}).strict()}).strict();
export type CreateTeamInput=z.infer<typeof createTeamSchema>;
export type PatchTeamInput=z.infer<typeof patchTeamSchema>;
export type TeamListQuery=z.infer<typeof teamQuerySchema>;
export function teamJsonSchemas(){return Object.fromEntries(Object.entries({TeamCreated:createTeamSchema,TeamPatch:patchTeamSchema,TeamDetail:teamDetailSchema,TeamPage:teamPageSchema}).map(([name,schema])=>[name,z.toJSONSchema(schema)]));}

// Separate management DTOs preserve the existing v1 literal-false capability vocabulary.
export const teamRoleSchema=z.enum(['MEMBER','OBSERVER']);
export const teamMemberQuerySchema=z.object({limit:z.string().regex(/^[1-9][0-9]{0,2}$/).transform(Number).pipe(z.number().int().max(100)).optional().default(20),status:z.enum(['ACTIVE','SUSPENDED','INVITED','ALL']).optional().default('ALL'),after:z.string().min(1).max(2048).optional()}).strict();
export const teamMemberAddSchema=z.object({membershipId:z.uuid(),teamRole:teamRoleSchema}).strict();
export const teamMemberRoleSchema=z.object({teamRole:teamRoleSchema}).strict();
export const transferRequestSchema=z.object({successorMembershipId:z.uuid()}).strict();
export const teamMemberSchema=z.object({membershipId:z.uuid(),displayName:z.string().min(1).max(120),workspaceRole:z.enum(['ADMIN','MEMBER','OBSERVER']),workspaceStatus:z.enum(['ACTIVE','SUSPENDED','INVITED']),teamRole:teamRoleSchema,isOwner:z.boolean(),joinedAt:z.iso.datetime().nullable()}).strict();
export const teamMemberPageSchema=z.object({items:z.array(teamMemberSchema).max(100),page:teamPageSchema.shape.page}).strict();
const version=z.string().regex(/^[1-9][0-9]{0,18}$/);
export const teamMemberMutationSchema=z.object({membershipId:z.uuid(),outcome:z.enum(['ADDED','UPDATED','REMOVED','UNCHANGED']),version,teamRole:teamRoleSchema.optional()}).strict();
export const transferRecordedSchema=z.object({requestId:z.uuid(),outcome:z.literal('RECORDED')}).strict();
export const transferAcceptedSchema=z.object({requestId:z.uuid(),outcome:z.literal('ACCEPTED'),version}).strict();
export const transferRejectedSchema=z.object({requestId:z.uuid(),outcome:z.literal('REJECTED')}).strict();
export const transferDetailSchema=z.object({requestId:z.uuid(),teamId:z.uuid(),state:z.enum(['PENDING','ACCEPTED','REJECTED','EXPIRED','INVALIDATED']),expiresAt:z.iso.datetime(),baseTeamVersion:version,revision:version,initiatorMembershipId:z.uuid(),successorMembershipId:z.uuid()}).strict();
export type TeamMemberQuery=z.infer<typeof teamMemberQuerySchema>;
export type TeamManagementAction='add'|'remove'|'role'|'request'|'accept'|'reject'|'archive'|'restore';
export type TeamManagementInput={membershipId?:string;teamRole?:'MEMBER'|'OBSERVER';successorMembershipId?:string};
export function teamManagementJsonSchemas(){return Object.fromEntries(Object.entries({TeamMemberAdd:teamMemberAddSchema,TeamMemberRole:teamMemberRoleSchema,TeamMemberPage:teamMemberPageSchema,TeamMemberMutation:teamMemberMutationSchema,TransferRequest:transferRequestSchema,TransferRecorded:transferRecordedSchema,TransferAccepted:transferAcceptedSchema,TransferRejected:transferRejectedSchema,TransferDetail:transferDetailSchema}).map(([name,schema])=>[name,z.toJSONSchema(schema)]));}
