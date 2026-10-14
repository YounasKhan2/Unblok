# BE-TEAM-02 — Membership, ownership and lifecycle proposal

**Conditional architecture approval applied — final review required; documentation only.** Base: FE-TEAM-01 merge `f65d9b0603cd76c243afb34cf59155bfa0c32a64`, 2026-10-14. This document grants no implementation, migration, endpoint, frontend or recovery authority.

## 1. Reviewed implementation and applicable requirements

Sources: [backend index](00-README.md), [domain](14-BE-00C-DOMAIN-TENANCY.md), [module boundaries](15-BE-00D-MODULE-ARCHITECTURE.md), [auth fences](19-BE-00G-AUTH-REVOCATION-FENCES.md), [sessions](20-BE-00H-SESSION-INFRASTRUCTURE.md), [enterprise contracts](24-BE-API-00-ENTERPRISE-CONTRACTS.md), [Workspace membership/invitation implementation](26-BE-WS-02-MEMBERSHIPS-INVITATIONS.md), [approved Team split](27-BE-TEAM-01-ARCHITECTURE-PROPOSAL.md), [actual Team/F1 implementation](28-BE-TEAM-01-FOUNDATION.md), and [merged frontend integration](../frontend/04-FE-TEAM-01-INTEGRATION.md).

Code inspected: Prisma Team/TeamMembership/TeamMutationResult; Team selectors/projection and receipt digest in packages/database/src/teams.ts; the eleventh Team migration; existing session-bound Tenancy and sorted-user fences; API Team handlers/contracts; live Team store/journal/dialog and frozen demo controls. The existing owner points through TeamMembership to a Workspace membership. TeamMembership has no role or joining timestamp. Owner binding is currently immutable. Later capability flags are literal false. Existing Project archival guard, Workspace policy revisions and receipt slots are real enforcement, not proposed writable counters.

Authoritative defaults retained: private explicit members; creation only ACTIVE Workspace ADMIN; exactly one explicit owner; management requires eligible Workspace ADMIN **and** that Team's ownership; Workspace OBSERVER read-only; no Project/Issue inheritance; inactive Workspace membership denies; archived metadata readable only to authorized members; no cascade; security revocation never blocked by owner loss; ownerless legacy Teams quarantined. Earlier design examples do not override the merged F1 design: immutable globally/scoped unique receipt slots and a derived non-updatable budget view.

Requirements checklist before implementation: approve section2 decisions; pin reviewed architecture HEAD; define closed capabilities/strict neutral schemas; prove owner/revision/receipt invariants with additive SQL; preserve all11 migrations; demonstrate real concurrency and revocation orders; validate bounded selectors and generated contracts; retain frontend/demo boundaries and historical failures. No approved default is replaced here.

## 2. Approved policy choices and retained boundaries

Human review of PR #42 HEAD `beceb8f229f056f9d5ff1104af756bdc5a60b491` approved these choices. They are architecture decisions, not merge or implementation permission. Numeric consent bounds and detailed contracts below are submitted for final architecture review.

| Policy | Approved behavior |
| --- | --- |
| Team roles | MEMBER/OBSERVER ceilings only; no manager role, Workspace promotion or inherited Project/Issue permission. Workspace OBSERVER remains read-only. |
| Existing joins | Deterministic MEMBER backfill for admitted joins; no guessed owner or legacy repair. Quarantined Teams remain inaccessible. |
| Addition | Eligible owner directly adds an existing ACTIVE Workspace membership UUID with explicit Team role; no Workspace invitation, contact lookup or implicit enrollment. |
| Transfer | Existing eligible explicit Team MEMBER and ACTIVE Workspace ADMIN successor must explicitly accept a bounded owner-issued request; no immediate transfer. |
| Directory | Eligible owner only, no emails. Archived Team directory remains readable by eligible owner in ACTIVE Workspace; membership writes remain closed. |
| Self-removal | Deferred; no leave endpoint or grant. |
| Owner loss | Management freezes; suspension/demotion/revocation always proceeds. |
| Recovery | Orphan and legacy recovery excluded from this milestone; no takeover or repair endpoint. |
| Inert operations | Terminal idempotent200, no Team version increment; still allocate an admitted receipt for a new key. |
| Former-owner replay | Only minimal own transfer acknowledgement, with fresh authority and original-receipt binding; no current Team projection or new mutation grant. |
| Admission/performance | Shared20/min/account and60/min/Workspace management budget; latency targets are measurable objectives, never pre-certified guarantees. |

