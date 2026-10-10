# BE-00I-C — Secure password recovery

Review branch `feat/be-00i-c-password-recovery`; not merged, deployed or production-certified. Clean fetched base: `d534ae8767c50c9f680974f9aa06ed0f9ed6448c`, including merged PR #31 and tracker handoff. Final head is in PR metadata. Reviewed reports [20](20-BE-00H-SESSION-INFRASTRUCTURE.md), [21](21-BE-00I-A-CORE-AUTHENTICATION.md), [22](22-BE-00I-B-EMAIL-VERIFICATION.md), current credential/session/outbox code and all seven reviewed migrations. The living tracker supersedes historical merge labels.

## Anonymous authority and API

Recovery differs from verification: no old password or authenticated principal is required, but the exact immutable password credential must already have durable verified email ownership. Contact email, other provider identities, duplicate signup and session flags cannot establish eligibility. Enabled current password identity and non-null `emailVerifiedAt` are required. No implicit linking, workspace grants, membership creation or verified-state transition occurs.

The design uses [OWASP recovery guidance](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html) for generic responses, secure one-use expiring proofs, abuse bounds and ordinary login after reset. Manual proofs avoid token URLs and Host-derived links. Backend capability is implemented; browser workflow, post-reset notification and production security certification remain pending.

| Endpoint | Strict body | Result |
|---|---|---|
| POST /api/v1/auth/password-recovery/request | `{email}` canonical credential email |202 `{status:"accepted"}` for eligible, absent, disabled, unverified or reused work |
| POST /api/v1/auth/password-recovery/confirm | `{email,token,password}` |200 `{status:"accepted"}` for valid, invalid, expired, canceled, exhausted, replayed or known rolled-back concurrent proof |

No token, challenge ID, eligibility, remaining count or authenticated cookie is returned. Both use existing signed anonymous/authenticated CSRF cookie, synchronizer header, exact configured Origin, JSON and bounded parsing/coarse throttle. First-time clients use GET `/api/v1/auth/csrf`; anonymous state remains ten minutes with no identity/principal. No missing/null Origin mutation fallback, Referer exemption or SameSite-only protection. Bootstrap/CORS/TLS/proxy contracts remain BE-00H/I-A. Stale authenticated cookie may deny hydration/bootstrap; obtain fresh anonymous bootstrap rather than restore authority. Two exact controller handler references are added; business handlers remain denied by default.

Schema400, CSRF/origin403, budgets429 and dependency/unknown outcome503 remain generic. Request account5/hour and IP10/hour; confirm account10/15minutes and IP30/15minutes. Canonical submitted email is only a HMAC-protected abuse key, never authority. Absent and ineligible emails use identical counters. Existing atomic Lua, late-operation counting and no-refund semantics remain. Durable proof cap10 survives cache loss/restarts; exhaustion does not disable ordinary login or lock the account.

Every valid-body confirm performs the same Argon2id hash before account/proof lookup, using existing four-operation admission and2s acknowledgement. Native slots remain occupied until actual completion after timeout; failed hash cannot continue to persistence. Successful request/confirm processing pays a monotonic150ms minimum target plus0–50ms jitter. Absent-row shortcuts pay this floor. Timing distributions under load/contention/outages remain observable and unverified; no perfect indistinguishability claim. Known serialization/deadlock rollback returns generic accepted, without claiming reset committed. Request-only known lock/statement abort similarly avoids account-specific contention status. Known issuance rollback retries at most twice; unknown commit/network outcomes are503 and are not internally retried or treated as cancellation.

## Migration and proof

Eighth additive migration `20261011000000_password_recovery` creates `password_recovery_challenges` and one-to-one `password_recovery_outbox`, plus Prisma models/credential relation. Seven prior migrations are unchanged; no backfill, seed, account conversion, runtime DDL or dependency upgrade. Composite identity/email FK targets the immutable credential tuple. Challenge stores server UUID, identity/email, observed epoch, key ID, keyed digest, primary issuance/expiry, bounded attempts and consumed/canceled timestamps. SQL enforces positive epoch,15minute maximum TTL,10attempt maximum, consumption ordering, immutable binding/digest/times, monotonic attempts and frozen terminal evidence. Deletion is denied; retention maintenance needs separate review.

