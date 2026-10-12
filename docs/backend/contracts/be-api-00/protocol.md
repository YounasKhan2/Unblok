# Proposed transport and compatibility contract

Design only. [ADR](../../24-BE-API-00-ENTERPRISE-CONTRACTS.md) and [registry](registry.json) establish scope/status.

[Workspace MVP](workspaces.md), [explicit policy](authorization.md) and [revision/cursor/idempotency lifecycle](lifecycle.md) complete this contract. Lifecycle retention rules supersede any ambiguous24h deletion implication below: full results are retained at least24h, minimal tombstones prevent same-key re-execution until a separately approved purge policy. No such infrastructure is implemented.

## Scope, versions and payloads

Use `/api/v1`. UUIDs select immutable resources; slug/team/project keys and derived issue keys are display/navigation aliases. Resolve aliases within explicit workspace scope, never globally. Nested routes independently validate parent-child relationships. Global `/workspaces` lists only the principal's ACTIVE memberships. My Work derives the user's membership from the principal, never a submitted user ID.

Strict schemas reject unknown fields/query keys, duplicate scalar query parameters, bad UUID/enums/non-finite numbers and excess lengths. Bounds cover characters and serialized UTF-8 bytes. Business body32KiB, batch64KiB; response caps measure **uncompressed UTF-8 JSON including envelopes**, not compressed wire size. Check size before headers. Stop pages at valid item boundaries with continuation; never truncate JSON. One item violating its declared schema/byte bound causes generic503 and investigation.

Add optional fields only after old strict readers tolerate them; coordinate neutral Zod/client rollout and negotiated projections. Breaking fields/enums/order/semantics need a new reviewed projection/major version and explicit deprecation/client migration evidence. Do not change implemented auth contracts. Registry revision1 is a research revision, not a released API.

## Keyset, filters and fields

Default limit50/max100/min1; after cursor max2048characters. Page `{items,page:{nextCursor,hasMore}}`, no implicit exact total. Registered list sorts created_asc/created_desc use total tuples `(createdAt,id)` ASC or DESC; reverse comparator is `<`, forward is `>`. Workspace list uses workspace UUID ASC/DESC via workspace_asc/workspace_desc. null handling/collation and tie-breakers must be declared for every other sort. Unsupported name/priority/manual sort returns400 rather than silently falling back. My Work sections page independently. Name/priority/update/manual ordering requires matching models/indexes and revision semantics before registration. CreatedAt is not a silent replacement for frozen manual UX.

Proposed cursor: version, route/projection, actor, workspace/project/team, canonical filter/field/sort hash, last tuple, optional first-page creation watermark, relevant data/authorization revision, issued/expiry time/key ID. Domain-separated independent HMAC key and constant-time verification; base64 alone is neither authenticity nor encryption. No hidden names/secrets or logged cursors. TTL15minutes. After authorization, tamper/expired/scope mismatch400 INVALID_CURSOR; changed declared graph/sort revision409 CURSOR_STALE. Inaccessible scope404 without existence disclosure. Cursor never grants authority. Store last tuple so deletion of its row does not break paging; existing `TenantQueries.issues(afterUUID)` is not this API cursor.

Live keyset traversal is **not an across-request snapshot**. Deletes disappear; optional watermark excludes later creations; edits can change filter membership. Dedupe composite IDs, refresh first page after filters/mutations, never promise complete historical export. A mutable sort must restart on revision change or explicitly document moving-row behavior; no silent snapshot claim.

Route allowlists only: q≤100, up to6state/4priority enums, scoped assignee/team/project, authorized ACTIVE/ARCHIVED/ALL where supported, blocker ALL/BLOCKED_ONLY/UNBLOCKED_ONLY. No SQL/JQL, arbitrary columns, regex, free OR trees or nested expand. Text debounce300ms, minimum2characters; exact issue key lookup separate. Approve text/substring analyzer semantics against current case-insensitive fixture UX before integration. Saved views await durable validated models.

Start with purpose projections. Issue list selector only `row` or `compact`; row has bounded assignee/blocker summaries, compact omits both. Descriptions/details load on drawer open. Omission never bypasses authorization. Related references are explicit DTOs, not spread ORM rows. Detail description≤8000characters needs a reviewed storage/validation rule because existing DB text is unbounded.

## Errors, writes and idempotency

Preserve `{error:{code,message,requestId}}`. Generic messages; no ORM details, proof/token/grant or foreign existence. Proposed status/codes:400 INVALID_INPUT/INVALID_CURSOR;401 UNAUTHENTICATED;403 FORBIDDEN for CSRF/origin or known visible action denial;404 RESOURCE_UNAVAILABLE;409 CONFLICT/CURSOR_STALE/IDEMPOTENCY_CONFLICT/QUERY_BUDGET_EXCEEDED;412 PRECONDITION_FAILED;413 PAYLOAD_TOO_LARGE;428 PRECONDITION_REQUIRED;429 RATE_LIMITED with Retry-After;503 UNAVAILABLE. Validate syntax, authenticate, authorize scope before disclosing revision/conflict facts. Field-specific feedback needs separately reviewed compatible error projection, not an implicit envelope expansion.

Future issue PATCH uses strong `If-Match: "issue-<opaque version>"` and tenant-scoped primary CAS. Missing428, stale412, serialization409. Never accept roles/epochs/families. Workspace/team/project lack versions today; their CAS mutations wait for additive model review. Existing internal conflict semantics remain unchanged.

Creation/invitation/side-effect batch requires UUID Idempotency-Key. Proposed durable ledger unique(actor,workspace,operation,key), canonical body hash,24h retention, stored result≤64KiB. Current authorization is rechecked even for replay. Same payload returns confirmed committed result; changed payload409; in-progress409 plus Retry-After. Effect+ledger commit atomically, external delivery via reviewed outbox. Unknown outcome requires same-key reconciliation, not a new key/blind retry. No ledger exists today; no exactly-once network claim. Existing auth/logout endpoints retain their own semantics.

Batch max25unique issue IDs, one workspace,64KiB, expected version per item, one whitelisted mutation type. Atomic all-or-nothing first proposal; no mixed tenants/read-write/scripts. Reject inaccessible/conflicting items generically without identifying hidden rows. Lock sorted resource IDs after user/family/workspace; revalidate before commit. No partial-success batch approved. Optional future projection panels can be explicitly unavailable, but DB failure must not masquerade as zero/empty.

## Abuse and refresh

Starting unmeasured proposals: principal120read units/minute; workspace1200/minute; mutation30/minute/principal; graph cost `1+ceil(nodes/50)+ceil(edges/100)+depth`, graph4in-flight/principal,2/hotworkspace,8/replica; list2in-flight/principal. Shared Valkey admission fails503 on outage; late counters/work are not canceled by timeout. Per-replica hard CPU/pool limits supplement distributed budgets. Caller exhaustion429, service capacity503, bounded Retry-After. Existing sensitive auth limits unchanged. Fairness/NAT/trusted ingress/quota values need load and abuse review.

Navigation/focus refresh if data older30s, one shared in-flight request per key, none while hidden. Until real invalidation exists, optional visible60s refresh with jitter, never overlapping. GET retries≤2 with bounded jitter/Retry-After; no automatic mutation retry.401 clears server-derived account/tenant state,403 does not invent logout,503 shows unavailable instead of fixtures. No realtime gateway is assumed.
