# BE-TEAM-01 — Team architecture and authorization proposal

Status: **section 2 security/product defaults approved; corrected phase scope and limits for final review; no implementation authorized**. Date: 2026-10-14.
Base: merged FE-WS-02 main `3deaf88f089cc268cda893b8f3e14ec83d210e8d`.
Scope: Team ownership/membership, explicit grants, lifecycle, tenant integrity, contracts, traversal and concurrency. No schema, migration, runtime contract, route, frontend or fixture is changed by this document.

## 1. Reviewed authority and existing behavior

Preserve the Bun/NestJS modular monolith, PostgreSQL/Prisma database ownership, neutral strict Zod contracts, request-bound principals, live Valkey sessions, primary auth fences, CSRF/Origin checks, bounded transactions and private no-store responses. Applicable sources: [module boundaries](15-BE-00D-MODULE-ARCHITECTURE.md), [domain](14-BE-00C-DOMAIN-TENANCY.md), [sessions](20-BE-00H-SESSION-INFRASTRUCTURE.md), [Workspace foundation](25-BE-WS-01-WORKSPACE-FOUNDATION.md), [invitation security](26-BE-WS-02-MEMBERSHIPS-INVITATIONS.md), [enterprise contracts](24-BE-API-00-ENTERPRISE-CONTRACTS.md), and their [authorization](contracts/be-api-00/authorization.md), [lifecycle](contracts/be-api-00/lifecycle.md) and [performance](contracts/be-api-00/performance.md) companions. Earlier draft grants and historical review labels do not override merged implementation.

Source audit:
- Prisma Team has composite (workspaceId,id), workspace FK, scoped unique key, name, ACTIVE/ARCHIVED and creation time. TeamMembership joins a Team to a workspace membership using composite FKs and a unique composite PK. **No Team owner, management role, visibility mode, description, color or version exists.**
- Projects belong to Teams through workspace-composite FKs. Existing SQL prevents Team archival while ACTIVE projects remain. Hard deletion is restrictive; archived workspace mutations are rejected. Team name has a SQL case-insensitive unique index. Team key is not currently protected by the project's immutable-key trigger.
- Frozen frontend Team types include description, color, leadId, memberIds; directory/hub derive project, issue, blocker and planning aggregates from demo state. CreateTeamModal uses name/key/description/color and requires workspace Administrator. leadId is not proof of backend ownership. Demo global User.role and memberIds are not production authority.
- Real accounts currently have Workspace flows, not real Team routes. NEXUS remains fixture-backed under the labelled demo. Future live integration needs its own FE-TEAM slice; this proposal does not change screens or make currently unavailable aggregates appear as zero.

## 2. Approved defaults and split implementation scope

Human architecture review approved the section 2 defaults, clarified below. This is approval of the design, **not permission to merge this documentation PR or implement either phase**.

| Decision | Approved default | Phase boundary |
| --- | --- | --- |
| Privacy/discovery | Teams private to explicit members; Workspace ADMIN never automatically discovers or accesses existing private Teams | BE-TEAM-01 list/detail; no public visibility mode |
| Creation | Only current ACTIVE Workspace ADMIN in an ACTIVE Workspace creates Teams | BE-TEAM-01 |
| Ownership | Exactly one explicit owner; creator becomes owner and Team member atomically | BE-TEAM-01 creation; no client-selected initial owner |
| Management | Both eligible ACTIVE Workspace ADMIN and ownership of the specific Team required | BE-TEAM-01 metadata only; other management deferred |
| Observer/resource scope | OBSERVER read-only; no inherited Project/Issue authorization | Both phases; exact resource grants remain required |
| Metadata/key | Immutable Team keys, bounded description and the existing approved color-token palette | BE-TEAM-01; limits specified below |
| Reactivation | Retained Team relationship may resume only after fresh current authorization; Workspace invitations never implicitly enroll in Teams | BE-TEAM-01 read boundary; no new joins other than creator |
| Archival | Archived metadata readable to authorized members; no cascading Project archival | BE-TEAM-01 reads; archive/restore writes BE-TEAM-02 |
| Owner loss | Suspension/demotion/revocation never blocked; retain owner history, freeze management; no automatic ADMIN takeover | BE-TEAM-01 deny/freeze; orphan recovery separately approved in BE-TEAM-02 |
| Legacy | Ownerless Teams quarantined from every live Team capability, never assigned guessed owners | BE-TEAM-01 migration/read/write boundary |
| Later management | Explicit member management, ownership transfer and archive/restore belong to BE-TEAM-02 | Proposed endpoints retained below, not current implementation grants |

