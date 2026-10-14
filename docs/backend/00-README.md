# Unblok backend — BE-00A documentation index

Status: **DRAFT / human review required**. Baseline: `main` at `2e38ac0e9a50cac41b7de3e9a40a6d4e306657a1` (UX v1 frozen). Documentation-only; no backend implementation authorized in BE-00A.

## Authoritative decisions
- Preserve every existing UX screen, route, interaction, permission and workflow. No silent feature removal.
- Development infrastructure: Docker Compose; NestJS/TypeScript API; PostgreSQL + Prisma; Valkey + BullMQ; RustFS with S3 client; Mailpit (local email capture only); WebSocket gateway; REST/OpenAPI.
- Monorepo direction without breaking current React/Vite app. Exact migration mechanics are subject to review.
- All production business records must come from authenticated APIs backed by durable persistence. Never silently substitute demo data when APIs fail.
- Security, data integrity, efficiency, performance, reliability and horizontal scaling are acceptance criteria, not deferred aspirations.
- Target: design for 100,000+ *registered* users; specify and load-test separately for active/concurrent usage. Do not claim capacity without evidence.

## Document set
1. [Frontend parity and mock inventory](01-FRONTEND-PARITY-AUDIT.md)
2. [Backend engineering implementation guidance](02-IMPLEMENTATION-GUIDE.md)
3. [Architecture and development infrastructure](03-SYSTEM-ARCHITECTURE.md)
4. [Data integrity and database design](04-DATABASE-DESIGN.md)
5. [Security and authorization](05-SECURITY-AND-AUTHORIZATION.md)
6. [API and realtime contracts](06-API-AND-REALTIME-CONTRACTS.md)
7. [Performance, efficiency and scalability](07-PERFORMANCE-AND-SCALABILITY.md)
8. [Testing and quality gates](08-TESTING-AND-QUALITY-GATES.md)
9. [Mock removal and delivery roadmap](09-ROADMAP-AND-MOCK-REMOVAL.md)

## BE-00A review boundary
This is an **initial repository-grounded audit**, not an exhaustive dependency graph. Evidence inspected so far: `package.json`, `src/App.tsx`, `src/app/router/AppRouter.tsx`, `src/app/providers/AppProviders.tsx`, and `src/data/mockData.ts`. Anything not inspected is marked **verification pending** rather than invented. Before approving BE-00A, an implementation agent must trace every consumer/store/adapter/mutation and reconcile this document with the complete repository.

## Implemented foundation

[BE-00B foundation setup, boundaries, and security](13-BE-00B-FOUNDATION.md) records the explicitly authorized implementation phase. Earlier draft domain decisions remain review topics.

[BE-00C canonical domain and tenant foundation](14-BE-00C-DOMAIN-TENANCY.md) includes the pre-implementation requirements checklist, schema decisions, isolation boundary, and documentation compliance matrix.

[BE-00D backend module architecture and enforcement](15-BE-00D-MODULE-ARCHITECTURE.md) audits the implemented foundation, retains approved package responsibilities, defines feature-first conventions and reusable scoped patterns, and records automated boundary checks, verification, deferred decisions and review limits. Proposed feature trees do not imply implemented business APIs or authentication.

## Living delivery status

[BE-00E authentication, session and authorization architecture](17-BE-00E-AUTH-SESSION-AUTHORIZATION.md) is a planning proposal for human review: stateful Valkey cookie sessions, dependency compatibility findings, CSRF/lifecycle/security and action/resource policy decisions, frontend parity and implementation approval gates. Authentication remains **not implemented**; no production package or behavior change is authorized by the document.

[BE-00F session infrastructure compatibility verification](18-BE-00F-SESSION-COMPATIBILITY.md) records the isolated Nest/Bun/Express/Valkey candidate harness, HTTPS cookies, lifecycle/outage/concurrency evidence, unsafe stock-store findings, a conditional adapter recommendation and unresolved acceptance gates. Submitted for human review; no production authentication or dependency integration and no merged-status claim.

[BE-00G durable authentication revocation fences](19-BE-00G-AUTH-REVOCATION-FENCES.md) records the additive PostgreSQL epochs/session-family barrier, private principal adaptation, transactional ordering and real database/cache security evidence. Implemented on its review branch; not merged, deployed or login/session-middleware certification.

[BE-00H real session infrastructure](20-BE-00H-SESSION-INFRASTRUCTURE.md) records the bounded candidate B integration, real request-bound verifier, cookies/expiry/rotation/logout infrastructure, CSRF/CORS and PostgreSQL/Valkey/HTTP/TLS evidence. Implemented for human review; no authentication endpoints or production/browser certification.

[Backend status and delivery roadmap](16-BACKEND-STATUS-AND-ROADMAP.md) tracks merged phases, outstanding business capabilities, known verification failures and future delivery order. **Update this tracker whenever merging an Unblok branch that changes backend progress**, including a dated change-log entry and the merge SHA when available. This is a status document and does not supersede the architecture/security contracts above.

