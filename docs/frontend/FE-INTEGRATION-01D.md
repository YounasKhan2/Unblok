# FE-INTEGRATION-01D — Real Team management

Draft for PM review. Branch `codex/fe-integration-01d`, baseline `16e157deb0e405b1e768fd1b5dbc4843bdb68dbf` (merged PR #52). The PR/handoff records the final commit SHA. No merge, deployment or Projects work is authorized by this report.

## Scope and approved UX

The preflight is preserved outside the repository at `D:/Full_Stack_Apps/Unblok-FE-INTEGRATION-01D-20261017/FE-INTEGRATION-01D-PREFLIGHT.md`. PM explicitly approved independent membership operations, an existing-pattern transfer/recipient consent flow with manual sharing, and truthful live lifecycle copy. No additional backend capability was invented.

Previously connected: real Team creation, status-filtered/paginated directory, UUID details/reload, metadata name/description/color, owner-authorized accumulating membership pages and scoped creation/metadata reconciliation. These remain in TeamsApi/TeamsStore/TeamsContext/TeamJournal.

New integration:

- Actual Team Settings layout and TeamAdminRow presentation are shared with live adapters, not replaced. Active/archived groups use bounded server pages. Unknown totals, Project/cycle metrics and Lead attribution are not fabricated. Settings actions enter the existing UUID hub; Archive/Restore only opens confirmation after fresh owner-only access succeeds. An unscoped hard reload of `/settings/teams` still requires the existing Workspace selection boundary.
- Add an ACTIVE Workspace membership by its authoritative membership ID, change Team MEMBER/OBSERVER ceiling, and explicitly remove a nonowner membership. Candidate reads reuse AdministrationApi with limit20 and project only ID/display name/role/status into Team state. Contact emails are not stored there. Each operation is separately authorized, confirmed and reconciled; there is no atomic bulk checkbox promise.
- Owner-only controls derive provisional availability from the existing private member GET, never Workspace ADMIN alone, cached roles, Lead, updateMetadata or literal-false v1 management hints. Every dialog refreshes applicable owner/recipient authority; every new submit refreshes it again; the server remains authoritative at completion. Inactive target role changes and inappropriate MEMBER choices for Workspace OBSERVER are unavailable. Removal of the owner is not offered and remains forbidden server-side.
- Transfer request selects an existing ACTIVE Workspace ADMIN / Team MEMBER from loaded bounded member pages. A confirmed RECORDED response exposes only a manually shareable exact UUID link. Recording alone is not an ownership change. No email, inbox, cancel, recovery or takeover operation is invented. The exact recipient route refreshes authorized detail, shows real lifecycle/expiry, and offers explicit Accept/Reject only to the matching current membership. The original base Team revision is required; stale consent is never rebound.
- Archive uses the actual ArchiveTeamModal presentation extracted into ArchiveTeamModalFrame. Live copy delegates eligibility to the server and makes no zero-Project/cycle claim. Restore confirms only the Team is restored, not children, removed members or obsolete consent. Archived Team writes remain restricted; confirmed effects trigger authoritative detail/member refresh and invalidate list/candidate projections.

Shell, ten navigation destinations, typography/tokens/theme system, unsupported business pages and NEXUS records are unchanged. Demo adapters retain original data/actions, combined edit behavior and archive guard/copy. Shared presentation sources import no ProjectContext/SettingsContext or NEXUS fixture provider into live routes.

## Verified endpoint coverage

P = `/api/v1/workspaces/:workspaceId/teams/:teamId`.

| Capability | Actual request | State/response handling |
| --- | --- | --- |
| Member page (existing 01C) | GET P/memberships?limit=20&status=ALL&after=opaque | Validated accumulation; earlier20 retained after next2; no inferred aggregate count |
| Candidate page (existing Workspace API reused) | GET /workspaces/:workspaceId/administration/memberships?limit=20&status=ACTIVE | One bounded page, explicit Next, no full-directory scan or contact projection |
| Add | POST P/memberships {membershipId,teamRole} | ADDED or UNCHANGED, initial201/inert200 |
| Role | PATCH P/memberships/:membershipId {teamRole} | UPDATED/UNCHANGED200; target identity validated |
| Remove | DELETE P/memberships/:membershipId, no body | REMOVED/UNCHANGED200; CSRF/JSON headers still present |
| Request ownership | POST P/ownership-transfer-requests {successorMembershipId} | RECORDED201/inert200; no ownership grant or fake delivery |
| Exact consent read | GET P/ownership-transfer-requests/:requestId | Team/request IDs checked; authorized state and original base Team version |
| Accept/reject | POST P/ownership-transfer-requests/:requestId/accept or /reject, {} | Matching response ID; explicit recipient; ACCEPTED/REJECTED200 |
| Archive/restore | POST P/archive or P/restore, {} | Scoped Team DTO and expected historical operation status checked; fresh state reloaded |

Foundation GET directory/detail, POST create and PATCH metadata remain unchanged. Team management adds nine previously unconnected Team handlers (eight mutations plus exact consent detail); the module's fourteen existing handlers are now represented. No API/schema/migration/OpenAPI/backend change is included.

## Security and reconciliation

The existing TeamsStore and AuthApi are extended, not paralleled. Scope remains actor UUID + SessionStore generation + Workspace UUID + original membership identity/authority + Team UUID. Reads and mutations have abort controllers plus identity/version checks; abort alone is never treated as rollback. Candidate/consent reads reject delayed or foreign completions. Session/account/Workspace/membership/Team changes clear private projections and UI selections. Owner/recipient denial clears affected private state before revalidation. No push/polling API is invented: remote authority changes are detected by authoritative reads/operations, not a promise of continuous client freshness.

`TeamJournal` retains slot `unblok:pending-team-mutations:v1`, original create/update records and a strict allowlisted management extension. Aggregate limits remain eight attempts and128KiB UTF-8 across actors and operations. One pending operation per actor/Workspace/membership/Team prevents conflicting edits. Cross-actor or unrelated-Workspace attempts are never evicted. Unknown, corrupt, oversized, legacy membership-unbound or conflicting records fail closed without deleting their bytes. Logout/account switching fences visible data and retains uncertain records; only the exact original authenticated actor and membership may recover them. Closing a dialog does not cancel a possible server effect.

Each entry preserves operation/action, exact target, canonical body, original key, original strong `"team-<version>"` and original membership. DELETE stores the canonical empty semantic input but always transmits no body. No CSRF token, cookie, password, email, member-directory projection or invitation proof is stored. Pending user-entered metadata remains subject to the established tab-journal model; this is not a business-data cache or authority source. Tab closure/manual browser clearing can lose reconciliation metadata.

A retry uses the original request without silently replacing the precondition. It goes directly to the server's authoritative same-key reconciliation, allowing minimal receipt replay even where a fresh owner-only directory could no longer be read. Confirmed responses do not locally grant ownership or synthesize versions. The API validates mutation target/request/Team identity, response schemas and statuses; malformed responses leave the original request pending. Successful effects clear only their exact journal entry, abort old list reads and refresh authoritative state.

| Outcome | Behavior |
| --- | --- |
| 400 | Definitive validation failure removes only its own exact entry; no false success |
| 401 | Existing session invalidation fences private UI; pending original intent retained |
| 403/404 | Neutral denial; invalidate affected private projections and revalidate readable Team scope |
| 409 CONFLICT / 412 | Keep original request as a conflict until explicit review. Review removes that exact rejected intent and refreshes state; the user must explicitly start a new operation. No automatic rekey or consent revision substitution |
| Other409 / 428 | Keep original request/precondition; manual same-key reconciliation only |
| IDEMPOTENCY_RESULT_EXPIRED | Preserve original history; require external/current-state reconciliation rather than automatically issuing a new mutation |
| 429 | Honor Retry-After; disable manual management retry until eligible. Opening checks do not automatically reread after a rate-limit response |
| Network/uncertain5xx/invalid response | Preserve original body/key/target/precondition and require explicit same-key retry |

Existing global authentication transport serializes mutations. A simultaneous login/logout submission may be rejected while another request is in flight; local session clearing still fences views, and uncertain receipts remain recoverable. This existing contract was not redesigned.

## Verification

| Check | Final measured result |
| --- | --- |
| Focused Team / prototype administration unit tests | 141 passed / 0 failed |
| Auth + live Workspace + live Team focused regressions | 354 passed / 0 failed |
| Complete frontend suite | 1,017 passed / 3 historical NEXUS failures, 1,020 total |
| Frontend lint/typecheck | Exit 0 (`lint:web`, TypeScript noEmit) |
| Frontend production build | Exit 0; existing Vite native-config and large-chunk warnings remain |
| Backend latest per-suite results | 127 passed / 0 failed, 2,073 assertions across two isolated runs; first combined run had the management workload timeout described below |
| Latest full real Chromium (`browser-13`) | 9 gates passed / 0 failed, latest production sources |
| Focused real Chromium (`conflict-1`) | 4 gates passed / 0 failed; real 412 reconciliation and unchanged-Team-version role refresh |
| Chromium 20+2 member regression | 1 gate passed / 0 failed; all22 unique members retained from20+2 bounded responses |
| Strict prototype pixels | 22/24 exact; two failures (3 and 6 pixels), unchanged thresholds |
| Recorded prototype geometry/styles | 24/24 exact |
| Migration history | 13/13 in each disposable test database only |

Latest frontend logs: `focused-delivery.log`, `focused-complete.log`, `full-delivery.log`, `typecheck-complete.log`, `build-complete.log` under the external evidence root. The first new two-actor recovery assertion counted all POSTs, including login/logout (109 pass / 1 failure in the single-file run); its endpoint filter was corrected to count only archive requests. The exact original-key assertion remains unchanged. The subsequent 141-test and 354-test runs pass.

Commands, from repository root with Bun on PATH, GOMAXPROCS=2 and RAYON_NUM_THREADS=2:

```powershell
bun run --cwd apps/web test src/features/teams/live/Teams.test.tsx src/features/teams/teams.test.tsx src/features/settings/domain/teamAdministration.test.ts --maxWorkers=2
bun run --cwd apps/web test --maxWorkers=2
bun run lint:web
bun run build:web
# Set a fresh absolute evidence directory outside the repository for every run.
$env:PLAYWRIGHT_MODULE='C:\Users\youna\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\playwright'
$env:FE_INTEGRATION_EVIDENCE_DIR='<outside-repo fresh run directory>'
node scripts/frontend/fe-integration-01a.cjs --01c --backend-only --production
node scripts/frontend/fe-integration-01a.cjs --01c --backend-only --management-only --production
node scripts/frontend/fe-integration-01a.cjs --01d --browser-only --production
node scripts/frontend/fe-integration-01a.cjs --01d --browser-only --production --conflict-only
node scripts/frontend/fe-integration-01a.cjs --01c --browser-only --production --members-only
$env:FE_VISUAL_BASE_SHA='16e157deb0e405b1e768fd1b5dbc4843bdb68dbf'
$env:FE_DEMO_TEAMS_ONLY='true'
node scripts/frontend/fe-integration-01b-visual.cjs
# Use bundled Python with Pillow for the zero-tolerance comparator:
python scripts/frontend/fe-integration-01c-compare.py '<visual evidence directory>'
```

`lint:web` is the repository TypeScript noEmit check, not a separate ESLint run. Backend fixtures run real `bun test --no-env-file --preload <evidence>/prisma-node-preload.ts` for scripts/backend/teams.test.ts, team-management.test.ts, tenancy.test.ts and auth-fences.test.ts. API and worker run matching repository backend sources with generated isolated configuration. Each owned database applies13 migrations and checks actual history; this is not a statement about shared QA or production migration state.

Real browser coverage uses two authenticated contexts so the initiating session stays alive during consent. Workspace/Team setup uses existing real CSRF APIs; signup/login/verification and invitation acceptance use real frontend journeys and owned worker/Mailpit delivery. Last-owner deletion uses a fresh actual revision and is rejected. Role change/remove/add, foreign Workspace404, nonowner ADMIN denial, archive response loss/replay, restore, archived write denial, recipient rejection/acceptance, stale-owner confirmation and session revocation are exercised.

The expiry case inserts a separate past, never-issued pending intent only into the runner's labeled disposable database, with exact eligible owner/successor/family/epoch/version/policy bindings and normal SQL constraints. It does not alter an issued immutable consent, disable triggers, extend expiry or bypass server validation. The real clock/GET calculates EXPIRED; acceptance controls are absent. Issuance TTL and held-completion expiry also remain covered by the existing backend suite.

## Prototype comparison and failed attempts

Final strict capture covers directory/hub/create/edit/Settings/archive at1440 and390px, light/dark, against exact base16e157d. Eight baseline/current interaction scene groups pass: original demo key suggestion, editable demo key, hub tabs, Settings, archive dialog and Escape. All24 pairs have identical recorded control/heading/navigation/SVG geometry, labels, paths and computed styles. CSS is byte-identical (`219e9d0180c254fe27c0a48a6cac9ca6fc2ea9e6f72adba24d4be5c37d4be51a`). Presentation sources stayed unchanged after this capture; later changes were live authority/error handling only.

**Strict pixels remain failing:** visual-3 has22/24 exact pairs; mobile light archive differs by3 pixels, mobile dark archive by6. No tolerance, masking or CSS adjustment was introduced. Earlier visual-1 differed by23 pixels in desktop light create and7 in mobile dark Settings; visual-2 by7 in mobile light Settings and6 in mobile dark archive. Repeated same-build create captures also vary, while final geometry/styles are exact. Raster cause is unproven, especially for the archive/Settings pixels; do not infer all visual gates passed. The prior01C one-pixel failure remains historical evidence, not a claim that current strict comparison is green.

Failed/intermediate checks are preserved outside the repository under `D:/Full_Stack_Apps/Unblok-FE-INTEGRATION-01D-20261017` and summarized in evidence/FE-INTEGRATION-01D/attempt-history.json:

- Initial new race-test setup:90 pass,2 fail because the established single-mutation transport rejects simultaneous login/logout while a mock write is held. Test setup handles that expected rejection and still asserts fencing; an additional successful two-actor login/recovery case verifies exact actor isolation. Existing assertions were not weakened.
- browser-1: role selector lacked a stable exact accessible name. Fixed live select labels.
- browser-2: uncertain archive disabled eligibility changed the dialog's Cancel into Close. Fixed live pending presentation: confirmation disabled, Cancel retained, explicit same-key retry remains outside the dialog.
- browser-3: six gates pass before subsequent scope hardening/coverage expansion.
- browser-4: last-owner test used the creation revision after invitation acceptance advanced the version; got412. Fixture now reads the current revision before expecting the owner-rule409. No timeout/assertion relaxed.
- browser-5: unscoped hard reload `/settings/teams` lost selected Workspace, correctly returning to account selection. Harness now uses existing SPA Settings navigation. This is not a production navigation fix.
- browser-6: eight gates pass before final expiry/stale-owner/opening-check expansion.
- browser-7: seven gates pass; capture then had an unconfirmed API read/timeout.
- browser-8: four gates pass; Docker fixture command timed out.
- browser-9 and browser-10: nine gates passed before final dialog-authority hardening.
- browser-11 and browser-12: owned API readiness failed before browser execution, with empty API logs. Root cause remains unresolved. Added secret-free process/exit and readiness-status diagnostics without changing timeout limits. Latest browser-13, conflict-1 and membership runs use these diagnostics; browser-13 became ready after24 connection refusals and returned200. A later successful run does not establish the cause of prior failures.
- members-regression initial attempt: Chromium Target crashed before a page/journey was created. Only the three verified descendant browser processes owned by that exact evidence run were stopped; the ownership inventory is preserved outside the repository. Early context/page creation failure now closes its own browser before rethrowing.
- The three preceding infrastructure failures overlapped multiple owned browser runs. Exact causes are unproven; they were not relabeled passing. Final checks run serially with identical timeout limits and unchanged assertions.
- Backend run1: foundation33/33, tenancy35/35, auth fences24/24; management34/35 plus one error, workload timeout at30s and a late assertion. Isolated management run2 passes35/35 at unchanged timeout. This does not certify production-scale performance or prove a root cause for run1.

Historical NEXUS failures remain exactly the missing resolved reference (nexusEnterprise.test.ts:94), milestone graph0 vs>=12 (:152), and fan-out3 vs<=2 (nexusEnterpriseValidation.test.ts:301). Queue, SIGTERM, combined architecture timeout, deferred directory performance and prior Workspace-navigation flake are not claimed fixed. Queue/shutdown/architecture and exhaustive password-recovery browser journeys were not rerun in this frontend milestone. The broad frontend suite covers existing01A–01C assertions; the real selected journeys cover auth/verification, invitations, Workspace boundaries, metadata, membership pagination and management.

## Limits and handoff

- No contact search, invented totals, emails/notifications for transfer, transfer inbox/cancel, self-removal/owner recovery/takeover or Projects integration.
- Candidate lists are bounded pages. Transfer choices use loaded Team member pages; further candidates require closing the dialog and explicitly loading more. A changed revision resets stale member projections.
- Remote authority changes are discovered on server reads/actions; no realtime revocation subscription is available or fabricated. Backend revalidates every mutation.
- Legacy/malformed or full journals deliberately block ambiguous new writes. Expired receipts/tab-storage loss require manual reconciliation; no unsafe new-key recovery is promised.
- Settings uses separate bounded ACTIVE/ARCHIVED reads, with inherited existing Team-store reads still possible; no performance optimization claim.
- Measured existing workload p95 (serial run2, ms): directory c1=175.72, c10=272.36, c50=1430.20; management c1=192.81, c10=493.49. Directory250ms objective remains unmet at c10/c50. These are local disposable measurements, not a scalability certification or backend optimization.
- Shared QA databases/accounts/Workspaces/Mailpit were not accessed or reset. Both sentinels are hard assertions in every completed disposable run; no message deletion endpoints are called. No migrations, environment files, dependencies, backend code, fixtures or shell/navigation/theme sources changed.

Changed-source inventory and LF-normalized SHA256 hashes are in evidence/FE-INTEGRATION-01D/verified-source.json. Screenshots and exact result JSON are under that directory; raw logs/builds/all attempts remain outside the repository. Backend suites' generated historical evidence files were first preserved outside and only those known test-generated files restored to their clean preflight versions. No user worktrees/branches/data were cleaned up.

Stop for PM review. No merge or deployment.

Keyboard coverage uses existing Escape/focus behavior during dialogs and browser journeys; no full assistive-technology audit or exhaustive cross-browser certification was performed.
