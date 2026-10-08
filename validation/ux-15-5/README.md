# NEXUS fixture replacement

The prototype now starts from the deterministic NEXUS Commerce fixture in `src/data/nexusEnterprise.ts`: 35 users, 6 teams, 1 workspace, 1 project, 300 issues, 12 cycles, 10 milestones, 180 dependencies, 420 comments, and 860 activities. Work is distributed across all six functional teams, so cross-team dependency pressure and the team matrix have real linked data. Each milestone has a connected, branching issue dependency graph. Inbox items are derived from fixture activity and comments rather than maintained as a separate notification seed.

The roadmap and timeline demo open on the NEXUS reference week (October 5–11, 2026) with a staggered schedule across teams; activity history is ordered newest-first. Milestones remain ordered as a delivery sequence with fixed, repeatable target dates.

The four fast-sign-in accounts use the matching NEXUS identities. Previous `@unblok.dev` sign-in addresses remain accepted as compatibility aliases; newly authenticated records use the canonical `@nexus.example` address. Legacy multi-workspace organizations and records remain only in contract-test fixtures so isolation and membership edge cases can still be tested without seeding them into the app.

## Reset and recovery

In the app's navigation rail, choose **Reset to NEXUS** and confirm the prompt. The app backs up all `unblok_` and `kite_` local-storage entries, clears those entries, and reloads into the canonical fixture. A login may be required after reload. If a backup exists, choose **Restore previous state** and confirm to restore the latest snapshot; the state being replaced is backed up as an undo point. Backups remain in local storage until the browser data is cleared.

Reset and restore are local prototype tools, not a server-side migration. They do not touch unrelated local-storage keys. A reset that cannot create or apply its backup reports an error in the UI.

## Validation

The fixture module validates reference integrity, team/cycle ownership, issue lifecycle, and dependency acyclicity. Fixture tests also verify populated milestone graphs, cross-team matrix edges, and the current-week schedule. Validation performed:

- `npm run lint` — passed.
- `npm test -- --run` — passed (48 test files, 698 tests).
- `npm run build` — passed. Vite reports its existing large-chunk advisory (>500 kB).
- Local HTTP smoke check — returned 200.

Interactive browser QA, screenshots, and performance measurements were not completed, so no visual or performance claims are made.
