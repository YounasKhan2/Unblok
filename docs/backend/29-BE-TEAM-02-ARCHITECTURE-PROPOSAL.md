# BE-TEAM-02 — Membership, ownership and lifecycle proposal

**DRAFT — human approval required; documentation only.** Base: FE-TEAM-01 merge `f65d9b0603cd76c243afb34cf59155bfa0c32a64`, 2026-10-14. This document grants no implementation, migration, endpoint, frontend or recovery authority.

## 1. Reviewed implementation and applicable requirements

Sources: [backend index](00-README.md), [domain](14-BE-00C-DOMAIN-TENANCY.md), [module boundaries](15-BE-00D-MODULE-ARCHITECTURE.md), [auth fences](19-BE-00G-AUTH-REVOCATION-FENCES.md), [sessions](20-BE-00H-SESSION-INFRASTRUCTURE.md), [enterprise contracts](24-BE-API-00-ENTERPRISE-CONTRACTS.md), [Workspace membership/invitation implementation](26-BE-WS-02-MEMBERSHIPS-INVITATIONS.md), [approved Team split](27-BE-TEAM-01-ARCHITECTURE-PROPOSAL.md), [actual Team/F1 implementation](28-BE-TEAM-01-FOUNDATION.md), and [merged frontend integration](../frontend/04-FE-TEAM-01-INTEGRATION.md).

Code inspected: Prisma Team/TeamMembership/TeamMutationResult; Team selectors/projection and receipt digest in packages/database/src/teams.ts; the eleventh Team migration; existing session-bound Tenancy and sorted-user fences; API Team handlers/contracts; live Team store/journal/dialog and frozen demo controls. The existing owner points through TeamMembership to a Workspace membership. TeamMembership has no role or joining timestamp. Owner binding is currently immutable. Later capability flags are literal false. Existing Project archival guard, Workspace policy revisions and receipt slots are real enforcement, not proposed writable counters.

Authoritative defaults retained: private explicit members; creation only ACTIVE Workspace ADMIN; exactly one explicit owner; management requires eligible Workspace ADMIN **and** that Team's ownership; Workspace OBSERVER read-only; no Project/Issue inheritance; inactive Workspace membership denies; archived metadata readable only to authorized members; no cascade; security revocation never blocked by owner loss; ownerless legacy Teams quarantined. Earlier design examples do not override the merged F1 design: immutable globally/scoped unique receipt slots and a derived non-updatable budget view.

Requirements checklist before implementation: approve section2 decisions; pin reviewed architecture HEAD; define closed capabilities/strict neutral schemas; prove owner/revision/receipt invariants with additive SQL; preserve all11 migrations; demonstrate real concurrency and revocation orders; validate bounded selectors and generated contracts; retain frontend/demo boundaries and historical failures. No approved default is replaced here.

## 2. Product/security decisions requiring human approval

| Question | Recommended proposal | Approval boundary |
| --- | --- | --- |
| Team role management | Add Team-local MEMBER/OBSERVER access ceiling, not a manager role. Effective read requires explicit join + ACTIVE Workspace membership; Workspace OBSERVER stays read-only. Team role never changes Workspace role or grants Project/Issue access. | New role semantics and vocabulary require approval. Until approved, keep explicit joins without a new role enum; do not implement a permissive fallback. |
| Existing joins | Add MEMBER ceiling to existing admitted joins; it represents existing access, not guessed ownership or Workspace promotion. Legacy quarantine remains excluded. | Approve deterministic backfill; no automatic owner repair. |
| Adding members/consent | Owner may explicitly add an existing ACTIVE Workspace membership by UUID, without implicit invitation enrollment. Decide whether direct enrollment needs recipient consent before implementation. | Direct add vs consent flow unresolved; consent requires its own bounded state/contract, not silent expansion of these endpoints. |
| Successor | Existing explicit Team MEMBER with enabled account and ACTIVE Workspace ADMIN membership; different from current owner. No enrollment/elevation as a side effect. | Approve successor consent: recommend explicit acceptance before transfer; if required, separately approve request/accept contracts and expiry. Immediate transfer endpoint remains conditional. |
| Nonowner self-removal | Defer; owner-only removal in this slice. | A self-service leave action requires separate approval and replay/privacy rules. |
| Member directory/privacy | Eligible owner only; displayName, Workspace membership UUID, Workspace role/status, Team ceiling and isOwner; no email or account enumeration. No new candidate lookup. | Approve projection and owner-only visibility. Use already authorized Workspace directory for candidates. |
| Archived directory | Archived metadata stays readable. Recommend owner-only directory read in an ACTIVE Workspace, including archived Team; no member writes while archived. | Explicit approval needed; Workspace archived permits existing metadata reads only, not a new directory grant. |
| Owner loss | Retain explicit owner/history and joins, freeze management, allow authorized metadata reads; revocation/demotion/suspension always proceeds. | No automatic takeover, election, vacancy claim or ADMIN discovery. |
| Orphan recovery | No recovery endpoint in initial BE-TEAM-02. Require separately reviewed consent, independent approval, evidence, audit, replay and abuse protocol. | Recovery and legacy repair are separate approval gates, not implementation defaults. |

