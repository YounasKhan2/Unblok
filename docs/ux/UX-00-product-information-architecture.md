# UX-00: Unblok Product Information Architecture

**Platform**: Unblok — High-Density Engineering Execution & Dependency Intelligence  
**Document**: Product Information Architecture Specification  
**Status**: HUMAN REVIEW — NOT FROZEN  
**Target Milestone**: Architecture Definition (UX-00)  
**Parent Ownership Hierarchy**: `Workspace → Team → Project → Issue`

---

## 1. Executive Summary & Product Thesis

Unblok is not a generic low-code project tracker or a simplified Kanban board. It is an **engineering execution engine for technical organizations**, engineered to solve the primary failure mode of modern software delivery: **hidden, untracked, and circular dependencies across teams and projects**.

### Core Product Thesis
> **High-density execution and dependency intelligence for technical teams.**

While conventional tools treat blockers as mere text tags or passive metadata flags, Unblok elevates dependencies to **first-class system entities governed by directed acyclic graph (DAG) topological invariants, completion guards, and bottleneck intelligence**.

### Architectural Tenets
1. **Low Ceremony, High Density**: Maximize information per square inch on standard 1440px desktop screens. Avoid padded consumer whitespace, decorative cards-within-cards, and multi-step modal wizards.
2. **First-Class Dependency Graph**: Every issue transition validates upstream blockers. Downstream impact, blocker aging, and cross-team bottlenecks are exposed at every level of the product.
3. **Keyboard-First Ergonomics**: Every operational workflow can be executed without leaving the home row via single-key accelerators (`J`/`K` navigation, `X` selection, `C` create, `Cmd+K` command orchestration).
4. **Context Preservation (Drawer vs. Detail)**: Reading or updating an issue must never disorient the user or wipe filter and scroll positions. Transient inspection belongs in the slide-over drawer; deep focus belongs on the dedicated canonical URL.
5. **Deterministic Ownership Hierarchy**: `Workspace → Team → Project → Issue`. Teams represent organizational ownership and headcount; projects represent delivery scope with strict sequencing; issues are atomic units of work.

---

## 2. Product Hierarchy & Domain Model

```
                    ┌────────────────────────────────────────┐
                    │               WORKSPACE                │
                    │      (Active Tenant Context)           │
                    └───────────────────┬────────────────────┘
                                        │
                 ┌──────────────────────┴──────────────────────┐
                 ▼                                             ▼
    ┌─────────────────────────┐                   ┌─────────────────────────┐
    │          TEAM           │                   │          TEAM           │
    │  (Core Platform)        │                   │  (Infra / Reliability)  │
    └────────────┬────────────┘                   └────────────┬────────────┘
                 │                                             │
        ┌────────┴────────┐                           ┌────────┴────────┐
        ▼                 ▼                           ▼                 ▼
 ┌─────────────┐   ┌─────────────┐             ┌─────────────┐   ┌─────────────┐
 │   PROJECT   │   │   PROJECT   │             │   PROJECT   │   │   PROJECT   │
 │ (Auth Core) │   │(Data Pipeline│            │(Cloud Inf)  │   │(Observability│
 └──────┬──────┘   └──────┬──────┘             └──────┬──────┘   └──────┬──────┘
        │                 │                           │                 │
        ▼                 ▼                           ▼                 ▼
 ┌─────────────┐   ┌─────────────┐             ┌─────────────┐   ┌─────────────┐
 │    ISSUE    │◄──┼── [DAG] ────┼─────────────┼────────────►│    ISSUE    │
 │  (ENG-101)  │   │ (Blocker)   │             │             │  (INF-204)  │
 └─────────────┘   └─────────────┘             └─────────────┘   └─────────────┘
```

