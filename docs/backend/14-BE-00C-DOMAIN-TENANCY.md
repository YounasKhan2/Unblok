# BE-00C domain and tenant foundation

## Pre-implementation documentation review and checklist

Base: `origin/main` at `24b21d8510395c6ac772b763b9c54c57a83a969c`. Reviewed every backend document (00–13), the current BE-00B implementation, frontend auth/workspace canonical types and adapters, project creation, team archival, membership/last-admin rules, and dependency cycle/blocker semantics. BE-00B implementation matches its completed phase documentation. The earlier draft phase labels and prototype global `User.role` are historical; canonical auth/workspace types explicitly make roles membership-scoped.

Applicable requirements to implement and test before review:

- [x] Preserve Bun/NestJS/Prisma/PostgreSQL and BE-00B migration; no frontend/API integration or fixtures changed (00, 02, 03, 12, 13).
- [x] Global users/opaque provider identities without global roles; workspace memberships with ADMIN/MEMBER/OBSERVER and ACTIVE/INVITED/SUSPENDED (04; frontend canonical contracts).
- [x] Explicit workspace ownership, team membership, team-owned projects, project-owned issues; tenant composite FKs and restrictive deletion (04, 05, 11).
- [x] Canonical workspace slug and workspace-scoped team/project keys; positive issue sequence/version and atomic sequence conventions (04).
- [x] Archival preserves records, forbids writes, and never implicitly grants team/project ownership; last-active-admin protection (02, 04, 05; frontend lifecycle).
- [x] Dependency foundation rejects self, duplicate, and foreign-tenant links; unrestricted writes unavailable until transactional DAG enforcement (04, 11).
- [x] Server-verified principal, explicit tenant context, freshly validated membership, bounded scoped operations, deny-default policy and generic inaccessible-resource failures (02, 05, 06, 07).
- [x] Additive reviewed migration, fresh setup/replay/schema consistency and real PostgreSQL negative/concurrency tests; no destructive reset (04, 08, 13).
- [x] Document deferred auth/API/RLS decisions, verification results, and compliance matrix (06, 08, 09, 10, 11).

## Material ambiguities identified before schema changes

The docs leave email normalization/account linking, identity providers, detailed per-project grants, soft-delete retention, and fine-grained policy matrices unresolved. This phase does not decide password/session mechanisms or use email as an authentication/unique-account key: identities have opaque provider/subject uniqueness, with no credential/token storage. User email is contact metadata only. No provider enum constrains future authentication choices.

Canonical memberships retain their existing three roles/statuses. Team membership explicitly joins an existing workspace membership; ADMIN does not automatically own every team/project. Policy interfaces deny all access unless a trusted server policy explicitly grants the requested action after resource scope and team membership checks. Project-specific grants are deferred, not represented by an invented ACL or role enum.

Frontend workspace lifecycle explicitly permits read-only archived workspaces. Preserve that rule: active memberships can obtain archived contexts, but all writes fail. Team archival must reject remaining owned projects, consistent with the frontend guard. Hard deletion is restrictive and requires an explicit future purge workflow; no cascade destroys a tenant's business graph. No soft-delete/retention policy is invented.

Dependency DAG mutation is deferred to its service phase. The foundation exposes no dependency-write helper or route. A database trigger rejects direct dependency writes until that later migration installs reviewed lock/reachability enforcement; the service strategy and the limit of privileged database administration must be documented.


## Schema and entity relationships

Global `User` has no role. `Identity` belongs to a global user and uniquely identifies an opaque `(provider, subject)`; contact email may be absent or shared, deliberately deferring login normalization and account-linking rules. No secrets, passwords, sessions, or provider tokens are stored.

