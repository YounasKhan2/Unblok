# FE-INTEGRATION-01A — PR #49 final correction review

2026-10-16. Reviewed starting HEAD: `76b9391296804265913aa93a838d1381d85d1972`. Branch `codex/fe-integration-01a` was clean; GitHub confirmed PR #49 open, unmerged and draft at that exact HEAD. This pass changes tests, comparison tooling and documentation only. No confirmed production defect was established, and no application code, prototype styling or security contract was changed. Final correction HEAD is recorded in the PR description.

## Workspace navigation investigation

The original `review-ready` attempt stopped after verification with the verified account card still visible instead of the creation form. That attempt did not retain a navigation/HTTP timeline sufficient to establish the cause. The original timeout remains **unresolved**, not fixed by an assumed attribution.

Source inspection covered these ownership boundaries:

- `apps/web/src/features/workspaces/live/WorkspacePicker.tsx`: the account link targets `/onboarding/workspace` directly.
- `apps/web/src/features/auth/live/LiveRouter.tsx`: creation is inside the authenticated SessionGuard and actual AuthLayout, outside LiveShellBoundary. It is not an anonymous-only route.
- `apps/web/src/app/shell/LiveShellBindings.tsx`: LiveCreationBinding supplies store state/actions without navigation effects. UUID Workspace opening and shell scope selection do not wrap the creation route.
- `apps/web/src/features/auth/live/SessionGuard.tsx` and `apps/web/src/features/auth/session/SessionStore.ts`: bootstrap checks server identity; read-only refresh coalesces and fences stale responses without changing an already authenticated route to loading. Login's success handler and the anonymous guard can both target the account destination; inspection alone does not prove that they caused the observed verification-to-creation failure.
- `apps/web/src/features/workspaces/live/WorkspaceContext.tsx` and `apps/web/src/features/workspaces/live/WorkspaceStore.ts`: actor/generation/pending changes invalidate state; discovery and focus revalidation do not own account-to-creation navigation. Existing creation journals and explicit retry remain unchanged.
- `apps/web/src/features/auth/live/VerificationPage.tsx`: confirmation refreshes verified identity and then navigates to account or the exact invitation continuation. No production change was justified by inspection alone.

A new focused regression in `LiveRoutes.test.tsx` confirms both creation URLs render the actual form while a read-only session refresh is delayed, and after it completes. The real Chromium runner additionally holds an actual `/auth/me` response, clicks the verified account's creation link, checks the real form/path, releases the response and checks that form input/path remain intact. This runs **six times per complete run**, without creating records during the repetitions. Three successful complete browser executions passed: **18 delayed-refresh navigation repetitions**, plus subsequent real creation. Existing default browser and backend deadlines were not increased. The new regression does not reproduce every possible scheduling/network failure.

## Prototype preservation findings

The baseline was the existing archive of approved commit `8f83887f11a4b84f3500934847d757301023d4ef`, served separately from current source. Fresh, independent browser contexts visited only `/demo`; real `/api/v1/` requests were blocked. Reset/restore and a temporary demo Workspace affected only each disposable context's localStorage, never a user's browser profile or shared QA.

`scripts/frontend/fe-integration-01a-demo.cjs` passed **10 checks on baseline and 10 on current**:

1. Original ten destinations, order, SVG paths, classes, separators and shell dimensions.
2. Issue drawer opening and Escape closing.
3. Original issue form, input and cancel without creating an issue.
4. Command palette and help overlay through existing shortcuts.
5. Rail collapse/expand (52/220 px), G P navigation and Projects filtering.
6. Three flagged dark pages with original text, controls/classes, point geometry/computed colours and three repeated captures each.
7. Dependency graph/matrix/blocker keyboard views and filtering.
8. Actual demo Workspace creation, selection/switching and switcher Escape/focus restoration.
9. Reset, restore (including restored selection), and switching to a visible existing test user.
10. Existing light/dark query behavior and mobile navigation open/close at 390×844.