An OBSERVER ceiling for the current owner is rejected; transfer must complete first. Workspace role demotion remains allowed and freezes management regardless of Team ceiling. User/account/Workspace ownership are never guessed from joins. Consent grants exactly one named successor transfer under current primary checks, not reusable management authority.

## 3. Proposed action matrix and revocation

All actions need live request-bound account/session primary fences, enabled account, current ACTIVE Workspace membership, explicit Team join and nonquarantined Team. Hidden/foreign/quarantined Team returns generic404 before target, version or receipt disclosure. Visible unauthorized action403. Workspace ADMIN nonmember gets no list/detail/directory/management access.

| Action | Eligible ADMIN owner | Explicit nonowner ADMIN/MEMBER | Workspace or Team OBSERVER |
| --- | --- | --- | --- |
| Own active/archived Team metadata | Allow existing read | Allow existing read | Allow read |
| Member directory | Owner-only; ACTIVE Workspace, active or archived Team | Deny | Deny |
| Add/remove/change Team ceiling | ACTIVE Workspace and Team only | Deny | Deny |
| Request transfer | ACTIVE Workspace/Team; eligible explicit successor | Deny | Deny |
| Accept/reject addressed request | No acceptance on behalf of successor | Exact addressed eligible ADMIN/MEMBER successor only | Deny |
| Archive | ACTIVE Workspace/Team; no ACTIVE owned Project | Deny | Deny |
| Restore | ACTIVE Workspace; archived Team; current eligible owner | Deny | Deny |
| Project/Issue/Dependency operations | No inherited grant | No inherited grant | No inherited grant |

Suspension, INVITED status, join removal, account disablement, logout/epoch/family revocation deny fresh access/replay. Removal does not revoke the target's entire Workspace session or unrelated Teams. Reactivation of retained joins requires fresh authority; removed joins never reappear automatically. Workspace invitations create no Team joins. Already-delivered bytes cannot be recalled. An earlier transaction may commit before a conflicting revocation; revocation-first must deny/roll back. Never hold authorization across requests/pages.

Transfer retains outgoing owner's ordinary join and ceiling; authority to manage ceases atomically. Owner removal, owner-ceiling downgrade and transfer-to-nonmember/ineligible target reject generic409 after authorized scope. No last-owner rule may veto Workspace/account security actions.

### Owner-loss and recovery policy proposal

Distinguish an admitted Team with an ineligible retained owner from a quarantined legacy Team with unknown ownership. Neither state grants another ADMIN access. Initial BE-TEAM-02 permits no repair. Existing authorized members may request review for a specific known UUID; no orphan list, guessed owner, first-member election or automatic lifecycle change is allowed.

A later recovery protocol should require independently verified authority over that exact Team, an eligible existing explicit ADMIN successor, recorded reason and immutable evidence references, independent approver separation from requester/successor, bounded expiry and fresh primary checks at execution. Prefer current owner's informed consent where available. Loss of consent/access is not proof that takeover is authorized: emergency recovery needs a separately approved governance rule. Quarantined legacy repair additionally requires authoritative historical ownership evidence; ordinary membership is insufficient.

Execution must atomically validate approvals against current owner/version/membership/revocation state, assign the exact approved successor without promoting Workspace role, preserve prior owner history, advance revisions and commit an immutable bounded audit/recovery receipt. Replayed approvals cannot authorize another Team/successor or revive revoked privileges. No external verification occurs under SQL locks. Retention, approver authority/privacy, break-glass conditions, appeal/reversal, notification and abuse/rate budgets require human decisions. Durable business audit and recovery infrastructure are not implemented; application logs are not substitutes. Until those prerequisites and their real security/concurrency tests are separately approved and implemented, leave management frozen.

## 4. Proposed API contracts under approved policies