`Workspace` has a globally unique canonical lowercase slug and ACTIVE/ARCHIVED status. `WorkspaceMembership` has one row per `(workspace, user)`, with the canonical role and membership status. Tenant-local resources use composite `(workspace_id, id)` primary keys, so identical UUIDs may exist in different tenants and every lookup must carry explicit tenant context. Tests intentionally create colliding team/project/issue/membership UUIDs and keys in two workspaces.

`TeamMembership` joins a team to a valid workspace membership using two composite foreign keys. `Project` belongs to its workspace through its composite FK to the owning team; `Issue` does the same through its owning project. Issue team ownership is derived from the project, avoiding a redundant mutable team field. Creator and optional assignee reference memberships in the same workspace, retaining history after suspension. Assignees must be active when assigned; issue creation requires an active creator. Unchanged historical assignees remain attached after suspension or invitation-status changes and do not block unrelated issue updates. Clearing an assignee is allowed; INSERT assignments and changed non-null assignments require ACTIVE membership.

Team/project keys are uppercase alphanumeric 2–6 characters and unique within a workspace. Team names are case-insensitively unique per workspace to match frontend validation. Workspace slugs have a 63-character storage bound; names use 120, issue titles 300, identity provider 200 and subject 512. These storage limits are explicit foundation choices for review, not claims that future transport DTOs are final. A project's key and an issue's origin/sequence are immutable; future move/rename workflows require reviewed semantics. Issue keys derive from project key + positive per-project sequence. Versions are positive and scoped writes compare expected version atomically.

Deletion uses RESTRICT throughout; nothing cascades away tenant business history. Archive retains rows and identifiers: archived workspace contexts are read-only, archived teams/projects/issues are hidden by ordinary scoped queries, and a team with active owned projects cannot archive. Restoring an active project requires an active team. Restoring an archived issue requires both an active project and its active owning team. Unreferenced records can be deleted in active workspaces; the tenant guard selects OLD for DELETE and NEW for INSERT/UPDATE, and archived workspaces reject each operation. The last ACTIVE ADMIN cannot be deleted, demoted, or suspended. A workspace can initially have zero members during a bootstrap transaction; the future creation service must atomically create its initial ADMIN. Cycles/milestones and their additional archival constraints are deferred because this phase introduces neither model.

## Server-owned context and query conventions

`packages/database/src/tenancy.ts` defines the trusted identity-verifier and authorization-policy interfaces; it does not implement authentication. `Tenancy.authenticate` resolves a verifier-approved provider/subject through PostgreSQL and returns an opaque frozen principal registered in an instance-private WeakMap. Plain objects, request-supplied user IDs/roles, and principals minted by other instances have no authority. Verifier/database failures produce a generic inaccessible-resource error.

`Tenancy.read/write` require an explicit UUID workspace selector, reload membership/role/status from PostgreSQL for every bounded serializable transaction, and acquire workspace locks before membership/resource checks. A selector grants no authority. Missing, invited, suspended, or foreign memberships fail closed. Read scopes acquire a shared workspace lock; write scopes acquire an exclusive lock. Reads may see an archived workspace; writes reject it. Revocation/lifecycle changes use the same workspace locking discipline and cannot race a completed scoped authorization check.

Scoped handles hold transaction/context/policy in ECMAScript private fields, are frozen, and expire when their callback finishes. The callback receives no raw transaction or Prisma delegate. Resource reads and writes use the explicit tenant composite key, active ancestor filters, and a real team-membership join. Every operation additionally requires an exact boolean `true` from the trusted policy; the default denies all. OBSERVER/read-only handles cannot write even under an overly broad policy. ADMIN is not a team/project ownership bypass. A project grant does not implicitly grant every issue: list projections are individually checked.

The bounded issue projection, compare-and-set title primitive, and sequence allocator are server persistence foundations, not business CRUD endpoints or public transport contracts. No routes consume them in this phase; BE-00B's API guard stays unchanged. Public contracts never import database models. Future handlers must use approved DTOs and policy implementations.

