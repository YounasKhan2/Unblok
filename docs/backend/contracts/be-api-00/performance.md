# Proposed budgets and benchmark methodology

**No benchmark executed. Every number is an acceptance proposal requiring review and measurement**, not current capacity/SLO. Registered accounts are not simultaneous sessions. Targets apply only to a fully recorded deployment/host/replica/pool/network/TLS configuration.

| Tier | Synthetic per-workspace data | Active concurrency | Read handler p50/p95/p99 proposal | Mutation p95/p99 proposal |
| --- | --- | --- | --- | --- |
| Small |20members,5teams,10projects,1000issues,2000edges |10 |75/200/400ms |300/600ms |
| Medium |500members,50teams,200projects,100000issues,200000edges |50 |100/300/600ms |500/900ms |
| Enterprise |10000members,500teams,2000projects,1000000issues,3000000edges |200 |150/400/800ms |700/1200ms |
| High-volume graph |1000000issues,10000000edges; skewed hubs/depth20 |50graph clients |200/600/1000ms bounded view |Graph writes unapproved; no target |

Hot single-workspace and many-workspace runs separate; current write lock may fail enterprise targets. These are dataset tiers, not supported tenant ceilings. Graph stays≤200nodes/400edges/depth3/2000inspected at every tier.

Caps: workspace64KiB; teams/issues/dependencies128KiB; overview/My Work192KiB; graph300KiB uncompressed JSON. Initial screen≤1business read, optional lazy second metadata; auth calls separate. Proposed temporary heap≤8MiBnormal/32MiBgraph; steady API RSS≤512MiB/replica at stated tier, including measured native Argon2/client buffers. JS heap alone cannot prove RSS. Unexpected5xx<0.1%; zero cross-tenant/revoked-authority successes, invalid payloads or unbounded traversals. Report expected429/409/503/timeouts separately and include failures in latency; don't declare all overload expected. SQL/work bounds in query/graph documents apply.

## Future reproducible harness, not implemented

1. Deterministic seed20261011, unique owned DB/cache namespace; no production/NEXUS data. Ten tenants per tier, one hot skewed tenant, timestamp ties, ACTIVE/INVITED/SUSPENDED memberships, archived parents, hidden teams/issues, maximum legal texts. Chains/diamonds/hubs and deliberately corrupt cycles only in owned administrative fixtures; production dependency gate stays shut. Generator version, seed, row counts/checksums recorded.
2. Record exact code/base/head, OS/CPU/RAM/disk, Bun/Nest/PG/Valkey/Prisma, replicas, DB pool/connections, TLS and latency. Real signed cookie+CSRF+primary fences and reviewed realistic visibility policy; no allow-all shortcut. Report cold-screen auth restoration separately and in end-to-end latency.
3. Independent open-loop load host with version-pinned runner selected in a future test-only review; no new dependency now. Warmup5minutes, stable15minutes, concurrency ramps10/50/200, sustain30minutes,60s2xburst,3repeats. Record offered arrival rate and requests/sec with concurrency, client saturation/dropped arrivals and coordinated-omission handling. Concurrency alone is not load.
4. Mix60%pages,15%overview/My Work,10%search,10%bounded graph,5%CAS writes; separate pure hot-tenant writes/graph. Page50and boundary100. Interleave stale cursor/version, membership revocation,logout-all,cache restore and rotation. Explicit retry counts; no automatic mutation retries concealing conflicts.
5. Handler and network/browser histogram p50/p95/p99, all failed deadlines, payload uncompressed/wire, business/total SQL, scanned/returned ratio, lock/pool waits/deadlocks/serialization, CPU/event-loop/RSS/native memory, PG buffers/temp/WAL, Valkey/admission rejection. No tokens/cookies/email/body/query strings or high-cardinality identity telemetry.
6. Warm/cold owned data only; don't flush shared services. Fault PG/Valkey, slow replies/late writes, pool exhaustion, graph cap, stale cache/revision/membership mutations. Expect fail-closed/bounded cleanup, not cancellation. Primary PITR requires reviewed signing/namespace invalidation; stale-cache tests don't certify disaster recovery.
7. Publish sanitized raw histograms/plans, exact tool/config versions, successes/failures/dropped arrivals, duration/exit/cleanup residuals. Same-host/config baseline/candidate comparison; security/ownership invariants and repeatability required. If targets fail, report and propose a bounded next slice; no covert timeout/assertion change.

Launch still requires production grants/TLS/ingress/CORS/SameSite/browser/CSRF, cache ACL/HA/capacity, mail/outbox alerts, keys/restore/retention, queue reliability and signal shutdown. Local tests cannot certify this table.
