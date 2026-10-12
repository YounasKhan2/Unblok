# Frozen-screen read matrix

Future contracts only; demo providers remain unchanged. Cold authentication adds existing `/auth/me` and needed `/auth/csrf`; neither becomes a whole-workspace payload. [Registry](registry.json) specifies response schemas/bounds.

| Screen / audited source | Initial business request | Response / maximum data | Refresh, loading, authorization | Query shape |
| --- | --- | --- | --- | --- |
| Workspace switcher / WorkspaceSwitcher |1 GET `/workspaces?limit=50` | WorkspacePage:100max, id/slug/name/status/current membership role display;64KiB | Popover loading/empty/error; pagination retains keyboard focus; switching clears tenant data and navigates My Work; ACTIVE own membership, archived approved reads | user/status membership index + bounded workspace join; no issues/projects |
| Teams / TeamsDirectoryPage + selectTeamDirectory |1 GET `/workspaces/{workspaceId}/teams?limit=50&q=..&status=ACTIVE` | TeamPage:100max, key/name/status, authorized member/project/active-issue counts;128KiB | Preserve compact cards/search/status/create guard; authorized aggregates; no all-record client recomputation | Page teams, then grouped counts per metric family; no member×project×issue Cartesian join |
| Project overview / ProjectOverviewPage + selectors |1 GET scoped `/projects/{projectId}/overview` | Overview: summary, attention10,execution10,blockingOthers10 with3downstream previews each;192KiB; cycle/activity unavailable until models | One coherent read; panel capabilities, global failure≠empty project; team/project/each issue permission | Authorized grouped counts + bounded sections,≤8business SELECTs |
| Issues / ProjectIssuesPage |1 GET scoped `/projects/{projectId}/issues?limit=50`; optional second metadata request when filters opened | IssuePage:100row DTOs, bounded assignee/blocker summaries;128KiB; no descriptions/graph/comments | Filter resets cursor; preserve J/K/selection on append; select-all only loaded authorized rows until bulk selection reviewed; drawer detail lazy | tenant/project/status tuple index, bulk assignee/dependency joins, no per-row SQL |
| My Work / MyWorkPage + selectors |1 GET scoped `/my-work`; section load-more `/my-work/issues?section=...&limit=50` |5sections×10initial plus blockingOthers10×3preview;192KiB; section page100max/128KiB | Derive current membership from principal; independent group cursors; full authorized counts or explicit unavailable; no count from page | ws+assignee+status keyset and state groups,≤8business SELECTs |
| Dependencies list/blockers / DependenciesPage |1 GET scoped project `/dependencies?limit=50&status=active` | DependencyPage:100edges and two bounded references per edge;128KiB | Future live view requires explicit project/issue root; current workspace-wide fixture view is not a production full graph; cross-team disclosure review | tenant adjacency + authorized endpoint joins; hidden prerequisites not ignored |
| Canvas / DependenciesPage + calculateGraphLayout |1 POST scoped project `/graph/query`; interaction expands bounded view | GraphPage:200nodes/400edges,300KiB,depth≤3, completeness/continuation; viewport only after reviewed layout snapshot | One in-flight request, cancel/discard stale; preserve styles/zoom/keyboard; no whole workspace fetch | Bounded frontier + bulk rows,≤12business SELECTs,≤2000inspected edges |

All totals use identical authorized filter/scope. Unknown capability is distinct from zero; query outage is503, not capability unavailable. Overview cycle/activity and My Work due/cycle behavior await models; issue manual order needs rank; avatars/team descriptions need privacy/models. Matrix/longest-chain/bottleneck needs a separately bounded projection and benchmark; a partial canvas is not global truth.

Lazy metadata consists of separately paged team/project/member lookup DTOs≤100 each, never a universal user list. No badge endpoint sprawl: row owns lightweight references; overview owns coherent sections. Writes stay resource-based then invalidate affected projections.

Later UX ledger: desktop/mobile light/dark, loading/empty/error/403/429/503, URL filters, drawer/J/K, focus across paging, optimistic conflict rollback, account/workspace switches with requests pending, and no NEXUS fallback. This phase audits source and does not claim browser recertification.

## Workspace vertical-slice additions (all proposed)

| Surface | Initial/on-action requests | Bounds, loading and authorization |
| --- | --- | --- |
| Selected workspace/shell context |1 GET workspace detail containing own role/capabilities; standalone `/me` only for explicit later refresh |64KiB, no nested business records; selection clears prior-tenant content;404revocation removes selection,503keeps unavailable state; hints rechecked server-side on actions |
| Membership management |1 GET scoped memberships; pages on demand |50default/100max,128KiB, joinedAt/id keyset, status filter; ADMIN management grant only; spinner/error distinct from empty; no contact emails |
| Workspace onboarding creation |1 POST workspace with CSRF + Idempotency-Key, then selected detail |201≤64KiB, initial creator ADMIN only after atomic commit; duplicate submit coalesced; unknown outcome reconciles same key, no fixture workspace |
| Invitation management |1 POST scoped invitation |202generic≤64KiB; no immediate membership/recipient-existence inference; bounded role choices under approved admin policy, no ADMIN elevation |
| Invitation redemption |1 POST account-scoped acceptance, then GET workspace list and own detail only if server lists the membership |202generic≤64KiB; verification required, no client role/identity; accepted≠joined; suspended accounts/memberships never revived; preserve loading/error states without mock fallback |

[Workspace contracts](workspaces.md) define exact proposed transitions, pagination and slice dependencies. These reads are coherent context/management operations, not a badge endpoint per capability. No frontend flow is implemented or redesigned by this correction.
