# Frontend integration status

FE-AUTH-01 is merged and locally verified, including same-browser revoked-cookie recovery. Its [report](01-FE-AUTH-01-INTEGRATION.md) retains historical observations and deployment limitations.

FE-WS-01, including PR #36 F1 same-account pending-creation reconciliation, merged at `0ef38121d940e0bbbc37a6d82b8c2f1fa9049564`. Four Workspace APIs provide bounded discovery, creation, current membership context and honest empty business screens. [Report](02-FE-WS-01-WORKSPACE-INTEGRATION.md), [original evidence](evidence/FE-WS-01-verification.json) and [correction evidence](evidence/FE-WS-01-correction-verification.json) retain their historical review-time results. This is not a deployment or production-certification claim.

BE-WS-02 merged through PR #37 at `d473e02487d1a6b40225a54b3105bd8fed05d0aa`. FE-WS-02 integrates its real ADMIN membership directory, invitation issuance and authenticated acceptance on `feat/fe-ws-02-members-invitations`. [Implementation report](03-FE-WS-02-MEMBERS-INVITATIONS.md), [gate evidence](evidence/FE-WS-02-verification.json) and [Chromium evidence](evidence/fe-ws-02/results.json) distinguish verified local behavior and pending deployment requirements. FE-WS-02 is implemented for human review, **not merged, deployed or production-certified**.

NEXUS remains a labelled fixture-backed demo. No role management, new business APIs or Team/Project/Issue/Dependency data integration is delivered. Pending invitation metadata is actor-bound; proofs are memory-only. Generic 202 never establishes membership. Three historical NEXUS test failures and backend queue, lifecycle, audit and deployment risks remain open. Stop at human review; no next milestone is authorized.
