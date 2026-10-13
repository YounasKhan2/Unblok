import { Module } from '@nestjs/common';
import { Workspaces } from './application/workspaces';
import { WorkspacesController, WorkspaceInvitationsController } from './transport/workspaces.controller';
@Module({})
export class WorkspacesModule {
  static register(workspaces: Workspaces) { return { module: WorkspacesModule, controllers: [WorkspacesController, WorkspaceInvitationsController], providers: [{ provide: Workspaces, useValue: workspaces }] }; }
}
