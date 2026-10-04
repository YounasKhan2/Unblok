# UX-00: Unblok End-to-End User Journeys

**Platform**: Unblok — High-Density Engineering Execution & Dependency Intelligence  
**Document**: Canonical User Journey Validation & Navigation Flow  
**Status**: APPROVED / FROZEN CONTRACT  

---

## Journey 1: Daily Engineering Execution & Rapid Triage

**Actor**: Staff Software Engineer  
**Objective**: Review personal morning priorities, inspect active blockers, update status, and dive into technical code review.

```
Step 1: Authenticated Entry
  URL: /my-work
  State: User views personal execution cockpit. "Needs Attention" displays 1 blocked issue (ENG-101).
  Keypress: J / K to move table selection to ENG-101.

Step 2: Inspect Blocker via Drawer
  Action: User presses Space or clicks row.
  URL: /my-work?drawer=ENG-101
  Result: IssueDrawer slides open (440px). Focus is placed on BlockerBadge.
  Inspection: User sees INF-42 (Deploy Postgres Read Replica) is the active upstream prerequisite.

Step 3: Deep Focus Transition
  Action: User clicks "Open in Full Page" icon in drawer header (or presses Cmd+O).
  URL: /issues/ENG-101
  Result: Full 2-column canonical issue detail page loads. User reads technical implementation notes.

Step 4: Navigate to Upstream Blocker
  Action: In the Dependencies section of ENG-101, user clicks upstream link "INF-42".
  URL: /issues/INF-42
  Result: Direct navigation to the blocker issue. User leaves a comment: "@David Kim is the replica ready?".

Step 5: Return to Personal Context
  Action: User hits browser Back button (or presses Esc / G then M).
  URL: /my-work
  Result: Seamless return to personal work queue with exact scroll position preserved.
```

*Dead End Check*: Passed. No dead-ends; browser back stack and global shortcuts (`G M`) cleanly return to initial context.

---

## Journey 2: Project Delivery & Status Transition with Completion Guard

**Actor**: Squad Tech Lead  
**Objective**: Review sprint board, transition an in-review issue to DONE, encounter and resolve a hard completion guard.

```
Step 1: Open Project Board
  URL: /projects/ENG/board
  State: Kanban board renders columns: Backlog, Todo, In Progress, In Review, Done.

Step 2: Drag Card to Done
  Action: User drags card "ENG-105: GraphQL Federation Gateway" from IN_REVIEW to DONE.
  System Invariant Check: Domain checks upstream prerequisites: INF-204 is still IN_PROGRESS.

Step 3: Hard Completion Guard Triggered
  Modal: CompletionGuardDialog interrupts transition.
  Dialog Content:
    - Title: "Prerequisite Blockers Incomplete"
    - Body: "ENG-105 cannot be marked as DONE because 1 upstream prerequisite is not completed."
    - Blocker List: [INF-204: Provision Redis Cache Cluster (IN_PROGRESS)]
    - Action: [Cancel] / [Inspect Blocker]

Step 4: Inspect & Expedite Blocker
  Action: User clicks "Inspect Blocker" in the modal.
  URL: /projects/ENG/board?drawer=INF-204
  Result: Modal dismisses and IssueDrawer opens directly focused on INF-204. User checks ETA and closes drawer.
```

*Dead End Check*: Passed. Guard provides explicit actionable paths to inspect blockers rather than a generic error toast.

---

## Journey 3: Sprint Planning & Milestone Alignment

**Actor**: Engineering Manager / Release Lead  
**Objective**: Plan Cycle 25, review unassigned backlog items, link to Q4 Milestone, and verify Roadmap schedule.

```
Step 1: Open Cycle Planning
  URL: /cycles/cycle_24
  State: Cycle 24 active burndown. 3 incomplete items remain.

Step 2: Complete Cycle & Rollover
  Action: User clicks "Complete Cycle & Rollover" button in header.
  Modal: RolloverIncompleteIssuesDialog opens.
  Options: User selects "Rollover 3 incomplete issues to Cycle 25" and clicks [Confirm & Start Cycle 25].
  URL: /cycles/cycle_25
  Result: Cycle 25 initializes with rolled-over issues in the TODO column.

Step 3: Align to Strategic Milestone
  Action: User multi-selects 3 issues (X, X, X), clicks "Set Milestone" on BulkActionBar, selects "v2.0 GA".
  System: Issues are tagged with Milestone ID.

Step 4: Cross-Check Roadmap
  Action: User presses G then R.
  URL: /roadmap
  Result: High-craft timeline loads. User verifies that all Cycle 25 workstreams fall within the 2-week window.
```

