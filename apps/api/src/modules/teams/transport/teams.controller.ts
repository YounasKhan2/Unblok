import { Body, Controller, Get, HttpCode, HttpException, Inject, Param, Patch, Post, Query, Req, Res, UseInterceptors } from '@nestjs/common';
import type { Request, Response } from 'express';
import { createTeamSchema,patchTeamSchema,teamQuerySchema,teamDetailSchema,teamPageSchema,emptyAuthSchema,type CreateTeamInput,type PatchTeamInput,type TeamListQuery } from '@unblok/contracts';
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
}
const handlers=new Set<unknown>([TeamsController.prototype.list,TeamsController.prototype.detail,TeamsController.prototype.create,TeamsController.prototype.update]);
export const isTeamHandler=(handler:unknown)=>handlers.has(handler);
