# Unblok — UX v1 Baseline Freeze

**Decision:** Product owner approved freezing major frontend UX and features on 2026-10-08. UX-16 is waived as a pre-backend blocking gate.

**Frozen runtime baseline:** `7a7ffb0afaf5059b0472162d106e17406aaffc14` on `main` (post Teams typography consistency merge).

## Frozen scope
- Public marketing and account entry screens; signup, login, recovery and invitation UX.
- Authenticated shell, workspace switch/onboarding, Teams Directory/Hub, projects and project execution views.
- My Work, issue list/board/detail, issue drawer, keyboard workflows, bulk operations and saved views.
- Dependency graph, blocker semantics, guarded completion; cycles, milestones, roadmap, insights.
- Inbox, comments, mentions, activity; settings, themes, membership permissions and archived/unavailable states.
- Compact design-system conventions: typography, shared tokens, semantic colors, density and responsive navigation.
- Domain baseline: Workspace → Team → Project → Issue. One owning team per project.
- Team-scoped cycles; workspace-scoped milestones; scoped human keys and cross-workspace isolation.
- NEXUS enterprise prototype fixture for UX/load review; **not** production data or backend schema.

## Change control after freeze
- Allowed without re-opening UX v1: minor accessibility, visual, copy, responsiveness and isolated bug fixes preserving interaction and domain contracts.
- Needs explicit review/versioned contract decision: new major flows, changing route architecture, permission semantics, entity ownership, lifecycle rules or persisted meaning.
- Changes should be small, regression-tested and linked to a clear problem; backend adapters should preserve user-facing behavior.
- This freeze is a product-scope decision, **not** a production-readiness certificate or claim that all defects/tests are resolved.

## Backend next step (BE-00)
Inventory existing frontend contracts and adapters before implementing server endpoints. Produce:
1. Domain entities, relationships, constraints, lifecycle and authorization matrix.
2. Workspace-scoped tenancy policy for reads/writes, invitations, archived workspaces and role transitions.
3. Versioned REST APIs, errors, pagination, idempotency, optimistic concurrency and request/response types.
4. Session/auth and authorization threat model; audit event schema; realtime and delivery semantics.
5. Database migration model and staging/seed policy separating NEXUS mock data from production.
6. Infrastructure proposal with measured tradeoffs (PostgreSQL, NestJS, ORM, Redis/queue, observability, CI/CD).
7. Frontend adapter replacement order and contract/integration test plan, with no surprise UX changes.

**Gate:** Review and approve BE-00 contracts before BE-01 implementation.
