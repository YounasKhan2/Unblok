import { createHmac } from 'node:crypto';
import type Redis from 'ioredis';
import { withDeadline } from '@unblok/backend-runtime';
import { AuthUnavailableError } from '@unblok/database';
import { RedisRateLimiter } from '../../../security';
import type { AuthAction, AuthLimits } from '../application/authentication';

export class AuthenticationLimits implements AuthLimits {
  private readonly loginIp: RedisRateLimiter;
  private readonly loginAccount: RedisRateLimiter;
  private readonly signupIp: RedisRateLimiter;
  private readonly signupAccount: RedisRateLimiter;
  private readonly csrfIp: RedisRateLimiter;
  private readonly logoutIp: RedisRateLimiter;
  constructor(redis: Redis, private readonly secret: string, namespace: string) {
    const prefix = `${namespace}rate:`;
    this.loginIp = new RedisRateLimiter(redis, 30, 900000, prefix);
    this.loginAccount = new RedisRateLimiter(redis, 10, 900000, prefix);
    this.signupIp = new RedisRateLimiter(redis, 10, 3600000, prefix);
    this.signupAccount = new RedisRateLimiter(redis, 5, 3600000, prefix);
    this.csrfIp = new RedisRateLimiter(redis, 30, 900000, prefix);
    this.logoutIp = new RedisRateLimiter(redis, 30, 900000, prefix);
  }
  async consume(action: AuthAction, ip: string, email?: string) {
    const ipKey = `auth:${action}:ip:${ip}`;
    const accountKey = `auth:${action}:account:${createHmac('sha256', this.secret).update(email ?? '').digest('hex')}`;
    const checks = action === 'login' ? [this.loginIp.consume(ipKey), this.loginAccount.consume(accountKey)]
      : action === 'signup' ? [this.signupIp.consume(ipKey), this.signupAccount.consume(accountKey)]
      : action === 'csrf' ? [this.csrfIp.consume(ipKey)] : [this.logoutIp.consume(ipKey)];
    try {
      const results = await withDeadline(Promise.all(checks), 750);
      return { allowed: results.every(r => r.allowed), retryAfter: Math.max(...results.map(r => r.retryAfter)) };
    } catch { throw new AuthUnavailableError(); }
  }
}
