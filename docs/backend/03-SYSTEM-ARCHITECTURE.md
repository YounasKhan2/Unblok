# System architecture and Docker development infrastructure

Status: proposed BE-00A contract, not deployed.

- Preserve current React/Vite app; introduce NestJS modular monolith API, separate BullMQ worker process and shared versioned contract package incrementally. Do not move frontend files until regression coverage is established.
- Docker Compose services: postgres (durable named volume), valkey (local network), rustfs (durable local object volume), mailpit (development-only SMTP and UI), API and worker. Health checks, pinned image versions/digests after validation, repeatable setup, env schema validation, dedicated non-root identities when supported, bounded resources, graceful shutdown and restart policies.
- Only API and explicitly needed development UIs bind to loopback. Never expose PostgreSQL 5432, Valkey 6379 or internal RustFS admin publicly. Keep credentials outside VCS; provide .env.example with placeholders.
- PostgreSQL and RustFS are independent persistence domains; use database-controlled attachment lifecycle and outbox/compensation. AWS SDK S3 abstraction talks to RustFS; no RustFS-specific imports in domain modules.
- Mailpit is free, local-only email **capture**, not production email delivery; use an email adapter and real transactional provider for production.
- WebSockets require authenticated handshake, authorization per event/room, membership revocation handling, replay/reconnect strategy. Scale-out will require distributed fanout and/or durable event streams; not achieved by a lone gateway.
- Cloud deployment is **not decided**. Development containers do not confer production HA, PITR, multi-zone resilience or 100k-user capacity. Production requires managed PostgreSQL with PITR, S3 durability/redundancy, TLS, backups, alerts, provider-specific network design, and tested disaster recovery.
- Avoid treating Valkey as authoritative persistent data. Define queue durability/restart behavior and clear recovery semantics.