**BE-TEAM-01:** additive Team foundation; atomic Team/creator ownership and membership; private list/detail; basic name/description/color update. No member directory/add/remove, transfer, archive/restore mutation, delete, delegated owner role or orphan recovery.

**BE-TEAM-02:** proposed explicit member management, owner transfer and archive/restore. The previously described eligible target and no-role-elevation defaults remain design guidance, but their endpoint, consent, directory privacy, removal/transfer interactions and concurrency acceptance require phase-specific review. Orphan recovery requires a separately approved protocol; this approval does not permit takeover.

Numeric limits below are conservative design settings for final review, not measured capacity or new runtime configuration. Changing limits later requires evidence and a scoped review. No frontend change or silent frozen-UX control removal is authorized.

## 3. Ownership and membership model

The Workspace owns the tenant boundary; a Team owns its Projects. Team ownership is management authority, not a global user role or ownership of every Project/Issue. The approved single ownerMembershipId points to the workspace membership through the TeamMembership composite key (workspaceId,teamId,membershipId), not directly to a User. Ownership and membership changes commit together. A display lead, if later approved, is separate non-authorizing metadata.

Membership means explicit Team relationship intersected with current ACTIVE workspace membership, enabled account and live session authority. Suspension/INVITED status removes effective access while retaining historical join/owner references. Reactivation can resume retained Team access only after a fresh live-session/primary/membership/Team check; no cached or invitation-derived grant is accepted. Workspace invitations never create TeamMembership. Workspace ADMIN alone does not discover, read, join, manage, transfer or restore an existing private Team.

BE-TEAM-01 creator membership join has no new global/team role enum in the approved foundation. Owner is explicit; other member permissions come from current workspace role and exact Team action. OWNERSHIP DOES NOT imply Project/Issue CRUD grants. BE-TEAM-02 transfer is not account linking or workspace role elevation. In BE-TEAM-02, removing the owner is rejected until a successful atomic transfer. BE-TEAM-02 self-removal for nonowners may be included only if separately approved; no client-provided actor/role/owner authority is accepted.

Demotion/suspension/disable takes effect regardless of owner status. An ineligible owner leaves a managed recovery gap; do not block security revocation to preserve convenience, auto-promote another user, auto-enroll ADMIN, or expose orphan Team names in a management inventory. A recovery protocol with consent/audit and hidden-resource handling is outside this proposal's implementation grant.

## 4. Approved foundation action matrix (design only, not runtime policy)

Every row requires global request authority and ACTIVE workspace membership. Unknown actions deny. Scope/status overrides role. Archived Workspace is read-only. Access to a hidden Team returns the same generic404 as nonexistent/foreign Team; global invalid session401.

| Action | ADMIN nonmember | ADMIN Team member, nonowner | Eligible ADMIN owner | MEMBER Team member | OBSERVER Team member |
| --- | --- | --- | --- | --- | --- |
| Create new Team | Allow only explicit create action; no access to existing Teams | Same | Same | Deny | Deny |
| List/detail active own Teams | No hidden rows | Allow | Allow | Allow | Allow read |
| Archived metadata | No hidden rows | Allow | Allow | Allow | Allow read |
| Team membership directory (BE-TEAM-02 only) | Deny | Deny | Proposed bounded grant; unavailable in BE-TEAM-01 | Deny | Deny |
| Metadata update (BE-TEAM-01) | Deny | Deny | Allow name/description/color in active Workspace/Team | Deny | Deny |
| Add/remove/transfer (BE-TEAM-02 only) | Deny | Deny | Proposed exact actions; unavailable in BE-TEAM-01 | Deny | Deny |
| Archive/restore (BE-TEAM-02 only) | Deny | Deny | Proposed lifecycle actions; unavailable in BE-TEAM-01 | Deny | Deny |
| Project/Issue/Dependency data | Deny without resource grants | No inherited umbrella grant | No inherited umbrella grant | No inherited umbrella grant | No inherited umbrella grant |

