# Live Teams / administration runtime stabilization

Branch `fix/live-teams-administration-runtime`, baseline `0b85cea814a25f1ea29c8f1a12ae8bb0cd71c923` (PR53). Draft for PM review; no deployment, main merge, database migration or Projects work.

## Findings and attribution

The actual local frontend is listening on3000 and Bun watch API on4000. Local `/ready` returns200; anonymous `/api/v1/auth/me` returns401 UNAUTHENTICATED, which is expected without a cookie. PostgreSQL accepts connections and Docker reports Valkey healthy. The existing API readiness checks connections, not schema compatibility.

**Confirmed schema mismatch:** shared local PostgreSQL has12 completed migrations; current main needs13. `20261016000000_workspace_administration` is unapplied. Both `workspace_administration_revisions` and `workspace_invitation_teams` are absent. A read-only PostgreSQL log tail contained248 missing-relation errors between2026-10-16 17:23:58 UTC and2026-10-17 12:06:40 UTC. All administration reads call the revision query against the absent relation; the existing transport maps unknown database failures to503. This is concrete evidence for the reported administration503s, rather than evidence of unavailable PostgreSQL or a reason to raise admission limits. The same tail has one lock timeout on2026-10-15; that older event is not attributed to this incident.

The API process stdout/stderr and the original authenticated browser's cookies/network timeline were unavailable to this task. The in-app browser could not initialize; the previously authorized installed Playwright fallback was used with owned services. No attempt was made to log into or mutate shared QA accounts. Original unexpected authentication loss therefore remains **unresolved**:503 does not itself invalidate SessionStore; only a current-epoch401 does. No claim is made that schema errors caused session revocation. Real logout and controlled expired-session cases are tested separately.

**Confirmed duplicate loads:** AdministrationStore starts one3-request cycle when authorized scope changes; AdministrationPage also started another on mount. A baseline real-browser run measured2 each of memberships/invitations/eligible-teams. This was duplicated bounded loading, not proof of an endless administration loop. In addition, the page's Workspace-selection effect depended on selecting/selected and retried after selection failure; that automatic failure feedback path is removed. Repeated filter values and simultaneous reloads are now deduplicated. No recursive retry is introduced.

**Provider crash attribution remains unresolved:** LiveRoutes already wraps its descendants in TeamsProvider. Source inspection found no live consumer outside that route tree. A baseline development module reevaluation did not reproduce `TeamsProvider required`; the original HMR history is unavailable. TeamsContext created its Context in the same Fast Refresh component module, so it was recreated on module evaluation. The hotfix extracts only that identity into an inert `.ts` module, shared by the existing provider and hook. This is narrow identity hardening, not a proven attribution of the original crash or an added provider/fallback. Three real dev reevaluations plus navigation/reload are checked. Missing-provider errors remain strict; no fake store or empty-data fallback is installed.

## Changes

- `apps/web/src/features/workspaces/live/AdministrationPage.tsx`: remove competing initial-load effect; scope selection checks a fresh snapshot and stops on context failure. Existing reload button remains deliberate recovery.
- `apps/web/src/features/workspaces/live/AdministrationStore.ts`: concurrent load coalescing; identical-filter no-op; meaningful filter replacement explicitly aborts previous cycle. Existing session/membership/Workspace/version fences and journal semantics unchanged.
- `apps/web/src/features/workspaces/live/Administration.test.ts`: bounded503/no-auto-retry/equal-filter tests; concurrent reload and changed-filter cancellation with authority-loss rejection.
- `apps/web/src/features/teams/live/TeamsContext.tsx` and new `TeamsStoreContext.ts`: preserve existing provider hierarchy, isolate Context identity from component refresh.
- `scripts/frontend/fe-integration-01a.cjs`, `fe-integration-01d-journeys.cjs`, new `runtime-stabilization-journeys.cjs`: reuse disposable harness, explicit dev module reevaluation and runtime-only browser gates. No shared environment files or QA credentials.

No backend/schema/migration, admission/rate limit, authentication contract, idempotency body/key/precondition, demo, fixture, styling or layout changes.503 clears unavailable read projections and uses existing inline error/reload presentation; it never becomes fabricated empty success. In-flight filter changes still abort/reject stale responses; ordinary repeated reloads do not start a second cycle.

## Verification

| Check | Result |
| --- | --- |
| Focused auth / Workspace / Team regressions | 293 passed,0 failed |
| Full frontend | 1,019 passed,3 historical NEXUS failures,1,022 total |
| Frontend lint/typecheck | Exit0 |
| Production build | Exit0, existing Vite native-config/chunk warnings |
| Development Chromium | 7 gates passed,0 failed; three acknowledged Vite hot updates |
| Production Chromium | 6 gates passed,0 failed |
| Backend integration | 127 passed,0 failed /2,073 assertions in one isolated command: Teams33,management35,tenancy35,auth-fences24 |
| Mailpit | Two sentinels preserved in completed runs; no deletions/shared access |

