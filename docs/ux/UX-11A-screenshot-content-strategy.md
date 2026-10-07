# UX-11A: Unblok Screenshot & Content Strategy

**Platform**: Unblok — High-Density Engineering Execution & Dependency Intelligence  
**Document**: Product Proof Rule, Canonical Narrative Dataset, Screenshot Inventory & Content Specification  
**Phase**: UX-11A (Public Experience & Routing Architecture)  
**Status**: FROZEN ARCHITECTURAL SPECIFICATION  

---

## 1. The Immutable Product Proof Rule

Unblok's brand and customer credibility rest on absolute technical honesty. Marketing and public pages must never mislead engineers with conceptual mockups or AI fantasies.

### The Rule
> **The shipped production public website must use 100% real, browser-rendered screenshots captured directly from the running Unblok product.**

* **Strict Prohibition of AI-Generated UI**: AI-generated fake product screenshots are strictly forbidden as production website assets. (AI concepts may only be used during preliminary exploratory sketches).
* **Strict Prohibition of Faux Device Renders**: No generic 3D floating iPhones, angled MacBook bezels with exaggerated glossy reflections, or cartoon mockups.
* **Format**: Pure, crisp, high-DPI browser captures framed in clean, minimal desktop bezels.

---

## 2. Canonical Narrative Dataset: "Checkout Release"

Screenshots must not present disjointed, contradictory demo data across different sections. Instead, all captures throughout the public experience tell **one unified, coherent engineering story**: the **Checkout Release**.

```text
                                CANONICAL DEPENDENCY CHAIN
                                            │
                     ┌──────────────────────┴──────────────────────┐
                     ▼                                             ▼
             [AUTH-81] (Core Platform)                     [INF-52] (Infra)
          OAuth Token Refresh Pipeline                  Redis Cluster Scaling
          Status: IN_PROGRESS (ACTIVE BLOCKER)          Status: IN_REVIEW
                     │                                             │
                     └──────────────────────┬──────────────────────┘
                                            ▼
                                        [ENG-142] (Backend Pod)
                                    Checkout Engine V2 Idempotency
                                    Status: BLOCKED (Cannot Complete)
                                            │
                                            ▼
                                        [WEB-37] (Web Frontend)
                                   Payment Sheet Drop-in Component
                                   Status: BLOCKED (Downstream Impact)
```

### Story Invariants
* **The Conflict**: `ENG-142` (Checkout Engine V2 Idempotency) is assigned to a lead backend engineer. It cannot be completed because `AUTH-81` is still in progress.
* **The Downstream Ripple**: `WEB-37` (Payment Sheet Drop-in Component) is waiting on `ENG-142`.
* **The Intelligence**:
  - My Work shows the engineer exactly what is blocking them (`AUTH-81`) and who is blocked by them (`WEB-37`).
  - The Dependencies Graph highlights this path in vivid amber/red as part of the **Critical Path**.
  - The Cycle and Milestone views show the impact on the strategic target `Q4 Checkout V2 Release`.
  - Insights flags this chain under **Delivery Risk & Bottleneck Aging**.

---

## 3. Product Screenshot Inventory & Screen Mapping

Every marketing section is paired with a specific, intentionally staged product screen from the existing application:

| Section | Concept Demonstrated | Source Product Route | Target Component / Focal Point | Visual Treatment |
| :--- | :--- | :--- | :--- | :--- |
| **Hero** | Comprehensive Execution Cockpit | `/my-work` | Full My Work view showing Personal Blockers, Assigned Tasks, and Blocking Others summary | Oversized browser frame (1280px wide), crisp light canvas |
| **Execution** | Personal Blocker Awareness | `/my-work` | Personal Blockers card (`BlockingOthersCard`, `PersonalBlockerSummaryBanner`) | Focused 60/40 crop with card highlight callouts |
| **Dependencies** | DAG Graph & Critical Path | `/dependencies` | Dependencies Canvas in Critical Path filter mode (`AUTH-81 → ENG-142 → WEB-37`) | Full-width container showing nodes and directional blocker lines |
| **Issue Context** | Deep Context & Speed | `/projects/ENG/issues?drawer=ENG-142` | Issues table in background with 440px slide-over `IssueDrawer` open | Side-by-side view illustrating dual-surface architecture |
| **Planning** | Causal Planning & Roadmap | `/cycles` or `/roadmap` | Active Cycle sprint timeline with blocker warning indicators | Asymmetric grid showing cycle burndown and milestone alignment |
| **Insights** | Delivery Intelligence & Bottlenecks | `/insights` | Insights Command Center: Blocker Aging, Critical Path Risk, Bottleneck Leaderboard | Multi-metric command dashboard layout |

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
│    "Know what's blocking you. Unblock everyone else."                  │
│    Visual: My Work Personal Blocker Triage                             │
├────────────────────────────────────────────────────────────────────────┤
│ 4. SECTION 2: DEPENDENCIES                                             │
│    "See the chain. Never miss a critical path."                        │
│    Visual: Interactive-feel DAG Graph with Blocker Relations           │
├────────────────────────────────────────────────────────────────────────┤
│ 5. SECTION 3: ISSUE CONTEXT                                            │
│    "High density without context loss."                                │
│    Visual: Project List + 440px Slide-Over IssueDrawer                 │
├────────────────────────────────────────────────────────────────────────┤
│ 6. SECTION 4: PLANNING                                                 │
│    "Schedules that understand cause and effect."                       │
│    Visual: Cycle Cadence & Strategic Milestones                        │
├────────────────────────────────────────────────────────────────────────┤
│ 7. SECTION 5: INSIGHTS                                                 │
│    "Delivery health, measured at the blocker level."                   │
│    Visual: Insights Command Center & Bottleneck Radar                  │
├────────────────────────────────────────────────────────────────────────┤
│ 8. FINAL CONVERSION CTA                                                │
│    "Start unblocking your team today."                                 │
│    Action: [Create your workspace] [Talk to engineering]               │
├────────────────────────────────────────────────────────────────────────┤
│ 9. GLOBAL FOOTER                                                       │
│    Product, Solutions, Company, Security, Legal, System Status         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Homepage Copy Formula & Section Specifications

