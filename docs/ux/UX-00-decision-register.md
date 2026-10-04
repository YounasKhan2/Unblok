# UX-00: Unblok Decision Register

**Platform**: Unblok — High-Density Engineering Execution & Dependency Intelligence  
**Document**: Architectural Decision Register (ADR)  
**Status**: HUMAN REVIEW — NOT FROZEN  

---

## Decision 1: Default Post-Authentication Destination

* **Status**: CANDIDATE / PENDING HUMAN REVIEW
* **Decision**: The default authenticated entry point is strictly `/my-work`. Marketing pages and authentication/login screens are explicitly excluded from the application shell.
* **Context**: When an engineer opens Unblok, they need immediate clarity on what is blocking them, what they are blocking, and what needs their attention today. An aggregate project dashboard or workspace feed induces cognitive fatigue.
* **Alternatives Considered**:
  - `/projects`: Too broad; requires drilling down through teams and projects before seeing assigned work.
  - `/insights`: Analytical, not operational; suitable for leadership review, not daily execution.
  - `/roadmap`: High-level timeline; lacks immediate personal task focus.
* **Consequences**:
  - `/my-work` must be engineered as an ultra-fast, personalized triage cockpit.
  - Global navigation highlights `My Work` as the primary anchor.

---

## Decision 2: Dual Issue Model (Slide-Over Drawer vs. Dedicated Full Page)

* **Status**: CANDIDATE / PENDING HUMAN REVIEW
* **Decision**: Unblok formally splits issue interaction into two distinct surfaces:
  1. `IssueDrawer`: A fixed 440px slide-over panel opened via query param (`?drawer=:issueKey`) over list, board, schedule, and graph views. Keyboard navigation (`J`/`K`) updates the drawer without closing it. Closing removes drawer query parameters while preserving the base page route and filters.
  2. `IssueDetailPage` (`/issues/:issueKey`): A full-screen 2-column canonical URL destination for deep technical authoring, extensive comment reading, and multi-hop dependency management.
* **Context**: Engineers frequently switch between rapid batch triage (where losing page scroll or filter state is unacceptable) and deep focused execution (where maximum horizontal width and permanent deep-linkable URLs are required).
* **Alternatives Considered**:
  - *Modal Dialog*: Interrupts workflow, hides background list, blocks keyboard navigation.
  - *Drawer-Only*: Prevents clean browser bookmarking and external link sharing (e.g. in PRs or Slack).
  - *Full-Page Only*: Destroys list triage speed by forcing constant back-and-forth page reloads.
* **Consequences**:
  - The drawer layer must be persistent and decoupled from individual page state.
  - Closing the drawer cleans URL query state without relying on naive history-back assumptions.

---

## Decision 3: Directed Acyclic Graph (DAG) Invariants & Blocker Inactivity

* **Status**: CANDIDATE / PENDING HUMAN REVIEW
* **Decision**: All dependency relationships follow the directed relation `A BLOCKS B`. An active blocker exists when upstream issue `A` is in an incomplete state (`BACKLOG`, `TODO`, `IN_PROGRESS`, `IN_REVIEW`). When `A` reaches `DONE` or `CANCELLED`, the persisted dependency relation becomes inactive/resolved. Reopening `A` reactivates it.
  - Client domain algorithms provide immediate, non-blocking feedback during interaction (e.g., circular error dialogs).
  - Authoritative graph invariant enforcement will be handled by the future backend upon mutation.
* **Context**: Circular dependencies (`A → B → C → A`) create algorithmic deadlock in scheduling and delivery.
* **Alternatives Considered**:
  - *Bidirectional Generic Links*: Lacks semantic causality; cannot enforce completion guards.
  - *Silent State Transition Failure*: Disorients users who don't understand why a card didn't move.
* **Consequences**:
  - Graph integrity is maintained consistently across all UI representations.

---

## Decision 4: Completion Guard on Blocked Issues

* **Status**: CANDIDATE / PENDING HUMAN REVIEW
* **Decision**: An issue cannot transition to `DONE` if it has unresolved upstream blockers. Attempting this transition interrupts the action and opens `CompletionGuardDialog`, detailing every active blocker and offering a 1-click action to inspect each blocker.
* **Context**: Accidental or premature completion of prerequisite tasks is a primary source of integration bugs and delivery delays in engineering teams.
* **Alternatives Considered**:
  - *Soft Warning Banner*: Ignored by users during rapid triage.
  - *Silent Failure*: Leaves users confused.
