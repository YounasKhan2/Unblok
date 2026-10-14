# BE-TEAM-01 — Team architecture and authorization proposal

Status: **proposal for human approval; no implementation authorized**. Date: 2026-10-14.
Base: merged FE-WS-02 main `3deaf88f089cc268cda893b8f3e14ec83d210e8d`.
Scope: Team ownership/membership, explicit grants, lifecycle, tenant integrity, contracts, traversal and concurrency. No schema, migration, runtime contract, route, frontend or fixture is changed by this document.

## 1. Reviewed authority and existing behavior

Preserve the Bun/NestJS modular monolith, PostgreSQL/Prisma database ownership, neutral strict Zod contracts, request-bound principals, live Valkey sessions, primary auth fences, CSRF/Origin checks, bounded transactions and private no-store responses. Applicable sources: [module boundaries](15-BE-00D-MODULE-ARCHITECTURE.md), [domain](14-BE-00C-DOMAIN-TENANCY.md), [sessions](20-BE-00H-SESSION-INFRASTRUCTURE.md), [Workspace foundation](25-BE-WS-01-WORKSPACE-FOUNDATION.md), [invitation security](26-BE-WS-02-MEMBERSHIPS-INVITATIONS.md), [enterprise contracts](24-BE-API-00-ENTERPRISE-CONTRACTS.md), and their [authorization](contracts/be-api-00/authorization.md), [lifecycle](contracts/be-api-00/lifecycle.md) and [performance](contracts/be-api-00/performance.md) companions. Earlier draft grants and historical review labels do not override merged implementation.

Source audit:
- Prisma Team has composite (workspaceId,id), workspace FK, scoped unique key, name, ACTIVE/ARCHIVED and creation time. TeamMembership joins a Team to a workspace membership using composite FKs and a unique composite PK. **No Team owner, management role, visibility mode, description, color or version exists.**
- Projects belong to Teams through workspace-composite FKs. Existing SQL prevents Team archival while ACTIVE projects remain. Hard deletion is restrictive; archived workspace mutations are rejected. Team name has a SQL case-insensitive unique index. Team key is not currently protected by the project's immutable-key trigger.
- Frozen frontend Team types include description, color, leadId, memberIds; directory/hub derive project, issue, blocker and planning aggregates from demo state. CreateTeamModal uses name/key/description/color and requires workspace Administrator. leadId is not proof of backend ownership. Demo global User.role and memberIds are not production authority.
- Real accounts currently have Workspace flows, not real Team routes. NEXUS remains fixture-backed under the labelled demo. Future live integration needs its own FE-TEAM slice; this proposal does not change screens or make currently unavailable aggregates appear as zero.

## 2. Product decisions requiring approval

The defaults below are **recommendations**, not approved grants. Implementation is blocked until each relevant decision is resolved.

| Decision | Recommended BE-TEAM-01 default | Alternative / consequence |
| --- | --- | --- |
| Team privacy/discovery | Every Team is private to explicit Team members; no public/workspace-visible mode in this slice | Workspace-visible Teams require a separately approved visibility model and discovery policy |
| Ownership | Exactly one explicit owner, represented by a workspace-membership reference and an actual TeamMembership; creator becomes owner atomically | Multiple owners or manager roles require new role/delegation and last-manager semantics |
| Creation/management | ACTIVE workspace ADMIN creates; mutable management requires both ACTIVE ADMIN and ownership of that specific Team | Owner-only management by ordinary MEMBER changes frozen Administrator-only expectations and needs explicit product/UX approval |
| Owner eligibility | Creation/transfer target must be ACTIVE ADMIN; OBSERVER cannot own/manage | Delegated MEMBER ownership is possible only after explicit policy approval |
| Member addition | Owner adds an existing ACTIVE workspace membership, MEMBER or OBSERVER; no email lookup, Team invite proof or automatic Workspace joining | Consent-based joins require a distinct invitation/request flow |
| Management privacy | Owner sees Team membership directory and a bounded eligible ADMIN workspace directory for additions; ordinary Team users see no directory initially | Broader member visibility needs privacy review |
| Lifecycle reads | Explicit authorized Team members may read archived Team metadata, no ordinary project/issue traversal; owners can restore in active workspaces | Hiding all archived metadata changes directory/archive UX |
| Ownership loss/recovery | Revocation/demotion is never blocked for Team ownership. Retain historical owner reference, freeze management, require separately reviewed recovery | Automatic ADMIN takeover would expose private Teams and is rejected |
| Owner transfer | Existing Team member who is ACTIVE workspace ADMIN, explicitly selected by current owner; owner remains regular Team member | Removing prior owner automatically needs explicit consent and scope review |
| Metadata/key | Preserve description/color controls through additive fields; immutable Team key after creation | Rename/rekey requires routing/history/conflict design; do not silently permit or remove frozen controls |
| MVP boundary | List/detail/create/edit metadata, bounded owner member directory, add/remove existing members, transfer, archive/restore; no delete | Split membership/transfer writes into BE-TEAM-02 if review or implementation exceeds a narrow slice |
| Retention/admission | Reuse reviewed ledger/key patterns; explicit quotas and proofless management rate defaults must be approved before shipping | No unbounded ledger growth, speculative purge, or invented enterprise capacity claim |

