import { Body, Controller, Get, HttpCode, Inject, Post, Req, Res, ServiceUnavailableException, UnauthorizedException, HttpException, UseInterceptors } from '@nestjs/common';
import type { Request, Response } from 'express';
import { emailVerificationConfirmSchema, emailVerificationStatusSchema, signupSchema, loginSchema, emptyAuthSchema, csrfResponseSchema, signupResponseSchema, meResponseSchema, logoutResponseSchema, type SignupInput, type LoginInput } from '@unblok/contracts';
import { SchemaPipe, ResponseSchemaInterceptor } from '../../../validation';
import { Authentication, AuthRateError } from '../application/authentication';

@Controller('api/v1/auth')
export class AuthController {
  constructor(@Inject(Authentication) private readonly auth: Authentication) {}
  private async execute<T>(res: Response, run: () => Promise<T>): Promise<T> {
    res.setHeader('Cache-Control', 'no-store'); res.setHeader('Pragma', 'no-cache');
    try { return await run(); } catch (error) {
      if (error instanceof AuthRateError) { res.setHeader('Retry-After', error.retryAfter); throw new HttpException('Rate limited', 429); }
      // Error names are server-owned; never return raw database/password errors.
      if (error instanceof Error && ['TenantAccessError', 'AuthDeniedError'].includes(error.name)) throw new UnauthorizedException();
      throw new ServiceUnavailableException();
    }
  }
  @Get('csrf') @UseInterceptors(new ResponseSchemaInterceptor(csrfResponseSchema))
  csrf(@Req() req: Request, @Res({ passthrough: true }) res: Response) { return this.execute(res, () => this.auth.csrf(req)); }
  @Post('signup') @HttpCode(202) @UseInterceptors(new ResponseSchemaInterceptor(signupResponseSchema))
  signup(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Body(new SchemaPipe(signupSchema)) body: SignupInput) { return this.execute(res, () => this.auth.signup(req, body)); }
  @Post('login') @HttpCode(200) @UseInterceptors(new ResponseSchemaInterceptor(csrfResponseSchema))
  login(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Body(new SchemaPipe(loginSchema)) body: LoginInput) { return this.execute(res, () => this.auth.login(req, body)); }
  @Post('logout') @HttpCode(200) @UseInterceptors(new ResponseSchemaInterceptor(logoutResponseSchema))
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Body(new SchemaPipe(emptyAuthSchema)) body: Record<string, never>) { void body; return this.execute(res, () => this.auth.logout(req)); }
  @Post('logout-all') @HttpCode(200) @UseInterceptors(new ResponseSchemaInterceptor(logoutResponseSchema))
  logoutAll(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Body(new SchemaPipe(emptyAuthSchema)) body: Record<string, never>) { void body; return this.execute(res, () => this.auth.logout(req, true)); }
  @Post('email-verification/request') @HttpCode(202) @UseInterceptors(new ResponseSchemaInterceptor(signupResponseSchema))
  emailRequest(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Body(new SchemaPipe(emptyAuthSchema)) body: Record<string, never>) { void body; return this.execute(res, () => this.auth.emailVerification(req, 'request')); }
  @Post('email-verification/confirm') @HttpCode(200) @UseInterceptors(new ResponseSchemaInterceptor(signupResponseSchema))
  emailConfirm(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Body(new SchemaPipe(emailVerificationConfirmSchema)) body: { token: string }) { return this.execute(res, () => this.auth.emailVerification(req, 'confirm', body.token)); }
  @Get('email-verification/status') @UseInterceptors(new ResponseSchemaInterceptor(emailVerificationStatusSchema))
  emailStatus(@Req() req: Request, @Res({ passthrough: true }) res: Response) { return this.execute(res, () => this.auth.emailVerification(req, 'status')); }
  @Get('me') @UseInterceptors(new ResponseSchemaInterceptor(meResponseSchema))
  me(@Req() req: Request, @Res({ passthrough: true }) res: Response) { return this.execute(res, () => this.auth.me(req)); }
}

// Exact handler references, not client URLs, metadata or a module-wide bypass.
const authenticationHandlers = new Set<unknown>([AuthController.prototype.csrf, AuthController.prototype.signup,
  AuthController.prototype.login, AuthController.prototype.logout, AuthController.prototype.logoutAll, AuthController.prototype.me, AuthController.prototype.emailRequest, AuthController.prototype.emailConfirm, AuthController.prototype.emailStatus]);
export const isAuthenticationHandler = (handler: unknown) => authenticationHandlers.has(handler);
