# UX-11A: Unblok Route Architecture & Boundary Specification

**Platform**: Unblok — High-Density Engineering Execution & Dependency Intelligence  
**Document**: Route Architecture, Layout Ownership, Route Guards & Navigation Flow  
**Phase**: UX-11A (Public Experience & Routing Architecture)  
**Status**: FROZEN ARCHITECTURAL SPECIFICATION  

---

## 1. Architectural Boundaries: Four Route Families

Unblok strictly defines and decouples four distinct route families. These are not merely naming conventions or folder groupings—they represent isolated architectural boundaries with distinct layout trees, session requirements, auth states, telemetry models, and cache/crawler behaviors.

```text
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       UNBLOK ROUTE SPACE                                    │
├──────────────────────┬──────────────────────┬───────────────────────┬───────────────────────┤
│        PUBLIC        │         AUTH         │      ONBOARDING       │        PRIVATE        │
├──────────────────────┼──────────────────────┼───────────────────────┼───────────────────────┤
│ • Anonymous access   │ • Anonymous/Guest    │ • Authenticated user  │ • Authenticated user  │
│ • Fixed visual theme │ • Dedicated Auth     │ • Incomplete tenant   │ • Active workspace    │
│ • No session check   │   layout             │ • Multi-step wizard   │ • Full AppShell       │
│ • SEO indexable      │ • No marketing fluff │ • Dedicated           │ • Theme engine active │
│ • Marketing/legal    │ • Strict returnTo    │   Onboarding layout   │ • Deep execution UI   │
│ • Static + hydrated  │ • CSRF / auth state  │ • Isolation from App  │ • Real-time syncing   │
└──────────────────────┴──────────────────────┴───────────────────────┴───────────────────────┘
```

### Route Family 1: PUBLIC
* **Purpose**: Customer-facing marketing, product storytelling, solution positioning, pricing tier overviews, security documentation, and legal disclosures.
* **Authentication Rule**: Requires **no authenticated session**. Accessible by anonymous visitors, search engine indexers, and authenticated users alike.
* **Theme Contract**: Fixed single Unblok Public Theme (neutral light canvas, deep charcoal typography, controlled purple accent). No theme switcher exposed.
* **Layout**: Wrapped in `PublicLayout` (standalone header, minimal navigation, full-width fluid editorial container, standard public footer).

### Route Family 2: AUTH
* **Purpose**: Identity management and authentication ceremonies (login, signup, password recovery, magic link redemption, invitation acceptance).
* **Authentication Rule**: Guest/unauthenticated access by default. If accessed by an already authenticated user with an active workspace, redirects to `/my-work` (or the safe `returnTo` target). Exception: `/invite/:token`, which accepts both authenticated and unauthenticated sessions to bind user identity to an invitation.
* **Theme Contract**: Fixed, focused visual treatment aligned with the core Unblok brand. Clean, compact, minimal distractions.
* **Layout**: Wrapped in `AuthLayout` (centered card canvas, brand watermark, no application rail, no marketing feature cards).

### Route Family 3: ONBOARDING
* **Purpose**: Guiding newly authenticated users (or invited users) through workspace creation, team setup, initial project seeding, and invitation flows before dropping them into execution.
* **Authentication Rule**: Requires an **authenticated session**, but represents an account that does **not yet possess an active, resolved workspace**.
* **Namespace Contract**: Strictly encapsulated under `/onboarding/*`.
* **Layout**: Wrapped in `OnboardingLayout` (step indicator, focused card/wizard canvas, zero sidebar rail, zero execution shortcuts, persistent step recovery).

