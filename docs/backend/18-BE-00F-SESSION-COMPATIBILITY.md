# BE-00F — Session infrastructure compatibility and security verification

**Status: verification submitted for human review; not merged, not authentication implementation.** Branch `research/be-00f-session-compatibility`; base `8158cb3d9c3784fe7c623c380d1b2c19938f9d38` (latest fetched main, including merged BE-00E and living status update). Production packages/configuration/API, frontend, fixtures, existing tests, Prisma schema/migrations and BE-00C principal boundary remain unchanged.

## 1. Scope and inspected environment

Read backend 00, 05, 08 and 13–17; inspected actual API bootstrap, runtime connection/configuration/deadline helpers, installed physical Nest adapter dependencies, architecture/lint/typecheck rules and integration tests. [BE-00E](17-BE-00E-AUTH-SESSION-AUTHORIZATION.md) remains the security contract: session identity references never confer tenant permissions; only the owning Tenancy instance mints/accepts VerifiedPrincipal. No permissive verifier or production auth route is introduced.

Measured on Windows with Bun **1.4.2**, Nest core/platform-express **11.2.7**, physical Nest adapter Express **5.2.1**, direct API Express **5.3.0**, existing ioredis **5.11.1**, Docker server **29.7.2**, and authenticated Valkey **8.1.3**. The harness queries `INFO server` and asserts the Valkey version. It uses the same digest-pinned image as development Compose, in its own disposable container, without volumes or persistence. Existing runtime connections disable offline queues, bound non-worker commands and use explicit cleanup; production configuration requires Valkey TLS. The harness's Valkey transport is loopback plaintext, **not production TLS certification**.

## 2. Candidate comparison and recommendation

All experimental dependencies are installed under `.git/be-00f/candidates`, outside production workspaces. `candidates.json` and `candidates.lock` pin exact packages/integrity for reproducibility; root manifests and `bun.lock` are unchanged. Installation disables package scripts. Upstream registry/source research was performed on 2026-10-10.

| Candidate | Exact tested packages | Runtime and operational findings | Decision |
|---|---|---|---|
| A | express-session 1.19.0 + connect-redis 8.1.0 + existing ioredis 5.11.1 | Actual Nest/Bun/Valkey flows work; ioredis command timeout bounds blocked read. No additional Redis client. Reconnecting-client terminal cleanup is not consistently confirmed; older adapter branch retains the normalization shim | Alternative only after cleanup/support review; not preferred |
| B | express-session 1.19.0 + connect-redis 10.0.0 + redis 6.3.0 | Actual Nest/Bun/Valkey flows work; offline queue disabled, restart recovery and direct destroy cleanup pass. Configured command timeout did not bound an already-written blocked read; the independent callback wrapper returns 503 | **Recommend for a future reviewed integration, with mandatory bounded Store wrapper and PostgreSQL fences** |
| C | Custom Store on existing ioredis | Not implemented or runtime-tested. Avoids a second client but requires owning serialization, TTL, callbacks, reconnect and maintenance; does not remove the existing cleanup issue or replace durable fences | No demonstrated need to build a competing persistence adapter |

The modern candidate is 10.0.0, rather than assuming BE-00E's researched 9.0.0 was still newest. [v9 release](https://github.com/tj/connect-redis/releases/tag/v9.0.0) removed ioredis support. [v10 manifest](https://raw.githubusercontent.com/tj/connect-redis/v10.0.0/package.json) requires redis >=5, express-session >=1 and Node >=22; [v8.1 manifest](https://raw.githubusercontent.com/tj/connect-redis/v8.1.0/package.json) retains its ioredis test dependency. The harness passes an actual ioredis instance into v10 and proves the incompatible SET invocation rejects; no cast is treated as compatibility.

