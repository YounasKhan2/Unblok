# UX-00: Unblok Page Registry

**Platform**: Unblok — High-Density Engineering Execution & Dependency Intelligence  
**Document**: Canonical Page Registry  
**Status**: APPROVED / FROZEN CONTRACT  
**Specification Depth**: Full 22-Point Spec per Page  

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
  - `PAGE-SETTINGS-WORKSPACE`: `/settings/workspace`
  - `PAGE-SETTINGS-MEMBERS`: `/settings/members`
  - `PAGE-SETTINGS-TEAMS`: `/settings/teams`
  - `PAGE-SETTINGS-INTEGRATIONS`: `/settings/integrations`
  - `PAGE-SETTINGS-PREFERENCES`: `/settings/preferences`

---

## 1. Personal Execution

### `PAGE-MY-WORK`
* **Route**: `/my-work`
* **Purpose**: Primary post-authentication cockpit answering *"What needs my attention right now, what is blocking me, and what am I blocking?"*.
* **Primary User Goal**: Triage and execute prioritized personal engineering tasks without being overwhelmed by unrelated workspace noise.
* **Entry Points**: Default post-login destination, global sidebar top item, keyboard shortcut `G` then `M`.
* **Page Header**:
  * Title: "My Work"
  * Context Subtitle: "Personal execution dashboard for [Current User]"
  * Status Badge: Active Cycle indicator + personal blocker rollup (`2 Blocked`, `1 Blocking`)
* **Primary Action**: `Create Task` (`C`).
* **Secondary Actions**: `Quick Filter` (`F`), `Toggle Grouping` (by Cycle, by State, by Blocker Status), `Export Personal Worklist`.
* **Major Sections**:
  1. *Needs Attention*: Tasks actively blocked or tasks where current user is the blocker for an upstream peer.
  2. *In Progress*: Active tasks currently being worked on.
  3. *Up Next (Current Cycle)*: Planned tasks for the active cycle assigned to current user.
  4. *In Review*: Pull request review requests or design review tasks.
  5. *Recently Completed*: Completed tasks in the current week.
* **Supported Views/Tabs**:
  - `Triage List` (dense keyboard-navigable rows)
  - `Blocker Focus` (filtered view highlighting dependencies)
  - `Weekly Schedule` (7-day timeline view)
* **Contextual Actions**: Bulk priority change, quick state change, add blocker note, reassign.
* **Reusable Existing Components**: `IssueRow`, `IssueList`, `FilterToolbar`, `BulkActionBar`, `StatePill`, `PriorityIcon`, `BlockerBadge`, `Avatar`.
* **New Components Required**: `PersonalBlockerSummaryBanner`, `GroupedSectionAccordion`.
* **Entities / Data Consumed**: `issues`, `dependencies`, `users`, `activeCycle`, `milestones`. Filtered where `assigneeId === currentUser.id` or `dependency.upstream.assigneeId === currentUser.id`.
* **Navigation Destinations**: Issue Drawer (click row or press `Space`), Full Issue (`/issues/:key`), Active Cycle (`/cycles/:cycleId`).
* **Drawer Behavior**: Clicking any row opens `IssueDrawer` on the right side. Full list remains interactive. J/K moves focus through list.
* **Modal / Popover Behavior**: State picker popover on `S`, priority picker popover on `P`.
* **Empty State**: Illustrated checkmark banner: "All clear! You have no active or blocked tasks in the current cycle." with a "Browse Project Backlogs" CTA.
* **Loading State**: Skeleton rows matching table height (5 rows, pulsing gray).
* **Error State**: Non-blocking toast with retry button: "Failed to load personal work queue. Reconnecting to local cache."
* **Responsive Considerations**: On desktop: full table with blocker tags and dates. On mobile: stacked card rows with truncated titles and priority pills.
* **Keyboard Considerations**: `J`/`K` to move selection, `Space` or `Enter` to open drawer, `X` to multi-select, `C` to create.
* **Authorization Considerations**: Accessible to all authenticated users. Private notes visible only to current user.

---

### `PAGE-INBOX`
* **Route**: `/inbox`
* **Purpose**: High-signal collaboration inbox collecting mentions, blocker resolutions, cycle rollovers, and assignment notifications.
* **Primary User Goal**: Rapidly process notifications, clear unread mentions, and review dependency unblock events.
* **Entry Points**: Global sidebar Inbox icon, notification bell indicator in App Header.
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
* **Responsive Considerations**: Full width on mobile; compact master-detail split on desktop.
* **Keyboard Considerations**: `J`/`K` to navigate, `E` to mark read, `Enter` to open issue drawer.
* **Authorization Considerations**: Strictly scoped to current user's personal notifications.

