# AUTH-UX-02 final review correction — Mailpit preservation

Date: 2026-10-15 (Asia/Karachi). Accepted implementation HEAD: `de22eff65317eabb4e876f19cef7d23988b4e5ff`. PR #48 remains draft; do not merge.

## Finding and attribution

**Confirmed failure mechanism; historical seven-message incident remains unresolved.** The pinned Mailpit v1.27.8 API deletes the entire inbox when DELETE `/api/v1/messages` has no decoded, nonempty ID list. Disposable reproductions confirmed missing body, `{}`, empty/null IDs, malformed JSON and an incorrectly typed IDs property all return HTTP 200 and remove both owned messages and unrelated sentinels.

The old invitation F2 race-test `finally` block recomputed recipient matches and submitted their IDs unconditionally. A failure before successful delivery, or a now-empty match set, could therefore send `{ "IDs": [] }`. A dedicated reproduction of that failure/finally pattern confirmed deletion of unrelated sentinel messages. The first invitation delivery test instead asserted one match before entering its try/finally, so its ordinary empty-match path did not reach that cleanup. These are distinct paths.

**This does not prove the F2 path deleted the original seven messages.** No deletion-request trace from the earlier shared-inbox run exists. Its F2 test bodies were reported passing; the earlier valid scoped-delete diagnostic preserved unrelated mail. There is no evidence establishing an empty/malformed request or a particular actor for that historical loss. Original messages have not been recreated or restored. No new attribution is claimed.

