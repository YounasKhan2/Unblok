import { Injectable, SetMetadata, UnauthorizedException, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

const HEALTH_PUBLIC = 'foundation:public-health';
export const PublicHealth = () => SetMetadata(HEALTH_PUBLIC, true);
@Injectable()
export class FoundationAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const publicHealth = new Reflector().getAllAndOverride<boolean>(HEALTH_PUBLIC, [context.getHandler(), context.getClass()]);
    if (publicHealth) return true;
    // Authentication is deliberately absent. Any future handler is denied until
    // reviewed session authentication and tenant authorization replace this guard.
    throw new UnauthorizedException();
  }
}
