import type Redis from 'ioredis';
import { createHmac } from 'node:crypto';
import { withDeadline } from '@unblok/backend-runtime';
import { AuthUnavailableError } from '@unblok/database';
import { RedisRateLimiter } from '../../../security';

export class WorkspaceLimits {
  private readonly account: RedisRateLimiter;
  private readonly ip: RedisRateLimiter;
  constructor(redis: Redis, private readonly secret: string, namespace: string) {
    this.account = new RedisRateLimiter(redis, 5, 3600000, namespace + 'workspace-create:');
    this.ip = new RedisRateLimiter(redis, 10, 3600000, namespace + 'workspace-create:');
  }
  async consume(actor: string, ip: string) {
    const actorKey = createHmac('sha256', this.secret).update('workspace-create:' + actor).digest('hex');
    try {
      const results = await withDeadline(Promise.all([this.account.consume('account:' + actorKey), this.ip.consume('ip:' + ip)]), 750);
      return { allowed: results.every(r => r.allowed), retryAfter: Math.max(...results.map(r => r.retryAfter)) };
    } catch { throw new AuthUnavailableError(); }
  }
}