### Route Family 4: PRIVATE
* **Purpose**: Daily high-density engineering execution, issue triage, dependency management, cycle planning, and workspace administration.
* **Authentication Rule**: Requires **both** an authenticated session **and** an authorized, active workspace context.
* **Theme Contract**: Dynamic theme engine active (Light, Dark, System preferences supported via `SettingsContext`).
* **Layout**: Wrapped in `AppShellLayout` (Workspace Topbar, Navigation Rail, Contextual Page Header, Main Content Region, Global Slide-Over `IssueDrawer`).
* **Routes Preserved**: All canonical routes established across UX-00 through UX-10 (`/my-work`, `/inbox`, `/projects/*`, `/issues/:issueKey`, `/teams/*`, `/cycles/*`, `/milestones/*`, `/roadmap`, `/dependencies`, `/insights`, `/settings/*`).

---

## 2. Layout Architecture & Hierarchy

To prevent monolithic shell bloat and brittle conditional branches inside layout components, the routing hierarchy uses separate, decoupled layout components:

```text
RootRouter (BrowserRouter)
├── PublicLayout
│   ├── / (Home)
│   ├── /product
│   ├── /features
│   ├── /solutions
│   ├── /pricing
│   ├── /security
│   ├── /contact
│   ├── /privacy
│   └── /terms
│
├── AuthLayout
│   ├── /login
│   ├── /signup
│   ├── /forgot-password
│   ├── /reset-password
│   └── /invite/:token
│
├── OnboardingLayout
│   ├── /onboarding
│   ├── /onboarding/workspace
│   ├── /onboarding/team
│   ├── /onboarding/project
│   ├── /onboarding/invite
│   └── /onboarding/complete
│
└── AppShellLayout (Authenticated + Workspace Context)
    ├── /my-work
    ├── /inbox
    ├── /projects ...
    ├── /issues/:issueKey
    ├── /teams ...
    ├── /cycles ...
    ├── /milestones ...
    ├── /roadmap
    ├── /dependencies
    ├── /insights
    └── /settings ...
```

### Layout Responsibilities

| Layout Component | Header / Topbar | Sidebar Rail | Footer | Drawer Layer | Theme Context |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`PublicLayout`** | Public Nav (Brand, Links, CTAs) | None | Public Multi-Column Footer | None | Fixed Public Theme |
| **`AuthLayout`** | Minimal Centered Brand Logo | None | Minimal Legal Links (Terms/Privacy) | None | Fixed Auth Canvas |
| **`OnboardingLayout`** | Step Progress Header + Exit/Help | None | Minimal Step Navigation Controls | None | Fixed Onboarding Canvas |
| **`AppShellLayout`** | Workspace Header (44px) + Search + Avatar | 52px / 220px Nav Rail | None | Slide-Over `IssueDrawer` (440px) | User Theme (Light/Dark/System) |

---

## 3. Route Guard Specifications

Guard wrappers enforce boundary conditions cleanly without mixing authorization rules with presentation logic.

```text
Incoming Request
       │
       ├─► [PublicRoute] ──────────────────────────────────────────► Render Public Page
       │
       ├─► [GuestRoute] ───── Has Active Auth? ─── YES ────────────► Redirect /my-work (or returnTo)
       │                              │
       │                              NO ──────────────────────────► Render Auth Form
       │
       ├─► [AuthenticatedRoute] ── Has Active Auth? ─── NO ────────► Redirect /login?returnTo=...
       │                                     │
       │                                    YES
       │                                     │
       ├─► [OnboardingRoute] ───── Has Workspace? ─── YES ────────► Redirect /my-work
       │                                     │
       │                                     NO ───────────────────► Render Onboarding Step
       │
       └─► [WorkspaceRoute] ────── Has Workspace? ─── NO ─────────► Redirect /onboarding
                                             │
                                            YES
                                             │
                                  [PermissionBoundary] ── Allowed? ─► Render Private Page
                                             │
                                             NO ───────────────────► Render 403 Forbidden State
```

### Guard Specifications

1. **`PublicRoute`**:
   - Permits all traffic unconditionally.
   - Does not inspect auth tokens or perform redirection.
