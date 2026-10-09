# Efficiency, optimization, performance and scalability

Design objective: support growth toward 100,000+ registered users. **Registered users are not concurrent users**; workload mix and concurrency targets must be measured and agreed separately.

- Instrument request timings, error rates, queue depth, DB query duration, connection count, cache hit/miss, realtime connection count, memory/CPU and attachment traffic.
- Establish baseline on representative seeded test fixtures (test-only), record p50/p95/p99 endpoint latency under specified concurrency, RPS, warm/cold cache and data cardinality. No invented SLO accomplishments.
- Index hot workspace-scoped queries, inspect EXPLAIN ANALYZE, eliminate N+1, bound result sets and avoid huge transactional fanout. Connection pooling and safe transaction scope are mandatory.
- Use database transactions for correctness; Valkey caches derived/replaceable state only with explicit TTL/invalidation and tenant-safe keys. Avoid caching session authorization beyond revocation safety.
- Stateless API processes and independently scalable workers. WebSocket multi-instance behavior, sticky-session avoidance or strategy, distributed fanout and replay must be validated before scaling.
- Adopt backpressure, queue concurrency limits, worker idempotency, dead-letter inspection and retry budgets. Design cost/telemetry budgets.
- Test workload degradation: DB restart, cache outage, worker crash, duplicate requests, websocket reconnection and storage failures.
- Define availability, recovery point objective, recovery time objective, maximum concurrent sockets and regional latency targets during BE-00B; do not mistake Docker single-host for high availability.
