import { Body, Controller, Get, HttpCode, HttpException, Inject, Param, Post, Query, Req, Res, UseInterceptors } from '@nestjs/common';
import type { Request, Response } from 'express';
import { emptyAuthSchema, createWorkspaceSchema, workspaceQuerySchema, workspaceCreatedSchema, workspaceDetailSchema, workspacePageSchema, workspaceSelfSchema, type CreateWorkspaceInput, type WorkspaceQuery } from '@unblok/contracts';
import { SchemaPipe, ResponseSchemaInterceptor } from '../../../validation';
import { Workspaces, WorkspaceFault, WorkspaceRateError } from '../application/workspaces';

@Controller('api/v1/workspaces')
export class WorkspacesController {
  constructor(@Inject(Workspaces) private readonly workspaces: Workspaces) {}
  private async execute<T>(res: Response, run: () => Promise<T>) {
    res.setHeader('Cache-Control', 'private, no-store');
    try { return await run(); } catch (error) {
      if (error instanceof WorkspaceRateError) { res.setHeader('Retry-After', error.retryAfter); throw new HttpException('Rate exceeded', 429); }
      if (error instanceof WorkspaceFault) {
        const status = error.reason === 'NOT_FOUND' ? 404 : error.reason === 'INVALID_REQUEST' ? 400 : 409;
        if (status === 409) res.setHeader('Retry-After', '1');
        throw new HttpException({ code: error.reason }, status);
      }
      if (error instanceof Error && ['TenantAccessError', 'AuthDeniedError'].includes(error.name)) throw new HttpException('Authentication required', 401);
      throw new HttpException('Service unavailable', 503);
    }
  }
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
  @Get(':workspaceId') @UseInterceptors(new ResponseSchemaInterceptor(workspaceDetailSchema, 65536))
  detail(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Param('workspaceId') id: string, @Query(new SchemaPipe(emptyAuthSchema)) query: Record<string, never>) { void query; return this.execute(res, () => this.workspaces.detail(req, id)); }
  @Get(':workspaceId/me') @UseInterceptors(new ResponseSchemaInterceptor(workspaceSelfSchema, 65536))
  me(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Param('workspaceId') id: string, @Query(new SchemaPipe(emptyAuthSchema)) query: Record<string, never>) { void query; return this.execute(res, () => this.workspaces.me(req, id)); }
}
const handlers = new Set<unknown>([WorkspacesController.prototype.create, WorkspacesController.prototype.list, WorkspacesController.prototype.detail, WorkspacesController.prototype.me]);
export const isWorkspaceHandler = (handler: unknown) => handlers.has(handler);
