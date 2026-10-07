# UX-11A: Unblok Decision Register

**Platform**: Unblok — High-Density Engineering Execution & Dependency Intelligence  
**Document**: Architectural Decision Register (ADR) — UX-11A  
**Phase**: UX-11A (Public Experience & Routing Architecture)  
**Status**: PROPOSED — HUMAN REVIEW  

---

## Decision 11A-01: Four Architectural Route Families

* **Status**: PROPOSED — HUMAN REVIEW
* **Decision**: Unblok formally partitions its entire URL landscape into four strictly defined architectural route families: `PUBLIC`, `AUTH`, `ONBOARDING`, and `PRIVATE`.
* **Context**: Treating routes as a uniform flat structure creates leaky abstractions where marketing pages inherit app shell padding, auth screens pull in private sidebar state, and unauthenticated visitors trigger app shell state machine errors.
* **Alternatives Considered**:
  - *Unified Single-Layout Tree*: Manage boundaries via conditionals (`if (!isAuth) return <MarketingNav />`). Rejected: introduces tight coupling, hydration mismatches, and bundle size leakage.
  - *Two Families (Public vs Private)*: Lumping auth and onboarding together with marketing. Rejected: auth and onboarding have fundamentally distinct security models, form validation states, and layout requirements.
* **Consequences**:
  - Each route family binds to a dedicated layout component (`PublicLayout`, `AuthLayout`, `OnboardingLayout`, `AppShellLayout`).
  - Guards inspect route family boundaries prior to rendering children.

---

## Decision 11A-02: Deterministic Root (`/`) Resolution Matrix

* **Status**: PROPOSED — HUMAN REVIEW
* **Decision**: The root route `/` acts as an intelligent traffic router:
  1. Anonymous visitors always render the public Homepage (`/`).
  2. Authenticated users with an active workspace redirect deterministically to `/my-work` (using `replace: true`).
  3. Authenticated users with memberships but no active workspace resolve to workspace selection.
  4. Authenticated users with zero workspaces redirect to `/onboarding`.
* **Context**: Returning engineers require immediate access to their work (`/my-work`). Prospective customers and anonymous visitors require the marketing homepage.
* **Alternatives Considered**:
  - *Static Marketing Root for Everyone*: Forcing logged-in engineers to click "Go to App" on every visit. Rejected: causes daily friction for active developers.
  - *Subdomain Split (`app.unblok.io` vs `unblok.io`)*: Deferred to deployment architecture, but client-side root resolution handles both single-domain and multi-domain paradigms without code changes.
* **Consequences**:
  - Redirect loops are structurally prevented because `/my-work` and `/onboarding` never redirect back to `/`.

---

## Decision 11A-03: Decoupled Multi-Layout Hierarchy

* **Status**: PROPOSED — HUMAN REVIEW
* **Decision**: The root router branches into four top-level layouts: `PublicLayout`, `AuthLayout`, `OnboardingLayout`, and `AppShellLayout`. No layout contains ad-hoc conditionals for another layout's features.
* **Context**: `AppShellLayout` contains rich keyboard shortcuts (`Cmd+K`, `C`, `?`), a 440px slide-over drawer, and sidebar rail navigation that must never load or mount on marketing or auth pages.
* **Alternatives Considered**:
  - *Single AppShell with `hideSidebar` flags*: Fragile, bug-prone, and violates separation of concerns.
* **Consequences**:
  - Clean separation across public, auth, onboarding, and private subsystems.

---

## Decision 11A-04: Route Guard Boundaries & Responsibilities

* **Status**: PROPOSED — HUMAN REVIEW
* **Decision**: Guards are defined strictly by operational responsibility:
  - `PublicRoute`: Unconditional passthrough.
  - `GuestRoute`: Blocks authenticated users; redirects them to `returnTo` or `/my-work`.
  - `AuthenticatedRoute`: Intercepts unauthenticated requests and redirects to `/login` with sanitized `returnTo`.
  - `OnboardingRoute`: Enforces wizard progression for users without active workspaces.
  - `WorkspaceRoute`: Validates tenant resolution before mounting `AppShellLayout`.
  - `PermissionBoundary`: In-shell RBAC protection rendering 403 Forbidden states.
* **Context**: Avoids creating duplicate or redundant wrapper components while maintaining clear authorization boundaries.
* **Alternatives Considered**:
  - *Giant Universal Route Guard*: Embedding all checks in a single massive middleware function. Rejected: hard to test and reason about.
* **Consequences**:
  - Guards are composable and independently testable.

---

## Decision 11A-05: Strict Safe Return Destination (`returnTo`) Contract

