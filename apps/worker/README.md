# Unblok worker foundation

Independent Bun/BullMQ process. Run `bun run dev:worker` from the root after the [local infrastructure setup](../../docs/backend/13-BE-00B-FOUNDATION.md). Queue `foundation` accepts only `foundation.noop` with strict payload `{ "version": 1 }`. Nothing enqueues jobs automatically; no product jobs are implemented.

Queue access is authenticated. Startup must reach queue readiness before reporting success. SIGINT/SIGTERM wait for in-flight work and close queue connections within the configured deadline. All error events omit exception messages and job payloads.

Default transient retry budget: three attempts, exponential backoff starting at one second. Invalid payloads/job names are unrecoverable. Completed jobs are retained for up to a day (maximum 1,000), failed jobs for up to a week (maximum 1,000). Failed jobs require operator inspection; this is not a separate dead-letter delivery system.

`diagnosticJobId(key)` hashes bounded caller keys to stable BullMQ IDs. Duplicate IDs deduplicate only while a job remains retained. The diagnostic handler has no side effects, so redelivery is safe. Future product handlers must enforce durable database-backed idempotency and tenant authorization, and create queue work through transactional outbox conventions. Redis retention is not a substitute for those guarantees. No exactly-once claim is made.
