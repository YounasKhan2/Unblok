# BE-WS-01 — Workspace backend foundation

Implementation for human review, not merged, deployed or enterprise-certified. Branch `feat/be-ws-01-workspace-foundation`; exact clean starting/main merge baseline `3fcbc37cfe8eca6a03a1a01f3f7d4926eafa6037`. Delivery PR records the exact resulting commit. Reviewed documents14–24, including the merged BE-API-00 Workspace, authorization and lifecycle contracts. Existing authentication behavior, frontend, NEXUS fixtures, eight merged migrations and dependencies are preserved.

## Implemented policy and contracts

| Endpoint | Result | Authority / limits |
| --- | --- | --- |
| POST `/api/v1/workspaces` | 201 WorkspaceCreated; same-key replay201 | Enabled authenticated account; fresh cookie/live Valkey/request principal + primary fences; existing strict Origin/CSRF; strict name/slug-only body≤2KiB; one UUID Idempotency-Key; atomic ACTIVE workspace/creator ACTIVE ADMIN |
| GET `/api/v1/workspaces` | 200 WorkspacePage | Own ACTIVE membership relation only; default50/max100; UUID ASC/DESC; optional signed `after`; no status/user/role/search filter or implicit total;≤101 candidate rows/locks |
| GET `/api/v1/workspaces/{workspaceId}` | 200 WorkspaceDetail | Own current ACTIVE ADMIN/MEMBER/OBSERVER membership; archived workspace readable; inaccessible/missing/INVITED/SUSPENDED404 |
| GET `/api/v1/workspaces/{workspaceId}/me` | 200 WorkspaceSelf | Same current primary membership checks; server-derived hints only |

All four responses are `private, no-store` and bounded to64KiB of uncompressed UTF8 JSON. Detail/create/self reject unknown query keys; list rejects unknown and duplicate scalar parameters. GET bodies are rejected. List pages stop at complete item boundaries when escaped names approach the byte cap, retain a continuation, and reserve4KiB for envelope/cursor. Schema/byte-invalid business output refuses503; auth interceptor behavior remains unchanged.

Only `readWorkspace` is true. Directory, invitations, team creation, issue writes, dependencies and completion hints remain false; no corresponding handlers or grants are installed. Workspace ADMIN never bypasses existing team/project policies or the dependency SQL gate. These four exact handlers pass the foundation dispatch guard **only to enter their own fresh Sessions.withRequest boundary**. No URL/metadata/module-wide public bypass, arbitrary CRUD capability or raw Prisma/transaction export is added.

Neutral Zod is the production schema source. [Generated OpenAPI](evidence/BE-WS-01-openapi.json) is reproducible with `bun scripts/backend/workspace-contracts.ts`; generated parity and approved Workspace field vocabulary are checked by `workspace-contracts.test.ts`. The earlier BE-API registry remains an explicitly historical proposal, not a claim that all21 operations are live. Existing auth contracts/envelopes are preserved. Workspace409 additionally identifies `CURSOR_STALE` and `IDEMPOTENCY_RESULT_EXPIRED`; other conflicts are generic. No hidden workspace names/identities are returned on slug conflicts.

## Additive migration and database boundary

New ninth migration: `20261012000000_workspace_foundation`. It adds:

- `workspace_discovery_revisions`: one positive BIGINT per account, existing users backfilled, new-user insert trigger, membership insert/update/delete trigger increments revision atomically. Membership actor reassignment is refused. Separate storage avoids upgrading a user auth SHARE fence after acquiring a workspace lock.
- `workspace_creation_results`: nonnullable actor/account scope/operation/key/digest uniqueness; immutable result pointer and request binding; JSON result≤64KiB; minimum24h result retention; user/workspace restrictive FKs. Workspace pointer is nullable **only while the transaction creates its effect**. A deferred constraint checks the completed row at COMMIT and rejects any incomplete reservation. No separately committed IN_PROGRESS state.
- Ledger trigger allows only the initial reservation→completed result transition, or removal of an expired result to a tombstone. Completed metadata cannot change and ledger deletion is refused.

Prisma models map these additive tables. No reviewed migration is modified. Migration replay, complete schema diff, pre-existing upgrade/history checks and real failed-admin rollback are tested. Database trigger privileges remain deployment-controlled; the existing production elevated/owner/DDL-role rejection remains in place. Tests create isolated owned databases and clean only their own rows/Valkey prefixes.

