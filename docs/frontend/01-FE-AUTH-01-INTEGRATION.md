# FE-AUTH-01 — Real frontend authentication

Implemented for human review on `feat/fe-auth-01-integration`; not merged, deployed or production-certified. Exact clean fetched base: `1b619b189f0e7d89fc16f70ba766306354259eb6`, including PR #32 and the roadmap handoff. Final head is recorded in PR metadata. Reviewed backend reports 20–23 and the actual shared Zod/controller/session contracts. Evidence: [verification JSON](evidence/FE-AUTH-01-verification.json). The F4 section below is current; earlier matrices and the revoked-cookie failure remain historical evidence.

## Audit and scope

The existing React/Vite application had public marketing routes, prototype login/signup/recovery/invitation screens, localStorage-backed mock identity, prototype onboarding, and a fixture-backed application shell. It had no real session restoration, email verification screen or authentication transport. Public marketing components do not require the prototype providers. Existing auth cards, password controls, shared Button and semantic tokens are reused. The real forms use backend password validation (16–128 characters), rather than the demo's different composition rules.

The root now selects two explicit experiences:

- Public marketing and real account routes mount `SessionProvider` and `LiveRouter`, without prototype auth/workspace/project providers.
- `/demo/*` mounts the existing prototype router/providers under a basename and a persistent “NEXUS demo · Curated sample data” label. Its mock identity/local storage is demonstration state only. A plain link exits to real login; the live account boundary never reads or trusts it. Existing NEXUS fixtures, prototype screens, business components and marketing content remain unchanged.

Real authenticated accounts see their server profile, verification state and an honest pending-workspace page. Former business/onboarding routes require a real session and lead to that page. Invitations explicitly say they are not connected. No workspace, membership or privilege is invented; unverified users are not given a new frontend authorization restriction. No Workspace API, dummy-data replacement or business API is implemented.

## Flows and contracts

| Route / action | Server behavior and frontend interpretation |
| --- | --- |
| `/signup` | POST signup; generic accepted response, then ordinary sign-in. No auto-login or account-existence claim. |
| `/login` | POST login, then strict GET me projection. Only that server identity establishes client account state. |
| `/account` | GET me on refresh, focus, visible-page return and each visible authenticated 60-second check. No session renewal is implied. |
| Sign out / everywhere | POST logout / logout-all. Confirmed primary revocation clears client state even with unconfirmed cache cleanup; unavailable/unknown outcomes are not reported as success. |
| `/verify-email` | Authenticated request; paste the complete manual code. Confirm acceptance is followed by GET verification status and GET me. False status is not displayed as verification success. |
| `/forgot-password` | Anonymous or authenticated generic request; explain that an eligible verified account receives a code. No account lookup disclosure. |
| `/reset-password` | Email, manual code and new password/confirmation. Generic acceptance displays conditional sign-in instructions, without asserting redemption or clearing an existing account. A separate me check determines whether its session ended. Successful reset revokes previous authority on the backend. No automatic login. |

Proofs are pasted into transient React state, never URLs, localStorage, analytics or evidence. Passwords and CSRF tokens are memory-only. Reset/login controls disable during submission; synchronous store/API admission also rejects overlapping operations. Strict shared response schemas reject malformed or extra identity/authority fields. Controlled messages cover 400, 401, 403, 429, 503 and network/unknown outcomes without exposing backend diagnostics. Retry-After is parsed, and 429 asks the user to wait; there is no automatic retry or retry countdown claim.

## Session and transport boundaries

`AuthApi` sends `credentials: include`, `cache: no-store`, forbids redirects, bounds acknowledgements at 10 seconds, and sends JSON plus X-CSRF-Token for mutations. First explicit mutation obtains CSRF from the existing bootstrap. The in-memory token is reused to respect the bootstrap budget, replaced after login rotation, and discarded on current-generation 401/403 or local session clearing. A subsequent user submission may bootstrap again; rejected or timed-out POSTs are never automatically replayed. Timeout is an unknown outcome, not cancellation of backend work.