Under `/api/v1/workspaces/:workspaceId/teams/:teamId`; UUID paths. These are proposed contracts, **not registered endpoints**. All mutations require CSRF/Origin, Idempotency-Key, strong Team If-Match, private no-store and durable atomic results. Strict allowlists reject actor/owner/Workspace authority fields, bulk bodies and unknown keys.

| Method / suffix | Input | Proposed output |
| --- | --- | --- |
| GET `/memberships` | limit default20/max100; after; optional ACTIVE/SUSPENDED/INVITED/ALL Workspace-status filter | MemberPage, authorized owner projection; no totals/search/email |
| POST `/memberships` | membershipId; teamRole MEMBER/OBSERVER |201 member mutation result, Team version/ETag; direct addition |
| PATCH `/memberships/:membershipId` | teamRole MEMBER/OBSERVER only |200 member mutation result + Team version; no Workspace role change |
| DELETE `/memberships/:membershipId` | no body |200 minimal mutation acknowledgement + Team version |
| POST `/ownership-transfer-requests` | successorMembershipId only |201 minimal immutable RECORDED acknowledgement with requestId; GET supplies current request metadata; no ownership change |
| GET `/ownership-transfer-requests/:requestId` | no body |200 exact current request, current eligible owner or exact addressed eligible successor only; former initiator uses own minimal receipt acknowledgement |
| POST `/ownership-transfer-requests/:requestId/accept` | empty strict body |200 minimal ACCEPTED acknowledgement + committed Team version; successor alone |
| POST `/ownership-transfer-requests/:requestId/reject` | empty strict body |200 minimal REJECTED acknowledgement; successor alone |
| POST `/archive`, `/restore` | empty strict body |200 Team metadata/version/capabilities |

Member item proposal: membershipId, displayName, workspaceRole, workspaceStatus, teamRole, isOwner, joinedAt nullable for historical unknown. Do not expose global user identity/credential email. No Project data is included. Result envelopes are operation-specific neutral DTOs, not ORM rows. DELETE acknowledgement contains no removed member details. GET does not return Team roles as authority evidence.

Errors follow BE-API-00: malformed400, global unauthenticated401, visible denial403, hidden404; authorized conflict409; stale If-Match412; missing428; rate429 with Retry-After; dependency/unknown commit503; input excess413. Authorization precedes precondition/target eligibility/receipt disclosure. Generic invalid-successor/conflict errors reveal no foreign account or hidden Team facts. Invalid/expired/binding cursor400; authorized stale-policy409 CURSOR_STALE. No automatic retry/rekey or status-based role inference.

New different-key add of an existing identical join is an authorized inert200 (not201), no new version; differing ceiling conflicts409, use explicit PATCH. Remove already-absent nonowner is inert200 after management authorization; owner removal always rejects. Same desired role/lifecycle state is inert200 when current management authority and parent state allow it. Transfer-to-self rejects409. Each admitted inert mutation still needs a terminal receipt; no extra admission bypass.

### Transfer-consent lifecycle and bounds

One current intent slot per admitted Team; at most one PENDING request. Request IDs are server UUIDs, not bearer proofs. TTL15minutes from server database time; no renewal, email token, list/search, background job, unbounded consent ledger or recovery route. A request records exact tenant/Team, initiating owner membership/user, successor membership/user, base Team version, Workspace policy revision, both user revocation epochs, originating owner family fence, issued/expires times and intent revision. Internal fence facts never appear in DTOs or logs as authorization evidence. Transfer request GET projection: requestId, Team id, state, expiresAt, baseTeamVersion, intent revision and minimal authorized membership bindings; no emails, account IDs, unrelated members or hidden resource expansion.

States: PENDING -> ACCEPTED, REJECTED, EXPIRED or INVALIDATED. Terminal states never become PENDING. A new request receives a new UUID after the current slot is terminal; prior consent is never reused. The current slot may be replaced only by an eligible owner's explicit new request under fresh CAS, authorization, terminal receipt and row lock. Retained immutable receipts bind historical request IDs independently; no FK may force an unbounded history of replaced intent rows. Old replaced IDs give generic404 on GET/action, except an authorized matching historical receipt may return its minimal original acknowledgement within retention.

