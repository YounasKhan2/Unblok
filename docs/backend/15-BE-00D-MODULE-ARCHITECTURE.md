# BE-00D — Backend architecture and reusable module standards

Base: `66d419e6c058208605f895b74da77ab37995df21` (verified on fetched `origin/main`). Branch: `architecture/be-00d-backend-module-standards`. Status: implementation submitted for human review; no business API/authentication/frontend integration is implemented here.

## 1. Repository-grounded audit and decision precedence

Read backend documents 00–14, the locally present proposed master plan, actual API/worker/shared-package source and manifests, TypeScript/ESLint/build/test configuration, Prisma schema/migration guard definitions, and frontend provider/auth/workspace contracts. [BE-00B](13-BE-00B-FOUNDATION.md) and [BE-00C](14-BE-00C-DOMAIN-TENANCY.md) are the implemented foundation; earlier draft recommendations must not silently replace them.

| Area | Implemented now | Gap/risk for future features |
|---|---|---|
| API | `apps/api/src/{main,app,health,access,security,validation,errors}.ts`; dynamic Nest AppModule, four health routes, explicit injection, global deny-default guard | No feature modules, authenticated requests, session lifecycle, business routes or OpenAPI generation |
| Worker | Separate `main.ts`/`worker.ts`, BullMQ diagnostic handler, strict job validation, bounded retries and graceful drain | No business handlers, durable side-effect idempotency, outbox dispatcher or worker identity policy |
| Contracts | Strict neutral Zod health/error/diagnostic-job schemas and inferred types | No business DTOs or generated frontend client; database projections are not public contracts |
| Runtime | Validated config, safe structured logging/redaction, Valkey/queue and lifecycle helpers | Do not turn infrastructure reuse into a business-service dumping ground |
| Database | Prisma lifecycle; bounded serializable transactions; nine domain tables plus foundation marker; tenant composite relationships; scoped Tenancy | Raw Database remains a privileged infrastructure capability; no RLS or production runtime-role provisioning |
| Tenancy | Opaque instance-owned principal, fresh ACTIVE membership, workspace locks, team membership and exact policy grant, bounded queries/expired handles | No actual IdentityVerifier or approved fine-grained permission policy; default remains denyAll |
| Tests/build | Bun unit/HTTP tests; separate real PostgreSQL, infra and built-process suites; strict TS5 backend, TS7 web, ESLint; external-package Bun builds | Build output needs the installed workspace; passing tests do not certify deployment/scale/HA |
| Frontend | React/Vite feature organization; Auth→Workspace→Project bridge and subsequent providers; mock/localStorage/NEXUS data remains active | Browser roles and workspace selection are not backend authority; preserve UX until a reviewed API slice replaces its adapter |

Current package directions are acyclic: API→runtime/contracts/database; worker→runtime/contracts; runtime→contracts; web stays self-contained and may later consume contracts. Database depends on Prisma, not on API/runtime/domain feature implementations. Database's existing **type-only** `tenancy.ts → index.ts` backlink accompanies the barrel export in the opposite direction; it is not a runtime cycle. Enforcement preserves that exact infrastructure edge and rejects value cycles or new feature type cycles.

Conflicts identified before implementation:

- Earlier drafts describe pre-monorepo `src/` paths, deferred NestJS/Prisma setup, and different phase labels. Implemented `apps/*`/`packages/*` and BE-00B/00C take precedence.
- The locally present, untracked master plan suggests `domain/config/testing` packages and revisits framework choices. Those are proposals, not approved replacements for the existing `contracts/backend-runtime/database` packages. No new shared package is justified by the diagnostic-only application today. The local file and pre-existing `package-lock.json` are left untouched/uncommitted; `bun.lock` remains the tracked frozen-install authority.
- Authentication/provider/account linking, granular permissions, worker service identity, deployment/SLO/RPO/RTO and retention remain unresolved. This phase documents their boundaries without inventing policies.

This document extends the existing index and completed phase records; it does not create an alternative system architecture or replace security/database contracts.

## 2. Retained approved package responsibility matrix

