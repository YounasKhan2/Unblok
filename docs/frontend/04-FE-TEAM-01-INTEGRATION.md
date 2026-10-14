# FE-TEAM-01 — Live Team foundation

Implemented for **human review only**, from approved base `7ac1c39543d7057642db56f99bbd8a070f37a746` on `feat/fe-team-01-integration`. Not merged, deployed or production-certified. BE-TEAM-01/PR #40 is merged; its original verification and operational limitations remain authoritative. The delivery PR records the exact implementation HEAD.

## Scope and source audit

Reviewed the backend index, Team architecture/action/acceptance matrix (27), merged Team implementation and F1 correction (28), BE-API-00 contracts, Workspace/session handoffs, existing Team directory/hub/CreateTeamModal and compact Modal/Button primitives. Existing demo key routes, provider selectors, role assumptions and derived metrics are unsuitable as live authorization or live data. This slice therefore uses separate authenticated UUID routes and API stores while reusing the compact primitives, palette, typography and theme surface. No unresolved domain/schema choice is introduced.

Live routes: `/workspaces/:workspaceId/teams` and `/workspaces/:workspaceId/teams/:teamId`. The Workspace page links to Teams. Only the existing GET list, GET detail, POST creation and PATCH metadata endpoints are called. No Team lifecycle/member/transfer, Project/Issue API, schema, migration, backend authorization, dependency or NEXUS changes.

Directory requests one server page of at most20 visible Teams with ACTIVE/ARCHIVED/ALL and signed continuation. No fetch-all, count or client-side private discovery. Search remains visible and disabled with an explanation. Hub retains Overview/Issues/Projects/Planning tabs; unsupported functionality and member/Project/Issue metrics say unavailable. Metadata edit exposes name/description/approved color only, with an immutable key. A fresh detail response and capability check precede opening edit, and current backend authority is required for the mutation. Archived Team/Workspace metadata is read-only. ADMIN status enables eligible creation, never access to existing private Teams.

## Isolation and mutation recovery

TeamsStore binds current authority to account, session generation, Workspace ID, membership role/status and Workspace lifecycle; detail additionally binds the target UUID. Changing scope aborts reads/mutations, clears visible state and discards old completions. Transport checks abort/API generation before applying401 to the session. Each read still obtains live server authorization; already-delivered information cannot be retroactively erased. No polling/cache or implicit Team enrollment.

TabTeamJournal uses sessionStorage, at most8 pending scopes and128KiB total UTF-8. Its allowlisted records contain actor/Workspace/Team, operation, original UUID Idempotency-Key, canonical body, original strong If-Match and explicit conflict flag. No cookie/session/CSRF/proof is stored. Missing, corrupt, oversized or denied storage blocks new mutations. Logout/different-account login clears the journal. Unexpected same-account authentication interruption retains bounded recovery metadata and restores it only after fresh scope authorization. No background retry or automatic rekey.

Persist before transmission. A lost/timeout/409/429/503 response retains the original request; a user retry preserves key/body/precondition even if a later detail reads a newer version. Close does not imply cancellation. Retry-After disables mutation submission until its deadline. Confirmed success clears its journal entry.400 allows correction of a definitively rejected body.401 removes live authority;403/404 remove Team content and recheck access without invalidating a valid Workspace solely for a hidden Team.428 preserves the request and asks for fresh resource information. List cursor errors clear rows and permit explicit reload;409 CURSOR_STALE restarts only when the user requests it. Generic failures never identify hidden collisions.

412 stores the original draft as an explicit conflict, reloads current metadata, and keeps the dialog mounted. Current name/description/color are shown. The user must choose “Use refreshed version for my draft,” review/edit it, then explicitly submit a new mutation with the fresh version and a new key. Resolution is denied without current update capability. No automatic merge or overwrite. Pending unknown/expired receipts are intentionally conservative: no automatic abandonment/replacement key or tombstone bypass; repeated conflicts require user inspection or operational assistance. Clearing browser data or intentional logout abandons local reconciliation history without proving server cancellation.

## Documentation compliance matrix

| Applicable authority / requirement | Implementation | Verification / deviation |
| --- | --- | --- |
|27 private discovery, explicit owner, no ADMIN inheritance | Server list/detail and fresh capability; client role only a creation hint | Unit private-capability negatives; Chromium nonmember ADMIN empty list/404; Team33 SQL/HTTP tests |
|19–26 live session / tenant scope | Account+generation+Workspace+Team fences, abort and stale rejection | Unit late401/late mutation/Team switch; real account/Workspace switches, suspension and session revocation |
|24/27 bounded traversal and errors |20-row server filters, cursor binding via existing API, generic failures and explicit reload | Unit status/overlarge/cross-scope validation; Chromium stale cursor and active/archived/all paging |
|24/28 durable idempotency and CAS |8-entry/128KiB tab journal; exact key/body/If-Match; explicit412 resolution | Unit503/409/428/429/storage negatives; actual committed-response loss twice, reload replay and concurrent metadata update |
|27 immutable/bounded metadata | Neutral strict create/patch schemas; existing palette, read-only key | Contract parity; real metadata CAS; backend SQL constraints unchanged |
| Frozen UX / frontend handoff | Compact Modal/Button/theme, keyboard focus, UUID hub tabs and honest unavailable panels | Responsive captures320/390/768/1024/1440 light/dark; keyboard Tab/Escape; no fake aggregates |
| NEXUS separation / phase exclusions | Dedicated live provider/store, existing labelled demo preserved | SSR isolation, real `/demo/my-work` note, unchanged fixtures/dependencies/backend production/schema/migrations |
|08 migration/regression evidence | Existing suites, isolated disposable database, no reset of existing data | Fresh11/replay/schema diff, original-ten and original-two upgrade checks; full gate results below |

