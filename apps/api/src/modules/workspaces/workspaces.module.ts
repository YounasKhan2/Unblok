import { Module } from '@nestjs/common';
import { Workspaces } from './application/workspaces';
import { WorkspacesController } from './transport/workspaces.controller';
@Module({})
export class WorkspacesModule {
  static register(workspaces: Workspaces) { return { module: WorkspacesModule, controllers: [WorkspacesController], providers: [{ provide: Workspaces, useValue: workspaces }] }; }
}