| Owner | Responsibility/public surface | Allowed workspace dependencies | Prohibited ownership |
|---|---|---|---|
| `apps/web` | Existing UI; future DTO consumer | `contracts` only | Runtime/database, Nest/Prisma/server SDKs in browser source; backend authority |
| `apps/api` | HTTP/security composition and feature use cases | `contracts`, `backend-runtime`, scoped `database` | Worker implementation; raw Prisma/business access to Database |
| `apps/worker` | Independent validated job execution/lifecycle | `contracts`, `backend-runtime`; scoped `database` only when a reviewed real handler needs it | API private services/controllers; raw DB/job-payload authority |
| `packages/contracts` | Transport schemas/public types | No other workspace; neutral Zod | Prisma/Nest/Node/server infrastructure and ORM model exposure |
| `packages/backend-runtime` | Configuration, logging, queue, lifecycle | `contracts` | Unrelated business logic, feature modules and database access |
| `packages/database` | Prisma isolation, schema/migrations, scoped persistence | No other workspace | HTTP DTOs, route/controller/service business orchestration |

Import shared packages by their declared **root export**, never sibling relative paths, aliases into private package source, or deep package paths. Named scoped database exports are allowed for application/persistence adapters; namespace/default/dynamic database imports are not. Raw `Database` is currently permitted only inside its package and API `main.ts` composition; existing isolated tests/tooling retain their administrative capability. Any additional production infrastructure exception requires a concrete reviewed change and tests. Frontend manifest devDependencies cannot hide a server workspace dependency.

## 3. Feature-first modular monolith conventions

Create a cohesive capability only when executable work requires it. Future API modules live under `apps/api/src/modules/<feature>`; worker processors under `apps/worker/src/jobs/<feature>`. Proposed capabilities include identity/authentication, workspaces/memberships/invitations, teams, projects, issues/comments/activity, dependency graph, notifications, audit/outbox, and attachments. One capability may own several related entities; do not create a module/repository/service for every noun.

Illustrative future Issue layout — **documentation, not files created or routes registered**:

```text
apps/api/src/modules/issues/
  index.ts                       # explicit named public exports only
  issues.module.ts               # explicit Nest provider/controller composition
  transport/
    issues.controller.ts         # validate, delegate, map public response/errors
    issue-response.ts            # explicit projection → public DTO mapping
  application/
    read-issue.ts                # one focused request/use case
    rename-issue.ts              # only when an actual reviewed mutation needs it
  domain/
    issue-rules.ts               # pure invariants/policy facts, no Nest/Prisma
  persistence/
    issue-reader.ts              # only if it adds value beyond TenantQueries.issue
  infrastructure/
    attachment-storage.ts        # only when a concrete external adapter is needed
  tests/                         # relevant unit/contract tests; DB tests stay isolated
```

Omit unused layers/files. The existing scoped query may be sufficient without an Issue repository. Never introduce generic base repositories, empty interfaces, inheritance frameworks, speculative microservices or automatic CRUD generation.

| Construct | Use when | Keep out |
|---|---|---|
| Nest module | Register an actual cohesive capability and explicit tokens/providers | Domain algorithms and raw DB authority |
| Controller | Handle versioned transport, strict DTO validation, use-case dispatch, response/error translation | Direct persistence, transactions, authorization decisions from request roles |
| Application use case | Orchestrate one operation, verified principal/scope, transaction and business failure | HTTP Request/Response, controller calls, unbounded side effects |
| Domain policy/rule | Express pure invariants and already-approved permission facts | Nest, ORM, HTTP DTOs, external I/O, invented role grants |
| Persistence adapter | Encapsulate a concrete query/projection through TenantQueries when reuse warrants it | Raw delegates/transactions, generic repository abstraction, DB rows as public DTOs |
| DTO/contract | Specify reviewed request/response or versioned job data | Database models, internal contexts/principals, secrets |
| Infrastructure adapter | Isolate a concrete SDK/email/storage/queue concern behind a small port | Cross-feature private imports or unrelated shared business logic |
| Tests | Verify rules/use cases/contracts/real constraints with explicit boundaries | Production routing of fake authentication, seed fallbacks or bypass policies |

Nest providers use explicit injection tokens as the existing foundation does; do not assume Bun emits inferred decorator type metadata. Compose Tenancy with an actual verified identity boundary and reviewed policy in the server composition root when that phase is authorized. Business services never receive Database. An API process singleton principal registry must match the Tenancy instance performing the operation.

