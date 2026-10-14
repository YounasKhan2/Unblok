import { Body, Controller, Delete, Get, HttpCode, HttpException, Inject, Param, Patch, Post, Query, Req, Res, UseInterceptors } from '@nestjs/common';
import type { Request, Response } from 'express';
import { createTeamSchema,patchTeamSchema,teamQuerySchema,teamDetailSchema,teamPageSchema,emptyAuthSchema,type CreateTeamInput,type PatchTeamInput,type TeamListQuery,teamMemberQuerySchema,teamMemberAddSchema,teamMemberRoleSchema,transferRequestSchema,teamMemberPageSchema,teamMemberMutationSchema,transferRecordedSchema,transferAcceptedSchema,transferRejectedSchema,transferDetailSchema,type TeamMemberQuery,type TeamManagementAction,type TeamManagementInput } from '@unblok/contracts';
import { SchemaPipe,ResponseSchemaInterceptor } from '../../../validation';
import { Teams,TeamRateError,TeamFault } from '../application/teams';
function header(req:Request,name:string){const values=req.rawHeaders.filter((_,i)=>i%2===0&&req.rawHeaders[i]!.toLowerCase()===name);if(values.length>1)throw new TeamFault('INVALID_REQUEST');return req.get(name);}
function key(req:Request){const value=header(req,'idempotency-key');if(!value||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value))throw new TeamFault('INVALID_REQUEST');return value;}
@Controller('api/v1/workspaces/:workspaceId/teams')
export class TeamsController {
 constructor(@Inject(Teams) private readonly teams:Teams){}
 private async execute<T>(res:Response,run:()=>Promise<T>){try{const result=await run();if(result&&typeof result==='object'&&'version' in result)res.setHeader('ETag',`"team-${result.version}"`);return result;}catch(error){
   if(error instanceof TeamRateError){res.setHeader('Retry-After',error.retryAfter);throw new HttpException('Rate exceeded',429);}
   if(error instanceof TeamFault){const codes={INVALID_REQUEST:400,NOT_FOUND:404,FORBIDDEN:403,CURSOR_STALE:409,CONFLICT:409,PRECONDITION_REQUIRED:428,PRECONDITION_FAILED:412,IDEMPOTENCY_RESULT_EXPIRED:409};if(codes[error.reason]===409)res.setHeader('Retry-After','1');throw new HttpException({code:error.reason},codes[error.reason]);}
   if(error instanceof Error&&['TenantAccessError','AuthDeniedError'].includes(error.name))throw new HttpException('Authentication required',401);
   if(error instanceof Error&&error.name==='WorkspaceFault')throw new HttpException('Resource unavailable',404);
   throw new HttpException('Unavailable',503);
 }}
 @Get() @UseInterceptors(new ResponseSchemaInterceptor(teamPageSchema,131072))
 list(@Req() req:Request,@Res({passthrough:true}) res:Response,@Param('workspaceId') workspace:string,@Query(new SchemaPipe(teamQuerySchema)) query:TeamListQuery){return this.execute(res,()=>this.teams.list(req,workspace,query));}
 @Get(':teamId') @UseInterceptors(new ResponseSchemaInterceptor(teamDetailSchema,16384))
 detail(@Req() req:Request,@Res({passthrough:true}) res:Response,@Param('workspaceId') workspace:string,@Param('teamId') id:string,@Query(new SchemaPipe(emptyAuthSchema)) query:Record<string,never>){void query;return this.execute(res,()=>this.teams.detail(req,workspace,id));}
 @Post() @HttpCode(201) @UseInterceptors(new ResponseSchemaInterceptor(teamDetailSchema,16384))
 create(@Req() req:Request,@Res({passthrough:true}) res:Response,@Param('workspaceId') workspace:string,@Body(new SchemaPipe(createTeamSchema)) input:CreateTeamInput,@Query(new SchemaPipe(emptyAuthSchema)) query:Record<string,never>){void query;return this.execute(res,()=>this.teams.create(req,workspace,input,key(req)));}
 @Patch(':teamId') @UseInterceptors(new ResponseSchemaInterceptor(teamDetailSchema,16384))
 update(@Req() req:Request,@Res({passthrough:true}) res:Response,@Param('workspaceId') workspace:string,@Param('teamId') id:string,@Body(new SchemaPipe(patchTeamSchema)) input:PatchTeamInput,@Query(new SchemaPipe(emptyAuthSchema)) query:Record<string,never>){void query;return this.execute(res,()=>this.teams.update(req,workspace,id,input,key(req),header(req,'if-match')));}
 private management(req:Request,res:Response,ws:string,id:string,action:TeamManagementAction,input:TeamManagementInput,target?:string){return this.execute(res,async()=>{const result=await this.teams.manage(req,ws,id,action,input,key(req),target,header(req,'if-match'));res.status(result.status);return result.value;});}
 @Get(':teamId/memberships') @UseInterceptors(new ResponseSchemaInterceptor(teamMemberPageSchema,131072))
 members(@Req() req:Request,@Res({passthrough:true}) res:Response,@Param('workspaceId') ws:string,@Param('teamId') id:string,@Query(new SchemaPipe(teamMemberQuerySchema)) q:TeamMemberQuery){return this.execute(res,()=>this.teams.members(req,ws,id,q));}
 @Post(':teamId/memberships') @HttpCode(201) @UseInterceptors(new ResponseSchemaInterceptor(teamMemberMutationSchema,16384))
 add(@Req() req:Request,@Res({passthrough:true}) res:Response,@Param('workspaceId') ws:string,@Param('teamId') id:string,@Body(new SchemaPipe(teamMemberAddSchema)) input:ReturnType<typeof teamMemberAddSchema.parse>,@Query(new SchemaPipe(emptyAuthSchema)) q:Record<string,never>){void q;return this.management(req,res,ws,id,'add',input);}
 @Patch(':teamId/memberships/:membershipId') @UseInterceptors(new ResponseSchemaInterceptor(teamMemberMutationSchema,16384))
 role(@Req() req:Request,@Res({passthrough:true}) res:Response,@Param('workspaceId') ws:string,@Param('teamId') id:string,@Param('membershipId') member:string,@Body(new SchemaPipe(teamMemberRoleSchema)) input:ReturnType<typeof teamMemberRoleSchema.parse>,@Query(new SchemaPipe(emptyAuthSchema)) q:Record<string,never>){void q;return this.management(req,res,ws,id,'role',input,member);}
 @Delete(':teamId/memberships/:membershipId') @UseInterceptors(new ResponseSchemaInterceptor(teamMemberMutationSchema,16384))
 remove(@Req() req:Request,@Res({passthrough:true}) res:Response,@Param('workspaceId') ws:string,@Param('teamId') id:string,@Param('membershipId') member:string,@Query(new SchemaPipe(emptyAuthSchema)) q:Record<string,never>){void q;if(req.body!==undefined&&!emptyAuthSchema.safeParse(req.body).success||Number(req.get('content-length')??0)>0||req.get('transfer-encoding'))throw new HttpException('Invalid request',400);return this.management(req,res,ws,id,'remove',{},member);}
 @Post(':teamId/ownership-transfer-requests') @HttpCode(201) @UseInterceptors(new ResponseSchemaInterceptor(transferRecordedSchema,16384))
 requestTransfer(@Req() req:Request,@Res({passthrough:true}) res:Response,@Param('workspaceId') ws:string,@Param('teamId') id:string,@Body(new SchemaPipe(transferRequestSchema)) input:ReturnType<typeof transferRequestSchema.parse>,@Query(new SchemaPipe(emptyAuthSchema)) q:Record<string,never>){void q;return this.management(req,res,ws,id,'request',input);}
 @Get(':teamId/ownership-transfer-requests/:requestId') @UseInterceptors(new ResponseSchemaInterceptor(transferDetailSchema,16384))
 transfer(@Req() req:Request,@Res({passthrough:true}) res:Response,@Param('workspaceId') ws:string,@Param('teamId') id:string,@Param('requestId') request:string,@Query(new SchemaPipe(emptyAuthSchema)) q:Record<string,never>){void q;return this.execute(res,()=>this.teams.transfer(req,ws,id,request));}
 @Post(':teamId/ownership-transfer-requests/:requestId/accept') @HttpCode(200) @UseInterceptors(new ResponseSchemaInterceptor(transferAcceptedSchema,16384))
 accept(@Req() req:Request,@Res({passthrough:true}) res:Response,@Param('workspaceId') ws:string,@Param('teamId') id:string,@Param('requestId') request:string,@Body(new SchemaPipe(emptyAuthSchema)) input:Record<string,never>,@Query(new SchemaPipe(emptyAuthSchema)) q:Record<string,never>){void input;void q;return this.management(req,res,ws,id,'accept',{},request);}
 @Post(':teamId/ownership-transfer-requests/:requestId/reject') @HttpCode(200) @UseInterceptors(new ResponseSchemaInterceptor(transferRejectedSchema,16384))
 reject(@Req() req:Request,@Res({passthrough:true}) res:Response,@Param('workspaceId') ws:string,@Param('teamId') id:string,@Param('requestId') request:string,@Body(new SchemaPipe(emptyAuthSchema)) input:Record<string,never>,@Query(new SchemaPipe(emptyAuthSchema)) q:Record<string,never>){void input;void q;return this.management(req,res,ws,id,'reject',{},request);}
 @Post(':teamId/archive') @HttpCode(200) @UseInterceptors(new ResponseSchemaInterceptor(teamDetailSchema,16384))
 archive(@Req() req:Request,@Res({passthrough:true}) res:Response,@Param('workspaceId') ws:string,@Param('teamId') id:string,@Body(new SchemaPipe(emptyAuthSchema)) input:Record<string,never>,@Query(new SchemaPipe(emptyAuthSchema)) q:Record<string,never>){void input;void q;return this.management(req,res,ws,id,'archive',{});}
 @Post(':teamId/restore') @HttpCode(200) @UseInterceptors(new ResponseSchemaInterceptor(teamDetailSchema,16384))
 restore(@Req() req:Request,@Res({passthrough:true}) res:Response,@Param('workspaceId') ws:string,@Param('teamId') id:string,@Body(new SchemaPipe(emptyAuthSchema)) input:Record<string,never>,@Query(new SchemaPipe(emptyAuthSchema)) q:Record<string,never>){void input;void q;return this.management(req,res,ws,id,'restore',{});}

}
const handlers=new Set<unknown>([TeamsController.prototype.list,TeamsController.prototype.detail,TeamsController.prototype.create,TeamsController.prototype.update,TeamsController.prototype.members,TeamsController.prototype.add,TeamsController.prototype.role,TeamsController.prototype.remove,TeamsController.prototype.requestTransfer,TeamsController.prototype.transfer,TeamsController.prototype.accept,TeamsController.prototype.reject,TeamsController.prototype.archive,TeamsController.prototype.restore]);
export const isTeamHandler=(handler:unknown)=>handlers.has(handler);