---

## 2. Projects Space

### `PAGE-PROJECTS-INDEX`
* **Route**: `/projects`
* **Purpose**: Directory of all engineering projects within the workspace.
* **Primary User Goal**: Discover, filter, and access active projects across teams.
* **Entry Points**: Sidebar "Projects" item, Command Palette `Projects`.
* **Page Header**:
  * Title: "Projects"
  * Scope: All Teams / Team Filter
  * Action: `New Project` (Admins/Tech Leads)
* **Primary Action**: `Create Project`.
* **Secondary Actions**: `Search Projects`, `Filter by Owning Team`, `Sort by Velocity / Health`.
* **Major Sections**:
  1. *Starred Projects*: User's bookmarked projects.
  2. *All Active Projects*: Grid/List showing Project Key, Owning Team, Issue Count, Blocker Count, and Delivery Health.
* **Supported Views/Tabs**: `Grid Cards View`, `Compact Table View`.
* **Contextual Actions**: Star project, view team, copy project key.
* **Reusable Existing Components**: `SearchInput`, `Button`, `Badge`, `Avatar`.
* **New Components Required**: `ProjectCard`, `ProjectHealthBar`.
* **Entities / Data Consumed**: `projects`, `teams`, `issues`, `dependencies`.
* **Navigation Destinations**: `/projects/:projectKey/issues`, `/projects/:projectKey/board`.
* **Drawer Behavior**: None on this page.
* **Modal / Popover Behavior**: Create Project Modal.
* **Empty State**: "No projects found matching filter. Create a new project to start organizing issues."
* **Loading State**: 6 pulsing skeleton project cards.
* **Error State**: Error banner with refresh button.
* **Responsive Considerations**: 3 columns on desktop, 2 on tablet, 1 on mobile.
* **Keyboard Considerations**: `/` to focus search, `Enter` to open project.
* **Authorization Considerations**: All workspace members can view projects; only admins/team leads can create projects.

---

### `PAGE-PROJECT-OVERVIEW`
* **Route**: `/projects/:projectKey`
* **Purpose**: Executive dashboard and roadmap snapshot for a specific project.
* **Primary User Goal**: Review project delivery progress, active blockers, owning team, and recent releases.
* **Entry Points**: Projects index, breadcrumb navigation, search.
* **Page Header**:
  * Title: `[Project Key] [Project Name]`
  * Subtitle: Owning Team link + Description
  * Tabs: Overview, Issues, Board, Planning, Settings
* **Primary Action**: `Add Issue to Project` (`C`).
* **Secondary Actions**: `Project Settings`, `Share Project Link`.
* **Major Sections**:
  1. *Delivery Progress*: Progress bar across Backlog, In Progress, In Review, Done.
  2. *Active Blockers*: Urgent cross-team blockers preventing project completion.
  3. *Recent Activity*: Audit feed of recent commits, PRs, and status transitions.
  4. *Team Contributors*: Assignees actively working on project issues.
* **Supported Views/Tabs**: Tabbed sub-navigation (`Overview`, `Issues`, `Board`, `Planning`, `Settings`).
* **Contextual Actions**: Pin to sidebar, export project report.
* **Reusable Existing Components**: `ActivityTimeline`, `BlockerBadge`, `StatePill`, `Button`.
* **New Components Required**: `ProjectBurnupWidget`, `CrossTeamBlockerCard`.
* **Entities / Data Consumed**: `project`, `team`, `issues`, `dependencies`, `activities`.
* **Navigation Destinations**: `/projects/:projectKey/issues`, `/projects/:projectKey/board`, `/teams/:teamKey`.
* **Drawer Behavior**: Clicking an issue from recent activity opens `IssueDrawer`.
* **Modal / Popover Behavior**: Create Issue Modal pre-populated with `projectId`.
* **Empty State**: "Project is newly created. Start by creating your first issue or importing a backlog."
* **Loading State**: Content skeleton.
* **Error State**: "Project not found or you lack permission to view this project."
* **Responsive Considerations**: Stacked widgets on small screens.
* **Keyboard Considerations**: Standard navigation shortcuts.
* **Authorization Considerations**: Scoped to workspace members.

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
* **Secondary Actions**: `Saved Views` (Bugs, Blocked, My Tasks), `Export CSV`.
* **Major Sections**:
  1. *Filter Toolbar*: Multi-select query builder.
  2. *Issue Data Table*: Columns for Selection, Key, Title, State, Priority, Assignee, Blocker Badge, Due Date.
  3. *Floating Bulk Action Bar*: Appears when $\ge 1$ issues are checked.
