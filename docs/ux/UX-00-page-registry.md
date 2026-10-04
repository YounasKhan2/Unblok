# UX-00: Unblok Page Registry

**Platform**: Unblok — High-Density Engineering Execution & Dependency Intelligence  
**Document**: Canonical Page Registry  
**Status**: APPROVED — UX-00 FROZEN  
**Specification Depth**: Full 22-Point Specification per Page  

---

## Registry Index

- **Personal Execution**:
  - `PAGE-MY-WORK`: `/my-work`
  - `PAGE-INBOX`: `/inbox`
- **Projects**:
  - `PAGE-PROJECTS-INDEX`: `/projects`
  - `PAGE-PROJECT-OVERVIEW`: `/projects/:projectKey`
  - `PAGE-PROJECT-ISSUES`: `/projects/:projectKey/issues`
  - `PAGE-PROJECT-BOARD`: `/projects/:projectKey/board`
  - `PAGE-PROJECT-PLANNING`: `/projects/:projectKey/planning`
  - `PAGE-PROJECT-SETTINGS`: `/projects/:projectKey/settings`
- **Issues**:
  - `PAGE-ISSUE-DETAIL`: `/issues/:issueKey`
- **Teams**:
  - `PAGE-TEAMS-INDEX`: `/teams`
  - `PAGE-TEAM-DETAIL`: `/teams/:teamKey`
- **Planning**:
  - `PAGE-CYCLES-INDEX`: `/cycles`
  - `PAGE-CYCLE-DETAIL`: `/cycles/:cycleId`
  - `PAGE-MILESTONES-INDEX`: `/milestones`
  - `PAGE-MILESTONE-DETAIL`: `/milestones/:milestoneId`
  - `PAGE-ROADMAP`: `/roadmap`
- **Dependency Intelligence**:
  - `PAGE-DEPENDENCIES`: `/dependencies`
- **Insights**:
  - `PAGE-INSIGHTS`: `/insights`
- **Settings & Administration**:
  - `PAGE-SETTINGS-INDEX`: `/settings` (Resolves to `/settings/workspace` for Admin, `/settings/preferences` for Member/Observer)
  - `PAGE-SETTINGS-WORKSPACE`: `/settings/workspace`
  - `PAGE-SETTINGS-MEMBERS`: `/settings/members`
  - `PAGE-SETTINGS-TEAMS`: `/settings/teams`
  - `PAGE-SETTINGS-INTEGRATIONS`: `/settings/integrations`
  - `PAGE-SETTINGS-PREFERENCES`: `/settings/preferences`

---

## 1. Personal Execution

### `PAGE-MY-WORK`
* **Route**: `/my-work`
* **Purpose**: Primary post-authentication cockpit answering *"What needs my attention right now, what is blocking me, and what should I work on now?"*.
* **Primary User Goal**: Rapidly triage, unblock, and execute assigned tasks without distraction from unrelated workspace noise.
* **Entry Points**: Default post-authentication destination, global sidebar top anchor, keyboard shortcut `G` then `M`.
* **Page Header**:
  * Title: "My Work"
  * Context Subtitle: "Personal execution queue for [Current User]"
  * Status Badge: Active Cycle indicator + personal blocker indicator (`X Blocked`, `Y Blocking`)
* **Primary Action**: `Create Task` (`C`).
* **Secondary Actions**: `Quick Filter` (`F`), `Toggle Grouping` (by State, by Cycle, by Priority).
* **Major Sections (Ranked & Deduplicated Execution Hierarchy)**:
  * *Ranking Rule*: An issue appears in exactly one highest-priority actionable group. If an assigned issue is actively blocked, it appears exclusively in *Needs Attention*, never duplicating in *In Progress* or *Up Next*.
  1. *Needs Attention*: Tasks assigned to the user that are actively blocked, or tasks where the user is an active blocker for an upstream peer.
  2. *In Progress*: Active tasks currently underway.
  3. *In Review*: Pull request review requests or design review tasks.
  4. *Up Next / Current Cycle*: Tasks scheduled in the user's active team cycle.
  5. *Due / Overdue*: Date-sensitive tasks requiring immediate attention.
  6. *Recently Completed*: Completed tasks in the current week.
* **Supported Views/Tabs**: `Triage List` (dense keyboard-navigable rows), `Blocker Focus` (filtered view highlighting dependencies).
* **Contextual Actions**: Quick state transition, priority change, add blocker prerequisite, reassign.
* **Reusable Existing Components**: `IssueRow`, `IssueList`, `FilterToolbar`, `BulkActionBar`, `StatePill`, `PriorityIcon`, `BlockerBadge`, `Avatar`.
* **New Components Required**: `PersonalBlockerSummaryBanner`, `GroupedSectionAccordion`.
* **Entities / Data Consumed**: `issues`, `dependencies`, `users`, `activeCycle`, `milestones`. Filtered where `assigneeId === currentUser.id` or user is an upstream blocker.
* **Navigation Destinations**: Issue Drawer (inline), Full Issue (`/issues/:key`), Active Cycle (`/cycles/:cycleId`).
* **Drawer Behavior**: Clicking any row or pressing `Space` slides open `IssueDrawer` (440px). The main list remains interactive and keyboard focusable (`J`/`K`).
* **Modal / Popover Behavior**: State picker popover on `S`, priority picker popover on `P`.
* **Empty State**: "All clear! You have no active or blocked tasks in the current cycle."
* **Loading State**: 5 table row skeletons.
* **Error State**: Non-blocking toast with retry action: "Failed to load personal work queue. Reconnecting."
* **Responsive Considerations**: Dense tabular layout on desktop. Stacked card rows with state badges on mobile.
* **Keyboard Considerations**: `J`/`K` to move selection, `Space` to open drawer, `X` to select, `C` to create.
* **Authorization Considerations**: Accessible to `ADMIN`, `MEMBER`, and `OBSERVER` (personal scope).

