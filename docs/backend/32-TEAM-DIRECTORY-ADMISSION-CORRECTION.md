# Team directory closed admission correction

Base: approved investigation merge `1bfb1c3d2aca1cf9e741e41e59e30603589e7624`. Reviewed PR #44 HEAD `c9db666a0fc75cb0144d8d25180250355760012b` matched and was mergeable. Its documentation/evidence/disposable-harness scope contained no production change; it was marked ready, merged and main synchronized clean.

## Requirements checklist recorded before implementation

Approved sources: backend index,07/08 performance and verification,19/20 primary/session fences,24 contract/privacy rules,29/30 Team architecture/implementation,31 approved first correction. Implement only the directory preflight combination; no product/domain/schema decision changes.

| Requirement | Implementation / required proof |
| --- | --- |
| Four acquisitions to three, directory only | Closed Tenancy operation returns verified actor ID + authorized Workspace context; no unused self-profile projection; native counts prove3/request |
| Fresh primary session and request-bound authority | Original Sessions.withRequest/primary validation remains; same workspaceBoundary user/family locks and completion revalidation; forged/reused principal negatives |
| Workspace before Valkey; private Team final transaction | No external call in SQL transaction; final teamMembers boundary remains fresh; held admission/revocation schedules |
| Lifecycle/tenant/error/cursor semantics | Logout/rotation/account switch/suspend/demotion/foreign/nonowner/observer/stale cursor/outage cases |
| Before/after repeat measurements | Same legitimate fixtures, five connections and current limits; exact baseline directory flow reconstructed only inside harness; repeated1/10/50, success p50/p95/p99, queue/occupancy/SQL/locks/errors |
| Regression and scope | Existing Team/Workspace/authentication/session/tenancy gates; no migrations, frontend, contracts, dependency, pool, rate or timeout change; retain historical evidence |

The checklist above preceded implementation. Final evidence and limitations follow. This branch is for a separate draft PR; no merge or frontend management authorization.

## Implementation and security compliance

Only GET Team member directory uses the new `Tenancy.teamDirectoryAdmission` port. It resolves authority through the existing opaque registered principal, request context, primary user/family locks and completion revalidation. Its result contains only `actorId` and the existing authorized Workspace projection, frozen at the boundary. It does not call currentUser or select unused user profile/contact fields. The Workspace projection is internal admission metadata, not Team authorization and not a new public API contract.

The request path remains: fresh session cache verification and primary session-family/epoch validation → one Workspace admission transaction → existing Valkey read admission → fresh private owner-only Team directory transaction with completion revalidation. There is no remote call inside a PostgreSQL transaction. Scope authorization precedes admission metadata; the final capability independently resolves Workspace status, explicit Team membership/owner/ceilings and current revisions. No returned context is reused as final authority. Other Team routes retain their original preflight path. No global ADMIN Team access or new Project/Issue permission is introduced.

| Approved requirement | Implementation / evidence | Deviation |
| --- | --- | --- |
| Four acquisitions to three; no unused contact projection | New closed port, members-only caller; native pool counters4→3/request; HTTP test spies user profile selections and asserts none | None |
| Fresh primary session, family/epoch and completion fences | Original Sessions.withRequest and workspaceBoundary unchanged; initial validation + admission + final Team transaction | None |
| Workspace before Valkey; final private authorization | Existing read limiter outside completed admission transaction; unchanged teamMembers capability | None |
| Revocation, logout/rotation/account switch | Controlled primary waits in both orders; suspension/demotion/Workspace archive/logout/rotation/epoch/disabled-user changes after admission reject; account A/B/A and foreign/privacy cases | None |
| Fail closed and request-bound | Real PostgreSQL refused connection and Valkey admission outage503; forged and retained out-of-request principals rejected | None |
| Cursors/contracts/limits | Existing policy revision and signed cursor checked in final transaction; role/membership changes stale409; existing strict schemas/routes/limit config unchanged | None |
| Repeat comparable measurements | Three paired before/after runs, identical logical fixtures/cardinality/names/limits; alternating order; native acquisition/SQL/queue/occupancy/locks and successful p50/p95/p99 | Finite local bursts; objective unmet as reported below |
| Regression and evidence preservation | Team/management/tenancy/fences, Workspace/auth/session, contracts and frontend gates; all12 migrations/neutral contracts/front/infra/dependencies and historical evidence byte-identical | Existing3 NEXUS failures retained |