Lists cap at 100 records and use deterministic `(created_at, id)` keyset ordering with a tenant/project-bound cursor. Workspace-prefixed indexes support list, assignment, membership, owning-team, role/status, and dependency traversal queries. Project authorization is loaded once per list, avoiding N+1 queries. Transactions retain BE-00B's 2s acquisition/5s callback bounds, with 1.5s SQL lock and 4s statement limits inside scoped operations. No external calls are permitted in transaction callbacks or policy decisions. Retryable transaction conflicts require bounded retries of the complete idempotent operation; the helper does not retry side effects automatically.

The workspace integrity lock conservatively serializes writes within a workspace; this is deliberate foundation correctness, not a scalability achievement. Future services may narrow lock granularity only with concurrency tests preserving archival, revocation, admin, and graph invariants. No cache, RLS, denormalized read model, load target, or production capacity claim is added.

## Dependency DAG safety and future transactional strategy

The edge model has workspace-composite FKs for both issue endpoints and creator, directed uniqueness, and a no-self CHECK. **All edge INSERT/UPDATE/DELETE operations are blocked by a SQL trigger.** No dependency-write helper or business route exists, and no setting/client flag bypasses the gate. Therefore cycles cannot be introduced through the available foundation write paths.

The future dependency service must replace the gate through a reviewed migration, use runtime credentials without DDL/trigger privileges, lock the workspace graph before checking reachability, and revalidate authorization/active membership and both endpoints in the same bounded transaction. For a proposed upstream → downstream edge, a recursive query must reject any existing downstream → upstream path, including all persisted edges rather than only active blockers. Hold the graph lock through insertion; enforce directed uniqueness/self/FKs in PostgreSQL; integrate blocked-completion checks under the same lock order. Concurrent opposing edge additions must result in at most one valid edge, with bounded serialization/deadlock retries. Reachability cannot be checked outside the transaction or against a cache. No exactly-once or complete dependency-service implementation is claimed here.

The disposable integration suite performs **administrative, transaction-local** disabling of only this gate to prove latent self/duplicate/composite-FK constraints. Every such transaction intentionally fails and rolls back its DDL and inserted rows; the suite confirms the gate is restored and ordinary/bulk writes remain rejected. This never modifies an existing database, and is not a runtime escape hatch. Privileged administrators can always disable triggers: production runtime roles must not own tables, bypass controls, or have DDL privileges.

## Migration, rollback, and RLS boundaries

`20261010010000_domain_tenancy` is additive: five enums, nine domain tables, tenant composite constraints/indexes, checks, and integrity/gate functions/triggers. The BE-00B migration is byte-for-byte unchanged. It creates no production users, workspaces, fixtures, or seeds. The local existing database was upgraded using `migrate deploy`; no reset/drop or destructive command was used against it.

The suite creates a uniquely named disposable database, deploys all three migrations from scratch, replays deploy (no pending migrations), and compares the Prisma-visible database schema with the datamodel (no difference). SQL-only checks, expression index, and trigger behavior are verified separately; Prisma's diff does not certify procedural SQL. Only the suite's own disposable database is dropped at cleanup, never the configured existing database. Test credentials require CREATE DATABASE privileges and are not appropriate production runtime credentials.

Before applying elsewhere: back up, inspect `migrate status`, review SQL and locks, and test on a disposable database. Preserve applied migration checksums; never reset, db-push, edit migration history, or auto-drop domain tables to repair an error. Prefer additive forward repair. Rolling back application code may leave these tables intact; BE-00B readiness remains compatible. A destructive down migration/purge workflow is intentionally absent, pending retention and recovery decisions. Rollback application versions only after compatibility checks, and validate backup restoration before future destructive changes.

