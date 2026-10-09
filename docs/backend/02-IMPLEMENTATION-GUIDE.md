# Unblok — Backend implementation guide

Status: BE-00A proposed engineering contract, pending human approval.

## Core invariants
- Zero regression of frozen UX: route, action, density, errors, keyboard/accessibility, authorization and optimistic behaviors must be characterized before wiring APIs.
- No production fake data, hardcoded credentials, auto-seeding or silent fallback on API errors. Test factories/fixtures are permitted only in isolated test scope.
- Every resource access is authenticated and **workspace-scoped on the server**; client-selected workspace IDs never grant authority.
- Every critical mutation preserves PostgreSQL business invariants inside transactions/constraints; handle concurrent edits, duplicates and retries explicitly.
- Secure defaults: deny-by-default authorization; least-privilege service credentials; secret redaction; no database/cache/storage admin ports exposed publicly.
- Optimize from measured query plans, realistic fixtures, traces and load tests rather than speculative caching.
- No premature distributed microservices. Start modular NestJS monolith with clean boundaries and independently deployable workers.

## Proposed module boundaries
Identity/Auth & sessions; Workspaces/Memberships/Invitations; Teams; Projects; Issues/Comments/Activity; Dependency graph; Cycles/Milestones/Roadmap; Notifications/Inbox; Preferences/Settings; Insights/Read models; Storage/Attachments; Integrations; Audit and Outbox. These are **proposed**, and must be reconciled against actual route interactions.

## Development workflow for every BE phase
1. Select a narrow vertical slice, inspect all frontend consumers and characterize current observable behavior.
2. Add API/DTO/OpenAPI contract plus authorization and database constraints, including negative cases.
3. Implement migrations with rollback/recovery plan; add unit and integration tests against PostgreSQL.
4. Implement API in module boundary; use transactions/outbox and idempotency for cross-service effects.
5. Integrate frontend adapter; verify loading, empty, 401/403/404/409/429/5xx, stale state and rollback behavior.
6. Remove that slice's production mock imports, fallbacks and implicit seeds in the **same reviewed change**.
7. Run security/tenant-isolation, e2e and concurrency regression tests; record query/performance measurements.
8. Update docs/contracts and submit scoped PR; stop for human approval before starting next phase.

## Prohibitions
Do not trust role/workspace IDs in client payload; create broad 'admin bypass' paths; swallow API failures; call external services inside unbounded DB transactions; return unrestricted lists; cache sensitive authorization without invalidation; log passwords, tokens, signed URLs or secrets; enable RustFS console publicly; make migrations destructive without backfill and recovery; merge unreviewed feature work.

## Definition of done
Proven tenant isolation; database constraints; tests for positive/negative/parallel requests; API parity; no mocked production data in the migrated slice; documented indexes; structured logging and safe errors; repeatable Docker run; passing frontend regression suite; reviewed PR. Targets not measured must be marked **unverified**, never 'passed'.