The first new test fixtures attempted to suspend/demote a sole Workspace ADMIN and correctly encountered the existing final-active-administrator constraint. They now create a second explicit eligible Workspace ADMIN without a Team join. No production safeguard was relaxed and the spare ADMIN acquires no private Team discovery permission. The initial Workspace invitation regression also exposed a latent expired-fixture timing error: separate Date.now calls created a24-hour-plus1ms interval. One captured fixture timestamp fixes that data construction; rejection assertions and SQL constraints are unchanged. Both intermediate failures are retained in verification history.

## Regression verification

| Gate | Exact result |
| --- | --- |
| Frozen install; Prisma validation | PASS; schema and dependencies unchanged |
| Backend lint, architecture/typecheck, API/worker build | PASS |
| Backend unit |101 PASS /265 assertions |
| Team/management/tenancy/auth-fence/new admission combined |140 PASS /2,425 assertions across5 files |
| Final standalone admission proof, including no profile selection assertion |13 PASS /353 assertions |
| Authentication / sessions / Workspace foundation |26 /827,31 /473,29 /671 PASS in combined run |
| Workspace membership/invitations final standalone |36 PASS /1,200 assertions; the intermediate combined run had121 PASS /1 fixture failure of122 |
| Neutral Team/Workspace contract gates | 4 PASS /39 assertions; unchanged public contracts |
| Frontend lint/typecheck/build | PASS |
| Full frontend regression |857 PASS /3 existing NEXUS failures;860 tests/60 files |
| Paired real PostgreSQL/Valkey/isolated HTTP benchmarks | Six gates each1 PASS /60 assertions;900 responses200 with20 rows; no409/412/429/503 in these within-budget bursts |

Existing frontend failures remain missing resolved blocker (`nexusEnterprise.test.ts:94`), zero milestone graph edges (`:152`) and fan-out3 instead of2 (`nexusEnterpriseValidation.test.ts:301`). Fixtures and expectations were not changed. The original real Chromium compatibility evidence remains preserved; this directory endpoint is not a new frontend integration. No frontend management is authorized. Existing final migrations are installed/replayed/diffed and historical receipt upgrade invariants exercised by the unchanged management suite; no new migration or destructive reset is introduced.

## Before/after measurements

Baseline reconstructs the exact merged four-transaction directory workflow only inside the disposable harness, using real session/Workspace/Team fences and existing Valkey admission. It is never a production fallback. Both modes have identical detailed instrumentation, separate HTTP client processes, fifty requests per fresh legitimate account/Workspace,1,001 explicit joins,120-character member names and limit20. Account/Workspace/coarse budgets are not reset. Run order is before1→after1→after2→before2→before3→after3 to reduce order bias without claiming elimination of host/warm-up variation.

The existing five-connection pool, maxWait2s, transaction timeout5s and local lock/statement1.5s/4s remain unchanged. Read admission remains60/account/minute,300/Workspace/minute, coarse120/minute. Success payloads remain6,867 bytes. Native metrics are enabled only in the disposable pinned6.19.3 fixture. Per-request pool wait below is an aggregate mean, not a p95. Callback occupancy excludes pool acquisition and is distinct from sampled PG xact_start ages. Event-loop/CPU/SQL/locks remain in each raw measurement.