Tenant read isolation is currently the server-scoped query boundary; composite FKs enforce structural write isolation. The legacy raw `Database.client/transaction` remains a privileged server infrastructure/migration/test capability and can read across tenants. It must not be given to business handlers or clients. PostgreSQL RLS could provide future defense in depth on workspace-owned tables, with transaction-local server-set context, restricted non-owner runtime roles, FORCE RLS where appropriate, and pooled-connection reset/reuse tests. No RLS policy or runtime-role provisioning is implemented or claimed in this phase.

## Documentation compliance matrix

| Applicable source/requirement | Implementation | Automated evidence | Deviation or deferred boundary |
| --- | --- | --- | --- |
| 00, 02, 03, 12, 13: established stack, package boundaries, frontend preservation | Existing Bun/NestJS/Prisma stack; database-only foundation; neutral public contracts unchanged | Frozen install, backend typecheck/lint/build, BE-00B suites, web lint/tests/build, scoped diff | Older draft phase labels remain historical; no frontend migration |
| 04; canonical auth/workspace types: global identity versus workspace authority | User/Identity + unique provider/subject; workspace-only roles/statuses | Identity uniqueness, no user role column, canonical enum/role and forgery tests | Email linking/normalization, auth/session lifecycle deferred |
| 04, 05, 11: explicit ownership and cross-tenant integrity | Composite tenant PK/FKs; team memberships; team-owned projects; project-owned issues and membership references | Colliding UUID/key fixtures, foreign team/project/creator/assignee/join rejection | Fine-grained project ACL and business services deferred |
| 04: scoped unique keys, sequences, optimistic conflicts | Canonical slug/keys, per-project sequence uniqueness, atomic allocator, expected-version update | Duplicate/canonical/positive-value tests, concurrent allocation and rollback, stale update test | Key moves/renames need reviewed workflow |
| 02, 04, 05; lifecycle: safe archive/delete, last admin | Restrictive FKs, archive triggers, last-admin trigger, active ancestor filters | Deletion restrictions, archive/read-only/restore tests, concurrent demotions | Full purge/audit retention and cycles/milestones deferred |
| 02, 05, 06: server-authorized tenant scope; no foreign existence leak | Verified opaque principals, fresh active membership, scoped handles/projections, explicit team+policy grant, generic errors | Forgery/unknown verifier, missing/inactive/foreign membership, foreign reads/writes, OBSERVER, default-deny, expired handle tests | Verifier is an interface; no auth endpoints or RLS claimed |
| 04, 11: no self/duplicate/cross-tenant dependency edges; DAG | Structural FK/CHECK/uniqueness and immutable write gate | Direct/bulk gate tests; isolated latent-constraint inspection and gate restoration | Cycle service deferred with transactional lock/reachability strategy |
| 04, 08, 13: additive safe migration and real DB verification | Preserved foundation and original domain SQL; additive domain and corrective migrations; disposable database harness | Fresh deploy/replay, original two-migration upgrade with retained rows/checksums/timestamps, Prisma-visible schema diff, SQL behavior tests, existing migration readiness | Backup/PITR/restore operations remain deployment requirements |
| 07: scoped indexes, bounded queries/transactions, no speculative cache | Workspace-leading indexes, 1–100 keyset lists, one project lookup, bounded serializable scopes | Bounded/cursor/issue-policy tests, concurrency and revocation tests, lint/typecheck | Coarse workspace write lock; no load/capacity claim |
| 06, 09, 10, 11: preserve migration handoff and phase exclusions | No routes, raw-model public contracts, frontend adapters, auth sessions, jobs, uploads, or UI changes | Diff scope and existing API/worker/frontend regression gates | Consumer API integration ledger belongs to future slices |

## Verification results