---

### `PAGE-INBOX`
* **Route**: `/inbox`
* **Purpose**: High-signal collaboration inbox collecting mentions, blocker resolution events, cycle updates, and assignments.
* **Primary User Goal**: Process notifications, clear unread mentions, and review dependency unblock events.
* **Entry Points**: Global sidebar Inbox icon, notification bell in Workspace Header, hotkey `G` then `I`.
* **Page Header**:
  * Title: "Inbox"
  * Unread Count: `X Unread`
  * Action: `Mark All as Read` (`Shift + I`)
* **Primary Action**: `Mark as Read` (`E` archive/clear).
* **Secondary Actions**: `Filter by Unread`, `Filter by Mentions (@)`, `Filter by Unblocked Events`.
* **Major Sections**:
  1. *Today*: Critical mentions and blocker unblock events from the past 24 hours.
  2. *Earlier*: Historical comments, assignments, and cycle reports.
  3. *Archived / Done*: Processed inbox items.
* **Supported Views/Tabs**: `All`, `Unread`, `Mentions`, `Blockers & Dependencies`.
* **Contextual Actions**: Reply to comment inline, view blocker diff, dismiss notification.
* **Reusable Existing Components**: `Avatar`, `StatePill`, `CommentThread`, `Button`, `Badge`.
* **New Components Required**: `NotificationItemRow`, `InlineReplyComposer`.
* **Entities / Data Consumed**: `activities` (filtered for user mentions and assigned issue changes), `comments`, `issues`.
* **Navigation Destinations**: Direct link to `/issues/:issueKey` or opens drawer with active comment thread focused.
* **Drawer Behavior**: Clicking notification opens issue drawer directly on the `DISCUSSIONS` or `ACTIVITY` tab.
* **Modal / Popover Behavior**: Confirmation popover on "Clear All".
* **Empty State**: "Inbox Zero: You're completely up to date with mentions and blockers."
* **Loading State**: 4 skeleton card rows.
* **Error State**: Inline retry banner.
* **Responsive Considerations**: Full width on mobile; compact split on desktop.
* **Keyboard Considerations**: `J`/`K` to navigate, `E` to mark read, `Enter` to open issue drawer.
* **Authorization Considerations**: Accessible to all authenticated roles (`ADMIN`, `MEMBER`, `OBSERVER`).

---

## 2. Projects Space

### `PAGE-PROJECTS-INDEX`
* **Route**: `/projects`
* **Purpose**: Workspace directory of all engineering projects.
* **Primary User Goal**: Discover, filter, and access active projects across teams.
* **Entry Points**: Sidebar "Projects" item, Command Palette `Projects`.
* **Page Header**:
  * Title: "Projects"
  * Scope: All Teams / Team Filter
  * Action: `New Project` (`ADMIN` only)
* **Primary Action**: `Create Project`.
* **Secondary Actions**: `Search Projects`, `Filter by Owning Team`.
* **Major Sections**:
  1. *Starred Projects*: User's bookmarked projects.
  2. *All Active Projects*: Grid/List showing Project Key, Owning Team, Issue Count, Blocker Count, and Health status.
* **Supported Views/Tabs**: `Grid Cards View`, `Compact Table View`.
* **Contextual Actions**: Star project, view team, copy project key.
* **Reusable Existing Components**: `SearchInput`, `Button`, `Badge`, `Avatar`.
* **New Components Required**: `ProjectCard`, `ProjectHealthBar`.
* **Entities / Data Consumed**: `projects`, `teams`, `issues`, `dependencies`.
* **Navigation Destinations**: `/projects/:projectKey`, `/projects/:projectKey/issues`, `/projects/:projectKey/board`.
* **Drawer Behavior**: None on this page.
* **Modal / Popover Behavior**: Create Project Modal (`ADMIN` only).
* **Empty State**: "No projects found matching filter."
* **Loading State**: 6 pulsing skeleton project cards.
* **Error State**: Error banner with refresh action.
* **Responsive Considerations**: 3 columns on desktop, 1 on mobile.
* **Keyboard Considerations**: `/` to focus search, `Enter` to open project.
* **Authorization Considerations**: All roles may view projects. Only `ADMIN` may create new projects.

---

### `PAGE-PROJECT-OVERVIEW`
* **Route**: `/projects/:projectKey`
* **Purpose**: Executive dashboard, delivery snapshot, and recent activity for a specific project.
* **Primary User Goal**: Review project delivery health, open blockers, owning team, and recent activity stream.
* **Entry Points**: Projects index, breadcrumb navigation, search.
* **Page Header**:
  * Title: `[Project Key] [Project Name]`
  * Subtitle: Owning Team link + Description
  * Tabs: `Overview`, `Issues`, `Board`, `Planning`, `Settings` (Admin)
* **Primary Action**: `New Issue` (`C`).
* **Secondary Actions**: `Project Settings` (`ADMIN`), `Share Link`.
* **Major Sections**:
  1. *Delivery Snapshot*: Distribution of issues across Backlog, In Progress, In Review, Done.
  2. *Active Blockers*: Urgent cross-team blockers affecting project issues.
  3. *Recent Activity*: Chronological audit feed of issue updates and state changes.
  4. *Owning Team & Contributors*: Team attribution and active assignees.