* **Supported Views/Tabs**: `All Issues`, `Active Sprint`, `Backlog`, `Blocked Only`.
* **Contextual Actions**: Bulk status update, bulk cycle assignment, bulk priority change.
* **Reusable Existing Components**: `IssueList`, `IssueRow`, `FilterToolbar`, `BulkActionBar`, `IssueDrawer`, `CompletionGuardDialog`.
* **New Components Required**: None (composes existing core execution suite).
* **Entities / Data Consumed**: `project`, `issues`, `dependencies`, `users`, `cycles`.
* **Navigation Destinations**: Issue Drawer (inline), `/issues/:issueKey` (cmd-click).
* **Drawer Behavior**: Clicking any row or pressing `Space` slides open `IssueDrawer`. List remains fully operable.
* **Modal / Popover Behavior**: `CompletionGuardDialog` triggers when attempting to move an issue with active blockers to `DONE`.
* **Empty State**: "No issues match active filters." with "Clear Filters" button.
* **Loading State**: Table row skeletons.
* **Error State**: Inline retry notice.
* **Responsive Considerations**: Horizontal scroll on mobile with frozen Key column.
* **Keyboard Considerations**: Full triage suite (`J`, `K`, `X`, `Space`, `S`, `P`, `A`).
* **Authorization Considerations**: Standard workspace edit permissions.

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
* **Secondary Actions**: `Swimlanes Toggle`, `Filter Bar Toggle`.
* **Major Sections**:
  - Columns: `BACKLOG`, `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`.
  - Column Headers: Column name, issue count, WIP limits (future).
* **Supported Views/Tabs**: Standard Kanban, Compact Board.
* **Contextual Actions**: Move card, inspect blockers, assign member.
* **Reusable Existing Components**: `IssueBoard`, `IssueCard`, `IssueDrawer`, `CompletionGuardDialog`, `FilterToolbar`.
* **New Components Required**: None (existing components mapped).
* **Entities / Data Consumed**: `project`, `issues`, `dependencies`, `users`.
* **Navigation Destinations**: Issue Drawer.
* **Drawer Behavior**: Clicking card opens `IssueDrawer`.
* **Modal / Popover Behavior**: Hard completion guard modal triggers when dragging a blocked card to `DONE`.
* **Empty State**: Empty column drop placeholders.
* **Loading State**: Card skeletons in each column.
* **Error State**: Toast notification on drag failure.
* **Responsive Considerations**: Horizontal swipeable board columns on mobile.
* **Keyboard Considerations**: Arrow keys to navigate cards, `S` to change status.
* **Authorization Considerations**: Edit permissions required to move cards.

---

### `PAGE-PROJECT-PLANNING`
* **Route**: `/projects/:projectKey/planning`
* **Purpose**: Sprint cycle and milestone allocation for the project.
* **Primary User Goal**: Move backlog issues into active or upcoming sprint cycles and link to strategic milestones.
* **Entry Points**: Project tabs, cycle planning navigation.
* **Page Header**:
  * Title: `[Project Key] Planning & Sprints`
  * Active Cycle widget with velocity gauge
* **Primary Action**: `Schedule Sprint`.
* **Secondary Actions**: `Rollover Incomplete Tasks`, `Milestone Alignment`.
* **Major Sections**:
  1. *Sprint Cadence Planner*: Drag-and-drop split between Backlog and Upcoming Cycles.
  2. *Milestone Mapping*: Visual breakdown of issues mapped to strategic release dates.
* **Supported Views/Tabs**: `Sprint Planning`, `Milestone Mapping`.
* **Contextual Actions**: Bulk assign to cycle, bulk link to milestone.
* **Reusable Existing Components**: `CyclePlanningView`, `MilestonesView`, `IssueRow`, `Button`.
* **New Components Required**: `BacklogToSprintSplitter`.
* **Entities / Data Consumed**: `project`, `issues`, `cycles`, `milestones`.
* **Navigation Destinations**: `/cycles/:cycleId`, `/milestones/:milestoneId`.
* **Drawer Behavior**: Issue drawer opens on item selection.
* **Modal / Popover Behavior**: Cycle rollover confirmation modal.
* **Empty State**: "No unassigned backlog items remaining."
* **Loading State**: Split column skeletons.
* **Error State**: Standard error banner.
* **Responsive Considerations**: Stacked columns on mobile.
* **Keyboard Considerations**: Standard list navigation.
* **Authorization Considerations**: Team Lead or Admin required to modify cycle allocations.

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
* **Secondary Actions**: `Archive Project`, `Transfer Ownership`, `Delete Project` (Danger Zone).
* **Major Sections**:
  1. *General*: Project Name, Key, Description, Owning Team selector.
  2. *Sequencing*: Next issue number counter (e.g., `ENG-142`).
  3. *Default Assignees & Reviewers*: Automatic triaging rules.
  4. *Danger Zone*: Archive or permanently delete project.