`SessionStore` restores only from `/me`, drops identity on 401, and hides protected content on restoration outages. Generation checks prevent an older restoration response or 401 from overwriting a later login. Route guards distinguish loading, unavailable, anonymous and server-authenticated states. A stored UI profile is not business authority: every future backend action must enforce current session and PostgreSQL fences. Visible client state can lag revocation until a server request/focus/check; hidden pages do not poll. Cross-tab cookie changes can produce a rejected token and require an explicit resubmission. Existing idle/absolute expiry and backend renewal policies are unchanged.

No client role, user ID, family ID, verification timestamp or membership is submitted as authority. Backend API/worker production code, schema and all eight reviewed migrations are unchanged. The only dependency change is the web-to-existing-contracts workspace edge; lockfile external resolutions are unchanged and frozen install passes.

## Origins, themes and accessibility

Default API URLs are same-origin. Vite's existing port 3000 is strict and `/api` proxies to loopback API 4000 with `changeOrigin: false`, retaining browser Host/Origin. This matches the reviewed local allowed origins without changing backend cookies, CORS, TLS or proxy trust. Header-level local smoke: legitimate same-origin Fetch Metadata bootstrap 200/no-store/43-character CSRF; cross-site navigation rejected 401; frontend login HTML 200. Those are HTTP observations, not browser attestation.

An optional `VITE_AUTH_API_ORIGIN` must be an exact origin; production accepts HTTPS only, development HTTP only localhost/127.0.0.1. Production must use an operator-reviewed same-origin HTTPS reverse proxy or explicitly allowed cross-origin deployment with the existing backend credentialed CORS switch. SameSite=Lax may not support a genuinely cross-site deployment; topology must be reviewed rather than weakening cookies. No wildcard CORS, proxy trust relaxation or insecure production fallback is added.

Live cards use opt-in application appearance and scoped aliases to existing semantic tokens. Public/demo defaults retain their styling. Light/dark follows system preference initially and has an explicit toggle. Forms have associated labels, autocomplete, error descriptions, busy/disabled states, first-invalid-field focus and existing password visibility controls. Desktop/mobile layout and light/dark rendering are implemented but **not visually verified** here.

## Original implementation verification (historical)

| Gate | Final observation |
| --- | --- |
| Focused frontend API/session/SSR guard/surface/ownership tests | 31 passed, 0 failed across 4 files |
| Full frontend tests | 764 passed, 3 failed across 54 files; the same documented NEXUS fixture failures |
| Real shipped-client HTTP/PostgreSQL/Valkey/Mailpit flow | 1 passed, 125 assertions; signup, login, profile restoration, verification mail/redemption, logout-all, recovery mail/reset, stale-session denial, old-password denial, new-password login and logout |
| Frontend typecheck/lint and production build | Passed; lint is the repository's tsc check, not a separate ESLint frontend gate |
| Repository architecture / backend typecheck/lint/build | Passed; architecture includes frontend dependency boundaries; final 365 source files, 1006 resolved edges, zero violations |
| Backend architecture tests / regression | 51/59 and 99/260 passed (tests/assertions) |
| Authentication / sessions / auth fences | 26/812, 25/254, 24/134 passed |
| Tenancy / email / recovery / database integration | 34/132, 16/468, 18/421, 2/5 passed |
| Frozen installation / diff checks | Passed; no external version changes |
| Infrastructure | 4 passed, 1 failed, 1 between-test error, 14 assertions: unsupported-job 5-second finish notification timeout |
| Lifecycle | 1 passed, 2 failed, 7 assertions: API and worker SIGTERM exit 143 rather than 0 |
| Dependency audit | Exit 1: existing high deepmerge-ts advisory through Prisma; unchanged dependency |
| Browser signup/login/logout/verification/recovery and responsive light/dark visual checks | Unavailable: browser tool failed twice during initialization, “failed to write kernel assets … path … not found.” No screenshots or browser pass claimed. |

The HTTP client integration uses an explicit test cookie jar and Origin headers against real controllers; it does not prove actual browser cookies, CORS, Fetch Metadata or TLS. The existing session suite retains its loopback TLS/proxy rejection evidence, with the same deployment limitations as report 20.