Owner capabilities are server hints, never reusable evidence. A later mutation resolves fresh ownership/membership/role. Private Team counts, search choices, duplicate-key errors and member projections must not leak hidden Teams or contact emails. Existing member-directory access is ADMIN-only and does not grant any Team access.

## 5. Additive database plan, migration safety and lifecycle

BE-TEAM-01 planned additions: Team ownerMembershipId, explicit foundation/quarantine marker, positive version, bounded description and approved color token; bounded Team mutation result ledger and admission budget records; extend existing Workspace policy-revision triggers for new Team visibility/ownership facts. TeamMembership joinedAt, member-directory revisions, transfer and lifecycle write capabilities are BE-TEAM-02 only. Immutable createdAt ordering needs no separate Team-list data revision; metadata pagination is live. Do not import transport schemas into database or expose raw Prisma models.

Constraints:
- Preserve current tenant PK/FKs, scoped unique uppercase key (2–6 alphanumeric), case-insensitive scoped name uniqueness and all ten applied migrations.
- Add composite owner FK to TeamMembership with RESTRICT, DEFERRABLE INITIALLY DEFERRED to permit atomic Team + creator join insertion. Add corresponding checks/closed write enforcement; after commit owner and Team membership must agree.
- Existing owned databases may contain Teams with no joins, unknown owners or inactive memberships. Inventory first, never infer owner from first member, leadId, ADMIN or fixtures. An explicit legacy-quarantine marker with nullable owner must exclude ownerless Teams from list, detail, metadata and replay, including for existing members/ADMIN. A CHECK must distinguish quarantined legacy rows (owner NULL) from admitted foundation rows (owner NOT NULL); a deferred composite FK verifies owner join at commit. New Team INSERTs cannot choose quarantine/NULL owner through any production path; SQL must prevent reclassifying admitted rows as legacy. No legacy row is admitted without a separately approved authoritative owner backfill. Any later NOT NULL contraction requires approved authoritative backfill; fresh created Teams must never commit without owner. Do not expose legacy Teams under permissive fallback.
- In BE-TEAM-01 owner binding is immutable after creation; no new owner-change/status-write capability is exposed. Team key/identity immutability, quarantine transition restrictions and positive versions require SQL enforcement where expressible plus closed authorized capabilities. BE-TEAM-02 must add transfer/status transitions through a separately reviewed additive migration. Creator/owner eligibility is a transaction rule; permanent ACTIVE-owner checks must not block workspace suspension.
- Existing RESTRICT FKs and no-cascade semantics stay. No purge/delete endpoint; no deletion or reparenting of owned Projects. Archive rejects ACTIVE owned Projects, never archives them implicitly. Restoring Team does not restore Projects/Issues or membership authority.
- Workspace archive blocks Team mutations and ownership changes. Metadata/joins freeze while Team archived; restore remains unavailable until BE-TEAM-02 adds its explicitly authorized capability. Ordinary Project/Issue reads continue to exclude archived ancestors.
- Positive policy/data revision increments and ledger effects commit atomically; raw maintenance writes require the same revision/lock discipline, never trigger-disable bypass.
- Index candidates: Team(workspace,status,createdAt,id); TeamMembership(workspace,membership,team) existing access join; BE-TEAM-02-only TeamMembership(workspace,team,joinedAt,membership) directory; unique ledger(actor,workspace,operation,key). Justify actual indexes using bounded query plans before install; no premature cache/denormalized aggregate fields.

Review original trigger behavior against these policies before adding a new migration. New corrective enforcement must be additive and tested fresh plus original ten-migration upgrade with retained rows/checksums. Never edit applied SQL, reset, db-push or infer empty production data. Forward fix preferred; application rollback needs schema compatibility checks. Backup/PITR/least-privilege roles remain operational requirements; RLS is not implemented or claimed.