### Hierarchy Rules & Semantic Boundaries
1. **Primary Ownership Hierarchy**: `Workspace → Team → Project → Issue` represents the organizational ownership model. It is not a strict database containment tree for every feature. Direct issue deep links remain first-class; users never have to navigate through each ancestor to reach an issue.
2. **Workspace Scope & Boundary**: The top-level administrative and tenant boundary.
   - All domain queries, issue collections, and mutations are workspace-scoped.
   - Cross-project and cross-team dependencies are fully supported within a workspace.
   - **Cross-workspace dependencies are strictly forbidden**.
3. **Teams vs. Projects**:
   - **Team**: A persistent engineering organizational unit (e.g., Core Platform, Infrastructure, Web Apps). A team owns projects and sprint cycles.
   - **Project**: A bounded scope of engineering output (e.g., Auth V2, Postgres Migration). Projects have unique human-facing identifier keys (e.g., `ENG`, `INF`) and issue sequence counters. A project belongs to exactly one owning Team.
4. **Issues**: Atomic units of execution with 6 deterministic lifecycle states (`BACKLOG`, `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`, `CANCELLED`).
5. **Users / Members**:
   - Users belong directly to the Workspace.
   - Users may participate in one or more Teams.
   - Users are evaluated under the canonical three-role authorization model: `ADMIN`, `MEMBER`, `OBSERVER`. Users are *not* nodes in the project hierarchy.
6. **Cadences (Cycles & Milestones)**:
   - **Cycles are Team-scoped**: A cycle belongs to exactly one Team. A cycle contains issues from multiple projects owned by that Team. There are no workspace-owned cycles.
   - **Milestones are Workspace-scoped**: Strategic release targets (e.g., Q4 General Availability) that aggregate issues across multiple teams, projects, and cycles.

---

## 3. Separation of Internal Identity and Human-Facing Routing Identity

A fundamental architectural rule of Unblok:
> **Internal identity and human-facing routing identity are separate concerns.**

- **Immutable Internal IDs**: Entities possess stable, immutable internal identifiers (e.g., `workspaceId`, `teamId`, `projectId`, `issueId`, `cycleId`, `milestoneId`). Database relations, graph edge definitions, and domain invariants bind strictly to internal IDs.
- **Human-Facing Routing Identifiers**: Routing paths and display badges utilize human-readable keys and slugs (e.g., project key `ENG`, issue key `ENG-142`, team slug `core-platform`).
- **Controlled Mutability**: Human-readable keys may support controlled administrative updates in the future without corrupting internal graph linkages or breaking entity identity.
- **Resolution Contract**: Deep links and router loaders resolve human-facing identifiers to stable internal entity IDs within the active workspace context.

---

## 4. Canonical Role Model

Unblok enforces a clean, three-role authorization model:

| Role | Operational Scope | Capabilities |
| :--- | :--- | :--- |
| **`OBSERVER`** | Read-Only | May view issues, projects, teams, cycles, milestones, roadmap, dependencies, and insights. Cannot create, edit, transition issues, or mutate settings. |
| **`MEMBER`** | Normal Execution | Standard engineering contributor. May create, edit, prioritize, and transition issues; add/remove dependency links; author comments; participate in cycles. |
| **`ADMIN`** | Workspace Administration | Full workspace administrative control. Manages workspace settings, member invitations and role changes, team creation, and destructive project actions. |

*Note: Functional leadership responsibilities (such as Tech Lead or Team Lead assignments) exist as domain assignments and metadata on teams/projects, not as separate RBAC roles.*

---

## 5. Four-Tier Architecture Model