All **10 serialized comparison contracts matched exactly**, including navigation/icon/grouping geometry, page controls/text, filter outcomes, Workspace selections and test-user results. No runtime page errors occurred. Existing drawers/dialogs, business overlays, KeyboardContext, mock Workspace adapter/context, reset helper, dependency widgets, CSS/design tokens and NEXUS source files were also compared against the base; those source paths remain unchanged. The original 32 paired route/theme/viewport captures remain available in the implementation report.

### Three non-identical screenshot pairs

The original 27/1/23-pixel Projects/Teams/Dependencies differences were examined as exact RGB differences, not accepted using a new tolerance. Fresh repeated captures and read-only PIL comparison are included in [pixel-comparison.json](evidence/FE-INTEGRATION-01A/correction/pixel-comparison.json).

- Projects: new baseline/current captures differed at 16 avatar-edge pixels. Consecutive captures of the **same unchanged baseline** varied at 11 control-edge pixels; the same 11-pixel variation also occurred within current source.
- Teams: new baseline/current captures differed at the same 16 avatar-edge pixels. The previous single header-icon pixel did not recur in this run.
- Dependencies: two repeated baseline/current pairs were pixel-identical; one differed at 7 control-edge pixels. The unchanged baseline's own repeat also varied at exactly those 7 pixels.
- Corresponding rendered text, control classes, SVG navigation paths, geometry and sampled computed styles matched. All images retain their original dimensions and differences; no prototype, stylesheet, screenshot mask or comparison threshold was changed to obtain agreement.

This establishes capture variability for the repeated control-edge differences and finds no corresponding DOM/style regression. The precise renderer/compositing cause of the remaining avatar-edge differences is **not proven**. The additional help/overlay captures also retain small pixel differences (including 254 pixels for help); these are disclosed in the manifest rather than called pixel-identical. The original Modal retains its existing delayed focus behavior. Representative screenshots and exact raw differences support human review; they are not a claim of universal pixel identity.

### Pre-existing/demo and harness limitations

- The long test-user popup overflows the viewport in both baseline and current. Attempting its first OBSERVER entry failed actionability in both versions because it was outside the viewport. The final test switches a visible existing user; accessibility of every test-role entry is **not certified**. No popup redesign was made.
- Rapid dependency shortcut/filter actions initially sampled a prior rendered view on both versions. The final harness waits for the selected Graph tab and rendered filter outcome, not just a history URL update. This does not establish a production fix for every rapid-input race.
- Early harness attempts incorrectly blocked module URLs containing `/api/`, assumed a dialog role for the aside drawer, assumed `view=graph`, inspected nested `main` elements without selecting the outer one, or assumed multiple initial Workspaces. These checks were corrected against actual baseline source. Failed manifests/screenshots remain outside the repository; no application assertion, deadline or prototype was relaxed.
- These are representative interaction checks, not execution of every prototype mutation, every overlay state, all screen-reader behavior or every browser/viewport. Unexecuted combinations remain uncertified.

## Live capability/control inventory

The approved unavailable wording/disabled-control decision is retained. This pass introduces no UX decision or new product behavior. Paths in the following inventory are relative to `apps/web/src/`.

