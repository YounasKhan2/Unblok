import { z } from 'zod';
import { isIP } from 'node:net';
import type { ApiConfig } from '@unblok/backend-runtime';

const schema = z.object({
  SESSION_SECRETS: z.string().transform(s => s.split(',')).pipe(z.array(z.string().regex(/^[a-f0-9]{64,128}$/)).min(1).max(3)),
  SESSION_NAMESPACE: z.string().regex(/^[a-z0-9-]{1,40}$/),
  SESSION_TRUSTED_PROXIES: z.string().default('').transform(s => s ? s.split(',') : []).pipe(z.array(z.string().refine(s => {
    const [address, bits, extra] = s.split('/');
    return !!address && isIP(address) === 4 && address !== '0.0.0.0' && !extra && (bits === undefined || /^(?:[1-9]|[12][0-9]|3[0-2])$/.test(bits));
  })).max(10)),
  SESSION_CROSS_ORIGIN: z.enum(['true', 'false']).default('false').transform(s => s === 'true'),
});
export interface SessionSettings {
  secrets: string[]; prefix: string; trustedProxies: string[]; credentials: boolean;
  secure: boolean; name: string; origins: readonly string[];
  idleMs: number; absoluteMs: number; anonymousMs: number; deadlineMs: number;
}
export function sessionSettings(config: ApiConfig, env: Record<string, string | undefined>): SessionSettings {
  const parsed = schema.safeParse(env);
  if (!parsed.success) throw new Error('Invalid session configuration');
  const s = parsed.data, secure = config.NODE_ENV === 'production';
  if (!secure && s.SESSION_TRUSTED_PROXIES.length) throw new Error('Development proxy trust is prohibited');
  if (!secure && config.API_HOST !== '127.0.0.1') throw new Error('HTTP session development requires loopback binding');
  return { secrets: s.SESSION_SECRETS, prefix: `unblok:session:${s.SESSION_NAMESPACE}:`, trustedProxies: s.SESSION_TRUSTED_PROXIES,
    credentials: s.SESSION_CROSS_ORIGIN, secure, name: secure ? '__Host-unblok.sid' : 'unblok.sid.dev', origins: config.CORS_ORIGINS,
    idleMs: 1800000, absoluteMs: 43200000, anonymousMs: 600000, deadlineMs: 750 };
}