## Reproduction and evidence

Use the existing frozen Bun1.4.2 install and local infrastructure configuration; Vite on localhost:3000. With an already-installed runner, execute:

```sh
CHROMIUM_EXECUTABLE=/usr/bin/chromium \
PLAYWRIGHT_MODULE=/opt/codex/cua_node/lib/node_modules/playwright \
bun --env-file=apps/api/.env test scripts/backend/frontend-teams-browser.test.ts
```

The harness owns API4000, a disposable11-migration database and independent Valkey namespaces. It uses native browser cookies/CSRF through the same-origin Vite proxy, real HTTP admission and PostgreSQL effects. Privileged SQL only seeds test fixtures and simulates approved concurrent changes/revocations; no production bypass or new endpoint. It honors observed coarse Retry-After rather than raising/resetting limits. Cleanup drops only its created database and namespaced keys. Fonts are blocked for deterministic system-fallback captures; deployed Inter rendering and other browsers are not certified.

[Machine-readable gates](evidence/fe-team-01/verification.json), [Chromium scenarios and capture index](evidence/fe-team-01/results.json), [current query evidence](evidence/fe-team-01/BE-TEAM-01-query-plan.json), and [receipt admission plans](evidence/fe-team-01/F1-admission-query-plans.json). Current query evidence is copied to this slice; original BE-TEAM-01/F1 evidence is preserved unchanged. Screenshots include directory at five widths in both themes, create dialogs, UUID hubs and retained-draft conflict dialogs. The PR links the full capture index.

## Verification results and limitations

Final command results are recorded in verification.json and the delivery PR. The three established frontend failures remain separate: missing resolved NEXUS blocker; empty milestone dependency graph; graph fan-out3 exceeding2. Fixtures and expectations are unchanged. An initial backend architecture test exceeded its existing5s deadline during concurrent build/test load; serial rerun passed unchanged. Early browser runs found missing bundled Chromium (use existing system executable), a lowercase accessible tab selector, and the real coarse ceiling during repeated navigation; no security limit was weakened. These observations are retained as limitations, not silently classified as fixes to backend reliability.

Same-origin delivery is required: existing production CORS does not allow Idempotency-Key/If-Match cross-origin. Existing receipt caps/tombstones, deployment admission contention, worker SIGTERM143, historical queue/intermediate timing and headers-after-send observations, Prisma/deepmerge-ts high advisory and deployment/TLS/mail/proxy/backup/load risks remain open. No backend security, capacity or deployment fix is claimed. No Project/Issue metrics, Team membership/transfer/lifecycle or orphan/legacy recovery are delivered. Stop at human review; do not merge or begin another milestone.

| Final gate | Exact result |
| --- | --- |
| Frozen install; frontend typecheck/lint/build | Passed; no dependency/lock change |
| Team frontend tests |25 passed |
| Complete frontend regression |857 passed /3 unchanged NEXUS failures,60 files |
| Backend architecture/typecheck/lint/build | Passed;419 sources,1151 edges,0 violations |
| Backend unit/architecture serial |101 passed,265 assertions |
| Team SQL/HTTP/security/concurrency/migrations |33 passed,772 assertions |
| PostgreSQL integration / tenancy / auth fences |2 /34 /24 passed;5 /132 /134 assertions |
| Workspace / memberships-invitations |29 /36 passed;671 /1200 assertions |
| Sessions / authentication |31 /26 passed;473 /827 assertions |
| Generated runtime contracts |3 passed,31 assertions; four Team operations unchanged |
| Prisma schema; fresh/replay/status/diff; ten/two migration upgrades | Passed; no new/modified migration, disposable databases only |
| Chromium real-service workflow |1 passed,57 assertions,12 scenarios,18 captures; actual coarse429 honored |
| Documentation links / scope / design contract / whitespace | Passed; design validation is not runtime certification |

Measured existing Team query behavior on105 owned visible Teams: one Team selector and38 total SELECTs including auth at both limits1/100. Limit1 returned1 row/2932 bytes/128.91ms; limit100 returned52 rows/125275 bytes/94.27ms before its byte cap. These are local harness observations and query plans, not a capacity claim. Backend lifecycle, infrastructure reliability and dependency audit were not rerun in this frontend slice; their known failures/risks remain explicitly preserved.
