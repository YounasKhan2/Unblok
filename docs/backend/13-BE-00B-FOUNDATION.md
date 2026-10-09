# BE-00B backend foundation

## Audit and scope

Base: `origin/main` at `82bdf8e6c6ef6a71387af5d1a23bb93c7a64f9d5`. Reviewed BE-00A documents 00–11, BE-01A monorepo relocation (12), actual Bun manifests/lockfile, mock-backed auth/workspace adapters, and ProjectContext's NEXUS/browser-storage boundary. No separate backend implementation master plan exists in this checkout.

The existing stack decisions remain authoritative: NestJS modular monolith, PostgreSQL/Prisma, Valkey/BullMQ, RustFS/S3, Mailpit, REST versioning and independent worker. One phase-label contradiction is explicit: the older draft roadmap called implementation **BE-01** and **BE-00B** docs first; this user-authorized implementation scope calls the foundation **BE-00B**. The scope instruction supersedes that naming/approval hold. No product contracts, full domain schema, authentication system, WebSocket gateway, frontend integration, or mock removal is authorized here. The draft architecture's unresolved domain decisions stay unresolved.

No frontend source, manifest, demo data, or behavior was changed. Its providers and local-storage adapters remain the current source of business records. Server-only packages never enter the frontend import graph. No GitHub Actions or production deployment is added.

## Package and runtime boundaries

- `apps/api`: Bun/NestJS bootstrap, health module, schema validation, error normalization, security and lifecycle. Explicit injection tokens support Bun's decorators without inferred metadata.
- `apps/worker`: independent queue bootstrap and strict, side-effect-free diagnostic handler.
- `packages/contracts`: neutral Zod schemas/public types only.
- `packages/backend-runtime`: server-only configuration, safe logging, queue clients, shutdown/deadline helpers.
- `packages/database`: server-only Prisma lifecycle and version-controlled schema/migration.

Bun is pinned to 1.4.2 (the existing lockfile format requires a sufficiently new release). Backend tooling uses TypeScript 5.9.3, supported by ESLint/typescript-eslint, without changing the frontend's TypeScript 7 dependency. Root `tsconfig.json` enables the legacy decorators NestJS needs; backend typechecking uses `tsconfig.backend.json`. Bun builds emit entry points with external workspace/runtime dependencies: use these builds inside the installed workspace under Bun; they are not self-contained deployment artifacts.

## Startup and verification

Install Bun 1.4.2, then run from the repository root:

```sh
bun install --frozen-lockfile
bun run init:local
bun run infra:config
bun run infra:up
bun run db:generate
bun run db:migrate
bun run typecheck:backend
bun run lint:backend
bun run test:backend
bun run build:backend
bun run test:backend:infra
bun run test:backend:integration
bun run test:backend:lifecycle
bun run lint:web
bun run test:web
bun run build:web
```

Run `bun run dev:api` and `bun run dev:worker` in separate terminals. The default API listener is loopback port 4000. `curl -fsS http://127.0.0.1:4000/live` returns `{"status":"ok"}`; `/ready` returns `{"status":"ready"}` only with a migrated database and authenticated Valkey. Versioned equivalents live under `/api/v1`. Readiness fails during draining; liveness stays independent of dependencies. To stop development infrastructure, use `bun run infra:down` (volumes retained).

Local secrets are generated only into ignored `.env` files; examples contain empty requirements and non-secret defaults. Repeated initialization preserves existing files. Engine generation requires verified downloads from `binaries.prisma.sh`; never disable Prisma checksums or TLS checks. GitHub API access is only needed to publish/review the PR, not to run the application. Tests requiring Docker/Prisma are separate commands and fail when those prerequisites are absent; they never silently skip or report zero-test success.

## Security implemented

- Required NODE_ENV and authenticated database/queue URLs; bounded ports, body sizes, retry budgets, concurrency, and shutdown times. Configuration errors name fields without echoing values. Production requires verified PostgreSQL TLS (`sslmode=verify-full`), Valkey TLS (`rediss:`), and HTTPS CORS origins. CA provisioning and deployment TLS remain operator responsibilities.
- Exact CORS origin allowlist; no wildcard, null origin, embedded credentials, suffix matches, or reflected origins. Preflight methods/headers are constrained. Credentialed browser sessions are not enabled in this unauthenticated phase.
- Helmet secure response headers, disabled framework header, untrusted forwarded-IP headers, HTTP request/header timeouts, JSON/form size limits, rejection of unsupported/compressed bodies, and request correlation IDs constrained to 64 safe characters.
- Atomic shared Valkey throttling keyed by hashed socket IP with expiring windows. Store failures return 503, exhaustion returns 429/Retry-After. Health checks bypass throttling so dependency outages cannot break liveness. This is a foundation IP throttle, not comprehensive account/workspace abuse protection; trusted ingress addresses must be reviewed before proxy deployment.
- Structured request logs only include event, request ID, method, status, and duration. They omit raw paths/queries, headers, payloads, job data, configuration, and exception messages. Shared recursive redaction covers sensitive keys and errors. Callers must use known event names and allowlisted metadata; free-text log strings are not a secret-scrubbing mechanism.
- Normalized errors contain only stable code, generic message, and correlation ID; no internal exception response, stack, or parser-input reflection. Strict Zod request pipes and response interceptors reject unknown fields and accidental server fields.
- A global guard denies new handlers by default. Only explicitly marked health methods are public. Future session authentication, CSRF policy, membership checks, and per-resource tenant authorization must replace that guard in a reviewed slice; a browser workspace/role never grants authority.
- Local Compose has authenticated persistence services, loopback-only ports, disabled RustFS console, resource bounds, health checks and digest pins. Development PostgreSQL's bootstrap role is not a production least-privilege/migration-role design.

## Deferred and limitations

No business endpoints, product schema, auth/session system, S3/email adapter, WebSocket gateway, automatic job enqueue, transactional outbox, durable business-job idempotency, standalone deployment image, distributed tracing, load-capacity claim, backup/PITR service, or production HA. Queue deduplication lasts only while IDs are retained; future durable side effects require database-enforced idempotency. The diagnostic job needs no such ledger because it has no side effects.

SIGTERM/SIGINT close the listener/worker and dependencies under a deadline; timeout exits nonzero. Worker active-job draining is supported, but crash recovery for real product jobs is deferred. API connection failure prevents startup; liveness is dependency-independent once the server has started, not a promise to serve while initial setup fails. Readiness uses a timeout around operations, not query cancellation.

## Verification evidence

See the final PR report for the commit SHA and exact final results. During this implementation, the unchanged frontend baseline and final run both report 733 passed / 3 failed (736 tests, 50 files): missing resolved blocker fixture, empty milestone graph, and dependency fan-out 3 exceeding 2. These failures are present on the audited base and are outside the authorized foundation scope. Frontend TypeScript and production build pass; generated bundle asset hashes remained unchanged.
