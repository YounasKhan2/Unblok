# Backend roadmap and mock-removal strategy

- **BE-00A** (this phase): inspect and document route-to-feature/state mapping; enumerate data sources and consumer dependencies; establish engineering policies, security/integrity requirements and migration quality gates. Docs only. Human review required.
- **BE-00B**: approve domain model, table constraints, API action contracts, threat model, auth session strategy, performance and recovery targets. Docs first.
- **BE-01**: implement Docker foundation and NestJS skeleton, health endpoints, typed env, PostgreSQL Prisma migrations, Valkey/BullMQ, RustFS adapter, Mailpit adapter, integration test harness. No active frontend replacement until API vertical slices are reviewed.
- **BE-02**: actual auth, account lifecycle, onboarding and workspace membership. Replace fake identity, local-only memberships and legacy user bridge carefully; preserve navigation behavior.
- **BE-03+**: integrate one coherent domain slice at a time—teams/projects, issues/comments/activity, dependencies, cycles/milestones/roadmap, inbox/notifications, insights, settings and integration paths—based on approved dependency order.
- **BE-FINAL**: prove the production bundle/import graph contains no dummy business data, fixtures, fake fallbacks or automatic seed injection; prove all audited routes have real or genuinely empty states; full security, load, restore and e2e evidence.

### Per-feature removal ledger (required)
For each feature write: `route → component → store/hook → mock source → API contract → entity/query → authorization → persistence → tests → removed import/fixture → review SHA`. A slice can retain explicitly isolated **test** fixtures, but never production fallback fixture loading. Remove fake data in same integration PR after proving API parity; do **not** delete all mocks prematurely and break the frozen frontend.

### Approval hold
BE-00A remains a draft until the full import graph has been searched for dummy data and every write path cataloged. BE-01 is not authorized merely because a PR exists.
