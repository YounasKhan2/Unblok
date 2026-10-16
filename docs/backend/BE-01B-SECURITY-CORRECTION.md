# BE-01B — PR #50 security correction

Review baseline: `2ede5ac77aeb35f779bc539dfa11c398e7aab613`, branch `codex/be-01b`. [PM finding](https://github.com/YounasKhan2/Unblok/pull/50#issuecomment-6212646997). This report accompanies one correction commit; final SHA is recorded in PR #50 and the handoff. Keep the PR draft; no merge, deployment or frontend work.

## Confirmed cause and correction

The former resend branch rejected consumed invitations and invitations with a successor, but did not reject `canceledAt`. It skipped the cancellation update when already canceled and still created a new proof/outbox generation. A fresh Workspace revision could therefore authorize resend of a revoked generation. This was a domain admission defect, not a worker or Mailpit failure.

Resend now requires an uncanceled, unconsumed, unsuperseded source with current proof key, remaining proof attempts, valid original issuer authority and unchanged eligible initial Team plan. Expiry is evaluated separately from those authority checks, so an EXPIRED display state cannot conceal issuer/key/Team invalidation. Current caller ADMIN/verified identity, active Workspace and owner-level Team assignment permissions are independently revalidated as before.

| Source / request | Result and effects |
| --- | --- |
| Pending, otherwise eligible, fresh validator | 202; one successor and outbox, predecessor canceled atomically. |
| Expired but otherwise eligible, fresh validator | 202; fresh proof expires exactly 24 hours after new issuance; old proof stays unusable. Supports legacy v1 → v2 rotation without changing v1 proof validation. |
| Revoked/canceled, fresh validator | 409; no successor/outbox/receipt commit. Includes implicit cancellation from loss of issuer administration. |
| Consumed/accepted or superseded, fresh validator | 409; no new authority. |
| Retired key, exhausted attempts, changed/ineligible Team plan or invalid original issuer authority, even when expired | 409; no renewal. A new invitation requires a separate explicit authorized issuance, not revival of the old generation. |
| Stale but well-formed validator | 412 before lifecycle mutation. Missing validator remains 428; malformed validator is 400. |
| Matching committed same-key/body/original-validator replay by a still-authorized actor | Original neutral 202 only; no re-execution, even after successor revocation. The acknowledgment does not assert a currently valid invitation or new mail delivery. |
| Failed terminal resend replay with no committed receipt | Still rejected; no receipt was committed by the failed transaction. |

Terminal generation revocation does not permanently ban an email address. A separate new issuance remains an explicit new administrative intent; it cannot reactivate suspended/removed membership or redeem the old canceled proof.

## Resource-specific preconditions

The former `revision` on every invitation row was the Workspace administration revision. It was fail-closed but too broad: changing invitation B, adding a member or running an unrelated delivery could invalidate an action on invitation A. The correction replaces it with an opaque resource validator:

`inv2-<invitation UUID>-<64 lowercase hex HMAC>`

The client quotes that exact row value in If-Match. It must not use the numeric page-level Workspace revision. Member versions remain numeric and legacy invitation endpoints remain unchanged. The updated generated OpenAPI/schema artifact documents both formats.

The HMAC has a dedicated domain and binds Workspace/resource identity, immutable proof-generation material, that invitation's consumption/cancellation/attempt/delivery state, live lifecycle, key eligibility, original issuer authority and bounded referenced Team projection/authority. PostgreSQL JSON text preserves large integer precision. Internal digests/authority data never leave the helper. A validator is neither a proof nor a permission grant; current authorization still precedes receipt replay and precondition evaluation.

Invitation list/detail reads use the same validator helper as mutations. One bulk query and one database-clock read serve a whole bounded page; there is no per-invitation query loop. Unrelated invitation/member/delivery changes leave the row validator unchanged. Its own delivery/lifecycle/dependency changes invalidate it conservatively. Cross-resource tags fail even if both resources otherwise have identical data. Numeric collection revisions and signed cursor security fences retain their existing broader pagination purpose.

## Deterministic concurrency and preview evidence

Test-only database gating holds the actual accepted HTTP mutation before transaction commit. The contender must be observed waiting on PostgreSQL Workspace locks before release; no sleeps decide the winner and no production lock or timeout is changed.

- Revoke-first: revoke 202; contender with old resend validator 412; fresh resend 409; zero successors; old proof acceptance remains neutral and creates no membership.
- Resend-first: resend 202; contender revoking the old generation with stale validator 412; old generation is SUPERSEDED and cannot be resent; exactly one successor. Revoking that successor is a separate resource operation.
- Committed resend replay after successor revocation returns its original 202 without creating another successor or restoring canceled authority. Failed contenders leave no durable receipt. Existing serializable conflicts remain 409 when PostgreSQL detects a conflicting snapshot; no automatic retry was added.

Recipient preview does not use the administration validator as authority. REVOKED, SUPERSEDED, ACCEPTED, EXPIRED and INVALIDATED authentic proofs reveal limited lifecycle only to their currently verified matching recipient. A Workspace ADMIN who is not that recipient receives the same neutral recipient-route response as any other wrong account; the separate scoped administration route remains authoritative for admin reads. Forged/unknown proofs and matching but currently unverified credentials remain neutral. Anonymous requests retain existing authentication/CSRF rejection. Terminal preview never redeems a proof or changes membership; account-existence fields are absent.

## Verification and migration status

No migration, schema, proof-cryptography, worker, frontend or `/demo` change. All 13 existing migration files remain byte-for-byte unchanged. Disposable upgrade tests preserve the original 12 checksums, v1 proof/outbox/receipt/history, redeem a preserved v1 proof, and verify final Prisma schema parity. Shared QA, accounts, Workspaces, Mailpit, environment files and credentials were untouched.

Final correction checks (Bun is available at `C:\Users\youna\.bun\bin\bun.exe`):

| Exact command | Result |
| --- | --- |
| `bun scripts/backend/run-administration-isolated.mjs scripts/backend/workspace-administration.test.ts` | 27 pass / 0 fail; 1,165 assertions. Includes migration upgrade/checksums/schema parity. |
| `bun --no-env-file test scripts/backend/workspace-administration-contracts.test.ts scripts/backend/workspace-invitation-contracts.test.ts` | 2 pass / 0 fail; 27 assertions. |
| `bun scripts/backend/run-administration-isolated.mjs scripts/backend/workspace-administration-performance.test.ts` | 1 pass / 0 fail; 178 assertions. |
| `bun scripts/backend/run-administration-isolated.mjs scripts/backend/workspace-memberships-invitations.test.ts scripts/backend/tenancy.test.ts scripts/backend/teams.test.ts scripts/backend/auth-fences.test.ts` | 128 pass / 0 fail; 2,243 assertions; 131.52 s. |
| `bun scripts/backend/run-administration-isolated.mjs scripts/backend/team-management.test.ts` | Standalone rerun: 35 pass / 0 fail; 1,031 assertions; 99.95 s. Existing stress case passed in 21,298.39 ms under its unchanged 30,000 ms limit. |
| `bun run typecheck:backend` | Pass; architecture: 457 sources / 1,238 edges / zero violations. |
| `bun run lint:backend` | Pass. |
| `bun run build:backend` | API and worker pass. |

The final passing runs above contain 193 tests / 4,644 assertions; they do not erase the initial failed combined run below. Historical NEXUS fixture failures, combined architecture timeout, Workspace navigation flake and queue/SIGTERM limitations remain unchanged; browser/NEXUS/queue/lifecycle suites were not rerun for this focused backend correction.

The refreshed `evidence/BE-01B-performance.json` records actual 10k/100k EXPLAIN ANALYZE/BUFFERS and five samples per operation/page size. Operation SQL counts are constant across limits 1/100: 32 for directory/search, 34 for invitation history (the added clock/bulk-validator reads); exact bare SELECT 1 health pings are recorded separately. At 100k, p50 directory latency was 469.3/627.3 ms, invitation history 200.3/163.5 ms, and member search 434.3/522.2 ms. Corresponding p95 values were 628.3/940.9, 217.1/187.4 and 455.1/540.4 ms. Maximum response was 40,323 bytes. This benchmark ran alongside the initial regression run; it is not a standalone production SLO. The final narrowing of Team validator material to explicit dependency fields was subsequently covered by the final functional suite; the synthetic benchmark has no Team assignments.

Seven regenerated historical regression artifacts were archived outside the repository under `D:\Full_Stack_Apps\Unblok-BE-01B-20261016\security-correction-regressions`; their original checked-in versions are retained. Only BE-01B OpenAPI/performance artifacts are refreshed in this correction.

The first broader regression run, executed concurrently with the 100k benchmark, reported **162 pass / 1 fail / 1 error, 3,250 assertions**. Its existing Team `F1 within-budget workload` exceeded the unchanged 30,000 ms limit and later raised an assertion after timeout. This observed failure is retained, not relabeled a passing or historical test. The standalone Team rerun with the original assertions/timeouts passed as recorded above; concurrent benchmark execution is context, not a proven sole cause.

## Remaining review boundaries

- Existing conservative mutation/preview rate budgets and last-admin, Team-owner, session, CSRF, tenant, idempotency and atomic assignment protections remain in force.
- Coordinated API/worker rollout is still required after approval; old acceptors do not apply v2 initial Team assignments. No mixed-version deployment is certified or performed.
- Local benchmark results are not a production SLO. Dense Team plans and broader concurrent administration capacity remain unmeasured.
- PM re-review is required. FE-INTEGRATION-01B has not resumed.
