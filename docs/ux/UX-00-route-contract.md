# UX-00: Unblok Route Contract & URL Architecture

**Platform**: Unblok — High-Density Engineering Execution & Dependency Intelligence  
**Document**: Canonical Route Hierarchy & Parameter Specification  
**Status**: HUMAN REVIEW — NOT FROZEN  

---

## 1. Route Hierarchy Specification

```
/
├── my-work                                       [PAGE-MY-WORK]
├── inbox                                         [PAGE-INBOX]
│
├── projects                                      [PAGE-PROJECTS-INDEX]
│   └── :projectKey                               [PAGE-PROJECT-OVERVIEW]
│       ├── issues                                [PAGE-PROJECT-ISSUES]
│       ├── board                                 [PAGE-PROJECT-BOARD]
│       ├── planning                              [PAGE-PROJECT-PLANNING]
│       └── settings                              [PAGE-PROJECT-SETTINGS]
│
├── issues
│   └── :issueKey                                 [PAGE-ISSUE-DETAIL]
│
├── teams                                         [PAGE-TEAMS-INDEX]
│   └── :teamKey                                  [PAGE-TEAM-DETAIL]
│
├── cycles                                        [PAGE-CYCLES-INDEX]
│   └── :cycleId                                  [PAGE-CYCLE-DETAIL]
│
├── milestones                                    [PAGE-MILESTONES-INDEX]
│   └── :milestoneId                              [PAGE-MILESTONE-DETAIL]
│
├── roadmap                                       [PAGE-ROADMAP]
├── dependencies                                  [PAGE-DEPENDENCIES]
├── insights                                      [PAGE-INSIGHTS]
│
└── settings                                      [PAGE-SETTINGS-INDEX]
    ├── workspace                                 [PAGE-SETTINGS-WORKSPACE]
    ├── members                                   [PAGE-SETTINGS-MEMBERS]
    ├── teams                                     [PAGE-SETTINGS-TEAMS]
    ├── integrations                              [PAGE-SETTINGS-INTEGRATIONS]
    └── preferences                               [PAGE-SETTINGS-PREFERENCES]
```

---

## 2. Workspace Routing & Context Architecture

The Unblok route architecture cleanly decouples the human-facing route hierarchy from workspace multi-tenancy:

1. **Active Workspace as Application Context**:
   - The active workspace is an **application-level context**, not currently encoded in every URL path.
   - Human-facing routes remain clean and bookmarkable (`/my-work`, `/projects/ENG/issues`, `/issues/ENG-101`).
   - All domain queries, issue collections, cycle schedules, and mutations execute within the scope of the active workspace context.
   - Switching the workspace changes the application context, reloading workspace-scoped datasets while preserving page intent where valid.
2. **Tenant Boundary & Cross-Workspace Isolation**:
   - Route identifiers (`:projectKey`, `:issueKey`, `:teamKey`) are always evaluated and resolved within the active workspace authorization context.
   - Cross-workspace dependencies remain strictly forbidden.
3. **Future Deployment Compatibility**:
   - Because all page components resolve data through workspace context, future production deployments may adopt slug-prefixed routing (e.g., `/:workspaceSlug/my-work`) or subdomain-based routing (e.g., `acme.unblok.io/my-work`) without changing page semantics, component contracts, or internal view logic.

---

## 3. Separation of Internal Identity and Human-Facing Routing Identity

A strict architectural distinction is enforced between **Internal Entity Identity** and **Human-Facing Routing Identifiers**:

* **Conceptual Rule**:
  > **Internal identity and human-facing routing identity are separate concerns.**

* **Internal IDs**: Entities possess immutable internal identifiers (e.g., `workspaceId`, `teamId`, `projectId`, `issueId`, `cycleId`, `milestoneId`). Database storage, foreign keys, graph edges, and domain invariants bind exclusively to internal IDs.
* **Human-Facing Routing Identifiers**:
  - `:projectKey`: Human-readable project key (e.g., `ENG`, `INF`, `WEB`).
  - `:issueKey`: Human-readable atomic issue identifier (e.g., `ENG-101`, `INF-42`).
  - `:teamKey`: Human-readable team slug (e.g., `core-platform`, `infra`).
  - `:cycleId`: Human-readable team cycle identifier (e.g., `cycle-24`).
  - `:milestoneId`: Human-readable milestone slug (e.g., `q4-ga`).
* **Controlled Mutability**: Human-readable keys (e.g., renaming a team slug or updating a project key) may have controlled mutability in the future without corrupting internal entity identity or breaking DAG dependency linkages.
* **Resolution Contract**: Deep links and route loaders resolve human-facing identifiers to stable internal entity IDs within the active workspace context.

---

## 4. Path Parameters vs. Query Parameters Contract

Unblok strictly demarcates between **Path Parameters** (Resource Identity) and **Query Parameters** (View State & Filters):

### Path Parameters (Resource Identity)
Reserved exclusively for addressable resource identities.