* **Status**: PROPOSED — HUMAN REVIEW
* **Decision**: All unauthenticated deep-link attempts preserve their intended path in a sanitized `returnTo` query parameter. Only internal relative paths starting with a single `/` (and excluding protocol-relative `//` or external schemes) are accepted.
* **Context**: Engineers share deep links in pull requests and team channels. Unauthenticated visitors must land directly on the shared issue or view once logged in, without exposing Unblok to Open Redirect phishing attacks.
* **Alternatives Considered**:
  - *Session Storage for Redirects*: Fails if a user opens links in multiple browser tabs simultaneously.
  - *Permissive Redirects*: Dangerous security vulnerability.
* **Consequences**:
  - The `getSafeReturnTo` validator strictly filters all redirect attempts.

---

## Decision 11A-06: Distinct Public vs. Authenticated 404 Presentations

* **Status**: PROPOSED — HUMAN REVIEW
* **Decision**: Missing routes must **never** silently redirect to `/my-work`. Unblok provides two explicit 404 experiences:
  - *Public 404*: Rendered in `PublicLayout` with clear navigation back to the homepage and product pages.
  - *Authenticated 404*: Rendered in `AppShellLayout` preserving the sidebar and workspace context, offering a direct action to `/my-work` and `Cmd+K` search.
* **Context**: Silent redirects mask broken links, make debugging routing bugs impossible, and disorient users when an issue has been deleted or moved.
* **Alternatives Considered**:
  - *Global Catch-All to `/my-work`*: Previously in placeholder code; explicitly replaced by this specification.
* **Consequences**:
  - 404 states are transparent and context-aware.

---

## Decision 11A-07: Reusable 403 Forbidden State Component

* **Status**: PROPOSED — HUMAN REVIEW
* **Decision**: When an authenticated user attempts to access a resource or setting outside their RBAC privileges (e.g. `OBSERVER` accessing `/settings/members`), the system renders a standardized in-shell `ForbiddenState` component detailing the required role and offering clear fallback actions.
* **Context**: Avoids silent blank screens or unexpected redirects to `/my-work` when permissions fail.
* **Alternatives Considered**:
  - *Hiding Routes Entirely from Router*: Causes route-level 404s instead of 403s, which confuses users who know the page exists.
* **Consequences**:
  - Transparent error reporting for authorization boundaries.

---

## Decision 11A-08: Non-Destructive Session Expiration UX Contract

* **Status**: PROPOSED — HUMAN REVIEW
* **Decision**: Session expiration must not unnecessarily destroy user work. When an active session expires, the UI must alert the user informatively and preserve in-progress input (drafts, form fields, comments) rather than performing an immediate destructive hard reload.
* **Context**: Engineers authoring comprehensive issue descriptions or commenting on blockers must not lose unsaved input due to an idle session timeout.
* **Alternatives Considered**:
  - *Immediate Hard Redirect to `/login`*: Destroys unsaved form state; severely frustrates engineers.
* **Consequences**:
  - Detailed server-side session lifetimes, token issuance mechanics, mutation replay protocols, and persistence layers are **deferred** to future Auth, API, and System Design phases. The routing layer guarantees safe return-destination preservation (`returnTo`).

---

## Decision 11A-09: Single Fixed Public Visual Theme

* **Status**: PROPOSED — HUMAN REVIEW
* **Decision**: Public marketing and legal pages operate under **one single fixed visual theme** (warm alabaster canvas, deep slate typography, purple accent). No `Light / Dark / System` theme switcher is exposed on public pages.
* **Context**: Marketing storytelling and product screenshot presentation require deterministic contrast and calibrated visual hierarchy. Allowing arbitrary theme toggles on public pages dilutes brand presentation and complicates screenshot composition.
* **Alternatives Considered**:
  - *Enabling Dark Mode on Marketing Pages*: Doubled maintenance overhead for marketing assets; compromises crisp presentation of real product UI captures.
* **Consequences**:
  - Theme toggling is strictly isolated to the authenticated `AppShellLayout` via `SettingsContext`.

---

## Decision 11A-10: One Unblok Design System Reuse Rule

* **Status**: PROPOSED — HUMAN REVIEW
* **Decision**: The public web experience is an extension of the existing Unblok design system, not a second disconnected design language. It reuses existing typography stacks, spacing tokens, radii, button primitives, status semantics, and icon guidelines.
* **Context**: Brand dissonance between public marketing and real product builds distrust among technical users.
* **Alternatives Considered**:
  - *Separate Marketing CSS Framework*: Creates massive code duplication, inconsistent button styles, and split maintenance.
* **Consequences**:
  - Shared CSS tokens govern both public extensions and product shells.

---

## Decision 11A-11: 100% Real Product Screenshot Mandate