Persistence lives in `packages/database/src/workspaces.ts`, callable only through owning Tenancy methods. Each method rejects forged, cross-instance, escaped and non-session principals; locks/rechecks current user/identity/epoch/family on entry and completion; requires active request ALS context. No identity, role, user or family can be supplied through an HTTP DTO. Current-user lookup supplies rate-limit actor identity; a subsequent creation transaction revalidates it. No Valkey operation occurs inside a PostgreSQL transaction.

## Creation, replay and unknown outcomes

Global order remains user→family→existing workspace when replaying→unique ledger→revision/resources. Replay discovers an immutable ledger pointer without locking, authorizes/locks its existing workspace, reserves/re-reads the unique ledger, then validates current membership/revision before returning the original result. New creation skips an existing workspace lock, inserts the transaction-local ledger reservation, creates a new UUID workspace and ACTIVE ADMIN, and completes the ledger in the **same SERIALIZABLE transaction**. Every effect disappears if admin/result insertion or final authority validation fails.

Concurrent same-key insert waits on PostgreSQL uniqueness; bounded lock/serialization conflict returns409 with Retry-After, then a new fresh request can replay. Same key/different canonical body409. Slug uniqueness yields generic409 and no partial membership. No automatic mutation retry is performed. All transactions retain existing2s acquisition/5s callback,1.5s lock and4s statement limits.

Lost acknowledgement after a real committed effect returns503. The integration test discards that acknowledgement outside the actual PostgreSQL transaction and proves a same-key subsequent request returns the single committed result. A timeout is never cancellation; another key is unsafe. Current auth/membership is mandatory on replay. Retention expiry returns409 without re-execution and commits result removal to a permanent keyed tombstone. Result cleanup is lazy on replay; a scheduled expired-result sweeper/privacy policy is an operational requirement, not an installed worker. No tombstone purge or idempotency-key reuse policy is approved.

Creation admission:5attempts/hour/account and10/hour/trusted IP, in addition to the existing coarse limiter. Atomic Valkey counters, keyed actor namespace, bounded750ms acknowledgement; all submissions including failures/replays consume budget, no refunds/resets or timeout cancellation assumption. Unknown-outcome reconciliation can consequently be delayed by exhausted admission; it must retain its original key. Quotas require product/deployment review; they are not enterprise capacity evidence.

## Discovery, revision and revocation

Cursor payload binds version/key ID, actor, `workspaces:list:v1`, normalized limit/sort, UUID comparator tuple, current account discovery revision and exact issue/expiry times. Fixed projection/no filter/no tenant root are encoded by this operation version. Maximum TTL15min; length≤2048; independent32-byte HMAC-SHA256 key/domain `unblok-api-cursor-v1`. Strict payload keys, bounded parse, MAC, issuance, expiry, key and binding checks follow fresh authentication. Changed actor/query400; changed membership revision409 CURSOR_STALE. Revoked authentication401; inaccessible scoped workspace404. Cursors confer no authority and include no hidden names.

Paging is live immutable UUID ordering, not an export/snapshot. Inserts preceding the last tuple may be omitted; membership insert/delete/status/role transitions conservatively stale the cursor. Row edits/archival remain readable according to the matrix. No positive response cache, graph revision, data outbox or cross-resource revision system is implied.

List performs three constant business SELECTs: account revision, indexed membership/workspace join with LIMIT(limit+1)/workspace SHARE locks, then revision SHARE lock. Detail/self perform three: workspace/membership join with workspace SHARE lock, revision SHARE lock, own membership-ID projection. Auth/fence queries are separate mandatory overhead. No per-item membership lookup/N+1 or full collection load. The revision lock occurs **after** workspace locks; existing membership mutations lock workspace UPDATE then change revision. A change committed after the SERIALIZABLE snapshot makes the revision lock reject a stale read, even if the workspace tuple itself is unchanged. A read holding shared locks first may finish before revocation commit; revoke-first denies/conflicts and later requests404. Bytes already delivered cannot be recalled. There is no unbounded stream or principal reused across pages.

## Keys and deployment

Provision `WORKSPACE_CURSOR_KEY_ID`, `WORKSPACE_CURSOR_KEY`, optional previous ID/key, and `WORKSPACE_IDEMPOTENCY_KEY`. Hex32-byte random independent secrets; do not reuse sessions, email/recovery or each other. Main rejects reuse with those configured keys; owning capability snapshots the keyring. Missing/invalid keys fail creation/list503; startup/auth/health remain independent. `init:local` includes fresh keys for newly created env files and preserves existing files, so existing installations must provision them explicitly.

