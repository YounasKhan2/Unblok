# PostgreSQL/Prisma foundation

Prisma 6.19.3 owns `prisma/schema.prisma` and checked-in SQL migrations. BE-00B retains its infrastructure singleton marker; BE-00C adds the [canonical domain and tenancy foundation](../../docs/backend/14-BE-00C-DOMAIN-TENANCY.md). Run `bun run db:generate` and `bun run db:migrate` from the repository root; the scripts load the ignored API environment file.

`Database` owns connect/readiness/disconnect and bounds serializable interactive transactions (2s acquisition, 5s callback). Keep database callbacks free of network calls and other external side effects. Future callers must classify serialization conflicts and implement bounded, explicitly idempotent retries; the wrapper deliberately does not blindly retry writes.

Before every migration: review SQL, inspect migration status, take a database backup appropriate to the environment, and test against a disposable database. Use `prisma migrate deploy` for reviewed migrations; never `db push` or reset in production. Never edit an applied migration's SQL/checksum. Generation does not apply migrations. Deployment does not automatically roll back migrations or guarantee a lock-free rollout.

The first additive migration creates `backend_foundation`, its singleton CHECK constraint, and a marker row. Application readiness rejects a missing marker, including an unmigrated database. Repeat `migrate deploy` is a no-op after successful application. There is no automatic production seed.

Rollback policy: prefer an additive forward repair and roll back the application only after checking schema compatibility. This foundation table can remain when rolling back application code. Do not automatically drop it or remove `_prisma_migrations` entries. If a failed migration must be repaired, investigate database state, back up, apply a reviewed repair, and use Prisma's explicit migration resolution procedure to reconcile its history. A destructive down migration is intentionally absent. Validate backup restoration and old/new application compatibility before future destructive changes.

Use `Tenancy` with a trusted identity verifier and a deny-default authorization policy for scoped resource access. Keep raw `Database.client/transaction` restricted to infrastructure/migration/test code. Run `bun run test:backend:tenancy` for real isolation, constraint, migration replay, and concurrency tests in a fresh disposable database; its test credential needs CREATE DATABASE privileges. Dependency writes remain blocked until the reviewed DAG service phase.