The three frontend failures are missing resolved blocker, empty milestone graph and dependency fan-out 3 rather than maximum 2. Their fixture/data/test files are unchanged and the base tracker already documents them. No exact-base suite rerun is claimed. Initial tenancy and recovery replay checks hit their existing 5-second test deadlines (33/1 with one between-test error and 17/1 with one error); unchanged reruns passed. Timing root cause is unresolved; no timeout or assertion was changed.

Development observations are preserved: initial root reflect-metadata test import failed resolution and was removed; the first new integration migration hit its existing 6-second child deadline; failed setup initially attempted cache cleanup before connection and leaked one owned database. Cleanup now handles unconnected cache and the one database was removed with a validated suite-only name. A test jar retaining expired cookies caused a later login 401; corrected cookie expiration handling passed. Four initial SSR checks expected lowercase `autocomplete`; React SSR emitted `autoComplete`, and the assertions were corrected. No production security setting was relaxed to resolve these fixture issues.

## Pending human and deployment review

Actual browser flows and keyboard interaction; 320/390/768/1024/1440 layouts in both themes; HTTPS ingress, Host allowlists and forwarded-header enforcement; SameSite/cross-origin cookie and CORS topology; XSS/CSP and browser storage inspection; mail relay/provider and delivery operations; accessibility/contrast review; rate-limit UX under load; known queue/lifecycle/audit reliability; key/backup restoration and runtime grants remain unresolved. Build retains the existing Vite native-config and large-chunk warnings. No production readiness or launch certification is claimed. Stop at review; no merge or business/frontend data integration follows this change.

## PR #33 F1–F3 corrections — historical verification

Reviewed head `f573a985ea591165a031db83de544217588837b6`; one correction commit on the existing branch. Backend production, existing migrations, fixtures, dependency versions, CSS and approved design remain unchanged.

**F1:** Restoration promises belong to their current generation. Every submission/clear advances the generation, detaches previous deduplication and invalidates old API unauthorized callbacks while retaining a usable CSRF token where appropriate. Completion of an old promise cannot erase a newer in-flight promise. Same-generation focus/visibility refresh calls coalesce; polling skips active mutations. Controlled deferred tests cover restoration during login/logout, immediate fresh checks after login, late401, old-finally/new-promise ordering and coalesced focus/visibility calls.

**F2:** Generic reset acceptance never establishes proof redemption. The store performs a separate authenticated-session check:200 preserves identity;401 clears it; unavailable checking blocks protected rendering but retains identity for subsequent verification. Unknown mutation outcomes do not infer revocation. Both valid and invalid accepted confirmations show the same conditional message: try the new password, request another email if needed, and sign out first if still authenticated. No proof validity is disclosed through the public response. Unit and real HTTP tests cover invalid proof with a live account, valid reset, anonymous recovery and unknown outcomes.

**F3:** The computer-use kernel still fails initialization with path-not-found while writing assets. The supported bundled Playwright alternative launches actual Chromium; no repository package/version was installed or changed. Browser execution exposed native Window.fetch's illegal receiver when called as an AuthApi method. The default transport now invokes fetch through a wrapper; a focused receiver regression and real browser flow verify the correction. Initial password locator and filtered-header assertions were runner errors, corrected using associated input names and Playwright allHeaders; no production security rule changed.

Actual browser passes: anonymous protected-route redirect; keyboard focus and invalid form feedback; signup; login; native HttpOnly/Lax/Path cookie and absent document.cookie visibility; actual POST Origin and CSRF headers; refresh restoration; verification via real worker/Mailpit; logout-all revoking a second browser context; forgot-password; invalid proof preserving authenticated account; valid reset causing me401; replacement-password login in a fresh context; ordinary logout; labelled NEXUS separation. Screenshots cover login at320/390/768/1024/1440,900-height,DPR1 in explicitly emulated light/dark before initialization. Additional320 light/dark signup/forgot/reset captures check all input bounds and horizontal overflow. [Browser observations](evidence/browser-correction/results.json) and [mobile form observations](evidence/browser-correction/form-visuals.json) are reproducible using `scripts/frontend/auth-browser.cjs` and `auth-visuals.cjs`, with `PLAYWRIGHT_MODULE` pointing at the already-installed module and local API/worker/web/infrastructure running. No proof/password/cookie values are stored in evidence. Only owned Mailpit messages are deleted; disposable registered accounts remain in the local development database without memberships.