* **Supported Views/Tabs**: Sub-navigation tabs (`Overview`, `Issues`, `Board`, `Planning`, `Settings`).
* **Contextual Actions**: Star project, copy key.
* **Reusable Existing Components**: `ActivityTimeline`, `BlockerBadge`, `StatePill`, `Button`.
* **New Components Required**: `ProjectBurnupWidget`, `CrossTeamBlockerCard`.
* **Entities / Data Consumed**: `project`, `team`, `issues`, `dependencies`, `activities`.
* **Navigation Destinations**: `/projects/:projectKey/issues`, `/projects/:projectKey/board`, `/teams/:teamKey`.
* **Drawer Behavior**: Clicking an issue from recent activity opens `IssueDrawer`.
* **Modal / Popover Behavior**: Create Issue Modal.
* **Empty State**: "Project has no recorded activity yet."
* **Loading State**: Content skeleton.
* **Error State**: "Project not found."
* **Responsive Considerations**: Stacked widgets on small screens.
* **Keyboard Considerations**: Standard navigation shortcuts.
* **Authorization Considerations**: All roles can read. `MEMBER` and `ADMIN` can create issues.

---

### `PAGE-PROJECT-ISSUES`
* **Route**: `/projects/:projectKey/issues`
* **Purpose**: High-density tabular triage list of all issues belonging to the project.
* **Primary User Goal**: Fast bulk triage, filtering, inline editing, and dependency verification.
* **Entry Points**: Project tabs, sidebar project item, Command Palette.
* **Page Header**:
  * Title: `[Project Key] Issues`
  * Filter Toolbar: State, Priority, Assignee, Cycle, Blocker Status, Search
* **Primary Action**: `New Issue` (`C`).
* **Secondary Actions**: `Saved Filter Presets`, `Clear Filters`.
* **Major Sections**:
  1. *Filter Toolbar*: Query builder bound to URL query string.
  2. *Issue Data Table*: Tabular columns for Selection, Key, Title, State, Priority, Assignee, Blocker Badge, Due Date.
  3. *Floating Bulk Action Bar*: Multi-select triage toolbar.
* **Supported Views/Tabs**: `All Issues`, `Active Cycle`, `Backlog`, `Blocked Only`.
* **Contextual Actions**: Bulk status update, bulk cycle assignment, bulk priority change.
* **Reusable Existing Components**: `IssueList`, `IssueRow`, `FilterToolbar`, `BulkActionBar`, `IssueDrawer`, `CompletionGuardDialog`.
* **New Components Required**: None.
* **Entities / Data Consumed**: `project`, `issues`, `dependencies`, `users`, `cycles`.
* **Navigation Destinations**: Issue Drawer (inline), `/issues/:issueKey` (Cmd+Click).
* **Drawer Behavior**: Clicking any row or pressing `Space` slides open `IssueDrawer`. List remains fully operable.
* **Modal / Popover Behavior**: `CompletionGuardDialog` triggers when attempting to move an issue with active blockers to `DONE`.
* **Empty State**: "No issues match active filters."
* **Loading State**: Table row skeletons.
* **Error State**: Inline retry notice.
* **Responsive Considerations**: Horizontal scroll with frozen Key column on mobile.
* **Keyboard Considerations**: Full triage suite (`J`, `K`, `X`, `Space`, `S`, `P`, `A`).
* **Authorization Considerations**: `OBSERVER` is read-only. `MEMBER` and `ADMIN` have full triage access.

---

### `PAGE-PROJECT-BOARD`
* **Route**: `/projects/:projectKey/board`
* **Purpose**: Kanban board visualization of project issues organized by lifecycle state.
* **Primary User Goal**: Drag-and-drop or keyboard-driven status transitions with real-time dependency validation.
* **Entry Points**: Project tabs, workspace header view switcher (`B`).
* **Page Header**:
  * Title: `[Project Key] Board`
  * Grouping Controls: Group by State (default), Group by Priority, Group by Assignee
* **Primary Action**: `Add Issue` (`C`).
* **Secondary Actions**: `Filter Bar Toggle`.
* **Major Sections**:
  - Columns: `BACKLOG`, `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`.
  - Column Headers: Column name, issue count, soft WIP limit indicator (displays visual overload signal, does not block transitions).
* **Supported Views/Tabs**: Standard Kanban, Compact Board.
* **Contextual Actions**: Move card, inspect blockers, assign member.
* **Reusable Existing Components**: `IssueBoard`, `IssueCard`, `IssueDrawer`, `CompletionGuardDialog`, `FilterToolbar`.
* **New Components Required**: None.
* **Entities / Data Consumed**: `project`, `issues`, `dependencies`, `users`.
* **Navigation Destinations**: Issue Drawer.
* **Drawer Behavior**: Clicking card opens `IssueDrawer`.
* **Modal / Popover Behavior**: Hard completion guard modal triggers when dragging a blocked card to `DONE`.
* **Empty State**: Empty column drop placeholders.
* **Loading State**: Card skeletons in each column.
* **Error State**: Toast notification on drag failure.
* **Responsive Considerations**: Horizontal swipeable board columns on mobile.
* **Keyboard Considerations**: Arrow keys to navigate cards, `S` to change status.
* **Authorization Considerations**: `OBSERVER` is read-only. `MEMBER` and `ADMIN` can move cards.

---

### `PAGE-PROJECT-PLANNING`
* **Route**: `/projects/:projectKey/planning`
* **Purpose**: Sprint cycle and milestone allocation specifically for this project.
* **Primary User Goal**: Move project backlog issues into upcoming team cycles and link deliverables to strategic milestones.
* **Entry Points**: Project tabs (`Planning`), Cycle planning view.
* **Page Header**:
  * Title: `[Project Key] Planning & Sprints`
  * Owning Team Cycle status bar
* **Primary Action**: `Schedule to Cycle`.
* **Secondary Actions**: `Link to Milestone`.
* **Major Sections**:
  1. *Backlog vs. Cycle Splitter*: Move unassigned project issues into upcoming cycles of the owning team.
  2. *Milestone Alignment*: Grouping of project deliverables by targeted workspace milestone.
