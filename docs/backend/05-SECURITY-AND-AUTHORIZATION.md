# Security and authorization

P0 / deny-by-default. This document defines required threat-model topics, not a claim that controls have been implemented.

Trust boundaries: browser, authenticated API, PostgreSQL, Valkey/BullMQ, RustFS, worker, email, external integrations, and WebSocket connection. Attack cases: horizontal cross-workspace IDOR, privilege escalation, stolen sessions, invitation replay, CSRF, brute force, mass assignment, unauthorized file access, forged websocket room subscription, worker confused-deputy actions, leaked secrets and SSRF via integrations.

Controls:
- Short-lived/safely rotated server-side sessions with HttpOnly Secure SameSite cookie policy; define CSRF mitigation if cookie-authenticated mutations and WebSockets are used. Passwords: modern adaptive hash, account-recovery tokens hashed/short-lived/single-use.
- Every resource read/write/list resolves membership and effective role server-side, including nested project/team, notifications, files, background jobs and realtime room joins. Workspace context in URL/body is only a selector.
- Do not expose whether foreign workspace resources exist. Audit role changes, membership removal, invites, authentication-sensitive events and high-risk mutations.
- DTO allowlists, schema validation, payload/body/attachment limits, content sanitization/output encoding, secure CORS, request timeouts, abuse throttles with appropriate per-IP/account/workspace bounds.
- S3 object keys scoped/opaque; short-lived signed upload/download flows; verify MIME and size server-side; antivirus/content-scanning policy before public download; no trust in client filenames.
- Least-privilege service principals; secret rotation, no plaintext secrets in logs or source, dependency scanning and supply-chain review.
- Tests must include two tenants with colliding identifiers, missing roles, revoked membership, concurrent invite consumption, cross-tenant issue/dependency links and private-object access.