Rotation requires stable nonsecret key IDs, new active signer on replicas, previous verify-only key for the last old issuance TTL plus reviewed clock/deployment margin. Immediate removal rejects compromised/retired cursors. Keep the idempotency digest key stable for retained ledger rows; rotating it needs an explicit digest-key migration/versioning plan. No secret values or full cursors/bodies enter logs/evidence. PostgreSQL effect/ledger/revision restoration must be consistent; session restoration still follows BE-00G/H epoch/namespace/key retirement rules. No runtime DDL or disposable credentials are installed.

## Verification and remaining risks

[Machine-readable observations](evidence/BE-WS-01-verification.json) preserve successful and failed executions; [real query plans](evidence/BE-WS-01-query-plans.json) use an owned105-visible-membership dataset. Actual list output is101 candidates maximum, uses `workspace_memberships_user_id_status_workspace_id_idx` and `workspaces_pkey`; detail uses workspace PK and unique(workspace,user). These submillisecond local plans do **not** measure enterprise capacity, full auth cost, hot-workspace contention or deployment performance. No speculative index or package is added.

Focused PostgreSQL/Valkey/HTTP coverage includes atomic admin/ledger creation, same/different-key concurrency, direct incomplete-reservation and ledger-tamper rejection, rollback, lost acknowledgement, body/query/CSRF/auth attacks, foreign/suspended/archived authority, fresh principal lifetime, pagination/byte boundaries, stale revision, cursor rotation/retirement/expiry, rate admission, actual cache connection loss, actual primary new-connection outage, both revocation orderings and constant read query counts. Required final results are recorded in the evidence and delivery PR.

| Gate | Final local result |
| --- | --- |
| Workspace PostgreSQL/Valkey/HTTP |20pass,0fail,348 assertions |
| Authentication HTTP |26pass,0fail,827 assertions |
| Sessions security |31pass,0fail,473 assertions |
| Auth fences |24pass,0fail,134 assertions |
| Tenancy and upgrade/migration replay |34pass,0fail,132 assertions |
| Email verification / recovery |16pass/468 assertions;18pass/421 assertions;0fail |
| Database integration |2pass,0fail,5 assertions |
| Backend regression including architecture fixtures |99pass,0fail,263 assertions |
| Generated contract conformance |1pass,0fail,8 assertions |
| Static architecture / typecheck / lint / API+worker build |Passed;374files/1028edges/0violations |
| Migration validate / real fresh replay/schema parity |Passed;9 additive migrations |
| BE-API design validator |Passed;21ops/55schemas/27examples/26negativechecks/32model scenarios |
| Infrastructure |5pass,0fail,18 assertions; no reliability claim |
| Lifecycle |1pass,2fail,7 assertions; API/worker SIGTERM143 |
| Dependency audit |Exit1 DNSResolveFailed; historical advisory unresolved |

Auth/security gates preceding the final ledger correction exercise unchanged foundation contracts; final tenancy replay and focused Workspace suite exercise the corrected ninth migration. Authentication/session HTTP gates were repeated after final API integration edits. Documentation links and staged diff checks are included in delivery evidence.

Intermediate observations remain visible: first cold migration setup reached the unchanged6s deadline and cleanup encountered an unconnected cache; initial advisory SELECT deserialization returned503, corrected to the approved unique reservation design; a Prisma thenable test assertion needed Promise.resolve before executing the SQL assertion. Timeouts/assertions are not increased/weakened. Existing auth/session/fence/tenancy/email/recovery/regression/database gates passed; historical queue timing/between-test errors remain unresolved even though this run passed5/5. API/worker SIGTERM143 continues to fail2 lifecycle cases; audit DNS failure leaves its current gate unresolved and the previously reported deepmerge-ts/Prisma advisory unresolved. Three historical NEXUS frontend failures are retained; frontend is unchanged and was not recertified here.

Pending: human review/migration deployment, exact runtime grants, independent secret provisioning/rotation/restoration, scheduled result cleanup/retention policy, product quotas, larger and hot-tenant benchmarks, production TLS/proxy/CORS/browser evidence, queue/shutdown reliability and dependency audit. Team/Project/Issue/Dependency and invitation APIs, resource grants and frontend Workspace integration are absent. Stop at review; no merge or BE-WS-02.
