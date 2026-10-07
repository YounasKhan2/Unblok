# UX-11A: Unblok Decision Register

**Platform**: Unblok — High-Density Engineering Execution & Dependency Intelligence  
**Document**: Architectural Decision Register (ADR) — UX-11A  
**Phase**: UX-11A (Public Experience & Routing Architecture)  
**Status**: APPROVED — FROZEN ARCHITECTURAL SPECIFICATION  

---

## Decision 11A-01: Four Architectural Route Families

* **Status**: FROZEN
* **Decision**: Unblok formally partitions its entire URL landscape into four strictly defined architectural route families: `PUBLIC`, `AUTH`, `ONBOARDING`, and `PRIVATE`.
* **Context**: Treating routes as a uniform flat structure creates leaky abstractions where marketing pages inherit app shell padding, auth screens pull in private sidebar state, and unauthenticated visitors trigger app shell state machine errors.
* **Alternatives Considered**:
  - *Unified Single-Layout Tree*: Manage boundaries via conditionals (`if (!isAuth) return <MarketingNav />`). Rejected: introduces tight coupling, hydration mismatches, and massive bundle size leakage.
  - *Two Families (Public vs Private)*: Lumping auth and onboarding together with marketing. Rejected: auth and onboarding have fundamentally distinct security models, form validation states, and layout requirements.
* **Consequences**:
  - Each route family binds to a dedicated layout component (`PublicLayout`, `AuthLayout`, `OnboardingLayout`, `AppShellLayout`).
  - Guards inspect route family boundaries prior to rendering children.

---

## Decision 11A-02: Deterministic Root (`/`) Resolution Matrix

* **Status**: FROZEN
* **Decision**: The root route `/` acts as an intelligent traffic router:
  1. Anonymous visitors always render the public Homepage (`/`).
  2. Authenticated users with an active workspace automatically redirect to `/my-work` (using `replace: true`).
  3. Authenticated users with memberships but no active workspace resolve to workspace selection.
  4. Authenticated users with zero workspaces redirect to `/onboarding`.
* **Context**: Returning engineers require immediate zero-latency access to their work (`/my-work`). Prospective customers and anonymous visitors require the marketing homepage.
* **Alternatives Considered**:
  - *Static Marketing Root for Everyone*: Forcing logged-in engineers to click "Go to App" on every visit. Rejected: causes daily friction for active developers.
  - *Subdomain Split (`app.unblok.io` vs `unblok.io`)*: Deferred to deployment architecture, but client-side root resolution handles both single-domain and multi-domain paradigms without code changes.
* **Consequences**:
  - Redirect loops are structurally impossible because `/my-work` and `/onboarding` never redirect back to `/`.

---

## Decision 11A-03: Decoupled Multi-Layout Hierarchy

* **Status**: FROZEN
* **Decision**: The root router branches into four top-level layouts: `PublicLayout`, `AuthLayout`, `OnboardingLayout`, and `AppShellLayout`. No layout contains ad-hoc conditionals for another layout's features.
* **Context**: `AppShellLayout` contains rich keyboard shortcuts (`Cmd+K`, `C`, `?`), a 440px slide-over drawer, and sidebar rail navigation that must never load or mount on marketing or auth pages.
* **Alternatives Considered**:
  - *Single AppShell with `hideSidebar` flags*: Fragile, bug-prone, and violates separation of concerns.
* **Consequences**:
  - Clean bundle splitting and code insulation across public and private subsystems.

---

## Decision 11A-04: Route Guard Boundaries & Responsibilities

* **Status**: FROZEN
* **Decision**: Guards are defined strictly by operational responsibility:
  - `PublicRoute`: Unconditional passthrough.
  - `GuestRoute`: Blocks authenticated users; redirects them to `returnTo` or `/my-work`.
  - `AuthenticatedRoute`: Intercepts unauthenticated requests and redirects to `/login` with sanitized `returnTo`.
  - `OnboardingRoute`: Enforces wizard progression for users without active workspaces.
  - `WorkspaceRoute`: Validates tenant resolution before mounting `AppShellLayout`.
  - `PermissionBoundary`: In-shell RBAC protection rendering 403 Forbidden states.
