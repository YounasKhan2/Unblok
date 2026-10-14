# BE-TEAM-02 implementation and verification

Base: approved architecture merge `41502c012e263a384748e432157f84f09b3cde32`. Implementation branch only; human security review required; no merge or frontend management authorization.

## Pre-implementation requirements checklist

Reviewed backend index/guidance/security/testing, domain/module/session/fence/Workspace/Team reports, approved29 architecture, actual SQL/Prisma Team ownership/receipt/fence paths and frontend strict contracts. Architecture matches implemented foundation; approved29 replaces only proposed later behavior. No recovery, self-removal or new Project/Issue permission is authorized.

| Requirement | Implementation work / required proof |
| --- | --- |
| Private eligible owner management; MEMBER/OBSERVER ceilings | Closed ports; SQL owner ceiling; owner-only directory; hidden/nonowner/observer/inactive negatives |
| Add/remove/role; immutable ownership except consent | Strict UUID/role bodies; single owner; no owner removal/downgrade; no implicit invitation or escalation |
| Consent request/detail/accept/reject | One bounded current slot,15min TTL, addressed successor only; epoch/family/version/policy checks; expiry/reject/race/response-loss proof |
| Lifecycle | No cascade; ACTIVE Project protection and archived-parent refusal; revocation always allowed |
| Additive migration | Preserve11 checksums; deterministic admitted MEMBER and unknown timestamps; fresh/upgrade/replay/diff/procedural tests |
| Receipt/CAS/admission | Shared20/60, original slots/caps/tombstones; old digest/result compatibility, minimal former-owner replay; full-cap/rollback proof |
| Lock/revocation | Sorted users/families -> Workspace/revision -> admission/receipt -> Team/intent/joins; unchanged deadlines; both primary race orders |
| Bound pagination/performance | Signed actor/tenant/Team/revision/filter/tuple cursor; byte/row bounds; real plans and workload measurements |
| FE-TEAM-01/frozen UX/NEXUS | Existing v1 later hints remainfalse; no frontend/dependency/demo changes; existing regression gates/failures retained |

The checklist was recorded before implementation. Completed evidence and deviations follow.

## Delivered behavior and documentation compliance matrix

The approved architecture was merged after exact reviewed-HEAD verification and mergeability confirmation. Local main matched the merge/base SHA above with a clean tree before implementation. This report supersedes historical review-stage status statements; it does not rewrite prior verification evidence.

| Applicable source / requirement | Implementation | Automated evidence / deviations |
| --- | --- | --- |
| 29 §2 private explicit authority; 05 security; 19 fences | Request-bound closed Tenancy ports, primary user/family locks, fresh Workspace/Team authority; owner-only directory without emails | Hidden Team, unrelated ADMIN, observer, foreign tenant, forged principal and revocation negatives; no ADMIN discovery bypass |
| 29 MEMBER/OBSERVER ceilings and explicit admission | Strict existing ACTIVE Workspace membership UUID; Team ceiling additionally restricts existing scoped write policy; owner cannot be removed/downgraded | Add/remove/role/inert/foreign/inactive tests; no invitations/contact search/self-removal |
| 29 consent lifecycle and owner-loss policy | One current intent per Team, 15-minute database-clock expiry; explicit addressed eligible successor acceptance; epochs, original family, version and policy captured | Reject/replace/expiry/held completion/races/epoch/logout tests; owner loss freezes management while security revocation proceeds; no recovery |
| 29 atomic invariants; 14 domain integrity | Deferred owner-MEMBER and accepted-intent/effect/receipt checks; membership effects increment Team/directory/policy revisions; strong preconditions | Direct SQL owner/role forgery, rollback and acceptance-first/revocation-first schedules; no implicit Project/Issue authority |
| 29 lifecycle; existing Project integrity | Archive/restore changes only Team state; active children prevent archival; archived directory remains owner-readable | Four Project create/restore vs archive schedules; no cascade; no revived old consent |
| 24 enterprise contracts; 29 idempotency | Strict contracts, CSRF, If-Match, durable atomic receipts; persisted HTTP status and original intent revision; minimal original actor consent acknowledgement | Lost HTTP response replay, full-cap replay, original-revision binding, immutable field attempts; inert 200 has no Team version increment |
| 28 immutable admission; 29 shared limits | Existing slot/tombstone mechanism unchanged; 2,000 Workspace / 20,000 deployment caps; new management 20/min/account and 60/min/Workspace | Full-cap SQL/HTTP, rollback, database errors, cross-Workspace contention and Valkey outage; no mutable counter or trigger-depth authority |
| 07 performance; 29 directory | Signed actor/Workspace/Team/filter/limit/revision tuple cursors, 15-minute validity, 2,048-byte input; default20/max100; bounded projection | Traversal with historical NULL timestamps, stale/expired/binding negatives; measured plans below; latency objectives not certified |
| 08 testing/migrations; 29 historical compatibility | Additive twelfth migration, all eleven predecessors unchanged; old digest/results retained | Fresh installation, repeat deploy/status/diff, actual eleven-migration upgrade/checksum/time assertions and historical full/tombstone replay |
| 11 handoff; FE-TEAM-01 frozen compatibility | Existing Team DTO later capability hints stay literal false; new management contracts separate | Real Chromium compatibility and strict contract tests; no frontend source, NEXUS fixture or dependency changes |