2. **`GuestRoute`** (Auth Guard):
   - Protects `/login`, `/signup`, `/forgot-password`, `/reset-password`.
   - If anonymous: renders requested auth page.
   - If authenticated with active workspace: redirects immediately to `returnTo` (if valid internal target) or `/my-work`.
   - If authenticated without active workspace: redirects to `/onboarding`.
3. **`AuthenticatedRoute`**:
   - Verifies the user has a valid authenticated session identity.
   - If unauthenticated: captures current full path and query string (`location.pathname + location.search`), sanitizes it, and redirects to `/login?returnTo=${encodedPath}`.
4. **`OnboardingRoute`**:
   - Ensures user is authenticated.
   - If user already belongs to an active workspace: redirects to `/my-work` (prevents re-entering onboarding by mistake).
   - If user has multiple memberships but no active workspace selected: redirects to workspace selection resolution.
   - If user has zero memberships: renders onboarding step.
5. **`WorkspaceRoute`**:
   - Ensures user is authenticated **and** has a resolved, active workspace.
   - If no workspace exists: redirects to `/onboarding`.
   - If workspace exists: resolves tenant state and renders `AppShellLayout`.
6. **`PermissionBoundary`**:
   - Evaluates RBAC privileges for the requested route (e.g. `ADMIN` requirement for `/settings/workspace`, `/settings/members`, `/settings/teams`, `/settings/integrations`).
   - If user lacks required role (e.g., `OBSERVER` or `MEMBER` attempting admin route): renders in-shell **403 Forbidden** error state.

---

## 4. Root Route (`/`) Resolution Matrix

The root route `/` acts as the intelligent traffic director. The resolution rules are deterministic and strictly prevent circular redirection loops:

```text
                                       User Navigates to /
                                                │
                                       Is User Authenticated?
                                                │
                        ┌───────────────────────┴────────────────────────┐
                        ▼                                                ▼
                       NO                                               YES
                        │                                                │
                 Render Home (/)                                 Workspace Memberships?
                                                                         │
                                                ┌────────────────────────┼────────────────────────┐
                                                ▼                        ▼                        ▼
                                              Zero                      One                     Many
                                                │                        │                        │
                                       Redirect /onboarding      Active Workspace?       Active Workspace?
                                                                         │                        │
                                                               ┌─────────┴─────────┐    ┌─────────┴─────────┐
                                                               ▼                   ▼    ▼                   ▼
                                                              YES                  NO  YES                  NO
                                                               │                   │    │                   │
                                                       Redirect /my-work    Set & Go  Redirect /my-work   Prompt
                                                                            /my-work                     Workspace
                                                                                                         Selection
```

### Resolution Truth Table

| Auth State | Workspace Status | Resolved Destination | Action / Mechanism |
| :--- | :--- | :--- | :--- |
| **Anonymous** | None | `/` (Public Home) | Render Home page in `PublicLayout`. |
| **Authenticated** | Active workspace selected | `/my-work` | Clean client redirect (`replace: true`). |
| **Authenticated** | Single workspace, not yet loaded in session | `/my-work` | Automatically select single workspace context, navigate to `/my-work`. |
| **Authenticated** | Multiple workspace memberships, none active | Workspace Resolution | Modal or selection route to choose target workspace. |
| **Authenticated** | Zero workspace memberships | `/onboarding` | Direct user to create their first workspace. |
| **Authenticated (via Invite)** | Pending invite token active | `/invite/:token` | Invitation verification takes precedence over generic onboarding. |

### Redirect Loop Prevention Guarantees
* Redirection from `/` to `/my-work` or `/onboarding` must use replace-state (`history.replaceState` / `Navigate replace`).
* Neither `/my-work` nor `/onboarding` may ever redirect back to `/` under normal execution.
* If a session or membership check fails, the fallback is a terminal error or login prompt with an explicit query state (`?reason=expired`), never an unhandled redirect to `/`.

