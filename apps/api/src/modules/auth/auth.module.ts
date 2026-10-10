import { Module } from '@nestjs/common';
import { Authentication } from './application/authentication';
import { AuthController } from './transport/auth.controller';

@Module({})
export class AuthModule {
  static register(authentication: Authentication) {
    return { module: AuthModule, controllers: [AuthController], providers: [{ provide: Authentication, useValue: authentication }] };
  }
}
