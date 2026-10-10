# BE-00E — Authentication, sessions and authorization architecture

**Status: planning / human review; not implemented or merged.** Research branch `research/be-00e-auth-session-authorization`, fetched main base `2dbcf2c98118bf718798af24fcd8a38f155ccfc8`. No authentication implementation, packages, schema, migrations, frontend wiring or tests change in this phase.

## 1. Inputs, authority and actual implementation

This plan applies the user's approved stateful-cookie/Valkey direction to tracked guidance [02](02-IMPLEMENTATION-GUIDE.md), [03](03-SYSTEM-ARCHITECTURE.md), [04](04-DATABASE-DESIGN.md), [05](05-SECURITY-AND-AUTHORIZATION.md), [06](06-API-AND-REALTIME-CONTRACTS.md), [08](08-TESTING-AND-QUALITY-GATES.md), [09](09-ROADMAP-AND-MOCK-REMOVAL.md), implemented [BE-00B](13-BE-00B-FOUNDATION.md)/[BE-00C](14-BE-00C-DOMAIN-TENANCY.md), [BE-00D](15-BE-00D-MODULE-ARCHITECTURE.md), and [living status](16-BACKEND-STATUS-AND-ROADMAP.md). Earlier phase labels and pre-monorepo paths in draft guidance are historical. No standalone BE-00E planning brief was found in repository documents or available pasted-text attachments; this request plus the tracked roadmap is the planning scope. The untracked master plan is a proposal, not an overriding source of decisions.

Current API is Nest 11.2.7 using Express, with only health handlers and FoundationAccessGuard denying business handlers. Existing Zod pipes/response schemas, safe ErrorFilter, correlation/security/body limits and Valkey IP throttle are reusable. CORS currently does not enable credentialed requests; proxy trust is false. Worker is diagnostic-only. There are no sessions, real verifier, credentials, reset/invitation token tables, auth epoch, account suspension field, email-verification workflow or business permission matrix.

User/Identity exist; identity is uniquely keyed by opaque provider/subject. User email is nullable and **not an authentication key or uniqueness guarantee**. Membership role/status belongs to workspace, never User. Tenancy authenticates a verified provider/subject, maps it to a user, mints an instance-owned opaque principal, then reloads ACTIVE membership and resource/team scope in bounded SQL transactions. Existing dependency writes remain gated. Planning does not imply these missing auth/account capabilities exist.

## 2. Session library and installed-adapter compatibility decision

| Component | Inspected reality / compatibility finding | Planning decision |
|---|---|---|
| Nest HTTP | `apps/api/src/app.ts` calls `NestFactory.create<NestExpressApplication>`; installed platform-express 11.2.7 | Retain Express; no Fastify migration |
| Express | API direct installed dependency 5.3.0; adapter physical package resolves 5.2.1. `bun.lock` records both. A logical symlink-path resolution can misleadingly report 5.3.0 | Test against the actual Nest adapter, not merely an imported Express version |
| ioredis / server | Installed ioredis 5.11.1; Compose Valkey 8.1.3, digest pinned. Existing non-worker client is bounded/lazy, offline queue disabled | Reuse configuration/lifecycle patterns with a dedicated session connection and reviewed ACL/prefix; do not share a BullMQ blocking connection |
| express-session | Not installed. Candidate 1.19.0 source/package reviewed; Connect-style middleware, store callbacks, regeneration/save/destroy, no Express-major peer constraint | Preferred middleware candidate, **not a runtime-certified package selection**; no MemoryStore fallback |
| connect-redis 8.0.3 | Not installed. Source includes ioredis normalization and TTL/touch callbacks; peer express-session >=1; development matrix includes ioredis 5 | Candidate retaining current client, subject to support/security review and actual compatibility tests |
| connect-redis 9.0.0 | Source/release explicitly removes ioredis support; requires node-redis >=5 | Incompatible with passing the current ioredis client directly. Reject an unqualified latest-version recommendation or a cast pretending compatibility |

