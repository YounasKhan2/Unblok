# Team directory latency investigation and remediation proposal

## Merge checkpoint and scope

BE-TEAM-02 PR #43 was OPEN/draft/MERGEABLE/CLEAN at the exact approved HEAD `027594b30d4e84ce8af61d8f09ea067ba6daebf4`. It was marked ready and merged into main at **`d0fbdf9d338b22570ef53028174e046bb63349f4`**. Local main was fast-forwarded to origin/main and confirmed clean before creating this separate investigation branch. All approved security, migration, performance and frontend compatibility evidence is preserved byte-for-byte.

This is an observational investigation and proposed remediation, not authorization to implement an optimization or start frontend Team management. Production API/database/contracts/infra/frontend/dependencies are unchanged. New code consists only of disposable profiling harness/client; data is seeded into owned temporary PostgreSQL databases and Valkey namespaces and cleaned afterward. No shared database reset, cache, rate-limit change, timeout change or pool resize occurs.

Reviewed sources: backend index,07 performance objectives,08 verification,19 primary fences,20 session/pool infrastructure,24 contract/error rules,29 approved Team architecture and30 implementation/F1 evidence. Authoritative constraints remain request-bound server-owned authority, fresh user/family/Workspace/Team checks and completion fencing, sorted locks, private owner-only directory, no ADMIN discovery bypass, signed bounded pagination, strict DTOs, unchanged admission and immutable receipt semantics.

## Workload and instrumentation

Each burst uses a fresh legitimate account/Workspace and private Team with1,001 explicit joins and120-character member names. Fifty GET directory requests, limit20, run at concurrency1/10/50; each account stays within60 reads/minute, each Workspace within300, and coarse admission within120. No admission key reset, retry or artificial grant occurs. Every response in each recorded burst is200 with20 rows and6,867 bytes. SQL and authorization behavior are exactly the merged implementation.

The HTTP client runs in a separate Bun process and receives ephemeral session credentials on stdin; output contains status, duration, bytes and row counts only. Server process CPU includes the native Prisma engine and observer overhead, but excludes the client. Method spans use request-bound AsyncLocalStorage and reflectively call the original methods with original arguments/receivers; they grant no authority. Inbound-to-finish and client end-to-end timings are separate. Response schema validation and Express JSON/send are separately timed.

The installed Prisma6.19.3 native pool metric is enabled only in the disposable client through private constructor configOverride and an in-memory generator preview declaration. No generated schema or production configuration is edited. This pinned, version-dependent observation facility is not proposed as production telemetry. The existing local URL has connection_limit5/pool_timeout3; the Database boundary retains SERIALIZABLE/maxWait2s/timeout5s and local1.5s/4s statement/lock limits. Five is the local onboarding configuration, not a certified production optimum.

Native metrics measure actual connection acquisition waits independently of transaction call-to-callback spans. A controlled calibration holds all five existing connections for80ms, starts one contender and then releases them, without changing any timeout. The measured contender and native waiting totals agree closely (exact numbers below). Transaction call-to-callback additionally includes engine dispatch and BEGIN/isolation overhead; it is not mislabeled as pure pool wait. Callback-held and completion/commit intervals are separately recorded. PostgreSQL xact_start ages and idle-in-transaction counts are independently sampled, alongside ungranted pg_locks.waitstart. Sampled ages are not the distribution of completed transaction lifetimes; use them with the per-transaction callback/commit intervals.

Native SQL event durations include driver/engine elapsed query time and millisecond rounding. They are not interchangeable with isolated EXPLAIN execution time. Original indexed EXPLAIN evidence remains intact. SQL parameters, cookies, identities, contact data and environment secrets are not stored in artifacts.

## Findings

Connection queueing is a measured major contributor. Each successful directory request acquires a connection **four times**: initial primary session validation; currentUser self-profile authorization; Workspace preauthorization; final private Team directory boundary. Native metrics record200 acquisitions for50 requests. Native SQL events record approximately64 statements/request, including12 BEGIN/isolation/COMMIT control statements; earlier52-statement helper evidence excluded those controls. Exact batch counts may include a few boundary-delayed query events and should not be attributed individually.

At concurrency50 the pool reaches five busy connections and45 queued acquisitions. Native pool waiting is hundreds of milliseconds per request even though the indexed business selector is bounded and cheap. At1 there is almost no acquisition queue. Sampled row-lock waits were zero in these read bursts; that does not establish absence of sub10ms waits. It separates observed connection queueing from PostgreSQL row-lock contention. All five connections are also observed idle in transaction while awaiting client/engine round trips; short SQL execution is not the same as short connection occupancy.

