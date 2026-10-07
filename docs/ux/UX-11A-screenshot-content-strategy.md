# UX-11A: Unblok Screenshot & Content Strategy

**Platform**: Unblok — High-Density Engineering Execution & Dependency Intelligence  
**Document**: Product Proof Rule, Canonical Narrative Dataset, Screenshot Inventory & Content Specification  
**Phase**: UX-11A (Public Experience & Routing Architecture)  
**Status**: PROPOSED — HUMAN REVIEW  

---

## 1. The Immutable Product Proof Rule

Unblok's brand and customer credibility rest on absolute technical honesty. Marketing and public pages must never mislead engineers with conceptual mockups or AI fantasies.

### The Rule
> **The shipped production public website must use 100% real, browser-rendered screenshots captured directly from the running Unblok product.**

* **Strict Prohibition of AI-Generated UI**: AI-generated fake product screenshots are strictly forbidden as production website assets. (AI concepts may only be used during preliminary exploratory sketches).
* **Strict Prohibition of Faux Device Renders**: No generic 3D floating iPhones, angled MacBook bezels with exaggerated glossy reflections, or cartoon mockups.
* **Format**: Pure, crisp browser captures framed in clean, minimal desktop bezels.

---

## 2. Canonical Marketing/Demo Dataset Requirement

### The Principle
Screenshots must not present disjointed, contradictory demo data across different sections. Instead, all captures throughout the public experience should tell **one unified, coherent engineering story**.

### Dataset Requirement
> **A deterministic canonical marketing/demo scenario must be created or selected from genuine Unblok demo data before screenshot capture.**

* If a specific thematic narrative (such as a *Checkout Release* or *Auth Platform Hardening*) is selected for marketing assets, its entities and dependency linkages must actually exist in the running application before screenshots are captured.
* The current Unblok prototype already contains genuine engineering demo data (e.g. `INF-1` PgBouncer pool blocking `ENG-1` token revocation API, which in turn blocks `WEB-1` session banner).
* When marketing captures are generated, they must be produced by loading the application with the designated demo seed, navigating via real browser routes, and capturing the resulting rendered DOM.
* **No fake or manually painted screenshot content is permitted.**

---

## 3. Product Screenshot Inventory & Screen Mapping

Every marketing section is paired with a specific, existing product screen from the application:

| Section | Concept Demonstrated | Source Product Route | Target Component / Focal Point | Visual Treatment |
| :--- | :--- | :--- | :--- | :--- |
| **Hero** | Comprehensive Execution Cockpit | `/my-work` | Full My Work view showing Personal Blockers, Assigned Tasks, and Blocking Others summary | Oversized browser frame (1280px wide), crisp light canvas |
| **Execution** | Personal Blocker Awareness | `/my-work` | Personal Blockers card (`BlockingOthersCard`, `PersonalBlockerSummaryBanner`) | Focused 60/40 crop with card highlight callouts |
| **Dependencies** | Dependency Graph & Causality | `/dependencies` | Dependencies Canvas showing upstream and downstream blocker relations | Full-width container showing nodes and directional blocker lines |
| **Issue Context** | Deep Context & Speed | `/projects/ENG/issues?drawer=ENG-1` | Issues table in background with 440px slide-over `IssueDrawer` open | Side-by-side view illustrating dual-surface architecture |
| **Planning** | Causal Planning & Milestones | `/cycles` or `/milestones` | Active Cycle status and strategic Milestone tracking | Asymmetric layout showing cycle issues and milestone alignment |
| **Insights** | Delivery Health & Bottlenecks | `/insights` | Insights Command Center: Delivery Health score, Active Blockers tally, Bottleneck Leaderboard | Multi-card dashboard layout strictly matching shipped insight widgets |

*If a desired marketing visual does not currently exist in the prototype (such as burndown curves or automated timeline forecasts), it must not be manufactured for marketing. Either another genuine product state is used, or the visual is explicitly deferred until the underlying capability is implemented.*

---

## 4. Homepage Information Architecture & Narrative Flow

The homepage follows a logical, tight narrative arc that addresses an engineering leader or builder's fundamental questions in order:

```text
┌────────────────────────────────────────────────────────────────────────┐
│ 1. GLOBAL NAVIGATION                                                   │
│    Brand Mark | Product | Solutions | Pricing | Security | Sign in | CTAs
├────────────────────────────────────────────────────────────────────────┤
│ 2. HERO SECTION                                                        │
│    "Engineering execution, unblocked."                                 │
│    Oversized Real UI: My Work Cockpit                                  │
├────────────────────────────────────────────────────────────────────────┤
│ 3. SECTION 1: EXECUTION                                                │
│    "Your day, organized by impact."                                    │
│    Visual: My Work Personal Blocker Triage                             │
├────────────────────────────────────────────────────────────────────────┤
│ 4. SECTION 2: DEPENDENCIES                                             │
│    "See the chain."                                                    │
│    Visual: Dependency Graph with Blocker Relations                     │
├────────────────────────────────────────────────────────────────────────┤
│ 5. SECTION 3: ISSUE CONTEXT                                            │
│    "Deep context without losing your place."                           │
│    Visual: Project List + 440px Slide-Over IssueDrawer                 │
├────────────────────────────────────────────────────────────────────────┤
│ 6. SECTION 4: PLANNING                                                 │
│    "Schedules that understand cause and effect."                       │
│    Visual: Cycle Cadence & Strategic Milestones                        │
├────────────────────────────────────────────────────────────────────────┤
│ 7. SECTION 5: INSIGHTS                                                 │
│    "Find bottlenecks before they escalate."                            │
│    Visual: Delivery Health & Bottleneck Radar                          │
├────────────────────────────────────────────────────────────────────────┤
│ 8. FINAL CONVERSION CTA                                                │
│    "Start unblocking your team today."                                 │
│    Action: [Get started] [Talk to engineering]                         │
├────────────────────────────────────────────────────────────────────────┤
│ 9. GLOBAL FOOTER                                                       │
│    Product, Solutions, Company, Security, Legal, System Status         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Homepage Copy Formula & Section Specifications

### The Strict Copy Formula
To eliminate fluff and preserve maximum high-craft impact, every marketing section adheres to the core principle:

> **Minimal. Informative. Creative.**

Implementation jargon (e.g. "directed acyclic graphs", "JWT bloom filters", "runtime decorators") belongs in technical product documentation, not homepage storytelling.

```text
[EYEBROW]           → 1 to 2 words, uppercase, muted/accent font
[HEADLINE]          → 4 to 8 words, bold, active verb, definitive claim
[SUPPORTING COPY]   → Exactly 1 concise sentence (maximum 20 words)
[OPTIONAL ACTION]   → 1 contextual text link or button (optional)
```

### Complete Homepage Section Copy Spec

#### Hero Section
* **Eyebrow**: `ENGINEERING EXECUTION`
* **Headline**:  
  `Engineering execution, unblocked.`
* **Supporting Copy**:  
  `Know what’s moving, what’s stuck, and why.`
* **Actions**:  
  - Primary: `Get started` (`/signup`)
  - Secondary: `Explore Unblok` (`/product`)
* **Visual Asset**: Oversized browser frame featuring canonical `/my-work` cockpit.

#### Section 1: Execution (My Work)
* **Eyebrow**: `PERSONAL TRIAGE`
* **Headline**:  
  `Your day, organized by impact.`
* **Supporting Copy**:  
  `Clear what is blocking you, and unblock the teammates waiting on your work.`
* **Optional Action**: `Learn about My Work →` (`/features#my-work`)
* **Visual Asset**: Focused crop of `BlockingOthersCard` and `PersonalBlockerSummaryBanner`.

#### Section 2: Dependencies (The Dependency Graph)
* **Eyebrow**: `DEPENDENCIES`
* **Headline**:  
  `See the chain.`
* **Supporting Copy**:  
  `Know what’s blocked—and what gets affected next.`
* **Optional Action**: `Explore dependency graphs →` (`/features#dependencies`)
* **Visual Asset**: Full-width capture of `/dependencies` canvas tracing upstream and downstream blocker links.

#### Section 3: Issue Context (Drawer + Detail)
* **Eyebrow**: `SPEED & DENSITY`
* **Headline**:  
  `Deep context without losing your place.`
* **Supporting Copy**:  
  `Triage issues with lightning-fast slide-over drawers, or open dedicated full-page URLs.`
* **Optional Action**: `See issue management →` (`/features#issues`)
* **Visual Asset**: Split capture of `/projects/ENG/issues` with active 440px `IssueDrawer`.

#### Section 4: Planning (Cycles & Milestones)
* **Eyebrow**: `PLANNING`
* **Headline**:  
  `Schedules that understand cause and effect.`
* **Supporting Copy**:  
  `Keep cycles and milestones aligned with prerequisite work.`
* **Optional Action**: `Learn about planning systems →` (`/features#planning`)
* **Visual Asset**: View of active cycle progress and milestone tracking.

#### Section 5: Insights (Execution Intelligence)
* **Eyebrow**: `DELIVERY HEALTH`
* **Headline**:  
  `Find bottlenecks before they escalate.`
* **Supporting Copy**:  
  `Track delivery health and active blockers across teams.`
* **Optional Action**: `Explore insights →` (`/features#insights`)
* **Visual Asset**: Snapshot of the `/insights` command center (health score, active blockers, bottleneck leaderboard).

#### Section 6: Final Conversion CTA
* **Eyebrow**: `READY TO SHIP?`
* **Headline**:  
  `Start unblocking your team today.`
* **Supporting Copy**:  
  `Set up your workspace in minutes, or talk with our team.`
* **Actions**:  
  - Primary: `Get started` (`/signup`)
  - Secondary: `Contact us` (`/contact`)

---

## 6. Screenshot Asset Performance & Delivery Contract

To prevent high-resolution product captures from degrading page performance, the frontend asset pipeline adheres to strict constraints:

1. **Modern Dual-Format Generation**:
   - Every screenshot is converted to optimized **WebP** and **AVIF** formats.
   - Fallback PNGs are retained for compatibility.
2. **Explicit Aspect Ratios & Dimensions**:
   - All image elements define explicit `width` and `height` HTML attributes alongside CSS `aspect-ratio` to guarantee zero Cumulative Layout Shift (CLS = 0).
3. **Responsive Resolution Sets (`srcset`)**:
   - Provide `@1x` and `@2x` resolution variants to ensure retina screens render pixel-crisp text and borders.
4. **Lazy Loading Contract**:
   - Hero screenshot is loaded eagerly (`loading="eager"`, `fetchpriority="high"`).
   - All subsequent screenshots below the fold load lazily (`loading="lazy"`, `decoding="async"`).