| Live surface / exact source | Result when backend capability is missing |
| --- | --- |
| `components/layout/WorkspaceHeader.tsx`: Search/command palette | Original button remains visible, natively disabled, existing title explains missing live search. Cmd/Ctrl+K cannot mount a palette or issue fake requests. |
| Same header: New Issue; `app/shell/LiveShellBindings.tsx` | Original button disabled. C cannot open a fake creation form. Unsupported creation callback fails rather than reporting success. |
| Header bell/blockers, `components/layout/NavigationRail.tsx` | Bell still navigates to existing Inbox destination. Unknown unread/blocker values have no invented badge/dot/count; demo-only Cycle 24/Milestone 3 badges are absent live. |
| NavigationRail | My Work, Inbox, Projects, Teams, Cycles, Milestones, Roadmap, Dependencies, Insights, Settings remain in original order/grouping. Reset, restore and test-user/role controls are absent live and exercised in `/demo`. |
| `app/shell/{DemoShellBindings,LiveShellBindings}.tsx` | Demo keeps IssueDrawer, CommandPalette, CreateIssueModal, CompletionGuardDialog, CycleErrorDialog and BulkActionBar. Live mounts none of these business projections; existing static help and responsive navigation remain. Real Team/member dialogs remain only on existing supported real routes. |
| `pages/my-work/MyWorkPageFrame.tsx` | Original task search, clear, state/priority filters and Create Task disabled; no queue/cycle records or business rollups. |
| `pages/projects/ProjectsDirectoryPageFrame.tsx`, live Projects/Issues wildcard routes | Search/clear, team/posture filters, Reset/Create project disabled; no projects, issue details or fabricated detail records. `features/issues/components/IssueUnavailable.tsx` keeps existing fallback presentation. |
| `pages/inbox/InboxPageFrame.tsx` | Mark all read disabled; no fabricated notifications or unread total. |
| `pages/cycles/CyclesPageFrame.tsx`, `pages/milestones/MilestonesPageFrame.tsx` | Team filter/Create Cycle/Create Milestone unavailable; no lists, detail records or counts. |
| `pages/roadmap/RoadmapPageFrame.tsx`, `features/planning/components/roadmap/RoadmapToolbar.tsx` | Group/date navigation/Today/Schedule Work, search and all filters disabled. Unknown range says Unavailable; no schedule/events/people lists invented. |
| `pages/dependencies/DependenciesPageFrame.tsx` | Add Dependency disabled; no seeded graph, summary numbers, removal actions, dependency dialog or fake graph persistence. |
| `pages/insights/InsightsPageFrame.tsx` | Existing frame with unavailable explanation; no invented risk or delivery metrics. |
| `pages/settings/{WorkspaceSettingsPageFrame,IntegrationsSettingsPageFrame}.tsx` | Existing headings with unavailable explanation, no fake configuration, connection or mutation success; Workspace ID field is unpopulated, not invented. |
| `pages/settings/PreferencesSettingsPage.tsx`, `features/settings/context/LivePreferences.tsx` | Existing appearance controls work with per-actor theme/density preferences. Notification controls disabled with explicit missing-API guidance; defaults are not a delivery-status claim. No new theme control. |
| `features/auth/live/LiveRouter.tsx`, existing Team/member/account/verification/invitation surfaces | Supported real stores/APIs retained. Settings Team/member destinations lead to existing real routes; account/sign-out remains `/account`. Full prototype Team-detail parity and missing business APIs remain outside scope. |

The live Chromium manifest contains a per-page inventory of business buttons/inputs/selects and asserts all are disabled on unsupported destinations. Tests assert Search/Create are disabled, shortcuts mount no business overlays, demo controls are absent, and real user/Workspace content contains no NEXUS records. Existing recursive runtime-import graph and membership/stale-response tests remain enforced. Server-side authorization remains authoritative; no cached role creates a grant, and no successful no-op mutation was added.

## Security, test execution and preservation

One confirmed test-infrastructure isolation gap was corrected in `scripts/frontend/fe-integration-01a.cjs`: Vite previously permitted default environment-file loading/inherited `VITE_AUTH_API_ORIGIN`, despite the runner's intent to own all services. It now sets `envDir:false` and explicitly defines the frontend API origin as the owned same-origin proxy. This prevents an ignored QA configuration or inherited absolute origin from redirecting future runs. Earlier observed browser requests used the owned proxy; the gap does not establish any prior shared QA access. The final verification deliberately supplies an unusable inherited absolute API origin to exercise the override. This is a runner correction, not an authentication/application contract change.