* **Status**: PROPOSED — HUMAN REVIEW
* **Decision**: All production marketing screenshots must be **100% real browser-rendered captures of the genuine Unblok product**. AI-generated UI renders and device mockups (floating 3D laptops/smartphones) are strictly forbidden in production.
* **Context**: Engineering buyers demand authentic technical proof. Marketing mockups that look different from the shipped software immediately destroy credibility.
* **Alternatives Considered**:
  - *Figma/Vector Conceptual Mockups*: Disconnected from real DOM rendering.
  - *AI Generative UI*: Inaccurate, hallucinated features that do not exist in the product.
* **Consequences**:
  - Screenshots are captured via real browser runs from real product states.

---

## Decision 11A-12: Deterministic Marketing Dataset Requirement

* **Status**: PROPOSED — HUMAN REVIEW
* **Decision**: A deterministic canonical marketing/demo scenario must be created or selected from genuine Unblok demo data before screenshot capture. If a thematic scenario (e.g. Checkout Release) is selected, its entities and blocker linkages must physically exist in the running prototype seed prior to capture.
* **Context**: Fragmented screenshots showing random, contradictory demo data break narrative continuity and make product comprehension harder.
* **Alternatives Considered**:
  - *Ad-hoc Disjointed Screenshots*: Inconsistent and confusing across different sections.
* **Consequences**:
  - Screenshot capture is tied to explicit, verifiable prototype seed data.

---

## Decision 11A-13: Homepage IA & Minimal Copy Formula

* **Status**: PROPOSED — HUMAN REVIEW
* **Decision**: The homepage information architecture follows a strict 9-stage progression:  
  `Nav → Hero → Execution → Dependencies → Issue Context → Planning → Insights → CTA → Footer`.  
  Copy adheres to the four-part formula: `[Eyebrow] + [Headline] + [1 Short Sentence] + [Optional Action]` and strictly follows the principle *Minimal. Informative. Creative.* Technical implementation jargon is kept out of homepage copy.
* **Context**: Technical users do not read long marketing essays. The product visual carries the explanation; copy provides punchy conceptual anchors.
* **Alternatives Considered**:
  - *Lengthy Multi-Paragraph Feature Lists*: Ignored by target audience.
* **Consequences**:
  - High-impact, scannable, high-craft homepage experience.

---

## Decision 11A-14: Public Navigation & Page Registry Boundaries

* **Status**: PROPOSED — HUMAN REVIEW
* **Decision**: The public route registry includes: `/`, `/product`, `/features`, `/solutions`, `/pricing`, `/security`, `/contact`, `/privacy`, `/terms`. Desktop navigation exposes: `Product`, `Features`, `Solutions`, `Pricing`, `Security`, with `Sign in` and `Get started` CTAs.
* **Context**: Clean, standardized navigation structure for immediate technical discoverability.
* **Alternatives Considered**:
  - *Overloaded Mega-Menus*: Overcomplicates navigation for a focused engineering tool.
* **Consequences**:
  - Minimalist navigation with full mobile drawer responsiveness.

---

## Decision 11A-15: Auth Surface Task-Focused Architecture

* **Status**: PROPOSED — HUMAN REVIEW
* **Decision**: Auth routes (`/login`, `/signup`, `/forgot-password`, `/reset-password`, `/invite/:token`) are task-focused utility surfaces, rendered in a compact, distraction-free `AuthLayout`. They do not include marketing banners, testimonials, or feature promotions.
* **Context**: Engineers want to authenticate and get back to work immediately. Marketing distraction on auth screens degrades task completion.
* **Alternatives Considered**:
  - *Split-Screen Marketing Auth Layout*: Standard B2B SaaS trope; creates unnecessary cognitive noise.
* **Consequences**:
  - Fast, focused, accessible authentication experience.

---

## Decision 11A-16: Minimal Onboarding Route Namespace

* **Status**: PROPOSED — HUMAN REVIEW
* **Decision**: Onboarding routes are strictly encapsulated under `/onboarding/*` with a clean 5-step contract:  
  `/onboarding` (resolver), `/onboarding/workspace`, `/onboarding/team`, `/onboarding/project`, `/onboarding/invite`, `/onboarding/complete`.
* **Context**: Decouples new user setup from everyday workspace routing, ensuring clear state restoration if onboarding is interrupted.
* **Alternatives Considered**:
  - *In-App Modals over `/my-work`*: Clutters the application shell with uninitialized empty-state edge cases.
* **Consequences**:
  - Clean separation of tenant initialization logic.

---

## Decision 11A-17: Four-Tier Responsive Breakpoint Contract

