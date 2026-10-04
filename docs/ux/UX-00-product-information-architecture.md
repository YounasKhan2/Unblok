# UX-00: Unblok Product Information Architecture

**Platform**: Unblok — High-Density Engineering Execution & Dependency Intelligence  
**Document**: Product Information Architecture Specification  
**Status**: APPROVED / FROZEN CONTRACT  
**Target Milestone**: Architecture Definition (UX-00)  
**Parent Hierarchy**: `Workspace → Team → Project → Issue`

---

## 1. Executive Summary & Product Thesis

Unblok is not a generic low-code project tracker or a simplified Kanban board. It is an **industrial-grade execution engine for engineering organizations**, engineered to solve the primary failure mode of modern software delivery: **hidden, untracked, and circular dependencies across teams and projects**.

### Core Product Thesis
> **High-density execution and dependency intelligence for technical teams.**

While conventional tools treat blockers as mere text tags or passive metadata flags, Unblok elevates dependencies to **first-class system entities governed by directed acyclic graph (DAG) topological invariants, hard state completion guards, and real-time bottleneck intelligence**.

### Architectural Tenets
1. **Low Ceremony, High Density**: Maximize information per square inch on standard 1440px desktop screens. Avoid padded consumer whitespace, decorative cards-within-cards, and multi-step modal wizards.
2. **First-Class Dependency Graph**: Every issue transition validates upstream blockers. Downstream impact, blocker aging, and cross-team bottlenecks are exposed at every level of the product.
3. **Keyboard-First Ergonomics**: Every operational workflow can be executed without leaving the home row via single-key accelerators (`J`/`K` navigation, `X` selection, `C` create, `Cmd+K` command orchestration).
4. **Context Preservation (Drawer vs. Detail)**: Reading or updating an issue must never disorient the user or wipe filter and scroll positions. Transient inspection belongs in the slide-over drawer; deep focus belongs on the dedicated canonical URL.
5. **Deterministic Structural Hierarchy**: `Workspace → Team → Project → Issue`. Teams represent organizational ownership and headcount; projects represent delivery scope with strict sequencing; issues are atomic units of work.

---

## 2. Product Hierarchy & Domain Model

