# FE-WS-02 — Workspace members and invitations

Implemented for human review on `feat/fe-ws-02-members-invitations`, from merged PR #37 / base `d473e02487d1a6b40225a54b3105bd8fed05d0aa`. Not merged, deployed or production-certified. No backend production code, migrations, dependency versions, NEXUS fixtures or business APIs change.

## API and UI contracts

| Surface | Contract and behavior |
| --- | --- |
| Members | `GET /api/v1/workspaces/:workspaceId/memberships`; strict shared response validation, 20 rows per page, signed continuation cursor, server status filter and joined-date order. Each next page replaces the previous page; no unbounded fetch or fabricated count. Names, roles, status and nullable joining dates only, never contact emails. |
| Issue | `POST /api/v1/workspaces/:workspaceId/invitations`; canonical shared email/role schema, MEMBER or OBSERVER only, existing CSRF bootstrap and Idempotency-Key. Generic 202 is acknowledged with explicit delivery uncertainty. |
| Accept | `POST /api/v1/workspace-invitations/accept`; authenticated verified account, proof and Idempotency-Key, existing CSRF. Generic 202 triggers bounded Workspace discovery and server-context reads; it never establishes a membership locally. |

Visibility uses fresh server membership: ACTIVE ADMIN can view members; only a verified ADMIN in an ACTIVE Workspace can issue invitations. Archived directory reads remain available where the server permits them. Capability hints never authorize a mutation. MEMBER/OBSERVER have no management controls. A directory 404 invalidates selection instead of repeatedly reopening the inaccessible context. There are no role-change, removal, suspension or ADMIN-invitation controls.

Existing Button, Modal, AuthField, AuthCard, semantic colors and authenticated layout are reused. The members route alone uses the existing wider layout token. The mobile directory scrolls horizontally in a labelled, keyboard-focusable region; page-level overflow is checked. The modal retains existing focus trapping, Escape handling and focus restoration. Signup/login route elements are keyed so switching modes cannot retain a previous success screen.

## Identity, interruption and reconciliation

`MembersStore` binds requests to server actor, session generation, Workspace and invitation eligibility. Changes abort obsolete requests and clear visible authority. Stale cursors require an explicit reload. Old completions/401s cannot update another account or Workspace; existing shared AuthApi generation checks remain intact. No polling is introduced.

Issuance records only actor UUID, Workspace UUID, request UUID and canonical email/role in tab-scoped sessionStorage (at most eight records). It writes before sending, suppresses duplicate submissions and retains the same key/body after uncertain results, 409, 429 or 503. A definitive validation rejection permits input correction. A 202 clears the pending issuance record. Unexpected session interruption can restore a same-actor attempt; explicit logout/account mismatch clears it. Corrupt or unavailable storage blocks unsafe rekeying. Closing a tab abandons tab-scoped retry metadata; it cannot provide durable cross-device reconciliation.

Invitation links use `/invite#token=…`. The fragment is captured into private in-memory state and removed from browser history when the application initializes or observes a hash change. Query/path tokens are not accepted. A fragment is not sent in HTTP requests; no analytics integration is added. The UI also supports pasting the email code into a password-type input, which is cleared on capture. A full reload after capture loses the proof: reopen the original email/link. SPA signup, login and verification preserve it, with an allowlisted `/invite` return route. Explicit logout/different authenticated actor clears it. An initially anonymous proof binds to the first freshly authenticated account; the server verifies recipient ownership. There is no invitation preview or recipient disclosure.

Acceptance stores only actor UUID, SHA-256 proof lookup digest and request UUID (at most eight records); never the proof. Reopening the same proof after reload restores its key only for the matching server actor. Separate invitation attempts retain separate keys. Generic 202 does not reveal validity and the key metadata remains available for same-key reopening. Storage corruption/unavailability blocks mutation. Neither journal stores sessions, CSRF tokens, passwords, authorization roles or capability grants. An invitation's requested role is input metadata only.

## Browser and deployment boundaries

The browser harness uses real isolated PostgreSQL, Valkey, Nest/Bun HTTP and the existing worker delivery dispatcher with Mailpit. Test database/cache/mail are owned and cleaned up; disposable keys are generated only in the harness. It uses externally supplied Playwright/Chromium without installing or changing dependencies. Run Vite on localhost:3000, then set `PLAYWRIGHT_MODULE` to the installed runner and execute `bun --env-file=apps/api/.env test scripts/backend/frontend-members-browser.test.ts`.

The deployed email template currently supplies a code, not a generated frontend invitation URL. This slice supports secure fragment URLs and code entry; production link construction and mail delivery configuration remain deployment work. Same-origin Vite proxy and existing localhost cookie rules are exercised; production HTTPS, trusted reverse proxy, secure cookies, CSP/referrer/analytics policy, production mail and multi-browser validation remain unresolved. No cookie, CSRF, Origin or backend authorization setting is weakened.

