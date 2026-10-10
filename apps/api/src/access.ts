import { Injectable, SetMetadata, UnauthorizedException, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { isAuthenticationHandler } from './modules/auth';

const HEALTH_PUBLIC = 'foundation:public-health';
export const PublicHealth = () => SetMetadata(HEALTH_PUBLIC, true);
@Injectable()
export class FoundationAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const publicHealth = new Reflector().getAllAndOverride<boolean>(HEALTH_PUBLIC, [context.getHandler(), context.getClass()]);
    if (publicHealth) return true;
    if (isAuthenticationHandler(context.getHandler())) return true;
    // All business handlers still require a separately reviewed authorization path.
    throw new UnauthorizedException();
  }
}
