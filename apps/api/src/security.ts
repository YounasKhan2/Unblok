import { createHash, randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import type { Redis } from 'ioredis';
import { type ApiConfig, type Logger } from '@unblok/backend-runtime';
import { normalizeError, type CorrelatedRequest } from './errors';

export interface RateLimiter { consume(key: string): Promise<{ allowed: boolean; retryAfter: number }> }
// Atomic Redis fixed window; shared across API processes. Never store raw IPs.
const script = `local n = redis.call('INCR', KEYS[1])
if n == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
local ttl = redis.call('PTTL', KEYS[1])
return {n, ttl}`;
export class RedisRateLimiter implements RateLimiter {
  constructor(private readonly redis: Redis, private readonly max: number, private readonly window: number) {}
  async consume(key: string) {
    const hash = createHash('sha256').update(key).digest('hex');
    const [count, ttl] = await this.redis.eval(script, 1, `unblok:rate:${hash}`, this.window) as [number, number];
    return { allowed: count <= this.max, retryAfter: Math.max(1, Math.ceil(ttl / 1000)) };
  }
}
export function correlation(logger: Logger): RequestHandler {
  return (request: CorrelatedRequest, response, next) => {
    const provided = request.get('x-request-id');
    request.requestId = provided && /^[A-Za-z0-9_-]{1,64}$/.test(provided) ? provided : randomUUID();
    response.setHeader('x-request-id', request.requestId);
    const start = performance.now();
    response.on('finish', () => logger.info({
      event: 'request_complete', requestId: request.requestId,
      method: request.method, status: response.statusCode, durationMs: Math.round(performance.now() - start),
    }));
    next();
  };
}
export function cors(config: ApiConfig): RequestHandler {
  return (request: CorrelatedRequest, response, next) => {
    const origin = request.get('origin');
    response.vary('Origin');
    if (origin && !config.CORS_ORIGINS.includes(origin)) {
      response.status(403).json(normalizeError(403, request.requestId ?? 'unavailable')); return;
    }
    if (origin) {
      response.setHeader('Access-Control-Allow-Origin', origin);
      response.setHeader('Access-Control-Expose-Headers', 'X-Request-Id, Retry-After');
    }
    if (request.method === 'OPTIONS') {
      const method = request.get('access-control-request-method');
      const headers = (request.get('access-control-request-headers') ?? '').toLowerCase().split(',').map(value => value.trim()).filter(Boolean);
      if (!origin || !method || !['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'].includes(method) ||
          headers.some(header => !['content-type', 'x-request-id', 'authorization'].includes(header))) {
        response.status(403).json(normalizeError(403, request.requestId ?? 'unavailable')); return;
      }
      response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      response.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Request-Id, Authorization');
      response.status(204).end(); return;
    }
    next();
  };
}
export function rateLimit(limiter: RateLimiter): RequestHandler {
  return (request: CorrelatedRequest, response, next) => {
    // Liveness must not require another service; readiness probes also bypass
    // throttling but perform their own bounded dependency checks.
    if (request.method === 'GET' && ['/live', '/ready', '/api/v1/live', '/api/v1/ready'].includes(request.path)) { next(); return; }
    void limiter.consume(request.ip ?? request.socket.remoteAddress ?? 'unknown').then(result => {
      if (!result.allowed) {
        response.setHeader('Retry-After', result.retryAfter);
        response.status(429).json(normalizeError(429, request.requestId ?? 'unavailable')); return;
      }
      next();
    }, () => response.status(503).json(normalizeError(503, request.requestId ?? 'unavailable')));
  };
}

export function bodyBoundary(config: ApiConfig): RequestHandler {
  return (request: CorrelatedRequest, response, next) => {
    const size = Number(request.get('content-length') ?? '0');
    const hasBody = size > 0 || request.get('transfer-encoding') !== undefined;
    const encoding = request.get('content-encoding');
    const contentType = request.get('content-type')?.split(';')[0]?.trim().toLowerCase();
    const reject = (status: number) => response.status(status).json(normalizeError(status, request.requestId ?? 'unavailable'));
    if (size > config.BODY_LIMIT_BYTES) { reject(413); return; }
    if (hasBody && ((encoding && encoding !== 'identity') || !['application/json', 'application/x-www-form-urlencoded'].includes(contentType ?? ''))) {
      reject(415); return;
    }
    next();
  };
}