## 4. Allowed/prohibited feature dependencies

- Same-feature transport→application; application→domain and scoped persistence/adapters. Application cannot import transport; persistence cannot import application/transport. Pure domain imports stay within its own domain.
- Another feature is reachable only through its explicit `index.ts` facade. Named exports reveal the intentionally supported use cases/types; wildcard facades are rejected. Never export a raw database capability as a facade. Prefer one orchestration owner over reciprocal feature imports.
- Worker must not import API use cases. Cross-process envelopes belong in contracts; genuinely shared server logic can receive a separately reviewed architectural home only after a concrete second consumer exists. Do not duplicate business orchestration or create a new shared framework in anticipation.
- New root-level backend services, computed loaders, absolute/URL module paths, production test imports, process-entrypoint imports, and backend production cycles (including type edges) are rejected. The existing foundation files are retained rather than relocated for appearance.

## 5. Reusable implementation patterns

### HTTP/API

Use `/api/v1` for future business routes; the existing root/versioned health routes remain unchanged. Reuse `SchemaPipe` with strict Zod schemas that reject unknown fields and bound IDs/strings/page sizes. Reuse `ResponseSchemaInterceptor` to validate explicitly mapped DTOs; never spread an ORM row/internal context into a response. Map expected scoped/business failures at the transport boundary into reviewed HTTP exceptions, then reuse `ErrorFilter`/`normalizeError` and correlation IDs. A future inaccessible Issue response should be generic and not distinguish foreign existence; stale version/serialization conflicts need operation-specific 409/retry semantics. Today the API does **not** translate TenantAccessError itself because no handler consumes Tenancy.

Authentication is not PublicHealth. Keep FoundationAccessGuard denying new routes until reviewed real authentication/authorization replaces it. Root metadata is health-only. Maintain current CORS/body/timeout/throttle/logging controls; never log assertions, tokens, raw Prisma errors, payloads, secret-bearing paths or job bodies.

Public request/response contracts must be reviewed before frontend integration. Generate/validate versioned OpenAPI from the same approved schemas rather than maintaining a competing type source; the generator/client tooling choice and business schemas remain deferred. No Swagger/OpenAPI implementation is claimed here.

### Application/domain

A use case accepts an opaque VerifiedPrincipal, validated workspace selector and reviewed command/query. It owns **one** Tenancy read/write boundary for the complete atomic operation; adapters use the provided scoped handle instead of opening nested transactions. Validate pure rules before/inside the transaction as needed, recheck authoritative facts inside it, return explicit failures and map them without leaking resource existence.

Domain policy gets minimal domain facts from a server-owned adapter. Do not couple pure rules to database WorkspaceContext/Prisma enums or HTTP schemas. Identity and permission matrices remain deny-default until reviewed; no ADMIN team-ownership bypass is inferred.

Writes compare expected positive versions; sequence allocation is atomic and must share the transaction with future creation. No mutation idempotency framework is added. A later create/invite/upload side-effect operation needs a durable workspace/actor/operation-bound key, payload conflict semantics and retention policy. Serialization retries replay only a bounded complete operation proven idempotent; no retry of arbitrary external side effects.

### Persistence/performance

Reuse Tenancy.read/write and TenantQueries. A workspace ID selects a tenant; it never grants access. Membership is freshly loaded, active team ownership checked and a policy must return exact `true`. Handles are frozen, callback-limited and expose no Prisma delegate. Scope reads carry composite workspace keys and active ancestor filters; archived workspaces remain readable through policy and never writable.

Reuse the current 1–100 issue-list bound, tenant/project-bound cursor and deterministic `(createdAt,id)` ordering. Map internal IssueProjection explicitly; it is not a public API contract. Future query additions require reviewed indexes/projections, N+1 and plan measurements, pagination and the same scoped boundary. Current workspace-exclusive write locking and transaction/SQL limits are conservative correctness controls, not a capacity claim. No remote I/O in scoped callbacks/policies; do not extend Tenancy by handing out raw transactions.

### Background processing

Keep independent worker startup, drain and strict versioned payload parsing. Invalid job/name/payload is unrecoverable; transient failures use bounded retry/backoff with safe diagnostics. Existing diagnostic job defaults are three attempts/exponential 1s, with bounded retention; retained BullMQ IDs are not durable business idempotency and failed-job retention is not a separate dead-letter system.