Ten new handlers cover member directory/add/role/remove; transfer request/detail/accept/reject; archive/restore. The four foundation routes remain compatible. Directory is private to an eligible owner, including archived Teams within an ACTIVE Workspace. Archived membership mutations are denied. Ordinary authorized metadata readability remains unchanged. Hidden/foreign/unrelated targets return the approved privacy-safe error; admitted non-owner management is denied. Missing preconditions, stale versions and conflicting consent remain 428/412/409 respectively. No contact data or fabricated discovery is exposed.

The transactional boundary locks sorted affected users and session families before Workspace/revision, new-receipt admission and receipt, Team/current intent, memberships and child validation. Selectors identify lock candidates only; they do not grant authority. Completion rechecks primary authority. Request/reject change intent revision without advancing Team version; acceptance changes owner, Team/directory/policy revisions and receipt atomically. Terminal same-key replay uses the original immutable digest, HTTP status and captured intent revision even after the single current intent is replaced. A former owner receives only their own original acknowledgement under freshly eligible explicit authority, never the successor's receipt or current hidden details.

## Migration safety and operations

`20261014010000_team_management` adds TeamRole, directory revision, nullable historical joining timestamps, one-slot transfer intents, receipt status/original intent revision and SQL guards/indexes. Existing admitted joins deterministically become MEMBER; unknown historical dates remain NULL. Ownerless/quarantined legacy Teams remain quarantined. There is no guessed owner repair. All eleven applied predecessor files are preserved byte-for-byte. Only the new unmerged migration was refined during verification; no applied shared database migration was edited.

Fresh disposable databases and an actual eleven-migration disposable upgrade were verified, including schema diff and migration replay. No destructive reset was used. The expression pagination index is verified through real SQL/plans because Prisma schema diff does not model that index. Deployment must apply the additive migration before starting new code. Rollback is application rollback with the additive schema retained; new role ceilings and ownership must be understood before using old binaries. Do not reverse/drop columns, erase consent history, reopen receipts, delete slots or reset budgets. Correct deployed behavior through a new forward migration. Production rollout/backups/grants remain operator work; this phase is not deployment authorization.

The database guards prove structural effect/receipt/owner/capacity invariants, not end-user authentication for privileged database operators. Runtime authorization remains the server-owned primary session fence. A database principal able to disable triggers or alter schema is outside that boundary. PostgreSQL RLS is not implemented. Receipt slots remain finite immutable lifetime admission resources; expiry compacts the retained result, never replenishes slots. No purge or unlimited ledger is introduced. Consent state is bounded to one current slot per Team; original completed receipts preserve minimal replay acknowledgements.

## Verification results

Commands used pinned installed tooling and `bun install --frozen-lockfile` (unchanged lockfile). All integration databases were disposable and cleaned by their fixtures; existing application databases were not reset. Full command logs are summarized by the counts below; executable harnesses and checked-in evidence allow reproduction.

