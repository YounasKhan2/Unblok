import { Module } from '@nestjs/common';
import { Teams } from './application/teams';
import { TeamsController } from './transport/teams.controller';
@Module({})
export class TeamsModule { static register(teams:Teams){return {module:TeamsModule,controllers:[TeamsController],providers:[{provide:Teams,useValue:teams}]};} }