Future durable side effects require atomic mutation+outbox, at-least-once dispatch, consumer dedupe persisted with effect state, bounded retries, replay and operator failure recovery. Payload workspace/user/resource IDs are selectors, never authority; reload current authorization and tenant ownership at execution, including revocation/archival. No authenticated principal can be serialized/recreated as a plain object. A trusted worker identity/policy mechanism has **not** been approved/implemented; real business jobs must wait for that reviewed decision. Transactional outbox tables/dispatchers, storage/email adapters and business job handlers remain unimplemented.

## 6. Security and tenancy invariants

Preserve BE-00C: global users have no workspace role; provider/subject identity is opaque; ACTIVE memberships and explicit team relationships govern access; ADMIN is not universal ownership; OBSERVER/read scopes cannot write; suspended/invited/foreign membership fails closed. The last active ADMIN, immutable ownership/key/sequence, restrictive deletes, historical assignees, active-parent restores and archival rules remain enforced by the existing scoped boundary and SQL guards.

Dependency INSERT/UPDATE/DELETE remains blocked by its SQL gate. No architecture exception, environment variable, helper or job may open it. A later reviewed DAG service/migration must hold the graph lock through endpoint authorization/reachability/insertion and concurrent opposing-edge/completion tests. Raw database administration, RLS/runtime-role provisioning, purge/retention and backups remain separate privileged/operational concerns, not bypasses for business code.

## 7. Reference Issue request lifecycle (future, not implemented)

Proposed example: read one Issue under an explicitly selected workspace. This is not a registered endpoint or final DTO design.

```mermaid
flowchart LR
  H[Future versioned HTTP request] --> V[Strict route/query validation]
  V --> A[Reviewed real authentication]
  A --> P[Tenancy-owned VerifiedPrincipal]
  P --> U[ReadIssue application use case]
  U --> T[Tenancy.read workspace scope]
  T --> M[Fresh membership and workspace lock]
  M --> Q[TenantQueries.issue]
  Q --> R[Composite lookup + active parents + team + exact policy grant]
  R --> D[Internal IssueProjection]
  D --> O[Explicit public DTO mapping + response schema]
```

The use case passes the **same-instance** verified principal and validated workspace UUID to `tenancy.read(principal, workspaceId, queries => queries.issue(issueId))`. The helper loads server membership, applies team/resource policy and returns only its narrow projection. Mapping happens without returning the context/handle/ORM client. On callback completion the handle expires. Forged roles/principals, foreign or inactive membership, missing/archived resources and expired handles remain generic failures. Application/pure domain rules must not create a broad allow policy to make the example work.

For a future rename, `Tenancy.write` and `compareAndSetIssueTitle` preserve scope and expected-version updates; no controller-side transaction or external call belongs inside that callback. The existing allocator does not imply that a create-Issue workflow is implemented.

Currently step A is absent and FoundationAccessGuard denies business handlers. Test source fixtures are parsed only; no fake Issue controller is executed, registered, or exempted from security.

## 8. Implemented architecture enforcement

`scripts/backend/architecture.ts` performs read-only TypeScript AST import/export analysis, actual tsconfig alias/relative resolution and declared Bun workspace export resolution. It inspects source under apps/packages and backend tooling (excluding generated/dependency/build files), including static imports/reexports, type references, literal dynamic imports and CommonJS loads. It checks manifest workspace directions as well as source paths, so aliased/relative imports cannot hide the dependency.

Enforced rules: package/transport isolation; root package entries; bounded shared-runtime ownership; feature-first layers and named facades; private cross-feature imports; controller/persistence separation; named scoped database exports; Prisma/raw SQL isolation; process/test/fixture/computed/absolute-load exclusions; backend production cycles; and PublicHealth restricted to existing live/ready method patterns and access-owned metadata. The exact BE-00C type backlink is reported, not silently waived. Existing API readiness's Resources port, raw bootstrap Database and disposable test administration remain legal.

Commands: `bun run check:architecture` and `bun run test:backend:architecture`. Architecture runs before every existing backend typecheck; its negative fixtures join `bun run test:backend`. No new dependency, package framework, production module or CI/deployment system is added.

