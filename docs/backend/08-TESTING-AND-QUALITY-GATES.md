# Quality gates and verification

Per-phase mandatory evidence:
1. Typechecking, lint/format, build and all existing frontend unit/integration/E2E regression tests.
2. Contract tests for API success/errors, pagination, response shapes, authentication and stable compatibility.
3. PostgreSQL integration tests against real database with migrations, FK/unique constraints, transactions and rollback.
4. Cross-tenant negative tests for all endpoint families; role changes, revoked users, team-project-workspace mismatch, data-existence leaks and foreign attachments.
5. Concurrency/idempotency tests for issue sequences, versions, membership changes, invitations, dependency links and retries.
6. Worker delivery behavior after crashes/duplicate events, websocket authorization and reconnect/resync checks.
7. Empty/loading/error states and no mock fallback verified in built production bundle/import graph for migrated features.
8. Performance measurements, query plans, bounded list sizes, resource consumption and regression thresholds appropriate to implemented slice.
9. Secret/dependency/static-analysis scanning, security review and threat-model update; backup/restore checks for infra changes.
10. Record exact commands, passing/failing results, known deviations, changed files and PR SHA. Failing P0 controls block approval.

A checklist is not test evidence. Unimplemented tests are tracked as gaps; passing typecheck cannot certify authorization, scalability or real-world reliability.
