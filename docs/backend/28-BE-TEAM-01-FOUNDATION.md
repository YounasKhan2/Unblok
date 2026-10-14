# BE-TEAM-01 — private Team foundation

Implemented for human review, **not merged or deployed**. Base: `d4b958c74d7383cd269e693745738b3534cd44af` (approved PR #39 merge). Reviewed architecture HEAD: `dbc7a0db6b8972f887521a8ffe8008f85249aa6d`. Branch: `feat/be-team-01-foundation`. The [approved architecture](27-BE-TEAM-01-ARCHITECTURE-PROPOSAL.md), merged authentication/session/Workspace contracts and security boundaries remain authoritative. The earlier PR #39 review checkpoint is complete; this implementation stops at a new human review checkpoint.

## Implemented scope and authorization

Exactly four handlers under `/api/v1/workspaces/:workspaceId/teams`: GET collection, GET `/:teamId`, POST collection and PATCH `/:teamId`. No Team membership directory/add/remove, transfer, archive/restore, recovery, purge/delete or Project/Issue routes. Later capabilities remain literal false in response contracts. Frozen frontend source, NEXUS fixtures, dependencies and lockfile are unchanged.

Only current ACTIVE Workspace ADMIN creates in an ACTIVE Workspace. Team + creator owner reference + explicit Team join + immutable mutation receipt and derived budget occupancy commit in one bounded SERIALIZABLE transaction. Owner points through the tenant-composite TeamMembership FK, not a global role or display lead. Single owner scalar and deferred composite FK prevent missing/cross-Team/foreign-Workspace ownership at commit.

Reads require fresh live-session primary fences, ACTIVE Workspace membership and explicit Team membership. ADMIN has no private discovery bypass. Lists select only authorized admitted Teams in SQL. Authorized members, including OBSERVER, may read archived Team metadata and archived Workspace metadata; no Project/Issue grant is inherited. Metadata update additionally requires the current Team owner, ACTIVE ADMIN and active Workspace/Team. Known visible action denial403; missing/foreign/quarantined scope404. Demotion/suspension/epoch revocation is never blocked by Team ownership; historical owner/join remains, mutable management freezes. Reactivation must pass fresh authority checks and no invitation creates Team joins.

Tenancy exposes only closed list/detail/create/update capabilities, registered instance/request-bound principals and entry/completion primary validation. Feature services cannot obtain raw transaction/delegate/fence evidence. Existing internal Issue persistence authorization also excludes quarantined Team ancestors. Exact handler allowlist, neutral Zod DTOs and package boundaries remain enforced. The checker now recognizes Windows absolute paths on Linux too; the existing negative Windows-path assertion passes without weakening it.

## Database and migration safety

New additive `20261014000000_team_foundation` only; all ten previous migrations are byte-preserved. It adds owner reference, explicit quarantine marker, positive BIGINT version, description/color, scoped creation index, Team receipts with bounded allocation slots and a derived budget view, plus SQL checks/triggers. Existing Team rows get owner=NULL and quarantine=true; new INSERT cannot choose quarantine or NULL owner. Admitted bindings/key/creation time are immutable. No guessed owner/backfill, production seed or cascade.

Ownerless legacy Teams are excluded from list/detail/update and receipt completion/replay, even for existing explicit members and ADMIN. Quarantine cannot be used as a downgrade escape hatch. An authoritative legacy repair protocol remains deferred. Owner eligibility is checked at creation; a permanent ACTIVE-owner constraint intentionally does not block later suspension/demotion. RESTRICT FKs retain history; the added owner/join graph restricts hard Team deletion. The older deletion regression now explicitly verifies that restriction alongside successful unreferenced Issue/project/nonowner membership/join deletions; no purge capability is created or historical SQL rewritten.

Metadata validates Unicode counts plus UTF-8 bounds, forbids NUL, preserves existing eight frontend color values and immutable uppercase keys. Changes require version+1 in SQL; no-op metadata requests can record an inert receipt without inventing a new resource version. Existing active-Project archival guard and restrictive graph remain; this phase exposes no lifecycle transition. Team insertion, membership and visibility/lifecycle changes advance Workspace policy revision; ordinary metadata remains live during paging without unnecessary authority revision invalidation.

Fresh real PostgreSQL deploy/status/replay/schema diff and an upgrade from original ten migrations pass. Upgrade seeds an ownerless Team with a real existing join, compares original checksums/completion timestamps, verifies data retained and quarantine enforced through session-bound capabilities, then checks replay/schema parity. The earlier two-migration suspended-assignee upgrade regression also remains passing. Tests create/drop only owned disposable databases; the configured application database is not reset or upgraded by these suites. Prisma diff does not certify procedural SQL, which is tested separately.

Forward-fix strategy: preserve this migration after application; repair through another reviewed additive migration. Earlier app versions have no Team business API and may be rolled back only after compatibility/privilege checks; do not edit checksums, remove migration records, auto-drop owner/receipt tables or weaken quarantine. Deployment needs backups and reviewed runtime grants without DDL/trigger ownership, consistent effect/receipt/budget/revision restore, and tested key/namespace retirement. No RLS/PITR implementation or capacity certification is claimed.

## HTTP, bounded traversal and replay

Strict Zod input/output schemas reject unknown fields and duplicate query scalars. Name1–120 Unicode characters/480 bytes; description0–2000/8000 bytes; exact frozen color palette; key2–6 uppercase alphanumeric. Name is already trimmed. Request32KiB; detail/mutation/receipt16KiB; list128KiB including envelope and bounded cursor (4KiB reserve). GET bodies reject; parser scope increases only these Team POST/PATCH bodies, preserving existing Workspace/auth limits. [Generated OpenAPI](evidence/BE-TEAM-01-openapi.json) and parity tests derive schemas from the neutral package; custom Unicode/byte refinements are documented in schema descriptions and enforced at runtime/database.

Default50/max100/min1; immutable `(createdAt,id)` ASC; ACTIVE default or ARCHIVED/ALL. At most101 SQL-visible candidates, no full scan of hidden rows/N+1, no total count or unrelated aggregates. Pages stop at full item boundaries before byte cap; continuation uses last returned tuple. Every page freshly authorizes. Team cursor domain is distinct while using the reviewed independent Workspace cursor keyring: actor/Workspace/operation/status/order/limit/policy/last tuple/key/issue/expiry bindings, <=2048 characters, <=15min. Signature and strict fields/times checked; altered/expired/retired/binding400, authorized policy-stale409. Missing scope404 precedes cursor disclosure. Traversal is live, not an export/snapshot guarantee.

Metadata GET/create/update emit the Team resource version ETag; PATCH requires strong If-Match format. Missing428, malformed400, stale412, known serialization/uniqueness/state409, admission429 with Retry-After, dependency/unknown outcome503. Existing normalized `{error:{code,message,requestId}}` remains; only412/428 mappings are added. No raw SQL/SDK detail, hidden uniqueness identity, account email or cursor is returned/logged.

Durable receipt unique(actor,Workspace,operation,key) binds actor, Workspace, canonical allowlisted body, target and original precondition using a separate Team HMAC domain over the existing independent idempotency key. Current scope/owner/role/status authorization precedes any replay result. Matching confirmed key replays even after resource version advances; changed body409; a new key with stale precondition412. Full result >=24h, then immutable tombstone409 never reexecutes/refills. Effect/receipt/budget/version changes are atomic; incomplete reservations cannot commit. Lost-response tests drop actual upstream HTTP response after commit and reconcile with the original key; no client grant or exactly-once network promise.

New receipt capacity:2000 rows/Workspace,20000/deployment **including tombstones**, <=16KiB result (<=320MiB payload budget plus bounded metadata/index overhead). Database CHECK/UNIQUE constraints bound immutable deployment and Workspace slots; admission assigns slots under a deployment advisory lock. Totals are derived from retained receipt rows through a non-updatable aggregate view. No writable counters or trigger-depth authorization remain; duplicate replay allocates no new slot. Cap/outage503 before effect, no oldest-row eviction, purge or replacement key. Existing-key authorized replay remains possible at capacity, subject to rate limits. Deployment admission adds a cross-Workspace new-receipt hotspot; operators need capacity monitoring and separately reviewed retention/expansion. No background cleanup job is added.

Valkey admission: create5/hour/account +10/hour/Workspace; metadata20/min/account +60/min/Workspace; read60/min/account +300/min/Workspace, with existing coarse ceilings. Independent operation/key namespaces,750ms existing acknowledgement bound, failures/replays consume budget, no refunds or timeout-cancellation assumption. Valkey unavailable503. Earlier Workspace/auth limits unchanged.

## Concurrency and measured evidence

Primary lock order remains sorted required users -> acting family -> Workspace -> policy revision -> deployment admission advisory lock -> receipt -> Team/joins. Existing receipt discovery is nonlocking; Team access finishes before locking stored replay. No reverse Workspace acquisition or external I/O; completion validates already-held fences. Existing2s acquisition/5s callback,1.5s lock/4s statement limits remain. Known transaction conflicts409; Team lock-timeout/unknown outcomes503; explicit same-key fresh reconciliation, no automatic effect retry.

Real held-transaction tests observe PostgreSQL lock waits for same-key HTTP work and both suspension orders. Earlier operation may finish before suspension; revocation-first denies/rolls back, then fresh request404. A waiter whose preflight finishes after first commit can legitimately replay201; conflict/timeout is not required for every schedule. Competing CAS leaves exactly one version increment/receipt effect. New receipt cap tests populate real bounded tombstones to both limits and prove no new effect, direct/nested budget-write and immutable slot-change rejection and authorized replay at full capacity. Expiry compaction commits its tombstone and denies refill. Forged/non-session principal and direct unexpected-field tests preserve closed capability boundaries.

[Query evidence](evidence/BE-TEAM-01-query-plan.json) records105 owned visible Teams, actual full Team projection EXPLAIN ANALYZE/BUFFERS, request bytes/returned rows and constant observed SELECT counts including mandatory auth/Workspace overhead. Limit1 and100 both use one Team selector. Large metadata forces byte-bounded continuation before100 rows. These local observations are not enterprise capacity, hot-tenant or deployment throughput claims; no speculative cache or denormalized aggregate was added.

## Documentation compliance and acceptance matrix

| Approved requirement | Implementation | Evidence / remaining boundary |
| --- | --- | --- |
|27 private Teams, atomic single creator owner | SQL composite owner FK, closed create capability, private selectors | Team HTTP negatives/atomic effect tests; no ADMIN bypass |
|19–26 live authority / no inherited grants | Existing session/fence lifetime and completion checks; explicit membership/owner/role | Revocation/demotion/OBSERVER/forgery tests; resource capabilities false |
|27 legacy quarantine / additive safety | Explicit marker, INSERT/binding checks, restrictive owner graph | Original ten upgrade/data/checksums; fresh11/status/replay/diff; no guessed backfill |
|24 preconditions/idempotency | Strict neutral contracts,412/428, atomic16KiB receipts/tombstones and bounded immutable slots | CAS/lost response/changed body/expiry/full-cap tests; key/restore runbooks remain operational |
|27 bounded cursor / revisions | SQL visibility, signed tuple cursor, ordered primary revision lock | Actor/query/key/expiry/status/stale negatives; live metadata continuation |
|27 limits and SQL integrity | Unicode/byte/color/key/version checks; rate counters and SQL storage slot bounds | Real SQL negatives; Valkey fail-closed/rate tests;2000/20000 real cap population |
|15 architecture / four-route scope | Scoped TeamFault/ports, exact handler allowlist and module separation | Existing53 architecture tests; generated four-operation parity; later routes denied |
| Frozen UX / NEXUS | No web source/fixture/dependency/lock changes | Web typecheck/lint/build pass;832/3 historical fixture failures |
|07 performance | Existing bounds, scoped index, one Team query and constant SELECT count | Owned105-row query/HTTP evidence; cross-tenant quota contention remains unbenchmarked |
| BE-TEAM-02 separation | No member/transfer/lifecycle/recovery/purge capability | Later endpoints absent and hints false; separate review required |

## Verification observations and remaining issues

[Machine-readable report](evidence/BE-TEAM-01-verification.json) records commands and final results, with earlier failures retained. No zero-test run is represented as verification. Full results are also in the delivery PR.

Initial checks found a long PostgreSQL index-name truncation mismatch (corrected in the new unapplied migration), controller persistence import (moved to application facade), optional-property/type narrowing and fixture updates for explicit owners. First new harness failed on a root reflect-metadata import; existing API app already owns that import. Initial anonymous POST assertion expected401 instead of existing CSRF403; split into GET401 and POST403. Known concurrency fault was initially normalized as404; corrected Team-specific409/503 mapping. A concurrent same-key waiter may validly reconcile201; effect/count assertions remain, not an invented universal conflict. HTTP response-loss harness now observes missing confirmation and actual upstream commit outside swallowed transport errors. Parallel-heavy gate runs produced intermediate session/login timing503 and headers-after-send observations; serial unchanged-deadline runs passed. No cause or reliability resolution is claimed.

Existing architecture Windows-absolute-path test initially failed on Linux; checker now rejects both platform path syntaxes. Session HTTPS test initially failed on a hard-coded Windows OpenSSL path; existing BE00H_OPENSSL=/usr/bin/openssl override passes the unchanged CA/HTTPS assertions, no TLS relaxation or test skip. Web has no separate typecheck script: lint:web already runs tsc --noEmit; an attempted typecheck command failed as absent and is not counted as a pass.

Initial lifecycle command used old foundation-only local configuration and exited before readiness. Owned fully migrated database plus ephemeral independent required secrets then passes API readiness/SIGTERM and failure-redaction, but **worker SIGTERM still exits143**. That failure, prior cross-platform shutdown observations, historical queue timing/between-test errors and the unchanged deepmerge-ts/Prisma high advisory remain open. Infrastructure5/5 on this host does not establish reliable scheduling. Frontend three NEXUS fixture failures remain: missing resolved blocker, empty milestone graph and fan-out3>2; no expected values/fixtures altered.

No deployment, production TLS/proxy/cookie/mail validation, global budget contention/load capacity, automatic receipt retention expansion/purge, authoritative legacy-owner repair, orphan recovery, Team management/transfer/lifecycle, fine-grained Project/Issue grants or frontend Team integration is delivered. Stop at human review; do not merge or begin BE-TEAM-02.

### Original reviewed local gates (4168de9)

| Gate | Result |
| --- | --- |
| Frozen install, backend typecheck/lint/API+worker build | Passed; architecture411 sources/1125 edges/zero violations |
| Team real PostgreSQL/Valkey/HTTP, caps/concurrency/migrations |30 passed,704 assertions |
| Existing backend including architecture |101 passed,265 assertions (53 architecture tests) |
| Workspace foundation / invitations |29 /36 passed |
| Authentication / sessions / fences |26 /31 /24 passed; sessions uses existing Linux OpenSSL override |
| Tenancy and original-two upgrade |34 passed,132 assertions |
| Email verification / password recovery / database integration |16 /18 /2 passed |
| Infrastructure |5 passed; historical timing reliability remains unresolved |
| Live generated Workspace/invitation/Team contracts |3 passed,31 assertions |
| Prisma validation/generation, fresh11 deploy/status/replay/diff, original-ten upgrade | Passed; prior SQL/checksums/data preserved |
| Enterprise contract design validator | Passed; design-only validation, not runtime certification |
| Frontend typecheck/lint/build | Passed; no frontend source or fixtures changed |
| Frontend tests |832 passed/3 established NEXUS failures |
| Built lifecycle with owned DB/keys |2 passed/1 failed; worker SIGTERM143 |
| Dependency audit | Existing deepmerge-ts high GHSA-ggr8-5vv4-36mx remains; packages unchanged |

Existing CORS still excludes Idempotency-Key/If-Match from cross-origin browser preflight. Mutations require reviewed same-origin delivery; no header allowlist/session/proxy policy was relaxed. A future frontend Team slice must preserve frozen UX and explicit NEXUS separation.

## PR #40 F1 — remove trigger-depth budget authorization

Reviewed HEAD: `4168de9b6141a1947de7e85a76cab1d12700ba15`. Trigger nesting depth was an invalid authorization boundary. The correction removes both the writable budget table/model and `guard_team_budget()`; `pg_trigger_depth()` is not used. No production endpoint, auth/frontend/NEXUS behavior or product limit changes.

Each receipt now has immutable deploymentSlot in1..20000 with global UNIQUE, and workspaceSlot in1..2000 with UNIQUE(Workspace,slot). NOT NULL/CHECK/UNIQUE constraints prove hard cardinality caps independently of allocator scheduling. Admission takes a database-scoped transaction advisory lock using the fixed Team admission namespace, then allocates indexed MAX+1 slots. It overwrites any caller-supplied slot values. Receipt DELETE/TRUNCATE and slot UPDATE remain forbidden. Reservations and slots disappear together on rollback or deferred completion failure; retained/tombstone rows keep their slots forever. There is no independent counter state to reset, increment, delete or drift.

`team_receipt_budgets` is now an aggregate UNION view over receipts, not a Prisma table/model or public capability. PostgreSQL rejects direct UPDATE/INSERT/DELETE on it, including nested unrelated triggers. Admission does not consult the view: changing an informational view definition cannot remove receipt CHECK/UNIQUE caps. Privileged DDL can always drop constraints/replace triggers; runtime roles must continue to lack ownership/DDL privileges. This is not database-login authorization or RLS. Valid direct SQL receipt insertion still invokes admission and all receipt/slot/FK/completion constraints; it does not confer HTTP authority.

Lock order is unchanged in direction: sorted user/family -> Workspace -> policy revision -> deployment admission advisory lock -> receipt -> Team/joins. Only new receipt INSERT acquires admission; authorized existing-key replay/expiry compaction skips it and can succeed at capacity. No earlier user/Workspace lock is acquired by the allocator. Cross-Workspace allocation can wait; a preexisting SERIALIZABLE snapshot may allocate a now-occupied slot and receive a uniqueness/serialization rollback. Unconditional UNIQUE constraints prevent duplicates/overrun; fresh same-key authorized reconciliation remains required. SQL errors do not consume a slot. Existing lock/statement/transaction deadlines are unchanged; no load/absence-of-deadlock claim is added for arbitrary privileged maintenance.

Only the new, unmerged eleventh migration is amended under the explicit review instruction. The first ten applied migrations remain byte-preserved. The selected existing application database has no applied Team migration and was not changed. Fresh installations, original-ten upgrades with preserved data/checksums/timestamps, original-two regression upgrades and Prisma schema parity are verified. If an external database already applied the reviewed eleventh checksum, do not deploy edited history over it: retain that database's history and use a separately reviewed forward repair, or recreate only an explicitly owned disposable test database. No existing database reset or silent checksum resolution is authorized.

F1 evidence includes direct counter reset/increment/insert/delete refusal; two-level unrelated nested-trigger writes; immutable slot-update refusal; caller slot override; explicit rollback/division-by-zero with unchanged occupancy and no allocation gap; real cross-Workspace advisory wait and unique receipts; both hard caps filled with retained tombstones; replay at capacity; original SQL/HTTP/private authority/CAS/lost-response/expiry suites. [Admission query plans](evidence/be-team-01/F1-admission-query-plans.json) show the global and scoped unique slot indexes used for MAX allocation without count-all admission scans. [Correction report](evidence/be-team-01/F1-verification.json) preserves actual gates and limitations; original phase evidence is retained.

No BE-TEAM-02, production deployment or implementation-PR merge is authorized. Stop for another human review.

Final F1 gates: Team33 passed/772 assertions; backend101; Workspace29; tenancy34; authentication26; sessions31; auth fences24; generated contracts3. Backend typecheck/lint/build, Prisma generate/validate, fresh and both upgrade/replay/schema checks, allocation query plans and documentation/design/scope checks passed. Existing untouched failures remain historical evidence, not newly certified.