These are structural guardrails, **not a security verifier**. They cannot prove a cryptographic verifier, policy matrix, callback purity, transaction correctness, permission revocation or worker side-effect idempotency. Dynamic code/eval, computed property aliases, dependency behavior and semantic business logic need runtime tests/review. External dependency internals and existing frontend internal cycles are outside this backend graph; browser/package boundary violations remain checked. New unknown packages/shared responsibilities require reviewed rule updates, never ad-hoc bypass comments.

## 9. Testing strategy and verification

Architecture mutation fixtures are isolated temporary source repositories, not runtime feature implementations. Positive tests preserve scoped imports, foundation health and existing raw infrastructure. Negative tests cover browser bare/relative/alias/dynamic/CommonJS imports, manifest hiding, unsafe contracts, private facades/type cycles, domain/layer violations, controller/raw DB/worker bypass, public-health misuse, bootstrap/test leakage and computed/absolute imports. Existing HTTP guard and real PostgreSQL principal/scope/concurrency tests remain authoritative for behavior.

For future features: pure-rule unit tests; application tests with explicit narrow ports; DTO/HTTP contract tests that retain deny-default and generic error behavior; real PostgreSQL two-tenant collisions, revocation/archival/forgery and transactional concurrency tests; independently authorized/idempotent worker tests when jobs exist. Never replace real tenancy tests with mocks or zero-test skips.

Verification on Windows with Bun 1.4.2 and the fetched BE-00C base:

| Command | Actual final result |
|---|---|
| `bun install --frozen-lockfile` | Passed; tracked dependency versions and `bun.lock` unchanged |
| `bun run db:generate` | Passed, Prisma 6.19.3 client |
| `bun run infra:config`, `bun run infra:up` | Passed; four local services healthy |
| `bun run db:migrate` | Passed; all three existing committed migrations applied to fresh local development storage |
| `bun run typecheck:backend` | Passed, including architecture: 316 source files, 909 resolved internal edges, zero violations; explicit BE-00C type-only backlink reported |
| `bun run lint:backend` | Passed |
| `bun run build:backend` | Passed for API and worker |
| `bun run test:backend` | 72 passed, zero failed, 143 assertions; 36 existing foundation tests plus 36 architecture tests |
| `bun run test:backend:architecture` | 36 passed, zero failed, 42 assertions |
| `bun run test:backend:integration` | 2 passed, zero failed, 5 assertions, real PostgreSQL/Valkey |
| `bun run test:backend:tenancy` | 34 passed, zero failed, 129 assertions, real PostgreSQL including concurrency/migration regressions |
| `bun run test:backend:infra` | **4 passed, 1 failed**, plus one reported between-test error; identical result on repeat. Unsupported-job finish notification exceeds the existing 5-second deadline. PostgreSQL, Valkey/throttle, diagnostic deduplication, RustFS/Mailpit checks pass |
| `bun run test:backend:lifecycle` | **1 passed, 2 failed**, identical result on repeat. Built API/worker reach readiness, but `child.kill('SIGTERM')` yields 143 rather than expected 0 on this Windows host. Credential-failure/redaction check passes |
| `bun run lint:web` | Passed |
| `bun run test:web` | **733 passed, 3 failed**, 50 files; unchanged documented NEXUS fixture assertions below |
| `bun run build:web` | Passed; existing Vite configuration/chunk-size warnings remain |
| `git diff --check` | Passed |

The three unchanged frontend failures are `nexusEnterprise.test.ts` / “has valid entity references, unique IDs, and a directed acyclic dependency graph” (missing resolved blocker), the same file / “populates milestone dependency graphs and cross-team matrix data” (zero nodes vs at least 12), and `nexus/nexusEnterpriseValidation.test.ts` / “preserves five active blocked-work examples while limiting graph fan-in and fan-out” (fan-out 3 vs maximum 2). They match the tracked BE-00B/BE-00C baseline record; no frontend source or expectations changed.

The additional infra/lifecycle failures are **not certified as harmless** and are not reported as passing. Their tests, API/worker/runtime source, dependency lock and infrastructure configuration are byte-for-byte unchanged relative to base. BE-00C's prior record reports these suites passing; this run therefore records a reproducible host/run limitation requiring review, rather than overwriting that history or claiming its cause is proven. No Windows signal workaround, timeout relaxation, fixture change or unrelated production correction is introduced in BE-00D.

