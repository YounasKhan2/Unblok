# Database and integrity contract

Status: proposed shape; actual Prisma schema deferred until BE-00B review.

Candidate entities: users, accounts/credentials, sessions, workspaces, memberships, invitations, teams, team_members, projects, issues, comments, dependency_edges, cycles, milestones, notifications, activities, audit_events, attachments, outbox_events, preferences, integration_connections. Reconcile with frontend types and workflows before finalizing.

Non-negotiable:
- PostgreSQL is authoritative, with FK/unique/check constraints and transactionally protected cross-row rules.
- Each workspace-owned record has an unambiguous tenant parent; use composite workspace-bound keys/FKs where needed to forbid cross-workspace relationships (not just filtering by workspace_id).
- Validate that team belongs to workspace and project belongs to owning team/workspace; enforce within same transaction where required.
- Scoped unique project keys/issue sequences; allocate sequence atomically and avoid race conditions. Optimistic version checks for conflicting edits; define HTTP 409 semantics.
- Dependency edges cannot connect unauthorized/incompatible resources; prevent duplicate edges and invalid self/cyclic relationships according to approved domain rules. Protect concurrent graph modifications transactionally.
- Soft delete/audit retention, if chosen, must not leak into active queries; define referential and recovery policies.
- Explicit workspace/user indexes, order-by indexes for paginated routes and indexes justified by query plans; keyset pagination for high-volume lists.
- Migrations are additive-first (expand/backfill/contract), reviewed, repeatable, tested with old/new application versions where needed. Never reset production DB to fix migration errors.
- High-sensitivity identity/session data should be minimally stored, encrypted/hashed as appropriate and never returned in generic DTOs.
- Backups and point-in-time recovery are production requirements. Test restoring representative data and RustFS attachment references; Docker volumes alone aren't backups.
