# BE-00A — Verified frontend integration matrix and implementation handoff

Audit baseline: UX v1 frozen `main` at `2e38ac0e9a50cac41b7de3e9a40a6d4e306657a1`. Status: **planning documentation**, not backend implementation, not verification of every transitive import.

## Domain → UI → live frontend source → migration boundary

| Domain / exact screens | Confirmed frontend source | Live behavior to preserve | Backend boundary and mock elimination |
|---|---|---|---|
| Login, signup, password recovery, invite | `AuthContext.tsx`, `mockAuthAdapter.ts`, `AppRouter.tsx` | Authentication states, redirect, session expiry, reviewer harness | Account/session/recovery APIs; remove seed reviewer users and localStorage-auth; harness test/dev only |
| Workspace onboarding/switch/archive | `WorkspaceContext.tsx`, `mockWorkspaceAdapter.ts`, `mockWorkspaces.ts` | Explicit switch, membership filtering, archived state, onboarding | Workspace/membership CRUD with server-side ownership; remove seed workspace adapter |
| Projects directory, overview, issues, board, planning, settings | `ProjectContext.tsx`, `ProjectsDirectoryPage.tsx`, `ProjectIssuesPage.tsx`, `ProjectBoardPage.tsx` and selectors | Project creation, dense views, filters/URL sync, board actions | Project/issue scoped endpoints; no in-memory authority, indexed page results |
| Issue detail / My Work | `ProjectContext.tsx`, `MyWorkPage.tsx` and selectors | Status, priority, assignee, comments, dependency guards, selection/drawer UX | Issues/comments/activity persistence and atomic conflict checks |
| Teams + settings members | `SettingsContext.tsx`, `MembersSettingsPage.tsx`, `ProjectContext.tsx` | Team create/edit/archive/restore, member role/invites | Server RBAC, cross-workspace FK guards, last-admin invariants |
| Dependencies | `DependenciesPage.tsx`, dependency selectors, `ProjectContext.tsx` | Graph, matrix, blockers, hard completion guard, add dialog | Transactional edges and concurrency-safe cycle/blocked completion validation |
| Cycles and milestones | `CyclesPage.tsx`, `MilestonesPage.tsx`, `ProjectContext.tsx` | Team filters, create, assign, rollover, schedule | Persist planning and enforce membership/rollover rules |
| Roadmap | `RoadmapPage.tsx` and `selectRoadmapProjection` | Timeline/mobile agenda, date filters, scheduling modal | Authoritative schedule mutations and bounded roadmap projection |
| Inbox | `InboxPage.tsx`, `CollaborationContext.tsx`, `receiptStorage.ts` | Grouping, unread, mark-read, archive/unarchive, keyboard navigation | Durable recipient-owned receipt records; remove `DEMO_RECEIPTS_BY_USER` |
| Insights | `InsightsPage.tsx`, `selectWorkspaceInsights` | Filtered summaries, bottlenecks, delivery health, cross-team matrix | Scope-safe aggregate queries with parity fixture tests |
| Workspace settings/integrations/preferences | `SettingsContext.tsx`, `MembersSettingsPage.tsx`, `IntegrationsSettingsPage.tsx` | Repo connects, webhook create/toggle/delete, preferences, invites | Persistence, secret encryption, admin authorization; replace INITIAL_* settings and browser-only state |
| Public pages | `AppRouter.tsx` | Existing public pages/links, terms/privacy/security/contact | Primarily static; explicitly verify contact submission before deciding API |

## Important verified data flow

`ProjectContext.tsx` sources `INITIAL_ISSUES`, `INITIAL_DEPENDENCIES`, `INITIAL_TEAMS`, `INITIAL_PROJECTS`, `INITIAL_USERS`, `INITIAL_ACTIVITIES`, `INITIAL_CYCLES`, `INITIAL_MILESTONES`, `INITIAL_COMMENTS` from `src/data/nexusEnterprise.ts`. It loads and saves browser records across issues, dependencies, projects, activities, teams, users, saved views, cycles, milestones and comments. **Migration functions merge missing seed records** into existing browser content. That automatic merge must never run on API records.

`SettingsContext.tsx` uses stored-or-initial workspace settings, invitations, integrations and webhooks; has a `resetSettingsToDemoData` path. Each mutation currently updates frontend-held collections. The server must own changes before removing them. `AuthContext.tsx` persists status/user/membership client-side; this is *not* sufficient authentication. `WorkspaceContext.tsx` consumes a mock workspace adapter, regardless of how complete UI onboarding looks.

## Required compatibility and integrity scenarios

For every migrating slice test: unauthenticated; user in foreign workspace; revoked membership; user with role insufficient for write; missing/archived resource; empty first-run account; transient API error without fake fallback; duplicate request; optimistic update rollback; simultaneous edit; deleted/moved team/project; disabled/revoked integration; keyboard/drawer navigation and mobile layout. For issue dependencies test cycle prevention and blocked completion across concurrent requests. For invites test expiration, replay, last-admin and role transition semantics.

## Exact production cleanup checkpoints

1. Remove `defaultMockAuthAdapter` / `SEED_PROTOTYPE_USERS` usage in production auth; keep only test scoped fixtures.
2. Remove `defaultWorkspaceAdapter` and `mockWorkspaces` from production provider and onboarding.
3. Move `ProjectContext` reads/writes from `localStorage` to typed API operations. Remove seed-merge functions, Nexus default selected issue and demo reset from runtime.
4. Move `SettingsContext` initial workspace/invite/repo/webhook values to real server data; remove `resetSettingsToDemoData` from runtime.
5. Replace browser Inbox receipt storage and `DEMO_RECEIPTS_BY_USER` with recipient-owned API state.
6. Verify whether `mockData.ts` has any remaining runtime consumers; remove production links, not unrelated tests.
7. Verify no demo fixture passes through API failure/error/unauthorized pathways. Do not automatically populate new workspaces.

## Limits / BE-00B handoff

This is a documented **route/state-boundary audit of directly inspected sources**, not a machine-produced exhaustive import graph. Exact per-callback DTO fields, fine-grained policy matrix, all nested component consumers, type design and latency budgets remain BE-00B contract decisions. These limitations **must not be silently marked done**; BE-00B cannot authorize a vertical slice until its route → handler → context → storage → DTO → auth → tests matrix is reconciled against actual code.

The BE-00A deliverable is architecture guidance and source-verified migration map, not code changes. At backend completion, zero fabricated production data is an independently enforced release gate.