Consent, quota values, description byte/character bounds, color-token vocabulary, archived metadata policy, transfer/removal interaction and orphan recovery are approval topics. Do not assume silence means approval. The API subset can be narrowed at review; the authorization invariants cannot be relaxed.

## 3. Ownership and membership model

The Workspace owns the tenant boundary; a Team owns its Projects. Team ownership is management authority, not a global user role or ownership of every Project/Issue. Recommended single ownerMembershipId points to the workspace membership through the TeamMembership composite key (workspaceId,teamId,membershipId), not directly to a User. Ownership and membership changes commit together. A display lead, if later approved, is separate non-authorizing metadata.

Membership means explicit Team relationship intersected with current ACTIVE workspace membership, enabled account and live session authority. Suspension/INVITED status removes effective access while retaining historical join/owner references. Reactivation may resume retained Team access under the existing relationship; this is an explicit approval topic, not an invitation acceptance bypass. Workspace invitations never create TeamMembership. Workspace ADMIN alone does not discover, read, join, manage, transfer or restore an existing private Team.

Membership join has no new global/team role enum in the recommended MVP. Owner is explicit; other member permissions come from current workspace role and exact Team action. OWNERSHIP DOES NOT imply Project/Issue CRUD grants. Transfer is not account linking or workspace role elevation. Removing the owner is rejected until a successful atomic transfer. Self-removal for nonowners may be included only if approved; no client-provided actor/role/owner authority is accepted.

Demotion/suspension/disable takes effect regardless of owner status. An ineligible owner leaves a managed recovery gap; do not block security revocation to preserve convenience, auto-promote another user, auto-enroll ADMIN, or expose orphan Team names in a management inventory. A recovery protocol with consent/audit and hidden-resource handling is outside this proposal's implementation grant.

## 4. Action matrix (recommended, not runtime policy)

Every row requires global request authority and ACTIVE workspace membership. Unknown actions deny. Scope/status overrides role. Archived Workspace is read-only. Access to a hidden Team returns the same generic404 as nonexistent/foreign Team; global invalid session401.

| Action | ADMIN nonmember | ADMIN Team member, nonowner | Eligible ADMIN owner | MEMBER Team member | OBSERVER Team member |
| --- | --- | --- | --- | --- | --- |
| Create new Team | Allow only explicit create action; no access to existing Teams | Same | Same | Deny | Deny |
| List/detail active own Teams | No hidden rows | Allow | Allow | Allow | Allow read |
| Archived metadata | No hidden rows | Allow if approved lifecycle read | Allow | Allow | Allow read |
| Team membership directory | Deny | Deny | Allow bounded management projection | Deny | Deny |
| Metadata/add/remove/transfer | Deny | Deny | Allow exact action in active Workspace/Team | Deny | Deny |
| Archive/restore | Deny | Deny | Allow exact lifecycle action with parent/project checks | Deny | Deny |
| Project/Issue/Dependency data | Deny without resource grants | No inherited umbrella grant | No inherited umbrella grant | No inherited umbrella grant | No inherited umbrella grant |

Owner capabilities are server hints, never reusable evidence. A later mutation resolves fresh ownership/membership/role. Private Team counts, search choices, duplicate-key errors and member projections must not leak hidden Teams or contact emails. Existing member-directory access is ADMIN-only and does not grant any Team access.

## 5. Additive database plan, migration safety and lifecycle

