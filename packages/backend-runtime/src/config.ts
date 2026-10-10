import { z } from 'zod';

const integer = (min: number, max: number, fallback: number) => z.coerce.number().int().min(min).max(max).default(fallback);
const origin = z.string().refine(value => {
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && url.origin === value && !url.username && !url.password; }
  catch { return false; }
}, 'Expected an exact HTTP origin without path, wildcard, or credentials');
const databaseUrl = z.string().refine(value => {
  try { const url = new URL(value); return ['postgres:', 'postgresql:'].includes(url.protocol) && !!url.hostname && !!url.username && !!url.password && url.pathname.length > 1; }
  catch { return false; }
}, 'Invalid PostgreSQL connection URL');
const redisUrl = z.string().refine(value => {
  try { const url = new URL(value); return ['redis:', 'rediss:'].includes(url.protocol) && !!url.hostname && !!url.password && !url.search && /^\/\d*$/.test(url.pathname); }
  catch { return false; }
}, 'Invalid authenticated Valkey connection URL');
const commonSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  DATABASE_URL: databaseUrl,
  REDIS_URL: redisUrl,
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'silent']).default('info'),
  SHUTDOWN_TIMEOUT_MS: integer(1000, 60000, 10000),
});
const apiSchema = commonSchema.extend({
  API_HOST: z.enum(['127.0.0.1', '0.0.0.0']).default('127.0.0.1'),
  API_PORT: integer(1, 65535, 4000),
  CORS_ORIGINS: z.string().transform(value => value.split(',').map(part => part.trim())).pipe(z.array(origin).min(1)),
  BODY_LIMIT_BYTES: integer(1024, 1048576, 65536),
  RATE_LIMIT_MAX: integer(1, 10000, 120),
  RATE_LIMIT_WINDOW_MS: integer(1000, 3600000, 60000),
});
const workerSchema = commonSchema.extend({ WORKER_CONCURRENCY: integer(1, 16, 2) });

function parse<T>(schema: z.ZodType<T>, env: Record<string, string | undefined>): T {
  const result = schema.safeParse(env);
  if (!result.success) {
    // Never include input values (URLs can contain credentials) in diagnostics.
    throw new Error(`Invalid environment fields: ${[...new Set(result.error.issues.map(issue => issue.path.join('.')))].join(', ')}`);
  }
  const config = result.data as T & { NODE_ENV: string; REDIS_URL: string; DATABASE_URL: string; CORS_ORIGINS?: string[] };
  if (config.NODE_ENV === 'production') {
    if (!config.REDIS_URL.startsWith('rediss:')) throw new Error('Production REDIS_URL requires TLS');
    const sslmode = new URL(config.DATABASE_URL).searchParams.get('sslmode');
    if (sslmode !== 'verify-full') throw new Error('Production DATABASE_URL requires sslmode=verify-full');
    if (config.CORS_ORIGINS?.some(value => !value.startsWith('https://'))) throw new Error('Production CORS_ORIGINS require HTTPS');
  }
  return result.data;
}
export const loadApiConfig = (env: Record<string, string | undefined>) => parse(apiSchema, env);
export const loadWorkerConfig = (env: Record<string, string | undefined>) => parse(workerSchema, env);
export type ApiConfig = ReturnType<typeof loadApiConfig>;
export type WorkerConfig = ReturnType<typeof loadWorkerConfig>;

// Independent domain key; same id/key on API and dispatcher. Rotation invalidates
// pending old-key proofs; never rotate silently during restoration.
export function loadVerificationKey(env: Record<string, string | undefined>) {
  return parse(z.object({ id: z.string().regex(/^[a-z0-9-]{1,40}$/), secret: z.string().regex(/^[0-9a-f]{64}$/) }),
    { id: env.EMAIL_VERIFICATION_KEY_ID, secret: env.EMAIL_VERIFICATION_KEY });
}
export function loadVerificationMail(env: Record<string, string | undefined>) {
  const schema = z.object({ endpoint: z.url(), from: z.email(), username: z.string().optional(), password: z.string().optional() });
  const parsed = schema.safeParse({ endpoint: env.EMAIL_MAIL_ENDPOINT, from: env.EMAIL_MAIL_FROM, username: env.EMAIL_MAIL_USERNAME, password: env.EMAIL_MAIL_PASSWORD });
  if (!parsed.success) throw new Error('Invalid verification mail configuration');
  const result = parsed.data, url = new URL(result.endpoint);
  if (!!result.username !== !!result.password || (result.username && /[:\r\n]/.test(result.username))) throw new Error('Invalid verification mail credentials');
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/api/v1/send') throw new Error('Invalid verification mail endpoint');
  if (env.NODE_ENV === 'production') {
    if (url.protocol !== 'https:' || !result.username || !result.password) throw new Error('Verification mail requires authenticated HTTPS');
  } else if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1') throw new Error('Development mail requires loopback HTTP');
  return result;
}
