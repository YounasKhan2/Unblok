# BE-00A — Frontend parity and dummy-data audit

## Verified sources
- `src/app/router/AppRouter.tsx`: definitive route registry as inspected on main.
- `src/app/providers/AppProviders.tsx`: AuthProvider → WorkspaceProvider → ProjectProvider and ProjectAuthBridge → SettingsProvider → CollaborationProvider → KeyboardProvider.
- `src/data/mockData.ts`: exports `INITIAL_COMMENTS`, `INITIAL_MILESTONES`, `INITIAL_CYCLES`, `INITIAL_USERS`, `INITIAL_TEAMS`, `INITIAL_PROJECTS`, `INITIAL_ISSUES` and likely further data (full file consumer inventory pending).
- `package.json`: current frontend Vite/React and Vitest; NestJS/Prisma and Docker are planned, not yet installed.

## Actual route families — all must retain parity
| Family | Routes visible in router | Backend/domain obligations (proposed, not implemented) |
| --- | --- | --- |
| Public | `/`, `/product`, `/features`, `/solutions`, `/pricing`, `/security`, `/contact`, `/privacy`, `/terms` | Determine which remain static; contact requires spam protection and persistence/delivery if active |
| Auth | `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/invite/:token` | Credential/session lifecycle, recovery, invite-token validation and redemption |
| Onboarding | `/onboarding`, `/onboarding/workspace`, `/onboarding/team`, `/onboarding/project`, `/onboarding/invite`, `/onboarding/complete` | Idempotent creation and safe invitations |
| My work and inbox | `/my-work`, `/inbox` | Membership-scoped assignments/notifications, persistent read state |
| Projects | `/projects`, `/projects/:projectKey` with overview/issues/board/planning/settings | Project/team ownership, issue list/board/filter mutations, role checks |
| Issues | `/issues/:issueKey` | Issues/comments/assignees/status/priority/attachments/activity with concurrency policy |
| Teams | `/teams`, `/teams/:teamKey` | Workspace-bound teams, membership and ownership |
| Planning | `/cycles`, `/cycles/:cycleId`, `/milestones`, `/milestones/:milestoneId`, `/roadmap` | Cycle/milestone persistence and timeline projections |
| Dependencies | `/dependencies` | Edges, blocker semantics, cycle detection/invariants and graph queries |
| Analytics | `/insights` | Authorized aggregates from stored records, no fabricated counts |
| Settings | `/settings/workspace`, `members`, `teams`, `integrations`, `preferences` | Authorization, membership administration, personal preferences, external integrations as applicable |
| Error routes | Private and public 404 handling | Preserve unauthorized/not-found/empty/error semantics without leaking resource existence |

## Confirmed state/mocking risks
1. `src/data/mockData.ts` defines named fabricated employees, projects, issues, comments, cycles, milestones and teams. Do not migrate that data into live accounts automatically.
2. `src/app/providers/AppProviders.tsx` uses `ProjectAuthBridge` to translate authenticated identity plus workspace membership into a legacy ProjectContext user. Replace carefully only when real API-driven state is proven equivalent; inspect stale-user/logout and workspace-switch behavior.
3. Auth and workspace providers accept initial state injection. Verify development harness, local storage, fallback paths, fixture imports and any production build inclusion.
4. `AppRouter.tsx` shows `AuthDevHarness` only when enabled or in `import.meta.env.DEV`; audit bundling and ensure it never enables privileged production actions.

## Required exhaustive follow-up inventory before BE-00A approval
For **each** route, context, hook, adapter, selector and mutation: record file path, source of data, fake fallback, persistence semantics, expected request/response, auth scope, optimistic update/rollback, websocket event, test coverage, migration owner and exact removal location. Search `INITIAL_*`, `mockData`, `localStorage`, `sessionStorage`, `fake`, `demo`, hard-coded identifiers, timeouts and in-memory stores. Verify any remaining assets and sample text do not misrepresent real business data.

No feature is marked 'backend complete' until tests prove it works with real persisted records **and** the production mock dependency is removed. An empty brand-new account shows genuine onboarding/empty states.
