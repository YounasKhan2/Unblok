# UX-00: Unblok Navigation Model & Global Application Shell

**Platform**: Unblok — High-Density Engineering Execution & Dependency Intelligence  
**Document**: Application Shell & Navigation Specification  
**Status**: HUMAN REVIEW — NOT FROZEN  

---

## 1. Global Application Shell Architecture

The Unblok authenticated shell is engineered for **uninterrupted desktop flow, high information density, and rapid keyboard triage**.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ 1. WORKSPACE HEADER (Height: 44px, sticky top, z-index: 40)                                  │
│  [Logo] [Workspace Switcher ▼] │ [Search / Cmd+K] │ [Create +] │ [Bell] [Help] [Avatar Profile]│
├─────────┬────────────────────────────────────────────────────────────────────────────────────┤
│ 2. RAIL │ 3. CONTEXTUAL PAGE HEADER (Height: 48px, sticky top, z-index: 30)                  │
│ (52px / │    Breadcrumbs / Page Title │ View Tabs (List/Board) │ Filter Bar │ Action Buttons │
│  220px) ├──────────────────────────────────────────────────────┬─────────────────────────────┤
│         │ 4. MAIN CONTENT REGION (scrolls independently)       │ 5. GLOBAL ISSUE DRAWER      │
│  Icons  │    - Issues Table                                    │    (Width: 440px / slide-in)│
│  or     │    - Kanban Board                                    │    - Properties Grid        │
│  Full   │    - DAG Graph Canvas                                │    - Dependency Manager     │
│  Labels │    - Timeline / Roadmap                              │    - Comment Thread         │
│         │                                                      │    - Activity Audit Trail   │
└─────────┴──────────────────────────────────────────────────────┴─────────────────────────────┘
```

---

## 2. Shell Zones & Component Boundaries

### Zone 1: Workspace Header (Top Bar)
* **Height**: 44px (hairline border bottom `1px solid #e5e3df`).
* **Background**: Clean white (`#ffffff`).
* **Elements (Left to Right)**:
  1. *Brand Identifier*: Compact Unblok mark.
  2. *Workspace Switcher*: Displays the active workspace context (e.g., `Kite Core Engineering`). Allows switching the active tenant context without altering human-facing route structure.
  3. *Global Command Palette Trigger*: Compact search bar displaying `Search or jump to... (⌘K)`. Clicking or pressing `Cmd+K` opens the modal command palette.
  4. *Global Create Button*: Purple action button (`+ New Issue`, hotkey `C`).
  5. *Notification Bell*: Unread inbox indicator badge (`/inbox`).
  6. *Help & Shortcuts Button*: Triggers `ShortcutsHelpModal` (`?`).
  7. *User Profile Avatar*: Profile menu with links to `/settings/preferences`, workspace administration (`/settings/workspace` for Admins), and sign-out.

### Zone 2: Navigation Rail (Sidebar)
* **Modes**:
  - **Collapsed Rail (Default Desktop)**: 52px width. Displays high-contrast monochrome/accent icons with tooltip labels. Preserves maximum horizontal screen real estate for wide tables, DAG graph canvases, and board columns.
  - **Expanded Sidebar**: 220px width. Accessible via toggle icon or hotkey `[` / `]`.
* **Primary Navigation Structure**:
  ```text
  ├── [User] My Work              → /my-work (G then M)
  ├── [Inbox] Inbox               → /inbox (G then I)
  │
  ├── [Separator]
  ├── [Folder] Projects           → /projects (G then P)
  ├── [Users] Teams               → /teams (G then T)
  │
  ├── [Separator]
  ├── [Clock] Cycles              → /cycles (G then C)
  ├── [Target] Milestones         → /milestones (G then S)
  ├── [Calendar] Roadmap          → /roadmap (G then R)
  │
  ├── [Separator]
  ├── [GitFork] Dependencies      → /dependencies (G then D)
  ├── [BarChart] Insights         → /insights
  │
  └── [Bottom Pinned]
      └── [Settings] Settings     → /settings (resolves by role)
  ```

### Zone 3: Contextual Page Header
* **Height**: 48px.
* **Role**: Displays page-specific context, resource identity breadcrumbs, layout switchers (Table vs. Board), quick search filters, and page-level primary actions.
* **Sticky Positioning**: Remains anchored at the top of the main viewport while table rows or boards scroll underneath.

### Zone 4: Main Content Viewport
* **Layout**: `flex-1 min-w-0 overflow-y-auto`.
* **Density Rules**: Zero decorative padding bloat; data tables utilize single-line rows with explicit tabular alignment; board cards utilize single-elevation depth.

### Zone 5: Global Issue Drawer Layer
* **Width**: Fixed 440px desktop width.
* **Layering**: Slides over the main viewport from the right (`z-index: 30`).
* **Non-Modal Nature**: The main view remains visible, interactive, and scrollable behind the drawer.
* **Keyboard Focus Flow**: The drawer does *not* trap keyboard focus, allowing the user to press `J` or `K` to jump to adjacent rows while the drawer updates in real time.
* **Header Controls**:
  - Issue Key (`ENG-101`) with copy action.
  - State pill dropdown.
  - Open in Full-Page Page icon (`/issues/:issueKey`).
  - Close button (`Esc`).
* **Closing Semantics**: Closing removes drawer query parameters while strictly preserving the base page route, active filters, search, and scroll context.

---

## 3. Global Overlays & Modals Hierarchy

Unblok uses a disciplined z-index stack to prevent modal collision or backdrop bleeding:

| Layer | Z-Index | Component | Description / Behavior |
| :--- | :--- | :--- | :--- |
| **Tooltips** | 60 | UI Tooltips | Instant keyboard/hover accelerator hints. |
| **Command Palette** | 50 | `CommandPalette` | Centered floating modal triggered by `Cmd+K`. Overlays everything. |
| **Critical Modals** | 45 | `CompletionGuardDialog`, `CycleErrorDialog` | Hard blocking system modals preventing invalid DAG states. |
| **Standard Modals** | 40 | `CreateIssueModal`, `ShortcutsHelpModal` | Full creation and configuration flows. |
| **Dropdown Popovers** | 35 | `Popover`, StatePicker, PriorityPicker | Contextual popovers triggered by inline clicks or hotkeys. |
| **Global Issue Drawer** | 30 | `IssueDrawer` | 440px slide-over panel. |
| **Sticky Page Header** | 20 | Header Bar & Filter Toolbar | Pinned top navigation. |
| **Base Content** | 10 | Tables, Boards, Canvas | Main data views. |

---

## 4. Responsive Shell Transformations

| Viewport | Screen Width | Shell Transformation |
| :--- | :--- | :--- |
| **Desktop** | $\ge 1280\text{px}$ | Multi-pane desktop mode. 52px navigation rail, full table columns, persistent 440px slide-over drawer alongside main content. |
| **Tablet** | $768\text{px} - 1279\text{px}$ | Navigation rail collapses to bottom bar or hamburger menu. Issue drawer occupies 50% screen width or overlays with backdrop. |
| **Mobile** | $< 768\text{px}$ | Bottom navigation bar (`My Work`, `Projects`, `Inbox`, `More`). Issue drawer transforms into a full-screen sheet with top drag handle. Table columns condense to card rows. |