---

## 5. Return Destination (`returnTo`) & Safe Redirect Contract

When an unauthenticated user attempts to access a protected deep link (e.g., received via Slack, GitHub PR, or email notification), their intended destination must be preserved and honored upon successful authentication.

### Workflow Example
1. Anonymous visitor clicks link to private issue:  
   `/projects/ENG/issues?drawer=ENG-142`
2. `AuthenticatedRoute` intercepts request:
   - Evaluates target: `/projects/ENG/issues?drawer=ENG-142`.
   - Encodes path: `encodeURIComponent('/projects/ENG/issues?drawer=ENG-142')`.
   - Redirects: `/login?returnTo=%2Fprojects%2FENG%2Fissues%3Fdrawer%3DENG-142`.
3. User completes login or signup.
4. Client router parses `returnTo`, validates safety, and navigates directly to `/projects/ENG/issues?drawer=ENG-142`.

### Safe Redirect Contract & Injection Prevention
To prevent **Open Redirect Vulnerabilities** (where an attacker crafts a malicious link like `/login?returnTo=https://evil-phishing.com/steal-creds`), the redirect processor must enforce strict validation rules:

```typescript
/**
 * Resolves a safe internal redirect target.
 * Rejects absolute URLs, protocol-relative URLs, and non-whitelisted paths.
 */
export function getSafeReturnTo(rawReturnTo: string | null, fallback = '/my-work'): string {
  if (!rawReturnTo) return fallback;
  
  // 1. Must start with a single slash '/' and NOT '//' (protocol-relative)
  if (!rawReturnTo.startsWith('/') || rawReturnTo.startsWith('//')) {
    return fallback;
  }
  
  // 2. Reject URI scheme indicators (e.g. 'javascript:', 'https:', 'data:')
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(rawReturnTo)) {
    return fallback;
  }

  // 3. Reject forbidden auth/internal loop paths
  const cleanPath = rawReturnTo.split('?')[0].split('#')[0];
  const forbiddenLoopPaths = ['/login', '/signup', '/forgot-password', '/reset-password'];
  if (forbiddenLoopPaths.includes(cleanPath)) {
    return fallback;
  }

  return rawReturnTo;
}
```

---

## 6. Error Routing: 404 (Not Found) & 403 (Forbidden)

Unblok prohibits silent redirects on missing pages. Silent redirection to `/my-work` causes confusion, masks broken hyperlinks, and damages debuggability.

### 404 Experience (Not Found)
Unblok specifies two distinct 404 presentations based on the user's execution context:

#### A. Public 404 (Anonymous or Public Context)
* **Layout**: Rendered within `PublicLayout`.
* **Visual Presentation**: Clean editorial layout consistent with the public visual system.
* **Heading**: `404 — Page Not Found`
* **Message**: *"The page you are looking for does not exist, has been moved, or the URL is incorrect."*
* **Primary Action**: `Return to Homepage` (`/`)
* **Secondary Action**: `Explore Product` (`/product`)

#### B. Authenticated 404 (Private Product Context)
* **Layout**: Rendered inside `AppShellLayout` (preserving sidebar rail, workspace context, and search palette).
* **Visual Presentation**: High-density in-shell alert state with keyboard shortcut hints.
* **Heading**: `Resource Not Found`
* **Message**: *"This route, project, issue, or view does not exist within active workspace [Workspace Name]."*
* **Primary Action**: `Go to My Work` (`/my-work`, hotkey `G then M`)
* **Secondary Action**: `Open Search (⌘K)`

### 403 Experience (Forbidden / Permission Denied)
A dedicated, reusable product-quality permission barrier component (`ForbiddenState`) handles access restrictions cleanly:
* **Layout**: In-shell under `AppShellLayout` (or `SettingsLayout` when inside workspace settings).
* **Triggers**:
  - `OBSERVER` attempting to access admin settings (`/settings/workspace`, `/settings/members`).
  - Member attempting to view a restricted project or private channel.
  - User without workspace write privileges attempting restricted administration actions.