* **Supported Views/Tabs**: `Cycle Allocation`, `Milestone Mapping`.
* **Contextual Actions**: Assign to cycle, link to milestone.
* **Reusable Existing Components**: `CyclePlanningView`, `MilestonesView`, `IssueRow`, `Button`.
* **New Components Required**: `BacklogToSprintSplitter`.
* **Entities / Data Consumed**: `project`, `issues`, `cycles` (belonging to owning team), `milestones`.
* **Navigation Destinations**: `/cycles/:cycleId`, `/milestones/:milestoneId`.
* **Drawer Behavior**: Issue drawer opens on item selection.
* **Modal / Popover Behavior**: Cycle assignment popover.
* **Empty State**: "No unassigned backlog items remaining."
* **Loading State**: Split column skeletons.
* **Error State**: Standard error banner.
* **Responsive Considerations**: Stacked columns on mobile.
* **Keyboard Considerations**: Standard list navigation.
* **Authorization Considerations**: `MEMBER` and `ADMIN` can assign issues to cycles/milestones.

---

### `PAGE-PROJECT-SETTINGS`
* **Route**: `/projects/:projectKey/settings`
* **Purpose**: Configuration and administrative management for the specific project.
* **Primary User Goal**: Manage project key, owning team, default templates, issue sequencing, and archive state.
* **Entry Points**: Project tabs (Settings icon), Project overview header.
* **Page Header**:
  * Title: `[Project Key] Settings`
  * Project ID and Key badge
* **Primary Action**: `Save Changes`.
* **Secondary Actions**: `Archive Project`, `Delete Project` (Danger Zone).
* **Major Sections**:
  1. *General*: Project Name, Key, Description, Owning Team selector.
  2. *Sequencing*: Next issue number counter (e.g., `ENG-142`).
  3. *Danger Zone*: Archive or permanently delete project.
* **Supported Views/Tabs**: Single-page settings form.
* **Contextual Actions**: Revert changes, confirm destructive actions.
* **Reusable Existing Components**: `Button`, `Modal`, `SearchInput`.
* **New Components Required**: `ProjectDangerZoneCard`.
* **Entities / Data Consumed**: `project`, `teams`.
* **Navigation Destinations**: `/projects` on archive or delete.
* **Drawer Behavior**: None.
* **Modal / Popover Behavior**: Destructive confirmation modal requiring typing project key to confirm.
* **Empty State**: N/A.
* **Loading State**: Form field skeletons.
* **Error State**: Field-level validation errors.
* **Responsive Considerations**: Single column layout.
* **Keyboard Considerations**: `Cmd+S` to save.
* **Authorization Considerations**: Restricted strictly to `ADMIN`.

---

## 3. Issues Space

### `PAGE-ISSUE-DETAIL`
* **Route**: `/issues/:issueKey`
* **Purpose**: Full-screen canonical workspace destination for deep engineering work on a single issue.
* **Primary User Goal**: Read technical specifications, author comments, manage multi-hop dependencies, review git links, and inspect full audit logs.
* **Entry Points**: Direct browser deep link, Cmd+Click from any issue list/board, "Open in Full Page" action in Issue Drawer (`Cmd+O`).
* **Page Header**:
  * Breadcrumb: `Workspace > [Team Name] > [Project Key] > [Issue Key]`
  * Issue Key + Status Pill + Blocker Status Badge
  * Action: `Copy Link`, `Share`
* **Primary Action**: `Change Status` (`S`).
* **Secondary Actions**: `Add Blocker` (`B`), `Add Comment` (`M`).
* **Major Sections**:
  1. *Main Content Column (Left ~65%)*:
     - Editable Title
     - Markdown Description Editor
     - Subtasks & Flat Checklist (Hierarchical sub-issues deferred)
     - Blockers & Dependencies section with interactive visual mini-graph
     - Threaded Discussion Stream (`CommentThread`)
     - Complete Audit Trail & Activity Log (`ActivityTimeline`)
  2. *Metadata Sidebar (Right ~35%)*:
     - Property Grid: State, Priority, Assignee, Cycle, Milestone, Start/Due Dates, Story Points
     - Cross-Team Impact indicators
* **Supported Views/Tabs**: Single comprehensive page with tabbed sub-sections for Discussion, Dependencies, and Audit Trail.
* **Contextual Actions**: Add dependency, resolve blocker, edit properties.
* **Reusable Existing Components**: `PropertyGrid`, `DependencyManager`, `CommentThread`, `ActivityTimeline`, `BlockerBadge`, `StatePill`, `PriorityIcon`, `CompletionGuardDialog`, `CycleErrorDialog`.
* **New Components Required**: `IssueBreadcrumbHeader`.
* **Entities / Data Consumed**: `issue`, `dependencies`, `comments`, `activities`, `users`, `projects`, `teams`, `cycles`, `milestones`.
* **Navigation Destinations**: Upstream/downstream issues, Owning Project, Owning Team, Assignee profile.
* **Drawer Behavior**: Drawer is *not* used on this page (this is the full-screen destination).
* **Modal / Popover Behavior**: `CompletionGuardDialog` on invalid status transition; `CycleErrorDialog` on circular dependency attempt.
* **Empty State**: "Issue not found" (404 state with "Return to My Work" CTA).
* **Loading State**: Full-page skeleton (header, content column, sidebar).
* **Error State**: Explicit 404 or 403 access denied card.
* **Responsive Considerations**: 2-column layout on desktop; stacked single column with collapsible properties on mobile.
* **Keyboard Considerations**: `S` (state), `P` (priority), `A` (assignee), `Cmd+Enter` (submit comment).
* **Authorization Considerations**: `OBSERVER` is read-only. `MEMBER` and `ADMIN` can edit properties, manage blockers, author comments.

---

## 4. Teams Space