* **Supported Views/Tabs**: Single-page form with vertical anchor navigation.
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
* **Authorization Considerations**: Restricted to Project Admins and Workspace Admins.

---

## 3. Issues Space

### `PAGE-ISSUE-DETAIL`
* **Route**: `/issues/:issueKey`
* **Purpose**: Full-screen canonical workspace destination for deep engineering work on a single issue.
* **Primary User Goal**: Read full technical specifications, author comments, manage multi-hop dependencies, review git links, and inspect full audit logs.
* **Entry Points**: Direct browser URL/deep link, Cmd-click from any issue list/board, "Open in Full Page" button in Issue Drawer (`Cmd+O`).
* **Page Header**:
  * Breadcrumb: `Workspace > [Team Name] > [Project Key] > [Issue Key]`
  * Issue Key + Status Pill + Blocker Status Badge
  * Action: `Copy Link`, `Share`, `Close / Back to Context`
* **Primary Action**: `Change Status` (`S`).
* **Secondary Actions**: `Add Blocker` (`B`), `Add Comment` (`M`), `Link Branch / PR`.
* **Major Sections**:
  1. *Main Content Column (Left ~65%)*:
     - Editable Title
     - Markdown Description Editor
     - Subtasks & Checklist
     - Blockers & Dependencies section with interactive visual mini-graph
     - Threaded Discussion Stream (`CommentThread`)
     - Complete Audit Trail & Activity Log (`ActivityTimeline`)
  2. *Metadata Sidebar (Right ~35%)*:
     - Property Grid: State, Priority, Assignee, Cycle, Milestone, Start/Due Dates, Story Points
     - Cross-Team Impact indicators
     - Git Branch / PR references
* **Supported Views/Tabs**: Single comprehensive page with tabbed sub-sections for Discussion, Dependencies, and Audit Trail.
* **Contextual Actions**: Add dependency, delete comment, resolve blocker.
* **Reusable Existing Components**: `PropertyGrid`, `DependencyManager`, `CommentThread`, `ActivityTimeline`, `BlockerBadge`, `StatePill`, `PriorityIcon`, `CompletionGuardDialog`, `CycleErrorDialog`.
* **New Components Required**: `IssueBreadcrumbHeader`, `GitBranchLinkWidget`.
* **Entities / Data Consumed**: `issue`, `dependencies`, `comments`, `activities`, `users`, `projects`, `teams`, `cycles`, `milestones`.
* **Navigation Destinations**: Upstream/downstream issues, Owning Project, Owning Team, Assignee profile.
* **Drawer Behavior**: Drawer is *not* used on this page (this is the full-screen destination).
* **Modal / Popover Behavior**: `CompletionGuardDialog` on invalid status transition; `CycleErrorDialog` on circular dependency attempt.
* **Empty State**: "Issue not found" (404 state with "Return to My Work" CTA).
* **Loading State**: Full-page skeleton (header, content column, sidebar).
* **Error State**: Explicit 404 or 403 access denied card.
* **Responsive Considerations**: On desktop: 2-column layout. On mobile: stacked single column with metadata collapsible at top.
* **Keyboard Considerations**: `S` (state), `P` (priority), `A` (assignee), `Esc` (back), `Cmd+Enter` (submit comment).
* **Authorization Considerations**: Edit permissions required to alter properties; read-only for observers.

---

## 4. Teams Space

### `PAGE-TEAMS-INDEX`
* **Route**: `/teams`
* **Purpose**: Workspace team directory displaying all squads, lead engineers, and operational metrics.
* **Primary User Goal**: Find teams, review squad composition, and check active team projects.
* **Entry Points**: Global sidebar "Teams" item.
* **Page Header**:
  * Title: "Teams"
  * Action: `Create Team` (Admins)
* **Primary Action**: `Create Team`.
* **Secondary Actions**: `Search Teams`, `Filter by Department`.
* **Major Sections**:
  1. *Team Grid*: Cards showing Team Key, Name, Lead, Member Count, Active Projects, and Open Blockers.