An intermediate isolation run passed 13 checks, then timed out looking for Team navigation after a new `/my-work` → `/account` navigation and captured a blank page. Its trace did not distinguish document reloads from SPA navigation and did not retain failure-time HTTP/page errors. Its cause remains unresolved; it is not attributed to HMR, the origin override or application routing. Remaining browser checks and all backend suites were **not executed in that attempt**. The disposable Vite server now disables HMR/file watching for repeatable immutable runs, and browser diagnostics retain document requests plus HTTP/page errors even on failure. These are infrastructure safeguards, not a claimed production fix or a timeout increase. The partial [manifest](evidence/FE-INTEGRATION-01A/correction/interrupted-isolation-evidence.json) and screenshot are preserved.

The live suite covers real anonymous/unknown/wrong-password/duplicate signup behavior, explicit verification, recovery eligibility and valid proof, logout, real session revocation, account switching, invitation continuation/acceptance, discovery/creation/switching, membership suspension, foreign-Workspace/non-admin denial, ignored/delayed responses and exact idempotency-key/body preservation after an uncertain creation response. All writes retain real same-origin CSRF. Only newly owned test data/services are used.

Three complete Chromium executions passed **23/23** each, including the final runner-isolation configuration. The first combined run (`live-1`) also passed backend unit/auth-session/tenancy **101/57/59**. The second (`live-final`), run alongside comparison activity, passed all browser cases but recorded backend unit **100 pass / 1 architecture timeout**, auth-session **0 pass / 4 setup/cleanup failures**, tenancy **35 pass / 1 setup failure**. The latter Prisma subprocesses exceeded existing 6000 ms deadlines; cleanup then encountered unconnected Valkey clients. These are recorded failures, not additional passing security coverage or a proven application defect. The architecture test's existing 5000 ms deadline was not raised. The final pinned-origin, HMR-disabled run passed all 23 browser checks, 57 auth/session tests and 59 tenancy tests; its unit suite again reported 100 pass / 1 architecture timeout. Idle sequential verification separately passed all 101 unit tests. Both outcomes are retained in raw manifests/logs.

The successful browser runs confirmed all **12 migrations only on their owned disposable databases**, real API `/live` and `/ready` 200, and two surviving Mailpit sentinels with zero mail deletion/shared capture access. Demo comparison blocks real API requests. No shared QA users, sessions, Workspaces, mail, cache, schema or migration state was changed or certified. Historical seven-message loss remains unresolved.

The three original NEXUS fixture failures remain explicit. Historical queue timing and Windows SIGTERM suites, production performance, all viewport/assistive-technology combinations and shared QA state were not executed/certified in this correction. No tests, fixture expectations or timeouts were weakened.

## Final commands and counts

| Command | Correction-pass result |
| --- | --- |
| `bun run --cwd apps/web test src/app/shell/LiveShell.test.tsx src/features/auth/live/LiveRoutes.test.tsx` | **33 passed / 0 failed**; includes the new delayed-restoration route regression. Overlaps the full suite. |
| `bun run test:web` | **886 passed / 3 historical failures**, 889 tests / 61 files. The same reference/DAG, empty milestone graph and fan-out NEXUS expectations fail in untouched fixture files. |
| `bun run lint:web` | Pass (`tsc --noEmit`, not a separate ESLint run). |
| `node scripts/frontend/fe-integration-01a.cjs` | Three successful browser executions, **23 Chromium checks passed / 0 failed each**. The final combined run also reports unit 100 pass / 1 architecture timeout, auth/session 57 pass and tenancy 59 pass. Loaded-run failures are retained separately above. |
| `node scripts/frontend/fe-integration-01a.cjs --backend-only` | Idle rerun: **101 unit / 57 auth-session / 59 tenancy tests passed, zero failures**. Explicitly skips Chromium; it is not counted as another browser pass. |
| Underlying unit command: `bun test --no-env-file apps/api/test apps/worker/test packages/backend-runtime/test scripts/backend/architecture.test.ts` | **101 passed**, 265 assertions in idle rerun. Original and loaded combined-run architecture timeouts remain documented. |
| Underlying auth command: `bun test --no-env-file --preload <evidence>/prisma-node-preload.ts apps/api/verification/authentication-integration.test.ts apps/api/verification/session-integration.test.ts` | **57 passed**, 1300 assertions in idle rerun. |
| Underlying tenancy command: `bun test --no-env-file --preload <evidence>/prisma-node-preload.ts scripts/backend/tenancy.test.ts scripts/backend/auth-fences.test.ts` | **59 passed**, 269 assertions in idle rerun. |
| `node scripts/frontend/fe-integration-01a-demo.cjs` | **10 checks baseline + 10 current**, all 10 serialized contracts equal, no page errors. |
| `python scripts/frontend/fe-integration-01a-compare.py <demo-evidence>` | 31 exact comparisons recorded: 19 cross-version pairs and 12 within-version repeats. This measures differences; it does not assert pixel identity. |
| `node --check` on the runner and both browser scripts | Pass. |
| Production build, backend typecheck/lint, queue/SIGTERM/performance suites | **Not rerun in this correction.** No production/backend/dependency source changed; earlier build/typecheck/lint results are historical, not new executions. Queue/SIGTERM/performance limitations remain. |