**Browser gate remains unresolved, with a demonstrated backend limitation:** after an authenticated valid reset, PostgreSQL revokes authority but the browser retains the well-formed HttpOnly SID cookie. `/me` returns401; the following `/csrf` also returns401 without clearing the cookie. Ordinary same-context re-login therefore fails before credentials can be submitted. Source inspection confirms `Sessions.bootstrap()` revalidates the authenticated family and AuthController maps denial to401 without terminal cookie cleanup. The browser cannot remove an HttpOnly cookie; bypassing CSRF, changing backend semantics or installing a cookie workaround is outside this correction. The runner returns exit1 and records this failure even though a fresh isolated context can authenticate with the replacement password. That fresh context is test evidence, not an application workaround or a full browser pass. Human review must resolve the backend cleanup boundary separately before accepting this end-to-end flow.

| Correction gate | Result |
| --- | --- |
| Focused frontend tests |38 passed /0 failed|
| Full frontend |771 passed /3 unchanged NEXUS failures|
| Real frontend HTTP integration |1 passed /135 assertions, including invalid-proof session preservation|
| Frontend/backend typecheck, lint, architecture and builds |Passed; no external package/lock changes|
| Backend architecture/regression |51/59 and99/260 passed (tests/assertions)|
| Authentication/sessions/fences/tenancy |26/812,25/254,24/134,34/132 passed|
| Email/recovery/database integration |16/468,18/421,2/5 passed; initial email migration replay5-second timeout retained, unchanged rerun passed|
| Browser |Partial, exit1 for retained revoked-cookie same-context reset/login failure; no production certification|

An intermediate backend typecheck detected Bun's fetch.preconnect augmentation on the wrapper type; the transport now specifies only the callable signature and recheck passes. Vite also logged a SessionGuard error during source-edit hot refresh; final navigation/guard checks and captured forms passed, but no general HMR reliability claim is made. Historical three NEXUS failures, queue notification timeout/between-test error, SIGTERM143 and deepmerge-ts advisory remain unresolved; their earlier executions above remain evidence and are not relabelled as passing. HTTPS ingress/proxy, production CORS/SameSite topology, CSP/XSS, browser coverage beyond Chromium, comprehensive accessibility/contrast, operational mail/key/grants/restore and load review remain pending. Local same-origin HTTP evidence is not production TLS certification. Stop at human review; do not merge or start BE-API-00.


## PR #33 F4 — revoked-cookie recovery (current)

Reviewed HEAD `cab718ea77ab2ddf943f959feb483e307cd25f87`; final SHA is in PR metadata. Four production files change: API composition, Sessions, bounded Store, and database AuthFences. Frontend production, NEXUS, Workspace APIs, contracts, dependencies, schema and all migrations remain unchanged.

Only the reviewed GET CSRF bootstrap can recover definitively denied authenticated state, after existing Origin/Fetch Metadata checks and endpoint rate admission. It retires the server-verified presented SID digest in PostgreSQL, regenerates, then explicitly saves fresh anonymous state. It never returns the predecessor CSRF token or rewrites the old SID as anonymous. Missing/recognizably expired signed cookies reach only this bootstrap: signature validation is required, express-session generates a distinct SID, and durable retirement precedes its save. `/me` still denies revoked authority. Malformed/extended/future-issued/extra-field state is explicit rejection, distinct from recognizable expiration. Cache/PG outages never become authentication success. All bootstrap responses, including middleware rejection, are no-store/no-cache.

Cache deletion alone is insufficient because PostgreSQL may still authorize a restored cache snapshot. Server-private `retireSid()` closes that gap using bounded SERIALIZABLE transactions, existing user-before-family locks, and durable family revocation. Rotation either changes the old digest first or encounters revocation. Already-admitted protected writes may commit before retirement, which waits on their fence; later authority fails. No immediate cancellation of prior work is claimed.

