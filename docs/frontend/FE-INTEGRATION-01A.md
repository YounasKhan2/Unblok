# FE-INTEGRATION-01A — implementation and review handoff

Prepared 2026-10-16 (Asia/Karachi). **Draft PR for human/PM review. Do not merge or deploy.**

**Latest review pass:** see [PR #49 final correction findings and current results](FE-INTEGRATION-01A-CORRECTION.md). The original implementation results below are retained as historical evidence. The correction changes test infrastructure/documentation only; navigation uncertainty and exact screenshot differences remain explicitly qualified.

## Baseline and approved scope

Repository: `D:\Full_Stack_Apps\Unblok`. Implementation branch: `codex/fe-integration-01a`. Clean starting HEAD and fetched `origin/main`: `8f83887f11a4b84f3500934847d757301023d4ef`. PR #46 was verified merged at `3cf2de0f0da8f72b92a5108ea4a46578006a494a`; PR #48 was verified merged at the base tip. No prior rejected separate-shell source or recovery archive was reused. No existing local work was discarded.

The product owner approved separating demo/live data, removing demo controls live, necessary real authentication transitions, and subsequently approved unavailable wording with non-operational business controls in existing unsupported page layouts. The [file-level plan](FE-INTEGRATION-01A-PLAN.md) records the bindings and sequence. The exact implementation HEAD is recorded in the PR description and final handoff; this committed report cannot contain its own commit hash.

## Result and before/after behavior

| Area | Before | Result |
| --- | --- | --- |
| Shell | Prototype rail/header/switcher required demo business providers; real accounts used the minimal account surfaces. | The actual `AppShellLayout`, `NavigationRail`, `WorkspaceHeader` and `WorkspaceSwitcher` consume presentation bindings. Validated Workspace selection enters that frame. All ten destinations, ordering, icons, grouping, widths, header height and design tokens remain. |
| Demo controls | Reset/restore and test-user/role switching belonged to prototype state. | Remain in `/demo`; absent live. Demo credential autofill and deterministic recovery links also remain demo-only as part of the necessary real-auth transition. |
| Authentication | Prototype forms used mock session/signup/reset semantics. | Actual prototype signup/login/recovery forms use existing real Session/AuthApi contracts. Signup stays anonymous and gives the same neutral receipt for new/duplicate addresses. Model A remains explicit login → verification request → proof confirmation. Recovery requires email, proof and a valid password; generic acceptance is never described as proof of reset. Only exact `/invite` return paths propagate through live auth links. |
| Workspace | Prototype creation and switching used mock state. | Existing creation form uses real schemas, the real store and existing tab journal. Unknown creation outcome locks original details and offers manual retry with the same key/body. Discovery refreshes after confirmed creation. A validated current selection remains visible even outside the bounded discovery page; its fresh self role supersedes an older discovery role. |
| Unsupported business pages | Original bodies depended on NEXUS/local business state. | Original outer frame/toolbar/fallback markup is extracted and shared with demo. Live bodies explain the missing integration; business controls are natively disabled, unknown metrics are omitted and business overlays are not mounted. No fake empty queue, records, permission grants or successful no-op actions. |
| Preferences | Appearance lived inside the seeded Settings provider. | Existing preference controls/theme resolver are reused; live persistence contains per-actor appearance preferences only. Notification controls explicitly remain unavailable. No new theme selector or menu. |
| Teams/members | Existing real pages managed their own Workspace selection. | Existing real Team/member routes and supported forms remain. They reuse already validated scope under the shell. Both stores fence membership identity changes as well as actor/generation/Workspace/role/lifecycle. |

Verification/account/invitation surfaces retain their existing real behavior; no mock invitation preview or automatic joining was added. The existing Workspace loading/error presentation is reused with explicit selection ownership. Unsupported Projects/Issues/planning/Inbox/Insights APIs and FE-TEAM-02 management UI were not implemented.

## Security evidence

- Recursive runtime import closure, using emitted JavaScript to distinguish type-only imports, rejects live paths to prototype business providers, fixture modules and mock authorization. The demo entry is lazy and selected only for `/demo`.
- No backend API/client transport, CSRF, cookies, schema, migration, worker, cryptography or authorization policy changes. Every real mutation still uses existing server contracts and server authorization.
- The private frame remounts across actor, session generation, Workspace, membership ID, role, membership lifecycle and Workspace lifecycle changes. Missing/mismatched scope does not mount private projections. Members and Teams independently abort/invalidate reads and mutations; tests deliberately ignore AbortSignal and release old responses after authority replacement.
- Existing idempotency keys, pending mutation journals, session-generation isolation and Team If-Match behavior remain. No automatic mutation retries.
- Real Chromium verifies same-origin CSRF presence, non-admin membership-list denial and foreign-Workspace denial (both 404), account switching, real revocation/expiry, observed membership suspension, and a delayed old Team response released after switching Workspaces.
- The membership suspension fixture is restricted to a newly created MEMBER in the runner's owned disposable PostgreSQL container. It is not a shared QA mutation or an implementation of a management API.

## Commands and results

| Command/suite | Observed result |
| --- | --- |
| `bun install --frozen-lockfile` | Pass; 385 installs / 506 packages checked, no dependency or lockfile changes. |
| `bun run lint:web` | Pass. The repository's web lint command is `tsc --noEmit`; there is no separate configured web ESLint run. |
| `bun run build:web` | Pass; existing Vite future-native-config and >500 kB chunk warnings remain. |
| `bun run test:web` | **885 passed / 3 historical failures**, 888 tests across 61 files. |
| `bun run --cwd apps/web test src/app/shell/LiveShell.test.tsx src/features/auth/live/LiveRoutes.test.tsx` | **32 passed / 0 failed**. Includes membership replacement, mismatched selection, stale responses, bounded discovery/current selection and exact invitation-return-path checks. |
| `bun run typecheck:backend` | Pass, including architecture boundary check. |
| `bun run lint:backend` | Pass. |
| `bun test --no-env-file apps/api/test apps/worker/test packages/backend-runtime/test scripts/backend/architecture.test.ts` | Serial verification: **101 passed / 0 failed**, 265 assertions. Combined-run architecture timing caveat below. |
| `bun test --no-env-file --preload <evidence>/prisma-node-preload.ts apps/api/verification/authentication-integration.test.ts apps/api/verification/session-integration.test.ts` | Owned-service verification: **57 passed / 0 failed**, 1300 assertions. |
| `bun test --no-env-file --preload <evidence>/prisma-node-preload.ts scripts/backend/tenancy.test.ts scripts/backend/auth-fences.test.ts` | Owned-service verification: **59 passed / 0 failed**, 269 assertions. |
| `node scripts/frontend/fe-integration-01a.cjs` | Final Chromium run: **22 passed / 0 failed**. The [combined manifest](evidence/FE-INTEGRATION-01A/evidence.json) also records the architecture timeout; individual attempts and serial unit verification are disclosed below. |

The Node preload is generated outside the repository solely to run existing Prisma subprocesses with installed Node on this Windows host; it changes no assertion, timeout or application runtime. Integration environment values are generated in memory and never committed or printed. Counts overlap where focused suites are included in full suites; do not sum them as distinct coverage.

The three NEXUS failures remain in untouched fixture tests: reference/DAG integrity, milestone dependency graph population (0 versus required 12), and active graph fan-out (3 versus allowed 2). Historical queue-notification timing, Windows SIGTERM/shutdown behavior, and production-scale Team directory p95 remain uncertified; their suites/performance objectives were not retested or altered here.

## Browser, preservation and migration evidence

The reproducible runner starts pinned, labeled, disposable PostgreSQL and Valkey containers with ephemeral loopback ports, disposable Mailpit, and real API, worker and Vite frontend processes. It does not read ignored QA environment files. It applies and checks **12 migrations only in its owned test database**, checks `/live` and `/ready` for 200, and observes real verification, invitation and recovery messages/proofs through the worker.

The runner does not connect to, clear, restore or delete shared QA Mailpit messages or database records. It sends no Mailpit DELETE requests. Two disposable capture sentinels must survive every run and teardown; disappearance is a hard failure. Only owned labeled containers/processes are removed. No shared volume, Valkey flush, QA session clear, permanent seed user or Workspace was used. Shared QA's actual migration state was deliberately not rechecked; no claim is made that this work migrated that database. The historical seven-message loss remains unresolved and is not attributed to this work.

Full working evidence is outside the repository at `D:\Full_Stack_Apps\Unblok-FE-INTEGRATION-01A-20261015`. The PR includes sanitized manifests, logs and representative screenshots in [the evidence directory](evidence/FE-INTEGRATION-01A/). Raw passwords, cookies, CSRF values, proof codes and generated infrastructure secrets are excluded. Screenshots mask password/proof inputs.

### Screenshot comparison

32 paired original/current captures cover 8 representative `/demo` routes × desktop/mobile × light/dark. Baseline source is archived from the exact base commit outside the repository, not from the rejected work. Both sides block remote font requests consistently and disable screenshot animations. **29 pairs are pixel-identical.** The remaining desktop-dark Projects, Teams and Dependencies pairs differ by **27, 1 and 23 pixels**, respectively; dimensions and rendered layout remain the same. These differences are disclosed for human inspection, not normalized away or called bit-for-bit identical.

Representative pairs: [original shell](evidence/FE-INTEGRATION-01A/gate-baseline-desktop-dark-my-work.png), [current demo shell](evidence/FE-INTEGRATION-01A/gate-after-desktop-dark-my-work.png), [original Projects](evidence/FE-INTEGRATION-01A/gate-baseline-desktop-dark-projects.png), [current Projects](evidence/FE-INTEGRATION-01A/gate-after-desktop-dark-projects.png). The [comparison JSON](evidence/FE-INTEGRATION-01A/demo-comparison-final.json) records every pair and difference bound. These are representative visual gates, not a WCAG certification or an exhaustive certification of every viewport, shortcut and prototype mutation.

### Failed intermediate attempts and corrections

| Finding | Classification/outcome |
| --- | --- |
| Initial after-capture took a screenshot before the lazy demo entry rendered. | Capture defect. Replaced fixed-delay-only capture with a rendered-heading check and paired archived-base/current captures. No blank capture is reported as a passing visual gate. |
| Reused auth forms changed IDs/titles; six old live-route assertions expected the replaced form. | Assertions now verify actual label/input pairs and preserved real-auth guidance. No security assertion or NEXUS test was removed. |
| Sidebar width checked during its existing transition (103.125 versus 52 px). | Test timing defect. Wait for final original width; animation unchanged. |
| Team/member pages reselected Workspace after shell remount, causing a read loop and 429. | Confirmed integration defect, fixed by one-owner scope selection. Reusing existing loading/error UI also requires explicit ownership so an old UUID route cannot override a switch in flight. No rate-limit adjustment. |
| Nonbrowser APIRequestContext logout fixture returned 403. | Required browser metadata/security behavior. Revocation fixture now uses real same-origin browser fetch with real CSRF, without bypassing protections. |
| Invitation issued before inviter password reset/logout-all did not join the recipient. | Correct backend inviter-epoch fencing, confirmed in source. Test chronology was corrected; no proof/session/security contract change. |
| Invitation page heading rendered before session bootstrap completed. | Test timing defect. Wait for the confirmed signed-in actor before asserting/capturing. |
| One run stayed on the verified account page after clicking Create workspace and timed out before the creation form. | Intermittent navigation failure; cause unresolved. A rerun with navigation tracing passed creation and all 22 browser checks without a production change. The failed attempt is retained outside the repository in `review-ready`; this is not claimed as a diagnosed fix. |
| Backend launcher reported `Script not found "test"`. | Bun argument-order error; zero tests executed in those launches. Corrected to `bun test --no-env-file ...`. |
| A test-only relative type import into root `node_modules` failed architecture resolution. | Test infrastructure defect. Uses existing root compiler dev dependency through a narrow typed loader instead; boundary rules unchanged. |
| Combined unit run's architecture test exceeded its existing 5000 ms limit. | Timing caveat recorded; unchanged serial rerun passes all 101 tests. No timeout or assertion relaxation. Browser-only processes now stop before independent backend regressions. |

## Reproduce safely

Requires installed Docker, Bun, Node and an operator-provided Playwright module/browser. Do not point this runner at QA services; it owns its infrastructure and ignores QA environment files.

```powershell
$env:PLAYWRIGHT_MODULE = 'C:\Users\youna\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\playwright'
$env:FE_INTEGRATION_EVIDENCE_DIR = 'D:\Full_Stack_Apps\Unblok-FE-INTEGRATION-01A-review-run'
node scripts/frontend/fe-integration-01a.cjs
```

`--backend-only` explicitly skips Chromium and records the skip. The default executes both browser and listed backend suites. The production launch scripts remain `bun run dev:api`, `bun run dev:worker`, and `bun run dev:web` using the operator's existing local configuration; this PR does not change or certify shared QA configuration.

## Limits for review

- This is the first Authentication/Workspace binding of the actual shell, not completion of Projects, Issues, Dependencies, Cycles, Milestones, Roadmap, Inbox, Insights, integrations or FE-TEAM-02. Nested unsupported routes do not invent detail records; their live capability frame remains unavailable. `/demo` keeps the full existing implementation.
- Team/member/account/verification/invitation pages retain their existing real API forms and contracts. Full prototype Team detail/settings presentation parity and business integration are not claimed here.
- Existing account tools, verification and sign-out remain at `/account`; no new account menu/logout control was introduced into the prototype shell. Existing personal appearance controls remain in Settings → Preferences.
- Workspace switcher shows a bounded discovery page plus its freshly validated selection. The existing `/account` picker provides further server pages; no new pagination pattern or all-workspaces/count claim was invented.
- Unknown creation outcomes retain the original request and manual retry. No new abandon-request control was added to the prototype form; inspect `/account` before considering a different request. Storage/reconciliation errors remain fail-closed and may require operator assistance.
- Revocation visibility is bounded by server requests and existing focus/visibility/session polling, not an invented push channel. Server authorization remains authoritative between refreshes.
- Production deployment, shared QA database state, complete WCAG coverage, every browser/viewport and production-scale capacity were not certified. Three historical fixture failures and the timing/queue/lifecycle limitations remain explicit.

## Changed-file inventory

[Exact source/test inventory](evidence/FE-INTEGRATION-01A/changed-source-files.json). The PR diff also includes this report, the concise plan, sanitized evidence and representative screenshots. No backend source, database schema/migration, worker, NEXUS fixture, CSS/design-token, dependency, lockfile, shared QA data, main branch or worktree cleanup changes are part of this delivery.