Cryptographic UUID and independent256-bit secret produce a domain-separated HMAC-SHA256 PRF over key ID/challenge ID/identity/email/epoch. Proof is `uuid.43-character-base64url-MAC`; only a second domain-separated keyed digest is persisted. Recovery labels differ from verification even with identical metadata/key; configuration additionally rejects reuse of the verification secret. Worker reconstructs the same proof from durable metadata. Database dump alone cannot redeem; database plus key compromise can synthesize live proofs and requires epoch/key incident response.

Required `PASSWORD_RECOVERY_KEY_ID`/`PASSWORD_RECOVERY_KEY` match API/worker and are independent of verification/session secrets. No production default/fallback. Fresh initializer generates/reuses matching keys, rejects mismatches/equality and preserves existing files; existing environments require explicit reviewed fields. Rotation changes key/version, invalidating old proofs. PITR/restore must stop traffic and invalidate restored epochs/challenges/signing namespaces before reopening; normal stale-cache tests do not certify disaster recovery.

## Atomic reset and revocation

Hashing occurs outside PostgreSQL. Anonymous recovery has a narrow database-owned capability constructed only in API bootstrap; application receives request/confirm ports. It never mints VerifiedPrincipal. Architecture rejects direct/aliased capability imports by business services; worker composition receives only the delivery capability.

Final bounded SERIALIZABLE transaction looks up only credential namespace, locks user exclusively before credential/challenge/family work and re-reads enabled user, password identity, immutable binding, proven ownership and current epoch. Challenge must be current-key/current-epoch, unused, uncanceled, unexpired and below attempt cap. Keyed digests compare in constant time. Invalid proof increments attempts and commits normally despite generic accepted output.

Valid atomic UPDATE consumes only while primary `clock_timestamp()` precedes expiry. The same transaction replaces the approved Argon2id hash, advances user epoch and revokes every authenticated family for that user. One contender commits; losing SERIALIZABLE transactions roll back. Replay cannot change hash/epoch twice. Logout-all/disable/reset/key rotation invalidate old proofs, including delayed mail. No client identity, role, verification timestamp or family is accepted.

Exclusive user fence orders reset against existing protected transactions, establishment/rotation and logout-all. Earlier committed writes remain committed; reset cannot retract reads, external effects or already-committing work. Later stale principals/families fail primary epoch/revocation checks even if Valkey bytes reappear. Existing request lifetime, fresh cache boundary and transactional tenant fences are unchanged. Reset creates no session/family and emits no authenticated cookie. Old cache may remain until TTL but cannot authorize. Unknown primary acknowledgement may have committed; clients need normal login/new recovery, never inferred exactly-once success.

## Durable delivery

Issuance inserts challenge/outbox atomically, never sends inside a transaction or queues plaintext. Active current-epoch work is reused while delivery is acknowledged, retryable or has a live final lease. Undelivered five-claim work with no live lease is canceled/replaced transactionally by an explicit rate-admitted request. Concurrent replacements produce at most one new live proof; new15minute lifetime never extends old proof.

Existing worker and bounded HTTPS/loopback Mailpit JSON transport are reused with server-fixed recovery subject/message domain. Database delivery keeps separate table/crypto/verified-account eligibility rules rather than generalizing authenticated verification authority into anonymous recovery. Polling once/second is non-overlapping; claims use `FOR UPDATE SKIP LOCKED`, five attempts,30s lease/retry and2s HTTP acknowledgement. Current verified credential, enabled password identity, epoch and live proof are checked; reconstructed digest must match before send.

