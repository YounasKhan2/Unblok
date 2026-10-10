import { Prisma, PrismaClient } from '@prisma/client';

export class Database {
  readonly client: PrismaClient;
  constructor(url: string) {
    this.client = new PrismaClient({ datasources: { db: { url } }, log: [] });
  }
  async connect() { await this.client.$connect(); }
  // Production runtime must not own/bypass the durable fence triggers. This is
  // a rejection check, not role provisioning or a complete permission audit.
  async assertRuntimePrivileges() {
    const rows = await this.client.$queryRaw<{ unsafe: boolean }[]>`
      SELECT (r.rolsuper OR r.rolcreatedb OR r.rolcreaterole OR r.rolbypassrls
        OR has_database_privilege(current_user, current_database(), 'CREATE')
        OR EXISTS(SELECT 1 FROM pg_roles elevated WHERE
          (elevated.rolsuper OR elevated.rolcreatedb OR elevated.rolcreaterole OR elevated.rolbypassrls)
          AND pg_has_role(current_user, elevated.oid, 'MEMBER'))
        OR EXISTS(SELECT 1 FROM pg_database d WHERE d.datname = current_database() AND pg_has_role(current_user, d.datdba, 'MEMBER'))
        OR EXISTS(SELECT 1 FROM pg_namespace n WHERE n.nspname !~ '^pg_' AND n.nspname <> 'information_schema'
          AND (has_schema_privilege(current_user, n.oid, 'CREATE') OR pg_has_role(current_user, n.nspowner, 'MEMBER')))
        OR EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'public' AND pg_has_role(current_user, c.relowner, 'MEMBER'))) AS unsafe
      FROM pg_roles r WHERE r.rolname = current_user`;
    if (rows[0]?.unsafe !== false) throw new Error('Unsafe database runtime privileges');
  }
  async ready() { return (await this.client.backendFoundation.findUnique({ where: { id: 1 } })) !== null; }
  async close() { await this.client.$disconnect(); }
  // Keep callbacks small; no remote calls and no implicit retries of side effects.
  transaction<T>(run: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.client.$transaction(run, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 2000, timeout: 5000 });
  }
}

export * from './tenancy';
export { AuthFences, AuthDeniedError, AuthUnavailableError, type SessionEvidence, type SessionVerifier } from './auth-fences';
export { AccountCredentials, type CredentialSnapshot } from './credentials';