Remote Google Fonts are blocked in this harness for deterministic existing system-font fallback. Captures cover 320, 390, 768, 1024 and 1440 pixels in Light and Dark, DPR 1. These screenshots establish local responsive behavior, not pixel equality to a historical baseline or certification of deployed Inter fonts. Browser screenshots and machine-readable evidence contain no invitation proofs or credentials.

## Verification

[Gate evidence](evidence/FE-WS-02-verification.json), [latest browser result](evidence/fe-ws-02/results.json), and [browser run history](evidence/fe-ws-02/runs.json) record successful and failed observations. The final local Chromium run passed in 69.49 seconds (56 assertions), on Chromium 151.0.7922.34. It exercised real signup/login/email verification, stale membership cursors, bounded filtering/pagination, committed issuance response loss followed by reload and same-key retry, committed acceptance response loss and same-key retry, confirmed server membership, denied MEMBER directory access, proof clearing after reload, same-document invitation links, same-browser epoch revocation and reauthentication, archived read-only access, ADMIN demotion, NEXUS separation and modal keyboard behavior. Twelve screenshots were captured; 320px Light, 1440px Dark and the 320px dialog were visually inspected. The unchanged 120/minute coarse gate returned 429 during rapid test navigation; retry waited its real 27-second remaining interval. No counters were reset or limits increased.

| Gate | Result |
| --- | --- |
| Focused frontend auth/workspace/components/API/architecture | 99 passed, 9 files |
| Full frontend | 832 passed, 3 historical NEXUS failures, 59 files |
| Frontend typecheck/lint | Passed |
| Backend architecture | 53 passed; checker 401 source files, 1102 edges, zero violations |
| Backend typecheck and lint | Passed |
| Enterprise proposal validator | Passed: 21 operations, 55 schemas, 27 examples, 26 negative checks, 32 lifecycle scenarios, 24 local links |
| Live Workspace contract tests | 2 passed, 22 assertions |
| Frontend and API/worker builds | Passed |
| Backend regression and worker tests | 101 passed, 265 assertions |
| Real invitation security | 36 passed, 1201 assertions |
| Real authentication HTTP | 26 passed, 827 assertions |
| Real sessions | 31 passed, 473 assertions |
| Real auth fences | 24 passed, 134 assertions |
| Real tenancy | 34 passed, 132 assertions |
| Existing Workspace HTTP | 29 passed, 671 assertions |
| Database integration | 2 passed, 5 assertions |
| Migration replay | Browser: all 10 migrations; existing authentication schema-equality/replay and tenancy upgrade tests passed |

Account mismatch, unverified/suspended/existing memberships, key rotation, lease/delivery eligibility races, dependency outages and concurrent redemption are covered by the real backend invitation suite. Controlled frontend tests cover stale completions, foreign-account clearing, failed storage and 400/401/404/409/429/503 handling. These are distinct from browser observations; every negative case is not claimed as an individual browser scenario.

The full frontend failures remain the unchanged NEXUS entity-reference/DAG assertion, milestone graph population assertion, and active blocked-work fan-out assertion. Historical queue notification/between-test errors, SIGTERM143 and dependency advisories were preserved from prior evidence, not rerun or declared resolved in this frontend slice. No package updates, timeout increases or assertion weakening were used.

The first harness used the inherited six-second Bun Prisma setup deadline; two runs exited 137 with zero applied migrations. The unchanged installed Prisma CLI under installed Node completed all ten migrations inside the same deadline. This isolates a runtime/startup difference, not a proven root cause or resolution of historical cold-Bun failures. Existing backend suites retain their original runtime/deadlines.

Intermediate browser failures identified a mode-state reuse bug (signup confirmation survived navigation to login), a missing same-document fragment listener, and test synchronization/accessible locator issues. These were corrected and rerun. A rapid full browser scenario also hit the unchanged coarse HTTP rate limit; its advertised retry interval is observed rather than increasing the limit. Failed runs remain in history. Historical NEXUS dataset, queue timing/between-test, SIGTERM and dependency-advisory findings remain open and are not production readiness claims.

## Remaining limits and review boundary

Tab journals are bounded to eight issuance records and eight acceptance records; full tabs/devices do not share recovery metadata. Blocked storage/capacity cannot silently generate replacement requests. Generic acceptance cannot identify which Workspace a proof targets, so only bounded discovery and selected server context establish visible access; the user may page through authorized Workspaces. A discarded or closed-tab proof must be reopened from its email. Shared-device JavaScript storage is not a confidentiality boundary against someone with developer tools or an XSS capability; records contain no credential or bearer proof and never provide authority.

Production mail-link construction, TLS/proxy/cookie deployment, CSP/analytics policies, deployed font rendering, assistive-technology review and non-Chromium browsers remain pending. Previously documented backend operational risks remain applicable. This PR stops at human review: no merge, role-management UI, fixture replacement or next milestone.

Final evidence assembled 2026-10-14. The rerun invitation [concurrency evidence](evidence/fe-ws-02/BE-WS-02-concurrency.json) and [query plan](evidence/fe-ws-02/BE-WS-02-query-plan.json) are copied into this phase’s evidence folder; earlier BE-WS-02 evidence remains unchanged.
