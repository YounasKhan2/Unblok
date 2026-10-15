# AUTH-UX-02 — Authentication UX corrections

Baseline: `aa3a6adbfc4df70d4bfbfbb4af0c7fb9d448481d`. Date: 2026-10-15 (Asia/Karachi).

Implements approved audit phases 1–3 within the explicitly permitted frontend scope. Model A remains: signup → sign in → request verification → verify. No backend API, schema, migration, worker, cryptography, automatic issuance, role policy or product-shell change. Draft PR only; do not merge without human review.

## Before / after

| Journey | Before | After |
|---|---|---|
| Signup | Every receipt mentions an existing account | Identical neutral receipt for new/duplicate emails, explicit sign-in/verification next step, no automatic-email promise |
| Invalid login | Credentials and session expiration conflated | Generic credential-only denial for unknown/wrong/disabled; response body never identifies account state |
| First protected anonymous visit | Always marked sessionExpired | No expiry reason until this client previously had server-confirmed identity and receives current-generation denial |
| Genuine session loss | Generic sign-in prompt | Explicit session-ended guidance, suppressed beside a new credential error; intentional logout clears reason |
| Unverified account | Small verification link | Primary next-step panel explaining recovery/invitation prerequisites; own Workspace permission unchanged |
| Verification | Undifferentiated waiting, opaque resend/expiry | Request-specific pending label, conditional acknowledgment, 15-minute issuance lifetime and coalescing/resend guidance; explicit request remains mandatory |
| Recovery | Check-email title and conditional promise easy to misread | Recovery-request receipt, eligibility guidance, no delivery guarantee and no reset-success claim from generic acceptance |
| Invitation | Sparse manual entry instructions | Sign-in → verify matching address → accept, 24-hour lifetime, keep original code, refresh clears secret; manual fallback preserved |
| Workspace create | Opened tenant but picker retained old empty page | Clear stale discovery after validated 201 and refetch; failed/unknown writes retain original key/body/journal |
| Feedback | General errors announced but no focus target; generic quota message | Focusable status/error feedback; server Retry-After wait shown without automatic retry |

No unsupported “queued/delivered” status is fabricated: current APIs do not supply that contract. Email hyperlinks/templates remain unchanged because worker edits are prohibited. On-screen instructions explain manual routes instead. Existing NEXUS separation is unchanged.

## Changed files

Production frontend:

- `apps/web/src/features/auth/api/authApi.ts`: endpoint-context denial copy and Retry-After guidance; unauthorized clearing/CSRF/generation checks retained.
- `apps/web/src/features/auth/session/SessionStore.ts`: optional session-loss presentation state derived only from prior confirmed identity; explicit logout resets it.
- `apps/web/src/features/auth/live/SessionGuard.tsx`: removes blanket expiry query and carries observed loss in router state.
- `apps/web/src/features/auth/live/CredentialsPage.tsx`: neutral receipts, Model A next step, contextual expiration, conditional recovery/reset, feedback focus and invitation continuation through recovery links.
- `apps/web/src/features/auth/live/AccountPage.tsx`: prominent verification task without restricting existing access.
- `apps/web/src/features/auth/live/VerificationPage.tsx`: accurate pending/request-again/expiry/coalescing instructions and focusable feedback.
- `apps/web/src/features/auth/live/AuthFeedback.tsx`: shared status/error focus target.
- `apps/web/src/features/workspaces/live/InvitationPage.tsx`: matching-account sequence, lifetime/manual fallback and focused outcome guidance.
- `apps/web/src/features/workspaces/live/InviteDialog.tsx`: recipient route, verification and lifetime instructions; acknowledgment does not claim delivery or membership.
- `apps/web/src/features/workspaces/live/WorkspaceStore.ts`: invalidates/refetches discovery only after validated create acknowledgment, with existing version/controller checks.

Regression additions: `authApi.test.ts`, `SessionStore.test.ts`, `LiveRoutes.test.tsx`, `WorkspaceStore.test.ts` alongside those implementations. Adds 10 tests covering denial context/privacy, server wait, initial/actual/session-outage distinction, explicit logout, verification prominence, forged expiry query, and refreshed discovery with actor-change suppression. Existing tests/assertions were not weakened.

Reproduction: `scripts/frontend/auth-ux-02-browser.cjs`. New evidence: `docs/frontend/evidence/AUTH-UX-02/`. This report is new; prior audit reports are not replaced.

## Verification results

These are the original implementation-run results. See [the focused Mailpit correction report](AUTH-UX-02-MAIL-PRESERVATION.md) for the subsequent investigation and correction-run evidence.

