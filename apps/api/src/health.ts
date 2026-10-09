import { Controller, Get, Inject, Injectable, Module, ServiceUnavailableException, UseInterceptors } from '@nestjs/common';
import { healthSchema, type HealthResponse } from '@unblok/contracts';
import { withDeadline } from '@unblok/backend-runtime';
import { ResponseSchemaInterceptor } from './validation';
import { APP_GUARD } from '@nestjs/core';
import { FoundationAccessGuard, PublicHealth } from './access';

export const RESOURCES = Symbol('resources');
export interface Resources { databaseReady(): Promise<boolean>; queueReady(): Promise<boolean>; close(): Promise<void> }
@Injectable()
export class Readiness {
  private draining = false;
  constructor(@Inject(RESOURCES) private readonly resources: Resources) {}
  drain() { this.draining = true; }
  async check(): Promise<HealthResponse> {
    if (this.draining) throw new ServiceUnavailableException();
    try {
      const results = await withDeadline(Promise.all([this.resources.databaseReady(), this.resources.queueReady()]), 2500);
      if (this.draining || results.some(result => !result)) throw new ServiceUnavailableException();
      return { status: 'ready' };
    } catch { throw new ServiceUnavailableException(); }
  }
}
@Controller()
@UseInterceptors(new ResponseSchemaInterceptor(healthSchema))
export class HealthController {
  constructor(@Inject(Readiness) private readonly readiness: Readiness) {}
  @PublicHealth() @Get('live') live(): HealthResponse { return { status: 'ok' }; }
  @PublicHealth() @Get('ready') ready() { return this.readiness.check(); }
}
// Exposes the same foundation under the future versioned route boundary.
@Controller('api/v1')
@UseInterceptors(new ResponseSchemaInterceptor(healthSchema))
export class VersionedHealthController extends HealthController {
  constructor(@Inject(Readiness) readiness: Readiness) { super(readiness); }
}
@Module({})
export class AppModule {
  static register(resources: Resources) {
    return { module: AppModule, controllers: [HealthController, VersionedHealthController],
      providers: [{ provide: RESOURCES, useValue: resources }, Readiness, { provide: APP_GUARD, useClass: FoundationAccessGuard }] };
  }
}
