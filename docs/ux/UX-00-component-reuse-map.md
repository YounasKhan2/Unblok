# UX-00: Unblok Component Reuse & Inventory Map

**Platform**: Unblok — High-Density Engineering Execution & Dependency Intelligence  
**Document**: Prototype Inventory Audit, Reuse Suitability, & Page Composition Matrix  
**Status**: HUMAN REVIEW — NOT FROZEN  

---

## 1. Prototype Reuse Suitability Classification

This audit evaluates the prototype codebase for **reuse suitability** in the future product architecture. It does not certify prototype code as production-grade; rather, it establishes a migration roadmap:

- **REUSE**: Solid prototype implementation whose interaction contract and presentational structure are directly reusable in target pages.
- **REFACTOR**: Good functional foundation requiring props decoupling, query string binding, or modularization.
- **REFACTOR / DECOMPOSE**: Monolithic or multi-responsibility prototype module that must be decoupled into domain-focused sub-modules before scaling.
- **EXTEND**: Proven interaction model requiring additional slots or routing hooks for multi-page support.
- **REPLACE**: Prototype-specific implementation to be replaced with standard patterns.
- **DEFER**: Out of scope for current execution phase.

| Existing Component / Module | Current File Path | Reuse Suitability | Target Architectural Layer | Target Page / Surface Composition |
| :--- | :--- | :--- | :--- | :--- |
| `IssueList` | `src/components/views/IssueList.tsx` | **REUSE** | Feature | `PAGE-MY-WORK`, `PAGE-PROJECT-ISSUES`, `PAGE-CYCLE-DETAIL` |
| `IssueRow` | `src/components/views/IssueRow.tsx` | **REUSE** | Feature / Component | Composed inside `IssueList` for all tabular displays |
| `IssueBoard` | `src/components/views/IssueBoard.tsx` | **REUSE** | Feature | `PAGE-PROJECT-BOARD`, `PAGE-CYCLE-DETAIL` |
| `IssueCard` | `src/components/views/IssueCard.tsx` | **REUSE** | Component | Composed inside `IssueBoard` columns |
| `IssueDrawer` | `src/components/drawer/IssueDrawer.tsx` | **EXTEND** | Shell / Feature Layer | Global slide-over layer accessible across all pages via `?drawer=:key` |
| `PropertyGrid` | `src/components/drawer/PropertyGrid.tsx` | **REUSE** | Feature | Sub-tab in `IssueDrawer` and sidebar in `PAGE-ISSUE-DETAIL` |
| `DependencyManager` | `src/components/drawer/DependencyManager.tsx` | **REUSE** | Feature | Sub-tab in `IssueDrawer` and main section in `PAGE-ISSUE-DETAIL` |
| `ActivityTimeline` | `src/components/drawer/ActivityTimeline.tsx` | **REUSE** | Feature | Audit trail in `IssueDrawer`, `PAGE-ISSUE-DETAIL`, and `PAGE-PROJECT-OVERVIEW` |
| `CommentThread` | `src/components/drawer/CommentThread.tsx` | **REUSE** | Feature | Threaded comments in `IssueDrawer`, `PAGE-ISSUE-DETAIL`, and `PAGE-INBOX` |
| `FilterToolbar` | `src/components/layout/FilterToolbar.tsx` | **REFACTOR** | Feature | Bind to URL query params for `PAGE-PROJECT-ISSUES` and `PAGE-MY-WORK` |
| `BulkActionBar` | `src/components/layout/BulkActionBar.tsx` | **REUSE** | Feature | Floating multi-select bar for any issue collection page |
| `CommandPalette` | `src/components/modals/CommandPalette.tsx` | **EXTEND** | Shell Layer | Global command palette (`Cmd+K`); index page destinations |
| `DagGraphCanvas` | `src/components/views/DagGraphCanvas.tsx` | **REUSE** | Feature | `PAGE-DEPENDENCIES`, `PAGE-MILESTONE-DETAIL` |
| `DependencyMatrix` | `src/components/views/DependencyMatrix.tsx` | **REUSE** | Feature | `PAGE-DEPENDENCIES` (Matrix sub-tab) |
| `CyclePlanningView` | `src/components/views/CyclePlanningView.tsx` | **REFACTOR** | Feature / Page | Split into `PAGE-CYCLES-INDEX` and `PAGE-CYCLE-DETAIL` |
| `MilestonesView` | `src/components/views/MilestonesView.tsx` | **REFACTOR** | Feature / Page | Split into `PAGE-MILESTONES-INDEX` and `PAGE-MILESTONE-DETAIL` |
| `TimelineRoadmapView` | `src/components/views/TimelineRoadmapView.tsx` | **REUSE** | Feature / Page | Primary implementation for `PAGE-ROADMAP` |
| `StatePill` | `src/components/ui/StatePill.tsx` | **REUSE** | Component Primitive | Universal status pill across all views |
| `PriorityIcon` | `src/components/ui/PriorityIcon.tsx` | **REUSE** | Component Primitive | Universal priority icon across all views |
| `BlockerBadge` | `src/components/ui/BlockerBadge.tsx` | **REUSE** | Component Primitive | Blocker pill with hover popover across all views |
| `Avatar` | `src/components/ui/Avatar.tsx` | **REUSE** | Component Primitive | User avatars across tables, boards, and drawers |
| `PropertyPickers` | `src/components/ui/PropertyPickers.tsx` | **REUSE** | Component Primitive | Inline dropdown selectors for state, priority, assignee |
| `CompletionGuardDialog` | `src/components/modals/CompletionGuardDialog.tsx` | **REUSE** | Feature / Modal | Completion guard modal preventing premature completion |
| `CycleErrorDialog` | `src/components/modals/CycleErrorDialog.tsx` | **REUSE** | Feature / Modal | Circular dependency rejection dialog |
| `ShortcutsHelpModal` | `src/components/modals/ShortcutsHelpModal.tsx` | **REUSE** | Shell / Modal | Global shortcuts help overlay (`?`) |
| `NavigationRail` | `src/components/layout/NavigationRail.tsx` | **REFACTOR** | Shell Layer | Update route targets to match canonical route contract |
| `WorkspaceHeader` | `src/components/layout/WorkspaceHeader.tsx` | **REFACTOR** | Shell Layer | Integrate workspace context switcher |
| `AppShell` | `src/components/layout/AppShell.tsx` | **REFACTOR** | Shell Layer | Wrap route router outlets instead of local state view toggles |
| `src/domain/dependency.ts` | `src/domain/dependency.ts` | **REUSE** | Domain Layer | Pure graph invariants (DFS cycle detection, blocker evaluation) |
| `src/domain/lifecycle.ts` | `src/domain/lifecycle.ts` | **REUSE** | Domain Layer | 6-state lifecycle transitions & completion guard rules |
| `src/domain/audit.ts` | `src/domain/audit.ts` | **REUSE** | Domain Layer | Event creation for chronological audit logs |
| `src/context/ProjectContext.tsx` | `src/context/ProjectContext.tsx` | **REFACTOR / DECOMPOSE** | Context / State | Monolith requiring decomposition into 6 domain contexts |
| `src/context/KeyboardContext.tsx` | `src/context/KeyboardContext.tsx` | **REUSE** | Context / State | Global hotkeys registry (`J`, `K`, `X`, `C`, `S`, `P`, `Cmd+K`) |

