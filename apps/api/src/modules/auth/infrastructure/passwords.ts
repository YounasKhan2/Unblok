import { randomBytes } from 'node:crypto';
import { withDeadline } from '@unblok/backend-runtime';
import { AuthUnavailableError } from '@unblok/database';

const profile = /^\$argon2id\$v=19\$m=19456,t=2,p=1\$[A-Za-z0-9+/]{43}\$[A-Za-z0-9+/]{43}$/;
// Bound admission and acknowledgements independently. Timeout cannot cancel
// native work; retain its slot until the underlying operation actually settles.
export class Passwords {
  #active = 0;
  private constructor(private readonly dummy: string) {}
  static async create() {
    const dummy = await withDeadline(Bun.password.hash(randomBytes(32).toString('hex'), { algorithm: 'argon2id', memoryCost: 19456, timeCost: 2 }), 2000);
    if (!profile.test(dummy)) throw new AuthUnavailableError();
    return new Passwords(dummy);
  }
  private async run<T>(operation: () => Promise<T>): Promise<T> {
    if (this.#active >= 4) throw new AuthUnavailableError();
    this.#active++;
    const work = Promise.resolve().then(operation).finally(() => { this.#active--; });
    try { return await withDeadline(work, 2000); } catch { throw new AuthUnavailableError(); }
  }
  hash(value: string) {
    return this.run(async () => {
      const hash = await Bun.password.hash(value, { algorithm: 'argon2id', memoryCost: 19456, timeCost: 2 });
      if (!profile.test(hash)) throw new AuthUnavailableError(); return hash;
    });
  }
  verify(value: string, stored: string | null) {
    // Corrupt/unreviewed profiles never request unbounded native resources.
    const usable = stored !== null && profile.test(stored);
    return this.run(async () => await Bun.password.verify(value, usable ? stored! : this.dummy, 'argon2id') && usable);
  }
}