* **Context**: Avoids creating duplicate or redundant wrapper components while maintaining bulletproof authorization boundaries.
* **Alternatives Considered**:
  - *Giant Universal Route Guard*: Embedding all checks in a single massive middleware function. Rejected: hard to test and reason about.
* **Consequences**:
  - Guards are composable and independently unit-testable.

---

## Decision 11A-05: Strict Safe Return Destination (`returnTo`) Contract

* **Status**: FROZEN
* **Decision**: All unauthenticated deep-link attempts preserve their intended path in a sanitized `returnTo` query parameter. Only internal relative paths starting with a single `/` (and excluding protocol-relative `//` or external schemes) are accepted.
* **Context**: Engineers share deep links in GitHub PRs and Slack. Unauthenticated visitors must land directly on the shared issue or filter once logged in, without exposing Unblok to Open Redirect phishing attacks.
* **Alternatives Considered**:
  - *Session Storage for Redirects*: Fails if a user opens links in multiple browser tabs simultaneously.
  - *Permissive Redirects*: Dangerous security vulnerability.
* **Consequences**:
  - The `getSafeReturnTo` validator strictly filters all redirect attempts.

---

## Decision 11A-06: Distinct Public vs. Authenticated 404 Presentations

* **Status**: FROZEN
* **Decision**: Missing routes must **never** silently redirect to `/my-work`. Unblok provides two explicit 404 experiences:
  - *Public 404*: Rendered in `PublicLayout` with clear navigation back to the homepage and product pages.
  - *Authenticated 404*: Rendered in `AppShellLayout` preserving the sidebar and workspace context, offering a direct action to `/my-work` and `Cmd+K` search.
* **Context**: Silent redirects mask broken links, make debugging routing bugs impossible, and disorient users when an issue has been deleted or moved.
* **Alternatives Considered**:
  - *Global Catch-All to `/my-work`*: Previously in placeholder code; explicitly replaced by this specification.
* **Consequences**:
  - 404 states are professional, transparent, and context-aware.

---

## Decision 11A-07: Reusable 403 Forbidden State Component

* **Status**: FROZEN
* **Decision**: When an authenticated user attempts to access a resource or setting outside their RBAC privileges (e.g. `OBSERVER` accessing `/settings/members`), the system renders a standardized in-shell `ForbiddenState` component detailing the required role and offering clear fallback actions.
* **Context**: Avoids silent blank screens or unexpected redirects to `/my-work` when permissions fail.
* **Alternatives Considered**:
  - *Hiding Routes Entirely from Router*: Causes route-level 404s instead of 403s, which confuses users who know the page exists.
* **Consequences**:
  - Transparent error reporting for enterprise and team tier authorization boundaries.

---

## Decision 11A-08: Non-Destructive Session Expiration UX Contract

* **Status**: FROZEN
* **Decision**: Session expirations trigger an inline re-authentication modal/banner rather than an immediate hard redirect that destroys in-progress draft content.
* **Context**: Engineers writing comprehensive issue descriptions or commenting on complex blocker chains must not lose their work due to an idle session token timeout.
* **Alternatives Considered**:
  - *Immediate Hard Redirect to `/login`*: Destroys unsaved form state; severely frustrates engineers.
* **Consequences**:
  - Drafts are preserved locally, and in-flight mutations retry cleanly upon token renewal.

---

## Decision 11A-09: Single Fixed Public Visual Theme

* **Status**: FROZEN
* **Decision**: Public marketing and legal pages operate under **one single fixed visual theme** (warm alabaster canvas, deep slate typography, purple accent). No `Light / Dark / System` theme switcher is exposed on public pages.
* **Context**: Marketing storytelling and product screenshot presentation require deterministic contrast and calibrated visual hierarchy. Allowing arbitrary theme toggles on public pages dilutes brand presentation and complicates screenshot composition.
* **Alternatives Considered**:
  - *Enabling Dark Mode on Marketing Pages*: Doubled maintenance overhead for marketing assets; compromises crisp presentation of real product UI captures.
* **Consequences**:
  - Theme toggling is strictly isolated to the authenticated `AppShellLayout` via `SettingsContext`.

---

## Decision 11A-10: One Unblok Design System Reuse Rule

