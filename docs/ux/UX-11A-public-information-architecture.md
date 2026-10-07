# UX-11A: Unblok Public Information Architecture & Page Registry

**Platform**: Unblok — High-Density Engineering Execution & Dependency Intelligence  
**Document**: Public, Auth & Onboarding Information Architecture, Page Responsibilities & SEO Contract  
**Phase**: UX-11A (Public Experience & Routing Architecture)  
**Status**: FROZEN ARCHITECTURAL SPECIFICATION  

---

## 1. Information Architecture Overview

The Unblok public experience is engineered around one core mission: **explain the high-density execution and dependency intelligence engine clearly, honestly, and without SaaS marketing cliches**.

```text
                                           PUBLIC ROUTE TREE
                                                   │
     ┌─────────────┬─────────────┬─────────────────┼────────────────┬──────────────┬──────────────┐
     │             │             │                 │                │              │              │
     ▼             ▼             ▼                 ▼                ▼              ▼              ▼
   Home         Product       Features         Solutions         Pricing        Security       Contact
    (/)       (/product)    (/features)      (/solutions)       (/pricing)    (/security)    (/contact)
                                                   │                                          │
                                       ┌───────────┼───────────┐                         Legal
                                       ▼           ▼           ▼                           │
                                  Engineering Engineering Engineering               ┌──────┴──────┐
                                     Teams     Leaders   Consultancies              ▼             ▼
                                                                                 Privacy        Terms
                                                                                (/privacy)    (/terms)
```

---

## 2. Public Page Registry & Responsibilities

Every public page has a single, unambiguous Job To Be Done (JTBD). Pages must not overlap or repeat identical content blocks.

### 1. Home (`/`)
* **Job To Be Done**: Deliver the complete Unblok value proposition in under 60 seconds using real product UI as indisputable proof.
* **Core Narrative**: "Know what's moving, what's stuck, and why."
* **Primary Audiences**: Tech leads, staff engineers, engineering directors evaluating modern alternatives to Jira/Linear.
* **Key Sections**:
  1. *Public Navigation*: Brand mark, nav links, Sign in / Get started CTAs.
  2. *Hero Section*: High-impact headline, single supporting sentence, dual CTAs (`Get started`, `Explore Unblok`), oversized real UI capture of My Work cockpit.
  3. *Execution Section*: My Work personal blocker triage ("Clear what's blocking you, unblock others").
  4. *Dependencies Section*: Directed Acyclic Graph (DAG) canvas and critical path engine ("See the chain").
  5. *Issue Context Section*: Deep technical context with 440px slide-over `IssueDrawer` and canonical detail page.
  6. *Planning Section*: Cycles, Milestones, and unified Roadmap ("Commitment with causal awareness").
  7. *Insights Section*: Real-time blocker analytics, cycle velocity, and execution health metrics.
  8. *Final CTA*: Direct conversion to onboarding/signup.
  9. *Public Footer*: System status, links, copyright, compliance disclosures.

### 2. Product (`/product`)
* **Job To Be Done**: Walk an engineering evaluator through the complete execution system lifecycle end-to-end.
* **Narrative Flow**:
  - Ingestion & Assignment: Issues, priorities, estimates.
  - Dependency Wiring: Declaring blockers (`A BLOCKS B`) and upstream constraints.
  - Cycle Scheduling: Scoping cycles with automated blocker awareness.
  - Operational Triage: My Work cockpit and personal inbox alerts.
  - Delivery Intelligence: Graph-driven delivery health and risk detection.
* **Proof Asset**: Interactive or multi-layered walkthrough using genuine product captures.

### 3. Features (`/features`)
* **Job To Be Done**: Serve as the comprehensive capability directory for technical due diligence.
* **Architecture Note**: May also be navigated contextually via dropdown or sub-navigation under Product.
* **Directory Structure**:
  - *Dependency Intelligence*: Directed graphs, circular blocker prevention, critical path calculation, completion guards.
  - *Personal Execution*: My Work cockpit, personal blocker summaries, fast keyboard triage (`J`/`K`/`X`).
  - *Planning Systems*: Cycles (sprints), strategic milestones, multi-team roadmap views.
  - *Issue Experience*: Slide-over drawer, markdown rich authoring, sub-issues, audit activity stream.
  - *Insights & Analytics*: Bottleneck identification, blocker aging, velocity, team health metrics.
  - *Settings & Security*: Role-based access control (Admin, Member, Observer), webhook automations.