Creation validates current owner and eligible successor under sorted primary fences. Owner and successor are distinct; successor is already an explicit Team MEMBER, enabled account, ACTIVE Workspace ADMIN. No add/promote/unsuspend side effect. Current pending request for the same successor is inert200 only if unexpired, uninvalidated and its original version/policy/fences still match; another successor conflicts409. No silent replacement or expiry extension. Expired/invalidated pending slot can be terminalized and replaced atomically by an explicit new request. No cancel/reassign endpoint in this milestone.

Request/reject change intent state/revision but do not change Team version, membership or owner; request captures the current Team version. Accept changes owner exactly once, retains both joins and their roles, increments Team version once and advances directory/Workspace policy revisions atomically with intent ACCEPTED and terminal receipt. Request/reject retain current Team If-Match requirements; mutations also bind the path/request ID and server intent revision in the receipt digest without trusting client intent state. Successor acceptance is explicit; a current owner cannot accept for another actor.

At accept, acquire fresh acceptor authority and validate the original owner's durable family/epoch authority plus both users' enabled/epoch state, current Workspace/Team status, exact owner, both current memberships/roles/joins, request target/binding, expiry and base version/policy under primary locks. No retained principal or target cookie is invented. Owner logout/family expiry, either user's security revocation, owner loss, successor suspension/demotion/join removal/ceiling downgrade, Team lifecycle or intervening Team version/Workspace policy change invalidates the consent. Reactivation never revives it; owner must issue a fresh request. Workspace revisions are deliberately conservative, including unrelated policy changes. Both role/epoch facts and recorded revisions are checked; a status restored before acceptance cannot mask an intervening revision.

Team/owner changes do not require scanning all intent rows: one locked slot/Team plus current version/revision/fences suffices. Expiry is effective at `database_now >= expiresAt`; GET derives EXPIRED/INVALIDATED without writing or reserving a receipt. An attempted action reports generic409 for a visible expired/invalidated request after current authority. Acceptance with a stale supplied Team If-Match gives412 before intent conflict; a refreshed If-Match does not bypass the request's original base-version binding. Forbidden current scope returns403/404 first. Do not mutate the slot then throw a transaction error expecting that terminalization to persist; expiry/invalidation is derived until a successful replacement or other terminal write commits.

Reject is available only to the addressed, currently eligible explicit successor in active Workspace/Team, with fresh original request bindings and no ownership effect. Reject/accept race serializes on the current intent and Team: one terminal decision wins, the competing action409, never accept after rejection. Expiry race is decided at the final database-time validation before the atomic effect; an expiry already effective before completion rolls back. Existing transaction deadlines remain. A repeated same terminal decision with another key is inert200 only for the exact original decision actor, under its narrow replay/read authority and historical decision binding; different-key opposite decision conflicts409. Removed/inactive actors receive404 regardless of historical consent.

Each request, accept and reject has a separate operation-scoped durable receipt sharing the existing global/Workspace slot caps. An acceptance acknowledgement contains only requestId, ACCEPTED and the committed Team version, not owner/member projections. The request-creation response and stored receipt are always the same minimal `{requestId, outcome: RECORDED}` acknowledgement, with no successor projection or mutable PENDING state. Its replay after acceptance confirms recording only, never proves transfer completion. GET obtains current request state under its separate visibility grant. The original initiator may reconcile that own receipt after losing ownership, using the approved former-owner minimal-acknowledgement boundary; they cannot read the successor's acceptance receipt. An acceptance receipt belongs to its actual successor actor, not to the previous owner, and records the immutable accepted request/initiator/successor bindings. If that accepting actor later becomes a former owner, only their own matching acceptance acknowledgement is replayable. Acceptor remains eligible current owner for ordinary acceptance replay; subsequent ownership loss permits only the same approved minimal former-owner acknowledgement under section6, without reading the current intent or its replacement. Request/reject historical acknowledgements use similarly narrow original-actor binding and fresh ACTIVE Workspace ADMIN/Team MEMBER access; they grant no directory or management capability. These receipt exceptions do not authorize another key to repeat a completed transfer.

### Privacy and error precedence