---

## 2. ProjectContext Decomposition Requirement

In the existing prototype, `src/context/ProjectContext.tsx` centralizes state management for issues, dependencies, cycles, milestones, users, teams, drawer state, and filter state.

For future implementation phases, this context **must NOT be extended as a single monolith**. It is classified as **`REFACTOR / DECOMPOSE`** and will be decomposed into six domain-scoped contexts/stores:

```
┌────────────────────────────────────────────────────────────────────────┐
│               PROJECTCONTEXT DECOMPOSITION TARGET                      │
├────────────────────────────────────────────────────────────────────────┤
│ 1. WorkspaceContext    → Active workspace metadata, teams, members     │
│ 2. IssueStore          → Issue collections, mutations, property state  │
│ 3. DependencyGraphStore→ Graph edges, upstream/downstream evaluation   │
│ 4. PlanningStore       → Team cycles, rollover logic, milestones       │
│ 5. CollaborationStore  → Comment threads, activity logs, inbox items   │
│ 6. ViewNavigationState → Active drawer query, filters, view modes      │
└────────────────────────────────────────────────────────────────────────┘
```

*Note: This decomposition is documented as an implementation requirement for subsequent development phases; it is not implemented in UX-00.*

---

## 3. Page-to-Component Composition Matrix

```
PAGE-MY-WORK (/my-work)
  ├── FilterToolbar (Query-bound)
  ├── PersonalBlockerSummaryBanner [NEW]
  ├── IssueList
  │    └── IssueRow (mapped to current user issues)
  ├── BulkActionBar (Floating multi-select)
  └── IssueDrawer (Global layer via ?drawer=:key)

PAGE-PROJECT-ISSUES (/projects/:projectKey/issues)
  ├── FilterToolbar (Query-bound)
  ├── IssueList
  │    └── IssueRow (filtered by projectKey)
  ├── BulkActionBar (Floating multi-select)
  ├── IssueDrawer (Global layer via ?drawer=:key)
  └── CompletionGuardDialog (Global trigger)

PAGE-PROJECT-BOARD (/projects/:projectKey/board)
  ├── FilterToolbar (Query-bound)
  ├── IssueBoard
  │    └── IssueCard (columns: Backlog, Todo, In Progress, In Review, Done)
  ├── IssueDrawer (Global layer via ?drawer=:key)
  └── CompletionGuardDialog (Global trigger)

PAGE-ISSUE-DETAIL (/issues/:issueKey)
  ├── IssueBreadcrumbHeader [NEW]
  ├── StatePill & PriorityIcon & BlockerBadge
  ├── PropertyGrid (Sidebar placement)
  ├── DependencyManager (Full width interactive section)
  ├── CommentThread (Threaded discussion with @mentions)
  ├── ActivityTimeline (Chronological audit history)
  ├── CompletionGuardDialog (Triggered on invalid state transition)
  └── CycleErrorDialog (Triggered on circular dependency edge attempt)

PAGE-ROADMAP (/roadmap)
  ├── TimelineRoadmapView (Complete multi-week schedule with pinned roster)
  └── IssueDrawer (Triggered on card click)

PAGE-DEPENDENCIES (/dependencies)
  ├── DagGraphCanvas (Topological canvas with critical path highlighter)
  ├── DependencyMatrix (Pairwise project dependency matrix)
  ├── CycleErrorDialog (Global trigger)
  └── IssueDrawer (Triggered on node click)

PAGE-CYCLE-DETAIL (/cycles/:cycleId)
  ├── CyclePlanningView (Progress banner & rollover trigger)
  ├── IssueList / IssueBoard (Toggleable sub-views)
  ├── RolloverIncompleteIssuesDialog [NEW]
  └── IssueDrawer
```

---

## 4. Identified Implementation Gaps (New Components for Future Phases)

1. **`PersonalBlockerSummaryBanner`**: KPI widget on `/my-work` showing blocked vs. blocking counts.
2. **`ProjectCard`**: Directory card for `/projects` index displaying key, owning team, issue count, and health status.
3. **`TeamCard`**: Directory card for `/teams` index showing squad name, lead attribution, member count, and active projects.
4. **`CycleSummaryCard`**: Progress card for `/cycles` index showing sprint status, burndown, and date span.
5. **`MilestoneHealthGauge`**: Visual status indicator for `/milestones` showing percent complete and risk level.
6. **`NotificationItemRow`**: Specialized row for `/inbox` displaying mention highlights and unblock events.
7. **`RolloverIncompleteIssuesDialog`**: Dedicated dialog for sprint rollover allowing selection of target team cycle.
8. **`IssueBreadcrumbHeader`**: Contextual header for `/issues/:issueKey` linking back to Workspace, Team, and Project.
