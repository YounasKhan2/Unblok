# API and realtime contract principles

Status: proposed route patterns, **not** implemented endpoints or exhaustive frontend contract inventory.

- REST under `/api/v1`. Prefer explicit workspace scope: `/workspaces/:workspaceId/projects`, `/workspaces/:workspaceId/teams`, `/workspaces/:workspaceId/issues`; nested resources must be tenant-verified independently.
- Defined DTO schemas, stable error envelopes, validation, OpenAPI, response projections, bounded pagination, filtering, sorting and versioning. Use a generated typed client only after schemas reviewed.
- Suggested status expectations: 400 validation, 401 unauthenticated, 403 forbidden where it doesn't leak resource existence, 404 not found/inaccessible, 409 version/business conflict, 429 throttling. All errors must preserve observable UX state; never inject demo records.
- Write idempotency for create, invitations, notifications and upload completion. Document semantics per operation. For updates use `version` or ETag/preconditions to reject lost updates.
- Cursor pagination for issues, activities, notifications; cap requested limits and deterministic ordering, constrain filter combinations to indexed access paths.
- Outbox events are created atomically with DB mutations. Consumers are at-least-once with dedupe, replay boundaries, retries/dead letters. Don't promise exactly-once processing.
- Authenticated websocket handshake and event-level authorization; tenant-bound rooms, durable event IDs, reconnect/resync, no private cross-tenant broadcasts, membership revocation.
- API shape and resource actions remain **pending** exhaustive per-consumer inventory in `01-FRONTEND-PARITY-AUDIT.md`; do not generate arbitrary CRUD endpoints as if already approved.