* **Status**: FROZEN
* **Decision**: The public web experience is an extension of the existing Unblok design system, not a second disconnected design language. It reuses existing typography stacks, spacing tokens, radii, button primitives, status semantics, and icon guidelines.
* **Context**: Brand dissonance between public marketing and real product builds distrust among technical users.
* **Alternatives Considered**:
  - *Separate Marketing CSS Library (e.g. Tailwind for marketing, Vanilla CSS for app)*: Creates massive code duplication, inconsistent button styles, and split maintenance.
* **Consequences**:
  - Shared CSS tokens govern both public extensions and product shells.

---

## Decision 11A-11: 100% Real Product Screenshot Mandate

* **Status**: FROZEN
* **Decision**: All production marketing screenshots must be **100% real browser-rendered captures of the genuine Unblok product**. AI-generated UI renders and device mockups (floating 3D laptops/smartphones) are strictly forbidden in production.
* **Context**: Engineering buyers demand authentic technical proof. Marketing mockups that look different from the shipped software immediately destroy credibility.
* **Alternatives Considered**:
  - *Figma/Vector Conceptual Mockups*: Disconnected from real DOM rendering and font smoothing.
  - *AI Generative UI*: Inaccurate, hallucinated features that do not exist in the product.
* **Consequences**:
  - Screenshots are captured via automated browser runs from real product states.

---

## Decision 11A-12: Canonical Narrative Dataset ("Checkout Release")

* **Status**: FROZEN
* **Decision**: All marketing screenshots and product walkthroughs adhere to a single canonical narrative dataset: the **Checkout Release** featuring dependency chain `AUTH-81 → ENG-142 → WEB-37`.
* **Context**: Fragmented screenshots showing random, unrelated demo data break narrative continuity and make product comprehension harder.
* **Alternatives Considered**:
  - *Random Ad-hoc Demo Data*: Inconsistent and confusing across different sections.
* **Consequences**:
  - A dedicated demo seed provides repeatable, coherent data across all marketing views.

---

## Decision 11A-13: Homepage IA & Minimal Copy Formula

* **Status**: FROZEN
* **Decision**: The homepage information architecture follows a strict 9-stage progression:  
  `Nav → Hero → Execution → Dependencies → Issue Context → Planning → Insights → CTA → Footer`.  
  Copy adheres to the four-part formula: `[Eyebrow] + [Headline] + [1 Short Sentence] + [Optional Action]`.
* **Context**: Technical users do not read long marketing essays. The product visual carries the explanation; copy provides punchy conceptual anchors.
* **Alternatives Considered**:
  - *Lengthy Multi-Paragraph Feature Lists*: Ignored by target audience.
* **Consequences**:
  - High-impact, scannable, high-craft homepage experience.

---

## Decision 11A-14: Public Navigation & Page Registry Boundaries

* **Status**: FROZEN
* **Decision**: The public route registry includes: `/`, `/product`, `/features`, `/solutions`, `/pricing`, `/security`, `/contact`, `/privacy`, `/terms`. Desktop navigation exposes: `Product`, `Features`, `Solutions`, `Pricing`, `Security`, with `Sign in` and `Get started` CTAs.
* **Context**: Clean, standardized navigation structure for immediate technical discoverability.
* **Alternatives Considered**:
  - *Overloaded Mega-Menus*: Overcomplicates navigation for a focused engineering tool.
* **Consequences**:
  - Minimalist navigation with full mobile drawer responsiveness.

---

## Decision 11A-15: Auth Surface Task-Focused Architecture

* **Status**: FROZEN
* **Decision**: Auth routes (`/login`, `/signup`, `/forgot-password`, `/reset-password`, `/invite/:token`) are task-focused utility surfaces, rendered in a compact, distraction-free `AuthLayout`. They do not include marketing banners, testimonials, or feature promotions.
* **Context**: Engineers want to authenticate and get back to work immediately. Marketing distraction on auth screens degrades task completion.
* **Alternatives Considered**:
  - *Split-Screen Marketing Auth Layout*: Standard B2B SaaS trope; creates unnecessary cognitive noise.
* **Consequences**:
  - Fast, focused, accessible authentication experience.

---

## Decision 11A-16: Minimal Onboarding Route Namespace

