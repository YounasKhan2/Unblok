import { Body, Controller, Delete, Patch, Get, HttpCode, HttpException, Inject, Param, Post, Query, Req, Res, UseInterceptors } from '@nestjs/common';
import {administrationMemberQuerySchema,administrationInvitationQuerySchema,administrationPageQuerySchema,administrationInviteSchema,administrationRoleSchema,administrationMemberPageSchema,administrationInvitationSchema,administrationInvitationPageSchema,administrationTeamPageSchema,administrationPreviewSchema,type AdministrationMemberQuery,type AdministrationInvitationQuery,type AdministrationPageQuery,type AdministrationInvite} from '@unblok/contracts';
import type { Request, Response } from 'express';
import { emptyAuthSchema, workspaceMembershipQuerySchema, workspaceMembershipPageSchema, workspaceInvitationSchema, workspaceInvitationAcceptSchema, signupResponseSchema, type WorkspaceMembershipQuery, type WorkspaceInvitationInput, createWorkspaceSchema, workspaceQuerySchema, workspaceCreatedSchema, workspaceDetailSchema, workspacePageSchema, workspaceSelfSchema, type CreateWorkspaceInput, type WorkspaceQuery } from '@unblok/contracts';
import { SchemaPipe, ResponseSchemaInterceptor } from '../../../validation';
import { Workspaces, WorkspaceFault, WorkspaceRateError } from '../application/workspaces';