The behavior also agrees with the version-specific [upstream deletion handler](https://github.com/axllent/mailpit/blob/v1.27.8/server/apiv1/messages.go): a decode error or zero decoded IDs selects DeleteAllMessages. No production Mailpit configuration or version was changed.

## Cleanup-path inventory

Inspected all `api/v1/messages`/DELETE/Mailpit references under scripts, apps and packages, plus the external AUTH-UX-02 verification scripts used in the original run.

| Path at accepted HEAD | Prior behavior / risk | Correction |
|---|---|---|
| `scripts/backend/email-verification.test.ts` afterAll | Shared port 8025, guarded nonempty Set, JSON ID deletion; no preservation check | Private per-suite capture, validated scoped deletion and sentinels |
| `scripts/backend/password-recovery.test.ts` afterAll | Same shared target and guarded Set | Same private boundary and guards |
| `scripts/backend/frontend-auth.test.ts` afterAll | Shared target, guarded Set, checked HTTP acknowledgment only | Same private boundary; missing sentinels fail teardown |
| `scripts/backend/workspace-memberships-invitations.test.ts` delivery test | Shared ID-scoped deletion, response not checked; preceding assertion protects ordinary empty match | Helper validates IDs, checks response and sentinels in private capture |
| Same file, F2 demote/archive finally | Recomputed match list submitted without length guard, including after failed send; empty list can delete all | Empty helper cleanup makes no DELETE request; private capture plus sentinel checks |
| `scripts/backend/frontend-members-browser.test.ts` finally | Shared target, guarded array, unchecked deletion response | Private capture, checked deletion; resource cleanup and sentinel-checked close |
| `scripts/frontend/auth-browser.cjs` finally | Live-stack runner deleted collected IDs on shared capture | Deletion removed; GET-only client and before/after preexisting-ID preservation guard |
| `scripts/frontend/auth-ux-02-browser.cjs` | No DELETE existed; read new test-owned recipient messages | Retains no-delete behavior; GET-only client and hard-failing preservation guard |
| Original external `isolated-runner.ts` | Redirected string URL calls from shared port to temporary port 18025; rejected empty IDs/JSON parse errors, no sentinels | Deprecated in current instructions; repository suites now own capture isolation directly |
| External `mail-diagnostic.ts` | Two synthetic messages, one valid ID deletion, port 18025 only; no empty/malformed reproduction | Superseded by committed sentinel regressions |
| External Chromium/feedback/preservation/mail-check helpers | No mail DELETE; browser generated owned mail; inventory/checks read mail | Not rerun against shared capture in this correction; original evidence left intact |
| API/worker dispatcher | POST send only, no inbox cleanup | Unchanged |
| Infrastructure readiness test | GET `/readyz` only | Unchanged |

Guarded nonempty collections reduced one risk but did not isolate their target or verify preservation. No malformed body is known to have been transmitted by the old guarded paths; JSON serialization itself is not evidence of a malformed request.

## Minimal corrections

`scripts/test-support/mailpit.cjs` and its type declaration provide:

- A new Mailpit container per suite, with a random run label/name, pinned image digest, ephemeral loopback port and no shared volume. Shared port 8025 cannot become its capture endpoint.
- Two synthetic sentinel messages before test traffic. Their IDs, subject and text are checked before/after every cleanup and again before capture teardown.
- Scoped deletion only for valid IDs present in that capture; sentinel IDs rejected, duplicate IDs deduplicated. Empty arrays are a checked no-op; malformed/unknown IDs fail before any DELETE. HTTP failure also fails cleanup.
- Missing/changed sentinels throw. Teardown still removes only the run-owned labeled disposable container, then propagates the failure. No sentinel failure can become a passing suite result.
- GET-only live-stack client: paginated existing-ID snapshots and preservation assertions, without opening preexisting message bodies. No deletion interface is exposed to live browser runners. Their final result/process exit fails if an existing ID disappears.

The five mail-emitting backend/browser suites now take send/read/cleanup URLs from their own capture. Application code, backend contracts, CSRF/session/tenant authority, worker, proof cryptography, schema/migrations and NEXUS remain unchanged. No global fetch redirection or environment/secret edits are needed for mail isolation. The optional historical Node preload selects only the Prisma subprocess runtime on this Windows host.

## Disposable-only reproductions and regression evidence

Each unsafe reproduction starts its own capture with **two sentinels plus one owned message**. All destructive raw requests are made only to the generated capture URL. These deliberately unsafe reproduction requests are never used by normal suite cleanup.

| Case | Before → after | Result |
|---|---|---|
| Raw DELETE missing body | 3 → 0 | HTTP 200; sentinel guard and close reject |
| Raw `{}` | 3 → 0 | Same |
| Raw `{ "IDs": [] }` | 3 → 0 | Same |
| Raw `{ "IDs": null }` | 3 → 0 | Same |
| Raw malformed JSON `{` | 3 → 0 | Same |
| Raw `{ "IDs": "not-an-array" }` | 3 → 0 | Same |
| Legacy F2 failure/finally recomputation | 3 → 0 | Absent recipient gives zero matches; unsafe old request wipes sentinels |
| Corrected empty cleanup | 3 → 3 | No destructive request; preservation passes |
| Corrected owned/duplicate cleanup | 3 → 2 | Owned message removed, both sentinels preserved |
| Corrected malformed/unknown/sentinel IDs | 3 → 3 | Rejected before deletion |
| Missing sentinel / missing baseline ID | Guard rejects | Hard-failure behavior verified, including teardown |

Expected rejection is asserted only inside the intentional unsafe reproduction tests. Normal suite cleanup does not catch or suppress missing-sentinel errors.

Committed evidence is under `docs/frontend/evidence/AUTH-UX-02-mail-preservation/`: complete preservation-test and relevant-regression logs, backend typecheck output and sanitized before/after QA record counts. No credentials, proof strings, request cookies or raw QA messages are included.

## Relevant checks only

| Check | Result |
|---|---|
| New Mailpit preservation/reproduction tests | **10 passed / 0 failed**, 94 assertions |
| Existing verification, recovery, frontend-client and invitation suites | **71 passed / 0 failed**, 2239 assertions; each suite's two sentinels survived cleanup/close |
| Backend typecheck/architecture | Pass; 428 files / 1159 internal edges, zero violations |
| Backend lint | Pass |
| Node syntax checks: helper and both live browser runners | Pass |
| Git whitespace / production diff | Pass; no production application files changed |

Exact executed commands:

```powershell
bun test scripts/backend/mailpit-preservation.test.ts
bun --env-file=apps/api/.env test --preload D:/Full_Stack_Apps/Unblok-AUTH-UX-02-20261015/prisma-node-preload.ts scripts/backend/email-verification.test.ts scripts/backend/password-recovery.test.ts scripts/backend/frontend-auth.test.ts scripts/backend/workspace-memberships-invitations.test.ts
bun run typecheck:backend
bun run lint:backend
node --check scripts/test-support/mailpit.cjs
node --check scripts/frontend/auth-ux-02-browser.cjs
node --check scripts/frontend/auth-browser.cjs
git diff --check
```

The optional Node-only preload contains `Object.defineProperty(process,'execPath',{value:'C:/Program Files/nodejs/node.exe'});`. It changes neither assertions/timeouts nor Mailpit fetch behavior. Mail isolation works without it on hosts where existing Prisma/Bun subprocess setup works. Docker must be available and the pinned image present/pullable. Never repoint these cleanup suites to the shared capture. No manual delete-all command is part of these instructions.

No production files changed, so frontend typecheck/build and the full application/Chromium journeys were not rerun. The backend members Chromium fixture owns port 4000 and existing evidence output paths; it was not executed against the active QA API. Its helper integration was typechecked and included in the source-boundary regression. The two live-stack browser runners were syntax checked and source-guarded; no new QA registration, verification or Workspace operation was performed. Do not interpret these limits as freshly passing full browser journeys. Prior NEXUS, queue and SIGTERM limitations retain their documented historical status.

## Shared QA preservation during this correction

Only read-only listing/SQL fingerprint queries touched the shared QA environment. No shared mail DELETE/send/reset/restore, message-body reads, Docker volume operations, API/worker restart or application authentication/Workspace requests were performed. Sentinel creation and unsafe-delete experiments used only disposable captures.

| Shared QA data | Before | After | Original rows/IDs unchanged |
|---|---:|---:|---|
| Users / identities / password credentials | 9 each | 9 each | Yes |
| Workspaces / Workspace memberships | 7 each | 7 each | Yes |
| Teams / Team memberships | 0 each | 0 each | Yes |
| Verification challenges / outbox | 7 each | 7 each | Yes |
| Recovery challenges / outbox | 3 each | 3 each | Yes |
| Invitations / invitation outbox | 3 each | 3 each | Yes |
| Workspace creation receipts | 7 | 7 | Yes |
| Invitation receipts | 6 | 6 | Yes |
| Applied migration history | 12 | 12 | Yes |
| Current Mailpit message IDs | 5 | 5 | Yes |

Database rows in the listed tables were compared using read-only fingerprints, not just counts. Live cache/session bookkeeping is outside this fingerprint set; the tests use their own database/cache namespaces and did not authenticate to the QA application. All disposable captures were removed after checks; no run-labeled capture remains. The existing invitation suite regenerated two tracked evidence files; these were restored byte-for-byte to the accepted HEAD and are excluded from this correction. Earlier audit reports/screenshots and original implementation evidence were not replaced.

The five currently present shared messages surviving this correction does **not** recover the historical seven. That original loss remains explicitly unresolved. No original message was reconstructed or represented as restored.

Stop for human review. Production frontend scope is unchanged; do not merge automatically.