Final unprofiled run (native metrics/query logging enabled; detailed method spans toggled):

| Mode / concurrency | HTTP p95 ms | Server p95 ms | Native pool mean wait ms/request | Max queued | Server CPU core equivalents | Timer-lag p95 ms |
| --- | --- | --- | --- | --- | --- | --- |
| No method spans / 1 | 65.20 | 64.87 | 0.00 | 0 | 0.85 | 0.75 |
| No method spans / 10 | 208.62 | 205.55 | 68.46 | 5 | 1.53 | 3.26 |
| No method spans / 50 | 1074.68 | 1057.05 | 783.23 | 45 | 1.51 | 2.52 |
| Detailed / 1 | 78.76 | 78.25 | 0.00 | 0 | 0.75 | 1.59 |
| Detailed / 10 | 228.97 | 227.07 | 70.04 | 5 | 1.65 | 6.39 |
| Detailed / 50 | 1071.34 | 1053.08 | 741.71 | 45 | 1.47 | 6.03 |

Calibration: call-to-callback **82.09ms**; native pool wait sum **81.07ms**. Native per-request waiting is an aggregate mean (total wait divided by50), not a p95. Nested span percentiles are not additive.

Detailed concurrency50 phase spans:

| Phase | Observations | p95 ms |
| --- | --- | --- |
| coarse-admission | 50 | 21.93 |
| session-store-get | 100 | 25.87 |
| session-verify | 50 | 7.28 |
| session-primary-fence | 50 | 119.51 |
| self-profile-authorization | 50 | 280.90 |
| workspace-authorization | 50 | 263.00 |
| team-admission | 50 | 8.63 |
| private-team-directory | 50 | 344.18 |
| response-schema-validation | 50 | 0.25 |
| response-json-and-send | 50 | 0.64 |

Session store get has100 observations because the library restoration and fresh Sessions.verify each read it. These are retained security/session semantics, not a proposal to remove a read. The self-profile stage fetches name/email/verification data even though Teams.run uses only actor.id for admission; that is a concrete candidate for a narrower closed preflight capability.

| Transaction stage / concurrency50 | Call-to-callback p95 ms | Callback held p95 ms | Completion p95 ms | Total p95 ms |
| --- | --- | --- | --- | --- |
| session-primary-fence | 109.33 | 15.52 | 3.86 | 119.50 |
| self-profile-authorization | 265.41 | 24.76 | 4.54 | 280.89 |
| workspace-authorization | 235.50 | 31.48 | 11.22 | 262.99 |
| private-team-directory | 322.76 | 47.06 | 4.57 | 344.14 |

Observed maximum server transaction age at detailed50: **121.98ms**, with up to five active/idle transactions. This is a sampled pending age, not an exact completed lifetime. Directory native query-event p95 was **1.00ms**; schema/JSON costs above are much smaller than end-to-end latency. They do not justify cache or serialization redesign.

CPU is an additional resource cost, not a demonstrated explanation of all latency. Aggregate process CPU includes Rust workers and can exceed one core; the environment reports four available cores. Timer lag shows intermittent stalls but is much smaller at p95 than the observed directory latency. Bun1.4.2 eventLoopUtilization returned zero idle/active/utilization even under work; it is explicitly marked unusable, not evidence of an idle loop. Custom timer lag, monitorEventLoopDelay and process.cpuUsage are retained. These observations do not prove the JavaScript thread is never saturated or certify production headroom.

A separate standalone Bun/JSC CPU profile isolates workload windows from signup/seeding/calibration. Its weighted VM samples include native query bridge, Prisma dispatch/deserialization/parsing, host work and observer metrics; native query frame samples are **not** PostgreSQL execution time. Rust worker stacks are unresolved and sampled intervals are not exact CPU milliseconds. The CPU-instrumented run is recorded separately and excluded from objective conclusions because profiling perturbs latency. [CPU summary](evidence/team-directory-investigation/cpu-summary.json) identifies sampled frames and limitations.

The250ms objective remains unmet at concurrency50 in every recorded unprofiled burst. Concurrency10 is variable: the initial/repeat runs exceeded it, while the final run above meets it. This does not erase the reviewed367.58/1,493.26ms evidence or certify reliable attainment. No claim is made that method instrumentation improves latency: sequential mode order, warm-up, host contention, instrumentation and finite samples all confound before/after inference. Only50 requests per cell are measured, not steady-state throughput, production sizing or multi-node capacity.