* **Supported Views/Tabs**: Grid View, Table View.
* **Contextual Actions**: Join team, contact lead.
* **Reusable Existing Components**: `SearchInput`, `Button`, `Avatar`, `Badge`.
* **New Components Required**: `TeamCard`.
* **Entities / Data Consumed**: `teams`, `users`, `projects`, `issues`.
* **Navigation Destinations**: `/teams/:teamKey`.
* **Drawer Behavior**: None.
* **Modal / Popover Behavior**: Create Team modal.
* **Empty State**: "No teams configured yet."
* **Loading State**: Card skeletons.
* **Error State**: Standard error banner.
* **Responsive Considerations**: 3 columns desktop, 1 column mobile.
* **Keyboard Considerations**: Standard navigation.
* **Authorization Considerations**: Admin access to create teams.

---

### `PAGE-TEAM-DETAIL`
* **Route**: `/teams/:teamKey`
* **Purpose**: Dedicated team hub presenting squad members, owned projects, active cycles, and cross-team dependencies.
* **Primary User Goal**: Understand a specific team's commitments, active sprint velocity, and incoming/outgoing blockers.
* **Entry Points**: Teams index, breadcrumbs, project headers.
* **Page Header**:
  * Title: `[Team Key] [Team Name]`
  * Subtitle: Tech Lead + Member Roster
  * Tabs: Projects, Cycles, Team Roster, Dependencies
* **Primary Action**: `New Team Project`.
* **Secondary Actions**: `Team Settings`, `Plan Team Cycle`.
* **Major Sections**:
  1. *Team Projects*: List of projects owned by this squad.
  2. *Active Sprint Cycle*: Current cadence burndown and issues.
  3. *Cross-Team Blockers*: Dependencies this team owes to other squads or is waiting on.
  4. *Member Directory*: Engineers in this squad and their active task loads.
* **Supported Views/Tabs**: `Projects`, `Cycles`, `Blockers`, `Members`.
* **Contextual Actions**: Add project to team, add member to team.
* **Reusable Existing Components**: `IssueRow`, `Avatar`, `Button`, `BlockerBadge`.
* **New Components Required**: `TeamMemberLoadGrid`, `CrossTeamDependencySummary`.
* **Entities / Data Consumed**: `team`, `users`, `projects`, `cycles`, `issues`, `dependencies`.
* **Navigation Destinations**: Project pages, Cycle detail, Member profiles.
* **Drawer Behavior**: Issue drawer opens when clicking issues.
* **Modal / Popover Behavior**: Add Member modal.
* **Empty State**: "Team has no active projects assigned."
* **Loading State**: Skeleton layout.
* **Error State**: Team 404 banner.
* **Responsive Considerations**: Stacked sections on small screens.
* **Keyboard Considerations**: Tab navigation.
* **Authorization Considerations**: Team Lead can edit team membership.

---

## 5. Planning Space

### `PAGE-CYCLES-INDEX`
* **Route**: `/cycles`
* **Purpose**: Overview of all active, upcoming, and completed sprint cycles across teams.
* **Primary User Goal**: Track sprint schedules, start upcoming cycles, and monitor velocity trends.
* **Entry Points**: Global sidebar "Cycles" link, planning menus.
* **Page Header**:
  * Title: "Delivery Cycles"
  * Active Cycle status bar
* **Primary Action**: `Create Cycle`.
* **Secondary Actions**: `Filter by Team`, `View Historical Velocity`.
* **Major Sections**:
  1. *Active Cycles*: Currently running sprints across squads with progress bars.
  2. *Upcoming Cycles*: Planned future cadences with scheduled issues.
  3. *Completed Cycles*: Archive of past sprints with completion statistics.
* **Supported Views/Tabs**: `All Teams`, `My Team`.
* **Contextual Actions**: Start cycle, rollover issues, export cycle summary.
* **Reusable Existing Components**: `CyclePlanningView`, `Button`, `Badge`.
* **New Components Required**: `CycleSummaryCard`.
* **Entities / Data Consumed**: `cycles`, `teams`, `issues`.
* **Navigation Destinations**: `/cycles/:cycleId`.
* **Drawer Behavior**: None on index.
* **Modal / Popover Behavior**: Create Cycle modal.
* **Empty State**: "No active cycles. Create your first 2-week cycle to begin sprint tracking."
* **Loading State**: Card skeletons.
* **Error State**: Standard error alert.
* **Responsive Considerations**: Responsive grid cards.
* **Keyboard Considerations**: Standard navigation.
* **Authorization Considerations**: Team Leads/Admins can start/end cycles.

---

