# Proposed action/resource policy — not runtime grants

All candidate grants below require human approval and implementation in the Workspace or owning resource slice. Current production `denyAll`, three-action TenantAction and dependency SQL gate remain unchanged. Authentication is necessary, never sufficient. A capability response is a UI hint derived from current server facts, not permission evidence reusable on mutation.

Every tenant operation requires fresh request-bound session/primary fences and current ACTIVE workspace membership. Missing, INVITED, SUSPENDED and foreign memberships deny all ordinary tenant reads/writes with generic404; global authentication may remain valid. Invitation redemption is a separate proof-bound account operation, not an INVITED-membership bypass. Archived workspaces permit approved reads but no writes, including invitations. Archived teams/projects/issues are hidden from ordinary queries; lifecycle administration requires a separate explicit action, not a status filter bypass.

| Resource/action (proposed vocabulary) | ACTIVE ADMIN | ACTIVE MEMBER | ACTIVE OBSERVER | Additional conditions / scope |
| --- | --- | --- | --- | --- |
| workspace:read; workspace:self | Candidate allow | Candidate allow | Candidate allow | Own workspace; no team data implied; archived read-only |
| workspace:create | Account policy, not workspace role | Same | Same | Enabled authenticated account, abuse/idempotency; initial ADMIN for creator only, atomic creation. No client role/user ID |
| workspace:members:list | Candidate allow | Deny pending directory privacy review | Deny pending privacy review | Admin management projection; name/status/role only, no contact-email lookup |
| workspace:invite | Candidate allow | Deny | Deny | ACTIVE workspace, verified sender, bounded recipient/role MEMBER or OBSERVER only; no ADMIN elevation in this contract |
| invitation:accept | Eligible recipient account | Same | Same | One-use current invitation + verified immutable credential email; no existing role required, no implicit linking; cannot unsuspend existing membership |
| workspace:members:manage; workspace:archive | Candidate allow in future slice | Deny | Deny | Last-active-admin SQL invariant; no API registered here; demotion/suspension ordered with reads/writes |
| team:list/read | Candidate allow only on permitted teams | Same | Same | Explicit team relationship and exact team visibility grant. ADMIN has no team bypass. Hidden team names/counts excluded |
| team:create/manage | Candidate admin management action | Deny until explicit delegated team-management policy | Deny | Workspace-admin creation does not grant access to unrelated existing teams. Ownership/delegation unresolved |
| project:list/read/overview | Candidate allow | Candidate allow | Candidate allow | Active owning team + team membership + exact project and each issue grant; no project-level umbrella grant |
| project:create/manage | Explicit candidate action | Explicit candidate action, no role-only grant | Deny | Team relationship + approved project-management facts; absent facts deny |
| issue:list/read | Candidate allow | Candidate allow | Candidate allow | Active project/team, exact issue visibility; assignee or creator alone is not an access bypass |
| issue:create/update/batch | Candidate action | Candidate action | Deny | Approved per-resource action, active ancestors, CAS, assignment validation; no blanket role-based update policy |
| issue:complete-with-dependencies | Deny until authoritative completion policy exists | Same | Deny | Complete primary blocker check under graph/integrity locks, not bounded display traversal; unavailable/partial result refuses completion |
| dependency:read | Candidate allow | Candidate allow | Candidate allow | Both endpoint issue/project/team grants. Cross-workspace always deny |
| dependency:create/remove | Deny until policy and DAG validation exist | Same | Deny | SQL gate remains; full reachability and opposing-edge/completion race proof required |

Scope overrides every cell: suspended/foreign membership denies; archived workspace forbids writes; unknown action/fact denies; ADMIN is not a universal ownership bypass. Workspace bootstrap does not pass through a fake pre-existing membership: a future narrow database creation port checks account authority and commits workspace + initial creator ADMIN + result ledger together. It must not distribute raw Database to a service.

## Collections, counts and hidden records

Apply the same authorized relation to row selection, aggregates, search, existence checks, filter choices and summaries. No hidden titles/IDs/team names, inaccessible counts, partial totals presented as full totals, or role-specific error detail. `null` count means an explicitly unimplemented approved capability; dependency outage is503, not null. MEMBER/OBSERVER do not gain member-directory access through a count/lookup endpoint.

Prefer reviewed SQL visibility selectors; post-filtering inspects at most500 candidates/5chunks and advances cursor to last inspected tuple, including empty visible pages with remaining candidates. Bound metadata and joins, never fetch all hidden records to fill a page. No exact total unless authorization is safely computable over the full declared relation. Invitations return generic accepted results and never reveal whether a submitted email has an account.

Dependency edges require both endpoints visible. Do not infer unblocked status from absence of a hidden edge. Restricted-blocker disclosure itself needs approval; until then affected blocker/impact capability stays unavailable and completion remains denied. No dangling endpoint IDs or hidden counts in graph continuation.

Long reads use existing primary user/family/workspace shared locks, completion authority check and request lifetime. A revocation acquiring the conflicting workspace lock first denies the later read; an earlier bounded read holding the shared lock can finish before revocation commit. Bytes already delivered cannot be recalled. Do not stream an unbounded collection or hold one principal across page requests. Each next page/replay gets fresh authority. [Lifecycle contract](lifecycle.md) defines revision and replay ordering.