* **Status**: FROZEN
* **Decision**: Onboarding routes are strictly quarantined under `/onboarding/*` with a clean 5-step contract:  
  `/onboarding` (resolver), `/onboarding/workspace`, `/onboarding/team`, `/onboarding/project`, `/onboarding/invite`, `/onboarding/complete`.
* **Context**: Decouples new user setup from everyday workspace routing, ensuring clear state restoration if onboarding is interrupted.
* **Alternatives Considered**:
  - *In-App Modals over `/my-work`*: Clutters the application shell with uninitialized empty-state edge cases.
* **Consequences**:
  - Clean separation of tenant initialization logic.

---

## Decision 11A-17: Four-Tier Responsive Breakpoint Contract

* **Status**: FROZEN
* **Decision**: The public responsive layout explicitly defines behaviors for four breakpoints: `1440px+` (Large Desktop), `1024px` (Laptop), `768px` (Tablet), and `390px` (Mobile). Mobile views use intentional visual crops of primary components rather than shrunken unreadable desktop screenshots.
* **Context**: Responsive scaling that simply shrinks high-density screenshots makes text completely illegible on mobile devices.
* **Alternatives Considered**:
  - *Hiding Screenshots on Mobile*: Robs mobile evaluators of product proof.
* **Consequences**:
  - Mobile receives tailored crops focusing on active blocker cards.

---

## Decision 11A-18: Restrained Motion Principles

* **Status**: FROZEN
* **Decision**: Public page motion is strictly limited to purposeful entry transitions (`240ms` subtle translation/fade) and progressive dependency chain draws. Constant floating animations, 3D mouse parallax, and scroll-hijacking are banned. Full support for `prefers-reduced-motion` is mandatory.
* **Context**: Excessive animation causes disorientation, reduces technical trust, and triggers vestibular disorders.
* **Alternatives Considered**:
  - *Heavy Interactive WebGL/Canvas Animation*: Adds megabytes to page load and slows initial render.
* **Consequences**:
  - Fast, accessible, high-performance visual experience.

---

## Decision 11A-19: Public SEO & Crawl Boundary Isolation

* **Status**: FROZEN
* **Decision**: Only the `PUBLIC` route family is indexed by search engines (`index, follow`). `AUTH`, `ONBOARDING`, and `PRIVATE` route families strictly emit `noindex, nofollow` headers and robots meta tags.
* **Context**: Prevents internal entity IDs, tenant details, and auth flows from polluting public search indexes.
* **Alternatives Considered**:
  - *Blanket Site Indexing*: Dangerous privacy leak for multi-tenant customer workspaces.
* **Consequences**:
  - Strict crawl boundary enforcement.

---

## Deferred Decisions Register

The following architectural decisions are **deliberately deferred** to subsequent implementation phases and must not be pre-empted in UX-11A:

| # | Deferred Decision Area | Target Phase | Rationale for Deferral |
| :--- | :--- | :--- | :--- |
| **DEF-01** | Production Backend Authentication Implementation | Future Backend Phase | Real password hashing, JWT/session issuance, and rate limiting require production server infrastructure. |
| **DEF-02** | OAuth Providers & Enterprise SSO (SAML/Okta) | Future Auth Phase | Protocol configurations depend on enterprise infrastructure architecture. |
| **DEF-03** | Production Database & ORM Selection | Future Backend Phase | Client router architecture remains completely decoupled from database schema. |
| **DEF-04** | Billing & Stripe Subscription Checkout Engine | Commercial Launch Phase | Plan presentation is frozen; checkout transaction flow deferred until merchant account setup. |
| **DEF-05** | Transactional Email Delivery (SES/Postmark) | Future Backend Phase | Verification emails, password reset tokens, and invite deliveries require SMTP infrastructure. |
| **DEF-06** | Custom Domain Multi-Tenant Subdomain Routing | Future Infrastructure Phase | Path-based routing works identically with future subdomain routing (`acme.unblok.io`). |
| **DEF-07** | Workspace Onboarding Wizard Implementation | UX-13 | The route contract is frozen in UX-11A; the interactive multi-step component wizard belongs to UX-13. |
| **DEF-08** | Real Contact Form Submission Backend | Public Launch Phase | Contact form presentation and client validation will be built in UX-11B; webhook/CRM delivery deferred. |