Proposed additions, subject to approval: Team ownerMembershipId, positive version, description (proposed 2000 Unicode characters with separate UTF-8 byte bound), approved bounded color token; TeamMembership joinedAt; Team-list data revision; Team mutation result ledger and supporting indexes. Do not import transport schemas into database or expose raw Prisma models.

Constraints:
- Preserve current tenant PK/FKs, scoped unique uppercase key (2–6 alphanumeric), case-insensitive scoped name uniqueness and all ten applied migrations.
- Add composite owner FK to TeamMembership with RESTRICT, DEFERRABLE INITIALLY DEFERRED to permit atomic Team + creator join insertion. Add corresponding checks/closed write enforcement; after commit owner and Team membership must agree.
- Existing owned databases may contain Teams with no joins, unknown owners or inactive memberships. Inventory first, never infer owner from first member, leadId, ADMIN or fixtures. A nullable migration/backfill interval must quarantine unowned Teams from new owner-dependent capabilities. Strict NOT NULL contraction requires approved authoritative backfill; fresh created Teams must never commit without owner. Do not expose legacy Teams under permissive fallback.
- Owner changes, Team key/identity immutability, positive versions and legal status transitions require SQL enforcement where expressible plus closed authorized capabilities. Creator/owner eligibility is a transaction rule; permanent ACTIVE-owner checks must not block workspace suspension.
- Existing RESTRICT FKs and no-cascade semantics stay. No purge/delete endpoint; no deletion or reparenting of owned Projects. Archive rejects ACTIVE owned Projects, never archives them implicitly. Restoring Team does not restore Projects/Issues or membership authority.
- Workspace archive blocks Team mutations and ownership changes. Metadata/joins freeze while Team archived; only explicitly authorized restore is permitted in an ACTIVE Workspace. Ordinary Project/Issue reads continue to exclude archived ancestors.
- Positive policy/data revision increments and ledger effects commit atomically; raw maintenance writes require the same revision/lock discipline, never trigger-disable bypass.
- Index candidates: Team(workspace,status,createdAt,id); TeamMembership(workspace,membership,team) existing access join; TeamMembership(workspace,team,joinedAt,membership) directory; unique ledger(actor,workspace,operation,key). Justify actual indexes using bounded query plans before install; no premature cache/denormalized aggregate fields.

Review original trigger behavior against these policies before adding a new migration. New corrective enforcement must be additive and tested fresh plus original ten-migration upgrade with retained rows/checksums. Never edit applied SQL, reset, db-push or infer empty production data. Forward fix preferred; application rollback needs schema compatibility checks. Backup/PITR/least-privilege roles remain operational requirements; RLS is not implemented or claimed.

## 6. Proposed REST contracts and bounded UX handoff

All paths below are under /api/v1. Promote approved schemas into neutral strict Zod and generate live OpenAPI/types only in the implementation phase. Unknown/duplicate query fields reject400; projections never contain ORM rows, emails, auth evidence or hidden aggregates.

| Proposed route | Input / output | Authority and bound |
| --- | --- | --- |
| GET /workspaces/:workspaceId/teams | status ACTIVE (default), ARCHIVED or ALL; limit default50/max100; cursor; TeamPage | Explicit own-Team SQL selector; private no-store; response128KiB |
| GET /workspaces/:workspaceId/teams/:teamId | TeamDetail; metadata, status, version string and own capability hints | Current Team access;64KiB; no Project/Issue expansion |
| POST /workspaces/:workspaceId/teams | name/key/description/color only;201 TeamCreated | ACTIVE ADMIN, active workspace, CSRF, Idempotency-Key; atomic creator owner/join |
| PATCH /workspaces/:workspaceId/teams/:teamId | Approved metadata only;200 TeamDetail | Owner AND ACTIVE ADMIN, active parents, If-Match and Idempotency-Key |
| GET /workspaces/:workspaceId/teams/:teamId/memberships | limit default50/max100; cursor; management projection displayName/workspaceMembershipId/role/status/joinedAt | Owner directory grant;128KiB; no credential/contact email |
| POST /workspaces/:workspaceId/teams/:teamId/memberships | workspaceMembershipId;201 TeamMembership | Eligible existing ACTIVE workspace membership; no caller-selected role; owner grant/CAS/key |
| DELETE /workspaces/:workspaceId/teams/:teamId/memberships/:membershipId | No body;204 | Owner grant/CAS/key; owner removal rejected; historical workspace membership not deleted |
| POST /workspaces/:workspaceId/teams/:teamId/ownership-transfer | ownerMembershipId;200 TeamDetail | Current owner and eligible existing Team member; atomic transfer/CAS/key |
| POST /workspaces/:workspaceId/teams/:teamId/archive or /restore | Empty strict body;200 TeamDetail | Exact lifecycle grant/CAS/key; active Workspace; archive active-Project conflict |

