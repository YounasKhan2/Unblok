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

[Backend status and delivery roadmap](16-BACKEND-STATUS-AND-ROADMAP.md) tracks merged phases, outstanding business capabilities, known verification failures and future delivery order. **Update this tracker whenever merging an Unblok branch that changes backend progress**, including a dated change-log entry and the merge SHA when available. This is a status document and does not supersede the architecture/security contracts above.
