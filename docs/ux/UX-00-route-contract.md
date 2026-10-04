# UX-00: Unblok Route Contract & URL Architecture

**Platform**: Unblok — High-Density Engineering Execution & Dependency Intelligence  
**Document**: Canonical Route Hierarchy & Parameter Specification  
**Status**: APPROVED / FROZEN CONTRACT  

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
└── settings                                      
    ├── workspace                                 [PAGE-SETTINGS-WORKSPACE]
    ├── members                                   [PAGE-SETTINGS-MEMBERS]
    ├── teams                                     [PAGE-SETTINGS-TEAMS]
    ├── integrations                              [PAGE-SETTINGS-INTEGRATIONS]
    └── preferences                               [PAGE-SETTINGS-PREFERENCES]
```

---

## 2. Path Parameters vs. Query Parameters Contract

To guarantee clean browser history, bookmarking, and future API mapping, Unblok strictly demarcates between **Path Parameters** (Resource Identity) and **Query Parameters** (View State & Filters).

### Path Parameters (Resource Identity)
Path parameters are reserved exclusively for permanent, addressable resource identities. They must be human-readable, stable, and unique within the workspace.

| Parameter | Type | Example | Validation / Constraints | Resource Identity |
| :--- | :--- | :--- | :--- | :--- |
| `:projectKey` | String | `ENG`, `INF`, `WEB` | 2–6 uppercase alphanumeric characters; unique per workspace. | Canonical project key. |
| `:issueKey` | String | `ENG-101`, `INF-42` | `^[A-Z]{2,6}-[0-9]+$`; globally unique within workspace. | Canonical atomic issue identifier. |
| `:teamKey` | String | `core-platform`, `infra` | Lowercase kebab-case slug; unique per workspace. | Permanent team slug. |
| `:cycleId` | String | `cycle_24`, `cycle_25` | Lowercase identifier or sequential number. | Time-boxed sprint cadence. |
| `:milestoneId` | String | `q4_ga`, `soc2_comp` | Lowercase kebab-case slug. | Strategic release milestone. |

### Query Parameters (View State & Filtering)
Transient UI state, search filters, and active tab selectors must be stored in the URL query string to enable deep linking to filtered views without altering path hierarchies.

| Query Parameter | Allowed Values | Default | Purpose |
| :--- | :--- | :--- | :--- |
| `?state=` | `ALL`, `BACKLOG`, `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`, `CANCELLED` | `ALL` | Filters issues by lifecycle state. |
| `?priority=` | `ALL`, `URGENT`, `HIGH`, `MEDIUM`, `LOW` | `ALL` | Filters issues by operational priority. |
| `?assignee=` | `ALL`, `me`, `unassigned`, or user UUID | `ALL` | Filters issues by assigned engineer. |
| `?cycle=` | `ALL`, `current`, `upcoming`, or cycle ID | `ALL` | Filters issues by sprint cycle. |
| `?milestone=` | `ALL`, or milestone ID | `ALL` | Filters issues by linked strategic milestone. |
| `?blocker=` | `ALL`, `BLOCKED_ONLY`, `BLOCKING_OTHERS`, `UNBLOCKED` | `ALL` | Filters issues by dependency status. |
| `?q=` | String (e.g., `postgres pool`) | `""` | Full-text query string or power syntax (`is:blocked`). |
| `?view=` | `list`, `board`, `matrix`, `graph` | Page default | Switches presentation layout without changing underlying route. |
| `?drawer=` | `:issueKey` (e.g., `?drawer=ENG-101`) | `null` | Deep links the active slide-over issue drawer over any base page. |
| `?tab=` | String (e.g., `properties`, `dependencies`, `comments`, `audit`) | `properties` | Sets active sub-tab inside the issue drawer or detail view. |

---

## 3. Deep Linking & Drawer URL Architecture

A common failure mode in modern web apps is losing slide-over context when refreshing or sharing a link. Unblok solves this via the **Secondary Drawer Query State**:

### The Dual-URL Model
1. **Full Page Canonical Link**:
   `/issues/ENG-101`
   - Use Case: Sharing in Slack/PRs, deep technical reading, full-screen comment authoring.
   - Behavior: Renders the full 2-column detail view without background list.

2. **Context-Preserved Drawer Link**:
   `/projects/ENG/issues?drawer=ENG-101&tab=dependencies`
   - Use Case: Reviewing an issue in the context of its project backlog, allowing immediate `J`/`K` navigation to adjacent issues upon closing.
   - Behavior: Renders `/projects/ENG/issues` in the main canvas and automatically opens the 440px `IssueDrawer` on the `DEPENDENCIES` tab.
   - Browser History: Opening the drawer pushes a shallow URL state (`history.pushState`). Pressing `Esc` or clicking the drawer close button invokes `history.back()`, seamlessly returning the URL to `/projects/ENG/issues`.

---

## 4. Future API Mapping & Workspace Boundaries

Unblok's route design mirrors RESTful resource boundaries for seamless future backend integration:

| Frontend Route | Future Backend API Endpoint | HTTP Method |
| :--- | :--- | :--- |
| `/projects/:projectKey/issues` | `/api/v1/workspaces/:wsId/projects/:projectKey/issues` | `GET` |
| `/issues/:issueKey` | `/api/v1/workspaces/:wsId/issues/:issueKey` | `GET`, `PATCH` |
| `/issues/:issueKey/dependencies` | `/api/v1/workspaces/:wsId/issues/:issueKey/dependencies` | `POST`, `DELETE` |
| `/cycles/:cycleId/rollover` | `/api/v1/workspaces/:wsId/cycles/:cycleId/rollover` | `POST` |
| `/dependencies` (Graph) | `/api/v1/workspaces/:wsId/dependencies/dag` | `GET` |
| `/insights` | `/api/v1/workspaces/:wsId/insights/velocity` | `GET` |

### Multi-Tenancy & Workspace Scoping
- **Prototype Mode**: Single workspace context stored in memory/session.
- **Enterprise Multi-Workspace Future**: The route contract is designed to cleanly support tenant prefixes (e.g., `/:workspaceSlug/my-work` or subdomain routing `acme.unblok.io/my-work`) without changing any internal route patterns.

---

## 5. Authorization & Route Guard Matrix

Every route in the registry maps to an explicit role permission gate:

| Route Pattern | Required Role | Unauthorized Behavior |
| :--- | :--- | :--- |
| `/my-work`, `/inbox` | Any Authenticated Member | Redirect to login |
| `/projects/*` (Read) | Workspace Member | 404 / 403 Forbidden Page |
| `/projects/:key/settings` | Project Admin or Workspace Admin | Redirect to `/projects/:key` with error toast |
| `/issues/:issueKey` (Read) | Workspace Member | 404 Issue Not Found |
| `/cycles/*`, `/milestones/*` (Edit) | Team Lead or Workspace Admin | Action controls disabled / read-only view |
| `/settings/workspace`, `/settings/members` | Workspace Admin | 403 Access Denied |
| `/settings/preferences` | Any Authenticated Member | Accessible to all users |