| Gate | Result |
| --- | --- |
| Frozen install; Prisma generate/validate | PASS; no dependency upgrades |
| Backend architecture/typecheck, lint, unit tests, API/worker build | PASS; unit 101 tests / 265 assertions |
| Real PostgreSQL/Valkey/HTTP Team management | PASS; 30 tests / 803 assertions, including fresh/upgrade/diff, SQL, races, expiry, replay, admission and performance |
| Existing Team foundation | PASS; 33 tests / 772 assertions |
| Tenancy | PASS; 35 tests / 135 assertions |
| Auth fences | PASS; 24 tests / 134 assertions |
| Workspace foundation + membership/invitations | PASS; 65 tests / 1,871 assertions |
| Sessions / authentication | PASS; 31 / 473 and 26 / 827 |
| Password recovery / email verification | PASS; 18 / 421 and 16 / 468 |
| Basic database integration | PASS; 2 / 5 |
| Backend/Team generated contracts | PASS; 4 / 39 |
| Frontend lint/typecheck and production build | PASS |
| Frontend full regression | 857 PASS, 3 existing NEXUS fixture failures; 860 tests across 60 files |
| Real Chromium FE-TEAM-01 compatibility | PASS; 1 flow / 57 assertions; screenshots under evidence directory |

Existing frontend failures are retained separately: `nexusEnterprise.test.ts:94` missing resolved blocker; `nexusEnterprise.test.ts:152` milestone graph has zero edges instead of at least12; `nexusEnterpriseValidation.test.ts:301` fan-out3 rather than expected2. No fixture or expectation was changed to hide these failures.

The existing test fixtures were adapted only for additive migration count/new columns, versioned archival, owner joins and newly authorized routes. Earlier failed fixture assumptions were corrected, then the affected suites passed. Shared CSRF behavior was preserved by correcting the DELETE test's JSON content-type. Historical generated regression artifacts are preserved in their original locations; rerun evidence is copied into this phase's directory.

## Performance evidence and remaining limitations

[Measured evidence](evidence/be-team-02/performance.json), [cross-Workspace contention](evidence/be-team-02/contention.json), [strict generated contracts](evidence/be-team-02/contracts.json), and [Chromium compatibility captures](evidence/be-team-02/frontend-compatibility/) are implementation evidence, not deployment certification. The final performance JSON contains exact sample counts, statuses, percentiles, bytes and EXPLAIN output. With 1,001 explicit joins and 120-character names, limits1/20/100 use one member selector and 52 observed statements including primary authority/model checks; returned payloads are805/6,867/32,388 bytes. The plan uses `team_membership_directory_idx` and bounded indexed membership/user joins. The total statement count is not claimed to be a single-query authorization path.


| Operation / concurrency | Samples | p95 ms | HTTP statuses | Objective |
| --- | --- | --- | --- | --- |
| directory / 1 | 1 | 42.01 | 200: 1 | met locally (250ms) |
| directory / 10 | 10 | 241.35 | 200: 10 | met locally (250ms) |
| directory / 50 | 50 | 876.51 | 200: 46, 429: 4 | exceeded (250ms) |
| management / 1 | 1 | 47.27 | 200: 1 | met locally (500ms) |
| management / 10 | 10 | 224.53 | 200: 1, 409: 4, 412: 5 | met locally (500ms) |
| management / 50 | 50 | 531.30 | 200: 1, 409: 4, 412: 4, 429: 41 | exceeded (500ms) |

Workloads at concurrency1/10/50 retain real admission and CAS/conflict errors. The directory objective250ms is exceeded at50; the management objective500ms is also exceeded at50. Results must be interpreted alongside substantial 429/409/412 rejections. Concurrency1 is a single observation, not a robust percentile distribution. Local loopback measurements do not certify production capacity, sustained throughput or global contention freedom. Deadlines and admission limits were not raised to make results pass.

No production deployment, new frontend management, orphan/legacy recovery, self-removal, automatic owner takeover, implicit invitations or Project/Issue API is included. Same-origin frontend compatibility is verified; previously documented cross-origin mutation-header limitations remain. Existing infrastructure/worker shutdown/queue timing, advisory and historical operational findings are retained, not silently declared fixed. Production grants, backups, observability and sustained multi-node load qualification remain operator/security-review work. Human security review is required before merging this implementation.
