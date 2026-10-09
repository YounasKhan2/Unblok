# Unblok API foundation

NestJS 11 modular application on Bun 1.4.2. See [BE-00B setup, security, and validation](../../docs/backend/13-BE-00B-FOUNDATION.md).

From repository root: `bun run init:local`, `bun run infra:up`, `bun run db:generate`, `bun run db:migrate`, then `bun run dev:api`. The API binds to loopback port 4000 by default. `/live`, `/ready`, `/api/v1/live`, and `/api/v1/ready` are the only endpoints. No business data or frontend integration is implemented.

`src/health.ts` registers the module and explicit injectable resources; `app.ts` assembles HTTP security and lifecycle; `validation.ts` supplies strict schema pipes and response interceptors. Explicit injection tokens avoid depending on Bun emitting decorator type metadata. Future handlers are denied by the global access guard until reviewed authentication and tenant authorization replace it. Never mark a business handler as public health.

Readiness checks the migrated PostgreSQL marker and authenticated Valkey connection with a deadline; it fails while draining. Liveness does not require dependencies. Startup failures log a fixed safe event and exit nonzero. SIGINT/SIGTERM stop accepting requests and dispose resources within a bounded shutdown deadline.