| Actor/state | Request GET / addressed decision | Management/directory | Response boundary |
| --- | --- | --- | --- |
| Unauthenticated/revoked session | Deny | Deny |401; CSRF/Origin gate retains existing precedence on unsafe requests |
| Foreign/hidden/quarantined Team, inactive Workspace membership or no explicit join | Deny without request existence lookup disclosure | Deny | Generic404, including receipt replay |
| Eligible current owner | Exact own/current request read, request initiation; cannot decide for successor | Approved owner actions; archived directory read only | Non-addressed decision403 only after authorized request visibility |
| Addressed eligible successor | Exact request read/accept/reject in active scope | No inherited management/directory | No request list, lookup or owner privilege until committed acceptance |
| Unrelated explicit member, including ADMIN | Deny request discovery/decision | Deny directory/management | Request404; visible Team action403 |
| Archived Team | Authorized owner may read current/terminal request metadata; decisions closed | Owner directory read, no membership mutations; restore only | Visible forbidden decision403; stale consent cannot be revived by restore |
| Archived Workspace | Existing authorized Team metadata only; new request/directory grants closed | No new management/directory action | Visible denial403, no restoration side effect |
| Exact visible expired/invalidated/competing terminal request | No effect | No hidden target details |409 after current authorization and supplied precondition checks |
| Authorized missing/stale precondition | No effect | No effect |428/412; malformed400; reloading never renews consent |
| Dependency/capacity/unknown commit | No presumed cancellation | No effect confirmation |503; original key/body/If-Match retained; admission429 with Retry-After |

Input syntax/size and transport gates may reject before domain authorization; never perform a hidden target query to produce an error detail. Domain order for fresh effects: current scope/request visibility -> exact actor/action grant -> authorized matching receipt replay -> precondition -> current consent/target eligibility/expiry -> atomic effect. Historical acknowledgement replay is a distinct path: fresh account/Workspace/explicit-Team authority -> exact receipt actor and original request/decision binding -> original digest/key match -> minimal immutable result. It does not require the replaced intent to exist or disclose its replacement. Neither path bypasses missing/inactive/foreign scope or original-key authorization. Current state does not overwrite an old minimal confirmed result; elapsed full-result retention returns immutable expired409. Directory and request metadata do not expose arbitrary Workspace candidates; existing authorized Workspace directory remains the only candidate source.

## 5. Additive database constraints and migration plan

Preserve all11 applied migrations and BE-00B history. A new reviewed additive migration adds a MEMBER/OBSERVER TeamRole enum and TeamMembership ceiling, joinedAt nullable with no fabricated historical times, and a Team member-directory revision. Database storage for the current-intent slot is bounded by the number of admitted Teams; historical per-request results exist only in capped immutable receipts. Fresh joins receive server timestamps. Stable ordering uses `(COALESCE(joinedAt, '-infinity'), membershipId)` with an explicitly tagged legacy-unknown cursor segment; DTO keeps null. Test this ordering before indexing. Backfill every admitted existing join deterministically MEMBER; do not infer joining timestamps or ownership. Quarantined joins may retain nullable role under a closed quarantine check or receive nonauthorizing MEMBER storage values, but never become admitted; choose the simpler compatible storage default MEMBER with quarantine still authoritative.

Retain tenant-composite PK/FKs, exact single-owner scalar and deferred owner-to-join FK, restrictive deletion, immutable key/createdAt/quarantine, metadata bounds, positive versions and no cross-Workspace joins. Replace the specific owner-immutability and completion/revision enforcement functions through additive migration to permit closed transactional transfer; never disable triggers or edit history. SQL proves final owner has an explicit join and MEMBER ceiling, with deferred final-state checks on owner and Team role changes; it must not introduce a constraint on Workspace ADMIN/ACTIVE status that vetoes revocation. Eligibility ACTIVE ADMIN/enabled account is checked under transaction fences at transfer, never a permanent CHECK that blocks later suspension/demotion.

Role/owner/join/lifecycle changes increment Team version once for an actual change and affected directory/Workspace policy revisions atomically. Inert operations do not manufacture a version. Removal of a nonowner deletes only its join, not Workspace membership/account or Project/Issue history. Owner join deletion cannot commit. Archive does not delete joins or cascade to Projects; reject any ACTIVE owned Project. Restore never restores Projects/Issues or suspended memberships; reject archived Workspace.