“Role management” never means global roles, delegated ownership or Workspace ADMIN promotion. MEMBER/OBSERVER ceilings do not enable unsupported business operations. An OBSERVER ceiling for the owner is rejected: transfer first to an eligible successor. Demotion of the owner's Workspace role remains allowed and freezes management regardless of this Team ceiling.

## 3. Proposed action matrix and revocation

All actions need live request-bound account/session primary fences, enabled account, current ACTIVE Workspace membership, explicit Team join and nonquarantined Team. Hidden/foreign/quarantined Team returns generic404 before target, version or receipt disclosure. Visible unauthorized action403. Workspace ADMIN nonmember gets no list/detail/directory/management access.

| Action | Eligible ADMIN owner | Explicit nonowner ADMIN/MEMBER | Workspace or Team OBSERVER |
| --- | --- | --- | --- |
| Own active/archived Team metadata | Allow existing read | Allow existing read | Allow read |
| Member directory | Conditional owner-only grant under section2 | Deny | Deny |
| Add/remove/change Team ceiling | ACTIVE Workspace and Team only | Deny | Deny |
| Transfer | ACTIVE Workspace/Team; eligible explicit successor and approved consent | Deny | Deny |
| Archive | ACTIVE Workspace/Team; no ACTIVE owned Project | Deny | Deny |
| Restore | ACTIVE Workspace; archived Team; current eligible owner | Deny | Deny |
| Project/Issue/Dependency operations | No inherited grant | No inherited grant | No inherited grant |

Suspension, INVITED status, join removal, account disablement, logout/epoch/family revocation deny fresh access/replay. Removal does not revoke the target's entire Workspace session or unrelated Teams. Reactivation of retained joins requires fresh authority; removed joins never reappear automatically. Workspace invitations create no Team joins. Already-delivered bytes cannot be recalled. An earlier transaction may commit before a conflicting revocation; revocation-first must deny/roll back. Never hold authorization across requests/pages.

Transfer retains outgoing owner's ordinary join and ceiling; authority to manage ceases atomically. Owner removal, owner-ceiling downgrade and transfer-to-nonmember/ineligible target reject generic409 after authorized scope. No last-owner rule may veto Workspace/account security actions.

### Owner-loss and recovery policy proposal

Distinguish an admitted Team with an ineligible retained owner from a quarantined legacy Team with unknown ownership. Neither state grants another ADMIN access. Initial BE-TEAM-02 permits no repair. Existing authorized members may request review for a specific known UUID; no orphan list, guessed owner, first-member election or automatic lifecycle change is allowed.

A later recovery protocol should require independently verified authority over that exact Team, an eligible existing explicit ADMIN successor, recorded reason and immutable evidence references, independent approver separation from requester/successor, bounded expiry and fresh primary checks at execution. Prefer current owner's informed consent where available. Loss of consent/access is not proof that takeover is authorized: emergency recovery needs a separately approved governance rule. Quarantined legacy repair additionally requires authoritative historical ownership evidence; ordinary membership is insufficient.

