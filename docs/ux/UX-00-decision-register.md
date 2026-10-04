# UX-00: Unblok Frozen Decision Register

**Platform**: Unblok — High-Density Engineering Execution & Dependency Intelligence  
**Document**: Architectural Decision Register (ADR)  
**Status**: APPROVED / FROZEN CONTRACT  

---

## Decision 1: Default Post-Authentication Destination

* **Status**: FROZEN
* **Decision**: The default authenticated entry point is strictly `/my-work`. Marketing pages and login/signup screens are explicitly excluded from the product application shell.
* **Context**: When an engineer opens Unblok, they need immediate clarity on what is blocking them, what they are blocking, and what they need to execute today. An aggregate project dashboard or workspace feed induces cognitive fatigue.
* **Alternatives Considered**:
  - `/projects`: Too broad; requires drilling down through teams and projects before seeing assigned work.
  - `/insights`: Analytical, not operational; suitable for leadership review, not daily execution.
  - `/roadmap`: High-level timeline; lacks immediate personal task focus.
* **Consequences**:
  - `/my-work` must be engineered as an ultra-fast, personalized triage cockpit.
  - Global navigation highlights `My Work` as the primary anchor.

---

## Decision 2: Dual Issue Model (Slide-Over Drawer vs. Dedicated Full Page)

* **Status**: FROZEN
* **Decision**: Unblok formally splits issue interaction into two distinct surfaces:
  1. `IssueDrawer`: A fixed 440px slide-over panel opened via query param (`?drawer=:issueKey`) over list, board, schedule, and graph views. Keyboard navigation (`J`/`K`) updates the drawer without closing it.
  2. `IssueDetailPage` (`/issues/:issueKey`): A full-screen 2-column canonical URL destination for deep specification authoring, extensive comment reading, and multi-hop dependency management.
* **Context**: Engineers frequently switch between rapid batch triage (where losing page scroll or filter state is unacceptable) and deep focused execution (where maximum horizontal width and permanent deep-linkable URLs are required).
* **Alternatives Considered**:
  - *Modal Dialog*: Interrupts workflow, hides background list, blocks keyboard navigation.
  - *Drawer-Only*: Prevents clean browser bookmarking and external link sharing (e.g. in PRs or Slack).
  - *Full-Page Only*: Destroys list triage speed by forcing constant back-and-forth page reloads.
* **Consequences**:
  - The drawer layer must be persistent and decoupled from individual page state.
  - The drawer header includes an explicit "Open in Full Page" action (`Cmd+O`).

---

## Decision 3: Client-Side DAG Validation Before Mutation

* **Status**: FROZEN
* **Decision**: All dependency additions are validated by a pure Depth-First Search (DFS) cycle-detection algorithm (`src/domain/dependency.ts`) on the client *before* any state update or network call. If a cycle is detected, the action is immediately aborted and `CycleErrorDialog` displays the exact circular loop path.
* **Context**: Circular dependencies (`A → B → C → A`) create algorithmic deadlock in critical path calculations, gantt timelines, and completion guards.
* **Alternatives Considered**:
  - *Server-Only Validation*: Slower feedback loop; requires network round-trip to fail.
  - *Warning Only*: Allows corrupt data into the system, breaking downstream scheduling.
* **Consequences**:
  - The graph invariant is non-negotiable and guaranteed at the domain layer.

---

## Decision 4: Hard Completion Guard on Blocked Issues

* **Status**: FROZEN
* **Decision**: An issue cannot transition to `DONE` if it has unresolved upstream blockers. Attempting this transition blocks the state change and opens `CompletionGuardDialog`, detailing every active blocker and offering a 1-click action to inspect each blocker.
* **Context**: Accidental or premature completion of prerequisite tasks is a primary source of integration bugs and delivery delays in distributed engineering teams.
* **Alternatives Considered**:
  - *Soft Warning Banner*: Ignored by users during rapid triage.
  - *Silent State Transition Failure*: Disorients users who don't understand why a card didn't move.
* **Consequences**:
  - Workflows are strictly protected against false completion signals.

---

## Decision 5: Team vs. Project Domain Scoping

* **Status**: FROZEN
* **Decision**: Strict domain hierarchy: `Workspace → Team → Project → Issue`.
  - **Teams** represent organizational ownership (people, squads, tech leads).
  - **Projects** represent discrete software deliverables with sequential keys (e.g., `ENG`, `INF`).
  - A project belongs to exactly one owning team. Cross-team collaboration occurs via cross-project dependencies, not by merging teams into projects.
* **Context**: Conflating teams and projects leads to ambiguous ownership of sprint cycles, issues, and delivery metrics.
* **Alternatives Considered**:
  - *Flat Projects with Team Tags*: Lacks dedicated team hubs and squad-level sprint velocity tracking.
  - *Multiple Owning Teams per Project*: Creates responsibility ambiguity.
* **Consequences**:
  - Clear architectural boundaries for routing (`/teams/:teamKey` and `/projects/:projectKey`).

---

## Decision 6: Navigation Rail Compactness & Desktop Presence

* **Status**: FROZEN
* **Decision**: Default desktop navigation rail is collapsed to 52px width with high-contrast icon accelerators. It expands to 220px on toggle (`[` / `]`).
* **Context**: Unblok is a high-density tool. On a standard 1440px desktop display, wide static sidebars waste 200–300px of valuable horizontal space needed for 5-column boards, 10-column tables, and 14-day timeline grids.
* **Alternatives Considered**:
  - *Permanent 260px Sidebar*: Constrains table columns and causes unnecessary horizontal scrolling.
  - *Top Navbar Only*: Inadequate vertical grouping for workspaces with 10+ core product surfaces.
* **Consequences**:
  - Tooltips and keyboard accelerators (`G M`, `G P`, `G D`) are first-class navigation elements.