### `PAGE-CYCLE-DETAIL`
* **Route**: `/cycles/:cycleId`
* **Purpose**: Detailed execution view for a specific sprint cycle.
* **Primary User Goal**: Execute the active sprint, triage remaining tasks, and trigger end-of-cycle rollover for unfinished work.
* **Entry Points**: Cycles index, My Work header badge, Project planning tab.
* **Page Header**:
  * Title: `[Cycle Name]` (e.g., `Cycle 24: Core Platform Hardening`)
  * Date Span: e.g., `Sep 28, 2026 - Oct 11, 2026`
  * Status: Active / Upcoming / Completed
  * Action: `Complete Cycle & Rollover` (when active)
* **Primary Action**: `Complete Cycle` (with rollover dialog).
* **Secondary Actions**: `Add Issue to Cycle`, `Cycle Burndown Chart`.
* **Major Sections**:
  1. *Cycle Progress Banner*: Total issues, Done vs. Remaining, Active Blockers count.
  2. *Issue Triage Table / Board*: List or Board view of all cycle issues.
  3. *Unfinished Work Rollover Zone*: Direct action to rollover incomplete issues to the next cadence.
* **Supported Views/Tabs**: `List View`, `Board View`.
* **Contextual Actions**: Remove from cycle, rollover issue, prioritize.
* **Reusable Existing Components**: `CyclePlanningView`, `IssueList`, `IssueBoard`, `IssueDrawer`, `BulkActionBar`, `CompletionGuardDialog`.
* **New Components Required**: `CycleBurndownWidget`.
* **Entities / Data Consumed**: `cycle`, `issues`, `dependencies`, `users`.
* **Navigation Destinations**: Next cycle, Issue Drawer.
* **Drawer Behavior**: Issue drawer opens on item selection.
* **Modal / Popover Behavior**: `RolloverIncompleteIssuesDialog` (modal allowing selection of target cycle for incomplete tasks).
* **Empty State**: "No issues assigned to this cycle."
* **Loading State**: Content skeleton.
* **Error State**: Cycle 404 state.
* **Responsive Considerations**: Horizontal scroll on board view.
* **Keyboard Considerations**: Standard triage hotkeys (`J`/`K`/`S`).
* **Authorization Considerations**: Team Lead required to complete cycle.

---

### `PAGE-MILESTONES-INDEX`
* **Route**: `/milestones`
* **Purpose**: Directory of organizational strategic objectives, major releases, and company milestones.
* **Primary User Goal**: Review company-level delivery commitments, delivery dates, and aggregate risk statuses.
* **Entry Points**: Global sidebar "Milestones" item.
* **Page Header**:
  * Title: "Strategic Milestones"
  * Action: `Create Milestone`
* **Primary Action**: `Create Milestone`.
* **Secondary Actions**: `Filter by Quarter / Year`, `Filter by Risk (On Track, At Risk, Blocked)`.
* **Major Sections**:
  1. *Active Milestones*: Ranked by target date with automated health rollup indicators.
  2. *Completed Milestones*: Historical delivery milestones with post-mortem stats.
* **Supported Views/Tabs**: `Timeline List`, `Card Matrix`.
* **Contextual Actions**: Update target date, inspect blocked issue tree.
* **Reusable Existing Components**: `MilestonesView`, `Button`, `Badge`.
* **New Components Required**: `MilestoneHealthGauge`.
* **Entities / Data Consumed**: `milestones`, `issues`, `dependencies`, `teams`.
* **Navigation Destinations**: `/milestones/:milestoneId`.
* **Drawer Behavior**: None on index.
* **Modal / Popover Behavior**: Create Milestone modal.
* **Empty State**: "No strategic milestones created. Define release goals to track multi-team commitments."
* **Loading State**: Skeletons.
* **Error State**: Standard error alert.
* **Responsive Considerations**: Responsive card grid.
* **Keyboard Considerations**: Standard navigation.
* **Authorization Considerations**: Tech Leads and Admins can create/edit milestones.

---

### `PAGE-MILESTONE-DETAIL`
* **Route**: `/milestones/:milestoneId`
* **Purpose**: Deep-dive tracking for a single strategic release target, aggregating issues across multiple projects.
* **Primary User Goal**: Identify critical path blockers and overdue workstreams threatening a major delivery deadline.
* **Entry Points**: Milestones index, Issue drawer milestone link.
* **Page Header**:
  * Title: `[Milestone Name]` (e.g., `v2.0 General Availability`)
  * Target Date: e.g., `Nov 15, 2026` (Countdown in days)
  * Status: `ON TRACK` / `AT RISK` / `BLOCKED`