### `PAGE-TEAMS-INDEX`
* **Route**: `/teams`
* **Purpose**: Workspace team directory displaying all squads, lead assignments, and operational metrics.
* **Primary User Goal**: Find squads, review team composition, and check active team projects.
* **Entry Points**: Global sidebar "Teams" item.
* **Page Header**:
  * Title: "Teams"
  * Action: `Create Team` (`ADMIN` only)
* **Primary Action**: `Create Team`.
* **Secondary Actions**: `Search Teams`.
* **Major Sections**:
  1. *Team Grid*: Cards showing Team Key, Name, Lead attribution, Member Count, Active Projects, and Open Blockers.
* **Supported Views/Tabs**: Grid View, Table View.
* **Contextual Actions**: View team details.
* **Reusable Existing Components**: `SearchInput`, `Button`, `Avatar`, `Badge`.
* **New Components Required**: `TeamCard`.
* **Entities / Data Consumed**: `teams`, `users`, `projects`, `issues`.
* **Navigation Destinations**: `/teams/:teamKey`.
* **Drawer Behavior**: None.
* **Modal / Popover Behavior**: Create Team modal (`ADMIN` only).
* **Empty State**: "No teams configured in workspace."
* **Loading State**: Card skeletons.
* **Error State**: Standard error banner.
* **Responsive Considerations**: 3 columns desktop, 1 column mobile.
* **Keyboard Considerations**: Standard navigation.
* **Authorization Considerations**: All roles may view teams. Only `ADMIN` may create teams.

---

### `PAGE-TEAM-DETAIL`
* **Route**: `/teams/:teamKey`
* **Purpose**: Dedicated squad hub presenting team members, owned projects, team cycles, and cross-team dependencies.
* **Primary User Goal**: Understand a specific squad's commitments, active sprint velocity, and incoming/outgoing blockers.
* **Entry Points**: Teams index, breadcrumbs, project headers.
* **Page Header**:
  * Title: `[Team Key] [Team Name]`
  * Subtitle: Lead attribution + Member Roster
  * Tabs: `Projects`, `Cycles`, `Team Roster`, `Dependencies`
* **Primary Action**: `New Team Project` (`ADMIN`).
* **Secondary Actions**: `Plan Team Cycle` (`MEMBER` / `ADMIN`).
* **Major Sections**:
  1. *Team Projects*: Projects owned by this squad.
  2. *Active Team Cycle*: Current sprint cadence burndown and issues.
  3. *Cross-Team Blockers*: Dependencies this team owes to other squads or is waiting on.
  4. *Member Directory*: Engineers in this squad and their active task loads.
* **Supported Views/Tabs**: `Projects`, `Cycles`, `Blockers`, `Members`.
* **Contextual Actions**: Add project to team, add member to team.
* **Reusable Existing Components**: `IssueRow`, `Avatar`, `Button`, `BlockerBadge`.
* **New Components Required**: `TeamMemberLoadGrid`, `CrossTeamDependencySummary`.
* **Entities / Data Consumed**: `team`, `users`, `projects`, `cycles`, `issues`, `dependencies`.
* **Navigation Destinations**: Project pages, Cycle detail, Member profiles.
* **Drawer Behavior**: Issue drawer opens when clicking issues.
* **Modal / Popover Behavior**: Add Member modal (`ADMIN` only).
* **Empty State**: "Team has no active projects assigned."
* **Loading State**: Skeleton layout.
* **Error State**: Team 404 banner.
* **Responsive Considerations**: Stacked sections on small screens.
* **Keyboard Considerations**: Tab navigation.
* **Authorization Considerations**: All roles may view. Only `ADMIN` can modify team settings/membership.

---

## 5. Planning Space

### `PAGE-CYCLES-INDEX`
* **Route**: `/cycles`
* **Purpose**: Overview of all active, upcoming, and completed sprint cycles across teams.
* **Primary User Goal**: Track sprint schedules across teams, start upcoming cycles, and monitor velocity.
* **Entry Points**: Global sidebar "Cycles" link, planning menus.
* **Page Header**:
  * Title: "Team Delivery Cycles"
  * Scope: All Teams / Filter by Team
* **Primary Action**: `Create Cycle` (`MEMBER` / `ADMIN`).
* **Secondary Actions**: `Filter by Team`.
* **Major Sections**:
  1. *Active Team Cycles*: Currently running sprints across squads with progress bars.
  2. *Upcoming Cycles*: Scheduled future cadences by team.
  3. *Completed Cycles*: Archive of past sprints with completion statistics.
* **Supported Views/Tabs**: `All Teams`, `My Team`.
* **Contextual Actions**: Start cycle, inspect rollover rate.
* **Reusable Existing Components**: `CyclePlanningView`, `Button`, `Badge`.
* **New Components Required**: `CycleSummaryCard`.
* **Entities / Data Consumed**: `cycles` (Team-scoped), `teams`, `issues`.
* **Navigation Destinations**: `/cycles/:cycleId`.
* **Drawer Behavior**: None on index.
* **Modal / Popover Behavior**: Create Cycle modal.
* **Empty State**: "No active cycles found. Create a cycle for your team to begin sprint tracking."
* **Loading State**: Card skeletons.
* **Error State**: Standard error alert.
* **Responsive Considerations**: Responsive grid cards.
* **Keyboard Considerations**: Standard navigation.
* **Authorization Considerations**: `MEMBER` and `ADMIN` can create/manage team cycles. `OBSERVER` is read-only.

---

### `PAGE-CYCLE-DETAIL`
* **Route**: `/cycles/:cycleId`
* **Purpose**: Detailed execution view for a specific team sprint cycle.
* **Primary User Goal**: Execute the active sprint, triage remaining tasks, and trigger end-of-cycle rollover for unfinished work.
* **Entry Points**: Cycles index, My Work header badge, Project planning tab.
* **Page Header**:
  * Title: `[Cycle Name]` (e.g., `Cycle 24: Core Platform Hardening`)
  * Owning Team: `[Team Name]`
  * Date Span: e.g., `Sep 28, 2026 - Oct 11, 2026`
  * Status: Active / Upcoming / Completed