- `bun install --frozen-lockfile`: passed; manifests/lockfile dependencies unchanged.
- Backend strict typecheck, ESLint, API/worker builds: passed.
- Prisma schema validation/generation, local additive deploy, migration status and repeat deploy: passed.
- `test:backend:tenancy`: **34 passed, 0 failed** (129 assertions), including fresh database migration replay/schema consistency, structural negatives, IDOR, lifecycle and concurrency.
- Existing BE-00B regressions all passed: `test:backend` 36; integration 2; infrastructure smoke 5; built-process lifecycle 3 (46 total, zero failures).
- Frontend lint/build: passed with unchanged asset hashes and existing build warnings. Tests: **733 passed / 3 failed**, 50 files; the same three documented NEXUS fixture assertions. No fixtures or test expectations changed.
- No required check was replaced by a zero-test run. The new suite requires real PostgreSQL with disposable-database privileges and does not silently skip.

## PR #24 correction review and compliance

Reviewed commit: `07e7b026efe10aa0d995676e0043cb98236f99ad`. Reviewed the PR findings against the implementation and applicable guidance in 00, 02, 04, 05, 08, 13 and this document. No new domain decision, technology change, endpoint, or phase is introduced.

Requirements-to-implementation correction checklist:

- [x] Select operation-valid row references in the tenant guard and retain immutable identity checks on UPDATE.
- [x] Permit legitimate deletion while preserving restrictive FKs, last-admin protection, and archived-workspace rejection.
- [x] Retain unchanged historical assignees; reject new inactive assignments on INSERT and UPDATE.
- [x] Preserve the active project/team requirement for issue restoration.
- [x] Preserve both applied migration files and verify fresh installation plus upgrade from their original SQL.
- [x] Run backend, real PostgreSQL, migration, and unchanged frontend regression gates.

The new `20261010020000_guard_corrections` migration replaces only `guard_tenant_write()` and `guard_issue_write()` inside an explicit PostgreSQL transaction. The original domain migration may already have been applied, so editing its SQL would invalidate recorded checksums and leave deployed databases unrepaired. Both BE-00B and original BE-00C SQL remain byte-for-byte unchanged. No tables, data, enums, constraints, or triggers are dropped or recreated.

The upgrade regression creates a separate disposable database, installs only the original two migrations, seeds domain rows and a subsequently suspended historical assignee, and reproduces the old unrelated-update failure. It then deploys the corrective migration, verifies the update succeeds without losing assignment history or rows, compares the original migration checksums and completion timestamps, replays deploy, and verifies schema consistency. Fresh-install tests independently apply all three migrations. The configured existing database receives only additive deploy; no reset is used.

Rollback remains forward-fix oriented: this correction is compatible with existing callers and BE-00B readiness. Rolling back application code does not require reverting these functions. If a further defect is found, add another reviewed corrective migration rather than reverting to the known broken functions or deleting migration history. The explicit transaction prevents partially replaced guards on failure; investigate state and use Prisma's reviewed failed-migration resolution procedure before retrying.

| Review requirement / source | Implementation | Real PostgreSQL evidence | Deviation |
| --- | --- | --- | --- |
| PR24 tenant DELETE correctness; 04/05 lifecycle integrity | Operation-specific workspace row selection; existing workspace lock and immutable identity guard | Successful deletions and archived-workspace rejection across memberships, teams, team joins, projects, issues; existing FK and final-admin negatives | None |
| PR24 historical assignment; 04 retained relationships | Validate assignee only on INSERT or changed assignment; active creator check retained | Scoped title updates retain SUSPENDED/INVITED historical assignees; unassignment succeeds; inactive INSERT/UPDATE assignments fail | None |
| PR24 issue restoration; 04 active ownership | Active project and owning team check remains on every issue mutation | Restore succeeds with active parents, fails under archived project and archived team, issue remains archived | None |
| PR24 migration history; 04/08/13 additive safety | New transactional function-only migration | Fresh three-migration deploy and replay; original two-migration upgrade; rows, checksums and timestamps preserved; both schema comparisons clean | None |
| PR24 regression gates; 02/08 frontend preservation | No frontend or NEXUS edits | Backend gates pass; web lint/build pass; existing 733 pass / 3 fixture failures remain | Existing fixture failures remain outside this correction |