* **Primary Action**: `Link Issues to Milestone`.
* **Secondary Actions**: `Edit Milestone Dates`, `Export Status Brief`.
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
* **Authorization Considerations**: Admin/Lead to edit milestone dates.

---

### `PAGE-ROADMAP`
* **Route**: `/roadmap`
* **Purpose**: High-craft calendar timeline and interactive Gantt schedule for multi-week execution across teams.
* **Primary User Goal**: Visualize workstreams across dates, balance engineer workloads, and review scheduled sprints.
* **Entry Points**: Global sidebar "Roadmap & Schedule" link.
* **Page Header**:
  * Title: "Schedule & Roadmap"
  * Date Range Navigator: `< 28 Sep - 04 Oct 2026 >` with `Today` jump
  * View Switcher: `View by: Team Workstream` vs. `View by: Assignee Workload`
* **Primary Action**: `Publish Sprint`.
* **Secondary Actions**: `Rebalance Workload`, `Export Schedule`, `Reset Filters`.
* **Major Sections**:
  1. *Left Pinned Assignee / Team Roster*: Quick search, engineer cards with role tags, task counts, and blocker shields (`🛡️ 1`).
  2. *Right Calendar Grid*: 7-day or 14-day columns with collapsible swimlanes, interactive task cards, and inline `(+)` day scheduling.
* **Supported Views/Tabs**: `Team Workstreams`, `Assignee Workload`.
* **Contextual Actions**: Click engineer to isolate workload, click card to open issue drawer, click `(+)` to schedule.
* **Reusable Existing Components**: `TimelineRoadmapView`, `PriorityIcon`, `Avatar`, `BlockerBadge`, `IssueDrawer`.
* **New Components Required**: None (fully built in TimelineRoadmapView).
* **Entities / Data Consumed**: `issues`, `teams`, `users`, `dependencies`, `activeCycle`.
* **Navigation Destinations**: Issue Drawer.
* **Drawer Behavior**: Clicking any card opens `IssueDrawer` on the right.
* **Modal / Popover Behavior**: Quick schedule prompt on `(+)` click.
* **Empty State**: Empty swimlanes show subtle dashed `(+)` buttons.
* **Loading State**: Grid skeletons.
* **Error State**: Standard error banner.
* **Responsive Considerations**: Horizontal scroll on calendar grid with pinned left roster.
* **Keyboard Considerations**: Arrow navigation between day cells.
* **Authorization Considerations**: Edit permissions required to re-schedule dates.

---

## 6. Dependency Intelligence Space

### `PAGE-DEPENDENCIES`
* **Route**: `/dependencies`
* **Purpose**: Dedicated workspace-wide dependency intelligence hub providing full DAG graph exploration and bottleneck matrices.
* **Primary User Goal**: Investigate cross-team blockers, detect circular deadlock risks, identify the critical path, and view dependency matrices.
* **Entry Points**: Global sidebar "Dependencies" item, Blocker badges across app.
* **Page Header**:
  * Title: "Dependency Intelligence"
  * Active Blockers Count: `X Active Blockers across Workspace`
  * Action: `Detect Circular Dependencies` (automatic zero-cycle validator)
* **Primary Action**: `Add Dependency Edge`.
* **Secondary Actions**: `Toggle Critical Path`, `Export DAG`, `Filter by Cross-Team Only`.
* **Major Sections**:
  1. *Visual DAG Graph Canvas*: Interactive node-edge graph with zoom, pan, team clustering, and critical path glow.
  2. *Cross-Team Bottleneck Heatmap*: Matrix highlighting teams blocking other squads.
  3. *Active Blocker Registry*: Tabular list of every currently blocking issue with blocker age in days.
* **Supported Views/Tabs**:
  - `Topological DAG Canvas` (`DagGraphCanvas`)
  - `Dependency Matrix Grid` (`DependencyMatrix`)
  - `Active Blocker Queue` (Table of all blocked issues)
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
* **Responsive Considerations**: Canvas requires min 1024px desktop; table fallback for mobile.
* **Keyboard Considerations**: `+`/`-` to zoom canvas, `Space` to pan.
* **Authorization Considerations**: Edit permissions to add/remove dependency edges.

---

## 7. Insights Space

### `PAGE-INSIGHTS`
* **Route**: `/insights`
* **Purpose**: Delivery intelligence, blocker aging velocity, and operational health metrics.
* **Primary User Goal**: Identify systemic engineering bottlenecks, measure cycle lead times, and track blocker resolution speeds.
* **Entry Points**: Global sidebar "Insights" item.
* **Page Header**:
  * Title: "Delivery & Dependency Insights"
  * Date Filter: Last 30 Days, Last Quarter, Current Year
