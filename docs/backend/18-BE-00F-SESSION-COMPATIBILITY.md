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
bun test scripts/backend/session-compatibility/paths.test.mjs
bun scripts/backend/session-compatibility/cleanup-diagnostics.mjs
```

Set `BE00F_OPENSSL` to an explicit executable if needed. **Supported layout is an ordinary checkout with its own real `.git` directory.** Shared `paths.mjs` validates the canonical checkout root and Git directory before installation, package loading or container creation; worktree/submodule gitfiles, missing Git metadata, and top-level scratch junctions/symlinks or wrong-type output targets fail early. Six executable layout tests cover deterministic normal resolution and rejected layouts/redirects. This is a precondition check, not worktree support or protection against a malicious local writer racing filesystem checks; run under the trusted checkout owner's account. Setup has a 30s installation bound; fixture commands have a 30s bound; checks have 12s outer bounds; client/store/HTTP operations have explicit shorter bounds. These are isolated harness bounds, not changes to existing regression deadlines. Missing prerequisites fail; no tests silently skip. Each named check executes real assertions and emits only its label, outcome, duration and allowlisted synthetic evidence, never arbitrary exception values/stacks, session IDs, cookies, tokens or connection URLs.

`fixtures.mjs` resolves Nest/reflect metadata from the API's installed dependencies and existing ioredis from backend-runtime. It creates a separate empty Nest module with the actual default Express adapter. Synthetic GET endpoints deliberately exercise middleware without importing/registering the production AppModule; they are **not** proposed product contracts, login endpoints or CSRF exemptions. Generated random signing keys and synthetic identity booleans are test-only; no User/Identity rows, credentials or real principals are created. Explicit store instances are always supplied; MemoryStore is never constructed or used as fallback.

The Docker fixture owns one random container/password and dedicated key prefixes; it publishes only a selected loopback port, stops/restarts only that container and removes it on completion. No FLUSHDB/FLUSHALL, production namespace, existing queue cleanup or retained-volume deletion is used. A briefly reserved port has the normal release-to-Docker bind race: collision fails setup rather than using another service. Local package cache, generated test TLS material and raw results stay under `.git/be-00f`; sanitized committed snapshots are linked below. The fixture is disposable infrastructure, not HA or durability evidence.

**Credential-delivery exposure is retained and verified, not fixed by redaction:** `docker run -e BE00F_PASSWORD` stores the password in container environment metadata; the shell expands it into Valkey's `--requirepass` startup argument. Docker-admin/local process inspection can expose disposable credentials, including the diagnostic child's environment. The harness privately inspects its own container and emits booleans only: environment contains the password and startup command expands it. Valkey rewrites its running process title, so absence from later `/proc/1/cmdline` is not proof that startup argv was safe. Container removal/redacted evidence limit exposure but cannot prove erasure from prior inspection/copies. This method is restricted to disposable test credentials; production delivery requires separately reviewed secrets/ACL/configuration handling and is **not certified** by this phase.

## 4. Matrix and measured evidence

The original reviewed comparison contains **50 passed observation checks / 1 failed check**, exit 1; [original comparison](evidence/BE-00F-session-comparison.json) and [original B evidence](evidence/BE-00F-session-selected.json) remain unchanged. Correction results are recorded separately below. A passing *characterization* check can demonstrate a security defect; it does not certify that defect acceptable. In particular B's stock blocked-read check records `securityDeadlinePassed:false`, and both candidates record stale authority resurrection.

The original independent B run has **27 passed checks / 0 failed**, exit 0. Correction runs add credential-exposure characterization and late-write-after-503 assertions. Detailed per-check durations and outcomes are in the separate snapshots; no full production authentication pass is asserted.

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
| Late write after callback timeout | For both candidates, hold a real HTTP renewal SET until its wrapper returns 503; destroy the session, release the held SET, then observe persisted state, one late underlying callback and synthetic-authorized 200 with the old cookie. HTTP failure does not cancel persistence or enforce revocation |
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

The correction's negative HTTP test proves this limitation with real store persistence: 503 arrives before the underlying callback, destruction removes the key, and a late save recreates it. Ignoring the late callback protects response completion only. **Before any production authentication integration/security approval**, require the durable PostgreSQL family fence and current user epoch on every authenticated request and the reviewed transaction fence/locks on every protected write. Reject missing/revoked/mismatched durable evidence even when Valkey has a live resurrected record. Real PostgreSQL tests must cover this exact late-save sequence, already-minted principal reuse, restored snapshots, dependency outages and concurrent revocation/write ordering. Those tests/schema/boundary adaptations are not implemented or certified here.

### Candidate A shutdown diagnosis

Run `bun scripts/backend/session-compatibility/cleanup-diagnostics.mjs`; [diagnostic evidence](evidence/BE-00F-correction-cleanup-diagnostics.json) records ready, already-ended and three independently spawned reconnecting children. The probe kills only its own named client through a second fixture connection, waits for `reconnecting`, then invokes the **unchanged 2500ms** close operation. Event listeners are installed before the interruption. Ready/already-ended cases acknowledge cleanup; all three reconnecting cases fail that acknowledgement after 2505–2506ms, stay in `reconnecting`, and emit no subsequent `end`. Each nevertheless has a destroyed socket, no retry timer, no matching named server connection, no later connect event and natural child exit 0. No process.exit shortcut or forced exit is used for successful probes. These observations distinguish a stale event/state acknowledgement from observed live connection/timer leakage in this controlled case; they do not certify every shutdown state or signal-driven cleanup.

Installed/tagged ioredis [disconnect source](https://github.com/redis/ioredis/blob/v5.11.1/lib/Redis.ts) clears the reconnect timer and disconnects its connector. The [close handler](https://github.com/redis/ioredis/blob/v5.11.1/lib/redis/event_handler.ts) sets `end` after a socket-close event observes manual closing. In the already-destroyed reconnect gap, no second close event is observed, so that terminal transition does not occur. This explains why timing sometimes produces a ready-state pass and sometimes a reconnecting-state failure; the preinstalled listeners and already-ended control argue against merely subscribing after a successful end event. The compatibility suite's acknowledgement assertion is retained, with socket/timer diagnostics on failure. No library/internal-state patch, production lifecycle change, timeout increase or reinterpretation as a passed cleanup gate is introduced.

## 7. Correction verification and existing reliability

Correction addresses [PR #27 review](https://github.com/YounasKhan2/Unblok/pull/27#issuecomment-6091982309) of `29451dbd76804f519591d9b28fc1fe8a140dff9d`. [Final correction comparison](evidence/BE-00F-correction-comparison.json), [independent B correction](evidence/BE-00F-correction-selected.json) and the shutdown diagnostics are separate from the unchanged original snapshots. Candidate B remains conditional; observation passes do not approve fixture credential delivery, stock stale-session behavior or production authentication.

| Gate | Result |
|---|---|
| `bun run typecheck:backend` (includes architecture scan) | Passed; 324 source files, 909 resolved edges, zero violations; existing type-only backlink preserved |
| `bun run test:backend:architecture` | 45 pass / 0 fail, 51 assertions, 8.09s; unchanged assertions and deadlines |
| `bun run test:backend` | 81 pass / 0 fail, 152 assertions, 6.64s; includes all 45 architecture tests |
| `bun run lint:backend` | Passed, including new JavaScript harness |
| `bun run build:backend` | API and worker passed |
| Existing `bun run test:backend:integration` | Prior reviewed run: 2 pass / 0 fail, 5 assertions, 24.05s. Not rerun for these harness-only corrections; no durable auth fence integration test exists |
| Complete compatibility comparison | 53 pass / 1 fail, exit 1; unchanged A terminal acknowledgement failure retained; credential and late-save behavior explicitly characterized |
| Independent B correction | 29 pass / 0 fail, exit 0; includes unsafe-stock and late-save observations, not blanket security approval |
| Scratch layout tests | 6 pass / 0 fail, 7 assertions; normal checkout and early rejection of gitfiles/missing metadata/redirected or wrong-type targets |
| A cleanup diagnostics | Five child observations, zero failed diagnostic assertions; **three failed cleanup acknowledgements** retained; all children naturally exit 0 |
| Isolated frozen install / registry audit | Passed / zero reported advisories at query time |
| Relative documentation links / `git diff --check` | Passed |

New harness files are JavaScript: lint and executable assertions cover them; existing backend TypeScript checks do not statically typecheck `.mjs`. The test loader resolves installed API dependencies at runtime; the architecture scan includes these files but is not a semantic analysis of that loader. No production file imports the harness. No existing assertion, architecture rule or deadline changed.

Failed development observations remain visible: an initial credential probe incorrectly expected the running `/proc/1/cmdline` to retain startup arguments and failed; the corrected check distinguishes the observable environment/startup expansion from Valkey's rewritten runtime title. A subsequent [comparison attempt](evidence/BE-00F-correction-comparison-attempt-1.json) recorded 51 pass / 3 fail: A acknowledgement, B unavailable-startup fixture operation (9ms), and container removal (5ms). The failed fixture container was explicitly removed afterward. A concurrent lint invocation exited 9 with no diagnostics; its serial rerun passed. The additional fixture/lint failure causes were not established and are not classified as harmless or attributed to Windows/OOM without proof. Fixture command failures now preserve sanitized stage/exit/category metadata without argument/credential output. The final serial comparison/B runs preserve the same deadlines and pass the affected fixture checks; successful reruns do not erase the failed attempt.

The existing queue completion timeout/late error and Windows Bun SIGTERM 143 remain known baseline issues ([living tracker](16-BACKEND-STATUS-AND-ROADMAP.md)). They are not exercised/reclassified by this isolated test. Three NEXUS failures remain; frontend, full infrastructure/lifecycle and tenant-schema recertification were not rerun because those paths are unchanged. Direct fixture shutdown is independent evidence, **not proof of signal-driven API/worker shutdown**. Relevant existing integration services were started and stopped afterward with volumes retained; final disposable container removal passed. A's reconnect/end-event problem is a separate session-candidate finding, not assumed to share the SIGTERM root cause.

## 8. Acceptance, approvals and next slice

Recommend B as the adapter/client direction for human review, **not unwrapped stock B for production use**. It has measured runtime compatibility and a demonstrated bounded callback path, but production suitability remains conditional on the following acceptance criteria:

1. Approve pinned version/support/dependency footprint and audited wrapper behavior, including late persistence after timeout; real deployment TLS/ACL/proxy/browser tests and outage/recovery matrix must pass.
2. **Before any production authentication integration/security approval**, approve and implement additive PostgreSQL epochs/family fences and named database interfaces, checked on every authenticated request and every protected write. Prove rejection after the demonstrated 503/destroy/late-save resurrection, stale-cache restore, logout-all/reset linearization, concurrent write ordering and already-minted principal revocation with real PostgreSQL tests.
3. Preserve the unforgeable same-instance VerifiedPrincipal contract with the private session-backed verifier and explicitly reviewed boundary/error adaptation; no client identity fields or second internal token by default.
4. Approve production topology, cookie lifetimes, missing-Origin compatibility decisions, credential lifecycle and resource policies. CSRF/origin/CORS/WebSocket and abuse controls require independent executable certification.
5. Resolve shutdown/cleanup reliability, production persistence/HA/backup recovery, load/capacity and the existing baseline blockers before launch. No immediate revocation, vendor Bun support, HA or capacity guarantee is inferred here.

The next proposed phase is a separately authorized narrow database auth-fence/trust-boundary integration and its adversarial/concurrency tests, followed only after approval by the bounded session/CSRF/identity feature slice. No next phase is begun. The living tracker is unchanged; BE-00F is not marked merged and authentication remains unimplemented. **Stop at human review; do not merge or enable authentication.**