Team DTO: workspaceId,id,key,name,description,color,status,createdAt,version and fixed own capabilities. Do not include ownership/member/Project counts in general pages until privacy approved. Owner directory can include explicit isOwner. Raw leadId/memberIds from demo do not map automatically to wire input. UUID identity remains canonical; if future frozen key routes need resolution, add a reviewed scoped key lookup, never fetch-all matching in the browser.

Use current error envelope:401 unauthenticated;404 inaccessible scope before revealing Team facts;400 malformed input/cursor;409 known state/version/idempotency/cursor conflict;429 admission with Retry-After;503 dependency/unresolved outcome. Proposed If-Match required428 and failed precondition412 follow enterprise protocol and need implementation contract conformance; do not silently map them to a competing envelope. Generic uniqueness409 must not reveal the conflicting Team.

If-Match is an actor-authorized opaque Team resource version, never authentication. Mutation body has no arbitrary status, owner, workspace/user identity, team role, related Projects or unrestricted update fields. Mutation responses bounded64KiB. Shared response interceptor bounds apply to serialized UTF-8 bytes. No unbounded totals, bootstrap, bulk joins or external I/O in transaction.

Description/color persistence avoids silently removing frozen controls. Metrics, Projects, Issues, planning and blocker panels remain explicitly unavailable until their capabilities exist, not fabricated zeros/fixtures. Full frozen Team hub parity requires later resource slices; FE-TEAM scope must acknowledge this instead of claiming complete integration.

## 7. Pagination and privacy

Filter visibility in SQL using current ACTIVE workspace membership and explicit TeamMembership, before pagination/counts. Team list order immutable (createdAt,id) ASC; signed cursor stores the last inspected tuple, actor, workspace, operation, canonical status/order, current policy revision, key ID/version and issued/expiry times. Do not require the last row to still exist. No search/free-text/mutable-name sort in MVP; later directory search needs approved normalization/index/privacy semantics.

Reuse the reviewed independent cursor keyring only through its scoped helper with a Team-specific domain/operation binding; no invitation/session/recovery secret reuse. TTL<=15min; unknown/retired/bad signatures400, missing key503; rotation/compromise behavior follows Workspace contracts. Bound cursor bytes as existing reviewed cursor limits; do not expand limits implicitly.

Authorize the current scope before cursor-binding/revision errors: revoked/hidden Team404, valid actor with stale policy409. Team join/owner/workspace-role/status changes advance workspace policy revision atomically. Member-directory metadata changes need a Team directory data revision or explicitly documented live display; proposed directory revision pinning returns409 and restarts on relevant changes. No snapshot guarantees claimed.

Immutable Team-list traversal is live: current filtered rows only; metadata may update, earlier inserts may require refresh, removals disappear. Every page obtains fresh authority; no principal reused between requests. Listing yields only actual accessible rows, no exact total or hidden aggregate. Owner-only member pages sort (joinedAt,membershipId), with bounded explicit legacy joining-time treatment; do not invent timestamps in DTOs.

## 8. Transactions, conflicts, replay and revocation

Closed Teams capabilities in packages/database; feature module receives no raw Database, Prisma delegate or principal evidence. Add exact controller handler references to the existing deny-default guard; no @Roles admin bypass. Own feature transport/application layers remain architecture-checked.

Lock order: discover immutable target bindings without authority; acquire all required user fences sorted UUID -> acting family -> Workspace -> mutation receipt -> Team -> affected TeamMemberships sorted identifiers -> owned Project rows when required. Acquire each earlier lock once. Validate target workspace membership under Workspace lock; no target session is fabricated. Completion revalidates held auth locks without reacquiring earlier rows. If another required user is discovered late, roll back and restart through the complete bounded capability, not reverse acquisition. All lifecycle/maintenance paths must follow this order. SQL BEFORE triggers alone cannot impose application order on arbitrary raw UPDATE.

