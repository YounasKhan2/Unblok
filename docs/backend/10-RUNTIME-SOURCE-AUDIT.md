# BE-00A — Confirmed runtime data-source and integration audit

**Status:** Code-inspected architecture inventory. This is a binding migration checklist, not evidence that all consumers across the complete repository have been enumerated. Any uninspected code paths must be traced before a related feature can be declared integrated.

## Source inspection (main, UX frozen)

| Path inspected | Verified production/prototype behavior | Backend implementation obligation |
|---|---|---|
| `src/app/router/AppRouter.tsx` | Public, auth/onboarding, protected projects/issues/teams/planning/dependencies/inbox/insights/settings routes, not-found handling; `AuthDevHarness` conditional on development flag | Contract/register each route and its mutations; preserve UX and error semantics |
| `src/app/providers/AppProviders.tsx` | Auth → workspace → project auth bridge → settings → collaboration → keyboard providers | Preserve provider ordering effects, correct logout/workspace switch, prevent stale legacy permissions |
| `src/context/ProjectContext.tsx` | Large mutable issue/team/project/planning state; initializes from `../data/nexusEnterprise`; reads/writes browser `localStorage`; includes prototype reset path | Replace each action with authorized persisted API; preserve concurrency/optimistic UX; make server authoritative |
| `src/data/nexusEnterprise.ts` | Active Nexus dataset: teams/projects/users/cycles/milestones/issues/dependencies/comments/activities, plus constant fixture IDs and validator | Remove active runtime production imports **after** each domain integration; do not seed real users |
| `src/data/mockData.ts` | Separate `INITIAL_*` demonstration dataset | Trace consumers; do not assume it is the active ProjectContext seed |
| `src/features/auth/context/AuthContext.tsx` | Imports `defaultMockAuthAdapter` and `SEED_PROTOTYPE_USERS`; stores prototype auth in `localStorage` | Real sessions, recovery, expiration, revoke, role checks; replace all faux authentication |
| `src/features/auth/domain/mockAuthAdapter.ts` | Deterministic local adapter and invitations | Implement server account lifecycle and one-time invite tokens; no demo account production login |
| `src/features/workspaces/context/WorkspaceContext.tsx` | Injects `defaultWorkspaceAdapter`; maps current auth and active membership | Server-authorized list/switch/create/archive; explicit empty/error loading states |
| `src/features/workspaces/adapters/mockWorkspaceAdapter.ts` | Uses `../data/mockWorkspaces` seeds | Replace workspace/membership mutation adapter, validate cross-tenant boundaries and last-admin guard |
| `src/features/settings/context/SettingsContext.tsx` | `INITIAL_PENDING_INVITATIONS`, `INITIAL_REPO_INTEGRATIONS`, `INITIAL_WEBHOOKS`, `INITIAL_WORKSPACE_SETTINGS` plus preference state | Persist invites/settings/integration credentials securely; inspect all persistence helpers and policy checks |
| `src/features/collaboration/context/CollaborationContext.tsx` | Derives Inbox from issues/activity/comments and uses receipt storage | Persist notification/receipt ownership and read/archive state; avoid fabricated inbox on cold account |
| `src/features/collaboration/domain/receiptStorage.ts` | `DEMO_RECEIPTS_BY_USER` and client storage helpers | Move receipts server-side and enforce user/workspace ownership |
| `src/pages/inbox/InboxPage.tsx` | Uses collaboration state, search params, keyboard and grouping | API-backed filtered/paginated Inbox and keyboard/navigation parity |
| `src/pages/insights/InsightsPage.tsx` | Derives `selectWorkspaceInsights` from project state | Authorized database aggregates; tested consistency of computed metrics |
| `src/pages/dependencies/DependenciesPage.tsx` | Computes graph/summary/matrix using selectors over project state; provides add-dependency dialog | Persist graph edges, cross-tenant guards, cycle/hard blocker invariants, bounded graph queries |
| `src/context/nexusFixtureReset.ts` | Prototype reset/backups for `unblok_`/`kite_` browser storage namespace | Remove from production import graph after replacing state; preserve test-only reset facility separately |

## Explicit risk corrections

The original inventory mentioned `src/data/mockData.ts` but **the active ProjectContext imports `src/data/nexusEnterprise.ts`**. Treat both as separate cleanup candidates. Never delete Nexus fixture or its reset tooling until all production consumers are migrated, tests characterize reset effects, and runtime paths are detached.

Auth and workspace contexts are mock-backed even where UI resembles complete flows: **UI functionality is not backend functionality**. Audit must cover failed and revoked sessions, mixed tenant membership, URL tampering and local-storage replay.

The Inbox is a **derived projection** with browser receipt persistence. Migrating notifications must explicitly decide event source/replay/idempotence and retain unread/archived semantics.

Insights and dependency views perform computations over in-memory data. Backend adaptation must define whether selectors remain client projections for bounded datasets or switch to server aggregates; no speculative claim of numerical parity without test fixtures.

## Per-route implementation map (required reconciliation)

| Domain | Read contract | Mutation contract | Authorization |
|---|---|---|---|
| Auth and onboarding | current session, invitation details, onboarding progress | signup/login/logout/recover, create workspace/team/project, accept invitation | account identity, token expiry/replay checks |
| Workspaces/teams/members | workspaces, memberships, directory, team detail | switch/create/archive, invite/roles/team changes | workspace membership, last-admin rule, cross-workspace ownership |
| Projects/issues | project views, issues, comments, activity | project creation/settings, issue edits/status/assignee/comment actions | effective workspace/team/project membership; version checks |
| Dependencies | edges, summaries, dependency risks | add/remove edges and blocker transitions | tenant-safe endpoints, graph invariant locking |
| Cycles/milestones/roadmap | scoped plans, timelines | create/update/assign/rollover | team/workspace membership, protected planning changes |
| Inbox | scoped items, counts, receipts | read/archive/unarchive/mark-all | recipient ownership; event/source idempotency |
| Insights | performance/delivery metrics | mostly read-only; filters | scope-safe aggregate queries |
| Settings/integrations | current settings and integration state | invitations, preferences, webhooks, credentials | permission matrix; redact secrets |
| Attachments | scoped metadata/download links | multipart/presigned uploads and deletes | object ownership, size/type checks, expiry |

**These are contract categories, not final endpoint signatures**. Exact fields, callbacks, error handling and hooks must be traced before BE-00B approval.

## Exit criteria and unresolved verification

The repository evidence above is **not proof of an exhaustive import graph**. Remaining work for individual feature migrations includes cataloguing all nested consumers in `src/features/**` and `src/pages/**`, every `INITIAL_*` constant, storage key, optimistic rollback path, settings preference persistence, accessibility/keyboard interactions and all implicit demo fallback branches.

No production backend integration can be marked complete without an explicit consumer-level ledger, no runtime fixture imports for the migrated vertical slice, test-backed permissions, durable data and no lost frontend capabilities. Overall BE-FINAL must mechanically inspect the production bundle/import graph for every mocked source. This limitation must stay visible in reviews.