Lease commits before network. Timeout/abort is not cancellation or proof of nondelivery. Unknown acknowledgement retries identical proof. Expired leases permit another worker; lease-ID CAS prevents old ack overwriting successor evidence. Late real delivery/ack after replacement can record delivery but cannot undo cancellation or grant authority. No infinite automatic retries; explicit rate-bound issuance recovers exhausted work. Tokens never enter application persistence, BullMQ payloads, logs, evidence or URLs. Mailbox necessarily receives plaintext proof; local Mailpit stores owned test messages, deleted without forensic erasure claims. Authenticated HTTPS relay, downstream delivery/sender reputation, mailbox retention/logging, alerts/reconciliation and operational secret/clock/restore reviews remain pending.

## Evidence and human review

Machine-readable [verification evidence](evidence/BE-00I-C-verification.json) records final gates and failed observations. Real owned PostgreSQL/Valkey/Nest HTTP/Mailpit tests cover eligibility/generic results/timing floor; delivered reset/new-password login/old-password denial; all previous sessions; concurrent redemption; durable attempts/exhaustion; expiry/replay/SQL tampering; logout-all and hash-to-commit race; delayed stale mail; refused transport/exhaustion/replacement; unknown acknowledgement/crash lease/late ack; key/domain mismatch; dependency outages; restart; strict CSRF/origin/body and concurrent budgets. Scheduling faults affect only owned disposable rows; production deadlines/assertions are unchanged.

Development failures: initial9pass/1fail241assertions17.36s exposed raw-SQL serialization mapping. Lint's unused timer exposed ineffective floor arithmetic; fixed elapsed monotonic calculation with explicit floor test. Later16pass/1fail393assertions23.68s exposed an owned pending outbox interfering with another test's global claim; timing-test work is canceled after assertions. Intermediate15/36121.43s and16/37925.33s passed. No weaker assertions or timeout increases.

Historical queue timeout/late error, SIGTERM143 and dependency audit remain visible, alongside earlier BE-00F/NEXUS/timing risks. Review migration/cryptography/runtime grants, anonymous enumeration under load, multi-replica Argon2 budgets, mail/browser/TLS deployment, key/PITR recovery, retention/monitoring and post-reset notifications. Frontend/marketing fixtures, OAuth/MFA and workspace grants are untouched. Stop at human review; do not merge or begin frontend integration.

## Final verification matrix

| Gate | Result |
|---|---|
| Recovery real PostgreSQL/Valkey/HTTP/Mailpit |18pass/421assertions,30.14s; includes restored stale cache and already-minted principal|
| Email verification |16pass/468assertions,24.64s|
| Authentication |26pass/812assertions,20.59s|
| Sessions |25pass/254assertions,17.01s|
| Auth fences |24pass/134assertions,11.79s|
| Tenancy / upgrade preservation |34pass/132assertions,14.95s|
| Database integration |2pass/5assertions,1.61s|
| Backend final |99pass/260assertions,13.32s|
| Architecture / typecheck / lint / build |Pass;349files/961edges/zero violations;API52.47KB/worker4.77KB|
| Migration / schema / frozen install / diff |Pass;8migrations,no pending;385installs/506packages,no change|
| Infrastructure |**4pass/1fail**,15assertions;0.742s then1.474s;job rejection completed but next assertion lacked worker `job_failed` log; ordering unresolved|
| Lifecycle |**1pass/2fail**,7assertions;3.07s then4.73s;API/workerSIGTERM143|
| Audit |**Exit1**,existing high deepmerge-ts advisory; no unrelated upgrade|

Original five-second queue notification timeout remains historical; current failure is a distinct observed worker-log ordering assertion in unchanged code, not declared harmless or fixed. Final probes found zero recovery-owned databases/cache keys. One local Mailpit message remained after failed fixture delivery; it is recipient mailbox storage, its owned database was dropped and it cannot regain primary authority. No claim of complete mailbox or forensic erasure; unidentified mail was not globally purged. Development services are stopped with volumes retained after verification.