### 4. Solutions (`/solutions`)
* **Job To Be Done**: Map Unblok's architectural strengths to specific organizational profiles.
* **Strict Anti-Invention Rule**: We do **not** invent generic marketing verticals (e.g. "Unblok for HR", "Unblok for Marketing"). Unblok is purpose-built for engineering organizations.
* **Approved Solution Profiles**:
  1. **Engineering Teams (Pods & Squads)**:
     - *Pain*: Lost context, endless status syncs, invisible cross-team blockers.
     - *Solution*: Automated blocker alerts, fast personal triage in My Work, dual drawer/page speed.
  2. **Engineering Leaders (Directors, VPs, CTOs)**:
     - *Pain*: Surprises at sprint end, delayed roadmap commitments, lack of visibility into blocker bottlenecks.
     - *Solution*: Real-time dependency graph, critical path visualization, delivery risk metrics in Insights.
  3. **Engineering Consultancies & Multi-Client Firms**:
     - *Pain*: Managing complex client dependencies, strict contractual milestones, delivery accountability.
     - *Solution*: Transparent DAG tracking, observer role permissions for client stakeholders, milestone invariants.

### 5. Pricing (`/pricing`)
* **Job To Be Done**: Transparently communicate plan tiers, capabilities, and seat models without artificial friction.
* **Architecture Note**: Pure commercial presentation; **no billing or Stripe integration** in UX-11A/B.
* **Tiers Specification**:
  - *Developer / Community*: Free for individual developers and small open-source pods (up to 5 seats, full dependency engine, core planning).
  - *Team*: Per-seat pricing for growing engineering squads (unlimited issues, cycles, webhooks, 90-day insight retention).
  - *Enterprise / Scale*: Advanced RBAC, custom SSO/SAML, dedicated audit trails, priority SLAs, custom contract billing.
* **Non-Locking Clause**: Avoid permanently freezing pricing numbers until corporate business decisions are final. Document tiers structurally.

### 6. Security (`/security`)
* **Job To Be Done**: Present genuine security architecture, data handling, and privacy posture truthfully.
* **Strict Honesty Rule**: Zero fake compliance badges, zero unsubstantiated SOC-2 or ISO claims before audits are complete.
* **Disclosed Architectural Pillars**:
  - Strict tenant isolation (active workspace boundary, cross-workspace dependency prohibition).
  - Granular RBAC (`ADMIN`, `MEMBER`, `OBSERVER`).
  - Data encryption in transit (TLS 1.3) and at rest (AES-256).
  - Audit logging for administrative changes, role escalations, and webhook integrations.
  - Exportability: Full JSON workspace exports for complete customer data sovereignty.

### 7. Contact (`/contact`)
* **Job To Be Done**: Provide direct access for enterprise inquiries, volume licensing, and technical architecture questions.
* **UX Scope**: Simple, elegant form (Name, Work Email, Company Size, Message). Mocked submission state in early phases. Direct links to community/support channels.

### 8. Legal: Privacy (`/privacy`) & Terms (`/terms`)
* **Job To Be Done**: Clean, readable, credible legal disclosure pages.
* **Tone**: Straightforward, standard legal formatting with clear section anchors. Explicit disclaimer that formal terms remain subject to final counsel review.

---

## 3. Auth Routes & Visual Relationship

Auth routes represent **task surfaces**, not marketing collateral. Placing oversized marketing banners, customer testimonials, or distracting illustrations next to a login form harms login completion rates and insults professional engineers.

```text
/login              → User authentication (Email/Password, Magic Link, SSO)
/signup             → New account registration
/forgot-password    → Password recovery initiation
/reset-password     → Token-verified password reset form
/invite/:token      → Invitation verification & tenant onboarding bridge
```

### Visual Architecture of Auth Pages
* **Layout**: `AuthLayout` (centered, focused container, max-width 400px).
* **Canvas**: Clean, neutral, high-legibility background.
* **Elements**:
  - Minimal Unblok wordmark / logo at the top.
  - Single strong headline (e.g. `Sign in to Unblok`, `Create your Unblok account`).
  - Clean input fields with precise focus rings and keyboard tab indexing.
  - Prominent primary submit button.
  - Safe redirect link handler (`returnTo`).
  - Subdued secondary links (e.g., `Forgot password?`, `Don't have an account? Sign up`).
  - Footer with concise terms & privacy links.
