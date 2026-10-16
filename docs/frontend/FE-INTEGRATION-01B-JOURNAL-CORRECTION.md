# FE-INTEGRATION-01B — Administration journal correction

Reviewed baseline: `548946490bcf3fb5394bf82120e3a163ea8e3fa6`, branch `codex/fe-integration-01b`, draft PR #51. Preflight found a clean tree and matching origin branch. Final correction SHA is recorded in PR #51 and the handoff. No merge or deployment.

## Cause and correction

The original `actor === op.actor && workspace !== op.workspace` retention predicate discarded every other actor's entries during writes/removal. The administration store also globally cleared administration storage on logout/account transition. Both could destroy an uncertain request's only original key and precondition.

Administration records now have exact `(actor, Workspace, membership)` scope. Writes append without dropping unrelated scopes. An exact canonical request retry is a storage no-op, including at the eight-entry limit. A different key, action, target, body or precondition in an occupied scope fails closed rather than replacing it. Removal checks the complete original request identity and deletes only that scope. Stale cancellation/completion cannot remove a different intent. Duplicate scopes, invalid entries, invalid JSON, oversized storage and excessive entry counts fail closed without rewriting storage. The total eight-entry/40,000-character limits never evict another actor.

Canonical bodies are validated before the first API send and preserved with the original operation, target, UUID key and If-Match on retry. No automatic new-key retry or refreshed-precondition substitution is introduced. The server remains authoritative on replay.

## Administration clearing and security policy

- Logout (including an uncertain logout response), expiry, account switch and Workspace/membership change abort/fence in-flight work and clear private in-memory projections. They **do not erase administration journal entries**.
- Restoration requires current authenticated verified ADMIN authority, the exact actor/Workspace/membership identity and existing session-generation fences. Another actor cannot render, retry or cancel a retained entry through this store.
- Successful current-scope acknowledgment, existing definite precommit rejection handling (400/412/428/429), or the existing explicit authorized cancellation removes only the matching complete request. Cancellation stops the local retry; it does not roll back or prove noncommit of the server operation.
- No global administration clear API remains. Revoked/lost membership entries are retained, not silently rebound to a new membership. At capacity, new requests fail closed until authorized reconciliation/cancellation; no eviction or time-based expiry policy is invented.
- Storage remains existing **tab-scoped sessionStorage**, not an authentication credential. It may contain recipient email and request metadata; no proof, password, CSRF token or session cookie is stored. Retention is not confidentiality from someone inspecting the browser's storage. Closing/clearing a browser tab can still lose pending reconciliation evidence; this change does not promise cross-device durability or immunity to manual browser clearing.
- This correction targets the administration namespace. Separate legacy invitation/acceptance journals retain their established policies and are not migrated or bulk-cleared by AdministrationJournal. Existing legacy reconciliation still uses its original endpoint/body/key.
- `SessionStore` changes are a comment clarification only: the logout fence does not prescribe one clearing policy for every consumer.

## Changed files

- `apps/web/src/features/workspaces/live/AdministrationStore.ts`: precise journal identity, immutable retry/remove, fail-closed parsing/cap and removal of automatic administration clearing.
- `apps/web/src/features/workspaces/live/Administration.test.ts`: 17 added cases covering two actors, multiple Workspaces/membership identities, changed request rejection, full-cap exact retry, malformed storage and network/503 reconciliation across account switches and logout.
- `apps/web/src/features/auth/session/SessionStore.ts`: comment only.
- `scripts/frontend/fe-integration-01b-journeys.cjs` and `scripts/frontend/fe-integration-01b-journal.cjs`: opt-in focused real two-actor/two-Workspace journal journey using the existing owned-service runner and shared browser helpers; original broad suite assertions remain unchanged.
- This report, the implementation-report pointer and correction-specific evidence. Original milestone evidence remains unchanged.

No component, route, style, prototype provider, fixture, backend contract, migration, dependency or environment file changes. `/demo`, shell and approved UX exceptions are unchanged.

## Fresh verification

```powershell
bun run --cwd apps/web test src/features/workspaces/live/Administration.test.ts src/features/workspaces/live/Members.test.tsx src/app/shell/LiveShell.test.tsx
bun run --cwd apps/web test
bun run lint:web
bun run build:web
$env:PLAYWRIGHT_MODULE='C:\Users\youna\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\playwright'
$env:FE_INTEGRATION_EVIDENCE_DIR='<new absolute directory outside repository>'
node scripts/frontend/fe-integration-01a.cjs --01b --browser-only --production
# Fresh, separate owned services for the focused journal gate:
node scripts/frontend/fe-integration-01a.cjs --01b --browser-only --production --journal-only
```

- Focused frontend: **87/87 pass**, three files.
- Full frontend: **932 pass / 3 historical failures**, 935 tests across 62 files. Historical failures remain resolved-issue fixture absence, zero milestone graph nodes (expected at least12) and fan-out3 (expected at most2). No fixture/assertion changes.
- `lint:web` (**TypeScript `tsc --noEmit`**, not a separate ESLint suite): pass. Production build: pass; existing Vite native-config and large-chunk warnings remain.
- Focused production Chromium: **5/5 gates pass** with two real actors/two Workspaces, independent cancellation, logout/account-switch retention, exact-key/body replay, cross-Workspace denial and CSRF. **13/13 migrations**, `/live`200 and `/ready`200 in matching owned API/worker services; **2/2 Mailpit sentinels preserved**, zero deletions. Shared QA untouched.
- [Focused browser evidence](evidence/FE-INTEGRATION-01B/journal-correction/focused-browser.json), [failed broad attempt](evidence/FE-INTEGRATION-01B/journal-correction/broad-browser-failed.json), [source hashes/test counts/interrupted attempt summary](evidence/FE-INTEGRATION-01B/journal-correction/verified-source.json). Raw evidence for all three attempts remains outside the repository under `D:\Full_Stack_Apps\Unblok-FE-INTEGRATION-01B-20261016\journal-correction-browser-{1,2,3}`. The original milestone browser evidence remains historical.

## Failed attempts and unexecuted checks

Correction browser attempt1 passed six gates before infrastructure interruption; teardown reported that its owned Valkey container no longer existed. Read-only Docker inspection then showed recently restarted development containers. Causation is unresolved; no production defect is attributed from this observation. Teardown threw before its usual final JSON write; original screenshots/logs and the observed partial-result summary are preserved outside the repository. This run is not counted as a passing suite or a successful sentinel check.

Correction browser attempt2 passed15 gates, including real administration, Workspace isolation, uncertain journal retention and same-tab account switching, then failed the added final retry: actual POST429 after the owner exhausted the unchanged five-per-hour administration budget. The test waited for a success message that correctly never appeared. Screenshot/HTTP evidence confirms rate-limit guidance, not fabricated success. Both sentinels survived and13 migrations/API health passed. This failed combined attempt remains recorded. The focused journal case is separated into fresh owned services instead of changing limits, increasing timeouts or retrying with new keys. Issuance retries have no If-Match; nonempty original role/invitation preconditions are verified in the focused frontend tests.

Backend suites, prototype pixel comparisons and exhaustive accessibility checks are not rerun for this journal-only correction. Prior milestone evidence remains separately labeled. Historical Workspace-navigation flake, combined architecture timeout, queue/SIGTERM issues and original combined backend failures remain unresolved, with details in the implementation report. No shared QA database, Mailpit messages or records were modified. No FE-INTEGRATION-01C work.

Stop for PM re-review. PR #51 must remain draft; do not merge or deploy.
