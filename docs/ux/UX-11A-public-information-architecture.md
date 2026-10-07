# UX-11A: Unblok Public Information Architecture & Page Registry

**Platform**: Unblok — High-Density Engineering Execution & Dependency Intelligence  
**Document**: Public, Auth & Onboarding Information Architecture, Page Responsibilities & SEO Contract  
**Phase**: UX-11A (Public Experience & Routing Architecture)  
**Status**: PROPOSED — HUMAN REVIEW  

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
  4. *Dependencies Section*: Directed Acyclic Graph (DAG) canvas and blocker relationship inspection ("See the chain").
  5. *Issue Context Section*: Deep technical context with 440px slide-over `IssueDrawer` and canonical detail page.
  6. *Planning Section*: Cycles, Milestones, and unified Roadmap ("Commitment with causal awareness").
  7. *Insights Section*: Blocker summary, delivery health indicators, and bottleneck metrics.
  8. *Final CTA*: Direct navigation to get started or contact architecture team.
  9. *Public Footer*: System status, links, copyright, compliance disclosures.

### 2. Product (`/product`)
* **Job To Be Done**: Walk an engineering evaluator through the complete execution system lifecycle end-to-end.
* **Conceptual Narrative (Grounding in Actual Product Model)**:
  `Execute → Unblock → Plan → Collaborate → Understand`
* **Narrative Flow**:
  - **Execute**: Personal daily triage in My Work; clear personal blockers and unblock teammates.
  - **Unblock**: Map explicit blocker relationships (`A BLOCKS B`); visualize dependency DAGs and prevent invalid completions.
  - **Plan**: Align issues into time-boxed Cycles and strategic Milestones with visible blocker status.
  - **Collaborate**: Rapid issue triage with 440px slide-over drawer and targeted team notifications in Inbox.
  - **Understand**: Evaluate team delivery health, active blocker counts, and bottleneck distribution in Insights.
* **Proof Asset**: Walkthrough using genuine product captures.

### 3. Features (`/features`)
* **Job To Be Done**: Serve as the comprehensive capability directory for technical due diligence.
* **Directory Structure (Mapped to Real Capabilities)**:
  - *Dependency Intelligence*: Directed graphs, circular blocker prevention invariants, completion guards.
  - *Personal Execution*: My Work cockpit, personal blocker summaries, keyboard navigation (`J`/`K`/`X`).
  - *Planning Systems*: Cycles, strategic milestones, multi-team roadmap views.
  - *Issue Experience*: Slide-over drawer, markdown authoring, sub-issues, activity audit trail.
  - *Insights & Analytics*: Bottleneck identification, active blocker tallies, delivery health scoring.
  - *Settings & Administration*: Role-based access control (Admin, Member, Observer), webhook configuration.

### 4. Solutions (`/solutions`)
* **Job To Be Done**: Map Unblok's architectural strengths to specific organizational profiles.
* **Strict Anti-Invention Rule**: We do **not** invent generic marketing verticals (e.g. "Unblok for HR", "Unblok for Marketing"). Unblok is purpose-built for engineering organizations.
* **Target Solution Profiles**:
  1. **Engineering Teams (Pods & Squads)**:
     - *Pain*: Lost context, endless status syncs, invisible cross-team blockers.
     - *Solution*: Explicit blocker visibility, fast personal triage in My Work, dual drawer/page speed.
  2. **Engineering Leaders (Directors, VPs, CTOs)**:
     - *Pain*: Surprises at sprint end, delayed roadmap commitments, lack of visibility into bottlenecks.
     - *Solution*: Dependency graph visibility, delivery health scoring, blocker awareness across cycles.
  3. **Engineering Consultancies & Multi-Client Firms**:
     - *Pain*: Managing complex client dependencies, strict contractual milestones, delivery accountability.
     - *Solution*: Transparent dependency tracking, observer role permissions for client stakeholders, milestone progress tracking.

### 5. Pricing (`/pricing`)
* **Job To Be Done**: Serve as the dedicated commercial presentation surface.
* **Commercial Status**: **Pricing structure, tiers, limits, and prices remain commercially UNSETTLED and DEFERRED**.
* **Architecture Contract**:
  - The route `/pricing` is reserved and owned by `PublicLayout`.
  - UX-11A establishes only the page presence, layout ownership, and commercial job-to-be-done.
  - Specific plan models (e.g., seat tiers, usage quotas, price points) will be established during commercial packaging and may be presented provisionally in future prototypes only after a formal business decision.
  - Zero billing or payment gateway implementation in this phase.

### 6. Security (`/security`)
* **Job To Be Done**: Present genuine security architecture, permission models, and privacy posture truthfully.
* **Strict Honesty Rule**: Zero fake compliance badges, zero unsubstantiated SOC-2 or ISO claims.
* **Content Structure**:
  #### Current Product Model
  - **Workspace-Scoped Product Architecture**: Strict logical separation where projects, issues, and cycles resolve inside the active workspace boundary.
  - **Role-Based Permission Model**: Explicit privileges enforced across `ADMIN`, `MEMBER`, and `OBSERVER` roles (e.g. admin-only settings, observer write restrictions).
  - **Activity & Audit-Oriented Event Model**: Comprehensive event trail tracking issue updates, role changes, and dependency linkages.
  - **Dependency Invariants**: Client-side DAG invariants preventing circular blocker deadlocks and guarding premature completion.
  #### Future Production Direction (Architecture Requirements)
  - **Secure Session Architecture**: Robust session management and credential protection.
  - **Authorization Enforcement**: Authoritative server-side policy enforcement for every mutation.
  - **Encryption**: Modern encryption standards for data in transit and at rest.
  - **Tenant Isolation**: Infrastructure-level multi-tenant separation.
  - **Operational Security**: Centralized audit logging, secret management, and incident response procedures.

### 7. Contact (`/contact`)
* **Job To Be Done**: Provide direct access for team inquiries, deployment discussions, and technical architecture questions.
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
* **Drawer / Overlay**: Full-screen slide-down or overlay menu with smooth transition.
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
* Open Graph tags provide accurate social previews across communications platforms.
