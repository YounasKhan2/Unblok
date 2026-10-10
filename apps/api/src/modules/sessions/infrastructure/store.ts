import session from 'express-session';
import { RedisStore } from 'connect-redis';
import { createClient } from 'redis';
import { z } from 'zod';
import { AuthUnavailableError } from '@unblok/database';
import { withDeadline } from '@unblok/backend-runtime';
import type { SessionSettings } from './settings';

const common = { version: z.literal(1), csrf: z.string().regex(/^[A-Za-z0-9_-]{43}$/), issuedAt: z.number().int().positive(),
  absoluteExpiresAt: z.number().int().positive(), idleExpiresAt: z.number().int().positive() };
export const stateSchema = z.discriminatedUnion('kind', [
  z.object({ ...common, kind: z.literal('anonymous') }).strict(),
  z.object({ ...common, kind: z.literal('authenticated'), userId: z.uuid(), identityId: z.uuid(), familyId: z.uuid(),
    authEpoch: z.string().regex(/^[1-9][0-9]{0,18}$/), generation: z.string().regex(/^[1-9][0-9]{0,18}$/) }).strict(),
]);
export type SessionState = z.infer<typeof stateSchema>;
declare module 'express-session' { interface SessionData { state?: SessionState } }
export function validState(value: unknown, now = Date.now()): SessionState | null {
  const result = stateSchema.safeParse(value);
  if (!result.success) return null;
  const s = result.data;
  const absoluteLimit = s.kind === 'authenticated' ? 12 * 60 * 60 * 1000 : 10 * 60 * 1000;
  const idleLimit = s.kind === 'authenticated' ? 30 * 60 * 1000 : 10 * 60 * 1000;
  if (!Number.isSafeInteger(now) || s.issuedAt > now || s.issuedAt >= s.idleExpiresAt ||
    s.idleExpiresAt > s.absoluteExpiresAt || s.idleExpiresAt <= now ||
    s.absoluteExpiresAt - s.issuedAt > absoluteLimit || s.idleExpiresAt - now > idleLimit) return null;
  return s;
}
export const validSid = (sid: unknown): sid is string => typeof sid === 'string' && /^[A-Za-z0-9_-]{43}$/.test(sid);
type Done = (error?: unknown, value?: session.SessionData | null) => void;
// Deadlines bound acknowledgement, not the Redis command's execution. A late
// SET/DEL may still occur. PostgreSQL fences, never cache deletion, revoke auth.
export class BoundedSessionStore extends session.Store {
  constructor(private readonly underlying: session.Store, private readonly milliseconds: number) { super(); }
  private call(run: (done: Done) => void, callback: Done) {
    let settled = false;
    const finish: Done = (error, value) => {
      if (settled) return;
      settled = true; clearTimeout(timer); callback(error ? new AuthUnavailableError() : undefined, value);
    };
    const timer = setTimeout(() => finish(new AuthUnavailableError()), this.milliseconds);
    try { run(finish); } catch { finish(new AuthUnavailableError()); }
  }
  override get(sid: string, callback: Done) {
    if (!validSid(sid)) { callback(undefined, null); return; }
    this.call(done => this.underlying.get(sid, (error, data) => {
      if (error) { done(error); return; }
      // Only known internal fields may survive a restored/malformed payload.
      if (!data || !validState(data.state) || Object.keys(data).some(k => !['cookie', 'state'].includes(k))) { done(undefined, null); return; }
      done(undefined, data);
    }), callback);
  }
  override set(sid: string, data: session.SessionData, callback: (error?: unknown) => void = () => {}) {
    const s = validState(data.state);
    if (!validSid(sid) || !s || Object.keys(data).some(k => !['cookie', 'state'].includes(k))) { callback(new AuthUnavailableError()); return; }
    const snapshot = JSON.parse(JSON.stringify({ cookie: data.cookie, state: s })) as session.SessionData;
    this.call(done => this.underlying.set(sid, snapshot, done), callback);
  }
  // Automatic HTTP finalization/polling must not extend application deadlines.
  override touch(_sid: string, _data: session.SessionData, callback: (error?: unknown) => void = () => {}) { callback(); }
  override destroy(sid: string, callback: (error?: unknown) => void = () => {}) {
    if (!validSid(sid)) { callback(); return; }
    this.call(done => this.underlying.destroy(sid, done), callback);
  }
}
export async function connectSessionStore(url: string, settings: SessionSettings) {
  const client = createClient({ url, disableOfflineQueue: true, commandOptions: { timeout: settings.deadlineMs },
    socket: { connectTimeout: settings.deadlineMs, reconnectStrategy: retries => retries > 10 ? false : Math.min(100 * (retries + 1), 1000) } });
  // Never log client errors: SDK diagnostics can contain credentials.
  client.on('error', () => {});
  const close = async () => { if (client.isOpen) client.destroy(); };
  try { await withDeadline(client.connect(), settings.deadlineMs); }
  catch { await close(); throw new AuthUnavailableError(); }
  const underlying = new RedisStore({ client, prefix: settings.prefix, disableTouch: true,
    ttl: data => { const s = validState(data.state); return s ? Math.max(1, Math.ceil((Math.min(s.idleExpiresAt, s.absoluteExpiresAt) - Date.now()) / 1000)) : 1; } });
  return { store: new BoundedSessionStore(underlying, settings.deadlineMs), close,
    ready: async () => { try { return await withDeadline(client.ping(), settings.deadlineMs) === 'PONG'; } catch { return false; } } };
}