Regeneration/save failure uses existing terminal response/header hooks: clear the cookie and suppress late callback finalization/cookie delivery. Timeout is not cancellation: late anonymous SET can leave an undelivered orphan that has no authenticated authority. Successful replacement uses the same host-only cookie name/Path with a different SID. Deletion matches configured name, Path=/, HttpOnly, SameSite=Lax, Secure where required, no Domain; real HTTPS proxy tests check __Host deletion attributes.

Real PostgreSQL/Valkey/HTTP regressions cover logout-all from another session, epoch changes, family revocation, deletion, expiry, repeated old snapshot restoration, concurrent bootstrap/stale SET, forbidden origins/navigation, malformed cookies/state, late regeneration/save completion, real cache/PG outages, and protected-write/retirement ordering. Existing ownership/restoration tests now require fresh anonymous token/SID, continued `/me` denial, and non-disclosure of predecessor tokens. The shipped frontend HTTP client logs back in after reset in the same retained-cookie jar.

Actual Chromium passes signup/login → verification through worker/Mailpit → authenticated password reset → retained-cookie `/me`401 → CSRF200/no-store with a different anonymous SID → new-password login200 in the original context. No cookie deletion, context replacement, CSRF disablement or fallback is used for recovery. Another context tests logout-all only. Two 390×900,DPR1 light/dark login captures supplement the earlier retained 16 captures. All 11 main-context mutations carry CSRF and correct Origin. [Browser evidence](evidence/browser-f4/results.json) stores statuses/shape assertions without passwords, proofs or cookie values. Reproduce with the existing runner, installed PLAYWRIGHT_MODULE and local API/worker/web/infra; no install is required.

| F4 gate | Final result (tests/assertions unless stated) |
| --- | --- |
| Session security |31/473 passed|
| Authentication / fences / tenancy |26/827,24/134,34/132 passed|
| Email / recovery / database integration |16/468,18/421,2/5 passed; migration/schema replay included|
| Shipped frontend HTTP |1/149 passed|
| Backend architecture / regression |51/59,99/263 passed|
| Architecture, typecheck/lint/build, frontend lint/build, diff |Passed;365 sources,1006 edges,zero violations; web lint remains tsc|
| Full frontend |771 pass,3 existing NEXUS failures|
| Chromium |Passed local same-context flow; no production certification|
| Infra / lifecycle / audit |4 pass,1 fail,1 between-test error,14 assertions /1 pass,2 fail,7 assertions /exit1 high deepmerge-ts|

Failed observations remain explicit. Initial auth24/2 and regression98/1 expected the old denied-bootstrap/null-malformed contract; tests now enforce fresh SID/non-disclosure/explicit malformed denial. Initial concurrency assumed two successes; one503 occurred. The test now enforces no successor cookie on503, old SID denial, and a controlled later bootstrap success; no implicit mutation retry or timeout change. Recovery replay initially17/1 with one error at unchanged5000ms; unchanged rerun18/0. A focused cookie run and later full session/HTTP runs hit unchanged6000ms migration child limits; session cleanup also errored on unconnected cache. Serial unchanged rechecks passed31/453 and1/149; final checks are in [F4 JSON](evidence/FE-AUTH-01-F4.json). Sanitized migration status diagnostic: up-to-date,exit0,4095ms; setup timing root cause remains unresolved. Historical queue notification5000ms/error, API/worker SIGTERM143, Prisma advisory, three NEXUS failures and earlier browser/tool failures remain evidence.

Remaining review: SERIALIZABLE contention fails closed and may require a deliberate new bootstrap attempt. Late cache operations are not canceled. The unchanged schema has no SID-digest index: bounded lookup/lock performance at production volume and any indexing change need independent review. Production HTTPS/Host/proxy, cross-origin CORS/SameSite, other browsers, CSP/XSS, comprehensive accessibility, mail/key/restore/runtime grants and abuse/load operations remain unverified. The local blocker is resolved; this is not production certification. Stop at human review; no merge or next phase.
