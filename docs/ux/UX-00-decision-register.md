# UX-00: Unblok Decision Register

**Platform**: Unblok — High-Density Engineering Execution & Dependency Intelligence  
**Document**: Architectural Decision Register (ADR)  
**Status**: APPROVED — UX-00 FROZEN  

---

## Decision 1: Default Post-Authentication Destination

* **Status**: FROZEN
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

* **Status**: FROZEN
* **Decision**: Unblok formally splits issue interaction into two distinct surfaces:
  1. `IssueDrawer`: A fixed 440px slide-over panel opened via query param (`?drawer=:issueKey`) over list, board, schedule, and graph views. Keyboard navigation (`J`/`K`) updates the drawer without closing it. Closing removes drawer query parameters while preserving the base page route, active filters, and scroll context.
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

* **Status**: FROZEN
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

* **Status**: FROZEN
* **Decision**: An issue cannot transition to `DONE` if it has unresolved upstream blockers. Attempting this transition interrupts the action and opens `CompletionGuardDialog`, detailing every active blocker and offering a 1-click action to inspect each blocker.
* **Context**: Accidental or premature completion of prerequisite tasks is a primary source of integration bugs and delivery delays in engineering teams.
* **Alternatives Considered**:
  - *Soft Warning Banner*: Ignored by users during rapid triage.
  - *Silent Failure*: Leaves users confused.
* **Consequences**:
  - Workflows are strictly protected against false completion signals.

---

## Decision 5: Team vs. Project Ownership & Cycle Scoping

* **Status**: FROZEN
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

* **Status**: FROZEN
* **Decision**: Default desktop navigation rail is collapsed to 52px width with high-contrast icon accelerators. It expands to 220px on toggle (`[` / `]`).
* **Context**: Unblok is a high-density tool. On a standard 1440px desktop display, wide static sidebars waste 200–300px of valuable horizontal space needed for 5-column boards, 10-column tables, and 14-day timeline grids.
* **Alternatives Considered**:
  - *Permanent 260px Sidebar*: Constrains table columns and causes unnecessary horizontal scrolling.
  - *Top Navbar Only*: Inadequate vertical grouping for workspaces with 10+ core product surfaces.
* **Consequences**:
  - Tooltips and keyboard accelerators (`G M`, `G P`, `G D`) are first-class navigation elements.

---

## Decision 7: Canonical Three-Role Authorization Model

* **Status**: FROZEN
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

* **Status**: FROZEN
* **Decision**: Entities possess immutable internal IDs (e.g., `workspaceId`, `teamId`, `projectId`, `issueId`, `cycleId`, `milestoneId`). Human-facing identifiers (`ENG`, `ENG-142`, `core-platform`) serve exclusively as routing and display identifiers.
* **Context**: Tying database identity directly to human-editable strings causes fragile foreign keys and prevents future key renaming.
* **Alternatives Considered**:
  - *Using Human Keys as Primary Database Keys*: Fragile; breaks upon key updates.
* **Consequences**:
  - Deep links and routers resolve human-facing identifiers to stable internal entity IDs.

---

## Decision 9: Active Workspace as Application Context

* **Status**: FROZEN
* **Decision**: The active workspace is maintained as an application-level context rather than being hardcoded into every route path.
* **Context**: Keeping canonical routes clean (`/my-work`, `/projects/ENG/issues`, `/issues/ENG-101`) improves bookmarking and human ergonomics while preserving complete compatibility with future slug or subdomain routing.
* **Alternatives Considered**:
  - *Premature Slug Routing (`/:workspaceSlug/...`)*: Adds unnecessary URL noise and route-nesting complexity during frontend development.
* **Consequences**:
  - All data queries and mutations resolve through the active workspace authorization context.

---

## Decision 10: WIP Limits as Soft Execution Signals

* **Status**: FROZEN
* **Decision**: For the current Unblok product contract, **WIP limits are soft execution signals, not hard lifecycle guards**.
  - WIP limits may display column/team overload, present visual warnings, and contribute to future delivery insights.
  - WIP limits must **NOT** prevent an issue from entering a lifecycle state.
* **Context**: This is an intentional product distinction from dependency completion guards (which are hard domain invariants protecting against premature completion). Blocking work from entering an in-progress or review column causes artificial process friction when urgent hotfixes or priority shifts occur.
* **Alternatives Considered**:
  - *Hard WIP Gates*: Prevents engineers from moving cards into columns when limits are exceeded, creating severe workflow blockades during emergency releases.
* **Consequences**:
  - Kanban board columns and team views display clear visual overload indicators without rejecting drag-and-drop or status transitions.

---

## Decision 11: Deferral of Hierarchical Sub-Issues

* **Status**: FROZEN
* **Decision**: **Hierarchical sub-issues are explicitly deferred from the current core product contract.**
  - Current dependency graph nodes remain first-class Issues.
  - Subtasks within an issue remain flat checklist items without multi-level nesting.
  - Unblok does **NOT** introduce nested issue DAG rules, checklist dependency edges, parent/child lifecycle propagation, or multi-level sub-task hierarchies.
* **Context**: First-class issues with direct DAG dependencies (`A BLOCKS B`) solve cross-project and cross-team bottlenecks with clarity. Introducing multi-level parent/child hierarchies prematurely complicates graph algorithms, cycle detection, and completion guards.
* **Alternatives Considered**:
  - *Multi-Level Sub-Issue Tree*: Introduces conflicting parent-child rollup vs. DAG dependency propagation rules.
* **Consequences**:
  - Graph traversal remains focused on first-class issues. Hierarchical sub-issues may be researched later as an isolated product extension.

---

## Decision 12: Deliberate Deferral of Multi-Workspace Deployment URL Strategy

* **Status**: FROZEN
* **Decision**: **The deployment-level workspace URL strategy is intentionally deferred until tenancy, authentication, and system architecture are designed.**
  - Current UX contract remains:
    1. Active workspace is application context.
    2. Canonical routes remain `/my-work`, `/projects/...`, `/issues/...`, `/teams/...`, etc.
    3. All resources are resolved inside the active workspace context.
    4. Cross-workspace dependencies remain strictly forbidden.
  - The UX-00 architecture deliberately does **not** choose between path prefixes (`/:workspaceSlug/...`) and workspace subdomains (`acme.unblok.io`).
* **Context**: Both URL strategies are fully compatible with the current route hierarchy and component contracts. Committing to a deployment routing format before infrastructure and authentication are selected would be premature.
* **Alternatives Considered**:
  - *Freezing Subdomain or Slug Architecture in UX-00*: Forces infrastructure assumptions into frontend information architecture.
* **Consequences**:
  - Frontend page specifications and route contracts remain clean, robust, and decoupled from hosting/tenancy topology.
