# FE-AUTH-01 — Real frontend authentication

Implemented for human review on `feat/fe-auth-01-integration`; not merged, deployed or browser-certified. Exact clean fetched base: `1b619b189f0e7d89fc16f70ba766306354259eb6`, including PR #32 and the roadmap handoff. Final head is recorded in PR metadata. Reviewed backend reports 20–23 and the actual shared Zod/controller/session contracts. Evidence: [verification JSON](evidence/FE-AUTH-01-verification.json).

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
| `/reset-password` | Email, manual code and new password/confirmation. Generic accepted response leads to fresh login, without asserting that proof redemption succeeded. Successful reset revokes previous authority on the backend. No automatic login. |

Proofs are pasted into transient React state, never URLs, localStorage, analytics or evidence. Passwords and CSRF tokens are memory-only. Reset/login controls disable during submission; synchronous store/API admission also rejects overlapping operations. Strict shared response schemas reject malformed or extra identity/authority fields. Controlled messages cover 400, 401, 403, 429, 503 and network/unknown outcomes without exposing backend diagnostics. Retry-After is parsed, and 429 asks the user to wait; there is no automatic retry or retry countdown claim.

## Session and transport boundaries

`AuthApi` sends `credentials: include`, `cache: no-store`, forbids redirects, bounds acknowledgements at 10 seconds, and sends JSON plus X-CSRF-Token for mutations. First explicit mutation obtains CSRF from the existing bootstrap. The in-memory token is reused to respect the bootstrap budget, replaced after login rotation, and discarded on current-generation 401/403 or local session clearing. A subsequent user submission may bootstrap again; rejected or timed-out POSTs are never automatically replayed. Timeout is an unknown outcome, not cancellation of backend work.

`SessionStore` restores only from `/me`, drops identity on 401, and hides protected content on restoration outages. Generation checks prevent an older restoration response or 401 from overwriting a later login. Route guards distinguish loading, unavailable, anonymous and server-authenticated states. A stored UI profile is not business authority: every future backend action must enforce current session and PostgreSQL fences. Visible client state can lag revocation until a server request/focus/check; hidden pages do not poll. Cross-tab cookie changes can produce a rejected token and require an explicit resubmission. Existing idle/absolute expiry and backend renewal policies are unchanged.

No client role, user ID, family ID, verification timestamp or membership is submitted as authority. Backend API/worker production code, schema and all eight reviewed migrations are unchanged. The only dependency change is the web-to-existing-contracts workspace edge; lockfile external resolutions are unchanged and frozen install passes.

## Origins, themes and accessibility

Default API URLs are same-origin. Vite's existing port 3000 is strict and `/api` proxies to loopback API 4000 with `changeOrigin: false`, retaining browser Host/Origin. This matches the reviewed local allowed origins without changing backend cookies, CORS, TLS or proxy trust. Header-level local smoke: legitimate same-origin Fetch Metadata bootstrap 200/no-store/43-character CSRF; cross-site navigation rejected 401; frontend login HTML 200. Those are HTTP observations, not browser attestation.

An optional `VITE_AUTH_API_ORIGIN` must be an exact origin; production accepts HTTPS only, development HTTP only localhost/127.0.0.1. Production must use an operator-reviewed same-origin HTTPS reverse proxy or explicitly allowed cross-origin deployment with the existing backend credentialed CORS switch. SameSite=Lax may not support a genuinely cross-site deployment; topology must be reviewed rather than weakening cookies. No wildcard CORS, proxy trust relaxation or insecure production fallback is added.

Live cards use opt-in application appearance and scoped aliases to existing semantic tokens. Public/demo defaults retain their styling. Light/dark follows system preference initially and has an explicit toggle. Forms have associated labels, autocomplete, error descriptions, busy/disabled states, first-invalid-field focus and existing password visibility controls. Desktop/mobile layout and light/dark rendering are implemented but **not visually verified** here.

## Verification

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
