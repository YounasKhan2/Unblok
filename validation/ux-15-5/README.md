# NEXUS replacement review guide

The NEXUS fixture is now wired to the application's canonical ProjectContext, workspace and settings fixture entry points. 300 issues, 180 dependencies, 12 cycles, 10 milestones and 35 fictional users are generated deterministically.

**Safe local reset**: Existing browser localStorage is never automatically destroyed. In a local development console run:

```js
// The app must expose/import the reset helper through a local dev harness.
// resetPrototypeToNexus(window.localStorage, true);
// Then fully reload to reinitialize prototype adapters.
```

The helper is exported from `src/context/nexusFixtureReset.ts`; it backs up all application-prefixed keys and supplies a reversible restore helper. It is **not** currently wired to an interactive reset button.

**Known limitations**: Authentication accounts remain separately seeded for login compatibility; Inbox/notifications may still use separate fixtures; legacy isolated tests still import `mockData.ts`. Workspaces remain designed for multi-tenancy but only one organization is seeded. Existing session storage still takes precedence until an explicit reset.

**Human review gate**: Run `npm run lint`, `npm test -- --run`, `npm run build` and browser QA. These have not been independently run in the connector-only environment. Do not merge without passing gates.
