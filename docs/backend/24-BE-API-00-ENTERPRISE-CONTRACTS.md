# BE-API-00 — Enterprise API architecture and performance contracts

Status: **proposed for human review; no business API implemented, no benchmark executed**. Date: 2026-10-11. Exact fetched base: `adbcd125403ca7de6578b1c3b01e39f758abfbc8`; branch `research/be-api-00-enterprise-contracts`. PR/head are recorded in delivery metadata. PR #33 merged as `48f0607fa89122eaf1f189d87934a00be2b13366`. Historical phase reports retain their original review labels; the living tracker and current source establish merged reality.

## ADR: bounded resources and purpose-specific reads

Retain the modular NestJS/Bun monolith, PostgreSQL/Prisma database boundary, neutral Zod contracts, Valkey cookie sessions and independent worker. Choose versioned REST resource writes plus a small registry of bounded screen projections. Reject both a whole-workspace bootstrap document and one endpoint per badge/component. No GraphQL, generic repositories, client-defined joins, unrestricted `expand`, or offset paging over large mutable lists. Future exports need separately authorized asynchronous capabilities, never `limit=all`.

The proposed [machine-readable registry](contracts/be-api-00/registry.json) is an equivalent design specification, **not deployed OpenAPI or generated runtime Zod**. [Protocol](contracts/be-api-00/protocol.md), [screen matrix](contracts/be-api-00/screens.md), [graph design](contracts/be-api-00/graph.md), [query/index proposal](contracts/be-api-00/queries.md) and [performance methodology](contracts/be-api-00/performance.md) are normative companions. No library/generator is installed. Existing auth schemas remain authoritative and unchanged. During each approved implementation slice, promote its schemas to strict neutral Zod and generate OpenAPI/client types from that single runtime source; test drift before registering routes. Do not maintain competing production schema sources.

## Repository audit and precedence

Backend documents 00–23 establish the foundation/planning/security history; later merged contracts override earlier draft phase labels and grants. Source audit anchors:

- `packages/database/prisma/schema.prisma`: global identities, workspace-composite resource keys, immutable project keys/issue sequence, membership-scoped roles, archival, issue version, epochs/families, separate verification/recovery outboxes.
- `packages/database/src/tenancy.ts`: only `issue:read`, `issue:update`, `project:sequence` today; production `denyAll`; callback-limited handles and bounded issue fetch followed by per-resource policy filtering. This primitive is not API pagination.
- `packages/database/src/auth-fences.ts`: primary-only authority; user → family → workspace → resource lock order, entry/completion validation, SID retirement discovery by digest. No replica/cache authority fallback.
- `apps/web/src/features/workspaces/components/WorkspaceSwitcher.tsx`, `pages/teams/TeamsDirectoryPage.tsx`, `pages/projects/{ProjectOverviewPage,ProjectIssuesPage}.tsx`, `pages/my-work/MyWorkPage.tsx`, `pages/dependencies/DependenciesPage.tsx`, project/team/dependency selectors: local fixture arrays drive filtering, grouping, metrics and graph layout. Issue URL defaults include manual sorting. My Work uses the current user.
- ProjectContext and workspace mock adapters remain demo/prototype business sources. Real accounts currently see pending-workspace UI. No seed merge, localStorage grant or NEXUS fallback is permitted in future live adapters.

Schema gaps: due dates, manual ranks, labels, saved views, cycles, milestones, comments, activity history, avatars, team descriptions and durable graph-layout/data/policy revisions lack complete current persistence. Dependency writes remain SQL-gated. Fine-grained business allow policies, invitation APIs and business-worker identity are absent. Registry dependencies prevent planned projections being mistaken for implemented capabilities. Unavailable panels must differ from empty real collections; no invented fixture values. Each model/policy extension needs its own review.

## External findings and recommendations

Primary documentation checked 2026-10-11. Findings describe public APIs/database semantics, not competitor private architecture or measured Unblok capacity.

