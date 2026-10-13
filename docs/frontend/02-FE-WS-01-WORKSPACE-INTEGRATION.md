# FE-WS-01 — Real Workspace frontend integration

Implemented for human review, not merged, deployed or production-certified. Exact fetched base: `73abe14d7101cba58636a2b7acd9b1b9339a5004`, including merged BE-WS-01 and its tracker update. Branch `feat/fe-ws-01-workspace-integration`; final HEAD is recorded in the delivery PR. No production backend, schema, migration, dependency, token, demo fixture or prototype shell change.

## Inspection and ownership

Reviewed FE-AUTH-01/F4, BE-WS-01, the shared Zod/controller contracts, live session generation/CSRF client, routing, AuthCard/AuthField/Button, prototype onboarding, WorkspaceContext/Switcher and demo separation. The prototype switcher is directly coupled to mock identity, fixture persistence and `/my-work`; importing it into the real account boundary would install unsupported business authority. The live boundary therefore reuses the existing application AuthCard, accessible fields, compact buttons and semantic classes, with a bounded Workspace picker. Existing prototype onboarding/switcher and NEXUS providers remain exclusively in the labelled demo. No new shell or styling system is introduced.

`features/workspaces/live` owns the typed API, request-generation store, React provider, picker and creation/context pages. Existing SessionStore is still the sole browser identity boundary; it exposes a read-only generation for invalidating Workspace requests. AuthApi shares its cookie/CSRF/mutation admission with the four Workspace calls; existing auth contracts and no-auto-retry behavior remain intact. Both ownership tests exclude prototype providers, mock identity and fixture imports from live code.

## Live routes and contracts

| Surface | Calls / behavior |
| --- | --- |
| `/account` | GET `/api/v1/workspaces?limit=20&sort=workspace_asc`; own authorized page; empty/loading/error states; create and selection links |
| `/onboarding/workspace` | Strict shared name/slug input; POST `/api/v1/workspaces`; CSRF bootstrap, cookie credentials and UUID Idempotency-Key; only confirmed, validated201 navigates |
| `/workspaces/:workspaceId` | Parallel GET detail and `/me`; validate exact ID, matching membership/role/status/self projections; show current server role and honest empty business state |
| `/demo/*` | Existing labelled curated NEXUS experience; never a fallback for a real API failure |

All live Workspace routes require confirmed `/auth/me` identity through the existing SessionGuard. Unverified accounts are not assigned an invented frontend restriction. Former Team/Project/Issue/etc routes remain account redirects; no corresponding business UI is enabled. Invites remain disconnected. Role/capability values come from server schemas; hints never authorize a later mutation. Workspace state contains no fake memberships or projects.

Deployment uses the existing `VITE_AUTH_API_ORIGIN` validation and `credentials: include`, with no cookie/CORS relaxation. **Workspace creation currently requires same-origin browser delivery** (the tested Vite proxy or an equivalent reviewed production reverse proxy). The existing backend CORS allowlist omits `Idempotency-Key`; a trusted-Origin POST preflight requesting that header returns403 in the real test. Setting a cross-origin API origin does not make creation work. A future cross-origin deployment needs a separately reviewed backend CORS header change and credential/cookie/TLS evidence; this frontend phase preserves backend security configuration.

Discovery holds **one page of at most20 rows**, replacing it on Next page rather than accumulating/downloading a collection. The scrollable picker remains compact. Only the signed opaque cursor supplied by the server is forwarded; it is not decoded or edited. CURSOR_STALE clears the page and offers an explicit first-page refresh. No totals or unbounded background fetch are introduced.

Account/session-generation changes synchronously abort and clear list/context/selection/creation state. Abort plus generation checks reject late results even if a transport ignores cancellation; an aborted obsolete401 cannot clear a newer session. Selection cancels prior list/context requests; once the latest context is confirmed, a missing list can reload one fresh page.404 clears inaccessible selection/context and the cached page. Errors do not render old context or switch to demo data. Focus/visibility rechecks selected access; the existing session timer is retained, with no new Workspace polling loop. Server revocation may precede a browser check; already displayed bytes cannot be recalled.

## Creation and uncertain outcomes

One generated UUID is bound to one canonical body before sending. Duplicate submissions are synchronously blocked. Timeout/network failure,409 contention,403,429,503 and malformed/mismatched success responses do not imply success or automatically rotate the key. Retry is user initiated and sends the same body/key. A definite400 input rejection permits correction.401 follows current-session clearing/route guards. Expired idempotency results receive an unavailable message, never automatic re-execution.

One tab-local `sessionStorage` journal retains **pending request metadata only**: actor ID for partitioning, idempotency key and canonical name/slug. It contains no cookie, CSRF token, password, principal, membership or role; it is not identity or authorization state. It survives a same-tab refresh only after a fresh server identity matches. Another account's record is removed; Explicit sign-out intent clears it, including unknown sign-out responses; unexpected session interruption retains it without retaining live Workspace authority. Invalid/oversized records are refused. Storage-write failure prevents sending an untracked creation. Collections and selection are never stored. The browser regression loses a response *after a real PostgreSQL commit*, refreshes the same browser, then proves its manual same-key retry returns one effect.