* **Status**: PROPOSED — HUMAN REVIEW
* **Decision**: The public responsive layout explicitly defines behaviors for four breakpoints: `1440px+` (Large Desktop), `1024px` (Laptop), `768px` (Tablet), and `390px` (Mobile). Mobile views use intentional visual crops of primary components rather than shrunken unreadable desktop screenshots.
* **Context**: Responsive scaling that simply shrinks high-density screenshots makes text completely illegible on mobile devices.
* **Alternatives Considered**:
  - *Hiding Screenshots on Mobile*: Robs mobile evaluators of product proof.
* **Consequences**:
  - Mobile receives tailored crops focusing on active blocker cards.

---

## Decision 11A-18: Restrained Motion Principles

* **Status**: PROPOSED — HUMAN REVIEW
* **Decision**: Public page motion is strictly limited to purposeful entry transitions (`240ms` subtle translation/fade) and progressive dependency chain draws. Constant floating animations, 3D mouse parallax, and scroll-hijacking are banned. Full support for `prefers-reduced-motion` is mandatory.
* **Context**: Excessive animation causes disorientation, reduces technical trust, and triggers vestibular disorders.
* **Alternatives Considered**:
  - *Heavy Interactive Canvas Animation*: Adds megabytes to page load and slows initial render.
* **Consequences**:
  - Fast, accessible, high-performance visual experience.

---

## Decision 11A-19: Public SEO & Crawl Boundary Isolation

* **Status**: PROPOSED — HUMAN REVIEW
* **Decision**: Only the `PUBLIC` route family is indexed by search engines (`index, follow`). `AUTH`, `ONBOARDING`, and `PRIVATE` route families strictly emit `noindex, nofollow` headers and robots meta tags.
* **Context**: Prevents internal entity IDs, tenant details, and auth flows from polluting public search indexes.
* **Alternatives Considered**:
  - *Blanket Site Indexing*: Dangerous privacy leak for multi-tenant customer workspaces.
* **Consequences**:
  - Strict crawl boundary enforcement.

---

## Decision 11A-20: Pricing Presentation Ownership & Commercial Deferral

* **Status**: PROPOSED — HUMAN REVIEW
* **Decision**: The route `/pricing` is reserved as a public commercial presentation surface owned by `PublicLayout`. Specific pricing models, tier names, seat limits, and price points remain **commercially unsettled and deferred**. The future prototype may present provisional pricing only following an explicit commercial decision.
* **Context**: Packaging and pricing strategy is a business decision that must not be prematurely frozen during routing and UX architecture.
* **Alternatives Considered**:
  - *Freezing Developer / Team / Enterprise Tiers in UX-11A*: Premature and unauthorized.
* **Consequences**:
  - Routing and layout ownership are defined without locking commercial terms.

---

## Deferred Decisions Register

The following architectural and commercial decisions are **deliberately deferred** to subsequent implementation phases and must not be pre-empted in UX-11A:

| # | Deferred Decision Area | Target Phase | Rationale for Deferral |
| :--- | :--- | :--- | :--- |
| **DEF-01** | Production Backend Authentication Implementation | Future Backend Phase | Server session lifetimes, password hashing, and token issuance require production server infrastructure. |
| **DEF-02** | OAuth Providers & Enterprise SSO (SAML/Okta) | Future Auth Phase | Identity provider configurations depend on enterprise infrastructure architecture. |
| **DEF-03** | Production Database & ORM Selection | Future Backend Phase | Client router architecture remains completely decoupled from database schema. |
| **DEF-04** | Commercial Pricing Model, Tiers & Billing Engine | Commercial Packaging Phase | Tier structures, seat limits, and Stripe integration deferred until commercial packaging decisions are made. |
| **DEF-05** | Transactional Email Delivery Infrastructure | Future Backend Phase | Verification emails, password reset tokens, and invite deliveries require server infrastructure. |
| **DEF-06** | Custom Domain Multi-Tenant Subdomain Routing | Future Infrastructure Phase | Path-based routing works identically with future subdomain routing (`acme.unblok.io`). |
| **DEF-07** | Workspace Onboarding Wizard Implementation | UX-13 | The route contract is established in UX-11A; the interactive multi-step component wizard belongs to UX-13. |
| **DEF-08** | Real Contact Form Submission Backend | Public Launch Phase | Contact form presentation and client validation will be built in UX-11B; server delivery deferred. |
| **DEF-09** | Server-Side Sync & Automatic Mutation Replay | Future Systems Phase | Protocol mechanics for offline replay and server sync are future production concerns. |
| **DEF-10** | Production Encryption & Compliance Certifications | Future Security Phase | Infrastructure-level encryption and formal compliance audits are future production milestones. |
