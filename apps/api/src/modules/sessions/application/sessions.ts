import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import session from 'express-session';
import type { Request, RequestHandler, Response } from 'express';
import { AuthUnavailableError, Tenancy, TenantAccessError, type SessionEvidence, type SessionVerifier, type VerifiedPrincipal } from '@unblok/database';
import { normalizeError, type CorrelatedRequest } from '../../../errors';
import { withDeadline } from '@unblok/backend-runtime';
import { validSid, validState, type SessionState, type BoundedSessionStore } from '../infrastructure/store';
import type { SessionSettings } from '../infrastructure/settings';

export interface SessionFences {
  create(input: { userId: string; identityId: string; authEpoch?: bigint; sidDigest: string; absoluteExpiresAt: Date; idleExpiresAt: Date }): Promise<SessionEvidence>;
  rotate(evidence: SessionEvidence, digest: string, idle: Date): Promise<SessionEvidence>;
  revoke(evidence: SessionEvidence): Promise<void>;
  revokeAll(userId: string): Promise<void>;
}
type Boundary = { sid: string; response: Response; abort: AbortController; used: boolean; terminal?: boolean; evidence?: SessionEvidence; state?: SessionState };
const random = () => randomBytes(32).toString('base64url');
const digest = (sid: string) => createHash('sha256').update(sid).digest('hex');
const health = (r: Request) => r.method === 'GET' && ['/live', '/ready', '/api/v1/live', '/api/v1/ready'].includes(r.path);
const failure = (req: Request, res: Response, status: number) => res.status(status).json(normalizeError(status, (req as CorrelatedRequest).requestId ?? 'unavailable'));
function csrfMatches(actual: string | undefined, expected: string) {
  return !!actual && /^[A-Za-z0-9_-]{43}$/.test(actual) && timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

// Only the server composition owns these capabilities and identity resolution.
export class Sessions implements SessionVerifier {
  #requests = new WeakMap<Request, Boundary>();
  #assertions = new WeakMap<object, Boundary>();
  #tenancy?: Tenancy;
  constructor(private readonly store: BoundedSessionStore, readonly settings: SessionSettings, private readonly fences: SessionFences,
    private readonly resolveIdentity: (assertion: unknown) => Promise<{ userId: string; identityId: string; authEpoch?: bigint } | null>) {}
  bind(tenancy: Tenancy) { if (this.#tenancy) throw new Error('Session tenancy already bound'); this.#tenancy = tenancy; }
  private load(sid: string) {
    return new Promise<session.SessionData | null>( (resolve, reject) => this.store.get(sid, (error, data) => error ? reject(new AuthUnavailableError()) : resolve(data ?? null)) );
  }
  async verify(assertion: unknown): Promise<SessionEvidence | null> {
    if (!assertion || typeof assertion !== 'object') return null;
    const boundary = this.#assertions.get(assertion);
    if (!boundary || boundary.abort.signal.aborted || !validSid(boundary.sid)) return null;
    const data = await this.load(boundary.sid), s = validState(data?.state);
    if (!s || s.kind !== 'authenticated' || boundary.abort.signal.aborted) return null;
    boundary.state = Object.freeze({ ...s });
    boundary.evidence = Object.freeze({ userId: s.userId, identityId: s.identityId, familyId: s.familyId, authEpoch: BigInt(s.authEpoch),
      generation: BigInt(s.generation), sidDigest: digest(boundary.sid) });
    return boundary.evidence;
  }
  middleware(): RequestHandler {
    const middleware = session({ store: this.store, secret: this.settings.secrets, name: this.settings.name,
      genid: random, resave: false, saveUninitialized: false, rolling: false,
      cookie: { httpOnly: true, secure: this.settings.secure, sameSite: 'lax', path: '/', maxAge: this.settings.idleMs } });
    return (req, res, next) => {
      if (health(req)) { next(); return; }
      if (this.settings.secure && !req.secure) { failure(req, res, 403); return; }
      const cookie = req.get('cookie') ?? '';
      const copies = cookie.split(';').filter(c => c.includes('=') && c.slice(0, c.indexOf('=')).trim() === this.settings.name);
      if (cookie.length > 8192 || copies.length > 1) { failure(req, res, 400); return; }
      middleware(req, res, error => {
        if (error) { failure(req, res, 503); return; }
        if (!validSid(req.sessionID) || (copies.length && !validState(req.session?.state))) {
          res.clearCookie(this.settings.name, { httpOnly: true, secure: this.settings.secure, sameSite: 'lax', path: '/' });
          failure(req, res, 401); return;
        }
        // Restored cache cookie bookkeeping cannot downgrade the current profile.
        req.session.cookie.httpOnly = true; req.session.cookie.secure = this.settings.secure;
        req.session.cookie.sameSite = 'lax'; req.session.cookie.path = '/'; delete req.session.cookie.domain;
        const state = validState(req.session.state);
        if (state) req.session.cookie.maxAge = Math.min(state.idleExpiresAt, state.absoluteExpiresAt) - Date.now();
        const abort = new AbortController();
        const end = () => abort.abort();
        req.once('aborted', end); res.once('close', end); res.once('finish', end);
        const boundary: Boundary = { sid: req.sessionID, response: res, abort, used: false };
        this.#requests.set(req, boundary);
        // Late library callbacks can restore req.session. Remove it before
        // express-session's finalization and header hooks on terminal requests.
        const responseEnd = res.end, writeHead = res.writeHead;
        res.end = function (...args: unknown[]) {
          if (boundary.terminal) Reflect.deleteProperty(req, 'session');
          return Reflect.apply(responseEnd, this, args);
        };
        res.writeHead = function (...args: unknown[]) {
          if (boundary.terminal) Reflect.deleteProperty(req, 'session');
          return Reflect.apply(writeHead, this, args);
        };
        if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
          const s = validState(req.session?.state);
          // No missing/null Origin fallback; no Referer or forwarded-origin trust.
          if (!this.settings.origins.includes(req.get('origin') ?? '') || !s ||
            !csrfMatches(req.get('x-csrf-token'), s.csrf) || req.get('content-type')?.split(';')[0]?.trim() !== 'application/json') {
            failure(req, res, 403); return;
          }
        }
        next();
      });
    };
  }
  private boundary(req: Request) {
    const boundary = this.#requests.get(req);
    if (!boundary || boundary.used || boundary.abort.signal.aborted) throw new TenantAccessError();
    return boundary;
  }
  async withRequest<T>(req: Request, run: (principal: VerifiedPrincipal) => Promise<T>): Promise<T> {
    const boundary = this.boundary(req); boundary.used = true;
    const assertion = Object.freeze({}); this.#assertions.set(assertion, boundary);
    try {
      if (!this.#tenancy) throw new AuthUnavailableError();
      return await this.#tenancy.authenticateSession(assertion, run, boundary.abort.signal);
    } finally { this.#assertions.delete(assertion); }
  }
  private operation(run: (done: (error?: unknown) => void) => void) {
    return withDeadline(new Promise<void>((resolve, reject) => run(error => error ? reject(new AuthUnavailableError()) : resolve())), this.settings.deadlineMs)
      .catch(() => { throw new AuthUnavailableError(); });
  }
  private async save(req: Request, state: SessionState) {
    req.session.state = state;
    req.session.cookie.maxAge = Math.min(state.idleExpiresAt, state.absoluteExpiresAt) - Date.now();
    if (req.session.cookie.maxAge <= 0) throw new TenantAccessError();
    await this.operation(done => req.session.save(done));
  }
  private abandon(req: Request, boundary: Boundary) {
    // Suppress express-session's implicit response-finalization retry/Set-Cookie.
    // A failed establishment/rotation must not deliver its new SID even when
    // the late save and compensating database revoke are both indeterminate.
    boundary.terminal = true; Reflect.deleteProperty(req, 'session'); boundary.abort.abort();
    boundary.response.clearCookie(this.settings.name, { httpOnly: true, secure: this.settings.secure, sameSite: 'lax', path: '/' });
  }
  // The reviewed auth GET bootstrap is no-store and rate-limited. Exact
  // Origin remains required unless its narrow same-origin browser rule is enabled.
  async bootstrap(req: Request, allowSameOriginFetch = false): Promise<string> {
    const b = this.boundary(req);
    const origin = req.get('origin');
    const mode = req.get('sec-fetch-mode'), site = req.get('sec-fetch-site'), destination = req.get('sec-fetch-dest');
    const requestOrigin = `${req.protocol}://${req.get('host')}`;
    // Navigation is never a token delivery mechanism. Browser-controlled fetch
    // metadata must agree with an explicit Origin, when supplied. Non-browser
    // clients can forge headers; this is not a cryptographic client attestation.
    if ((mode !== undefined && !['cors', 'same-origin'].includes(mode)) ||
        (destination !== undefined && !['', 'empty'].includes(destination)) ||
        (origin !== undefined && (mode === 'same-origin' || site === 'same-origin') && origin !== requestOrigin)) throw new TenantAccessError();
    // Browsers may omit Origin on same-origin GET. Only the reviewed bootstrap
    // opts into Fetch Metadata + exact configured host/protocol corroboration.
    const sameOrigin = allowSameOriginFetch && origin === undefined && req.get('sec-fetch-site') === 'same-origin' &&
      ['cors', 'same-origin'].includes(mode ?? '') && this.settings.origins.includes(requestOrigin);
    if (req.method !== 'GET' || (!sameOrigin && !this.settings.origins.includes(origin ?? ''))) throw new TenantAccessError();
    b.response.setHeader('Cache-Control', 'no-store');
    const existing = validState(req.session.state);
    if (existing?.kind === 'authenticated') {
      // A restored cache entry is not authority. Reuse the fresh request-bound
      // verifier and PostgreSQL fences before exposing an authenticated token.
      await this.withRequest(req, async () => {});
      this.admittedEvidence(b);
      return b.state!.csrf;
    }
    if (existing) return existing.csrf;
    const now = Date.now(), csrf = random();
    try {
      await this.save(req, { version: 1, kind: 'anonymous', csrf, issuedAt: now,
        idleExpiresAt: now + this.settings.anonymousMs, absoluteExpiresAt: now + this.settings.anonymousMs });
    } catch (error) { this.abandon(req, b); throw error; }
    return csrf;
  }
  // Only fresh credentials checked by the injected server verifier may establish
  // identity; no provider/subject/user/role fields supplied by a browser are used.
  async establish(req: Request, assertion: unknown) {
    const b = this.boundary(req);
    if (req.method !== 'POST') throw new TenantAccessError();
    const identity = await this.resolveIdentity(assertion);
    if (!identity || b.abort.signal.aborted) throw new TenantAccessError();
    // Reauthentication must durably retire the presented family as well as
    // deleting its cache SID. Otherwise a late SET could revive that predecessor.
    if (validState(req.session.state)?.kind === 'authenticated') {
      try { await this.withRequest(req, async () => { await this.fences.revoke(this.admittedEvidence(b)); }); }
      catch (error) { this.abandon(req, b); throw error; }
    } else b.used = true;
    try { await this.operation(done => req.session.regenerate(done)); b.sid = req.sessionID; }
    catch (error) { this.abandon(req, b); throw error; }
    const now = Date.now(), absolute = now + this.settings.absoluteMs, idle = Math.min(absolute, now + this.settings.idleMs);
    let evidence: SessionEvidence;
    try { evidence = await this.fences.create({ ...identity, sidDigest: digest(b.sid), absoluteExpiresAt: new Date(absolute), idleExpiresAt: new Date(idle) }); }
    catch (error) { this.abandon(req, b); throw error; }
    try {
      if (b.abort.signal.aborted) throw new TenantAccessError();
      await this.save(req, { version: 1, kind: 'authenticated', csrf: random(), issuedAt: now, absoluteExpiresAt: absolute, idleExpiresAt: idle,
        userId: evidence.userId, identityId: evidence.identityId, familyId: evidence.familyId, authEpoch: evidence.authEpoch.toString(), generation: evidence.generation.toString() });
      if (b.abort.signal.aborted) throw new TenantAccessError();
    } catch (error) {
      this.abandon(req, b);
      // Save timeout is not cancellation. Revoke any late save; an unavailable
      // DB can leave an unconfirmed orphan, never an authenticated success.
      try { await this.fences.revoke(evidence); } catch { /* unconfirmed; report failure */ }
      throw error;
    }
  }
  async rotate(req: Request) {
    if (req.method !== 'POST') throw new TenantAccessError();
    await this.withRequest(req, async () => {
      const b = this.#requests.get(req)!;
      const old = b.state;
      if (!old || old.kind !== 'authenticated') throw new TenantAccessError();
      const evidence = this.admittedEvidence(b);
      try { await this.operation(done => req.session.regenerate(done)); b.sid = req.sessionID; }
      catch (error) {
        this.abandon(req, b);
        try { await this.fences.revoke(evidence); } catch { /* unconfirmed; no success or cookie delivery */ }
        throw error;
      }
      const idle = Math.min(old.absoluteExpiresAt, Date.now() + this.settings.idleMs);
      let updated: SessionEvidence;
      try { updated = await this.fences.rotate(evidence, digest(b.sid), new Date(idle)); }
      catch (error) { this.abandon(req, b); try { await this.fences.revoke(evidence); } catch { /* unconfirmed */ } throw error; }
      try {
        if (b.abort.signal.aborted) throw new TenantAccessError();
        await this.save(req, { ...old, csrf: random(), generation: updated.generation.toString(), idleExpiresAt: idle });
        if (b.abort.signal.aborted) throw new TenantAccessError();
      }
      catch (error) { this.abandon(req, b); try { await this.fences.revoke(updated); } catch { /* unconfirmed */ } throw error; }
    });
  }
  private admittedEvidence(b: Boundary) {
    if (!b.evidence || b.abort.signal.aborted) throw new TenantAccessError();
    return b.evidence;
  }
  async logout(req: Request, all = false): Promise<{ revocation: 'confirmed'; cleanup: 'confirmed' | 'unconfirmed' }> {
    if (req.method !== 'POST') throw new TenantAccessError();
    return this.withRequest(req, async () => {
      const b = this.#requests.get(req)!;
      const evidence = this.admittedEvidence(b);
      if (all) await this.fences.revokeAll(evidence.userId); else await this.fences.revoke(evidence);
      const active = req.session;
      this.abandon(req, b);
      let cleanup: 'confirmed' | 'unconfirmed' = 'confirmed';
      try { await this.operation(done => active.destroy(done)); } catch { cleanup = 'unconfirmed'; }
      return { revocation: 'confirmed', cleanup };
    });
  }
}