Execution must atomically validate approvals against current owner/version/membership/revocation state, assign the exact approved successor without promoting Workspace role, preserve prior owner history, advance revisions and commit an immutable bounded audit/recovery receipt. Replayed approvals cannot authorize another Team/successor or revive revoked privileges. No external verification occurs under SQL locks. Retention, approver authority/privacy, break-glass conditions, appeal/reversal, notification and abuse/rate budgets require human decisions. Durable business audit and recovery infrastructure are not implemented; application logs are not substitutes. Until those prerequisites and their real security/concurrency tests are separately approved and implemented, leave management frozen.

## 4. Conditional API contracts

Under `/api/v1/workspaces/:workspaceId/teams/:teamId`; UUID paths. These are proposed contracts, **not registered endpoints**. All mutations require CSRF/Origin, Idempotency-Key, strong Team If-Match, private no-store and durable atomic results. Strict allowlists reject actor/owner/Workspace authority fields, bulk bodies and unknown keys.

| Method / suffix | Input | Proposed output |
| --- | --- | --- |
| GET `/memberships` | limit default20/max100; after; optional ACTIVE/SUSPENDED/INVITED/ALL Workspace-status filter | MemberPage, authorized owner projection; no totals/search/email |
| POST `/memberships` | membershipId; approved Team ceiling |201 member mutation result, Team version/ETag; consent decision may replace immediate enrollment |
| PATCH `/memberships/:membershipId` | approved Team ceiling only |200 member mutation result + Team version; no Workspace role change |
| DELETE `/memberships/:membershipId` | no body |200 minimal mutation acknowledgement + Team version |
| POST `/ownership-transfer` | successorMembershipId only; approved consent binding if applicable |200 minimal ownership acknowledgement + Team version; no hidden directory expansion |
| POST `/archive`, `/restore` | empty strict body |200 Team metadata/version/capabilities |

Member item proposal: membershipId, displayName, workspaceRole, workspaceStatus, teamRole, isOwner, joinedAt nullable for historical unknown. Do not expose global user identity/credential email. No Project data is included. Result envelopes are operation-specific neutral DTOs, not ORM rows. DELETE acknowledgement contains no removed member details. GET does not return Team roles as authority evidence.

Errors follow BE-API-00: malformed400, global unauthenticated401, visible denial403, hidden404; authorized conflict409; stale If-Match412; missing428; rate429 with Retry-After; dependency/unknown commit503; input excess413. Authorization precedes precondition/target eligibility/receipt disclosure. Generic invalid-successor/conflict errors reveal no foreign account or hidden Team facts. Invalid/expired/binding cursor400; authorized stale-policy409 CURSOR_STALE. No automatic retry/rekey or status-based role inference.

New different-key add of an existing identical join is an authorized inert200 (not201), no new version; differing ceiling conflicts409, use explicit PATCH. Remove already-absent nonowner is inert200 after management authorization; owner removal always rejects. Same desired role/lifecycle state is inert200 when current management authority and parent state allow it. Transfer-to-self rejects409. Each admitted inert mutation still needs a terminal receipt; no extra admission bypass.

## 5. Additive database constraints and migration plan

Preserve all11 applied migrations and BE-00B history. A new reviewed migration may add TeamMembership ceiling, joinedAt nullable with no fabricated historical times, and a Team member-directory revision. Fresh joins receive server timestamps. Stable ordering uses `(COALESCE(joinedAt, '-infinity'), membershipId)` with an explicitly tagged legacy-unknown cursor segment; DTO keeps null. Approve/test this ordering before indexing.

Retain tenant-composite PK/FKs, exact single-owner scalar and deferred owner-to-join FK, restrictive deletion, immutable key/createdAt/quarantine, metadata bounds, positive versions and no cross-Workspace joins. Replace only the owner-immutability function through additive migration to permit closed transactional transfer; never disable triggers or edit history. SQL proves final owner has an explicit join and approved ceiling. Eligibility ACTIVE ADMIN/enabled account is checked under transaction fences at transfer, never a permanent CHECK that blocks later suspension/demotion.