Keep current SERIALIZABLE transaction bounds, lock/statement limits and callback lifetime; no external service call, auto-retry of side effects or new long-running transaction. Workspace lock remains conservative integrity fence, with SHARE on reads and UPDATE on mutations; measure hot-tenant contention before narrowing. Project creation must use this same Workspace lock before future Team/project writes, so Team archive and project creation cannot both commit an invalid graph. Existing direct project lifecycle constraints still apply.

Mutation receipt unique(actor,workspace,operation,key) stores domain-separated canonical payload digest (including path, version precondition and operation), bounded result/reference, retention timestamp and immutable tombstone. Authorization precedes replay result disclosure and cleanup; matching key/body returns the original confirmed result, changed body409. Completed If-Match retries reconcile through authorized receipt before testing current version; a new key with stale If-Match fails precondition. Repeated grants cannot apply twice. Different-key add of an existing Team member returns generic409; same-key success replays.

Retain full nonsecret response minimum24h; after expiry keep minimal tombstone with409 and never execute again. Retention/purge/restore policy needs approval and no automatic cleanup is presumed. Keyed digests and independent key rotation must preserve old minimal replay safety. Existing Workspace receipt table is not casually repurposed into generic unrestricted persistence.

Known serialization/deadlock conflict409; lock/dependency timeout or unknown commit503 is not cancellation. Client retains same key/body/precondition and performs fresh authorized reconciliation; no automatic replacement key. Revocation-first rejects or forces rollback; an earlier read/write with conflicting locks can complete before revocation commits. Bytes already returned cannot be recalled.

Expected races: same-key create produces one Team/owner/join; duplicate keys/names yield one winner without hidden-resource details; owner transfer versus remove cannot orphan Team; demotion/suspension versus management produces ordered success-before-revocation or denial/rollback; Team archive versus active Project creation cannot leave archived Team with active Project; version conflicts never silently overwrite; list continuation after policy change restarts only after fresh authorization.

## 9. Implementation acceptance and compliance checklist (future work)

| Applicable requirement | Proposed implementation | Required future evidence |
| --- | --- | --- |
| Domain/04/05: tenant ownership, no ADMIN bypass | Composite owner/join FKs; explicit Team selectors and action grants | Two tenants with colliding IDs; hidden ADMIN reads/writes/counts; foreign owner/member references |
| 15: module/package boundaries | Closed database ports, neutral DTOs, exact route allowlist | Static architecture tests and negative imports/raw delegate fixtures |
| Auth/session/19–26: live primary authority | Sorted user/family locks, fresh membership and completion revalidation | Revoked/disabled/stale session, workspace suspension, owner demotion in both orderings |
| Lifecycle/04: archive, retention and safe recovery | Restrictive graph, no implicit Project cascade/owner takeover | Archive versus Project creation; restore; owner removal/transfer; ineligible owner freeze |
| Enterprise24: bounded reads/protocol | SQL visibility, signed cursor, strict projections, CAS/receipts | Negative cursor actor/tenant/operation/key/status, deleted tuple, stale revision, response bytes |
| Migration/08/13: additive replay | New reviewed migration; existing ten byte-preserved | Fresh deploy/replay/diff; existing-data upgrade, quarantine/backfill and procedural SQL tests |
| Frozen UX/NEXUS | No frontend implementation in BE phase; explicit FE handoff | Production/source diff; later browser/error/keyboard/visual parity, no fake fallback |
| Scalability/security | Existing bounded transactions, no cache/RLS claim | Query plans/query counts/limits and contention evidence; production acceptance separately |

Required future gates: frozen install; backend typecheck/lint/build and architecture/regression; real PostgreSQL/Valkey/HTTP Team negatives, procedural constraints, concurrency, response-loss/idempotency and auth outages; existing auth/session/fence/Workspace/invitation/tenancy/email/recovery integration; migration validation/status/fresh+upgrade/replay; live generated contract conformance; frontend typecheck/lint/tests/build with historical fixture failures separately reported. Preserve all failed observations and deadlines, including queue timing, SIGTERM143, dependency advisory and cold-migration risks. Do not claim approval/security from a proposal validator or local query plan.

## 10. Review boundary

Approve or revise section2 decisions and endpoint subset before drafting an implementation task. Ownership/management privacy, eligible owners, reactivation, consent, orphan recovery, metadata/color/key policy, limits/admission and API precondition semantics need concrete decisions. No Team ownership fields, migrations, grants, endpoints, UI, fixtures or automatic private-Team enrollment have been implemented. Stop for human architecture review.