The idle manifest has zero backend failures and an explicit Chromium skip; the browser evidence comes from the separate complete runs. Test counts overlap and are not summed as unique coverage. No claim is made that every combined run was green.

## Changed-file inventory

- `apps/web/src/features/auth/live/LiveRoutes.test.tsx`: one focused route regression.
- `scripts/frontend/fe-integration-01a-journeys.cjs`: six-iteration delayed-refresh browser regression, failure-time document/HTTP/error diagnostics, and live unsupported-control/overlay inventory assertions.
- `scripts/frontend/fe-integration-01a.cjs`: disable Vite env-file loading, pin the owned API proxy, and disable runner HMR/file watching.
- `scripts/frontend/fe-integration-01a-demo.cjs`: isolated paired baseline/current prototype interaction and rendered-contract comparison.
- `scripts/frontend/fe-integration-01a-compare.py`: read-only exact pixel comparison, no masking/tolerance.
- This report, the latest-review link in `FE-INTEGRATION-01A.md`, and `docs/frontend/evidence/FE-INTEGRATION-01A/correction/`: manifests, logs and screenshots. No application implementation files changed.

## Reproduction and evidence

Working evidence: `D:\Full_Stack_Apps\Unblok-FE-INTEGRATION-01A-correction-20261016`. Committed [correction evidence](evidence/FE-INTEGRATION-01A/correction/) retains successful and failed live manifests, loaded-run backend failures, idle rerun logs, demo contracts, repeated screenshots and pixel differences. Plain-text logs have trailing whitespace removed only; secrets/proofs/cookies are not included.

```powershell
$env:PLAYWRIGHT_MODULE = '<installed Playwright module path>'
$env:FE_INTEGRATION_EVIDENCE_DIR = '<absolute fresh evidence directory outside repository>'
node scripts/frontend/fe-integration-01a.cjs
# Optional separate backend verification: explicitly records Chromium as skipped.
node scripts/frontend/fe-integration-01a.cjs --backend-only

# Serve the archived approved source and current frontend on separate loopback ports.
$env:FE_DEMO_BASELINE_ORIGIN = 'http://127.0.0.1:4328'
$env:FE_DEMO_CURRENT_ORIGIN = 'http://127.0.0.1:4327'
node scripts/frontend/fe-integration-01a-demo.cjs
# Requires Pillow, does not edit screenshots or apply a tolerance.
python scripts/frontend/fe-integration-01a-compare.py $env:FE_INTEGRATION_EVIDENCE_DIR
```

No merge, deployment, worktree cleanup or FE-INTEGRATION-01B work. No new product-owner UX decision is proposed. Human review remains required; the unresolved navigation timeout and remaining exact-raster uncertainty are not represented as solved.