Role/owner/join/lifecycle changes increment Team version once for an actual change and affected directory/Workspace policy revisions atomically. Inert operations do not manufacture a version. Removal of a nonowner deletes only its join, not Workspace membership/account or Project/Issue history. Owner join deletion cannot commit. Archive does not delete joins or cascade to Projects; reject any ACTIVE owned Project. Restore never restores Projects/Issues or suspended memberships; reject archived Workspace.

Receipt operation enum/checks/digest/result completion must extend additively without changing historical digests or slots. Do not drop constraints, rewrite receipts, purge tombstones or introduce new writable budgets/trigger-depth authorization. Test old create/metadata replay after upgrade and old-client compatibility with new capabilities (currently literal false schemas); changing capability vocabulary needs reviewed contract/version rollout, not enabling flags that old strict clients reject.

Fresh install,11-to-next upgrade with retained owners/joins/receipts/quarantine, checksum/timestamp preservation, deploy/status/replay/diff and SQL invariants are mandatory. Inventory existing joins and unknown timestamps first. Forward repair preferred. App rollback requires old-client/server schema/trigger compatibility; do not auto-drop new fields/results or reset existing databases. Runtime roles lack DDL/trigger ownership; no RLS or backup/PITR implementation is claimed.

## 6. Concurrency, receipts and pagination

Discovery grants no authority. Discover immutable target membership/user bindings first; bounded actors/targets only. Acquire sorted required user fences -> acting family -> Workspace -> Workspace policy revision -> deployment receipt admission advisory lock (new receipt only) -> receipt -> Team -> affected joins in stable membership UUID order -> required Project integrity locks. Current Team implementation already includes policy revision before F1 admission; use this actual order rather than older proposed writable-budget diagrams. No user/Workspace lock after admission. If a binding changes or a new user is discovered, abort and restart the complete authorization boundary, not reverse acquisition. No target session is fabricated. Completion checks held fences; no external consent/mail/Valkey call inside SQL transaction.

Keep SERIALIZABLE,2s acquisition/5s callback,1.5s lock/4s statement,750ms existing Valkey acknowledgement bounds. Future Project creation/restore must obtain the same Workspace/Team integrity locks before active child insertion. Existing SQL guard remains authoritative; bounded existence query on ACTIVE Project index, no all-child enumeration. Measure lock waits before narrowing conservative Workspace locking. Unknown commit503 is not cancellation; known serialization/deadlock409. No automatic side-effect retry.

Reuse immutable receipt slots:2000/Workspace and20000/deployment including tombstones; independent operation/version domain binding over canonical body, target and original If-Match. Effect, owner/join/version/revisions and terminal receipt commit together. Authorized same-key replay checks current policy before disclosing result, skips new capacity and reconciles original precondition. Current-owner authority is lost after transfer: propose outgoing actor replay only a minimal acknowledgement of their own successful transfer, requiring current ACTIVE Workspace ADMIN membership, enabled account/live session and retained explicit Team join, receipt original-owner binding and no current resource projection. This is a **new narrow replay policy requiring approval**; until approved, deny rather than exposing a stored result through stale ownership. Removed/inactive actor gets404. Inert remove replay does not require the removed target to exist.

Full result minimum24h, then immutable expired409 tombstone, never reexecute. Same-key changed input409. No eviction or independent new ledger per endpoint that multiplies caps. At capacity matching authorized replay remains possible subject to existing rate limits. SQL errors/rollback release only uncommitted slots; Valkey attempts are not refunded. Restore effect/receipt/revisions together; no purge approval.

Directory SQL scopes by Workspace/Team and current owner authorization before pagination. At most101 visible candidates, byte-bounded output128KiB, no N+1/contact lookup/full hidden scan. Signed cursor <=2048 characters/TTL<=15min binds actor, Workspace, Team, operation, canonical filter/order/limit, directory and policy revisions, unknown-time segment/tuple and key/time/version. Each page freshly authorizes. Owner transfer/removal/status/role changes stale or deny as appropriate; no snapshot/export promise. Rotation and key failure follow existing independent Workspace keyring with distinct operation domain. No client role, decoded cursor or ADMIN directory access establishes Team permission.

## 7. Acceptance and performance gates