## Proposed remediation — approval required before production changes

1. **Reduce redundant preflight work through a closed server-owned capability.** Design a request-bound Workspace admission projection returning only the verified actor ID and existing authorized Workspace context. It should combine the currently separate self-profile and Workspace preflight transactions, omitting unused profile/contact projection. Preserve initial primary session validation and the final private Team boundary. Workspace authorization must still precede Valkey admission, and no remote call may occur inside a PostgreSQL transaction. This is a proposed three-acquisition path, not permission to reuse client roles or skip a fence.
2. **Measure remaining bounded round trips before further changes.** If necessary, propose batching transaction-local timeout configuration and bounded primary authority reads within the same transaction, preserving exactly the same values, sorted user→family locks, missing-row rejection, generation/epoch checks and final revalidation. No cross-request authorization memoization. Approve the exact SQL/authority proof before implementation; do not assume collapsing queries preserves revocation semantics.
3. **Validate security and compare measured costs.** Run both revocation orders, session-generation/account switches, user disablement, Workspace suspension/reactivation/demotion, hidden/nonowner/observer/foreign-Team access, directory policy-revision cursor invalidation, database/Valkey failures and strict response/error compatibility. No changes to consent/receipts/archival migrations or membership mutation gates are required for this read-only optimization. Compare baseline and candidate with the same five-connection pool, all current limits/deadlines and fresh legitimate scopes. Record native acquisition count/wait, callback/commit lifetime, SQL counts, CPU/lag and successful/error distributions across repeated1/10/50 bursts. Three acquisitions is a testable structural target;250ms attainment remains an objective until measured.
4. **Keep infrastructure sizing separate.** If approved bounded-query improvements still miss objectives, submit a separate pool-sizing experiment with a deployment-wide PostgreSQL connection budget, replica/worker/admin allocations, CPU/transaction occupancy and backpressure evidence. Do not increase local/production limits now. Caching authority, changing contracts/rate limits/timeouts, frontend management and unrelated optimizations are excluded.

The recommended next action is review of step1's narrow preflight capability design and required security proof. No performance production patch is included. The evidence does not justify an index-only fix, speculative cache, automatic retry or timeout relaxation.

## Evidence, verification and reproduction

- [Current request profiles](evidence/team-directory-investigation/profile.json), [initial profiles](evidence/team-directory-investigation/profile-initial.json), [repeat profiles](evidence/team-directory-investigation/profile-repeat.json), [CPU-instrumented profiles](evidence/team-directory-investigation/profile-cpu.json), [CPU summary](evidence/team-directory-investigation/cpu-summary.json).
- [Server harness](../../scripts/backend/team-directory-profile.test.ts) and [separate client](../../scripts/backend/team-directory-profile-client.ts). Credentials travel on stdin, never evidence output.
- Final PostgreSQL/Valkey/real HTTP profiling gate:1 PASS /102 assertions, all300 requests200 with correct bounded rows; cleanup verified by owned fixture. Calibration proves metrics include interactive transaction acquisitions. Earlier profiling runs are independent repetitions, not additional production security certification.
- Backend lint and architecture/typecheck run for the new harness. Production files, all12 merged migration files and prior security/migration/performance artifacts are unchanged. Existing NEXUS/operational limitations remain as documented; no frontend or business endpoint change is made. Full frontend/security regressions are not claimed as newly rerun for this observation-only scope.

Commands (existing ignored local API environment and installed pinned Bun/Prisma; no new dependency):

```sh
bun --env-file=apps/api/.env test scripts/backend/team-directory-profile.test.ts
TEAM_DIRECTORY_PROFILE_STANDALONE=1 bun --cpu-prof --cpu-prof-dir=/tmp/team-directory-cpu --cpu-prof-name=directory.cpuprofile --env-file=apps/api/.env scripts/backend/team-directory-profile.test.ts
bun run lint:backend
bun run typecheck:backend
```

Bun test does not emit a CPU profile despite accepting leading flags; standalone mode is required. The collected CPU run used an equivalent temporary standalone hook runner; the reusable mode now provides that path without temporary source files. Raw CPU capture remains in the execution workspace; the checked-in summary excludes setup and records weighted workload samples. Native metrics use a private pinned client facility, so future Prisma upgrades require recalibration. Exact long-lived pool wait percentiles and completed PostgreSQL transaction lifetimes would require additional telemetry; current native sums and sampled ages are explicitly bounded evidence. Stop at checkpoint review.