*Dead End Check*: Passed. Clean hand-off between Cycle, Bulk Actions, Milestone, and Roadmap.

---

## Journey 4: Workspace Dependency Investigation & DAG Cycle Prevention

**Actor**: Principal Systems Architect  
**Objective**: Investigate a multi-team delivery bottleneck and verify zero circular deadlocks.

```
Step 1: Open Dependency Intelligence Hub
  URL: /dependencies
  State: Full topological DAG canvas renders 18 interconnected issues across 3 teams.
  Highlight: Critical path is automatically outlined in vibrant purple edge glow.

Step 2: Trace Bottleneck
  Action: User inspects the cluster with the highest in-degree. Identifies INF-101 blocking 4 downstream API tasks.
  Action: User clicks INF-101 node.
  Result: IssueDrawer slides open on the right displaying DependencyManager.

Step 3: Attempt Circular Dependency Edge (Safety Test)
  Action: User clicks "Add Prerequisite Blocker" in DependencyManager and enters ENG-101.
  System Invariant Check: Depth-First Search (DFS) detects that ENG-101 is already downstream of INF-101.
  Modal: CycleErrorDialog opens.
    - Title: "Circular Dependency Detected"
    - Body: "Adding this prerequisite would create an illegal circular dependency loop (INF-101 → ENG-101 → INF-101)."
    - Action: Graph edge is rejected and database invariants remain 100% pristine.
```

*Dead End Check*: Passed. The system prevents corruption before network transmission and provides an explicit path explanation.

---

## Journey 5: Inbox Collaboration & @Mention Response

**Actor**: Senior Frontend Engineer  
**Objective**: Respond to a teammate's technical question from an inbox notification.

```
Step 1: Notification Alert
  URL: /inbox
  State: Inbox displays unread item: "@Sarah Chen mentioned you on WEB-302: Migration to Tailwind v4".

Step 2: Open Thread
  Action: User clicks the notification row.
  URL: /inbox?drawer=WEB-302&tab=comments
  Result: IssueDrawer opens immediately on the DISCUSSIONS tab with the mention highlighted.

Step 3: Inline Reply with Code Snippet
  Action: User clicks "Reply", types "@Elena Rostova Here is the updated config:", clicks Code button, pastes config snippet, presses Cmd+Enter.
  Result: Reply appends to the nested comment thread; audit event USER_MENTIONED is logged.
  Action: User presses E to mark notification as read and close drawer.
```

*Dead End Check*: Passed. Notification processing is zero-latency with instant keyboard archiving.

---

## Journey 6: Strategic Organizational Investigation

**Actor**: VP of Engineering  
**Objective**: Diagnose why Q4 release milestones are flagged as "AT RISK".

```
Step 1: Strategic Milestones Overview
  URL: /milestones
  State: Milestone "v2.0 GA" displays "AT RISK" status badge.

Step 2: Drill into Milestone Detail
  Action: User clicks "v2.0 GA".
  URL: /milestones/q4_ga
  State: Critical path analysis exposes that Infrastructure squad has 3 unresolved blockers aging past 14 days.

Step 3: Investigate Organizational Insights
  Action: User navigates to /insights.
  State: Blocker Aging chart confirms Infra team average resolution time is 9.2 days vs. workspace target of 3.0 days.
  Action: User exports summary brief for the weekly engineering leadership sync.
```

*Dead End Check*: Passed. Seamless drill-down from company goal to team metric to individual blocker root cause.

---

## Journey 7: Workspace Administration & Team Configuration

**Actor**: Workspace Administrator  
**Objective**: Provision a new "Security & Compliance" engineering team and invite the team lead.

```
Step 1: Open Settings
  URL: /settings/teams
  State: List of active teams (Core Platform, Infrastructure, Web Frontend).

Step 2: Create Team
  Action: User clicks [Create Team], enters Name: "Security & Compliance", Key: "SEC", Color: "#dd5b00".
  Result: Team SEC is initialized.

Step 3: Invite Tech Lead
  Action: User navigates to /settings/members, clicks [Invite Member], enters email and selects Role: TECH_LEAD, Team: SEC.
  Result: Invitation dispatched; member roster updates in real time.
```

*Dead End Check*: Passed. Standard administrative CRUD with clear confirmation dialogs.