* **Visual Elements**:
  - Minimal lock/shield glyph (`#dc2626` / `#f87171`).
  - Clear title: `Access Restricted`
  - Explanatory copy: *"You do not have the required permissions (Admin role required) to view or manage this section."*
  - Contextual details: Shows current user role (e.g., `Current role: Observer`) and workspace name.
  - Primary Action: Contextual fallback (e.g. `Return to Preferences` or `Back to My Work`).
  - Secondary Action: `Request Access from Workspace Admin`.

---

## 7. Session Expiration UX Contract

In modern high-density engineering workflows, session expiration must never cause catastrophic loss of in-progress edits, form data, or graph filters.

### Session Expiration Protocol
1. **Detection**: The API client or authentication listener intercepts a `401 Unauthorized` response with an `expired_session` code.
2. **Non-Destructive Notification**:
   - The user is **not** immediately kicked out of their screen or blasted with a hard page reload.
   - A non-blocking top banner or modal dialog appears:  
     `"Your session has expired. Please re-authenticate to save your changes and continue."`
3. **In-Flight Draft Preservation**:
   - Issue descriptions, comments, or modal form inputs remain preserved in local React/localStorage state.
4. **Re-Authentication Flow**:
   - User clicks `Re-authenticate`.
   - An inline auth dialog or popup sheet opens without navigating away from the current route.
   - Upon successful credential verification, the session token refreshes in-place, and pending mutations retry automatically.
5. **Hard Fallback**:
   - If user dismisses the prompt or full re-authentication is required, router navigates to `/login?returnTo=${currentSafePath}`.
   - Any unsaved draft is stored in transient local storage keyed by entity key (`draft:issue:ENG-142`).

---

## 8. Validation Against Core User Journeys

The routing architecture is verified against all core user journeys:

| # | User Journey | Starting State | Path | Termination / Expected State |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Anonymous visitor discovers Unblok | Anonymous | `/` | Lands on Home page in `PublicLayout`. |
| **2** | Anonymous visitor evaluates capabilities | Anonymous | `/product` | Lands on Product page in `PublicLayout`. |
| **3** | Anonymous visitor opens Slack link to issue | Anonymous | `/projects/ENG/issues?drawer=ENG-142` | Intercepted by `AuthenticatedRoute` → Redirected to `/login?returnTo=%2Fprojects%2FENG%2Fissues%3Fdrawer%3DENG-142`. Post-login returns directly to issue drawer. |
| **4** | Authenticated engineer opens root URL | Authenticated + Active Workspace | `/` | Deterministically routed to `/my-work` via replace state. |
| **5** | Authenticated engineer clicks deep link | Authenticated + Active Workspace | `/dependencies?filter=critical-path` | Loads directly into `AppShellLayout` with active graph filter intact. |
| **6** | New user signs up without workspace | Authenticated + Zero Workspaces | `/` or `/my-work` | Guard redirects to `/onboarding/workspace`. |
| **7** | Invited user accepts invitation | Anonymous or Authenticated | `/invite/inv_tok_991` | Renders invitation acceptance view. Binds member to invited workspace; bypasses generic onboarding. |
| **8** | Visitor enters invalid marketing URL | Anonymous | `/pricing-plans` | Renders Public 404 in `PublicLayout` with "Return to Homepage" action. |
| **9** | Engineer enters invalid issue link | Authenticated + Active Workspace | `/issues/INVALID-999` | Renders in-shell Authenticated 404 within `AppShellLayout` with "Go to My Work" and Search shortcuts. |
| **10** | Observer attempts admin settings URL | Authenticated as Observer | `/settings/members` | `AdminRoute` / `PermissionBoundary` displays in-shell 403 Forbidden state with fallback to `/settings/preferences`. |