### The Strict Copy Formula
To eliminate fluff and preserve maximum high-craft impact, every marketing section adheres to a strict four-part anatomy:

```text
[EYEBROW]           → 1 to 2 words, uppercase, muted/accent font
[HEADLINE]          → 4 to 8 words, bold, active verb, definitive claim
[SUPPORTING COPY]   → Exactly 1 concise sentence (maximum 25 words)
[OPTIONAL ACTION]   → 1 contextual text link or button (optional)
```

### Complete Homepage Section Copy Spec

#### Hero Section
* **Eyebrow**: `ENGINEERING EXECUTION INTELLIGENCE`
* **Headline**:  
  `Engineering execution, unblocked.`
* **Supporting Copy**:  
  `Know what’s moving, what’s stuck, and why—before sprint reviews and delivery deadlines slip.`
* **Actions**:  
  - Primary: `Get started free` (`/signup`)
  - Secondary: `Explore Unblok` (`/product`)
* **Visual Asset**: Oversized browser frame featuring canonical `/my-work` cockpit.

#### Section 1: Execution (My Work)
* **Eyebrow**: `PERSONAL TRIAGE`
* **Headline**:  
  `Your day, organized by impact.`
* **Supporting Copy**:  
  `Clear what is blocking your code, and immediately unblock the engineers waiting on your work.`
* **Optional Action**: `Learn about My Work →` (`/features#my-work`)
* **Visual Asset**: Focused crop of `BlockingOthersCard` and `PersonalBlockerSummaryBanner`.

#### Section 2: Dependencies (The DAG Graph)
* **Eyebrow**: `DEPENDENCY INTELLIGENCE`
* **Headline**:  
  `See the chain.`
* **Supporting Copy**:  
  `Real-time directed acyclic graphs reveal your critical path, prevent circular deadlocks, and guard completion.`
* **Optional Action**: `Explore dependency graphs →` (`/features#dependencies`)
* **Visual Asset**: Full-bleed capture of `/dependencies` canvas tracing `AUTH-81 → ENG-142 → WEB-37`.

#### Section 3: Issue Context (Drawer + Detail)
* **Eyebrow**: `SPEED & DENSITY`
* **Headline**:  
  `Deep context without losing your place.`
* **Supporting Copy**:  
  `Triage dozens of issues with lightning-fast slide-over drawers, or open dedicated full-page canonical URLs.`
* **Optional Action**: `See issue management →` (`/features#issues`)
* **Visual Asset**: Split capture of `/projects/ENG/issues` with active 440px `IssueDrawer`.

#### Section 4: Planning (Cycles & Milestones)
* **Eyebrow**: `CAUSAL PLANNING`
* **Headline**:  
  `Commitment with dependency awareness.`
* **Supporting Copy**:  
  `Plan two-week cycles and multi-quarter milestones that automatically account for prerequisite blockers.`
* **Optional Action**: `Learn about planning systems →` (`/features#planning`)
* **Visual Asset**: Timeline view of cycles and milestone progress tracking.

#### Section 5: Insights (Execution Intelligence)
* **Eyebrow**: `DELIVERY HEALTH`
* **Headline**:  
  `Find bottlenecks before they become escalations.`
* **Supporting Copy**:  
  `Track blocker aging, team dependency load, and velocity with automated execution risk indicators.`
* **Optional Action**: `Explore insights & analytics →` (`/features#insights`)
* **Visual Asset**: Multi-card snapshot of the `/insights` command center.

#### Section 6: Final Conversion CTA
* **Eyebrow**: `READY TO SHIP?`
* **Headline**:  
  `Unblock your engineering organization.`
* **Supporting Copy**:  
  `Get started in minutes with zero setup friction, or schedule a technical architecture walkthrough.`
* **Actions**:  
  - Primary: `Start free trial` (`/signup`)
  - Secondary: `Contact architecture team` (`/contact`)

---

## 6. Screenshot Asset Performance & Delivery Contract

To prevent high-resolution product captures from degrading page performance, the frontend asset pipeline adheres to strict constraints:

1. **Modern Dual-Format Generation**:
   - Every screenshot is converted to optimized **WebP** and **AVIF** formats.
   - Fallback PNGs are retained for legacy compatibility.
2. **Explicit Aspect Ratios & Dimensions**:
   - All image elements define explicit `width` and `height` HTML attributes alongside CSS `aspect-ratio` to guarantee zero Cumulative Layout Shift (CLS = 0).
3. **Responsive Resolution Sets (`srcset`)**:
   - Provide `@1x` and `@2x` resolution variants to ensure retina screens render pixel-crisp code and badge text.
4. **Lazy Loading Contract**:
   - Hero screenshot is loaded eagerly (`loading="eager"`, `fetchpriority="high"`).
   - All subsequent screenshots below the fold load lazily (`loading="lazy"`, `decoding="async"`).