To cleanly scale Unblok, the frontend isolates concerns into four distinct layers:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. APP / SHELL LAYER                                                    │
│    Routing, Layout, Active Workspace Context, Global Hotkeys, Cmd+K     │
├─────────────────────────────────────────────────────────────────────────┤
│ 2. PAGES (Route-Addressable Destinations)                               │
│    /my-work, /projects/:key/board, /issues/:key, /dependencies, etc.    │
├─────────────────────────────────────────────────────────────────────────┤
│ 3. FEATURES (Cross-Page Domain Capabilities)                            │
│    IssueTable, BlockerGraph, CycleRollover, CommentThread, BulkBar      │
├─────────────────────────────────────────────────────────────────────────┤
│ 4. COMPONENTS (Reusable Primitives & UI Controls)                       │
│    Avatar, StatePill, PriorityIcon, Popover, Modal, Button, SearchInput │
├─────────────────────────────────────────────────────────────────────────┤
│ 5. DOMAIN (Pure Business Invariants & Graph Rules)                      │
│    DAG Cycle Detection, Completion Guard Rules, Rollup Math, Audit Log  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Architecture Contract (`app → pages → features → components → domain`)
- **Pages** assemble **Features** and supply URL query state. Pages never contain graph math or state machine logic.
- **Features** bind domain operations to reusable UI components. A feature (such as `CommentThread` or `DependencyManager`) can appear in both `IssueDrawer` and `IssueDetailPage`.
- **Components** are presentation and interaction primitives with zero knowledge of issue IDs or workspace models.
- **Domain** contains pure, deterministic TypeScript modules with 0% DOM dependencies, allowing 100% headless testability.

---

## 6. Canonical Product Spaces & Information Topology

The Unblok product surface is partitioned into 8 logical spaces:

| Space | Primary Purpose | Scope | Primary Users |
| :--- | :--- | :--- | :--- |
| **1. Personal Execution** | Individual triage, focus, notifications, and blockers | Personal (`Me`) | All Engineers (`MEMBER`, `ADMIN`) |
| **2. Projects** | Scope delivery, backlog refinement, board execution | Project | Squads, Engineers, Product Managers |
| **3. Teams** | Team member roster, owned projects, team cycle velocity | Team | Engineers, Squad Leads |
| **4. Planning** | Time cadences (Team Cycles), strategic targets (Milestones), Roadmap | Team / Workspace | Release Managers, Leads, Engineers |
| **5. Dependencies** | Real-time DAG graphs, bottleneck matrices, dependency queue | Workspace | Engineers, Architects, Leads |
| **6. Insights** | Delivery velocity, blocker aging, health rollups, risk analysis | Workspace / Team | Engineering Leadership, Team Members |
| **7. Issues** | Deep-focus canonical workspace issue view, audit, comments | Single Issue | Assignees, Reviewers, Blocked Peers |
| **8. Settings** | Org administration, member access, team configuration, preferences | Workspace / Personal | Admins, Members |

---

## 7. Dependency Intelligence Architecture

Dependencies are elevated beyond standard relational foreign keys.

### Core Dependency Model: `A BLOCKS B`
- **Directed Relation**: Issue `A` is the upstream prerequisite; Issue `B` is the downstream dependent.
- **Active Blocker**: An active blocker exists when upstream issue `A` is in an incomplete state (`BACKLOG`, `TODO`, `IN_PROGRESS`, `IN_REVIEW`).
- **Resolved Blocker**: When upstream issue `A` transitions to `DONE` or `CANCELLED`, the persisted dependency relation becomes inactive/resolved. Reopening `A` immediately reactivates the blocker.
- **Topological Invariants**:
  1. No self-edges (`A BLOCKS A` is illegal).
  2. No duplicate edges.
  3. No cycles (`A → B → C → A` is strictly prohibited).
  4. Blocked issues cannot transition to `DONE`.
- **Validation Role**: The client and domain layer provide immediate, non-blocking feedback during interaction (e.g., immediate cycle detection modal). The future backend will authoritatively enforce these invariants upon mutation.

### Multi-Tier Dependency Surfaces
1. **Micro-Level (Issue Drawer & Row)**: Immediate blocker alert badge, prerequisite inspection, and completion guard modal.
2. **Meso-Level (Project Board & Issue List)**: Visual blocker indicators, filtering by `is:blocked`.
3. **Macro-Level (Workspace Dependency Intelligence)**: Interactive topological DAG canvas (`/dependencies`), pairwise dependency matrix, and cross-team bottleneck views.
4. **Strategic-Level (Insights & Milestones)**: Milestone risk rollups and blocker aging metrics.