* **Primary Action**: `Complete Cycle & Rollover` (`MEMBER` / `ADMIN`).
* **Secondary Actions**: `Add Issue to Cycle`.
* **Major Sections**:
  1. *Cycle Progress Banner*: Total issues, Done vs. Remaining, Active Blockers count.
  2. *Issue Triage Table / Board*: List or Board view of all cycle issues across projects owned by this team.
  3. *Unfinished Work Rollover Zone*: Direct action to rollover incomplete issues to the next cadence.
* **Supported Views/Tabs**: `List View`, `Board View`.
* **Contextual Actions**: Remove from cycle, rollover issue, prioritize.
* **Reusable Existing Components**: `CyclePlanningView`, `IssueList`, `IssueBoard`, `IssueDrawer`, `BulkActionBar`, `CompletionGuardDialog`.
* **New Components Required**: `CycleBurndownWidget`.
* **Entities / Data Consumed**: `cycle`, `team`, `issues`, `dependencies`, `users`.
* **Navigation Destinations**: Next cycle, Issue Drawer.
* **Drawer Behavior**: Issue drawer opens on item selection.
* **Modal / Popover Behavior**: `RolloverIncompleteIssuesDialog` (modal allowing selection of target team cycle for incomplete tasks).
* **Empty State**: "No issues assigned to this cycle."
* **Loading State**: Content skeleton.
* **Error State**: Cycle 404 state.
* **Responsive Considerations**: Horizontal scroll on board view.
* **Keyboard Considerations**: Standard triage hotkeys (`J`/`K`/`S`).
* **Authorization Considerations**: `MEMBER` and `ADMIN` can manage cycle issues. `OBSERVER` is read-only.

---

### `PAGE-MILESTONES-INDEX`
* **Route**: `/milestones`
* **Purpose**: Directory of organizational strategic objectives, major releases, and company milestones.
* **Primary User Goal**: Review company-level delivery commitments, delivery dates, and aggregate risk statuses.
* **Entry Points**: Global sidebar "Milestones" item.
* **Page Header**:
  * Title: "Strategic Milestones"
  * Action: `Create Milestone` (`ADMIN` / `MEMBER`)
* **Primary Action**: `Create Milestone`.
* **Secondary Actions**: `Filter by Risk (On Track, At Risk, Blocked)`.
* **Major Sections**:
  1. *Active Milestones*: Ranked by target date with automated health rollup indicators.
  2. *Completed Milestones*: Historical delivery milestones with post-mortem statistics.
* **Supported Views/Tabs**: `Timeline List`, `Card Matrix`.
* **Contextual Actions**: Update target date, inspect blocked issue tree.
* **Reusable Existing Components**: `MilestonesView`, `Button`, `Badge`.
* **New Components Required**: `MilestoneHealthGauge`.
* **Entities / Data Consumed**: `milestones` (Workspace-scoped), `issues`, `dependencies`, `teams`.
* **Navigation Destinations**: `/milestones/:milestoneId`.
* **Drawer Behavior**: None on index.
* **Modal / Popover Behavior**: Create Milestone modal.
* **Empty State**: "No strategic milestones created. Define release goals to track multi-team commitments."
* **Loading State**: Skeletons.
* **Error State**: Standard error alert.
* **Responsive Considerations**: Responsive card grid.
* **Keyboard Considerations**: Standard navigation.
* **Authorization Considerations**: `ADMIN` and `MEMBER` can create milestones. `OBSERVER` is read-only.

---

### `PAGE-MILESTONE-DETAIL`
* **Route**: `/milestones/:milestoneId`
* **Purpose**: Deep-dive tracking for a single strategic release target, aggregating issues across multiple projects and teams.
* **Primary User Goal**: Identify critical path blockers and overdue workstreams threatening a major delivery deadline.
* **Entry Points**: Milestones index, Issue drawer milestone link.
* **Page Header**:
  * Title: `[Milestone Name]` (e.g., `v2.0 General Availability`)
  * Target Date: e.g., `Nov 15, 2026`
  * Status: `ON TRACK` / `AT RISK` / `BLOCKED`
* **Primary Action**: `Link Issues to Milestone`.
* **Secondary Actions**: `Edit Milestone Dates`.
* **Major Sections**:
  1. *Health Rollup*: Percentage complete, open blockers, dependency chain depth.
  2. *Contributing Teams & Projects*: Breakdown by team and project.
  3. *Critical Path Issues*: Issues with the highest downstream blast radius.
  4. *All Linked Issues Table*: Filterable issue list.
* **Supported Views/Tabs**: `Issues`, `Dependency Graph`, `Delivery Risk`.
* **Contextual Actions**: Unlink issue, escalate blocker.
* **Reusable Existing Components**: `MilestonesView`, `IssueList`, `IssueDrawer`, `DagGraphCanvas`, `BlockerBadge`.
* **New Components Required**: `CriticalPathTreeWidget`.
* **Entities / Data Consumed**: `milestone`, `issues`, `dependencies`, `projects`, `teams`.
* **Navigation Destinations**: Contributing projects, Issue Drawer.
* **Drawer Behavior**: Issue drawer opens on item selection.
* **Modal / Popover Behavior**: Link Issues modal.
* **Empty State**: "No issues linked to this milestone."
* **Loading State**: Content skeleton.
* **Error State**: Milestone 404.
* **Responsive Considerations**: Stacked metrics on mobile.
* **Keyboard Considerations**: Standard list triage hotkeys.
* **Authorization Considerations**: `MEMBER` and `ADMIN` can link issues. `OBSERVER` is read-only.