## 6. Proposed REST contracts and bounded UX handoff

All paths below are under /api/v1. Promote approved schemas into neutral strict Zod and generate live OpenAPI/types only in the implementation phase. Unknown/duplicate query fields reject400; projections never contain ORM rows, emails, auth evidence or hidden aggregates.

### BE-TEAM-01 endpoint scope (future implementation only)

| Route | Input / output | Authority and bound |
| --- | --- | --- |
| GET /workspaces/:workspaceId/teams | status ACTIVE (default), ARCHIVED or ALL; limit default50/max100; cursor; TeamPage | Own admitted Teams only; private no-store; response128KiB |
| GET /workspaces/:workspaceId/teams/:teamId | TeamDetail; metadata/status/version string and own capability hints | Explicit Team membership and current Workspace authority;16KiB; no expansion |
| POST /workspaces/:workspaceId/teams | name/key/description/color only;201 TeamCreated | ACTIVE ADMIN, active Workspace, CSRF and Idempotency-Key; creator owner/join atomic;16KiB |
| PATCH /workspaces/:workspaceId/teams/:teamId | name/description/color only;200 TeamDetail | Current eligible owner, active Workspace/Team; strong If-Match, CSRF and Idempotency-Key;16KiB |

### BE-TEAM-02 proposed endpoints — not BE-TEAM-01 grants

| Later route | Proposed behavior | Later acceptance / approval |
| --- | --- | --- |
| GET /workspaces/:workspaceId/teams/:teamId/memberships | Bounded owner management directory | Privacy, joinedAt migration, signed directory cursor and response limits |
| POST /workspaces/:workspaceId/teams/:teamId/memberships | Add existing ACTIVE Workspace membership, no role elevation | Explicit consent/eligibility and atomic membership/revision/receipt |
| DELETE /workspaces/:workspaceId/teams/:teamId/memberships/:membershipId | Remove join without deleting Workspace history | Owner-removal safeguard, self-removal decision and concurrent transfer |
| POST /workspaces/:workspaceId/teams/:teamId/ownership-transfer | Existing eligible ADMIN Team member becomes owner atomically | No automatic takeover; target eligibility and owner/member transfer races |
| POST /workspaces/:workspaceId/teams/:teamId/archive or /restore | Explicit lifecycle transition | Active-Project guard, no cascade, parent checks and restore races |

No orphan-recovery route is defined or granted. It requires a separately approved consent/audit/privacy protocol. All later-route capability hints remain false/unavailable in BE-TEAM-01.

Team DTO: workspaceId,id,key,name,description,color,status,createdAt,version and fixed own capabilities. Do not include ownership/member/Project counts in general pages until privacy approved. BE-TEAM-02 owner directory may include explicit isOwner after its privacy review. Raw leadId/memberIds from demo do not map automatically to wire input. UUID identity remains canonical; if future frozen key routes need resolution, add a reviewed scoped key lookup, never fetch-all matching in the browser.

Use current error envelope:401 unauthenticated;404 inaccessible scope before revealing Team facts;400 malformed input/cursor;409 known state/serialization/idempotency/cursor conflict;429 admission with Retry-After;503 dependency/unresolved outcome. Strong If-Match required428 and stale precondition412 follow the approved BE-API-00 design; malformed header400, payload excess413, visible action denial403, hidden or quarantined Team404. Authorization precedes precondition/conflict disclosure; do not silently map them to a competing envelope. Generic uniqueness409 must not reveal the conflicting Team.

If-Match is an actor-authorized opaque Team resource version, never authentication. Mutation body has no arbitrary status, owner, workspace/user identity, team role, related Projects or unrestricted update fields. BE-TEAM-01 mutation/detail responses bounded16KiB; ledger result also16KiB. Shared response interceptor bounds apply to serialized UTF-8 bytes. No unbounded totals, bootstrap, bulk joins or external I/O in transaction.

Description/color persistence avoids silently removing frozen controls. Metrics, Projects, Issues, planning and blocker panels remain explicitly unavailable until their capabilities exist, not fabricated zeros/fixtures. Full frozen Team hub parity requires later resource slices; FE-TEAM scope must acknowledge this instead of claiming complete integration.