Users may explicitly abandon a retained attempt through a separate confirmation explaining that the earlier request may have created a Workspace and that they should check discovery first. This is a deliberate new attempt, not an automatic retry with a new key. Closing a tab, clearing site storage or starting in another tab loses this client journal; backend slug uniqueness/idempotency remain authoritative, and users must inspect discovery before a new request. No cross-tab durable reconciliation claim is made.

## Browser evidence and engineering verification

[Final browser observations](evidence/fe-ws-01/results.json), [recorded browser runs](evidence/fe-ws-01/runs.json) and [engineering observations](evidence/FE-WS-01-verification.json) record actual outcomes. Reproduction:

1. Start reviewed local infrastructure and `bun run dev:web` (localhost3000, existing Vite same-origin proxy).
2. Set `PLAYWRIGHT_MODULE` to an already-installed Playwright module. No package installation is needed.
3. Run `bun --env-file=apps/api/.env test apps/api/verification/frontend-workspaces-browser.test.ts` with API port4000 free.

The runner starts the actual Nest production controllers/services against an isolated owned database and Valkey namespace, applies all nine unchanged migrations, and removes its database/prefix on completion. Controlled pagination and suspension fixtures exist only in that database; no production endpoint or test-control HTTP route is added. Disposable credentials/proofs/cookies/keys are not persisted in observations/screenshots. Browser signup/login and Workspace creation are real HTTP calls; a Playwright fault injection discards only the first committed POST response to exercise uncertain outcomes.

Chromium coverage: signup/login→empty discovery; CSRF/Origin/header use; committed lost response→same-tab refresh→same-key retry; confirmed selection; refresh restoration;20-row page and3-row continuation; real stale cursor after membership revision; both themes at320/390/768/1024/1440 with no horizontal overflow; creation validation and keyboard focus; suspended membership404; PostgreSQL logout-all epoch revocation→same-context login recovery; different account with no previous Workspace cache; labelled NEXUS separation. Four additional mobile/desktop creation captures supplement the ten context captures.

Remote Google Fonts stalled the first screenshot for30seconds. Final captures explicitly abort only Google Fonts requests and use the **existing CSS system-font fallback**. This is documented fallback-layout evidence, not certification of deployed Inter typography. No screenshots are masked and no production CSS/timeout is altered. Initial browser preparations reached the existing6s migration deadline with exit137 and zero applied migrations; final setup uses explicit repository cwd and defers loading Playwright until after migration. Successful nine-migration preparation is observed; a unique root cause of the earlier deadline is not proven. These failures are retained in engineering evidence. Initial runner placement and two test-fixture defects were corrected without installing dependencies or weakening assertions.

Final counts, exit codes and durations are in the engineering JSON and delivery PR. Focused API/store/component tests cover pagination/response bounds, canceled selections, late401, account changes, duplicate admission, retry payload/key, definite input rejection, unavailable dependencies, revoked access, journal validation/privacy and honest component states. Full frontend tests retain the three pre-existing NEXUS failures; frozen fixture data is not modified to obtain a green gate. Architecture, frontend typecheck/lint/build and relevant backend checks are reported separately rather than equating the full suite with success.

A later browser rerun timed out at the unchanged120s test deadline, while Bun reported5043.43seconds elapsed and one assertion. The host/runtime cause is not established. After confirming API4000 was no longer listening, the one leftover database matching this runner's UUID namespace was removed; no owned cache keys remained. A subsequent complete rerun passed40 assertions in45.12seconds, including the cross-origin preflight limitation. Both the timeout and successful run remain recorded; no timeout increase or reliability certification is claimed. Visual inspection then found one loading-list capture; the final capture procedure waits for the loaded page before each context screenshot. The final40-assertion run passed in31.52seconds and replaces the same14 images.

| Final gate | Observed result |
| --- | --- |
| Focused frontend API/store/components/ownership/auth regressions |68pass,0fail |
| Full frontend |801pass,3 historical NEXUS failures; exit1 |
| Real Chromium Workspace integration |1pass,0fail,40 assertions;14 screenshots |
| Frontend typecheck/lint (`lint:web`) and production build |Passed; existing Vite config/chunk-size warnings retained |
| Architecture / backend typecheck / lint |Passed;385 source files/1052 edges/0violations |
| Backend regression including architecture fixtures |99pass,0fail,263 assertions |
| Authentication / sessions / auth fences |26/827;31/473;24/134;0fail |
| Tenancy and migration replay |34pass,0fail,132 assertions |
| Workspace HTTP security |29pass,0fail,671 assertions |
| Shipped auth-client real HTTP regression |1pass,0fail,149 assertions |
| API/worker build |Passed |
| Documentation links / diff and scope checks |Passed before delivery; no forbidden production paths changed |