---

### `PAGE-ROADMAP`
* **Route**: `/roadmap`
* **Purpose**: Primary planning and visualization surface answering: *"How is planned work distributed across time, teams, assignees, cycles, milestones, and delivery dependencies?"*.
* **Primary User Goal**: Visualize workstreams across dates, balance team and assignee capacity, and inspect dependency alignments. (Must NOT take ownership of cycle publishing or completion; cycle lifecycle operations belong exclusively to the Cycle experience).
* **Entry Points**: Global sidebar "Roadmap & Schedule" link, hotkey `G` then `R`.
* **Page Header**:
  * Title: "Schedule & Roadmap"
  * Primary Action: `Schedule Work`
  * Secondary Controls: `Today`, Date range navigation (`< >`), View grouping (`Group by Team` vs. `Group by Assignee`), Relevant filters, `Reset Filters`.
* **Primary Action**: `Schedule Work`.
* **Secondary Actions & Controls**:
  - `Today` jump
  - Date range navigation (`< Prev Week / Next Week >`)
  - Grouping toggle (`Group by Team Workstream` / `Group by Assignee Workload`)
  - Quick filters (by Cycle, by Milestone, by Blocker status)
  - `Reset Filters`
* **Major Sections**:
  1. *Left Pinned Group Roster*: Quick search, team or assignee workload summary cards, task count, and active blocker indicators.
  2. *Right Calendar Timeline Grid*: 7-day or 14-day columns with collapsible swimlanes, interactive task schedule bars, and inline `(+)` day scheduling.
* **Supported Views/Tabs**: `Team Workstreams`, `Assignee Workload`.
* **Contextual Actions**:
  - Open issue (opens drawer)
  - Move/reschedule issue where the user's role permits it
  - Inspect blocker/dependency context
* **Reusable Existing Components**: `TimelineRoadmapView`, `PriorityIcon`, `Avatar`, `BlockerBadge`, `IssueDrawer`.
* **New Components Required**: None.
* **Entities / Data Consumed**: `issues`, `teams`, `users`, `dependencies`, `cycles`, `milestones`.
* **Navigation Destinations**: Issue Drawer (inline).
* **Drawer Behavior**: Clicking any card opens `IssueDrawer` on the right.
* **Modal / Popover Behavior**: Quick schedule popover on `(+)` click.
* **Empty State**: Empty swimlanes show subtle dashed `(+)` schedule slots.
* **Loading State**: Grid skeletons.
* **Error State**: Standard error banner.
* **Responsive Considerations**: Horizontal scroll on calendar grid with pinned left roster.
* **Keyboard Considerations**: Arrow navigation between day cells.
* **Authorization Considerations**: `MEMBER` and `ADMIN` can reschedule dates. `OBSERVER` is read-only.

---

## 6. Dependency Intelligence Space

### `PAGE-DEPENDENCIES`
* **Route**: `/dependencies`
* **Purpose**: Workspace-wide dependency intelligence hub providing full DAG graph exploration and bottleneck matrices.
* **Primary User Goal**: Investigate cross-team blockers, detect circular deadlock risks, identify the critical path, and view dependency matrices.
* **Entry Points**: Global sidebar "Dependencies" item, Blocker badges across app.
* **Page Header**:
  * Title: "Dependency Intelligence"
  * Active Blockers Count: `X Active Blockers across Workspace`
* **Primary Action**: `Add Dependency Edge`.
* **Secondary Actions**: `Toggle Critical Path`, `Filter by Cross-Team Only`.
* **Major Sections**:
  1. *Visual DAG Graph Canvas*: Interactive node-edge graph with zoom, pan, team clustering, and critical path glow.
  2. *Cross-Team Bottleneck Heatmap*: Matrix highlighting teams blocking other squads.
  3. *Active Blocker Registry*: Tabular list of every currently blocking issue with blocker age.
* **Supported Views/Tabs**: `Topological DAG Canvas`, `Dependency Matrix Grid`, `Active Blocker Queue`.
* **Contextual Actions**: Remove dependency link, inspect upstream issue, inspect downstream impact tree.
* **Reusable Existing Components**: `DagGraphCanvas`, `DependencyMatrix`, `IssueDrawer`, `BlockerBadge`, `CycleErrorDialog`.
* **New Components Required**: `CrossTeamBottleneckHeatmap`.
* **Entities / Data Consumed**: `issues`, `dependencies`, `projects`, `teams`, `users`.
* **Navigation Destinations**: Issue Drawer, Contributing Projects.
* **Drawer Behavior**: Clicking any node in the graph opens `IssueDrawer` on the `DEPENDENCIES` tab.
* **Modal / Popover Behavior**: `CycleErrorDialog` if a user attempts to create a circular link.
* **Empty State**: "Graph is completely acyclic. No active cross-issue blockers found in workspace."
* **Loading State**: Graph canvas loading spinner with node skeletons.
* **Error State**: Graph layout error fallback view.
* **Responsive Considerations**: Canvas requires desktop viewport; table fallback for mobile.
* **Keyboard Considerations**: `+`/`-` to zoom canvas, `Space` to pan.
* **Authorization Considerations**: `MEMBER` and `ADMIN` can add/remove edges. `OBSERVER` is read-only.

---

## 7. Insights Space

### `PAGE-INSIGHTS`
* **Route**: `/insights`
* **Purpose**: Delivery intelligence, blocker aging velocity, and operational health metrics.
* **Primary User Goal**: Identify systemic engineering bottlenecks, measure cycle lead times, and track blocker resolution trends.
* **Entry Points**: Global sidebar "Insights" item.
* **Page Header**:
  * Title: "Delivery & Dependency Insights"
  * Date Filter: Last 30 Days, Last Quarter, Current Year