[ioredis upstream](https://github.com/redis/ioredis) describes best-effort maintenance and recommends node-redis for new projects. This supports B's maintenance direction, not a guarantee of vendor Bun/Valkey support: Bun is outside the declared Node engine contract and [node-redis](https://github.com/redis/node-redis) primarily documents Redis support. Runtime evidence here is bounded to this host/version. B adds redis and its @redis/client/bloom/json/search/time-series family; ioredis remains needed by the existing queue infrastructure. No package is added to the production dependency graph. An isolated `bun audit --json` returned `{}` (zero reported advisories); that registry snapshot is not a full supply-chain or support certification.

## 3. Reproducible harness

From a normal installed Git checkout with Bun, Docker and OpenSSL (Git for Windows includes it):

```powershell
bun scripts/backend/session-compatibility/setup.mjs
bun scripts/backend/session-compatibility/run.mjs
# Independent recommended-candidate verification:
bun scripts/backend/session-compatibility/run.mjs --candidate=B
```

Set `BE00F_OPENSSL` to an explicit executable if needed. This harness currently expects a directory `.git`, not a worktree `.git` pointer. Setup has a 30s installation bound; fixture commands have a 30s bound; checks have 12s outer bounds; client/store/HTTP operations have explicit shorter bounds. These are isolated harness bounds, not changes to existing regression deadlines. Missing prerequisites fail; no tests silently skip. Each named check executes real assertions and emits only its label, outcome, duration and allowlisted synthetic evidence, never arbitrary exception values/stacks, session IDs, cookies, tokens or connection URLs.

`fixtures.mjs` resolves Nest/reflect metadata from the API's installed dependencies and existing ioredis from backend-runtime. It creates a separate empty Nest module with the actual default Express adapter. Synthetic GET endpoints deliberately exercise middleware without importing/registering the production AppModule; they are **not** proposed product contracts, login endpoints or CSRF exemptions. Generated random signing keys and synthetic identity booleans are test-only; no User/Identity rows, credentials or real principals are created. Explicit store instances are always supplied; MemoryStore is never constructed or used as fallback.

The Docker fixture owns one random container/password and dedicated key prefixes; it publishes only a selected loopback port, stops/restarts only that container and removes it on completion. No FLUSHDB/FLUSHALL, production namespace, existing queue cleanup or retained-volume deletion is used. A briefly reserved port has the normal release-to-Docker bind race: collision fails setup rather than using another service. Local package cache, generated test TLS material and raw results stay under `.git/be-00f`; sanitized committed snapshots are linked below. The fixture is disposable infrastructure, not HA or durability evidence.

## 4. Matrix and measured evidence

The full final comparison contains **50 passed observation checks / 1 failed check**; it exits 1. A: 23 pass / 1 fail; B: 25 pass / 0 fail; independent Valkey primitive and container removal: 2 pass. See [comparison evidence](evidence/BE-00F-session-comparison.json). A passing *characterization* check can demonstrate a security defect; it does not certify that defect acceptable. In particular B's stock blocked-read check records `securityDeadlinePassed:false`, and both candidates record stale authority resurrection.

The separate B rerun has **27 passed checks / 0 failed, exit 0** (25 candidate checks plus the Valkey primitive and fixture removal). [Selected evidence](evidence/BE-00F-session-selected.json) records it independently. Detailed per-check durations and outcomes are in the snapshots; no full production authentication pass is asserted.

| Area | Demonstrated result / exact boundary |
|---|---|
| Uninitialized state | No cookie and no store key with saveUninitialized:false |
| Anonymous bootstrap | Explicit synthetic anonymous state persists; later simulated identity regenerates SID |
| Retrieval/regeneration | Separate HTTP requests retrieve saved state; old cookie rejected after sequential regeneration; no real identity/principal integration |
| Explicit save | Holding the actual set callback prevents HTTP completion; releasing it permits 200 |
| resave:false | Unmodified read does not call set; middleware may touch TTL |
| Idle/TTL/touch | Explicit 2s fixture maxAge, positive bounded store TTL, real key expiry and cookie rejection; touch renews expiry and does not recreate a missing key |
| Absolute lifetime | Fixture-only application clock enforces a 3s absolute deadline; renewal is clamped to positive maxAge <=1.5s remaining. Stock adapter does not enforce absolute lifetime |
| Multiple sessions | Deleting one session leaves another; concurrent get/set/touch operations complete |
| Signing | Previous key accepted during explicit rotation; removal rejects the old signed cookie. Missing/malformed/tampered cookies never grant synthetic authority |
| Store errors | Injected read, write/save and regeneration-destroy callback failures produce generic 503, not successful identity response or anonymous downgrade |
| Outage/restart | Real container stop causes authenticated-like reads to return 503; restart reconnects; intentionally lost state returns 401 without memory authority |
| Startup unavailable | Connection rejects within harness bound; unsuccessful clients are explicitly disconnected/destroyed |
| Blocked operations | Real CLIENT PAUSE 1200ms, configured client deadline 750ms: A 503 at 758ms; stock B 200 at 1262ms. B's native option alone is insufficient |
| Deadline wrapper | Test-only Store delegation bounds get/set/touch/destroy callbacks; real paused read returns 503 for both candidates. No cancellation or durable write revocation proof |
| Direct shutdown | Nest listeners close. B client destruction completes. A after restart/startup-outage sequencing can remain `reconnecting` before/after disconnect; terminal end event not observed within 2500ms |

Development runs found and corrected harness mistakes: intercepting a second save callback prevented completion, and initially letting Docker choose a new ephemeral port invalidated restart reconnect assumptions. Cookie maxAge assertions use the required positive upper bound because express-session computes expiry from successive wall-clock reads; exact millisecond equality is not the security contract. No production change or unrelated test timeout increase was used. Repeated comparison runs exposed A's cleanup result intermittently passing and failing; final evidence retains the failure rather than treating it as harmless.

## 5. Cookie and HTTPS proxy verification

Development uses loopback HTTP with `unblok.sid.dev`, HttpOnly, Lax, Path `/`, Domain omitted and Secure false. Production-profile fixture uses `__Host-unblok.sid`, HttpOnly, Secure, Lax, Path `/`, Domain omitted and explicit expiry/maxAge. Attributes are asserted on actual responses; **no browser cookie acceptance/storage certification** is inferred from a header assertion.

The HTTPS client verifies the generated local certificate using its explicitly supplied CA; TLS verification is never globally disabled. A real HTTPS proxy terminates TLS and connects from a separate loopback address `127.0.0.2`, the sole trusted ingress. It overwrites forwarded protocol/host, never forwards the client's spoofed protocol. HTTPS cookie issuance and subsequent retrieval succeed. Direct HTTP with forged X-Forwarded-Proto receives 403 and no cookie; disabling proxy trust also rejects the HTTPS-proxy upstream as insecure. This demonstrates the need for correct trust/protocol handling, not approval of production CIDRs, DNS, ingress networking or a general Origin allowlist.

CSRF/origin/login/bootstrap policy stays in BE-00E: independently validated token plus exact deployment Origin for mutations; strict missing/null behavior and reviewed bootstrap exception. The compatibility endpoints do not implement or certify that policy, CORS, WebSockets, rate limiting, credential hashing or frontend flows. Production HTTPS edge and rediss certificate/ACL testing remain acceptance gates.

## 6. Concurrency, revocation and exact limits

Both adapters allow unconditional delayed SET to recreate a destroyed or expired record. More strongly, the harness pauses a real HTTP renewal SET, performs competing simulated rotation/destruction, confirms the predecessor key is gone, then releases the stale renewal: the old cookie again receives synthetic-authorized 200. Sequential regeneration alone therefore does **not** prove revocation. This is stock store behavior on both combinations, not a new production regression.

Independent Valkey Lua CAS reads an epoch/generation fence and writes only on exact match; eight concurrent stale writes reject after fence advance, and missing fence also rejects. This demonstrates **Valkey-local atomic feasibility only**. Losing/restoring the cache/fence together can restore stale state. No PostgreSQL auth schema, primary epoch query, family row lock or Tenancy evidence adaptation exists in this phase; logout-all is represented only by changing synthetic epoch/generation, not certified as a durable feature.

BE-00E's durable PostgreSQL user epoch and session-family generation/SID-digest/status/deadline remain mandatory. Every request needs live Valkey state plus primary database validation, without positive cache/replica fallback; every protected write needs the reviewed database-owned fence check and conflict locks in its transaction. Only that future integration can prove commit ordering against revocation. A valid previously minted principal is not automatically revoked by today's Tenancy implementation. Do not forge/serialize principals, distribute raw Database, or claim immediate cancellation of earlier reads/responses.

The bounded callback wrapper is a **test-only error-boundary demonstration**, not an approved production wrapper. node-redis 6.3.0's installed `commandsToWrite()` removes timeout/abort listeners when moving commands to its in-flight reply queue, consistent with the observed blocked reply escaping the timeout ([tagged source](https://github.com/redis/node-redis/blob/redis%406.3.0/packages/client/lib/client/commands-queue.ts)). A timer rejects HTTP processing but cannot undo an already-sent write, and late callbacks are ignored. Future wrapper review must cover every save/touch/response-finalization path, callback-once semantics, reconnect/late writes, absolute/idle enforcement, generation CAS and durable fences. Logout acknowledgement remains tied to PostgreSQL commit, not cache deletion or a response timeout.

## 7. Final engineering gates and existing reliability

| Gate | Result |
|---|---|
| `bun run typecheck:backend` (includes architecture scan) | Passed; 321 source files, 909 resolved edges, zero violations; existing type-only backlink preserved |
| `bun run test:backend` | 81 pass / 0 fail, 152 assertions, 8.39s; includes all 45 architecture tests |
| `bun run lint:backend` | Passed, including new JavaScript harness |
| `bun run build:backend` | API and worker passed |
| `bun run test:backend:integration` | 2 pass / 0 fail, 5 assertions, 24.05s, existing PostgreSQL/Valkey tests |
| Full compatibility comparison | 50 pass / 1 fail, exit 1; A reconnect cleanup unresolved, B stock deadline defect characterized explicitly |
| Independent B run | 27 pass / 0 fail, exit 0; observation passes include demonstrated unsafe stock behavior, not a blanket security approval |
| Isolated frozen install / registry audit | Passed / zero reported advisories at query time |
| Relative documentation links / `git diff --check` | Passed |

New harness files are JavaScript: lint and executable assertions cover them; existing backend TypeScript checks do not statically typecheck `.mjs`. The test loader resolves installed API dependencies at runtime; the architecture scan includes these files but is not a semantic analysis of that loader. No production file imports the harness. No existing assertion, architecture rule or deadline changed.

The existing queue completion timeout/late error and Windows Bun SIGTERM 143 remain known baseline issues ([living tracker](16-BACKEND-STATUS-AND-ROADMAP.md)). They are not exercised/reclassified by this isolated test. Three NEXUS failures remain; frontend, full infrastructure/lifecycle and tenant-schema recertification were not rerun because those paths are unchanged. Direct fixture shutdown is independent evidence, **not proof of signal-driven API/worker shutdown**. Relevant existing integration services were started and stopped afterward with volumes retained; final disposable container removal passed. A's reconnect/end-event problem is a separate session-candidate finding, not assumed to share the SIGTERM root cause.

## 8. Acceptance, approvals and next slice

Recommend B as the adapter/client direction for human review, **not unwrapped stock B for production use**. It has measured runtime compatibility and a demonstrated bounded callback path, but production suitability remains conditional on the following acceptance criteria:

1. Approve pinned version/support/dependency footprint and audited wrapper behavior, including late persistence after timeout; real deployment TLS/ACL/proxy/browser tests and outage/recovery matrix must pass.
2. Approve and implement additive PostgreSQL epochs/family fences and named database interfaces. Prove stale-cache restore rejection, logout-all/reset linearization, concurrent write ordering and already-minted principal revocation with real PostgreSQL tests.
3. Preserve the unforgeable same-instance VerifiedPrincipal contract with the private session-backed verifier and explicitly reviewed boundary/error adaptation; no client identity fields or second internal token by default.
4. Approve production topology, cookie lifetimes, missing-Origin compatibility decisions, credential lifecycle and resource policies. CSRF/origin/CORS/WebSocket and abuse controls require independent executable certification.
5. Resolve shutdown/cleanup reliability, production persistence/HA/backup recovery, load/capacity and the existing baseline blockers before launch. No immediate revocation, vendor Bun support, HA or capacity guarantee is inferred here.

The next proposed phase is a separately authorized narrow database auth-fence/trust-boundary integration and its adversarial/concurrency tests, followed only after approval by the bounded session/CSRF/identity feature slice. No next phase is begun. The living tracker is unchanged; BE-00F is not marked merged and authentication remains unimplemented. **Stop at human review; do not merge or enable authentication.**
