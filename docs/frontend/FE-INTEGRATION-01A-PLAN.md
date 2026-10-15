# FE-INTEGRATION-01A — approved implementation plan

Base: `8f83887f11a4b84f3500934847d757301023d4ef`; clean preflight; branch `codex/fe-integration-01a`. PR #46 merge `3cf2de0f0da8f72b92a5108ea4a46578006a494a` and PR #48 merge/base tip verified remotely. No rejected separate-shell source was reused.

Product approval includes removal of four demo controls live, necessary real authentication transitions, and the subsequent explicit approval to reuse unsupported page layouts with unavailable wording and non-operational business controls. It does not authorize a new shell, backend APIs, feature work or merge.

## Exact bindings

All paths below are relative to `apps/web/src/`.

| Files | Binding/change |
| --- | --- |
| `app/layouts/AppShellLayout.tsx`, `components/layout/NavigationRail.tsx`, `components/layout/WorkspaceHeader.tsx`, `features/workspaces/components/WorkspaceSwitcher.tsx` | Actual prototype markup consumes the data-neutral `app/shell/ShellBindings.tsx`. No replacement rail/header/switcher. |
| `app/shell/DemoShellBindings.tsx`, `app/providers/AppProviders.tsx`, `app/router/AppRouter.tsx` | Original providers, reset/restore, test-user controls, business overlays and route effects stay behind demo bindings. |
| `app/shell/LiveShellBindings.tsx`, `features/auth/live/LiveRouter.tsx` | Real Session/Workspace stores provide identity and validated scope. No prototype providers live. |
| `features/auth/context/AuthBindings.tsx`, `features/auth/live/LiveAuthBindings.tsx`, `pages/auth/{LoginPage,SignupPage,ForgotPasswordPage,ResetPasswordPage}.tsx` | Real CSRF/cookie client and Model A behind actual auth forms; neutral signup/reset receipts; real recovery email/proof inputs. |
| `pages/onboarding/CreateWorkspacePage.tsx`, `features/workspaces/components/WorkspaceCreationBindings.tsx` | Existing creation form uses real store/journal; unknown outcome retains immutable details and manual retry. |
| `features/workspaces/live/workspaceMenu.ts`, `WorkspacePicker.tsx` | Bounded server discovery plus freshly validated selection; current membership role wins over older discovery. Existing account picker retains pagination/error handling. |
| `pages/{my-work,projects,inbox,cycles,milestones,roadmap,dependencies,insights}/*PageFrame.tsx`, original page files, settings frames, `features/issues/components/IssueUnavailable.tsx` | Extract original outer frame/toolbar/fallback; demo supplies original body unchanged; live uses approved unavailable copy and disabled controls without business records. |
| `features/settings/context/{PreferenceBindings,LivePreferences}.tsx`, existing settings layout/navigation/preferences, `features/settings/domain/preferences.ts` (unchanged) | Reuse existing personal appearance controls and theme resolver; read/write only per-actor appearance preferences live. Notification controls remain unavailable. |
| `features/teams/live/{TeamsStore,TeamsPages}.tsx/ts`, `features/workspaces/live/{MembersStore,MembersPage}.tsx/ts` | Both membership-ID fences; pages reuse parent-validated Workspace scope instead of repeatedly reselecting it. Existing real Team/member UI and APIs remain. |
| `components/modals/{ShortcutsHelpModal,ShortcutsHelpView}.tsx`, `App.tsx` | Separate static help presentation; lazy demo graph. No live issue drawer, command palette, planning/create overlays. |

## Security fences

Session bootstrap is server-only. Every mutation continues through the existing AuthApi CSRF/cookie client and server authorization. Live role labels do not authorize operations. Private frame identity includes actor, session generation, selected Workspace, membership ID, role, membership lifecycle and Workspace lifecycle. Missing/mismatched context renders no private projection. Members and Teams independently invalidate/abort their reads and mutations on authority changes; ignored AbortSignals cannot restore old projections. Existing actor/Workspace/Team journals and exact idempotency/If-Match semantics remain; no automatic mutation retries.

## Sequence and comparison gates

1. Verify clean base and remote merged PRs; capture original prototype before edits.
2. Extract presentation bindings and unchanged demo behavior; connect Session/auth and Workspace creation/selection.
3. Gate unsupported bodies/actions, isolate preferences, add membership fences and one-owner Workspace selection.
4. Run recursive runtime-import closure checks, stale-response/fence tests, frontend checks and disposable-service Chromium/backend regressions.
5. Compare paired desktop 1440×1000/mobile 390×844, light/dark screenshots for shell, directories, dependency page, preferences and auth forms. Require no new layout, navigation order, theme control or demo-record change; disclose pixel differences rather than silently masking them.
6. Package exact results, screenshot evidence, limitations and one coherent commit in a draft PR. Stop for review; no merge/deploy.

Commands and observed results are recorded in [the implementation report](FE-INTEGRATION-01A.md). This plan records the approved scope; it is not permission for a later feature phase.
