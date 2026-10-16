import { z } from 'zod';

export const healthSchema = z.object({ status: z.enum(['ok', 'ready']) }).strict();
export type HealthResponse = z.infer<typeof healthSchema>;
export const errorSchema = z.object({
  error: z.object({ code: z.string(), message: z.string(), requestId: z.string() }).strict(),
}).strict();
export type ErrorResponse = z.infer<typeof errorSchema>;
// Diagnostic only. No product data or authority enters this queue in BE-00B.
export const foundationJobSchema = z.object({ version: z.literal(1) }).strict();
export type FoundationJob = z.infer<typeof foundationJobSchema>;

// Local password identities use a deliberately narrow ASCII email policy.
export const credentialEmailSchema = z.string().max(320).trim().toLowerCase().pipe(
  z.email().max(320).regex(/^[\x21-\x7e]+$/));
const passwordSchema = z.string().max(256).refine(value => {
  const length = Array.from(value).length;
  return length >= 16 && length <= 128 && !/[\p{Surrogate}\u0000]/u.test(value);
});
export const signupSchema = z.object({ name: z.string().trim().min(1).max(120), email: credentialEmailSchema, password: passwordSchema }).strict();
export const loginSchema = z.object({ email: credentialEmailSchema, password: passwordSchema }).strict();
export const emptyAuthSchema = z.object({}).strict();
export const csrfResponseSchema = z.object({ csrf: z.string().regex(/^[A-Za-z0-9_-]{43}$/) }).strict();
export const signupResponseSchema = z.object({ status: z.literal('accepted') }).strict();
export const meResponseSchema = z.object({ user: z.object({ id: z.uuid(), name: z.string().max(120), email: z.string().max(320).nullable(), emailVerified: z.boolean() }).strict() }).strict();
export const logoutResponseSchema = z.object({ revocation: z.literal('confirmed'), cleanup: z.enum(['confirmed', 'unconfirmed']) }).strict();
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export const emailVerificationConfirmSchema = z.object({ token: z.string().regex(/^[0-9a-f-]{36}\.[A-Za-z0-9_-]{43}$/) }).strict();
export const emailVerificationStatusSchema = z.object({ emailVerified: z.boolean() }).strict();

export const passwordRecoveryRequestSchema = z.object({ email: credentialEmailSchema }).strict();
export const passwordRecoveryConfirmSchema = z.object({ email: credentialEmailSchema, token: emailVerificationConfirmSchema.shape.token, password: passwordSchema }).strict();

export const createWorkspaceSchema = z.object({ name: z.string().trim().min(1).max(120), slug: z.string().max(63).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) }).strict();
export const workspaceQuerySchema = z.object({ limit: z.string().regex(/^[1-9][0-9]{0,2}$/).transform(Number).pipe(z.number().int().max(100)).optional().default(50),
  sort: z.enum(['workspace_asc', 'workspace_desc']).optional().default('workspace_asc'), after: z.string().min(1).max(2048).optional() }).strict();
export const workspaceRowSchema = z.object({ id: z.uuid(), slug: z.string().max(63), name: z.string().max(120), status: z.enum(['ACTIVE', 'ARCHIVED']), membershipRole: z.enum(['ADMIN', 'MEMBER', 'OBSERVER']) }).strict();
export const workspaceSelfSchema = z.object({ workspaceId: z.uuid(), membershipId: z.uuid(), role: z.enum(['ADMIN', 'MEMBER', 'OBSERVER']), membershipStatus: z.literal('ACTIVE'), workspaceStatus: z.enum(['ACTIVE', 'ARCHIVED']),
  capabilities: z.object({ readWorkspace: z.boolean(), listMembers: z.boolean(), inviteMembers: z.boolean(), createTeam: z.boolean(), writeIssues: z.boolean(), writeDependencies: z.boolean(), completeDependentIssues: z.boolean() }).strict() }).strict();
export const workspaceDetailSchema = z.object({ workspace: workspaceRowSchema, self: workspaceSelfSchema }).strict();
export const workspaceCreatedSchema = z.object({ workspace: workspaceRowSchema, initialAdministrator: workspaceSelfSchema }).strict();
export const workspacePageSchema = z.object({ items: z.array(workspaceRowSchema).max(100), page: z.object({ nextCursor: z.string().max(2048).nullable(), hasMore: z.boolean() }).strict() }).strict();
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type WorkspaceQuery = z.infer<typeof workspaceQuerySchema>;
export function workspaceJsonSchemas() {
  return Object.fromEntries(Object.entries({ CreateWorkspace: createWorkspaceSchema, WorkspaceRow: workspaceRowSchema, WorkspaceSelf: workspaceSelfSchema,
    WorkspaceDetail: workspaceDetailSchema, WorkspaceCreated: workspaceCreatedSchema, WorkspacePage: workspacePageSchema }).map(([name, schema]) => [name, z.toJSONSchema(schema)]));
}

export const workspaceMembershipQuerySchema=z.object({limit:workspaceQuerySchema.shape.limit,sort:z.enum(['joined_asc','joined_desc']).optional().default('joined_asc'),status:z.enum(['ACTIVE','INVITED','SUSPENDED','ALL']).optional(),after:z.string().min(1).max(2048).optional()}).strict();
export const workspaceMembershipPageSchema=z.object({items:z.array(z.object({id:z.uuid(),displayName:z.string().min(1).max(120),role:z.enum(['ADMIN','MEMBER','OBSERVER']),status:z.enum(['ACTIVE','INVITED','SUSPENDED']),joinedAt:z.iso.datetime().nullable()}).strict()).max(100),page:workspacePageSchema.shape.page}).strict();
export const workspaceInvitationSchema=z.object({email:credentialEmailSchema,role:z.enum(['MEMBER','OBSERVER'])}).strict();
export const workspaceInvitationAcceptSchema=z.object({token:emailVerificationConfirmSchema.shape.token}).strict();
export type WorkspaceMembershipQuery=z.infer<typeof workspaceMembershipQuerySchema>;
export type WorkspaceInvitationInput=z.infer<typeof workspaceInvitationSchema>;

export function workspaceInvitationJsonSchemas(){return Object.fromEntries(Object.entries({MembershipPage:workspaceMembershipPageSchema,InvitationRequest:workspaceInvitationSchema,InvitationAccept:workspaceInvitationAcceptSchema,InvitationAccepted:signupResponseSchema}).map(([name,schema])=>[name,z.toJSONSchema(schema)]));}

export { createTeamSchema, patchTeamSchema, teamQuerySchema, teamDetailSchema, teamPageSchema, teamJsonSchemas, type CreateTeamInput, type PatchTeamInput, type TeamListQuery } from "./teams";
export {teamRoleSchema,teamMemberQuerySchema,teamMemberAddSchema,teamMemberRoleSchema,transferRequestSchema,teamMemberSchema,teamMemberPageSchema,teamMemberMutationSchema,transferRecordedSchema,transferAcceptedSchema,transferRejectedSchema,transferDetailSchema,teamManagementJsonSchemas,type TeamMemberQuery,type TeamManagementAction,type TeamManagementInput} from './teams';
export * from './workspace-administration';
