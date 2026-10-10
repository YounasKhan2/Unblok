# Unblok — Backend Status and Delivery Roadmap

**Last updated:** 2026-10-11
**Repository milestone:** BE-00I-C / PR #32 merged as `bdae8efc67ff19933b103b45fd868943945b1f70` (password recovery; frontend integration and production certification pending)  
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
| BE-00G | Durable PostgreSQL auth epochs/session-family fences and request-bound principal revalidation | **Merged — locally verified; not deployed or production auth-certified** | [PR #28](https://github.com/YounasKhan2/Unblok/pull/28), merge `0059c18a9b16ea1c2e9fc4049f0a2642eaafb799`; [implementation and evidence](19-BE-00G-AUTH-REVOCATION-FENCES.md) |
| BE-00H | Real bounded Valkey cookie-session infrastructure, request verifier and browser-security boundaries | **Merged; locally verified, not deployed or production-certified** | [PR #29](https://github.com/YounasKhan2/Unblok/pull/29), merge `6499ccbe587a1eb8c1d39826f1b840a634a91f8a`; [security report and evidence](20-BE-00H-SESSION-INFRASTRUCTURE.md); no auth endpoints or frontend integration |
| BE-00I-A | Core local-password registration/login/logout/logout-all/current-user APIs and CSRF bootstrap | **Merged; locally verified, not deployed or production-certified** | [PR #30](https://github.com/YounasKhan2/Unblok/pull/30), merge `4b824b9b5a4bb96709e49b6523c2977273d36d8d`; [security report](21-BE-00I-A-CORE-AUTHENTICATION.md); frontend mocks remain frozen |
| BE-00I-B | Secure authenticated email ownership and durable asynchronous outbox delivery | **Merged and locally verified; not deployed or production-certified** | [Security report](22-BE-00I-B-EMAIL-VERIFICATION.md); frozen frontend, no grants |
| BE-00I-C | Anonymous verified-email password recovery and atomic authority revocation | **Merged and locally verified; not deployed or production-certified** | [Security report](23-BE-00I-C-PASSWORD-RECOVERY.md); frontend frozen, no grants |

**Implemented foundation:** Bun monorepo; NestJS API and separate BullMQ worker; Prisma/PostgreSQL domain and tenant constraints; Valkey queue infrastructure; RustFS development storage; Mailpit development email capture; fail-closed foundation authorization; tenant-scoped database access; reusable backend architecture guardrails. These are foundations, not operational business APIs.

## 2. Current blockers and verification risks

- **BE-00D PR #25 is merged.** Its former correction/review hold is resolved; there is no open BE-00D merge decision.
- **Infrastructure test:** Intermittent unsupported-job completion/notification timeout at the existing five-second deadline, with a related late between-test error. On the same Windows/Bun host, the issue also reproduced on the exact pre-BE-00D base. Scheduling cause is unresolved; do not claim this test passes reliably.
- **BE-00I-C infrastructure observations:** Two runs failed the unchanged `workerLogs` contains `job_failed` assertion after job rejection, rather than the historical notification timeout (4pass/1fail,15 assertions each). The worker failed-event/log delivery ordering is unresolved; existing queue/test code is unchanged, and this is not classified harmless or fixed.
- **Lifecycle:** Built API and worker SIGTERM tests returned exit 143 without observed shutdown handlers, even for a minimal Bun control child on that host. Also reproduced on base. Graceful cleanup and cross-platform shutdown behavior remain unverified.
- **Frontend:** Three established NEXUS fixture test failures remain: missing resolved blocker, empty milestone dependency graph, and dependency fan-out 3 exceeding the accepted maximum 2. Preserve fixture/demo scope until separately authorized.
- **BE-00F session research:** Both stock session stores permit late-write resurrection; candidate B (`express-session` 1.19.0 + `connect-redis` 10.0.0 + `redis` 6.3.0) is preferred **conditionally** but its blocked-read deadline needs a reviewed wrapper and durable PostgreSQL user epochs/session-family fences. Comparison finished 53 passed observations / 1 failed A shutdown acknowledgement; separate candidate B run 29 passed. Passing characterization observations include demonstrated insecure behavior, not certification. Three A reconnecting child probes reproduced missing shutdown acknowledgement, despite no observed live socket or retry timer; do not erase this risk. An intermediate comparison had unexplained fixture failures and concurrent lint exit 9; later serial reruns passed without proving causes. Disposable Docker credential delivery is test-only, with environment/startup argument exposure; production TLS/ACL, cookie-browser, CSRF and signal shutdown remain unverified. See `18-BE-00F-SESSION-COMPATIBILITY.md` and associated evidence.
- **Verification distinction:** Architecture tests (45) and unit tests (81), integration (2), and PostgreSQL tenancy (34) were **reported** passing in the BE-00D correction; the infrastructure and lifecycle suites did not pass reliably. No GitHub CI was available for independent confirmation. Detailed base/head evidence: `docs/backend/evidence/BE-00D-verification-correction.json`.

**BE-00G merged implementation:** Implemented additive user epochs/disable barrier, durable session-family generation/digest/revocation/deadlines, request-bound same-instance session principals and primary revalidation inside scoped transactions. Focused F1/F2 corrections enforce request lifetime/fresh cache lookup and atomic generation+SID-digest transitions/frozen revoked rows. Verified locally: 24 real DB/cache security tests (134 assertions), 34 tenant/upgrade tests, 83 backend tests (47 architecture), typecheck/lint/build and 2 integration tests. The earlier implementation run had migration/logout timeouts and a late CLI error; correction checks passed without raising deadlines, but that earlier cause remains unresolved. This is merged code, but not deployment or production authentication certification; full findings are in [19](19-BE-00G-AUTH-REVOCATION-FENCES.md).

**BE-00H merged implementation:** Exact candidate B packages are integrated with a bounded Store and real live-session verifier, BE-00G callback/disconnect lifetime, secure cookie/expiry/rotation infrastructure and strict CSRF/CORS middleware. Production identity resolution and business grants still deny all; no authentication endpoints exist. Verified locally: 25 session security tests / 254 assertions, 88 backend tests including 47 architecture and 5 store/config/lifetime unit tests, 24 auth-fence and 34 tenancy tests, 2 integration and 5 infrastructure tests, typecheck/lint/build. Lifecycle rerun remains 1 pass/2 failures (API and worker SIGTERM 143). Package audit exits 1 for pre-existing deepmerge-ts 7.1.5 under Prisma tooling (unchanged base lock); separate dependency review is required. PR #29 focused corrections enforce terminal logout/failure finalization, handle late regeneration and bound cache-state lifetimes; BE-00G SQL contracts and all migrations remain unchanged. Four focused HTTP regressions and one lifetime test fail against reviewed production HEAD and pass with corrections. One existing 50ms bootstrap503 and the historical queue timeout/late error reproduced during verification; subsequent unchanged runs passed, so neither timing risk is marked resolved. See [20](20-BE-00H-SESSION-INFRASTRUCTURE.md) for all observations and exact limits.

**BE-00I-A merged implementation:** Core credential APIs are implemented with native Argon2id, an additive password-credential table, one-use server proofs, epoch-checked family creation, predecessor-family revocation on re-login and transactional self-profile projection. Focused PR #30 F1–F3 correction: additive durable unverified ownership/immutable credential binding, primary-fenced authenticated bootstrap and navigation/metadata rejection; overlapping password timeout and real Valkey budgets verified without changing limits. Authentication26/812, session25/254, fences24/134, tenancy34/132, backend95/233 pass; architecture/typecheck/lint/build and six-migration checks pass. No contact-email linking, workspace grants, email verification/recovery, OAuth/MFA or frontend integration. The historical queue timeout/late error remains unresolved despite a passing correction rerun5/18; SIGTERM143 and dependency advisory reproduced; one architecture-test timing failure and intermediate migration-count/outage-test mistakes remain in evidence. See [21](21-BE-00I-A-CORE-AUTHENTICATION.md) for precise contracts, results and pending deployment requirements.

**BE-00I-B merged implementation:** Authenticated credential-bound one-use keyed proofs, primary ownership stamping, durable outbox/worker mail delivery and status endpoints are merged via [PR #31](https://github.com/YounasKhan2/Unblok/pull/31), locally verified but not deployed or production-certified. No grants, linking, recovery or frontend wiring. PR #31 corrections preserve durable invalid-proof attempts and add transactional replacement for exhausted delivery, with bounded issuance and late-acknowledgement tests. See [security report](22-BE-00I-B-EMAIL-VERIFICATION.md) and evidence for exact gates and unchanged historical failures.

**BE-00I-C merged implementation (2026-10-11):** Anonymous verified-credential recovery, bounded keyed proofs/outbox and atomic password/proof/epoch/family revocation are merged via [PR #32](https://github.com/YounasKhan2/Unblok/pull/32); verification is recorded in [23](23-BE-00I-C-PASSWORD-RECOVERY.md). Not deployed or production-certified. Frozen frontend, no linking/grants, seven existing migrations and PostgreSQL/session security contracts remain preserved.

**Next action:** Begin FE-AUTH-01 frontend authentication integration on a separate reviewed branch. Review runtime grants, ingress/browser/TLS/CSRF, timing/abuse/load, mail notification/deployment, key restoration and outbox reconciliation separately. Sessions, core credentials and verification are merged but not deployed; recovery is merged but not deployed; OAuth/MFA and frontend integration remain planned. Candidate B local evidence is not vendor Bun support or production readiness. Maintain queue/SIGTERM reliability and historical timing findings without weakening tests.

## 3. Remaining production backend capabilities

| Capability | Current state | Priority |
| --- | --- | --- |
| Authentication and sessions | Revocation foundation merged; session middleware/verifier/security infrastructure merged and locally verified, not deployed; core credential APIs merged and locally verified, not deployed; broader identity lifecycle and frontend integration still missing | Critical |
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
2. **BE-00E planning and BE-00F compatibility research — merged; BE-00G fences merged.** Obtain remaining human security decisions and implement bounded sessions, identity lifecycle and CSRF in separate reviewed slices. Candidate B remains conditional; no permissive placeholder auth.
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

2026-10-10 merge update: BE-00G [PR #28](https://github.com/YounasKhan2/Unblok/pull/28) merged as `0059c18a9b16ea1c2e9fc4049f0a2642eaafb799`. PostgreSQL fences and request-bound principals merged and locally verified; not deployed, and no login/signup, session middleware or frontend authentication is claimed.

| Date | Repository milestone | Effect |
| --- | --- | --- |
| 2026-10-10 | BE-00I-A [PR #30](https://github.com/YounasKhan2/Unblok/pull/30), merge `4b824b9b5a4bb96709e49b6523c2977273d36d8d` | Core signup/login/logout/logout-all/me merged; 26 auth tests reported passing; email verification and production certification pending |
| 2026-10-10 | BE-00H [PR #29](https://github.com/YounasKhan2/Unblok/pull/29), merge `6499ccbe587a1eb8c1d39826f1b840a634a91f8a` | Bounded sessions, verifier, CSRF/CORS and failure cleanup merged; 25 security tests reported passing; not deployed/certified |
| 2026-10-10 | BE-00C [PR #24](https://github.com/YounasKhan2/Unblok/pull/24), merge `66d419e6c058208605f895b74da77ab37995df21` | Tenant foundation complete; business APIs remain outstanding |
| 2026-10-10 | BE-00D [PR #25](https://github.com/YounasKhan2/Unblok/pull/25), merge `e70d295c19e85161f2601fcf5fc3527ec2d56820` | Architecture guardrails merged; queue/shutdown baseline issues explicitly tracked |
| 2026-10-10 | BE-00E [PR #26](https://github.com/YounasKhan2/Unblok/pull/26), merge `83a52e3d230659dc612ebb9591985649c7f79ef4` | Session, CSRF, revocation, verifier and authorization planning merged. No auth implementation or runtime adapter certification; reported 45 architecture tests/typecheck pass, full suites not rerun |
| 2026-10-10 | BE-00G [PR #28](https://github.com/YounasKhan2/Unblok/pull/28), merge `0059c18a9b16ea1c2e9fc4049f0a2642eaafb799` | PostgreSQL auth epochs/session-family fences and request-bound principals merged; 24 security tests reported passing, not production session-certified |
| 2026-10-10 | BE-00F [PR #27](https://github.com/YounasKhan2/Unblok/pull/27), merge `f4fc4e1ef1ae18a5dfc7dab94645bccde1d937bf` | Isolated compatibility evidence merged: B conditionally preferred, 53/1 comparison with known A cleanup failure, B 29/0, both stock stores late-write resurrection, bounded callback does not cancel writes; PostgreSQL fences and production security remain unimplemented |