| Parameter | Example | Target Resource |
| :--- | :--- | :--- |
| `:projectKey` | `ENG`, `INF` | Project resource identity. |
| `:issueKey` | `ENG-101`, `INF-42` | Canonical atomic issue identity. |
| `:teamKey` | `core-platform` | Team squad identity. |
| `:cycleId` | `cycle-24` | Team-scoped sprint cadence identity. |
| `:milestoneId` | `q4-ga` | Workspace strategic milestone identity. |

### Query Parameters (View State & Filtering)
Transient UI state, search filters, and active tab selectors are stored in URL query strings.

| Query Parameter | Example Values | Purpose |
| :--- | :--- | :--- |
| `?state=` | `TODO`, `IN_PROGRESS`, `DONE` | Filters issues by lifecycle state. |
| `?priority=` | `URGENT`, `HIGH`, `MEDIUM`, `LOW` | Filters issues by operational priority. |
| `?assignee=` | `me`, `unassigned`, or user ID | Filters issues by assigned engineer. |
| `?cycle=` | `current`, `upcoming`, or cycle ID | Filters issues by sprint cycle. |
| `?milestone=` | Milestone ID | Filters issues by linked milestone. |
| `?blocker=` | `BLOCKED_ONLY`, `BLOCKING_OTHERS` | Filters issues by dependency status. |
| `?q=` | `postgres pool` | Text query or power syntax (`is:blocked`). |
| `?view=` | `list`, `board` | Switches presentation layout. |
| `?drawer=` | `ENG-101` | Deep links the active slide-over issue drawer. |
| `?tab=` | `properties`, `dependencies`, `comments` | Sets active sub-tab inside the drawer. |

---

## 5. Dual-Surface Issue Interaction & Drawer History Semantics

Unblok formalizes the interaction contract between the slide-over drawer and the dedicated issue detail page:

### The Dual-Surface Model
1. **Contextual Drawer Link**:
   `/projects/ENG/issues?drawer=ENG-101`
   - Use Case: Rapid inspection, property edits, and triage without losing list/board context.
   - Deep Linking: Directly loading a URL containing `?drawer=` must safely render the base page and open the drawer without assuming any previous history entry.
2. **Full Page Canonical Link**:
   `/issues/ENG-101`
   - Use Case: Deep focus, full specification authoring, extensive discussions, permanent links for code reviews.

### Drawer Closing Semantics
- **Closing the Drawer**:
  - Closing the drawer (via `Esc`, close icon, or backdrop click) removes the drawer-specific query parameter (`?drawer=...` and `?tab=...`) from the URL.
  - It strictly preserves the base route, active filters, search queries, sort orders, view mode, and scroll/cursor context.
- **Browser History**:
  - Browser Back behaves naturally according to the user's actual navigation history stack.
  - The URL contract does not hard-code `history.back()` assumptions on drawer closure.

---

## 6. Conceptual Future API Compatibility

In accordance with frontend architecture discipline, concrete REST endpoint paths, HTTP verbs, DTO schemas, and pagination protocols are intentionally deferred to the System Design phase.

Conceptually, the route architecture maps cleanly to 6 high-level resource boundaries:
1. **Workspace Context**: Tenant metadata, workspace membership, and configuration.
2. **Issue Collections**: Filterable, paginated, and virtualizable issue sets (by project, team, cycle, milestone, or assignee).
3. **Individual Issues**: Granular read and mutation operations for issue state, properties, and descriptions.
4. **Dependencies**: DAG relation management (`A BLOCKS B`), prerequisite validation, and cycle verification queries.
5. **Planning Resources**: Team-scoped cycles, cycle rollover operations, and workspace-scoped milestones.
6. **Analytics & Intelligence**: Blocker aging metrics, delivery velocity, and graph bottleneck queries.

---

## 7. Role-Based Route Access Matrix

Every route in the registry maps to the canonical three-role model:

| Route Pattern | `OBSERVER` | `MEMBER` | `ADMIN` | Unauthorized Behavior |
| :--- | :--- | :--- | :--- | :--- |
| `/my-work`, `/inbox` | Read | Read / Write | Read / Write | Redirect to login |
| `/projects`, `/projects/:key/*` (Except settings) | Read | Read / Write | Read / Write | 404 Not Found |
| `/projects/:key/settings` | No Access | No Access | Read / Write | Redirect to `/projects/:key` with notice |
| `/issues/:issueKey` | Read | Read / Write | Read / Write | 404 Issue Not Found |
| `/teams`, `/teams/:key` | Read | Read / Write | Read / Write | 404 Team Not Found |
| `/cycles`, `/cycles/:id` | Read | Read / Write | Read / Write | Read-only mode |
| `/milestones`, `/milestones/:id` | Read | Read / Write | Read / Write | Read-only mode |
| `/roadmap`, `/dependencies`, `/insights` | Read | Read / Write | Read / Write | Read-only mode |
| `/settings/preferences` | Read / Write | Read / Write | Read / Write | Accessible to all users |
| `/settings/workspace`, `/settings/members`, `/settings/teams`, `/settings/integrations` | No Access | No Access | Read / Write | Redirect to `/settings/preferences` |