Proposed aggregate management admission:20 attempts/min/account and60/min/Workspace shared across add/remove/role/transfer/lifecycle, not one budget per endpoint; existing read60/min/account and300/min/Workspace and coarse ceiling retained. No bulk operation. Request <=32KiB; single result/receipt <=16KiB; directory <=128KiB. Confirm these initial budgets under contention before approval; no capacity certification or premature caching/denormalization.

| Requirement / acceptance | Required real evidence |
| --- | --- |
| Privacy/action matrix | ADMIN nonmember, explicit nonowner, OBSERVER, inactive/foreign membership, colliding tenant IDs, hidden/quarantined targets; owner directory privacy and no unsupported routes |
| Add/remove/ceiling | Duplicate/inert semantics, owner protection, no Workspace promotion/implicit invitation join, no contact enumeration, deterministic legacy-null order |
| Transfer | Eligible explicit successor/consent, owner FK, no double owner; transfer vs removal/role downgrade/two competing successors/Workspace revocation; no automatic takeover |
| Owner loss/recovery exclusion | Demotion/suspension/disable always succeed, management freezes, reactivation fresh checks, legacy quarantine retained; no recovery endpoint/grant |
| Lifecycle | Archive vs ACTIVE Project creation/restore in both orders, no cascade, archived Workspace refusal, metadata read/private status filter, restore no child/member resurrection |
| CAS/receipts | Missing428/stale412, same-key concurrent requests/body conflict, actual lost response, rollback/SQL error, original precondition replay, transfer replay policy, full caps/tombstones and old receipt compatibility |
| Revocation/locks | Observe actual PostgreSQL waits and both success-before-revocation/denial-after orders; no reverse acquisition; enforce unchanged deadlines, principal completion and outage fail-closed |
| Paging/performance | EXPLAIN ANALYZE/BUFFERS real projections at1/20/100; one member selector, bounded candidates/bytes and constant business query count; stale/binding/expiry/rotation negatives |
| Migration/contracts | Fresh and retained11-migration upgrade, procedural negatives/checksums/diff, neutral strict schemas/generated OpenAPI, old frontend literal-false compatibility rollout |
| Regression/scope | Frozen install; backend architecture/typecheck/lint/test/build; PostgreSQL/Valkey/HTTP auth/session/fence/Workspace/invitation/tenancy gates; frontend lint/tests/build; NEXUS unchanged |

Benchmark at1000 explicit joins and realistic maximum metadata, including multiple active Workspaces contending on receipt admission. Report p50/p95/p99 latency, selector/total SQL counts, rows inspected, bytes, lock/admission waits and errors at declared concurrency1/10/50. Proposed local target for uncontended directory p95<=250ms and management p95<=500ms excluding network; thresholds require approval and measurements, not invented pass claims. Do not raise deadlines/limits to meet them. Document query/index choices and workload/hardware; investigate regressions before adding caching. Production scale/load acceptance is separate.

## 8. Review boundary and compliance

No runtime/schema/frontend/dependency changes in this PR. Proposal satisfies the reviewed source checklist through sections1–7; the acceptance table maps each security/domain/contract requirement to future evidence, not executed tests. Human decisions: Team ceiling semantics/backfill, enrollment and transfer consent, directory privacy/archival, inert operation contracts, outgoing-owner replay exception, admission/performance budgets, self-removal deferral and a separately approved recovery protocol. Once resolved, revise contracts/acceptance before implementation approval.

Preserve compact live UX and dedicated NEXUS demo. Future frontend management is a separately approved slice; do not silently enable/remove frozen controls. Existing same-origin CORS limitation, receipt contention/caps, worker SIGTERM143, queue/intermediate timing/headers-after-send, Prisma/deepmerge-ts advisory and three NEXUS fixture failures remain open. Documentation checks are not SQL/security/load certification. Stop at human review; do not merge this architecture PR or implement BE-TEAM-02.

Documentation validation on this draft: local links and documentation-only changed-file scope passed; `git diff --check` passed; existing BE-API-00 design validator passed (21 operations,55 schemas,27 examples,26 negatives,32 lifecycle scenarios,24 links). This does not validate the new proposal as executable OpenAPI or prove its future policies. Runtime/frontend/database suites were not rerun for documentation-only changes; merged FE-TEAM-01 evidence remains preserved.