Measured development counts per endpoint (memberships, invitations, eligible-teams): entry1 each; after explicit retry2 each; after explicit recovery3 each. No spontaneous count increase during the observation interval. Later meaningful route reloads take cumulative counts to5 each before authentication stages; these are separate new-scope cycles, not automatic error retries. Failed Workspace context is one request per reload,2 across two reloads. Baseline entry was2 each. Production checks assert the same1/2/3 bounds. No new mutation was added and no uncertain mutation key was changed.

Browser signup/login/email verification, real Workspace creation/selection, invitation acceptance and foreign-Workspace404 are reused from the existing owned01D fixture. Runtime cases add503/recovery, Settings/Teams/hub navigation and reload, actual server logout revocation/relogin, controlled401 private-view fencing, and failed context reads. Existing unit tests cover delayed reads and actor/Workspace/membership/session changes; two additional tests enforce load cancellation/coalescing. No original sharedQA authenticated trace was captured.

Exact commands (Bun PATH; GOMAXPROCS=2, RAYON_NUM_THREADS=2):

```powershell
bun run --cwd apps/web test src/features/workspaces/live/Administration.test.ts src/features/teams/live/Teams.test.tsx src/features/auth src/features/workspaces/live/Workspace.test.ts --maxWorkers=2
bun run --cwd apps/web test --maxWorkers=2
bun run lint:web
bun run build:web
# Each run uses its own fresh absolute FE_INTEGRATION_EVIDENCE_DIR outside the repository.
# PLAYWRIGHT_MODULE points to the installed Playwright dependency.
node scripts/frontend/fe-integration-01a.cjs --01d --browser-only --runtime-only --runtime-hmr
node scripts/frontend/fe-integration-01a.cjs --01d --browser-only --runtime-only --production
node scripts/frontend/fe-integration-01a.cjs --01c --backend-only --production
```

`lint:web` is TypeScript noEmit. Chromium uses actual API+worker+13 migrations, owned PostgreSQL/Valkey and sentinel-protected Mailpit. Synthetic503/401 responses affect only the owned browser. No database records, cookies or sessions from shared QA are modified. Network counts are asserted, not inferred from UI. Admission remains unchanged; the harness observes the existing global window rather than resetting counters or raising budgets.

External raw evidence: `D:/Full_Stack_Apps/Unblok-RUNTIME-HOTFIX-20261017`. Committed summaries/screenshots: `docs/frontend/evidence/RUNTIME-STABILIZATION`.

## Failed attempts and limitations

- baseline-hmr: instrumentation initially used an unnormalized Windows moduleGraph path; no HMR assertion executed. The harness path was corrected.
- baseline-hmr-2: HMR reevaluation passed; bounded-request assertion failed with2 requests per endpoint versus expected1, confirming duplicate loads.
- corrected-dev: bounded counts passed; harness looked for `Invite member` rather than the actual `Invite Member` label and timed out. Corrected test selector only.
- corrected-dev-2: recovery passed; unscoped hard reload of Settings correctly required Workspace selection. Harness now follows actual SPA Settings navigation; no production selection bypass.
- corrected-dev-3: actual logout/relogin passed; synthetic401 left a real server session alive, so reloading login correctly restored it. Fixture now explicitly revokes its owned session before expecting a fresh login.
- corrected-dev-4: additional rapid requests hit an unchanged429 admission budget. Final fixture waits through the existing admission window before auth regression; it does not raise limits, reset counters or retry mutations automatically.
- corrected-dev-5: all7 gates passed; its inherited evidence metadata incorrectly said HMR false even though explicitly enabled. Final verified-hmr run corrects that metadata and asserts Vite hot-update console acknowledgments.
- corrected-production: all6 gates passed. Original local401/provider attribution remains unresolved even with passing selected regressions.

Historical full frontend NEXUS failures remain the missing resolved reference, graph0 versus>=12, and fan-out3 versus<=2. Earlier strict demo capture22/24 (3/6 pixel mobile archive differences), architecture combined-run timeout, queue/SIGTERM failures and Workspace-navigation flake are not claimed resolved. No CSS/demo changes or visual comparator tolerance changes are made; a fresh exhaustive visual suite, screen-reader audit and full queue/shutdown suite are not run for this hotfix.

## Local runtime follow-up

Shared QA remains at12 migrations. A frontend hotfix cannot repair an absent database relation. After environment ownership, backup and migration approval, the environment operator must use the existing supported `bun run db:migrate` with the verified QA configuration, confirm migration13 is applied, and restart matching API/worker versions. Do not reset/drop/force-resolve, run seed data or blindly point that command at an unknown database. This task deliberately did not run it against shared QA.

Reproduction of the original authenticated401 timeline/provider crash still requires the original redacted network/HMR evidence or another observed occurrence. PM should review those unresolved limitations explicitly. Draft only: no merge/deploy until approval.

Backend test-generated historical JSON artifacts were copied to the external backend-generated archive, then only the five known generated files restored to their clean baseline. No backend implementation changes remain. Exact source inventory/hashes are committed alongside results. Shared local schema/runtime status was inspected read-only; no migration or data cleanup was executed.