## 7. Pagination and privacy

Filter visibility in SQL using current ACTIVE workspace membership and explicit TeamMembership, before pagination/counts. Team list order immutable (createdAt,id) ASC; signed cursor stores the last inspected tuple, actor, workspace, operation, canonical status/order, current policy revision, key ID/version and issued/expiry times. Do not require the last row to still exist. No search/free-text/mutable-name sort in MVP; later directory search needs approved normalization/index/privacy semantics.

Reuse the reviewed independent cursor keyring only through its scoped helper with a Team-specific domain/operation binding; no invitation/session/recovery secret reuse. TTL<=15min; unknown/retired/bad signatures400, missing key503; rotation/compromise behavior follows Workspace contracts. Cursor length<=2048 characters, including encoding/signature, matching current reviewed contracts.

Authorize the current scope before cursor-binding/revision errors: revoked/hidden Team404, valid actor with stale policy409. Team join/owner/workspace-role/status changes advance workspace policy revision atomically. BE-TEAM-02 alone needs a reviewed member-directory revision/live-display decision; no member cursor is created in BE-TEAM-01. Foundation reads lock/revalidate the existing Workspace policy revision after Workspace locks, preserving Workspace-before-revision order and stale-snapshot detection. No snapshot guarantees claimed.

Immutable Team-list traversal is live: current filtered rows only; metadata may update, earlier inserts may require refresh, removals disappear. Every page obtains fresh authority; no principal reused between requests. Listing yields only actual accessible rows, no exact total or hidden aggregate. BE-TEAM-02 owner-only member pages would sort (joinedAt,membershipId), with bounded explicit legacy joining-time treatment; do not invent timestamps in DTOs.

## 8. Transactions, conflicts, replay and revocation

Closed Teams capabilities in packages/database; feature module receives no raw Database, Prisma delegate or principal evidence. Add exact controller handler references to the existing deny-default guard; no @Roles admin bypass. Own feature transport/application layers remain architecture-checked.

Lock order: discover immutable target bindings without authority; acquire all required user fences sorted UUID -> acting family -> Workspace -> durable admission budget (new receipt only) -> mutation receipt -> Team -> affected TeamMemberships sorted identifiers -> owned Project rows when required. Acquire each earlier lock once. Validate target workspace membership under Workspace lock; no target session is fabricated. Completion revalidates held auth locks without reacquiring earlier rows. If another required user is discovered late, roll back and restart through the complete bounded capability, not reverse acquisition. All lifecycle/maintenance paths must follow this order. SQL BEFORE triggers alone cannot impose application order on arbitrary raw UPDATE.

Keep current SERIALIZABLE transaction bounds, lock/statement limits and callback lifetime; no external service call, auto-retry of side effects or new long-running transaction. Workspace lock remains conservative integrity fence, with SHARE on reads and UPDATE on mutations; measure hot-tenant contention before narrowing. Project creation must use this same Workspace lock before future Team/project writes, so Team archive and project creation cannot both commit an invalid graph. Existing direct project lifecycle constraints still apply.

Mutation receipt unique(actor,workspace,operation,key) stores domain-separated canonical payload digest (including path, version precondition and operation), bounded result/reference, retention timestamp and immutable tombstone. Authorization precedes replay result disclosure and cleanup; matching key/body returns the original confirmed result, changed body409. Completed If-Match retries reconcile through authorized receipt before testing current version; a new key with stale If-Match fails precondition. Repeated grants cannot apply twice. BE-TEAM-02 will separately define different-key member-add behavior; it is not a BE-TEAM-01 mutation.

Retain full nonsecret response minimum24h; after expiry keep minimal tombstone with409 and never execute again. No tombstone purge/reuse is approved. A successful creation replay requires current explicit access to the originally created Team (including its admitted ownership binding); ADMIN creation eligibility alone cannot authorize disclosure of that stored Team result. New receipt admission is capped as specified below, including tombstones; capacity exhaustion rejects before effects and does not prevent existing-key authorized reconciliation. Full-result compaction after the minimum24h must atomically retain the original binding/tombstone; no automatic cleanup job is in scope. Restore must preserve effects, quota counters, receipt bindings and revisions together. Keyed digests and independent key rotation must preserve old minimal replay safety. Existing Workspace receipt table is not casually repurposed into generic unrestricted persistence.