* **Consequences**:
  - Workflows are strictly protected against false completion signals.

---

## Decision 5: Team vs. Project Ownership & Cycle Scoping

* **Status**: CANDIDATE / PENDING HUMAN REVIEW
* **Decision**: 
  - **Ownership Hierarchy**: `Workspace → Team → Project → Issue`. Teams represent organizational ownership (people, squads). Projects represent discrete deliverables with sequential keys (e.g., `ENG`, `INF`). A project belongs to exactly one owning team.
  - **Cycles are Team-scoped**: A cycle belongs to one Team and may contain issues from multiple projects owned by that team. There are no workspace-owned cycles.
  - **Milestones are Workspace-scoped**: Strategic release targets that aggregate issues across multiple teams, projects, and cycles.
* **Context**: Conflating teams and projects leads to ambiguous ownership of sprint cycles, issues, and delivery metrics.
* **Alternatives Considered**:
  - *Workspace-Owned Cycles*: Impractical for organizations where teams operate on independent sprint cadences.
  - *Multiple Owning Teams per Project*: Creates responsibility ambiguity.
* **Consequences**:
  - Clear architectural boundaries for routing (`/teams/:teamKey`, `/projects/:projectKey`, `/cycles/:cycleId`).

---

## Decision 6: Navigation Rail Compactness & Desktop Presence

* **Status**: CANDIDATE / PENDING HUMAN REVIEW
* **Decision**: Default desktop navigation rail is collapsed to 52px width with high-contrast icon accelerators. It expands to 220px on toggle (`[` / `]`).
* **Context**: Unblok is a high-density tool. On a standard 1440px desktop display, wide static sidebars waste 200–300px of valuable horizontal space needed for 5-column boards, 10-column tables, and 14-day timeline grids.
* **Alternatives Considered**:
  - *Permanent 260px Sidebar*: Constrains table columns and causes unnecessary horizontal scrolling.
  - *Top Navbar Only*: Inadequate vertical grouping for workspaces with 10+ core product surfaces.
* **Consequences**:
  - Tooltips and keyboard accelerators (`G M`, `G P`, `G D`) are first-class navigation elements.

---

## Decision 7: Canonical Three-Role Authorization Model

* **Status**: CANDIDATE / PENDING HUMAN REVIEW
* **Decision**: The Unblok authorization model is strictly limited to three roles:
  1. `OBSERVER`: Read-only access across workspace surfaces.
  2. `MEMBER`: Standard execution (create, edit, triage, comment, dependencies).
  3. `ADMIN`: Full administrative control (workspace settings, member invitations, team creation, project deletion).
* **Context**: Introducing complex, speculative RBAC hierarchies (such as Tech Lead, Team Lead, Project Admin) prematurely adds cognitive and implementation overhead. Leadership assignments exist as domain attributes and metadata, not separate RBAC roles.
* **Alternatives Considered**:
  - *Fine-Grained Custom Roles*: Over-engineered for current architecture phase.
* **Consequences**:
  - Route guards and UI capability gates map strictly to three deterministic roles.

---

## Decision 8: Separation of Internal Identity and Human-Facing Routing Identity

* **Status**: CANDIDATE / PENDING HUMAN REVIEW
* **Decision**: Entities possess immutable internal IDs (e.g., `workspaceId`, `teamId`, `projectId`, `issueId`, `cycleId`, `milestoneId`). Human-facing identifiers (`ENG`, `ENG-142`, `core-platform`) serve exclusively as routing and display identifiers.
* **Context**: Tying database identity directly to human-editable strings causes fragile foreign keys and prevents future key renaming.
* **Alternatives Considered**:
  - *Using Human Keys as Primary Database Keys*: Fragile; breaks upon key updates.
* **Consequences**:
  - Deep links and routers resolve human-facing identifiers to stable internal entity IDs.

---

## Decision 9: Active Workspace as Application Context

* **Status**: CANDIDATE / PENDING HUMAN REVIEW
* **Decision**: The active workspace is maintained as an application-level context rather than being hardcoded into every route path.
* **Context**: Keeping canonical routes clean (`/my-work`, `/projects/ENG/issues`, `/issues/ENG-101`) improves bookmarking and human ergonomics while preserving complete compatibility with future slug or subdomain routing.
* **Alternatives Considered**:
  - *Premature Slug Routing (`/:workspaceSlug/...`)*: Adds unnecessary URL noise and route-nesting complexity during frontend development.
* **Consequences**:
  - All data queries and mutations resolve through the active workspace authorization context.