| Check | Final result |
|---|---|
| Focused frontend auth + live Workspace | **196 passed / 0 failed**, 11 files |
| Full frontend | **867 passed / 3 historical NEXUS failures**, 60 files / 870 tests |
| Backend unit/runtime/architecture | **101 passed / 0 failed**, 8 files, 265 assertions |
| Isolated ownership/fences/recovery/invitations/frontend-client HTTP | **95 passed / 0 failed**, 5 files, 2373 assertions |
| Real authentication/session HTTP integration | **57 passed / 0 failed**, 2 files, 1300 assertions |
| Real Chromium | **16 journey checks passed**, zero page errors; real API/worker/PostgreSQL/Valkey/Mailpit |
| Supplemental browser presentation | **2 passed** with controlled 202/429 responses; not live rate exhaustion |
| Frontend typecheck + production build | Pass; existing Vite config/chunk-size warnings |
| Backend typecheck + architecture | Pass; 427 source files, 1159 internal edges, zero violations |
| Git whitespace | Pass |

The 152 passing integration tests are distinct: auth fences 24, verification 16, frontend client 1, recovery 18, memberships/invitations 36, authentication 26, sessions 31. Repeated diagnostic runs are not added to these totals.

Full frontend failures remain exactly the historical NEXUS cases: invalid/missing resolved-blocker reference, absent milestone dependency edges, and fanout exceeding the fixture limit. Queue notification timing and Windows SIGTERM limitations were not retested or reclassified. No NEXUS fixture or test change.

Initial verification attempts are preserved in external logs: Bun-spawned Prisma CLI hit existing six-second setup deadlines (four setup failures plus two cleanup failures; 93 test bodies passed). Running Prisma subprocesses under installed Node resolved this without changing assertions/timeouts. One full backend attempt hit the existing 5s architecture-test deadline while other checks ran; the unchanged serial rerun passed all 101. These harness/resource failures are separate from final application results.

### Exact commands

```powershell
bun run --cwd apps/web test src/features/auth src/features/workspaces/live
bun run --cwd apps/web test
bun run --cwd apps/web lint
bun run --cwd apps/web build
bun run test:backend
bun run typecheck:backend
bun --env-file=apps/api/.env test apps/api/verification/authentication-integration.test.ts apps/api/verification/session-integration.test.ts

# Mail suites now create their own disposable, sentinel-protected captures.
# On this Windows host the optional preload selects Node for Prisma only.
bun --env-file=apps/api/.env test --preload D:/Full_Stack_Apps/Unblok-AUTH-UX-02-20261015/prisma-node-preload.ts scripts/backend/workspace-memberships-invitations.test.ts scripts/backend/email-verification.test.ts scripts/backend/password-recovery.test.ts scripts/backend/frontend-auth.test.ts scripts/backend/auth-fences.test.ts

# Requires already-running local frontend/API/worker/DB/cache/mail capture.
$env:PLAYWRIGHT_MODULE='C:/Users/youna/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'
$env:AUTH_UX02_EVIDENCE_DIR='D:/Full_Stack_Apps/Unblok-AUTH-UX-02-new-run'
node scripts/frontend/auth-ux-02-browser.cjs
```

The browser runner requires a new evidence directory, creates uniquely addressed test-owned accounts/Workspaces, and never resets existing data or deletes mail. Credentials/proofs are held only in memory. Do not point it at a production/shared environment. It exercises browser cookie expiry by expiring its own cookie after authenticated state; server-side lifetime/fence expiry is independently exercised by existing session integration tests.

The original run used an external fetch-redirecting preload and a capture on port 18025; this is historical evidence, not the recommended runner. After the correction, each mail suite creates its own labeled, pinned Mailpit container on an ephemeral loopback port and checks two sentinels before/after cleanup and teardown. No global fetch redirection is needed. The optional preload in the command above selects Node for Prisma only. Existing test assertions, quotas, concurrency and timeout behavior remain unchanged. Live-stack browser runners expose only GET mail operations, retain newly generated mail, and fail if preexisting message IDs disappear. Temporary test databases/cache namespaces remain owned by their suites; no QA migration is applied.

## Chromium evidence

Committed `chromium-evidence.json` contains request paths/statuses, CSRF/Origin-presence checks, Mailpit message identifiers (not proof content), Chromium version and checks. All tested mutation requests carried CSRF and matching Origin. No raw proof persisted in local/session storage; fragment stripped on capture. Responsive invitation page checked at 320, 768, 1024 and 1440px without horizontal overflow.

