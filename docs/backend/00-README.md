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
