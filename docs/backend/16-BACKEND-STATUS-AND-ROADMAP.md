# Unblok — Backend Status and Delivery Roadmap

**Last updated:** 2026-10-10  
**Repository milestone:** BE-00F / PR #27 merged as `f4fc4e1ef1ae18a5dfc7dab94645bccde1d937bf` (isolated session compatibility research; not production auth)  
**Purpose:** Living, repository-grounded backend delivery tracker. Update when an approved backend PR is merged. This is a status tracker, **not** a replacement for the implementation/security/database architecture contracts in this folder.

> **Status rule:** Check actual merge status and current code before editing. Record implemented vs planned vs verified separately. Do not mark a feature complete solely because a schema, interface, design, or proposal exists. Keep known test failures visible. Update this tracker **with every future backend branch merge**, preferably as part of the reviewed PR before merge; if the merge SHA is not known until afterward, follow with a status-only commit on `main` and record it. Record the PR, merge SHA, changes, new gaps, and new test outcomes. For other Unblok branches, update the relevant status section when they change backend deliverables or dependencies.

## 1. Foundation and architecture phases

**Status: four implementation/relocation foundation phases, BE-00E architecture planning and BE-00F isolated compatibility research merged; BE-00A planning completed.** This does not mean the production business backend is complete.

| Phase | Scope | Current status | Evidence |
| --- | --- | --- | --- |
| BE-00A | Backend research, architecture, security and implementation planning | Completed planning baseline | `00–11` backend documents |
| BE-01A | Frontend relocation into Bun monorepo | Merged | [PR #21](https://github.com/YounasKhan2/Unblok/pull/21) |
| BE-00B | NestJS API, worker, infrastructure, configuration, logging, security foundation | Merged | [PR #23](https://github.com/YounasKhan2/Unblok/pull/23); `13-BE-00B-FOUNDATION.md` |
| BE-00C | PostgreSQL domain schema, tenant isolation, scoped persistence and constraints | Merged | [PR #24](https://github.com/YounasKhan2/Unblok/pull/24), merge `66d419e6c058208605f895b74da77ab37995df21`; `14-BE-00C-DOMAIN-TENANCY.md` |
| BE-00D | Reusable module conventions, static architecture enforcement and verification investigation | **Merged** | [PR #25](https://github.com/YounasKhan2/Unblok/pull/25), merge `e70d295c19e85161f2601fcf5fc3527ec2d56820`; `15-BE-00D-MODULE-ARCHITECTURE.md` |
| BE-00E | Authentication, Valkey session and authorization architecture **planning only** | **Merged — implementation not started** | [PR #26](https://github.com/YounasKhan2/Unblok/pull/26), merge `83a52e3d230659dc612ebb9591985649c7f79ef4`; `17-BE-00E-AUTH-SESSION-AUTHORIZATION.md` |
| BE-00F | Isolated NestJS/Bun/Valkey session compatibility harness and security characterization | **Merged — research only; not production-certified** | [PR #27](https://github.com/YounasKhan2/Unblok/pull/27), merge `f4fc4e1ef1ae18a5dfc7dab94645bccde1d937bf`; `18-BE-00F-SESSION-COMPATIBILITY.md` |
| BE-00G | Durable PostgreSQL auth epochs/session-family fences and private principal revalidation | **Implemented on review branch; not merged or deployed** | `feat/be-00g-auth-revocation-fences`; [implementation and evidence](19-BE-00G-AUTH-REVOCATION-FENCES.md) |

**Implemented foundation:** Bun monorepo; NestJS API and separate BullMQ worker; Prisma/PostgreSQL domain and tenant constraints; Valkey queue infrastructure; RustFS development storage; Mailpit development email capture; fail-closed foundation authorization; tenant-scoped database access; reusable backend architecture guardrails. These are foundations, not operational business APIs.

## 2. Current blockers and verification risks

- **BE-00D PR #25 is merged.** Its former correction/review hold is resolved; there is no open BE-00D merge decision.
- **Infrastructure test:** Intermittent unsupported-job completion/notification timeout at the existing five-second deadline, with a related late between-test error. On the same Windows/Bun host, the issue also reproduced on the exact pre-BE-00D base. Scheduling cause is unresolved; do not claim this test passes reliably.
- **Lifecycle:** Built API and worker SIGTERM tests returned exit 143 without observed shutdown handlers, even for a minimal Bun control child on that host. Also reproduced on base. Graceful cleanup and cross-platform shutdown behavior remain unverified.
- **Frontend:** Three established NEXUS fixture test failures remain: missing resolved blocker, empty milestone dependency graph, and dependency fan-out 3 exceeding the accepted maximum 2. Preserve fixture/demo scope until separately authorized.
- **BE-00F session research:** Both stock session stores permit late-write resurrection; candidate B (`express-session` 1.19.0 + `connect-redis` 10.0.0 + `redis` 6.3.0) is preferred **conditionally** but its blocked-read deadline needs a reviewed wrapper and durable PostgreSQL user epochs/session-family fences. Comparison finished 53 passed observations / 1 failed A shutdown acknowledgement; separate candidate B run 29 passed. Passing characterization observations include demonstrated insecure behavior, not certification. Three A reconnecting child probes reproduced missing shutdown acknowledgement, despite no observed live socket or retry timer; do not erase this risk. An intermediate comparison had unexplained fixture failures and concurrent lint exit 9; later serial reruns passed without proving causes. Disposable Docker credential delivery is test-only, with environment/startup argument exposure; production TLS/ACL, cookie-browser, CSRF and signal shutdown remain unverified. See `18-BE-00F-SESSION-COMPATIBILITY.md` and associated evidence.
- **Verification distinction:** Architecture tests (45) and unit tests (81), integration (2), and PostgreSQL tenancy (34) were **reported** passing in the BE-00D correction; the infrastructure and lifecycle suites did not pass reliably. No GitHub CI was available for independent confirmation. Detailed base/head evidence: `docs/backend/evidence/BE-00D-verification-correction.json`.

**BE-00G review-branch distinction:** Implemented additive user epochs/disable barrier, durable session-family generation/digest/revocation/deadlines, request-bound same-instance session principals and primary revalidation inside scoped transactions. Focused F1/F2 corrections enforce request lifetime/fresh cache lookup and atomic generation+SID-digest transitions/frozen revoked rows. Verified locally: 24 real DB/cache security tests (134 assertions), 34 tenant/upgrade tests, 83 backend tests (47 architecture), typecheck/lint/build and 2 integration tests. The earlier implementation run had migration/logout timeouts and a late CLI error; correction checks passed without raising deadlines, but that earlier cause remains unresolved. This is not merged reality or production authentication certification; full findings are in [19](19-BE-00G-AUTH-REVOCATION-FENCES.md).

**Next action:** Human review of BE-00G's additive migration, private trust-boundary adaptation and real concurrency evidence before merge/deployment. Production session integration, identity lifecycle, CSRF, cookie deployment and resource-policy decisions remain planned and need separate authorization. Candidate B remains conditional; no session middleware or auth endpoint exists. Maintain the separate queue/SIGTERM reliability follow-up and new CLI/host timing observation; do not silently weaken tests or certify production readiness.

## 3. Remaining production backend capabilities

| Capability | Current state | Priority |
| --- | --- | --- |
| Authentication and sessions | Login/signup/session middleware not implemented; durable revocation foundation implemented and locally verified on BE-00G review branch, not merged/deployed | Critical |
| Workspace membership and invitation APIs | Schema exists; business APIs missing | Critical |
| Team and project APIs | Schema exists; business APIs missing | Critical |
| Issues CRUD/search/filtering | Bounded scoped persistence primitives exist; business APIs missing | Critical |
| Dependency graph APIs and cycle-safe writes | Database dependency-write gate active; DAG service missing | Critical |
| Fine-grained permissions | Deny-by-default policy boundary only; approved action grants missing | Critical |
| Frontend integration with real APIs | Production frontend still depends on mock/local data | Critical |
| Audit logs and activity history | Not implemented | High |
| Notifications and business background jobs | Diagnostic worker only | High |
| Attachments and file storage workflows | Development infrastructure available; business workflows missing | High |
| Cycles, milestones and roadmap | Not implemented | High |
| WebSockets and realtime collaboration | Not implemented | High |
| Insights and reporting | Not implemented | Later |
| Production deployment, monitoring, backups and recovery | Not implemented or production-verified | Required before launch |

## 4. Recommended delivery sequence (subject to phase-specific review)

1. **BE-00D module standards — completed and merged.** Preserve architecture tests as backend features grow.
2. **BE-00E planning and BE-00F compatibility research — merged; BE-00G fences in review.** Review the implemented additive fence/principal adaptation and locally verified revocation races first. After its separately approved merge/deployment, obtain remaining human security decisions before bounded sessions, identity lifecycle and CSRF slices. Candidate B remains conditional; no permissive placeholder auth.
3. **Core business APIs.** Deliver workspaces/memberships, teams, projects and issues in narrowly reviewed, tenant-safe vertical slices.
4. **Dependency engine.** Replace the SQL write gate only after transactionally safe DAG/reachability, blocker and completion rules pass concurrency tests.
5. **Frontend API integration, incrementally.** Replace mock-backed adapters **within each approved vertical slice**, not as one late big-bang migration. Verify UX/error/optimistic parity and remove silent fallback.
6. **Extended functionality.** Audit/activity, notifications, attachments, cycles/milestones, realtime and other approved features with verified worker/authorization design.
7. **Production readiness.** Resolve infrastructure/shutdown reliability, security, observability, load/lock performance, backup/PITR and deployment requirements with measured evidence.

**Bottom line:** The backend foundation and module architecture are in place, but Unblok does not yet have a production business backend or real-data-driven frontend. Continue with controlled vertical slices while preserving security and existing UX.

## 5. Mandatory merge-time maintenance

When reviewing and merging **any future Unblok PR that affects backend progress**, the reviewer or implementation agent must:

1. Read this file and verify the PR's actual changed files, tests and merge state.
2. Update the phase table and relevant capability rows based on **merged reality**; planned/in-review work remains clearly marked.
3. Update open blockers, existing known failures, verification caveats and next action.
4. Add the PR link, exact merge SHA when available, and a dated change-log entry.
5. Confirm the documentation is updated **as part of the merge workflow**; if the true merge SHA becomes available only afterward, create a narrow follow-up status commit and verify it appears on `main`.
6. Do not mark a failed or skipped check as passed, rewrite earlier migration/phase history, or erase known risks without evidence.

### Change log

2026-10-10 review-branch update: BE-00G revocation foundation implemented and locally verified from `1f01372f09a59ed82b4cd58a5247b185be3e591c`; not merged or deployed. The repository milestone above remains BE-00F. No login/signup, session middleware or frontend authentication is claimed.

| Date | Repository milestone | Effect |
| --- | --- | --- |
| 2026-10-10 | BE-00C [PR #24](https://github.com/YounasKhan2/Unblok/pull/24), merge `66d419e6c058208605f895b74da77ab37995df21` | Tenant foundation complete; business APIs remain outstanding |
| 2026-10-10 | BE-00D [PR #25](https://github.com/YounasKhan2/Unblok/pull/25), merge `e70d295c19e85161f2601fcf5fc3527ec2d56820` | Architecture guardrails merged; queue/shutdown baseline issues explicitly tracked |
| 2026-10-10 | BE-00E [PR #26](https://github.com/YounasKhan2/Unblok/pull/26), merge `83a52e3d230659dc612ebb9591985649c7f79ef4` | Session, CSRF, revocation, verifier and authorization planning merged. No auth implementation or runtime adapter certification; reported 45 architecture tests/typecheck pass, full suites not rerun |
| 2026-10-10 | BE-00F [PR #27](https://github.com/YounasKhan2/Unblok/pull/27), merge `f4fc4e1ef1ae18a5dfc7dab94645bccde1d937bf` | Isolated compatibility evidence merged: B conditionally preferred, 53/1 comparison with known A cleanup failure, B 29/0, both stock stores late-write resurrection, bounded callback does not cancel writes; PostgreSQL fences and production security remain unimplemented |