| Screenshot | Evidence / outcome |
|---|---|
| `01-anonymous.png` | First anonymous protected entry: normal login, no false expired label |
| `02-invalid-login.png` | Unknown login generic denial, alert receives focus |
| `03-signup.png` | Real signup neutral receipt; duplicate signup produces identical text and leaves original name |
| `04-ineligible-recovery.png` | Real unverified recovery: conditional receipt, no false email claim |
| `05-unverified.png` | Primary verification next step after unverified login |
| `06-pending-verification.png` | Actual request held in flight: disabled Requesting email state; resend/expiry guidance |
| `07-workspace-picker.png` | New real Workspace present in picker immediately after creation |
| `08-invitation.png` | Verified admin invitation instructions and actual capture delivery |
| `09-expired-session.png` | Own browser session cookie expired; subsequent real denial produces session-ended prompt |
| `10-reset-receipt.png` | Generic reset receipt does not assert commit; subsequent real new-password login passes |
| `11-invitation-continuation.png` | Fragment removed; signup/login/verification returns to retained invitation proof |
| `12-invite-mobile.png` | Stale inviter epoch grants no membership, mobile recovery guidance visible |
| `14-rate-limit.png` | Controlled Retry-After 61 response produces focused wait guidance |

Additional real checks: committed creation response lost, deliberate retry carries the same UUID and creates one effect; switching away from delayed old tenant context cannot overwrite the current Workspace; verified/unverified states and explicit logout; independent verification/recovery/invitation messages. Controlled browser rate presentation is labeled separately from live server quota enforcement covered by backend tests. Valid first-time invitation joins, wrong recipients, disabled accounts, expiry, replay, concurrency and authorization fences are covered by existing real-backend suites.

## Preservation exception — human review required

Read-only fingerprints confirm every preexisting row inspected in users, identities, credentials, Workspaces, memberships, Teams, proofs/outboxes, invitation receipts and creation receipts remained byte-for-byte unchanged. All twelve preexisting migration rows remain unchanged. Original tracked BE-WS-02 evidence files were regenerated by an existing suite; those generated changes were restored exactly to the clean baseline and are excluded from this PR. The earlier audit inventory file was also restored from its matching original output; matching SHA-256 confirmed restoration.

**Mail evidence preservation did not pass.** All seven Mailpit IDs present before regression verification later returned 404. This includes preexisting audit/QA messages. Cause has not been established: the shared capture had no retained per-request deletion log. Existing tests perform ID-scoped cleanup, and this Mailpit version deletes all messages if deletion has no IDs or JSON cannot decode; however, there is no request trace proving which action removed these messages. A scoped-deletion diagnostic in the disposable capture preserved unrelated messages, so a blanket Bun DELETE defect was not reproduced. Do not attribute the loss to a specific actor or claim it is repaired.

After discovering this, further mail suites ran only against the disposable capture. No original messages were recreated, no shared volumes restored/reset, and no synthetic mail was represented as original evidence. Database proof/outbox history and the prior audit's on-disk screenshots/reports remain. The missing live inbox evidence cannot be claimed preserved. Investigate/restore from an authentic Mailpit backup separately if available; that recovery is not silently included in this frontend PR.

Two real browser runs created their own new `AUTH UX 02 OWNER`/`AUTH UX 02 RECIPIENT` identities and FIRST/SECOND Workspaces. They are test-owned records, retained without resetting/removing QA data. Other new records observed during verification are not attributed to this runner. Both runs used actual ownership proofs; reset touched only the newly created owner. Existing Mailpit evidence loss is an unresolved preservation limitation even though all original inspected database records were preserved.

## Review checklist / limits

- Model A and all server authority decisions remain unchanged; no automatic verification, public existence disclosure, role changes, proof/link cryptography or NEXUS connection.
- Idempotency UUID/body and journals survive unknown creation result; no fabricated local membership; stale actor/tenant responses suppressed.
- Expiry presentation is based on previously observed client authentication. A fresh browser/reload with no remembered identity cannot prove an earlier login and therefore uses normal sign-in guidance.
- Current APIs do not prove queue/delivery/precise expiry reason; UI deliberately remains conditional. Failed proof gets existing generic guidance, not an invented diagnosis.
- No worker mail-template hyperlinks/telemetry or new shell: prohibited backend/worker and later audit phases are deferred.
- Screen-reader/contrast certification is not claimed. Focus, semantics, desktop/mobile screenshots and overflow were exercised; broader assistive-technology review remains useful.
- Shared Mailpit evidence loss is a preservation failure, not a passing test or solved incident.

Stop for human review. Do not merge this draft automatically.