* **Prohibitions**:
  - NO marketing carousels.
  - NO rotating customer quotes.
  - NO cluttered feature bullet points.

---

## 4. Onboarding Route Contract (`/onboarding/*`)

The onboarding route namespace handles the transitional journey between user identity creation and day-to-day execution inside `AppShellLayout`.

### Smallest Clean Route Contract

```text
/onboarding                     → Routing entrypoint & state resolver
/onboarding/workspace           → Step 1: Workspace creation (Name, URL slug)
/onboarding/team                → Step 2: Primary team squad configuration (Name, Key)
/onboarding/project             → Step 3: Initial project seeding (Optional starter data)
/onboarding/invite              → Step 4: Teammate invites (Email list with roles)
/onboarding/complete            → Step 5: Provisioning transition & redirect to /my-work
```

### State Matrix & Transition Rules

| User State | Entry Route | Resolution Logic |
| :--- | :--- | :--- |
| **New User (Creator)** | `/onboarding` | Checks tenant state → Redirects to `/onboarding/workspace`. |
| **Invited User** | `/invite/:token` | Verifies token → Accepts invite → Associates user with existing workspace → Redirects directly to `/my-work` (bypasses creation wizard). |
| **Interrupted / Returning** | `/onboarding` | Inspects stored onboarding draft state → Resumes at earliest uncompleted step (`workspace` → `team` → `project`). |
| **User with Existing Active Workspace** | `/onboarding/*` | Guard detects valid active membership → Immediately redirects to `/my-work` to prevent duplicate setup. |
| **User with Zero Memberships** | `/my-work` | Guard detects lack of workspace context → Redirects to `/onboarding/workspace`. |

---

## 5. Public Navigation Contract

### Desktop Navigation (Viewport >= 1024px)
* **Height**: 60px sticky top bar (`background: rgba(255, 255, 255, 0.85)`, `backdrop-filter: blur(12px)`, hairline bottom border).
* **Left**: Unblok Brand Mark + Wordmark (`font-weight: 700`, letter-spacing `-0.02em`).
* **Center**: Primary navigation links:
  - `Product` (`/product`)
  - `Features` (`/features`)
  - `Solutions` (`/solutions`)
  - `Pricing` (`/pricing`)
  - `Security` (`/security`)
* **Right**: Utility & Action links:
  - `Sign in` (Ghost button linking to `/login`)
  - `Get started` (Primary solid purple button linking to `/signup` or `/onboarding`)

### Mobile Navigation (Viewport < 1024px)
* **Header Height**: 56px with brand mark on left, mobile menu hamburger toggle on right.
* **Drawer / Overlay**: Full-screen slide-down or overlay menu with smooth spring transition.
* **Content**:
  - Vertical stack of primary navigation links with generous touch targets (min 48px height).
  - Explicit separator line.
  - Full-width `Sign in` ghost button.
  - Full-width `Get started` primary button.
* **Keyboard & ARIA**:
  - Accessible button with `aria-expanded` and `aria-controls`.
  - Focus trapped within open drawer.
  - `Escape` key closes overlay immediately.

---

## 6. SEO & Indexing Foundation

To ensure proper search discovery for marketing surfaces while preventing indexing leaks on private and administrative pages, the routing architecture enforces strict metadata and robots rules.

### Metadata Rules by Route Family

| Route Family | Robots Meta Tag | Sitemap Inclusion | Title Format | Open Graph Image |
| :--- | :--- | :--- | :--- | :--- |
| **PUBLIC** | `index, follow` | Included in `sitemap.xml` | `[Page Title] | Unblok` | Brand social card with real UI snippet |
| **AUTH** | `noindex, nofollow` | Excluded | `[Action] | Unblok` | None (generic fallback) |
| **ONBOARDING** | `noindex, nofollow` | Excluded | `Setup | Unblok` | None |
| **PRIVATE** | `noindex, nofollow` | Excluded | `[Resource Key] · [Title] | Unblok` | None |

### Canonical URL Strategy
* Every public page serves a canonical link tag matching its normalized path (e.g. `<link rel="canonical" href="https://unblok.io/pricing" />`).
* Trailing slashes are normalized to non-trailing paths to prevent duplicate content penalties.
* Dynamic Open Graph tags provide accurate social previews across Slack, Twitter/X, and LinkedIn.