The three frontend failures are `nexusEnterprise.test.ts` reference/DAG integrity and milestone graph population, and `nexusEnterpriseValidation.test.ts` active-blocked graph fan-out. Queue/lifecycle/audit gates were not rerun by this frontend phase; their prior failures remain unresolved, not recategorized as passing.

## Remaining requirements

Human review; production HTTPS/proxy/Host/CORS/cookie/CSRF topology; deployed fonts, broader browser and comprehensive accessibility/contrast checks; cross-tab storage/cookie transitions; CSP/XSS and request-metadata privacy; creation quotas/429 usability; server retention and idempotency key restoration; enterprise contention/load benchmarks. Local same-origin HTTP Chromium is not production TLS or security certification. Historical queue timing/between-test errors, SIGTERM143, audit advisory/DNS failure, NEXUS failures and migration timing remain open. Team/Project/Issue/Dependency, invitations, fixture replacement and BE-WS-02 remain outside this phase. Stop at human review; do not merge.

## PR #36 F1 correction — interruption-safe reconciliation

Reviewed HEAD: `517cab4573f386e0507048d94bdf765043a38693`. The prior anonymous-state transition removed the pending key on session expiry. SessionStore now exposes a separate explicit-sign-out generation. WorkspaceStore clears active authority and aborts obsolete requests on every session-generation transition, but retains pending metadata on unexpected interruption. Restoration requires a fresh server-authenticated matching actor. A different authenticated actor removes the record without exposing its details or replaying it. Explicit sign-out abandons metadata even if its HTTP result is unknown; this does not falsely claim that server logout succeeded. Confirmed creation removes the journal, and uncertainty/expired results keep the original key and honest discovery guidance.

Malformed or unreadable journals block new creation instead of silently generating another key. The existing confirmation control permits deliberate abandonment after checking discovery; unavailable storage must become writable before a new mutation can be sent. Only actor partition, key and canonical name/slug are retained. No credentials, tokens, roles, capabilities or Workspace collections are persisted. Browser storage is not a secure vault against same-origin scripts/XSS; actor isolation is enforced by the live store and authoritative backend, not by a claim of encrypted storage. If the browser refuses deletion, physical removal cannot be guaranteed; no foreign actor can restore or replay that record. Closing the tab/site-data clearing still loses the journal.

[Focused browser results](evidence/fe-ws-01-correction/results.json), [run history](evidence/fe-ws-01-correction/runs.json), [reconciled screen](evidence/fe-ws-01-correction/reconciled-workspace.png), and [correction gates](evidence/FE-WS-01-correction-verification.json) preserve separate evidence from the original certification. Reproduce the existing browser runner with `FE_WS_CORRECTION_ONLY=1`; no full visual-matrix regeneration is required.

Real PostgreSQL/Valkey/Chromium: first POST committed201, its response was discarded, PostgreSQL logout-all revoked the existing session, the same browser reloaded into login, reauthenticated the same server actor, restored the original body/key after another reload, and manually reconciled201. Two requests, identical key, one Workspace effect; CSRF and Origin remained present, the confirmed journal was absent, and no browser context/cookie reset was used. Nine existing migrations replayed; eleven assertions passed. One screenshot uses the previously documented system-font fallback. The interruption is durable server revocation, not a forged frontend flag or a wall-clock cookie-expiry simulation.

Focused regressions include explicit sign-out with a pending/unknown mutation, account mismatch, a delayed obsolete401 after fresh authentication, reload/store reconstruction, corruption, blocked storage, and expired-result guidance. Initial test runs caught an incorrect logout response fixture, mutation-admission overlap in a test, a missing blocked-state publication, and an overly specific wording expectation; these were corrected without altering backend contracts or weakening the result assertions. Final gate counts are recorded in the correction JSON. All prior NEXUS, queue, SIGTERM, dependency-audit, migration-timing and deployment findings remain open. This correction is for human review only; no merge or BE-WS-02 work.

Correction gate outcomes: focused frontend75pass; full frontend808pass/3 unchanged NEXUS failures; frontend typecheck/lint/build and backend typecheck/lint/build passed; architecture385files/1052edges/zero violations; backend regression initially98pass/1 five-second architecture timeout, repeat99pass/263 assertions; shipped auth-client initially six-second migration exit137, repeat1pass/149 assertions. Workspace HTTP suite failed preparation twice at its existing six-second owned-migration deadline, followed by its cache cleanup error (zero behavioral cases executed); this gate remains unresolved for this correction, rather than being substituted with the prior29-case pass. Focused Chromium separately replayed nine migrations and passed eleven assertions. Documentation twelve relative links and diff/scope checks passed. No timeout, assertion, dependency, production backend or migration changes were made to silence these observations.