```
                    ┌────────────────────────────────────────┐
                    │               WORKSPACE                │
                    │   (Tenant / Org Boundary / SSO Domain) │
                    └───────────────────┬────────────────────┘
                                        │
                 ┌──────────────────────┴──────────────────────┐
                 ▼                                             ▼
    ┌─────────────────────────┐                   ┌─────────────────────────┐
    │          TEAM           │                   │          TEAM           │
    │  (Eng Ownership/Cadence)│                   │  (Infra / Reliability)  │
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

### Hierarchy Rules & Invariants
1. **Workspace Boundary**: The top-level administrative and security boundary. Cross-project and cross-team dependencies are fully supported within a workspace. **Cross-workspace dependencies are strictly forbidden**.
2. **Teams vs. Projects**:
   - **Team**: A persistent human organization unit (e.g., Core Platform, Security, Mobile). A team owns projects and sprint cycles.
   - **Project**: A bounded scope of engineering output (e.g., Auth V2, Postgres Migration). Projects have unique identifier keys (e.g., `ENG`, `INF`) and issue sequence counters. A project belongs to exactly one owning Team.
3. **Issues**: Atomic units of execution with 6 deterministic lifecycle states (`BACKLOG`, `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`, `CANCELLED`).
4. **Users / Members**: Users belong directly to the Workspace and are assigned to one or more Teams with specific role privileges (`ADMIN`, `TECH_LEAD`, `MEMBER`, `OBSERVER`). Users are *not* nodes in the project hierarchy.
5. **Cross-Cutting Cadences (Cycles & Milestones)**:
   - **Cycles**: Time-boxed delivery intervals (e.g., 2-week sprints) owned at the Team or Workspace level. Issues from multiple projects owned by that team can be scheduled in a cycle.
   - **Milestones**: Strategic, cross-team milestone deadlines (e.g., Q4 General Availability, SOC-2 Compliance) that aggregate issues across multiple teams and projects into rollup health scores.

---

## 3. Four-Tier Architecture Model

To scale Unblok from a single-page prototype into an enterprise platform, the frontend conceptually isolates concerns into four distinct layers:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. APP / SHELL LAYER                                                    │
│    Routing, Layout, Auth context, Global Hotkeys, Command Palette       │
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
│    DAG Cycle Detection, Hard Completion Guard, Rollup Math, Audit Log   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Architecture Contract (`app → pages → features → components → domain`)
- **Pages** never contain raw SVG path math or custom state machines. They assemble **Features** and supply URL query state.
- **Features** bind domain operations to reusable UI components. A feature (such as `CommentThread` or `DependencyManager`) can appear in both the slide-over `IssueDrawer` and the full `IssueDetailPage`.
- **Components** are strictly presentational or generic UI controls with zero knowledge of issue IDs or workspace models.
- **Domain** contains pure, deterministic TypeScript modules with 0% DOM dependencies, allowing 100% headless testability.

---

## 4. Canonical Product Spaces & Information Topology

The Unblok product surface is partitioned into 8 logical spaces:

| Space | Primary Purpose | Scope | Primary Users |
| :--- | :--- | :--- | :--- |
| **1. Personal Execution** | Individual triage, focus, notifications, and blockers | Personal (`Me`) | All Engineers, Tech Leads |
| **2. Projects** | Scope delivery, backlog refinement, board execution | Project (`proj_*`) | Squads, Engineers, Product Managers |
| **3. Teams** | Team capacity, member roster, team projects, cycle velocity | Team (`team_*`) | Engineering Managers, Team Leads |
| **4. Planning** | Time cadences (Cycles), strategic targets (Milestones), Gantt | Team / Workspace | Release Managers, Tech Leads, EMs |
| **5. Dependencies** | Real-time DAG graphs, critical path analysis, bottleneck matrix | Workspace | Staff+ Engineers, Architects, Leads |
| **6. Insights** | Delivery velocity, blocker aging, health rollups, risk analysis | Workspace / Team | Directors, VP Eng, Engineering Managers |
| **7. Issues** | Deep-focus canonical workspace issue view, audit, comments | Single Issue | Assignees, Reviewers, Blocked Peers |
| **8. Settings** | Org administration, access control, integrations, preferences | Workspace / Team | Admins, Members |

---

## 5. Dependency Intelligence Architecture

Dependencies are elevated beyond standard relational foreign keys. The Unblok Information Architecture enforces explicit intelligence at 4 granular tiers:

### Tier 1: Micro-Level (Issue Drawer & Row)
- **Immediate Blocker Alert**: Amber pill badge indicating exact number of blocking upstream tasks (`2 Active Blockers`).
- **Prerequisite Inspection**: Instant hover preview showing upstream keys, assignees, and current states.
- **Hard Completion Guard**: Attempting to move an issue with incomplete blockers to `DONE` immediately triggers the blocking modal, listing unresolved prerequisite keys and blocking transitions.

### Tier 2: Meso-Level (Project Board & Issue List)
- **Visual Graph Linkages**: Issue cards and rows show explicit blocker badges. Blocked issues can be isolated with `is:blocked` filters.
- **Dependency Flow Matrix**: Grid view displaying peer-to-peer relationships between issues within the project.

### Tier 3: Macro-Level (Workspace Dependency Intelligence)
- **Topological DAG Canvas**: Node-and-edge interactive canvas rendering the complete directed graph across all projects.
- **Critical Path Highlighting**: Algorithmic identification of the longest dependency path determining project delivery.
- **Cross-Team Bottleneck Heatmap**: Visual matrix highlighting teams that generate the highest volume of upstream blockers for other squads.

### Tier 4: Strategic-Level (Insights & Milestones)
- **Blocker Aging Velocity**: Metric tracking the duration issues spend in the blocked state.
- **Milestone Risk Analysis**: Automatic classification of milestones into *On Track*, *At Risk*, or *Critical* based on transitive blocker trees.

---

## 6. Decision Register Summary

| ID | Topic | Decision | Primary Rationale |
| :--- | :--- | :--- | :--- |
| **DR-01** | Default Post-Auth Route | `/my-work` | Focuses the engineer on immediate attention items rather than an overwhelming aggregate dashboard. |
| **DR-02** | Issue Drawer vs. Detail Page | Split: Drawer for triage, Page for canonical deep link | Preserves list/board context during rapid triage while maintaining a crawlable, shareable deep-linkable URL. |
| **DR-03** | Dependency Invariant | Enforce client + domain DAG check before edge creation | Eliminates circular deadlock before data ever reaches persistence. |
| **DR-04** | Completion Guard Enforcement | Hard blocking modal with prerequisite breakdown | Prevents accidental closing of tasks when prerequisites are incomplete, preventing shipping bugs. |
| **DR-05** | Cadence Scoping | Cycles are Team-scoped; Milestones are Workspace-scoped | Teams operate on distinct sprint lengths; strategic goals transcend individual team boundaries. |
| **DR-06** | Navigation Density | Pinned icon/compact rail with flyout popovers | Preserves maximum horizontal screen width for dense tabular and board displays. |