Add one current transfer-intent row keyed by (Workspace,Team) with a unique current request UUID, tenant-composite restricted Team/membership references, distinct initiator/successor checks, valid state/revision/TTL bounds and positive base Team version. Bind internal source family/user epochs through server-owned durable fence references; FK retention must not block security revocation or family retirement markers. Guard immutable bindings within a request, legal terminal transitions and no consent renewal. Request replacement atomically replaces the bounded slot with a new UUID only after prior terminal/derived expiry/invalidation; old receipts retain original decision facts independently. Index exact current request lookup scoped by Workspace/Team; no user-wide hidden request inbox or full intent scan. No historical transfer-intent collection or automatic cleanup job is introduced.

Receipt operation enum/checks/digest/result completion must extend additively for member add/remove/role, transfer request/accept/reject and archive/restore without changing historical digests or slots. Do not drop constraints, rewrite receipts, purge tombstones or introduce new writable budgets/trigger-depth authorization. Historical create/metadata operation IDs, HMAC domain/canonical digest bytes, target/precondition bindings, result shape and slot assignments remain byte-compatible. Keep old completion paths distinct from new ownership/consent outcomes; a new owner must not gain access to another actor's old receipt. Old-owner metadata replay still needs current management authority and cannot use the transfer acknowledgement exception. Test both full and compacted historical receipts after upgrade, changed-body refusal and old keys at full capacity; no rewriting stored digests/results to a new version.

Existing `/api/v1` Team detail/page/create/metadata DTOs retain literal-false later capability hints so merged FE-TEAM-01 strict decoders continue to work. New owner-only management/request/member operation DTOs have their own strict schemas and do not repurpose existing fields. New clients use these explicit routes after phase approval; any future change to v1 detail capability booleans requires a separate compatible frontend/contract rollout. Do not silently return new true flags to old clients.

Fresh install,11-to-next upgrade with retained owners/joins/receipts/quarantine, checksum/timestamp preservation, deploy/status/replay/diff and SQL invariants are mandatory. Inventory existing joins and unknown timestamps first. Forward repair preferred. App rollback requires old-client/server schema/trigger compatibility; do not auto-drop new fields/results or reset existing databases. Runtime roles lack DDL/trigger ownership; no RLS or backup/PITR implementation is claimed.

## 6. Concurrency, receipts and pagination

Discovery grants no authority. Discover immutable target membership/user bindings first; bounded actors/targets only. Acquire sorted required user fences -> required initiating/acting families sorted by stable family ID -> Workspace -> Workspace policy revision -> deployment receipt admission advisory lock (new receipt only) -> receipt -> Team -> current transfer-intent slot -> affected joins in stable membership UUID order -> required Project integrity locks. Current Team implementation already includes policy revision before F1 admission; use this actual order rather than older proposed writable-budget diagrams. No user/Workspace lock after admission. If a binding changes or a new user is discovered, abort and restart the complete authorization boundary, not reverse acquisition. No target session is fabricated. Completion checks held fences; no external consent/mail/Valkey call inside SQL transaction.

Keep SERIALIZABLE,2s acquisition/5s callback,1.5s lock/4s statement,750ms existing Valkey acknowledgement bounds. Future Project creation/restore must obtain the same Workspace/Team integrity locks before active child insertion. Existing SQL guard remains authoritative; bounded existence query on ACTIVE Project index, no all-child enumeration. Measure lock waits before narrowing conservative Workspace locking. Unknown commit503 is not cancellation; known serialization/deadlock409. No automatic side-effect retry.