| Repeat / concurrency | Before p50 / p95 / p99 ms | After p50 / p95 / p99 ms | Before→after native pool mean wait ms/request | Before→after callback occupancy mean ms/request |
| --- | --- | --- | --- | --- |
| 1 / 1 | 56.33 / 93.48 / 111.68 | 43.27 / 74.30 / 84.74 | 0.00→0.00 | 43.96→34.37 |
| 1 / 10 | 186.24 / 249.79 / 259.94 | 135.46 / 204.30 / 208.38 | 73.42→54.09 | 81.38→63.41 |
| 1 / 50 | 700.30 / 884.77 / 889.16 | 572.73 / 746.05 / 752.65 | 588.61→472.24 | 72.15→59.27 |
| 2 / 1 | 47.19 / 65.17 / 75.77 | 39.51 / 71.10 / 95.55 | 0.00→0.00 | 36.98→32.97 |
| 2 / 10 | 167.22 / 231.58 / 236.48 | 145.27 / 296.32 / 297.69 | 68.73→65.24 | 75.90→71.96 |
| 2 / 50 | 698.46 / 847.44 / 861.42 | 575.83 / 732.02 / 738.99 | 582.67→467.32 | 69.44→59.31 |
| 3 / 1 | 51.43 / 77.12 / 111.84 | 41.04 / 55.46 / 70.71 | 0.00→0.00 | 41.91→30.90 |
| 3 / 10 | 177.81 / 346.66 / 354.11 | 151.93 / 232.43 / 235.02 | 83.82→61.46 | 82.63→72.74 |
| 3 / 50 | 702.25 / 865.07 / 867.00 | 511.62 / 679.83 / 683.71 | 586.17→425.39 | 69.63→55.40 |

Native acquisitions are exactly200→150 per50-request cell (4→3/request) in every repetition; native SQL statement counts are3,200→2,450 (64→49/request). This is a structural reduction, not an inferred latency benefit. Native query durations remain rounded driver/engine measurements; callback/commit and per-stage admission spans are separate. Max pool queue and sampled PostgreSQL lock/transaction observations are retained in raw profiles. All benchmark requests were successful; error distributions are explicitly zero in this bounded workload, not assumed absent under overload. Separate security/regression tests exercise error and outage behavior.

**250ms objective:** candidate concurrency1 meets it in all3 repetitions. Candidate concurrency10 p95 is204.30/296.32/232.43ms:2 of3 meet it, so reliable attainment is not established. Candidate concurrency50 p95 is746.05/732.02/679.83ms:0 of3 meet it. Baseline50 p95 is884.77/847.44/865.07ms. Median run p95 at50 falls865.07→732.02ms (about15.4%), but the objective remains unmet. No passing result is manufactured and no statistical/production certification is claimed. Performance observations do not authorize another optimization or infrastructure change.

## Reproduction, evidence and limitations

[Comparison and distributions](evidence/team-directory-admission/comparison.json), six `profile-before/after-1/2/3.json` files in [evidence](evidence/team-directory-admission/), and [verification](evidence/team-directory-admission/verification.json) contain exact acquisition counts, successful p50/p95/p99, wait sums/means, transaction callback/commit occupancy, native SQL counts, actor admission, process CPU/timer lag and sampled locks/xact ages. Re-run artifacts from old test paths were copied into this phase's regression subdirectory and their original approved files restored unchanged.

```sh
TEAM_DIRECTORY_BASELINE=1 TEAM_DIRECTORY_REPETITION=1 bun --env-file=apps/api/.env test scripts/backend/team-directory-profile.test.ts
TEAM_DIRECTORY_REPETITION=1 bun --env-file=apps/api/.env test scripts/backend/team-directory-profile.test.ts
bun --env-file=apps/api/.env test scripts/backend/team-directory-admission.test.ts
```

Repeat benchmark indices2/3 with the recorded alternating order. Baseline/candidate datasets have identical logical shape; generated IDs/accounts are fresh to preserve actual admission limits. No cross-request cache is added. The private native-metric config is pinned and observational, not deployment guidance. Polling may miss short waits, callback occupancy includes application/engine work, and sampled transaction ages are not complete lifetime distributions. Host contention, run order and finite sample size limit causal conclusions; pool size remains five throughout.

Rollback is code-only reversion to the prior directory preflight, retaining current schema, constraints, budgets and receipts. Existing operational/NEXUS limitations remain. No deployment or frontend management work occurs. This implements only the approved first preflight correction; bounded SQL batching, pool sizing, additional caching or other milestones require separate review. Stop at human review of the separate draft implementation PR.
