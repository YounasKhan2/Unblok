import type { Request } from 'express';
import { AuthUnavailableError, Tenancy, TenantAccessError } from '@unblok/database';
import type { SignupInput, LoginInput } from '@unblok/contracts';
import { Sessions } from '../../sessions';
import { Passwords } from '../infrastructure/passwords';

export interface StoredCredential {
  readonly userId: string; readonly identityId: string; readonly authEpoch: bigint;
  readonly passwordHash: string; readonly disabled: boolean;
}
export interface Credentials {
  create(input: { name: string; email: string; passwordHash: string }): Promise<void>;
  lookup(email: string): Promise<StoredCredential | null>;
  confirm(snapshot: StoredCredential): Promise<boolean>;
}
export type AuthAction = 'signup' | 'login' | 'csrf' | 'logout' | 'logout-all';
export interface AuthLimits { consume(action: AuthAction, ip: string, email?: string): Promise<{ allowed: boolean; retryAfter: number }> }
export class AuthRateError extends Error { constructor(readonly retryAfter: number) { super('Authentication rate exceeded'); } }

export class Authentication {
  #proofs = new WeakMap<object, StoredCredential>();
  #sessions?: Sessions;
  #tenancy?: Tenancy;
  constructor(private readonly credentials: Credentials, private readonly passwords: Passwords, private readonly limits: AuthLimits) {}
  bind(sessions: Sessions, tenancy: Tenancy) {
    if (this.#sessions) throw new Error('Authentication already bound'); this.#sessions = sessions; this.#tenancy = tenancy;
  }
  async resolveIdentity(assertion: unknown) {
    if (!assertion || typeof assertion !== 'object') return null;
    const snapshot = this.#proofs.get(assertion); this.#proofs.delete(assertion);
    if (!snapshot || !await this.credentials.confirm(snapshot)) return null;
    return Object.freeze({ userId: snapshot.userId, identityId: snapshot.identityId, authEpoch: snapshot.authEpoch });
  }
  private sessions() { if (!this.#sessions) throw new AuthUnavailableError(); return this.#sessions; }
  private async budget(req: Request, action: AuthAction, email?: string) {
    const result = await this.limits.consume(action, req.ip ?? req.socket.remoteAddress ?? 'unknown', email);
    if (!result.allowed) throw new AuthRateError(result.retryAfter);
  }
  async signup(req: Request, input: SignupInput) {
    await this.budget(req, 'signup', input.email);
    const passwordHash = await this.passwords.hash(input.password);
    // No auto-login, identity IDs or duplicate-account disclosure.
    await this.credentials.create({ name: input.name, email: input.email, passwordHash });
    return { status: 'accepted' as const };
  }
  async login(req: Request, input: LoginInput) {
    await this.budget(req, 'login', input.email);
    const snapshot = await this.credentials.lookup(input.email);
    const matches = await this.passwords.verify(input.password, snapshot?.passwordHash ?? null);
    if (!snapshot || !matches || snapshot.disabled) throw new TenantAccessError();
    const proof = Object.freeze({}); this.#proofs.set(proof, snapshot);
    try { await this.sessions().establish(req, proof); }
    finally { this.#proofs.delete(proof); }
    const csrf = req.session.state?.csrf; if (!csrf) throw new AuthUnavailableError();
    return { csrf };
  }
  async csrf(req: Request) { await this.budget(req, 'csrf'); return { csrf: await this.sessions().bootstrap(req, true) }; }
  async logout(req: Request, all = false) { await this.budget(req, all ? 'logout-all' : 'logout'); return this.sessions().logout(req, all); }
  async me(req: Request) {
    const tenancy = this.#tenancy; if (!tenancy) throw new AuthUnavailableError();
    const row = await this.sessions().withRequest(req, principal => tenancy.currentUser(principal));
    return { user: { id: row.id, name: row.name, email: row.email, emailVerified: false as const } };
  }
}