[BE-00I-A core authentication APIs](21-BE-00I-A-CORE-AUTHENTICATION.md) records real local credentials, six versioned auth handlers, strict CSRF/rate limits, additive credential migration and real HTTP/database/cache evidence. Implemented on the review branch; not merged, frontend-integrated or production-certified.

BE-00I-B review implementation: [secure email verification](22-BE-00I-B-EMAIL-VERIFICATION.md), pending human review; not merged/deployed.

BE-00I-C review implementation: [secure password recovery](23-BE-00I-C-PASSWORD-RECOVERY.md), anonymous proof authority and atomic password/epoch/session revocation; not merged/deployed.

FE-AUTH-01 review implementation: [real frontend authentication](../frontend/01-FE-AUTH-01-INTEGRATION.md), server-backed account flows with a separate NEXUS demo; not merged/deployed, browser and responsive visual validation pending.

## BE-API-00 proposed enterprise contracts

[24 — Enterprise API architecture and performance contracts](24-BE-API-00-ENTERPRISE-CONTRACTS.md): bounded resources/projections, screen matrix, graph/SQL/index proposals, proposed budgets and reproducible benchmark methodology. Documentation only, pending human review; no Workspace API or measured enterprise capacity.

## BE-WS-01 Workspace foundation

[25 — Workspace foundation](25-BE-WS-01-WORKSPACE-FOUNDATION.md) records the four approved endpoints, additive migration, request/session/tenant fences, durable creation replay, bounded discovery cursors and real database/HTTP evidence. Implemented on the review branch, not merged or deployed. The BE-API-00 proposal is merged at `3fcbc37cfe8eca6a03a1a01f3f7d4926eafa6037`; its historical registry labels remain proposals for later slices.

## BE-WS-02 Workspace memberships and invitations

[26 — Memberships and invitations](26-BE-WS-02-MEMBERSHIPS-INVITATIONS.md) records approved policy, bounded admin directory, independent invitation proof/outbox, sorted multi-user PostgreSQL fences and real HTTP/concurrency evidence. Implemented for review only; not merged or deployed. Base includes BE-WS-01 and FE-WS-01 merges.

## Current merged state — 2026-10-14

The review-stage descriptions above are historical phase summaries, not current merge status. PRs #24–#37 and FE-WS-02 [PR #38](https://github.com/YounasKhan2/Unblok/pull/38) are merged. Authentication/session infrastructure, core credentials, verification/recovery, frontend authentication, Workspace creation/discovery and memberships/invitations with frontend integration are in main. Latest approved Team foundation merge: [PR #40](https://github.com/YounasKhan2/Unblok/pull/40), `7ac1c39543d7057642db56f99bbd8a070f37a746`. See [current roadmap](16-BACKEND-STATUS-AND-ROADMAP.md) and [frontend status](../frontend/00-STATUS.md). Four BE-TEAM-01 Team endpoints are merged. Deployment, BE-TEAM-02 management, Project/Issue/Dependency APIs and historical verification risks remain incomplete.

[27 — BE-TEAM-01 architecture and authorization proposal](27-BE-TEAM-01-ARCHITECTURE-PROPOSAL.md) defines proposed explicit Team ownership/private membership, policy, lifecycle, additive constraints, bounded contracts and concurrency. The complete proposal, numeric limits and BE-TEAM-01/02 split were approved and merged through PR #39 at `d4b958c74d7383cd269e693745738b3534cd44af`. BE-TEAM-01 implementation is now authorized within that four-route scope; its implementation PR requires separate human review.

[28 — BE-TEAM-01 private Team foundation](28-BE-TEAM-01-FOUNDATION.md) records implementation of the four approved routes, additive owner/quarantine/receipt constraints, real security/concurrency/migration tests and query evidence. Merged through PR #40 at `7ac1c39543d7057642db56f99bbd8a070f37a746`; not deployed. The phase report retains its original review-time evidence and operational limitations. BE-TEAM-02 architecture is approved and merged; implementation awaits separate security review.

[FE-TEAM-01 live Team integration](../frontend/04-FE-TEAM-01-INTEGRATION.md) merged through PR #41 at `f65d9b0603cd76c243afb34cf59155bfa0c32a64`; not deployed. No backend authorization or migration changes are introduced by that frontend slice.

[29 — BE-TEAM-02 architecture proposal](29-BE-TEAM-02-ARCHITECTURE-PROPOSAL.md) proposes explicit membership/role ceilings, transfer, lifecycle, revocation/concurrency and approval-gated owner recovery. Approved architecture PR #42 merged at `41502c012e263a384748e432157f84f09b3cde32` after verification of reviewed HEAD `111b44a36533f8062ea7f02106cecdadcdd07555`. [30 — implementation and verification](30-BE-TEAM-02-IMPLEMENTATION.md) records the separately authorized backend implementation submitted for security review. No implementation merge or frontend management is authorized.