@Controller('api/v1/workspaces')
export class WorkspacesController {
  constructor(@Inject(Workspaces) private readonly workspaces: Workspaces) {}
  private execute<T>(res:Response,run:()=>Promise<T>){return executeWorkspace(res,run);}
  @Post() @HttpCode(201) @UseInterceptors(new ResponseSchemaInterceptor(workspaceCreatedSchema, 65536))
  create(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Body(new SchemaPipe(createWorkspaceSchema)) body: CreateWorkspaceInput, @Query(new SchemaPipe(emptyAuthSchema)) query: Record<string, never>) {
    void query;
    return this.execute(res, () => {
      const copies = req.rawHeaders.filter((_, i) => i % 2 === 0 && req.rawHeaders[i]!.toLowerCase() === 'idempotency-key');
      const key = req.get('idempotency-key') ?? '';
      if (copies.length !== 1 || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(key)) throw new WorkspaceFault('INVALID_REQUEST');
      return this.workspaces.create(req, body, key);
    });
  }
  @Get() @UseInterceptors(new ResponseSchemaInterceptor(workspacePageSchema, 65536))
  list(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Query(new SchemaPipe(workspaceQuerySchema)) query: WorkspaceQuery) { return this.execute(res, () => this.workspaces.list(req, query)); }
  @Get(':workspaceId/memberships') @UseInterceptors(new ResponseSchemaInterceptor(workspaceMembershipPageSchema,131072))
  memberships(@Req() req:Request,@Res({passthrough:true}) res:Response,@Param('workspaceId') id:string,@Query(new SchemaPipe(workspaceMembershipQuerySchema)) query:WorkspaceMembershipQuery){return this.execute(res,()=>this.workspaces.memberships(req,id,query));}
  @Post(':workspaceId/invitations') @HttpCode(202) @UseInterceptors(new ResponseSchemaInterceptor(signupResponseSchema))
  invite(@Req() req:Request,@Res({passthrough:true}) res:Response,@Param('workspaceId') id:string,@Body(new SchemaPipe(workspaceInvitationSchema)) body:WorkspaceInvitationInput,@Query(new SchemaPipe(emptyAuthSchema)) query:Record<string,never>){void query;return this.execute(res,()=>this.workspaces.invite(req,id,body,invitationRequestKey(req)));}
  @Get(':workspaceId') @UseInterceptors(new ResponseSchemaInterceptor(workspaceDetailSchema, 65536))
  detail(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Param('workspaceId') id: string, @Query(new SchemaPipe(emptyAuthSchema)) query: Record<string, never>) { void query; return this.execute(res, () => this.workspaces.detail(req, id)); }
  @Get(':workspaceId/me') @UseInterceptors(new ResponseSchemaInterceptor(workspaceSelfSchema, 65536))
  me(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Param('workspaceId') id: string, @Query(new SchemaPipe(emptyAuthSchema)) query: Record<string, never>) { void query; return this.execute(res, () => this.workspaces.me(req, id)); }
}
function invitationRequestKey(req:Request){const copies=req.rawHeaders.filter((_,i)=>i%2===0&&req.rawHeaders[i]!.toLowerCase()==='idempotency-key'),key=req.get('idempotency-key')??'';if(copies.length!==1||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(key))throw new WorkspaceFault('INVALID_REQUEST');return key;}
@Controller('api/v1/workspace-invitations')
export class WorkspaceInvitationsController {
 constructor(@Inject(Workspaces) private readonly workspaces:Workspaces){}
 @Post('accept') @HttpCode(202) @UseInterceptors(new ResponseSchemaInterceptor(signupResponseSchema))
 accept(@Req() req:Request,@Res({passthrough:true}) res:Response,@Body(new SchemaPipe(workspaceInvitationAcceptSchema)) body:{token:string},@Query(new SchemaPipe(emptyAuthSchema)) query:Record<string,never>){void query;return executeWorkspace(res,()=>this.workspaces.accept(req,body.token,invitationRequestKey(req)));}
 @Post('preview') @HttpCode(200) @UseInterceptors(new ResponseSchemaInterceptor(administrationPreviewSchema,32768))
 preview(@Req() req:Request,@Res({passthrough:true}) res:Response,@Body(new SchemaPipe(workspaceInvitationAcceptSchema)) body:{token:string},@Query(new SchemaPipe(emptyAuthSchema)) q:Record<string,never>){void q;return executeWorkspace(res,()=>this.workspaces.administrationPreview(req,body.token));}
}
function matchHeader(req:Request){const copies=req.rawHeaders.filter((_,i)=>i%2===0&&req.rawHeaders[i]!.toLowerCase()==='if-match');if(copies.length>1)throw new WorkspaceFault('INVALID_REQUEST');return req.get('if-match');}
@Controller('api/v1/workspaces/:workspaceId/administration')
export class WorkspaceAdministrationController {
 constructor(@Inject(Workspaces) private readonly workspaces:Workspaces){}
 @Get('memberships') @UseInterceptors(new ResponseSchemaInterceptor(administrationMemberPageSchema,1048576))
 members(@Req() req:Request,@Res({passthrough:true}) res:Response,@Param('workspaceId') ws:string,@Query(new SchemaPipe(administrationMemberQuerySchema)) q:AdministrationMemberQuery){return executeWorkspace(res,()=>this.workspaces.administrationMembers(req,ws,q));}
 @Get('memberships/:membershipId/teams') @UseInterceptors(new ResponseSchemaInterceptor(administrationTeamPageSchema,65536))
 memberTeams(@Req() req:Request,@Res({passthrough:true}) res:Response,@Param('workspaceId') ws:string,@Param('membershipId') member:string,@Query(new SchemaPipe(administrationPageQuerySchema)) q:AdministrationPageQuery){return executeWorkspace(res,()=>this.workspaces.administrationTeams(req,ws,q,member));}
 @Get('eligible-teams') @UseInterceptors(new ResponseSchemaInterceptor(administrationTeamPageSchema,65536))
 teams(@Req() req:Request,@Res({passthrough:true}) res:Response,@Param('workspaceId') ws:string,@Query(new SchemaPipe(administrationPageQuerySchema)) q:AdministrationPageQuery){return executeWorkspace(res,()=>this.workspaces.administrationTeams(req,ws,q));}
 @Get('invitations') @UseInterceptors(new ResponseSchemaInterceptor(administrationInvitationPageSchema,2097152))
 invitations(@Req() req:Request,@Res({passthrough:true}) res:Response,@Param('workspaceId') ws:string,@Query(new SchemaPipe(administrationInvitationQuerySchema)) q:AdministrationInvitationQuery){return executeWorkspace(res,()=>this.workspaces.administrationInvitations(req,ws,q));}
 @Get('invitations/:invitationId') @UseInterceptors(new ResponseSchemaInterceptor(administrationInvitationSchema,32768))
 invitation(@Req() req:Request,@Res({passthrough:true}) res:Response,@Param('workspaceId') ws:string,@Param('invitationId') id:string,@Query(new SchemaPipe(emptyAuthSchema)) q:Record<string,never>){void q;return executeWorkspace(res,()=>this.workspaces.administrationInvitations(req,ws,{limit:1},id));}
 @Post('invitations') @HttpCode(202) @UseInterceptors(new ResponseSchemaInterceptor(signupResponseSchema))
 invite(@Req() req:Request,@Res({passthrough:true}) res:Response,@Param('workspaceId') ws:string,@Body(new SchemaPipe(administrationInviteSchema)) input:AdministrationInvite,@Query(new SchemaPipe(emptyAuthSchema)) q:Record<string,never>){void q;return executeWorkspace(res,()=>this.workspaces.administrationMutation(req,ws,'invite',input,invitationRequestKey(req)));}
 @Post('invitations/:invitationId/resend') @HttpCode(202) @UseInterceptors(new ResponseSchemaInterceptor(signupResponseSchema))
 resend(@Req() req:Request,@Res({passthrough:true}) res:Response,@Param('workspaceId') ws:string,@Param('invitationId') id:string,@Body(new SchemaPipe(emptyAuthSchema)) input:Record<string,never>,@Query(new SchemaPipe(emptyAuthSchema)) q:Record<string,never>){void input;void q;return executeWorkspace(res,()=>this.workspaces.administrationMutation(req,ws,'resend',{},invitationRequestKey(req),id,matchHeader(req)));}
 @Post('invitations/:invitationId/revoke') @HttpCode(202) @UseInterceptors(new ResponseSchemaInterceptor(signupResponseSchema))
 revoke(@Req() req:Request,@Res({passthrough:true}) res:Response,@Param('workspaceId') ws:string,@Param('invitationId') id:string,@Body(new SchemaPipe(emptyAuthSchema)) input:Record<string,never>,@Query(new SchemaPipe(emptyAuthSchema)) q:Record<string,never>){void input;void q;return executeWorkspace(res,()=>this.workspaces.administrationMutation(req,ws,'revoke',{},invitationRequestKey(req),id,matchHeader(req)));}
 @Patch('memberships/:membershipId') @HttpCode(202) @UseInterceptors(new ResponseSchemaInterceptor(signupResponseSchema))
 role(@Req() req:Request,@Res({passthrough:true}) res:Response,@Param('workspaceId') ws:string,@Param('membershipId') id:string,@Body(new SchemaPipe(administrationRoleSchema)) input:{role:'ADMIN'|'MEMBER'|'OBSERVER'},@Query(new SchemaPipe(emptyAuthSchema)) q:Record<string,never>){void q;return executeWorkspace(res,()=>this.workspaces.administrationMutation(req,ws,'role',input,invitationRequestKey(req),id,matchHeader(req)));}
 @Delete('memberships/:membershipId') @HttpCode(202) @UseInterceptors(new ResponseSchemaInterceptor(signupResponseSchema))
 remove(@Req() req:Request,@Res({passthrough:true}) res:Response,@Param('workspaceId') ws:string,@Param('membershipId') id:string,@Query(new SchemaPipe(emptyAuthSchema)) q:Record<string,never>){void q;return executeWorkspace(res,()=>{if(req.body!==undefined&&!emptyAuthSchema.safeParse(req.body).success||Number(req.get('content-length')??0)>0||req.get('transfer-encoding'))throw new WorkspaceFault('INVALID_REQUEST');return this.workspaces.administrationMutation(req,ws,'remove',{},invitationRequestKey(req),id,matchHeader(req));});}
}
const handlers = new Set<unknown>([WorkspacesController.prototype.create, WorkspacesController.prototype.list, WorkspacesController.prototype.detail, WorkspacesController.prototype.me, WorkspacesController.prototype.memberships, WorkspacesController.prototype.invite, WorkspaceInvitationsController.prototype.accept,WorkspaceInvitationsController.prototype.preview,...['members','memberTeams','teams','invitations','invitation','invite','resend','revoke','role','remove'].map(name=>WorkspaceAdministrationController.prototype[name as keyof WorkspaceAdministrationController])]);
export const isWorkspaceHandler = (handler: unknown) => handlers.has(handler);

async function executeWorkspace<T>(res: Response, run: () => Promise<T>) {
    res.setHeader('Cache-Control', 'private, no-store');
    try { return await run(); } catch (error) {
      if (error instanceof WorkspaceRateError) { res.setHeader('Retry-After', error.retryAfter); throw new HttpException('Rate exceeded', 429); }
      if (error instanceof WorkspaceFault) {
        const status = error.reason === 'NOT_FOUND' ? 404 : error.reason === 'INVALID_REQUEST' ? 400 : error.reason==='PRECONDITION_REQUIRED'?428:error.reason==='PRECONDITION_FAILED'?412:409;
        if (status === 409) res.setHeader('Retry-After', '1');
        throw new HttpException({ code: error.reason }, status);
      }
      if (error instanceof Error && ['TenantAccessError', 'AuthDeniedError'].includes(error.name)) throw new HttpException('Authentication required', 401);
      throw new HttpException('Service unavailable', 503);
    }
  }