[Nest's session guidance](https://docs.nestjs.com/http/session) supports the Express middleware approach. [express-session 1.19.0 metadata](https://raw.githubusercontent.com/expressjs/session/v1.19.0/package.json) and [middleware documentation](https://expressjs.com/en/resources/middleware/session/) establish API compatibility, not certification of this Bun runtime. [connect-redis 8.0.3 manifest](https://raw.githubusercontent.com/tj/connect-redis/v8.0.3/package.json) and [source](https://raw.githubusercontent.com/tj/connect-redis/v8.0.3/index.ts) establish its ioredis shim; [9.0.0 release](https://github.com/tj/connect-redis/releases/tag/v9.0.0) documents its incompatible client change. Research accessed 2026-10-10; upstream current Nest documentation may describe newer features than installed 11.2.7.

**Final store implementation remains a review gate.** Evaluate maintained connect-redis + separately approved node-redis, supported/pinned 8.x + existing ioredis, or a narrowly audited express-session Store adapter on existing ioredis. Avoid a new general cache framework. A custom adapter has security/maintenance costs, not automatic preference. Do not choose/install an implementation until isolated tests prove Nest/Bun middleware, authenticated Valkey commands, error propagation, cookie TLS/proxy behavior, bounded touch/TTL, regeneration and concurrent revocation. This planning phase confirms the direct v9/ioredis incompatibility and source-level v8 suitability; it does **not** execute absent packages or claim operational compatibility. No packages installed and no auth smoke implementation created.

Stock store get/set/touch is insufficient proof of atomic revocation, absolute expiry or logout-all. Whichever adapter is approved must satisfy §4, including generation/tombstone checks that prevent a stale concurrent request saving a revoked session back into existence. Reviewed session-specific Valkey atomic operations are infrastructure; PostgreSQL business/identity writes stay exclusively in the database package.

## 3. Cookie, expiry and middleware profile

These numeric defaults are **concrete proposals for approval**, not deployed configuration. Stateful browser authentication is approved; browser bearer JWTs and MemoryStore are excluded.

| Setting | Proposed profile |
|---|---|
| Production name | `__Host-unblok.sid`; opaque random signed SID, at least 256 bits entropy; no identity/role claims in cookie |
| Cookie flags | `httpOnly:true`, `secure:true` under production HTTPS, `sameSite:'lax'`, `path:'/'`, **Domain omitted** (host-only) |
| Browser maxAge | 1,800,000ms (30 minutes), clamped on every renewal to remaining absolute lifetime; no remember-me in first slice |
| Server idle expiry | 1,800 seconds since qualifying user activity, checked server-side even if cookie still exists |
| Absolute lifetime | 43,200 seconds (12 hours) from authenticated login; ordinary SID rotation/privilege step-up never resets this deadline |
| Store TTL | `ceil(min(idleDeadline,absoluteDeadline)-now)` seconds; expired state denied/deleted, no zero/negative TTL converted into persistence |
| Anonymous CSRF session | Separate anonymous state, 10-minute maximum; bounded creation rate and size; no DB authority |
| Middleware options | Explicit store, `saveUninitialized:false`, `resave:false`; reviewed rolling-cookie renewal consistent with TTL profile; await explicit save before login success |
| Signing secrets | Secret manager, high-entropy current key plus bounded previous-key verification; rotate/revoke with operator process; never environment values in diagnostics |
| Proxy trust | Preserve false for direct local access. Production only trusted ingress addresses/CIDRs with direct API access blocked and forwarded headers overwritten; never blanket `true` or unsafe hop assumptions |
| Development | Explicit separate `unblok.sid.dev`, host-only/HttpOnly/Lax/Path `/`; secure false only for reviewed loopback HTTP. Test real HTTPS and production `__Host-` behavior separately |

Prefer same-origin frontend/API behind HTTPS routing. Different origins on the same site can use Lax with explicit credentialed CORS, subject to browser testing. Truly cross-site cookies generally need SameSite=None+Secure and can be blocked by browser policy: require a deployment/threat-model decision, never silently downgrade. Host-only cookies do not need a shared parent Domain to be sent to the API. No `.example.com` broad cookie or credential in localStorage. Path `/` allows a future same-host WebSocket endpoint; path is not an authorization boundary.

Middleware order proposal: correlation/headers → strict origin/preflight/body boundaries and coarse IP protection → bounded parsing → session lookup → CSRF checks for unsafe actions → authentication guard → application action/resource authorization → scoped persistence → explicit DTO mapping/error filter. Health remains independently defined; session-store outage must not make liveness depend on Valkey. Reviewed public-auth route metadata must be distinct from PublicHealth: do not weaken/reuse that marker or disable the global guard for a whole module.

## 4. State, lifecycle, rotation and consistency

Session state holds only version, opaque identity reference (provider/subject or DB identity ID), issued/last-activity/absolute-expiry timestamps, generation/authentication-strength metadata and CSRF secret. Cookie metadata is library bookkeeping. No password, provider token, email profile, workspace role, team IDs, grants or resource permissions. An optional workspace preference belongs to a separately validated preference, not session authority.

| Event | Required server behavior |
|---|---|
| Login | Validate Zod input and limits; verify credentials/provider through reviewed identity boundary; regenerate SID after success, remove anonymous/old SID, mint new CSRF secret, atomically save authenticated state and index before returning success. Failed store save never yields an authenticated response |
| Privilege elevation / sensitive reauthentication | Verify fresh credentials (proposed freshness 5 minutes); regenerate SID and CSRF, invalidate predecessor. Reload grants independently; step-up is not an ADMIN-role claim. If role elevation occurs administratively elsewhere, invalidate affected sessions or require step-up before exercising new sensitive privileges |
| Ordinary renewal | Update last-activity and TTL only for explicit interactive activity; polling, background refresh, WebSocket heartbeat must not keep a session alive indefinitely. Proposed periodic SID rotation: every 30 minutes of interactive activity, without extending absolute lifetime |
| Parallel requests / tabs | Atomic generation checks/CAS; old SID denied immediately with no authorization overlap. Stale requests cannot overwrite newly rotated/revoked state or emit a winning stale Set-Cookie. Client retries a safe read once after re-bootstrap; writes need reviewed idempotency, never blind replay |
| Logout | CSRF-protected POST; atomically invalidate SID and its user index, retain anti-resurrection tombstone until its former absolute deadline, clear cookie with identical name/Path/Domain settings. Repeated logout idempotent |
| Logout-all / reset / compromise | Increment durable user auth epoch via reviewed DB boundary, reject all sessions with older epoch on next request, invalidate indexed SIDs and WebSockets. An epoch/reference in session is compared with current DB state; it grants no role |
| Membership revocation | Existing fresh scoped DB membership checks immediately deny affected tenant requests; do not depend on cookie deletion or stale session roles. Close affected subscriptions; membership mutation follows existing lock/integrity discipline |
| Expiry | Check idle and absolute deadline before creating principal; deny 401, clear cookie where possible, remove expired record. Expired SID cannot be revived by touch. Reauthentication starts a new lifetime |
| Store/network outage | Bounded operation deadline; auth requests fail closed with generic 503, no cached authority or MemoryStore. Do not report outage as bad password/401. Login/rotation/logout revocation failure is not success; clear local UI/cookie for logout but expose unconfirmed server revocation and retry path |
| Restart/failover / lost or replayed Valkey data | Missing session → re-login. Restored stale records must fail epoch/generation/absolute-expiry checks. Require recovery tests and durable auth-epoch/tombstone design; namespace/version change may invalidate every session safely |

Durable auth epoch and account state **do not exist today**. Their additive schema/identity query design needs separate approval before logout-all/reset/revocation can be certified. Single-SID tombstones and per-user index use bounded TTLs; no global SCAN/KEYS for routine logout-all. Do not acknowledge revocation until its chosen durable barrier succeeds. Concurrent authenticated writes must revalidate epoch/account state at a reviewed transaction boundary for critical actions; an already-running operation's commit ordering relative to revocation must be specified and tested, not called “immediate” without evidence.

For express-session adapters, automatic `touch`, cookie renewal and unconditional `set` must not bypass the lifecycle policy. Plain connect-redis touch only updates expiry; application deadlines and an atomic store wrapper are required. Test every session-save path, including response finalization. A dedicated session ACL/prefix and no-eviction capacity plan are future deployment requirements; existing development Valkey/queue sharing is not a production availability claim.

## 5. CSRF, CORS and WebSocket authentication

Use a synchronizer-token design: an opaque random secret bound to anonymous/authenticated session, returned by a no-store same-origin bootstrap endpoint; send it as `X-CSRF-Token` on unsafe methods, compare in constant time. Renew after login/rotation; never put it in URLs, logs or a browser-persisted auth credential. Bootstrap anonymous sessions intentionally despite saveUninitialized=false, under rate limits. Protect login (login CSRF), registration, reset, invite redemption, logout and all cookie-authenticated mutations. GET/HEAD never mutate product state; OPTIONS never grants authorization. Reject simple form/text content types for JSON mutations unless an explicitly protected form contract is reviewed. SameSite and CORS are defense in depth, not the token check. [OWASP CSRF guidance](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).

Unsafe browser requests require an exact configured Origin (scheme/host/port), rejecting null, suffix matching and unapproved/missing origins by default. A reviewed same-origin Referer-origin fallback may be needed for a specific browser flow; do not trust forwarded headers to define allowed origins. Sec-Fetch-Site checks supplement, not replace, token/origin verification. OAuth callback exceptions require independently validated state, nonce and PKCE with one-time login intent; they are not generic CSRF exemptions. Non-browser clients require a separately reviewed identity flow, not a bypass of browser cookie checks.

CORS retains an exact allowlist. Only a reviewed cross-origin frontend profile enables credentials:true and client `credentials:'include'`; then return one matched origin and Vary:Origin, never wildcard or arbitrary reflection. Explicit methods/headers include the CSRF header; preflight does not access a user session. Same-origin deployment does not need credentialed CORS. Deployment-approved domains are unresolved, not example origins authorized to receive cookies.

Future WebSockets require same-origin/allowlisted Origin and current cookie-session authentication before upgrade, plus a short-lived, single-use session-bound upgrade ticket obtained by CSRF-protected POST. Proposed ticket lifetime 60 seconds. Never place SID or provider tokens in URL; ticket transport must avoid logging. Check current principal/workspace/team/resource on subscription and **every action**, bound message size/rate and re-check expiry/revocation. Heartbeats do not touch idle expiry. Reconnect reauthenticates and resynchronizes only authorized events; logout/session or membership revocation closes affected sockets. Fail closed during store outages. No gateway or ticket endpoint is implemented here.

## 6. Identity and trusted-principal integration

Credential ownership remains an approval question. Proposed email/password slice requires additive credentials with Argon2id, unique normalized verified login identifiers, generic responses/dummy hash for unknown account, recovery and verification records hashed at rest and single-use. Current nonunique User.email cannot serve as credential lookup. Existing UI minimum eight-character/composition feedback is not a reviewed server password policy; proposed server minimum 12, maximum 128 characters and bounded UTF-8 bytes with breach screening needs explicit UX/security approval. Argon2 parameters require measured Bun runtime/resource tests. No local credential schema/hash library chosen/installed. Alternatively review a provider flow preserving the same cookie/session and principal contracts; never auto-link accounts solely by matching email.

Request flow: signed random SID → validated live Valkey state + current account/epoch → trusted server-only assertion → real IdentityVerifier → **the same Tenancy instance** `authenticate(assertion)` → opaque VerifiedPrincipal → `read/write(principal,validatedWorkspaceId,...)` → fresh ACTIVE membership, lock, team/resource checks and exact pure policy grant → explicit public DTO.

The BE-00C IdentityVerifier comment requires cryptographic verification: proposed verifier input is a signed short-lived server-internal assertion minted only after verified store/credential state, with a separate signing key, audience, expiry and one-use nonce. The verifier itself verifies that proof and returns the trusted provider/subject. It is never exposed as a browser bearer credential or accepted from request JSON. Review the exact assertion format before implementation; never accept `body.userId`, a client provider/subject pair, or an unchecked object. A private resolver must also check current account/identity lifecycle through approved named database queries; existing `Tenancy.authenticate` only maps identity and does not yet check a global account status/epoch. Do not distribute raw Database to auth controllers or general services to fill this gap.

Identity/credential reads and writes need new, narrowly approved database-package interfaces because current TenantQueries intentionally only covers Issue/sequence primitives. Session Valkey access belongs to the concrete auth infrastructure adapter, not contracts/domain. Auth module transport stays thin; application orchestrates ports, pure domain rules have no Nest/Prisma/I/O. Existing SQL/transactions remain legitimate database-owned integrity mechanisms. No competing ORM, class-validator, broad raw-client facade or permissive verifier.

## 7. Authorization matrix: invariant versus proposed grant

Authentication guard runs before action/resource checks; authentication alone grants no workspace authority. Workspace selector is explicit per request, preventing multi-tab active-workspace changes from redirecting another tab's writes. Roles below are **proposed policy grants for review**; until approved, denyAll remains. A generic @Roles check can aid route metadata but cannot authorize a resource.

| Action / scope | ADMIN | MEMBER | OBSERVER | Required invariant / pending detail |
|---|---|---|---|---|
| Own session/profile bootstrap | Own account | Own account | Own account | No global workspace role; profile projection only |
| Select/list accessible workspace | Own ACTIVE membership | Same | Same | Server-derived membership; archived workspace eligible only for approved read views |
| Issue read/list (`issue:read`) | Candidate allow | Candidate allow | Candidate allow | ACTIVE resource/parents, explicit team relationship and per-resource exact grant; ADMIN has no universal bypass |
| Issue rename (`issue:update`) | Candidate allow | Candidate allow | Deny | Active workspace/team/project, reviewed issue action grants, expected version; ownership/project policy unresolved |
| Sequence allocation (`project:sequence`) | Candidate allow | Candidate allow | Deny | Scoped write for approved create workflow only; allocator is not an endpoint |
| Workspace membership/invite/admin changes | Candidate allow in own workspace | Deny by default | Deny | Dedicated workspace-management action needed; last ADMIN, lifecycle and cross-tenant constraints preserved |
| Team/project manage | Explicit reviewed grant | Explicit reviewed grant | Deny | No role-only assumption; team administration/ownership matrix unresolved |
| Dependency writes | Deny | Deny | Deny | SQL gate remains until dedicated DAG-service review |
| Suspended/invited/missing/foreign membership | Deny | Deny | Deny | No action/resource existence leak |
| Archived workspace writes | Deny | Deny | Deny | SQL/scoped boundary invariant; restoration requires separate approved action |

Future action vocabulary must distinguish membership management, team/project writes, issue actions, invitations and personal account operations. Do not widen current three-action TenantAction union or set `allows:()=>true` in this phase. Workspace management may legitimately use an approved workspace-level scope rather than an arbitrary team lookup; design its named persistence methods separately. Policies are synchronous/pure over server-fetched facts, deny unknown actions and absent facts. Lists check every returned resource; counts/search/errors cannot leak inaccessible data. Worker authority is a separate service identity and execution-time scope, not browser session replay.

## 8. Proposed API/Zod contracts, not registered routes

All routes below are candidate `/api/v1` contracts, subject to identity/deployment/grant decisions. Strict request/response Zod schemas live in contracts, separate from ORM/private session state; no session IDs, internal assertions, epochs, credential hashes or secrets in DTOs. Preserve existing generic error envelope/correlation ID. Unknown fields fail validation. Auth responses/token/bootstrap use Cache-Control:no-store; no credentials in access logs.

| Method/path | Request → response | Controls / UX mapping |
|---|---|---|
| GET `/auth/bootstrap` | No body → `{status,user:null|{id,name,email,avatar?},memberships:[],csrfToken,sessionExpiresAt?}` | Intentional anonymous CSRF session; no-store, throttle; current server membership projection, no grant-bearing client roles |
| POST `/auth/login` | `{email,password}` → current-user/bootstrap projection | CSRF/origin, generic 401, rotate/save before 200; safe returnTo stays frontend-owned |
| POST `/auth/signup` | `{name,email,password}` → created identity/auth result or verification-pending state | No automatic workspace; exact 201/202 and whether authenticated immediately depend on email-verification approval |
| POST `/auth/logout` | `{}` → 204 | CSRF; idempotent revoke + cookie clearing; 503 means server revocation unconfirmed |
| POST `/auth/logout-all` | `{}` → 204 | Auth+fresh reauthentication, CSRF, durable epoch barrier and socket revocation |
| POST `/auth/password-recovery` | `{email}` → generic 202 acknowledgement | Same body/status for account present/absent; no account enumeration |
| POST `/auth/password-reset` | `{token,newPassword}` → 204 | CSRF/origin, hashed single-use expiring token, revoke all sessions; no automatic login, then explicit login |
| POST `/invitations/preview` | `{token}` → bounded invitation state/projection | No token in API URL; rate limit; expired/revoked/invalid/accepted states subject to disclosure review |
| POST `/invitations/accept` | `{token}` → workspace selection projection | Auth+CSRF, derive user from principal, never accept client userId/role; transactional recipient/expiry/replay/membership checks |
| GET `/workspaces` | Bounded cursor → accessible workspace/membership projections | Named approved DB boundary needed, no frontend seed/fallback |

Workspace switching is initially a client selector over server-derived memberships, with every following request explicitly scoped; a future server preference endpoint is optional and still not authority. Suggested errors: strict input 400; unauthenticated 401; CSRF/origin 403; hidden tenant resource 404; conflict 409; abuse 429 with Retry-After; dependencies unavailable 503. Map normalized errors into existing adapter results/accessibility UI without silently restoring a mock account. Retry semantics for signup/redeem/create need operation-bound idempotency; a Valkey save failure after durable account creation must be recoverable without duplicate identity/membership rows.

## 9. Abuse protection and threat register

Proposed starting limits need measured load/false-positive review: login 5 attempts/15min per normalized-account HMAC and 30/15min per trusted IP; registration 5/hour/IP plus global/provider budgets; recovery 3/hour/account and 10/hour/IP; reset 5/15min/token fingerprint and 20/15min/IP; invitation preview/redemption 10/15min/token or account and 30/15min/IP; CSRF bootstrap 60/min/IP with global outstanding-anonymous-session budget. Combine distributed atomic counters, bounded progressive backoff, IPv6/NAT normalization, and service-wide hash/email concurrency controls. Never permanent account lockout based solely on attacker-controlled attempts. Retention and HMAC-key rotation must be bounded; raw email/token/IP need not be metric labels. Health throttle bypass does not authorize auth endpoints. Rate-store outage returns 503 for sensitive actions; no process-local bypass. Existing socket-IP limiter is useful infrastructure, insufficient alone for credential abuse.

| Threat | Required mitigation / proof |
|---|---|
| Fixation, stolen/replayed SID, concurrent save resurrection | Regenerate, sign opaque SID, atomic generation/tombstone/epoch, expiry and race tests |
| CSRF/login CSRF, sibling-site attacker, socket hijack | Independent synchronizer token, exact Origin, host-only secure cookies, upgrade ticket/event authorization |
| Credential stuffing/enumeration/recovery abuse | Account+IP+global budgets, generic outcomes and measured timing bounds, bounded hash work, no denial-of-service lockouts |
| Cross-tenant IDOR/stale grants | Fresh DB scope/team/policy per operation; colliding-ID, revocation and archive tests |
| XSS/session exfiltration | HttpOnly limits SID access, CSP/output handling and no client token persistence; XSS can still issue authorized requests, CSRF is not an XSS cure |
| Provider/email linking takeover | Verified opaque provider subjects, explicit account-link proof; no automatic email merge |
| Cache eviction/failover or stale restored state | Fail closed, re-login on missing state, durable revocation barrier, rollback/recovery drills |
| Log/token leak or forged proxy headers | Allowlisted structured events, redact token/cookie/body, exact proxy trust/ingress rules and integration tests |

[OWASP session guidance](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) supports server-side expiry, renewal and fixation protections. Numeric policy and deployment choices above are repository proposals, not OWASP-mandated values or capacity claims.

## 10. Frontend parity audit and migration ledger

| Inspected consumer | Current behavior / issue | Future slice obligation |
|---|---|---|
| `features/auth/types.ts`, `AuthContext.tsx`, `mockAuthAdapter.ts` | Adapter login/signup/recovery/invite; localStorage status/user/membership; seeded test default, mock restore and reviewer account switch; logout currently synchronous/local | Add real bootstrap and explicit pending/outage/expired states; keep existing UI states/focus, remove mock/local auth authority only within reviewed integration slice; no live seed migration |
| `LoginPage.tsx`, `safeReturnTo.ts` | Trim email feedback, generic form error, loading/keyboard focus, sessionExpired banner, allowed internal returnTo and `/my-work` fallback; demo quick fill | Preserve routes/accessibility and safe redirect; no backend trust in returnTo; isolate/remove production demo controls in approved integration change |
| `SignupPage.tsx`, `passwordRules.ts` | Name/email/password; eight-character composition hint; creates identity then onboarding, invitation path accepts and routes `/my-work` | Explicit verification/password-policy UX decision; no auto workspace; invitation acceptance must succeed before navigation. Current code ignores accept result on this path: characterize and correct only in an authorized integration slice |
| `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx` | Generic acknowledgement, reset confirmation/error/success | Preserve accessibility/feedback while preventing enumeration; unknown account/store outage and token replay cases need contract tests |
| `InvitePage.tsx` | VALID/EXPIRED/REVOKED/ACCEPTED/INVALID; existing/new-account routes; `accepted=true` auto-accept; client passes user.id | Retain intended states safely; derive user server-side, validate verified recipient, limit disclosure before login; auto-accept is only a trigger, never authority |
| `WorkspaceContext.tsx`, `WorkspaceSwitcher.tsx` | Switch only to local ACTIVE membership, active or archived workspace, persisted selection; unavailable/empty states | Server membership refresh and explicit per-request tenant scope; handle revocation during switch and multiple tabs without leaking prior tenant cache |
| `OnboardingRootPage.tsx` and workspace/team/project/invite steps | No ACTIVE memberships → workspace creation; otherwise derives progression from workspace/team/project state | Real empty/new-account state, reviewed idempotent creation permissions; invitation join skips inappropriate creation; no mock fallback |
| `AppProviders.tsx` ProjectAuthBridge; logout in AuthContext/dev harness | Bridge sets legacy currentUser on authenticated state, does not explicitly clear it on guest in inspected effect; no production server logout call | Characterize logout/account-switch cleanup across project/settings/collaboration caches, abort requests/sockets, prevent stale-user display; async revocation UX reviewed without redesign |

Future network adapter must map contracts to existing AuthResult/InvitationDetails results without trusting those frontend role/userId fields. Exact removal locations are the mock adapter imports, localStorage authoritative restoration, seed fallback/reviewer controls and legacy bridge. They remain unchanged here. Server email verification, safer password policy and invitation-disclosure tradeoffs may require deliberate UX changes; do not claim parity silently or approve them by this plan alone.

## 11. Implementation slices and acceptance gates

No slice is authorized by this research PR. Suggested review order:

1. Approve deployment topology, identity/verification policy, session duration, store/client version/support choice, revocation schema and initial action grants. Isolated middleware/store compatibility verification is required before library selection.
2. Add reviewed additive identity/credential/verification/recovery/auth-epoch persistence and narrow interfaces; preserve all applied migrations/tenant semantics. Measure hashing and define durable delivery/outbox recovery before promising email.
3. Implement one bounded auth/session/CSRF/bootstrap/login/logout slice with explicit DI and **real** verifier, atomic save/revocation/outage behavior; keep business handlers denied. Replace only its audited frontend adapter/mock restoration after contract/E2E proof.
4. Review registration/verification/recovery/invitation slices, transactional token consumption and recipient linking; integrate their parity ledger individually. Mailpit is test capture, not production delivery approval.
5. Approve action/resource policies and typed scope capabilities, then enable one business vertical slice with positive/negative real PostgreSQL tests; WebSocket/business-worker identity remains separately reviewed.

Tests required before implementation certification: Nest adapter+session store+Bun/Valkey compatibility and pinned dependency/security review; HTTPS cookies/proxy/spoofing/CORS browser matrix; fixation/login/step-up/rotation/logout-all and parallel stale-response/save races; fake/expired/forged principal; fresh membership/team/project policy and colliding tenant IDs; idle versus absolute time with fake clocks and real store expiry; outage/write failure/restart/failover without fallback; independent login/mutation CSRF; token replay and concurrent invitation/reset; account/IP abuse/NAT boundaries; accessible frontend loading/errors/safe returnTo/empty onboarding/switch/logout multi-tab cleanup; WebSocket handshake/event/revocation/reconnect when implemented. Do not substitute mocks for real SQL tenancy or session-store failure tests. No arbitrary timeout increase or relaxed assertions.

## 12. Human decisions, verification and stop boundary

Review questions: (1) same-origin production topology and trusted ingress addresses; any genuinely cross-site cookie requirement? (2) credentials vs identity provider, email verification before login/invite, account linking and password rules? (3) accept proposed 30min idle/12h absolute/30min rotation/5min step-up, and whether remember-me is needed later? (4) approve supported store/client pairing and revocation wrapper maintenance after actual compatibility proof? (5) approve durable auth epoch/account lifecycle/token/outbox schema and session-retention/privacy policy? (6) approve resource-level role grants/team ownership and administrative elevation handling? (7) approve invite-preview disclosures, password UX changes, abuse budgets and production email provider?

These are approval topics in the concrete plan, not requests to begin implementation. The living tracker continues to say authentication/sessions are not implemented; no merged/complete claim is added. Existing BE-00D infrastructure five-second queue timeout/late error and Windows SIGTERM 143 failures remain unresolved; same-host base evidence remains linked in §2 of the tracker. Three NEXUS frontend failures remain (missing resolved blocker, empty milestone graph, fan-out 3 > 2). Earlier tenancy migration-replay budget failure followed by passing serial rerun is recorded in BE-00D. Do not reclassify any as harmless.

Documentation verification on this branch:

| Check | Actual result |
|---|---|
| `bun run check:architecture` | Passed: 318 source files, 909 resolved edges, zero violations; existing type-only DB backlink reported |
| `bun run test:backend:architecture` | 45 passed, zero failed, 51 assertions, 7.29s |
| `bun run typecheck:backend` | Passed, including architecture guard |
| Relative Markdown links in index/new document | Passed; every local link target exists |
| `git diff --check` | Passed |
| Freeze check against fetched `origin/main` | No app/package/infra/script/schema/migration/dependency/test changes; status tracker unchanged |
| Authentication/session/CSRF/library compatibility runtime tests | Not executed: absent candidate packages and no authentication implementation authorized |
| Frontend/full DB/infra/lifecycle recertification | Not rerun for documentation-only changes; known baseline failures and prior reported results remain visible above and in tracker |

No absent session library runtime check, credential test, CSRF test, load test or live authentication is reported passed. This phase preserves all production/frontend/schema/migration/dependency/test files and does not rerun infrastructure to imply auth readiness. Stop at human review: do not merge or implement authentication.