Reuse immutable receipt slots:2000/Workspace and20000/deployment including tombstones; independent operation/version domain binding over canonical body, target and original If-Match. Effect, owner/join/version/revisions and terminal receipt commit together. Authorized same-key replay checks current policy before disclosing result, skips new capacity and reconciles original precondition. Current-owner authority is lost after transfer: allow outgoing actor replay only a minimal acknowledgement of their own successful transfer, requiring current ACTIVE Workspace ADMIN membership, enabled account/live session and retained explicit Team join, original receipt actor/request/decision binding and no current resource projection. This narrow replay policy is approved; it applies only to the original transfer receipt actor and committed request/decision binding, never old metadata or a new transfer effect. It also requires current Team MEMBER ceiling; OBSERVER downgrade denies replay. Removed/inactive actor gets404. Inert remove replay does not require the removed target to exist.

Full result minimum24h, then immutable expired409 tombstone, never reexecute. Same-key changed input409. No eviction or independent new ledger per endpoint that multiplies caps. At capacity matching authorized replay remains possible subject to existing rate limits. SQL errors/rollback release only uncommitted slots; Valkey attempts are not refunded. Restore effect/receipt/revisions together; no purge approval.

Directory SQL scopes by Workspace/Team and current owner authorization before pagination. At most101 visible candidates, byte-bounded output128KiB, no N+1/contact lookup/full hidden scan. Signed cursor <=2048 characters/TTL<=15min binds actor, Workspace, Team, operation, canonical filter/order/limit, directory and policy revisions, unknown-time segment/tuple and key/time/version. Each page freshly authorizes. Owner transfer/removal/status/role changes stale or deny as appropriate; no snapshot/export promise. Rotation and key failure follow existing independent Workspace keyring with distinct operation domain. No client role, decoded cursor or ADMIN directory access establishes Team permission.

## 7. Acceptance and performance gates

Approved aggregate management admission:20 attempts/min/account and60/min/Workspace shared across add/remove/role/transfer request/accept/reject/lifecycle, not one budget per endpoint; existing read60/min/account and300/min/Workspace and coarse ceiling retained. No bulk operation. Request <=32KiB; single result/receipt <=16KiB; directory <=128KiB. Measure these initial approved budgets under contention; no capacity certification or premature caching/denormalization.

| Requirement / acceptance | Required real evidence |
| --- | --- |
| Privacy/action matrix | ADMIN nonmember, explicit nonowner, OBSERVER, inactive/foreign membership, colliding tenant IDs, hidden/quarantined targets; owner directory privacy and no unsupported routes |
| Add/remove/ceiling | Duplicate/inert semantics, owner protection, no Workspace promotion/implicit invitation join, no contact enumeration, deterministic legacy-null order |
| Transfer | Explicit authenticated addressed acceptance; owner cannot accept for target; ACTIVE ADMIN + Team MEMBER eligibility at request and accept; no owner change at request; original owner family/epochs rechecked; no double owner |
| Consent state/bounds | TTL boundary before completion, derived GET expiry/no write, reject vs accept, same/opposite terminal decision, single pending slot and successor conflict, replacement/new UUID, old ID404, no revival after suspend/reactivate/archive/restore/policy change |
| Consent concurrency | Two accepts, reject/accept, new request/replacement vs old accept, owner loss/logout/family expiry, target removal/role downgrade, two successors, metadata CAS and Workspace policy update in both primary-lock orders |
| Owner loss/recovery exclusion | Demotion/suspension/disable always succeed, management freezes, reactivation fresh checks, legacy quarantine retained; no recovery endpoint/grant |
| Lifecycle | Archive vs ACTIVE Project creation/restore in both orders, no cascade, archived Workspace refusal, metadata read/private status filter, restore no child/member resurrection |
| CAS/receipts | Missing428/stale412, same-key concurrent requests/body conflict, actual lost response, rollback/SQL error, original precondition replay, transfer replay policy, full caps/tombstones, admission shared across all consent actions, former-owner minimal replay vs forbidden metadata replay and old receipt compatibility |
| Revocation/locks | Observe actual PostgreSQL waits and both success-before-revocation/denial-after orders; no reverse acquisition; enforce unchanged deadlines, principal completion and outage fail-closed |
| Paging/performance | EXPLAIN ANALYZE/BUFFERS real projections at1/20/100; one member selector, bounded candidates/bytes and constant business query count; stale/binding/expiry/rotation negatives |
| Migration/contracts | Fresh and retained11-migration upgrade, procedural negatives/checksums/diff, neutral strict schemas/generated OpenAPI, unchanged old frontend literal-false DTO compatibility; deterministic MEMBER backfill and bounded single-slot consent enforcement |
| Regression/scope | Frozen install; backend architecture/typecheck/lint/test/build; PostgreSQL/Valkey/HTTP auth/session/fence/Workspace/invitation/tenancy gates; frontend lint/tests/build; NEXUS unchanged |