Known serialization/deadlock conflict409; lock/dependency timeout or unknown commit503 is not cancellation. Client retains same key/body/precondition and performs fresh authorized reconciliation; no automatic replacement key. Revocation-first rejects or forces rollback; an earlier read/write with conflicting locks can complete before revocation commits. Bytes already returned cannot be recalled.

Expected races: same-key create produces one Team/owner/join; duplicate keys/names yield one winner without hidden-resource details; BE-TEAM-02 owner transfer versus remove cannot orphan Team; demotion/suspension versus management produces ordered success-before-revocation or denial/rollback; BE-TEAM-02 Team archive versus active Project creation cannot leave archived Team with active Project; version conflicts never silently overwrite; list continuation after policy change restarts only after fresh authorization.

## 9. Conservative limits and phase acceptance matrix

BE-TEAM-01 proposed numeric settings for final review:

| Bound | Setting / measurement | Failure and safety |
| --- | --- | --- |
| Metadata | Name1–120 Unicode characters,<=480 UTF-8 bytes; key2–6 uppercase alphanumeric; description0–2000 Unicode characters,<=8000 UTF-8 bytes | Strict character plus encoded-byte checks in DTO and database; metadata-only allowlist |
| Color | Exactly #5645d4, #0ea5e9, #10b981, #f59e0b, #ef4444, #8b5cf6, #ec4899, #64748b; default #5645d4 | Existing frozen CreateTeamModal palette; no arbitrary CSS/URL/color string |
| Input/output | Request32KiB; detail/create/update and stored receipt16KiB; list128KiB including envelope/cursor; reserve4KiB for page metadata |413 input excess; pages stop at complete rows with continuation; invalid single output503, never truncated JSON |
| Traversal | default50/max100/min1; at most101 authorized candidates, one bounded join query, no N+1, no exact total | Keyset tuple survives deletion; no hidden-row postfilter/full scan; constant business-query count measured separately from auth overhead |
| Cursor |2048 characters max;15min TTL; Team-specific operation and actor/Workspace/status/order/limit/policy binding | Existing independent signer/keyring and primary revision locks;400 invalid,409 stale after authorization |
| Creation admission |5 attempts/hour/account,10/hour/Workspace | Valkey atomic bounded counters, existing coarse limits also apply; no refunds or automatic counter reset |
| Metadata admission |20 attempts/minute/account and60/minute/Workspace | All attempts including replays consume admission;429 with Retry-After; same-key reconciliation may wait |
| Read admission |60 requests/minute/account and300/minute/Workspace; retain existing coarse request ceiling |429; no polling or quota disclosure; quotas are local initial defaults, not capacity certification |
| Receipt storage |<=2000 rows/Workspace;<=20000 rows/deployment, counting full results, reservations and tombstones; each result<=16KiB | Atomic durable quota reservation with receipt/effect; total result payload budget<=320MiB plus bounded row/index overhead; generic503 on capacity, no counts disclosed |
| Transactions | Existing2s acquisition/5s callback,1.5s lock/4s statement; existing750ms Valkey acknowledgement bound | No longer deadline or external I/O; known serialization409; unknown/dependency failure503 |

All new receipt reservations must pass authenticated/authorized access before counters or existing receipt details are exposed. An immutable same-key reservation must not consume a second slot; rollback refunds only uncommitted durable reservations, never external rate counters. A small SQL-enforced deployment budget and Workspace budget are locked after Workspace authority and before new ledger insertion in consistent order. They are scoped Team infrastructure, not a generic raw persistence port. No reverse Workspace lock acquisition while holding budget/receipt locks. Concurrency tests must prove cap enforcement without COUNT-all scans, quota underflow, duplicate reservation or committed effect without receipt. Existing-key replay skips new capacity reservation and still reauthorizes before disclosure. Capacity outage/unavailable budget fails closed; no eviction of tombstones, dropping oldest keys, guessed counts or deferred unbounded accumulation. Approved migration/backfill must reconcile any existing receipt usage before admission opens. Long-term quota increase/retention/purge requires separate evidence and approval.

