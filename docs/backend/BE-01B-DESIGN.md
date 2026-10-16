# BE-01B — Workspace administration contract and security design

Status: **Phase A design for PM/security review; no endpoints implemented.** Base `origin/main`: `57c4a1d03518c2623553e69150c0e943451ad25f` (merged PR #49). Branch: `codex/be-01b`. This document does not claim FE-INTEGRATION-01B is unblocked.

## Implementation gate: incompatible requirements

The approved prototype is required to remain immutable, but two existing invitation behaviors cannot be fulfilled while preserving the explicitly required security contracts:

1. `apps/web/src/pages/auth/InvitePage.tsx` renders “Workspace invitation links expire after 7 days for workspace security.” The existing database CHECK in `packages/database/prisma/migrations/20261013000000_workspace_memberships_invitations/migration.sql` enforces `expires_at <= issued_at + interval '24 hours'`; existing delivery copy and tests also specify 24 hours. Extending that lifetime to match the screen would change an existing security guarantee. Returning authoritative 24-hour expiry does not make the unchanged seven-day screen truthful.
2. The same prototype consumes `InvitationDetails.isExistingUser` and pre-authentication invitation validation/preview states. The new requirement explicitly forbids revealing account existence or invitation validity to unauthorized callers. Public account/validity-specific preview cannot be added without violating that requirement. Authentication alone is insufficient: a random authenticated account must not inspect another recipient's invitation.

**Proposed boundary needing confirmation:** keep 24-hour proofs, keep public issuance/acceptance neutral, omit account-existence disclosure entirely, and restrict detailed proof preview to the verified matching recipient or scoped authorized administrator. Record that the later frontend milestone needs approved copy/transition exceptions. No frontend work is part of BE-01B. This is not a request to relax security or a claim that every administration capability depends technically on preview; it is the decision needed before declaring the complete contract package compatible with the immutable prototype.

The user's Phase B condition is “After confirming contracts are consistent with existing architecture.” That confirmation cannot include compatibility with the invitation screen as presently specified. Phase B is therefore not represented as started or completed. The remaining design below is concrete and reviewable rather than an implemented API commitment.

## Source and architectural findings

- FE preflight read in full: `D:\Full_Stack_Apps\Unblok-FE-INTEGRATION-01B-20261016\FE-INTEGRATION-01B-PREFLIGHT.md`.
- Transport/application: `apps/api/src/modules/workspaces/transport/workspaces.controller.ts`, `application/workspaces.ts`, `workspaces.module.ts`. Keep these ownership/layer boundaries; transport validates, application composes Sessions/rate admission, Tenancy owns closed persistence capabilities.
- Persistence/authority: `packages/database/src/{tenancy,workspaces,workspace-memberships,workspace-invitations,auth-fences,team-management,teams}.ts` and existing migrations. No controller ORM access, no parallel membership/invitation store and no prototype authorization.
- Shared schemas: `packages/contracts/src/index.ts`, `teams.ts`. Legacy member DTOs and invitation bodies are strict. Adding fields to legacy responses can break existing clients; broadening legacy invitation ADMIN issuance also contradicts an existing explicit contract assertion.
- Existing Workspace model has **no separate Workspace owner**. Protect the final active Workspace ADMIN. Teams do have explicit owners and owner-consent transfer contracts; do not invent a Workspace OWNER role or bypass Team ownership.
- Current membership rows are restrictive historical FK targets for issues, dependencies, invitations, Teams and transfer intents. A general hard-delete implementation is unsafe and often impossible. Existing SUSPENDED membership blocks invitation reactivation.
- Existing invitation authority is immutable; canceled/consumed proofs cannot be revived. Worker delivery uses a committed lease and revalidates eligibility; an external send already admitted cannot be recalled. Redemption is authoritative.
- Existing `workspaceBoundary` uses serializable transactions, sorted user/family authority locking, final authority revalidation, bounded lock/statement deadlines and explicit conflict handling. Reuse it and its selector mechanism; no automatic mutation retries.

## Prototype capability mapping and proposed routes

All routes below are **proposed**, not registered or callable. Preserve existing v1 membership-list, issuance and acceptance routes, schemas and rejection assertions. Add strict administration projections/actions in the same Workspaces module over the same tables; this is contract evolution, not a parallel system.

Prefix A: `/api/v1/workspaces/:workspaceId/administration`.

| Prototype need | Proposed capability |
| --- | --- |
| MembersSettingsPage directory, email/name/role/Team filters and totals | `GET A/memberships`: scoped server filtering, bounded keyset page, authoritative counts and private contact fields. |
| MemberRow Team badges with potentially many assignments | `GET A/memberships/:membershipId/teams`: bounded assignment pages; directory includes a bounded first assignment page and explicit continuation, never a fake “No team.” |
| MemberRow Workspace role selector | `PATCH A/memberships/:membershipId` body `{role}`; UUID Idempotency-Key and revision If-Match required. |
| Workspace removal where permitted | `DELETE A/memberships/:membershipId`; no arbitrary body. Soft removal, retain historical identity/references, deny access immediately. No new frontend Remove control. |
| Invite modal ADMIN/MEMBER/OBSERVER and Team selection | `POST A/invitations` with `{email,role,teamIds}`; canonical sorted unique bounded Team IDs, scoped eligibility validation and generic 202 acknowledgment. Legacy issuance remains MEMBER/OBSERVER only. |
| Permitted Team choices without guessing privileges | Paginated eligible-Team projection, or an explicitly extended existing Team contract returning authoritative invitation-assignment capability. Final transport placement must be recorded before implementation; do not infer capability from visibility. |
| Pending/history rows and status/counts | `GET A/invitations`: paginated, authoritative lifecycle/delivery state and dates, no proof/token digest/internal credential/session fields. |
| Scoped administrator preview | `GET A/invitations/:invitationId`: same private projection and admission as listing. |
| Resend | `POST A/invitations/:invitationId/resend`; rotate to a new immutable proof generation atomically, revoke predecessor, enqueue real outbox work. Acknowledge enqueue/request, never claim external delivery. |
| Revoke | `POST A/invitations/:invitationId/revoke`; idempotent cancellation of outstanding generation; consumed invitations do not remove existing membership. |
| Recipient lifecycle preview after verified ownership | `POST /api/v1/workspace-invitations/preview` body `{token}`. Detailed result only after proof validation and verified matching email; no token in URL/logs and no `isExistingUser` response. |
| Accept, signup/login/verification continuation | Keep existing `/api/v1/workspace-invitations/accept` and Model A authentication. Add atomic assignment support for new invitation generations without changing public acknowledgment or v1 proof behavior. |

## Authorization matrix

| Actor/state | Reads | Writes / preview |
| --- | --- | --- |
| Anonymous or invalid/revoked session | No private directory/invitation data | Existing uniform authentication/CSRF behavior; never disclose target account/proof state. |
| Foreign Workspace, MEMBER, OBSERVER, suspended or removed actor | No administration directory, counts, contact fields or invitation management | Concealed not-found response, no mutation. Team membership does not substitute for Workspace ADMIN. |
| Active Workspace ADMIN | Private scoped administration reads; consider verified-admin admission for the new email-bearing projection, preserving legacy read admission unchanged | Active Workspace and verified identity required for issuance/resend and proposed administration mutations. Every request revalidates primary authority. |
| ADMIN of archived Workspace | Scoped historical reads | No administration writes/issuance/acceptance into archived Workspace. |
| Verified matching recipient possessing the complete authentic proof | Limited private preview for their own invitation, including terminal lifecycle when permitted | Existing acceptance fences remain; never infer grant from preview or generic response. |
| Wrong/unverified recipient or malformed/unknown/unverifiable proof | No detailed preview | Neutral preview/accept acknowledgment for authenticated ineligible callers; no account-existence field or validity oracle. Authentication failure itself stays uniform. |

Workspace ADMIN is not automatically Team owner. Initial assignment is permitted only when the issuer has the existing owner-level Team management authority, including an active explicit MEMBER Team ceiling. Validate every selected Team against the same Workspace, lifecycle, quarantine and ownership rules. Reject the entire request if any Team is unauthorized; do not silently drop assignments. Recheck at acceptance; ownership transfer/demotion/archival can invalidate the intended grant.

## Projection, filtering and pagination contracts

- Member rows: membership ID, display name, nullable **contact email** from the existing User profile, Workspace role/status, joined time, removed time if introduced, row/revision token and bounded Team assignment projection. Keep membership ID distinct from user ID; “You” derives from context self-membership ID. Do not expose password-credential addresses, verification flags, provider IDs, auth epochs or session families merely to fill a prototype row.
- Member queries: bounded `limit`, signed `after`, status, role, literal name/email search and optional scoped Team ID; deterministic `(joinedAt,id)` order with explicit null handling. Apply filters server-side, not only to a frontend page.
- Counts: separate active-membership, matching-member and pending-invitation counts from database aggregates, in the same transaction snapshot as the page. Define active as membership lifecycle, not a promise of a live authenticated session. No page-length-as-total shortcut.
- Invitation rows: ID/generation linkage, recipient email, intended Workspace role, requested Team projection, issued/expires/consumed/revoked/superseded times, derived lifecycle and distinct delivery state. PENDING/EXPIRED/REVOKED/ACCEPTED/SUPERSEDED are not mail-delivery states. QUEUED/DELIVERED/FAILED are observations, not membership grants. Retired issuer/key/Team authority must not be mislabeled actionable.
- Bind cursors to actor, Workspace, operation/version, normalized filters, sort, limit, directory/security revisions, last key, issued/expiry and an explicit snapshot time for time-derived invitation status. Reuse independent Workspace cursor keys, purpose separation, constant-time MAC checks, prior-key lifetime limits and 15-minute maximum cursor lifetime.
- Member or invitation mutation invalidates affected pagination revisions. Name/contact-email/Team metadata changes affecting projected search/rows need revision handling too; document triggers and lock order rather than assuming membership changes cover everything.
- Maximum page and nested assignment sizes and response byte budgets must be explicit. Provide assignment continuation when the first bounded slice is incomplete; never truncate and label it complete. No unbounded ORM include trees or fetching an entire Workspace to compute a page.
- Queries stay constant in number as page size grows: bulk joins/lateral bounded projections, scoped aggregate queries and indexes. Exact counts may scan matching index entries; pagination does not make counts O(1). Benchmark them honestly.

## Mutations, errors, audit and concurrency

- Require exactly one valid UUID Idempotency-Key per mutation. Use independent operation domains, canonical payload digest, actor + Workspace + resource binding and preserved original preconditions. Same key/different body conflicts. Reauthorize before replay; a receipt cannot restore revoked authority.
- Require a fresh If-Match revision for privileged edits/resend/revoke/removal. A replay of an already committed matching request is handled before a newly stale precondition, but only after current authorization. Distinguish 428 missing precondition, 412 stale revision, 409 semantic/serialization conflict, 429 Retry-After, and 503 unknown outcome/unavailability. No automatic retries.
- Preserve legacy 202 `{status: accepted}` for public issuance/acceptance. Detailed administration metadata belongs only to authorized reads, not to a public acknowledgment. Error text must not disclose hidden Workspace existence, recipient account existence, proof content or credentials.
- Reuse/extend the existing durable receipt mechanism and immutable authority rules; do not create a second invitation ledger with conflicting truth. Store digests and nonsecret outcome identifiers, never raw proofs, password/session material or unnecessary duplicated recipient payloads. Retention/receipt expiry needs an explicit contract; no deletion of existing audit/history.
- Discover involved user/family selectors without granting authority, lock them in the established sorted order, then acquire the Workspace serialization gate. Re-read authorization under those locks, perform row/Team/invitation/receipt work in a documented consistent order and revalidate the principal before commit. Never acquire arbitrary recipient/owner user locks after Workspace locks.
- Last active ADMIN cannot demote/remove themselves or be removed by a contender leaving no other administrator. Existing database last-admin protection remains; concurrent mutations serialize/revalidate, rather than counting on a stale client list.
- Team owners cannot be demoted/removed into an ineligible state while still owning protected Teams. Require the existing consent-based ownership transfer first; do not auto-transfer/archive/delete Teams or bypass ownership through Workspace administration.
- Proposed removal is a terminal recorded administrative lifecycle over retained membership identity, not hard deletion of referenced history and not a fake success from a restrictive-FK failure. Existing SUSPENDED/removed memberships remain ineligible for invitation reactivation. Readmission/restoration is a separate unresolved product policy; no restore endpoint is implied.
- Membership change/removal immediately changes server-side Workspace authorization and discovery revisions. Do not let one Workspace administrator revoke a user's unrelated global sessions; a still-valid login cookie is not continuing authorization for that Workspace. In-flight protected work must either serialize before the administrative change or fail/roll back after current authority revalidation.

## Invitation acceptance and Team assignments

1. Preserve existing v1 proof parsing, HMAC/digest domains, key independence, inviter identity/membership/epoch binding, credential ownership checks, attempt limits and neutral behavior. New ADMIN/assignment-bearing contracts must not weaken the legacy schema assertion rejecting ADMIN.
2. New generations need immutable intended-role/Team-plan binding. Proposed versioned proof metadata binds canonical assignment digest, generation, issuer authority and recipient email. Existing rows remain version 1; worker and acceptance share version-aware proof generation/validation. No raw token is persisted, returned by admin listing, logged or placed in a queue.
3. Acceptance locks/rechecks recipient, issuer, Workspace and sorted selected Teams under the existing serializable boundary. Verify proof, expiry, unconsumed/uncanceled status, current issuer epoch/verified credential/admin membership, recipient verified email, and each Team's current eligibility/issuer authority.
4. Create/activate the permitted Workspace membership, apply intended Team joins/ceilings and consume the invitation **in one transaction**. Any assignment conflict or missing/foreign/ineligible Team rolls back all effects; no partial join, membership-only grant or consumed-but-unassigned success.
5. Existing ACTIVE membership is never elevated or assigned additional Teams by replaying an invitation. Existing SUSPENDED/removed membership stays denied. Duplicate and concurrent acceptance produces at most one authorized effect; do not overwrite an existing role/Team ceiling.
6. Resend creates a fresh generation and cancels predecessor in the same transaction, with fresh delivery work and immutable linkage/history. A stale worker lease/late delivery acknowledgment cannot uncancel or redeem its predecessor. Revoke and acceptance serialize: whichever commits first defines the result; revoke after consumption does not retroactively remove membership.
7. A worker send may already be in flight at revocation. Do not claim the email was recalled or delivered; redemption rechecks database authority and blocks canceled proofs. Preserve lease fencing and bounded retry policies.

## Proposed additive persistence changes

No migration was created or applied in Phase A. All 12 existing migrations and existing data remain untouched.

- Add immutable versioned invitation generation/assignment metadata and normalized same-Workspace Team assignment relations with composite foreign keys, uniqueness and immutable-plan enforcement. Preserve all old invitation rows and v1 proof validity; do not mutate old roles, keys or expiry.
- Add soft-removal metadata/version to Workspace membership if approved, with lifecycle checks and retained historical references. No new Workspace-owner concept and no migration reset/drop/recreation.
- Add necessary directory/invitation revision state and precise set-based advancement for changed projected data. Reuse existing policy revisions for authorization invalidation; avoid needlessly invalidating unrelated security cursors on every mail lease attempt.
- Extend durable receipt/audit fields/operation domains with backward compatibility and immutable outcomes. Add scoped keyset/filter/relation indexes; search index choice must follow actual EXPLAIN evidence, not a blanket extension/dependency upgrade.
- Upgrade tests must insert representative v1 proofs/receipts/history before applying the additive migration, then verify preservation, successful eligible v1 redemption, intended new constraints and failure of unauthorized/raw cross-Workspace grants. Migration deployment/locking costs require measurement; no zero-downtime or shared QA migration claim.

## Phase B file plan after the decision gate

| Area | Files / intended work |
| --- | --- |
| Shared schemas | Add a Workspace administration contract module under `packages/contracts/src/`, export from `index.ts`; keep strict legacy schemas and existing security assertions intact. Include OpenAPI/registry evidence for new versioned contracts. |
| Application/transport | Extend the existing Workspaces module/application and transport handlers; register new handler admission, response schemas, private no-store headers, duplicate-header checks and existing CSRF/rate controls. No controller DB access. |
| Closed domain capability | Extend `packages/database/src/tenancy.ts` and add a focused Workspace administration helper; reuse `workspace-memberships.ts`, `workspace-invitations.ts`, auth-fences and Team ownership functions, not a parallel repository or authorization policy. |
| Persistence | Additive Prisma schema/migration and regenerated client only after design consistency is confirmed. Keep prior migration files immutable. |
| Worker | Narrow version-aware proof/delivery support through the existing invitation outbox/capability. No second queue/transport or mail-policy bypass. |
| Tests/evidence | Focused administration HTTP/DB/contracts/concurrency/query-plan tests under existing backend verification structure, plus existing auth/Workspace/Team suites. Use owned disposable PostgreSQL/Valkey/Mailpit; no shared QA or frontend work. |

## Phase C acceptance and performance plan

- Permission matrix: verified/unverified ADMIN, MEMBER, OBSERVER, suspended/removed, anonymous, disabled/revoked session, foreign Workspace, archived Workspace and wrong Team owner; direct HTTP requests with forged IDs/roles/cursors/headers, not only UI visibility.
- Public neutrality: nonexistent/already-member/wrong-account/unverified/expired/canceled/used/retired-key cases preserve appropriate neutral public acknowledgments; no proof/identity/session metadata leaks. Authorized preview is tested independently from acceptance and account existence is never returned.
- Mutation safety: duplicate same-key request, key/body/resource/precondition mismatch, lost response, self-demotion/removal, concurrent final-admin edits, target owner transfer, revoke-versus-accept, resend-versus-accept and late old-worker acknowledgment. Explicit contention gates/controlled transactions, not timing-only sleeps.
- Assignment atomicity: multiple permitted Teams; foreign, archived, quarantined, transferred or removed Team; unauthorized Team ownership; existing ACTIVE/SUSPENDED/INVITED membership; replay and concurrent redemption. Assert membership, joins, proof consumption, receipts and revisions together.
- Directory correctness: private contact email/null handling, membership/user identity distinction, active/matching/pending counts, all server filters, deterministic null/tie ordering, cursor tampering/purpose/actor/Workspace/filter/limit/revision/expiry/key rotation, nested Team continuation and response byte caps.
- Scalability: representative 10k/100k member/invitation data, small and maximum pages, skewed role/Team/search/expiry filters. Record `EXPLAIN (ANALYZE, BUFFERS)`, SQL statement counts, rows read/returned, response bytes and latency distribution. Demonstrate fixed query count versus page size and no N+1. Do not assert an invented SLO or unexecuted performance pass; existing statement/transaction deadlines remain.
- Regression: frozen dependencies, backend typecheck, lint/architecture, contract suites, authentication/session, Workspace membership/invitation, Team management and tenancy/fence suites with isolated services. Retain original assertions and report failures/skips separately.
- Frontend source/UX is out of scope. The historical three NEXUS failures, architecture timeout, queue/SIGTERM limitations and unresolved 01A navigation interruptions remain documented; none is fixed or freshly certified by this design.

## Executed verification and current limits

- `git fetch origin --prune`; base/clean-state/branch checks passed.
- `bun test --no-env-file scripts/backend/workspace-invitation-contracts.test.ts`: **1 passed / 0 failed, 14 assertions**. This confirms current field vocabulary, the existing ADMIN rejection and independent-key controls; it is not evidence that proposed endpoints exist.
- No endpoint, migration, database, worker, shared QA, Mailpit, frontend, package or dependency change. No integration/concurrency/performance/browser suite executed for BE-01B; no performance or implementation pass claimed.

Review requested: confirm the privacy-safe 24-hour/authorized-preview boundary and that the later frontend milestone may document/seek the necessary invitation-copy/transition exceptions. Removal/readmission and exact projection policy need explicit recording before their relevant implementation. Do not merge/deploy or resume FE-INTEGRATION-01B from this design-only draft.