Benchmark at1000 explicit joins and realistic maximum metadata, including multiple active Workspaces contending on receipt admission. Report p50/p95/p99 latency, selector/total SQL counts, rows inspected, bytes, lock/admission waits and errors at declared concurrency1/10/50. Proposed local target for uncontended directory p95<=250ms and management p95<=500ms excluding network; targets remain measurable objectives requiring actual workload measurements, not guarantees or invented pass claims. Do not raise deadlines/limits to meet them. Document query/index choices and workload/hardware; investigate regressions before adding caching. Production scale/load acceptance is separate.

## 8. Review boundary and compliance

No runtime/schema/frontend/dependency changes in this PR. Proposal satisfies the reviewed source checklist through sections1–7; the acceptance table maps each security/domain/contract requirement to future evidence, not executed tests. The approved choices in section2 are applied. Final review covers the bounded consent TTL/current-slot lifecycle, exact actor/replay and error matrix, additive enforcement/compatibility design and acceptance evidence below. Orphan/legacy recovery and self-removal remain excluded, not pending implementation grants. No merge or implementation authority follows from conditional architecture approval.

Preserve compact live UX and dedicated NEXUS demo. Future frontend management is a separately approved slice; do not silently enable/remove frozen controls. Existing same-origin CORS limitation, receipt contention/caps, worker SIGTERM143, queue/intermediate timing/headers-after-send, Prisma/deepmerge-ts advisory and three NEXUS fixture failures remain open. Documentation checks are not SQL/security/load certification. Stop at human review; do not merge this architecture PR or implement BE-TEAM-02.

Documentation validation on this draft: local links and documentation-only changed-file scope passed; `git diff --check` passed; existing BE-API-00 design validator passed (21 operations,55 schemas,27 examples,26 negatives,32 lifecycle scenarios,24 links). This does not validate the new proposal as executable OpenAPI or prove its future policies. Runtime/frontend/database suites were not rerun for documentation-only changes; merged FE-TEAM-01 evidence remains preserved.


## Final correction checklist — PR #42 conditional review

| Review choice / completion | Final specification | Required acceptance evidence |
| --- | --- | --- |
| MEMBER/OBSERVER; deterministic admitted MEMBER backfill |2/5; no manager/Workspace role, quarantine retained | SQL ceiling/owner protections, retained upgrade data and observer denial |
| Direct ACTIVE Workspace UUID add; private archived owner directory |2–4 | Hidden/foreign targets, no email/contact/invitation enrollment, archived read/write matrix |
| Explicit transfer consent |4 bounded request/GET/accept/reject,15min expiry, one slot, no self-accept/renewal | Expiry/replacement/old-ID, reject/accept and revocation/role/version races, bound storage and original-authority fences |
| Owner loss; self-removal/recovery excluded |2/3 | Security revocation never blocked; no leave/recovery/legacy repair endpoints or grants |
| Inert terminal200, no Team version change |4/5 | Different-key inert receipts; correct request/intent revisions; no owner effect twice |
| Former-owner minimal original acknowledgement |4/6 | Initiator cannot read acceptor receipt; no new projection/metadata replay grant; fresh authority; expiry/capacity replay |
|11 migrations/receipt history/slot caps preserved |5/6 | Fresh/upgrade/checksums, old digest/result/full+tombstone replay, no writable counters or unbounded intent history |
| Signed pagination and live primary fences |3/6 | Scope/signature/revision/TTL tests and observed primary waits in both orders |
| Shared20/60 admission; performance objectives |7 | Combined endpoint budgets, Valkey fail-closed, measured workload/plans rather than guaranteed latency |

All approved policies are incorporated. Detailed consent bounds, minimal DTOs, migration/compatibility and acceptance contracts are for final architecture review. No implementation or merge authorization is inferred.