Workspace-wide admission/capacity errors are generic and never identify hidden Teams, owners, keys, names or counts. As with existing unique-key conflicts and admission, generic refusal is not a zero-information side-channel claim; do not add a hidden inventory or detailed diagnostic. Measure resource consumption, quota contention and hot-Workspace lock waits before raising limits; no enterprise throughput promise.

| Requirement | BE-TEAM-01 acceptance | BE-TEAM-02 later acceptance (not current grants) |
| --- | --- | --- |
| Private ownership/04/05 | Atomic creator owner/join; no ADMIN bypass; two tenants/colliding IDs; hidden/quarantined Teams excluded from list/detail/update/replay | Explicit member add/remove/transfer, target eligibility/privacy/consent |
|15 package boundaries | Closed Team ports, strict neutral DTOs, exactly four route grants; negative raw delegate/import tests | Separate exact management/lifecycle grants |
|19–26 live authority | Fresh sessions/primary fences and completion checks; revoked/demoted/suspended owner freezes update; OBSERVER reads only; reactivation freshly checked | Transfer/removal vs revocation; separately approved recovery |
| Lifecycle/04 | Archived metadata authorized read; archived Workspace/Team metadata writes denied; preserve existing active-Project archive/no-cascade invariants; no new lifecycle endpoint | Archive/restore vs Project creation and owned-resource races |
|24 bounded protocol | SQL-visible keyset list, size/cursor/key rotation negatives, authorized policy stale409, If-Match428/412 and visible403 vs hidden404 | Owner member-directory paging/revision privacy and limits |
| Migration/08/13 | Ten migrations byte-preserved; fresh+upgrade data/checksums/diff; ownerless quarantine; no guessed backfill; new insert cannot choose legacy/NULL owner; owner immutable | Deferred transfer/status migration; approved authoritative legacy repair only |
| Metadata/key | SQL+DTO key immutability, name/description Unicode+byte bounds, exact existing color tokens, positive version CAS | No rekey without separately approved routing/history semantics |
| Replay/storage | Atomic receipt/effect/version/revision; response-loss/same-key replay; changed body409; expired tombstone cannot reexecute; per-Workspace/deployment caps under concurrency; replay at full capacity | Management effect receipts with separately reviewed targets/preconditions |
| Frozen UX/NEXUS | No frontend/NEXUS modifications; honest unavailable later panels; no inherited Project/Issue capabilities | Separate frontend integration and later resource grants |
| Scalability/security | Bounded queries, admission outage503, measured plans/candidate counts/lock and receipt-budget contention; no cache/RLS claim | Lifecycle/management load and recovery-specific evidence |

Required future gates: frozen install; backend typecheck/lint/build and architecture/regression; real PostgreSQL/Valkey/HTTP Team negatives, procedural constraints, concurrency, response-loss/idempotency and auth outages; existing auth/session/fence/Workspace/invitation/tenancy/email/recovery integration; migration validation/status/fresh+upgrade/replay; live generated contract conformance; frontend typecheck/lint/tests/build with historical fixture failures separately reported. Preserve all failed observations and deadlines, including queue timing, SIGTERM143, dependency advisory and cold-migration risks. Do not claim approval/security from a proposal validator or local query plan.

## 10. Final review boundary

The ten security/product defaults and the BE-TEAM-01/02 split are approved. This correction fixes the four-endpoint foundation scope and proposes numeric budgets for final review; it does not reopen approved defaults or treat later endpoints as implementation grants. PR #39 remains documentation-only. No Team field, SQL migration, route, DTO, permission grant, frontend or fixture is implemented. No merge/implementation authorization is inferred.

Next checkpoint: human review of this corrected proposal, phase acceptance matrix and measurable limits. BE-TEAM-02 member management/transfer/archive/restore remains later work; orphan recovery needs separate approval. Historical queue, SIGTERM, advisory, cold-migration and three NEXUS failures remain open. Stop before merging or implementing.