* **Primary Action**: `Filter by Team`.
* **Secondary Actions**: `Filter by Milestone`.
* **Major Sections**:
  1. *Blocker Velocity & Aging*: Time issues remain in blocked status before unblocking.
  2. *Cycle Completion & Rollover Rates*: Percentage of tasks rolled over vs. completed per cycle.
  3. *Cross-Team Blocker Blast Radius*: Squads with the highest downstream blast radius.
  4. *Cumulative Flow Diagram (CFD)*: Distribution of issues across lifecycle states over time.
* **Supported Views/Tabs**: `Delivery Velocity`, `Blocker Analytics`, `Team Health`.
* **Contextual Actions**: Drill down into specific team or project.
* **Reusable Existing Components**: `Button`, `Badge`, `Avatar`.
* **New Components Required**: `BlockerAgingChart`, `CycleRolloverRateWidget`, `CumulativeFlowChart`.
* **Entities / Data Consumed**: `activities`, `issues`, `dependencies`, `cycles`, `teams`.
* **Navigation Destinations**: Teams, Cycles, Projects.
* **Drawer Behavior**: None.
* **Modal / Popover Behavior**: None.
* **Empty State**: "Insufficient historical activity data to calculate insights. Run at least 1 cycle."
* **Loading State**: Chart skeletons.
* **Error State**: Analytics query timeout banner.
* **Responsive Considerations**: Stacked chart grid on mobile.
* **Keyboard Considerations**: Standard navigation.
* **Authorization Considerations**: Accessible to all roles (`ADMIN`, `MEMBER`, `OBSERVER`).

---

## 8. Settings & Administration Space

### `PAGE-SETTINGS-INDEX`
* **Route**: `/settings`
* **Purpose**: Settings router / redirect surface.
* **Primary User Goal**: Route user to the appropriate first accessible settings section based on role.
* **Behavior**: For `ADMIN`, resolves to `/settings/workspace`. For `MEMBER` or `OBSERVER`, resolves to `/settings/preferences`.

### `PAGE-SETTINGS-WORKSPACE`
* **Route**: `/settings/workspace`
* **Purpose**: Workspace-level organization settings, tenant configuration, and general defaults.
* **Primary User Goal**: Update workspace name, default workflow rules, and tenant settings.
* **Entry Points**: Sidebar Settings icon, User profile menu.
* **Page Header**:
  * Title: "Workspace Settings"
  * Organization ID badge
* **Primary Action**: `Save Changes`.
* **Major Sections**: Workspace Profile, Default Workflow Rules, Danger Zone (Archive/Delete).
* **Future Subsections Accounted For**: Future Security & Domain Access policies.
* **Reusable Components**: `Button`, `Modal`.
* **Entities**: `workspace`.
* **Auth**: `ADMIN` only.

### `PAGE-SETTINGS-MEMBERS`
* **Route**: `/settings/members`
* **Purpose**: User administration, role assignment (`ADMIN`, `MEMBER`, `OBSERVER`), and team assignments.
* **Primary User Goal**: Invite new members, update user roles, and manage active workspace members.
* **Entry Points**: Settings navigation, Team detail page.
* **Page Header**:
  * Title: "Members & Permissions"
* **Primary Action**: `Invite Member`.
* **Major Sections**: Active Member Roster, Pending Invitations, Role Definitions (`ADMIN`, `MEMBER`, `OBSERVER`).
* **Future Subsections Accounted For**: Future granular permission policies.
* **Reusable Components**: `Avatar`, `Button`, `Badge`, `SearchInput`.
* **Entities**: `users`, `teams`.
* **Auth**: `ADMIN` only.

### `PAGE-SETTINGS-TEAMS`
* **Route**: `/settings/teams`
* **Purpose**: Administrative team configuration, team slugs, and squad roster management.
* **Primary User Goal**: Create new squads, archive deprecated teams, and assign lead attribution.
* **Entry Points**: Settings navigation, Teams index.
* **Page Header**:
  * Title: "Team Management"
* **Primary Action**: `Create Team`.
* **Major Sections**: Active Teams List, Archived Teams.
* **Reusable Components**: `Button`, `Badge`, `Avatar`.
* **Entities**: `teams`, `users`.
* **Auth**: `ADMIN` only.

### `PAGE-SETTINGS-INTEGRATIONS`
* **Route**: `/settings/integrations`
* **Purpose**: Developer tooling connections (code repository linking, CI/CD webhook dispatch).
* **Primary User Goal**: Link code repositories, configure commit-linking keywords, and set up notifications.
* **Entry Points**: Settings navigation.
* **Page Header**:
  * Title: "Engineering Integrations"
* **Primary Action**: `Connect Repository`.
* **Major Sections**: Code Repositories, Inbound/Outbound Webhooks.
* **Future Subsections Accounted For**: Future notification routing & incident integrations.
* **Reusable Components**: `Button`, `Badge`.
* **Entities**: `integrations`.
* **Auth**: `ADMIN` only.

### `PAGE-SETTINGS-PREFERENCES`
* **Route**: `/settings/preferences`
* **Purpose**: Personal user preferences, theme, and personal notification rules.
* **Primary User Goal**: Customize personal density, theme, and alert preferences.
* **Entry Points**: Settings navigation, User profile dropdown.
* **Page Header**:
  * Title: "My Preferences"
* **Primary Action**: `Save Preferences`.
* **Major Sections**:
  1. *Appearance*: High-Density display mode, Theme.
  2. *Notifications*: In-app alert rules for Mentions and Blocker unblock events.
* **Reusable Components**: `Button`.
* **Entities**: `userPreferences`.
* **Auth**: Accessible to all authenticated users (`ADMIN`, `MEMBER`, `OBSERVER`).