* **Primary Action**: `Export Insights Report`.
* **Secondary Actions**: `Filter by Team`, `Filter by Milestone`.
* **Major Sections**:
  1. *Blocker Velocity & Aging*: Average time issues remain in blocked status before unblocking.
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
* **Modal / Popover Behavior**: Export report modal.
* **Empty State**: "Insufficient historical activity data to calculate insights. Run at least 1 cycle."
* **Loading State**: Chart skeletons.
* **Error State**: Analytics query timeout banner.
* **Responsive Considerations**: Stacked chart grid on mobile.
* **Keyboard Considerations**: Standard navigation.
* **Authorization Considerations**: Workspace Members and Admins.

---

## 8. Settings & Administration Space

### `PAGE-SETTINGS-WORKSPACE`
* **Route**: `/settings/workspace`
* **Purpose**: Workspace-level organization settings, tenant configuration, and general defaults.
* **Primary User Goal**: Update workspace name, company domain, default cycle duration, and security boundaries.
* **Entry Points**: Sidebar Settings icon, User profile menu.
* **Page Header**:
  * Title: "Workspace Settings"
  * Organization ID badge
* **Primary Action**: `Save Changes`.
* **Major Sections**: Workspace Profile, Domain & SSO, Default Workflow States, Danger Zone.
* **Reusable Components**: `Button`, `Modal`.
* **Entities**: `workspace`.
* **Auth**: Workspace Admins only.

### `PAGE-SETTINGS-MEMBERS`
* **Route**: `/settings/members`
* **Purpose**: User administration, role-based access control (RBAC), and team assignments.
* **Primary User Goal**: Invite new engineers, assign roles (`ADMIN`, `TECH_LEAD`, `MEMBER`), and manage active seats.
* **Entry Points**: Settings menu, Team page header.
* **Page Header**:
  * Title: "Members & Permissions"
  * Active Seats Count: `4 of 25 Seats Used`
* **Primary Action**: `Invite Member`.
* **Major Sections**: Member List, Invited List, Role Permissions Matrix.
* **Reusable Components**: `Avatar`, `Button`, `Badge`, `SearchInput`.
* **Entities**: `users`, `teams`.
* **Auth**: Workspace Admins only.

### `PAGE-SETTINGS-TEAMS`
* **Route**: `/settings/teams`
* **Purpose**: Administrative team configuration, team keys, and cross-team permissions.
* **Primary User Goal**: Create new squads, archive deprecated teams, and assign team leads.
* **Entry Points**: Settings menu, Teams index.
* **Page Header**:
  * Title: "Team Management"
* **Primary Action**: `Create Team`.
* **Major Sections**: Active Teams List, Archived Teams.
* **Reusable Components**: `Button`, `Badge`, `Avatar`.
* **Entities**: `teams`, `users`.
* **Auth**: Workspace Admins only.

### `PAGE-SETTINGS-INTEGRATIONS`
* **Route**: `/settings/integrations`
* **Purpose**: Developer tooling connections (GitHub, GitLab, Slack, Linear importer).
* **Primary User Goal**: Link code repositories, configure commit-linking keywords (e.g., `Fixes ENG-101`), and set up alert webhooks.
* **Entry Points**: Settings menu.
* **Page Header**:
  * Title: "Engineering Integrations"
* **Primary Action**: `Connect GitHub`.
* **Major Sections**: GitHub / GitLab, CI/CD Webhooks, Slack Alerts.
* **Reusable Components**: `Button`, `Badge`.
* **Entities**: `integrations`.
* **Auth**: Workspace Admins only.

### `PAGE-SETTINGS-PREFERENCES`
* **Route**: `/settings/preferences`
* **Purpose**: Personal user preferences, theme, keyboard shortcut profile, and notification rules.
* **Primary User Goal**: Customize keyboard behavior, notification channels, and high-density view modes.
* **Entry Points**: Settings menu, User profile dropdown.
* **Page Header**:
  * Title: "My Preferences"
* **Primary Action**: `Save Preferences`.
* **Major Sections**:
  1. *Appearance*: High-Density mode, Font sizing, Theme.
  2. *Keyboard Shortcuts*: Linear/Vim-style navigation presets.
  3. *Notifications*: Email vs. In-App for Mentions, Blockers, Assignments.
* **Reusable Components**: `Button`.
* **Entities**: `userPreferences`.
* **Auth**: All authenticated users (personal scope).
