# FE-TEAM-02 — Team management frontend architecture

Status: **proposed; human architecture review required**. Documentation only. Base: `df6c65875fc48a3521cac2754935bb0e04c57a77` (PR #45 merged). This proposal authorizes no frontend implementation, backend changes, migration, deployment or performance optimization.

## 1. Repository review and requirements

Sources: [frontend status](00-STATUS.md), [FE-TEAM-01](04-FE-TEAM-01-INTEGRATION.md), [FE-WS-02](03-FE-WS-02-MEMBERS-INVITATIONS.md), [backend index](../backend/00-README.md), [security](../backend/05-SECURITY-AND-AUTHORIZATION.md), [handoff](../backend/11-INTEGRATION-HANDOFF-MATRIX.md), [enterprise contracts](../backend/24-BE-API-00-ENTERPRISE-CONTRACTS.md), [approved Team architecture](../backend/29-BE-TEAM-02-ARCHITECTURE-PROPOSAL.md), [implementation/security evidence](../backend/30-BE-TEAM-02-IMPLEMENTATION.md), [directory correction](../backend/32-TEAM-DIRECTORY-ADMISSION-CORRECTION.md). Historical review labels do not override merged code or the living roadmap.

Inspected implementation: `packages/contracts/src/teams.ts`; API Team controller/application; live `TeamsApi`, `TeamsStore`, `TeamJournal`, `TeamsPages`, `TeamDialog`; authenticated transport and Workspace scope. Existing compact hub has Overview/Issues/Projects/Planning, honest unavailable metrics, UUID routes and metadata-only dialogs. NEXUS uses separate demo providers. BE-TEAM-02 already supplies ten management handlers alongside four foundation handlers. Its member page omits emails and totals; joinedAt may be null. Existing Team DTO management hints remain literal false for FE-TEAM-01 compatibility. No transfer inbox, contact lookup, self-removal, owner recovery or cancel endpoint exists.

| Applicable requirement | Proposed implementation | Acceptance evidence required |
| --- | --- | --- |
| Private explicit membership; no ADMIN bypass | Fresh request-bound owner directory proof; no role-only grants | Nonmember ADMIN/nonowner/foreign/observer denial and no private content flash |
| Owner-only management; security revocation wins | Generation/scoped stores, fresh opening checks, authoritative mutation responses | Both revocation orders, suspension/demotion, removal, logout/rotation |
| Bounded projection and signed pagination | 20-row pages, one page in memory, opaque cursor, explicit reload | Cursor expiry/filter/actor/Team/policy binding and no fetch-all |
| Consent, single owner, no automatic takeover | Exact request route, explicit successor confirmation, terminal states | Accept/reject/expiry races; old IDs and former-owner replay |
| Strong CAS, immutable receipts and finite capacity | Durable bounded original-request journal before transmission | Lost response, original-key/body/precondition replay; full-cap/expired receipt |
| Frozen compact UX, NEXUS separation | Existing primitives/theme/responsive hub; API-only live stores | Keyboard, responsive light/dark captures and unchanged demo regression |
| No child permissions or invented counts | Unsupported Project/Issue/planning states retained | No fabricated totals or child requests |

This is an implementation checklist, not a claim that proposed tests have run.

## 2. Decisions requiring architecture approval

1. **Management affordances without new DTO grants:** preserve literal-false v1 hints. Add an explicit “Check management access” entry on an already authorized Team hub, with no owner badge or enabled management action until a fresh owner-only `GET memberships` succeeds. That success proves directory ownership eligibility at that instant; combine it with freshly read Team/Workspace lifecycle for provisional UI affordances. It never grants server authority. Recheck on opening management/dialogs and after effects/conflicts; discard proof on scope, authority, version or lifecycle change. An archived Team allows owner directory and restore only in an ACTIVE Workspace. Nonowner failure renders neutral unavailable management, never cached private rows. Do not infer ownership from ADMIN, updateMetadata alone, an old owner row or a receipt. A future explicit capabilities contract would require a separate approved backend change; none is assumed here.
2. **Consent delivery:** copy an exact UUID-based application link after a confirmed RECORDED acknowledgement; the user shares it manually. No invitation email, notification, inbox, enumeration or bearer-access promise. Recipients must authenticate into the exact Workspace/Team; server GET decides visibility. Only the addressed membership may see decision controls, using fresh server Workspace membership ID and request detail; server still validates eligibility at completion. Owners cannot accept for successors. Links remain nonauthorizing references.
3. **Candidate selection:** use only the existing authorized, paginated Workspace membership directory, projected locally to display name/UUID/role/status; never copy its emails into Team state, dialogs or journals. ACTIVE Workspace membership UUID is the add target. No contact search, invited-member enrollment or Workspace invitation. Transfer candidates come from current Team directory pages with ACTIVE Workspace ADMIN and Team MEMBER eligibility. Selection is not eligibility certification; refresh and let the server reject stale candidates. No full-directory scan; manual UUID entry for add is permitted with a neutral error, not a hidden target lookup.
4. **Recovery storage:** retain FE-TEAM-01 pending requests byte-compatible. A versioned allowlisted management extension shares a tab-wide aggregate ceiling of eight pending Team attempts and 128 KiB UTF-8 with existing create/metadata attempts. Safe v1 reading/migration must preserve original keys, bodies and If-Match. Unsupported/corrupt/oversized or unavailable storage blocks new writes rather than dropping ambiguous attempts. Bounded known transfer references live only within this same bounded storage, never an independent unbounded ledger.

These are proposed frontend choices for this review, not new backend/product permissions. If they are rejected, implementation must wait for a reviewed alternative rather than override contracts.

## 3. Screen and action matrix

Keep UUID Team hub routes and all four current tabs. Add a compact owner management panel under Overview, accessible after the explicit fresh check; avoid redesigning navigation. Proposed consent route: `/workspaces/:workspaceId/teams/:teamId/ownership-transfer-requests/:requestId`.

| Surface | Visible data / action | Authority and states |
| --- | --- | --- |
| Team hub Overview | Existing metadata; management access check | Existing explicit Team visibility; counts remain unavailable |
| Owner member panel | Display name, membership UUID, Team role, Workspace lifecycle, owner badge, unknown historical joining date | Fresh owner-only page; ACTIVE/SUSPENDED/INVITED/ALL filter; archived read-only; no email or total |
| Add dialog | Existing ACTIVE Workspace membership UUID; MEMBER/OBSERVER | Eligible owner, ACTIVE Team/Workspace; Workspace OBSERVER ceiling restricts MEMBER |
| Row actions | Change MEMBER/OBSERVER, explicit remove confirmation | Eligible owner; owner removal/downgrade disabled; no self-removal or Workspace revocation |
| Transfer request dialog | Eligible existing successor; consequences and explicit request | Eligible owner; no silent ownership effect; confirmed acknowledgement exposes copyable link |
| Exact consent page | Minimal request state, expiry and explicit accept/reject | Fresh owner/addressed recipient GET; only addressed eligible successor decides; no member directory inheritance |
| Lifecycle confirmation | Archive or restore | Fresh owner proof; archive warns no Project cascade; active-Project conflict stays generic; restore revives no child or membership |
| Recovery/conflict panel | Own pending operation and retained draft | Fresh scoped authority; manual same-key reconciliation; explicit conflict resolution |

Use existing Modal/Button/input/table/status primitives, spacing and theme tokens. Dialog focus trap, Escape, focus return, labelled controls, visible keyboard focus and aria-live pending/error messages remain required. At 320/390px wrap actions and use bounded horizontal table scrolling; verify 768/1024/1440px in light/dark. Do not expose member totals from page length or invent pending transfer state from RECORDED. Unavailable Project/Issue/planning screens and NEXUS presentation stay independent.

## 4. Exact API integration contracts

Prefix `P = /api/v1/workspaces/:workspaceId/teams/:teamId`. Use neutral package schemas and existing authenticated transport, cookie credentials, CSRF/Origin, AbortSignal and strict response byte bounds. Verify returned identifiers match selected scope; malformed/mismatched response fails closed. Extend transport explicitly for DELETE; no JSON body on DELETE, while preserving required JSON content-type/CSRF headers. Existing foundation calls remain unchanged.

| Method/path | Input | Response |
| --- | --- | --- |
| GET P/memberships | limit=20, status, opaque after | TeamMemberPage; max100 backend, <=20 requested client items, cursor <=2048 chars |
| POST P/memberships | membershipId, teamRole | TeamMemberMutation; initial add201; inert200 |
| PATCH P/memberships/:membershipId | teamRole | TeamMemberMutation200 |
| DELETE P/memberships/:membershipId | No body | TeamMemberMutation200 |
| POST P/ownership-transfer-requests | successorMembershipId | TransferRecorded; initial201/inert200; no Team version in acknowledgement |
| GET P/ownership-transfer-requests/:requestId | No query/body | TransferDetail: state, expiresAt, baseTeamVersion, revision, membership bindings |
| POST P/ownership-transfer-requests/:requestId/accept | {} | TransferAccepted200, committed version |
| POST P/ownership-transfer-requests/:requestId/reject | {} | TransferRejected200; no Team version |
| POST P/archive | {} | TeamDetail200 |
| POST P/restore | {} | TeamDetail200 |

Every mutation uses a unique operation-bound Idempotency-Key and strong `If-Match: "team-<version>"` from a fresh Team read; strings remain exact without Number conversion. Accept/reject require the consent's original base version and a matching fresh Team version; do not silently substitute a newer Team version to rescue stale consent. Intent revision is not Team revision. Inert200 does not increment version. Parse outcome/status rather than assuming every201/200 changed state. Refresh authorized Team and reset affected member/directory cursors after confirmed effects; do not replay effects optimistically.

Server limits remain shared management20/min/account,60/min/Workspace; read60/min/account,300/min/Workspace; immutable receipt slots2000/Workspace,20000/deployment. No client adjustment, automatic retry, pool/timeout changes or caching. Requests remain <=32KiB; mutation/result <=16KiB and directory <=128KiB. No API/schema change is proposed.

## 5. State, authority and mutation recovery

Add dedicated API-backed TeamManagementApi/store/context beside live Team features, separate from NEXUS. Scope includes actor UUID, SessionStore generation, Workspace UUID/current membership identity and authority state, Team UUID, route/request UUID, query/filter and read generation. Separate abort controllers for directory, candidate page, consent detail and mutation. Changing scope aborts outstanding requests and clears private projections/proof/selection/dialogs; compare full scope and operation generation before applying any completion. Aborting a mutation does not establish rollback. No background polling, cross-request authority cache, full-list accumulation or automatic candidate prefetch.

Journal entries retain exact actor/Workspace/Team, operation, member/request target, original key, canonical allowlisted body, original strong If-Match, ambiguous/conflict state and minimal confirmed request reference. Store no cookies, CSRF tokens, passwords, emails, foreign member rows or authority evidence. Persist and verify before sending; only one outstanding mutation per Team in a tab, no cross-tab lock claim. Cross-tab races are resolved by server CAS. Logout/account switch clears private view immediately and follows existing pending-attempt account isolation; same-account recovery after interrupted authentication requires fresh scope and never recreates old authority. Family-bound consent invalidation is respected after rotation/logout/reactivation.

| Outcome | Required behavior |
| --- | --- |
| Confirmed terminal success, including UNCHANGED | Clear confirmed pending attempt; announce exact outcome; invalidate authority/pagers and reload authorized state; no synthetic version increment |
| Network/lost response/timeout/ambiguous503 | Keep original key/body/If-Match/target; manual same-key reconciliation only; closing dialog does not cancel effect |
| 401 | Invalidate session scope/private state; preserve only allowed account-bound recovery metadata under existing journal policy; no background retry |
| 403/404 | Clear denied private projections and owner proof; neutral access-unavailable message; recheck Workspace/Team; do not reveal existence from stale labels |
| 409 | Distinguish structured CONFLICT, CURSOR_STALE and IDEMPOTENCY_RESULT_EXPIRED; expired receipt never auto-rekeys; terminal/eligibility conflict requires current authorized read and explicit resolution |
| 412 | Retain draft; load fresh Team/consent; explicit user comparison and confirmation before a new key/version; stale consent is not silently rebound |
| 428 | Retain draft; require fresh precondition; no automatic new mutation |
| 429 | Honor Retry-After with disabled manual retry; retain original attempt; no automatic resend |
| 400 | Syntax rejection allows explicit draft correction; invalid/expired cursor resets navigation only after explicit reload; never fetch hidden details to explain error |

A same-key replay must remain reachable even when current version has advanced or the current request GET is terminal/replaced404: perform fresh permitted scope checks, then reconcile the original bound attempt rather than replacing its precondition or requiring a new PENDING intent. Permission loss may still deny replay. Former-owner transfer acknowledgement is minimal evidence of their own original receipt only; never refresh hidden management data from it or treat RECORDED as ACCEPTED. Ordinary metadata replay has no former-owner exception.

Consent states PENDING/ACCEPTED/REJECTED/EXPIRED/INVALIDATED are server-derived. Display approximate countdown; client clock alone cannot authorize or certify expiry. At apparent expiry disable decisions and offer fresh read, without expiry mutation. Actual TTL15min; no renew/cancel action. Known request replacement makes old GET404; completed own receipt may still reconcile. Request creation/rejection do not increment Team version. Acceptance invalidates outgoing owner proof and member cursors immediately; verify fresh incoming owner authority before showing management. Restore/reactivation never revives old consent. Owner loss freezes management; suspension/demotion/revocation remain possible outside this UI, and no takeover/recovery action appears.

## 6. Implementation and verification gate

After approval: (1) typed transport and strict parsers; (2) bounded journal compatibility and scoped store; (3) compact owner directory/candidate dialogs; (4) exact consent and lifecycle screens; (5) real service/browser verification. No backend authorization, migration, dependency upgrade or unrelated UI work. Any newly discovered contract conflict returns to architecture review.

| Gate | Required proof |
| --- | --- |
| Frontend unit/regression | Scope-switch delayed completions; abort after commit; storage corruption/full budget; pending v1 compatibility; all error branches; accessible dialogs and no optimistic authority |
| Real PostgreSQL/Valkey/HTTP | Existing Team management/consent/migration/historical-receipt, tenancy, auth/session/Workspace security suites; full caps, outages, both revocation orders and one-time consent remain enforced |
| Real Chromium authenticated flows | Owner add/remove/role, Workspace OBSERVER ceilings, archived directory/restore, active-Project archive conflict; no email leak; unrelated ADMIN/foreign/private denial |
| Recovery/concurrency | Proxy drops response after real commit for each mutation family; original key/body/If-Match replay; 412 draft preservation and explicit resolution; two tabs; accept/reject race; expiry at completion and request replacement |
| Session/revocation | Logout/rotation/account/Workspace/Team switching, delayed reads and mutation completions, successor downgrade/removal, outgoing owner loss, same-account interrupted recovery |
| Cursor/privacy | Actor/filter/limit/Team/Workspace mismatch, stale revisions, expiry, cursor-key failure; one bounded page; no hidden names/rows after denial |
| Responsive/accessibility | Light/dark320/390/768/1024/1440 screenshots of directory/dialogs/consent/archive/conflict/denial; keyboard/focus and overflow assertions |
| Regression/build/scope | Frozen install; frontend lint/typecheck/tests/build; backend required regression gates; unchanged NEXUS, contracts, migrations and limits |

Report exact commands/counts, intermediate failures, screenshots and base/HEAD SHAs. Keep the three existing NEXUS failures separate: missing resolved blocker, empty milestone dependency graph, fan-out3 vs2. Do not adjust expectations. Reuse directory performance evidence; measure new frontend request counts and bounded payloads without restarting optimization or claiming the deferred 250 ms objective passes.

## 7. Review and operational limits

PR #45 merged at `df6c65875fc48a3521cac2754935bb0e04c57a77`, reviewed HEAD `5f962c79cae9ca71472968dc5f3a856c91ada579`. Main matched origin/main and was clean at checkpoint. Original security/migration/performance artifacts are preserved. Directory250ms p95 is explicitly deferred for continued MVP development; observed concurrency50 p95 remains679.83–746.05ms after correction, and concurrency10 is variable (204.30–296.32ms). This is not production-scale certification. No further optimization is authorized.

This architecture review validates scope/contracts/document links only; no proposed browser/security flow is claimed executed. Existing queue/shutdown/advisory/deployment and receipt-retention limitations remain. Orphan/legacy recovery, self-removal, manager role, automatic ADMIN takeover, contact discovery, notifications, Project/Issue authorization and unsupported lifecycle actions remain excluded. Stop for human architecture review before implementation.