| Verified external finding | Source | Unblok recommendation, not an external fact |
| --- | --- | --- |
| Linear uses cursor connections, defaults to 50 and documents creation/update ordering | [Pagination](https://linear.app/developers/pagination) | Default50/max100, composite stable order and tenant-bound signed cursors |
| Linear limits requests and complexity and discourages polling/unneeded child data | [Rate limits](https://linear.app/developers/rate-limiting) | Bound projection/graph cost; do not copy quotas or require GraphQL |
| Jira documents pagination, endpoint-specific page caps and optional totals | [REST overview](https://developer.atlassian.com/cloud/jira/platform/rest/v3/) | Publish per-endpoint caps; avoid implicit expensive exact totals |
| OFFSET skips still require work; predictable ordering matters | [PG17 LIMIT/OFFSET](https://www.postgresql.org/docs/17/queries-limit.html) | Keyset paging for large mutable lists |
| Leading equalities and the first range affect B-tree scans | [PG17 multicolumn indexes](https://www.postgresql.org/docs/17/indexes-multicolumn.html) | Index measured tenant/filter/sort shapes |
| Partial indexes require planner-provable predicates | [PG17 partial indexes](https://www.postgresql.org/docs/17/indexes-partial.html) | Inspect generic/custom prepared plans before choosing candidates |
| Recursive queries need cycle handling; parent LIMIT is not a universal work bound | [PG17 WITH](https://www.postgresql.org/docs/17/queries-with.html) | Budget frontier expansion and inspected work |
| EXPLAIN ANALYZE executes queries and reports actual behavior | [PG17 EXPLAIN](https://www.postgresql.org/docs/17/using-explain.html) | Measure owned synthetic databases, not production mutation probes |
| GIN is preferred for text-search indexing | [PG17 text search](https://www.postgresql.org/docs/17/textsearch-indexes.html) | Review token versus substring UX; no speculative index installation |
| HTTP defines conditional request preconditions | [RFC9110](https://www.rfc-editor.org/rfc/rfc9110.html) | Future strong If-Match CAS; preserve current auth error envelope |

## Authority, caching and failure contract

Every request needs fresh signed-cookie/live-Valkey verification and a same-instance request-bound principal. Every scoped operation rechecks primary epoch/family, current ACTIVE membership and resource/ancestor/team grants. Workspace selectors, cursors, DTO roles and UI hints confer no authority. ADMIN has no universal team bypass; OBSERVER cannot write; archived workspace writes remain forbidden. This ADR enables no grants.

Initial business responses use `Cache-Control: private, no-store`; no CDN/shared authenticated cache. Proposed later server projection key: contract version, user, workspace, reviewed authorization revision, resource/data revision, canonical filters/sort/fields/page tuple and projection. These revisions are **not implemented**. Never cache positive authentication or serve stale grants on dependency failure. Reauthorize before cached delivery/304; a resource ETag alone cannot authorize. Mutations must atomically update revisions; reviewed bounded invalidation/outbox handling is required before cache adoption. Evict account/tenant projections on logout, session-generation change, membership/team changes, archival and affected writes. Revocation cannot recall bytes already delivered.

Future frontend request keys include account/session generation and explicit workspace. Abort superseded requests and discard stale promises; clear old tenant views before switching. Mutations invalidate affected list/overview/My Work/graph projections. Never auto-replay unknown mutations. Errors/outages cannot fall back to fixtures. Counts/search/blocker summaries must not disclose hidden rows or edges. A page length is not a full count.

## Risk register and implementation sequence

| Risk or approval question | Required decision/proof |
| --- | --- |
| Workspace-exclusive write lock | Measure hot-tenant contention; no narrowing without archival/membership/revocation/concurrency proof |
| Non-SQL visibility policy | Approve actions and SQL selectors; bounded post-filter scans, authorized counts, no N+1 or raw delegate export |
| SID retirement scan/family growth | Benchmark full digest index against exact query; separately define retention/restore safety |
| Frozen manual/due/cycle/activity UX | Approve additive models/capability behavior; no silent createdAt-for-manual substitution |
| Hidden dependency disclosure | Approve restricted-blocker semantics; gate stays closed until authoritative DAG service |
| Cursor revisions/idempotency ledger | Approve independent keys, retention, replay/conflicts and additive schemas |
| TLS/proxy/CORS/browser/CSRF, mail, DB grants, PITR | Local auth evidence is not deployment certification |
| Queue timing, SIGTERM143, dependency advisory, three NEXUS failures | Historical findings remain unresolved, not reclassified by docs checks |
| No measured enterprise results | Synthetic and deployment load/security evidence before SLO/capacity promises |

Proposed sequence: human review of ADR/budgets/policies/model gaps → workspace/membership vertical slice and honest empty onboarding → teams/projects bounded directories → issue CRUD/filter/search with CAS/idempotency → bounded graph reads and separately reviewed DAG writes → missing planning/activity features with per-slice frontend parity → measured query/index/cache/lock improvements and deployment/recovery acceptance. This PR begins none of those slices.

## Verification boundary

[Evidence](evidence/BE-API-00-verification.json) records actual checks and the unchanged production surface. The scoped validator covers registry references, bounds, ownership and examples; it is not complete OpenAPI conformance, SQL plan proof or runtime security certification. No benchmark, migration/index installation, business endpoint, frontend change or screenshot regeneration occurs. Untouched infrastructure/browser suites are not declared newly passing.

Actual documentation-phase checks: registry16operations/44schemas/21examples/15negative cases passed; architecture365sources/1006edges/zero violations; architecture tests51pass/59assertions; backend typecheck and lint passed;94relative backend documentation links exist; diff whitespace and production freeze checked. Initial link scan encountered existing cp1252 document20, then passed with explicit legacy decoding without modifying it. Runtime security/database/browser/regression suites and benchmarks were not rerun for this documentation-only change; prior outcomes remain historical evidence, not new passes.

Stop at human review. Do not merge or begin Workspace APIs.

## PR #34 focused F1–F4 correction (2026-10-12)

Reviewed HEAD `3fd04459138e2f7323156c74807bf717a6cff13c`. [Workspace minimum viable contracts](contracts/be-api-00/workspaces.md) add detail, member paging, atomic creator administrator, invitation issuance/acceptance and own role/capabilities. All are proposals dependent on a separately reviewed Workspace slice, not live APIs or grants. [Action/resource policy matrix](contracts/be-api-00/authorization.md) distinguishes administration, ordinary/observer membership, team visibility, archival and suspension; hidden-resource projection/count rules apply consistently. Dependency completion/writes remain denied pending authoritative policy/DAG proof.

[Lifecycle contract](contracts/be-api-00/lifecycle.md) specifies database-owned revisions, independent cursor key rotation/compromise, live versus revision-pinned traversal, atomic ledger/effect/result recording, same-key contention and unknown-outcome reconciliation. Full replay results retain24hminimum; minimal tombstones prevent re-execution pending an approved purge policy. All new records/keyrings/outbox/ports are explicit unimplemented dependencies. [Performance acceptance](contracts/be-api-00/performance.md) is a mandatory unexecuted gate measuring hot-workspace locks, SID lookup/index costs, authorization overhead and graph work exhaustion before capacity claims.

Registry/payload and lifecycle examples check a bounded documentation model only; they do not prove real token cryptography, SQL locks, email delivery, production grants or benchmarks. GitHub comment retrieval failed with a connector transport error; the user's F1–F4 correction request is the review input. Original verification/failure history remains in evidence; correction results are recorded separately. No production/frontend/NEXUS/dependency/schema/migration/existing-test changes. Stop at human review.