A fresh checkout requires Prisma client generation before backend typechecking; an initial pre-generation check reported missing generated enum/Prisma definitions, and the final post-generation check passes. Local ignored environment generation preserves existing files and does not print credentials. PostgreSQL verification uses committed migrations and disposable test databases, never resets a configured existing database. Local test infrastructure is stopped after verification with its volumes retained. Raw logs remain local under `.git/be-00d`; the table records results for review without committing credentials or generated artifacts.

## 10. Deferred decisions and limitations

Unresolved: authentication/session/provider/email linking/CSRF; granular role/action and project grants; worker identity/authorization; final business DTO/OpenAPI/client generator; idempotency key/retention and outbox/audit schema; file scanning/email production adapter; database runtime roles/RLS; narrow-lock scalability; deployment/HA/PITR/RPO/RTO/load targets; retention/purge; realtime/event replay. Approval is required in their respective future phase, not invented here.

No production API/source/schema/migration/security/frontend behavior changes. No seed/mock cleanup, NEXUS edits, network service integration or new business route. Existing frontend fixture failures must remain separately visible. No load capacity, live authentication, business-job security or production deployment is certified by this phase.

## 11. Requirements-to-implementation compliance matrix

| Brief requirement / applicable documents | Implementation/evidence | Deferred/limit |
|---|---|---|
| Mandatory review and approved decisions (00–14) | Audit/precedence/conflicts in §1; existing package responsibilities retained | Local proposed master plan is not substituted for tracked decisions |
| Actual architecture/package/import audit (03,12,13,14) | §1–2 plus resolved source/manifests graph | Proposed modules distinguished from existing health/diagnostic foundation |
| Feature-first conventions, minimal abstractions (02,03) | §3–4, layout/layer/facade guard and mutation tests | Documentation tree only; no empty implementation |
| Enforceable browser/contracts/shared/package boundaries | AST/config/export/manifest rules, source-negative fixtures; existing commands integrated | Structural analysis, not semantic security proof |
| Controllers/scoped persistence/default-deny (04,05,13,14) | Scoped-export/raw SQL/health rules; existing HTTP/real tenancy suites | Authentication and detailed policy not implemented |
| Reusable API/application/domain/persistence patterns (02,06,07) | §5 reuses SchemaPipe, ResponseSchemaInterceptor, ErrorFilter, Tenancy and lifecycle helpers | No broad new helper API, OpenAPI generator or business DTO |
| Independent authorized/idempotent background processing (03,05,06,07,13) | Worker isolation/raw persistence checks and §5 conventions; existing worker/infra tests | Real job authority, durable dedupe/outbox pending |
| Consistent Issue request example | §7 uses actual scoped principal/query contracts and future validated/mapped transport | No endpoint/fake authentication registered |
| Preserve frontend/fixtures/migrations/relationships/gate | Diff freeze; unchanged existing regression suites and migrations | Three existing NEXUS failures reported separately |
| Architecture source of truth/index | This phase record linked from 00-README; B/C invariants referenced, not rewritten | Human review before merge |
| Verification honesty and exact results (08) | §9 final command outcomes, including fresh-client prerequisite | No unavailable check reported passed |
| Subsequent phases, scoped PR/review stop (09) | §12 and final PR report | No BE-00E work/merge |

## 12. Recommendations for subsequent phases

1. Approve these conventions and resolve real identity/principal/session and permission-policy decisions before enabling a business handler or job. Keep the existing guard closed meanwhile.
2. Select one narrow vertical slice; reconcile its frontend callback/DTO/loading/error/ownership ledger before introducing a module. Reuse scope/validation/errors rather than adding parallel infrastructure.
3. Add database-scoped capabilities only with real two-tenant/concurrency evidence. Keep dependency writes gated until its dedicated DAG migration/service review.
4. Introduce outbox/business workers and shared server logic only for concrete durable side effects, with execution-time authority and replay/idempotency decisions. Measure query/lock/load behavior before scaling changes.

Stop at human review; do not merge or begin BE-00E.
